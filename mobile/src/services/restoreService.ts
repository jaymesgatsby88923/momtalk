import { apiRequest } from './api';
import { Affirmation, SaveAffirmationRequest } from '../types/affirmation';
import {
  JournalCreateRequest,
  JournalEntry,
  JournalUpdateRequest,
} from '../types/journal';

export const restoreService = {
  getAffirmation: () => apiRequest<Affirmation>('/restore/affirmation'),

  saveAffirmation: (payload: SaveAffirmationRequest) =>
    apiRequest<Affirmation>('/restore/affirmation', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createEntry: (payload: JournalCreateRequest) =>
    apiRequest<JournalEntry>('/restore', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listEntries: () => apiRequest<JournalEntry[]>('/restore'),

  getEntry: (journalEntryId: string) =>
    apiRequest<JournalEntry>(`/restore/${journalEntryId}`),

  updateEntry: (journalEntryId: string, payload: JournalUpdateRequest) =>
    apiRequest<JournalEntry>(`/restore/${journalEntryId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteEntry: (journalEntryId: string) =>
    apiRequest<{ message: string }>(`/restore/${journalEntryId}`, {
      method: 'DELETE',
    }),
};
