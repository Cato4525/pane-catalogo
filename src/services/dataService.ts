import { Product, Category, Order, Cliente, Reserva, ConsultaProducto, StockMovement } from '../types';
import supabase from './supabaseClient';

const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_url' && key !== 'your_supabase_anon_key');
};

const checkConfigured = (): boolean => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase no configurado')
    return false
  }
  return true
};

export const dataService = {
  get isConfigured(): boolean {
    return isSupabaseConfigured()
  },

  async getProducts(): Promise<Product[]> {
    if (!checkConfigured()) return [];
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data as Product[];
  },

  async getCategories(): Promise<Category[]> {
    if (!checkConfigured()) return [];
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data.map((c: any) => ({
      id: c.id,
      name: c.nombre,
      description: c.descripcion,
      image: c.imagen,
      status: c.activa ? 'active' : 'inactive',
      created_at: c.created_at,
    })) as Category[];
  },

  async getOrders(): Promise<Order[]> {
    if (!checkConfigured()) return [];
    const { data: ventas, error: err1 } = await supabase.from('direct_sales').select('*').order('created_at', { ascending: false });
    if (err1) throw err1;
    const { data: pedidos, error: err2 } = await supabase.from('pos_orders').select('*').order('created_at', { ascending: false });
    if (err2) throw err2;
    const all = [...(ventas || []), ...(pedidos || [])];
    const mapped = all.map((p: any) => ({
      id: p.codigo,
      cliente: p.cliente,
      clienteId: p.cliente_id,
      email: p.email || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
      ciudad: p.ciudad || '',
      items: p.items || [],
      monto: p.monto,
      estado: p.estado,
      fecha: p.fecha,
      notas: p.notas,
      metodo_pago: p.metodo_pago,
      monto_pagado: p.monto_pagado,
      cambio: p.cambio,
      transferencia_imagen: p.transferencia_imagen,
      tarjeta_last4: p.tarjeta_last4,
      tarjeta_autori: p.tarjeta_autori,
      factura_generada: p.factura_generada,
    }));
    return mapped as Order[];
  },

  async createOrder(order: Order): Promise<Order> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    const isCompletada = order.estado === 'completado';
    const table = isCompletada ? 'direct_sales' : 'pos_orders';
    const { data, error } = await supabase.from(table).insert({
      codigo: order.id,
      cliente: order.cliente,
      cliente_id: order.clienteId || null,
      email: order.email || '',
      telefono: order.telefono || '',
      direccion: order.direccion || '',
      ciudad: order.ciudad || '',
      items: order.items,
      monto: order.monto,
      estado: order.estado,
      metodo_pago: order.metodo_pago || 'efectivo',
      monto_pagado: order.monto_pagado || 0,
      cambio: order.cambio || 0,
      transferencia_imagen: order.transferencia_imagen || null,
      tarjeta_last4: order.tarjeta_last4 || null,
      tarjeta_autori: order.tarjeta_autori || null,
      factura_generada: order.factura_generada || false,
      notas: order.notas || '',
      fecha: order.fecha,
    }).select().single();
    if (error) throw error;
    return data as Order;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    const updateData: any = {};
    if (updates.estado !== undefined) updateData.estado = updates.estado;
    if (updates.monto_pagado !== undefined) updateData.monto_pagado = updates.monto_pagado;
    if (updates.notas !== undefined) updateData.notas = updates.notas;
    if (updates.items !== undefined) updateData.items = updates.items;
    if (updates.monto !== undefined) updateData.monto = updates.monto;
    const { error: err1 } = await supabase.from('direct_sales').update(updateData).eq('codigo', id);
    if (err1) {
      const { error: err2 } = await supabase.from('pos_orders').update(updateData).eq('codigo', id);
      if (err2) throw err2;
    }
  },

  async getClientes(): Promise<Cliente[]> {
    if (!checkConfigured()) return [];
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;
    return (data || []).map((c: any) => ({
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
    })) as Cliente[];
  },

  async createCliente(cliente: Cliente): Promise<Cliente> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    const { data, error } = await supabase.from('clients').insert({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      documento: cliente.documento || '',
      tipo_documento: cliente.tipo_documento || 'cc',
      observaciones: cliente.observaciones || '',
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      nombre: data.nombre,
      email: data.email || '',
      telefono: data.telefono || '',
      direccion: data.direccion || '',
      ciudad: data.ciudad || '',
      documento: data.documento || '',
      tipo_documento: data.tipo_documento || 'cc',
      fecha_registro: data.created_at || '',
      observaciones: data.observaciones || '',
    } as Cliente;
  },

  async getReservas(): Promise<Reserva[]> {
    if (!checkConfigured()) return [];
    const { data, error } = await supabase.from('reservations').select('*').order('fecha_reserva', { ascending: false });
    if (error) throw error;
    
    const mappedData: Reserva[] = (data || []).map((r: any) => ({
      id: r.id,
      codigo: r.codigo,
      cliente_id: r.client_phone || r.client_document || r.id,
      cliente_nombre: r.client_name,
      cliente_telefono: r.client_phone,
      cliente_cedula: r.client_document,
      cliente_ciudad: r.client_city,
      cliente_direccion: r.client_address,
      cliente_email: r.client_email,
      estado_reserva: r.status,
      total: r.total,
      abono: r.abono,
      saldo: r.saldo,
      comprobante_url: r.comprobante_url,
      fecha_reserva: r.fecha_reserva,
      fecha_limite_abono: r.fecha_limite_abono,
      fecha_limite_pago: r.fecha_limite_pago,
      notas_admin: r.notas_admin,
      whatsapp_revisado: r.whatsapp_revisado,
      comprobante_verificado: r.comprobante_verificado,
      abono_confirmado: r.abono_confirmado,
      origen: r.origen || 'tienda',
      abonos: r.abonos || [],
    }));
    
    return mappedData;
  },

  async createReserva(reserva: Partial<Reserva>): Promise<Reserva> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    console.log('Insertando reserva:', reserva)
    
    const reservaData: any = {
      codigo: reserva.codigo,
      client_id: reserva.cliente_id || null,
      client_name: reserva.cliente_nombre,
      client_phone: reserva.cliente_telefono,
      client_document: reserva.cliente_cedula,
      client_city: reserva.cliente_ciudad,
      client_address: reserva.cliente_direccion,
      client_email: reserva.cliente_email,
      status: reserva.estado_reserva,
      total: reserva.total,
      abono: reserva.abono,
      saldo: reserva.saldo,
      comprobante_url: reserva.comprobante_url,
      fecha_reserva: reserva.fecha_reserva,
      fecha_limite_abono: reserva.fecha_limite_abono,
      fecha_limite_pago: reserva.fecha_limite_pago,
      notas_admin: reserva.notas_admin,
      whatsapp_revisado: reserva.whatsapp_revisado,
      comprobante_verificado: reserva.comprobante_verificado,
      abono_confirmado: reserva.abono_confirmado,
      origen: reserva.origen || 'tienda',
      abonos: reserva.abonos || [],
    };

    // Remover client_id si no es un UUID válido
    if (reservaData.client_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reservaData.client_id)) {
      delete reservaData.client_id
    }

    const { data, error } = await supabase.from('reservations').insert(reservaData).select().single();
    if (error) {
      console.error('Error insertando reserva:', error)
      throw error
    }
    console.log('Reserva insertada:', data)
    
    // 2. Insertar items en reservation_items
    if (reserva.items && reserva.items.length > 0) {
      const itemsData = reserva.items.map((item: any) => ({
        reserva_id: data.id,
        producto_id: String(item.producto_id || item.product_id),
        producto_nombre: item.producto_nombre || item.name || '',
        cantidad: item.cantidad || item.qty || 1,
        precio_unitario: item.precio_unitario || item.price || 0,
      }))

      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(itemsData)

      if (itemsError) {
        console.warn('Error insertando items:', itemsError)
      } else {
        console.log('Items insertados:', itemsData.length)
      }
    }
    
    // Mapear respuesta de DB a tipo Reserva
    const mapped: Reserva = {
      id: data.id,
      codigo: data.codigo,
      cliente_id: data.client_id || reserva.cliente_id || '',
      cliente_nombre: data.client_name || reserva.cliente_nombre || '',
      cliente_telefono: data.client_phone || reserva.cliente_telefono || '',
      cliente_cedula: data.client_document || reserva.cliente_cedula || '',
      cliente_ciudad: data.client_city || reserva.cliente_ciudad || '',
      cliente_direccion: data.client_address || reserva.cliente_direccion || '',
      cliente_email: data.client_email || reserva.cliente_email || '',
      estado_reserva: data.status || 'pendiente',
      total: data.total || 0,
      abono: data.abono || 0,
      saldo: data.saldo || 0,
      comprobante_url: data.comprobante_url || null,
      fecha_reserva: data.fecha_reserva || '',
      fecha_limite_abono: data.fecha_limite_abono || null,
      fecha_limite_pago: data.fecha_limite_pago || null,
      notas_admin: data.notas_admin || null,
      whatsapp_revisado: data.whatsapp_revisado || false,
      comprobante_verificado: data.comprobante_verificado || false,
      abono_confirmado: data.abono_confirmado || false,
      origen: data.origen || 'tienda',
      abonos: data.abonos || [],
      items: reserva.items || [],
    }
    
    return mapped;
  },

  async updateReserva(id: string, updates: Partial<Reserva>): Promise<void> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    
    const updateData: any = {};
    if (updates.estado_reserva !== undefined) updateData.status = updates.estado_reserva;
    if (updates.whatsapp_revisado !== undefined) updateData.whatsapp_revisado = updates.whatsapp_revisado;
    if (updates.comprobante_verificado !== undefined) updateData.comprobante_verificado = updates.comprobante_verificado;
    if (updates.abono_confirmado !== undefined) updateData.abono_confirmado = updates.abono_confirmado;
    if (updates.abono !== undefined) updateData.abono = updates.abono;
    if (updates.saldo !== undefined) updateData.saldo = updates.saldo;
    if (updates.notas_admin !== undefined) updateData.notas_admin = updates.notas_admin;
    
    const { error } = await supabase.from('reservations').update(updateData).eq('id', id);
    if (error) throw error;
  },

  async agregarAbonoReserva(reservaId: string, monto: number, comprobanteUrl?: string, notas?: string): Promise<void> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    
    const { data: reserva } = await supabase.from('reservations').select('*').eq('id', reservaId).single();
    if (!reserva) throw new Error('Reserva no encontrada');
    
    const nuevoAbono = {
      id: `AB-${Date.now()}`,
      reserva_id: reservaId,
      monto,
      fecha: new Date().toISOString(),
      comprobante_url: comprobanteUrl || null,
      notas: notas || null,
      tipo: monto >= reserva.total - reserva.abono ? 'final' : 'parcial',
    };
    
    const abonosActuales = reserva.abonos || [];
    abonosActuales.push(nuevoAbono);
    
    const nuevoTotalAbonado = reserva.abono + monto;
    const nuevoSaldo = reserva.total - nuevoTotalAbonado;
    const nuevoEstado = nuevoSaldo <= 0 ? 'confirmado' : reserva.status;
    
    const { error } = await supabase.from('reservations').update({
      abono: nuevoTotalAbonado,
      saldo: Math.max(0, nuevoSaldo),
      abonos: abonosActuales,
      status: nuevoEstado,
      comprobante_verificado: comprobanteUrl ? true : reserva.comprobante_verificado,
    }).eq('id', reservaId);
    
    if (error) throw error;
  },

  async getConsultas(): Promise<ConsultaProducto[]> {
    if (!checkConfigured()) return [];
    const { data, error } = await supabase.from('product_queries').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as ConsultaProducto[];
  },

  async createConsulta(consulta: Partial<ConsultaProducto>): Promise<ConsultaProducto> {
    if (!checkConfigured()) throw new Error("Supabase no configurado");
    const { data, error } = await supabase.from("product_queries").insert(consulta).select().single();
    if (error) throw error;
    return data as ConsultaProducto;
  },

  async getStockMovements(productId?: string): Promise<StockMovement[]> {
    if (!checkConfigured()) return [];
    let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      productId: m.product_id,
      productName: m.product_name || '',
      tipo: m.tipo,
      cantidad: m.cantidad,
      stock_anterior: m.stock_anterior,
      stock_nuevo: m.stock_nuevo,
      motivo: m.motivo || '',
      referencia: m.referencia || '',
      fecha: m.created_at || '',
    })) as StockMovement[];
  },

  async addStockMovement(movement: StockMovement): Promise<StockMovement> {
    if (!checkConfigured()) throw new Error('Supabase no configurado');
    const { data, error } = await supabase.from('stock_movements').insert({
      product_id: movement.productId,
      product_name: movement.productName,
      tipo: movement.tipo,
      cantidad: movement.cantidad,
      stock_anterior: movement.stock_anterior,
      stock_nuevo: movement.stock_nuevo,
      motivo: movement.motivo,
      referencia: movement.referencia,
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      productId: data.product_id,
      productName: data.product_name || '',
      tipo: data.tipo,
      cantidad: data.cantidad,
      stock_anterior: data.stock_anterior,
      stock_nuevo: data.stock_nuevo,
      motivo: data.motivo || '',
      referencia: data.referencia || '',
      fecha: data.created_at || '',
    } as StockMovement;
  },
};
