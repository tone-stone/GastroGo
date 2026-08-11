import { Redirect } from 'expo-router';

import { isAdminRole } from '@/lib/roles';
import { useSessionStore } from '@/stores/sessionStore';

export default function AdminTabRedirect() {
  const role = useSessionStore((s) => s.role);

  if (!isAdminRole(role)) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/admin" />;
}
