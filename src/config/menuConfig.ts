export interface MenuItemConfig {
  path: string
  label: string
  permission?: string
}

export const menuConfig: MenuItemConfig[] = [
  { path: '/admin/dashboard', label: 'Dashboard', permission: 'ver_dashboard' },
  { path: '/admin/pos', label: 'Punto de Venta', permission: 'ver_pos' },
  { path: '/admin/ventas', label: 'Ventas', permission: 'ver_ventas' },
  { path: '/admin/reservas-pos', label: 'Reservas POS', permission: 'ver_reservas_pos' },
  { path: '/admin/clientes', label: 'Clientes', permission: 'ver_clientes' },
  { path: '/admin/products', label: 'Productos', permission: 'gestionar_productos' },
  { path: '/admin/categorias', label: 'Categorías', permission: 'gestionar_categorias' },
  { path: '/admin/reservas', label: 'Reservas', permission: 'gestionar_reservas' },
  { path: '/admin/consultas', label: 'Consultas', permission: 'gestionar_consultas' },
  { path: '/admin/inventario', label: 'Inventario', permission: 'ver_inventario' },
  { path: '/admin/reportes', label: 'Reportes', permission: 'ver_reportes' },
]

export const adminToolsConfig: MenuItemConfig[] = [
  { path: '/admin/configuracion', label: 'Configuración', permission: 'ver_configuracion' },
  { path: '/admin/usuarios', label: 'Usuarios', permission: 'ver_usuarios' },
]

export const PERMISSIONS = {
  ADMIN: 'admin',
  VER_USUARIOS: 'ver_usuarios',
  CREAR_USUARIOS: 'crear_usuarios',
  EDITAR_USUARIOS: 'editar_usuarios',
  ELIMINAR_USUARIOS: 'eliminar_usuarios',
  GESTIONAR_PERMISOS: 'gestionar_permisos',
  VER_DASHBOARD: 'ver_dashboard',
  VER_POS: 'ver_pos',
  VER_VENTAS: 'ver_ventas',
  VER_CLIENTES: 'ver_clientes',
  VER_RESERVAS_POS: 'ver_reservas_pos',
  GESTIONAR_PRODUCTOS: 'gestionar_productos',
  GESTIONAR_CATEGORIAS: 'gestionar_categorias',
  GESTIONAR_RESERVAS: 'gestionar_reservas',
  GESTIONAR_CONSULTAS: 'gestionar_consultas',
  VER_INVENTARIO: 'ver_inventario',
  VER_REPORTES: 'ver_reportes',
  VER_CONFIGURACION: 'ver_configuracion',
} as const
