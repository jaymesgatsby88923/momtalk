-- Stamp parent_stage on journal entries for For You grouping (filter later).
-- Run in Supabase SQL editor if not already applied.

ALTER TABLE "Journal_Entries"
  ADD COLUMN IF NOT EXISTS parent_stage text;

CREATE INDEX IF NOT EXISTS idx_journal_entries_anonymous_created
  ON "Journal_Entries" (created_at DESC)
  WHERE visibility = 'anonymous';

-- Best-effort backfill from the author's Child dates (snapshot as of today).
UPDATE "Journal_Entries" AS j
SET parent_stage = derived.stage
FROM (
  SELECT
    c.user_id,
    CASE
      WHEN c.birth_date IS NOT NULL AND (c.birth_date)::date > CURRENT_DATE THEN 'Expecting'
      WHEN c.birth_date IS NOT NULL AND (CURRENT_DATE - (c.birth_date)::date) <= 90 THEN 'Newborn'
      WHEN c.birth_date IS NOT NULL AND (CURRENT_DATE - (c.birth_date)::date) <= 365 THEN 'Infant'
      WHEN c.birth_date IS NOT NULL THEN 'Toddler+'
      WHEN c.due_date IS NOT NULL AND ((c.due_date)::date - CURRENT_DATE) / 7 < 0 THEN 'Recently delivered'
      WHEN c.due_date IS NOT NULL AND ((c.due_date)::date - CURRENT_DATE) / 7 <= 13 THEN 'First trimester'
      WHEN c.due_date IS NOT NULL AND ((c.due_date)::date - CURRENT_DATE) / 7 <= 27 THEN 'Second trimester'
      WHEN c.due_date IS NOT NULL THEN 'Third trimester'
      ELSE NULL
    END AS stage
  FROM "Child" AS c
) AS derived
WHERE j.user_id = derived.user_id
  AND j.parent_stage IS NULL
  AND derived.stage IS NOT NULL;
