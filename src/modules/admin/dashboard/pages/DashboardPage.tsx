import { useMemo } from 'react';
import { useStore } from '../../../../store';
import { THEME_PRESETS, ThemeType } from '../../../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = {
  green: '#22c55e',
  yellow: '#f59e0b',
  blue: '#06b6d4',
  red: '#ef4444',
  purple: '#a855f7',
  orange: '#f97316',
};

const PIE_COLORS = [COLORS.green, COLORS.yellow, COLORS.blue, COLORS.red, COLORS.purple];

const Card = ({ title, value, icon, color = 'bg-white', subtitle }: { title: string; value: string | number; icon?: string; color?: string; subtitle?: string }) => (
  <div className={`${color} shadow-lg rounded-2xl p-5 border border-gray-100`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {icon && <span className="text-3xl">{icon}</span>}
    </div>
  </div>
);

const chartStyle = { background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb' };

export default function DashboardPage() {
  const settings = useStore((state) => state.settings);
  const theme = (settings.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;

  const products = useStore((state) => state.products);
  const orders = useStore((state) => state.orders);
  const reservas = useStore((state) => state.reservas);
  const reservasPos = useStore((state) => state.reservasPos);
  const clientes = useStore((state) => state.clientes);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const completedOrders = orders.filter(o => o.estado === 'completado');
    const pendingOrders = orders.filter(o => o.estado === 'pendiente');
    const abonadoOrders = orders.filter(o => o.estado === 'abonado');
    const canceledOrders = orders.filter(o => o.estado === 'cancelado');

    const ingresosTotales = completedOrders.reduce((s, o) => s + o.monto, 0);
    const ingresosHoy = completedOrders.filter(o => o.fecha === today).reduce((s, o) => s + o.monto, 0);
    const ingresosSemana = (() => {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return completedOrders.filter(o => o.fecha >= weekAgo).reduce((s, o) => s + o.monto, 0);
    })();
    const ingresosMes = completedOrders.filter(o => o.fecha >= monthStart).reduce((s, o) => s + o.monto, 0);

    const todayOrders = orders.filter(o => o.fecha === today);
    const todayReservas = reservas.filter(r => r.fecha_reserva?.startsWith(today));
    const todayReservasPos = reservasPos.filter(r => r.fecha === today);

    const nuevosClientesMes = clientes.filter(c => {
      const cDate = c.fecha_registro || '';
      return cDate >= monthStart;
    }).length;

    const reservasPendientes = reservas.filter(r => r.estado_reserva === 'pendiente' || r.estado_reserva === 'abonado');
    const reservasPosPendientes = reservasPos.filter(r => r.estado === 'pendiente' || r.estado === 'abonado');
    const totalSaldoReservas = reservasPendientes.reduce((s, r) => s + (r.saldo || 0), 0) + reservasPosPendientes.reduce((s, r) => s + (r.monto - (r.monto_pagado || 0)), 0);

    // Ventas por día (últimos 7 días)
    const ventasPorDia: Array<{ dia: string; fecha: string; ventas: number; ingresos: number; reservas: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const fecha = d.toISOString().split('T')[0];
      const dia = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const ventasDia = completedOrders.filter(o => o.fecha === fecha);
      const reservasDia = reservas.filter(r => r.fecha_reserva?.startsWith(fecha));
      ventasPorDia.push({
        dia: dia.charAt(0).toUpperCase() + dia.slice(1),
        fecha,
        ventas: ventasDia.length,
        ingresos: ventasDia.reduce((s, o) => s + o.monto, 0),
        reservas: reservasDia.length,
      });
    }

    // Distribución de pedidos
    const orderStatusDist = [
      { name: 'Completados', value: completedOrders.length, color: COLORS.green },
      { name: 'Abonados', value: abonadoOrders.length, color: COLORS.blue },
      { name: 'Pendientes', value: pendingOrders.length, color: COLORS.yellow },
      { name: 'Cancelados', value: canceledOrders.length, color: COLORS.red },
    ].filter(d => d.value > 0);

    // Estado de reservas (store + pos)
    const reservaStatusDist = [
      { name: 'Pendientes', value: reservas.filter(r => r.estado_reserva === 'pendiente').length + reservasPos.filter(r => r.estado === 'pendiente').length, color: COLORS.yellow },
      { name: 'Abonadas', value: reservas.filter(r => r.estado_reserva === 'abonado').length + reservasPos.filter(r => r.estado === 'abonado').length, color: COLORS.blue },
      { name: 'Confirmadas', value: reservas.filter(r => r.estado_reserva === 'confirmado').length, color: COLORS.green },
      { name: 'Completadas', value: reservasPos.filter(r => r.estado === 'completado').length, color: COLORS.purple },
      { name: 'Canceladas', value: reservas.filter(r => r.estado_reserva === 'cancelado').length + reservasPos.filter(r => r.estado === 'cancelado').length, color: COLORS.red },
    ].filter(d => d.value > 0);

    // Top productos más vendidos
    const productSales: Record<string, { name: string; cantidad: number; total: number }> = {};
    const processItems = (items: any[], pidField: string, pnameField: string, qtyField: string, priceField: string) => {
      items.forEach((item: any) => {
        const pid = item[pidField];
        if (!pid) return;
        if (!productSales[pid]) {
          productSales[pid] = { name: item[pnameField] || 'Producto', cantidad: 0, total: 0 };
        }
        productSales[pid].cantidad += item[qtyField] || 0;
        productSales[pid].total += (item[priceField] || 0) * (item[qtyField] || 0);
      });
    };
    [...orders, ...reservasPos].forEach(o => processItems(o.items || [], 'productId', 'productName', 'quantity', 'price'));
    reservas.forEach(r => processItems(r.items || [], 'producto_id', 'producto_nombre', 'cantidad', 'precio_unitario'));
    const topProductos = Object.values(productSales)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return {
      productos: {
        total: products.length,
        activos: products.filter(p => p.status === 'active').length,
        en_liquidacion: products.filter(p => p.en_liquidacion).length,
        stock_bajo: products.filter(p => p.stock > 0 && p.stock <= 5).length,
        sin_stock: products.filter(p => p.stock === 0).length,
        stock_total: products.reduce((sum, p) => sum + p.stock, 0),
      },
      pedidos: {
        total: orders.length,
        completados: completedOrders.length,
        pendientes: pendingOrders.length,
        abonados: abonadoOrders.length,
        cancelados: canceledOrders.length,
        ingresos_totales: ingresosTotales,
        ingresos_hoy: ingresosHoy,
        ingresos_semana: ingresosSemana,
        ingresos_mes: ingresosMes,
      },
      reservas: {
        total: reservas.length + reservasPos.length,
        pendientes: reservas.filter(r => r.estado_reserva === 'pendiente').length + reservasPos.filter(r => r.estado === 'pendiente').length,
        abonadas: reservas.filter(r => r.estado_reserva === 'abonado').length + reservasPos.filter(r => r.estado === 'abonado').length,
        completadas: reservasPos.filter(r => r.estado === 'completado').length,
        confirmadas: reservas.filter(r => r.estado_reserva === 'confirmado').length,
        total_saldo: totalSaldoReservas,
      },
      clientes: {
        total: clientes.length,
        nuevos_mes: nuevosClientesMes,
      },
      actividad_hoy: {
        ventas: todayOrders.filter(o => o.estado === 'completado').length,
        reservas_store: todayReservas.length,
        reservas_pos: todayReservasPos.length,
        clientes_nuevos: clientes.filter(c => {
      const cDate = c.fecha_registro || '';
      return cDate.startsWith(today);
        }).length,
      },
      ventasPorDia,
      orderStatusDist,
      reservaStatusDist,
      topProductos,
    };
  }, [orders, reservas, reservasPos, products, clientes]);

  const formatCurrency = (value: number) => `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const bgCard = 'bg-white';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu negocio en tiempo real</p>
      </div>

      {/* Stock Alerts */}
      {stats.productos.stock_bajo > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-yellow-800">Stock Bajo</p>
            <p className="text-sm text-yellow-600">
              {stats.productos.stock_bajo} productos con stock bajo ({stats.productos.sin_stock} sin stock)
            </p>
          </div>
        </div>
      )}

      {/* Actividad Hoy */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Actividad de Hoy</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Ventas" value={stats.actividad_hoy.ventas} icon="💵" color={bgCard} subtitle={`${formatCurrency(stats.pedidos.ingresos_hoy)}`} />
          <Card title="Reservas Tienda" value={stats.actividad_hoy.reservas_store} icon="📋" color={bgCard} />
          <Card title="Reservas POS" value={stats.actividad_hoy.reservas_pos} icon="📦" color={bgCard} />
          <Card title="Clientes Nuevos" value={stats.actividad_hoy.clientes_nuevos} icon="👤" color={bgCard} />
        </div>
      </div>

      {/* Ingresos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Ingresos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Hoy" value={formatCurrency(stats.pedidos.ingresos_hoy)} icon="💰" color="bg-green-50" />
          <Card title="Esta Semana" value={formatCurrency(stats.pedidos.ingresos_semana)} icon="📈" color="bg-blue-50" />
          <Card title="Este Mes" value={formatCurrency(stats.pedidos.ingresos_mes)} icon="📊" color="bg-purple-50" />
          <Card title="Total" value={formatCurrency(stats.pedidos.ingresos_totales)} icon="🏆" color="bg-yellow-50" />
        </div>
      </div>

      {/* Gráficos: Ventas diarias + Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart: Ventas por día */}
        <div style={chartStyle}>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Ventas & Reservas por Día</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => [value, name === 'ingresos' ? 'Ingresos' : name === 'ventas' ? 'Ventas' : 'Reservas']}
              />
              <Legend />
              <Bar dataKey="ventas" name="Ventas" fill={COLORS.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="reservas" name="Reservas" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: Distribución de pedidos */}
        <div style={chartStyle}>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado de Pedidos</h3>
          {stats.orderStatusDist.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Sin datos de pedidos</div>
          ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.orderStatusDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats.orderStatusDist.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por día (line chart) */}
        <div style={chartStyle}>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Ingresos Diarios</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
              />
              <Legend />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke={COLORS.green} strokeWidth={2} dot={{ fill: COLORS.green, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: Estado de reservas */}
        <div style={chartStyle}>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado de Reservas</h3>
          {stats.reservaStatusDist.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Sin datos de reservas</div>
          ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.reservaStatusDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats.reservaStatusDist.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Productos */}
      {stats.topProductos.length > 0 && (
        <div style={chartStyle}>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Productos Más Vendidos</h3>
          <div className="space-y-3">
            {stats.topProductos.map((p, idx) => {
              const maxCantidad = stats.topProductos[0].cantidad;
              const pct = maxCantidad > 0 ? (p.cantidad / maxCantidad) * 100 : 0;
              return (
                <div key={p.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <span className="text-sm text-gray-500">{p.cantidad} und · {formatCurrency(p.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid - Productos y Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-lg rounded-2xl p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Productos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-gray-900">{stats.productos.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Activos</span>
              <span className="font-bold text-green-600">{stats.productos.activos}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">En Liquidación</span>
              <span className="font-bold text-orange-600">{stats.productos.en_liquidacion}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Stock Total</span>
              <span className="font-bold text-gray-900">{stats.productos.stock_total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Clientes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-gray-900">{stats.clientes.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Nuevos este mes</span>
              <span className="font-bold text-blue-600">{stats.clientes.nuevos_mes}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Reservas activas</span>
              <span className="font-bold text-yellow-600">{stats.reservas.pendientes + stats.reservas.abonadas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Saldo pendiente</span>
              <span className="font-bold text-yellow-600">{formatCurrency(stats.reservas.total_saldo)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
