import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Post } from '../types/post';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { theme } from '../theme';

type PostCardProps = {
  post: Post;
};

type ReactionItemProps = {
  emoji: string;
  label: string;
  count: number;
};

function ReactionItem({ emoji, label, count }: ReactionItemProps) {
  return (
    <View style={styles.reactionItem}>
      <AppText style={styles.reactionEmoji}>{emoji}</AppText>
      <AppText variant="caption" style={styles.reactionLabel}>
        {label}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {count}
      </AppText>
    </View>
  );
}

export function PostCard({ post }: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          {post.community_name ? (
            <AppText variant="caption" color="primary" style={styles.communityName}>
              {post.community_name}
            </AppText>
          ) : null}
          <AppText variant="caption" color="textMuted">
            {formatTimeAgo(post.created_at)}
          </AppText>
        </View>
      </View>

      <AppText variant="subtitle" style={styles.title}>
        {post.title}
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.content}>
        {post.content}
      </AppText>

      <View style={styles.footer}>
        <ReactionItem emoji="💜" label="I'm Here" count={post.im_here} />
        <ReactionItem emoji="🤝" label="Me Too" count={post.me_too} />
        <ReactionItem emoji="❤️" label="Love This" count={post.love_this} />
        <View style={styles.reactionItem}>
          <AppText style={styles.reactionEmoji}>💬</AppText>
          <AppText variant="caption" color="textSecondary">
            {post.comment_count}
          </AppText>
        </View>
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
  communityName: {
    fontWeight: theme.fontWeight.semibold,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.base,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  reactionItem: {
    alignItems: 'center',
    minWidth: 56,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  reactionLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
});
