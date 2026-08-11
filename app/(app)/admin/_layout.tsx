import { Stack } from 'expo-router';

import { BackButton } from '@/components/navigation/NavButtons';
import { UserMenu } from '@/components/navigation/UserMenu';
import { colors, headerStyle } from '@/constants/theme';

const stackHeaderOptions = {
  headerStyle,
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackVisible: false,
};

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
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
