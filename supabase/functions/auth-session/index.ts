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
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    const {
      action,
      username,
      passwordHash,
      rememberMe,
      requesterId,
      sessionToken,
      currentPasswordHash,
      newPasswordHash
    } = body ?? {};

    if (!action) return json({ error: 'Action wajib diisi.' }, 400);

    // === LOGIN ===
    if (action === 'login') {
      if (!username || !passwordHash) {
        return json({ error: 'Username dan credential wajib diisi.' }, 400);
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('app_users')
        .select('id, username, role, password')
        .eq('username', String(username))
        .maybeSingle();

      if (userError || !user) return json({ error: 'Login gagal. Periksa kembali data Anda.' }, 401);

      if (user.password !== String(passwordHash)) {
        return json({ error: 'Login gagal. Periksa kembali data Anda.' }, 401);
      }

      const token = crypto.randomUUID();
      const now = new Date();
      const expiresMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const expiresAt = new Date(now.getTime() + expiresMs);

      const { error: tokenError } = await supabaseAdmin
        .from('session_tokens')
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString(),
          last_used_at: now.toISOString()
        });

      if (tokenError) return json({ error: 'Gagal membuat sesi.' }, 500);

      return json({
        data: {
          user: { id: user.id, username: user.username, role: user.role },
          sessionToken: token,
          expiresAt: expiresAt.toISOString()
        }
      });
    }

    // === LOGOUT ===
    if (action === 'logout') {
      if (!requesterId || !sessionToken) {
        return json({ error: 'Data sesi tidak lengkap.' }, 400);
      }

      await supabaseAdmin
        .from('session_tokens')
        .update({ is_revoked: true })
        .eq('token', String(sessionToken))
        .eq('user_id', String(requesterId));

      return json({ data: { success: true } });
    }

    // === VERIFY ===
    if (action === 'verify') {
      if (!requesterId || !sessionToken) {
        return json({ error: 'Data sesi tidak lengkap.' }, 400);
      }

      const { data: session, error: sessionError } = await supabaseAdmin
        .from('session_tokens')
        .select('id, user_id, expires_at, is_revoked')
        .eq('token', String(sessionToken))
        .eq('user_id', String(requesterId))
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (sessionError || !session) {
        return json({ error: 'Sesi tidak valid atau sudah kedaluwarsa.' }, 403);
      }

      await supabaseAdmin
        .from('session_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', session.id);

      const { data: user, error: userError } = await supabaseAdmin
        .from('app_users')
        .select('id, username, role')
        .eq('id', session.user_id)
        .single();

      if (userError || !user) return json({ error: 'User tidak ditemukan.' }, 404);

      return json({ data: { user } });
    }

    // === CHANGE CREDENTIALS ===
    if (action === 'change_password') {
      if (!requesterId || !sessionToken || !currentPasswordHash || !newPasswordHash) {
        return json({ error: 'Semua field wajib diisi.' }, 400);
      }

      const { data: session, error: sessionError } = await supabaseAdmin
        .from('session_tokens')
        .select('id, user_id')
        .eq('token', String(sessionToken))
        .eq('user_id', String(requesterId))
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (sessionError || !session) {
        return json({ error: 'Sesi tidak valid.' }, 403);
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('app_users')
        .select('id, password')
        .eq('id', session.user_id)
        .single();

      if (userError || !user) return json({ error: 'User tidak ditemukan.' }, 404);

      if (user.password !== String(currentPasswordHash)) {
        return json({ error: 'Kredensial saat ini salah.' }, 403);
      }

      const { error: updateError } = await supabaseAdmin
        .from('app_users')
        .update({ password: String(newPasswordHash) })
        .eq('id', user.id);

      if (updateError) return json({ error: 'Gagal mengubah kredensial.' }, 500);

      await supabaseAdmin
        .from('session_tokens')
        .update({ is_revoked: true })
        .eq('user_id', user.id)
        .neq('token', String(sessionToken));

      return json({ data: { success: true, sessionToken: String(sessionToken) } });
    }

    return json({ error: 'Action tidak dikenal.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return json({ error: message }, 500);
  }
});