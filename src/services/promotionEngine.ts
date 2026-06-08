// ============================================================
// PROMOTION ENGINE v2
// Motor de evaluación de campañas comerciales.
// Evalúa: estado → fechas → productos → categorías →
// filtros → exclusiones → prioridad → acumulación → beneficio
//
// Sin lógica quemada. Toda regla desde Supabase.
// ============================================================

import { Product } from '../types'
import {
  MktCampania, MktCampaniaRegla, MktItemCalculado,
  MktResultadoEngine, MktResultadoMultiples, MktBeneficioAplicado,
  MktEngineInput,
} from '../types/marketing'
import { validate2x28Promotion, Validate2x28Item } from './promotionValidator'
import { mktFetchCampanias, mktValidarCupon, mktIncrementarUsoCupon, mktRegistrarOperacion } from './campaignService'

// Cache para catálogos
let cachedCatalogos: { id: string; productos: { producto_id: string }[] }[] | null = null

async function getCatalogos() {
  if (!cachedCatalogos) {
    try {
      const sb = (await import('./supabaseClient')).getSupabase()
      const client = await sb
      if (client) {
        const { data } = await client
          .from('catalogos')
          .select('id, nombre, productos:catalogos_productos(producto_id)')
        cachedCatalogos = (data || []) as any
      }
    } catch {
      cachedCatalogos = []
    }
  }
  return cachedCatalogos || []
}

export function invalidarCatalogoCache() {
  cachedCatalogos = null
}

// ============================================================
// 1. FILTRAR PRODUCTOS POR CAMPAÑA
// ============================================================

async function filtrarProductos(
  productos: Product[],
  campania: MktCampania
): Promise<Product[]> {
  let resultado = [...productos]

  // a) Filtrar por catálogo
  if (campania.catalogo_id) {
    const catalogos = await getCatalogos()
    const catalogo = catalogos.find(c => c.id === campania.catalogo_id)
    if (catalogo?.productos?.length) {
      const ids = new Set(catalogo.productos.map(p => p.producto_id))
      resultado = resultado.filter(p => ids.has(p.id))
    }
  }

  // a2) Excluir productos de catálogos excluidos
  if (campania.catalogos_excluidos && campania.catalogos_excluidos.length > 0) {
    const catalogos = await getCatalogos()
    const excluirIds = new Set<string>()
    for (const cat of catalogos) {
      if (campania.catalogos_excluidos.includes(cat.id) && cat.productos) {
        for (const p of cat.productos) {
          excluirIds.add(p.producto_id)
        }
      }
    }
    if (excluirIds.size > 0) {
      resultado = resultado.filter(p => !excluirIds.has(p.id))
    }
  }

  // b) Filtrar por productos asignados directamente
  if (campania.productos && campania.productos.length > 0) {
    const ids = new Set(campania.productos.map(p => p.producto_id))
    resultado = resultado.filter(p => ids.has(p.id))
  }

  // c) Filtrar por categorías
  if (campania.categorias && campania.categorias.length > 0) {
    const cats = new Set(campania.categorias.map(c => c.categoria_id))
    resultado = resultado.filter(p => cats.has(p.category))
  }

  // d) Filtrar por filtros dinámicos (soporta color_tipo a nivel variante)
  if (campania.filtros && campania.filtros.length > 0) {
    resultado = resultado.filter(p =>
      campania.filtros!.every(f => {
        // Si el filtro es por color_tipo, evaluar a nivel variante
        if (f.campo === 'color_tipo' && (p as any).stockByVariants && (p as any).stockByVariants.length > 0) {
          const targets = f.valor.split(',').map(v => v.trim())
          switch (f.operador) {
            case '=': return (p as any).stockByVariants.some((v: any) => v.color_tipo === f.valor)
            case '!=': return (p as any).stockByVariants.some((v: any) => v.color_tipo && v.color_tipo !== f.valor)
            case 'IN': return (p as any).stockByVariants.some((v: any) => v.color_tipo && targets.includes(v.color_tipo))
            case 'NOT IN': return (p as any).stockByVariants.some((v: any) => v.color_tipo && !targets.includes(v.color_tipo))
            default: return true
          }
        }
        const val = (p as any)[f.campo]
        const valorStr = String(val ?? '')
        switch (f.operador) {
          case '=': return valorStr === f.valor
          case '!=': return valorStr !== f.valor
          case 'IN': return f.valor.split(',').map(v => v.trim()).includes(valorStr)
          case 'NOT IN': return !f.valor.split(',').map(v => v.trim()).includes(valorStr)
          case '>': return Number(val) > Number(f.valor)
          case '<': return Number(val) < Number(f.valor)
          case '>=': return Number(val) >= Number(f.valor)
          case '<=': return Number(val) <= Number(f.valor)
          default: return true
        }
      })
    )
  }

  return resultado
}

// ============================================================
// 2. EVALUAR REGLA
// ============================================================

function evaluarRegla(
  regla: MktCampaniaRegla,
  items: { producto: Product; cantidad: number; colorTipo?: string }[]
): { itemsCalculados: MktItemCalculado[]; beneficio: MktBeneficioAplicado } | null {
  if (items.length === 0) return null

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0)
  const subtotal = items.reduce((s, i) => s + i.producto.price * i.cantidad, 0)
  const config = regla.configuracion_json || {}

  // Validar cantidad mínima
  if (regla.cantidad_minima > 0 && totalItems < regla.cantidad_minima) return null

  // Validar cantidad máxima
  if (regla.cantidad_maxima > 0 && totalItems > regla.cantidad_maxima) return null

  // Validar monto mínimo
  if (regla.monto_minimo > 0 && subtotal < regla.monto_minimo) return null

  // Validar monto máximo
  if (regla.monto_maximo > 0 && subtotal > regla.monto_maximo) return null

  let itemsCalculados: MktItemCalculado[]
  let beneficio: MktBeneficioAplicado

  switch (regla.tipo_regla) {
    // ==============================
    case 'PRECIO_FIJO': {
      // Si hay config "aplica_cada" + "gratis", es modalidad "compra X, lleva Y gratis"
      if (config.aplica_cada && config.gratis) {
        return evaluarCompraXLlevaY(regla, items, config)
      }
      // Precio fijo por cada N unidades — con pares color/oscuro si aplica
      const unidadesPorLote = regla.cantidad_minima || items[0]?.cantidad || 1
      let lotes: number
      let sueltos: number
      let itemsParaPrecioSueltos: { producto: Product; cantidad: number; colorTipo?: string }[]

      if (config.parear_color_tipo) {
        const itemsForValidation: Validate2x28Item[] = items.map(i => ({
          productId: i.producto.id,
          price: i.producto.price,
          quantity: i.cantidad,
          colorTipo: i.colorTipo,
          colorName: i.producto.color,
        }))
        const validation = validate2x28Promotion(itemsForValidation)

        if (!validation.valid) {
          return null
        }

        lotes = Math.floor(totalItems / unidadesPorLote)
        sueltos = 0
        itemsParaPrecioSueltos = []
      } else {
        lotes = Math.floor(totalItems / unidadesPorLote)
        sueltos = totalItems % unidadesPorLote
        itemsParaPrecioSueltos = items.slice(0, sueltos)
      }

      const precioLotes = lotes * (regla.precio_fijo || 0)
      const precioSueltos = itemsParaPrecioSueltos.reduce((s, i) => s + i.producto.price * 1, 0) // 1 unidad de cada item suelto

      const precioTotal = precioLotes + precioSueltos
      const descuentoTotal = subtotal - precioTotal

      // Distribuir descuento proporcionalmente
      itemsCalculados = items.map(i => {
        const proporcion = (i.producto.price * i.cantidad) / subtotal
        const descuento = descuentoTotal * proporcion
        const precioPromocion = i.producto.price - (descuento / i.cantidad)
        return {
          producto: i.producto,
          cantidad: i.cantidad,
          precio_original: i.producto.price,
          precio_promocion: Math.max(precioPromocion, 0),
          descuento_unitario: Math.max(i.producto.price - precioPromocion, 0),
          descuento_total: Math.round(descuento * 100) / 100,
        }
      })

      beneficio = {
        tipo: 'PRECIO_FIJO',
        descripcion: `${unidadesPorLote} x $${(regla.precio_fijo || 0).toFixed(2)}`,
        precio_fijo: regla.precio_fijo || 0,
        cantidad_minima: unidadesPorLote,
      }
      break
    }

    // ==============================
    case 'PORCENTAJE': {
      const descTotal = subtotal * (regla.porcentaje / 100)
      itemsCalculados = items.map(i => {
        const desc = i.producto.price * i.cantidad * (regla.porcentaje / 100)
        const precioPromo = i.producto.price * (1 - regla.porcentaje / 100)
        return {
          producto: i.producto,
          cantidad: i.cantidad,
          precio_original: i.producto.price,
          precio_promocion: Math.round(precioPromo * 100) / 100,
          descuento_unitario: Math.round((i.producto.price - precioPromo) * 100) / 100,
          descuento_total: Math.round(desc * 100) / 100,
        }
      })
      beneficio = {
        tipo: 'PORCENTAJE',
        descripcion: `${regla.porcentaje}% de descuento`,
        porcentaje: regla.porcentaje,
      }
      break
    }

    // ==============================
    case 'MONTO_FIJO': {
      const descFijo = Math.min(regla.descuento_fijo || regla.monto_minimo, subtotal)
      itemsCalculados = items.map(i => {
        const proporcion = (i.producto.price * i.cantidad) / subtotal
        const desc = descFijo * proporcion
        const precioPromo = i.producto.price - (desc / i.cantidad)
        return {
          producto: i.producto,
          cantidad: i.cantidad,
          precio_original: i.producto.price,
          precio_promocion: Math.max(precioPromo, 0),
          descuento_unitario: Math.max(i.producto.price - precioPromo, 0),
          descuento_total: Math.round(desc * 100) / 100,
        }
      })
      beneficio = {
        tipo: 'MONTO_FIJO',
        descripcion: `$${descFijo.toFixed(2)} de descuento`,
        descuento_fijo: descFijo,
      }
      break
    }

    // ==============================
    case 'COMBO': {
      // Combo: precio fijo por lote
      const precioCombo = regla.precio_fijo
      const itemsCombo = regla.cantidad_minima || items.length
      const combos = Math.floor(totalItems / itemsCombo)
      if (combos === 0) return null

      const precioCombos = combos * precioCombo
      const descuentoTotal = subtotal - precioCombos

      itemsCalculados = items.map(i => {
        const proporcion = (i.producto.price * i.cantidad) / subtotal
        const desc = descuentoTotal * proporcion
        const precioPromo = i.producto.price - (desc / i.cantidad)
        return {
          producto: i.producto,
          cantidad: i.cantidad,
          precio_original: i.producto.price,
          precio_promocion: Math.max(precioPromo, 0),
          descuento_unitario: Math.max(i.producto.price - precioPromo, 0),
          descuento_total: Math.round(desc * 100) / 100,
        }
      })
      beneficio = {
        tipo: 'COMBO',
        descripcion: `Combo ${itemsCombo} x $${precioCombo.toFixed(2)}`,
        precio_fijo: precioCombo,
        cantidad_minima: itemsCombo,
      }
      break
    }

    // ==============================
    case 'COMPRA_X_LLEVA_Y': {
      return evaluarCompraXLlevaY(regla, items, config)
    }

    // ==============================
    case 'ENVIO_GRATIS': {
      // Envío gratis: aplica si monto_minimo está cubierto
      if (regla.monto_minimo > 0 && subtotal < regla.monto_minimo) return null

      itemsCalculados = items.map(i => ({
        producto: i.producto,
        cantidad: i.cantidad,
        precio_original: i.producto.price,
        precio_promocion: i.producto.price,
        descuento_unitario: 0,
        descuento_total: 0,
      }))
      beneficio = {
        tipo: 'ENVIO_GRATIS',
        descripcion: regla.monto_minimo > 0
          ? `Envío gratis en compras > $${regla.monto_minimo.toFixed(2)}`
          : 'Envío gratis',
        envio_gratis: true,
        monto_minimo: regla.monto_minimo > 0 ? regla.monto_minimo : undefined,
      }
      break
    }

    default:
      return null
  }

  return { itemsCalculados, beneficio }
}

// ==============================
// Helper: Compra X Lleva Y
// ==============================
function evaluarCompraXLlevaY(
  regla: MktCampaniaRegla,
  items: { producto: Product; cantidad: number; colorTipo?: string }[],
  config: Record<string, any>
): { itemsCalculados: MktItemCalculado[]; beneficio: MktBeneficioAplicado } | null {
  const aplicaCada = config.aplica_cada || regla.cantidad_minima || 2
  const gratis = config.gratis || 1
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0)

  if (totalItems < aplicaCada) return null

  // Ordenar por precio ascendente para regalar los más baratos
  const itemsFlat: { producto: Product; idx: number }[] = []
  items.forEach(i => {
    for (let n = 0; n < i.cantidad; n++) {
      itemsFlat.push({ producto: i.producto, idx: items.indexOf(i) })
    }
  })
  itemsFlat.sort((a, b) => a.producto.price - b.producto.price)

  // Calcular cuántos salen gratis
  const grupos = Math.floor(totalItems / aplicaCada)
  const totalGratis = grupos * gratis
  const itemsPagados = totalItems - totalGratis

  // Los más baratos son gratis
  const gratisSet = new Set(itemsFlat.slice(0, totalGratis).map(x => `${x.producto.id}-${x.idx}`))

  const itemsCalculados: MktItemCalculado[] = items.map(i => {
    let pagados = 0
    let descuentoTotal = 0
    for (let n = 0; n < i.cantidad; n++) {
      const key = `${i.producto.id}-${items.indexOf(i)}`
      if (gratisSet.has(key)) {
        descuentoTotal += i.producto.price
      } else {
        pagados++
      }
    }
    const precioPromo = i.producto.price - (descuentoTotal / i.cantidad)
    return {
      producto: i.producto,
      cantidad: i.cantidad,
      precio_original: i.producto.price,
      precio_promocion: Math.max(precioPromo, 0),
      descuento_unitario: Math.max(i.producto.price - precioPromo, 0) / i.cantidad,
      descuento_total: descuentoTotal,
    }
  })

  const beneficio: MktBeneficioAplicado = {
    tipo: 'COMPRA_X_LLEVA_Y',
    descripcion: `Compra ${aplicaCada} lleva ${gratis} gratis`,
    cantidad_minima: aplicaCada,
    configuracion: { aplica_cada: aplicaCada, gratis },
  }

  return { itemsCalculados, beneficio }
}

// ============================================================
// 3. VERIFICAR EXCLUSIONES
// ============================================================

function tieneExclusion(
  campania: MktCampania,
  campañasAplicadas: MktCampania[]
): boolean {
  if (!campania.exclusiones || campania.exclusiones.length === 0) return false

  const excluyeIds = new Set(campania.exclusiones.map(e => e.campania_excluida_id))
  return campañasAplicadas.some(c => excluyeIds.has(c.id))
}

// ============================================================
// 4. ENGINE PRINCIPAL
// ============================================================

export async function mktEvaluar(
  input: MktEngineInput
): Promise<MktResultadoMultiples> {
  const resultados: MktResultadoEngine[] = []
  const campañasAplicadas: MktCampania[] = []
  const productosRestantes = [...input.items]

  // Obtener campañas activas
  const campañas = await mktFetchCampanias({ activas: true })

  // Si hay cupón, validarlo y filtrar
  let cuponCampaniaId: string | null = null
  if (input.cuponCodigo) {
    const validacion = await mktValidarCupon(input.cuponCodigo)
    if (validacion.valido && validacion.campania) {
      cuponCampaniaId = validacion.campania.id
    }
  }

  // Ordenar por prioridad descendente
  const ordenadas = [...campañas].sort((a, b) => b.prioridad - a.prioridad)

  for (const campania of ordenadas) {
    // Si es por cupón y no coincide el cupón, saltar
    if (cuponCampaniaId && campania.id !== cuponCampaniaId) continue

    // Verificar exclusión con campañas ya aplicadas
    if (tieneExclusion(campania, campañasAplicadas)) continue

    // Filtrar productos que aplican a esta campaña
    const productosFiltrados = await filtrarProductos(
      productosRestantes.map(i => i.producto),
      campania
    )

    if (productosFiltrados.length === 0) continue

    // Obtener items filtrados con sus cantidades
    const itemsFiltrados = input.items
      .filter(i => productosFiltrados.some(p => p.id === i.producto.id))
      .map(i => ({ ...i }))

    if (itemsFiltrados.length === 0) continue

    // Evaluar regla
    const regla = campania.reglas?.[0]
    if (!regla) continue

    const evaluacion = evaluarRegla(regla, itemsFiltrados)
    if (!evaluacion) continue

    // Calcular envío
    const envioGratis = evaluacion.beneficio.envio_gratis || regla.envio_gratis
    const envioCalculado = envioGratis ? 0 : (input.costoEnvio || 0)

    // Calcular totales
    const subtotalOriginal = itemsFiltrados.reduce((s, i) => s + i.producto.price * i.cantidad, 0)
    const descuentoTotal = evaluacion.itemsCalculados.reduce((s, i) => s + i.descuento_total, 0)
    const total = subtotalOriginal - descuentoTotal + envioCalculado

    const resultado: MktResultadoEngine = {
      campania,
      items: evaluacion.itemsCalculados,
      subtotal_original: subtotalOriginal,
      descuento_total: descuentoTotal,
      envio_gratis: envioGratis,
      envio_calculado: envioCalculado,
      total,
      beneficio: evaluacion.beneficio,
    }

    resultados.push(resultado)
    campañasAplicadas.push(campania)

    // Si es exclusiva, no evaluar más campañas sobre estos productos
    if (campania.es_exclusiva) {
      const idsAplicados = new Set(itemsFiltrados.map(i => i.producto.id))
      // Remover productos ya cubiertos por campaña exclusiva
      for (let i = productosRestantes.length - 1; i >= 0; i--) {
        if (idsAplicados.has(productosRestantes[i].producto.id)) {
          productosRestantes.splice(i, 1)
        }
      }
      if (productosRestantes.length === 0) break
    }

    // Si no permite acumulación, terminar
    if (!campania.permite_acumulacion) break
  }

  // Calcular totales finales
  const totalOriginal = input.items.reduce((s, i) => s + i.producto.price * i.cantidad, 0)
  const totalDescuento = resultados.reduce((s, r) => s + r.descuento_total, 0)
  const tieneEnvioGratis = resultados.some(r => r.envio_gratis)
  const envioFinal = tieneEnvioGratis ? 0 : (input.costoEnvio || 0)

  return {
    resultados,
    total_original: totalOriginal,
    total_descuento: totalDescuento,
    total_final: totalOriginal - totalDescuento + envioFinal,
    envio_final: envioFinal,
    campañas_aplicadas: resultados.map(r => r.campania.id),
  }
}

// ============================================================
// 5. APLICAR CUPÓN
// ============================================================

export async function mktAplicarCupon(
  codigo: string,
  input: MktEngineInput
): Promise<{ resultado: MktResultadoMultiples | null; error?: string }> {
  const validacion = await mktValidarCupon(codigo)
  if (!validacion.valido) {
    return { resultado: null, error: validacion.error }
  }

  const resultado = await mktEvaluar({
    ...input,
    cuponCodigo: codigo,
  })

  if (resultado.resultados.length === 0) {
    return { resultado: null, error: 'El cupón no aplica a los productos seleccionados' }
  }

  return { resultado }
}

// ============================================================
// 6. REGISTRAR OPERACIÓN POST-VENTA
// ============================================================

export async function mktFinalizarOperacion(data: {
  resultado: MktResultadoMultiples
  venta_id?: string
  reserva_id?: string
  tipo_operacion: 'venta' | 'reserva' | 'cotizacion'
}): Promise<void> {
  for (const r of data.resultado.resultados) {
    await mktRegistrarOperacion({
      campania_id: r.campania.id,
      venta_id: data.venta_id,
      reserva_id: data.reserva_id,
      tipo_operacion: data.tipo_operacion,
      beneficio_aplicado: r.beneficio,
      total_descuento: r.descuento_total,
    })
  }
}
