import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { AppShell } from '@/components/navigation/AppShell';
import { BackButton, CloseButton } from '@/components/navigation/NavButtons';
import { UserMenu } from '@/components/navigation/UserMenu';
import { colors, headerStyle } from '@/constants/legacyTheme';

const stackHeaderOptions = {
  headerStyle,
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackVisible: false,
};

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <AppShell>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="table/[id]"
          options={{
            // La barra superior del AppShell reemplaza este header en ancho tablet/escritorio.
            headerShown: !isWide,
            title: 'Comanda',
            presentation: 'card',
            ...stackHeaderOptions,
            headerLeft: () => <BackButton fallbackHref="/(app)/(tabs)" />,
            headerRight: () => <UserMenu compact />,
          }}
        />
        <Stack.Screen
          name="checkout/[orderId]"
          options={{
            headerShown: !isWide,
            title: 'Cobro',
            presentation: 'modal',
            ...stackHeaderOptions,
            headerLeft: () => <CloseButton />,
            headerRight: () => <UserMenu compact />,
          }}
        />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="kitchen" options={{ headerShown: false }} />
        <Stack.Screen
          name="corte"
          options={{
            headerShown: !isWide,
            title: 'Corte de caja',
            ...stackHeaderOptions,
            headerLeft: () => <BackButton fallbackHref="/(app)/(tabs)" />,
            headerRight: () => <UserMenu compact />,
          }}
        />
      </Stack>
    </AppShell>
  );
}
