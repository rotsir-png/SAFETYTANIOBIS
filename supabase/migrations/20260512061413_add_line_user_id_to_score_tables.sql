/*
  # Add line_user_id to endless_scores and stage_clears

  ## Summary
  Adds `line_user_id` to both score tables so leaderboards can group by
  verified LINE identity rather than self-reported employeeId.

  ## Changes
  - `endless_scores`: add `line_user_id` (text, NOT NULL DEFAULT '')
  - `stage_clears`: add `line_user_id` (text, NOT NULL DEFAULT '')

  ## Notes
  - Default '' handles rows written before LINE integration.
  - Best-score-per-lineUserId deduplication is done at query time in the app.
  - Participation counting uses DISTINCT line_user_id per department.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'endless_scores' AND column_name = 'line_user_id'
  ) THEN
    ALTER TABLE endless_scores ADD COLUMN line_user_id text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stage_clears' AND column_name = 'line_user_id'
  ) THEN
    ALTER TABLE stage_clears ADD COLUMN line_user_id text NOT NULL DEFAULT '';
  END IF;
END $$;
