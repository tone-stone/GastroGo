export type LoginMode = 'sale' | 'waiter' | 'admin' | 'kitchen';

export const LOGIN_MODES: {
  id: LoginMode;
  title: string;
  subtitle: string;
  icon: 'cash-outline' | 'restaurant-outline' | 'shield-outline' | 'flame-outline';
  features: string[];
}[] = [
  {
    id: 'sale',
    title: 'Venta',
    subtitle: 'Menú, pedido y cobro directo sin mesas',
    icon: 'cash-outline',
    features: ['Menú', 'Pedido', 'Cobro'],
  },
  {
    id: 'waiter',
    title: 'Mesero',
    subtitle: 'Asignar mesas y tomar pedidos en sala',
    icon: 'restaurant-outline',
    features: ['Mesas', 'Comandas', 'Servicio'],
  },
  {
    id: 'kitchen',
    title: 'Cocina',
    subtitle: 'Ver comandas y marcar platillos listos',
    icon: 'flame-outline',
    features: ['Comandas', 'Preparación', 'Avisar mesero'],
  },
  {
    id: 'admin',
    title: 'Administrativo',
    subtitle: 'Usuarios, mesas, menú y configuración',
    icon: 'shield-outline',
    features: ['Usuarios', 'Menú', 'Mesas'],
  },
];

export function getLoginModeAccent(mode: LoginMode): string {
  if (mode === 'admin') return '#81634A';
  if (mode === 'kitchen') return '#A7805A';
  if (mode === 'waiter') return '#555842';
  return '#555842';
}
