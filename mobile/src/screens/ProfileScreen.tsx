import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppInput, AppText, PrimaryButton, ScreenContainer } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useCurrentUser, useUpdateProfile } from '../hooks/useCurrentUser';
import { ApiError } from '../services/api';
import { theme } from '../theme';

const DISPLAY_NAME_MAX_LENGTH = 50;

function formatLabel(value?: string | null): string {
  if (!value) {
    return 'Not set';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

type ProfileFieldProps = {
  label: string;
  value: string;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
        {label}
      </AppText>
      <AppText variant="subtitle">{value}</AppText>
    </View>
  );
}

export function ProfileScreen() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { data: profile, isLoading, error, refetch, isRefetching } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (profile && !isEditing) {
      setDisplayName(profile.display_name);
    }
  }, [profile, isEditing]);

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      logout();
    }
  }, [error, logout]);

  const validateDisplayName = (value: string): boolean => {
    const trimmed = value.trim();

    if (!trimmed) {
      setDisplayNameError('Display name is required');
      return false;
    }

    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
      setDisplayNameError(`Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or less`);
      return false;
    }

    setDisplayNameError('');
    return true;
  };

  const handleStartEditing = () => {
    if (!profile) {
      return;
    }

    setDisplayName(profile.display_name);
    setDisplayNameError('');
    setSaveError('');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (profile) {
      setDisplayName(profile.display_name);
    }

    setDisplayNameError('');
    setSaveError('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!validateDisplayName(displayName)) {
      return;
    }

    setSaveError('');

    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      setIsEditing(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }

      const message =
        err instanceof ApiError ? err.message : 'Something went wrong saving your profile.';
      setSaveError(message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderContent = () => {
    if (authLoading || !isAuthenticated) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (isLoading && !profile) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error && !profile) {
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong loading your profile.';

      return (
        <View style={styles.centered}>
          <AppText variant="body" color="error" style={styles.errorText}>
            {message}
          </AppText>
          <Pressable onPress={() => refetch()} style={styles.retryButton}>
            <AppText variant="body" color="primary">
              Try again
            </AppText>
          </Pressable>
        </View>
      );
    }

    if (!profile) {
      return null;
    }

    return (
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <AppText variant="title">Profile</AppText>
          {!isEditing ? (
            <Pressable
              onPress={handleStartEditing}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <AppText variant="body" color="primary" style={styles.editButtonText}>
                Edit
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          {isEditing ? (
            <AppInput
              label="Display name"
              value={displayName}
              onChangeText={(value) => {
                setDisplayName(value);
                if (displayNameError) {
                  setDisplayNameError('');
                }
              }}
              placeholder="How should we call you?"
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              autoCapitalize="words"
              error={displayNameError}
            />
          ) : (
            <ProfileField label="Display name" value={profile.display_name} />
          )}

          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Parent type" value={formatLabel(profile.parent_type)} />
          <ProfileField label="Parent stage" value={formatLabel(profile.parent_stage)} />
        </View>

        {saveError ? (
          <AppText variant="caption" color="error" style={styles.formMessage}>
            {saveError}
          </AppText>
        ) : null}

        {isEditing ? (
          <View style={styles.editActions}>
            <PrimaryButton
              title="Save"
              onPress={handleSave}
              loading={updateProfile.isPending}
              disabled={updateProfile.isPending}
              style={styles.actionButton}
            />
            <Pressable
              onPress={handleCancelEditing}
              disabled={updateProfile.isPending}
              style={styles.cancelButton}
              accessibilityRole="button"
            >
              <AppText variant="subtitle" color="primary">
                Cancel
              </AppText>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
          <AppText variant="subtitle" color="error">
            Log out
          </AppText>
        </Pressable>

        {isRefetching ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.refreshIndicator}
          />
        ) : null}
      </View>
    );
  };

  return (
    <ScreenContainer scroll contentStyle={styles.screenContent}>
      {renderContent()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    gap: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    minHeight: 240,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  editButtonText: {
    fontWeight: theme.fontWeight.medium,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.base,
    gap: theme.spacing.base,
    ...theme.shadows.soft,
  },
  field: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    fontWeight: theme.fontWeight.semibold,
  },
  editActions: {
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.base,
  },
  formMessage: {
    textAlign: 'center',
  },
  retryButton: {
    padding: theme.spacing.sm,
  },
  refreshIndicator: {
    marginTop: theme.spacing.sm,
  },
});
