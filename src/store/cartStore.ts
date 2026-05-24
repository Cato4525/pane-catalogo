import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CarritoItem, Cliente, Reserva, ReservaItem, ABONO_MINIMO, DIAS_LIMITE_ABONO, DIAS_LIMITE_PAGO } from '../types'
import supabase from '../services/supabaseClient'

interface CartState {
  items: CarritoItem[]
  cliente: Cliente | null
  reservaActual: Reserva | null

  addItem: (product: Product, cantidad?: number, variant?: { variantId?: string; colorId?: string; colorName?: string; colorHex?: string; sizeId?: string; sizeName?: string; stock?: number }) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, cantidad: number, variantId?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number

  setCliente: (cliente: Cliente | null) => void
  crearReserva: (abono: number) => Promise<Reserva>
  actualizarReserva: (id: string, data: Partial<Reserva>) => Promise<void>
  subirComprobante: (reservaId: string, file: File) => Promise<string>
  setReservaActual: (reserva: Reserva | null) => void

  findOrCreateCliente: (nombre: string, telefono: string, email?: string) => Promise<Cliente>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cliente: null,
      reservaActual: null,

      addItem: (product, cantidad = 1, variant) => {
        const items = get().items
        const variantKey = variant?.variantId || `${variant?.colorId}-${variant?.sizeId}`
        
        const existing = variantKey 
          ? items.find(i => i.producto.id === product.id && i.variantId === variantKey)
          : items.find(i => i.producto.id === product.id)

        if (existing && variantKey) {
          const newCantidad = existing.cantidad + cantidad
          if (variant?.stock && newCantidad > variant.stock) {
            return
          }
          set({
            items: items.map(i =>
              (i.producto.id === product.id && i.variantId === variantKey)
                ? { ...i, cantidad: newCantidad }
                : i
            )
          })
        } else if (existing) {
          const newCantidad = existing.cantidad + cantidad
          set({
            items: items.map(i =>
              i.producto.id === product.id
                ? { ...i, cantidad: newCantidad }
                : i
            )
          })
        } else {
          const newItem: CarritoItem = { 
            producto: product, 
            cantidad: Math.min(cantidad, variant?.stock || cantidad),
            variantId: variant?.variantId,
            colorId: variant?.colorId,
            colorName: variant?.colorName,
            colorHex: variant?.colorHex,
            sizeId: variant?.sizeId,
            sizeName: variant?.sizeName,
            stock: variant?.stock
          }
          set({ items: [...items, newItem] })
        }
      },

      removeItem: (productId, variantId) => {
        if (variantId) {
          set({ items: get().items.filter(i => !(i.producto.id === productId && i.variantId === variantId)) })
        } else {
          set({ items: get().items.filter(i => i.producto.id !== productId) })
        }
      },

      updateQuantity: (productId, cantidad, variantId) => {
        if (cantidad <= 0) {
          get().removeItem(productId, variantId)
        } else {
          set({
            items: get().items.map(i => {
              const keyMatch = variantId ? (i.variantId === variantId) : true
              if (i.producto.id === productId && keyMatch) {
                const maxStock = i.stock || 999
                return { ...i, cantidad: Math.min(cantidad, maxStock) }
              }
              return i
            })
          })
        }
      },

      clearCart: () => set({ items: [], reservaActual: null }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.producto.price * item.cantidad, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0)
      },

      setCliente: (cliente) => set({ cliente }),

      findOrCreateCliente: async (nombre, telefono, email) => {
        const { data: existing } = await supabase
          .from('clients')
          .select('*')
          .eq('telefono', telefono)
          .single()

        if (existing) {
          set({ cliente: existing })
          return existing
        }

        const { data: newCliente, error } = await supabase
          .from('clients')
          .insert({ nombre, telefono, email })
          .select()
          .single()

        if (error) throw error
        set({ cliente: newCliente })
        return newCliente
      },

      crearReserva: async (abono) => {
        const { items, cliente, getTotal } = get()
        if (!cliente) throw new Error('Cliente requerido')
        if (items.length === 0) throw new Error('Carrito vacío')

        const total = getTotal()
        const saldo = total - abono
        const now = new Date()

        const fechaLimiteAbono = new Date(now)
        fechaLimiteAbono.setDate(fechaLimiteAbono.getDate() + DIAS_LIMITE_ABONO)

        const fechaLimitePago = new Date(now)
        fechaLimitePago.setDate(fechaLimitePago.getDate() + DIAS_LIMITE_PAGO)

        const reservaData = {
          cliente_id: cliente.id,
          estado_reserva: abono >= ABONO_MINIMO ? 'abonado' : 'pendiente_abono',
          total,
          abono: Math.max(0, abono),
          saldo,
          fecha_reserva: now.toISOString(),
          fecha_limite_abono: fechaLimiteAbono.toISOString(),
          fecha_limite_pago: fechaLimitePago.toISOString(),
          whatsapp_revisado: false,
          comprobante_verificado: false,
          abono_confirmado: false,
        }

        const { data: reserva, error: reservaError } = await supabase
          .from('reservations')
          .insert(reservaData)
          .select()
          .single()

        if (reservaError) throw reservaError

        const reservaItems: Omit<ReservaItem, 'id'>[] = items.map(item => ({
          reserva_id: reserva.id,
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.price,
          subtotal: item.producto.price * item.cantidad,
        }))

        const { error: itemsError } = await supabase
          .from('reservation_items')
          .insert(reservaItems)

        if (itemsError) throw itemsError

        set({ reservaActual: reserva })
        return reserva
      },

      actualizarReserva: async (id, data) => {
        const { error } = await supabase
          .from('reservations')
          .update(data)
          .eq('id', id)

        if (error) throw error

        if (get().reservaActual?.id === id) {
          set({ reservaActual: { ...get().reservaActual!, ...data } })
        }
      },

      subirComprobante: async (reservaId, file) => {
        const fileName = `comprobantes/${reservaId}_${Date.now()}.${file.name.split('.').pop()}`

        const { error: uploadError } = await supabase.storage
          .from('reservations')
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('reservations')
          .getPublicUrl(fileName)

        await get().actualizarReserva(reservaId, {
          comprobante_url: publicUrl,
          estado_reserva: 'abonado',
          abono_confirmado: true,
        })

        return publicUrl
      },

      setReservaActual: (reserva) => set({ reservaActual: reserva }),
    }),
    {
      name: 'pane-cart',
      partialize: (state) => ({
        items: state.items,
        cliente: state.cliente,
      }),
    }
  )
)
