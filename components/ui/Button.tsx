import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, type PressableProps, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: '#FFF' },
  secondary: { bg: colors.coffee, text: '#FFF' },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.textSecondary },
  danger: { bg: colors.danger, text: '#FFF' },
};

export function Button({
  title,
  variant = 'primary',
  loading,
  size = 'md',
  icon,
  disabled,
  containerStyle,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => {
        const base: StyleProp<ViewStyle>[] = [
          styles.base,
          size === 'sm' && styles.sm,
          size === 'lg' && styles.lg,
          variant === 'primary' && shadows.md,
          {
            backgroundColor: v.bg,
            borderColor: v.border ?? v.bg,
            opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
            transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
          },
          variant === 'outline' && styles.outline,
          containerStyle,
        ];
        return base;
      }}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={v.text} /> : null}
          <Text style={[styles.text, { color: v.text }, size === 'sm' && styles.textSm]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36, gap: 6 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56, borderRadius: radius.lg },
  outline: { borderWidth: 1.5 },
  text: { ...typography.subheading, color: '#FFF' },
  textSm: { fontSize: 14 },
});
