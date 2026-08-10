import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { AppScreen, AppText, CommunityListItem } from '../components';
import { CommunitiesStackParamList } from '../navigation/types';
import { ApiError } from '../services/api';
import { communityService } from '../services/communityService';
import { CommunitiesTab, Community } from '../types/community';
import { theme } from '../theme';

type NavigationProp = NativeStackNavigationProp<
  CommunitiesStackParamList,
  'CommunitiesList'
>;

const tabs: Array<{ id: CommunitiesTab; label: string }> = [
  { id: 'my', label: 'My Communities' },
  { id: 'discover', label: 'Discover' },
];

export function CommunitiesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedTab, setSelectedTab] = useState<CommunitiesTab>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await communityService.listCommunities();
      setCommunities(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong loading communities.';
      setError(message);
      setCommunities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCommunities();
    }, [fetchCommunities]),
  );

  const filteredCommunities = useMemo(() => {
    return communities.filter((community) =>
      selectedTab === 'my' ? community.is_joined : !community.is_joined,
    );
  }, [communities, selectedTab]);

  const handleCommunityPress = (community: Community) => {
    navigation.navigate('CommunityDetail', {
      communityId: community.community_id,
      communityName: community.name,
      isJoined: community.is_joined,
    });
  };

  const handleSuggestPress = () => {
    Alert.alert(
      'Coming soon',
      'Community suggestions will be available once the backend is ready.',
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    const message =
      selectedTab === 'my'
        ? 'You have not joined any communities yet.'
        : 'No communities to discover right now.';

    return (
      <View style={styles.emptyState}>
        <AppText variant="body" color="textSecondary" style={styles.emptyText}>
          {message}
        </AppText>
      </View>
    );
  };

  const renderContent = () => {
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
          <Pressable onPress={() => fetchCommunities()} style={styles.retryButton}>
            <AppText variant="body" color="primary">
              Try again
            </AppText>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.community_id}
        renderItem={({ item }) => (
          <CommunityListItem community={item} onPress={() => handleCommunityPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCommunities(true)}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          selectedTab === 'discover' ? (
            <Pressable
              onPress={handleSuggestPress}
              style={({ pressed }) => [styles.suggestCard, pressed && styles.suggestCardPressed]}
            >
              <View style={styles.suggestIconWrap}>
                <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.suggestContent}>
                <AppText variant="subtitle">Can&apos;t find your community?</AppText>
                <AppText variant="caption" color="textSecondary" style={styles.suggestBody}>
                  Suggest a new community for other moms.
                </AppText>
              </View>
              <View style={styles.suggestButton}>
                <AppText variant="caption" color="primary" style={styles.suggestButtonText}>
                  Suggest
                </AppText>
              </View>
            </Pressable>
          ) : null
        }
      />
    );
  };

  return (
    <AppScreen showLogo={false} edges={['top']} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <AppText variant="title" style={styles.title}>
          Communities
        </AppText>
      </View>

      <View style={styles.segmentedControl}>
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() => setSelectedTab(tab.id)}
              style={[styles.segment, isSelected && styles.segmentSelected]}
            >
              <AppText
                variant="body"
                style={{
                  ...styles.segmentLabel,
                  ...(isSelected ? styles.segmentLabelSelected : {}),
                }}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {renderContent()}
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
  header: {
    marginBottom: theme.spacing.base,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    padding: 4,
    marginBottom: theme.spacing.base,
    ...theme.shadows.soft,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
  },
  segmentSelected: {
    backgroundColor: theme.colors.textPrimary,
  },
  segmentLabel: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  segmentLabelSelected: {
    color: theme.colors.white,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyState: {
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.base,
  },
  retryButton: {
    padding: theme.spacing.sm,
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.base,
    marginTop: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  suggestCardPressed: {
    opacity: 0.92,
  },
  suggestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.chipPurpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  suggestContent: {
    flex: 1,
    gap: 4,
    paddingRight: theme.spacing.sm,
  },
  suggestBody: {
    lineHeight: 18,
  },
  suggestButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  suggestButtonText: {
    fontWeight: theme.fontWeight.semibold,
  },
});
