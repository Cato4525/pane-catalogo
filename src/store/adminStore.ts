import { create } from 'zustand'
import { getSupabase } from '../services/supabaseClient'
import { Reserva, Cliente, ConsultaProducto } from '../types'

interface AdminState {
  reservas: Reserva[]
  reservaLoading: boolean
  reservaError: string | null
  reservaPage: number
  reservaHasMore: boolean

  clientes: Cliente[]
  clientesLoading: boolean
  clientesError: string | null
  clientesPage: number
  clientesHasMore: boolean

  consultas: ConsultaProducto[]
  consultasLoading: boolean
  consultasError: string | null
  consultasPage: number
  consultasHasMore: boolean

  stats: {
    totalReservas: number
    reservasPendientes: number
    reservasConfirmadas: number
    totalIngresos: number
    totalAbonos: number
    productosMasConsultados: { producto_id: string; count: number }[]
  }

  fetchReservas: (reset?: boolean) => Promise<void>
  fetchClientes: (reset?: boolean) => Promise<void>
  fetchConsultas: (reset?: boolean) => Promise<void>
  fetchStats: () => Promise<void>

  updateReserva: (id: string, data: Partial<Reserva>) => Promise<void>
  deleteReserva: (id: string) => Promise<void>
  getReservaWithItems: (id: string) => Promise<Reserva>
}

const PAGE_SIZE = 20

export const useAdminStore = create<AdminState>((set, get) => ({
  reservas: [],
  reservaLoading: false,
  reservaError: null,
  reservaPage: 0,
  reservaHasMore: true,

  clientes: [],
  clientesLoading: false,
  clientesError: null,
  clientesPage: 0,
  clientesHasMore: true,

  consultas: [],
  consultasLoading: false,
  consultasError: null,
  consultasPage: 0,
  consultasHasMore: true,

  stats: {
    totalReservas: 0,
    reservasPendientes: 0,
    reservasConfirmadas: 0,
    totalIngresos: 0,
    totalAbonos: 0,
    productosMasConsultados: [],
  },

  fetchReservas: async (reset = false) => {
    if (get().reservaLoading) return

    const { reservaPage, reservas } = get()
    const supabase = getSupabase()

    // ✅ Sin Supabase no hay nada que hacer
    if (!supabase) {
      set({ reservaError: 'Supabase no está configurado', reservaLoading: false })
      return
    }

    set({ reservaLoading: true, reservaError: null })

    try {
      const from = reset ? 0 : reservaPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('fecha_reserva', { ascending: false })

      if (error) throw error

      const reservasWithCliente = (data || []).map(r => ({
        id: r.id,
        codigo: r.codigo,
        cliente_id: r.client_id || '',
        cliente_nombre: r.client_name || '',
        cliente_telefono: r.client_phone || '',
        cliente_cedula: r.client_document || '',
        cliente_ciudad: r.client_city || '',
        cliente_direccion: r.client_address || '',
        cliente_email: r.client_email || '',
        estado_reserva: r.status || 'pendiente',
        total: r.total || 0,
        abono: r.abono || 0,
        saldo: r.saldo || 0,
        comprobante_url: r.comprobante_url || null,
        fecha_reserva: r.fecha_reserva || '',
        fecha_limite_abono: r.fecha_limite_abono || null,
        fecha_limite_pago: r.fecha_limite_pago || null,
        notas_admin: r.notas_admin || null,
        whatsapp_revisado: r.whatsapp_revisado || false,
        comprobante_verificado: r.comprobante_verificado || false,
        abono_confirmado: r.abono_confirmado || false,
        origen: r.origen || 'tienda',
        abonos: r.abonos || [],
      }))

      const newReservas = reset ? reservasWithCliente : [...reservas, ...reservasWithCliente]
      const hasMore = count ? newReservas.length < count : false

      set({
        reservas: newReservas,
        reservaLoading: false,
        reservaHasMore: hasMore,
        reservaPage: reset ? 1 : reservaPage + 1, // ✅ reset arranca en página 1
      })
    } catch (error: any) {
      set({ reservaLoading: false, reservaError: error.message })
    }
  },

  fetchClientes: async (reset = false) => {
    if (get().clientesLoading) return

    const supabase = getSupabase()
    if (!supabase) {
      set({ clientesError: 'Supabase no está configurado', clientesLoading: false })
      return
    }

    const { clientesPage, clientes } = get()
    set({ clientesLoading: true, clientesError: null })

    try {
      const from = reset ? 0 : clientesPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const mappedClientes = (data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email || '',
        telefono: c.telefono || '',
        direccion: c.direccion || '',
        ciudad: c.ciudad || '',
        documento: c.documento || '',
        tipo_documento: c.tipo_documento || 'cc',
        fecha_registro: c.created_at || '',
        observaciones: c.observaciones || '',
        user_id: c.user_id || undefined,
        origen: c.origen || 'panel',
      }))
      const newClientes = reset ? mappedClientes : [...clientes, ...mappedClientes]
      const hasMore = count ? newClientes.length < count : false

      set({ 
        clientes: newClientes, 
        clientesLoading: false, 
        clientesHasMore: hasMore,
        clientesPage: reset ? 1 : clientesPage + 1,
      })
    } catch (error: any) {
      console.error('Error fetching clientes:', error)
      set({ clientesLoading: false, clientesError: error.message })
    }
  },

  fetchConsultas: async (reset = false) => {
    if (get().consultasLoading) return

    const supabase = getSupabase()
    if (!supabase) {
      set({ consultasError: 'Supabase no está configurado', consultasLoading: false })
      return
    }

    const { consultasPage, consultas } = get()
    set({ consultasLoading: true, consultasError: null })

    try {
      const from = reset ? 0 : consultasPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('product_queries')
        .select(`
          *,
          producto:products(nombre, codigo)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const consultasWithProduct = (data || []).map(c => ({
        ...c,
        producto_nombre: c.producto?.nombre,
        producto_codigo: c.producto?.codigo,
      }))

      const newConsultas = reset ? consultasWithProduct : [...consultas, ...consultasWithProduct]
      const hasMore = count ? newConsultas.length < count : false

      set({ 
        consultas: newConsultas, 
        consultasLoading: false, 
        consultasHasMore: hasMore,
        consultasPage: reset ? 1 : consultasPage + 1,
      })
    } catch (error: any) {
      console.error('Error fetching consultas:', error)
      set({ consultasLoading: false, consultasError: error.message })
    }
  },

  fetchStats: async () => {
    const supabase = getSupabase()
    if (!supabase) return

    try {
      // ✅ Solo trae los campos necesarios para calcular stats
      // Para escalar mejor, considera una función RPC en Supabase
      const [reservasResult, consultasResult] = await Promise.all([
        supabase
          .from('reservations')
          .select('status, total, abono')
          .limit(1000),
        supabase
          .from('product_queries')
          .select('product_id')
          .limit(1000),
      ])

      if (reservasResult.error) throw reservasResult.error
      if (consultasResult.error) throw consultasResult.error

      const reservas = reservasResult.data || []
      const consultas = consultasResult.data || []

      const totalReservas = reservas.length
      const reservasPendientes = reservas.filter(r => r.status === 'pendiente_abono' || r.status === 'pendiente').length
      const reservasConfirmadas = reservas.filter(r => r.status === 'confirmado').length
      const totalIngresos = reservas
        .filter(r => r.status === 'confirmado')
        .reduce((sum, r) => sum + (r.total || 0), 0)
      const totalAbonos = reservas.reduce((sum, r) => sum + (r.abono || 0), 0)

      const productoCounts: Record<string, number> = {}
      consultas.forEach(c => {
        if (c.product_id) {
          productoCounts[c.product_id] = (productoCounts[c.product_id] || 0) + 1
        }
      })

      const productosMasConsultados = Object.entries(productoCounts)
        .map(([producto_id, count]) => ({ producto_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      set({
        stats: {
          totalReservas,
          reservasPendientes,
          reservasConfirmadas,
          totalIngresos,
          totalAbonos,
          productosMasConsultados,
        },
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  },

  updateReserva: async (id, data) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase no está configurado')

    const updateData: any = {}
    if (data.estado_reserva !== undefined) updateData.status = data.estado_reserva
    if (data.whatsapp_revisado !== undefined) updateData.whatsapp_revisado = data.whatsapp_revisado
    if (data.comprobante_verificado !== undefined) updateData.comprobante_verificado = data.comprobante_verificado
    if (data.abono_confirmado !== undefined) updateData.abono_confirmado = data.abono_confirmado
    if (data.abono !== undefined) updateData.abono = data.abono
    if (data.saldo !== undefined) updateData.saldo = data.saldo
    if (data.notas_admin !== undefined) updateData.notas_admin = data.notas_admin
    if (data.comprobante_url !== undefined) updateData.comprobante_url = data.comprobante_url
    if (data.abonos !== undefined) updateData.abonos = data.abonos

    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    set({
      reservas: get().reservas.map(r => r.id === id ? { ...r, ...data } : r),
    })

    get().fetchStats()
  },

  deleteReserva: async (id) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase no está configurado')

    // Idealmente usar CASCADE DELETE en la DB
    const { error: itemsError } = await supabase
      .from('reservation_items')
      .delete()
      .eq('reservation_id', id)

    if (itemsError) console.warn('Error deleting items:', itemsError)

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (error) throw error

    set({ reservas: get().reservas.filter(r => r.id !== id) })
    get().fetchStats()
  },

  getReservaWithItems: async (id) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase no está configurado')

    const { data: reserva, error } = await supabase
      .from('reservations')
      .select(`
        *,
        items:reservation_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      id: reserva.id,
      codigo: reserva.codigo,
      cliente_id: reserva.client_id || '',
      cliente_nombre: reserva.client_name || '',
      cliente_telefono: reserva.client_phone || '',
      cliente_cedula: reserva.client_document || '',
      cliente_ciudad: reserva.client_city || '',
      cliente_direccion: reserva.client_address || '',
      cliente_email: reserva.client_email || '',
      estado_reserva: reserva.status || 'pendiente',
      total: reserva.total || 0,
      abono: reserva.abono || 0,
      saldo: reserva.saldo || 0,
      comprobante_url: reserva.comprobante_url || null,
      fecha_reserva: reserva.fecha_reserva || '',
      fecha_limite_abono: reserva.fecha_limite_abono || null,
      fecha_limite_pago: reserva.fecha_limite_pago || null,
      notas_admin: reserva.notas_admin || null,
      whatsapp_revisado: reserva.whatsapp_revisado || false,
      comprobante_verificado: reserva.comprobante_verificado || false,
      abono_confirmado: reserva.abono_confirmado || false,
      origen: reserva.origen || 'tienda',
      abonos: reserva.abonos || [],
      items: reserva.items?.map((i: any) => ({
        id: i.id,
        reserva_id: i.reserva_id,
        producto_id: i.producto_id,
        producto_nombre: i.producto_nombre || '',
        cantidad: i.cantidad || 0,
        precio_unitario: i.precio_unitario || 0,
        subtotal: i.subtotal || 0,
      })) || [],
    }
  },
}))