import { createClient } from '@supabase/supabase-js';

// Nanti Anda perlu memasukkan URL dan KEY dari Supabase Anda di sini
// atau menggunakan file .env (Sangat disarankan untuk keamanan).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
