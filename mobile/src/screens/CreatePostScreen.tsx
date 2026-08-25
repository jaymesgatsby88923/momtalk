import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreen, AppText, PrimaryButton } from '../components';
import { PostTypeCard, PostTypeOption } from '../components/PostTypeCard';
import { MainTabParamList } from '../navigation/types';
import { ApiError } from '../services/api';
import { communityService } from '../services/communityService';
import { postService } from '../services/postService';
import { Community } from '../types/community';
import { PostCreateRequest } from '../types/post';
import { theme } from '../theme';
import { getCommunityIcon } from '../utils/communityHelpers';

const CONTENT_MAX = 1000;

/** Step 1 options — post_type is sent to the API; post_category maps to backend category. */
const POST_TYPE_OPTIONS: PostTypeOption[] = [
  {
    post_type: 'Looking for Support',
    post_category: 'support',
    label: 'Looking for Support',
    description: 'I need encouragement, advice, or someone who understands.',
    icon: 'heart',
    iconColor: theme.colors.primary,
    iconBg: theme.colors.chipPurpleBg,
  },
  {
    post_type: 'Sharing My Journey',
    post_category: 'journey',
    label: 'Sharing My Journey',
    description: 'I want to share an experience, update, or something on my mind.',
    icon: 'leaf',
    iconColor: theme.colors.chipGreenText,
    iconBg: theme.colors.chipGreenBg,
  },
  {
    post_type: 'Celebrating',
    post_category: 'celebration',
    label: 'Celebrating',
    description: 'I have a happy moment or milestone to share!',
    icon: 'sparkles',
    iconColor: theme.colors.reactionCelebrate,
    iconBg: '#FEF3C7',
  },
  {
    post_type: 'Asking a Question',
    post_category: 'question',
    label: 'Asking a Question',
    description: 'I have a question and hope other moms can help.',
    icon: 'help-circle',
    iconColor: theme.colors.reactionMeToo,
    iconBg: '#DBEAFE',
  },
  {
    post_type: 'Offering Support',
    post_category: 'supporting',
    label: 'Offering Support',
    description: 'I want to support or encourage other moms.',
    icon: 'heart-outline',
    iconColor: '#EC4899',
    iconBg: '#FCE7F3',
  },
];

const INITIAL_FORM: PostCreateRequest = {
  title: '',
  content: '',
  image_url: undefined,
  post_type: '',
  post_category: '',
  community_id: undefined,
};

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'Post'>;
type ScreenRouteProp = RouteProp<MainTabParamList, 'Post'>;

/**
 * CreatePostScreen — 2-step create-post flow in a single component.
 * Step 1: pick post type. Step 2: title, content, optional community, submit.
 */
export function CreatePostScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const lastOpenedAt = useRef<number | undefined>(undefined);
  const originCommunityId = useRef<string | undefined>(undefined);
  const originCommunityName = useRef<string | undefined>(undefined);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<PostCreateRequest>(INITIAL_FORM);
  const [selectedOption, setSelectedOption] = useState<PostTypeOption | null>(null);
  const [selectedCommunityName, setSelectedCommunityName] = useState<string | null>(null);
  const [communityLocked, setCommunityLocked] = useState(false);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadJoinedCommunities = useCallback(async () => {
    try {
      const data = await communityService.listCommunities();
      setJoinedCommunities(data.filter((community) => community.is_joined));
    } catch {
      setJoinedCommunities([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJoinedCommunities();

      const openedAt = route.params?.openedAt;
      const communityId = route.params?.communityId;
      if (!openedAt || openedAt === lastOpenedAt.current || !communityId) {
        return;
      }

      lastOpenedAt.current = openedAt;
      originCommunityId.current = communityId;
      originCommunityName.current = route.params?.communityName;
      setForm((prev) => ({ ...prev, community_id: communityId }));
      setSelectedCommunityName(route.params?.communityName ?? 'Community');
      setCommunityLocked(true);
    }, [loadJoinedCommunities, route.params]),
  );

  const resetComposer = () => {
    setForm(INITIAL_FORM);
    setSelectedOption(null);
    setCurrentStep(1);
    setSelectedCommunityName(null);
    setCommunityLocked(false);
    originCommunityId.current = undefined;
    originCommunityName.current = undefined;
  };

  const goToCommunity = (communityId: string, communityName?: string | null) => {
    navigation.navigate('Communities', {
      screen: 'CommunityDetail',
      params: {
        communityId,
        communityName: communityName ?? undefined,
        isJoined: true,
      },
    });
  };

  const leaveComposer = (postedCommunityId?: string | null, postedCommunityName?: string | null) => {
    const destinationId = postedCommunityId || originCommunityId.current;
    const destinationName = postedCommunityName || originCommunityName.current;

    resetComposer();

    if (destinationId) {
      goToCommunity(destinationId, destinationName);
      return;
    }

    navigation.navigate('Home');
  };

  /** Step 1 — store post_type/post_category and advance to the form. */
  const handleSelectPostType = (option: PostTypeOption) => {
    setSelectedOption(option);
    setForm((prev) => ({
      ...prev,
      post_type: option.post_type,
      post_category: option.post_category,
    }));
    setCurrentStep(2);
  };

  /** Header close on step 1 — leave the create flow. */
  const handleClose = () => {
    leaveComposer();
  };

  /** Header back on step 2 — return to type selection without losing typed text. */
  const handleBack = () => {
    setCurrentStep(1);
  };

  /** Step 2 banner — let the user pick a different post type. */
  const handleChangeType = () => {
    setCurrentStep(1);
  };

  const handleClearCommunity = () => {
    if (communityLocked) {
      return;
    }
    setForm((prev) => ({ ...prev, community_id: undefined }));
    setSelectedCommunityName(null);
  };

  const handleSelectCommunity = (community: Community | null) => {
    if (community) {
      setForm((prev) => ({ ...prev, community_id: community.community_id }));
      setSelectedCommunityName(community.name);
    } else {
      handleClearCommunity();
    }
    setPickerVisible(false);
  };

  const canContinue = form.title.trim().length > 0 && form.content.trim().length > 0;

  /** Submit POST /posts/create with the form payload. */
  const handleContinue = async () => {
    if (!canContinue) {
      return;
    }

    setSubmitting(true);
    try {
      const communityId = form.community_id || undefined;
      await postService.createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        post_type: form.post_type,
        post_category: form.post_category,
        ...(communityId ? { community_id: communityId } : {}),
      });

      Alert.alert('Post created', 'Your post was shared successfully.');
      leaveComposer(communityId, selectedCommunityName);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Could not create post', message);
    } finally {
      setSubmitting(false);
    }
  };

  const communityLabel = selectedCommunityName ?? 'Home feed';
  const communityIcon = selectedCommunityName
    ? getCommunityIcon(selectedCommunityName)
    : null;

  return (
    <AppScreen showLogo={false} edges={['top', 'bottom']} contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar — close on step 1, back on step 2 */}
        <View style={styles.header}>
          <Pressable
            onPress={currentStep === 1 ? handleClose : handleBack}
            style={styles.headerButton}
            hitSlop={8}
          >
            <Ionicons
              name={currentStep === 1 ? 'close' : 'arrow-back'}
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <AppText variant="subtitle">Create Post</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 ? (
            /* ── Step 1: post type selection ── */
            <View>
              <View style={styles.hero}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="chatbubble-ellipses" size={36} color={theme.colors.primary} />
                </View>
                <AppText variant="title" style={styles.heroTitle}>
                  How are you showing up today?
                </AppText>
                <AppText variant="body" color="textSecondary" style={styles.heroSubtitle}>
                  Choose what best describes the kind of post you want to share.
                </AppText>
              </View>

              {POST_TYPE_OPTIONS.map((option) => (
                <PostTypeCard
                  key={option.post_type}
                  option={option}
                  onPress={() => handleSelectPostType(option)}
                />
              ))}
            </View>
          ) : (
            /* ── Step 2: post details form ── */
            <View>
              {selectedOption ? (
                <View style={styles.selectedBanner}>
                  <View style={styles.selectedBannerLeft}>
                    <View
                      style={[
                        styles.selectedIconWrap,
                        { backgroundColor: selectedOption.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={selectedOption.icon}
                        size={18}
                        color={selectedOption.iconColor}
                      />
                    </View>
                    <AppText variant="body" style={styles.selectedLabel}>
                      {selectedOption.label}
                    </AppText>
                  </View>
                  <Pressable onPress={handleChangeType}>
                    <AppText variant="body" color="primary">
                      Change
                    </AppText>
                  </Pressable>
                </View>
              ) : null}

              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Community
              </AppText>
              {joinedCommunities.length === 0 && !communityLocked ? (
                <Pressable
                  onPress={() => navigation.navigate('Communities')}
                  style={styles.communityRow}
                >
                  <AppText variant="body" color="textSecondary" style={styles.communityRowLabel}>
                    Join a community to share there
                  </AppText>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    if (!communityLocked) {
                      setPickerVisible(true);
                    }
                  }}
                  disabled={communityLocked}
                  style={[styles.communityRow, communityLocked && styles.communityRowLocked]}
                >
                  {communityIcon ? (
                    <View
                      style={[
                        styles.communityIconWrap,
                        { backgroundColor: communityIcon.backgroundColor },
                      ]}
                    >
                      <Ionicons
                        name={communityIcon.name}
                        size={16}
                        color={communityIcon.color}
                      />
                    </View>
                  ) : (
                    <Ionicons name="home-outline" size={18} color={theme.colors.textSecondary} />
                  )}
                  <AppText variant="body" style={styles.communityRowLabel}>
                    {communityLabel}
                  </AppText>
                  {communityLocked ? null : selectedCommunityName ? (
                    <Pressable onPress={handleClearCommunity} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                    </Pressable>
                  ) : (
                    <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
                  )}
                </Pressable>
              )}

              <AppText variant="subtitle" style={styles.sectionLabel}>
                What&apos;s happening?
              </AppText>

              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Title
              </AppText>
              <TextInput
                value={form.title}
                onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
                placeholder="Give your post a title"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.titleInput}
              />

              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Content
              </AppText>
              <View style={styles.contentWrap}>
                <TextInput
                  value={form.content}
                  onChangeText={(text) =>
                    setForm((prev) => ({
                      ...prev,
                      content: text.slice(0, CONTENT_MAX),
                    }))
                  }
                  placeholder="Share what's on your heart..."
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.contentInput}
                  multiline
                  textAlignVertical="top"
                />
                <AppText variant="caption" color="textMuted" style={styles.charCount}>
                  {form.content.length}/{CONTENT_MAX}
                </AppText>
              </View>

              {/* Photo picker UI only — upload not implemented yet */}
              <Pressable style={styles.addPhotoButton}>
                <Ionicons name="image-outline" size={20} color={theme.colors.textSecondary} />
                <AppText variant="body" color="textSecondary">
                  Add Photo
                </AppText>
              </Pressable>

              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} />
                <AppText variant="caption" color="textSecondary" style={styles.tipText}>
                  Tip: The more details you share, the easier it is for moms to understand and
                  support you.
                </AppText>
              </View>
            </View>
          )}
        </ScrollView>

        {currentStep === 2 ? (
          <View style={styles.footer}>
            <PrimaryButton
              title="Continue"
              onPress={handleContinue}
              disabled={!canContinue}
              loading={submitting}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.pickerSafeArea} edges={['top', 'bottom']}>
          <View style={styles.pickerHeader}>
            <AppText variant="subtitle">Post to</AppText>
            <Pressable onPress={() => setPickerVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
          <FlatList
            data={joinedCommunities}
            keyExtractor={(item) => item.community_id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable
                onPress={() => handleSelectCommunity(null)}
                style={styles.pickerRow}
              >
                <View style={styles.pickerHomeIcon}>
                  <Ionicons name="home-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.pickerRowText}>
                  <AppText variant="body" style={styles.pickerRowTitle}>
                    None (Home feed)
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    Share with everyone on Home
                  </AppText>
                </View>
                {!form.community_id ? (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                ) : null}
              </Pressable>
            }
            renderItem={({ item }) => {
              const icon = getCommunityIcon(item.name);
              const selected = form.community_id === item.community_id;
              return (
                <Pressable onPress={() => handleSelectCommunity(item)} style={styles.pickerRow}>
                  <View style={[styles.pickerHomeIcon, { backgroundColor: icon.backgroundColor }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                  <View style={styles.pickerRowText}>
                    <AppText variant="body" style={styles.pickerRowTitle}>
                      {item.name}
                    </AppText>
                    {item.description ? (
                      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                        {item.description}
                      </AppText>
                    ) : null}
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  headerButton: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.chipPurpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.base,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.chipPurpleBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  selectedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  selectedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLabel: {
    fontWeight: theme.fontWeight.semibold,
    flexShrink: 1,
  },
  sectionLabel: {
    marginBottom: theme.spacing.base,
  },
  fieldLabel: {
    marginBottom: theme.spacing.xs,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.base,
  },
  communityRowLocked: {
    backgroundColor: theme.colors.chipPurpleBg,
    borderColor: theme.colors.chipPurpleBg,
  },
  communityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityRowLabel: {
    flex: 1,
    fontWeight: theme.fontWeight.medium,
  },
  titleInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.base,
  },
  contentWrap: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    minHeight: 160,
  },
  contentInput: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.base,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.chipPurpleBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.base,
  },
  tipText: {
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  pickerSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerHomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.chipPurpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRowText: {
    flex: 1,
    gap: 2,
  },
  pickerRowTitle: {
    fontWeight: theme.fontWeight.semibold,
  },
});
