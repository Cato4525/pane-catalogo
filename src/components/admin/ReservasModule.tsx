import { useState } from 'react'
import { useStore } from '../../store'
import { EstadoReserva, Reserva } from '../../types'
import { useAdminStore } from '../../store/adminStore'

interface ReservasModuleProps {
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
  reservas?: Reserva[]
  onUpdateReserva?: (id: string, data: Partial<Reserva>) => void
  onDeleteReserva?: (id: string) => void
}

export default function ReservasModule({ themeColors, isEjecutivo, reservas: propReservas, onUpdateReserva, onDeleteReserva }: ReservasModuleProps) {
  const storeReservas = useStore(state => state.reservas)
  const storeProducts = useStore(state => state.products)
  const storeUpdateReserva = useStore(state => state.updateReserva)
  const storeDeleteReserva = useStore(state => state.deleteReserva)
  
  const reservas = propReservas || storeReservas
  const updateReserva = onUpdateReserva || storeUpdateReserva
  const deleteReserva = onDeleteReserva || storeDeleteReserva

  const reservaHasMore = useAdminStore(state => state.reservaHasMore)
  const reservaLoading = useAdminStore(state => state.reservaLoading)
  const fetchReservas = useAdminStore(state => state.fetchReservas)
  
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

  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | 'todos' | 'enviadas'>('todos')
  const [filtroComprobante, setFiltroComprobante] = useState<'todos' | 'con' | 'sin'>('todos')
  const [filtroOrigen, setFiltroOrigen] = useState<string>('todos')
  const [reservaDetalle, setReservaDetalle] = useState<any | null>(null)
  const [modalAbono, setModalAbono] = useState<{reserva: any; monto: string; notas: string; imagen: File | null; preview: string | null} | null>(null)
  const [guardandoAbono, setGuardandoAbono] = useState(false)

  const filteredReservas = reservas.filter(r => {
    const matchEstado = filtroEstado === 'todos' 
      ? true 
      : filtroEstado === 'enviadas' 
        ? (r.notas_admin && r.notas_admin.trim().length > 0)
        : r.estado_reserva === filtroEstado
    const matchComprobante = filtroComprobante === 'todos' 
      ? true 
      : filtroComprobante === 'con' 
        ? !!r.comprobante_url 
        : !r.comprobante_url
    const matchOrigen = filtroOrigen === 'todos' ? true : r.origen === filtroOrigen
    return matchEstado && matchComprobante && matchOrigen
  })

  const handleVerDetalle = (reserva: any) => {
    setReservaDetalle(reserva)
  }

  const handleActualizarEstado = (id: string, nuevoEstado: EstadoReserva) => {
    updateReserva(id, { estado_reserva: nuevoEstado })
  }

  const handleToggleCheck = (id: string, field: 'whatsapp_revisado' | 'comprobante_verificado' | 'abono_confirmado') => {
    const reserva = reservas.find(r => r.id === id)
    if (!reserva) return
    updateReserva(id, { [field]: !reserva[field] })
  }

    const handleGuardarAbono = async () => {
      if (!modalAbono || !modalAbono.monto) return
      setGuardandoAbono(true)
      
      try {
        let comprobanteUrl = modalAbono.reserva.comprobante_url || ''
        if (modalAbono.imagen) {
          const reader = new FileReader()
          comprobanteUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(modalAbono.imagen!)
          })
        }
        
        const monto = parseFloat(modalAbono.monto)
        const saldoPendiente = modalAbono.reserva.total - modalAbono.reserva.abono
        const esPagoFinal = monto >= saldoPendiente
        
        // Validar mínimo de abono
        const abonoMinimo = modalAbono.reserva.total >= 40 
          ? modalAbono.reserva.total * 0.2 
          : 5
        
        if (monto < abonoMinimo) {
          alert(`El abono mínimo es $${abonoMinimo.toFixed(2)}`)
          setGuardandoAbono(false)
          return
        }
        
        if (esPagoFinal) {
          await updateReserva(modalAbono.reserva.id, {
            abono: modalAbono.reserva.abono + monto,
            saldo: 0,
            estado_reserva: 'confirmado',
            comprobante_url: comprobanteUrl || undefined,
            comprobante_verificado: !!comprobanteUrl,
          })
        } else {
          await updateReserva(modalAbono.reserva.id, {
            abono: modalAbono.reserva.abono + monto,
            saldo: saldoPendiente - monto,
            comprobante_url: comprobanteUrl || undefined,
            comprobante_verificado: !!comprobanteUrl,
          })
        }
        
        setModalAbono(null)
        setReservaDetalle(null)
        alert(esPagoFinal ? '¡Reserva completada!' : 'Abono agregado')
      } catch (err) {
        console.error('Error guardando abono:', err)
        alert('Error al guardar el abono')
      } finally {
        setGuardandoAbono(false)
      }
    }

  const getEstadoColor = (estado: EstadoReserva) => {
    switch (estado) {
      case 'pendiente': return '#f59e0b'
      case 'abonado': return '#22d3ee'
      case 'confirmado': return tc.success
      case 'cancelado': return tc.error
      case 'expirado': return tc.textMuted
      default: return tc.textMuted
    }
  }

  return (
    <div style={{ animation: 'fadeUp .4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: tc.text }}>Reservas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: tc.textMuted, alignSelf: 'center' }}>Estado:</span>
            {(['todos', 'enviadas', 'pendiente', 'abonado', 'confirmado', 'cancelado'] as const).map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                style={{
                  padding: '4px 10px',
                  background: filtroEstado === estado ? tc.primary : 'transparent',
                  border: `1px solid ${filtroEstado === estado ? tc.primary : tc.border}`,
                  borderRadius: 6,
                  color: filtroEstado === estado ? '#000' : tc.textMuted,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {estado === 'todos' ? 'Todos' : estado.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: tc.textMuted, alignSelf: 'center' }}>Comprob.:</span>
            <button
              onClick={() => setFiltroComprobante('todos')}
              style={{
                padding: '4px 10px',
                background: filtroComprobante === 'todos' ? tc.primary : 'transparent',
                border: `1px solid ${filtroComprobante === 'todos' ? tc.primary : tc.border}`,
                borderRadius: 6,
                color: filtroComprobante === 'todos' ? '#000' : tc.textMuted,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroComprobante('con')}
              style={{
                padding: '4px 10px',
                background: filtroComprobante === 'con' ? tc.success : 'transparent',
                border: `1px solid ${filtroComprobante === 'con' ? tc.success : tc.border}`,
                borderRadius: 6,
                color: filtroComprobante === 'con' ? '#000' : tc.success,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📎 Con comprobante
            </button>
            <button
              onClick={() => setFiltroComprobante('sin')}
              style={{
                padding: '4px 10px',
                background: filtroComprobante === 'sin' ? tc.warning : 'transparent',
                border: `1px solid ${filtroComprobante === 'sin' ? tc.warning : tc.border}`,
                borderRadius: 6,
                color: filtroComprobante === 'sin' ? '#000' : tc.warning,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⚠️ Sin comprobante
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: tc.textMuted, alignSelf: 'center' }}>Origen:</span>
            {['todos', 'store', 'pos', 'promocion', 'tienda'].map(origen => (
              <button
                key={origen}
                onClick={() => setFiltroOrigen(origen)}
                style={{
                  padding: '4px 10px',
                  background: filtroOrigen === origen ? tc.primary : 'transparent',
                  border: `1px solid ${filtroOrigen === origen ? tc.primary : tc.border}`,
                  borderRadius: 6,
                  color: filtroOrigen === origen ? '#000' : tc.textMuted,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {origen === 'todos' ? 'Todos' : origen === 'promocion' ? 'Promoción' : origen}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {filteredReservas.length > 0 && (
        <div style={{ fontSize: 11, color: tc.textMuted, marginBottom: 12 }}>
          Mostrando {filteredReservas.length} de {reservas.length} reservas
        </div>
      )}

      <div className="consultas-table-wrapper" style={{
        background: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <table className="consultas-table table-mobile-card" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${tc.border}` }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Abono</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Saldo</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Estado</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Envío</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Comprob.</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Checks</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 10, color: tc.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservas.map(reserva => (
              <tr key={reserva.id} style={{ borderBottom: `1px solid ${tc.border}` }}>
                <td data-label="Cliente" style={{ padding: '12px 16px', fontSize: 13, color: tc.text }}>
                  <div style={{ fontWeight: 600 }}>{reserva.cliente_nombre || 'Sin nombre'}</div>
                  <div style={{ fontSize: 11, color: tc.textMuted }}>{reserva.cliente_telefono || 'Sin teléfono'}</div>
                </td>
                <td data-label="Total" style={{ padding: '12px 16px', fontSize: 13, color: tc.text, fontFamily: "'DM Mono',monospace" }}>
                  ${reserva.total?.toFixed(2) || '0.00'}
                </td>
                <td data-label="Abono" style={{ padding: '12px 16px', fontSize: 13, color: tc.success, fontFamily: "'DM Mono',monospace" }}>
                  ${reserva.abono?.toFixed(2) || '0.00'}
                </td>
                <td data-label="Saldo" style={{ padding: '12px 16px', fontSize: 13, color: reserva.saldo > 0 ? tc.error : tc.success, fontFamily: "'DM Mono',monospace" }}>
                  ${reserva.saldo?.toFixed(2) || '0.00'}
                </td>
                <td data-label="Estado" style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    background: getEstadoColor(reserva.estado_reserva) + '22',
                    color: getEstadoColor(reserva.estado_reserva),
                  }}>
                    {reserva.estado_reserva?.replace('_', ' ').toUpperCase() || 'SIN ESTADO'}
                  </span>
                </td>
                <td data-label="Envío" style={{ padding: '12px 16px', textAlign: 'center', fontSize: 16 }}>
                  {reserva.notas_admin && reserva.notas_admin.trim() ? (
                    <span title={reserva.notas_admin} style={{ cursor: 'help' }}>✅</span>
                  ) : (
                    <span style={{ color: tc.textMuted, fontSize: 12 }}>❌</span>
                  )}
                </td>
                <td data-label="Comprob." style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {reserva.comprobante_url ? (
                    <a 
                      href={reserva.comprobante_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: tc.success, fontSize: 16 }}
                      title="Ver comprobante"
                    >
                      📎
                    </a>
                  ) : (
                    <span style={{ color: tc.warning, fontSize: 16 }} title="Sin comprobante">⚠️</span>
                  )}
                </td>
                <td data-label="Checks" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button
                      onClick={() => handleToggleCheck(reserva.id, 'whatsapp_revisado')}
                      title="WhatsApp revisado"
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: reserva.whatsapp_revisado ? tc.success : 'transparent',
                        border: `1px solid ${reserva.whatsapp_revisado ? tc.success : tc.border}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {reserva.whatsapp_revisado && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
                    </button>
                    <button
                      onClick={() => handleToggleCheck(reserva.id, 'comprobante_verificado')}
                      title="Comprobante verificado"
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: reserva.comprobante_verificado ? tc.success : 'transparent',
                        border: `1px solid ${reserva.comprobante_verificado ? tc.success : tc.border}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {reserva.comprobante_verificado && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
                    </button>
                    <button
                      onClick={() => handleToggleCheck(reserva.id, 'abono_confirmado')}
                      title="Abono confirmado"
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: reserva.abono_confirmado ? tc.success : 'transparent',
                        border: `1px solid ${reserva.abono_confirmado ? tc.success : tc.border}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {reserva.abono_confirmado && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
                    </button>
                  </div>
                </td>
                <td data-label="Acciones" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleVerDetalle(reserva)}
                      style={{
                        padding: '4px 8px', background: isEjecutivo ? '#000000' : 'transparent', border: `1px solid ${tc.border}`,
                        borderRadius: 6, color: isEjecutivo ? '#ffffff' : tc.textMuted, cursor: 'pointer', fontSize: 12,
                      }}
                      title="Ver detalle"
                    >
                      👁
                    </button>
                    
                    {reserva.estado_reserva === 'pendiente' && (
                      <>
                        <button
                          onClick={() => {
                            handleActualizarEstado(reserva.id, 'abonado');
                            handleToggleCheck(reserva.id, 'abono_confirmado');
                          }}
                          style={{
                            padding: '4px 8px', background: tc.success + '33', border: 'none',
                            borderRadius: 6, color: tc.success, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          }}
                          title="Marcar como pagada (completada)"
                        >
                          💰 Pagado
                        </button>
                        <button
                          onClick={() => {
                            if (reserva.cliente_telefono) {
                              const msg = encodeURIComponent(`Hola ${reserva.cliente_nombre}! 👋\n\nEstamos verificando tu reserva *#${reserva.id}*.\n\n📋 *Resumen:*\n• Total: $${reserva.total?.toFixed(2)}\n• Abono pendiente: $${reserva.abono?.toFixed(2)}\n\nPor favor envía tu comprobante de pago para confirmar tu reserva.\n\n¿Ya realizaste el pago? Envíanos el comprobante y completamos tu reserva! ✅`);
                              window.open(`https://wa.me/${reserva.cliente_telefono.replace(/\D/g, '')}?text=${msg}`, '_blank');
                            }
                          }}
                          style={{
                            padding: '4px 8px', background: '#25D36633', border: 'none',
                            borderRadius: 6, color: '#25D366', cursor: 'pointer', fontSize: 12,
                          }}
                          title="Contactar por WhatsApp"
                        >
                          📱
                        </button>
                      </>
                    )}
                    
                    {reserva.estado_reserva === 'abonado' && (
                      <button
                        onClick={() => handleActualizarEstado(reserva.id, 'confirmado')}
                        style={{
                          padding: '4px 8px', background: isEjecutivo ? '#fbbf24' : tc.success + '22', border: 'none',
                          borderRadius: 6, color: tc.success, cursor: 'pointer', fontSize: 12,
                        }}
                        title="Completar reserva"
                      >
                        ✓
                      </button>
                    )}
                    
                    {(reserva.estado_reserva === 'pendiente' || reserva.estado_reserva === 'abonado') && (
                      <button
                        onClick={() => {
                          if (confirm('¿Cancelar esta reserva?')) handleActualizarEstado(reserva.id, 'cancelado')
                        }}
                        style={{
                          padding: '4px 8px', background: 'transparent', border: `1px solid ${tc.error}33`,
                          borderRadius: 6, color: tc.error, cursor: 'pointer', fontSize: 12,
                        }}
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
                <td data-label="Fecha" style={{ padding: '12px 16px', fontSize: 11, color: tc.textMuted, fontFamily: "'DM Mono',monospace" }}>
                  {reserva.fecha_reserva ? new Date(reserva.fecha_reserva).toLocaleDateString('es-EC') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reservas.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16, gap: 8 }}>
          <button
            onClick={() => fetchReservas(true)}
            disabled={reservaLoading}
            style={{
              padding: '8px 16px',
              background: isEjecutivo ? '#000000' : 'transparent',
              border: `1px solid ${tc.border}`,
              borderRadius: 8,
              color: isEjecutivo ? '#ffffff' : tc.textMuted,
              cursor: reservaLoading ? 'not-allowed' : 'pointer',
              opacity: reservaLoading ? 0.5 : 1,
            }}
          >
            {reservaLoading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}

      {reservaDetalle && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        }}
        onClick={() => setReservaDetalle(null)}
        >
          <div style={{
            background: tc.surface, borderRadius: 20, padding: 24, width: '90%', maxWidth: 600,
            maxHeight: '85vh', overflow: 'auto', border: `1px solid ${tc.border}`,
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: tc.text, margin: 0 }}>
                Reserva {reservaDetalle.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setReservaDetalle(null)}
                style={{ background: isEjecutivo ? '#000000' : 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: isEjecutivo ? '#ffffff' : tc.textMuted }}
              >
                ✕
              </button>
            </div>

            <>
              <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Cliente</h4>
                  <p style={{ margin: 0, color: tc.text, fontWeight: 600 }}>{reservaDetalle.cliente_nombre}</p>
                  <p style={{ margin: '4px 0 0', color: tc.textMuted, fontSize: 13 }}>{reservaDetalle.cliente_telefono}</p>
                  {reservaDetalle.cliente_cedula && (
                    <p style={{ margin: '4px 0 0', color: tc.textMuted, fontSize: 13 }}>Cédula: {reservaDetalle.cliente_cedula}</p>
                  )}
                  {reservaDetalle.cliente_email && (
                    <p style={{ margin: '4px 0 0', color: tc.textMuted, fontSize: 13 }}>Email: {reservaDetalle.cliente_email}</p>
                  )}
                  {reservaDetalle.cliente_ciudad && (
                    <p style={{ margin: '4px 0 0', color: tc.textMuted, fontSize: 13 }}>Ciudad: {reservaDetalle.cliente_ciudad}</p>
                  )}
                  {reservaDetalle.cliente_direccion && (
                    <p style={{ margin: '4px 0 0', color: tc.textMuted, fontSize: 13 }}>Dirección: {reservaDetalle.cliente_direccion}</p>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Productos</h4>
                  {reservaDetalle.items?.map((item: any) => {
                    const prodItem = storeProducts.find((p: any) => p.id === item.producto_id)
                    return (
                      <div key={item.id} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                        borderBottom: `1px solid ${tc.border}`, alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {prodItem?.images?.[0] && (
                            <img src={prodItem.images[0]} alt={item.producto_nombre}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div>
                            <span style={{ color: tc.text }}>{item.producto_nombre}</span>
                            <span style={{ color: tc.textMuted, fontSize: 12, marginLeft: 8 }}>
                              x{item.cantidad} - ${item.precio_unitario?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <span style={{ color: tc.text, fontFamily: "'DM Mono',monospace" }}>
                          ${item.subtotal?.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {reservaDetalle.comprobante_url && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Comprobante</h4>
                    <a
                      href={reservaDetalle.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block', padding: 12, background: tc.background,
                        borderRadius: 12, textAlign: 'center', color: tc.primary,
                      }}
                    >
                      Ver comprobante 📎
                    </a>
                  </div>
                )}

                {reservaDetalle.notas_admin && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Notas</h4>
                    <p style={{ margin: 0, color: tc.text, fontSize: 13 }}>{reservaDetalle.notas_admin}</p>
                  </div>
                )}

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                  padding: 16, background: tc.background, borderRadius: 12,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: tc.textMuted }}>Total</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tc.text }}>
                      ${reservaDetalle.total?.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: tc.textMuted }}>Abonado</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tc.success }}>
                      ${reservaDetalle.abono?.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: tc.textMuted }}>Saldo</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: reservaDetalle.saldo > 0 ? tc.error : tc.success }}>
                      ${reservaDetalle.saldo?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {reservaDetalle.abonos && reservaDetalle.abonos.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ fontSize: 12, color: tc.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Historial de Abonos</h4>
                    {reservaDetalle.abonos.map((abono: any, idx: number) => (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0', borderBottom: `1px solid ${tc.border}`,
                      }}>
                        <div>
                          <span style={{ color: tc.text, fontSize: 13 }}>
                            ${abono.monto?.toFixed(2)} {abono.tipo === 'final' && '✓'}
                          </span>
                          <span style={{ color: tc.textMuted, fontSize: 11, marginLeft: 8 }}>
                            {new Date(abono.fecha).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        {abono.comprobante_url && (
                          <a href={abono.comprobante_url} target="_blank" rel="noopener noreferrer" style={{ color: tc.primary, fontSize: 12 }}>
                            📎 Ver
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {reservaDetalle.estado_reserva !== 'confirmado' && reservaDetalle.estado_reserva !== 'cancelado' && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={() => setModalAbono({ reserva: reservaDetalle, monto: '', notas: '', imagen: null, preview: null })}
                      style={{
                        padding: 12, background: tc.primary, border: 'none',
                        borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      💰 Agregar Abono
                    </button>
                    
                    {reservaDetalle.saldo > 0 && (
                      <button
                        onClick={async () => {
                          const saldo = reservaDetalle.saldo
                          if (confirm(`¿Marcar como PAGADO TOTAL?\nTotal: $${reservaDetalle.total}\nYa pagado: $${reservaDetalle.abono}\nFalta: $${saldo}`)) {
                            await updateReserva(reservaDetalle.id, {
                              abono: reservaDetalle.total,
                              saldo: 0,
                              estado_reserva: 'confirmado',
                            })
                            setReservaDetalle(null)
                            alert('¡Reserva completada!')
                          }
                        }}
                        style={{
                          padding: 12, background: '#22c55e', border: 'none',
                          borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ✅ Marcar como Pagado Total
                      </button>
                    )}

                    {reservaDetalle.estado_reserva === 'pendiente' && (
                      <button
                        onClick={() => {
                          if (confirm('¿Cancelar esta reserva?')) {
                            handleActualizarEstado(reservaDetalle.id, 'cancelado')
                            setReservaDetalle(null)
                          }
                        }}
                        style={{
                          padding: 12, background: 'transparent', border: `1px solid ${tc.error}`,
                          borderRadius: 8, color: tc.error, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ❌ Cancelar Reserva
                      </button>
                    )}
                  </div>
                )}
              </>
          </div>
        </div>
      )}

      {modalAbono && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        }}
        onClick={() => setModalAbono(null)}
        >
          <div style={{
            background: tc.surface, borderRadius: 20, padding: 24, width: '90%', maxWidth: 400,
            maxHeight: '80vh', overflow: 'auto', border: `1px solid ${tc.border}`,
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: tc.text, margin: 0 }}>
                💰 Agregar Abono
              </h3>
              <button
                onClick={() => setModalAbono(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: tc.textMuted }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: tc.textMuted, marginBottom: 16 }}>
              Reserva: <strong>#{modalAbono.reserva.id?.slice(-6)}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div style={{ padding: 12, background: tc.background, borderRadius: 8, textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: tc.textMuted, margin: 0 }}>Total</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: tc.text, margin: 0 }}>${modalAbono.reserva.total?.toFixed(2)}</p>
              </div>
              <div style={{ padding: 12, background: tc.background, borderRadius: 8, textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: tc.textMuted, margin: 0 }}>Ya abonado</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: tc.success, margin: 0 }}>${modalAbono.reserva.abono?.toFixed(2)}</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: tc.textMuted, display: 'block', marginBottom: 6 }}>MONTO DEL ABONO</label>
              <input
                type="number"
                value={modalAbono.monto}
                onChange={(e) => setModalAbono({ ...modalAbono, monto: e.target.value })}
                placeholder={`Mínimo: $${(modalAbono.reserva.total >= 40 ? (modalAbono.reserva.total * 0.2).toFixed(2) : '5.00')}`}
                style={{
                  width: '100%', padding: 12, background: tc.background, border: `1px solid ${tc.border}`,
                  borderRadius: 8, color: tc.text, fontSize: 14,
                }}
              />
              <p style={{ fontSize: 11, color: tc.success, marginTop: 4 }}>
                Saldo pendiente: ${modalAbono.reserva.saldo?.toFixed(2)}
              </p>
              <p style={{ fontSize: 10, color: tc.textMuted, marginTop: 2 }}>
                Mínimo: {modalAbono.reserva.total >= 40 ? `20% ($${(modalAbono.reserva.total * 0.2).toFixed(2)})` : '$5.00'}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: tc.textMuted, display: 'block', marginBottom: 6 }}>NOTAS (opcional)</label>
              <textarea
                value={modalAbono.notas}
                onChange={(e) => setModalAbono({ ...modalAbono, notas: e.target.value })}
                placeholder="Ej: Pago parcial por transferencia"
                rows={2}
                style={{
                  width: '100%', padding: 12, background: tc.background, border: `1px solid ${tc.border}`,
                  borderRadius: 8, color: tc.text, fontSize: 14, resize: 'none',
                }}
              />
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setModalAbono({ ...modalAbono, imagen: file, preview: ev.target?.result as string })
                  reader.readAsDataURL(file)
                }
              }}
              style={{ display: 'none' }}
              id="abono-input"
            />

            {modalAbono.preview ? (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <img src={modalAbono.preview} alt="Comprobante" style={{ width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }} />
                <button
                  onClick={() => setModalAbono({ ...modalAbono, imagen: null, preview: null })}
                  style={{ position: 'absolute', top: 4, right: 4, background: tc.error, color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label htmlFor="abono-input" style={{
                display: 'block', padding: 20, background: tc.background, border: `2px dashed ${tc.border}`,
                borderRadius: 8, textAlign: 'center', cursor: 'pointer', marginBottom: 16,
              }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>📷</span>
                <span style={{ fontSize: 12, color: tc.textMuted }}>Subir comprobante (opcional)</span>
              </label>
            )}

            <button
              onClick={handleGuardarAbono}
              disabled={!modalAbono.monto || guardandoAbono}
              style={{
                width: '100%', padding: 14, background: modalAbono.monto && !guardandoAbono ? tc.primary : tc.border,
                border: 'none', borderRadius: 8, color: modalAbono.monto && !guardandoAbono ? '#000' : tc.textMuted,
                fontSize: 14, fontWeight: 600, cursor: modalAbono.monto && !guardandoAbono ? 'pointer' : 'not-allowed',
              }}
            >
              {guardandoAbono ? 'Guardando...' : '✓ Confirmar Abono'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
