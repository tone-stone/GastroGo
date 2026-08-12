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

## Conectar Supabase (backend CRUD)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta en el SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_crud_extensions.sql`
3. Copia `.env.example` → `.env` y agrega tus credenciales
4. Reinicia Expo: `npm start`

### Capa de datos

| Capa | Ubicación |
|------|-----------|
| Repositorios CRUD | `lib/repositories/` |
| Tipos de BD | `types/database.ts` |
| Mappers dominio ↔ BD | `lib/api/mappers.ts` |
| Carga de restaurante | `lib/data/restaurant-data.ts` |

Entidades con CRUD: mesas, categorías, menú, meseros, usuarios, órdenes (+ ítems).

## Scripts

| Comando       | Descripción              |
|---------------|--------------------------|
| `npm start`   | Servidor de desarrollo   |
| `npm run web` | Abrir en navegador       |
| `npm run android` | Android emulator   |
| `npm run build:web` | Export estático web → carpeta `dist` |
| `npm run deploy:web` | Build + preview en **EAS Hosting** |
| `npm run deploy:web:prod` | Build + producción en **EAS Hosting** |

## Despliegue web (EAS Hosting)

GastroGo usa [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/) (no Vercel). El export web va a la carpeta `dist` con `expo.web.output: static`.

### Requisitos

- Cuenta en [expo.dev](https://expo.dev/signup)
- EAS CLI (opcional global): `npm install -g eas-cli` — los scripts usan `npx eas-cli@latest`
- Sesión: `npx eas-cli login`

### Primer deploy

```bash
npm install
npm run deploy:web
```

La primera vez EAS te pedirá:

1. Vincular el proyecto (crea el proyecto en expo.dev)
2. Elegir un **subdominio de preview** (ej. `gastrogo`)

Obtendrás URLs como:

- **Preview:** `https://gastrogo--<deployment-id>.expo.app`
- **Producción:** `https://gastrogo.expo.app` (con `npm run deploy:web:prod`)

### Variables de entorno (Supabase)

En builds web, configura las variables en EAS (no uses `.env` en producción):

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://tu-proyecto.supabase.co --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value tu-anon-key --environment production
```

Repite para `preview` si quieres el mismo backend en previews. Documentación: [Environment variables + EAS Hosting](https://docs.expo.dev/eas/environment-variables/usage/#using-environment-variables-with-eas-hosting).

### Dominio propio (opcional)

Plan de pago: [Custom domain en EAS Hosting](https://docs.expo.dev/eas/hosting/custom-domain/).

### CI/CD automático (EAS Workflows)

El repo incluye workflows en `.eas/workflows/`:

| Archivo | Cuándo corre | Qué hace |
|---------|--------------|----------|
| `deploy-web.yml` | Push a `master` o `main` | Export web + deploy a **producción** |
| `pr-preview.yml` | Pull request abierto/actualizado | Preview + comentario en el PR |

**Configuración única (GitHub + Expo):**

1. Primer deploy manual: `npm run deploy:web` (vincula el proyecto en expo.dev).
2. En [expo.dev](https://expo.dev) → tu proyecto → **GitHub** → instala la app y conecta el repo `tone-stone/GastroGo`.
3. Variables de entorno en EAS (`production` y opcionalmente `preview`) — ver arriba.
4. Push a `master` → el workflow despliega solo.

Probar un workflow sin push:

```bash
npx eas-cli workflow:run .eas/workflows/deploy-web.yml
```

Ver ejecuciones: proyecto en expo.dev → **Workflows**.

### Apps nativas (Android / iOS)

EAS Hosting es solo la **web**. Para tablet/móvil nativo:

```bash
eas build --platform android
eas build --platform ios
```

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
