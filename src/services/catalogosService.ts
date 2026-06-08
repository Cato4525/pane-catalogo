import { CatalogoSeccion, Product } from '../types'

let cachedCatalogos: CatalogoSeccion[] | null = null
let lastFetch = 0
const CACHE_TTL = 60000

async function getSb() {
  const { getSupabase } = await import('./supabaseClient')
  return getSupabase()
}

export async function fetchCatalogos(force = false): Promise<CatalogoSeccion[]> {
  const now = Date.now()
  if (!cachedCatalogos || force || now - lastFetch > CACHE_TTL) {
    const sb = await getSb()
    if (!sb) {
      cachedCatalogos = []
      lastFetch = now
      return []
    }

    const { data, error } = await sb
      .from('catalogos')
      .select(`*, productos:catalogos_productos(*)`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[fetchCatalogos]', error)
      cachedCatalogos = []
      lastFetch = now
      return []
    }

    cachedCatalogos = (data || []) as CatalogoSeccion[]
    lastFetch = now
  }

  const nowISO = new Date().toISOString()
  return cachedCatalogos.map(c => ({
    ...c,
    productos: c.productos?.filter(p => !p.fecha_vencimiento || p.fecha_vencimiento > nowISO),
  }))
}

export async function fetchCatalogoById(id: string): Promise<CatalogoSeccion | null> {
  const sb = await getSb()
  if (!sb) return null

  const { data, error } = await sb
    .from('catalogos')
    .select(`*, productos:catalogos_productos(*)`)
    .eq('id', id)
    .limit(1)

  if (error) {
    console.error('[fetchCatalogoById]', error)
    return null
  }

  if (!data || data.length === 0) return null
  return data[0] as CatalogoSeccion
}

export async function crearCatalogo(data: Partial<CatalogoSeccion>): Promise<CatalogoSeccion | null> {
  const sb = await getSb()
  if (!sb) return null

  const { data: catalogo, error } = await sb.from('catalogos').insert({
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    tipo: data.tipo || 'personalizado',
  }).select().single()

  if (error) {
    console.error('[crearCatalogo]', error)
    return null
  }

  invalidarCacheCatalogos()
  return catalogo as CatalogoSeccion
}

export async function actualizarCatalogo(id: string, data: Partial<CatalogoSeccion>): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const updateData: Record<string, any> = {}
  if (data.nombre !== undefined) updateData.nombre = data.nombre
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion

  const { error } = await sb.from('catalogos').update(updateData).eq('id', id)
  if (error) {
    console.error('[actualizarCatalogo]', error)
    return false
  }

  invalidarCacheCatalogos()
  return true
}

export async function eliminarCatalogo(id: string): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.from('catalogos').delete().eq('id', id)
  if (error) {
    console.error('[eliminarCatalogo]', error)
    return false
  }

  invalidarCacheCatalogos()
  return true
}

export async function asignarProductoCatalogo(
  catalogoId: string,
  productoId: string,
  fechaVencimiento?: string
): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { data: existing } = await sb
    .from('catalogos_productos')
    .select('id')
    .eq('catalogo_id', catalogoId)
    .eq('producto_id', productoId)
    .limit(1)

  if (existing && existing.length > 0) {
    const { error } = await sb
      .from('catalogos_productos')
      .update({ fecha_vencimiento: fechaVencimiento || null })
      .eq('id', existing[0].id)
    if (error) {
      console.error('[asignarProductoCatalogo update]', error)
      return false
    }
  } else {
    const { error } = await sb.from('catalogos_productos').insert({
      catalogo_id: catalogoId,
      producto_id: productoId,
      fecha_vencimiento: fechaVencimiento || null,
    })
    if (error) {
      console.error('[asignarProductoCatalogo insert]', error)
      return false
    }
  }

  invalidarCacheCatalogos()
  return true
}

export async function quitarProductoCatalogo(catalogoId: string, productoId: string): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb
    .from('catalogos_productos')
    .delete()
    .eq('catalogo_id', catalogoId)
    .eq('producto_id', productoId)

  if (error) {
    console.error('[quitarProductoCatalogo]', error)
    return false
  }

  invalidarCacheCatalogos()
  return true
}

export function filtrarProductosPorCatalogo(
  productos: Product[],
  catalogo: CatalogoSeccion
): Product[] {
  if (catalogo.nombre === 'Todos') {
    return productos
  }

  if (catalogo.productos && catalogo.productos.length > 0) {
    const ids = new Set(catalogo.productos.map(p => p.producto_id))
    return productos.filter(p => ids.has(p.id))
  }

  return []
}

export function invalidarCacheCatalogos(): void {
  cachedCatalogos = null
  lastFetch = 0
}
