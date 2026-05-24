import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';
import { useAuthStore, logout } from '../../store/authStore';
import { THEME_PRESETS, ThemeType } from '../../types';

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/pos': 'Punto de Venta',
  '/admin/products': 'Gestión de Productos',
  '/admin/categories': 'Gestión de Categorías',
  '/admin/clientes': 'Clientes',
  '/admin/ventas': 'Ventas',
  '/admin/reservas-pos': 'Reservas POS',
  '/admin/reservas': 'Reservas',
  '/admin/consultas': 'Consultas',
  '/admin/reportes': 'Reportes',
  '/admin/inventario': 'Inventario',
  '/admin/configuracion': 'Configuración',
  '/admin/usuarios': 'Gestión de Usuarios',
};

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  reportes: 'Reportes',
  soporte: 'Soporte Técnico',
  gerente: 'Gerente',
  contador: 'Contador',
};

const rolColors: Record<string, string> = {
  admin: '#c8a96e',
  vendedor: '#22c55e',
  reportes: '#3b82f6',
  soporte: '#a855f7',
  gerente: '#f59e0b',
  contador: '#06b6d4',
};

export function Topbar() {
  const location = useLocation();
  const settings = useStore((state) => state.settings);
  const user = useAuthStore((state) => state.user);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const storeName = settings?.storeName || 'Admin';
  
  const title = pageTitles[location.pathname] || 'Admin Panel';
  const userInitial = user?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const rolLabel = user?.rol ? rolLabels[user.rol] || user.rol : 'Usuario';
  const rolColor = user?.rol ? rolColors[user.rol] || '#666' : '#666';

  return (
    <header className="h-16 px-6 flex items-center justify-between" style={{ backgroundColor: themeColors.surface, borderBottom: `1px solid ${themeColors.border}` }}>
      <h2 className="text-lg font-semibold" style={{ color: themeColors.text }}>{title}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" 
            style={{ backgroundColor: themeColors.primary }}
          >
            {userInitial}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: themeColors.text }}>
              {user?.email || 'Usuario'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${rolColor}20`, color: rolColor }}>
                {rolLabel}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="text-xs px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          title="Cerrar sesión"
        >
          Cerrar
        </button>
      </div>
    </header>
  );
}
