import { useLocation, useNavigate } from 'react-router-dom'

interface MobileNavProps {
  themeColors?: {
    primary: string
    background: string
    text: string
    textMuted: string
  }
}

export default function MobileNav({ themeColors }: MobileNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const tc = themeColors || {
    primary: '#4ade80',
    background: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#999999',
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/search', label: 'Buscar', icon: '🔍' },
    { path: '/cart', label: 'Carrito', icon: '🛒' },
    { path: '/orders', label: 'Pedidos', icon: '📋' },
    { path: '/account', label: 'Cuenta', icon: '👤' },
  ]

  return (
    <nav style={{
      display: 'none',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: tc.background,
      borderTop: '1px solid #e8e4dc',
      padding: '8px 16px',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      zIndex: 1000,
      justifyContent: 'space-around',
      alignItems: 'center',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    }}
    className="mobile-nav"
    >
      {navItems.map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            border: 'none',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 12,
            transition: 'all .2s',
            background: isActive(item.path) ? tc.primary + '15' : 'transparent',
          }}
        >
          <span style={{
            fontSize: 20,
            filter: isActive(item.path) ? 'none' : 'grayscale(0.5)',
            transition: 'filter .2s',
          }}>
            {item.icon}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: isActive(item.path) ? 600 : 400,
            color: isActive(item.path) ? tc.primary : tc.textMuted,
            transition: 'color .2s',
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
