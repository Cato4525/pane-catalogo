// ============================================================
// CART CAMPAIGN STORE v2
// Carrito independiente para campañas comerciales.
// NO interfiere con el carrito normal de Tienda.tsx ni POS.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '../types'
import { MktCartItem, MktCampania, MktResultadoEngine, MktResultadoMultiples } from '../types/marketing'
import { mktEvaluar } from '../services/promotionEngine'
import { validatePromotionRules, ValidatePromotionItem } from '../services/promotionValidator'

function calcularMensajePromo(items: MktCartItem[], campania: MktCampania | null): string {
  if (!campania) return ''
  const regla = campania.reglas?.[0]
  const config = regla?.configuracion_json || {}
  const rules = config.promotion_rules

  if (rules) {
    const validateItems: ValidatePromotionItem[] = items.map(i => ({
      productId: i.producto.id,
      price: i.producto.price,
      quantity: i.cantidad,
      colorTipo: i.colorTipo,
      colorName: i.producto.color,
    }))
    const result = validatePromotionRules(rules, validateItems)
    if (result.valid) {
      if (rules.colorCombinationMode === 'different') return '✅ Pares color/oscuro completos'
      if (rules.colorCombinationMode === 'same') return '✅ Productos del mismo grupo de color'
      return '✅ Combinaciones válidas'
    }
    return result.message ? `⚠️ ${result.message}` : ''
  }

  if (!config?.parear_color_tipo) return ''
  const colores = items.filter(i => i.colorTipo === 'color').reduce((s, i) => s + i.cantidad, 0)
  const oscuros = items.filter(i => i.colorTipo === 'oscuro').reduce((s, i) => s + i.cantidad, 0)
  if (colores === 0 && oscuros === 0) return ''
  const min = Math.min(colores, oscuros)
  const sinPar = (colores - min) + (oscuros - min)
  if (sinPar === 0) return '✅ Pares color/oscuro completos'
  if (colores === oscuros) return `💡 ${sinPar} producto${sinPar > 1 ? 's' : ''} sin pareja`
  return `⚠️ Necesitas 1 color + 1 oscuro por par. Faltan: ${colores > oscuros ? `${colores - oscuros} color(es)` : `${oscuros - colores} oscuro(s)`}`
}

interface CartCampaignState {
  items: MktCartItem[]
  campania: MktCampania | null
  resultado: MktResultadoEngine | null
  resultadoMulti: MktResultadoMultiples | null
  cuponAplicado: string | null
  loading: boolean
  mensajePromo: string

  // Acciones
  initFromCampania: (campania: MktCampania) => void
  addItem: (producto: Product, precioPromocion: number, variant?: { variantId?: string; colorId?: string; colorName?: string; colorHex?: string; sizeId?: string; sizeName?: string; colorTipo?: string }) => void
  removeItem: (productoId: string) => void
  updateCantidad: (productoId: string, cantidad: number) => void
  clearCart: () => void
  setCupon: (codigo: string | null) => void
  recalcular: (costoEnvio?: number) => Promise<void>
  getSubtotal: () => number
  getTotalItems: () => number
}

export const useCartCampaignStore = create<CartCampaignState>()(
  persist(
    (set, get) => ({
      items: [],
      campania: null,
      resultado: null,
      resultadoMulti: null,
      cuponAplicado: null,
      loading: false,
      mensajePromo: '',

      initFromCampania: (campania) => {
        set({ campania, items: [], resultado: null, resultadoMulti: null, cuponAplicado: null, mensajePromo: '' })
      },

      addItem: (producto, precioPromocion, variant) => {
        const { items } = get()
        const itemKey = variant?.variantId || producto.id
        const existing = items.find(i => {
          const ik = i.variantId || i.producto.id
          return ik === itemKey
        })
        if (existing) {
          set({
            items: items.map(i => {
              const ik = i.variantId || i.producto.id
              return ik === itemKey ? { ...i, cantidad: i.cantidad + 1 } : i
            }),
          })
        } else {
          set({
            items: [...items, {
              producto,
              cantidad: 1,
              precio_promocion: precioPromocion,
              ...variant,
            }],
          })
        }
        get().recalcular()
      },

      removeItem: (productoId) => {
        const { items } = get()
        set({ items: items.filter(i => (i.variantId || i.producto.id) !== productoId) })
        get().recalcular()
      },

      updateCantidad: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId)
          return
        }
        const { items } = get()
        set({
          items: items.map(i =>
            (i.variantId || i.producto.id) === productoId ? { ...i, cantidad } : i
          ),
        })
        const { items: newItems, campania } = get()
        set({ mensajePromo: calcularMensajePromo(newItems, campania) })
        get().recalcular()
      },

      clearCart: () => {
        set({ items: [], resultado: null, resultadoMulti: null, cuponAplicado: null, campania: null, mensajePromo: '' })
      },

      setCupon: (codigo) => {
        set({ cuponAplicado: codigo })
        get().recalcular()
      },

      recalcular: async (costoEnvio = 0) => {
        const { items, cuponAplicado, campania } = get()
        if (items.length === 0) {
          set({ resultado: null, resultadoMulti: null, mensajePromo: '' })
          return
        }

        set({ loading: true })

        try {
          const input = {
            items: items.map(i => ({ producto: i.producto, cantidad: i.cantidad, colorTipo: i.colorTipo })),
            costoEnvio,
            cuponCodigo: cuponAplicado || undefined,
          }

          const multiResult = await mktEvaluar(input)
          set({ resultadoMulti: multiResult })

          // Si hay una campaña específica seleccionada, mostrar su resultado individual
          if (campania) {
            const r = multiResult.resultados.find(r => r.campania.id === campania.id)
            set({ resultado: r || null })
          } else if (multiResult.resultados.length > 0) {
            set({ resultado: multiResult.resultados[0] })
          } else {
            set({ resultado: null })
          }
        } catch (e) {
          console.error('[cartCampaign recalcular]', e)
        }

        set({ mensajePromo: calcularMensajePromo(get().items, campania), loading: false })
      },

      getSubtotal: () => {
        return get().items.reduce((s, i) => s + i.precio_promocion * i.cantidad, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((s, i) => s + i.cantidad, 0)
      },
    }),
    {
      name: 'cart-campaign-storage',
      partialize: (state) => ({
        items: state.items,
        campania: state.campania,
        cuponAplicado: state.cuponAplicado,
      }),
    }
  )
)
