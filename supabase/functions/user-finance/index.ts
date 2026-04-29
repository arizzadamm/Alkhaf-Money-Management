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

const verifySession = async (requesterId: string, sessionProof: string) => {
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('session_tokens')
    .select('id, user_id, expires_at, is_revoked')
    .eq('token', sessionProof)
    .eq('user_id', requesterId)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (sessionError || !session) return { ok: false as const, message: 'Sesi tidak valid.' };

  await supabaseAdmin.from('session_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', session.id);

  const { data: user, error: userError } = await supabaseAdmin
    .from('app_users')
    .select('id, username, role')
    .eq('id', session.user_id)
    .single();

  if (userError || !user) return { ok: false as const, message: 'User tidak ditemukan.' };
  if ((user.role || '').toLowerCase() === 'admin') {
    return { ok: false as const, message: 'Akun admin tidak menggunakan endpoint finansial user.' };
  }

  return { ok: true as const, user };
};

const getMonthRange = (budgetMonth: string) => {
  const [yearText, monthText] = String(budgetMonth || '').split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    const { action, requesterId, sessionProof, budgetMonth, rows, transactionId, isPaid, settings, updates } = body ?? {};

    if (!action || !requesterId || !sessionProof) {
      return json({ error: 'Payload tidak lengkap.' }, 400);
    }

    const auth = await verifySession(String(requesterId), String(sessionProof));
    if (!auth.ok) return json({ error: auth.message }, 403);

    if (action === 'get_settings') {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'save_settings') {
      if (!settings) return json({ error: 'Settings wajib diisi.' }, 400);

      const payload = {
        user_id: auth.user.id,
        total_income: Number(settings.total_income) || 0,
        accounts: Array.isArray(settings.accounts) ? settings.accounts : [],
        categories: Array.isArray(settings.categories) ? settings.categories : [],
        goals: Array.isArray(settings.goals) ? settings.goals : [],
        cutoff_date: Math.max(1, Math.min(28, Number(settings.cutoff_date) || 1))
      };

      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (action === 'list_transactions') {
      if (!budgetMonth) return json({ error: 'budgetMonth wajib diisi.' }, 400);

      let query = supabaseAdmin
        .from('expenses')
        .select('*')
        .eq('user_id', auth.user.id)
        .eq('budget_month', String(budgetMonth))
        .order('created_at', { ascending: false });

      let { data, error } = await query;

      if (error && error.message.includes('budget_month')) {
        const range = getMonthRange(String(budgetMonth));
        if (!range) return json({ error: 'budgetMonth tidak valid.' }, 400);

        const fallback = await supabaseAdmin
          .from('expenses')
          .select('*')
          .eq('user_id', auth.user.id)
          .gte('created_at', range.startIso)
          .lte('created_at', range.endIso)
          .order('created_at', { ascending: false });

        data = fallback.data;
        error = fallback.error;
      }

      if (error) return json({ error: error.message }, 400);
      return json({ data: data || [] });
    }

    if (action === 'list_global_transactions') {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .select('amount, category, account, is_paid')
        .eq('user_id', auth.user.id);

      if (error) return json({ error: error.message }, 400);
      return json({ data: data || [] });
    }

    if (action === 'toggle_paid') {
      if (!transactionId || typeof isPaid !== 'boolean') {
        return json({ error: 'transactionId dan isPaid wajib diisi.' }, 400);
      }

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update({ is_paid: isPaid })
        .eq('id', transactionId)
        .eq('user_id', auth.user.id)
        .select('*')
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: 'Transaksi tidak ditemukan.' }, 404);
      return json({ data });
    }

    if (action === 'insert_transactions') {
      if (!Array.isArray(rows) || rows.length === 0) {
        return json({ error: 'rows wajib berupa array transaksi.' }, 400);
      }

      const normalizedRows = rows.map((row) => ({
        user_id: auth.user.id,
        name: String(row?.name || '').trim(),
        amount: Number(row?.amount) || 0,
        account: String(row?.account || '').trim(),
        category: String(row?.category || '').trim(),
        is_paid: row?.is_paid !== false,
        date: String(
          row?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        ),
        budget_month: String(row?.budget_month || new Date().toISOString().slice(0, 7))
      }));

      const invalidRow = normalizedRows.find((row) => !row.name || !row.account || !row.category || row.amount <= 0);
      if (invalidRow) return json({ error: 'Ada transaksi yang belum lengkap.' }, 400);

      let { data, error } = await supabaseAdmin.from('expenses').insert(normalizedRows).select('*');

      if (error && error.message.includes('budget_month')) {
        const fallbackRows = normalizedRows.map(({ budget_month, ...row }) => row);
        const fallback = await supabaseAdmin.from('expenses').insert(fallbackRows).select('*');
        data = fallback.data;
        error = fallback.error;
      }

      if (error) return json({ error: error.message }, 400);
      return json({ data: data || [] });
    }

    if (action === 'delete_transaction') {
      if (!transactionId) return json({ error: 'transactionId wajib diisi.' }, 400);

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', auth.user.id)
        .select('*')
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: 'Transaksi tidak ditemukan.' }, 404);
      return json({ data });
    }

    if (action === 'auto_generate_income') {
      if (!budgetMonth) return json({ error: 'budgetMonth wajib diisi.' }, 400);

      const { data: userSettings } = await supabaseAdmin
        .from('app_settings')
        .select('total_income, accounts')
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (!userSettings || !userSettings.total_income || Number(userSettings.total_income) <= 0) {
        return json({ data: null });
      }

      const accountsList = Array.isArray(userSettings.accounts) ? userSettings.accounts : [];
      if (accountsList.length === 0) return json({ data: null });

      const { data: existing } = await supabaseAdmin
        .from('expenses')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('budget_month', String(budgetMonth))
        .eq('category', 'Income')
        .like('name', 'Gaji Bulanan%')
        .limit(1)
        .maybeSingle();

      if (existing) return json({ data: null });

      const [y, mo] = String(budgetMonth).split('-');
      const monthDate = new Date(Number(y), Number(mo) - 1, 1);
      const dateStr = monthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const { data: created, error: createError } = await supabaseAdmin
        .from('expenses')
        .insert({
          user_id: auth.user.id,
          name: 'Gaji Bulanan',
          amount: Number(userSettings.total_income),
          account: String(accountsList[0]?.name || 'Default'),
          category: 'Income',
          is_paid: true,
          date: dateStr,
          budget_month: String(budgetMonth)
        })
        .select('*')
        .single();

      if (createError) return json({ error: createError.message }, 400);
      return json({ data: created });
    }

    if (action === 'update_transaction') {
      if (!transactionId || !updates || typeof updates !== 'object') {
        return json({ error: 'transactionId dan updates wajib diisi.' }, 400);
      }

      const allowedFields = ['name', 'amount', 'account', 'category', 'budget_month', 'is_paid', 'date'];
      const sanitized: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if ((updates as Record<string, unknown>)[key] !== undefined) {
          if (key === 'amount') sanitized[key] = Number((updates as Record<string, unknown>)[key]) || 0;
          else if (key === 'is_paid') sanitized[key] = Boolean((updates as Record<string, unknown>)[key]);
          else sanitized[key] = String((updates as Record<string, unknown>)[key]).trim();
        }
      }

      if (Object.keys(sanitized).length === 0) {
        return json({ error: 'Tidak ada field valid untuk diupdate.' }, 400);
      }

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update(sanitized)
        .eq('id', transactionId)
        .eq('user_id', auth.user.id)
        .select('*')
        .maybeSingle();

      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: 'Transaksi tidak ditemukan.' }, 404);
      return json({ data });
    }

    return json({ error: 'Action tidak dikenal.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return json({ error: message }, 500);
  }
});
