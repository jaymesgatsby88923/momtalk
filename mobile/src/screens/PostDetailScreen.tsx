import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
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
  onReply: (comment: PostComment) => void;
  likeLoading: boolean;
};

function CommentRow({ comment, onToggleLike, onReply, likeLoading }: CommentRowProps) {
  const isReply = Boolean(comment.parent_comment_id);

  return (
    <View style={[styles.commentRow, isReply && styles.replyIndent]}>
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
        <Pressable onPress={() => onReply(comment)} hitSlop={8} style={styles.replyButton}>
          <AppText variant="caption" color="primary">
            Reply
          </AppText>
        </Pressable>
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
  const inputRef = useRef<TextInput>(null);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleReply = (comment: PostComment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newComment = await postService.createComment(
        postId,
        trimmed,
        replyingTo?.comment_id,
      );

      setPost((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          comments: [...current.comments, newComment],
        };
      });

      setCommentText('');
      setReplyingTo(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not post your comment.';
      setError(message);
    } finally {
      setSubmitting(false);
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

  const canSubmit = commentText.trim().length > 0 && !submitting;

  return (
    <AppScreen showLogo={false} edges={['top', 'bottom']} contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <View style={styles.topNav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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

          {error ? (
            <AppText variant="caption" color="error" style={styles.inlineError}>
              {error}
            </AppText>
          ) : null}

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
                onReply={handleReply}
                likeLoading={likeLoadingId === comment.comment_id}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          {replyingTo ? (
            <View style={styles.replyBanner}>
              <AppText variant="caption" color="textSecondary" style={styles.replyBannerText}>
                Replying to {replyingTo.display_name ?? 'Anonymous'}
              </AppText>
              <Pressable onPress={handleCancelReply} hitSlop={8}>
                <Ionicons name="close" size={18} color={theme.colors.textMuted} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <View style={styles.inputAvatar} />
            <TextInput
              ref={inputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Share your thoughts..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.textInput}
              multiline
              maxLength={1000}
              editable={!submitting}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!canSubmit}
              style={[styles.sendButton, !canSubmit && styles.sendButtonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={theme.colors.white} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    paddingBottom: theme.spacing.base,
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
  inlineError: {
    marginBottom: theme.spacing.sm,
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
  replyIndent: {
    marginLeft: theme.spacing.lg,
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
  replyButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  commentLikeButton: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
    minWidth: 28,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  replyBannerText: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.chipPurpleBg,
    marginBottom: 6,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.base,
  },
  retryButton: {
    padding: theme.spacing.sm,
  },
});
