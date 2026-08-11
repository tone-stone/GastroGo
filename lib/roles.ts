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

export const STAFF_COLORS = ['#3D6B4F', '#5C4A3A', '#40916C', '#C4A052', '#8B7355', '#2D5040'];

export const TABLE_ZONES = ['Terraza', 'Interior', 'Barra', 'VIP', 'General'];
