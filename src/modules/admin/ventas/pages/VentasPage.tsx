import { useState, useMemo } from 'react';
import { useStore } from '../../../../store';
import { Order, OrderStatus, THEME_PRESETS, ThemeType, MetodoPago } from '../../../../types';

export default function VentasPage() {
  const settings = useStore(state => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  
  const orders = useStore(state => state.orders);
  const updateOrder = useStore(state => state.updateOrder);
  const deleteOrder = useStore(state => state.deleteOrder);
  const [filter, setFilter] = useState('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState<OrderStatus>('pendiente');
  const [editMontoPagado, setEditMontoPagado] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [metodoFilter, setMetodoFilter] = useState<MetodoPago | 'todos'>('todos');

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filter === 'enviadas') {
      result = result.filter(o => o.notas && o.notas.trim().length > 0);
    } else if (filter !== 'todos') {
      result = result.filter(o => o.estado === filter);
    }
    
    if (searchOrder) {
      const search = searchOrder.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(search) ||
        o.cliente.toLowerCase().includes(search) ||
        o.telefono?.includes(search)
      );
    }

    if (metodoFilter !== 'todos') {
      result = result.filter(o => o.metodo_pago === metodoFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      result = result.filter(o => {
        if (dateFilter === 'today') return o.fecha === today;
        if (dateFilter === 'week') return o.fecha >= weekAgo;
        if (dateFilter === 'month') return o.fecha >= monthAgo;
        return true;
      });
    }

    return result;
  }, [orders, filter, searchOrder, dateFilter, metodoFilter]);

  const stats = useMemo(() => {
    const totalVentas = filteredOrders.reduce((sum, o) => sum + o.monto, 0);
    const totalPagado = filteredOrders.reduce((sum, o) => sum + (o.monto_pagado || 0), 0);
    const completados = filteredOrders.filter(o => o.estado === 'completado').length;
    const pendientes = filteredOrders.filter(o => o.estado === 'pendiente').length;
    const abonos = filteredOrders.filter(o => o.estado === 'abonado').length;
    return { totalVentas, totalPagado, completados, pendientes, abonos };
  }, [filteredOrders]);

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
      deleteOrder(id);
      setSelectedOrder(null);
    }
  };

  const handleSaveEdit = () => {
    if (selectedOrder) {
      let finalStatus = editStatus;
      if (editStatus === 'abonado' && editMontoPagado && parseFloat(editMontoPagado) >= selectedOrder.monto) {
        finalStatus = 'completado';
      }
      const monto_pagado = editMontoPagado ? parseFloat(editMontoPagado) : selectedOrder.monto_pagado;
      const updateData: Partial<Order> = {
        estado: finalStatus,
        notas: editNotas,
      };
      if (finalStatus === 'abonado') {
        updateData.monto_pagado = monto_pagado;
      } else if (finalStatus === 'completado' || finalStatus === 'cancelado') {
        updateData.monto_pagado = finalStatus === 'completado' ? selectedOrder.monto : 0;
      }
      updateOrder(selectedOrder.id, updateData);
      setSelectedOrder({ ...selectedOrder, ...updateData });
      setEditMode(false);
    }
  };

  const getMetodoIcon = (metodo?: MetodoPago) => {
    switch (metodo) {
      case 'efectivo': return '💵';
      case 'transferencia': return '📱';
      case 'tarjeta': return '💳';
      case 'mixto': return '💰';
      default: return '—';
    }
  };

  const handlePrint = (order: Order) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const itemsHtml = (order.items || []).map(item => [
      '<tr>',
      '<td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px">', item.quantity, 'x</td>',
      '<td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px">', item.productName, '</td>',
      '<td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px;text-align:right">$', ((item.price || 0) * (item.quantity || 0)).toFixed(2), '</td>',
      '</tr>'
    ].join('')).join('');
    printWin.document.write([
      '<html><head><title>Factura ', order.id, '</title>',
      '<style>',
      'body{font-family:Courier New,monospace;padding:20px;max-width:320px;margin:auto}',
      'h1{font-size:18px;text-align:center;margin:0}',
      'h2{font-size:14px;text-align:center;margin:4px 0 16px;color:#666}',
      '.divider{border-top:1px dashed #000;margin:12px 0}',
      'table{width:100%;border-collapse:collapse}',
      '.total{font-size:16px;font-weight:bold;text-align:right;margin-top:8px}',
      '.info{font-size:11px;color:#555;margin:4px 0}',
      '.footer{text-align:center;font-size:11px;color:#888;margin-top:16px;border-top:1px dashed #000;padding-top:12px}',
      '.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold}',
      '.badge-ok{background:#d4edda;color:#155724}',
      '.envio{font-size:11px;margin-top:8px;padding-top:8px;border-top:1px dashed #ddd}',
      '</style></head><body>',
      '<h1>', settings?.storeName || 'PAN E', '</h1>',
      '<h2>FACTURA</h2>',
      '<div class="info"><strong>ID:</strong> ', order.id, '</div>',
      '<div class="info"><strong>Cliente:</strong> ', order.cliente, '</div>',
      order.telefono ? '<div class="info"><strong>Tel:</strong> ' + order.telefono + '</div>' : '',
      order.direccion ? '<div class="info"><strong>Dirección:</strong> ' + order.direccion + '</div>' : '',
      '<div class="info"><strong>Fecha:</strong> ', order.fecha, '</div>',
      '<div class="divider"></div>',
      '<table>', itemsHtml, '</table>',
      '<div class="divider"></div>',
      '<div class="total">Total: $', order.monto.toFixed(2), '</div>',
      '<div class="info"><strong>Pagado:</strong> $', (order.monto_pagado || 0).toFixed(2), '</div>',
      order.cambio && order.cambio > 0 ? '<div class="info"><strong>Cambio:</strong> $' + order.cambio.toFixed(2) + '</div>' : '',
      '<div class="info"><strong>Método:</strong> ', order.metodo_pago || '\u2014', '</div>',
      '<div class="info"><strong>Estado:</strong> ', order.estado, '</div>',
      order.notas ? '<div class="envio"><strong>Envío:</strong> ' + order.notas + '</div>' : '',
      order.factura_generada ? '<div style="text-align:center;margin-top:8px"><span class="badge badge-ok">\u2713 FACTURA GENERADA</span></div>' : '',
      '<div class="footer">\u00a1Gracias por su compra!</div>',
      '<script>window.print();window.close();</script>',
      '</body></html>'
    ].join(''));
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Ventas</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona los pedidos y ventas del punto de venta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <div style={{ padding: 16, background: isEjecutivo ? '#000000' : themeColors.primary + '22', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: isEjecutivo ? '#888' : themeColors.textMuted, marginBottom: 4 }}>Total Ventas</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: isEjecutivo ? '#fff' : themeColors.text }}>${Number(stats.totalVentas || 0).toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Completados</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{stats.completados}</div>
        </div>
        <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Reservados</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{stats.pendientes}</div>
        </div>
        <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Abonados</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#06b6d4' }}>{stats.abonos}</div>
        </div>
        <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Pagado</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>${Number(stats.totalPagado || 0).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 'minmax(200px, 1fr)' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por ID, cliente o teléfono..."
            value={searchOrder}
            onChange={e => setSearchOrder(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 40px', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none'
            }}
          />
        </div>
        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value as typeof dateFilter)}
          style={{
            padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none'
          }}
        >
          <option value="all">Todos los días</option>
          <option value="today">Hoy</option>
          <option value="week">Última semana</option>
          <option value="month">Último mes</option>
        </select>
        <select
          value={metodoFilter}
          onChange={e => setMetodoFilter(e.target.value as typeof metodoFilter)}
          style={{
            padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none'
          }}
        >
          <option value="todos">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="mixto">Mixto</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', 'enviadas', 'pendiente', 'abonado', 'completado', 'cancelado'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ 
              backgroundColor: isEjecutivo ? (filter === f ? '#fbbf24' : '#000000') : (filter === f ? themeColors.primary : 'rgba(100,116,139,0.2)'), 
              color: isEjecutivo ? (filter === f ? '#000000' : '#ffffff') : (filter === f ? 'white' : 'var(--text-muted)')
            }}
            className="px-4 py-2 rounded-lg text-sm"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table table-mobile-card">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Método</th>
                <th>Envío</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No se encontraron ventas
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                return (
                  <tr key={order.id}>
                    <td data-label="ID" className="font-mono text-sm" style={{ color: 'var(--text)' }}>{order.id}</td>
                    <td data-label="Cliente" style={{ color: 'var(--text-muted)' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{order.cliente}</div>
                      {order.telefono && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.telefono}</div>}
                    </td>
                    <td data-label="Productos" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                    </td>
                    <td data-label="Total" className="font-semibold" style={{ color: 'var(--text)' }}>${Number(order.monto || 0).toFixed(2)}</td>
                    <td data-label="Método" style={{ fontSize: 18 }}>
                      {getMetodoIcon(order.metodo_pago)}
                    </td>
                    <td data-label="Envío" style={{ textAlign: 'center', fontSize: 16 }}>
                      {order.notas && order.notas.trim() ? (
                        <span title={order.notas} style={{ cursor: 'help' }}>✅</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>❌</span>
                      )}
                    </td>
                    <td data-label="Estado">
                      <span className="badge" style={{ 
                        backgroundColor: order.estado === 'completado' ? 'rgba(34,197,94,0.15)' : order.estado === 'abonado' ? 'rgba(6,182,212,0.15)' : order.estado === 'pendiente' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        color: order.estado === 'completado' ? '#4ade80' : order.estado === 'abonado' ? '#06b6d4' : order.estado === 'pendiente' ? '#fbbf24' : '#f87171'
                      }}>
                        {order.estado}
                      </span>
                    </td>
                    <td data-label="Fecha" className="text-sm" style={{ color: 'var(--text-muted)' }}>{order.fecha}</td>
                    <td data-label="Acciones">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => { setSelectedOrder(order); setEditStatus(order.estado); setEditMontoPagado(String(order.monto_pagado || '')); setEditMode(false); }}
                          style={{ padding: '4px 8px', background: isEjecutivo ? '#000000' : 'rgba(100,116,139,0.2)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: isEjecutivo ? '#ffffff' : 'inherit' }}
                        >👁️</button>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          style={{ padding: '4px 8px', background: isEjecutivo ? '#000000' : 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: isEjecutivo ? '#ffffff' : 'inherit' }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Detalles de Venta</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>ID Pedido</p>
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, fontFamily: 'monospace' }}>{selectedOrder.id}</p>
            </div>

            {/* Cliente */}
            <div style={{ marginBottom: 16, padding: 16, background: 'var(--background)', borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--primary)', margin: '0 0 12px', fontWeight: 600 }}>DATOS DEL CLIENTE</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nombre:</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{selectedOrder.cliente}</span>
                </div>
                {selectedOrder.telefono && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Teléfono:</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{selectedOrder.telefono}</span>
                  </div>
                )}
                {selectedOrder.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email:</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{selectedOrder.email}</span>
                  </div>
                )}
                {selectedOrder.direccion && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dirección:</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', textAlign: 'right' }}>{selectedOrder.direccion}</span>
                  </div>
                )}
                {selectedOrder.ciudad && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ciudad:</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{selectedOrder.ciudad}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Productos */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--primary)', margin: '0 0 8px', fontWeight: 600 }}>PRODUCTOS</p>
              <div style={{ background: 'var(--background)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Código</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Producto</th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>Cant</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Precio</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10 }}>{(item.productId || '').slice(0, 8)}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontSize: 11 }}>{item.productCode || '—'}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--text)', fontWeight: 500 }}>{item.productName}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text)' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text-muted)' }}>${Number(item.price || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>${Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Total</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>${Number(selectedOrder.monto || 0).toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Pagado</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', margin: 0 }}>${Number(selectedOrder.monto_pagado || 0).toFixed(2)}</p>
              </div>
            </div>

            {selectedOrder.cambio && selectedOrder.cambio > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(34,197,94,0.15)', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: '#4ade80', margin: 0 }}>Cambio: ${Number(selectedOrder.cambio || 0).toFixed(2)}</p>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Cliente</p>
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>{selectedOrder.cliente}</p>
              {selectedOrder.telefono && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{selectedOrder.telefono}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Estado</p>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value as OrderStatus)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="abonado">Abonado</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  {editStatus === 'abonado' && (
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MONTO PAGADO</label>
                      <input
                        type="number"
                        value={editMontoPagado}
                        onChange={e => setEditMontoPagado(e.target.value)}
                        placeholder={`Monto máximo: $${Number(selectedOrder.monto || 0).toFixed(2)}`}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  )}
                  {editStatus === 'completado' && (
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ENVÍO POR</label>
                      <input
                        type="text"
                        value={editNotas}
                        onChange={e => setEditNotas(e.target.value)}
                        placeholder="Ej: Servientrega, transporte propio, etc."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span className="badge" style={{ 
                  backgroundColor: selectedOrder.estado === 'completado' ? 'rgba(34,197,94,0.15)' : selectedOrder.estado === 'abonado' ? 'rgba(6,182,212,0.15)' : selectedOrder.estado === 'pendiente' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: selectedOrder.estado === 'completado' ? '#4ade80' : selectedOrder.estado === 'abonado' ? '#06b6d4' : selectedOrder.estado === 'pendiente' ? '#fbbf24' : '#f87171'
                }}>
                  {selectedOrder.estado}
                </span>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Productos</p>
              <div style={{ background: 'var(--background)', borderRadius: 8, padding: 12 }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: idx < (selectedOrder.items?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ color: 'var(--text)' }}>{item.productName} x{item.quantity}</span>
                    <span style={{ color: 'var(--text-muted)' }}>${Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Total</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>${Number(selectedOrder.monto || 0).toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Pagado</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', margin: 0 }}>${Number(selectedOrder.monto_pagado || 0).toFixed(2)}</p>
              </div>
            </div>

            {selectedOrder.metodo_pago && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Método de Pago</p>
                <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, textTransform: 'capitalize' }}>{selectedOrder.metodo_pago}</p>
                {selectedOrder.metodo_pago === 'tarjeta' && selectedOrder.tarjeta_last4 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Tarjeta: **** {selectedOrder.tarjeta_last4}</p>
                )}
                {selectedOrder.metodo_pago === 'tarjeta' && selectedOrder.tarjeta_autori && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Autorización: {selectedOrder.tarjeta_autori}</p>
                )}
                {selectedOrder.metodo_pago === 'transferencia' && selectedOrder.transferencia_imagen && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Comprobante:</p>
                    <img src={selectedOrder.transferencia_imagen} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                  </div>
                )}
              </div>
            )}

            {selectedOrder.factura_generada && (
              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(34,197,94,0.15)', borderRadius: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', margin: 0 }}>✓ Factura Generada</p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Fecha</p>
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>{selectedOrder.fecha}</p>
            </div>

            {!editMode && selectedOrder.notas && (
              <div style={{ marginBottom: 16, padding: 12, background: 'var(--background)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>Envío:</span> {selectedOrder.notas}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {editMode ? (
                <>
                  <button 
                    onClick={handleSaveEdit}
                    style={{ flex: 1, padding: 12, background: isEjecutivo ? '#fbbf24' : '#4ade80', border: 'none', borderRadius: 8, color: isEjecutivo ? '#000000' : '#000', fontWeight: 600, cursor: 'pointer' }}
                  >Guardar</button>
                  <button 
                    onClick={() => setEditMode(false)}
                    style={{ flex: 1, padding: 12, background: isEjecutivo ? '#000000' : 'var(--border)', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                  >Cancelar</button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setEditMode(true); setEditStatus(selectedOrder.estado); setEditMontoPagado(String(selectedOrder.monto_pagado || '')); setEditNotas(selectedOrder.notas || ''); }}
                    style={{ flex: 1, padding: 12, background: isEjecutivo ? '#000000' : 'var(--primary)', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 600, cursor: 'pointer' }}
                  >Editar Estado</button>
                  <button 
                    onClick={() => handlePrint(selectedOrder)}
                    style={{ padding: 12, background: isEjecutivo ? '#000000' : '#4ade80', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 600, cursor: 'pointer' }}
                  >🖨️</button>
                  <button 
                    onClick={() => handleDelete(selectedOrder.id)}
                    style={{ padding: 12, background: isEjecutivo ? '#000000' : '#ef4444', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >Eliminar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
