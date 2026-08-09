import { ReactNode } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

// Bundled at build time — path must match the file in mobile/assets/
const LOGO = require('../../assets/Momtalk-Logo.png');

export type AppScreenProps = {
  children: ReactNode;
  /** When true, wraps children in a vertical ScrollView instead of a plain View */
  scroll?: boolean;
  /** Centers children vertically and horizontally — useful for auth and empty states */
  centered?: boolean;
  /** Shows the MomTalk logo in the top-left. Defaults to true for main app screens */
  showLogo?: boolean;
  /** Optional slot below the logo — e.g. Home feed tabs */
  header?: ReactNode;
  /** Which screen edges respect safe area insets. Tab screens usually only need 'top' */
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function AppScreen({
  children,
  scroll = false,
  centered = false,
  showLogo = true,
  header,
  edges = ['top'],
  style,
  contentStyle,
}: AppScreenProps) {
  const contentStyles = [
    styles.content,
    centered && styles.centered,
    contentStyle,
  ];

  // Fixed top section: logo sits above any custom header content
  const topBar = showLogo || header ? (
    <View style={styles.topBar}>
      {showLogo ? (
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      ) : null}
      {header}
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      {topBar}

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
  topBar: {
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.sm,
  },
  logo: {
    width: 120,
    height: 32,
    marginBottom: theme.spacing.sm,
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
