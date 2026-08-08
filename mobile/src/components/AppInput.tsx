import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../theme';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, error ? styles.inputError : undefined, style]}
      />
      {error ? (
        <AppText variant="caption" color="error" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
});
