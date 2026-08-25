import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { ReactionBar } from './ReactionBar';
import { Post, ReactionType } from '../types/post';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { theme } from '../theme';

type PostCardProps = {
  post: Post;
  onPress?: () => void;
  header?: 'community' | 'author';
  pinned?: boolean;
  onReact?: (type: ReactionType) => void;
};

export function PostCard({
  post,
  onPress,
  header = 'community',
  pinned = false,
  onReact,
}: PostCardProps) {
  const showPinned = pinned || Boolean(post.is_pinned);
  const timestamp = post.created_at ? formatTimeAgo(post.created_at) : '';

  return (
    <View style={styles.card}>
      {showPinned ? (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color={theme.colors.primary} />
          <AppText variant="caption" color="primary" style={styles.pinnedText}>
            Pinned by Admins
          </AppText>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [pressed && onPress ? styles.bodyPressed : undefined]}
      >
        <View style={styles.header}>
          <View style={styles.avatar} />
          <View style={styles.headerText}>
            {header === 'author' ? (
              <View style={styles.nameRow}>
                <AppText variant="body" style={styles.authorName}>
                  {post.display_name ?? 'Community member'}
                </AppText>
                <View style={styles.badge}>
                  <AppText variant="caption" color="primary" style={styles.badgeText}>
                    Member
                  </AppText>
                </View>
              </View>
            ) : post.community_name ? (
              <AppText variant="caption" color="primary" style={styles.communityName}>
                {post.community_name}
              </AppText>
            ) : null}
            {timestamp ? (
              <AppText variant="caption" color="textMuted">
                {timestamp}
              </AppText>
            ) : null}
          </View>
        </View>

        <AppText variant="subtitle" style={styles.title}>
          {post.title}
        </AppText>
        <AppText
          variant="body"
          color="textSecondary"
          numberOfLines={3}
          style={styles.content}
        >
          {post.content}
        </AppText>
      </Pressable>

      <View style={styles.footer}>
        <ReactionBar
          counts={post}
          commentCount={post.comment_count ?? 0}
          myReaction={post.my_reaction}
          onReact={onReact}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    ...theme.shadows.soft,
  },
  bodyPressed: {
    opacity: 0.92,
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
    alignItems: 'center',
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
  communityName: {
    fontWeight: theme.fontWeight.semibold,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.base,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
});
