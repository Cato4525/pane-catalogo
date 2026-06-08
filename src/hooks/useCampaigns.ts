// ============================================================
// HOOKS v2 — Campañas Comerciales
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Product, CatalogoSeccion } from '../types'
import {
  MktCampania, MktCampaniaFiltrosBusqueda,
  MktResultadoMultiples, MktEngineInput,
} from '../types/marketing'
import { mktFetchCampanias, mktFetchCampaniaById } from '../services/campaignService'
import { mktEvaluar } from '../services/promotionEngine'

/** Obtiene los IDs de productos que pertenecen a catálogos excluidos */
export function getExcludedProductIds(
  catalogosExcluidosIds: string[] | null | undefined,
  catalogosSecciones: CatalogoSeccion[]
): Set<string> {
  const ids = new Set<string>()
  if (!catalogosExcluidosIds || catalogosExcluidosIds.length === 0) return ids
  for (const cat of catalogosSecciones) {
    if (catalogosExcluidosIds.includes(cat.id) && cat.productos) {
      for (const p of cat.productos) {
        ids.add(p.producto_id)
      }
    }
  }
  return ids
}

// ============================================================
// useMktCampanias — Listar campañas
// ============================================================

export function useMktCampanias(filtros?: MktCampaniaFiltrosBusqueda) {
  const [campanias, setCampanias] = useState<MktCampania[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await mktFetchCampanias(filtros)
      setCampanias(data)
    } catch (e: any) {
      setError(e?.message || 'Error al cargar campañas')
    }
    setLoading(false)
  }, [filtros?.activas, filtros?.categoria, filtros?.estado, filtros?.search, filtros?.tipo])

  useEffect(() => { load() }, [load])

  return { campanias, loading, error, reload: load }
}

// ============================================================
// useMktCampaniaDetalle — Campaña individual
// ============================================================

export function useMktCampaniaDetalle(id: string | undefined) {
  const [campania, setCampania] = useState<MktCampania | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await mktFetchCampaniaById(id)
      setCampania(data)
    } catch (e: any) {
      setError(e?.message || 'Error al cargar campaña')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return { campania, loading, error }
}

// ============================================================
// useMktEngine — Evaluar carrito contra motor
// ============================================================

export function useMktEngine() {
  const [resultado, setResultado] = useState<MktResultadoMultiples | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const evaluar = useCallback(async (input: MktEngineInput) => {
    setLoading(true)
    setError(null)
    try {
      const r = await mktEvaluar(input)
      setResultado(r)
    } catch (e: any) {
      setError(e?.message || 'Error al evaluar campañas')
    }
    setLoading(false)
  }, [])

  return { resultado, loading, error, evaluar }
}

// ============================================================
// useMktProductosFiltrados — Productos que aplican a una campaña
// ============================================================

export function useMktProductosFiltrados(
  campania: MktCampania | null,
  productos: Product[],
  productosExcluidos?: Set<string>
) {
  const [filtrados, setFiltrados] = useState<Product[]>([])

  useEffect(() => {
    if (!campania || productos.length === 0) {
      setFiltrados([])
      return
    }

    // Filtrado simple por catálogo (el engine tiene más lógica)
    let result = [...productos]

    if (campania.catalogo_id) {
      // El engine usa catálogos, pero para vista rápida filtramos inline
      // (el engine hará el filtrado completo)
    }

    // Excluir productos de catálogos excluidos
    if (productosExcluidos && productosExcluidos.size > 0) {
      result = result.filter(p => !productosExcluidos.has(p.id))
    }

    if (campania.categorias && campania.categorias.length > 0) {
      const cats = new Set(campania.categorias.map(c => c.categoria_id))
      result = result.filter(p => cats.has(p.category))
    }

    if (campania.filtros && campania.filtros.length > 0) {
      result = result.filter(p =>
        campania.filtros!.every(f => {
          const targets = f.valor.split(',').map(v => v.trim())

          // Evaluar a nivel variante si el filtro es por color_tipo
          if (f.campo === 'color_tipo' && (p as any).stockByVariants?.length) {
            let matchesVariant = false
            switch (f.operador) {
              case '=':
                matchesVariant = (p as any).stockByVariants.some((v: any) => v.color_tipo === f.valor)
                break
              case 'IN':
                matchesVariant = (p as any).stockByVariants.some((v: any) => v.color_tipo && targets.includes(v.color_tipo))
                break
              default:
                matchesVariant = true
            }
            if (matchesVariant) return true
            // fall through to product-level check below
          }

          const val = (p as any)[f.campo]
          const valorStr = String(val ?? '')
          switch (f.operador) {
            case '=': return valorStr === f.valor
            case 'IN': return targets.includes(valorStr)
            default: return true
          }
        })
      )
    }

    if (campania.productos && campania.productos.length > 0) {
      const ids = new Set(campania.productos.map(p => p.producto_id))
      result = result.filter(p => ids.has(p.id))
    }

    setFiltrados(result)
  }, [campania?.id, productos.map(p => p.id).join(','), productosExcluidos?.size, Array.from(productosExcluidos || []).join(',')])

  return filtrados
}
