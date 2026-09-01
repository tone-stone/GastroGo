import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '@/constants/legacyTheme';
import { isAdminRole } from '@/lib/roles';
import { useSessionStore } from '@/stores/sessionStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const isLoading = useSessionStore((s) => s.isLoading);
  const initialize = useSessionStore((s) => s.initialize);
  const loginMode = useSessionStore((s) => s.loginMode);
  const role = useSessionStore((s) => s.role);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      if (loginMode === 'kitchen') {
        router.replace('/kitchen');
      } else if (loginMode === 'admin' && isAdminRole(role)) {
        router.replace('/admin');
      } else if (loginMode === 'waiter') {
        router.replace('/(app)/(tabs)/mesero');
      } else {
        router.replace('/(app)/(tabs)/');
      }
    }
  }, [user, isLoading, segments, router, loginMode, role]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
