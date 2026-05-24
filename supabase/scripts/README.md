# Scripts SQL para Supabase - Panadería Catálogo

## 📋 Lista de Scripts (Ejecutar en orden)

| # | Archivo | Descripción |
|---|---------|-------------|
| 01 | `01_extensiones.sql` | Habilitar extensión UUID |
| 02 | `02_perfiles.sql` | Tabla de perfiles de usuario |
| 03 | `03_clients.sql` | Tabla de clientes |
| 04 | `04_atributos.sql` | Categorías, colores, tallas, modelos |
| 05 | `05_products.sql` | Tabla de productos |
| 06 | `06_orders.sql` | Tabla de pedidos y order_items |
| 07 | `07_reservations.sql` | Tabla de reservas |
| 08 | `08_consultas_stock_config.sql` | Consultas, stock, settings |
| 09 | `09_extras_funciones.sql` | Visitas, activity log, storage |
| 10 | `10_vistas.sql` | Vistas útiles |
| 11 | `11_verificacion.sql` | Verificar instalación |

## 🚀 Cómo ejecutar en Supabase

### Opción 1: SQL Editor de Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Abre **SQL Editor** en el menú izquierdo
3. Copia el contenido del script
4. Pégalo en el editor
5. Presiona **Run** (o Ctrl+Enter)

### Opción 2: Línea de comandos (CLI)

```bash
# Conectar a Supabase
supabase db reset

# O ejecutar script específico
psql "postgresql://[user]:[password]@host:5432/postgres" -f 01_extensiones.sql
```

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **perfiles** - Usuarios del admin
- **clients** - Clientes registrados
- **products** - Productos del catálogo
- **categories** - Categorías
- **orders** - Pedidos/Ventas
- **order_items** - Items de pedidos
- **reservations** - Reservas
- **reservation_items** - Items de reservas
- **stock_movements** - Historial de inventario

### Tablas de Atributos
- **colors** - Colores disponibles
- **sizes** - Tallas disponibles
- **models** - Modelos de productos
- **catalogs** - Catálogos

### Tablas de Configuración
- **settings** - Configuraciones de tienda
- **social_networks** - Redes sociales
- **shipping_fields** - Campos de envío

### Tablas de Sistema
- **product_queries** - Consultas de productos
- **visits** - Control de visitas
- **activity_log** - Auditoría

## 🔗 Relaciones entre Tablas

```
clients (1) ─────< orders (N)
clients (1) ─────< reservations (N)

categories (1) ─< products (N)
models (1) ─────< products (N)
products (1) ───< order_items (N)
orders (1) ─────< order_items (N)
products (1) ───< reservation_items (N)
reservations (1) < reservation_items (N)
```

## 📝 Notas

- Los códigos se generan automáticamente:
  - Pedidos: `PED-202603000001`
  - Reservas: `RES-202603000001`
  - Clientes: `CLI-000001`
  
- Las políticas RLS permiten lectura pública de productos, categorías, colores, tallas y modelos

- Solo usuarios autenticados pueden modificar datos

## ❓ Soporte

Si tienes errores, verifica:
1. Que ejecutaste los scripts en orden
2. Que tienes las extensiones habilitadas
3. Que estás ejecutando en el proyecto correcto de Supabase
