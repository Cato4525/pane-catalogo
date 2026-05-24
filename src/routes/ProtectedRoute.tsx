import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#f5f0e8',
      fontFamily: 'DM Sans, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #c8a96e33',
          borderTopColor: '#c8a96e',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Cargando...
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  permission?: string
  fallbackPath?: string
}

function ProtectedRoute({ permission, fallbackPath = '/admin/login' }: ProtectedRouteProps) {
  const { user, permissions, initialized, loading } = useAuthStore()

  if (!initialized || loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />
  }

  if (permission) {
    const hasAccess = user.rol === 'admin' || permissions.includes(permission)
    if (!hasAccess) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#f5f0e8',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ marginBottom: 8 }}>No autorizado</h2>
            <p style={{ color: '#888' }}>No tienes permiso para acceder a esta sección</p>
          </div>
        </div>
      )
    }
  }

  return <Outlet />
}

function PublicRoute() {
  const { user, initialized } = useAuthStore()

  if (!initialized) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}

export { ProtectedRoute, PublicRoute }
