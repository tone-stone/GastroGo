import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { UserMenu } from '@/components/navigation/UserMenu';
import { colors, radius } from '@/constants/theme';
import { ROLE_LABELS } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export function MainHeader() {
  const { loginMode, role, staffMemberId, user } = useSessionStore();
  const getStaff = usePosStore((s) => s.getStaff);

  const isSaleMode = loginMode === 'sale';
  const isWaiterMode = loginMode === 'waiter';
  const showPosBrand = isSaleMode || isWaiterMode || role === 'waiter' || role === 'cashier';

  const waiter = staffMemberId ? getStaff(staffMemberId) : null;
  const displayName = isSaleMode
    ? user?.full_name ?? 'Cajero'
    : waiter?.name ?? user?.full_name ?? 'Mesero';
  const roleLabel = isSaleMode ? ROLE_LABELS.cashier : ROLE_LABELS.waiter;
  const screenTitle = isSaleMode ? 'Venta' : isWaiterMode ? 'Mesero' : 'Punto de venta';

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="restaurant" size={20} color="#FFF" />
        </View>
        {showPosBrand ? (
          <View style={styles.brandText}>
            <Text style={styles.appName}>GastroGo</Text>
            <Text style={styles.screenTitle}>{screenTitle}</Text>
          </View>
        ) : null}
      </View>

      {(isSaleMode || (isWaiterMode && waiter)) ? (
        <View
          style={[
            styles.staffChip,
            isWaiterMode && waiter
              ? { backgroundColor: `${waiter.color}18`, borderColor: waiter.color }
              : styles.cashierChip,
          ]}
        >
          <View
            style={[
              styles.staffDot,
              isWaiterMode && waiter
                ? { backgroundColor: waiter.color }
                : { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.staffDotText}>
              {displayName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </Text>
          </View>
          <View>
            <Text style={styles.staffRole}>{roleLabel}</Text>
            <Text style={styles.staffName} numberOfLines={1}>{displayName}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.spacer} />
      )}

      <UserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { gap: 0 },
  appName: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
  screenTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  spacer: { flex: 1 },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: 140,
  },
  cashierChip: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryLight,
  },
  staffDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffDotText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  staffRole: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  staffName: { fontSize: 12, fontWeight: '700', color: colors.text },
});
