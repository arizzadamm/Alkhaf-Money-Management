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

const verifyAdminSession = async (requesterId: string, sessionProof: string) => {
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .select('id, username, role')
    .eq('id', requesterId)
    .eq('password', sessionProof)
    .maybeSingle();

  if (error || !data) return { ok: false as const, message: 'Sesi admin tidak valid.' };
  if ((data.role || '').toLowerCase() !== 'admin') {
    return { ok: false as const, message: 'Hanya admin yang boleh mengakses endpoint ini.' };
  }

  return { ok: true as const, admin: data };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  try {
    const body = await req.json();
    const { action, requesterId, sessionProof, targetUserId, username, passwordHash, role } = body ?? {};

    if (!action || !requesterId || !sessionProof) {
      return json({ error: 'Payload tidak lengkap.' }, 400);
    }

    const auth = await verifyAdminSession(String(requesterId), String(sessionProof));
    if (!auth.ok) return json({ error: auth.message }, 403);

    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from('app_users')
        .select('id, username, role, created_at')
        .order('created_at', { ascending: true });

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'create') {
      if (!username || !passwordHash) return json({ error: 'Username dan password wajib diisi.' }, 400);

      const { data, error } = await supabaseAdmin
        .from('app_users')
        .insert({
          username: String(username).trim(),
          password: String(passwordHash),
          role: String(role || 'user').toLowerCase()
        })
        .select('id, username, role')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'update') {
      if (!targetUserId || !username) return json({ error: 'Target user dan username wajib diisi.' }, 400);

      const payload: Record<string, string> = {
        username: String(username).trim(),
        role: String(role || 'user').toLowerCase()
      };

      if (passwordHash) payload.password = String(passwordHash);

      const { data, error } = await supabaseAdmin
        .from('app_users')
        .update(payload)
        .eq('id', targetUserId)
        .select('id, username, role')
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: 'User tidak ditemukan.' }, 404);
      return json({ data });
    }

    if (action === 'delete') {
      if (!targetUserId) return json({ error: 'Target user wajib diisi.' }, 400);
      if (String(targetUserId) === String(requesterId)) {
        return json({ error: 'Admin yang sedang login tidak bisa menghapus akun sendiri.' }, 400);
      }

      const { data, error } = await supabaseAdmin
        .from('app_users')
        .delete()
        .eq('id', targetUserId)
        .select('id')
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: 'User tidak ditemukan.' }, 404);
      return json({ data });
    }

    return json({ error: 'Action tidak dikenal.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return json({ error: message }, 500);
  }
});
