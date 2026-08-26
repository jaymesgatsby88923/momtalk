import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { JournalFeedItem } from '../types/journal';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { theme } from '../theme';

type FeelingCardProps = {
  entry: JournalFeedItem;
};

export function FeelingCard({ entry }: FeelingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const timestamp = entry.created_at ? formatTimeAgo(entry.created_at) : '';
  const hasDescription = Boolean(entry.description);

  return (
    <Pressable
      onPress={hasDescription ? () => setExpanded((current) => !current) : undefined}
      style={({ pressed }) => [styles.card, pressed && hasDescription ? styles.pressed : undefined]}
    >
      <View style={styles.metaRow}>
        <AppText variant="caption" color="textSecondary" style={styles.anonymous}>
          Anonymous
        </AppText>
        {entry.parent_stage ? (
          <View style={styles.stageChip}>
            <AppText variant="caption" color="primary" style={styles.stageText}>
              {entry.parent_stage}
            </AppText>
          </View>
        ) : null}
        {timestamp ? (
          <AppText variant="caption" color="textMuted">
            {timestamp}
          </AppText>
        ) : null}
      </View>

      <AppText variant="subtitle" style={styles.feeling}>
        {entry.feeling}
      </AppText>

      {entry.description ? (
        <AppText
          variant="body"
          color="textSecondary"
          numberOfLines={expanded ? undefined : 3}
          style={styles.description}
        >
          {entry.description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    ...theme.shadows.soft,
  },
  pressed: {
    opacity: 0.92,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  anonymous: {
    fontWeight: theme.fontWeight.semibold,
  },
  stageChip: {
    backgroundColor: theme.colors.chipPurpleBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  stageText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },
  feeling: {
    marginBottom: theme.spacing.sm,
  },
  description: {
    lineHeight: 20,
  },
});
