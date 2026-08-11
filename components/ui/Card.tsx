import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { colors, radius, shadows } from '@/constants/theme';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
}

export function Card({ title, subtitle, children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
});
