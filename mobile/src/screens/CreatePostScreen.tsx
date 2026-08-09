import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppScreen, AppText, PrimaryButton } from '../components';
import { PostTypeCard, PostTypeOption } from '../components/PostTypeCard';
import { ApiError } from '../services/api';
import { postService } from '../services/postService';
import { PostCreateRequest } from '../types/post';
import { theme } from '../theme';

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
  user_id: 'temp-user-id',
};

/**
 * CreatePostScreen — 2-step create-post flow in a single component.
 * Step 1: pick post type. Step 2: title, content, optional photo UI, submit.
 */
export function CreatePostScreen() {
  const navigation = useNavigation();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<PostCreateRequest>(INITIAL_FORM);
  const [selectedOption, setSelectedOption] = useState<PostTypeOption | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    navigation.navigate('Home' as never);
  };

  /** Header back on step 2 — return to type selection without losing typed text. */
  const handleBack = () => {
    setCurrentStep(1);
  };

  /** Step 2 banner — let the user pick a different post type. */
  const handleChangeType = () => {
    setCurrentStep(1);
  };

  const canContinue = form.title.trim().length > 0 && form.content.trim().length > 0;

  /** Submit POST /posts/create with the form payload. */
  const handleContinue = async () => {
    if (!canContinue) {
      return;
    }

    setSubmitting(true);
    try {
      await postService.createPost({
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
      });

      Alert.alert('Post created', 'Your post was shared successfully.');
      setForm(INITIAL_FORM);
      setSelectedOption(null);
      setCurrentStep(1);
      navigation.navigate('Home' as never);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Could not create post', message);
    } finally {
      setSubmitting(false);
    }
  };

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
});
