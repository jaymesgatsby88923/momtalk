const FEELING_COLORS: Record<string, { bg: string; text: string }> = {
  exhausted: { bg: '#FCE7F3', text: '#BE185D' },
  overwhelmed: { bg: '#FFE4E6', text: '#E11D48' },
  lonely: { bg: '#EDE9FE', text: '#7C3AED' },
  grateful: { bg: '#DCFCE7', text: '#16A34A' },
  anxious: { bg: '#FFEDD5', text: '#EA580C' },
};

const DEFAULT_FEELING_COLOR = { bg: '#EDE9FE', text: '#7C3AED' };

export function getFeelingColors(feeling: string) {
  const key = feeling.trim().toLowerCase();
  return FEELING_COLORS[key] ?? DEFAULT_FEELING_COLOR;
}

export function formatJournalDate(isoDate: string): { label: string; sublabel: string } {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return { label: '', sublabel: '' };
  }

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();

  if (isToday) {
    return { label: 'Today', sublabel: `${month} ${day}` };
  }

  return { label: `${month} ${day}`, sublabel: '' };
}

export function formatJournalStarted(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const today = new Date();
  const months =
    (today.getFullYear() - date.getFullYear()) * 12 +
    (today.getMonth() - date.getMonth());

  if (months < 1) {
    return 'Started this month';
  }

  if (months === 1) {
    return 'Started 1 month ago';
  }

  return `Started ${months} months ago`;
}
