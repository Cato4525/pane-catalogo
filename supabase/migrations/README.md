# Supabase Migrations - Reservas System

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `001_reservations_system.sql` | Crear tablas desde cero |
| `002_update_reservations.sql` | Actualizar tablas existentes |
| `999_rollback_reservations.sql` | Revertir cambios |

## Cómo ejecutar

### Opción 1: SQL Editor de Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → New Query
3. Copia y pega el contenido del archivo
4. Run

### Opción 2: CLI de Supabase

```bash
supabase db push
```

## Estructura de la tabla `reservations`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único |
| `codigo` | VARCHAR | Código legible (ej: 260415-0001) |
| `client_id` | VARCHAR | ID del cliente |
| `client_name` | VARCHAR | Nombre completo |
| `client_phone` | VARCHAR | Teléfono |
| `client_document` | VARCHAR | Cédula |
| `client_city` | VARCHAR | Ciudad |
| `client_address` | TEXT | Dirección |
| `client_email` | VARCHAR | Email |
| `status` | VARCHAR | Estado (pendiente/abonado/confirmado/cancelado/expirado) |
| `total` | DECIMAL | Total del pedido |
| `abono` | DECIMAL | Total abonado |
| `saldo` | DECIMAL | Saldo pendiente |
| `comprobante_url` | TEXT | URL del comprobante |
| `comprobante_verificado` | BOOLEAN | Si el comprobante fue verificado |
| `whatsapp_revisado` | BOOLEAN | Si se revisó por WhatsApp |
| `abono_confirmado` | BOOLEAN | Si el abono fue confirmado |
| `origen` | VARCHAR | Origen (tienda/pos) |
| `abonos` | JSONB | Array de pagos parciales |
| `fecha_reserva` | TIMESTAMPTZ | Fecha de creación |
| `fecha_limite_abono` | TIMESTAMPTZ | Límite para primer abono |
| `fecha_limite_pago` | TIMESTAMPTZ | Límite para pago completo |
| `notas_admin` | TEXT | Notas del admin |

## Estructura de la tabla `reservation_items`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único |
| `reserva_id` | UUID | FK a reservations |
| `producto_id` | VARCHAR | ID del producto |
| `producto_nombre` | VARCHAR | Nombre del producto |
| `cantidad` | INTEGER | Cantidad |
| `precio_unitario` | DECIMAL | Precio por unidad |
| `subtotal` | DECIMAL | Subtotal |

## Funciones disponibles

### agregar_abono(reserva_id, monto, comprobante_url, notas)
Agrega un pago parcial a una reserva.

```sql
SELECT agregar_abono(
  'uuid-de-la-reserva',
  25.00,
  'https://url-del-comprobante.jpg',
  'Pago por transferencia'
);
```

### marcar_pagado_total(reserva_id)
Marca una reserva como completamente pagada.

```sql
SELECT marcar_pagado_total('uuid-de-la-reserva');
```

## Formato del array `abonos`

```json
[
  {
    "id": "AB-1712345678.1234",
    "reserva_id": "uuid",
    "monto": 10.00,
    "fecha": "2024-04-15T10:30:00Z",
    "comprobante_url": "https://...",
    "notas": "Abono inicial",
    "tipo": "inicial"
  },
  {
    "id": "AB-1712345679.5678",
    "reserva_id": "uuid",
    "monto": 15.00,
    "fecha": "2024-04-16T14:00:00Z",
    "comprobante_url": null,
    "notas": "Pago final",
    "tipo": "final"
  }
]
```

## Verificar después de migrar

```sql
-- Ver estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- Ver funciones creadas
SELECT proname FROM pg_proc WHERE proname LIKE 'agregar%' OR proname LIKE 'marcar%';
```
