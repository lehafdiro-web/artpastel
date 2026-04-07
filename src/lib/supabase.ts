import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const uploadImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, file);
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
};