import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { useAuthStore, logout } from '../../store/authStore';
import { THEME_PRESETS, ThemeType } from '../../types';
import { useNotificationStore, Notification } from '../../store/notificationStore';

function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(() => window.innerWidth <= bp)
  useEffect(() => {
    const h = () => setMob(window.innerWidth <= bp)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return mob
}

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
  const navigate = useNavigate();
  const settings = useStore((state) => state.settings);
  const user = useAuthStore((state) => state.user);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const storeName = settings?.storeName || 'Admin';
  const { notifications, unreadCount, markAsRead, markAllAsRead, subscribe } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.link) navigate(n.link);
    setDropdownOpen(false);
  };

  const isMobile = useIsMobile();
  const title = pageTitles[location.pathname] || 'Admin Panel';
  const userInitial = user?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const rolLabel = user?.rol ? rolLabels[user.rol] || user.rol : 'Usuario';
  const rolColor = user?.rol ? rolColors[user.rol] || '#666' : '#666';

  return (
    <header className="h-16 px-6 flex items-center justify-between" style={{ backgroundColor: themeColors.surface, borderBottom: `1px solid ${themeColors.border}` }}>
      <h2 className="text-lg font-semibold" style={{ color: themeColors.text, fontSize: isMobile ? 14 : 18 }}>{title}</h2>
      <div className="flex items-center" style={{ gap: isMobile ? 6 : 16 }}>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: themeColors.text }}
            title="Notificaciones"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white rounded-full"
                style={{ backgroundColor: '#ef4444', minWidth: 18, minHeight: 18, lineHeight: '18px', padding: '0 4px' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg z-50"
              style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: themeColors.border }}>
                <span className="text-sm font-semibold" style={{ color: themeColors.text }}>Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => { markAllAsRead(); }}
                    className="text-xs hover:opacity-80"
                    style={{ color: themeColors.primary }}
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: themeColors.textMuted }}>
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left px-4 py-3 hover:opacity-80 transition-colors flex items-start gap-3 border-b"
                      style={{ borderColor: themeColors.border, opacity: n.read ? 0.6 : 1 }}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'opacity-0' : ''}`}
                        style={{ backgroundColor: n.type === 'reserva' ? '#22c55e' : '#3b82f6' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: themeColors.text }}>
                          {n.title}
                        </div>
                        <div className="text-xs truncate mt-0.5" style={{ color: themeColors.textMuted }}>
                          {n.description}
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: themeColors.textMuted }}>
                          {new Date(n.timestamp).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={() => { useNotificationStore.getState().clear(); setDropdownOpen(false); }}
                  className="w-full text-center text-xs py-2 hover:opacity-80 rounded-b-xl"
                  style={{ color: themeColors.textMuted }}
                >
                  Limpiar notificaciones
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center" style={{ gap: isMobile ? 4 : 8 }}>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" 
            style={{ backgroundColor: themeColors.primary }}
          >
            {userInitial}
          </div>
          <div className="flex flex-col" style={{ display: isMobile ? 'none' : 'flex' }}>
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
          className="rounded-lg hover:opacity-80 transition-opacity"
          style={{
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: 'none', cursor: 'pointer',
            width: isMobile ? 32 : undefined, height: isMobile ? 32 : undefined,
            padding: isMobile ? 0 : '6px 12px',
            fontSize: isMobile ? 16 : 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Cerrar sesión"
        >
          {isMobile ? '✕' : 'Cerrar'}
        </button>
      </div>
    </header>
  );
}
