import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppScreen, AppText } from '../components';
import { RestoreStackParamList } from '../navigation/types';
import { restoreService } from '../services/restoreService';
import { JournalEntry } from '../types/journal';
import { formatJournalDate, getFeelingColors } from '../utils/journalHelpers';
import { theme } from '../theme';

type NavigationProp = NativeStackNavigationProp<RestoreStackParamList, 'RestoreJournal'>;

function JournalEntryCard({
  entry,
  onPress,
}: {
  entry: JournalEntry;
  onPress: () => void;
}) {
  const feelingColors = getFeelingColors(entry.feeling);
  const dateParts = formatJournalDate(entry.created_at);

  return (
    <Pressable onPress={onPress} style={styles.entryCard}>
      <AppText variant="caption" color="textMuted" style={styles.entryDate}>
        {dateParts.label}
        {dateParts.sublabel ? ` · ${dateParts.sublabel}` : ''}
      </AppText>

      <View style={styles.entryHeader}>
        <AppText variant="caption" color="textSecondary">
          I feel...
        </AppText>
        <View style={[styles.feelingBadge, { backgroundColor: feelingColors.bg }]}>
          <AppText variant="caption" style={[styles.feelingText, { color: feelingColors.text }]}>
            {entry.feeling}
          </AppText>
        </View>
      </View>

      {entry.description ? (
        <AppText variant="body" color="textSecondary" style={styles.entryDescription}>
          {entry.description}
        </AppText>
      ) : null}

      <View style={styles.entryFooter}>
        <Ionicons
          name={entry.visibility === 'private' ? 'lock-closed-outline' : 'share-outline'}
          size={14}
          color="#BE185D"
        />
        <AppText variant="caption" style={styles.visibilityText}>
          {entry.visibility === 'private' ? 'Private' : 'Shared anonymously'}
        </AppText>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.textMuted}
        style={styles.chevron}
      />
    </Pressable>
  );
}

export function RestoreJournalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await restoreService.listEntries();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  return (
    <AppScreen showLogo={false} contentStyle={styles.screenContent}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
      </Pressable>

      <AppText variant="title" style={styles.title}>
        Your Restore Journal
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.subtitle}>
        A place to remember where you've been.
      </AppText>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.journal_entry_id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.timelineRow}>
              <View style={styles.timelineLine}>
                <View style={styles.timelineDot} />
              </View>
              <View style={styles.entryWrap}>
                <JournalEntryCard
                  entry={item}
                  onPress={() =>
                    navigation.navigate('JournalEntryDetail', {
                      journalEntryId: item.journal_entry_id,
                    })
                  }
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <AppText variant="body" color="textSecondary">
                No journal entries yet.
              </AppText>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: 0,
  },
  backButton: {
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  title: {
    color: '#9F1239',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.lg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.base,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#BE185D',
  },
  entryWrap: {
    flex: 1,
  },
  entryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
    position: 'relative',
  },
  entryDate: {
    marginBottom: theme.spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  feelingBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
  },
  feelingText: {
    fontWeight: theme.fontWeight.medium,
  },
  entryDescription: {
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visibilityText: {
    color: '#BE185D',
  },
  chevron: {
    position: 'absolute',
    right: theme.spacing.base,
    top: theme.spacing.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
});
