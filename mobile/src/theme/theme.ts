import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F7F4F9',
  card: '#FFFFFF',
  primary: '#8B5CF6',
  primaryGradientStart: '#A78BFA',
  primaryGradientEnd: '#7C3AED',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  chipPurpleBg: '#EDE9FE',
  chipPurpleText: '#7C3AED',
  chipGreenBg: '#DCFCE7',
  chipGreenText: '#16A34A',
  reactionImHere: '#7C3AED',
  reactionMeToo: '#EC4899',
  reactionYouGotThis: '#5B8A66',
  reactionLoveThis: '#9F2D4A',
  reactionLove: '#8B5CF6',
  reactionSupport: '#22C55E',
  reactionCelebrate: '#F59E0B',
  border: '#E5E7EB',
  error: '#EF4444',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;

export const fontSize = {
  caption: 12,
  body: 14,
  subtitle: 16,
  title: 24,
  largeTitle: 28,
} as const;

export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const typography = {
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
} as const;

export type TypographyVariant = keyof typeof typography;

export const shadows = {
  soft: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const satisfies Record<string, ViewStyle>;

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
export type ColorKey = keyof typeof colors;
