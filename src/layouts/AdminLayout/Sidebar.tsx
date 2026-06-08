import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { useAuthStore, logout } from '../../store/authStore'
import { THEME_PRESETS, ThemeType } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'
import { useNotificationStore } from '../../store/notificationStore'

const adminItems = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['admin', 'vendedor', 'reportes', 'gerente', 'contador'],
  },
  {
    path: '/admin/pos',
    label: 'Punto de Venta',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['admin', 'vendedor', 'gerente'],
  },
  {
    path: '/admin/ventas',
    label: 'Ventas',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    roles: ['admin', 'vendedor', 'gerente'],
  },
  {
    path: '/admin/reservas-pos',
    label: 'Reservas POS',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['admin', 'vendedor', 'gerente'],
  },
  {
    path: '/admin/clientes',
    label: 'Clientes',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['admin', 'vendedor', 'gerente'],
  },
  {
    path: '/admin/products',
    label: 'Productos',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    roles: ['admin', 'soporte'],
  },
  {
    path: '/admin/marketing',
    label: 'Marketing',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    roles: ['admin', 'soporte'],
  },
  {
    path: '/admin/catalogos',
    label: 'Catálogos',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    roles: ['admin', 'soporte'],
  },
  {
    path: '/admin/reservas',
    label: 'Reservas',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['admin', 'soporte'],
  },
  {
    path: '/admin/consultas',
    label: 'Consultas',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    roles: ['admin', 'soporte'],
  },
  {
    path: '/admin/inventario',
    label: 'Inventario',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    roles: ['admin', 'reportes', 'soporte', 'contador'],
  },
  {
    path: '/admin/reportes',
    label: 'Reportes',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['admin', 'reportes', 'soporte', 'contador'],
  },
]

const adminToolsItems = [
  {
    path: '/admin/configuracion',
    label: 'Configuración',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin', 'soporte'],
  },
  {
    path: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['admin', 'gerente', 'soporte'],
  },
]

const getRoleLabel = (rol: string) => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    reportes: 'Reportes',
    soporte: 'Soporte Técnico',
    gerente: 'Gerente',
    contador: 'Contador',
  }
  return labels[rol] || rol
}

const getRoleColor = (rol: string) => {
  const colors: Record<string, string> = {
    admin: '#c8a96e',
    vendedor: '#22c55e',
    reportes: '#3b82f6',
    soporte: '#a855f7',
    gerente: '#f59e0b',
    contador: '#06b6d4',
  }
  return colors[rol] || '#666'
}

export function Sidebar({ isMob, open, onToggle }: { isMob?: boolean; open?: boolean; onToggle?: () => void }) {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const settings = useStore((s) => s.settings)
  const { hasPermission } = usePermissions()
  const unreadReservas = useNotificationStore(s => s.unreadReservas)
  const unreadConsultas = useNotificationStore(s => s.unreadConsultas)
  
  const theme = (settings?.theme || 'moderno') as ThemeType
  const themeColors = THEME_PRESETS[theme] || THEME_PRESETS.moderno
  const storeName = settings?.storeName || 'Pane Catálogo'
  const storeLogo = settings?.logo || ''

  const handleSignOut = async () => {
    await logout()
    navigate('/admin/login')
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const userInitial = user?.nombre ? getInitials(user.nombre) : (user?.email?.charAt(0).toUpperCase() || 'U')
  const roleColor = user?.rol ? getRoleColor(user.rol) : '#666'
  const roleLabel = user?.rol ? getRoleLabel(user.rol) : 'Usuario'

  const filteredNavItems = adminItems.filter(item => 
    user && item.roles.includes(user.rol || '')
  )

  const filteredToolsItems = adminToolsItems.filter(item => 
    user && item.roles.includes(user.rol || '')
  )

  return (
    <>
      <style>{`
        .sidebar {
          width: 240px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: var(--bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 40;
          font-family: 'DM Sans', 'Inter', sans-serif;
        }

        .sidebar-header {
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .brand-dot-wrap {
          border-radius: 10px;
          background: linear-gradient(135deg, #ff6b6b, #ee0979);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.2px;
        }

        .sidebar-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding-left: 38px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 8px 10px 6px;
          margin-top: 4px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 400;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.18s ease;
          position: relative;
          border: 1px solid transparent;
        }

        .nav-link:hover {
          color: var(--text);
          background: rgba(255,255,255,0.05);
        }

        .nav-link.active {
          color: #3b82f6;
          background: rgba(59,130,246,0.12);
          border-color: rgba(59,130,246,0.2);
          font-weight: 500;
        }

        .nav-link.active .nav-icon {
          color: #3b82f6;
        }

        .sidebar-badge {
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-icon {
          flex-shrink: 0;
          transition: color 0.18s;
        }

        .nav-link:hover .nav-icon {
          color: rgba(255,255,255,0.7);
        }

        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13.5px;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.18s ease;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          font-family: inherit;
        }

        .footer-link:hover {
          color: var(--text);
          background: rgba(255,255,255,0.05);
        }

        .footer-link.danger:hover {
          color: #f87171;
          background: rgba(248,113,113,0.08);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }

        .user-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.1);
        }

        .user-card .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #c8a96e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 600;
          color: #0a0a0a;
          flex-shrink: 0;
        }

        .user-card .user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-card .user-name {
          font-size: 13px;
          font-weight: 500;
          color: #f5f0e8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-card .user-role {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          margin-bottom: 8px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #c8a96e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: #0a0a0a;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: #f5f0e8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 11px;
          color: #c8a96e;
        }

        @media(max-width:768px){
          .sidebar{transform:translateX(-100%);transition:transform 0.3s ease;z-index:50!important}
          .sidebar.open{transform:translateX(0)}
          .sidebar-close{display:flex!important}
        }
        @media(min-width:769px){
          .sidebar-close{display:none!important}
        }
      `}</style>

      <aside className={`sidebar${open ? ' open' : ''}`} style={{ background: themeColors.surface, borderColor: themeColors.border }}>
        <div className="sidebar-header" style={{ borderColor: themeColors.border }}>
          <div className="sidebar-brand">
            {storeLogo ? (
              <img src={storeLogo} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10, background: 'rgba(255,255,255,0.1)', padding: 4 }} />
            ) : (
              <div className="brand-dot-wrap" style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${themeColors.primary}40` }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#000' }}>{storeName.charAt(0)}</span>
              </div>
            )}
            <span className="sidebar-title" style={{ color: themeColors.text, fontSize: 16 }}>{storeName}</span>
          </div>
          <div className="sidebar-subtitle" style={{ color: themeColors.textMuted }}>Admin Panel</div>
          <button className="sidebar-close" onClick={onToggle} style={{
            background: 'none', border: 'none', color: themeColors.textMuted,
            cursor: 'pointer', fontSize: 20, padding: 4, display: 'none',
          }} aria-label="Cerrar menú">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menú</div>
          {filteredNavItems.map((item) => {
            const badgeCount = item.path === '/admin/reservas' ? unreadReservas
              : item.path === '/admin/consultas' ? unreadConsultas
              : 0
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badgeCount > 0 && (
                  <span className="sidebar-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                )}
              </NavLink>
            )
          })}

          {filteredToolsItems.length > 0 && (
            <>
              <div className="nav-section-label">Herramientas</div>
              {filteredToolsItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-card" onClick={() => navigate('/admin/configuracion')}>
              <div className="user-avatar" style={{ background: roleColor }}>
                {userInitial}
              </div>
              <div className="user-info">
                <span className="user-name">{user.nombre || user.email?.split('@')[0]}</span>
                <span className="user-role" style={{ color: roleColor }}>{roleLabel}</span>
              </div>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
          <a href="/tienda" className="footer-link">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ver tienda
          </a>

          <button className="footer-link danger" onClick={handleSignOut}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
