import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useSignOut } from '@/components/navigation/NavButtons';
import { colors, radius, shadows } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';

export function UserMenu({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const confirmSignOut = useSignOut();

  const { user, restaurants, activeRestaurantId, isDemo } = useSessionStore();
  const restaurant = restaurants.find((r) => r.id === activeRestaurantId);

  const goToSettings = () => {
    setOpen(false);
    router.push('/(app)/(tabs)/settings');
  };

  const handleSignOut = () => {
    setOpen(false);
    confirmSignOut();
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, compact && styles.triggerCompact, pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Menú de usuario"
      >
        <Avatar name={user?.full_name ?? 'U'} size={compact ? 32 : 36} />
        {!compact ? <Ionicons name="chevron-down" size={14} color={colors.textMuted} /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.menu, { marginTop: insets.top + 56, marginRight: 16 }, shadows.md]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.profile}>
              <Avatar name={user?.full_name ?? 'U'} size={44} />
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{user?.full_name}</Text>
                <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
                {isDemo ? (
                  <View style={styles.demoBadge}>
                    <Text style={styles.demoText}>Modo demo</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {restaurant ? (
              <View style={styles.restaurant}>
                <Ionicons name="storefront-outline" size={16} color={colors.primary} />
                <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <MenuItem
              icon="grid-outline"
              label="Mesas"
              onPress={() => { setOpen(false); router.push('/(app)/(tabs)'); }}
            />
            <MenuItem
              icon="receipt-outline"
              label="Órdenes activas"
              onPress={() => { setOpen(false); router.push('/(app)/(tabs)/orders'); }}
            />
            <MenuItem icon="settings-outline" label="Ajustes" onPress={goToSettings} />

            <View style={styles.divider} />

            <MenuItem
              icon="log-out-outline"
              label="Cerrar sesión"
              onPress={handleSignOut}
              destructive
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? colors.danger : colors.text;
  return (
    <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.textSecondary} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {!destructive ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  triggerPressed: { opacity: 0.85 },
  triggerCompact: { paddingRight: 4, borderWidth: 0, backgroundColor: 'transparent' },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'flex-end',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 8,
    minWidth: 260,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary },
  demoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 4,
  },
  demoText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  restaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 4,
    padding: 10,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
  },
  restaurantName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  menuItemPressed: { backgroundColor: colors.background },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
});
