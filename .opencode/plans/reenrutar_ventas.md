# Plan: Reenrutar ventas POS

## 1. Migración SQL (ejecutar en Supabase SQL Editor)

Abrir https://supabase.com → SQL Editor → pegar y ejecutar:

```sql
ALTER TABLE public.ventas_directas ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_updated_at_ventas_directas ON public.ventas_directas;
CREATE TRIGGER trigger_updated_at_ventas_directas
BEFORE UPDATE ON public.ventas_directas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

DROP POLICY IF EXISTS "ventas_directas_select" ON public.ventas_directas;
CREATE POLICY "ventas_directas_select"
ON public.ventas_directas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ventas_directas_insert" ON public.ventas_directas;
CREATE POLICY "ventas_directas_insert"
ON public.ventas_directas FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'crear_pedidos'));

DROP POLICY IF EXISTS "ventas_directas_update" ON public.ventas_directas;
CREATE POLICY "ventas_directas_update"
ON public.ventas_directas FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'editar_pedidos'));

DROP POLICY IF EXISTS "ventas_directas_delete" ON public.ventas_directas;
CREATE POLICY "ventas_directas_delete"
ON public.ventas_directas FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'eliminar_pedidos'));
```

## 2. `useStore.ts` — Reemplazar `addOrder` (línea 935)

```ts
  addOrder: async (order) => {
    const esDirecta = order.estado === 'completado'
    set((state) => ({
      orders: esDirecta ? [...state.orders, order] : state.orders,
      reservasPos: esDirecta ? state.reservasPos : [...state.reservasPos, order],
    }))
    const { getSupabase } = await import('../services/supabaseClient')
    const sb = getSupabase()
    if (!sb) { console.warn('Supabase no disponible'); return }
    let userId = null, userNombre = ''
    try {
      const { data: { user } } = await sb.auth.getUser()
      if (user) { userId = user.id; userNombre = user.user_metadata?.nombre || user.email || '' }
    } catch {}
    try {
      if (esDirecta) {
        const { error } = await sb.from('ventas_directas').insert({
          codigo: order.id, cliente: order.cliente,
          cliente_id: order.clienteId || null, email: order.email || '',
          telefono: order.telefono || '', direccion: order.direccion || '',
          ciudad: order.ciudad || '',
          items: order.items.map(i => ({
            productId: i.productId, productName: i.productName,
            productCode: i.productCode || '', quantity: i.quantity, price: i.price
          })),
          monto: order.monto, estado: order.estado, tipo_venta: 'directo',
          metodo_pago: order.metodo_pago || 'efectivo',
          monto_pagado: order.monto_pagado || 0, cambio: order.cambio || 0,
          transferencia_imagen: order.transferencia_imagen || null,
          tarjeta_last4: order.tarjeta_last4 || null,
          tarjeta_autori: order.tarjeta_autori || null,
          factura_generada: order.factura_generada || false,
          notas: order.notas || '', fecha: order.fecha,
          user_id: userId, usuario_nombre: userNombre,
        }).select().single()
        if (error) console.error('Error guardando venta directa:', error)
      } else {
        const { data: reserva, error } = await sb.from('reservations').insert({
          codigo: order.id, cliente_id: order.clienteId || null,
          cliente_nombre: order.cliente,
          cliente_telefono: order.telefono || '',
          cliente_email: order.email || '',
          cliente_direccion: order.direccion || '',
          cliente_ciudad: order.ciudad || '',
          estado_reserva: order.estado === 'abonado' ? 'abonado' : 'pendiente',
          total: order.monto, abono: order.monto_pagado || 0,
          saldo: order.monto - (order.monto_pagado || 0),
          fecha_reserva: new Date(order.fecha || Date.now()).toISOString(),
          notas_admin: order.notas || '', origen: 'pos',
          abono_confirmado: order.estado === 'abonado',
          user_id: userId, usuario_nombre: userNombre,
        }).select('id').single()
        if (error) { console.error('Error guardando reserva POS:', error); return }
        if (order.items?.length > 0) {
          const { error: itemsError } = await sb.from('reservation_items').insert(
            order.items.map(i => ({
              reserva_id: reserva.id, producto_id: i.productId,
              producto_nombre: i.productName, cantidad: i.quantity,
              precio_unitario: i.price, subtotal: i.price * i.quantity,
            }))
          )
          if (itemsError) console.error('Error guardando items:', itemsError)
        }
      }
    } catch (err) { console.error('Exception:', err) }
  },
```

## 3. `useStore.ts` — Reemplazar `updateOrder` (línea 1016)

```ts
  updateOrder: async (id, orderUpdate) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, ...orderUpdate } : o),
      reservasPos: state.reservasPos.map((o) => o.id === id ? { ...o, ...orderUpdate } : o),
    }))
    const { getSupabase } = await import('../services/supabaseClient')
    const sb = getSupabase()
    if (!sb) return
    const currentOrder = get().orders.find(o => o.id === id) || get().reservasPos.find(o => o.id === id)
    if (!currentOrder) return
    try {
      if (currentOrder.estado === 'completado') {
        const upd: any = {}
        if (orderUpdate.estado !== undefined) upd.estado = orderUpdate.estado
        if (orderUpdate.monto_pagado !== undefined) upd.monto_pagado = orderUpdate.monto_pagado
        if (orderUpdate.notas !== undefined) upd.notas = orderUpdate.notas
        if (orderUpdate.items !== undefined) upd.items = orderUpdate.items
        if (orderUpdate.monto !== undefined) upd.monto = orderUpdate.monto
        const { error } = await sb.from('ventas_directas').update(upd).eq('codigo', id)
        if (error) console.error('Error actualizando venta directa:', error)
      } else {
        const upd: any = {}
        if (orderUpdate.estado !== undefined) upd.estado_reserva = { pendiente: 'pendiente', abonado: 'abonado', completado: 'confirmado', cancelado: 'cancelado' }[orderUpdate.estado] || orderUpdate.estado
        if (orderUpdate.monto_pagado !== undefined) {
          upd.abono = orderUpdate.monto_pagado
          upd.saldo = (orderUpdate.monto ?? currentOrder.monto) - orderUpdate.monto_pagado
        }
        if (orderUpdate.notas !== undefined) upd.notas_admin = orderUpdate.notas
        if (orderUpdate.monto !== undefined) {
          upd.total = orderUpdate.monto
          upd.saldo = orderUpdate.monto - (orderUpdate.monto_pagado ?? currentOrder.monto_pagado ?? 0)
        }
        const { error } = await sb.from('reservations').update(upd).eq('codigo', id)
        if (error) console.error('Error actualizando reserva POS:', error)
      }
    } catch (err) { console.error('Exception:', err) }
  },
```

## 4. `useStore.ts` — Reemplazar `deleteOrder` (línea 1048)

```ts
  deleteOrder: async (id) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      reservasPos: state.reservasPos.filter((o) => o.id !== id),
    }))
    const { getSupabase } = await import('../services/supabaseClient')
    const sb = getSupabase()
    if (!sb) return
    const currentOrder = get().orders.find(o => o.id === id) || get().reservasPos.find(o => o.id === id)
    if (!currentOrder) return
    try {
      const tabla = currentOrder.estado === 'completado' ? 'ventas_directas' : 'reservations'
      const { error } = await sb.from(tabla).delete().eq('codigo', id)
      if (error) console.error(`Error eliminando de ${tabla}:`, error)
    } catch (err) { console.error('Exception:', err) }
  },
```

## 5. `useStore.ts` — Reemplazar `fetchOrdersFromSupabase` (línea 1072)

```ts
  fetchOrdersFromSupabase: async () => {
    const { getSupabase } = await import('../services/supabaseClient')
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('ventas_directas').select('*').order('created_at', { ascending: false })
    if (error) { console.error('Error fetching ventas directas:', error); return }
    if (data?.length > 0) {
      const mapped: Order[] = data.map((p: any) => ({
        id: p.codigo, cliente: p.cliente, clienteId: p.cliente_id,
        email: p.email || '', telefono: p.telefono || '',
        direccion: p.direccion || '', ciudad: p.ciudad || '',
        items: p.items || [], monto: p.monto, estado: p.estado,
        fecha: p.fecha, metodo_pago: p.metodo_pago,
        monto_pagado: p.monto_pagado, cambio: p.cambio,
        transferencia_imagen: p.transferencia_imagen,
        tarjeta_last4: p.tarjeta_last4, tarjeta_autori: p.tarjeta_autori,
        factura_generada: p.factura_generada, notas: p.notas,
      }))
      set((state) => {
        const localIds = new Set(state.orders.map(o => o.id))
        const nuevos = mapped.filter(o => !localIds.has(o.id))
        return { orders: [...state.orders, ...nuevos] }
      })
    }
  },
```

## 6. `useStore.ts` — Reemplazar `fetchReservasPOSFromSupabase` (línea 1161)

```ts
  fetchReservasPOSFromSupabase: async () => {
    const { getSupabase } = await import('../services/supabaseClient')
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('reservations')
      .select('*, reservation_items(*)')
      .eq('origen', 'pos')
      .order('created_at', { ascending: false })
    if (error) { console.error('Error fetching reservas POS:', error); return }
    if (data?.length > 0) {
      const estMap: Record<string,string> = { pendiente:'pendiente', abonado:'abonado', confirmado:'completado', cancelado:'cancelado', expirado:'cancelado' }
      const mapped: Order[] = data.map((r: any) => ({
        id: r.codigo, cliente: r.cliente_nombre || '', clienteId: r.cliente_id,
        email: r.cliente_email || '', telefono: r.cliente_telefono || '',
        direccion: r.cliente_direccion || '', ciudad: r.cliente_ciudad || '',
        items: (r.reservation_items || []).map((i: any) => ({
          productId: i.producto_id, productName: i.producto_nombre || '',
          productCode: '', quantity: i.cantidad, price: i.precio_unitario,
        })),
        monto: r.total, estado: estMap[r.estado_reserva] || 'pendiente',
        fecha: r.fecha_reserva ? r.fecha_reserva.split('T')[0] : '',
        metodo_pago: undefined, monto_pagado: r.abono, cambio: undefined,
        notas: r.notas_admin || '',
      }))
      set((state) => {
        const localIds = new Set(state.reservasPos.map(o => o.id))
        const nuevos = mapped.filter(o => !localIds.has(o.id))
        return { reservasPos: [...state.reservasPos, ...nuevos] }
      })
    }
  },
```

## Orden de implementación

1. Ejecutar la migración SQL en Supabase (paso 1)
2. Reemplazar las 5 funciones en `useStore.ts` (pasos 2-6)
3. Ejecutar `npm run dev` y probar
