import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Community } from '../types/community';
import { theme } from '../theme';
import {
  formatMemberCount,
  formatNewPostsCount,
  getCommunityIcon,
} from '../utils/communityHelpers';

type CommunityListItemProps = {
  community: Community;
  onPress: () => void;
};

export function CommunityListItem({ community, onPress }: CommunityListItemProps) {
  const icon = getCommunityIcon(community.name);
  const memberLabel = formatMemberCount(community.members_count);
  const newPostsLabel = formatNewPostsCount(community.new_posts_count);

  const metaParts = [memberLabel, newPostsLabel].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: icon.backgroundColor }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>

      <View style={styles.content}>
        <AppText variant="subtitle" style={styles.name}>
          {community.name}
        </AppText>
        {metaParts.length > 0 ? (
          <AppText variant="caption" color="textSecondary">
            {metaParts.join(' • ')}
          </AppText>
        ) : (
          <AppText variant="caption" color="textMuted">
            {community.description || 'Tap to explore'}
          </AppText>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  rowPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    gap: 4,
    paddingRight: theme.spacing.sm,
  },
  name: {
    fontSize: 17,
  },
});
