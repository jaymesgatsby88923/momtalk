import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../theme';

export type PostTypeOption = {
  post_type: string;
  post_category: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

type PostTypeCardProps = {
  option: PostTypeOption;
  onPress: () => void;
};

/** Step 1 card — one pressable option for choosing how the user is showing up. */
export function PostTypeCard({ option, onPress }: PostTypeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: option.iconBg }]}>
        <Ionicons name={option.icon} size={22} color={option.iconColor} />
      </View>

      <View style={styles.textWrap}>
        <AppText variant="subtitle" style={styles.label}>
          {option.label}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {option.description}
        </AppText>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.soft,
  },
  cardPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: theme.fontSize.body,
  },
});
