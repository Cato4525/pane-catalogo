import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../../../store'
import { THEME_PRESETS, ThemeType, Campania, TipoCampania, CategoriaCampania, CatalogoSeccion } from '../../../../types'
import {
  fetchCampaniasAdmin, crearCampania, actualizarCampania,
  eliminarCampania, guardarReglas, guardarFiltros, invalidarCacheCampanias,
  invalidarCacheCatalogosLookup,
} from '../../../../services/promocionesService'
import { fetchCatalogos } from '../../../../services/catalogosService'

const TIPO_LABELS: Record<TipoCampania, string> = {
  PRECIO_FIJO: 'Precio Fijo',
  PORCENTAJE: 'Porcentaje',
  MONTO_FIJO: 'Monto Fijo',
  COMPRA_X_LLEVA_Y: 'Compra x Lleva Y',
  COMBO: 'Combo',
  ENVIO_GRATIS: 'Envío Gratis',
}

const TIPO_COLORS: Record<TipoCampania, string> = {
  PRECIO_FIJO: '#22c55e',
  PORCENTAJE: '#3b82f6',
  MONTO_FIJO: '#f59e0b',
  COMPRA_X_LLEVA_Y: '#8b5cf6',
  COMBO: '#ec4899',
  ENVIO_GRATIS: '#06b6d4',
}

export default function CampaniasPage() {
  const settings = useStore(s => s.settings)
  const theme = (settings?.theme || 'moderno') as ThemeType
  const tc = THEME_PRESETS[theme] || THEME_PRESETS.moderno

  const [campanias, setCampanias] = useState<Campania[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campania | null>(null)
  const [catalogos, setCatalogos] = useState<CatalogoSeccion[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, cats] = await Promise.all([
        fetchCampaniasAdmin(),
        fetchCatalogos(),
      ])

      // Auto-desactivar campañas vencidas
      const ahora = new Date()
      const updates: Promise<boolean>[] = []
      const actualizadas = data.map(c => {
        if (c.estado === 'activo' && c.fecha_fin && new Date(c.fecha_fin) <= ahora) {
          updates.push(actualizarCampania(c.id, { estado: 'inactivo' }))
          return { ...c, estado: 'inactivo' as const }
        }
        return c
      })
      if (updates.length > 0) {
        await Promise.all(updates)
        invalidarCacheCampanias()
      }

      setCampanias(actualizadas)
      // deduplicar por nombre por si hay duplicados en la BD
      const seen = new Set<string>()
      setCatalogos(cats.filter(c => { if (seen.has(c.nombre)) return false; seen.add(c.nombre); return true }))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña?')) return
    const ok = await eliminarCampania(id)
    if (ok) load()
  }

  const handleToggleEstado = async (c: Campania) => {
    const nuevoEstado = c.estado === 'activo' ? 'inactivo' : 'activo'
    await actualizarCampania(c.id, { estado: nuevoEstado })
    invalidarCacheCampanias()
    load()
  }

  const handleSave = async (data: Partial<Campania> & { filtros?: { campo: string; operador: string; valor: string }[] }) => {
    if (editing) {
      const ok = await actualizarCampania(editing.id, data)
      if (!ok) { alert('Error al actualizar'); return }
      if (data.tipo && data.tipo !== editing.tipo) {
        await eliminarCampania(editing.id)
        const nueva = await crearCampania(data)
        if (nueva && data.reglas?.[0]) {
          await guardarReglas(nueva.id, data.reglas[0])
        }
        if (nueva && data.filtros) {
          await guardarFiltros(nueva.id, data.filtros)
        }
      } else {
        // Guardar filtros incluso cuando solo se editan campos
        if (data.filtros) {
          await guardarFiltros(editing.id, data.filtros)
        }
      }
    } else {
      const campania = await crearCampania(data)
      if (!campania) { alert('Error al crear'); return }
      if (data.reglas?.[0]) {
        await guardarReglas(campania.id, data.reglas[0])
      }
      if (data.filtros) {
        await guardarFiltros(campania.id, data.filtros)
      }
    }
    invalidarCacheCampanias()
    setShowForm(false)
    setEditing(null)
    load()
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: tc.text }}>Campañas</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: tc.textMuted }}>Administra campañas promocionales</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: tc.primary, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          + Nueva Campaña
        </button>
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
                flexWrap: 'wrap',
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: CATEGORIA_COLORS[c.categoria] || TIPO_COLORS[c.tipo], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: tc.text }}>{c.nombre}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: (CATEGORIA_COLORS[c.categoria] || TIPO_COLORS[c.tipo]) + '20', color: CATEGORIA_COLORS[c.categoria] || TIPO_COLORS[c.tipo], fontWeight: 500 }}>{CATEGORIA_LABELS[c.categoria] || TIPO_LABELS[c.tipo]}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: c.estado === 'activo' ? '#dcfce7' : '#f3f4f6', color: c.estado === 'activo' ? '#059669' : '#6b7280', fontWeight: 500 }}>
                      {c.estado === 'inactivo' && c.fecha_fin && new Date(c.fecha_fin) <= new Date() ? 'vencida' : c.estado}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: tc.textMuted, display: 'flex', gap: 16 }}>
                    {c.descripcion && <span>{c.descripcion}</span>}
                    {regla?.cantidad_minima ? <span>Min: {regla.cantidad_minima}</span> : null}
                    {regla?.precio_fijo ? <span>Precio: ${regla.precio_fijo.toFixed(2)}</span> : null}
                    {regla?.porcentaje ? <span>{regla.porcentaje}%</span> : null}
                    {regla?.monto_minimo ? <span>Monto min: ${regla.monto_minimo.toFixed(2)}</span> : null}
                    {c.catalogo_id ? <span>Catálogo: {catalogos.find(cat => cat.id === c.catalogo_id)?.nombre || '—'}</span> : <span style={{ color: '#9ca3af' }}>Todos los productos</span>}
                    {c.catalogo_excluir_id && <span style={{ color: '#ef4444' }}>Excluye: {catalogos.find(cat => cat.id === c.catalogo_excluir_id)?.nombre || '—'}</span>}
                    {c.filtros && c.filtros.length > 0 && <span style={{ color: '#8b5cf6' }}>Filtro: {c.filtros[0].campo} {c.filtros[0].operador} {c.filtros.map(f => f.valor).join(', ')}</span>}
                    {c.fecha_fin && <span>Vence: {new Date(c.fecha_fin).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => handleToggleEstado(c)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${c.estado === 'activo' ? '#ef4444' : '#22c55e'}`, background: 'transparent', color: c.estado === 'activo' ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => { setEditing(c); setShowForm(true) }}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${tc.border}`, background: 'transparent', color: tc.text, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <CampaniaForm
          campania={editing}
          catalogos={catalogos}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
          themeColors={tc}
        />
      )}
    </div>
  )
}

const CATEGORIA_LABELS: Record<CategoriaCampania, string> = {
  PROMOCION: 'Promoción',
  DESCUENTO: 'Descuento',
  OFERTA: 'Oferta',
  LIQUIDACION: 'Liquidación',
  BLACK_FRIDAY: 'Black Friday',
  TEMPORADA: 'Temporada',
}

const CATEGORIA_COLORS: Record<CategoriaCampania, string> = {
  PROMOCION: '#22c55e',
  DESCUENTO: '#3b82f6',
  OFERTA: '#f59e0b',
  LIQUIDACION: '#ef4444',
  BLACK_FRIDAY: '#8b5cf6',
  TEMPORADA: '#06b6d4',
}

const COLOR_TIPO_OPTIONS = [
  { value: 'oscuro', label: 'Oscuro' },
  { value: 'claro', label: 'Claro' },
  { value: 'color', label: 'Color' },
  { value: 'negro', label: 'Negro' },
  { value: 'blanco', label: 'Blanco' },
  { value: 'neutro', label: 'Neutro' },
  { value: 'exclusivo', label: 'Exclusivo' },
  { value: 'premium', label: 'Premium' },
  { value: 'temporada', label: 'Temporada' },
  { value: 'navidad', label: 'Navidad' },
  { value: 'black_friday', label: 'Black Friday' },
]

const APLICAR_COLOR_TIPO = '__color_tipo__'

function CampaniaForm({ campania, catalogos, onSave, onClose, themeColors: tc }: {
  campania: Campania | null
  catalogos: CatalogoSeccion[]
  onSave: (data: any) => void
  onClose: () => void
  themeColors: any
}) {
  const regla = campania?.reglas?.[0]
  const filtrosExistentes = campania?.filtros || []
  const colorTipoFiltro = filtrosExistentes.find(f => f.campo === 'color_tipo')

  const [categoria, setCategoria] = useState<CategoriaCampania>(campania?.categoria || 'PROMOCION')
  const [tipo, setTipo] = useState<TipoCampania>(campania?.tipo || 'PRECIO_FIJO')
  const [nombre, setNombre] = useState(campania?.nombre || '')
  const [descripcion, setDescripcion] = useState(campania?.descripcion || '')
  const [prioridad, setPrioridad] = useState(campania?.prioridad ?? 0)
  const [estado, setEstado] = useState(campania?.estado || 'activo')
  const [catalogoId, setCatalogoId] = useState(
    campania?.catalogo_id || (colorTipoFiltro ? APLICAR_COLOR_TIPO : '')
  )
  const [catalogoExcluirId, setCatalogoExcluirId] = useState(campania?.catalogo_excluir_id || '')
  const [fechaInicio, setFechaInicio] = useState(campania?.fecha_inicio ? campania.fecha_inicio.slice(0, 16) : '')
  const [fechaFin, setFechaFin] = useState(campania?.fecha_fin ? campania.fecha_fin.slice(0, 16) : '')
  const [saving, setSaving] = useState(false)

  const [cantidadMinima, setCantidadMinima] = useState(regla?.cantidad_minima || 0)
  const [montoMinimo, setMontoMinimo] = useState(regla?.monto_minimo || 0)
  const [porcentaje, setPorcentaje] = useState(regla?.porcentaje || 0)
  const [precioFijo, setPrecioFijo] = useState(regla?.precio_fijo || 0)
  const [envioGratis, setEnvioGratis] = useState(regla?.envio_gratis || false)
  const [parearColorTipo, setParearColorTipo] = useState(regla?.parear_color_tipo || false)

  const [filtroCampo, setFiltroCampo] = useState(filtrosExistentes[0]?.campo || 'color_tipo')
  const [filtroOperador, setFiltroOperador] = useState(filtrosExistentes[0]?.operador || 'IN')
  const [filtroValor, setFiltroValor] = useState(filtrosExistentes.map(f => f.valor).join(', '))
  const [colorTipoSeleccion, setColorTipoSeleccion] = useState<string[]>(
    colorTipoFiltro ? colorTipoFiltro.valor.split(',').map(v => v.trim()).filter(Boolean) : []
  )

  const mostrarFiltroColor = categoria === 'PROMOCION' || categoria === 'DESCUENTO' || categoria === 'OFERTA'
  const mostrarFiltroCategoria = categoria === 'TEMPORADA'
  const mostrarCantidadMinima = categoria === 'PROMOCION' || categoria === 'OFERTA'
  const mostrarPrecioFijo = categoria === 'PROMOCION' || categoria === 'OFERTA'
  const mostrarPorcentaje = categoria === 'DESCUENTO' || categoria === 'LIQUIDACION' || categoria === 'TEMPORADA'
  const mostrarEnvioGratis = categoria === 'OFERTA' || categoria === 'BLACK_FRIDAY'
  const mostrarMontoMinimo = categoria === 'BLACK_FRIDAY'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const filtrosColorTipo = (catalogoId === APLICAR_COLOR_TIPO && colorTipoSeleccion.length > 0)
      ? [{ campo: 'color_tipo', operador: 'IN', valor: colorTipoSeleccion.join(', ') }]
      : []

    const filtrosValidos = filtrosColorTipo.length > 0
      ? filtrosColorTipo
      : (filtroValor.trim() && mostrarFiltroColor)
        ? [{
            campo: filtroCampo,
            operador: filtroOperador,
            valor: filtroValor,
          }]
        : []

    await onSave({
      nombre,
      descripcion,
      tipo,
      categoria,
      estado,
      prioridad,
      catalogo_id: (catalogoId && catalogoId !== APLICAR_COLOR_TIPO) ? catalogoId : null,
      catalogo_excluir_id: catalogoExcluirId || null,
      fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
      fecha_fin: fechaFin ? new Date(fechaFin).toISOString() : null,
      reglas: [{
        tipo_regla: tipo,
        cantidad_minima: cantidadMinima,
        monto_minimo: montoMinimo,
        porcentaje: porcentaje,
        precio_fijo: precioFijo,
        envio_gratis: envioGratis,
        parear_color_tipo: parearColorTipo,
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
        background: '#fff', borderRadius: 16, padding: 32, width: 520, maxWidth: '90vw',
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

          <div>
            <label style={labelStyle}>Categoría</label>
            <select value={categoria} onChange={e => {
              const cat = e.target.value as CategoriaCampania
              setCategoria(cat)
              if (cat === 'BLACK_FRIDAY') setTipo('ENVIO_GRATIS')
              else if (cat === 'PROMOCION' || cat === 'OFERTA') setTipo('PRECIO_FIJO')
              else if (cat === 'DESCUENTO' || cat === 'LIQUIDACION' || cat === 'TEMPORADA') setTipo('PORCENTAJE')
            }} style={inputStyle}>
              {Object.entries(CATEGORIA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: CATEGORIA_COLORS[categoria], marginTop: 4, fontWeight: 500 }}>
              {categoria === 'PROMOCION' && 'Ej: 2x$22, 2x1 — precio fijo por cantidad mínima'}
              {categoria === 'DESCUENTO' && 'Ej: % off por color o categoría'}
              {categoria === 'OFERTA' && 'Ej: 2x$30, 3ro a precio reducido, envío gratis'}
              {categoria === 'LIQUIDACION' && 'Todos los productos a precio reducido'}
              {categoria === 'BLACK_FRIDAY' && 'Envíos gratis sin mínimo de compra'}
              {categoria === 'TEMPORADA' && 'Ej: 1-15 del mes, 50% en selección'}
            </div>
          </div>

          {categoria !== 'BLACK_FRIDAY' && (
            <div>
              <label style={labelStyle}>Tipo de regla</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoCampania)} style={inputStyle}>
                <option value="PRECIO_FIJO">Precio Fijo</option>
                <option value="PORCENTAJE">Porcentaje</option>
                <option value="MONTO_FIJO">Monto Fijo</option>
                <option value="COMPRA_X_LLEVA_Y">Compra x Lleva Y</option>
                <option value="COMBO">Combo</option>
                <option value="ENVIO_GRATIS">Envío Gratis</option>
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>Descripción</label>
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} placeholder="Descripción opcional" />
          </div>

          <div>
            <label style={labelStyle}>Aplicar a</label>
            <select value={catalogoId} onChange={e => {
              setCatalogoId(e.target.value)
              if (e.target.value !== APLICAR_COLOR_TIPO) setColorTipoSeleccion([])
            }} style={inputStyle}>
              <option value="">Todos los productos</option>
              <option value={APLICAR_COLOR_TIPO}>Productos con color</option>
              {catalogos.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 4 }}>
              {catalogoId === APLICAR_COLOR_TIPO ? 'Selecciona los tipos de color que aplican' :
               catalogoId ? 'El descuento aplica solo a productos de este catálogo' : 'El descuento aplica a todos los productos'}
            </div>
          </div>

          {catalogoId === APLICAR_COLOR_TIPO && (
            <div style={{
              borderTop: `1px solid ${tc.border}`, paddingTop: 16,
              borderBottom: `1px solid ${tc.border}`, paddingBottom: 16,
            }}>
              <label style={labelStyle}>Tipos de color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {COLOR_TIPO_OPTIONS.map(opt => {
                  const selected = colorTipoSeleccion.includes(opt.value)
                  return (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: selected ? '#22c55e' : '#f3f4f6',
                      color: selected ? '#fff' : '#374151',
                      border: `1px solid ${selected ? '#22c55e' : '#e5e7eb'}`,
                      userSelect: 'none',
                    }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          setColorTipoSeleccion(prev =>
                            selected ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                          )
                        }}
                        style={{ display: 'none' }}
                      />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 4 }}>
                {colorTipoSeleccion.length > 0
                  ? `Se aplicará solo a productos con tipo de color IN (${colorTipoSeleccion.join(', ')})`
                  : 'Selecciona al menos un tipo de color'}
              </div>
            </div>
          )}

          {catalogoId && catalogoId !== APLICAR_COLOR_TIPO && (
            <div>
              <label style={labelStyle}>Excluir catálogo</label>
              <select value={catalogoExcluirId} onChange={e => setCatalogoExcluirId(e.target.value)} style={inputStyle}>
                <option value="">— No excluir —</option>
                {catalogos
                  .filter(cat => cat.id !== catalogoId)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))
                }
              </select>
              <div style={{ fontSize: 11, color: tc.textMuted, marginTop: 4 }}>
                {catalogoExcluirId
                  ? 'Los productos de este catálogo NO participarán en la campaña'
                  : 'Opcional: excluye productos de un catálogo específico'}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <input type="number" value={prioridad} onChange={e => setPrioridad(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value as 'activo' | 'inactivo' | 'borrador')} style={inputStyle}>
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

          {(mostrarFiltroColor || mostrarFiltroCategoria) && catalogoId !== APLICAR_COLOR_TIPO && (
            <div style={{
              borderTop: `1px solid ${tc.border}`, paddingTop: 16,
              borderBottom: `1px solid ${tc.border}`, paddingBottom: 16,
            }}>
              <label style={labelStyle}>Filtrar por {mostrarFiltroCategoria ? 'categoría' : 'color'}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {mostrarFiltroColor && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={filtroCampo} onChange={e => setFiltroCampo(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      <option value="color_tipo">Tipo de color</option>
                      <option value="color">Color</option>
                      <option value="category">Categoría</option>
                    </select>
                    <select value={filtroOperador} onChange={e => setFiltroOperador(e.target.value)} style={{ ...inputStyle, width: 80 }}>
                      <option value="IN">IN</option>
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                    </select>
                  </div>
                )}
                {mostrarFiltroCategoria && (
                  <input
                    value={filtroValor}
                    onChange={e => setFiltroValor(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej: camisetas, pantalones, accesorios (separados por coma)"
                  />
                )}
                {mostrarFiltroColor && (
                  <input
                    value={filtroValor}
                    onChange={e => setFiltroValor(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej: claro, beige, blanco (separados por coma)"
                  />
                )}
                <div style={{ fontSize: 11, color: tc.textMuted }}>
                  {filtroValor.trim()
                    ? `Se aplicará solo a productos con ${filtroCampo === 'color_tipo' ? 'tipo de color' : filtroCampo} ${filtroOperador} (${filtroValor})`
                    : 'Vacío = aplica a todos los productos sin filtro'}
                </div>
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${tc.border}`, paddingTop: 16 }}>
            <label style={labelStyle}>Reglas</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {(mostrarCantidadMinima || ['PRECIO_FIJO', 'COMBO', 'COMPRA_X_LLEVA_Y'].includes(tipo)) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {mostrarCantidadMinima && (
                    <div>
                      <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Cantidad mínima</label>
                      <input type="number" value={cantidadMinima} onChange={e => setCantidadMinima(Number(e.target.value))} min={0} style={inputStyle} />
                    </div>
                  )}
                  {mostrarPrecioFijo && (
                    <div>
                      <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Precio fijo ($)</label>
                      <input type="number" value={precioFijo} onChange={e => setPrecioFijo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {mostrarPorcentaje && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Porcentaje (%)</label>
                    <input type="number" value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))} min={0} max={100} style={inputStyle} />
                  </div>
                </div>
              )}

              {mostrarMontoMinimo && (
                <div>
                  <label style={{ fontSize: 11, color: tc.textMuted, display: 'block' }}>Compra mínima ($)</label>
                  <input type="number" value={montoMinimo} onChange={e => setMontoMinimo(Number(e.target.value))} min={0} step={0.01} style={inputStyle} />
                </div>
              )}

              {mostrarEnvioGratis && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={envioGratis} onChange={e => setEnvioGratis(e.target.checked)} />
                  Envío gratis
                </label>
              )}
              {(mostrarPrecioFijo || mostrarCantidadMinima) && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: tc.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={parearColorTipo} onChange={e => setParearColorTipo(e.target.checked)} />
                  Forzar pares color/oscuro
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
