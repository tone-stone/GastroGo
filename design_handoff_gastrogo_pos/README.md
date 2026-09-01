# Handoff: rediseño de GastroGo POS

## Resumen
Rediseño completo del punto de venta GastroGo (Expo / React Native, repo `tone-stone/GastroGo`, rama `master`): mapa de mesas, comanda por canal, caja con menú de venta rápida y pagos, pantalla de cocina, órdenes activas, inventario, corte de caja y administración. Incluye canales nuevos (para llevar, DiDi Food, Uber Eats), inventario de insumos y las interacciones de cancelar, dividir cuenta, descuentos, transferir mesa y modificadores de platillo.

Objetivos que guiaron el rediseño, en orden: velocidad de uso (menos toques por venta), legibilidad a distancia y con prisa, jerarquía visual, claridad del estado de cada mesa de un vistazo, y sensación de producto premium.

## Sobre los archivos de diseño
`GastroGo POS.dc.html` es una **referencia de diseño hecha en HTML**: un prototipo navegable que muestra la apariencia y el comportamiento deseados. **No es código para copiar a producción.** La tarea es **recrear estas pantallas en el entorno existente del repo** (Expo Router + React Native + Supabase), usando sus patrones y librerías actuales. Ábrelo en un navegador y navega con el riel izquierdo; el ícono "Móvil" muestra las tres pantallas de teléfono.

## Fidelidad
**Alta fidelidad.** Colores, tipografía, tamaños, radios, sombras, copys y estados son finales. Recréalos con exactitud usando los componentes del repo. Los datos son los del modo demo de `lib/demo-data.ts`.

## Design tokens

### Paleta elegida: Olivo & dorado
Cuatro acentos con rol fijo, cada uno con cuatro variantes: sólido, `soft` (fondo claro), `ink` (texto sobre soft) y `on` (texto sobre sólido). Todo el diseño lee de estos tokens, así que cambiar de paleta no toca ningún componente.

| Token | Hex | Uso |
| --- | --- | --- |
| `bg` | #F7F4E9 | Fondo de pantalla |
| `surface` | #FFFDF6 | Tarjetas, paneles, barra superior |
| `surface2` | #F0EDDD | Fondos secundarios, teclas, chips inactivos |
| `line` | #DFDBC6 | Bordes y separadores |
| `text` | #2B2E24 | Texto principal |
| `mut` | #7C7C66 | Texto secundario y metadatos |
| `ink` | #2E3327 | Riel de navegación, display de totales |
| `inkSoft` | #3D4434 | Hover sobre el riel |
| `inkLine` | #4C5441 | Separadores sobre ink |
| `onInk` | #E4E2CB | Texto sobre ink |
| `onInkMut` | #A9A98C | Texto secundario sobre ink |
| `cta` / `ctaDark` / `ctaOn` | #4F5B34 / #3C4627 / #FFFDF6 | Acción principal |
| `a1` / soft / ink / on / line | #4F5B34 / #E8ECD8 / #333D1D / #F7F9EC / #CBD3AE | Acento principal: mesa ocupada, platos fuertes |
| `a2` / soft / ink / on / line | #C09A3E / #F8EFD5 / #6A5115 / #2A2107 / #E8D49B | Dorado: bebidas, descuentos, listo |
| `a3` / soft / ink / on / line | #B4643C / #F8E7DE / #6E3620 / #FFF3EC / #EBC9B7 | Terracota: alertas, retrasos, mermas, cancelación |
| `a4` / soft / ink / on / line | #3E5A6B / #E3EBF0 / #29404E / #EAF2F7 / #C2D4DF | Frío: reservada, Uber, dividir cuenta |

Paletas alternativas incluidas en el prototipo (selector en la barra superior, y prop `palette`): **Madera** (café #8C5A34, oliva #6E7350, ocre #C9821A, pino #37605B sobre arena #F1E8DB) y **Barro & cobre** (cobre #B4643C, salvia #6E7B5C, dorado #CFA347, azul noche #2F4858 sobre #F7F0E6). En React Native son tres objetos en `constants/theme.ts` detrás de un ThemeProvider. Ver `theme.ts.txt` en este paquete.

### Tipografía
Inter, pesos 400 / 500 / 600 / 700. Ningún peso 800: la jerarquía es tamaño y espacio.

| Rol | Tamaño | Peso | Notas |
| --- | --- | --- | --- |
| Número de mesa | 26px | 600 | `letter-spacing: -0.02em` |
| Total a cobrar (display) | 38–40px | 600 | `letter-spacing: -0.02em`, tabular-nums |
| Título de pantalla | 17px | 600 | −0.015em |
| Subtítulo de pantalla | 11px | 400 | color `mut` |
| Título de tarjeta / diálogo | 15–18px | 600 | −0.015em |
| Cuerpo | 13–14px | 400–500 | |
| Etiqueta de sección | 11–12px | 700 | mayúsculas, `letter-spacing: 0.06–0.09em`, color `mut` |
| Pastilla de estado | 10–11px | 700 | mayúscula inicial, radio 999px |
| Ticket de cocina (artículos) | 16px | 500 | cantidad en 16px/700 |
| Teclas del numpad | 24px | 600 | tabular-nums |

Todos los importes usan `font-variant-numeric: tabular-nums`.

### Espaciado, radios y sombras
- Padding de tarjeta: 14–16px. Padding de panel: 16–18px. Gap de rejilla: 12px; gap de sección: 14–22px.
- Radios: 8–10px (botones pequeños, teclas), 11–12px (botones y tarjetas chicas), 14px (tarjetas), 16px (paneles), 18px (diálogos), 999px (pastillas), 34px (marco de teléfono).
- Sombras: `sm` = `0 1px 2px rgba(58,52,40,.06), 0 0 0 1px line`; `md` = `0 4px 14px rgba(58,52,40,.09), 0 0 0 1px line`; `lg` = `0 14px 36px rgba(58,52,40,.14), 0 0 0 1px line`.
- Objetivo táctil mínimo: 44px en móvil. Teclas del numpad de tablet: 62px de alto.
- Iconografía: Phosphor Icons (regular y fill). En React Native, `phosphor-react-native`.

## Pantallas

### Login
Dos columnas: 1.1fr con degradado `linear-gradient(160deg, #2E3327, #3D4434 55%, #4F5B34)` y copy de marca; 1fr con el formulario centrado, ancho máximo 340px. Campos con label en 12px/700 mayúsculas y input de 15px, radio 10px, fondo `surface`. Botón de ancho completo, 14px de padding, color `cta`. Modo demo: cualquier correo y contraseña.

### Riel de navegación (tablet)
Columna fija de 88px, fondo `ink`, scroll vertical. Logo 44×44 radio 12 en `cta`. Nueve destinos: Mesas, Comanda, Caja, Cocina, Órdenes, Insumos, Corte, Admin, Notas — cada uno botón de 64px de ancho con ícono 22px sobre etiqueta de 11px/600; activo con fondo `cta` y texto `surface2`, inactivo `onInkMut`, hover `inkSoft`. Abajo: alternador de vista móvil y avatar circular 40px.

### Barra superior
Alto mínimo 62px, fondo `surface`, borde inferior de 2px en `cta`, `flex-wrap`. Título + subtítulo a la izquierda (en Comanda el título sigue al canal activo), selector de sucursal, buscador que crece con el espacio libre, selector de paleta y reloj con punto de estado.

### Mesas — variante A (plano por zona)
Agrupado por zona (Terraza, Interior, Barra, VIP) con encabezado 12px/700 mayúsculas y contador de ocupación. Rejilla `repeat(auto-fill, minmax(220px, 1fr))`, gap 12. Tarjeta de 132px mínimo: franja vertical de 4px con el color del estado a la izquierda, número de mesa 26px/600, capacidad, pastilla de estado arriba a la derecha, y pie separado por borde con mesero + minutos e importe. Hover: sombra `md` y `translateY(-1px)`.

### Mesas — variante B (cola de servicio)
Cuatro columnas por acción pendiente: Por atender (a2 oliva), Tomando orden (a1), En cocina (a3), Por cobrar (a4). Cada columna con fondo y borde propios en su tinte soft, alto mínimo 320px. Tarjetas con mesa, tiempo, detalle, mesero y una pastilla de acción. Se sugiere A como vista por defecto en tablet fija y B para gerencia y horas pico.

Estados de mesa (color funcional, no decorativo): **libre** oliva claro (#E9EBD8 / texto #333D1D), **ocupada** acento principal sólido, **pide cuenta** dorado sólido, **reservada** frío sólido. Leyenda con conteo arriba a la derecha.

### Canales (tira sobre el plano)
Cuatro tarjetas `repeat(auto-fit, minmax(240px, 1fr))` con borde superior de 3px del color del canal: Mostrador, Para llevar (#12), DiDi Food (#4471), Uber Eats (#A93). Cada una con ícono en cuadro soft, nombre, meta (cliente y hora, o estado del repartidor), total y pastilla de estado. Al tocarlas abren esa cuenta en Caja.

### Comanda
Dos columnas: menú a la izquierda, resumen de 380px pegajoso a la derecha.
- **Tira de canal** arriba: Mesa 2, Para llevar #12, DiDi #4471, Uber #A93. Cambia el destino de la comanda, el contexto y la acción final.
- **Para llevar** agrega una fila de campos: nombre de quien recoge, hora y empaque (Bolsa / Caja / Sin cubiertos).
- **DiDi y Uber** muestran un aviso en `a4-soft`: el pedido llegó por integración, los artículos están bloqueados (intentar editarlos dispara un toast de advertencia) y la única decisión es el tiempo de preparación (15 / 20 / 30 min).
- **Chips de categoría** con color propio por categoría (Entradas a4, Fuertes a1, Bebidas a2, Postres a3).
- **Tarjetas de platillo**: nombre, descripción, precio, y dos acciones — `+` agrega tal cual, el ícono de controles abre la hoja de modificadores.
- **Resumen**: encabezado con destino y conteo, líneas con stepper −/+ de 28px, nota del artículo en color `a3`, subtotal, IVA 16%, total 22px/600, y dos botones: "A cocina" (contorno) y la acción contextual ("Cobrar" en mesa y para llevar, "Aceptar pedido" en plataformas).

### Hoja de modificadores
Diálogo centrado de 540px. Bloques: **término** (solo en platillos que lo piden, p. ej. Arrachera), **quitar** ingredientes como pastillas que se marcan en `a3` sólido, y **extras** con precio como casillas que suman a la línea. Abajo: nota de cocina armada automáticamente ("Tres cuartos · Sin cebolla · + Papas"), precio con extras y botón "Agregar a la comanda".

Modelo sugerido: `order_items.modifiers` jsonb `{term, removed[], extras[{name, price}]}` y `notes` derivado para imprimir.

### Caja
Dos columnas fluidas `repeat(auto-fit, minmax(360px, 1fr))`; colapsa a una sola por debajo de ~760px.

**Izquierda**
1. Pestañas de cuenta con scroll horizontal: Mostrador, Para llevar, DiDi, Uber, Mesa 3, Mesa 2 — cada una con su total en vivo.
2. Detalle de la cuenta con cantidades editables, línea de descuento cuando aplica, y fila de propina (0 / 10 / 15 / 20%).
3. **Menú de venta rápida**: chips de categoría y botones compactos de platillo que agregan a la cuenta activa. Es lo que permite cobrar en el mostrador sin pasar por la comanda.
4. Dos botones: **Dividir cuenta** y **Descuento**, que reflejan su estado activo en el propio botón.
5. **Método de pago**: cuatro tarjetas `repeat(auto-fit, minmax(120px, 1fr))` — Efectivo, Tarjeta (Terminal BBVA), Mercado Pago (QR / link), Apple Pay (contactless).

**Derecha (pegajosa)**
- Display en `ink`, radio 14: "TOTAL A COBRAR" en 11px/700 con tracking 0.12em y el importe en 38px/600. En efectivo agrega RECIBIDO y CAMBIO.
- **Efectivo**: atajos Exacto / $200 / $500 / $1000, y numpad de 3 columnas con teclas de 62px, C y ⌫ en `a3`.
- **Terminal, Mercado Pago o Apple Pay**: panel de tres pasos (monto enviado al lector, cliente autoriza, recibo y cierre de mesa) con la nota específica de cada integración.
- Botón de cobro que cambia de texto según el método: "Cobrar $X" o "Enviar $X al lector", con la ayuda contextual debajo.

### Dividir cuenta
Diálogo de 600px con tres modos: **partes iguales** (stepper de 2 a 12 personas y monto por persona), **por artículo** (casillas; la primera cuenta lleva lo marcado y la segunda el resto), **por comensal** (requiere `seat_number` en `order_items`). Al aplicar, la caja muestra pastillas Cuenta 1..N con su importe; cobrar una avanza a la siguiente y las cobradas se marcan. Cada cuenta puede pagarse con método distinto.

**Importante:** la división se guarda como **proporciones**, no como importes fijos, y los montos se recalculan del total vigente. Así, aplicar o quitar un descuento se refleja en cada cuenta.

### Descuentos
Diálogo de 540px: tipo (porcentaje, monto fijo, cortesía total), valor en atajos, **motivo obligatorio** de una lista corta (cortesía de la casa, cliente frecuente, error de cocina, promoción del día, personal), y bloque de autorización. Regla: hasta 15% del subtotal lo aplica el cajero; arriba de eso, o cortesía total, pide PIN de gerencia. El resumen muestra subtotal, descuento, IVA 16% y nuevo total. El descuento se aplica **antes** de IVA y propina y aparece como línea en el ticket.

### Cocina
Barra superior con filtros (Todas, En mesa, Para llevar y online, Retrasadas) con conteo, banner de retrasos en `a3-soft` y promedio del turno. Tres columnas: Pendiente, En preparación, Listo para servir.

Cada ticket: mesa + pastilla de canal, minutos, **barra de progreso contra el SLA**, etiqueta de estado del tiempo, artículos en 16px con su nota en `a3`, y botón de avance en `cta`. SLA por canal: mesa 12–14 min, para llevar y plataformas 15 min. Colores: en tiempo verde, cerca del límite a partir del 70% del SLA en terracota, retrasada en dorado. Columna vacía: caja punteada con "Sin comandas en esta etapa".

### Órdenes activas
Filtros por estado con conteo (Todas, Abiertas, En cocina, Listas, Pagadas) y tres KPIs agrupados a la derecha (ventas del turno, ticket promedio, retrasadas). Tabla de columnas `90px 1.4fr 1fr 1fr 110px 130px`: orden, mesa con ícono de canal, mesero, pastilla de estado, tiempo (en negritas y `a3` con ícono de alerta si pasa de 20 min) e importe. Cualquier fila abre el detalle.

### Detalle de orden (panel lateral)
Panel derecho de 430px sobre fondo `rgba(43,46,36,.32)`. Encabezado con folio, mesa y pastilla de estado; artículos con cantidad, nota e importe; **línea de tiempo** con pasos completados en `cta`, el actual en `a3` y los pendientes en `surface2` — dos variantes: mesa (abierta, a cocina, lista, entregada, cobrada) y plataforma (recibido, aceptado, en preparación, empacado, entregado). Totales con propina. Cuatro acciones: Reimprimir, avanzar estado, **Transferir mesa** y **Cancelar orden**. Se cierra al navegar a otra pantalla.

### Cancelar orden
Diálogo en `a3`: motivo obligatorio (cliente canceló, error de captura, sin insumo, demora en cocina, duplicada) y **consecuencias visibles antes de confirmar** — insumos devueltos al inventario (no, si el motivo es "sin insumo"), aviso inmediato a cocina y PIN de gerencia. La orden no se borra: queda con estado cancelado, motivo y responsable para que el corte del turno explique la diferencia.

### Transferir / unir mesa
Diálogo en `a4`: destino (Mesa 1, 4, 7, 8, o "Unir con Mesa 5"). Se mueven artículos, notas de cocina, mesero y tiempo transcurrido. Unir suma los artículos en la mesa destino y libera la de origen. Cocina recibe aviso con el nuevo número de mesa.

### Inventario
Tres pestañas.
- **Existencias**: tabla `1.6fr 1fr 1fr 1fr 130px` con insumo, existencia, mínimo, costo unitario y estado. Umbral relativo: "Reponer" si `qty ≤ min`, "Al límite" hasta `1.5 × min`, "Suficiente" arriba. Cada fila abre el diálogo del insumo.
- **Movimientos**: tarjetas por movimiento con borde izquierdo de color — entrada de proveedor con factura (`cta`), merma con responsable y hora (`a3`), salida automática por venta (`a1`), cada una con sus líneas de insumo.
- **Conteo físico**: lista con existencia de sistema, stepper de lo contado y diferencia coloreada; panel de resumen con faltantes, sobrantes y **costo de la merma** valuado a costo unitario. La merma se calcula contra el consumo teórico de las recetas.

Modelo sugerido: `supplies`, `supply_moves (kind, qty, cost, user_id, ref)`, `recipes (menu_item_id, supply_id, qty)`. El descuento por venta es un trigger sobre `order_items`.

### Corte de caja
Izquierda: cuatro KPIs con borde superior de color (ventas, ticket promedio, propinas, cuentas abiertas), ventas por método con barra proporcional, y ventas por canal. Derecha: display en `ink` con el efectivo esperado (fondo inicial + ventas en efectivo − retiros) y **conteo por denominación** ($1000 a $20) que calcula lo contado y la diferencia en vivo, con botones Reiniciar y Cerrar turno. No se puede cerrar con mesas abiertas: el KPI de cuentas abiertas es el bloqueo natural.

### Administración
Seis tarjetas `repeat(auto-fit, minmax(280px, 1fr))`, cada una con ícono en su tinte, tres filas de resumen y un botón: Menú, Mesas, Personal, Inventario de insumos, Movimientos, Recetas y descuento. Tanto la tarjeta como cada fila abren su diálogo.

Los seis diálogos comparten el mismo esqueleto (560px): encabezado con ícono, campos arriba en rejilla `minmax(190px, 1fr)` con hint bajo cada uno, lista relacionada en medio, estado como pastillas y una nota que explica la consecuencia.
- **Editar platillo**: nombre, precio, categoría, tiempo de preparación (define el SLA de cocina); receta que descuenta inventario; nota con el costo de receta y el margen.
- **Alta de insumo**: nombre, unidad, existencia inicial, mínimo de alerta, costo unitario, proveedor; en qué platillos se usa; descuento automático o solo conteo manual.
- **Editar mesa**, **editar usuario** (rol, PIN, zonas y permisos: descuentos y corte reservados a gerencia), **registrar movimiento** y **editar recetas** (descontar al cobrar evita restar inventario de comandas canceladas).

### Vistas móviles (390 × 844)
Tres pantallas para el mesero en el piso:
1. **Mis mesas**: lista de una columna (no rejilla) con borde izquierdo de estado, nombre, zona y minutos, importe y pastilla.
2. **Cobrar mesa**: display de total y cambio, cuatro métodos en rejilla 2×2, numpad de teclas de 58px y botón de cobro de ancho completo.
3. **Para llevar y online**: filtro por canal y tarjetas con ícono, cliente, importe, pastilla de estado, tiempo y acción de 44px mínimo. DiDi y Uber llegan pagados, así que su acción es **Entregar**, no Cobrar.

Barra inferior de cuatro destinos: Mesas, Llevar / Comanda, Cobro, Cuenta.

## Interacciones y comportamiento
- **Navegación**: riel izquierdo en tablet, barra inferior en móvil. Cambiar de pantalla cierra el panel de detalle y cualquier diálogo abierto.
- **Confirmaciones**: toast oscuro (`ink`) fijo abajo al centro, radio 13, con ícono en `a2` para éxito y `a3` para advertencia, y botón Cerrar. Se autooculta a los 3.2 s. Se usa en: cobro, envío a cocina, aceptación de pedido de plataforma, reimpresión, cierre de conteo, cierre de turno, descuento aplicado o retirado, cancelación y transferencia.
- **Errores prevenidos, no anunciados**: enviar a cocina sin platillos advierte en el toast; aplicar descuento sin motivo o cancelar/transferir sin elegir opción también. Editar un pedido de plataforma avisa que no se edita desde el POS.
- **Estados vacíos** escritos en la voz del oficio, y solo visibles cuando la lista está vacía: "La comanda está vacía. Toca un platillo del menú para agregarlo.", "Cuenta vacía — agrega del menú de venta rápida.", "Sin comandas en esta etapa", "Ninguna orden en este filtro.", "Sin pedidos en este canal."
- **Hover** (tablet con ratón): tarjetas suben sombra a `md`; botones de contorno cambian borde y texto al acento; teclas y filas de tabla toman `surface2`.
- **Responsivo**: toda rejilla usa `auto-fit` con mínimos (120–360px) y las columnas de dos paneles usan `minmax(0, 1fr)` para no desbordar. Las tiras de pestañas hacen scroll horizontal, no envuelven.

## Estado necesario
- `screen`, `logged`, `mobile`, `palette`.
- Mesas: `variant` (A / B).
- Comanda: `channel` (mesa / llevar / didi / uber), carrito por canal, `pack`, `prep`, `category`.
- Modificadores: `modItem`, `term`, `removed[]`, `extras[]`.
- Caja: `target` (cuenta activa), `method`, `tip`, `input` (numpad), `discount {amount, label, reason}`, `split` (arreglo de **proporciones**) y `splitIdx`.
- Cocina: `kitchenFilter`. Órdenes: `orderFilter`, `openOrder`.
- Inventario: `invTab`, `counts {supplyId: qty}`. Corte: `bills {denominación: n}`.
- Diálogos: `dialog`, `sheet`, y la opción elegida dentro de cada uno.
- Toast: `message`, `kind`, con temporizador de 3.2 s que debe limpiarse al desmontar.

## Datos y backend por definir
Antes de codificar hay que decidir en Supabase:
- `orders.channel` (dine_in | takeaway | didi | uber) en lugar de mesas falsas para mostrador y para llevar.
- `order_items.modifiers` jsonb y `seat_number`.
- Descuentos: tipo, valor, motivo, usuario que autoriza.
- Cancelaciones: estado cancelado, motivo, responsable.
- Inventario: `supplies`, `supply_moves`, `recipes` y el trigger de descuento por venta.
- Corte de turno: fondo inicial, retiros, conteo por denominación, diferencia.
- Pagos: DiDi, Uber, Mercado Pago (QR dinámico o Point SDK, webhook que marca la orden pagada) y BBVA / Apple Pay (SDK del adquirente; guardar `auth_code` y `last4`). Los tres comparten el mismo flujo visual de tres pasos. Capa sugerida: `lib/payments/` con una interfaz común `createIntent(amount, orderId) → status stream → confirm`.
- Impresión de tickets de cocina y de para llevar.

## Mapa pantalla → archivos del repo
| Pantalla | Archivos |
| --- | --- |
| Login | `app/(auth)/login.tsx` |
| Mesas (A y B) + canales | `app/(app)/(tabs)/index.tsx`, `components/pos/TableGrid.tsx`, `constants/status.ts` |
| Comanda por canal | `app/(app)/table/[id].tsx`, `components/pos/MenuList.tsx`, `components/pos/OrderSummary.tsx` |
| Caja, dividir, descuentos | `components/pos/PosCashRegister.tsx`, `app/(app)/checkout/[orderId].tsx` |
| Cocina | `app/(app)/kitchen/index.tsx`, `components/kitchen/KitchenItemTicket.tsx` |
| Órdenes y detalle | `app/(app)/(tabs)/orders.tsx` |
| Inventario y corte | nuevas rutas bajo `app/(app)/` |
| Admin y diálogos | `app/(app)/admin/*.tsx` |
| Tokens y paletas | `constants/theme.ts` |

## Assets
Ninguna imagen. Iconografía Phosphor Icons (regular y fill); en React Native usa `phosphor-react-native`. Tipografía Inter (Google Fonts). Sin logotipos ni fotografías: el prototipo no usa imágenes.

## Archivos de este paquete
- `GastroGo POS.dc.html` — el prototipo navegable (referencia de diseño).
- `support.js` — runtime que necesita el prototipo para abrirse en el navegador. Colócalo junto al HTML.
- `theme.ts.txt` — las tres paletas como objetos listos para `constants/theme.ts`.
- `github.md` — repo, rama y mapa de pantallas.
