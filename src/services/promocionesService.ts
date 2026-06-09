import { Campania, CampaniaRegla, Product, CarritoPromocionItem, CalculoPromocion, CatalogoSeccion, PromocionAplicada } from '../types'
import { validate2x28Promotion, Validate2x28Item, validatePromotionRules, ValidatePromotionItem } from './promotionValidator'

let cachedCampanias: Campania[] | null = null
let lastFetch = 0
const CACHE_TTL = 60000

async function getSb() {
  const { getSupabase } = await import('./supabaseClient')
  return getSupabase()
}

export async function fetchCampaniasActivas(force = false): Promise<Campania[]> {
  const now = Date.now()
  if (!cachedCampanias || force || now - lastFetch > CACHE_TTL) {
    const sb = await getSb()
    if (!sb) {
      cachedCampanias = []
      lastFetch = now
      return []
    }

    const { data, error } = await sb
      .from('campanias')
      .select(`
        *,
        reglas:campanias_reglas(*),
        productos:campanias_productos(*),
        filtros:campanias_filtros(*)
      `)
      .eq('estado', 'activo')
      .order('prioridad', { ascending: false })

    if (error) {
      console.error('[fetchCampaniasActivas]', error)
      cachedCampanias = []
      lastFetch = now
      return []
    }

    cachedCampanias = (data || []) as Campania[]
    lastFetch = now
  }

  const nowISO = new Date().toISOString()
  return (cachedCampanias || []).filter(c => {
    if (c.fecha_inicio && c.fecha_inicio > nowISO) return false
    if (c.fecha_fin && c.fecha_fin < nowISO) return false
    return true
  })
}

export async function fetchCampaniaById(id: string): Promise<Campania | null> {
  const sb = await getSb()
  if (!sb) return null

  const { data, error } = await sb
    .from('campanias')
    .select(`
      *,
      reglas:campanias_reglas(*),
      productos:campanias_productos(*),
      filtros:campanias_filtros(*)
    `)
    .eq('id', id)
    .limit(1)

  if (error) {
    console.error('[fetchCampaniaById]', error)
    return null
  }

  if (!data || data.length === 0) return null
  return data[0] as Campania
}

export async function fetchCampaniasAdmin(): Promise<Campania[]> {
  const sb = await getSb()
  if (!sb) return []

  const { data, error } = await sb
    .from('campanias')
    .select(`
      *,
      reglas:campanias_reglas(*),
      productos:campanias_productos(*),
      filtros:campanias_filtros(*)
    `)
    .order('prioridad', { ascending: false })

  if (error) {
    console.error('[fetchCampaniasAdmin]', error)
    return []
  }

  return (data || []) as Campania[]
}

export async function crearCampania(data: Partial<Campania>): Promise<Campania | null> {
  const sb = await getSb()
  if (!sb) return null

  const insertPayload: Record<string, any> = {
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    tipo: data.tipo,
    estado: data.estado || 'borrador',
    fecha_inicio: data.fecha_inicio || null,
    fecha_fin: data.fecha_fin || null,
    prioridad: data.prioridad || 0,
  }

  if (data.catalogo_id) insertPayload.catalogo_id = data.catalogo_id
  if (data.catalogo_excluir_id) insertPayload.catalogo_excluir_id = data.catalogo_excluir_id

  const { data: campania, error } = await sb.from('campanias').insert(insertPayload).select().single()

  if (error) {
    console.error('[crearCampania]', error)
    return null
  }

  invalidarCacheCampanias()
  return campania as Campania
}

export async function actualizarCampania(id: string, data: Partial<Campania>): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const updateData: Record<string, any> = {}
  if (data.nombre !== undefined) updateData.nombre = data.nombre
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
  if (data.tipo !== undefined) updateData.tipo = data.tipo
  if (data.estado !== undefined) updateData.estado = data.estado
  if (data.prioridad !== undefined) updateData.prioridad = data.prioridad
  if (data.catalogo_id !== undefined) { if (data.catalogo_id) updateData.catalogo_id = data.catalogo_id }
  if (data.catalogo_excluir_id !== undefined) { if (data.catalogo_excluir_id) updateData.catalogo_excluir_id = data.catalogo_excluir_id; else updateData.catalogo_excluir_id = null }
  if (data.fecha_inicio !== undefined) updateData.fecha_inicio = data.fecha_inicio
  if (data.fecha_fin !== undefined) updateData.fecha_fin = data.fecha_fin

  const { error } = await sb.from('campanias').update(updateData).eq('id', id)
  if (error) {
    console.error('[actualizarCampania]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

export async function eliminarCampania(id: string): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.from('campanias').delete().eq('id', id)
  if (error) {
    console.error('[eliminarCampania]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

export async function guardarReglas(campaniaId: string, reglas: Partial<CampaniaRegla>): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error } = await sb.from('campanias_reglas').insert({
    campania_id: campaniaId,
    tipo_regla: reglas.tipo_regla || '',
    cantidad_minima: reglas.cantidad_minima || 0,
    monto_minimo: reglas.monto_minimo || 0,
    porcentaje: reglas.porcentaje || 0,
    precio_fijo: reglas.precio_fijo || 0,
    envio_gratis: reglas.envio_gratis || false,
  })
  if (error) {
    console.error('[guardarReglas]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

export async function asignarProductos(campaniaId: string, productoIds: string[]): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error: delError } = await sb.from('campanias_productos').delete().eq('campania_id', campaniaId)
  if (delError) {
    console.error('[asignarProductos delete]', delError)
    return false
  }

  if (productoIds.length === 0) return true

  const inserts = productoIds.map(producto_id => ({ campania_id: campaniaId, producto_id: producto_id }))
  const { error } = await sb.from('campanias_productos').insert(inserts)
  if (error) {
    console.error('[asignarProductos insert]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

export async function guardarFiltros(campaniaId: string, filtros: { campo: string; operador: string; valor: string }[]): Promise<boolean> {
  const sb = await getSb()
  if (!sb) return false

  const { error: delError } = await sb.from('campanias_filtros').delete().eq('campania_id', campaniaId)
  if (delError) {
    console.error('[guardarFiltros delete]', delError)
    return false
  }

  if (filtros.length === 0) return true

  const inserts = filtros.map(f => ({ campania_id: campaniaId, ...f }))
  const { error } = await sb.from('campanias_filtros').insert(inserts)
  if (error) {
    console.error('[guardarFiltros insert]', error)
    return false
  }

  invalidarCacheCampanias()
  return true
}

let cachedCatalogosLookup: CatalogoSeccion[] | null = null
async function getCatalogosLookup(): Promise<CatalogoSeccion[]> {
  if (!cachedCatalogosLookup) {
    try {
      const { fetchCatalogos } = await import('./catalogosService')
      cachedCatalogosLookup = await fetchCatalogos()
    } catch {
      cachedCatalogosLookup = []
    }
  }
  return cachedCatalogosLookup
}

export function invalidarCacheCatalogosLookup(): void {
  cachedCatalogosLookup = null
}

export function getCatalogoNombreFromCampania(campania: Campania): string {
  if (!campania.catalogo_id) return 'Todos los productos'
  const catalogo = cachedCatalogosLookup?.find(c => c.id === campania.catalogo_id)
  return catalogo?.nombre || '—'
}

function getCatalogoExcluirNombre(campania: Campania): string {
  if (!campania.catalogo_excluir_id) return ''
  const catalogo = cachedCatalogosLookup?.find(c => c.id === campania.catalogo_excluir_id)
  return catalogo?.nombre || '—'
}

export function filtrarProductosPorCampania(productos: Product[], campania: Campania): Product[] {
  // 1. Filtrar por catálogo si tiene catalogo_id
  let filtrados = productos
  if (campania.catalogo_id) {
    const catalogo = cachedCatalogosLookup?.find(c => c.id === campania.catalogo_id)
    if (catalogo && catalogo.productos && catalogo.productos.length > 0) {
      const ids = new Set(catalogo.productos.map(p => p.producto_id))
      filtrados = filtrados.filter(p => ids.has(p.id))
    }
  }

  // 1b. Excluir productos de catalogo_excluir_id
  if (campania.catalogo_excluir_id) {
    const excluir = cachedCatalogosLookup?.find(c => c.id === campania.catalogo_excluir_id)
    if (excluir && excluir.productos && excluir.productos.length > 0) {
      const excluirIds = new Set(excluir.productos.map(p => p.producto_id))
      filtrados = filtrados.filter(p => !excluirIds.has(p.id))
    }
  }

  // 2. Filtrar por productos asignados directamente
  if (campania.productos && campania.productos.length > 0) {
    const ids = new Set(campania.productos.map(p => p.producto_id))
    return filtrados.filter(p => ids.has(p.id))
  }

  // 3. Filtrar por filtros dinámicos
  if (campania.filtros && campania.filtros.length > 0) {
    return filtrados.filter(p => {
      return campania.filtros!.every(f => {
        // Si el filtro es por color_tipo, evaluar a nivel variante
        if (f.campo === 'color_tipo' && p.stockByVariants && p.stockByVariants.length > 0) {
          const targets = f.valor.split(',').map(v => v.trim())
          switch (f.operador) {
            case '=': return p.stockByVariants.some(v => v.color_tipo === f.valor)
            case '!=': return p.stockByVariants.some(v => v.color_tipo && v.color_tipo !== f.valor)
            case 'IN': return p.stockByVariants.some(v => v.color_tipo && targets.includes(v.color_tipo))
            case 'NOT IN': return p.stockByVariants.some(v => v.color_tipo && !targets.includes(v.color_tipo))
            default: return true
          }
        }
        const val = (p as any)[f.campo]
        switch (f.operador) {
          case '=': return String(val) === f.valor
          case '!=': return String(val) !== f.valor
          case 'IN': return f.valor.split(',').map(v => v.trim()).includes(String(val))
          case 'NOT IN': return !f.valor.split(',').map(v => v.trim()).includes(String(val))
          default: return true
        }
      })
    })
  }

  return filtrados
}

export function calcularPromocion(
  campania: Campania,
  items: { producto: Product; cantidad: number; colorTipo?: string }[],
  costoEnvio = 0
): CalculoPromocion {
  const regla = campania.reglas?.[0]
  const subtotalOriginal = items.reduce((s, i) => s + i.producto.price * i.cantidad, 0)

  const calculatedItems: CarritoPromocionItem[] = items.map(i => ({
    producto: i.producto,
    cantidad: i.cantidad,
    precioPromocion: i.producto.price,
    descuento: 0,
  }))

  let envioFinal = costoEnvio

  switch (campania.tipo) {
    case 'PRECIO_FIJO': {
      if (regla && regla.cantidad_minima > 0 && regla.precio_fijo > 0) {
        const reglaConfig = (regla as any).configuracion_json || {}
        const promRules = reglaConfig.promotion_rules
        if (regla.parear_color_tipo || promRules) {
          const itemsForValidation: ValidatePromotionItem[] = items.map(i => ({
            productId: i.producto.id,
            price: i.producto.price,
            quantity: i.cantidad,
            colorTipo: i.colorTipo,
            colorName: i.producto.color,
          }))

          let validation
          if (promRules) {
            validation = validatePromotionRules(promRules, itemsForValidation)
          } else {
            const legacyItems: Validate2x28Item[] = itemsForValidation
            validation = validate2x28Promotion(legacyItems)
          }

          if (validation.valid) {
            const totalQty = items.reduce((s, i) => s + i.cantidad, 0)
            const grupos = Math.floor(totalQty / regla.cantidad_minima)
            const unitPromo = regla.precio_fijo / regla.cantidad_minima
            let remaining = grupos * regla.cantidad_minima

            for (const item of calculatedItems) {
              if (remaining <= 0) break
              const qty = Math.min(item.cantidad, remaining)
              item.precioPromocion = ((item.producto.price * (item.cantidad - qty)) + (unitPromo * qty)) / item.cantidad
              item.descuento = (item.producto.price - item.precioPromocion) * item.cantidad
              remaining -= qty
            }
          }
        } else {
          // Comportamiento original: aplicar promo a los primeros N productos
          const totalQty = items.reduce((s, i) => s + i.cantidad, 0)
          const grupos = Math.floor(totalQty / regla.cantidad_minima)
          if (grupos > 0) {
            let remaining = grupos * regla.cantidad_minima
            const unitPromo = regla.precio_fijo / regla.cantidad_minima
            for (const item of calculatedItems) {
              if (remaining <= 0) break
              const qty = Math.min(item.cantidad, remaining)
              item.precioPromocion = ((item.producto.price * (item.cantidad - qty)) + (unitPromo * qty)) / item.cantidad
              item.descuento = (item.producto.price - item.precioPromocion) * item.cantidad
              remaining -= qty
            }
          }
        }
      }
      break
    }

    case 'PORCENTAJE': {
      if (regla && regla.porcentaje > 0) {
        if (!regla.monto_minimo || subtotalOriginal >= regla.monto_minimo) {
          for (const item of calculatedItems) {
            item.precioPromocion = item.producto.price * (1 - regla.porcentaje / 100)
            item.descuento = (item.producto.price - item.precioPromocion) * item.cantidad
          }
        }
      }
      break
    }

    case 'MONTO_FIJO': {
      if (regla && regla.precio_fijo > 0) {
        if (!regla.monto_minimo || subtotalOriginal >= regla.monto_minimo) {
          const discount = Math.min(regla.precio_fijo, subtotalOriginal)
          for (const item of calculatedItems) {
            const ratio = (item.producto.price * item.cantidad) / subtotalOriginal
            item.descuento = discount * ratio
            item.precioPromocion = item.producto.price - (item.descuento / item.cantidad)
          }
        }
      }
      break
    }

    case 'COMBO': {
      if (regla && regla.cantidad_minima > 0 && regla.precio_fijo > 0) {
        const totalQty = items.reduce((s, i) => s + i.cantidad, 0)
        const combos = Math.floor(totalQty / regla.cantidad_minima)
        if (combos > 0) {
          let remaining = combos * regla.cantidad_minima
          for (const item of calculatedItems) {
            if (remaining <= 0) break
            const qty = Math.min(item.cantidad, remaining)
            const unitPromo = regla.precio_fijo / regla.cantidad_minima
            const sinCombo = item.cantidad - qty
            item.precioPromocion = ((item.producto.price * sinCombo) + (unitPromo * qty)) / item.cantidad
            item.descuento = (item.producto.price - item.precioPromocion) * item.cantidad
            remaining -= qty
          }
        }
      }
      break
    }

    case 'ENVIO_GRATIS': {
      if (!regla?.monto_minimo || subtotalOriginal >= regla.monto_minimo) {
        envioFinal = 0
      }
      break
    }

    case 'COMPRA_X_LLEVA_Y': {
      if (regla && regla.cantidad_minima > 0 && regla.precio_fijo > 0) {
        const totalQty = items.reduce((s, i) => s + i.cantidad, 0)
        if (totalQty >= regla.cantidad_minima) {
          let freeItems = Math.floor(totalQty / (regla.cantidad_minima + (regla.precio_fijo > 0 ? 1 : 0)))
          if (freeItems > 0 && regla.precio_fijo > 0) {
            freeItems = Math.floor(totalQty / (regla.cantidad_minima + 1))
          }
          if (freeItems > 0) {
            const sortedByPrice = [...calculatedItems].sort((a, b) => b.producto.price - a.producto.price)
            let freeRemaining = freeItems
            for (const item of sortedByPrice) {
              if (freeRemaining <= 0) break
              const freeQty = Math.min(item.cantidad, freeRemaining)
              item.precioPromocion = (item.precioPromocion * (item.cantidad - freeQty)) / item.cantidad
              item.descuento = (item.producto.price - item.precioPromocion) * item.cantidad
              freeRemaining -= freeQty
            }
          }
        }
      }
      break
    }
  }

  const descuentoTotal = calculatedItems.reduce((s, i) => s + i.descuento, 0)

  const envioGratis = envioFinal === 0

  return {
    items: calculatedItems,
    subtotalOriginal,
    descuentoTotal,
    envio: envioFinal,
    envioGratis,
    total: subtotalOriginal - descuentoTotal + envioFinal,
    promocionesAplicadas: descuentoTotal > 0 || envioGratis ? [{
      campania_id: campania.id,
      campania_nombre: campania.nombre,
      campania_tipo: campania.tipo,
      descuento: descuentoTotal,
      descripcion: campania.tipo === 'ENVIO_GRATIS'
        ? 'Envío gratis'
        : `${campania.nombre} (-$${descuentoTotal.toFixed(2)})`,
    }] : [],
  }
}

export async function calcularMejorCampania(
  items: { producto: Product; cantidad: number }[],
  costoEnvio = 0
): Promise<CalculoPromocion | null> {
  const activas = await fetchCampaniasActivas()
  if (activas.length === 0) return null

  if (cachedCatalogosLookup === null) {
    await getCatalogosLookup()
  }

  for (const campania of activas) {
    const productosCampania = filtrarProductosPorCampania(
      items.map(i => i.producto),
      campania
    )
    const itemsFiltrados = items.filter(i => productosCampania.some(p => p.id === i.producto.id))
    if (itemsFiltrados.length === 0) continue

    return calcularPromocion(campania, itemsFiltrados, costoEnvio)
  }

  return null
}

export function invalidarCacheCampanias(): void {
  cachedCampanias = null
  lastFetch = 0
}
