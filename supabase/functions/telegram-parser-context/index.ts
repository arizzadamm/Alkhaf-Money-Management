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

const getBudgetMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    const { telegram_chat_id, telegram_user_id } = body ?? {};

    if (!telegram_chat_id) {
      return json({ error: 'telegram_chat_id wajib diisi.' }, 400);
    }

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('telegram_connections')
      .select('id, user_id, telegram_user_id, telegram_chat_id, chat_type, label, is_verified, is_primary')
      .eq('telegram_chat_id', Number(telegram_chat_id))
      .eq('is_verified', true)
      .maybeSingle();

    if (connectionError || !connection) {
      return json({ error: 'Chat Telegram belum terhubung ke akun AlkaFlow.' }, 404);
    }

    if (
      connection.chat_type === 'private' &&
      telegram_user_id &&
      connection.telegram_user_id &&
      Number(connection.telegram_user_id) !== Number(telegram_user_id)
    ) {
      return json({ error: 'Telegram user id tidak cocok dengan koneksi yang terdaftar.' }, 403);
    }

    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('user_id, accounts, categories, goals, total_income')
      .eq('user_id', connection.user_id)
      .maybeSingle();

    if (settingsError) {
      return json({ error: settingsError.message }, 400);
    }

    return json({
      data: {
        user: {
          id: connection.user_id,
          budget_month: getBudgetMonth()
        },
        connection: {
          id: connection.id,
          telegram_chat_id: connection.telegram_chat_id,
          telegram_user_id: connection.telegram_user_id,
          chat_type: connection.chat_type,
          label: connection.label,
          is_primary: connection.is_primary
        },
        settings: {
          total_income: Number(userSettings?.total_income) || 0,
          accounts: Array.isArray(userSettings?.accounts) ? userSettings?.accounts : [],
          categories: Array.isArray(userSettings?.categories) ? userSettings?.categories : [],
          goals: Array.isArray(userSettings?.goals) ? userSettings?.goals : []
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return json({ error: message }, 500);
  }
});
