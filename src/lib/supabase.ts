import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Falta la variable de entorno VITE_SUPABASE_URL. Por favor, asegúrate de definirla en tu archivo .env.local'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta la variable de entorno VITE_SUPABASE_ANON_KEY. Por favor, asegúrate de definirla en tu archivo .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
