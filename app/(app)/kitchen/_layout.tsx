import { Stack } from 'expo-router';

import { colors } from '@/constants/legacyTheme';

export default function KitchenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
