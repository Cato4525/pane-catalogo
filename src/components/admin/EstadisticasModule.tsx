import { useEffect } from 'react'
import { useAdminStore } from '../../store/adminStore'

interface EstadisticasModuleProps {
  themeColors?: {
    primary: string
    secondary: string
    surface: string
    background: string
    text: string
    textMuted: string
    border: string
    success: string
    warning: string
    error: string
  }
}

export default function EstadisticasModule({ themeColors }: EstadisticasModuleProps) {
  const tc = themeColors || {
    primary: '#4ade80',
    secondary: '#22d3ee',
    surface: '#0d0d14',
    background: '#0a0a0f',
    text: '#f1f5f9',
    textMuted: '#64748b',
    border: '#1e1e2e',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  const { stats, fetchStats, fetchConsultas, consultas } = useAdminStore()

  useEffect(() => {
    fetchStats()
    fetchConsultas()
  }, [])

  const statCards = [
    {
      label: 'Total Reservas',
      value: stats.totalReservas,
      color: tc.primary,
      icon: '📋',
    },
    {
      label: 'Pendientes',
      value: stats.reservasPendientes,
      color: tc.warning,
      icon: '⏳',
    },
    {
      label: 'Confirmadas',
      value: stats.reservasConfirmadas,
      color: tc.success,
      icon: '✅',
    },
    {
      label: 'Total Ingresos',
      value: `$${stats.totalIngresos.toFixed(2)}`,
      color: tc.secondary,
      icon: '💰',
    },
    {
      label: 'Total Abonos',
      value: `$${stats.totalAbonos.toFixed(2)}`,
      color: tc.primary,
      icon: '💵',
    },
  ]

  return (
    <div style={{ animation: 'fadeUp .4s ease' }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: tc.text, marginBottom: 20 }}>
        Estadísticas
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: tc.surface,
              border: `1px solid ${tc.border}`,
              borderRadius: 16,
              padding: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 80, height: 80,
              background: `radial-gradient(circle,${card.color}20 0%,transparent 70%)`,
              borderRadius: '50%',
            }} />
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <p style={{ fontSize: 11, color: tc.textMuted, margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 600 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: card.color, margin: 0 }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{
          background: tc.surface,
          border: `1px solid ${tc.border}`,
          borderRadius: 16,
          padding: 20,
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: tc.text, marginBottom: 16 }}>
            Productos más consultados
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.productosMasConsultados.length === 0 ? (
              <p style={{ color: tc.textMuted, textAlign: 'center', padding: 20 }}>
                No hay consultas registradas
              </p>
            ) : (
              stats.productosMasConsultados.map((item, idx) => {
                const maxCount = Math.max(...stats.productosMasConsultados.map(p => p.count))
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.producto_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: tc.text }}>
                        #{idx + 1} {item.producto_id.slice(0, 8)}
                      </span>
                      <span style={{ fontSize: 13, color: tc.primary, fontWeight: 600 }}>
                        {item.count} consultas
                      </span>
                    </div>
                    <div style={{ height: 6, background: tc.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: tc.primary,
                          borderRadius: 3,
                          transition: 'width .5s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div style={{
          background: tc.surface,
          border: `1px solid ${tc.border}`,
          borderRadius: 16,
          padding: 20,
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: tc.text, marginBottom: 16 }}>
            Consultas recientes
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {consultas.length === 0 ? (
              <p style={{ color: tc.textMuted, textAlign: 'center', padding: 20 }}>
                No hay consultas registradas
              </p>
            ) : (
              consultas.slice(0, 20).map((consulta) => (
                <div
                  key={consulta.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: tc.background,
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: tc.text, fontWeight: 500 }}>
                      {consulta.producto_nombre || consulta.producto_codigo || 'Producto'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: tc.textMuted }}>
                      {consulta.origen || 'catalogo'}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: tc.textMuted, fontFamily: "'DM Mono',monospace" }}>
                    {new Date(consulta.fecha).toLocaleDateString('es-EC')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 24,
        padding: 20,
        background: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: 16,
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: tc.text, marginBottom: 16 }}>
          Resumen financiero
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: tc.background, borderRadius: 12 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: tc.textMuted }}>Ingresos totales</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tc.success }}>
              ${stats.totalIngresos.toFixed(2)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: tc.background, borderRadius: 12 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: tc.textMuted }}>Abonos recibidos</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tc.warning }}>
              ${stats.totalAbonos.toFixed(2)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: tc.background, borderRadius: 12 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: tc.textMuted }}>Pendiente por cobrar</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tc.error }}>
              ${(stats.totalIngresos - stats.totalAbonos).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
