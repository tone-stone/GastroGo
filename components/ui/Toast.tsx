import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/theme/ThemeProvider';
import { radius, shadow, space, type Palette } from '@/constants/theme';
import { useToastStore } from '@/stores/toastStore';

/** Toast oscuro fijo abajo al centro — ver "Interacciones y comportamiento" del handoff. */
export function ToastHost() {
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const message = useToastStore((s) => s.message);
  const kind = useToastStore((s) => s.kind);
  const hide = useToastStore((s) => s.hide);

  if (!message) return null;

  const accent = kind === 'warn' ? theme.a3 : theme.a2;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.toast}>
        <Ionicons
          name={kind === 'warn' ? 'alert-circle' : 'checkmark-circle'}
          size={18}
          color={accent.solid}
        />
        <Text style={styles.text}>{message}</Text>
        <Pressable onPress={hide} hitSlop={8}>
          <Text style={styles.close}>Cerrar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: space.xl,
      alignItems: 'center',
      zIndex: 1000,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      maxWidth: 420,
      backgroundColor: theme.ink,
      paddingHorizontal: space.md + 2,
      paddingVertical: space.sm + 2,
      borderRadius: radius.dialog - 5,
      ...shadow.lg,
    },
    text: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.onInk },
    close: { fontSize: 12, fontWeight: '700', color: theme.onInkMut },
  });
}
