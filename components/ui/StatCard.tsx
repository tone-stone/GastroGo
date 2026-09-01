import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, typography } from '@/constants/legacyTheme';

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  bg: string;
  icon?: string;
}

export function StatCard({ label, value, color, bg }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  value: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  label: { ...typography.label, fontSize: 10 },
});
