import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { ReactionType } from '../types/post';
import { theme } from '../theme';

export const REACTIONS: Array<{
  type: ReactionType;
  label: string;
  source: ImageSourcePropType;
  color: string;
}> = [
  {
    type: 'im_here',
    label: "I'm Here",
    source: require('../../assets/reaction-im-here.png'),
    color: theme.colors.reactionImHere,
  },
  {
    type: 'me_too',
    label: 'Me Too',
    source: require('../../assets/reaction-me-too.png'),
    color: theme.colors.reactionMeToo,
  },
  {
    type: 'you_got_this',
    label: 'You Got This',
    source: require('../../assets/reaction-you-got-this.png'),
    color: theme.colors.reactionYouGotThis,
  },
  {
    type: 'love_this',
    label: 'Love This',
    source: require('../../assets/reaction-love-this.png'),
    color: theme.colors.reactionLoveThis,
  },
];

export type ReactionCounts = {
  im_here?: number | null;
  me_too?: number | null;
  you_got_this?: number | null;
  love_this?: number | null;
};

type ReactionBarProps = {
  counts: ReactionCounts;
  commentCount?: number;
  myReaction?: ReactionType | null;
  onReact?: (type: ReactionType) => void;
};

function countFor(counts: ReactionCounts, type: ReactionType): number {
  return counts[type] ?? 0;
}

export function ReactionBar({
  counts,
  commentCount,
  myReaction = null,
  onReact,
}: ReactionBarProps) {
  return (
    <View style={styles.row}>
      {REACTIONS.map((reaction) => {
        const selected = myReaction === reaction.type;
        const count = countFor(counts, reaction.type);

        return (
          <Pressable
            key={reaction.type}
            onPress={onReact ? () => onReact(reaction.type) : undefined}
            disabled={!onReact}
            accessibilityRole={onReact ? 'button' : 'text'}
            accessibilityLabel={`${reaction.label}, ${count}`}
            accessibilityState={{ selected }}
            hitSlop={4}
            style={({ pressed }) => [
              styles.item,
              pressed && onReact ? styles.itemPressed : undefined,
            ]}
          >
            <Image source={reaction.source} style={styles.icon} resizeMode="contain" />
            <AppText variant="caption" style={styles.label} numberOfLines={1}>
              {reaction.label}
            </AppText>
            <AppText
              variant="caption"
              color={selected ? undefined : 'textSecondary'}
              style={
                selected
                  ? { color: reaction.color, fontWeight: theme.fontWeight.bold }
                  : undefined
              }
            >
              {count}
            </AppText>
          </Pressable>
        );
      })}

      <View style={styles.item}>
        <AppText style={styles.commentIcon}>💬</AppText>
        <AppText variant="caption" color="textSecondary">
          {commentCount ?? 0}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  itemPressed: {
    opacity: 0.7,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  commentIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
});
