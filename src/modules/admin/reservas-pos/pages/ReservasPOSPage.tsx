import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../../../store';
import { Order, THEME_PRESETS, ThemeType, MetodoPago, Product } from '../../../../types';

type FiltroAbono = 'todas' | 'sin_abono' | 'con_abono' | 'completado' | 'enviadas';

export default function ReservasPOSPage() {
  const settings = useStore(state => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';

  const reservasPos = useStore(state => state.reservasPos);
  const updateOrder = useStore(state => state.updateOrder);
  const deleteOrder = useStore(state => state.deleteOrder);
  const allProducts = useStore(state => state.products);

  const [filtroAbono, setFiltroAbono] = useState<FiltroAbono>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReserva, setSelectedReserva] = useState<Order | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState<Order['estado']>('pendiente');
  const [editMontoPagado, setEditMontoPagado] = useState('');
  const [editItems, setEditItems] = useState<Order['items']>([]);
  const [editNotas, setEditNotas] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const filteredReservas = useMemo(() => {
    let result = reservasPos;

    if (filtroAbono === 'sin_abono') {
      result = result.filter(r => r.estado === 'pendiente');
    } else if (filtroAbono === 'con_abono') {
      result = result.filter(r => r.estado === 'abonado');
    } else if (filtroAbono === 'completado') {
      result = result.filter(r => r.estado === 'completado');
    } else if (filtroAbono === 'enviadas') {
      result = result.filter(r => r.notas && r.notas.trim().length > 0);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.cliente.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.telefono && r.telefono.includes(q))
      );
    }

    return result;
  }, [reservasPos, filtroAbono, searchQuery]);

  const stats = useMemo(() => {
    const sinAbono = reservasPos.filter(r => r.estado === 'pendiente').length;
    const conAbono = reservasPos.filter(r => r.estado === 'abonado').length;
    const completado = reservasPos.filter(r => r.estado === 'completado').length;
    const totalValor = reservasPos.reduce((s, r) => s + r.monto, 0);
    const totalAbonado = reservasPos.reduce((s, r) => s + (r.monto_pagado || 0), 0);
    return { sinAbono, conAbono, completado, totalValor, totalAbonado };
  }, [reservasPos]);

  const filteredProducts = useMemo(() => {
    if (!productSearch || !allProducts) return [];
    const q = productSearch.toLowerCase();
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [allProducts, productSearch]);

  const editTotal = useMemo(() => {
    return editItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  }, [editItems]);

  const abonoNum = editMontoPagado ? parseFloat(editMontoPagado) : 0;
  const saldoPendiente = editTotal - abonoNum;

  useEffect(() => {
    if (selectedReserva && editMode) {
      setEditItems(selectedReserva.items ? [...selectedReserva.items] : []);
      setEditStatus(selectedReserva.estado);
      setEditMontoPagado(String(selectedReserva.monto_pagado || ''));
      setEditNotas(selectedReserva.notas || '');
    }
  }, [selectedReserva, editMode]);

  const handleOpenDetails = (r: Order) => {
    setSelectedReserva(r);
    setEditStatus(r.estado);
    setEditMontoPagado(String(r.monto_pagado || ''));
    setEditItems(r.items ? [...r.items] : []);
    setEditNotas(r.notas || '');
    setEditMode(false);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleSaveEdit = () => {
    if (selectedReserva) {
      let finalStatus = editStatus;
      if (editStatus === 'abonado' && abonoNum >= editTotal) {
        finalStatus = 'completado';
      }
      const updateData: Partial<Order> = {
        estado: finalStatus,
        items: editItems,
        monto: editTotal,
        notas: editNotas,
      };
      if (finalStatus === 'abonado') {
        updateData.monto_pagado = abonoNum;
      } else if (finalStatus === 'completado') {
        updateData.monto_pagado = editTotal;
      } else if (finalStatus === 'pendiente') {
        updateData.monto_pagado = 0;
      }
      updateOrder(selectedReserva.id, updateData);
      setSelectedReserva({ ...selectedReserva, ...updateData });
      setEditMode(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta reserva?')) {
      deleteOrder(id);
      setSelectedReserva(null);
    }
  };

  const updateItemQty = (idx: number, qty: number) => {
    if (qty <= 0) {
      setEditItems(prev => prev.filter((_, i) => i !== idx));
    } else {
      setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
    }
  };

  const addProductToItems = (product: Product) => {
    const existingIdx = editItems.findIndex(item => item.productId === product.id);
    if (existingIdx >= 0) {
      setEditItems(prev => prev.map((item, i) =>
        i === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      const price = product.en_liquidacion && product.precio_liquidacion ? product.precio_liquidacion : product.price;
      setEditItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        productCode: product.codigo || '',
        quantity: 1,
        price,
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const getMetodoIcon = (metodo?: MetodoPago) => {
    switch (metodo) {
      case 'efectivo': return '💵';
      case 'transferencia': return '📱';
      case 'tarjeta': return '💳';
      default: return '—';
    }
  };

  const handlePrint = (order: Order) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const itemsHtml = order.items?.map(item => `
      <tr>
        <td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px">${item.quantity}x</td>
        <td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px">${item.productName}</td>
        <td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px;text-align:right">$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
      </tr>
    `).join('') || '';
    const saldo = (order.monto || 0) - (order.monto_pagado || 0);
    printWin.document.write(`
      <html><head><title>Reserva ${order.id}</title>
      <style>
        body{font-family:'Courier New',monospace;padding:20px;max-width:320px;margin:auto}
        h1{font-size:18px;text-align:center;margin:0}
        h2{font-size:14px;text-align:center;margin:4px 0 16px;color:#666}
        .divider{border-top:1px dashed #000;margin:12px 0}
        table{width:100%;border-collapse:collapse}
        .total{font-size:16px;font-weight:bold;text-align:right;margin-top:8px}
        .info{font-size:11px;color:#555;margin:4px 0}
        .footer{text-align:center;font-size:11px;color:#888;margin-top:16px;border-top:1px dashed #000;padding-top:12px}
        .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold}
      </style></head><body>
        <h1>${settings?.storeName || 'PAN E'}</h1>
        <h2>RESERVA POS</h2>
        <div class="info"><strong>ID:</strong> ${order.id}</div>
        <div class="info"><strong>Cliente:</strong> ${order.cliente}</div>
        ${order.telefono ? `<div class="info"><strong>Tel:</strong> ${order.telefono}</div>` : ''}
        <div class="info"><strong>Fecha:</strong> ${order.fecha}</div>
        <div class="divider"></div>
        <table>${itemsHtml}</table>
        <div class="divider"></div>
        <div class="total">Total: $${order.monto.toFixed(2)}</div>
        <div class="info"><strong>Pagado:</strong> $${(order.monto_pagado || 0).toFixed(2)}</div>
        ${saldo > 0 ? `<div class="info"><strong>Saldo:</strong> $${saldo.toFixed(2)}</div>` : ''}
        <div class="info"><strong>Estado:</strong> ${order.estado === 'abonado' ? 'Con Abono' : order.estado === 'completado' ? 'Completado' : 'Sin Abono'}</div>
        ${order.notas ? `<div class="info"><strong>Envío:</strong> ${order.notas}</div>` : ''}
        <div class="footer">¡Gracias por su compra!</div>
        <script>window.print();window.close();<\/script>
      </body></html>
    `);
    printWin.document.close();
  };

  const tc = themeColors;

  return (
    <div style={{ animation: 'fadeUp .4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tc.text }}>Reservas POS</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: tc.textMuted }}>Reservas y abonos generados desde el punto de venta</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 16, background: isEjecutivo ? '#000000' : tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Sin Abono</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.sinAbono}</div>
        </div>
        <div style={{ padding: 16, background: isEjecutivo ? '#000000' : tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Con Abono</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#06b6d4' }}>{stats.conAbono}</div>
        </div>
        <div style={{ padding: 16, background: isEjecutivo ? '#000000' : tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Valor Total</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tc.text }}>${stats.totalValor.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: isEjecutivo ? '#000000' : tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Total Abonado</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tc.success }}>${stats.totalAbonado.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: isEjecutivo ? '#000000' : tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Completados</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{stats.completado}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 'minmax(200px, 1fr)' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por cliente, ID o teléfono..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 40px', background: tc.surface, border: `1px solid ${tc.border}`,
              borderRadius: 8, color: tc.text, fontSize: 13, outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Tabs Con/Sin Abono */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'todas' as FiltroAbono, label: 'Todas', icon: '📋' },
          { id: 'sin_abono' as FiltroAbono, label: 'Sin Abono', icon: '📦' },
          { id: 'con_abono' as FiltroAbono, label: 'Con Abono', icon: '💳' },
          { id: 'completado' as FiltroAbono, label: 'Completados', icon: '✅' },
          { id: 'enviadas' as FiltroAbono, label: 'Enviadas', icon: '📦' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFiltroAbono(tab.id)}
            style={{
              padding: '10px 16px', background: filtroAbono === tab.id ? (isEjecutivo ? '#fbbf24' : `${tc.primary}22`) : (isEjecutivo ? '#000000' : 'transparent'),
              border: `1px solid ${filtroAbono === tab.id ? (isEjecutivo ? '#fbbf24' : tc.primary) : tc.border}`, borderRadius: 8,
              color: filtroAbono === tab.id ? (isEjecutivo ? '#000000' : tc.primary) : (isEjecutivo ? '#ffffff' : tc.textMuted),
              fontSize: 12, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: tc.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Total</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Pagado</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Envío</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: tc.textMuted, fontSize: 13 }}>
                  No se encontraron reservas
                </td>
              </tr>
            ) : filteredReservas.map(r => (
              <tr key={r.id} style={{ borderTop: `1px solid ${tc.border}` }}>
                <td data-label="ID" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, fontFamily: 'monospace' }}>{r.id}</td>
                <td data-label="Cliente" style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, color: tc.text, fontSize: 13 }}>{r.cliente}</div>
                  {r.telefono && <div style={{ fontSize: 11, color: tc.textMuted }}>{r.telefono}</div>}
                </td>
                <td data-label="Total" style={{ padding: '12px 16px', fontSize: 13, color: tc.text, fontWeight: 600, textAlign: 'right' }}>${r.monto.toFixed(2)}</td>
                <td data-label="Pagado" style={{ padding: '12px 16px', fontSize: 13, color: '#4ade80', fontWeight: 600, textAlign: 'right' }}>${(r.monto_pagado || 0).toFixed(2)}</td>
                <td data-label="Estado" style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                    background: r.estado === 'abonado' ? 'rgba(6,182,212,0.15)' : r.estado === 'completado' ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)',
                    color: r.estado === 'abonado' ? '#06b6d4' : r.estado === 'completado' ? '#4ade80' : '#f59e0b'
                  }}>
                    {r.estado === 'abonado' ? 'Con Abono' : r.estado === 'completado' ? 'Completado' : 'Sin Abono'}
                  </span>
                </td>
                <td data-label="Envío" style={{ textAlign: 'center', fontSize: 16 }}>
                  {r.notas && r.notas.trim() ? (
                    <span title={r.notas} style={{ cursor: 'help' }}>✅</span>
                  ) : (
                    <span style={{ color: tc.textMuted, fontSize: 12 }}>❌</span>
                  )}
                </td>
                <td data-label="Acciones" style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleOpenDetails(r)}
                    style={{ padding: '4px 8px', background: isEjecutivo ? '#000000' : 'rgba(100,116,139,0.2)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  >👁️</button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{ padding: '4px 8px', background: isEjecutivo ? '#000000' : 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, marginLeft: 4 }}
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalles */}
      {selectedReserva && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedReserva(null)}>
          <div style={{ background: tc.surface, borderRadius: 16, padding: 24, maxWidth: 520, width: '90%', maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: tc.text }}>Detalles de Reserva</h2>
              <button onClick={() => setSelectedReserva(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: tc.textMuted }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: tc.textMuted, margin: '0 0 4px' }}>ID</p>
              <p style={{ fontSize: 14, color: tc.text, margin: 0, fontFamily: 'monospace' }}>{selectedReserva.id}</p>
            </div>

            <div style={{ marginBottom: 16, padding: 16, background: tc.background, borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: tc.primary, margin: '0 0 12px', fontWeight: 600 }}>CLIENTE</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: tc.textMuted }}>Nombre:</span>
                  <span style={{ fontSize: 13, color: tc.text, fontWeight: 500 }}>{selectedReserva.cliente}</span>
                </div>
                {selectedReserva.telefono && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: tc.textMuted }}>Teléfono:</span>
                    <span style={{ fontSize: 13, color: tc.text }}>{selectedReserva.telefono}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: tc.textMuted, margin: '0 0 4px' }}>Estado</p>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as Order['estado'])}
                    style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${tc.border}`, background: tc.background, color: tc.text }}
                  >
                    <option value="pendiente">Sin Abono</option>
                    <option value="abonado">Con Abono</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  {editStatus === 'abonado' && (
                    <div>
                      <label style={{ fontSize: 11, color: tc.textMuted, display: 'block', marginBottom: 4 }}>MONTO DEL ABONO</label>
                      <input
                        type="number"
                        value={editMontoPagado}
                        onChange={e => setEditMontoPagado(e.target.value)}
                        placeholder={`Monto: $${editTotal.toFixed(2)}`}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${tc.border}`, background: tc.background, color: tc.text, fontSize: 13, outline: 'none' }}
                      />
                      {editMontoPagado && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 12 }}>
                          <span style={{ color: '#4ade80' }}>Abono: ${abonoNum.toFixed(2)}</span>
                          <span style={{ color: saldoPendiente > 0 ? '#f59e0b' : tc.textMuted }}>
                            Saldo pendiente: ${saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {editStatus === 'completado' && (
                    <div>
                      <label style={{ fontSize: 11, color: tc.textMuted, display: 'block', marginBottom: 4 }}>ENVÍO POR</label>
                      <input
                        type="text"
                        value={editNotas}
                        onChange={e => setEditNotas(e.target.value)}
                        placeholder="Ej: Servientrega, transporte propio, etc."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${tc.border}`, background: tc.background, color: tc.text, fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                  background: selectedReserva.estado === 'abonado' ? 'rgba(6,182,212,0.15)' : selectedReserva.estado === 'completado' ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)',
                  color: selectedReserva.estado === 'abonado' ? '#06b6d4' : selectedReserva.estado === 'completado' ? '#4ade80' : '#f59e0b'
                }}>
                  {selectedReserva.estado === 'abonado' ? 'Con Abono' : selectedReserva.estado === 'completado' ? 'Completado' : 'Sin Abono'}
                </span>
              )}
              {!editMode && selectedReserva.notas && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: tc.background, borderRadius: 8, fontSize: 12, color: tc.textMuted }}>
                  <span style={{ fontWeight: 500, color: tc.text }}>Envío:</span> {selectedReserva.notas}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: tc.textMuted, margin: '0 0 4px' }}>Productos</p>
              {editMode ? (
                <div style={{ background: tc.background, borderRadius: 8, padding: 12 }}>
                  {editItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                      borderBottom: idx < editItems.length - 1 ? `1px solid ${tc.border}` : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: tc.text }}>{item.productName}</div>
                        <div style={{ fontSize: 11, color: tc.textMuted }}>${Number(item.price || 0).toFixed(2)} c/u</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => updateItemQty(idx, item.quantity - 1)}
                          style={{ width: 24, height: 24, borderRadius: 4, background: tc.border, border: 'none', color: tc.text, cursor: 'pointer', fontSize: 14 }}
                        >-</button>
                        <span style={{ fontSize: 12, color: tc.text, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateItemQty(idx, item.quantity + 1)}
                          style={{ width: 24, height: 24, borderRadius: 4, background: tc.border, border: 'none', color: tc.text, cursor: 'pointer', fontSize: 14 }}
                        >+</button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tc.text, minWidth: 50, textAlign: 'right' }}>
                        ${Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => updateItemQty(idx, 0)}
                        style={{ background: 'none', border: 'none', color: tc.error, cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
                      >×</button>
                    </div>
                  ))}
                  {/* Agregar producto */}
                  <div style={{ position: 'relative', marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="Buscar producto para agregar..."
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                      onFocus={() => setShowProductDropdown(true)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${tc.border}`, background: tc.surface, color: tc.text, fontSize: 12, outline: 'none' }}
                    />
                    {showProductDropdown && filteredProducts.length > 0 && (
                      <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 8, marginBottom: 4, maxHeight: 200, overflow: 'auto', zIndex: 10 }}>
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            onClick={() => addProductToItems(p)}
                            style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: tc.text, fontSize: 12, textAlign: 'left', cursor: 'pointer', borderBottom: `1px solid ${tc.border}` }}
                          >
                            <span>{p.name}</span>
                            <span style={{ color: tc.textMuted }}>${p.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: tc.background, borderRadius: 8, padding: 12 }}>
                  {selectedReserva.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: idx < (selectedReserva.items?.length || 0) - 1 ? `1px solid ${tc.border}` : 'none' }}>
                      <span style={{ color: tc.text }}>{item.productName} x{item.quantity}</span>
                      <span style={{ color: tc.textMuted }}>${Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: tc.textMuted, margin: '0 0 4px' }}>Total</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: tc.text, margin: 0 }}>
                  ${editMode ? editTotal.toFixed(2) : Number(selectedReserva.monto || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: tc.textMuted, margin: '0 0 4px' }}>Pagado</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', margin: 0 }}>
                  ${editMode && editStatus === 'abonado'
                    ? abonoNum.toFixed(2)
                    : Number(selectedReserva.monto_pagado || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {editMode && editStatus === 'abonado' && saldoPendiente > 0 && (
              <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                  Saldo pendiente: ${saldoPendiente.toFixed(2)}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {editMode ? (
                <>
                  <button onClick={handleSaveEdit}
                    style={{ flex: 1, padding: 12, background: isEjecutivo ? '#fbbf24' : '#4ade80', border: 'none', borderRadius: 8, color: isEjecutivo ? '#000000' : '#000', fontWeight: 600, cursor: 'pointer' }}
                  >Guardar</button>
                  <button onClick={() => setEditMode(false)}
                    style={{ flex: 1, padding: 12, background: isEjecutivo ? '#000000' : tc.border, border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : tc.text, fontWeight: 600, cursor: 'pointer' }}
                  >Cancelar</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditMode(true)}
                    style={{ flex: 1, padding: 12, background: isEjecutivo ? '#000000' : tc.primary, border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 600, cursor: 'pointer' }}
                  >Editar</button>
                  <button onClick={() => handlePrint(selectedReserva)}
                    style={{ padding: 12, background: isEjecutivo ? '#000000' : '#4ade80', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 600, cursor: 'pointer' }}
                  >🖨️</button>
                  <button onClick={() => handleDelete(selectedReserva.id)}
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
