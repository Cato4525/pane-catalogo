import { useMemo, useCallback } from 'react'
import { useAuthStore, AppUser } from '../store/authStore'

interface UsePermissionsReturn {
  loading: boolean
  isAdmin: boolean
  permissions: string[]
  hasPermission: (permission: string) => boolean
  user: AppUser | null
}

export function usePermissions(): UsePermissionsReturn {
  const { user, permissions, loading } = useAuthStore()

  const isAdmin = useMemo(() => {
    return user?.rol === 'admin'
  }, [user?.rol])

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    if (user.rol === 'admin') return true
    return permissions.includes(permission)
  }, [user, permissions])

  return {
    loading,
    isAdmin,
    permissions,
    hasPermission,
    user
  }
}
