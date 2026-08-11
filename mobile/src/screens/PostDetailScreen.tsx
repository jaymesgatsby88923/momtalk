import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppScreen, AppText } from '../components';
import { HomeStackParamList } from '../navigation/types';
import { ApiError } from '../services/api';
import { postService } from '../services/postService';
import { PostComment, PostDetail } from '../types/post';
import { theme } from '../theme';
import { formatTimeAgo } from '../utils/formatTimeAgo';

type DetailRouteProp = RouteProp<HomeStackParamList, 'PostDetail'>;
type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'PostDetail'>;

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

type CommentRowProps = {
  comment: PostComment;
  onToggleLike: (comment: PostComment) => void;
  likeLoading: boolean;
};

function CommentRow({ comment, onToggleLike, likeLoading }: CommentRowProps) {
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar} />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <AppText variant="caption" style={styles.commentAuthor}>
            {comment.display_name ?? 'Anonymous'}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {formatTimeAgo(comment.created_at)}
          </AppText>
        </View>
        <AppText variant="body" color="textSecondary" style={styles.commentContent}>
          {comment.content}
        </AppText>
      </View>
      <Pressable
        onPress={() => onToggleLike(comment)}
        disabled={likeLoading}
        style={styles.commentLikeButton}
        hitSlop={8}
      >
        <Ionicons
          name={comment.liked_by_me ? 'heart' : 'heart-outline'}
          size={18}
          color={comment.liked_by_me ? theme.colors.primary : theme.colors.textMuted}
        />
        <AppText variant="caption" color="textSecondary">
          {comment.like_count}
        </AppText>
      </Pressable>
    </View>
  );
}

export function PostDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { postId } = route.params;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await postService.getPostDetail(postId);
        setPost(data);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong loading this post.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [postId],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleCommentLike = async (comment: PostComment) => {
    setLikeLoadingId(comment.comment_id);
    try {
      const result = comment.liked_by_me
        ? await postService.unlikeComment(comment.comment_id)
        : await postService.likeComment(comment.comment_id);

      setPost((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          comments: current.comments.map((item) =>
            item.comment_id === comment.comment_id
              ? {
                  ...item,
                  like_count: result.like_count,
                  liked_by_me: result.liked_by_me,
                }
              : item,
          ),
        };
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not update like.';
      setError(message);
    } finally {
      setLikeLoadingId(null);
    }
  };

  if (loading && !refreshing) {
    return (
      <AppScreen showLogo={false} centered>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppScreen>
    );
  }

  if (error && !post) {
    return (
      <AppScreen showLogo={false} centered>
        <AppText variant="body" color="error" style={styles.errorText}>
          {error}
        </AppText>
        <Pressable onPress={() => fetchDetail()} style={styles.retryButton}>
          <AppText variant="body" color="primary">
            Try again
          </AppText>
        </Pressable>
      </AppScreen>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <AppScreen showLogo={false} edges={['top']} contentStyle={styles.screenContent}>
      <View style={styles.topNav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetail(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.postHeader}>
          <View style={styles.avatar} />
          <View style={styles.headerText}>
            <AppText variant="caption" style={styles.authorName}>
              {post.display_name ?? 'Anonymous'}
            </AppText>
            <View style={styles.metaRow}>
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
        </View>

        <AppText variant="title" style={styles.title}>
          {post.title}
        </AppText>
        <AppText variant="body" color="textSecondary" style={styles.content}>
          {post.content}
        </AppText>

        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
        ) : null}

        <View style={styles.reactionsRow}>
          <ReactionItem emoji="💜" label="I'm Here" count={post.im_here} />
          <ReactionItem emoji="🤝" label="Me Too" count={post.me_too} />
          <ReactionItem emoji="❤️" label="Love This" count={post.love_this} />
          <View style={styles.reactionItem}>
            <AppText style={styles.reactionEmoji}>💬</AppText>
            <AppText variant="caption" color="textSecondary">
              {post.comments.length}
            </AppText>
          </View>
        </View>

        <View style={styles.commentsHeader}>
          <AppText variant="subtitle">
            {post.comments.length === 1 ? '1 Comment' : `${post.comments.length} Comments`}
          </AppText>
        </View>

        {post.comments.length === 0 ? (
          <AppText variant="body" color="textSecondary" style={styles.emptyComments}>
            No comments yet. Be the first to share your thoughts.
          </AppText>
        ) : (
          post.comments.map((comment) => (
            <CommentRow
              key={comment.comment_id}
              comment={comment}
              onToggleLike={handleToggleCommentLike}
              likeLoading={likeLoadingId === comment.comment_id}
            />
          ))
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
  },
  postHeader: {
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
  authorName: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  communityName: {
    fontWeight: theme.fontWeight.semibold,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.base,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.base,
    backgroundColor: theme.colors.border,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.base,
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
  commentsHeader: {
    marginBottom: theme.spacing.md,
  },
  emptyComments: {
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.chipPurpleBg,
    marginTop: 2,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  commentContent: {
    lineHeight: 20,
  },
  commentLikeButton: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
    minWidth: 28,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.base,
  },
  retryButton: {
    padding: theme.spacing.sm,
  },
});
