import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PASS_SCORE: Record<number, number> = {
  1: 300,
  2: 500,
  3: 500,
  4: 500,
  5: 500,
  6: 500,
  7: 0,
  8: 1000,
};

const MAX_SCORE: Record<number, number> = {
  1: 2000,
  2: 2500,
  3: 2500,
  4: 2500,
  5: 3000,
  6: 3000,
  7: 2500,
  8: 5000,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase server env missing' });
  }

  const { profile, stageId, score } = req.body ?? {};

  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'Missing profile' });
  }

  if (!Number.isInteger(stageId) || stageId < 1 || stageId > 8) {
    return res.status(400).json({ error: 'Invalid stageId' });
  }

  if (!Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  if (score > MAX_SCORE[stageId]) {
    return res.status(400).json({ error: 'Score too high' });
  }

  const lineUserId = profile.lineUserId ?? profile.employeeId;

  if (!lineUserId || !profile.employeeId || !profile.department) {
    return res.status(400).json({ error: 'Missing player identity' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.from('stage_clears').insert({
    line_user_id: lineUserId,
    employee_id: profile.employeeId,
    department: profile.department,
    stage_id: stageId,
    score,
    cleared_at: new Date().toISOString(),
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    ok: true,
    passed: score >= PASS_SCORE[stageId],
  });
}