import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Campania, Product, CarritoPromocionItem, Cliente, ABONO_MINIMO } from '../types'
import { calcularPromocion } from '../services/promocionesService'
import { validate2x28Promotion, Validate2x28Item, validatePromotionRules, ValidatePromotionItem, getCartColorTypesTip } from '../services/promotionValidator'
import supabase from '../services/supabaseClient'

interface PromocionesCartState {
  campania: Campania | null
  items: CarritoPromocionItem[]
  cliente: Cliente | null
  mensajePromo: string | null

  initCart: (campania: Campania) => void
  addItem: (producto: Product, precioPromocion: number, colorTipo?: string) => void
  removeItem: (productId: string) => void
  updateCantidad: (productId: string, cantidad: number) => void
  clearCart: () => void
  setCliente: (cliente: Cliente | null) => void

  getSubtotalOriginal: () => number
  getDescuentoTotal: () => number
  getTotal: () => number
  getItemCount: () => number
  getEnvio: () => number

  crearReservaPromocion: (abono: number) => Promise<{ reserva: any; resumen: any } | null>
}

function calcularMensajePromo(items: CarritoPromocionItem[], campania: Campania | null): string | null {
  if (!campania?.reglas?.[0]) return null
  const regla = campania.reglas[0]
  const config = (regla as any).configuracion_json || {}
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
    if (result.valid) return null
    const tip = getCartColorTypesTip(validateItems, rules)
    if (tip) return `💡 ${tip}`
    return result.message ? `⚠️ ${result.message}` : null
  }

  if (!regla.parear_color_tipo) return null
  if (!regla.cantidad_minima || !regla.precio_fijo) return null

  const itemsForValidation: Validate2x28Item[] = items.map(i => ({
    productId: i.producto.id,
    price: i.producto.price,
    quantity: i.cantidad,
    colorTipo: i.colorTipo,
    colorName: i.producto.color,
  }))
  const validation = validate2x28Promotion(itemsForValidation)

  if (validation.valid) {
    return `✅ Promoción 2x$${regla.precio_fijo} completa: 1 color + 1 oscuro`
  }

  const totalQty = items.reduce((s, i) => s + i.cantidad, 0)
  if (totalQty < 2) {
    const colores = items.filter(i => i.colorTipo === 'color').reduce((s, i) => s + i.cantidad, 0)
    const oscuros = items.filter(i => i.colorTipo === 'oscuro').reduce((s, i) => s + i.cantidad, 0)
    if (colores > 0 && oscuros === 0) return `💡 Agrega un producto con color oscuro para completar la promo 2x$${regla.precio_fijo}`
    if (oscuros > 0 && colores === 0) return `💡 Agrega un producto con color para completar la promo 2x$${regla.precio_fijo}`
    if (colores === 0 && oscuros === 0) return `💡 Agrega 2 productos para completar la promo 2x$${regla.precio_fijo}`
  }

  return validation.message ? `⚠️ ${validation.message}` : null
}

export const usePromocionesCartStore = create<PromocionesCartState>()(
  persist(
    (set, get) => ({
      campania: null,
      items: [],
      cliente: null,
      mensajePromo: null,

      initCart: (campania) => {
        set({ campania, items: [], mensajePromo: null })
      },

      addItem: (producto, precioPromocion, colorTipo) => {
        const state = get()
        const items = state.items
        const existing = items.find(i => i.producto.id === producto.id && i.colorTipo === colorTipo)
        const newItems = existing
          ? items.map(i =>
              i.producto.id === producto.id && i.colorTipo === colorTipo
                ? { ...i, cantidad: i.cantidad + 1 }
                : i
            )
          : [...items, { producto, cantidad: 1, precioPromocion, descuento: Math.max(0, producto.price - precioPromocion), colorTipo }]
        set({ items: newItems, mensajePromo: calcularMensajePromo(newItems, state.campania) })
      },

      removeItem: (productId) => {
        const items = get().items.filter(i => i.producto.id !== productId)
        set({ items, mensajePromo: calcularMensajePromo(items, get().campania) })
      },

      updateCantidad: (productId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productId)
        } else {
          const items = get().items.map(i =>
            i.producto.id === productId
              ? { ...i, cantidad }
              : i
          )
          set({ items, mensajePromo: calcularMensajePromo(items, get().campania) })
        }
      },

      clearCart: () => set({ campania: null, items: [], cliente: null, mensajePromo: null }),

      setCliente: (cliente) => set({ cliente }),

      getSubtotalOriginal: () => get().items.reduce((s, i) => s + i.producto.price * i.cantidad, 0),

      getDescuentoTotal: () => get().items.reduce((s, i) => s + i.descuento, 0),

      getTotal: () => {
        const items = get().items
        const campania = get().campania
        if (!campania) return 0
        const calc = calcularPromocion(campania, items.map(i => ({ producto: i.producto, cantidad: i.cantidad, colorTipo: i.colorTipo })))
        return calc.total
      },

      getItemCount: () => get().items.reduce((s, i) => s + i.cantidad, 0),

      getEnvio: () => {
        const items = get().items
        const campania = get().campania
        if (!campania) return 0
        const calc = calcularPromocion(campania, items.map(i => ({ producto: i.producto, cantidad: i.cantidad, colorTipo: i.colorTipo })))
        return calc.envio
      },

      crearReservaPromocion: async (abono) => {
        const { items, campania, cliente } = get()
        if (!campania || !cliente) return null
        if (items.length === 0) return null

        const reglaConfig = (campania.reglas?.[0] as any)?.configuracion_json || {}
        const promRules = reglaConfig.promotion_rules
        if (promRules || campania.reglas?.[0]?.parear_color_tipo) {
          const itemsForValidation: ValidatePromotionItem[] = items.map(i => ({
            productId: i.producto.id,
            price: i.producto.price,
            quantity: i.cantidad,
            colorTipo: i.colorTipo,
            colorName: i.producto.color,
          }))

          if (promRules) {
            const validation = validatePromotionRules(promRules, itemsForValidation)
            if (!validation.valid) {
              console.warn('[crearReservaPromocion] Validación fallida:', validation.message)
              return null
            }
          } else {
            const legacyItems: Validate2x28Item[] = itemsForValidation
            const validation = validate2x28Promotion(legacyItems)
            if (!validation.valid) {
              console.warn('[crearReservaPromocion] Validación 2x$28 fallida:', validation.message)
              return null
            }
          }
        }

        const calc = calcularPromocion(campania, items.map(i => ({ producto: i.producto, cantidad: i.cantidad, colorTipo: i.colorTipo })))

        const total = calc.total
        const saldo = total - abono
        const now = new Date()
        const fechaLimiteAbono = new Date(now)
        fechaLimiteAbono.setDate(fechaLimiteAbono.getDate() + 2)
        const fechaLimitePago = new Date(now)
        fechaLimitePago.setDate(fechaLimitePago.getDate() + 7)

        const reservaData = {
          cliente_id: cliente.id,
          client_name: cliente.nombre,
          client_phone: cliente.telefono,
          client_document: cliente.documento || '',
          client_city: cliente.ciudad || '',
          client_address: cliente.direccion || '',
          client_email: cliente.email || '',
          status: abono >= ABONO_MINIMO ? 'abonado' : 'pendiente',
          total,
          abono: Math.max(0, abono),
          saldo,
          fecha_reserva: now.toISOString(),
          fecha_limite_abono: fechaLimiteAbono.toISOString(),
          fecha_limite_pago: fechaLimitePago.toISOString(),
          comprobante_url: null,
          notas_admin: `Promoción: ${campania.nombre} (${campania.tipo}) — Productos: ${items.map(i => `${i.producto.name} x${i.cantidad}`).join(', ')}`,
          whatsapp_revisado: false,
          comprobante_verificado: false,
          abono_confirmado: false,
          origen: 'promocion',
          abonos: abono > 0 ? [{
            id: `AB-${Date.now()}`,
            monto: abono,
            fecha: now.toISOString(),
            tipo: abono >= total ? 'final' : 'inicial',
          }] : [],
        }

        const { data: reserva, error: reservaError } = await supabase
          .from('reservations')
          .insert(reservaData)
          .select()
          .single()

        if (reservaError) {
          console.error('[crearReservaPromocion]', reservaError)
          return null
        }

        const reservaItems = items.map(item => ({
          reserva_id: reserva.id,
          producto_id: item.producto.id,
          producto_nombre: item.producto.name,
          cantidad: item.cantidad,
          precio_unitario: item.precioPromocion,
          subtotal: item.precioPromocion * item.cantidad,
        }))

        const { error: itemsError } = await supabase
          .from('reservation_items')
          .insert(reservaItems)

        if (itemsError) {
          console.error('[crearReservaPromocion items]', itemsError)
        }

        return {
          reserva,
          resumen: calc,
        }
      },
    }),
    {
      name: 'pane-carrito-promociones',
      partialize: (state) => ({
        items: state.items,
        campania: state.campania,
        cliente: state.cliente,
      }),
    }
  )
)
