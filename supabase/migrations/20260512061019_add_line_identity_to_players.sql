/*
  # Add LINE identity columns to players table

  ## Summary
  Extends the `players` table to store LINE LIFF identity fields alongside the
  existing employee record. The `line_user_id` column becomes the primary key
  for player lookups so one LINE account maps to exactly one employee profile.

  ## Changes to `players`
  - `line_user_id` (text, unique) — verified LINE userId from LIFF SDK
  - `display_name` (text) — LINE display name
  - `picture_url` (text) — LINE profile picture URL
  - `updated_at` (timestamptz) — last updated time
  - `profile_locked` (boolean, default true) — prevents normal UI profile edits

  ## Notes
  - Existing rows (from before LINE integration) will have NULL line_user_id.
  - The `line_user_id` unique index lets upsert use it as the conflict target.
  - Security: lineUserId is LINE-verified; employeeId is still self-reported
    and requires backend HR validation for full anti-impersonation.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'line_user_id'
  ) THEN
    ALTER TABLE players ADD COLUMN line_user_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE players ADD COLUMN display_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'picture_url'
  ) THEN
    ALTER TABLE players ADD COLUMN picture_url text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE players ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'profile_locked'
  ) THEN
    ALTER TABLE players ADD COLUMN profile_locked boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Unique index on line_user_id for upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS players_line_user_id_idx
  ON players (line_user_id)
  WHERE line_user_id IS NOT NULL;
