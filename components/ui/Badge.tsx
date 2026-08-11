import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { orderStatusConfig, tableStatusConfig } from '@/constants/status';
import { colors, radius } from '@/constants/theme';
import type { OrderStatus, TableStatus } from '@/types';

interface StatusBadgeProps {
  label: string;
  bg: string;
  color: string;
  dot?: string;
  size?: 'sm' | 'md';
}

function StatusBadge({ label, bg, color, dot, size = 'md' }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, size === 'sm' && styles.badgeSm, { backgroundColor: bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color }]}>{label}</Text>
    </View>
  );
}

export function TableStatusBadge({ status, size }: { status: TableStatus; size?: 'sm' | 'md' }) {
  const config = tableStatusConfig[status];
  return (
    <StatusBadge
      label={config.label}
      bg={config.bg}
      color={config.color}
      dot={config.dot}
      size={size}
    />
  );
}

export function OrderStatusBadge({ status, size }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const config = orderStatusConfig[status];
  return <StatusBadge label={config.label} bg={config.bg} color={config.color} size={size} />;
}

export function IconBadge({
  icon,
  label,
  color = colors.primary,
  bg = colors.primaryMuted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.iconBadge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.iconBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  textSm: { fontSize: 10 },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  iconBadgeText: { fontSize: 12, fontWeight: '600' },
});
