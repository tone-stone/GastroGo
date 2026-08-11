import { Stack } from 'expo-router';

import { BackButton, CloseButton } from '@/components/navigation/NavButtons';
import { UserMenu } from '@/components/navigation/UserMenu';
import { colors, headerStyle } from '@/constants/theme';

const stackHeaderOptions = {
  headerStyle,
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackVisible: false,
};

export default function AppLayout() {
  return (
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
          headerShown: true,
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
          headerShown: true,
          title: 'Cobro',
          presentation: 'modal',
          ...stackHeaderOptions,
          headerLeft: () => <CloseButton />,
          headerRight: () => <UserMenu compact />,
        }}
      />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="kitchen" options={{ headerShown: false }} />
    </Stack>
  );
}
