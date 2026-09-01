import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSignOut } from '@/components/navigation/NavButtons';
import { Avatar, SectionHeader } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isAdminRole, ROLE_LABELS } from '@/lib/roles';
import { colors, radius, shadows, typography } from '@/constants/legacyTheme';
import { useSessionStore } from '@/stores/sessionStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, restaurants, activeRestaurantId, setActiveRestaurant, isDemo, role } =
    useSessionStore();
  const confirmSignOut = useSignOut();

  return (
    <Screen scroll>
      <AppHeader title="Ajustes" subtitle="Perfil y configuración del local" />

      <View style={styles.profileCard}>
        <Avatar name={user?.full_name ?? 'U'} size={56} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.tags}>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{ROLE_LABELS[role] ?? role}</Text>
            </View>
            {isDemo ? (
              <View style={[styles.roleTag, styles.demoTag]}>
                <Ionicons name="sparkles" size={10} color={colors.primary} />
                <Text style={[styles.roleText, { color: colors.primary }]}>Demo</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <SectionHeader title="Sucursal activa" />
      <View style={styles.section}>
        {restaurants.map((r) => {
          const active = activeRestaurantId === r.id;
          return (
            <Pressable
              key={r.id}
              style={[styles.restaurant, active && styles.restaurantActive]}
              onPress={() => setActiveRestaurant(r.id)}
            >
              <View style={[styles.restaurantIcon, active && styles.restaurantIconActive]}>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.restaurantInfo}>
                <Text style={[styles.restaurantName, active && styles.restaurantNameActive]}>
                  {r.name}
                </Text>
                {r.address ? <Text style={styles.restaurantAddress}>{r.address}</Text> : null}
                {r.phone ? <Text style={styles.restaurantPhone}>{r.phone}</Text> : null}
              </View>
              {active ? (
                <View style={styles.checkWrap}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </Pressable>
          );
        })}
      </View>

      {isAdminRole(role) ? (
        <>
          <SectionHeader title="Administración" />
          <Pressable style={styles.adminLink} onPress={() => router.push('/admin')}>
            <View style={styles.adminLinkIcon}>
              <Ionicons name="shield-outline" size={22} color={colors.coffee} />
            </View>
            <View style={styles.adminLinkInfo}>
              <Text style={styles.adminLinkTitle}>Panel administrativo</Text>
              <Text style={styles.adminLinkSub}>Usuarios, mesas, menú y staff</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </>
      ) : null}

      <SectionHeader title="Sistema" />
      <View style={styles.systemCard}>
        <View style={styles.systemRow}>
          <Ionicons
            name={isSupabaseConfigured ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={20}
            color={isSupabaseConfigured ? colors.success : colors.warning}
          />
          <View style={styles.systemInfo}>
            <Text style={styles.systemLabel}>Backend</Text>
            <Text style={styles.systemValue}>
              {isSupabaseConfigured ? 'Supabase conectado' : 'Modo demo local'}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.systemRow}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.textMuted} />
          <View style={styles.systemInfo}>
            <Text style={styles.systemLabel}>Versión</Text>
            <Text style={styles.systemValue}>GastroGo 1.0.0 MVP</Text>
          </View>
        </View>
      </View>

      <Button
        title="Cerrar sesión"
        variant="outline"
        icon="log-out-outline"
        onPress={confirmSignOut}
        containerStyle={styles.logoutBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  demoTag: { backgroundColor: colors.primaryMuted },
  roleText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  section: { gap: 10, marginBottom: 24 },
  restaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  restaurantActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantIconActive: { backgroundColor: colors.surface },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: '600', color: colors.text },
  restaurantNameActive: { color: colors.primaryDark },
  restaurantAddress: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  restaurantPhone: { fontSize: 12, color: colors.textMuted },
  checkWrap: { marginLeft: 4 },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.coffeeMuted,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminLinkInfo: { flex: 1 },
  adminLinkTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  adminLinkSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  systemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  systemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  systemInfo: { flex: 1 },
  systemLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  systemValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: 14 },
  logoutBtn: { marginTop: 8 },
});
