const SUPABASE_URL = "https://boueqniduzgvxfwrkwqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_hmWUNzHE6lpxM21btlYODA_m1r_ABg0";

// Store the created client under a different global name.
// The Supabase SDK already uses window.supabase.
window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
