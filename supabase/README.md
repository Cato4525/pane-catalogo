# Configuración de Supabase para Pane Catalogo

## Pasos para configurar la base de datos

### 1. Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Anotar las credenciales (URL y anon key)

### 2. Ejecutar el schema
Hay dos opciones:

#### Opción A: SQL Editor
1. Ir al SQL Editor en el dashboard de Supabase
2. Copiar todo el contenido de `supabase/schema.sql`
3. Ejecutar

#### Opción B: CLI de Supabase
```bash
# Instalar CLI
npm install -g supabase

# Iniciar en el directorio del proyecto
cd supabase
supabase db push
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Credenciales de admin (fallback)
VITE_ADMIN_EMAIL=admin@pane.local
VITE_ADMIN_PASSWORD=admin123
```

### 4. Tablas creadas

| Tabla | Descripción |
|-------|-------------|
| `categorias` | Categorías de productos |
| `productos` | Catálogo completo de productos |
| `clientes` | Registro de clientes |
| `pedidos` | Pedidos realizados |
| `reservas` | Reservas con abonos |
| `reserva_items` | Items de cada reserva |
| `consultas` | Consultas de clientes sobre productos |
| `stock_movimientos` | Historial de entradas/salidas de stock |
| `perfiles` | Perfiles de usuarios (para Supabase Auth) |

### 5. Autenticación

El sistema soporta dos modos:
- **Con Supabase Auth**: Usuarios registrados pueden iniciar sesión
- **Sin Supabase Auth**: Usa credenciales locales (fallback)

Para habilitar Supabase Auth:
1. Ir a Authentication > Providers > Email
2. Habilitar "Enable Email Password Auth"
3. Los usuarios se crean automáticamente en la tabla `perfiles`

### 6. Estructura de productos

El campo `estado_catalogo` maneja el ciclo de vida:
- `exclusivo`: Productos nuevos (0-15 días)
- `tendencia`: Productos populares (15-30 días)
- `clasico`: Productos establecidos (30-45 días)
- `descontinuado`: Productos mayores a 45 días
- `liquidacion`: Productos en oferta especial

### 7. API disponible

El servicio `dataService` proporciona:
```typescript
import { dataService } from './services';

// Productos
const products = await dataService.getProducts();

// Pedidos
const orders = await dataService.getOrders();
await dataService.createOrder(order);
await dataService.updateOrder(id, updates);

// Clientes
const clientes = await dataService.getClientes();

// Reservas
const reservas = await dataService.getReservas();

// Stock
await dataService.addStockMovement(movement);
```

El servicio detecta automáticamente si Supabase está configurado.
