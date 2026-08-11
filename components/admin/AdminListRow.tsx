import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

interface AdminListRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  avatarColor?: string;
  avatarText?: string;
  onPress?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  toggleActive?: boolean;
}

export function AdminListRow({
  title,
  subtitle,
  badge,
  badgeColor = colors.primary,
  avatarColor,
  avatarText,
  onPress,
  onDelete,
  onToggle,
  toggleActive,
}: AdminListRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      {avatarText ? (
        <View style={[styles.avatar, { backgroundColor: avatarColor ?? colors.primary }]}>
          <Text style={styles.avatarText}>{avatarText}</Text>
        </View>
      ) : null}
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: `${badgeColor}18` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      ) : null}
      {onToggle ? (
        <Pressable onPress={onToggle} hitSlop={8} style={styles.actionBtn}>
          <Ionicons
            name={toggleActive ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={toggleActive ? colors.success : colors.textMuted}
          />
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pressed: { opacity: 0.9 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionBtn: { padding: 4 },
});
