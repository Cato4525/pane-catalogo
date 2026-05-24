import { mockStats, mockActivities } from '../../services/mockData';

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: { id: string; type: string; message: string; timestamp: string } }) {
  const typeIcons: Record<string, string> = {
    order: '🛒',
    product: '🍞',
    category: '📁',
  };

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Hace pocos minutos';
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${Math.floor(hours / 24)} días`;
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(100,116,139,0.2)' }}>
        {typeIcons[activity.type]}
      </div>
      <div className="flex-1">
        <p className="text-sm" style={{ color: 'var(--text)' }}>{activity.message}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Resumen de tu tienda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={`$${mockStats.totalSales.toLocaleString('es-MX')}`}
          icon="💰"
          color="bg-green-100"
        />
        <StatCard
          title="Total Productos"
          value={mockStats.totalProducts}
          icon="🍞"
          color="bg-blue-100"
        />
        <StatCard
          title="Categorías"
          value={mockStats.totalCategories}
          icon="📁"
          color="bg-purple-100"
        />
        <StatCard
          title="Pedidos Recientes"
          value={mockStats.recentOrders}
          icon="🛒"
          color="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Actividad Reciente</h3>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {mockActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Resumen Rápido</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(100,116,139,0.1)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Productos Activos</span>
              <span className="font-semibold" style={{ color: '#4ade80' }}>8</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(100,116,139,0.1)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Productos Inactivos</span>
              <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>0</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(100,116,139,0.1)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Categorías Activas</span>
              <span className="font-semibold" style={{ color: '#4ade80' }}>4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
