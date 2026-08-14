-- Journal_Entries + Affirmations.subtext (tables and RLS only)
-- Run in Supabase SQL editor if not already applied.

ALTER TABLE "Affirmations"
  ADD COLUMN IF NOT EXISTS subtext text;

CREATE TABLE IF NOT EXISTS "Journal_Entries" (
  journal_entry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
  feeling text NOT NULL,
  description text,
  visibility text NOT NULL CHECK (visibility IN ('private', 'anonymous')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created
  ON "Journal_Entries" (user_id, created_at DESC);

ALTER TABLE "Journal_Entries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entries_select_own ON "Journal_Entries"
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM "Users" WHERE auth_user_id = auth.uid())
  );

CREATE POLICY journal_entries_insert_own ON "Journal_Entries"
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM "Users" WHERE auth_user_id = auth.uid())
  );

CREATE POLICY journal_entries_update_own ON "Journal_Entries"
  FOR UPDATE USING (
    user_id IN (SELECT user_id FROM "Users" WHERE auth_user_id = auth.uid())
  );

CREATE POLICY journal_entries_delete_own ON "Journal_Entries"
  FOR DELETE USING (
    user_id IN (SELECT user_id FROM "Users" WHERE auth_user_id = auth.uid())
  );
