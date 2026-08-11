import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  manager: 'Gerente',
  cashier: 'Cajero',
  waiter: 'Mesero',
  kitchen: 'Cocina',
};

export function isKitchenRole(role: UserRole): boolean {
  return role === 'kitchen';
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'owner' || role === 'manager';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'owner' || role === 'manager';
}

export const STAFF_COLORS = ['#555842', '#81634A', '#A7805A', '#AEA781', '#DCC9B0', '#5A4635'];

export const TABLE_ZONES = ['Terraza', 'Interior', 'Barra', 'VIP', 'General'];
