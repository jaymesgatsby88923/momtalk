import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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
import { AuthStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { setSignupCredentials } from './signupDraft';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISPLAY_NAME_MAX = 50;
const PASSWORD_MIN = 6;

export function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayNameError, setDisplayNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const trimmedName = displayName.trim();
  const trimmedEmail = email.trim();
  const isFormEmpty =
    trimmedName.length === 0 ||
    trimmedEmail.length === 0 ||
    password.length === 0 ||
    confirmPassword.length === 0;
  const isContinueDisabled = isFormEmpty;

  const validateInputs = (): boolean => {
    let isValid = true;
    setDisplayNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (trimmedName.length === 0) {
      setDisplayNameError('Display name is required');
      isValid = false;
    } else if (trimmedName.length > DISPLAY_NAME_MAX) {
      setDisplayNameError(`Display name must be ${DISPLAY_NAME_MAX} characters or less`);
      isValid = false;
    }

    if (trimmedEmail.length === 0) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (password.length === 0) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < PASSWORD_MIN) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN} characters`);
      isValid = false;
    }

    if (confirmPassword.length === 0) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    if (!validateInputs()) {
      return;
    }

    setSignupCredentials({
      display_name: trimmedName,
      email: trimmedEmail,
      password,
    });
    navigation.navigate('Onboarding');
  };

  return (
    <ScreenContainer scroll contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.content}>
            <AppText variant="title" color="primary" style={styles.logo}>
              MomTalk
            </AppText>

            <AppText variant="title" style={styles.heading}>
              Join moms who get it
            </AppText>

            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              Create an account to start connecting with moms in your season.
            </AppText>

            <Pressable style={styles.googleButton} accessibilityRole="button">
              <Ionicons name="logo-google" size={18} color="#4285F4" />
              <AppText variant="subtitle" style={styles.googleButtonText}>
                Continue with Google
              </AppText>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color="textMuted" style={styles.dividerText}>
                or
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Display name
              </AppText>
              <View style={[styles.inputRow, displayNameError ? styles.inputRowError : undefined]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={displayName}
                  onChangeText={(value) => {
                    setDisplayName(value);
                    if (displayNameError) {
                      setDisplayNameError('');
                    }
                  }}
                  placeholder="How other moms will see you"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  style={styles.input}
                />
              </View>
              {displayNameError ? (
                <AppText variant="caption" color="error">
                  {displayNameError}
                </AppText>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Email
              </AppText>
              <View style={[styles.inputRow, emailError ? styles.inputRowError : undefined]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) {
                      setEmailError('');
                    }
                  }}
                  placeholder="you@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  style={styles.input}
                />
              </View>
              {emailError ? (
                <AppText variant="caption" color="error">
                  {emailError}
                </AppText>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Password
              </AppText>
              <View style={[styles.inputRow, passwordError ? styles.inputRowError : undefined]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (passwordError) {
                      setPasswordError('');
                    }
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword((current) => !current)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>
              {passwordError ? (
                <AppText variant="caption" color="error">
                  {passwordError}
                </AppText>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
                Confirm password
              </AppText>
              <View
                style={[styles.inputRow, confirmPasswordError ? styles.inputRowError : undefined]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (confirmPasswordError) {
                      setConfirmPasswordError('');
                    }
                  }}
                  placeholder="Re-enter your password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((current) => !current)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>
              {confirmPasswordError ? (
                <AppText variant="caption" color="error">
                  {confirmPasswordError}
                </AppText>
              ) : null}
            </View>

            <Pressable
              onPress={handleContinue}
              disabled={isContinueDisabled}
              style={[styles.loginButtonWrapper, isContinueDisabled && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isContinueDisabled }}
            >
              <LinearGradient
                colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <AppText variant="subtitle" color="white" style={styles.loginButtonText}>
                  Continue
                </AppText>
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color="textMuted" style={styles.dividerText}>
                Already have an account?
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={styles.createAccountButton}
              accessibilityRole="button"
            >
              <AppText variant="subtitle" color="primary" style={styles.createAccountText}>
                Log In
              </AppText>
            </Pressable>

            <AppText variant="caption" color="textSecondary" style={styles.supportText}>
              Need help?{' '}
              <AppText variant="caption" color="primary">
                Contact Support
              </AppText>
            </AppText>
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.base,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.soft,
  },
  googleButtonText: {
    fontWeight: theme.fontWeight.medium,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    paddingHorizontal: theme.spacing.xs,
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
  createAccountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  createAccountText: {
    fontWeight: theme.fontWeight.semibold,
  },
  supportText: {
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
