import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PaletteSelector } from '@/components/theme/PaletteSelector';
import { useTheme } from '@/components/theme/ThemeProvider';
import { UserMenu } from '@/components/navigation/UserMenu';
import { radius, space, type Palette } from '@/constants/theme';
import { useSearchStore } from '@/stores/searchStore';
import { useSessionStore } from '@/stores/sessionStore';

const ROUTE_TITLES: { match: (p: string) => boolean; title: string; subtitle: string }[] = [
  { match: (p) => p === '/' || p === '', title: 'Caja', subtitle: 'Cobro rápido · efectivo, terminal y billeteras' },
  { match: (p) => p === '/mesero', title: 'Mesas', subtitle: 'Mapa de mesas y canales' },
  { match: (p) => p.startsWith('/table/'), title: 'Comanda', subtitle: 'Menú, resumen y canal activo' },
  { match: (p) => p.startsWith('/kitchen'), title: 'Cocina', subtitle: 'Comandas en preparación' },
  { match: (p) => p === '/orders', title: 'Órdenes', subtitle: 'Historial y seguimiento' },
  { match: (p) => p.startsWith('/corte'), title: 'Corte de caja', subtitle: 'Cierre de turno y efectivo' },
  { match: (p) => p === '/admin/users', title: 'Usuarios', subtitle: 'Personal con acceso al sistema' },
  { match: (p) => p === '/admin/staff', title: 'Meseros y staff', subtitle: 'Equipo en turno' },
  { match: (p) => p === '/admin/tables', title: 'Mesas', subtitle: 'Zonas y capacidad' },
  { match: (p) => p === '/admin/menu', title: 'Menú', subtitle: 'Platillos y categorías' },
  { match: (p) => p.startsWith('/admin'), title: 'Admin', subtitle: 'Configuración del restaurante' },
  { match: (p) => p === '/settings', title: 'Ajustes', subtitle: 'Tu cuenta y preferencias' },
];

const SEARCH_PLACEHOLDER = 'Buscar mesa, orden o platillo';

function useScreenInfo() {
  const pathname = usePathname();
  return ROUTE_TITLES.find((r) => r.match(pathname)) ?? { title: 'GastroGo', subtitle: '' };
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return { time };
}

function BranchSelector() {
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const restaurants = useSessionStore((s) => s.restaurants);
  const activeRestaurantId = useSessionStore((s) => s.activeRestaurantId);
  const setActiveRestaurant = useSessionStore((s) => s.setActiveRestaurant);
  const active = restaurants.find((r) => r.id === activeRestaurantId);

  return (
    <View>
      <Pressable style={styles.branchBtn} onPress={() => setOpen((v) => !v)}>
        <Ionicons name="storefront-outline" size={15} color={theme.mut} />
        <Text style={styles.branchText} numberOfLines={1}>{active?.name ?? 'GastroGo'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={theme.mut} />
      </Pressable>
      {open ? (
        <>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.branchMenu}>
            {restaurants.map((r) => (
              <Pressable
                key={r.id}
                style={styles.branchItem}
                onPress={() => {
                  setActiveRestaurant(r.id);
                  setOpen(false);
                }}
              >
                <Text style={[styles.branchItemText, r.id === activeRestaurantId && styles.branchItemTextActive]}>
                  {r.name}
                </Text>
                {r.id === activeRestaurantId ? (
                  <Ionicons name="checkmark" size={16} color={theme.cta} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

export function TopBar() {
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const info = useScreenInfo();
  const pathname = usePathname();
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const { time } = useLiveClock();

  useEffect(() => {
    setQuery('');
  }, [pathname, setQuery]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{info.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{info.subtitle}</Text>
        </View>

        <BranchSelector />

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={theme.mut} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={SEARCH_PLACEHOLDER}
            placeholderTextColor={theme.mut}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.row}>
        <PaletteSelector />
        <View style={styles.clock}>
          <View style={styles.clockDot} />
          <Text style={styles.clockText}>{time}</Text>
        </View>
        <View style={styles.spacer} />
        <UserMenu compact />
      </View>
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: theme.surface,
      borderBottomWidth: 2,
      borderBottomColor: theme.cta,
      paddingHorizontal: space.lg,
      paddingTop: space.sm + 2,
      paddingBottom: space.sm,
      gap: space.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 34,
    },
    titleBlock: { gap: 1 },
    title: { fontSize: 17, fontWeight: '600', color: theme.text, letterSpacing: -0.2 },
    subtitle: { fontSize: 11, color: theme.mut },
    branchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: space.sm + 2,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.bg,
      maxWidth: 200,
    },
    branchText: { fontSize: 13, fontWeight: '600', color: theme.text, flexShrink: 1 },
    backdrop: {
      position: 'absolute',
      top: -1000,
      left: -1000,
      right: -1000,
      bottom: -1000,
      zIndex: 10,
    },
    branchMenu: {
      position: 'absolute',
      top: 40,
      left: 0,
      minWidth: 200,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      paddingVertical: 4,
      zIndex: 20,
      elevation: 6,
    },
    branchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.sm,
    },
    branchItemText: { fontSize: 13, color: theme.text },
    branchItemTextActive: { fontWeight: '700', color: theme.cta },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      paddingHorizontal: space.sm + 2,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.bg,
      minWidth: 160,
    },
    searchInput: { flex: 1, fontSize: 13, color: theme.text, padding: 0 },
    clock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    clockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.a1.solid },
    clockText: { fontSize: 13, fontWeight: '700', color: theme.text, fontVariant: ['tabular-nums'] },
    spacer: { flex: 1 },
  });
}
