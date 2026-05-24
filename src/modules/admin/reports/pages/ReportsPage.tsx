import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../../../store';
import { useAdminStore } from '../../../../store/adminStore';
import { THEME_PRESETS, ThemeType } from '../../../../types';

type ReportType = 'ventas' | 'productos' | 'reservas' | 'consultas' | 'inventario';

export default function ReportsPage() {
  const settings = useStore(state => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  const tc = themeColors;
  
  const [reportType, setReportType] = useState<ReportType>('ventas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const orders = useStore(state => state.orders);
  const products = useStore(state => state.products);
  const fetchProductsFromSupabase = useStore(state => state.fetchProductsFromSupabase);
  const fetchOrdersFromSupabase = useStore(state => state.fetchOrdersFromSupabase);
  const reservas = useAdminStore(state => state.reservas);
  const consultas = useAdminStore(state => state.consultas);
  const fetchReservas = useAdminStore(state => state.fetchReservas);
  const fetchConsultas = useAdminStore(state => state.fetchConsultas);

  useEffect(() => {
    if (products.length === 0) fetchProductsFromSupabase()
    if (orders.length === 0) fetchOrdersFromSupabase()
    if (reservas.length === 0) fetchReservas()
    if (consultas.length === 0) fetchConsultas()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;
    return orders.filter(o => {
      const orderDate = new Date(o.fecha);
      if (dateFrom && orderDate < new Date(dateFrom)) return false;
      if (dateTo && orderDate > new Date(dateTo)) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const filteredReservas = useMemo(() => {
    if (!dateFrom && !dateTo) return reservas;
    return reservas.filter(r => {
      const resDate = new Date(r.fecha_reserva);
      if (dateFrom && resDate < new Date(dateFrom)) return false;
      if (dateTo && resDate > new Date(dateTo)) return false;
      return true;
    });
  }, [reservas, dateFrom, dateTo]);

  const totalVentas = filteredOrders.reduce((sum, o) => sum + o.monto, 0);
  const totalReservas = filteredReservas.reduce((sum, r) => sum + r.total, 0);
  const productsActivos = products.filter(p => p.status === 'active').length;
  const productsInactivos = products.filter(p => p.status === 'inactive').length;

  const ventasPorDia = useMemo(() => {
    const dias: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const dia = o.fecha;
      dias[dia] = (dias[dia] || 0) + o.monto;
    });
    return Object.entries(dias).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
  }, [filteredOrders]);

  const ventasPorEstado = useMemo(() => {
    const estados: Record<string, number> = {};
    filteredOrders.forEach(o => {
      estados[o.estado] = (estados[o.estado] || 0) + 1;
    });
    return estados;
  }, [filteredOrders]);

  const maxVenta = Math.max(...ventasPorDia.map(([_, v]) => v), 1);

  const promedioVenta = filteredOrders.length > 0 ? totalVentas / filteredOrders.length : 0;
  const mejorVenta = Math.max(...filteredOrders.map(o => o.monto), 0);
  const sortedDias = [...ventasPorDia].sort((a, b) => Number(b[1]) - Number(a[1]));
  const mejorDia = sortedDias[0];
  const diaMasVentas = mejorDia ? mejorDia[0] : '-';

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let csvContent = '';
    let filename = '';
    
    if (reportType === 'ventas') {
      const headers = ['ID', 'Cliente', 'Fecha', 'Estado', 'Total'];
      const rows = filteredOrders.map(o => [o.id, o.cliente, o.fecha, o.estado, o.monto.toFixed(2)]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = `reporte_ventas_${dateFrom || 'all'}_${dateTo || 'all'}.csv`;
    } else if (reportType === 'productos') {
      const headers = ['Producto', 'Categoría', 'Precio', 'Stock', 'Estado'];
      const rows = products.map(p => [p.name, p.category || '-', p.price.toFixed(2), p.stock, p.status]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = 'reporte_productos.csv';
    } else if (reportType === 'reservas') {
      const headers = ['ID', 'Cliente', 'Fecha', 'Estado', 'Total'];
      const rows = filteredReservas.map(r => [r.id, r.cliente_nombre || '-', r.fecha_reserva?.split('T')[0], r.estado_reserva, r.total.toFixed(2)]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = 'reporte_reservas.csv';
    } else if (reportType === 'consultas') {
      const headers = ['Producto', 'Origen', 'Fecha'];
      const rows = consultas.map(c => [c.producto_nombre || '-', c.origen, c.fecha?.split('T')[0] || '-']);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = 'reporte_consultas.csv';
    } else if (reportType === 'inventario') {
      const headers = ['Producto', 'Stock', 'Estado'];
      const rows = products.map(p => [p.name, p.stock, p.stock === 0 ? 'Agotado' : p.stock <= 5 ? 'Bajo' : 'Normal']);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = 'reporte_inventario.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const renderChart = () => (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: tc.text }}>Gráfico de Ventas</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
        {ventasPorDia.map(([dia, valor]) => (
          <div key={dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ 
              width: '100%', 
              height: `${(valor / maxVenta) * 120}px`, 
              background: 'linear-gradient(180deg, #22c55e, #16a34a)', 
              borderRadius: 4,
              minHeight: 4
            }} />
            <span style={{ fontSize: 9, color: tc.textMuted }}>{dia.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVentasReport = () => (
    <div>
      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Total Ventas</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.success }}>${totalVentas.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Pedidos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>{filteredOrders.length}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Completados</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.success }}>{ventasPorEstado.completado || 0}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Pendientes</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.warning }}>{ventasPorEstado.pendiente || 0}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Promedio</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>${promedioVenta.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Mejor Venta</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>${mejorVenta.toFixed(2)}</div>
        </div>
      </div>

      {renderChart()}

      <div className="consultas-table-wrapper" style={{ background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}`, overflow: 'hidden' }}>
        <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: tc.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.slice(0, 10).map(order => (
              <tr key={order.id} style={{ borderTop: `1px solid ${tc.border}` }}>
                <td data-label="ID" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, fontFamily: 'monospace' }}>{order.id}</td>
                <td data-label="Cliente" style={{ padding: '12px 16px', fontSize: 12, color: tc.text }}>{order.cliente}</td>
                <td data-label="Fecha" style={{ padding: '12px 16px', fontSize: 12, color: tc.textMuted }}>{order.fecha}</td>
                <td data-label="Estado" style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                    background: order.estado === 'completado' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: order.estado === 'completado' ? '#4ade80' : '#fbbf24'
                  }}>
                    {order.estado}
                  </span>
                </td>
                <td data-label="Total" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, fontWeight: 600, textAlign: 'right' }}>${order.monto.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProductosReport = () => (
    <div>
      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Total Productos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>{products.length}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Activos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.success }}>{productsActivos}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Inactivos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.error }}>{productsInactivos}</div>
        </div>
      </div>

      <div className="reports-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Top Productos</h4>
          {products.slice(0, 5).map((p, idx) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: 4, background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: idx < 3 ? '#000' : tc.textMuted }}>{idx + 1}</span>
              <span style={{ flex: 1, fontSize: 11, color: tc.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: tc.primary }}>${p.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Estado Productos</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(34,197,94,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: tc.success }}>{productsActivos}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>Activos</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(100,116,139,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: tc.textMuted }}>{productsInactivos}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>Inactivos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="consultas-table-wrapper" style={{ background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}`, overflow: 'hidden' }}>
        <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: tc.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Producto</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Categoría</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Precio</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Stock</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderTop: `1px solid ${tc.border}` }}>
                <td data-label="Producto" style={{ padding: '12px 16px', fontSize: 12, color: tc.text }}>{product.name}</td>
                <td data-label="Categoría" style={{ padding: '12px 16px', fontSize: 12, color: tc.textMuted }}>{product.category || '-'}</td>
                <td data-label="Precio" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, textAlign: 'right' }}>${product.price.toFixed(2)}</td>
                <td data-label="Stock" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, textAlign: 'right' }}>{product.stock}</td>
                <td data-label="Estado" style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                    background: product.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                    color: product.status === 'active' ? '#4ade80' : '#94a3b8'
                  }}>
                    {product.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReservasReport = () => (
    <div>
      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Total Reservas</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>{filteredReservas.length}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Valor Total</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.success }}>${totalReservas.toFixed(2)}</div>
        </div>
      </div>

      <div className="reports-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Estado Reservas</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {['abonado', 'confirmado', 'cancelado'].map(estado => {
              const count = filteredReservas.filter(r => r.estado_reserva === estado).length;
              const color = estado === 'confirmado' ? tc.success : estado === 'abonado' ? '#22d3ee' : tc.error;
              return (
                <div key={estado} style={{ flex: 1, textAlign: 'center', padding: 8, background: color + '22', borderRadius: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{count}</div>
                  <div style={{ fontSize: 9, color: tc.textMuted, textTransform: 'capitalize' }}>{estado.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Resumen</h4>
          <div style={{ fontSize: 14, color: tc.text }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Confirmadas:</span>
              <span style={{ fontWeight: 600, color: tc.success }}>{filteredReservas.filter(r => r.estado_reserva === 'confirmado').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Canceladas:</span>
              <span style={{ fontWeight: 600, color: tc.error }}>{filteredReservas.filter(r => r.estado_reserva === 'cancelado').length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="consultas-table-wrapper" style={{ background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}`, overflow: 'hidden' }}>
        <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: tc.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservas.slice(0, 10).map(reserva => (
              <tr key={reserva.id} style={{ borderTop: `1px solid ${tc.border}` }}>
                <td data-label="ID" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, fontFamily: 'monospace' }}>{reserva.id}</td>
                <td data-label="Cliente" style={{ padding: '12px 16px', fontSize: 12, color: tc.text }}>{reserva.cliente_nombre || '-'}</td>
                <td data-label="Fecha" style={{ padding: '12px 16px', fontSize: 12, color: tc.textMuted }}>{reserva.fecha_reserva?.split('T')[0]}</td>
                <td data-label="Estado" style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                    background: reserva.estado_reserva === 'confirmado' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: reserva.estado_reserva === 'confirmado' ? '#4ade80' : '#fbbf24'
                  }}>
                    {reserva.estado_reserva}
                  </span>
                </td>
                <td data-label="Total" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, fontWeight: 600, textAlign: 'right' }}>${reserva.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConsultasReport = () => (
    <div>
      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Total Consultas</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>{consultas.length}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>WhatsApp</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#25D366' }}>{consultas.filter(c => c.origen === 'whatsapp').length}</div>
        </div>
      </div>

      <div className="reports-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Consultas por Origen</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: '#25D36622', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#25D366' }}>{consultas.filter(c => c.origen === 'whatsapp').length}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>WhatsApp</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: '#22d3ee22', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#22d3ee' }}>{consultas.filter(c => c.origen === 'tienda').length}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>Tienda</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Tasa de Respuesta</h4>
          <div style={{ fontSize: 28, fontWeight: 700, color: tc.success, textAlign: 'center' }}>
            {consultas.length > 0 ? Math.round((consultas.filter(c => c.origen === 'whatsapp').length / consultas.length) * 100) : 0}%
          </div>
          <div style={{ fontSize: 10, color: tc.textMuted, textAlign: 'center', marginTop: 4 }}>Desde WhatsApp</div>
        </div>
      </div>

      <div className="consultas-table-wrapper" style={{ background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}`, overflow: 'hidden' }}>
        <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: tc.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Producto</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Origen</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {consultas.slice(0, 10).map(consulta => (
              <tr key={consulta.id} style={{ borderTop: `1px solid ${tc.border}` }}>
                <td data-label="Producto" style={{ padding: '12px 16px', fontSize: 12, color: tc.text }}>{consulta.producto_nombre || '-'}</td>
                <td data-label="Origen" style={{ padding: '12px 16px', fontSize: 12, color: tc.textMuted }}>{consulta.origen}</td>
                <td data-label="Fecha" style={{ padding: '12px 16px', fontSize: 12, color: tc.textMuted }}>{consulta.fecha?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventarioReport = () => (
    <div>
      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Total Stock</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>{products.reduce((s, p) => s + p.stock, 0)}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Productos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.text }}>{products.length}</div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <div style={{ fontSize: 12, color: tc.textMuted, marginBottom: 4 }}>Stock Bajo (&lt;5)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.error }}>{products.filter(p => p.stock <= 5).length}</div>
        </div>
      </div>

      <div className="reports-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Estado del Inventario</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(239,68,68,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: tc.error }}>{products.filter(p => p.stock === 0).length}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>Agotados</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(245,158,11,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: tc.warning }}>{products.filter(p => p.stock > 0 && p.stock <= 5).length}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>Bajo</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(34,197,94,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: tc.success }}>{products.filter(p => p.stock > 5).length}</div>
              <div style={{ fontSize: 10, color: tc.textMuted }}>Normal</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12 }}>Valor Inventory</h4>
          <div style={{ fontSize: 24, fontWeight: 700, color: tc.primary }}>
            ${products.reduce((s, p) => s + (p.price * p.stock), 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 10, color: tc.textMuted, marginTop: 4 }}>Valor total en stock</div>
        </div>
      </div>

      <div className="consultas-table-wrapper" style={{ background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}`, overflow: 'hidden' }}>
        <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: tc.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Producto</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Stock Actual</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: tc.textMuted, fontWeight: 600 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderTop: `1px solid ${tc.border}` }}>
                <td data-label="Producto" style={{ padding: '12px 16px', fontSize: 12, color: tc.text }}>{product.name}</td>
                <td data-label="Stock" style={{ padding: '12px 16px', fontSize: 12, color: tc.text, textAlign: 'right' }}>{product.stock}</td>
                <td data-label="Estado" style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                    background: product.stock === 0 ? 'rgba(239,68,68,0.15)' : product.stock <= 5 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                    color: product.stock === 0 ? '#f87171' : product.stock <= 5 ? '#fbbf24' : '#4ade80'
                  }}>
                    {product.stock === 0 ? 'Agotado' : product.stock <= 5 ? 'Bajo' : 'Normal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp .4s ease' }} className="print-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tc.text }}>Reportes</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: tc.textMuted }}>Genera e imprime reportes de tu negocio</p>
        </div>
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            style={{
              padding: '10px 20px', background: isEjecutivo ? '#000000' : tc.primary, border: 'none',
              borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir ▾
          </button>
          {showExportMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 8,
              overflow: 'hidden', zIndex: 100, minWidth: 150, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                style={{
                  width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
                  color: tc.text, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8
                }}
                onMouseEnter={e => (e.target as HTMLButtonElement).style.background = tc.border}
                onMouseLeave={e => (e.target as HTMLButtonElement).style.background = 'transparent'}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <button
                onClick={() => { handleExportExcel(); setShowExportMenu(false); }}
                style={{
                  width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
                  color: tc.text, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8
                }}
                onMouseEnter={e => (e.target as HTMLButtonElement).style.background = tc.border}
                onMouseLeave={e => (e.target as HTMLButtonElement).style.background = 'transparent'}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${tc.border}`, paddingBottom: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'ventas', label: 'Ventas', icon: '💰' },
          { id: 'productos', label: 'Productos', icon: '📦' },
          { id: 'reservas', label: 'Reservas', icon: '🎫' },
          { id: 'consultas', label: 'Consultas', icon: '💬' },
          { id: 'inventario', label: 'Inventario', icon: '📊' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            style={{
              padding: '10px 16px', background: reportType === tab.id ? (isEjecutivo ? '#fbbf24' : `${tc.primary}22`) : (isEjecutivo ? '#000000' : 'transparent'),
              border: `1px solid ${reportType === tab.id ? (isEjecutivo ? '#fbbf24' : tc.primary) : tc.border}`, borderRadius: 8,
              color: reportType === tab.id ? (isEjecutivo ? '#000000' : tc.primary) : (isEjecutivo ? '#ffffff' : tc.textMuted), fontSize: 12, cursor: 'pointer',
              fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: tc.textMuted, display: 'block', marginBottom: 6 }}>Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '8px 12px', background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 8, color: tc.text, fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: tc.textMuted, display: 'block', marginBottom: 6 }}>Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ padding: '8px 12px', background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 8, color: tc.text, fontSize: 13 }}
          />
        </div>
      </div>

      {reportType === 'ventas' && renderVentasReport()}
      {reportType === 'productos' && renderProductosReport()}
      {reportType === 'reservas' && renderReservasReport()}
      {reportType === 'consultas' && renderConsultasReport()}
      {reportType === 'inventario' && renderInventarioReport()}
    </div>
  );
}
