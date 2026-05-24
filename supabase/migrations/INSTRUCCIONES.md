# 📋 Instrucciones de Migración - Sistema de Reservas

## Archivos a ejecutar (en orden)

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `script_01_crear_tablas.sql` | Crea las tablas `reservations` y `reservation_items` |
| 2 | `script_02_funciones.sql` | Crea funciones `agregar_abono`, `marcar_pagado_completo` |
| 3 | `script_04_verificar.sql` | Verifica que todo se creó correctamente |

## ⚠️ NO ejecutar script_03_seed.sql

Ese archivo tiene datos de prueba comentados. Descoméntalo solo si necesitas datos de prueba.

---

## Paso a paso:

### 1. Ve a Supabase Dashboard
```
https://supabase.com/dashboard/project/TU_PROYECTO/sql
```

### 2. Ejecuta el primer script
Copia todo el contenido de `script_01_crear_tablas.sql` y pégalo en el SQL Editor, luego presiona **Run**.

### 3. Ejecuta el segundo script
Copia el contenido de `script_02_funciones.sql` y ejecútalo.

### 4. Verifica
Copia `script_04_verificar.sql` y ejecútalo.

Deberías ver:
- 「reservations」✓ Existe
- 20 columnas (o más)
- Funciones: agregar_abono, marcar_pagado_completo, ver_abonos

---

## 📊 Consultas rápidas después de migrar:

```sql
-- Ver todas las reservas
SELECT id, client_name, client_phone, total, abono, saldo, status, origen, created_at
FROM reservations 
ORDER BY created_at DESC;

-- Reservas pendientes
SELECT * FROM reservations WHERE status = 'pendiente';

-- Buscar por teléfono
SELECT * FROM reservations WHERE client_phone = '3001234567';
```

---

## 🔧 Si algo sale mal:

```sql
-- Eliminar tablas (empezar de cero)
DROP TABLE IF EXISTS reservation_items;
DROP TABLE IF EXISTS reservations;

-- Eliminar funciones
DROP FUNCTION IF EXISTS agregar_abono(UUID, DECIMAL, TEXT, TEXT);
DROP FUNCTION IF EXISTS marcar_pagado_completo(UUID);
DROP FUNCTION IF EXISTS ver_abonos(UUID);
```

Luego vuelve a ejecutar los scripts 01 y 02.