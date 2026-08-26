export type JournalVisibility = 'private' | 'anonymous';

export type JournalEntry = {
  journal_entry_id: string;
  feeling: string;
  description: string | null;
  visibility: JournalVisibility;
  parent_stage?: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalFeedItem = {
  journal_entry_id: string;
  feeling: string;
  description: string | null;
  parent_stage: string | null;
  created_at: string;
};

export type JournalCreateRequest = {
  feeling: string;
  description?: string;
  visibility: JournalVisibility;
};

export type JournalUpdateRequest = {
  feeling?: string;
  description?: string;
  visibility?: JournalVisibility;
};
