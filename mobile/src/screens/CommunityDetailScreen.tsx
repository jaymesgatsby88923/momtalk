import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppScreen, AppText, CommunityDiscussionCard } from '../components';
import { CommunitiesStackParamList } from '../navigation/types';
import { ApiError } from '../services/api';
import { communityService } from '../services/communityService';
import { CommunityPost } from '../types/community';
import { theme } from '../theme';
import {
  formatMemberCount,
  getCommunityIcon,
} from '../utils/communityHelpers';

type DetailRouteProp = RouteProp<CommunitiesStackParamList, 'CommunityDetail'>;
type NavigationProp = NativeStackNavigationProp<
  CommunitiesStackParamList,
  'CommunityDetail'
>;

type DetailTab = 'discussions' | 'about';
type SortOption = 'recent' | 'popular';

const sortOptions: Array<{ id: SortOption; label: string }> = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'popular', label: 'Most Popular' },
];

export function CommunityDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { communityId, communityName, isJoined: initialIsJoined = false } = route.params;

  const [name, setName] = useState(communityName ?? '');
  const [description, setDescription] = useState('');
  const [membersCount, setMembersCount] = useState<number | undefined>();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [selectedTab, setSelectedTab] = useState<DetailTab>('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const icon = getCommunityIcon(name);
  const memberLabel = formatMemberCount(membersCount);

  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await communityService.getCommunityDetail(communityId);
        setName(data.community.name);
        setDescription(data.community.description ?? '');
        setMembersCount(data.community.members_count);
        setPosts(data.posts);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong loading this community.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [communityId],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query),
      );
    }

    if (sortBy === 'popular') {
      result.sort(
        (a, b) =>
          (b.love_this ?? 0) +
          (b.im_here ?? 0) +
          (b.me_too ?? 0) -
          ((a.love_this ?? 0) + (a.im_here ?? 0) + (a.me_too ?? 0)),
      );
    } else {
      result.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    }

    return result;
  }, [posts, searchQuery, sortBy]);

  const pinnedPosts = filteredPosts.filter((post) => post.is_pinned);
  const regularPosts = filteredPosts.filter((post) => !post.is_pinned);

  const handleJoinToggle = async () => {
    setJoinLoading(true);

    try {
      if (isJoined) {
        await communityService.leaveCommunity(communityId);
        setIsJoined(false);
      } else {
        await communityService.joinCommunity(communityId);
        setIsJoined(true);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not update your membership.';
      Alert.alert('Error', message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleNewPostPress = () => {
    Alert.alert(
      'Coming soon',
      'Creating posts inside a community will work once the backend accepts community_id.',
    );
  };

  const handleFiltersPress = () => {
    Alert.alert(
      'Coming soon',
      'Community filters will be available once the backend supports them.',
    );
  };

  const renderDiscussions = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centeredSection}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredSection}>
          <AppText variant="body" color="error" style={styles.errorText}>
            {error}
          </AppText>
          <Pressable onPress={() => fetchDetail()} style={styles.retryButton}>
            <AppText variant="body" color="primary">
              Try again
            </AppText>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={regularPosts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item }) => <CommunityDiscussionCard post={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetail(true)}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {pinnedPosts.length > 0 ? (
              <View style={styles.pinnedSection}>
                {pinnedPosts.map((post) => (
                  <CommunityDiscussionCard key={post.post_id} post={post} pinned />
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={handleNewPostPress}
              style={({ pressed }) => [styles.newPostButton, pressed && styles.newPostPressed]}
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              <AppText variant="body" color="primary" style={styles.newPostLabel}>
                New Post
              </AppText>
            </Pressable>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <AppText variant="body" color="textSecondary">
              {searchQuery.trim()
                ? 'No discussions match your search.'
                : 'No discussions yet. Be the first to post!'}
            </AppText>
          </View>
        }
      />
    );
  };

  const renderAbout = () => (
    <ScrollView
      contentContainerStyle={styles.aboutContent}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="subtitle" style={styles.aboutHeading}>
        About this community
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.aboutBody}>
        {description || 'No description available yet.'}
      </AppText>
    </ScrollView>
  );

  return (
    <AppScreen showLogo={false} edges={['top']} contentStyle={styles.screenContent}>
      <View style={styles.topNav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.topNavActions}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="bookmark-outline" size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: icon.backgroundColor }]}>
            <Ionicons name={icon.name} size={28} color={icon.color} />
          </View>
          <Pressable
            onPress={handleJoinToggle}
            disabled={joinLoading}
            style={({ pressed }) => [
              styles.joinButton,
              isJoined && styles.joinedButton,
              pressed && styles.joinButtonPressed,
              joinLoading && styles.joinButtonDisabled,
            ]}
          >
            {joinLoading ? (
              <ActivityIndicator
                size="small"
                color={isJoined ? theme.colors.textPrimary : theme.colors.white}
              />
            ) : (
              <>
                <Ionicons
                  name={isJoined ? 'checkmark' : 'add'}
                  size={16}
                  color={isJoined ? theme.colors.textPrimary : theme.colors.white}
                />
                <AppText
                  variant="caption"
                  style={{
                    ...styles.joinLabel,
                    ...(isJoined ? styles.joinedLabel : {}),
                  }}
                >
                  {isJoined ? 'Joined' : 'Join'}
                </AppText>
              </>
            )}
          </Pressable>
        </View>

        <AppText variant="title" style={styles.communityName}>
          {name}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.subtitle}>
          {memberLabel ?? 'Member count coming soon'}
        </AppText>
        {description ? (
          <AppText variant="body" color="textSecondary" numberOfLines={2} style={styles.heroDescription}>
            {description}
          </AppText>
        ) : null}
      </View>

      {selectedTab === 'discussions' ? (
        <View style={styles.toolsRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search in ${name || 'community'}...`}
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
            />
          </View>
        </View>
      ) : null}

      {selectedTab === 'discussions' ? (
        <View style={styles.filterRow}>
          <Pressable onPress={handleFiltersPress} style={styles.filterButton}>
            <Ionicons name="options-outline" size={16} color={theme.colors.textSecondary} />
            <AppText variant="caption" color="textSecondary">
              Filters
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setShowSortMenu((current) => !current)}
            style={styles.sortButton}
          >
            <AppText variant="caption" color="textSecondary">
              {sortOptions.find((option) => option.id === sortBy)?.label}
            </AppText>
            <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {showSortMenu && selectedTab === 'discussions' ? (
        <View style={styles.sortMenu}>
          {sortOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => {
                setSortBy(option.id);
                setShowSortMenu(false);
              }}
              style={styles.sortMenuItem}
            >
              <AppText
                variant="body"
                color={sortBy === option.id ? 'primary' : 'textPrimary'}
                style={sortBy === option.id ? styles.sortMenuItemSelected : undefined}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.detailTabs}>
        {(['discussions', 'about'] as DetailTab[]).map((tab) => {
          const isSelected = selectedTab === tab;
          const label = tab === 'discussions' ? 'Discussions' : 'About';

          return (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[styles.detailTab, isSelected && styles.detailTabSelected]}
            >
              <AppText
                variant="body"
                style={{
                  ...styles.detailTabLabel,
                  ...(isSelected ? styles.detailTabLabelSelected : {}),
                }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tabContent}>
        {selectedTab === 'discussions' ? renderDiscussions() : renderAbout()}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.sm,
    paddingBottom: 0,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.base,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    ...theme.shadows.soft,
  },
  topNavActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    ...theme.shadows.soft,
  },
  hero: {
    marginBottom: theme.spacing.base,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    minWidth: 88,
    justifyContent: 'center',
  },
  joinedButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  joinButtonPressed: {
    opacity: 0.9,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinLabel: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  joinedLabel: {
    color: theme.colors.textPrimary,
  },
  communityName: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: theme.spacing.sm,
  },
  heroDescription: {
    lineHeight: 20,
  },
  toolsRow: {
    marginBottom: theme.spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    paddingVertical: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortMenu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  sortMenuItem: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortMenuItemSelected: {
    fontWeight: theme.fontWeight.semibold,
  },
  detailTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  detailTab: {
    marginRight: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  detailTabSelected: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  detailTabLabel: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  detailTabLabelSelected: {
    color: theme.colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  pinnedSection: {
    marginBottom: theme.spacing.sm,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.base,
  },
  newPostPressed: {
    opacity: 0.92,
  },
  newPostLabel: {
    fontWeight: theme.fontWeight.semibold,
  },
  emptyPosts: {
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  centeredSection: {
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
  aboutContent: {
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  aboutHeading: {
    marginBottom: theme.spacing.sm,
  },
  aboutBody: {
    lineHeight: 22,
  },
});
