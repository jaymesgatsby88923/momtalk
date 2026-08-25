import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppScreen, AppText, PostCard } from '../components';
import { useAuth } from '../hooks/useAuth';
import { HomeStackParamList } from '../navigation/types';
import { apiRequest, ApiError } from '../services/api';
import { postService } from '../services/postService';
import { FeedType, Post, ReactionType } from '../types/post';
import { theme } from '../theme';
import { mergeReactionResponse, previewReaction } from '../utils/postReactions';

const endpointMap: Record<FeedType, string> = {
  forYou: '/posts/for-you',
  popular: '/posts/popular',
  latest: '/posts/latest',
  provideSupport: '/posts/provide-support',
};

type FeedTab = {
  id: FeedType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const feedTabs: FeedTab[] = [
  { id: 'forYou', label: 'For You', icon: 'sparkles-outline' },
  { id: 'popular', label: 'Popular', icon: 'flame-outline' },
  { id: 'latest', label: 'Latest', icon: 'time-outline' },
  { id: 'provideSupport', label: 'Provide Support', icon: 'heart-outline' },
];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'HomeFeed'>>();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<FeedType>('forYou');
  const reactingIds = useRef(new Set<string>());

  const fetchPosts = useCallback(
    async (feed: FeedType, isRefresh = false) => {
      if (!isAuthenticated) {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await apiRequest<Post[]>(endpointMap[feed]);
        setPosts(data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }

        const message =
          err instanceof ApiError ? err.message : 'Something went wrong loading posts.';
        setError(message);
        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, logout],
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    fetchPosts(selectedFeed);
  }, [selectedFeed, fetchPosts, authLoading, isAuthenticated]);

  const handleTabPress = (feed: FeedType) => {
    if (feed !== selectedFeed) {
      setSelectedFeed(feed);
    }
  };

  const handleReact = async (post: Post, type: ReactionType) => {
    if (reactingIds.current.has(post.post_id)) {
      return;
    }

    reactingIds.current.add(post.post_id);
    const previous = post;
    setPosts((current) =>
      current.map((item) =>
        item.post_id === post.post_id ? previewReaction(item, type) : item,
      ),
    );

    try {
      const result = await postService.setReaction(post.post_id, type);
      setPosts((current) =>
        current.map((item) =>
          item.post_id === post.post_id ? mergeReactionResponse(item, result) : item,
        ),
      );
    } catch (err) {
      setPosts((current) =>
        current.map((item) => (item.post_id === post.post_id ? previous : item)),
      );

      if (err instanceof ApiError && err.status === 401) {
        await logout();
      }
    } finally {
      reactingIds.current.delete(post.post_id);
    }
  };

  const renderContent = () => {
    if (authLoading || !isAuthenticated) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (loading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <AppText variant="body" color="error" style={styles.errorText}>
            {error}
          </AppText>
          <Pressable onPress={() => fetchPosts(selectedFeed)} style={styles.retryButton}>
            <AppText variant="body" color="primary">
              Try again
            </AppText>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.post_id })}
            onReact={(type) => handleReact(item, type)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPosts(selectedFeed, true)}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <AppText variant="body" color="textSecondary">
              No posts yet.
            </AppText>
          </View>
        }
      />
    );
  };

  return (
    <AppScreen
      edges={['top']}
      contentStyle={styles.screenContent}
      header={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          style={styles.tabsScroll}
        >
          {feedTabs.map((tab) => {
            const isSelected = selectedFeed === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                style={[styles.tab, isSelected ? styles.tabSelected : styles.tabUnselected]}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isSelected ? theme.colors.white : theme.colors.textSecondary}
                />
                <AppText
                  variant="caption"
                  style={[styles.tabLabel, isSelected ? styles.tabLabelSelected : undefined]}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      }
    >
      {renderContent()}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: theme.spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabSelected: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  tabUnselected: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
  },
  tabLabel: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  tabLabelSelected: {
    color: theme.colors.white,
  },
  listContent: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.base,
  },
  retryButton: {
    padding: theme.spacing.sm,
  },
});
