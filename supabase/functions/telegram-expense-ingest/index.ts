import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    const {
      telegram_chat_id,
      telegram_user_id,
      name,
      amount,
      account,
      category,
      is_paid = true,
      date,
      budget_month
    } = body ?? {};

    if (!telegram_chat_id || !name || !amount || !account || !category) {
      return json({ error: 'Payload transaksi belum lengkap.' }, 400);
    }

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('telegram_connections')
      .select('id, user_id, telegram_user_id, telegram_chat_id, chat_type, is_verified')
      .eq('telegram_chat_id', Number(telegram_chat_id))
      .eq('is_verified', true)
      .maybeSingle();

    if (connectionError || !connection) {
      return json({ error: 'Chat Telegram belum terhubung ke user aplikasi.' }, 404);
    }

    if (
      connection.chat_type === 'private' &&
      telegram_user_id &&
      connection.telegram_user_id &&
      Number(connection.telegram_user_id) !== Number(telegram_user_id)
    ) {
      return json({ error: 'Telegram user id tidak cocok dengan koneksi yang terdaftar.' }, 403);
    }

    const payload = {
      user_id: connection.user_id,
      name: String(name).trim(),
      amount: Number(amount),
      account: String(account).trim(),
      category: String(category).trim(),
      is_paid: Boolean(is_paid),
      date: String(date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
      budget_month: String(budget_month || new Date().toISOString().slice(0, 7))
    };

    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert(payload)
      .select('*')
      .single();

    if (expenseError) return json({ error: expenseError.message }, 400);

    await supabaseAdmin
      .from('telegram_connections')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', connection.id);

    return json({
      data: {
        expense,
        resolved_user_id: connection.user_id,
        connection_id: connection.id
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return json({ error: message }, 500);
  }
});
