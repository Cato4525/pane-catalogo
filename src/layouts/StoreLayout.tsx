import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { useAuthStore } from '../store/authStore'
import { SearchIcon, CartIcon } from '../pages/store/Icons'
import '../pages/store/store.css'

const NAV_HEIGHT_DESKTOP = 88
const NAV_HEIGHT_MOBILE = 60

function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(() => window.innerWidth <= bp)
  useEffect(() => {
    const h = () => setMob(window.innerWidth <= bp)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return mob
}

export default function StoreLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const settings = useStore(s => s.settings)
  const storeName = settings?.storeName || 'VELOUR'
  const logo = settings?.logo
  const user = useAuthStore(s => s.user)
  const isClienteLogueado = !!user
  const isMobile = useIsMobile()
  const [searchVal, setSearchVal] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/tienda?search=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  const navHeight = isMobile ? NAV_HEIGHT_MOBILE : NAV_HEIGHT_DESKTOP

  const navLinks = [
    { label: 'Inicio', path: '/tienda', hash: '' },
    { label: 'Catálogo', path: '/tienda', hash: '#catalogo' },
    { label: 'Contacto', path: '/tienda', hash: '#contacto' },
    { label: 'Promociones', path: '/tienda/promociones', hash: '' },
    { label: 'Nosotros', path: '/tienda', hash: '#nosotros' },
  ]

  const handleNav = (path: string, hash?: string) => {
    navigate(path + (hash || ''))
    setMenuOpen(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fdf8f6', fontFamily: "'Jost',sans-serif", color: '#2b1f23' }}>
      <nav className="v-nav">
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
              padding: 8, display: 'flex', alignItems: 'center',
            }}
            aria-label="Menú"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }} onClick={() => navigate('/tienda')}>
          {logo ? (
            <img src={logo} alt={storeName} style={{ height: isMobile ? 30 : 50, objectFit: 'contain' }} />
          ) : (
            <span className="v-logo">{storeName.slice(0,3).toUpperCase()}<span>O</span>UR</span>
          )}
          <span className="v-logo-tag">{storeName}</span>
          <span className="v-logo-line"></span>
        </div>
        <ul className="v-nav-links">
          {navLinks.map(l => (
            <li key={l.label}>
              <a href={l.path + l.hash} onClick={(e) => { e.preventDefault(); handleNav(l.path, l.hash) }}
                className={location.pathname.startsWith(l.path) && l.path !== '/tienda' ? 'active' : ''}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <form onSubmit={handleSearch} className="v-search-wrap" style={{ margin: 0 }}>
            <span className="v-search-icon"><SearchIcon /></span>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Buscar..."
              className="v-search"
              style={{ width: isMobile ? 90 : 120 }}
            />
          </form>
          <button className="v-cart-btn" onClick={() => navigate('/tienda')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span><CartIcon /></span>
            <span>Carrito</span>
          </button>
          {isClienteLogueado ? (
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
              {user?.nombre?.split(' ')[0] || 'Cuenta'}
            </span>
          ) : (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/tienda') }}
              style={{ color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none', textShadow: '0 1px 6px rgba(0,0,0,.3)' }}
            >
              Iniciar Sesión
            </a>
          )}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 190,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: 'absolute', top: navHeight, left: 0, right: 0,
            background: '#fff', padding: '1rem 0', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            animation: 'slideUp .2s ease-out',
          }} onClick={e => e.stopPropagation()}>
            {navLinks.map(l => (
              <button
                key={l.label}
                onClick={() => handleNav(l.path, l.hash)}
                style={{
                  display: 'block', width: '100%', padding: '14px 24px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: '#2b1f23', textAlign: 'left',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  borderBottom: '1px solid #f0ede6',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingTop: navHeight }}>
        <Outlet />
      </div>

      <div className="v-footer" style={{ marginTop: 48 }}>
        <div className="v-f-logo">{storeName.slice(0,3).toUpperCase()}<span>O</span>OUR</div>
        <div>© 2026 · {storeName} · Todos los derechos reservados</div>
      </div>
    </div>
  )
}
