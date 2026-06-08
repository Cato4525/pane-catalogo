import { useState, useEffect, useCallback } from 'react'
import { Campania, Product, CalculoPromocion } from '../types'
import { fetchCampaniasActivas, fetchCampaniaById, filtrarProductosPorCampania, calcularPromocion } from '../services/promocionesService'

export function usePromociones() {
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCampaniasActivas()
      setCampanias(data)
    } catch (e: any) {
      setError(e?.message || 'Error al cargar promociones')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { campanias, loading, error, reload: load }
}

export function usePromocionDetalle(id: string | undefined) {
  const [campania, setCampania] = useState<Campania | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCampaniaById(id)
      setCampania(data)
    } catch (e: any) {
      setError(e?.message || 'Error al cargar promoción')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return { campania, loading, error }
}

export function useProductosFiltrados(campania: Campania | null, productos: Product[]) {
  const [filtrados, setFiltrados] = useState<Product[]>([])

  useEffect(() => {
    if (!campania || productos.length === 0) {
      setFiltrados([])
      return
    }
    setFiltrados(filtrarProductosPorCampania(productos, campania))
  }, [campania, productos])

  return filtrados
}

export function useCalculoPromocion(
  campania: Campania | null,
  items: { producto: Product; cantidad: number }[],
  costoEnvio = 0
) {
  const [calculo, setCalculo] = useState<CalculoPromocion | null>(null)

  useEffect(() => {
    if (!campania || items.length === 0) {
      setCalculo(null)
      return
    }
    setCalculo(calcularPromocion(campania, items, costoEnvio))
  }, [campania, items, costoEnvio])

  return calculo
}
