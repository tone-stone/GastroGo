# GastroGo

Sistema de punto de venta (POS) para restaurantes — web y móvil con **Expo + React Native** y backend **Supabase** (multi-restaurante).

## Características (MVP)

- Login con auth Supabase (o **modo demo** sin backend)
- Multi-sucursal: cambiar entre restaurantes
- Mapa de mesas por zona con estados (libre, ocupada, cuenta, reservada)
- Comandas: menú por categorías, cantidades, envío a cocina
- Cobro: propina, métodos de pago, cierre de mesa
- Diseño moderno optimizado para tablet y móvil

## Requisitos

- Node.js 20+
- npm
- [Expo Go](https://expo.dev/go) (móvil) o navegador (web)

## Inicio rápido (modo demo)

```bash
cd GastroGo
npm install
npm start
```

Presiona `w` para web, o escanea el QR con Expo Go.

En login usa **cualquier correo y contraseña** — el modo demo carga datos de ejemplo.

## Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta el SQL en `supabase/migrations/001_initial_schema.sql`
3. Copia `.env.example` → `.env` y agrega tus credenciales:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. Reinicia Expo: `npm start`

## Scripts

| Comando       | Descripción              |
|---------------|--------------------------|
| `npm start`   | Servidor de desarrollo   |
| `npm run web` | Abrir en navegador       |
| `npm run android` | Android emulator   |
| `npm run ios` | iOS simulator (macOS)    |

## Estructura

```
app/
  (auth)/login.tsx          # Pantalla de login
  (app)/(tabs)/             # Mesas, órdenes, ajustes
  (app)/table/[id].tsx      # Comanda por mesa
  (app)/checkout/[orderId]  # Cobro
components/                 # UI y componentes POS
stores/                     # Zustand (sesión + POS)
lib/                        # Supabase + datos demo
supabase/migrations/        # Esquema PostgreSQL
types/                      # Tipos TypeScript
```

## Próximos pasos

- [ ] Pantalla de cocina (tiempo real)
- [ ] Inventario e insumos
- [ ] Reportes y corte de caja
- [ ] Reservaciones
- [ ] Facturación electrónica
- [ ] Sync offline

## Licencia

MIT
