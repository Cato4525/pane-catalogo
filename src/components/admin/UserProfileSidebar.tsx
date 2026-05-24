import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, useAuthStore } from '../../store/authStore'

interface Profile {
  id: string
  email: string
  nombre: string | null
  rol: string
  avatar_url?: string
}

interface UserProfileSidebarProps {
  userId?: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#c8a96e',
  gerente: '#6e8fc8',
  vendedor: '#22c55e',
  reportes: '#70c880',
  soporte: '#a855f7',
  contador: '#f59e0b',
  inventario: '#ec4899',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  reportes: 'Reportes',
  soporte: 'Soporte',
  contador: 'Contador',
  inventario: 'Inventario',
}

export default function UserProfileSidebar({ userId }: UserProfileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  const authUser = useAuthStore((state) => state.user)

  useEffect(() => {
    loadProfile()
  }, [userId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadProfile = async () => {
    try {
      const { getSupabase } = await import('../../services/supabaseClient')
      const supabase = getSupabase()

      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (data) {
          setProfile(data)
        } else if (authUser) {
          setProfile({
            id: authUser.id,
            email: authUser.email,
            nombre: authUser.nombre,
            rol: authUser.rol,
          })
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      if (authUser) {
        setProfile({
          id: authUser.id,
          email: authUser.email,
          nombre: authUser.nombre,
          rol: authUser.rol,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U'
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-2 w-16 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const initials = getInitials(profile?.nombre)
  const roleColor = ROLE_COLORS[profile?.rol || ''] || '#888'
  const roleLabel = ROLE_LABELS[profile?.rol || ''] || profile?.rol || 'Usuario'

  return (
    <div className="user-profile-sidebar" ref={dropdownRef}>
      <button
        className="user-profile-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar-container">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.nombre || 'Avatar'}
              className="user-avatar-img"
            />
          ) : (
            <div 
              className="user-avatar-initials"
              style={{ background: roleColor }}
            >
              {initials}
            </div>
          )}
          <div className="online-indicator" />
        </div>
        
        <div className="user-info-content">
          <span className="user-name">
            {profile?.nombre || profile?.email?.split('@')[0] || 'Usuario'}
          </span>
          <span 
            className="user-role-badge"
            style={{ color: roleColor, background: `${roleColor}20` }}
          >
            {roleLabel}
          </span>
        </div>
        
        <svg 
          className={`chevron-icon ${isOpen ? 'rotate' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown">
          {profile?.email && (
            <div className="dropdown-email">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {profile.email}
            </div>
          )}
          
          <div className="dropdown-divider" />
          
          <button className="dropdown-item" onClick={() => { navigate('/admin/configuracion'); setIsOpen(false) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </button>
          
          <button className="dropdown-item" onClick={() => { navigate('/tienda'); setIsOpen(false) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ver tienda
          </button>
          
          <div className="dropdown-divider" />
          
          <button className="dropdown-item danger" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}

      <style>{`
        .user-profile-sidebar {
          position: relative;
          width: 100%;
        }

        .user-profile-button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .user-profile-button:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .user-avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .user-avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-avatar-initials {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .online-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: #22c55e;
          border: 2px solid #111;
          border-radius: 50%;
        }

        .user-info-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          color: #f5f0e8;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        .chevron-icon {
          color: #666;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .chevron-icon.rotate {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #1a1a1a;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 8px;
          z-index: 100;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          animation: slideDown 0.15s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-email {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          color: #666;
          font-size: 12px;
        }

        .dropdown-divider {
          height: 1px;
          background: #252525;
          margin: 8px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          color: #aaa;
          font-size: 13px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #f5f0e8;
        }

        .dropdown-item.danger {
          color: #ef4444;
        }

        .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .user-profile-loading {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
        }

        @media (max-width: 768px) {
          .user-info-content {
            display: none;
          }
          
          .user-profile-button {
            padding: 8px;
          }
          
          .chevron-icon {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
