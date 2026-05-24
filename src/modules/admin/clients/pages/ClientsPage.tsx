import { useState, useEffect } from 'react';
import { useStore } from '../../../../store';
import { useAdminStore } from '../../../../store/adminStore';
import { Modal } from '../../../../components/ui/Modal';
import { Cliente, THEME_PRESETS, ThemeType } from '../../../../types';

const FORM_ID = 'client-form'

const emptyForm: Partial<Cliente> = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  documento: '',
  tipo_documento: 'cc',
  observaciones: '',
}

export default function ClientsPage() {
  const settings = useStore(state => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  
  const { addCliente, searchClientes } = useStore()
  const { updateCliente, deleteCliente } = useStore()
  
  const clientes = useAdminStore(state => state.clientes)
  const clientesLoading = useAdminStore(state => state.clientesLoading)
  const clientesHasMore = useAdminStore(state => state.clientesHasMore)
  const fetchClientes = useAdminStore(state => state.fetchClientes)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOrigen, setFilterOrigen] = useState<'todos' | 'tienda' | 'panel'>('todos')
  const [formData, setFormData] = useState<Partial<Cliente>>(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)

  const filteredClients = searchQuery 
    ? searchClientes(searchQuery).filter(c => {
        if (filterOrigen === 'todos') return true
        return c.origen === filterOrigen
      })
    : clientes.filter(c => {
        if (filterOrigen === 'todos') return true
        return c.origen === filterOrigen
      })

  const handleOpenModal = (client?: Cliente) => {
    if (client) {
      setEditingClient(client)
      setFormData(client)
    } else {
      setEditingClient(null)
      setFormData({ ...emptyForm })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
    setFormData({ ...emptyForm })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient) {
      updateCliente(editingClient.id, formData)
      fetchClientes(true)
    } else {
      const newClient: Cliente = {
        ...(formData as Cliente),
        id: `CLI-${Date.now()}`,
        fecha_registro: new Date().toISOString(),
        origen: 'panel',
      }
      addCliente(newClient)
      fetchClientes(true)
    }
    handleCloseModal()
  }

  const handleDelete = (id: string) => {
    deleteCliente(id)
    fetchClientes(true)
    setDeleteClientId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Clientes</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona tus clientes</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          + Nuevo Cliente
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center" style={{ borderColor: 'var(--border)' }}>
          <input
            type="text"
            placeholder="Buscar clientes por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input max-w-md"
          />
          <select
            value={filterOrigen}
            onChange={(e) => setFilterOrigen(e.target.value as any)}
            className="input"
          >
            <option value="todos">Todos los orígenes</option>
            <option value="tienda">Tienda</option>
            <option value="panel">Panel Admin</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="table table-mobile-card">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Ciudad</th>
                <th>Origen</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td data-label="Nombre" className="font-medium" style={{ color: 'var(--text)' }}>{client.nombre}</td>
                  <td data-label="Documento" style={{ color: 'var(--text-muted)' }}>{client.tipo_documento?.toUpperCase()}-{client.documento}</td>
                  <td data-label="Teléfono" style={{ color: 'var(--text-muted)' }}>{client.telefono}</td>
                  <td data-label="Email" style={{ color: 'var(--text-muted)' }}>{client.email || '-'}</td>
                  <td data-label="Ciudad" style={{ color: 'var(--text-muted)' }}>{client.ciudad || '-'}</td>
                  <td data-label="Origen">
                    {client.origen === 'tienda' || client.user_id ? (
                      <span className="badge badge-primary">Tienda</span>
                    ) : (
                      <span className="badge badge-warning">Panel</span>
                    )}
                  </td>
                  <td data-label="Estado">
                    <span className="badge badge-success">Activo</span>
                  </td>
                  <td data-label="Acciones">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="btn btn-outline text-xs py-1 px-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteClientId(client.id)}
                        className="btn btn-danger text-xs py-1 px-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length > 0 && (
          <div className="flex justify-center p-4 gap-4">
            <button
              onClick={() => fetchClientes()}
              disabled={clientesLoading || !clientesHasMore}
              className="btn btn-outline"
            >
              {clientesLoading ? 'Cargando...' : clientesHasMore ? 'Cargar más' : 'No hay más'}
            </button>
          </div>
        )}

        {filteredClients.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        footer={
          <>
            <button type="button" onClick={handleCloseModal} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" form={FORM_ID} className="btn btn-primary">
              {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre Completo</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo Documento</label>
              <select
                value={formData.tipo_documento || 'cc'}
                onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value as any })}
                className="input"
              >
                <option value="cc">Cédula</option>
                <option value="nit">NIT</option>
                <option value="ce">Cédula Extranjería</option>
                <option value="rc">Registro Civil</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Número Documento</label>
              <input
                type="text"
                value={formData.documento || ''}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="input"
                placeholder="10 dígitos"
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="input"
                placeholder="10 dígitos"
                required
                maxLength={10}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Dirección</label>
            <input
              type="text"
              value={formData.direccion || ''}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input
                type="text"
                value={formData.ciudad || ''}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Observaciones</label>
              <input
                type="text"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteClientId}
        onClose={() => setDeleteClientId(null)}
        title="Eliminar Cliente"
        footer={
          <>
            <button onClick={() => setDeleteClientId(null)} className="btn btn-outline">
              Cancelar
            </button>
            <button onClick={() => deleteClientId && handleDelete(deleteClientId)} className="btn btn-danger">
              Eliminar
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)' }}>
          ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
