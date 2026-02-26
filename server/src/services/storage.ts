import { getAuthSupabaseClient } from './supabase.js';

const BUCKET = 'kanban-attachments';

export async function uploadFile(path: string, buffer: Buffer, contentType: string) {
  const supabase = getAuthSupabaseClient();
  if (!supabase) throw new Error('Storage not configured');
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType });
  if (error) throw error;
}

export async function deleteFile(path: string) {
  const supabase = getAuthSupabaseClient();
  if (!supabase) throw new Error('Storage not configured');
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) throw new Error('Storage not configured');
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
