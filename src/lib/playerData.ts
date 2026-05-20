import { supabase } from './supabase';
import { debugLog } from './env';

export async function savePlayer(data: {
  line_user_id: string;
  display_name: string;
  picture_url?: string | null;
  employee_id?: string;
  department?: string;
}) {
  if (!supabase) {
    console.warn('[savePlayer] NO SUPABASE');
    return false;
  }

  const { error } = await supabase
    .from('players')
    .upsert(
      {
        line_user_id: data.line_user_id,
        display_name: data.display_name,
        picture_url: data.picture_url ?? null,
        employee_id: data.employee_id ?? null,
        department: data.department ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'line_user_id',
      }
    );

  if (error) {
    console.error('[savePlayer] ERROR', error);
    return false;
  }

  debugLog('[savePlayer] SUCCESS');
  return true;
}