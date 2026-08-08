import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  centered?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function ScreenContainer({
  children,
  scroll = false,
  centered = false,
  style,
  contentStyle,
}: ScreenContainerProps) {
  const contentStyles = [
    styles.content,
    centered && styles.centered,
    contentStyle,
  ];

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyles}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyles}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.base,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
