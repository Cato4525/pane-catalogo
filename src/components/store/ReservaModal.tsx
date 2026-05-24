import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store'
import { useAuthStore } from '../../store/authStore'
import { dataService } from '../../services/dataService'
import { Reserva, ConsultaProducto, Product } from '../../types'

interface CartItem extends Product {
  qty: number
}

interface ReservaModalProps {
  cart: CartItem[]
  onClose: () => void
  onSuccess?: () => void
  mode: 'consulta' | 'reserva'
  reservaTipo?: 'con_abono'
}

type Step = 'datos' | 'pago' | 'confirmacion'

export default function ReservaModal({ cart, onClose, onSuccess, mode, reservaTipo = 'con_abono' }: ReservaModalProps) {
  const [step, setStep] = useState<Step>('datos')
  const [loading, setLoading] = useState(false)
  const [imagenRecibo, setImagenRecibo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { addReserva, addConsulta, settings } = useStore()
  const { user } = useAuthStore()
  
  const [clientePerfil, setClientePerfil] = useState<any>(null)
  const [datosPrevios, setDatosPrevios] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    ciudad: '',
    cedula: '',
    direccion: '',
    envio: '',
  })
  
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const esMayor40 = total >= 40
  
  const abonoMinimo = esMayor40 ? total * 0.2 : 5
  const [montoAbono, setMontoAbono] = useState(abonoMinimo)
  
  const isConsultation = mode === 'consulta'
  
  // Cargar perfil y datos previos
  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.id) return
      try {
        const { getSupabase } = await import('../../services/supabaseClient')
        const supabase = getSupabase()
        if (!supabase) return
        
        // 1. Cargar perfil del cliente
        const { data: perfil } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (perfil) {
          setClientePerfil(perfil)
        }
        
        // 2. Buscar reservas previas por teléfono o cédula
        if (perfil?.telefono || perfil?.documento) {
          const { data: reservasPrevias } = await supabase
            .from('reservations')
            .select('client_name, client_phone, client_document, client_city, client_address, client_email')
            .or(`client_phone.eq.${perfil.telefono},client_document.eq.${perfil.documento}`)
            .order('fecha_reserva', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (reservasPrevias) {
            setDatosPrevios(reservasPrevias)
          }
        }
      } catch (e) {
        console.error('Error cargando perfil:', e)
      }
    }
    
    cargarDatos()
  }, [user?.id])

  // Cargar datos en formulario
  useEffect(() => {
    const clienteNombre = localStorage.getItem('cliente_nombre')
    const clienteTelefono = localStorage.getItem('cliente_telefono')
    const clienteEmail = localStorage.getItem('cliente_email')
    const clienteCiudad = localStorage.getItem('cliente_ciudad')
    const clienteCedula = localStorage.getItem('cliente_cedula')
    const clienteDireccion = localStorage.getItem('cliente_direccion')
    const clienteEnvio = localStorage.getItem('cliente_envio')
    
    setFormData(prev => ({
      ...prev,
      // Prioridad: localStorage > datos previos > perfil > user > prev
      nombre: clienteNombre || datosPrevios?.client_name || clientePerfil?.nombre || user?.nombre || prev.nombre,
      telefono: clienteTelefono || datosPrevios?.client_phone || clientePerfil?.telefono || prev.telefono,
      email: clienteEmail || datosPrevios?.client_email || clientePerfil?.email || user?.email || prev.email,
      ciudad: clienteCiudad || datosPrevios?.client_city || clientePerfil?.ciudad || user?.provincia || prev.ciudad,
      cedula: clienteCedula || datosPrevios?.client_document || clientePerfil?.documento || prev.cedula,
      direccion: clienteDireccion || datosPrevios?.client_address || clientePerfil?.direccion || prev.direccion,
      envio: clienteEnvio || prev.envio,
    }))
  }, [user, clientePerfil, datosPrevios])

  useEffect(() => {
    setMontoAbono(abonoMinimo)
  }, [abonoMinimo])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagenRecibo(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const tieneComprobante = !!previewUrl

  const handleSubmitDatos = (e: React.FormEvent) => {
    e.preventDefault()
    if (isConsultation) {
      handleConfirmarConsulta()
    } else {
      setStep('pago')
    }
  }

  const handleConfirmarConsulta = async () => {
    setLoading(true)
    try {
      const now = new Date()
      
      for (const item of cart) {
        const consultaDB = {
          product_id: String(item.id),
          cliente_nombre: formData.nombre,
          cliente_telefono: formData.telefono,
          cliente_email: formData.email,
          mensaje: formData.direccion || '',
          origen: 'tienda',
          created_at: now.toISOString(),
        }
        
        let consultaCreada: ConsultaProducto | null = null
        try {
          const saved = await dataService.createConsulta(consultaDB)
          if (saved) consultaCreada = saved
        } catch (e) {
          console.error('Error guardando consulta:', e)
        }
        
        const consulta: ConsultaProducto = {
          id: consultaCreada?.id || `CON-${Date.now()}-${item.id}`,
          product_id: String(item.id),
          fecha: now.toISOString(),
          origen: 'tienda'
        }
        addConsulta(consulta)
      }
      
      const productosList = cart.map(item => `• ${item.name} x${item.qty} = $${(item.price * item.qty).toFixed(2)}`).join('\n')
      
      let mensajeCliente = ''
      if (formData.nombre) mensajeCliente += `Hola ${formData.nombre}, `
      mensajeCliente += `hemos recibido tu consulta.\n\n*Productos consultados:*\n${productosList}\n\nTotal referencia: $${total.toFixed(2)}\n\nTe responderemos pronto a tu email. Gracias por tu interés!`
      
      const mensajeClienteEncoded = encodeURIComponent(mensajeCliente)
      const adminEmail = settings?.contacts?.email || 'contacto@tienda.com'
      
      window.open(`mailto:${adminEmail}?subject=Nueva%20consulta%20-%20${formData.nombre || 'Cliente'}&body=${mensajeClienteEncoded}`, '_blank')
      
      const mensajeAdmin = encodeURIComponent(
        `*NUEVA CONSULTA*\n\n` +
        `*Cliente:* ${formData.nombre || 'Anónimo'}\n` +
        `*Provincia:* ${formData.ciudad || 'No proporcionada'}\n` +
        `*Email:* ${formData.email || 'No proporcionado'}\n\n` +
        `*Mensaje:* ${formData.direccion || 'Sin mensaje'}\n\n` +
        `*Productos:*\n${productosList}\n\n` +
        `*Total:* $${total.toFixed(2)}`
      )
      
      setTimeout(() => {
        window.open(`mailto:${adminEmail}?subject=Nueva%20consulta%20-%20${formData.nombre || 'Cliente'}&body=${mensajeAdmin}`, '_blank')
      }, 1500)
      
      const adminPhone = settings?.contacts?.whatsapp
      if (adminPhone) {
        const phoneClean = adminPhone.replace(/\D/g, '')
        setTimeout(() => {
          window.open(`https://wa.me/${phoneClean}?text=${mensajeAdmin}`, '_blank')
        }, 2000)
      }
      
      setStep('confirmacion')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarReserva = async () => {
    setLoading(true)
    try {
      const now = new Date()
      
      const fechaLimiteAbono = new Date(now)
      fechaLimiteAbono.setDate(fechaLimiteAbono.getDate() + 3)
      
      const fechaLimitePago = new Date(now)
      fechaLimitePago.setDate(fechaLimitePago.getDate() + 7)
  
      const tieneComprobanteSubido = !!previewUrl
  
      // Lógica de abono:
      // - SI sube comprobante: el abono es el monto que indicó
      // - NO sube comprobante: abono = 0, saldo = total
      const abonoCalculado = tieneComprobanteSubido ? montoAbono : 0
  
      // 1. PRIMERO: Asegurar que el cliente tenga registro en tabla clients
      let clienteIdReal = clientePerfil?.id || null
      
      try {
        const { getSupabase } = await import('../../services/supabaseClient')
        const supabase = getSupabase()
        if (supabase) {
          // Buscar cliente existente por cédula o teléfono
          const { data: clienteExistente } = await supabase
            .from('clients')
            .select('id, nombre, telefono, email')
            .or(`telefono.eq.${formData.telefono},documento.eq.${formData.cedula || ''}`)
            .maybeSingle()

          if (clienteExistente) {
            clienteIdReal = clienteExistente.id
          }

          if (!clienteExistente) {
            // Crear nuevo cliente
            const { data: nuevoCliente, error: createError } = await supabase
              .from('clients')
              .insert({
                nombre: formData.nombre,
                telefono: formData.telefono,
                email: formData.email || null,
                documento: formData.cedula || null,
                ciudad: formData.ciudad || null,
                direccion: formData.direccion || null,
              })
              .select()
              .single()

            if (!createError && nuevoCliente) {
              clienteIdReal = nuevoCliente.id
              setClientePerfil(nuevoCliente)
              console.log('Cliente creado:', nuevoCliente.id)
            } else if (createError) {
              console.error('Error creando cliente:', createError)
            }
          } else {
            console.log('Cliente encontrado:', clienteExistente.id)
            setClientePerfil(clienteExistente)
          }

          // Actualizar localStorage
          localStorage.setItem('cliente_nombre', formData.nombre)
          localStorage.setItem('cliente_telefono', formData.telefono)
          localStorage.setItem('cliente_email', formData.email)
          localStorage.setItem('cliente_ciudad', formData.ciudad)
          localStorage.setItem('cliente_cedula', formData.cedula)
          localStorage.setItem('cliente_direccion', formData.direccion)
          localStorage.setItem('cliente_envio', formData.envio)
        }
      } catch (e) {
        console.error('Error creando registro de cliente:', e)
      }
      
      // 2. Crear la reserva
      const reserva: Reserva = {
        id: `RES-${String(Date.now()).slice(-6)}`,
        codigo: `RES-${String(Date.now()).slice(-6)}`,
        cliente_id: clienteIdReal || '', // UUID real del cliente
        cliente_nombre: formData.nombre,
        cliente_telefono: formData.telefono,
        cliente_cedula: formData.cedula,
        cliente_ciudad: formData.ciudad,
        cliente_direccion: formData.direccion,
        cliente_email: formData.email,
        estado_reserva: 'pendiente',
        total,
        abono: abonoCalculado,
        saldo: total - abonoCalculado,
        comprobante_url: previewUrl,
        fecha_reserva: now.toISOString(),
        fecha_limite_abono: fechaLimiteAbono.toISOString(),
        fecha_limite_pago: fechaLimitePago.toISOString(),
        notas_admin: `Reserva creada - Comprobante: ${tieneComprobanteSubido ? 'SUBIDO' : 'PENDIENTE'} | Cédula: ${formData.cedula || 'No proporcionada'} | Ciudad: ${formData.ciudad || 'No proporcionada'} | Dirección: ${formData.direccion || 'No especificada'} | Envío: ${formData.envio || 'No especificado'}`,
        whatsapp_revisado: false,
        comprobante_verificado: false,
        abono_confirmado: false,
        items: cart.map(item => ({
          id: `RES-ITEM-${item.id}-${Date.now()}`,
          reserva_id: '',
          producto_id: String(item.id),
          producto_nombre: item.name,
          cantidad: item.qty,
          precio_unitario: item.price,
          subtotal: item.price * item.qty,
        })),
        origen: 'tienda',
        abonos: [],
      }

      let savedToSupabase = false
      try {
        const saved = await dataService.createReserva(reserva)
        if (saved) {
          savedToSupabase = true
          setReservaCreada(saved)
          addReserva(saved)
        }
      } catch (e) {
        console.error('Error guardando reserva en BD:', e)
      }

      if (!savedToSupabase) {
        addReserva(reserva)
      }

      const phoneNumber = formData.telefono.replace(/\D/g, '')
      const adminPhone = settings?.contacts?.whatsapp?.replace(/\D/g, '') || '593999999999'
      
      const productosList = cart.map(item => `• ${item.name} x${item.qty} = $${(item.price * item.qty).toFixed(2)}`).join('\n')
      
      let mensajeCliente = ''
      if (tieneComprobanteSubido) {
        mensajeCliente = encodeURIComponent(
          `*Reserva Enviada ✅*\n\n` +
          `Hola ${formData.nombre}!\n\n` +
          `Hemos recibido tu reserva y el comprobante de pago.\n\n` +
          `📋 *Tu reserva será verificada con el comprobante de transferencia en las próximas horas.*\n\n` +
          `*Resumen:*\n` +
          `• Total: $${total.toFixed(2)}\n` +
          `• Abono: $${abonoCalculado.toFixed(2)}\n` +
          `• Saldo: $${(total - abonoCalculado).toFixed(2)}\n\n` +
          `Te notificaremos una vez confirmada. Gracias! 🙏`
        )
      } else {
        mensajeCliente = encodeURIComponent(
          `*Reserva Recibida 📋*\n\n` +
          `Hola ${formData.nombre}!\n\n` +
          `Hemos recibido tu reserva.\n\n` +
          `⚠️ *No incluiste el comprobante de pago.*\n\n` +
          `*Datos para el pago:*\n` +
          `• Total: $${total.toFixed(2)}\n` +
          `• Abono mínimo: $${abonoCalculado.toFixed(2)}\n` +
          `• Saldo: $${(total - abonoCalculado).toFixed(2)}\n\n` +
          `⏰ *Tienes un plazo de 24 horas para realizar el abono requerido.*\n` +
          `❌ *Pasado ese tiempo, tu reserva será cancelada automáticamente.*\n\n` +
          `📱 *Puedes enviarnos el comprobante AHORA* tocando el botón de adjuntar imagen, o *MÁS TARDE* por este chat de WhatsApp.\n\n` +
          `Una vez verificado tu comprobante, confirmaremos tu reserva.\n\n` +
          `¡Gracias por tu preferencia! 🙏`
        )
      }
      
      if (phoneNumber.length > 8) {
        window.open(`https://wa.me/${phoneNumber}?text=${mensajeCliente}`, '_blank')
      }
      
      const mensajeAdmin = encodeURIComponent(
        `*NUEVA RESERVA* ${reserva.id}\n\n` +
        `*Cliente:* ${formData.nombre}\n` +
        `*Teléfono:* ${formData.telefono || 'No proporcionado'}\n` +
        `*Email:* ${formData.email || 'No proporcionado'}\n` +
        `*Cédula:* ${formData.cedula || 'No proporcionada'}\n` +
        `*Ciudad:* ${formData.ciudad || 'No proporcionada'}\n` +
        `*Dirección:* ${formData.direccion || 'No especificada'}\n` +
        `*Envío:* ${formData.envio || 'No especificado'}\n\n` +
        `*Comprobante:* ${tieneComprobanteSubido ? '✅ SUBIDO' : '⏳ PENDIENTE - Cliente notificado'}\n\n` +
        `*Productos:*\n${productosList}\n\n` +
        `*Total:* $${total.toFixed(2)}\n` +
        `*Abono:* $${abonoCalculado.toFixed(2)}\n` +
        `*Saldo:* $${(total - abonoCalculado).toFixed(2)}`
      )
      
      setTimeout(() => {
        window.open(`https://wa.me/${adminPhone}?text=${mensajeAdmin}`, '_blank')
      }, 1500)
      
      setReservaCreada(reserva)
      setGuardadoExitoso(savedToSupabase)
      setStep('confirmacion')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      alert('Error al procesar la reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)" }} />
      <div style={{
        background: '#fff', borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 450, maxHeight: "90vh", overflow: "auto", animation: "slideUp 0.3s ease-out", position: "relative"
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
            {formData.nombre?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Cormorant Garamond',serif" }}>
            {formData.nombre || 'Mi Cuenta'}
          </h2>
          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
            {formData.email || formData.telefono || ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <button 
            onClick={() => setStep('datos')}
            style={{ 
              flex: 1, 
              padding: 10, 
              background: step === 'datos' ? '#1a1a1a' : '#f5f5f5', 
              border: 'none', 
              borderRadius: 10, 
              color: step === 'datos' ? '#fff' : '#1a1a1a', 
              fontSize: 11, 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            📋 Datos
          </button>
          <button 
            onClick={() => setStep('pago')}
            style={{ 
              flex: 1, 
              padding: 10, 
              background: step === 'pago' ? '#1a1a1a' : '#f5f5f5', 
              border: 'none', 
              borderRadius: 10, 
              color: step === 'pago' ? '#fff' : '#1a1a1a', 
              fontSize: 11, 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            💰 Pago
          </button>
        </div>

        {step === 'datos' && (
          <form onSubmit={handleSubmitDatos}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>NOMBRE COMPLETO *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre"
                  style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>CÉDULA *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  minLength={10}
                  value={formData.cedula}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, cedula: val });
                  }}
                  placeholder="10 dígitos"
                  style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>TELÉFONO (WhatsApp) *</label>
              <input
                type="tel"
                required
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="593 99 999 9999"
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>CORREO ELECTRÓNICO</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>CIUDAD *</label>
              <input
                type="text"
                required
                value={formData.ciudad}
                onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Tu ciudad"
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>DIRECCIÓN</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Tu dirección (opcional)"
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>ENVÍO POR</label>
              <input
                type="text"
                value={formData.envio}
                onChange={e => setFormData({ ...formData, envio: e.target.value })}
                placeholder="Ej: Servientrega, transporte propio, etc."
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: 16, background: '#1a1a1a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {isConsultation ? 'Enviar Consulta' : 'Continuar'}
            </button>
          </form>
        )}

        {step === 'pago' && !isConsultation && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <button 
                type="button"
                onClick={() => setStep('datos')}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px', marginRight: 8 }}
              >
                ←
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Confirmar Reserva</h3>
            </div>

            <div style={{ marginBottom: 16, padding: 16, background: tieneComprobante ? '#dcfce7' : '#fef3c7', borderRadius: 12, border: `1.5px solid ${tieneComprobante ? '#22c55e' : '#f59e0b'}` }}>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: tieneComprobante ? '#166534' : '#92400e' }}>
                📎 Comprobante de Pago {tieneComprobante ? '✅ Subido' : '⏳ Opcional'}
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {previewUrl ? (
                <div style={{ position: 'relative' }}>
                  <img src={previewUrl} alt="Recibo" style={{ width: '100%', borderRadius: 8, maxHeight: 120, objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => { setImagenRecibo(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    style={{ position: 'absolute', top: 4, right: 4, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', padding: 14, background: '#fff', border: '2px dashed #94a3b8', borderRadius: 8, color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                >
                  📷 {tieneComprobante ? 'Cambiar comprobante' : 'Subir comprobante (opcional)'}
                </button>
              )}
              {!tieneComprobante && (
                <p style={{ fontSize: 10, color: '#78350f', marginTop: 8 }}>
                  Si no tienes el comprobante ahora, puedes enviar la reserva y el admin la verificará luego.
                </p>
              )}
            </div>

            <div style={{ marginBottom: 16, padding: 16, background: '#fafaf8', borderRadius: 12, border: '1px solid #e8e4dc' }}>
              <p style={{ margin: 0, fontSize: 14, color: '#666', textAlign: 'center' }}>Total a pagar:</p>
              <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' }}>${total.toFixed(2)}</p>
            </div>

            {tieneComprobante ? (
              <>
                <div style={{ marginBottom: 16, padding: 12, background: esMayor40 ? '#fef3c7' : '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 12, color: esMayor40 ? '#92400e' : '#166534', fontWeight: 600 }}>
                    {esMayor40 
                      ? `Abono mínimo (20%): $${abonoMinimo.toFixed(2)}`
                      : `Abono mínimo (mínimo $5): $${abonoMinimo.toFixed(2)}`}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>MONTO DEL ABONO (comprobante) *</label>
                  <input
                    type="number"
                    required
                    min={abonoMinimo}
                    max={total}
                    value={montoAbono}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || abonoMinimo;
                      setMontoAbono(Math.min(Math.max(val, abonoMinimo), total));
                    }}
                    placeholder={`Mínimo $${abonoMinimo.toFixed(2)}`}
                    style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: '#666' }}>
                    Saldo pendiente: ${(total - montoAbono).toFixed(2)}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 16, padding: 12, background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                  ⏰ Tienes 24 horas para realizar el abono de $${abonoMinimo.toFixed(2)} o tu reserva será cancelada
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#78350f' }}>
                  Abono inicial: $0 (debes enviar el comprobante por WhatsApp)
                </p>
              </div>
            )}

            <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#0369a1', textAlign: 'center' }}>
                📋 Tu reserva será verificada por nuestro equipo. Te contactaremos al número {formData.telefono} lo más pronto posible.
              </p>
            </div>

            <button 
              onClick={handleConfirmarReserva} 
              disabled={loading}
              style={{ width: '100%', padding: 16, background: loading ? '#ccc' : '#22c55e', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Guardando...' : tieneComprobante ? '✓ Confirmar Reserva' : '📱 Enviar Reserva'}
            </button>
            
            {!tieneComprobante && (
              <p style={{ fontSize: 11, color: '#666', marginTop: 10, textAlign: 'center' }}>
                Sin comprobante, tu reserva quedará pendiente de verificación
              </p>
            )}
          </div>
        )}

        {step === 'confirmacion' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>
              {isConsultation ? '📩' : (tieneComprobante ? '✅' : '📋')}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              {isConsultation ? '¡Consulta enviada!' : (tieneComprobante ? '¡Reserva enviada!' : '¡Reserva recibida!')}
            </h3>
            <p style={{ color: '#666', marginBottom: 24 }}>
              {isConsultation 
                ? 'Te responderemos a la brevedad.' 
                : tieneComprobante 
                  ? 'Tu reserva será verificada en las próximas horas.' 
                  : 'Tu reserva será verificada una vez confirmado el pago.'}
            </p>

            {reservaCreada && (
              <div style={{ marginBottom: 20, padding: 16, background: '#fafaf8', borderRadius: 12, textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: '#666', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Tu Reserva</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>#{reservaCreada.id}</p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Total: ${reservaCreada.total?.toFixed(2)} | Abono: ${reservaCreada.abono?.toFixed(2)}</p>
                <p style={{ fontSize: 11, color: tieneComprobante ? '#166534' : '#92400e', marginTop: 4, fontWeight: 600 }}>
                  {tieneComprobante ? '✅ Comprobante subido' : '⏳ Comprobante pendiente'}
                </p>
              </div>
            )}
            
            {!isConsultation && (
              tieneComprobante ? (
                <div style={{ marginBottom: 20, padding: 16, background: '#dcfce7', borderRadius: 12, border: '1.5px solid #22c55e', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 8 }}>
                    ✅ ¡Comprobante recibido!
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#166534', lineHeight: 1.5 }}>
                    Tu reserva será verificada en las <strong>próximas horas</strong>. Te notificaremos cuando sea confirmada.
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: 20, padding: 16, background: '#fef3c7', borderRadius: 12, border: '1.5px solid #f59e0b', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 8 }}>
                    ⏳ ¡Sin comprobante!
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>
                    Puedes enviar tu comprobante de pago <strong>AHORA</strong> por WhatsApp o <strong>MÁS TARDE</strong> cuando realices el pago. Tu reserva se verificará una vez confirmado el abono.
                  </p>
                </div>
              )
            )}

            {reservaCreada && (
              <button 
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (!printWin) return;
                  const itemsHtml = cart.map(item => [
                    '<tr>',
                    '<td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px">', item.qty, 'x</td>',
                    '<td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px">', item.name, '</td>',
                    '<td style="padding:4px 8px;border-bottom:1px dashed #ddd;font-size:12px;text-align:right">$', (item.price * item.qty).toFixed(2), '</td>',
                    '</tr>'
                  ].join('')).join('');
                  const abonoCalc = mode === 'reserva' && reservaTipo === 'con_abono' ? (montoAbono || 0) : 0;
                  const storeName = settings?.storeName || 'PAN E';
                  const printHtml = [
                    '<html><head><title>Reserva ', reservaCreada.id, '</title>',
                    '<style>',
                    'body{font-family:Courier New,monospace;padding:20px;max-width:320px;margin:auto}',
                    'h1{font-size:18px;text-align:center;margin:0}',
                    'h2{font-size:14px;text-align:center;margin:4px 0 16px;color:#666}',
                    '.divider{border-top:1px dashed #000;margin:12px 0}',
                    'table{width:100%;border-collapse:collapse}',
                    '.total{font-size:16px;font-weight:bold;text-align:right;margin-top:8px}',
                    '.info{font-size:11px;color:#555;margin:4px 0}',
                    '.footer{text-align:center;font-size:11px;color:#888;margin-top:16px;border-top:1px dashed #000;padding-top:12px}',
                    '</style></head><body>',
                    '<h1>', storeName, '</h1>',
                    '<h2>', isConsultation ? 'CONSULTA' : 'RESERVA', '</h2>',
                    '<div class="info"><strong>ID:</strong> ', reservaCreada.id, '</div>',
                    '<div class="info"><strong>Cliente:</strong> ', formData.nombre, '</div>',
                    '<div class="info"><strong>Tel:</strong> ', formData.telefono, '</div>',
                    '<div class="info"><strong>Dirección:</strong> ', formData.direccion || '\u2014', '</div>',
                    '<div class="info"><strong>Envío:</strong> ', formData.envio || '\u2014', '</div>',
                    '<div class="divider"></div>',
                    '<table>', itemsHtml, '</table>',
                    '<div class="divider"></div>',
                    '<div class="total">Total: $', total.toFixed(2), '</div>',
                    !isConsultation ? '<div class="info"><strong>Abono:</strong> $' + abonoCalc.toFixed(2) + '</div><div class="info"><strong>Saldo:</strong> $' + (total - abonoCalc).toFixed(2) + '</div>' : '',
                    '<div class="footer">¡Gracias por tu reserva!</div>',
                    '<script>window.print();window.close();</script>',
                    '</body></html>'
                  ].join('');
                  printWin.document.write(printHtml);
                  printWin.document.close();
                }}
                style={{ width: '100%', padding: 14, background: '#1a1a1a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
              >🖨️ Imprimir</button>
            )}

            <button onClick={onClose} style={{ width: '100%', padding: 14, background: '#25D366', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
