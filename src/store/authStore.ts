import { create } from 'zustand'

export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'reportes' | 'soporte' | 'contador' | 'inventario'

export interface AppUser {
  id: string
  email: string
  nombre: string
  rol: UserRole
  provincia?: string
  activo?: boolean
  permisos_extra?: string[]
}

export interface Permiso {
  id: number
  clave: string
  descripcion: string
  categoria: string
}

export interface Rol {
  id: number
  nombre: string
  descripcion: string
}

interface AuthState {
  user: AppUser | null
  permissions: string[]
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  checkAuth: () => Promise<void>
  setUser: (user: AppUser | null) => void
  setLoading: (loading: boolean) => void
  setPermissions: (permissions: string[]) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  permissions: [],
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setPermissions: (permissions) => set({ permissions }),
  clearAuth: () => set({ user: null, permissions: [], loading: false }),

  hasPermission: (permission: string) => {
    const { permissions, user } = get()
    if (user?.rol === 'admin') return true
    return permissions.includes(permission)
  },

  checkAuth: async () => {
    const { initialized } = get()
    if (initialized) return

    set({ loading: true })
    
    try {
      const { getSupabase } = await import('../services/supabaseClient')
      const supabase = getSupabase()
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error al obtener sesión:', error.message)
        set({ user: null, initialized: true, loading: false })
        return
      }

      if (data?.session?.user) {
        const sessionUser = data.session.user
        const rol = sessionUser.user_metadata?.rol as UserRole | undefined
        
        if (rol && ['admin', 'gerente', 'vendedor', 'reportes', 'soporte', 'contador', 'inventario'].includes(rol)) {
          const user: AppUser = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            nombre: sessionUser.user_metadata?.nombre || sessionUser.email?.split('@')[0] || '',
            rol,
          }

          // Fetch permissions from DB
          try {
            const { data: permData } = await supabase.rpc('get_user_permissions', { user_uuid: sessionUser.id })
            const permissions: string[] = permData || []
            
            // Fetch profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .single()
            
            console.log('Profile query error:', profileError)
            console.log('Profile data:', profile)

            if (profile) {
              user.activo = profile.activo
              user.permisos_extra = profile.permisos_extra || []
              user.provincia = profile.provincia || ''
            }

            set({
              user,
              permissions,
              initialized: true,
              loading: false,
            })
          } catch {
            set({
              user,
              permissions: [],
              initialized: true,
              loading: false,
            })
          }

          supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
              set({ user: null, permissions: [] })
              return
            }
            
            const r = session.user.user_metadata?.rol as UserRole | undefined
            if (r && ['admin', 'gerente', 'vendedor', 'reportes', 'soporte', 'contador', 'inventario'].includes(r)) {
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || '',
                  rol: r,
                },
              })
            } else {
              set({ user: null, permissions: [] })
            }
          })

          return
        }
      }
      
      set({ user: null, permissions: [], initialized: true, loading: false })
    } catch (err) {
      console.error('Error crítico en checkAuth:', err)
      set({ user: null, permissions: [], initialized: true, loading: false })
    }
  },
}))

export const loginAdmin = async (email: string, password: string): Promise<{ user?: AppUser; error?: string }> => {
  try {
    const { getSupabase } = await import('../services/supabaseClient')
    const supabase = getSupabase()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return { error: error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message }
    }
    
    if (!data.user) {
      return { error: 'Usuario no encontrado' }
    }

    const rol = data.user.user_metadata?.rol as UserRole | undefined
    
    const validRoles: UserRole[] = ['admin', 'gerente', 'vendedor', 'reportes', 'soporte', 'contador', 'inventario']
    
    if (!rol || !validRoles.includes(rol)) {
      await supabase.auth.signOut()
      return { error: 'No tienes acceso al panel de administración' }
    }

    const user: AppUser = {
      id: data.user.id,
      email: data.user.email || '',
      nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || '',
      rol,
    }

    // Fetch permissions
    try {
      const { data: permData } = await supabase.rpc('get_user_permissions', { user_uuid: data.user.id })
      const permissions: string[] = permData || []
      useAuthStore.getState().setPermissions(permissions)
    } catch (e) {
      console.error('Error fetching permissions:', e)
    }

    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setLoading(false)

    return { user }
  } catch (err) {
    console.error('Error en loginAdmin:', err)
    return { error: 'Error al iniciar sesión' }
  }
}

export const logout = async (): Promise<void> => {
  try {
    const { getSupabase } = await import('../services/supabaseClient')
    const supabase = getSupabase()
    await supabase.auth.signOut()
    useAuthStore.getState().clearAuth()
  } catch (err) {
    console.error('Error en logout:', err)
    useAuthStore.getState().clearAuth()
  }
}

// User management functions
export const getAllUsers = async (): Promise<AppUser[]> => {
  const { getSupabase } = await import('../services/supabaseClient')
  const supabase = getSupabase()
  
  const { data, error } = await supabase.rpc('get_all_users')
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return data || []
}

export const getAllRoles = async (): Promise<Rol[]> => {
  const { getSupabase } = await import('../services/supabaseClient')
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('nombre')
  
  if (error) {
    console.error('Error fetching roles:', error)
    return []
  }
  
  return data || []
}

export const getAllPermissions = async (): Promise<Permiso[]> => {
  const { getSupabase } = await import('../services/supabaseClient')
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('permisos')
    .select('*')
    .order('categoria')
  
  if (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
  
  return data || []
}

export const getRolePermissions = async (roleName: string): Promise<string[]> => {
  const { getSupabase } = await import('../services/supabaseClient')
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', 
      (await supabase.from('roles').select('id').eq('nombre', roleName).single()).data?.id
    )
  
  if (error) return []
  
  const permIds = data?.map(d => d.permission_id) || []
  
  const { data: perms } = await supabase
    .from('permisos')
    .select('clave')
    .in('id', permIds)
  
  return perms?.map(p => p.clave) || []
}

export const updateUserProfile = async (
  userId: string,
  updates: { nombre?: string; rol?: string; activo?: boolean; permisos_extra?: string[] }
): Promise<{ error?: string }> => {
  try {
    const { getSupabase } = await import('../services/supabaseClient')
    const supabase = getSupabase()
    
    const { error } = await supabase.rpc('update_user_profile', {
      target_user_id: userId,
      new_nombre: updates.nombre || null,
      new_rol: updates.rol || null,
      new_activo: updates.activo ?? null,
      new_permisos_extra: updates.permisos_extra || null,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return {}
  } catch (err) {
    console.error('Error updating user:', err)
    return { error: 'Error al actualizar usuario' }
  }
}

export const softDeleteUser = async (userId: string): Promise<{ error?: string }> => {
  try {
    const { getSupabase } = await import('../services/supabaseClient')
    const supabase = getSupabase()
    
    const { error } = await supabase.rpc('soft_delete_user', { target_user_id: userId })
    
    if (error) {
      return { error: error.message }
    }
    
    return {}
  } catch (err) {
    console.error('Error deleting user:', err)
    return { error: 'Error al eliminar usuario' }
  }
}
