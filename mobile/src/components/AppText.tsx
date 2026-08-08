import { Text, TextProps, TextStyle } from 'react-native';
import { ColorKey, TypographyVariant, theme } from '../theme';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorKey;
  style?: TextStyle;
};

export function AppText({
  variant = 'body',
  color,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        theme.typography[variant],
        color ? { color: theme.colors[color] } : undefined,
        style,
      ]}
    />
  );
}