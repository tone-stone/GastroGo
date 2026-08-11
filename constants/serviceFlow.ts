import type { OrderStatus, TableStatus } from '@/types';

export type ServiceFlowStepId = 'assign' | 'order' | 'kitchen' | 'pay';

export interface ServiceFlowStep {
  id: ServiceFlowStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const SERVICE_FLOW_STEPS: ServiceFlowStep[] = [
  { id: 'assign', label: 'Asignar mesa', shortLabel: 'Mesa', icon: 'grid-outline' },
  { id: 'order', label: 'Tomar orden', shortLabel: 'Orden', icon: 'restaurant-outline' },
  { id: 'kitchen', label: 'Enviar a cocina', shortLabel: 'Cocina', icon: 'flame-outline' },
  { id: 'pay', label: 'Cobrar', shortLabel: 'Cobro', icon: 'card-outline' },
];

export function getActiveStepFromOrder(
  tableStatus: TableStatus,
  orderStatus?: OrderStatus,
  hasItems?: boolean,
): ServiceFlowStepId {
  if (tableStatus === 'free') return 'assign';
  if (!orderStatus || orderStatus === 'open') {
    return hasItems ? 'order' : 'order';
  }
  if (orderStatus === 'sent_to_kitchen') return 'kitchen';
  if (orderStatus === 'ready' || tableStatus === 'bill_requested') return 'pay';
  return 'order';
}
