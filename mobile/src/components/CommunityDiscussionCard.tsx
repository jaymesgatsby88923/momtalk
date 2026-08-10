import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { CommunityPost } from '../types/community';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { getLikeCount } from '../utils/communityHelpers';
import { theme } from '../theme';

type CommunityDiscussionCardProps = {
  post: CommunityPost;
  pinned?: boolean;
};

export function CommunityDiscussionCard({
  post,
  pinned = false,
}: CommunityDiscussionCardProps) {
  const likeCount = getLikeCount(post);
  const commentCount = post.comment_count ?? 0;
  const authorName = post.display_name ?? 'Community member';

  return (
    <View style={styles.card}>
      {pinned ? (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color={theme.colors.primary} />
          <AppText variant="caption" color="primary" style={styles.pinnedText}>
            Pinned by Admins
          </AppText>
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <AppText variant="body" style={styles.authorName}>
              {authorName}
            </AppText>
            <View style={styles.badge}>
              <AppText variant="caption" color="primary" style={styles.badgeText}>
                Member
              </AppText>
            </View>
          </View>
          {post.created_at ? (
            <AppText variant="caption" color="textMuted">
              {formatTimeAgo(post.created_at)}
            </AppText>
          ) : null}
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textMuted} />
      </View>

      <AppText variant="subtitle" style={styles.title}>
        {post.title}
      </AppText>
      <AppText variant="body" color="textSecondary" numberOfLines={3} style={styles.content}>
        {post.content}
      </AppText>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={16} color={theme.colors.textSecondary} />
          <AppText variant="caption" color="textSecondary">
            {likeCount}
          </AppText>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
          <AppText variant="caption" color="textSecondary">
            {commentCount}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  pinnedText: {
    fontWeight: theme.fontWeight.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.chipPurpleBg,
    marginRight: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  authorName: {
    fontWeight: theme.fontWeight.semibold,
  },
  badge: {
    backgroundColor: theme.colors.chipPurpleBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.base,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.base,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
