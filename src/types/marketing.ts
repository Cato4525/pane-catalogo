// ============================================================
// MARKETING TYPES v2 — Subsistema de Campañas Comerciales
// Completamente desacoplado del sistema de tipos existente.
// No modifica ni depende de types/index.ts.
// ============================================================

import { Product } from './index'

// ============================================================
// ENUMS Y CONSTANTES
// ============================================================

export type MktEstadoCampania = 'activo' | 'inactivo' | 'borrador'
export type MktTipoCampania = 'PRECIO_FIJO' | 'PORCENTAJE' | 'MONTO_FIJO' | 'COMPRA_X_LLEVA_Y' | 'COMBO' | 'ENVIO_GRATIS'
export type MktCategoriaCampania = 'PROMOCION' | 'DESCUENTO' | 'OFERTA' | 'LIQUIDACION' | 'BLACK_FRIDAY' | 'TEMPORADA'
export type MktTipoOperacion = 'venta' | 'reserva' | 'cotizacion'

// ============================================================
// CORE: Campaña v2
// ============================================================

export interface MktCampaniaRegla {
  id?: string
  campania_id?: string
  tipo_regla: MktTipoCampania
  cantidad_minima: number
  cantidad_maxima: number
  monto_minimo: number
  monto_maximo: number
  porcentaje: number
  precio_fijo: number
  descuento_fijo: number
  envio_gratis: boolean
  configuracion_json: Record<string, any>
  created_at?: string
}

export interface MktCampaniaFiltro {
  id?: string
  campania_id?: string
  campo: string
  operador: '=' | '!=' | 'IN' | 'NOT IN' | '>' | '<' | '>=' | '<='
  valor: string
  created_at?: string
}

export interface MktCampaniaProducto {
  id?: string
  campania_id?: string
  producto_id: string
  created_at?: string
}

export interface MktCampaniaCategoria {
  id?: string
  campania_id?: string
  categoria_id: string
  created_at?: string
}

export interface MktCampaniaExclusion {
  id?: string
  campania_id?: string
  campania_excluida_id: string
  created_at?: string
}

export interface MktCampania {
  id: string
  codigo?: string
  nombre: string
  descripcion: string
  tipo: MktTipoCampania
  categoria: MktCategoriaCampania
  estado: MktEstadoCampania
  prioridad: number
  permite_acumulacion: boolean
  es_exclusiva: boolean
  catalogo_id?: string | null
  catalogos_excluidos?: string[] | null
  fecha_inicio: string | null
  fecha_fin: string | null
  created_at: string
  updated_at: string

  // Relaciones (populadas por el servicio)
  reglas?: MktCampaniaRegla[]
  productos?: MktCampaniaProducto[]
  categorias?: MktCampaniaCategoria[]
  filtros?: MktCampaniaFiltro[]
  exclusiones?: MktCampaniaExclusion[]
}

// ============================================================
// CUPONES
// ============================================================

export interface MktCupon {
  id: string
  codigo: string
  campania_id: string
  usos_maximos: number
  usos_actuales: number
  fecha_expiracion: string | null
  activo: boolean
  created_at: string
  updated_at: string

  // Populado
  campania?: MktCampania
}

// ============================================================
// OPERACIONES (auditoría)
// ============================================================

export interface MktOperacionCampania {
  id: string
  campania_id: string
  venta_id?: string
  reserva_id?: string
  tipo_operacion: MktTipoOperacion
  beneficio_aplicado: MktBeneficioAplicado
  total_descuento: number
  created_at: string

  // Populado
  campania?: MktCampania
}

// ============================================================
// BENEFICIOS Y RESULTADOS DEL ENGINE
// ============================================================

export interface MktBeneficioAplicado {
  tipo: MktTipoCampania
  descripcion: string
  cantidad_minima?: number
  cantidad_maxima?: number
  porcentaje?: number
  precio_fijo?: number
  descuento_fijo?: number
  monto_minimo?: number
  envio_gratis?: boolean
  configuracion?: Record<string, any>
}

export interface MktItemCalculado {
  producto: Product
  cantidad: number
  precio_original: number
  precio_promocion: number
  descuento_unitario: number
  descuento_total: number
}

export interface MktResultadoEngine {
  campania: MktCampania
  items: MktItemCalculado[]
  subtotal_original: number
  descuento_total: number
  envio_gratis: boolean
  envio_calculado: number
  total: number
  beneficio: MktBeneficioAplicado
}

export interface MktResultadoMultiples {
  resultados: MktResultadoEngine[]
  total_original: number
  total_descuento: number
  total_final: number
  envio_final: number
  campañas_aplicadas: string[]
}

// ============================================================
// CARRITO DE CAMPAÑA (independiente)
// ============================================================

export interface MktCartItem {
  producto: Product
  cantidad: number
  precio_promocion: number
  variantId?: string
  colorId?: string
  colorName?: string
  colorHex?: string
  sizeId?: string
  sizeName?: string
  colorTipo?: string
}

export interface MktCartState {
  items: MktCartItem[]
  campania: MktCampania | null
  resultado: MktResultadoEngine | null
  loading: boolean
}

// ============================================================
// FILTROS DE BÚSQUEDA
// ============================================================

export interface MktCampaniaFiltrosBusqueda {
  categoria?: MktCategoriaCampania
  tipo?: MktTipoCampania
  estado?: MktEstadoCampania
  search?: string
  activas?: boolean
}

// ============================================================
// INPUTS DEL ENGINE
// ============================================================

export interface MktEngineInputItem {
  producto: Product
  cantidad: number
  colorTipo?: string
}

export interface MktEngineInput {
  items: MktEngineInputItem[]
  costoEnvio?: number
  cuponCodigo?: string
  clienteId?: string
  soloActivas?: boolean
  limitarAPromociones?: boolean
}

// ============================================================
// CONSTANTES
// ============================================================

export const MKT_TIPO_LABELS: Record<MktTipoCampania, string> = {
  PRECIO_FIJO: 'Precio Fijo',
  PORCENTAJE: 'Porcentaje',
  MONTO_FIJO: 'Monto Fijo',
  COMPRA_X_LLEVA_Y: 'Compra x Lleva Y',
  COMBO: 'Combo',
  ENVIO_GRATIS: 'Envío Gratis',
}

export const MKT_CATEGORIA_LABELS: Record<MktCategoriaCampania, string> = {
  PROMOCION: 'Promoción',
  DESCUENTO: 'Descuento',
  OFERTA: 'Oferta',
  LIQUIDACION: 'Liquidación',
  BLACK_FRIDAY: 'Black Friday',
  TEMPORADA: 'Temporada',
}

export const MKT_CATEGORIA_COLORS: Record<MktCategoriaCampania, string> = {
  PROMOCION: '#22c55e',
  DESCUENTO: '#3b82f6',
  OFERTA: '#f59e0b',
  LIQUIDACION: '#ef4444',
  BLACK_FRIDAY: '#8b5cf6',
  TEMPORADA: '#06b6d4',
}

export const MKT_TIPO_COLORS: Record<MktTipoCampania, string> = {
  PRECIO_FIJO: '#22c55e',
  PORCENTAJE: '#3b82f6',
  MONTO_FIJO: '#f59e0b',
  COMPRA_X_LLEVA_Y: '#8b5cf6',
  COMBO: '#ec4899',
  ENVIO_GRATIS: '#06b6d4',
}
