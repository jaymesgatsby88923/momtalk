import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AppText, ScreenContainer } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { ApiError } from '../../services/api';
import { SignUpRequest } from '../../types/auth';
import { theme } from '../../theme';
import { clearSignupCredentials, getSignupCredentials } from './signupDraft';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Onboarding'
>;

type ParentTypeOption = {
  id: 'mom' | 'expecting' | 'partner';
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PARENT_TYPES: ParentTypeOption[] = [
  {
    id: 'mom',
    label: 'Mom',
    description: 'I have a baby or child',
    icon: 'heart-outline',
  },
  {
    id: 'expecting',
    label: 'Expecting',
    description: "I'm pregnant",
    icon: 'flower-outline',
  },
  {
    id: 'partner',
    label: 'Partner / caregiver',
    description: "I'm supporting a mom",
    icon: 'people-outline',
  },
];

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch')
    );
  }

  return false;
}

function parseUsDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { signupAndEnter } = useAuth();

  const [parentType, setParentType] = useState<ParentTypeOption['id'] | null>(null);
  const [dateText, setDateText] = useState('');
  const [dateError, setDateError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!getSignupCredentials()) {
        navigation.navigate('Signup');
      }
    }, [navigation]),
  );

  const dateLabel = parentType === 'expecting' ? 'Due date' : "Child's birth date";
  const datePlaceholder =
    parentType === 'expecting' ? 'MM/DD/YYYY (optional)' : 'MM/DD/YYYY (optional)';

  const submit = async (includeOnboarding: boolean) => {
    Keyboard.dismiss();
    const credentials = getSignupCredentials();
    if (!credentials) {
      navigation.navigate('Signup');
      return;
    }

    const payload: SignUpRequest = {
      display_name: credentials.display_name,
      email: credentials.email,
      password: credentials.password,
    };

    if (includeOnboarding) {
      setDateError('');
      if (parentType) {
        payload.parent_type = parentType;
      }

      const trimmedDate = dateText.trim();
      if (trimmedDate) {
        const isoDate = parseUsDate(trimmedDate);
        if (!isoDate) {
          setDateError('Use MM/DD/YYYY');
          return;
        }
        if (parentType === 'expecting') {
          payload.due_date = isoDate;
        } else {
          payload.birth_date = isoDate;
        }
      }
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await signupAndEnter(payload);
      clearSignupCredentials();
    } catch (error) {
      if (isNetworkError(error)) {
        setErrorMessage(
          'Unable to reach the server. Check your connection and try again.',
        );
        return;
      }

      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrorMessage(error.message);
          return;
        }
        if (error.status >= 500) {
          setErrorMessage('Something went wrong on our end. Please try again later.');
          return;
        }
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scroll contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.content}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
            </Pressable>

            <AppText variant="title" color="primary" style={styles.logo}>
              MomTalk
            </AppText>

            <AppText variant="title" style={styles.heading}>
              Tell us about you
            </AppText>

            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              Optional — this helps us show communities and posts that fit your season.
              You can skip and add this later.
            </AppText>

            {PARENT_TYPES.map((option) => {
              const selected = parentType === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setParentType((current) => (current === option.id ? null : option.id));
                    setDateText('');
                    setDateError('');
                  }}
                  style={[styles.typeCard, selected && styles.typeCardSelected]}
                >
                  <View style={styles.typeIconWrap}>
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={selected ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </View>
                  <View style={styles.typeText}>
                    <AppText variant="subtitle" style={styles.typeLabel}>
                      {option.label}
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      {option.description}
                    </AppText>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}

            {parentType ? (
              <View style={styles.fieldGroup}>
                <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  {dateLabel}
                </AppText>
                <View style={[styles.inputRow, dateError ? styles.inputRowError : undefined]}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={theme.colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={dateText}
                    onChangeText={(value) => {
                      setDateText(value);
                      if (dateError) {
                        setDateError('');
                      }
                    }}
                    placeholder={datePlaceholder}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
                {dateError ? (
                  <AppText variant="caption" color="error">
                    {dateError}
                  </AppText>
                ) : (
                  <AppText variant="caption" color="textMuted">
                    We use this to show your stage. We never show the exact date on your
                    profile.
                  </AppText>
                )}
              </View>
            ) : null}

            {errorMessage ? (
              <AppText variant="caption" color="error" style={styles.formMessage}>
                {errorMessage}
              </AppText>
            ) : null}

            <Pressable
              onPress={() => submit(true)}
              disabled={submitting}
              style={[styles.loginButtonWrapper, submitting && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting }}
            >
              <LinearGradient
                colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <AppText variant="subtitle" color="white" style={styles.loginButtonText}>
                  {submitting ? 'Creating account...' : 'Continue'}
                </AppText>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => submit(false)}
              disabled={submitting}
              style={styles.skipButton}
              accessibilityRole="button"
            >
              <AppText variant="subtitle" color="primary" style={styles.skipText}>
                Skip for now
              </AppText>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.base,
  },
  backButton: {
    width: 32,
    alignItems: 'flex-start',
  },
  logo: {
    textAlign: 'center',
    fontSize: theme.fontSize.largeTitle,
    fontStyle: 'italic',
    fontWeight: theme.fontWeight.bold,
  },
  heading: {
    textAlign: 'center',
    fontSize: theme.fontSize.title,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.base,
    ...theme.shadows.soft,
  },
  typeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.chipPurpleBg,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.chipPurpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    flex: 1,
    gap: 4,
  },
  typeLabel: {
    fontSize: theme.fontSize.body,
  },
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  inputRowError: {
    borderColor: theme.colors.error,
  },
  inputIcon: {
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  formMessage: {
    textAlign: 'center',
  },
  loginButtonWrapper: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
    ...theme.shadows.soft,
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  loginButtonText: {
    fontWeight: theme.fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  skipText: {
    fontWeight: theme.fontWeight.semibold,
  },
});
