import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/constants/legacyTheme';
import { confirmAction } from '@/lib/confirm';
import { useSessionStore } from '@/stores/sessionStore';

interface NavButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  accessibilityLabel: string;
}

export function NavButton({ icon, onPress, color = colors.text, accessibilityLabel }: NavButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function BackButton({ fallbackHref = '/(app)/(tabs)' }: { fallbackHref?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref as '/(app)/(tabs)');
    }
  };

  return (
    <NavButton
      icon="arrow-back"
      onPress={handleBack}
      color={colors.primary}
      accessibilityLabel="Volver"
    />
  );
}

export function CloseButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();

  const handleClose = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)');
    }
  };

  return (
    <NavButton
      icon="close"
      onPress={handleClose}
      color={colors.textSecondary}
      accessibilityLabel="Cerrar"
    />
  );
}

export function useSignOut() {
  const router = useRouter();
  const signOut = useSessionStore((s) => s.signOut);

  return async () => {
    const confirmed = await confirmAction(
      'Cerrar sesión',
      '¿Seguro que quieres salir de GastroGo?',
      'Cerrar sesión',
    );
    if (!confirmed) return;

    await signOut();
    router.replace('/(auth)/login');
  };
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.7 },
});
