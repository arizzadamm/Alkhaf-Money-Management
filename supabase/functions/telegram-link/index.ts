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

const normalizeRole = (role: string | null | undefined) => (role || '').toLowerCase();

const verifySession = async (requesterId: string, sessionProof: string) => {
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .select('id, username, role')
    .eq('id', requesterId)
    .eq('password', sessionProof)
    .maybeSingle();

  if (error || !data) return { ok: false as const, message: 'Sesi tidak valid.' };
  return { ok: true as const, user: data };
};

const generateTokenCode = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    const {
      action,
      requesterId,
      sessionProof,
      token,
      connectionId,
      telegramUserId,
      telegramChatId,
      chatType,
      label
    } = body ?? {};

    if (!action) return json({ error: 'Action wajib diisi.' }, 400);

    if (action === 'consume_token') {
      if (!token || !telegramChatId) {
        return json({ error: 'Token dan telegramChatId wajib diisi.' }, 400);
      }

      const { data: linkToken, error: tokenError } = await supabaseAdmin
        .from('telegram_link_tokens')
        .select('id, user_id, expires_at, consumed_at')
        .eq('token', String(token))
        .is('consumed_at', null)
        .maybeSingle();

      if (tokenError || !linkToken) return json({ error: 'Token linking tidak valid.' }, 404);
      if (new Date(linkToken.expires_at).getTime() < Date.now()) {
        return json({ error: 'Token linking sudah kedaluwarsa.' }, 410);
      }

      const { data: existingPrimary } = await supabaseAdmin
        .from('telegram_connections')
        .select('id')
        .eq('user_id', linkToken.user_id)
        .eq('is_primary', true)
        .maybeSingle();

      const connectionPayload = {
        user_id: linkToken.user_id,
        telegram_user_id: telegramUserId ? Number(telegramUserId) : null,
        telegram_chat_id: Number(telegramChatId),
        chat_type: String(chatType || 'private'),
        label: label ? String(label).trim() : null,
        is_verified: true,
        is_primary: !existingPrimary,
        linked_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      };

      const { data: connection, error: connectionError } = await supabaseAdmin
        .from('telegram_connections')
        .upsert(connectionPayload, { onConflict: 'telegram_chat_id' })
        .select('*')
        .single();

      if (connectionError) return json({ error: connectionError.message }, 400);

      await supabaseAdmin
        .from('telegram_link_tokens')
        .update({
          consumed_at: new Date().toISOString(),
          telegram_user_id: telegramUserId ? Number(telegramUserId) : null,
          telegram_chat_id: Number(telegramChatId)
        })
        .eq('id', linkToken.id);

      return json({ data: connection });
    }

    if (!requesterId || !sessionProof) {
      return json({ error: 'requesterId dan sessionProof wajib diisi.' }, 400);
    }

    const auth = await verifySession(String(requesterId), String(sessionProof));
    if (!auth.ok) return json({ error: auth.message }, 403);

    if (action === 'generate_token') {
      const tokenCode = generateTokenCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { data, error } = await supabaseAdmin
        .from('telegram_link_tokens')
        .insert({
          user_id: auth.user.id,
          token: tokenCode,
          purpose: 'telegram_link',
          expires_at: expiresAt
        })
        .select('id, token, expires_at')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'list_connections') {
      const { data, error } = await supabaseAdmin
        .from('telegram_connections')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: true });

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'set_primary') {
      if (!connectionId) return json({ error: 'connectionId wajib diisi.' }, 400);

      const { data: target, error: targetError } = await supabaseAdmin
        .from('telegram_connections')
        .select('id, user_id')
        .eq('id', connectionId)
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (targetError || !target) return json({ error: 'Connection tidak ditemukan.' }, 404);

      await supabaseAdmin.from('telegram_connections').update({ is_primary: false }).eq('user_id', auth.user.id);
      const { data, error } = await supabaseAdmin
        .from('telegram_connections')
        .update({ is_primary: true })
        .eq('id', target.id)
        .select('*')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'unlink_connection') {
      if (!connectionId) return json({ error: 'connectionId wajib diisi.' }, 400);

      const { data: removed, error } = await supabaseAdmin
        .from('telegram_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', auth.user.id)
        .select('*')
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      if (!removed) return json({ error: 'Connection tidak ditemukan.' }, 404);

      const { data: remainingPrimary } = await supabaseAdmin
        .from('telegram_connections')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (!remainingPrimary) {
        const { data: fallback } = await supabaseAdmin
          .from('telegram_connections')
          .select('id')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fallback) {
          await supabaseAdmin.from('telegram_connections').update({ is_primary: true }).eq('id', fallback.id);
        }
      }

      return json({ data: removed });
    }

    if (normalizeRole(auth.user.role) === 'admin' && action === 'admin_list_connections') {
      const { data, error } = await supabaseAdmin
        .from('telegram_connections')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    return json({ error: 'Action tidak dikenal.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return json({ error: message }, 500);
  }
});
