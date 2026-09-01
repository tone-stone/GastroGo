import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, type PaletteKey } from '@/components/theme/ThemeProvider';
import { palettes, radius, space, type Palette } from '@/constants/theme';

const PALETTE_ORDER: PaletteKey[] = ['madera', 'olivo', 'barro'];

export function PaletteSelector() {
  const { palette: theme, key, setKey } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {PALETTE_ORDER.map((k) => {
        const p = palettes[k];
        const active = k === key;
        return (
          <Pressable
            key={k}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => setKey(k)}
            accessibilityLabel={`Paleta ${p.name}`}
          >
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: p.a1.solid }]} />
              <View style={[styles.dot, { backgroundColor: p.a2.solid }]} />
              <View style={[styles.dot, { backgroundColor: p.a3.solid }]} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{p.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      backgroundColor: theme.surface2,
      padding: 3,
      borderRadius: radius.pill,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      paddingHorizontal: space.sm + 2,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    pillActive: {
      backgroundColor: theme.surface,
      borderColor: theme.line,
    },
    dots: { flexDirection: 'row', gap: 2 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: { fontSize: 12, fontWeight: '600', color: theme.mut },
    labelActive: { color: theme.text },
  });
}
