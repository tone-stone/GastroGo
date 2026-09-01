repo: tone-stone/GastroGo
branch: master

## Last sync
date: 2026-08-31T00:00:00Z

### Updated in this project
- Prototipo navegable del POS (`GastroGo POS.dc.html`): login, mesas (variantes A/B), comanda, caja, cocina, órdenes, admin y notas.
- Paleta elegida: Olivo & dorado (oliva #4F5B34, dorado #C09A3E, terracota #B4643C, pizarra #3E5A6B sobre crema #F7F4E9). Selector con Madera y Barro & cobre como alternativas.
- Caja rediseñada: menú de venta rápida integrado, cantidades editables, propina, display de total/recibido/cambio y flujo de terminal (BBVA, Mercado Pago, Apple Pay).
- Canales nuevos: para llevar, DiDi Food y Uber Eats; inventario, movimientos y recetas en Admin.

## Screen map
| Pantalla del prototipo | Archivos del repo |
| --- | --- |
| Login | app/(auth)/login.tsx |
| Mesas (A y B) + canales | app/(app)/(tabs)/index.tsx, components/pos/TableGrid.tsx, constants/status.ts |
| Comanda | app/(app)/table/[id].tsx, components/pos/MenuList.tsx, components/pos/OrderSummary.tsx |
| Caja | components/pos/PosCashRegister.tsx, app/(app)/checkout/[orderId].tsx |
| Cocina | app/(app)/kitchen/index.tsx, components/kitchen/KitchenItemTicket.tsx |
| Órdenes | app/(app)/(tabs)/orders.tsx |
| Admin + inventario | app/(app)/admin/*.tsx |
| Tokens y paletas | constants/theme.ts |

## Sync history
- 2026-08-29 — Primera lectura del repo y rediseño base.
