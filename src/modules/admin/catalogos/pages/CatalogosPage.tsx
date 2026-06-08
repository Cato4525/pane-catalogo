import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../../../store'
import { THEME_PRESETS, ThemeType, CatalogoSeccion, Product } from '../../../../types'
import {
  fetchCatalogos, crearCatalogo, actualizarCatalogo, eliminarCatalogo,
  asignarProductoCatalogo, quitarProductoCatalogo,
} from '../../../../services/catalogosService'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export default function CatalogosPage() {
  const settings = useStore(s => s.settings)
  const theme = (settings?.theme || 'moderno') as ThemeType
  const tc = THEME_PRESETS[theme] || THEME_PRESETS.moderno

  const [catalogos, setCatalogos] = useState<CatalogoSeccion[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CatalogoSeccion | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchCatalogos(true)
    setCatalogos(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!formNombre.trim()) return
    if (editing) {
      await actualizarCatalogo(editing.id, { nombre: formNombre, descripcion: formDescripcion })
    } else {
      await crearCatalogo({ nombre: formNombre, descripcion: formDescripcion })
    }
    setShowForm(false)
    setEditing(null)
    setFormNombre('')
    setFormDescripcion('')
    load()
  }

  const handleEdit = (c: CatalogoSeccion) => {
    setEditing(c)
    setFormNombre(c.nombre)
    setFormDescripcion(c.descripcion)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este catálogo?')) return
    await eliminarCatalogo(id)
    load()
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: tc.text }}>Catálogos</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: tc.textMuted }}>
            Organiza tus productos en catálogos temáticos
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormNombre(''); setFormDescripcion(''); setShowForm(true) }}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: tc.primary, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}
        >
          + Nuevo Catálogo
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</div>
      ) : catalogos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: tc.surface, borderRadius: 16, border: `1px solid ${tc.border}` }}>
          No hay catálogos creados
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {catalogos.map(catalogo => (
            <CatalogoRow
              key={catalogo.id}
              catalogo={catalogo}
              tc={tc}
              onEdit={() => handleEdit(catalogo)}
              onDelete={() => handleDelete(catalogo.id)}
              onReload={load}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24, width: 420,
            maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {editing ? 'Editar Catálogo' : 'Nuevo Catálogo'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nombre</label>
                <input value={formNombre} onChange={e => setFormNombre(e.target.value)} style={inputStyle} placeholder="Ej: Exclusivos" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Descripción</label>
                <textarea value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Descripción del catálogo" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setShowForm(false); setEditing(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!formNombre.trim()} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: tc.primary, color: '#fff', fontWeight: 600, cursor: 'pointer',
                opacity: formNombre.trim() ? 1 : 0.5,
              }}>
                {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogoRow({ catalogo, tc, onEdit, onDelete, onReload }: {
  catalogo: CatalogoSeccion
  tc: any
  onEdit: () => void
  onDelete: () => void
  onReload: () => void
}) {
  const products = useStore(s => s.products)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [fechaVenc, setFechaVenc] = useState('')
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([])

  const nowISO = new Date().toISOString()
  const productosActivos = catalogo.productos?.filter(p => !p.fecha_vencimiento || p.fecha_vencimiento > nowISO) || []
  const productCount = catalogo.nombre === 'Todos' ? products.length : productosActivos.length

  useEffect(() => {
    if (catalogo.productos) {
      const ids = new Set(productosActivos.map(p => p.producto_id))
      setAssignedProducts(products.filter(p => ids.has(p.id)))
    }
  }, [catalogo.productos, products])

  const handleAssign = async () => {
    if (!selectedProductId) return
    await asignarProductoCatalogo(catalogo.id, selectedProductId, fechaVenc || undefined)
    setSelectedProductId('')
    setFechaVenc('')
    onReload()
  }

  const handleRemove = async (productoId: string) => {
    await quitarProductoCatalogo(catalogo.id, productoId)
    onReload()
  }

  const isSistema = catalogo.tipo === 'sistema'

  return (
    <div style={{
      background: tc.surface, borderRadius: 16, border: `1px solid ${tc.border}`,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: tc.text }}>{catalogo.nombre}</span>
            {isSistema && (
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: '#e0e7ff', color: '#4338ca',
              }}>SISTEMA</span>
            )}
          </div>
          {catalogo.descripcion && (
            <div style={{ fontSize: 12, color: tc.textMuted, marginTop: 2 }}>{catalogo.descripcion}</div>
          )}
          <div style={{ fontSize: 12, color: tc.primary, fontWeight: 600, marginTop: 6 }}>
            {catalogo.nombre === 'Todos' ? 'Todos los productos de la tienda' : `${productCount} producto${productCount !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isSistema && (
            <button onClick={onEdit} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${tc.border}`,
              background: tc.background, cursor: 'pointer', fontSize: 12, color: tc.text,
            }}>Editar</button>
          )}
          {!isSistema && (
            <button onClick={onDelete} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #fca5a5',
              background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444',
            }}>Eliminar</button>
          )}
        </div>
      </div>

      {catalogo.nombre !== 'Todos' && (
        <>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {assignedProducts.slice(0, 6).map(p => (
              <span key={p.id} style={{
                padding: '4px 10px', borderRadius: 6, background: '#f0fdf4',
                border: '1px solid #bbf7d0', fontSize: 11, color: '#059669',
              }}>{p.name}</span>
            ))}
            {assignedProducts.length > 6 && (
              <span style={{ padding: '4px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280' }}>
                +{assignedProducts.length - 6} más
              </span>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowAssign(!showAssign)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${tc.primary}`,
                background: 'transparent', color: tc.primary, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              {showAssign ? 'Cerrar' : 'Asignar productos'}
            </button>
          </div>

          {showAssign && (
            <div style={{ marginTop: 12, padding: 16, background: '#f9fafb', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  style={{ flex: 1, minWidth: 200, ...inputStyle }}
                >
                  <option value="">Seleccionar producto...</option>
                  {products.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.price.toFixed(2)}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={fechaVenc}
                  onChange={e => setFechaVenc(e.target.value)}
                  style={{ ...inputStyle, width: 160 }}
                  placeholder="Fecha vencimiento"
                />
                <button onClick={handleAssign} disabled={!selectedProductId} style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: tc.primary, color: '#fff', fontWeight: 600, cursor: 'pointer',
                  opacity: selectedProductId ? 1 : 0.5,
                }}>
                  Asignar
                </button>
              </div>
              {assignedProducts.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Productos asignados:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {assignedProducts.map(p => {
                      const cp = catalogo.productos?.find(cp => cp.producto_id === p.id)
                      return (
                        <div key={p.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb',
                        }}>
                          <div>
                            <span style={{ fontSize: 12, color: '#111827' }}>{p.name}</span>
                            {cp?.fecha_vencimiento && (
                              <span style={{ marginLeft: 8, fontSize: 10, color: '#d97706' }}>
                                Vence: {new Date(cp.fecha_vencimiento).toLocaleDateString('es-EC')}
                              </span>
                            )}
                          </div>
                          <button onClick={() => handleRemove(p.id)} style={{
                            background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12,
                          }}>Quitar</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
