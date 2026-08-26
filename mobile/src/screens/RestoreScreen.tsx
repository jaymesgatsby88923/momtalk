import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppScreen, AppText } from '../components';
import { RestoreStackParamList } from '../navigation/types';
import { ApiError } from '../services/api';
import { restoreService } from '../services/restoreService';
import { Affirmation } from '../types/affirmation';
import { JournalEntry, JournalVisibility } from '../types/journal';
import { formatJournalStarted } from '../utils/journalHelpers';
import { theme } from '../theme';

const FEELING_MAX = 100;
const DESCRIPTION_MAX = 500;

type NavigationProp = NativeStackNavigationProp<RestoreStackParamList, 'RestoreHome'>;

export function RestoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAffirmation, setSavingAffirmation] = useState(false);
  const [feeling, setFeeling] = useState('');
  const [description, setDescription] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [affirmationData, journalData] = await Promise.all([
        restoreService.getAffirmation(),
        restoreService.listEntries(),
      ]);
      setAffirmation(affirmationData);
      setEntries(journalData);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong loading Restore.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSaveAffirmation = async () => {
    if (!affirmation) {
      return;
    }

    setSavingAffirmation(true);
    try {
      await restoreService.saveAffirmation({ affirmation_id: affirmation.affirmation_id });
      Alert.alert('Saved', 'This reminder has been saved to your profile.');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not save this reminder.';
      Alert.alert('Error', message);
    } finally {
      setSavingAffirmation(false);
    }
  };

  const handleSubmit = async (visibility: JournalVisibility) => {
    const trimmedFeeling = feeling.trim();
    if (!trimmedFeeling) {
      Alert.alert('Feeling required', 'Please share how you feel before saving.');
      return;
    }

    setSubmitting(true);
    try {
      await restoreService.createEntry({
        feeling: trimmedFeeling,
        description: description.trim() || undefined,
        visibility,
      });
      setFeeling('');
      setDescription('');
      await loadData();
      Alert.alert(
        visibility === 'private' ? 'Saved privately' : 'Shared anonymously',
        visibility === 'private'
          ? 'Your entry was saved to your Restore journal.'
          : 'Your entry was saved to your journal and will appear on For You without your name.',
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not save your entry.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const oldestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  if (loading) {
    return (
      <AppScreen showLogo={false} centered>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll showLogo={false} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="cafe-outline" size={28} color="#BE185D" />
        </View>
        <AppText variant="title" style={styles.headerTitle}>
          Restore
        </AppText>
        <AppText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          A space to be real. You're not alone.
        </AppText>
      </View>

      {affirmation ? (
        <View style={styles.affirmationCard}>
          <View style={styles.affirmationHeader}>
            <Ionicons name="heart-outline" size={14} color="#BE185D" />
            <AppText variant="caption" style={styles.affirmationLabel}>
              A REMINDER FOR YOU
            </AppText>
          </View>
          <AppText variant="subtitle" style={styles.affirmationMessage}>
            {affirmation.message}
          </AppText>
          {affirmation.subtext ? (
            <AppText variant="body" color="textSecondary" style={styles.affirmationSubtext}>
              {affirmation.subtext}
            </AppText>
          ) : null}
          <Pressable
            onPress={handleSaveAffirmation}
            disabled={savingAffirmation}
            style={styles.saveReminderButton}
          >
            <Ionicons name="heart-outline" size={16} color="#BE185D" />
            <AppText variant="caption" style={styles.saveReminderText}>
              {savingAffirmation ? 'Saving...' : 'Save this reminder'}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="leaf-outline" size={16} color="#BE185D" />
          <AppText variant="subtitle">I feel...</AppText>
        </View>
        <TextInput
          value={feeling}
          onChangeText={setFeeling}
          placeholder="e.g., overwhelmed, lonely, exhausted..."
          placeholderTextColor={theme.colors.textMuted}
          maxLength={FEELING_MAX}
          style={styles.feelingInput}
        />
        <AppText variant="caption" color="textMuted" style={styles.charCount}>
          {feeling.length}/{FEELING_MAX}
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="body" color="textSecondary">
          Want to tell us a little more? (optional)
        </AppText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's on your heart?"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={DESCRIPTION_MAX}
          multiline
          textAlignVertical="top"
          style={styles.descriptionInput}
        />
        <AppText variant="caption" color="textMuted" style={styles.charCount}>
          {description.length}/{DESCRIPTION_MAX}
        </AppText>
      </View>

      <AppText variant="body" style={styles.choiceLabel}>
        What would you like to do with this?
      </AppText>

      <View style={styles.choiceRow}>
        <Pressable
          onPress={() => handleSubmit('private')}
          disabled={submitting}
          style={[styles.choiceCard, styles.privateCard]}
        >
          <Ionicons name="lock-closed-outline" size={22} color="#EA580C" />
          <AppText variant="subtitle" style={styles.choiceTitle}>
            Keep it private
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.choiceDescription}>
            Save this to your personal Restore journal.
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
            style={styles.choiceChevron}
          />
        </Pressable>

        <Pressable
          onPress={() => handleSubmit('anonymous')}
          disabled={submitting}
          style={[styles.choiceCard, styles.anonymousCard]}
        >
          <Ionicons name="heart-outline" size={22} color={theme.colors.primary} />
          <AppText variant="subtitle" style={styles.choiceTitle}>
            Share anonymously
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.choiceDescription}>
            Share your experience with other moms on For You without attaching your name.
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
            style={styles.choiceChevron}
          />
        </Pressable>
      </View>

      <View style={styles.journalCard}>
        <View style={styles.journalCardContent}>
          <View style={styles.journalIconWrap}>
            <Ionicons name="book-outline" size={24} color="#BE185D" />
          </View>
          <View style={styles.journalTextWrap}>
            <AppText variant="subtitle">Your Restore Journal</AppText>
            <AppText variant="caption" color="textSecondary" style={styles.journalSubtext}>
              Look back on the moments you've shared with yourself.
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.journalMeta}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              {oldestEntry ? ` · ${formatJournalStarted(oldestEntry.created_at)}` : ''}
            </AppText>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate('RestoreJournal')}
          style={styles.journalButton}
        >
          <AppText variant="caption" color="primary" style={styles.journalButtonText}>
            View your journal
          </AppText>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIconWrap: {
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    color: '#9F1239',
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    textAlign: 'center',
  },
  affirmationCard: {
    backgroundColor: '#FDF2F8',
    borderRadius: 20,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  affirmationLabel: {
    color: '#BE185D',
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  affirmationMessage: {
    color: '#881337',
    marginBottom: theme.spacing.sm,
  },
  affirmationSubtext: {
    marginBottom: theme.spacing.base,
  },
  saveReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  saveReminderText: {
    color: '#BE185D',
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  feelingInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
  descriptionInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    minHeight: 120,
    marginTop: theme.spacing.sm,
  },
  charCount: {
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  choiceLabel: {
    marginBottom: theme.spacing.md,
    fontWeight: theme.fontWeight.medium,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  choiceCard: {
    flex: 1,
    borderRadius: 16,
    padding: theme.spacing.base,
    minHeight: 160,
    borderWidth: 1,
  },
  privateCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  anonymousCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  choiceTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    fontSize: 15,
  },
  choiceDescription: {
    lineHeight: 18,
  },
  choiceChevron: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
  },
  journalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  journalCardContent: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.base,
  },
  journalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalTextWrap: {
    flex: 1,
  },
  journalSubtext: {
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
  journalMeta: {
    marginTop: 2,
  },
  journalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  journalButtonText: {
    fontWeight: theme.fontWeight.medium,
  },
});
