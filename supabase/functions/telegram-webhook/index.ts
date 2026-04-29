import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// --- Config ---

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// --- Helpers ---

const getBudgetMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getDateString = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const sendTelegramMessage = async (chatId: number, text: string) => {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
};

// --- Linking Flow ---

const handleStartCommand = async (
  token: string,
  chatId: number,
  userId: number | null,
  chatType: string,
  label: string | null
) => {
  if (!token) {
    await sendTelegramMessage(
      chatId,
      'Token linking tidak ditemukan. Buka menu Profile > Telegram di AlkaFlow, generate token baru, lalu kirim /start TOKEN lagi.'
    );
    return;
  }

  const { data: linkToken, error: tokenError } = await supabaseAdmin
    .from('telegram_link_tokens')
    .select('id, user_id, expires_at, consumed_at')
    .eq('token', token)
    .is('consumed_at', null)
    .maybeSingle();

  if (tokenError || !linkToken) {
    await sendTelegramMessage(chatId, 'Token linking tidak valid atau sudah digunakan. Generate token baru dari aplikasi.');
    return;
  }

  if (new Date(linkToken.expires_at).getTime() < Date.now()) {
    await sendTelegramMessage(chatId, 'Token linking sudah kedaluwarsa. Generate token baru dari aplikasi.');
    return;
  }

  const { data: existingPrimary } = await supabaseAdmin
    .from('telegram_connections')
    .select('id')
    .eq('user_id', linkToken.user_id)
    .eq('is_primary', true)
    .maybeSingle();

  const connectionPayload = {
    user_id: linkToken.user_id,
    telegram_user_id: userId ? Number(userId) : null,
    telegram_chat_id: Number(chatId),
    chat_type: chatType || 'private',
    label: label || null,
    is_verified: true,
    is_primary: !existingPrimary,
    linked_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  const { error: connectionError } = await supabaseAdmin
    .from('telegram_connections')
    .upsert(connectionPayload, { onConflict: 'telegram_chat_id' });

  if (connectionError) {
    await sendTelegramMessage(chatId, `Gagal menghubungkan: ${connectionError.message}`);
    return;
  }

  await supabaseAdmin
    .from('telegram_link_tokens')
    .update({
      consumed_at: new Date().toISOString(),
      telegram_user_id: userId ? Number(userId) : null,
      telegram_chat_id: Number(chatId),
    })
    .eq('id', linkToken.id);

  await sendTelegramMessage(
    chatId,
    '\u2705 Telegram berhasil terhubung ke akun AlkaFlow Anda. Mulai sekarang Anda bisa kirim transaksi langsung lewat chat ini.'
  );
};

// --- Resolve User Context ---

interface UserContext {
  userId: string;
  connectionId: string;
  budgetMonth: string;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

const resolveUserContext = async (
  chatId: number,
  telegramUserId: number | null
): Promise<UserContext | null> => {
  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('telegram_connections')
    .select('id, user_id, telegram_user_id, chat_type, is_verified')
    .eq('telegram_chat_id', Number(chatId))
    .eq('is_verified', true)
    .maybeSingle();

  if (connectionError || !connection) return null;

  if (
    connection.chat_type === 'private' &&
    telegramUserId &&
    connection.telegram_user_id &&
    Number(connection.telegram_user_id) !== Number(telegramUserId)
  ) {
    return null;
  }

  const { data: settings } = await supabaseAdmin
    .from('app_settings')
    .select('accounts, categories')
    .eq('user_id', connection.user_id)
    .maybeSingle();

  const accounts = Array.isArray(settings?.accounts)
    ? settings.accounts.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))
    : [];

  const categories = Array.isArray(settings?.categories)
    ? settings.categories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
    : [];

  return {
    userId: connection.user_id,
    connectionId: connection.id,
    budgetMonth: getBudgetMonth(),
    accounts,
    categories,
  };
};

// --- AI Transaction Parser ---

const buildSystemPrompt = (ctx: UserContext) => {
  const accountNames = ctx.accounts.map((a) => a.name);
  const categoryNames = ctx.categories.map((c) => c.name);

  return `Anda adalah parser transaksi keuangan AlkaFlow. Tugas Anda mengekstrak data transaksi dari pesan pengguna.

Gunakan HANYA akun dan kategori yang tersedia. Jangan membuat akun baru atau kategori baru.

Akun tersedia: ${JSON.stringify(accountNames)}
Kategori tersedia: ${JSON.stringify(categoryNames)}
Kategori sistem tambahan: ["Income", "Transfer Out", "Transfer In"]

Jika pesan bukan transaksi keuangan, set is_transaction=false.
Jika akun atau kategori tidak jelas, set needs_clarification=true.

Balas HANYA dengan JSON valid (tanpa markdown, tanpa backtick), format:
{
  "is_transaction": true,
  "needs_clarification": false,
  "transaction_type": "expense",
  "name": "nama item",
  "amount": 0,
  "account": "nama akun",
  "category": "nama kategori",
  "is_paid": true,
  "date": "${getDateString()}",
  "budget_month": "${ctx.budgetMonth}",
  "notes": "",
  "confidence": 0.0
}`;
};

const callGeminiAPI = async (systemPrompt: string, userMessage: string): Promise<string | null> => {
  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.error('Gemini API call failed:', err);
    return null;
  }
};

// --- Validate & Ingest ---

interface ParsedTransaction {
  is_transaction?: boolean;
  needs_clarification?: boolean;
  name?: string;
  amount?: number;
  account?: string | { name?: string };
  category?: string | { name?: string };
  is_paid?: boolean;
  date?: string;
  budget_month?: string;
  notes?: string;
  confidence?: number;
}

const validateAndIngest = async (
  chatId: number,
  _telegramUserId: number | null,
  aiResponse: string,
  ctx: UserContext
) => {
  const cleanText = aiResponse
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: ParsedTransaction;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    await sendTelegramMessage(
      chatId,
      'Bot belum bisa membaca transaksi Anda. Coba tulis seperti:\n\n<i>makan siang 25000 pakai Bank Jago kategori Needs</i>'
    );
    return;
  }

  const isTransaction = parsed.is_transaction !== false;
  const needsClarification = Boolean(parsed.needs_clarification);
  const confidence = Number(parsed.confidence || 0);

  if (!isTransaction) {
    await sendTelegramMessage(
      chatId,
      'Pesan ini sepertinya bukan transaksi keuangan. Coba kirim seperti:\n\n<i>kopi 25000 BCA Needs</i>'
    );
    return;
  }

  const accountName = String(
    typeof parsed.account === 'object' ? parsed.account?.name : parsed.account || ''
  ).trim();
  const categoryName = String(
    typeof parsed.category === 'object' ? parsed.category?.name : parsed.category || ''
  ).trim();

  const matchedAccount = ctx.accounts.find((a) => a.name === accountName);
  const matchedCategory = ctx.categories.find((c) => c.name === categoryName);

  const systemCategories = ['Income', 'Transfer Out', 'Transfer In'];
  const isSystemCategory = systemCategories.includes(categoryName);

  const normalized = {
    name: String(parsed.name || '').trim(),
    amount: Number(parsed.amount || 0),
    account: matchedAccount?.name || '',
    category: matchedCategory?.name || (isSystemCategory ? categoryName : ''),
    is_paid: parsed.is_paid !== false,
    date: String(parsed.date || getDateString()),
    budget_month: String(parsed.budget_month || ctx.budgetMonth),
  };

  const valid =
    !needsClarification &&
    normalized.name &&
    normalized.amount > 0 &&
    normalized.account &&
    normalized.category &&
    confidence >= 0.75;

  if (!valid) {
    const hints: string[] = [];
    if (!normalized.name) hints.push('nama item');
    if (!normalized.amount || normalized.amount <= 0) hints.push('nominal');
    if (!normalized.account) hints.push(`kantong (pilihan: ${ctx.accounts.map((a) => a.name).join(', ')})`);
    if (!normalized.category) hints.push(`kategori (pilihan: ${ctx.categories.map((c) => c.name).join(', ')})`);
    if (confidence < 0.75) hints.push('pesan lebih spesifik');

    await sendTelegramMessage(
      chatId,
      `Saya butuh klarifikasi. Pastikan pesan mengandung: ${hints.join(', ')}.\n\nContoh: <i>makan siang 25000 pakai ${ctx.accounts[0]?.name || 'Bank'} kategori ${ctx.categories[0]?.name || 'Needs'}</i>`
    );
    return;
  }

  const { error: expenseError } = await supabaseAdmin
    .from('expenses')
    .insert({
      user_id: ctx.userId,
      name: normalized.name,
      amount: normalized.amount,
      account: normalized.account,
      category: normalized.category,
      is_paid: normalized.is_paid,
      date: normalized.date,
      budget_month: normalized.budget_month,
    })
    .select('id')
    .single();

  if (expenseError) {
    console.error('Insert expense error:', expenseError);
    await sendTelegramMessage(chatId, `Gagal menyimpan transaksi: ${expenseError.message}`);
    return;
  }

  await supabaseAdmin
    .from('telegram_connections')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', ctx.connectionId);

  const formattedAmount = new Intl.NumberFormat('id-ID').format(normalized.amount);

  await sendTelegramMessage(
    chatId,
    `\u2705 Berhasil dicatat!\n\n\ud83d\udcdd Item: ${normalized.name}\n\ud83d\udcb8 Nominal: Rp${formattedAmount}\n\ud83c\udfe6 Kantong: ${normalized.account}\n\ud83d\udcc2 Kategori: ${normalized.category}`
  );
};

// --- Main Handler ---

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const update = await req.json();
    const message = update?.message;

    if (!message?.text || !message?.chat?.id) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const chatId: number = message.chat.id;
    const telegramUserId: number | null = message.from?.id ?? null;
    const rawText: string = String(message.text || '').trim();
    const chatType: string = message.chat?.type || 'private';
    const label: string | null =
      message.chat?.title || message.from?.username || message.from?.first_name || null;

    // -- /start command --
    const startMatch = rawText.match(/^\/start(?:\s+(.+))?$/i);
    if (startMatch) {
      const token = startMatch[1] ? String(startMatch[1]).trim().toUpperCase() : '';
      await handleStartCommand(token, chatId, telegramUserId, chatType, label);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -- Regular message -> parse as transaction --
    const ctx = await resolveUserContext(chatId, telegramUserId);
    if (!ctx) {
      await sendTelegramMessage(
        chatId,
        'Chat Telegram ini belum terhubung ke akun AlkaFlow. Buka Profile > Telegram lalu lakukan linking lebih dulu.'
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(ctx);
    const aiResponse = await callGeminiAPI(systemPrompt, rawText);

    if (!aiResponse) {
      await sendTelegramMessage(
        chatId,
        'Maaf, bot sedang tidak bisa memproses pesan. Coba lagi nanti.'
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await validateAndIngest(chatId, telegramUserId, aiResponse, ctx);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
