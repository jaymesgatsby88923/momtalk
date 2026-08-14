import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { theme } from '../theme';
import { MainTabParamList } from './types';

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<
  keyof MainTabParamList,
  { icon: TabIconName; activeIcon: TabIconName; label: string }
> = {
  Home: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  Communities: { icon: 'people-outline', activeIcon: 'people', label: 'Communities' },
  Post: { icon: 'create-outline', activeIcon: 'create', label: 'Post' },
  Restore: { icon: 'cafe-outline', activeIcon: 'cafe', label: 'Restore' },
  Profile: { icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name as keyof MainTabParamList];
        const isPostTab = route.name === 'Post';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        if (isPostTab) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.fabSlot}
              accessibilityRole="button"
              accessibilityLabel="Create post"
            >
              <View style={styles.fab}>
                <Ionicons
                  name="create-outline"
                  size={24}
                  color={theme.colors.white}
                />
              </View>
              <AppText
                variant="caption"
                color={isFocused ? 'primary' : 'textMuted'}
                style={styles.tabLabel}
              >
                {config.label}
              </AppText>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
          >
            <Ionicons
              name={isFocused ? config.activeIcon : config.icon}
              size={22}
              color={isFocused ? theme.colors.primary : theme.colors.textMuted}
            />
            <AppText
              variant="caption"
              color={isFocused ? 'primary' : 'textMuted'}
              style={styles.tabLabel}
            >
              {config.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -theme.spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  tabLabel: {
    fontSize: theme.fontSize.caption,
  },
});
