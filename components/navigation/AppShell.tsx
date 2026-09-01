import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { NavRail } from '@/components/navigation/NavRail';
import { TopBar } from '@/components/navigation/TopBar';
import { useTheme } from '@/components/theme/ThemeProvider';
import type { Palette } from '@/constants/theme';

/**
 * Riel de navegación + barra superior en ancho tablet/escritorio (≥768).
 * En móvil es un passthrough — la navegación por tabs inferiores sigue igual.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isWide = width >= 768;

  if (!isWide) return <>{children}</>;

  return (
    <View style={styles.root}>
      <NavRail />
      <View style={styles.main}>
        <TopBar />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: theme.bg },
    main: { flex: 1 },
    content: { flex: 1 },
  });
}
