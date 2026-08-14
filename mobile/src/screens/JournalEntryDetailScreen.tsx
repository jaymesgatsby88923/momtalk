import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppScreen, AppText, PrimaryButton } from '../components';
import { RestoreStackParamList } from '../navigation/types';
import { ApiError } from '../services/api';
import { restoreService } from '../services/restoreService';
import { JournalEntry, JournalVisibility } from '../types/journal';
import { formatJournalDate, getFeelingColors } from '../utils/journalHelpers';
import { theme } from '../theme';

const FEELING_MAX = 100;
const DESCRIPTION_MAX = 500;

type DetailRouteProp = RouteProp<RestoreStackParamList, 'JournalEntryDetail'>;
type NavigationProp = NativeStackNavigationProp<RestoreStackParamList, 'JournalEntryDetail'>;

export function JournalEntryDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { journalEntryId } = route.params;

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feeling, setFeeling] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<JournalVisibility>('private');

  const loadEntry = useCallback(async () => {
    setLoading(true);
    try {
      const data = await restoreService.getEntry(journalEntryId);
      setEntry(data);
      setFeeling(data.feeling);
      setDescription(data.description ?? '');
      setVisibility(data.visibility);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load this entry.';
      Alert.alert('Error', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  }, [journalEntryId, navigation]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleSave = async () => {
    const trimmedFeeling = feeling.trim();
    if (!trimmedFeeling) {
      Alert.alert('Feeling required', 'Please enter how you feel.');
      return;
    }

    setSaving(true);
    try {
      const updated = await restoreService.updateEntry(journalEntryId, {
        feeling: trimmedFeeling,
        description: description.trim() || undefined,
        visibility,
      });
      setEntry(updated);
      Alert.alert('Saved', 'Your journal entry has been updated.');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not update this entry.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete entry', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await restoreService.deleteEntry(journalEntryId);
            navigation.goBack();
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Could not delete this entry.';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  };

  if (loading || !entry) {
    return (
      <AppScreen showLogo={false} centered>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppScreen>
    );
  }

  const feelingColors = getFeelingColors(feeling);
  const dateParts = formatJournalDate(entry.created_at);

  return (
    <AppScreen scroll showLogo={false} contentStyle={styles.screenContent}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
      </Pressable>

      <AppText variant="caption" color="textMuted" style={styles.dateText}>
        {dateParts.label}
        {dateParts.sublabel ? ` · ${dateParts.sublabel}` : ''}
      </AppText>

      <View style={styles.feelingRow}>
        <AppText variant="caption" color="textSecondary">
          I feel...
        </AppText>
        <View style={[styles.feelingBadge, { backgroundColor: feelingColors.bg }]}>
          <AppText variant="caption" style={{ color: feelingColors.text, fontWeight: '500' }}>
            {feeling || '—'}
          </AppText>
        </View>
      </View>

      <AppText variant="body" color="textSecondary" style={styles.label}>
        Feeling
      </AppText>
      <TextInput
        value={feeling}
        onChangeText={setFeeling}
        maxLength={FEELING_MAX}
        style={styles.input}
      />

      <AppText variant="body" color="textSecondary" style={styles.label}>
        Description (optional)
      </AppText>
      <TextInput
        value={description}
        onChangeText={setDescription}
        maxLength={DESCRIPTION_MAX}
        multiline
        textAlignVertical="top"
        style={styles.textArea}
      />

      <AppText variant="body" color="textSecondary" style={styles.label}>
        Visibility
      </AppText>
      <View style={styles.visibilityRow}>
        <Pressable
          onPress={() => setVisibility('private')}
          style={[styles.visibilityOption, visibility === 'private' && styles.visibilitySelected]}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#EA580C" />
          <AppText variant="caption">Private</AppText>
        </Pressable>
        <Pressable
          onPress={() => setVisibility('anonymous')}
          style={[
            styles.visibilityOption,
            visibility === 'anonymous' && styles.visibilitySelected,
          ]}
        >
          <Ionicons name="heart-outline" size={18} color={theme.colors.primary} />
          <AppText variant="caption">Share anonymously</AppText>
        </Pressable>
      </View>

      <PrimaryButton
        title={saving ? 'Saving...' : 'Save changes'}
        onPress={handleSave}
        disabled={saving}
        style={styles.saveButton}
      />

      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <AppText variant="body" color="error">
          Delete entry
        </AppText>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: theme.spacing.xl,
  },
  backButton: {
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  dateText: {
    marginBottom: theme.spacing.md,
  },
  feelingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  feelingBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.base,
  },
  textArea: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    minHeight: 120,
    marginBottom: theme.spacing.base,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  visibilitySelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.chipPurpleBg,
  },
  saveButton: {
    marginBottom: theme.spacing.base,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
});
