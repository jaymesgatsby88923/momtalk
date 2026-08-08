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
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { ApiError } from '../../services/api';
import { theme } from '../../theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const trimmedEmail = email.trim();
  const isFormEmpty = trimmedEmail.length === 0 || password.length === 0;
  const isLoginDisabled = isFormEmpty || loading;

  const validateInputs = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    // Empty field validation
    if (trimmedEmail.length === 0) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      // Invalid email format validation
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (password.length === 0) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('Login request payload:', { email: trimmedEmail });

      const response = await login({ email: trimmedEmail, password });

      console.log('Login API response:', response);
      setSuccessMessage('Login successful');
    } catch (error) {
      console.log('Login API error:', error);

      if (isNetworkError(error)) {
        // Network error: server unreachable or no internet connection
        setErrorMessage(
          'Unable to reach the server. Check your connection and try again.',
        );
        return;
      }

      if (error instanceof ApiError) {
        // Incorrect credentials (401) or bad request (400)
        if (error.status === 401 || error.status === 400) {
          setErrorMessage('Invalid email or password');
          return;
        }

        // Unexpected server error (500+)
        if (error.status >= 500) {
          setErrorMessage('Something went wrong on our end. Please try again later.');
          return;
        }

        setErrorMessage(error.message);
        return;
      }

      // Fallback for unexpected errors
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
            <AppText variant="title" color="primary" style={styles.logo}>
              MomTalk
            </AppText>

            <AppText variant="title" style={styles.heading}>
              Welcome back!
            </AppText>

            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              Log in to continue connecting with moms who get it.
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
              <View
                style={[styles.inputRow, passwordError ? styles.inputRowError : undefined]}
              >
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
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
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

            <AppText variant="caption" color="primary" style={styles.forgotPassword}>
              Forgot password?
            </AppText>

            {errorMessage ? (
              <AppText variant="caption" color="error" style={styles.formMessage}>
                {errorMessage}
              </AppText>
            ) : null}

            {successMessage ? (
              <AppText
                variant="caption"
                color="chipGreenText"
                style={styles.formMessage}
              >
                {successMessage}
              </AppText>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={isLoginDisabled}
              style={[styles.loginButtonWrapper, isLoginDisabled && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoginDisabled }}
            >
              <LinearGradient
                colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <AppText variant="subtitle" color="white" style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'Log In'}
                </AppText>
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color="textMuted" style={styles.dividerText}>
                New to MomTalk?
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => navigation.navigate('Signup')}
              style={styles.createAccountButton}
              accessibilityRole="button"
            >
              <AppText variant="subtitle" color="primary" style={styles.createAccountText}>
                Create an Account
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
  forgotPassword: {
    alignSelf: 'flex-end',
    fontWeight: theme.fontWeight.medium,
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

/*
 * Error handling summary
 *
 * 1. Empty fields
 *    Detected in validateInputs() when email or password is blank before the API call.
 *
 * 2. Invalid email format
 *    Detected in validateInputs() with EMAIL_REGEX before the API call.
 *
 * 3. Incorrect credentials (401/400)
 *    Detected when authService throws ApiError with status 401 or 400.
 *
 * 4. Network errors
 *    Detected when fetch fails (TypeError or "Network request failed" message).
 *
 * 5. Unexpected server errors (500+)
 *    Detected when authService throws ApiError with status >= 500.
 *
 * access_token persistence:
 * useAuth().login() stores the token in AsyncStorage via setStoredToken().
 */
