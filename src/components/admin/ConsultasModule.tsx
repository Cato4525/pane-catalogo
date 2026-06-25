import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { useAdminStore } from '../../store/adminStore'

interface ConsultasModuleProps {
  themeColors?: {
    primary: string
    surface: string
    background: string
    text: string
    textMuted: string
    border: string
    success: string
    warning: string
    error: string
  }
  isEjecutivo?: boolean
}

export default function ConsultasModule({ themeColors, isEjecutivo }: ConsultasModuleProps) {
  const storeProducts = useStore(state => state.products)
  
  const consultas = useAdminStore(state => state.consultas)
  const consultasLoading = useAdminStore(state => state.consultasLoading)
  const consultasHasMore = useAdminStore(state => state.consultasHasMore)
  const fetchConsultas = useAdminStore(state => state.fetchConsultas)

  const tc = themeColors || {
    primary: '#4ade80',
    surface: '#0d0d14',
    background: '#0a0a0f',
    text: '#f1f5f9',
    textMuted: '#64748b',
    border: '#1e1e2e',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  const [filtroOrigen, setFiltroOrigen] = useState<string>('todos')
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<any | null>(null)

  useEffect(() => {
    fetchConsultas(true)
  }, [fetchConsultas])

  const consultasFiltradas = filtroOrigen === 'todos'
    ? consultas
    : consultas.filter(c => c.origen === filtroOrigen)

  const productosConsultados = consultasFiltradas.reduce((acc: Record<string, { count: number; codigo: string; nombre: string }>, c) => {
    const producto = storeProducts.find(p => p.id === c.product_id)
    if (!acc[c.product_id]) {
      acc[c.product_id] = {
        count: 0,
        codigo: producto?.codigo || c.producto_codigo || c.product_id,
        nombre: producto?.name || c.producto_nombre || 'Producto #' + c.product_id
      }
    }
    acc[c.product_id].count++
    return acc
  }, {})

  const topProductos = Object.entries(productosConsultados)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)

  return (
    <div style={{ animation: 'fadeUp .4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: tc.text }}>Consultas de Productos</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['todos', 'whatsapp', 'tienda', 'promocion'].map(origen => (
            <button
              key={origen}
              onClick={() => setFiltroOrigen(origen)}
              style={{
                padding: '6px 12px',
                background: filtroOrigen === origen ? (isEjecutivo ? '#fbbf24' : tc.primary) : (isEjecutivo ? '#000000' : 'transparent'),
                border: `1px solid ${filtroOrigen === origen ? (isEjecutivo ? '#fbbf24' : tc.primary) : tc.border}`,
                borderRadius: 8,
                color: filtroOrigen === origen ? (isEjecutivo ? '#000000' : '#000') : (isEjecutivo ? '#ffffff' : tc.textMuted),
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {origen === 'todos' ? 'Todos' : origen}
            </button>
          ))}
        </div>
      </div>

      <div className="consultas-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 16, padding: 16 }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>Productos más consultados</h4>
          {topProductos.length === 0 ? (
            <p style={{ color: tc.textMuted, textAlign: 'center', padding: 20 }}>Sin consultas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topProductos.slice(0, 8).map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: tc.background, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: idx === 0 ? tc.warning : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: idx < 3 ? '#000' : tc.textMuted }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, color: tc.text, fontWeight: 500 }}>{item.nombre}</div>
                      <div style={{ fontSize: 10, color: tc.textMuted, fontFamily: "'DM Mono',monospace" }}>{item.codigo}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: tc.primary }}>{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 16, padding: 16 }}>
          <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>Estadísticas</h4>
          <div className="consultas-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: tc.background, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: tc.text, margin: 0 }}>{consultasFiltradas.length}</p>
              <p style={{ fontSize: 10, color: tc.textMuted, margin: '4px 0 0' }}>Total consultas</p>
            </div>
            <div style={{ background: tc.background, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#25D366', margin: 0 }}>{consultasFiltradas.filter(c => c.origen === 'whatsapp').length}</p>
              <p style={{ fontSize: 10, color: tc.textMuted, margin: '4px 0 0' }}>WhatsApp</p>
            </div>
            <div style={{ background: tc.background, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#22d3ee', margin: 0 }}>{consultasFiltradas.filter(c => c.origen === 'tienda').length}</p>
              <p style={{ fontSize: 10, color: tc.textMuted, margin: '4px 0 0' }}>Tienda</p>
            </div>
            <div style={{ background: tc.background, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#a855f7', margin: 0 }}>{consultasFiltradas.filter(c => c.origen === 'promocion').length}</p>
              <p style={{ fontSize: 10, color: tc.textMuted, margin: '4px 0 0' }}>Promoción</p>
            </div>
            <div style={{ background: tc.background, borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: tc.primary, margin: 0 }}>{topProductos.length}</p>
              <p style={{ fontSize: 10, color: tc.textMuted, margin: '4px 0 0' }}>Productos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="consultas-table-wrapper" style={{
        background: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {consultasFiltradas.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: tc.textMuted }}>
            No hay consultas registradas
          </div>
        ) : (
          <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tc.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Producto</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Contacto</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Mensaje</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Origen</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {consultasFiltradas.map(consulta => {
                const producto = storeProducts.find(p => p.id === consulta.product_id)
                return (
                  <tr
                    key={consulta.id}
                    style={{ borderBottom: `1px solid ${tc.border}`, cursor: 'pointer' }}
                    onClick={() => setConsultaSeleccionada(consulta)}
                  >
                    <td data-label="Producto" style={{ padding: '12px 16px', fontSize: 13, color: tc.text }}>
                      <div style={{ fontWeight: 600 }}>{producto?.name || consulta.producto_nombre || 'Producto #' + consulta.product_id}</div>
                      <div style={{ fontSize: 10, color: tc.textMuted, fontFamily: "'DM Mono',monospace" }}>{producto?.codigo || consulta.producto_codigo || ''}</div>
                    </td>
                    <td data-label="Cliente" style={{ padding: '12px 16px', fontSize: 12, color: tc.text }}>
                      <div>{consulta.cliente_nombre || '-'}</div>
                    </td>
                    <td data-label="Contacto" style={{ padding: '12px 16px', fontSize: 11, color: tc.textMuted }}>
                      {consulta.cliente_telefono && <div>{consulta.cliente_telefono}</div>}
                      {consulta.cliente_email && <div style={{ fontSize: 10 }}>{consulta.cliente_email}</div>}
                      {!consulta.cliente_telefono && !consulta.cliente_email && <span>-</span>}
                    </td>
                    <td data-label="Mensaje" style={{ padding: '12px 16px', fontSize: 11, color: tc.textMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {consulta.mensaje || '-'}
                    </td>
                    <td data-label="Origen" style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        background: (consulta.origen === 'whatsapp' ? '#25D366' : '#22d3ee') + '22',
                        color: consulta.origen === 'whatsapp' ? '#25D366' : '#22d3ee',
                      }}>
                        {consulta.origen?.toUpperCase() || 'TIENDA'}
                      </span>
                    </td>
                    <td data-label="Fecha" style={{ padding: '12px 16px', fontSize: 11, color: tc.textMuted, fontFamily: "'DM Mono',monospace" }}>
                      {consulta.created_at ? new Date(consulta.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

      {/* Modal de detalle */}
      {consultaSeleccionada && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setConsultaSeleccionada(null)}>
          <div style={{
            background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 16, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tc.text }}>Detalle de Consulta</h3>
              <button onClick={() => setConsultaSeleccionada(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: tc.textMuted }}>×</button>
            </div>

            {/* Producto */}
            <div style={{ marginBottom: 16, padding: 16, background: tc.background, borderRadius: 12 }}>
              <p style={{ fontSize: 10, color: tc.primary, margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Producto consultado</p>
              {(() => {
                const prod = storeProducts.find(p => p.id === consultaSeleccionada.product_id)
                return (
                  <>
                    {prod?.images?.[0] && (
                      <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', maxHeight: 180 }}>
                        <img src={prod.images[0]} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                    <p style={{ fontSize: 14, fontWeight: 600, color: tc.text, margin: 0 }}>
                      {prod?.name || consultaSeleccionada.producto_nombre || 'Producto #' + consultaSeleccionada.product_id}
                    </p>
                    <p style={{ fontSize: 11, color: tc.textMuted, margin: '4px 0 0', fontFamily: "'DM Mono',monospace" }}>
                      ID: {consultaSeleccionada.product_id}
                      {prod?.codigo && ` | Código: ${prod.codigo}`}
                    </p>
                  </>
                )
              })()}
            </div>

            {/* Cliente */}
            <div style={{ marginBottom: 16, padding: 16, background: tc.background, borderRadius: 12 }}>
              <p style={{ fontSize: 10, color: tc.primary, margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Datos del cliente</p>
              {consultaSeleccionada.cliente_nombre && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: tc.textMuted }}>Nombre</span>
                  <span style={{ fontSize: 13, color: tc.text, fontWeight: 500 }}>{consultaSeleccionada.cliente_nombre}</span>
                </div>
              )}
              {consultaSeleccionada.cliente_telefono && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: tc.textMuted }}>Teléfono</span>
                  <a href={`https://wa.me/${consultaSeleccionada.cliente_telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#25D366', fontWeight: 500, textDecoration: 'none' }}>
                    {consultaSeleccionada.cliente_telefono}
                  </a>
                </div>
              )}
              {consultaSeleccionada.cliente_email && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: tc.textMuted }}>Email</span>
                  <a href={`mailto:${consultaSeleccionada.cliente_email}`} style={{ fontSize: 13, color: '#22d3ee', fontWeight: 500, textDecoration: 'none' }}>
                    {consultaSeleccionada.cliente_email}
                  </a>
                </div>
              )}
              {!consultaSeleccionada.cliente_nombre && !consultaSeleccionada.cliente_telefono && !consultaSeleccionada.cliente_email && (
                <p style={{ fontSize: 12, color: tc.textMuted, margin: 0 }}>Sin datos del cliente</p>
              )}
            </div>

            {/* Mensaje */}
            {consultaSeleccionada.mensaje && (
              <div style={{ marginBottom: 16, padding: 16, background: tc.background, borderRadius: 12 }}>
                <p style={{ fontSize: 10, color: tc.primary, margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Mensaje</p>
                <p style={{ fontSize: 13, color: tc.text, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{consultaSeleccionada.mensaje}</p>
              </div>
            )}

            {/* Meta */}
            <div style={{ marginBottom: 16, padding: 16, background: tc.background, borderRadius: 12 }}>
              <p style={{ fontSize: 10, color: tc.primary, margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Información</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: tc.textMuted }}>Origen</span>
                <span style={{ fontSize: 13, color: tc.text, textTransform: 'capitalize' }}>{consultaSeleccionada.origen || 'Tienda'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: tc.textMuted }}>Fecha</span>
                <span style={{ fontSize: 13, color: tc.text }}>{consultaSeleccionada.created_at ? new Date(consultaSeleccionada.created_at).toLocaleString('es-EC') : '-'}</span>
              </div>
            </div>

            <button
              onClick={() => setConsultaSeleccionada(null)}
              style={{ width: '100%', padding: 12, background: isEjecutivo ? '#000000' : tc.primary, border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 600, cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      </div>

      {consultas.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16, gap: 8 }}>
          <button
            onClick={() => fetchConsultas()}
            disabled={consultasLoading || !consultasHasMore}
            style={{
              padding: '8px 16px',
              background: isEjecutivo ? '#000000' : 'transparent',
              border: `1px solid ${tc.border}`,
              borderRadius: 8,
              color: isEjecutivo ? '#ffffff' : tc.textMuted,
              cursor: consultasLoading ? 'not-allowed' : 'pointer',
              opacity: consultasLoading ? 0.5 : 1,
            }}
          >
            {consultasLoading ? 'Cargando...' : consultasHasMore ? 'Cargar más' : 'No hay más'}
          </button>
        </div>
      )}
    </div>
  )
}
