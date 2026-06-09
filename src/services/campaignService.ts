// ============================================================
// CAMPAIGN SERVICE v2
// CRUD completo para el nuevo sistema de campañas comerciales.
// Completamente independiente de promocionesService.ts existente.
// ============================================================

import {
  MktCampania, MktCampaniaRegla, MktCampaniaFiltro,
  MktCampaniaCategoria, MktCampaniaExclusion, MktCupon,
  MktEstadoCampania, MktCampaniaFiltrosBusqueda,
} from '../types/marketing'
import { invalidarCacheCampanias } from './promocionesService'

// ---------- helpers privados ----------

async function getSb() {
  const { getSupabase } = await import('./supabaseClient')
  return getSupabase()
}

const CAMPANIA_SELECT = `
  *,
  reglas:campanias_reglas(*),
  productos:campanias_productos(*),
  categorias:campanias_categorias(*),
  filtros:campanias_filtros(*),
  exclusiones:campanias_exclusiones!campania_id(*)
`

function mapCampania(row: any): MktCampania {
  return {
    ...row,
    permite_acumulacion: row.permite_acumulacion ?? false,
    es_exclusiva: row.es_exclusiva ?? false,
    catalogos_excluidos: row.catalogos_excluidos || [],
      reglas: row.reglas?.map((r: any) => ({
        ...r,
        cantidad_maxima: r.cantidad_maxima ?? 0,
        descuento_fijo: r.descuento_fijo ?? 0,
        configuracion_json: typeof r.configuracion_json === 'string'
          ? JSON.parse(r.configuracion_json)
          : (r.configuracion_json || {}),
      })) || [],
    categorias: row.categorias || [],
    exclusiones: row.exclusiones || [],
  }
}

// ============================================================
// CRUD CAMPANIAS
// ============================================================

export async function mktFetchCampanias(
  filtros?: MktCampaniaFiltrosBusqueda
): Promise<MktCampania[]> {
  const sb = await getSb()
  if (!sb) return []

  let query = sb
    .from('campanias')
    .select(CAMPANIA_SELECT)
    .order('prioridad', { ascending: false })

  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado)
  }
  if (filtros?.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }
  if (filtros?.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros?.search) {
    query = query.ilike('nombre', `%${filtros.search}%`)
  }
  if (filtros?.activas) {
    const now = new Date().toISOString()
    query = query.eq('estado', 'activo')
    query = query.or(`and(fecha_inicio.is.null,fecha_fin.is.null),and(fecha_inicio.is.null,fecha_fin.gte.${now}),and(fecha_inicio.lte.${now},fecha_fin.is.null),and(fecha_inicio.lte.${now},fecha_fin.gte.${now})`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[mktFetchCampanias] ERROR:', error)
    return []
  }

  return (data || []).map(mapCampania)
}

export async function mktFetchCampaniaById(id: string): Promise<MktCampania | null> {
  const sb = await getSb()
  if (!sb) return null

  const { data, error } = await sb
    .from('campanias')
    .select(CAMPANIA_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('[mktFetchCampaniaById]', error)
    return null
  }

  return mapCampania(data)
}

export async function mktCrearCampania(
  data: Partial<MktCampania> & {
    reglas?: Partial<MktCampaniaRegla>[]
    filtros?: Omit<MktCampaniaFiltro, 'id' | 'campania_id' | 'created_at'>[]
    categorias?: Omit<MktCampaniaCategoria, 'id' | 'campania_id' | 'created_at'>[]
    exclusiones?: Omit<MktCampaniaExclusion, 'id' | 'campania_id' | 'created_at'>[]
    productos?: string[]
  }
): Promise<MktCampania | null> {
  const sb = await getSb()
  if (!sb) return null

  const { reglas, filtros, categorias, exclusiones, productos, ...campos } = data

  const { data: campania, error } = await sb
    .from('campanias')
    .insert({
      nombre: campos.nombre,
      descripcion: campos.descripcion || '',
      tipo: campos.tipo || 'PRECIO_FIJO',
      categoria: campos.categoria || 'PROMOCION',
      estado: campos.estado || 'borrador',
      prioridad: campos.prioridad || 0,
      permite_acumulacion: campos.permite_acumulacion ?? true,
      es_exclusiva: campos.es_exclusiva ?? false,
      catalogos_excluidos: campos.catalogos_excluidos || [],
      fecha_inicio: campos.fecha_inicio || null,
      fecha_fin: campos.fecha_fin || null,
    })
    .select()
    .single()

  if (error || !campania) {
    console.error('[mktCrearCampania]', error)
    return null
  }

  const campaniaId = campania.id

  // Reglas
  if (reglas && reglas.length > 0) {
    await sb.from('campanias_reglas').insert(
      reglas.map(r => ({
        campania_id: campaniaId,
        tipo_regla: r.tipo_regla || campos.tipo || 'PRECIO_FIJO',
        cantidad_minima: r.cantidad_minima || 0,
        cantidad_maxima: r.cantidad_maxima || 0,
        monto_minimo: r.monto_minimo || 0,
        monto_maximo: r.monto_maximo || 0,
        porcentaje: r.porcentaje || 0,
        precio_fijo: r.precio_fijo || 0,
        descuento_fijo: r.descuento_fijo || 0,
        envio_gratis: r.envio_gratis || false,
        configuracion_json: r.configuracion_json || null,
      }))
    )
  }

  // Filtros
  if (filtros && filtros.length > 0) {
    await sb.from('campanias_filtros').insert(
      filtros.map(f => ({ campania_id: campaniaId, ...f }))
    )
  }

  // Categorías
  if (categorias && categorias.length > 0) {
    await sb.from('campanias_categorias').insert(
      categorias.map(c => ({ campania_id: campaniaId, ...c }))
    )
  }

  // Exclusiones
  if (exclusiones && exclusiones.length > 0) {
    await sb.from('campanias_exclusiones').insert(
      exclusiones.map(e => ({ campania_id: campaniaId, ...e }))
    )
  }

  // Productos
  if (productos && productos.length > 0) {
    await sb.from('campanias_productos').insert(
      productos.map(pid => ({ campania_id: campaniaId, producto_id: pid }))
    )
  }

  invalidarCacheCampanias()
  return mktFetchCampaniaById(campaniaId)
}

export async function mktActualizarCampania(
  id: string,
  data: Partial<MktCampania> & {
    reglas?: Partial<MktCampaniaRegla>[]
    filtros?: Omit<MktCampaniaFiltro, 'id' | 'campania_id' | 'created_at'>[]
    categorias?: Omit<MktCampaniaCategoria, 'id' | 'campania_id' | 'created_at'>[]
    exclusiones?: Omit<MktCampaniaExclusion, 'id' | 'campania_id' | 'created_at'>[]
    productos?: string[]
  }
): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { reglas, filtros, categorias, exclusiones, productos, ...campos } = data

  // Actualizar campos base
  const updateData: Record<string, any> = {}
  if (campos.nombre !== undefined) updateData.nombre = campos.nombre
  if (campos.descripcion !== undefined) updateData.descripcion = campos.descripcion
  if (campos.tipo !== undefined) updateData.tipo = campos.tipo
  if (campos.categoria !== undefined) updateData.categoria = campos.categoria
  if (campos.estado !== undefined) updateData.estado = campos.estado
  if (campos.prioridad !== undefined) updateData.prioridad = campos.prioridad
  if (campos.permite_acumulacion !== undefined) updateData.permite_acumulacion = campos.permite_acumulacion
  if (campos.es_exclusiva !== undefined) updateData.es_exclusiva = campos.es_exclusiva
  if (campos.catalogos_excluidos !== undefined) updateData.catalogos_excluidos = campos.catalogos_excluidos
  if (campos.fecha_inicio !== undefined) updateData.fecha_inicio = campos.fecha_inicio
  if (campos.fecha_fin !== undefined) updateData.fecha_fin = campos.fecha_fin

  if (Object.keys(updateData).length > 0) {
    const { error } = await sb.from('campanias').update(updateData).eq('id', id)
    if (error) {
      console.error('[mktActualizarCampania]', error)
      return false
    }
  }

  // Reglas: reemplazar (delete + insert)
  if (reglas) {
    await sb.from('campanias_reglas').delete().eq('campania_id', id)
    if (reglas.length > 0) {
      await sb.from('campanias_reglas').insert(
        reglas.map(r => ({
          campania_id: id,
          tipo_regla: r.tipo_regla || 'PRECIO_FIJO',
          cantidad_minima: r.cantidad_minima || 0,
          cantidad_maxima: r.cantidad_maxima || 0,
          monto_minimo: r.monto_minimo || 0,
          monto_maximo: r.monto_maximo || 0,
          porcentaje: r.porcentaje || 0,
          precio_fijo: r.precio_fijo || 0,
          descuento_fijo: r.descuento_fijo || 0,
          envio_gratis: r.envio_gratis || false,
          configuracion_json: r.configuracion_json || null,
        }))
      )
    }
  }

  // Filtros: reemplazar
  if (filtros) {
    await sb.from('campanias_filtros').delete().eq('campania_id', id)
    if (filtros.length > 0) {
      await sb.from('campanias_filtros').insert(
        filtros.map(f => ({ campania_id: id, ...f }))
      )
    }
  }

  // Categorías: reemplazar
  if (categorias) {
    await sb.from('campanias_categorias').delete().eq('campania_id', id)
    if (categorias.length > 0) {
      await sb.from('campanias_categorias').insert(
        categorias.map(c => ({ campania_id: id, ...c }))
      )
    }
  }

  // Exclusiones: reemplazar
  if (exclusiones) {
    await sb.from('campanias_exclusiones').delete().eq('campania_id', id)
    if (exclusiones.length > 0) {
      await sb.from('campanias_exclusiones').insert(
        exclusiones.map(e => ({ campania_id: id, ...e }))
      )
    }
  }

  // Productos: reemplazar
  if (productos) {
    await sb.from('campanias_productos').delete().eq('campania_id', id)
    if (productos.length > 0) {
      await sb.from('campanias_productos').insert(
        productos.map(pid => ({ campania_id: id, producto_id: pid }))
      )
    }
  }

  invalidarCacheCampanias()
  return true
}

export async function mktEliminarCampania(id: string): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.from('campanias').delete().eq('id', id)
  if (error) {
    console.error('[mktEliminarCampania]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

export async function mktCambiarEstado(id: string, estado: MktEstadoCampania): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.from('campanias').update({ estado }).eq('id', id)
  if (error) {
    console.error('[mktCambiarEstado]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

// ============================================================
// CUPONES
// ============================================================

export async function mktFetchCupones(campaniaId?: string): Promise<MktCupon[]> {
  const sb = await getSb()
  if (!sb) return []

  let query = sb.from('cupones').select('*, campania:campanias(*)')
  if (campaniaId) {
    query = query.eq('campania_id', campaniaId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[mktFetchCupones]', error)
    return []
  }

  return (data || []) as MktCupon[]
}

export async function mktCrearCupon(
  data: Pick<MktCupon, 'codigo' | 'campania_id'> & {
    usos_maximos?: number
    fecha_expiracion?: string | null
  }
): Promise<MktCupon | null> {
  const sb = await getSb()
  if (!sb) return null

  const { data: cupon, error } = await sb
    .from('cupones')
    .insert({
      codigo: data.codigo.toUpperCase(),
      campania_id: data.campania_id,
      usos_maximos: data.usos_maximos || 1,
      fecha_expiracion: data.fecha_expiracion || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[mktCrearCupon]', error)
    return null
  }

  return cupon as MktCupon
}

export async function mktValidarCupon(
  codigo: string
): Promise<{ valido: boolean; cupon?: MktCupon; campania?: MktCampania; error?: string }> {
  const sb = await getSb()
  if (!sb) return { valido: false, error: 'Sin conexión' }

  const { data: cupon, error } = await sb
    .from('cupones')
    .select('*, campania:campanias(*)')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()

  if (error || !cupon) {
    return { valido: false, error: 'Cupón no encontrado' }
  }

  if (!cupon.activo) {
    return { valido: false, error: 'Cupón inactivo' }
  }

  if (cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) < new Date()) {
    return { valido: false, error: 'Cupón expirado' }
  }

  if (cupon.usos_maximos > 0 && cupon.usos_actuales >= cupon.usos_maximos) {
    return { valido: false, error: 'Cupón agotado' }
  }

  return { valido: true, cupon: cupon as MktCupon, campania: mapCampania(cupon.campania) }
}

export async function mktIncrementarUsoCupon(id: string): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.rpc('incrementar_uso_cupon', { cupon_id: id })
  if (error) {
    // Fallback: update directo
    const { error: updateError } = await sb
      .from('cupones')
      .update({ usos_actuales: sb.rpc('increment', { x: 1 }) as any })
      .eq('id', id)
    if (updateError) {
      console.error('[mktIncrementarUsoCupon]', updateError)
      return false
    }
  }

  return true
}

// ============================================================
// OPERACIONES
// ============================================================

export async function mktRegistrarOperacion(data: {
  campania_id: string
  venta_id?: string
  reserva_id?: string
  tipo_operacion: 'venta' | 'reserva' | 'cotizacion'
  beneficio_aplicado: any
  total_descuento: number
}): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.from('operaciones_campanias').insert(data)
  if (error) {
    console.error('[mktRegistrarOperacion]', error)
    return false
  }

  return true
}

export async function mktFetchOperaciones(
  campaniaId?: string
): Promise<any[]> {
  const sb = await getSb()
  if (!sb) return []

  let query = sb
    .from('operaciones_campanias')
    .select('*, campania:campanias(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (campaniaId) {
    query = query.eq('campania_id', campaniaId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[mktFetchOperaciones]', error)
    return []
  }

  return data || []
}
