import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url') {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'pane-supabase-auth',
    }
  })
}

export const getSupabase = () => supabase
export const supabaseClient = supabase
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '593999999999'
export default supabase