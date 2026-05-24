import { supabaseClient, getSupabase } from './supabaseClient'

export type UserRole = 'admin' | 'vendedor' | 'reportes' | 'soporte' | 'gerente' | 'contador'

export interface AppUser {
  id: string
  email: string
  nombre: string
  rol: UserRole
}

export interface StoreUser {
  id: string
  email: string
  nombre: string
}

export const loginAdmin = async (email: string, password: string): Promise<{ user?: AppUser; error?: string }> => {
  const { data, error } = await supabaseClient!.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: 'Email o contraseña incorrectos' }
  }
  
  if (!data.user) {
    return { error: 'Usuario no encontrado' }
  }

  const rol = data.user.user_metadata?.rol as UserRole | undefined
  
  if (!rol || !['admin', 'vendedor', 'reportes'].includes(rol)) {
    await supabaseClient!.auth.signOut()
    return { error: 'No tienes acceso al panel de administración' }
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || '',
      nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || '',
      rol,
    },
  }
}

export const loginConGoogle = async () => {
  const { data, error } = await supabaseClient!.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const registrarCliente = async (email: string, password: string, nombre: string, telefono: string) => {
  console.log('📝 Intentando registrar cliente:', email, nombre)
  
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('El email ingresado no es válido. Verifica que no tenga caracteres extraños.')
  }
  
  const supabase = getSupabase()
  const emailLower = email.toLowerCase().trim()
  
  if (supabase) {
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', emailLower)
      .maybeSingle()
    
    if (checkError) {
      console.error('❌ Error verificando cliente:', checkError)
    }
    
    if (existingClient) {
      throw new Error('Este correo ya tiene una cuenta. Por favor inicia sesión.')
    }
  }
  
  let { data, error } = await supabaseClient!.auth.signUp({
    email: emailLower,
    password,
    options: {
      data: { nombre, rol: 'cliente', telefono },
    },
  })
  
  if (error) {
    console.error('❌ Error en auth.signUp:', error)
    if (error.message.includes('already') || error.message.includes('Already') || error.message.includes('exists')) {
      throw new Error('Este correo ya tiene una cuenta. Por favor inicia sesión.')
    }
    if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      throw new Error('No se pudo crear la cuenta. Intenta con otro correo o contacta al administrador.')
    }
    if (error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
      console.log('⚠️ Rate limit detectado')
      throw new Error('Demasiados intentos. Espera un momento e intenta de nuevo.')
    }
    throw new Error('Error al crear la cuenta. Intenta de nuevo.')
  }
  
  if (supabase) {
    const { error: insertError } = await supabase.from('clients').insert({
      nombre,
      email: emailLower,
      telefono,
      origen: 'tienda',
      user_id: data.user?.id,
    })
    
    if (insertError) {
      console.error('❌ Error inserting client:', insertError)
    } else {
      console.log('✅ Cliente creado en tabla con origen: tienda')
    }
  }
  
  console.log('✅ Usuario creado en auth:', data.user?.id)
  
  if (data.user && supabase) {
    await new Promise(r => setTimeout(r, 2000))
    
    const { data: clienteActualizado } = await supabase
      .from('clients')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle()
    
    if (clienteActualizado) {
      await supabase.from('clients').update({ user_id: data.user.id }).eq('id', clienteActualizado.id)
      console.log('✅ user_id asignado al cliente')
    }
  }
  
  return data
}

export const loginCliente = async (email: string, password: string) => {
  const { data, error } = await supabaseClient!.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const logout = async () => {
  const { error } = await supabaseClient!.auth.signOut()
  if (error) throw error
}

export const getUsuarioActual = async (): Promise<AppUser | null> => {
  const { data: { user } } = await supabaseClient!.auth.getUser()
  
  if (!user) return null
  
  const rol = user.user_metadata?.rol as UserRole | undefined
  
  if (!rol || !['admin', 'vendedor', 'reportes'].includes(rol)) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
    nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || '',
    rol,
  }
}

export const getStoreUser = async (): Promise<StoreUser | null> => {
  const { data: { user } } = await supabaseClient!.auth.getUser()
  
  if (!user) return null

  return {
    id: user.id,
    email: user.email || '',
    nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || '',
  }
}

export const esAdmin = async (): Promise<boolean> => {
  const user = await getUsuarioActual()
  return user?.rol === 'admin'
}

export const puedeCrearUsuarios = async (): Promise<boolean> => {
  const user = await getUsuarioActual()
  return user?.rol === 'admin'
}

export const puedeEditarVentas = async (): Promise<boolean> => {
  const user = await getUsuarioActual()
  return user?.rol === 'admin' || user?.rol === 'vendedor'
}

export const puedeVerReportes = async (): Promise<boolean> => {
  const user = await getUsuarioActual()
  return user?.rol === 'admin' || user?.rol === 'reportes'
}

export const puedeGestionarProductos = async (): Promise<boolean> => {
  const user = await getUsuarioActual()
  return user?.rol === 'admin'
}

export const puedeGestionarReservas = async (): Promise<boolean> => {
  const user = await getUsuarioActual()
  return user?.rol === 'admin'
}

export const onAuthChange = (callback: (user: AppUser | null) => void) => {
  return supabaseClient!.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null)
      return
    }
    
    const rol = session.user.user_metadata?.rol as UserRole | undefined
    
    if (!rol || !['admin', 'vendedor', 'reportes'].includes(rol)) {
      callback(null)
      return
    }
    
    callback({
      id: session.user.id,
      email: session.user.email || '',
      nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || '',
      rol,
    })
  })
}

export const onStoreAuthChange = (callback: (user: StoreUser | null) => void) => {
  return supabaseClient!.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      callback(null)
      return
    }
    
    callback({
      id: session.user.id,
      email: session.user.email || '',
      nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || '',
    })
  })
}

export const getUsers = async (): Promise<AppUser[]> => {
  const { data: { users } } = await supabaseClient!.auth.admin.listUsers()
  
  return users
    .map(u => ({
      id: u.id,
      email: u.email || '',
      nombre: u.user_metadata?.nombre || u.email?.split('@')[0] || '',
      rol: (u.user_metadata?.rol as UserRole) || 'vendedor',
    }))
    .filter(u => ['admin', 'vendedor', 'reportes'].includes(u.rol))
}

export const crearUsuario = async (
  email: string,
  password: string,
  nombre: string,
  rol: UserRole
): Promise<{ error?: string }> => {
  const { data, error } = await supabaseClient!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return {}
}

export const actualizarUsuario = async (
  userId: string,
  updates: { nombre?: string; rol?: UserRole }
): Promise<{ error?: string }> => {
  const { error } = await supabaseClient!.auth.admin.updateUserById(userId, {
    user_metadata: updates,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return {}
}

export const eliminarUsuario = async (userId: string): Promise<{ error?: string }> => {
  const { error } = await supabaseClient!.auth.admin.deleteUser(userId)
  
  if (error) {
    return { error: error.message }
  }
  
  return {}
}
