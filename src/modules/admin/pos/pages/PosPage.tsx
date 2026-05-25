import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../../../../store'
import { useAdminStore } from '../../../../store/adminStore'
import { DirectSale, DirectSaleItem, Reserva, MetodoPago, Product, THEME_PRESETS, ThemeType } from '../../../../types'

interface CartItem {
  product: Product
  quantity: number
}

type TempSaleItem = {
  productId: string
  productName: string
  productCode?: string
  quantity: number
  price: number
}

export default function PosPage() {
  const settings = useStore(state => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  
  const allProducts = useStore(state => state.products)
  const categories = useStore(state => state.categories)
  const clientes = useAdminStore(state => state.clientes)
  const addDirectSale = useStore(state => state.addDirectSale)
  const addReserva = useStore(state => state.addReserva)
  const directSales = useStore(state => state.directSales)
  const reservas = useStore(state => state.reservas)

  const products = useMemo(() => 
    allProducts.filter(p => p.status === 'active' && p.stock > 0), 
    [allProducts]
  )

  const [isSaleActive, setIsSaleActive] = useState(false)
  const [saleType, setSaleType] = useState<'directo' | 'reservado' | 'abonado'>('directo')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('todas')
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<DirectSale | null>(null)
  const [lastReserva, setLastReserva] = useState<Reserva | null>(null)
  const [transferImage, setTransferImage] = useState<string>('')
  const [cardLast4, setCardLast4] = useState('')
  const [cardAutori, setCardAutori] = useState('')
  const [generarFactura, setGenerarFactura] = useState(true)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [conAbono, setConAbono] = useState(false)
  const [abonoMonto, setAbonoMonto] = useState('')

  // Sincronizar abonoMonto → montoRecibido cuando es con abono y método efectivo
  useEffect(() => {
    if (conAbono && abonoMonto && metodoPago === 'efectivo') {
      setMontoRecibido(abonoMonto)
    }
  }, [conAbono, abonoMonto, metodoPago])

  const startNewSale = (type: 'directo' | 'reservado' | 'abonado' = 'directo', conAbonoInicial = false) => {
    setSaleType(type)
    setConAbono(conAbonoInicial && type !== 'directo')
    setCart([])
    setSelectedClient('')
    setClientSearch('')
    setMetodoPago('efectivo')
    setMontoRecibido(conAbonoInicial ? '' : '')
    setAbonoMonto('')
    setTransferImage('')
    setCardLast4('')
    setCardAutori('')
    setGenerarFactura(true)
    setShowReceipt(false)
    setLastOrder(null)
    setErrors({})
    setIsSaleActive(true)
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'todas' || p.category === selectedCategory
    const searchLower = searchProduct.toLowerCase().trim()
    const matchesSearch = !searchProduct || 
      p.name.toLowerCase().includes(searchLower) ||
      (p.codigo && p.codigo.toLowerCase().includes(searchLower)) ||
      p.id.toLowerCase().includes(searchLower) ||
      (p.modelo && p.modelo.toLowerCase().includes(searchLower)) ||
      (p.color && p.color.toLowerCase().includes(searchLower))
    return matchesCategory && matchesSearch
  })

  const filteredClientes = clientes.filter(c => {
    const search = clientSearch.toLowerCase().trim()
    return c.nombre.toLowerCase().includes(search) ||
      c.telefono.includes(search) ||
      (c.documento && c.documento.toLowerCase().includes(search))
  })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ))
  }

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.en_liquidacion && item.product.precio_liquidacion
      ? item.product.precio_liquidacion
      : item.product.price
    return sum + (price * item.quantity)
  }, 0)

  const costoEnvio = settings?.costo_envio ?? 5
  const total = subtotal + costoEnvio

  const selectedClientData = clientes.find(c => c.id === selectedClient)

  const cambio = montoRecibido ? parseFloat(montoRecibido) - total : 0

  const handleCompleteSale = () => {
    const newErrors: {[key: string]: string} = {}

    if (cart.length === 0) {
      newErrors.carrito = 'Agrega productos al carrito'
    }
    if (!selectedClient) {
      newErrors.cliente = 'Selecciona un cliente'
    }
    const requierePago = saleType !== 'reservado' || conAbono
    if (requierePago) {
      if (metodoPago === 'efectivo') {
        if (saleType === 'directo') {
          if (!montoRecibido || parseFloat(montoRecibido) < total) {
            newErrors.monto = `El monto recibido debe ser al menos $${total.toFixed(2)} (total de la venta)`
          }
        } else {
          const minRecibido = total > 45 ? Math.ceil(total * 0.2) : 5
          if (!montoRecibido || parseFloat(montoRecibido) < minRecibido) {
            newErrors.monto = `El monto recibido mínimo es $${minRecibido}`
          }
        }
      }
      if (metodoPago === 'transferencia' && !transferImage) {
        newErrors.transferencia = 'Sube el comprobante de transferencia'
      }
      if (metodoPago === 'tarjeta') {
        if (!cardLast4 || cardLast4.length !== 4) {
          newErrors.tarjeta = 'Ingresa los 4 dígitos de la tarjeta'
        }
        if (!cardAutori) {
          newErrors.autorizacion = 'Ingresa el código de autorización'
        }
      }
    }

    if (conAbono && (!abonoMonto || parseFloat(abonoMonto) <= 0)) {
      newErrors.abono = 'Ingresa el monto del abono'
    }
    if (conAbono && parseFloat(abonoMonto) > total) {
      newErrors.abono = 'El abono no puede ser mayor al total'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    const saleItems: TempSaleItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productCode: item.product.codigo || '',
      quantity: item.quantity,
      price: item.product.en_liquidacion && item.product.precio_liquidacion
        ? item.product.precio_liquidacion
        : item.product.price
    }))

    const codigo = `PED-${Date.now()}`
    const fecha = new Date().toISOString().split('T')[0]

    if (saleType === 'directo') {
      const newSale: DirectSale = {
        id: codigo,
        cliente: selectedClientData?.nombre || 'Cliente mostrador',
        clienteId: selectedClient || undefined,
        email: selectedClientData?.email || '',
        telefono: selectedClientData?.telefono || '',
        direccion: selectedClientData?.direccion || '',
        ciudad: selectedClientData?.ciudad || '',
        items: saleItems,
        monto: total,
        estado: 'completado',
        fecha,
        metodo_pago: metodoPago,
        monto_pagado: total,
        cambio: cambio > 0 ? cambio : undefined,
        transferencia_imagen: metodoPago === 'transferencia' ? transferImage : undefined,
        tarjeta_last4: metodoPago === 'tarjeta' ? cardLast4 : undefined,
        tarjeta_autori: metodoPago === 'tarjeta' ? cardAutori : undefined,
        factura_generada: generarFactura,
      }
      console.log("Guardando venta en direct_sales");
      addDirectSale(newSale)
      setLastOrder(newSale)
    } else {
      const montoAbono = conAbono && abonoMonto ? parseFloat(abonoMonto) : 0
      const itemsReserva = saleItems.map(i => ({
        id: '',
        reserva_id: codigo,
        producto_id: i.productId,
        producto_nombre: i.productName,
        cantidad: i.quantity,
        precio_unitario: i.price,
        subtotal: i.price * i.quantity,
      }))
      const newReserva: Reserva = {
        id: codigo,
        codigo,
        cliente_id: selectedClient || '',
        cliente_nombre: selectedClientData?.nombre || 'Cliente mostrador',
        cliente_telefono: selectedClientData?.telefono || '',
        cliente_cedula: selectedClientData?.documento || '',
        cliente_ciudad: selectedClientData?.ciudad || '',
        cliente_direccion: selectedClientData?.direccion || '',
        cliente_email: selectedClientData?.email || '',
        estado_reserva: conAbono ? 'abonado' : 'pendiente',
        total,
        abono: montoAbono,
        saldo: total - montoAbono,
        comprobante_url: metodoPago === 'transferencia' ? transferImage : null,
        fecha_reserva: fecha,
        fecha_limite_abono: null,
        fecha_limite_pago: null,
        notas_admin: null,
        whatsapp_revisado: false,
        comprobante_verificado: false,
        abono_confirmado: false,
        origen: 'pos',
        items: itemsReserva,
        abonos: [],
      }
      console.log("Guardando reserva POS en reservations, origen: pos");
      addReserva(newReserva)
      setLastReserva(newReserva)
      ;(async () => {
        const { dataService } = await import('../../../../services/dataService')
        try {
          const saved = await dataService.createReserva(newReserva)
          console.log("Reserva POS guardada en Supabase:", saved)
        } catch (err) {
          console.error("Error guardando reserva POS en Supabase:", err)
        }
      })()
    }
    setShowReceipt(true)
  }

  const handleNewSale = () => {
    setCart([])
    setSelectedClient('')
    setClientSearch('')
    setMetodoPago('efectivo')
    setMontoRecibido('')
    setShowReceipt(false)
    setLastOrder(null)
    setLastReserva(null)
    setIsSaleActive(false)
  }

  const tc = themeColors;

  const receiptSale = lastOrder
  const receiptReserva = lastReserva

  if (showReceipt && (receiptSale || receiptReserva)) {
    const displayId = receiptSale?.id || receiptReserva?.codigo || ''
    const displayItems = receiptSale?.items || receiptReserva?.items?.map(i => ({ productName: i.producto_nombre || '', quantity: i.cantidad, price: i.precio_unitario })) || []
    const displayTotal = receiptSale?.monto || receiptReserva?.total || 0
    const isSale = !!receiptSale
    return (
      <div style={{ animation: 'fadeUp .4s ease' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }} className="print-container">
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, color: '#000' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{isSale ? 'Venta Completada' : 'Reserva Registrada'}</h2>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: 12 }}>{displayId}</p>
            </div>

            <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '12px 0', marginBottom: 12 }}>
              {displayItems.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{item.quantity}x {item.productName}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
              <span>Subtotal</span>
              <span>${(displayTotal - costoEnvio).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
              <span>Envío</span>
              <span>${costoEnvio.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              <span>TOTAL</span>
              <span>${displayTotal.toFixed(2)}</span>
            </div>

            {receiptSale?.metodo_pago && (
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
                <div><strong>Método:</strong> {receiptSale.metodo_pago === 'efectivo' ? 'Efectivo' : receiptSale.metodo_pago === 'transferencia' ? 'Transferencia' : 'Tarjeta'}</div>
                {receiptSale.metodo_pago === 'tarjeta' && receiptSale.tarjeta_last4 && (
                  <div><strong>Tarjeta:</strong> **** {receiptSale.tarjeta_last4}</div>
                )}
                {receiptSale.metodo_pago === 'tarjeta' && receiptSale.tarjeta_autori && (
                  <div><strong>Autorización:</strong> {receiptSale.tarjeta_autori}</div>
                )}
                {receiptSale.metodo_pago === 'transferencia' && receiptSale.transferencia_imagen && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Comprobante:</strong>
                    <img src={receiptSale.transferencia_imagen} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4, marginTop: 4 }} />
                  </div>
                )}
              </div>
            )}

            {receiptReserva && (
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8, padding: 8, background: '#fef3c7', borderRadius: 6 }}>
                <div><strong>Abono:</strong> ${receiptReserva.abono.toFixed(2)}</div>
                <div><strong>Saldo:</strong> ${receiptReserva.saldo.toFixed(2)}</div>
                <div><strong>Estado:</strong> {receiptReserva.estado_reserva}</div>
              </div>
            )}

            {receiptSale && receiptSale.monto_pagado && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                  <span>Recibido</span>
                  <span>${receiptSale.monto_pagado.toFixed(2)}</span>
                </div>
                {receiptSale.cambio && receiptSale.cambio > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                    <span>Cambio</span>
                    <span>${receiptSale.cambio.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              {receiptSale?.factura_generada && (
                <div style={{ padding: 12, background: '#22c55e22', borderRadius: 8, marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#22c55e', margin: 0, fontWeight: 600 }}>✓ FACTURA GENERADA</p>
                  <p style={{ fontSize: 10, color: '#666', margin: '4px 0 0' }}>{displayId}</p>
                </div>
              )}
              {!isSale && (
                <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>⚠️ IMPORTANTE</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#78350f', lineHeight: 1.4 }}>
                    El cliente tiene <strong>3 días hábiles</strong> para cancelar el valor total. De lo contrario, perderá su abono.
                  </p>
                </div>
              )}
              <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Gracias por su compra</p>
              <p style={{ fontSize: 10, color: '#ccc', margin: '4px 0 0' }}>{new Date().toLocaleString('es-CO')}</p>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                width: '100%', padding: 12, marginTop: 16, background: isEjecutivo ? '#fbbf24' : '#000', border: 'none',
                borderRadius: 8, color: isEjecutivo ? '#000000' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              🖨️ Imprimir Factura
            </button>
          </div>

          <button
            onClick={handleNewSale}
            style={{
              width: '100%', padding: 14, marginTop: 16, background: isEjecutivo ? '#000000' : tc.primary, border: 'none',
              borderRadius: 12, color: isEjecutivo ? '#ffffff' : '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Nueva Venta
          </button>
        </div>
      </div>
    )
  }

  if (!isSaleActive) {
    return (
      <div style={{ animation: 'fadeUp .4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="40" height="40" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: tc.text }}>Punto de Venta</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: tc.textMuted }}>Gestiona tus ventas de forma rápida y eficiente</p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => startNewSale('directo')}
              style={{
                padding: '14px 24px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none',
                borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}
            >
              💵 Venta Directa
            </button>
            <button
              onClick={() => startNewSale('reservado', true)}
              style={{
                padding: '14px 24px', background: isEjecutivo ? '#000000' : 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none',
                borderRadius: 12, color: isEjecutivo ? '#ffffff' : '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}
            >
              📦 Reserva
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 40 }}>
            <div style={{ padding: 20, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 12, color: tc.textMuted }}>Ventas Hoy</div>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const ventasHoy = directSales.filter(o => o.estado === 'completado' && o.fecha === today);
                const totalVentasHoy = ventasHoy.reduce((sum, o) => sum + o.monto, 0);
                return (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, color: tc.text }}>${totalVentasHoy.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 2 }}>{ventasHoy.length} venta{ventasHoy.length !== 1 ? 's' : ''}</div>
                  </>
                );
              })()}
            </div>
            <div style={{ padding: 20, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 12, color: tc.textMuted }}>Reservas Hoy</div>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const reservasHoy = reservas.filter(r => r.origen === 'pos' && r.fecha_reserva?.startsWith(today));
                const pendientes = reservasHoy.filter(r => r.estado_reserva === 'pendiente').length;
                const conAbono = reservasHoy.filter(r => r.estado_reserva === 'abonado').length;
                return (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, color: tc.text }}>{reservasHoy.length}</div>
                    <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 2 }}>{pendientes} pendiente{pendientes !== 1 ? 's' : ''} · {conAbono} con abono</div>
                  </>
                );
              })()}
            </div>
            <div style={{ padding: 20, background: tc.surface, borderRadius: 12, border: `1px solid ${tc.border}` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 12, color: tc.textMuted }}>Clientes</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: tc.text }}>{clientes.length}</div>
              <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 2 }}>registrados</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .pos-content { flex-direction: row !important; overflow: hidden !important; }
          .pos-products { flex: 1 !important; overflow: auto !important; }
          .pos-cart { width: 380px !important; max-height: none !important; flex: none !important; overflow: auto !important; }
        }
        @media (max-width: 767px) {
          .pos-layout { overflow: auto !important; height: auto !important; min-height: calc(100vh - 120px) !important; }
          .pos-products { max-height: 50vh !important; overflow: auto !important; }
          .pos-cart { max-height: none !important; overflow: auto !important; }
        }
      `}</style>
      <div className="pos-layout" style={{ 
      animation: 'fadeUp .4s ease', 
      display: 'flex', 
      flexDirection: 'column',
      gap: 16, 
      height: 'calc(100vh - 120px)',
      padding: 16,
      overflow: 'hidden'
    }}>
      {/* Header tipo de venta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setIsSaleActive(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc.textMuted, fontSize: 20 }}
          >←</button>
          <span style={{ fontSize: 14, color: tc.textMuted, fontWeight: 500 }}>Nueva Venta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saleType === 'reservado' && (
            <div style={{ display: 'flex', background: tc.background, borderRadius: 20, padding: 2, border: `1px solid ${tc.border}` }}>
              <button
                onClick={() => setConAbono(false)}
                style={{
                  padding: '4px 12px', borderRadius: 18, border: 'none',
                  background: !conAbono ? '#f59e0b' : 'transparent',
                  color: !conAbono ? '#fff' : tc.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}
              >Sin Abono</button>
              <button
                onClick={() => setConAbono(true)}
                style={{
                  padding: '4px 12px', borderRadius: 18, border: 'none',
                  background: conAbono ? '#06b6d4' : 'transparent',
                  color: conAbono ? '#fff' : tc.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}
              >Con Abono</button>
            </div>
          )}
          <div style={{ 
            padding: '8px 16px', 
            borderRadius: 20, 
            background: saleType === 'directo' ? '#22c55e22' : (!conAbono ? '#f59e0b22' : '#06b6d422'),
            color: saleType === 'directo' ? '#22c55e' : (!conAbono ? '#f59e0b' : '#06b6d4'),
            fontSize: 13,
            fontWeight: 600
          }}>
            {saleType === 'directo' ? '💵 Venta Directa' : (!conAbono ? '📦 Reserva' : '💳 Reserva + Abono')}
          </div>
        </div>
      </div>
        
      {/* Contenido principal */}
      <div className="pos-content" style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, flexDirection: 'column', overflow: 'hidden' }}>
        {/* Panel Izquierdo - Productos */}
        <div className="pos-products" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0, background: tc.surface, borderRadius: 16, padding: 16, maxHeight: 'calc(100vh - 200px)' }}>
          {/* Buscador */}
          <div style={{ marginBottom: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#666', pointerEvents: 'none', zIndex: 1 }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px', background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: 12, color: '#000000', fontSize: 15, outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Categoría */}
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: 10, color: '#000000', fontSize: 13, outline: 'none'
              }}
            >
              <option value="todas">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Productos Grid */}
          <div style={{
            flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12, alignContent: 'start'
          }}>
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: tc.textMuted }}>
                <span style={{ fontSize: 32 }}>🔍</span>
                <p style={{ margin: '12px 0 0' }}>No se encontraron productos</p>
                <p style={{ fontSize: 12, margin: '4px 0 0' }}>Busca por nombre o código</p>
              </div>
            ) : filteredProducts.map(product => {
              const price = product.en_liquidacion && product.precio_liquidacion
                ? product.precio_liquidacion
                : product.price
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12,
                    cursor: 'pointer', transition: 'all .2s'
                  }}
                >
                  <div style={{
                    width: '100%', height: 80, background: '#f8fafc', borderRadius: 8, marginBottom: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 28 }}>🥖</span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </h4>
                  {product.codigo && (
                    <span style={{ fontSize: 9, color: '#64748b', background: '#f1f5f9', padding: '2px 4px', borderRadius: 3 }}>
                      {product.codigo}
                    </span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>${price.toFixed(2)}</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>Stock: {product.stock}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel Derecho - Carrito */}
        <div className="pos-cart" style={{ width: '100%', minWidth: 0, background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${tc.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: tc.text }}>Punto de Venta</h3>
          
          {/* Selector de Cliente */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o cédula..."
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
              onFocus={() => setShowClientDropdown(true)}
              style={{
                width: '100%', padding: '10px 12px', background: tc.background, border: `1px solid ${errors.cliente ? tc.error : tc.border}`,
                borderRadius: 8, color: tc.text, fontSize: 12, outline: 'none'
              }}
            />
            {showClientDropdown && clientSearch && filteredClientes.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, background: tc.surface,
                border: `1px solid ${tc.border}`, borderRadius: 8, maxHeight: 150, overflow: 'auto', zIndex: 10
              }}>
                {filteredClientes.slice(0, 5).map(cliente => (
                  <div
                    key={cliente.id}
                    onClick={() => { setSelectedClient(cliente.id); setClientSearch(cliente.nombre); setShowClientDropdown(false); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${tc.border}` }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 500, color: tc.text }}>{cliente.nombre}</div>
                    <div style={{ fontSize: 10, color: tc.textMuted }}>{cliente.telefono}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.cliente && (
            <p style={{ color: tc.error, fontSize: 10, margin: '4px 0 0' }}>{errors.cliente}</p>
          )}
          {selectedClient && (
            <div style={{ marginTop: 8, padding: 8, background: tc.background, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: tc.textMuted }}>Cliente seleccionado:</div>
              <div style={{ fontSize: 12, color: tc.text, fontWeight: 500 }}>{selectedClientData?.nombre}</div>
            </div>
          )}
        </div>

        {/* Carrito */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0 }}>
          {errors.carrito && (
            <div style={{ padding: 12, background: tc.error + '22', borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
              <span style={{ color: tc.error, fontSize: 12 }}>{errors.carrito}</span>
            </div>
          )}
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: tc.textMuted, padding: 40, fontSize: 13 }}>
              Agrega productos al carrito
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => {
                const price = item.product.en_liquidacion && item.product.precio_liquidacion
                  ? item.product.precio_liquidacion
                  : item.product.price
                return (
                  <div key={item.product.id} style={{ padding: 12, background: tc.background, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                        <div style={{ fontSize: 11, color: tc.primary }}>${price.toFixed(2)} c/u</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        style={{ background: 'none', border: 'none', color: tc.error, cursor: 'pointer', fontSize: 18, padding: '0 4px', marginLeft: 8, flexShrink: 0 }}
                      >✕</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: tc.surface, border: `1px solid ${tc.border}`, color: tc.text, cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <span style={{ fontSize: 15, fontWeight: 600, color: tc.text, minWidth: 28, textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: tc.surface, border: `1px solid ${tc.border}`, color: tc.text, cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: tc.text }}>${(price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

          {/* Total y Pago */}
        <div style={{ padding: 16, borderTop: `1px solid ${tc.border}`, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: tc.textMuted, fontSize: 13 }}>Total</span>
            <span style={{ color: tc.text, fontSize: 20, fontWeight: 700 }}>${total.toFixed(2)}</span>
          </div>

          {conAbono && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: tc.textMuted, display: 'block', marginBottom: 6 }}>VALOR DEL ABONO *</label>
              <input
                type="number"
                value={abonoMonto}
                onChange={e => setAbonoMonto(e.target.value)}
                placeholder={`Monto del abono (máx: $${total.toFixed(2)})`}
                style={{
                  width: '100%', padding: '10px 12px', background: tc.background, border: `1px solid ${errors.abono ? tc.error : tc.border}`,
                  borderRadius: 8, color: tc.text, fontSize: 14, outline: 'none'
                }}
              />
              {errors.abono && (
                <p style={{ color: tc.error, fontSize: 10, margin: '4px 0 0' }}>{errors.abono}</p>
              )}
              {abonoMonto && !errors.abono && (
                <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: '#4ade80' }}>Abono: ${parseFloat(abonoMonto).toFixed(2)}</span>
                  <span style={{ color: tc.textMuted }}>
                    Saldo pendiente: ${(total - parseFloat(abonoMonto)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {saleType === 'directo' || conAbono ? (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: tc.textMuted, display: 'block', marginBottom: 6 }}>MÉTODO DE PAGO *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['efectivo', 'transferencia', 'tarjeta'] as MetodoPago[]).map(mp => (
                <button
                  key={mp}
                  onClick={() => setMetodoPago(mp)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${metodoPago === mp ? tc.primary : tc.border}`,
                    background: metodoPago === mp ? tc.primary + '22' : 'transparent',
                    color: metodoPago === mp ? tc.primary : tc.textMuted, fontSize: 11, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {mp === 'efectivo' ? '💵' : mp === 'transferencia' ? '📱' : '💳'} {mp}
                </button>
              ))}
            </div>
          </div>
          ) : null}

          {metodoPago === 'efectivo' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: tc.textMuted, display: 'block', marginBottom: 6 }}>MONTO RECIBIDO *</label>
              <div style={{ fontSize: 9, color: tc.textMuted, marginBottom: 4 }}>
                Mínimo: ${total > 45 ? Math.ceil(total * 0.2) : 5}
              </div>
              <input
                type="number"
                value={montoRecibido}
                onChange={e => setMontoRecibido(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', padding: '10px 12px', background: tc.background, border: `1px solid ${errors.monto ? tc.error : tc.border}`,
                  borderRadius: 8, color: tc.text, fontSize: 14, outline: 'none'
                }}
              />
              {errors.monto ? (
                <p style={{ color: tc.error, fontSize: 10, margin: '4px 0 0' }}>{errors.monto}</p>
              ) : montoRecibido && parseFloat(montoRecibido) > total ? (
                <div style={{ marginTop: 6, fontSize: 12, color: tc.success }}>
                  Cambio: ${cambio.toFixed(2)}
                </div>
              ) : montoRecibido && parseFloat(montoRecibido) < total ? (
                <div style={{ marginTop: 6, fontSize: 12, color: tc.warning }}>
                  Saldo pendiente: ${(total - parseFloat(montoRecibido)).toFixed(2)}
                </div>
              ) : null}
            </div>
          )}

          {metodoPago === 'transferencia' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: tc.textMuted, display: 'block', marginBottom: 6 }}>COMPROBANTE DE TRANSFERENCIA *</label>
              {transferImage ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={transferImage} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8 }} />
                  <button 
                    onClick={() => setTransferImage('')}
                    style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}
                  >×</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, border: `2px dashed ${errors.transferencia ? tc.error : tc.border}`, borderRadius: 8, cursor: 'pointer', background: tc.background }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => setTransferImage(reader.result as string)
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <span style={{ color: tc.textMuted, fontSize: 12 }}>📷 Subir imagen del comprobante</span>
                </label>
              )}
              {errors.transferencia && (
                <p style={{ color: tc.error, fontSize: 10, margin: '4px 0 0' }}>{errors.transferencia}</p>
              )}
            </div>
          )}

          {metodoPago === 'tarjeta' && (
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: tc.textMuted, display: 'block', marginBottom: 6 }}>ÚLTIMOS 4 DÍGITOS *</label>
                <input
                  type="text"
                  value={cardLast4}
                  onChange={e => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  maxLength={4}
                  style={{
                    width: '100%', padding: '10px 12px', background: tc.background, border: `1px solid ${errors.tarjeta ? tc.error : tc.border}`,
                    borderRadius: 8, color: tc.text, fontSize: 14, outline: 'none'
                  }}
                />
                {errors.tarjeta && (
                  <p style={{ color: tc.error, fontSize: 10, margin: '4px 0 0' }}>{errors.tarjeta}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 10, color: tc.textMuted, display: 'block', marginBottom: 6 }}>CÓDIGO AUTORIZACIÓN *</label>
                <input
                  type="text"
                  value={cardAutori}
                  onChange={e => setCardAutori(e.target.value)}
                  placeholder="Código de autorización"
                  style={{
                    width: '100%', padding: '10px 12px', background: tc.background, border: `1px solid ${errors.autorizacion ? tc.error : tc.border}`,
                    borderRadius: 8, color: tc.text, fontSize: 14, outline: 'none'
                  }}
                />
                {errors.autorizacion && (
                  <p style={{ color: tc.error, fontSize: 10, margin: '4px 0 0' }}>{errors.autorizacion}</p>
                )}
              </div>
            </div>
          )}

          {saleType !== 'reservado' || conAbono ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={generarFactura} 
                onChange={e => setGenerarFactura(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 12, color: tc.textMuted }}>📄 Generar factura</span>
            </label>
          ) : null}

          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || !selectedClient || (conAbono && !abonoMonto) || ( (saleType === 'directo' || conAbono) && ( (metodoPago === 'transferencia' && !transferImage) || (metodoPago === 'tarjeta' && (!cardLast4 || !cardAutori)) ) )}
            style={{
              width: '100%', padding: 14, background: cart.length === 0 || !selectedClient ? tc.border : isEjecutivo ? '#000000' : (saleType === 'directo' ? tc.primary : (!conAbono ? '#f59e0b' : '#06b6d4')),
              border: 'none', borderRadius: 10, color: cart.length === 0 || !selectedClient ? tc.textMuted : (isEjecutivo ? '#ffffff' : '#000'),
              fontSize: 14, fontWeight: 600, cursor: cart.length === 0 || !selectedClient ? 'not-allowed' : 'pointer'
            }}
          >
            {saleType === 'directo' ? 'Completar Venta' : (!conAbono ? 'Confirmar Reserva' : 'Registrar Abono')}
          </button>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}
