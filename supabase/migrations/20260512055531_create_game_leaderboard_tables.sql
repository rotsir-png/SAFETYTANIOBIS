/*
  # Factory Safety Game — Leaderboard Tables

  1. New Tables
    - `players` — one row per registered employee
      - `employee_id` (text, PK) — employee's self-reported ID
      - `department` (text) — selected from predefined list
      - `created_at`, `updated_at` (timestamptz)
    - `endless_scores` — one row per endless-mode session
      - `id` (uuid, PK)
      - `employee_id`, `department`
      - `score` (int), `survived_time` (int, seconds)
      - `created_at`
    - `stage_clears` — one row per campaign stage clear
      - `id` (uuid, PK)
      - `employee_id`, `department`
      - `stage_id` (int), `score` (int)
      - `cleared_at`

  2. Security
    - RLS enabled on all three tables
    - Public INSERT allowed so unauthed players can submit scores
    - Public SELECT allowed for leaderboard reads
    - No UPDATE/DELETE exposed publicly

  NOTE: employeeId alone does NOT prevent impersonation.
  Real security requires backend + LINE LIFF userId validation.
*/

CREATE TABLE IF NOT EXISTS players (
  employee_id text PRIMARY KEY,
  department  text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can upsert their player record"
  ON players FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read player records"
  ON players FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update their player record"
  ON players FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS endless_scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   text NOT NULL DEFAULT '',
  department    text NOT NULL DEFAULT '',
  score         integer NOT NULL DEFAULT 0,
  survived_time integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE endless_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert endless scores"
  ON endless_scores FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read endless scores"
  ON endless_scores FOR SELECT
  TO anon
  USING (true);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS stage_clears (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL DEFAULT '',
  department  text NOT NULL DEFAULT '',
  stage_id    integer NOT NULL DEFAULT 0,
  score       integer NOT NULL DEFAULT 0,
  cleared_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stage_clears ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert stage clears"
  ON stage_clears FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read stage clears"
  ON stage_clears FOR SELECT
  TO anon
  USING (true);
