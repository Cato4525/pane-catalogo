// ============================================================
// ADMIN CAMPAIGNS PAGE v2
// Gestión completa de campañas comerciales con motor v2.
// Independiente del CRUD existente en CampaniasPage.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../../store'
import { THEME_PRESETS, ThemeType, CatalogoSeccion } from '../../../../types'
import {
  MktCampania, MktCampaniaRegla, MktCampaniaFiltro,
  MktTipoCampania, MktCategoriaCampania, MktEstadoCampania,
  MKT_TIPO_LABELS, MKT_CATEGORIA_LABELS, MKT_CATEGORIA_COLORS,
  MKT_TIPO_COLORS, PromotionRules, ColorPair,
  ALL_COLOR_PAIRS, COLOR_PAIR_LABELS,
} from '../../../../types/marketing'
import { mktFetchCampanias, mktCrearCampania, mktActualizarCampania, mktEliminarCampania, mktCambiarEstado } from '../../../../services/campaignService'
import { fetchCatalogos } from '../../../../services/catalogosService'

export default function MarketingCampaignsPage() {
  const settings = useStore(s => s.settings)
  const theme = (settings?.theme || 'moderno') as ThemeType
  const tc = THEME_PRESETS[theme] || THEME_PRESETS.moderno

  const [campanias, setCampanias] = useState<MktCampania[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MktCampania | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const navigate = useNavigate()
  const [catalogos, setCatalogos] = useState<CatalogoSeccion[]>([])

  useEffect(() => {
    fetchCatalogos().then(setCatalogos)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await mktFetchCampanias({
      categoria: filtroCategoria as MktCategoriaCampania | undefined,
      estado: filtroEstado as MktEstadoCampania | undefined,
    })
    setCampanias(data)
    setLoading(false)
  }, [filtroCategoria, filtroEstado])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña?')) return
    await mktEliminarCampania(id)
    load()
  }

  const handleToggleEstado = async (c: MktCampania) => {
    if (c.estado === 'inactivo') {
      const ahora = new Date()
      await mktActualizarCampania(c.id, {
        estado: 'activo',
        fecha_inicio: ahora.toISOString(),
        fecha_fin: c.fecha_fin && new Date(c.fecha_fin) > ahora ? c.fecha_fin : new Date(ahora.getTime() + 30*86400000).toISOString(),
      })
    } else {
      await mktCambiarEstado(c.id, 'inactivo')
    }
    load()
  }

  const handleSave = async (data: any) => {
    if (editing) {
      await mktActualizarCampania(editing.id, data)
    } else {
      await mktCrearCampania(data)
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: tc.text }}>Marketing</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: tc.textMuted }}>Campañas comerciales, promociones y descuentos</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: tc.primary, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          + Nueva Campaña
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${tc.border}`, fontSize: 13, background: '#fff' }}>
          <option value="">Todas las categorías</option>
          {Object.entries(MKT_CATEGORIA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${tc.border}`, fontSize: 13, background: '#fff' }}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="borrador">Borrador</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: tc.textMuted }}>Cargando...</div>
      ) : campanias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: tc.textMuted }}>No hay campañas. Crea la primera.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {campanias.map(c => {
            const regla = c.reglas?.[0]
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', borderRadius: 12,
                background: c.estado === 'activo' ? '#fff' : '#f9fafb',
                border: `1px solid ${tc.border}`,
                opacity: c.estado === 'activo' ? 1 : 0.6,
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: MKT_CATEGORIA_COLORS[c.categoria] || MKT_TIPO_COLORS[c.tipo], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: tc.text }}>{c.nombre}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: (MKT_CATEGORIA_COLORS[c.categoria] || MKT_TIPO_COLORS[c.tipo]) + '20', color: MKT_CATEGORIA_COLORS[c.categoria] || MKT_TIPO_COLORS[c.tipo], fontWeight: 500 }}>
                      {MKT_CATEGORIA_LABELS[c.categoria] || MKT_TIPO_LABELS[c.tipo]}
                    </span>
                    {c.permite_acumulacion && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: '#f0fdf4', color: '#059669' }}>Acumulable</span>}
                    {c.es_exclusiva && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: '#fef2f2', color: '#ef4444' }}>Exclusiva</span>}
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: c.estado === 'activo' ? '#dcfce7' : '#f3f4f6', color: c.estado === 'activo' ? '#059669' : '#6b7280', fontWeight: 500 }}>
                      {c.estado}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: tc.textMuted, display: 'flex', gap: 16 }}>
                    {c.descripcion && <span>{c.descripcion}</span>}
                    {regla?.cantidad_minima ? <span>Min: {regla.cantidad_minima}</span> : null}
                    {regla?.precio_fijo ? <span>Precio: ${regla.precio_fijo.toFixed(2)}</span> : null}
                    {regla?.porcentaje ? <span>{regla.porcentaje}%</span> : null}
                    {c.categoria && <span style={{ color: MKT_CATEGORIA_COLORS[c.categoria] }}>{MKT_CATEGORIA_LABELS[c.categoria]}</span>}
                    {c.catalogo_id && <span>Catálogo asignado</span>}
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>Prioridad: {c.prioridad}</span>
                    {c.fecha_fin && <span>Vence: {new Date(c.fecha_fin).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => handleToggleEstado(c)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${c.estado === 'activo' ? '#ef4444' : '#22c55e'}`, background: 'transparent', color: c.estado === 'activo' ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                    {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => navigate(`/tienda/marketing/${c.id}`)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${tc.border}`, background: 'transparent', color: tc.text, cursor: 'pointer', fontSize: 12 }}>
                    Ver detalles
                  </button>
                  <button onClick={() => { setEditing(c); setShowForm(true) }}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${tc.border}`, background: 'transparent', color: tc.text, cursor: 'pointer', fontSize: 12 }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <MarketingCampaignForm
          campania={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
          themeColors={tc}
          catalogos={catalogos}
        />
      )}
    </div>
  )
}

// ============================================================
// FORMULARIO DE CAMPAÑA v3 — Diseño profesional por secciones
// ============================================================

type VisualPromoCard =
  | 'DESCUENTO_PORCENTUAL'
  | 'DESCUENTO_FIJO'
  | 'PRECIO_ESPECIAL'
  | 'COMPRA_X_LLEVA_Y'
  | 'DOS_X_UNO'
  | 'TRES_X_DOS'
  | 'PACK_PROMOCIONAL'
  | 'ENVIO_GRATIS'
  | 'COMBINACION_COLORES'

interface PromoCardDef {
  key: VisualPromoCard
  icon: string
  title: string
  desc: string
  categoria: MktCategoriaCampania
  tipo: MktTipoCampania
  badgeColor: string
}

const PROMO_CARDS: PromoCardDef[] = [
  { key: 'DESCUENTO_PORCENTUAL', icon: '🏷️', title: '% Descuento porcentual', desc: 'Porcentaje de descuento sobre el precio original', categoria: 'DESCUENTO', tipo: 'PORCENTAJE', badgeColor: '#3b82f6' },
  { key: 'DESCUENTO_FIJO', icon: '💵', title: '$ Descuento fijo', desc: 'Valor fijo de descuento en la compra', categoria: 'OFERTA', tipo: 'MONTO_FIJO', badgeColor: '#f59e0b' },
  { key: 'PRECIO_ESPECIAL', icon: '⭐', title: 'Precio especial', desc: 'Precio fijo reducido por grupo de productos', categoria: 'PROMOCION', tipo: 'PRECIO_FIJO', badgeColor: '#22c55e' },
  { key: 'COMPRA_X_LLEVA_Y', icon: '🎁', title: 'Compra X lleva Y', desc: 'Lleva productos gratis al comprar una cantidad', categoria: 'PROMOCION', tipo: 'COMPRA_X_LLEVA_Y', badgeColor: '#8b5cf6' },
  { key: 'DOS_X_UNO', icon: '2️⃣', title: '2x1', desc: 'Lleva 2 productos y paga solo 1', categoria: 'PROMOCION', tipo: 'COMPRA_X_LLEVA_Y', badgeColor: '#ec4899' },
  { key: 'TRES_X_DOS', icon: '3️⃣', title: '3x2', desc: 'Lleva 3 productos y paga solo 2', categoria: 'PROMOCION', tipo: 'COMPRA_X_LLEVA_Y', badgeColor: '#ec4899' },
  { key: 'PACK_PROMOCIONAL', icon: '📦', title: 'Pack promocional', desc: 'Precio especial por un conjunto de productos', categoria: 'PROMOCION', tipo: 'COMBO', badgeColor: '#06b6d4' },
  { key: 'ENVIO_GRATIS', icon: '🚚', title: 'Envío gratis', desc: 'Sin costo de envío al cumplir el monto mínimo', categoria: 'OFERTA', tipo: 'ENVIO_GRATIS', badgeColor: '#059669' },
  { key: 'COMBINACION_COLORES', icon: '🎨', title: 'Por combinación de colores', desc: 'Precio especial al combinar colores específicos', categoria: 'PROMOCION', tipo: 'PRECIO_FIJO', badgeColor: '#22c55e' },
]

function MarketingCampaignForm({ campania, onSave, onClose, themeColors: tc, catalogos }: {
  campania: MktCampania | null
  onSave: (data: any) => void
  onClose: () => void
  themeColors: any
  catalogos: CatalogoSeccion[]
}) {
  const regla = campania?.reglas?.[0]
  const reglaConfig = regla?.configuracion_json || {}

  const deriveCardFromCampania = (): VisualPromoCard => {
    if (!campania) return 'PRECIO_ESPECIAL'
    const c = campania.categoria, t = campania.tipo, cfg = reglaConfig
    if (t === 'PORCENTAJE') return 'DESCUENTO_PORCENTUAL'
    if (t === 'MONTO_FIJO') return 'DESCUENTO_FIJO'
    if (t === 'ENVIO_GRATIS') return 'ENVIO_GRATIS'
    if (t === 'COMBO') return 'PACK_PROMOCIONAL'
    if (t === 'COMPRA_X_LLEVA_Y') {
      if (cfg.aplica_cada === 2 && cfg.gratis === 1) return 'DOS_X_UNO'
      if (cfg.aplica_cada === 3 && cfg.gratis === 1) return 'TRES_X_DOS'
      return 'COMPRA_X_LLEVA_Y'
    }
    if (cfg.promotion_rules || cfg.parear_color_tipo) return 'COMBINACION_COLORES'
    return 'PRECIO_ESPECIAL'
  }

  const [nombre, setNombre] = useState(campania?.nombre || '')
  const [codigo, setCodigo] = useState(campania?.codigo || '')
  const [descripcion, setDescripcion] = useState(campania?.descripcion || '')
  const [estado, setEstado] = useState<MktEstadoCampania>(campania?.estado || 'activo')
  const [prioridad, setPrioridad] = useState(campania?.prioridad ?? 0)
  const [fechaInicio, setFechaInicio] = useState(campania?.fecha_inicio ? campania.fecha_inicio.slice(0, 16) : '')
  const [fechaFin, setFechaFin] = useState(campania?.fecha_fin ? campania.fecha_fin.slice(0, 16) : '')

  const [selectedCard, setSelectedCard] = useState<VisualPromoCard>(deriveCardFromCampania)
  const currentCard = PROMO_CARDS.find(c => c.key === selectedCard)!

  const [permiteAcumulacion, setPermiteAcumulacion] = useState(campania?.permite_acumulacion ?? true)
  const [esExclusiva, setEsExclusiva] = useState(campania?.es_exclusiva ?? false)
  const [catalogosExcluidos, setCatalogosExcluidos] = useState<string[]>(campania?.catalogos_excluidos || [])

  const [cantidadMinima, setCantidadMinima] = useState(regla?.cantidad_minima || 0)
  const [cantidadMaxima, setCantidadMaxima] = useState(regla?.cantidad_maxima || 0)
  const [montoMinimo, setMontoMinimo] = useState(regla?.monto_minimo || 0)
  const [porcentaje, setPorcentaje] = useState(regla?.porcentaje || 0)
  const [precioFijo, setPrecioFijo] = useState(regla?.precio_fijo || 0)
  const [descuentoFijo, setDescuentoFijo] = useState(regla?.descuento_fijo || 0)
  const [envioGratisBeneficio, setEnvioGratisBeneficio] = useState(regla?.envio_gratis || false)

  // --- Activation conditions ---
  const [activarCantMin, setActivarCantMin] = useState(regla?.cantidad_minima ? regla.cantidad_minima > 0 : false)
  const [activarMontoMin, setActivarMontoMin] = useState(regla?.monto_minimo ? regla.monto_minimo > 0 : false)
  const [activarCombColor, setActivarCombColor] = useState(!!(reglaConfig.promotion_rules || reglaConfig.parear_color_tipo))

  // --- Color combination rules ---
  const existingRules = reglaConfig.promotion_rules as PromotionRules | undefined
  const [colorCombinationMode, setColorCombinationMode] = useState<PromotionRules['colorCombinationMode']>(existingRules?.colorCombinationMode || 'different')
  const [allowedCombinations, setAllowedCombinations] = useState<ColorPair[]>(existingRules?.allowedCombinations || [])
  const [blockedCombinations, setBlockedCombinations] = useState<ColorPair[]>(existingRules?.blockedCombinations || [])

  const [saving, setSaving] = useState(false)

  const cardsConCantidad = ['PRECIO_ESPECIAL', 'COMBINACION_COLORES', 'COMPRA_X_LLEVA_Y', 'DOS_X_UNO', 'TRES_X_DOS', 'PACK_PROMOCIONAL']
  const cardsConPrecioFijo = ['PRECIO_ESPECIAL', 'COMBINACION_COLORES', 'PACK_PROMOCIONAL']
  const cardsConPorcentaje = ['DESCUENTO_PORCENTUAL']
  const cardsConDescuentoFijo = ['DESCUENTO_FIJO']
  const cardsConEnvioGratis = ['ENVIO_GRATIS']

  const needsCantidad = cardsConCantidad.includes(selectedCard)
  const needsPrecioFijo = cardsConPrecioFijo.includes(selectedCard)
  const needsPorcentaje = cardsConPorcentaje.includes(selectedCard)
  const needsDescuentoFijo = cardsConDescuentoFijo.includes(selectedCard)
  const needsEnvioGratis = cardsConEnvioGratis.includes(selectedCard)

  const toggleCustomPair = (pair: ColorPair) => {
    if (allowedCombinations.length > 0) {
      setAllowedCombinations(prev =>
        prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair]
      )
    } else {
      setBlockedCombinations(prev =>
        prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair]
      )
    }
  }

  const switchCustomMode = (useAllowed: boolean) => {
    if (useAllowed && allowedCombinations.length === 0) {
      setAllowedCombinations(ALL_COLOR_PAIRS.filter(p => !blockedCombinations.includes(p)))
      setBlockedCombinations([])
    } else if (!useAllowed && blockedCombinations.length === 0) {
      setBlockedCombinations(ALL_COLOR_PAIRS.filter(p => !allowedCombinations.includes(p)))
      setAllowedCombinations([])
    }
  }

  const preview = (() => {
    const lines: string[] = []
    lines.push(`Nombre: ${nombre || '—'}`)
    lines.push(`Tipo: ${currentCard.title}`)
    if (activarCombColor && currentCard.tipo !== 'ENVIO_GRATIS') {
      const modeLabels: Record<string, string> = {
        different: 'Colores diferentes (color+oscuro, color+negro)',
        same: 'Colores iguales (mismo grupo)',
        custom: `${allowedCombinations.length} combinaciones permitidas`,
      }
      lines.push(`Combinación: ${modeLabels[colorCombinationMode] || '—'}`)
    }
    if (activarCantMin && cantidadMinima > 0) lines.push(`Mínimo: ${cantidadMinima} producto(s)`)
    if (activarMontoMin && montoMinimo > 0) lines.push(`Compra mín: $${montoMinimo.toFixed(2)}`)
    if (needsPorcentaje) lines.push(`Beneficio: ${porcentaje}% de descuento`)
    else if (needsDescuentoFijo) lines.push(`Beneficio: $${descuentoFijo.toFixed(2)} de descuento`)
    else if (needsPrecioFijo) lines.push(`Beneficio: Precio especial $${precioFijo.toFixed(2)}`)
    else if (needsEnvioGratis) lines.push(`Beneficio: Envío gratis${montoMinimo > 0 ? ` (mín $${montoMinimo.toFixed(2)})` : ''}`)
    lines.push(`Estado: ${estado === 'activo' ? '✅ Activa' : estado === 'inactivo' ? '❌ Inactiva' : '📝 Borrador'}`)
    return lines
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)

    const configJson: Record<string, any> = {
      ...(activarCombColor ? {
        parear_color_tipo: true,
        promotion_rules: {
          colorCombinationMode,
          allowedCombinations: colorCombinationMode === 'custom' ? allowedCombinations : [],
          blockedCombinations: colorCombinationMode === 'custom' ? blockedCombinations : [],
        } satisfies PromotionRules,
      } : {}),
    }

    if (selectedCard === 'DOS_X_UNO') {
      configJson.aplica_cada = 2
      configJson.gratis = 1
    } else if (selectedCard === 'TRES_X_DOS') {
      configJson.aplica_cada = 3
      configJson.gratis = 1
    }

    await onSave({
      nombre,
      codigo: codigo || undefined,
      descripcion,
      tipo: currentCard.tipo,
      categoria: currentCard.categoria,
      estado,
      prioridad,
      permite_acumulacion: permiteAcumulacion,
      es_exclusiva: esExclusiva,
      catalogos_excluidos: catalogosExcluidos,
      fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
      fecha_fin: fechaFin ? new Date(fechaFin).toISOString() : null,
      reglas: [{
        tipo_regla: currentCard.tipo,
        cantidad_minima: (activarCantMin && cantidadMinima > 0) ? cantidadMinima : 0,
        cantidad_maxima: cantidadMaxima,
        monto_minimo: (activarMontoMin && montoMinimo > 0) ? montoMinimo : 0,
        monto_maximo: 0,
        porcentaje: porcentaje,
        precio_fijo: precioFijo,
        descuento_fijo: descuentoFijo,
        envio_gratis: envioGratisBeneficio,
        configuracion_json: configJson,
      }],
      filtros: [],
    })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${tc.border}`,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: tc.text, marginBottom: 4, display: 'block' }

  const sectionTitle: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: tc.text,
    marginBottom: 12, paddingBottom: 8,
    borderBottom: `2px solid ${tc.border}`,
    display: 'flex', alignItems: 'center', gap: 8,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff', borderRadius: 16, padding: 32, width: 640, maxWidth: '95vw',
        maxHeight: '94vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tc.text }}>
              {campania ? 'Editar Campaña' : 'Nueva Campaña'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: tc.textMuted }}>Configura todos los detalles de la promoción</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: tc.textMuted, lineHeight: 1 }}>×</button>
        </div>

        {/* ===== SECCIÓN 1: INFORMACIÓN GENERAL ===== */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>
            <span>📋</span> Información general
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nombre de la promoción *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} placeholder="Ej: 2x$28 Colores" />
              </div>
              <div>
                <label style={labelStyle}>Código promocional</label>
                <input value={codigo} onChange={e => setCodigo(e.target.value)} style={inputStyle} placeholder="Ej: PROMO28" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <input value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} placeholder="Describe brevemente la promoción (opcional)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value as MktEstadoCampania)} style={inputStyle}>
                  <option value="activo">✅ Activa</option>
                  <option value="inactivo">❌ Inactiva</option>
                  <option value="borrador">📝 Borrador</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Prioridad</label>
                <input type="number" value={prioridad} onChange={e => setPrioridad(Number(e.target.value))} style={inputStyle} min={0} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: tc.text, cursor: 'pointer', padding: '8px 0' }}>
                  <input type="checkbox" checked={permiteAcumulacion} onChange={e => setPermiteAcumulacion(e.target.checked)} />
                  Acumulable
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: tc.text, cursor: 'pointer', padding: '8px 0' }}>
                  <input type="checkbox" checked={esExclusiva} onChange={e => { setEsExclusiva(e.target.checked); if (e.target.checked) setPermiteAcumulacion(false) }} />
                  Exclusiva
                </label>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Fecha inicio</label>
                <input type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha fin</label>
                <input type="datetime-local" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECCIÓN 2: TIPO DE PROMOCIÓN ===== */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>
            <span>🎯</span> Tipo de promoción
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {PROMO_CARDS.map(card => {
              const isSelected = selectedCard === card.key
              return (
                <button
                  type="button"
                  key={card.key}
                  onClick={() => setSelectedCard(card.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                    padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${isSelected ? card.badgeColor : tc.border}`,
                    background: isSelected ? `${card.badgeColor}08` : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{card.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: tc.text, lineHeight: 1.3 }}>{card.title}</span>
                  <span style={{ fontSize: 10, color: tc.textMuted, lineHeight: 1.3 }}>{card.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ===== SECCIÓN 3: CONDICIONES DE ACTIVACIÓN ===== */}
        {(selectedCard !== 'ENVIO_GRATIS') && (
          <div style={{ marginBottom: 24 }}>
            <div style={sectionTitle}>
              <span>⚡</span> Condiciones de activación
            </div>
            <p style={{ fontSize: 11, color: tc.textMuted, margin: '-8px 0 12px' }}>
              ¿Cuándo aplica la promoción? Selecciona las condiciones necesarias.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {needsCantidad && (
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 12,
                  background: activarCantMin ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${activarCantMin ? '#22c55e' : tc.border}`,
                }}>
                  <input type="checkbox" checked={activarCantMin} onChange={e => setActivarCantMin(e.target.checked)} />
                  Cantidad mínima de productos
                </label>
              )}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: activarMontoMin ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${activarMontoMin ? '#22c55e' : tc.border}`,
              }}>
                <input type="checkbox" checked={activarMontoMin} onChange={e => setActivarMontoMin(e.target.checked)} />
                Monto mínimo de compra
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: activarCombColor ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${activarCombColor ? '#22c55e' : tc.border}`,
              }}>
                <input type="checkbox" checked={activarCombColor} onChange={e => setActivarCombColor(e.target.checked)} />
                Combinación de colores
              </label>
            </div>

            {activarCantMin && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Cantidad mínima</label>
                  <input type="number" value={cantidadMinima} onChange={e => setCantidadMinima(Number(e.target.value))} min={1} style={inputStyle} placeholder="Ej: 2" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Cantidad máxima</label>
                  <input type="number" value={cantidadMaxima} onChange={e => setCantidadMaxima(Number(e.target.value))} min={0} style={inputStyle} placeholder="0 = sin límite" />
                </div>
              </div>
            )}
            {activarMontoMin && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Monto mínimo de compra ($)</label>
                <input type="number" value={montoMinimo} onChange={e => setMontoMinimo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} placeholder="Ej: 50" />
              </div>
            )}
          </div>
        )}

        {/* ===== SECCIÓN 4: REGLAS DE COMBINACIÓN DE COLORES ===== */}
        {activarCombColor && (
          <div style={{ marginBottom: 24 }}>
            <div style={sectionTitle}>
              <span>🎨</span> Reglas de combinación de colores
            </div>
            <p style={{ fontSize: 11, color: tc.textMuted, margin: '-8px 0 12px' }}>
              Configura cómo deben combinarse los tipos de color para aplicar la promoción.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Different */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: colorCombinationMode === 'different' ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${colorCombinationMode === 'different' ? '#22c55e' : tc.border}`,
              }}>
                <input type="radio" name="colorMode" checked={colorCombinationMode === 'different'}
                  onChange={() => setColorCombinationMode('different')} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: tc.text }}>Colores diferentes</span>
                  <p style={{ margin: '2px 0 4px', fontSize: 11, color: tc.textMuted }}>
                    La promoción solo aplica cuando los productos son de grupos de color diferentes.
                  </p>
                  <div style={{ fontSize: 10, color: '#6b7280', display: 'flex', gap: 12 }}>
                    <span style={{ color: '#059669' }}>✔ Color + Negro</span>
                    <span style={{ color: '#059669' }}>✔ Color + Oscuro</span>
                    <span style={{ color: '#ef4444' }}>✖ Negro + Negro</span>
                    <span style={{ color: '#ef4444' }}>✖ Color + Color</span>
                  </div>
                </div>
              </label>

              {/* Same */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: colorCombinationMode === 'same' ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${colorCombinationMode === 'same' ? '#22c55e' : tc.border}`,
              }}>
                <input type="radio" name="colorMode" checked={colorCombinationMode === 'same'}
                  onChange={() => setColorCombinationMode('same')} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: tc.text }}>Colores iguales</span>
                  <p style={{ margin: '2px 0 4px', fontSize: 11, color: tc.textMuted }}>
                    La promoción solo aplica cuando ambos productos pertenecen al mismo grupo de color.
                  </p>
                  <div style={{ fontSize: 10, color: '#6b7280', display: 'flex', gap: 12 }}>
                    <span style={{ color: '#059669' }}>✔ Negro + Negro</span>
                    <span style={{ color: '#059669' }}>✔ Oscuro + Oscuro</span>
                    <span style={{ color: '#059669' }}>✔ Color + Color</span>
                    <span style={{ color: '#ef4444' }}>✖ Color + Negro</span>
                  </div>
                </div>
              </label>

              {/* Custom */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: colorCombinationMode === 'custom' ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${colorCombinationMode === 'custom' ? '#22c55e' : tc.border}`,
              }}>
                <input type="radio" name="colorMode" checked={colorCombinationMode === 'custom'}
                  onChange={() => setColorCombinationMode('custom')} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: tc.text }}>Combinación personalizada</span>
                  <p style={{ margin: '2px 0 4px', fontSize: 11, color: tc.textMuted }}>
                    Selecciona exactamente qué combinaciones están permitidas.
                  </p>
                </div>
              </label>

              {colorCombinationMode === 'custom' && (
                <div style={{
                  padding: 12, borderRadius: 8,
                  background: '#f9fafb', border: `1px solid ${tc.border}`,
                }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button type="button" onClick={() => switchCustomMode(true)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: `1px solid ${allowedCombinations.length > 0 ? '#22c55e' : tc.border}`,
                        background: allowedCombinations.length > 0 ? '#f0fdf4' : 'transparent',
                        color: allowedCombinations.length > 0 ? '#059669' : tc.text, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                      }}>
                      Permitir seleccionadas
                    </button>
                    <button type="button" onClick={() => switchCustomMode(false)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: `1px solid ${blockedCombinations.length > 0 ? '#ef4444' : tc.border}`,
                        background: blockedCombinations.length > 0 ? '#fef2f2' : 'transparent',
                        color: blockedCombinations.length > 0 ? '#ef4444' : tc.text, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                      }}>
                      Bloquear seleccionadas
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ALL_COLOR_PAIRS.map(pair => {
                      const enabled = allowedCombinations.length > 0
                        ? allowedCombinations.includes(pair)
                        : !blockedCombinations.includes(pair)
                      return (
                        <label key={pair} style={{
                          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                          padding: '4px 8px', borderRadius: 6,
                          background: enabled ? '#f0fdf4' : '#fef2f2',
                          fontSize: 12, color: tc.text,
                        }}>
                          <input type="checkbox" checked={enabled} onChange={() => toggleCustomPair(pair)} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: enabled ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                          {COLOR_PAIR_LABELS[pair]}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== SECCIÓN 5: BENEFICIO ===== */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>
            <span>🎁</span> Beneficio
          </div>
          <p style={{ fontSize: 11, color: tc.textMuted, margin: '-8px 0 12px' }}>
            ¿Qué recibe el cliente?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {needsPorcentaje && (
              <div>
                <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Porcentaje de descuento (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))} min={0} max={100} style={inputStyle} placeholder="Ej: 30" />
                  <span style={{ fontSize: 13, color: tc.text, fontWeight: 600 }}>%</span>
                </div>
              </div>
            )}
            {needsDescuentoFijo && (
              <div>
                <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Valor de descuento ($)</label>
                <input type="number" value={descuentoFijo} onChange={e => setDescuentoFijo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} placeholder="Ej: 10" />
              </div>
            )}
            {needsPrecioFijo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Precio especial ($)</label>
                  <input type="number" value={precioFijo} onChange={e => setPrecioFijo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} placeholder="Ej: 28" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>{needsCantidad ? 'Cant. por grupo' : 'Cantidad'}</label>
                  <input type="number" value={cantidadMinima} onChange={e => setCantidadMinima(Number(e.target.value))} min={1} style={inputStyle} placeholder="Ej: 2" />
                </div>
              </div>
            )}
            {needsEnvioGratis && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={envioGratisBeneficio} onChange={e => setEnvioGratisBeneficio(e.target.checked)} />
                  Envío gratis
                </label>
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Monto mínimo para envío gratis ($)</label>
                  <input type="number" value={montoMinimo} onChange={e => setMontoMinimo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} placeholder="0 = sin mínimo" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== SECCIÓN 6: PREVISUALIZACIÓN ===== */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>
            <span>👁️</span> Previsualización
          </div>
          <div style={{
            padding: 16, borderRadius: 10,
            background: '#f9fafb', border: `1px solid ${tc.border}`,
            fontSize: 12, color: tc.text, lineHeight: 1.8,
          }}>
            {preview.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {!nombre.trim() && (
              <div style={{ color: '#ef4444', marginTop: 4 }}>⚠️ Completa el nombre para guardar</div>
            )}
          </div>
        </div>

        {/* ===== ACCIONES ===== */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: `1px solid ${tc.border}` }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${tc.border}`, background: 'transparent', color: tc.text, cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving || !nombre.trim()} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: tc.primary, color: '#fff', fontWeight: 600,
            cursor: (saving || !nombre.trim()) ? 'not-allowed' : 'pointer',
            fontSize: 13, opacity: (saving || !nombre.trim()) ? 0.6 : 1,
          }}>
            {saving ? 'Guardando...' : (campania ? 'Guardar Cambios' : 'Crear Campaña')}
          </button>
        </div>
      </form>
    </div>
  )
}
