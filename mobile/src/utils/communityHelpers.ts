import { Ionicons } from '@expo/vector-icons';

type CommunityIcon = {
  name: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  color: string;
};

const defaultIcon: CommunityIcon = {
  name: 'people-outline',
  backgroundColor: '#EDE9FE',
  color: '#7C3AED',
};

const iconRules: Array<{ keywords: string[]; icon: CommunityIcon }> = [
  {
    keywords: ['pregnancy', 'trimester', 'expecting'],
    icon: { name: 'body-outline', backgroundColor: '#FCE7F3', color: '#DB2777' },
  },
  {
    keywords: ['mom', 'mother', 'mum'],
    icon: { name: 'heart-outline', backgroundColor: '#FEE2E2', color: '#DC2626' },
  },
  {
    keywords: ['baby', 'month', 'infant', 'toddler'],
    icon: { name: 'happy-outline', backgroundColor: '#DBEAFE', color: '#2563EB' },
  },
  {
    keywords: ['working', 'career', 'work'],
    icon: { name: 'briefcase-outline', backgroundColor: '#FEF3C7', color: '#D97706' },
  },
  {
    keywords: ['nicu', 'medical', 'health'],
    icon: { name: 'medkit-outline', backgroundColor: '#CCFBF1', color: '#0D9488' },
  },
  {
    keywords: ['support', 'mental'],
    icon: { name: 'leaf-outline', backgroundColor: '#DCFCE7', color: '#16A34A' },
  },
];

export function getCommunityIcon(name: string): CommunityIcon {
  const normalized = name.toLowerCase();

  for (const rule of iconRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.icon;
    }
  }

  return defaultIcon;
}

export function formatMemberCount(count?: number): string | null {
  if (count == null) {
    return null;
  }

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M members`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K members`;
  }

  return `${count} members`;
}

export function formatNewPostsCount(count?: number): string | null {
  if (count == null || count <= 0) {
    return null;
  }

  return count === 1 ? '1 new post' : `${count} new posts`;
}

export function getLikeCount(post: {
  love_this?: number;
  im_here?: number;
  me_too?: number;
}): number {
  return (post.love_this ?? 0) + (post.im_here ?? 0) + (post.me_too ?? 0);
}
