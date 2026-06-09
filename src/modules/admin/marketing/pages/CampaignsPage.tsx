// ============================================================
// ADMIN CAMPAIGNS PAGE v2
// Gestión completa de campañas comerciales con motor v2.
// Independiente del CRUD existente en CampaniasPage.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
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
// FORMULARIO DE CAMPAÑA v2
// ============================================================

function MarketingCampaignForm({ campania, onSave, onClose, themeColors: tc, catalogos }: {
  campania: MktCampania | null
  onSave: (data: any) => void
  onClose: () => void
  themeColors: any
  catalogos: CatalogoSeccion[]
}) {
  const [categoria, setCategoria] = useState<MktCategoriaCampania>(campania?.categoria || 'PROMOCION')
  const [tipo, setTipo] = useState<MktTipoCampania>(campania?.tipo || 'PRECIO_FIJO')
  const [nombre, setNombre] = useState(campania?.nombre || '')
  const [descripcion, setDescripcion] = useState(campania?.descripcion || '')
  const [prioridad, setPrioridad] = useState(campania?.prioridad ?? 0)
  const [estado, setEstado] = useState<MktEstadoCampania>(campania?.estado || 'activo')
  const [permiteAcumulacion, setPermiteAcumulacion] = useState(campania?.permite_acumulacion ?? true)
  const [esExclusiva, setEsExclusiva] = useState(campania?.es_exclusiva ?? false)
  const [catalogosExcluidos, setCatalogosExcluidos] = useState<string[]>(campania?.catalogos_excluidos || [])
  const [fechaInicio, setFechaInicio] = useState(campania?.fecha_inicio ? campania.fecha_inicio.slice(0, 16) : '')
  const [fechaFin, setFechaFin] = useState(campania?.fecha_fin ? campania.fecha_fin.slice(0, 16) : '')
  const [saving, setSaving] = useState(false)

  const regla = campania?.reglas?.[0]
  const [cantidadMinima, setCantidadMinima] = useState(regla?.cantidad_minima || 0)
  const [cantidadMaxima, setCantidadMaxima] = useState(regla?.cantidad_maxima || 0)
  const [montoMinimo, setMontoMinimo] = useState(regla?.monto_minimo || 0)
  const [porcentaje, setPorcentaje] = useState(regla?.porcentaje || 0)
  const [precioFijo, setPrecioFijo] = useState(regla?.precio_fijo || 0)
  const [descuentoFijo, setDescuentoFijo] = useState(regla?.descuento_fijo || 0)
  const [envioGratis, setEnvioGratis] = useState(regla?.envio_gratis || false)
  const [parearColorTipo, setParearColorTipo] = useState(regla?.configuracion_json?.parear_color_tipo ?? false)

  const existingRules = regla?.configuracion_json?.promotion_rules as PromotionRules | undefined
  const [colorCombinationMode, setColorCombinationMode] = useState<PromotionRules['colorCombinationMode']>(existingRules?.colorCombinationMode || 'different')
  const [allowedCombinations, setAllowedCombinations] = useState<ColorPair[]>(existingRules?.allowedCombinations || [])
  const [blockedCombinations, setBlockedCombinations] = useState<ColorPair[]>(existingRules?.blockedCombinations || [])

  const customPairEnabled = (pair: ColorPair) => {
    if (allowedCombinations.length > 0) return allowedCombinations.includes(pair)
    return !blockedCombinations.includes(pair)
  }

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

  // Filtros
  const filtrosExistentes = campania?.filtros || []
  const [filtroCampo, setFiltroCampo] = useState(filtrosExistentes[0]?.campo || 'color_tipo')
  const [filtroOperador, setFiltroOperador] = useState(filtrosExistentes[0]?.operador || 'IN')
  const [filtroValor, setFiltroValor] = useState(filtrosExistentes.map(f => f.valor).join(', '))

  const mostrarFiltro = categoria === 'PROMOCION' || categoria === 'DESCUENTO' || categoria === 'OFERTA' || categoria === 'TEMPORADA'
  const mostrarCantidades = tipo === 'PRECIO_FIJO' || tipo === 'COMBO' || tipo === 'COMPRA_X_LLEVA_Y'
  const mostrarPorcentaje = tipo === 'PORCENTAJE'
  const mostrarPrecioFijo = tipo === 'PRECIO_FIJO' || tipo === 'COMBO'
  const mostrarEnvioGratis = tipo === 'ENVIO_GRATIS'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const filtrosValidos = (filtroValor.trim() && mostrarFiltro)
      ? [{
          campo: filtroCampo,
          operador: filtroOperador as any,
          valor: filtroValor,
        }]
      : []

    const promotionRules: PromotionRules = {
      colorCombinationMode,
      allowedCombinations: colorCombinationMode === 'custom' ? allowedCombinations : [],
      blockedCombinations: colorCombinationMode === 'custom' ? blockedCombinations : [],
    }

    await onSave({
      nombre,
      descripcion,
      tipo,
      categoria,
      estado,
      prioridad,
      permite_acumulacion: permiteAcumulacion,
      es_exclusiva: esExclusiva,
      catalogos_excluidos: catalogosExcluidos,
      fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
      fecha_fin: fechaFin ? new Date(fechaFin).toISOString() : null,
      reglas: [{
        tipo_regla: tipo,
        cantidad_minima: cantidadMinima,
        cantidad_maxima: cantidadMaxima,
        monto_minimo: montoMinimo,
        monto_maximo: 0,
        porcentaje: porcentaje,
        precio_fijo: precioFijo,
        descuento_fijo: descuentoFijo,
        envio_gratis: envioGratis,
        configuracion_json: {
          parear_color_tipo: parearColorTipo,
          promotion_rules: promotionRules,
        },
      }],
      filtros: filtrosValidos,
    })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${tc.border}`,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: tc.text, marginBottom: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff', borderRadius: 16, padding: 32, width: 560, maxWidth: '90vw',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: tc.text }}>
            {campania ? 'Editar Campaña' : 'Nueva Campaña'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: tc.textMuted }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} placeholder="Ej: 2x22 Oscuros" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value as MktCategoriaCampania)} style={inputStyle}>
                {Object.entries(MKT_CATEGORIA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de regla</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as MktTipoCampania)} style={inputStyle}>
                {Object.entries(MKT_TIPO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} placeholder="Descripción opcional" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <input type="number" value={prioridad} onChange={e => setPrioridad(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value as MktEstadoCampania)} style={inputStyle}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="borrador">Borrador</option>
              </select>
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

          {/* Flags */}
          <div style={{ display: 'flex', gap: 16, padding: '12px', background: '#f9fafb', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={permiteAcumulacion} onChange={e => setPermiteAcumulacion(e.target.checked)} />
              Permitir acumulación
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={esExclusiva} onChange={e => { setEsExclusiva(e.target.checked); if (e.target.checked) setPermiteAcumulacion(false) }} />
              Exclusiva (bloquea otras campañas)
            </label>
            {(mostrarCantidades || mostrarPrecioFijo) && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={parearColorTipo} onChange={e => setParearColorTipo(e.target.checked)} />
                Forzar pares color/oscuro
              </label>
            )}
          </div>

          {/* Catálogos excluidos */}
          <div style={{ borderTop: `1px solid ${tc.border}`, paddingTop: 16, borderBottom: `1px solid ${tc.border}`, paddingBottom: 16 }}>
            <label style={labelStyle}>Excluir catálogos</label>
            <p style={{ fontSize: 11, color: tc.textMuted, margin: '2px 0 8px' }}>
              Los productos de estos catálogos NO recibirán el descuento
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflow: 'auto' }}>
              {catalogos.map(cat => {
                const selected = catalogosExcluidos.includes(cat.id)
                return (
                  <label key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '6px 10px', borderRadius: 6,
                    background: selected ? '#fef2f2' : '#f9fafb',
                    border: `1px solid ${selected ? '#f87171' : tc.border}`,
                    fontSize: 13, color: tc.text,
                  }}>
                    <input type="checkbox" checked={selected} onChange={() => {
                      setCatalogosExcluidos(prev =>
                        selected ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                      )
                    }} />
                    {cat.nombre}
                  </label>
                )
              })}
              {catalogos.length === 0 && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>No hay catálogos disponibles</span>
              )}
            </div>
          </div>

          {/* Filtros */}
          {mostrarFiltro && (
            <div style={{ borderTop: `1px solid ${tc.border}`, paddingTop: 16, borderBottom: `1px solid ${tc.border}`, paddingBottom: 16 }}>
              <label style={labelStyle}>Filtrar productos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={filtroCampo} onChange={e => setFiltroCampo(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                    <option value="color_tipo">Tipo de color</option>
                    <option value="color">Color</option>
                    <option value="category">Categoría</option>
                    <option value="modelo">Modelo</option>
                    <option value="coleccion">Colección</option>
                  </select>
                  <select value={filtroOperador} onChange={e => setFiltroOperador(e.target.value as any)} style={{ ...inputStyle, width: 80 }}>
                    <option value="IN">IN</option>
                    <option value="=">=</option>
                    <option value="!=">!=</option>
                    <option value="NOT IN">NOT IN</option>
                  </select>
                </div>
                <input value={filtroValor} onChange={e => setFiltroValor(e.target.value)} style={inputStyle}
                  placeholder="Ej: claro, beige, blanco (separados por coma)" />
              </div>
            </div>
          )}

          {/* Condiciones de combinación */}
          {(mostrarCantidades || mostrarPrecioFijo) && (
            <div style={{
              borderTop: `1px solid ${tc.border}`, paddingTop: 16,
              borderBottom: `1px solid ${tc.border}`, paddingBottom: 16,
            }}>
              <label style={labelStyle}>Condiciones de combinación</label>
              <p style={{ fontSize: 11, color: tc.textMuted, margin: '2px 0 8px' }}>
                Configura cómo se deben combinar los tipos de color en los pares de esta promoción
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  background: colorCombinationMode === 'different' ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${colorCombinationMode === 'different' ? '#22c55e' : tc.border}`,
                }}>
                  <input type="radio" name="colorMode" checked={colorCombinationMode === 'different'}
                    onChange={() => setColorCombinationMode('different')} />
                  <div>
                    <span style={{ fontWeight: 500, color: tc.text }}>Permitir únicamente colores diferentes</span>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: tc.textMuted }}>
                      color + negro, color + oscuro (ej: 1 prenda de color + 1 oscura/negra)
                    </p>
                  </div>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  background: colorCombinationMode === 'same' ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${colorCombinationMode === 'same' ? '#22c55e' : tc.border}`,
                }}>
                  <input type="radio" name="colorMode" checked={colorCombinationMode === 'same'}
                    onChange={() => setColorCombinationMode('same')} />
                  <div>
                    <span style={{ fontWeight: 500, color: tc.text }}>Permitir únicamente colores iguales</span>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: tc.textMuted }}>
                      color + color, oscuro + oscuro, negro + negro (mismo grupo de color)
                    </p>
                  </div>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  background: colorCombinationMode === 'custom' ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${colorCombinationMode === 'custom' ? '#22c55e' : tc.border}`,
                }}>
                  <input type="radio" name="colorMode" checked={colorCombinationMode === 'custom'}
                    onChange={() => setColorCombinationMode('custom')} />
                  <div>
                    <span style={{ fontWeight: 500, color: tc.text }}>Personalizar combinaciones permitidas</span>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: tc.textMuted }}>
                      Selecciona manualmente las combinaciones válidas
                    </p>
                  </div>
                </label>

                {colorCombinationMode === 'custom' && (
                  <div style={{
                    marginTop: 8, padding: 12, borderRadius: 8,
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
                            fontSize: 13, color: tc.text,
                          }}>
                            <input type="checkbox" checked={enabled}
                              onChange={() => toggleCustomPair(pair)} />
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: enabled ? '#22c55e' : '#ef4444',
                              display: 'inline-block',
                            }} />
                            {COLOR_PAIR_LABELS[pair]}
                          </label>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 6 }}>
                      {allowedCombinations.length > 0
                        ? `${allowedCombinations.length} combinaciones permitidas`
                        : blockedCombinations.length > 0
                          ? `${blockedCombinations.length} combinaciones bloqueadas`
                          : 'Todas las combinaciones permitidas'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reglas */}
          <div style={{ borderTop: `1px solid ${tc.border}`, paddingTop: 16 }}>
            <label style={labelStyle}>Reglas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {mostrarCantidades && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Cantidad mínima</label>
                    <input type="number" value={cantidadMinima} onChange={e => setCantidadMinima(Number(e.target.value))} min={0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Cantidad máxima</label>
                    <input type="number" value={cantidadMaxima} onChange={e => setCantidadMaxima(Number(e.target.value))} min={0} style={inputStyle} />
                  </div>
                </div>
              )}

              {mostrarPrecioFijo && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Precio fijo ($)</label>
                    <input type="number" value={precioFijo} onChange={e => setPrecioFijo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Descuento fijo ($)</label>
                    <input type="number" value={descuentoFijo} onChange={e => setDescuentoFijo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} />
                  </div>
                </div>
              )}

              {mostrarPorcentaje && (
                <div>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Porcentaje (%)</label>
                  <input type="number" value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))} min={0} max={100} style={inputStyle} />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Monto mínimo ($)</label>
                <input type="number" value={montoMinimo} onChange={e => setMontoMinimo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} />
              </div>

              {mostrarEnvioGratis && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={envioGratis} onChange={e => setEnvioGratis(e.target.checked)} />
                  Envío gratis
                </label>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${tc.border}`, background: 'transparent', color: tc.text, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: tc.primary, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : (campania ? 'Guardar Cambios' : 'Crear Campaña')}
          </button>
        </div>
      </form>
    </div>
  )
}
