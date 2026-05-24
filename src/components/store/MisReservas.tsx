import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Reserva } from '../../types';
import { getSupabase } from '../../services/supabaseClient';

interface MisReservasProps {
  onClose: () => void;
}

export default function MisReservas({ onClose }: MisReservasProps) {
  const { reservas, clientes, updateCliente, updateReserva, settings } = useStore();
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [telefono, setTelefono] = useState('');
  const [vista, setVista] = useState<'panel' | 'reservas' | 'perfil'>('panel');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comprobanteModal, setComprobanteModal] = useState<{reserva: Reserva | null; imagen: File | null; preview: string | null}>({ reserva: null, imagen: null, preview: null });
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    ciudad: '',
    direccion: '',
    cedula: '',
  });

  const clienteId = localStorage.getItem('cliente_id');
  const clienteNombre = localStorage.getItem('cliente_nombre');
  const clienteEmail = localStorage.getItem('cliente_email');
  const clienteTelefono = localStorage.getItem('cliente_telefono');

  const clienteData = clientes.find(c => c.id === clienteId);

  useEffect(() => {
    setEditForm({
      nombre: clienteNombre || '',
      telefono: clienteTelefono || '',
      email: clienteEmail || '',
      ciudad: localStorage.getItem('cliente_ciudad') || '',
      direccion: localStorage.getItem('cliente_direccion') || '',
      cedula: localStorage.getItem('cliente_cedula') || '',
    });
  }, [clienteNombre, clienteTelefono, clienteEmail]);

  useEffect(() => {
    if (clienteId) {
      const filtradas = reservas.filter(r => 
        r.cliente_id === clienteId
      );
      setMisReservas(filtradas);
    } else if (clienteTelefono) {
      const filtradas = reservas.filter(r => 
        r.cliente_telefono === clienteTelefono
      );
      setMisReservas(filtradas);
    }
    setLoading(false);
  }, [reservas, clienteId, clienteTelefono]);

  const handleGuardarPerfil = async () => {
    if (!clienteId) return;
    setSaving(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('clients')
          .update({
            nombre: editForm.nombre,
            telefono: editForm.telefono,
            email: editForm.email,
            ciudad: editForm.ciudad,
            direccion: editForm.direccion,
            documento: editForm.cedula,
          })
          .eq('id', clienteId);

        if (error) throw error;

        localStorage.setItem('cliente_nombre', editForm.nombre);
        localStorage.setItem('cliente_telefono', editForm.telefono);
        localStorage.setItem('cliente_email', editForm.email);
        localStorage.setItem('cliente_ciudad', editForm.ciudad);
        localStorage.setItem('cliente_direccion', editForm.direccion);
        localStorage.setItem('cliente_cedula', editForm.cedula);

        if (updateCliente) {
          updateCliente(clienteId, {
            nombre: editForm.nombre,
            telefono: editForm.telefono,
            email: editForm.email,
            ciudad: editForm.ciudad,
            direccion: editForm.direccion,
            documento: editForm.cedula,
          });
        }

        setEditMode(false);
      }
    } catch (err) {
      console.error('Error guardando perfil:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleBuscar = () => {
    if (!telefono.trim()) return;
    const filtradas = reservas.filter(r => 
      r.cliente_telefono?.includes(telefono) || 
      r.cliente_id?.includes(telefono) ||
      r.cliente_nombre?.toLowerCase().includes(telefono.toLowerCase())
    );
    setMisReservas(filtradas);
  };

  const handleSubirComprobante = async () => {
    if (!comprobanteModal.reserva || !comprobanteModal.imagen) return;
    setSubiendoComprobante(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        if (updateReserva) {
          await updateReserva(comprobanteModal.reserva.id, {
            comprobante_url: base64,
          });
        }
        
        const updatedReservas = reservas.map(r => 
          r.id === comprobanteModal.reserva!.id 
            ? { ...r, comprobante_url: base64 }
            : r
        );
        
        setMisReservas(updatedReservas.filter(r => r.cliente_id === clienteId || r.cliente_telefono === clienteTelefono));
        setComprobanteModal({ reserva: null, imagen: null, preview: null });
        alert('¡Comprobante subido exitosamente!');
      };
      reader.readAsDataURL(comprobanteModal.imagen);
    } catch (err) {
      console.error('Error subiendo comprobante:', err);
      alert('Error al subir el comprobante');
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const getDiasRestantes = (fechaLimite: string | null | undefined) => {
    if (!fechaLimite) return null;
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diff = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getEstadoColor = (estado: string, diasRestantes: number | null) => {
    if (estado === 'cancelado') return { bg: '#fef2f2', color: '#dc2626', text: 'Cancelado' };
    if (estado === 'expirado') return { bg: '#fef2f2', color: '#7f1d1d', text: 'Expirado' };
    if (diasRestantes !== null && diasRestantes <= 0) {
      return { bg: '#7f1d1d', color: '#fff', text: 'Expirado' };
    }
    if (diasRestantes !== null && diasRestantes <= 2) {
      return { bg: '#fef3c7', color: '#92400e', text: `¡Atención! ${diasRestantes} día(s)` };
    }
    if (estado === 'abonado' || estado === 'confirmado') {
      return { bg: '#dcfce7', color: '#166534', text: 'Completado' };
    }
    return { bg: '#f3f4f6', color: '#6b7280', text: 'Pendiente' };
  };

  const getEstadisticas = () => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();
    
    const reservasMes = misReservas.filter(r => {
      const fecha = new Date(r.fecha_reserva);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    const reservasCompletadas = misReservas.filter(r => 
      r.estado_reserva === 'abonado' || 
      r.estado_reserva === 'confirmado'
    );

    const totalGastado = reservasCompletadas.reduce((sum, r) => sum + r.total, 0);
    const totalAbonado = misReservas.reduce((sum, r) => sum + (r.abono || 0), 0);
    const reservasActivas = misReservas.filter(r => 
      r.estado_reserva !== 'cancelado' && 
      r.estado_reserva !== 'expirado'
    ).length;

    const todosItems = misReservas.flatMap(r => r.items || []);
    const productosUnicos = [...new Set(todosItems.map(p => p.producto_id))].length;

    return {
      reservasMes: reservasMes.length,
      totalGastado,
      totalAbonado,
      reservasCompletadas: reservasCompletadas.length,
      reservasActivas,
      productosUnicos,
      totalReservas: misReservas.length,
      items: todosItems
    };
  };

  const stats = getEstadisticas();

  if (!clienteId) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 350, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)" }} />
        <div style={{
          background: '#fff', borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 420, maxHeight: "90vh", overflow: "auto", animation: "slideUp 0.3s ease-out", position: "relative"
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>
            ✕
          </button>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Cormorant Garamond',serif" }}>
              Buscar Mis Reservas
            </h2>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
              Ingresa tu teléfono para ver tus reservas
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>TELÉFONO</label>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="593 99 999 9999"
              style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
            />
          </div>

          <button 
            onClick={handleBuscar}
            style={{ width: '100%', padding: 16, background: '#1a1a1a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Buscar Reservas
          </button>

          {misReservas.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Tus Reservas:</h3>
              {misReservas.map(reserva => (
                <div key={reserva.id} style={{ padding: 12, background: '#fafaf8', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{reserva.id}</span>
                    <span style={{ fontSize: 11, color: '#999' }}>{new Date(reserva.fecha_reserva).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Total: ${reserva.total?.toFixed(2) || '0.00'} | Abono: ${reserva.abono?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 350, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)" }} />
      <div style={{
        background: '#fff', borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto", animation: "slideUp 0.3s ease-out", position: "relative"
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ 
            width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #f4c2c8, #e8919c)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: '#fff'
          }}>
            {clienteNombre?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Cormorant Garamond',serif" }}>
            {clienteNombre || 'Mi Cuenta'}
          </h2>
          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
            {clienteEmail || clienteTelefono || ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <button 
            onClick={() => setVista('perfil')}
            style={{ 
              flex: 1, 
              padding: 10, 
              background: vista === 'perfil' ? '#1a1a1a' : '#f5f5f5', 
              border: 'none', 
              borderRadius: 10, 
              color: vista === 'perfil' ? '#fff' : '#1a1a1a', 
              fontSize: 11, 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            👤 Perfil
          </button>
          <button 
            onClick={() => setVista('panel')}
            style={{ 
              flex: 1, 
              padding: 10, 
              background: vista === 'panel' ? '#1a1a1a' : '#f5f5f5', 
              border: 'none', 
              borderRadius: 10, 
              color: vista === 'panel' ? '#fff' : '#1a1a1a', 
              fontSize: 11, 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            📊 Panel
          </button>
          <button 
            onClick={() => setVista('reservas')}
            style={{ 
              flex: 1, 
              padding: 10, 
              background: vista === 'reservas' ? '#1a1a1a' : '#f5f5f5', 
              border: 'none', 
              borderRadius: 10, 
              color: vista === 'reservas' ? '#fff' : '#1a1a1a', 
              fontSize: 11, 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            📋 Reservas
          </button>
        </div>

        {vista === 'perfil' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#2b1f23' }}>Mi Perfil</h3>
              {!editMode && (
                <button 
                  onClick={() => setEditMode(true)}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#a84555';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#c96070';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#c96070', 
                    border: 'none', 
                    borderRadius: 8, 
                    color: '#fff', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✏️ Editar
                </button>
              )}
            </div>

            {editMode ? (
              <div style={{ padding: 20, background: '#fafaf8', borderRadius: 16, border: '1px solid rgba(244,194,200,0.4)' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e4dc', borderRadius: 10, fontSize: 14, background: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>TELÉFONO</label>
                  <input
                    type="tel"
                    value={editForm.telefono}
                    onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e4dc', borderRadius: 10, fontSize: 14, background: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>EMAIL</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e4dc', borderRadius: 10, fontSize: 14, background: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>CIUDAD</label>
                  <input
                    type="text"
                    value={editForm.ciudad}
                    onChange={e => setEditForm({ ...editForm, ciudad: e.target.value })}
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e4dc', borderRadius: 10, fontSize: 14, background: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>DIRECCIÓN</label>
                  <input
                    type="text"
                    value={editForm.direccion}
                    onChange={e => setEditForm({ ...editForm, direccion: e.target.value })}
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e4dc', borderRadius: 10, fontSize: 14, background: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>CÉDULA/DOCUMENTO</label>
                  <input
                    type="text"
                    value={editForm.cedula}
                    onChange={e => setEditForm({ ...editForm, cedula: e.target.value })}
                    style={{ width: '100%', padding: 12, border: '1.5px solid #e8e4dc', borderRadius: 10, fontSize: 14, background: '#fff' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => setEditMode(false)}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e5e5e5';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f5f5f5';
                    }}
                    style={{ 
                      flex: 1, 
                      padding: 14, 
                      background: '#f5f5f5', 
                      border: 'none', 
                      borderRadius: 10, 
                      color: '#666', 
                      fontSize: 14, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleGuardarPerfil}
                    disabled={saving}
                    onMouseEnter={e => {
                      if (!saving) {
                        e.currentTarget.style.background = '#15803d';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = saving ? '#ccc' : '#166534';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    style={{ 
                      flex: 1, 
                      padding: 14, 
                      background: saving ? '#ccc' : '#166534', 
                      border: 'none', 
                      borderRadius: 10, 
                      color: '#fff', 
                      fontSize: 14, 
                      fontWeight: 600, 
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ 
                  padding: 20, background: '#fafaf8', borderRadius: 16, marginBottom: 16,
                  border: '1px solid rgba(244,194,200,0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f4c2c8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: '#999', margin: 0, textTransform: 'uppercase' }}>Nombre</p>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#2b1f23' }}>{clienteNombre || 'No especificado'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8919c20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📧</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: '#999', margin: 0, textTransform: 'uppercase' }}>Email</p>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2b1f23' }}>{clienteEmail || 'No registrado'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#c9607020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📱</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: '#999', margin: 0, textTransform: 'uppercase' }}>Teléfono</p>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2b1f23' }}>{clienteTelefono || 'No registrado'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#92400e20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏙️</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: '#999', margin: 0, textTransform: 'uppercase' }}>Ciudad</p>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2b1f23' }}>{localStorage.getItem('cliente_ciudad') || 'No registrada'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16653420', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📍</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: '#999', margin: 0, textTransform: 'uppercase' }}>Dirección</p>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2b1f23' }}>{localStorage.getItem('cliente_direccion') || 'No registrada'}</p>
                    </div>
                  </div>
                </div>

                {clienteData?.fecha_registro && (
                  <p style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
                    Cliente desde: {new Date(clienteData.fecha_registro).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {vista === 'panel' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              <div style={{ padding: 14, background: '#fafaf8', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#c96070' }}>{stats.reservasMes}</div>
                <div style={{ fontSize: 9, color: '#666' }}>Este Mes</div>
              </div>
              <div style={{ padding: 14, background: '#fafaf8', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#166534' }}>{stats.reservasCompletadas}</div>
                <div style={{ fontSize: 9, color: '#666' }}>Completadas</div>
              </div>
              <div style={{ padding: 14, background: '#fafaf8', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{stats.reservasActivas}</div>
                <div style={{ fontSize: 9, color: '#666' }}>Activas</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              <div style={{ padding: 16, background: 'linear-gradient(135deg, #c96070, #e8919c)', borderRadius: 14, textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>${stats.totalGastado.toFixed(0)}</div>
                <div style={{ fontSize: 10, opacity: 0.9 }}>Total Gastado</div>
              </div>
              <div style={{ padding: 16, background: '#fafaf8', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#92400e' }}>${stats.totalAbonado.toFixed(0)}</div>
                <div style={{ fontSize: 10, color: '#666' }}>En Abonos</div>
              </div>
            </div>

            {stats.items.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🛍️ Historial de Compras ({stats.productosUnicos} productos)
                </h3>
                <div style={{ maxHeight: 180, overflowY: 'auto', background: '#fafaf8', borderRadius: 12, padding: 12 }}>
                  {stats.items.reduce((acc: any[], item) => {
                    const existente = acc.find(p => p.producto_id === item.producto_id);
                    if (existente) {
                      existente.cantidad += item.cantidad;
                      existente.total += item.subtotal;
                    } else {
                      acc.push({ ...item, total: item.subtotal });
                    }
                    return acc;
                  }, []).sort((a, b) => b.total - a.total).slice(0, 10).map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < 9 ? '1px solid #f0ede6' : 'none' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#2b1f23' }}>{item.producto_nombre || 'Producto'}</span>
                        <span style={{ fontSize: 10, color: '#999', marginLeft: 6 }}>x{item.cantidad}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#c96070' }}>${item.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {vista === 'reservas' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: 32 }}>⏳</span>
                <p style={{ fontSize: 14, color: '#666', marginTop: 12 }}>Cargando...</p>
              </div>
            ) : misReservas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: 48 }}>📦</span>
                <p style={{ fontSize: 14, color: '#666', marginTop: 12 }}>No tienes reservas aún</p>
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Haz tu primera reserva desde la tienda</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {misReservas.map(reserva => {
                  const diasRestantes = getDiasRestantes(reserva.fecha_limite_pago);
                  const saldoRestante = reserva.saldo || (reserva.total - reserva.abono);
                  const porcentajeAbonado = reserva.total > 0 ? Math.round((reserva.abono / reserva.total) * 100) : 0;
                  
                  const getComprobanteStatus = () => {
                    if (reserva.comprobante_verificado) return { text: '✅ Comprobante verificado', bg: '#dcfce7', color: '#166534' };
                    if (reserva.comprobante_url) return { text: '📋 Comprobante en revisión', bg: '#fef3c7', color: '#92400e' };
                    return { text: '⚠️ Falta comprobante', bg: '#fef2f2', color: '#dc2626' };
                  };
                  
                  const comprobanteStatus = getComprobanteStatus();
                  
                  return (
                    <div key={reserva.id} style={{ 
                      padding: 16, 
                      background: '#fafaf8', 
                      borderRadius: 16,
                      border: `1px solid ${reserva.estado_reserva === 'cancelado' ? '#fecaca' : reserva.estado_reserva === 'confirmado' ? '#bbf7d0' : '#e8e4dc'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>#{reserva.id?.slice(-6) || 'N/A'}</span>
                          <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>
                            {new Date(reserva.fecha_reserva).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span style={{ 
                          padding: '4px 10px', 
                          background: reserva.estado_reserva === 'confirmado' ? '#22c55e' : 
                                      reserva.estado_reserva === 'cancelado' ? '#dc2626' : '#f59e0b', 
                          color: '#fff', 
                          borderRadius: 20, 
                          fontSize: 10, 
                          fontWeight: 700 
                        }}>
                          {reserva.estado_reserva === 'confirmado' ? 'COMPLETADO' : 
                           reserva.estado_reserva === 'cancelado' ? 'CANCELADO' : 'PENDIENTE'}
                        </span>
                      </div>

                      {reserva.items && reserva.items.length > 0 && (
                        <div style={{ marginBottom: 12, background: '#fff', borderRadius: 10, padding: 10 }}>
                          {reserva.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                              <span>{item.producto_nombre || 'Producto'} x{item.cantidad}</span>
                              <span style={{ fontWeight: 600, color: '#2b1f23' }}>${item.subtotal?.toFixed(2) || '0.00'}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginBottom: 12, padding: 12, background: '#fff', borderRadius: 10 }}>
                        <p style={{ fontSize: 11, color: '#666', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Resumen de Pago</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Total del pedido:</span>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>${reserva.total?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Abono ({porcentajeAbonado}%):</span>
                          <span style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>${reserva.abono?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #e8e4dc' }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Saldo pendiente:</span>
                          <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 16 }}>${saldoRestante?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      {reserva.estado_reserva !== 'confirmado' && reserva.estado_reserva !== 'cancelado' && (
                        <div style={{ 
                          marginBottom: 12, 
                          padding: 10, 
                          background: comprobanteStatus.bg, 
                          borderRadius: 10, 
                          textAlign: 'center' 
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: comprobanteStatus.color }}>
                            {comprobanteStatus.text}
                          </span>
                        </div>
                      )}

                      {!reserva.comprobante_url && reserva.estado_reserva === 'pendiente' && (
                        <div style={{ marginBottom: 12, padding: 10, background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                            ⏰ Tienes 24 horas para realizar el abono o tu reserva será cancelada
                          </span>
                        </div>
                      )}

                      {reserva.comprobante_url && !reserva.comprobante_verificado && reserva.estado_reserva === 'pendiente' && (
                        <div style={{ marginBottom: 12, padding: 10, background: '#dbeafe', borderRadius: 8, textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: '#1e40af', fontWeight: 600 }}>
                            🔎 Tu abono será verificado con el comprobante de transferencia. Tienes 3 días para realizar el pago total (${reserva.saldo?.toFixed(2)})
                          </span>
                        </div>
                      )}

                      {diasRestantes !== null && diasRestantes > 0 && reserva.estado_reserva === 'pendiente' && (
                        <div style={{ marginBottom: 12, padding: 8, background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                            ⚠️ Te quedan {diasRestantes} día(s) para completar el pago
                          </span>
                        </div>
                      )}

                      {reserva.estado_reserva === 'pendiente' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {!reserva.comprobante_url && (
                            <div style={{ 
                              padding: 12, 
                              background: '#f0fdf4', 
                              borderRadius: 10, 
                              textAlign: 'center' 
                            }}>
                              <p style={{ fontSize: 11, color: '#166534', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                                📱 Puedes enviar tu comprobante directamente por WhatsApp para su verificación correcta.
                              </p>
                              <button 
                                onClick={() => {
                                  const msg = encodeURIComponent(
                                    `Hola! Quiero enviar mi comprobante de abono para la reserva #${reserva.codigo || reserva.id?.slice(-6)}. ` +
                                    `Monto abonado: $${reserva.abono?.toFixed(2)}. ` +
                                    `Adjunto el comprobante de transferencia.`
                                  );
                                  const adminPhone = '593999999999'; // Cambiar por el número real
                                  window.open(`https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                }}
                                style={{ 
                                  width: '100%', 
                                  padding: 10, 
                                  background: '#25D366', 
                                  border: 'none', 
                                  borderRadius: 8, 
                                  color: '#fff', 
                                  fontSize: 12, 
                                  fontWeight: 600, 
                                  cursor: 'pointer',
                                  marginTop: 8
                                }}
                              >
                                📱 Enviar Comprobante por WhatsApp
                              </button>
                            </div>
                          )}
                          
                          {reserva.comprobante_url && !reserva.comprobante_verificado && (
                            <div style={{ 
                              padding: 12, 
                              background: '#fff', 
                              border: '1px solid #e8e4dc', 
                              borderRadius: 10, 
                              textAlign: 'center' 
                            }}>
                              <p style={{ fontSize: 11, color: '#666', margin: 0 }}>
                                Tu comprobante está siendo revisado. Te notificaremos cuando sea verificado.
                              </p>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => {
                              const msg = encodeURIComponent(`Hola! Quiero confirmar mi reserva #${reserva.id}. He pagado el valor total de $${reserva.total?.toFixed(2)}. Adjunto mi comprobante.`);
                              if (reserva.cliente_telefono) {
                                window.open(`https://wa.me/${reserva.cliente_telefono.replace(/\D/g, '')}?text=${msg}`, '_blank');
                              }
                            }}
                            style={{ 
                              width: '100%', 
                              padding: 12, 
                              background: '#25D366', 
                              border: 'none', 
                              borderRadius: 10, 
                              color: '#fff', 
                              fontSize: 13, 
                              fontWeight: 600, 
                              cursor: 'pointer' 
                            }}
                          >
                            📱 Contactar por WhatsApp
                          </button>
                        </div>
                      )}

                      {reserva.estado_reserva === 'confirmado' && (
                        <div style={{ padding: 12, background: '#dcfce7', borderRadius: 10, textAlign: 'center' }}>
                          <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
                            🎉 ¡Reserva completada! Gracias por tu compra.
                          </span>
                        </div>
                      )}

                      {reserva.estado_reserva === 'cancelado' && (
                        <div style={{ padding: 12, background: '#fef2f2', borderRadius: 10, textAlign: 'center' }}>
                          <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                            ❌ Reserva cancelada
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {comprobanteModal.reserva && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            }}>
              <div style={{
                background: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400,
              maxHeight: '80vh', overflow: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
                    📷 Subir Comprobante
                  </h3>
                  <button 
                    onClick={() => setComprobanteModal({ reserva: null, imagen: null, preview: null })}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                  Reserva: <strong>#{comprobanteModal.reserva?.id?.slice(-6)}</strong>
                </p>

                <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
                  Abono a pagar: <strong style={{ color: '#c96070' }}>${comprobanteModal.reserva?.abono?.toFixed(2)}</strong>
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setComprobanteModal({ 
                          ...comprobanteModal, 
                          imagen: file, 
                          preview: ev.target?.result as string 
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="comprobante-input"
                />

                {comprobanteModal.preview ? (
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <img 
                      src={comprobanteModal.preview} 
                      alt="Comprobante" 
                      style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover' }} 
                    />
                    <button
                      onClick={() => setComprobanteModal({ ...comprobanteModal, imagen: null, preview: null })}
                      style={{ 
                        position: 'absolute', top: 8, right: 8, 
                        background: '#dc2626', color: '#fff', border: 'none', 
                        borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="comprobante-input"
                    style={{ 
                      display: 'block', 
                      padding: 32, 
                      background: '#f5f5f5', 
                      border: '2px dashed #ccc', 
                      borderRadius: 12, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      marginBottom: 16
                    }}
                  >
                    <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📷</span>
                    <span style={{ fontSize: 13, color: '#666' }}>Toca para seleccionar imagen</span>
                  </label>
                )}

                <p style={{ fontSize: 11, color: '#999', marginBottom: 16, textAlign: 'center' }}>
                  Una vez subido, nuestro equipo verificará tu comprobante
                </p>

                <button 
                  onClick={handleSubirComprobante}
                  disabled={!comprobanteModal.imagen || subiendoComprobante}
                  style={{ 
                    width: '100%', 
                    padding: 14, 
                    background: !comprobanteModal.imagen || subiendoComprobante ? '#ccc' : '#22c55e', 
                    border: 'none', 
                    borderRadius: 12, 
                    color: '#fff', 
                    fontSize: 14, 
                    fontWeight: 600, 
                    cursor: !comprobanteModal.imagen || subiendoComprobante ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {subiendoComprobante ? 'Subiendo...' : '✓ Confirmar Comprobante'}
                </button>

                <div style={{ margin: '16px 0', textAlign: 'center', fontSize: 12, color: '#999' }}>
                  — O —
                </div>

                <div style={{ 
                  padding: 12, 
                  background: '#f0fdf4', 
                  borderRadius: 10, 
                  textAlign: 'center' 
                }}>
                  <p style={{ fontSize: 11, color: '#166534', fontWeight: 600, margin: '0 0 8px', lineHeight: 1.5 }}>
                    📱 También puedes enviar tu comprobante directamente por WhatsApp para su verificación.
                  </p>
                  <button 
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `Hola! Adjunto mi comprobante de abono para la reserva #${comprobanteModal.reserva?.codigo || comprobanteModal.reserva?.id?.slice(-6)}. ` +
                        `Monto abonado: $${comprobanteModal.reserva?.abono?.toFixed(2)}.`
                      );
                      const adminPhone = settings?.contacts?.whatsapp?.replace(/\D/g, '') || '593999999999';
                      window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank');
                    }}
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      background: '#25D366', 
                      border: 'none', 
                      borderRadius: 8, 
                      color: '#fff', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      marginTop: 8
                    }}
                  >
                    📱 Enviar por WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

        <button 
          onClick={() => {
            localStorage.removeItem('cliente_id');
            localStorage.removeItem('cliente_nombre');
            localStorage.removeItem('cliente_email');
            localStorage.removeItem('cliente_telefono');
            localStorage.removeItem('cliente_direccion');
            localStorage.removeItem('cliente_ciudad');
            localStorage.removeItem('cliente_cedula');
            window.location.reload();
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={{ 
            width: '100%', 
            marginTop: 20, 
            padding: 14, 
            background: '#fff', 
            border: '2px solid #dc2626', 
            borderRadius: 12, 
            color: '#dc2626', 
            fontSize: 13, 
            fontWeight: 600, 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          🚪 Cerrar Sesión
        </button>

        <button 
          onClick={onClose}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#15803d';
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#22c55e';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={{ 
            width: '100%', 
            marginTop: 10, 
            padding: 14, 
            background: '#22c55e', 
            border: 'none', 
            borderRadius: 12, 
            color: '#fff', 
            fontSize: 13, 
            fontWeight: 600, 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          ← Volver a la tienda
        </button>
      </div>
    </div>
  );
}
