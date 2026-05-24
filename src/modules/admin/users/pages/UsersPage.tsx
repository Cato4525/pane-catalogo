import { useState, useEffect } from 'react'
import { 
  AppUser, 
  UserRole, 
  Permiso, 
  Rol,
  getAllUsers, 
  getAllRoles, 
  getAllPermissions, 
  getRolePermissions,
  updateUserProfile,
  softDeleteUser
} from '../../../../store/authStore'
import { usePermissions } from '../../../../hooks/usePermissions'

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  admin: { bg: '#c8a96e20', color: '#c8a96e', border: '1px solid #c8a96e44' },
  gerente: { bg: '#6e8fc820', color: '#6e8fc8', border: '1px solid #6e8fc844' },
  vendedor: { bg: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e44' },
  reportes: { bg: '#70c88020', color: '#70c880', border: '1px solid #70c88044' },
  soporte: { bg: '#a855f720', color: '#a855f7', border: '1px solid #a855f744' },
  contador: { bg: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b44' },
  inventario: { bg: '#ec489920', color: '#ec4899', border: '1px solid #ec489944' },
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  reportes: 'Reportes',
  soporte: 'Soporte',
  contador: 'Contador',
  inventario: 'Inventario',
}

export default function UsersPage() {
  const { hasPermission, loading: authLoading, isAdmin } = usePermissions()
  const [users, setUsers] = useState<AppUser[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [permissions, setPermissions] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPermsModal, setShowPermsModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<UserRole>('vendedor')
  const [activo, setActivo] = useState(true)
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canViewUsers = isAdmin || hasPermission('ver_usuarios')
  const canCreateUsers = isAdmin || hasPermission('crear_usuarios')
  const canEditUsers = isAdmin || hasPermission('editar_usuarios')
  const canDeleteUsers = isAdmin || hasPermission('eliminar_usuarios')
  const canManagePermissions = isAdmin || hasPermission('gestionar_permisos')

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ color: '#888' }}>Cargando...</div>
      </div>
    )
  }

  if (!canViewUsers) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 60,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ marginBottom: 8, color: '#f5f0e8' }}>Acceso denegado</h2>
        <p style={{ color: '#888' }}>No tienes permiso para ver usuarios</p>
      </div>
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, rolesData, permsData] = await Promise.all([
        getAllUsers(),
        getAllRoles(),
        getAllPermissions()
      ])
      setUsers(usersData)
      setRoles(rolesData)
      setPermissions(permsData)
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setLoading(false)
  }

  const loadRolePermissions = async (roleName: string) => {
    const perms = await getRolePermissions(roleName)
    setRolePermissions(perms)
  }

  const openCreate = () => {
    setEditingUser(null)
    setEmail('')
    setPassword('')
    setNombre('')
    setRol('vendedor')
    setActivo(true)
    setSelectedPerms([])
    setError('')
    setSuccess('')
    loadRolePermissions('vendedor')
    setShowModal(true)
  }

  const openEdit = async (user: AppUser) => {
    setEditingUser(user)
    setEmail(user.email)
    setPassword('')
    setNombre(user.nombre)
    setRol(user.rol as UserRole)
    setActivo(user.activo !== false)
    setSelectedPerms(user.permisos_extra || [])
    setError('')
    setSuccess('')
    await loadRolePermissions(user.rol)
    setShowModal(true)
  }

  const openPermissions = async (user: AppUser) => {
    setEditingUser(user)
    const rolePerms = await getRolePermissions(user.rol)
    setRolePermissions(rolePerms)
    setUserPermissions([...rolePerms, ...(user.permisos_extra || [])])
    setSelectedPerms(user.permisos_extra || [])
    setShowPermsModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingUser) {
        const result = await updateUserProfile(editingUser.id, { 
          nombre, 
          rol, 
          activo,
          permisos_extra: selectedPerms 
        })
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess('Usuario actualizado correctamente')
          loadData()
          setTimeout(() => setShowModal(false), 1000)
        }
      } else {
        setError('La creación de usuarios debe realizarse desde Supabase Admin para seguridad. Use la consola de Supabase para crear usuarios.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar'
      setError(message)
    }
    setSaving(false)
  }

  const handleToggleUser = async (user: AppUser) => {
    const result = await updateUserProfile(user.id, { activo: !user.activo })
    if (result.error) {
      alert(result.error)
    } else {
      loadData()
    }
  }

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`¿Desactivar al usuario ${user.email}?`)) return
    
    const result = await softDeleteUser(user.id)
    if (result.error) {
      alert(result.error)
    } else {
      loadData()
    }
  }

  const handleSavePermissions = async () => {
    if (!editingUser) return
    
    setSaving(true)
    const result = await updateUserProfile(editingUser.id, { 
      permisos_extra: selectedPerms.filter(p => !rolePermissions.includes(p))
    })
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Permisos actualizados correctamente')
      loadData()
      setTimeout(() => setShowPermsModal(false), 1000)
    }
    setSaving(false)
  }

  const togglePermission = (perm: string) => {
    setSelectedPerms(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    )
  }

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = []
    acc[p.categoria].push(p)
    return acc
  }, {} as Record<string, Permiso[]>)

  const getRolBadge = (r: string) => {
    const c = ROLE_COLORS[r] || { bg: '#333', color: '#888', border: '1px solid #444' }
    return (
      <span style={{ 
        padding: '3px 8px', 
        borderRadius: 12, 
        fontSize: 11, 
        fontWeight: 500, 
        background: c.bg, 
        color: c.color, 
        border: c.border 
      }}>
        {ROLE_LABELS[r] || r}
      </span>
    )
  }

  return (
    <>
      <style>{`
        .users-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .users-title { font-family: 'DM Serif Display', serif; font-size: 24px; color: #f5f0e8; }
        .users-btn { padding: 10px 16px; background: #c8a96e; color: #0a0a0a; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .2s; }
        .users-btn:hover { background: #d4b87a; }
        .users-table { width: 100%; border-collapse: collapse; background: #1a1a1a; border-radius: 12px; overflow: hidden; }
        .users-table th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #555; background: #111; border-bottom: 1px solid #222; }
        .users-table td { padding: 14px 16px; font-size: 14px; color: #f5f0e8; border-bottom: 1px solid #1e1e1e; }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover td { background: #1f1f1f; }
        .users-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .users-action-btn { padding: 6px 10px; font-size: 12px; border: 1px solid #333; background: transparent; color: #888; border-radius: 6px; cursor: pointer; transition: all .15s; }
        .users-action-btn:hover { border-color: #555; color: #bbb; }
        .users-action-btn.delete:hover { border-color: #5a2020; color: #e07070; background: #2a1515; }
        .users-action-btn.perms { border-color: #6e8fc844; color: #6e8fc8; }
        .users-action-btn.perms:hover { background: #6e8fc820; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-active { background: #22c55e; }
        .status-inactive { background: #666; }
        .modal-overlay { position: fixed; inset: 0; background: #0008; display: flex; align-items: center; justify-content: center; z-index: 1000; overflow-y: auto; padding: 20px; }
        .modal { background: #1a1a1a; border: 1px solid #252525; border-radius: 16px; padding: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: #f5f0e8; margin-bottom: 20px; }
        .modal-field { margin-bottom: 14px; }
        .modal-label { display: block; font-size: 11px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #555; margin-bottom: 6px; }
        .modal-input { width: 100%; padding: 11px 13px; background: #111; border: 1px solid #252525; border-radius: 8px; font-size: 14px; color: #f5f0e8; outline: none; }
        .modal-input:focus { border-color: #c8a96e55; }
        .modal-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-select { width: 100%; padding: 11px 13px; background: #111; border: 1px solid #252525; border-radius: 8px; font-size: 14px; color: #f5f0e8; outline: none; cursor: pointer; }
        .modal-checkbox { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #111; border: 1px solid #252525; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all .15s; }
        .modal-checkbox:hover { border-color: #333; }
        .modal-checkbox.checked { background: #c8a96e15; border-color: #c8a96e44; }
        .modal-checkbox input { width: 16px; height: 16px; accent-color: #c8a96e; }
        .modal-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 8px; }
        .modal-btn-primary { background: #c8a96e; color: #0a0a0a; }
        .modal-btn-primary:hover:not(:disabled) { background: #d4b87a; }
        .modal-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .modal-btn-secondary { background: transparent; color: #888; border: 1px solid #333; margin-top: 8px; }
        .modal-btn-secondary:hover { border-color: #444; color: #bbb; }
        .modal-error { margin-top: 12px; padding: 10px 12px; background: #2a1515; border: 1px solid #5a2020; border-radius: 7px; font-size: 13px; color: #e07070; }
        .modal-success { margin-top: 12px; padding: 10px 12px; background: #152a1a; border: 1px solid #205a2a; border-radius: 7px; font-size: 13px; color: #70c880; }
        .role-desc { font-size: 11px; color: #555; margin-top: 4px; }
        .perm-category { margin-bottom: 16px; }
        .perm-category-title { font-size: 12px; font-weight: 600; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .perm-badge { display: inline-block; padding: 2px 6px; background: #333; border-radius: 4px; font-size: 10px; color: #888; margin-left: 8px; }
        .perm-badge.inherited { background: #c8a96e22; color: #c8a96e; }
        .toggle-switch { position: relative; width: 40px; height: 22px; background: #333; border-radius: 11px; cursor: pointer; transition: all .2s; }
        .toggle-switch.active { background: #22c55e; }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: all .2s; }
        .toggle-switch.active::after { left: 20px; }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #c8a96e44; border-top-color: #c8a96e; border-radius: 50%; animation: spin .6s linear infinite; vertical-align: middle; margin-right: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="users-container">
        <div className="users-header">
          <h1 className="users-title">Gestión de Usuarios</h1>
          {canCreateUsers && (
            <button className="users-btn" onClick={openCreate}>
              + Nuevo Usuario
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: 40 }}>Cargando...</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.nombre || 'Sin nombre'}</td>
                  <td style={{ color: '#888' }}>{user.email}</td>
                  <td>{getRolBadge(user.rol)}</td>
                  <td>
                    <div className="status-badge">
                      <span className={`status-dot ${user.activo !== false ? 'status-active' : 'status-inactive'}`} />
                      {user.activo !== false ? 'Activo' : 'Inactivo'}
                    </div>
                  </td>
                  <td>
                    <div className="users-actions">
                      {canEditUsers && (
                        <button className="users-action-btn" onClick={() => openEdit(user)}>
                          Editar
                        </button>
                      )}
                      {canManagePermissions && (
                        <button className="users-action-btn perms" onClick={() => openPermissions(user)}>
                          Permisos
                        </button>
                      )}
                      {canEditUsers && (
                        <button className="users-action-btn" onClick={() => handleToggleUser(user)}>
                          {user.activo !== false ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                      {canDeleteUsers && (
                        <button className="users-action-btn delete" onClick={() => handleDelete(user)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#555', padding: 40 }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Create/Edit User */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-field">
                <label className="modal-label">Nombre</label>
                <input
                  className="modal-input"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Nombre completo"
                />
              </div>
              
              <div className="modal-field">
                <label className="modal-label">Email</label>
                <input
                  className="modal-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required={!editingUser}
                  disabled={!!editingUser}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              {!editingUser && (
                <div className="modal-field">
                  <label className="modal-label">Contraseña</label>
                  <input
                    className="modal-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}
              
              <div className="modal-field">
                <label className="modal-label">Rol</label>
                <select
                  className="modal-select"
                  value={rol}
                  onChange={e => {
                    setRol(e.target.value as UserRole)
                    loadRolePermissions(e.target.value)
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.nombre}>
                      {r.descripcion || r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Estado</label>
                <div 
                  className={`toggle-switch ${activo ? 'active' : ''}`}
                  onClick={() => setActivo(!activo)}
                  style={{ marginTop: 8 }}
                />
              </div>

              {editingUser && (
                <div className="modal-field">
                  <label className="modal-label">
                    Permisos Extra 
                    <span className="perm-badge">{selectedPerms.length} seleccionados</span>
                  </label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8 }}>
                    {Object.entries(groupedPermissions).map(([cat, perms]) => (
                      <div key={cat} className="perm-category">
                        <div className="perm-category-title">{cat}</div>
                        {perms.map(p => (
                          <label 
                            key={p.id} 
                            className={`modal-checkbox ${selectedPerms.includes(p.clave) ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.clave)}
                              onChange={() => togglePermission(p.clave)}
                            />
                            <span>{p.descripcion}</span>
                            {rolePermissions.includes(p.clave) && (
                              <span className="perm-badge inherited">del rol</span>
                            )}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="modal-error">{error}</div>}
              {success && <div className="modal-success">{success}</div>}

              <button
                type="submit"
                className="modal-btn modal-btn-primary"
                disabled={saving}
              >
                {saving && <span className="spinner" />}
                {editingUser ? 'Actualizar' : 'Crear Usuario'}
              </button>
              
              <button
                type="button"
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Permissions */}
      {showPermsModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowPermsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              Permisos de {editingUser.nombre}
            </h2>
            
            <div className="modal-field">
              <label className="modal-label">Rol: {getRolBadge(editingUser.rol)}</label>
            </div>

            <div className="modal-field">
              <label className="modal-label">
                Permisos 
                <span className="perm-badge">{selectedPerms.length} extra</span>
              </label>
              <div style={{ maxHeight: 250, overflowY: 'auto', marginTop: 8 }}>
                {Object.entries(groupedPermissions).map(([cat, perms]) => (
                  <div key={cat} className="perm-category">
                    <div className="perm-category-title">{cat}</div>
                    {perms.map(p => (
                      <label 
                        key={p.id} 
                        className={`modal-checkbox ${selectedPerms.includes(p.clave) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.clave)}
                          onChange={() => togglePermission(p.clave)}
                        />
                        <span>{p.descripcion}</span>
                        {rolePermissions.includes(p.clave) && (
                          <span className="perm-badge inherited">heredado</span>
                        )}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="modal-error">{error}</div>}
            {success && <div className="modal-success">{success}</div>}

            <button
              className="modal-btn modal-btn-primary"
              onClick={handleSavePermissions}
              disabled={saving}
            >
              {saving && <span className="spinner" />}
              Guardar Permisos
            </button>
            
            <button
              className="modal-btn modal-btn-secondary"
              onClick={() => setShowPermsModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
