import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { BackButton } from '@/components/navigation/NavButtons';
import { UserMenu } from '@/components/navigation/UserMenu';
import { colors, headerStyle } from '@/constants/legacyTheme';

const stackHeaderOptions = {
  headerStyle,
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackVisible: false,
};

export default function AdminLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        // La barra superior del AppShell reemplaza este header en ancho tablet/escritorio.
        headerShown: !isWide,
        ...stackHeaderOptions,
        headerLeft: () => <BackButton fallbackHref="/(app)/(tabs)/admin" />,
        headerRight: () => <UserMenu compact />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Administración',
          headerLeft: () => <BackButton fallbackHref="/(app)/(tabs)" />,
        }}
      />
      <Stack.Screen name="users" options={{ title: 'Usuarios' }} />
      <Stack.Screen name="staff" options={{ title: 'Meseros y staff' }} />
      <Stack.Screen name="tables" options={{ title: 'Mesas' }} />
      <Stack.Screen name="menu" options={{ title: 'Menú' }} />
    </Stack>
  );
}
