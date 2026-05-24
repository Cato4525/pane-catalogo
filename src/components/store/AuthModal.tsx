import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Product } from '../../types';
import { loginConGoogle, registrarCliente, loginCliente } from '../../services/authService';
import { getSupabase, supabaseClient } from '../../services/supabaseClient';

interface CartItem extends Product {
  qty: number;
}

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
  cart: CartItem[];
  mode: 'consulta' | 'reserva';
  reservaTipo?: 'con_abono';
}

type AuthMode = 'login' | 'register';

export default function AuthModal({ onClose, onLoginSuccess, cart, mode, reservaTipo = 'con_abono' }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [existingClient, setExistingClient] = useState<{id: string; nombre: string; email: string; telefono: string; documento: string; password: string} | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  
  const { clientes, addCliente, addReserva, addConsulta } = useStore();
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
  });

  useEffect(() => {
    const clienteId = localStorage.getItem('cliente_id');
    const clienteNombre = localStorage.getItem('cliente_nombre');
    const clienteTelefono = localStorage.getItem('cliente_telefono');
    
    if (clienteId && clienteNombre) {
      setFormData(prev => ({
        ...prev,
        nombre: clienteNombre,
        telefono: clienteTelefono || '',
      }));
      setExistingClient({ id: clienteId, nombre: clienteNombre, email: '', telefono: clienteTelefono || '', documento: '', password: 'dummy' });
      setAuthMode('login');
    }
  }, []);

  const handleEmailChange = async (value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    setExistingClient(null);
    setError('');
    setSuccessMessage('');
    setEmailChecked(false);
  };

  const checkEmailExists = async (email: string) => {
    if (!email || authMode === 'login') return;
    
    const supabase = getSupabase();
    const emailLower = email.toLowerCase();
    
    if (supabase) {
      const { data: cliente } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', emailLower)
        .maybeSingle();

      if (cliente) {
        setError('Este correo ya tiene una cuenta. Por favor inicia sesión.');
        setEmailChecked(true);
        return;
      }

      setEmailChecked(true);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError('');
    try {
      await loginConGoogle();
    } catch {
      setError('No se pudo conectar con Google. Intenta de nuevo.');
      setLoadingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const supabase = getSupabase();
        
        try {
          const { user, session } = await loginCliente(formData.email, formData.password);
          
          if (user || session) {
            if (supabase) {
              const { data: cliente } = await supabase
                .from('clients')
                .select('*')
                .eq('email', formData.email.toLowerCase())
                .single();
              
              if (cliente) {
                localStorage.setItem('cliente_id', cliente.id);
                localStorage.setItem('cliente_nombre', cliente.nombre);
                localStorage.setItem('cliente_telefono', cliente.telefono || '');
                localStorage.setItem('cliente_email', cliente.email || '');
                localStorage.setItem('cliente_direccion', cliente.direccion || '');
                localStorage.setItem('cliente_ciudad', cliente.ciudad || '');
                localStorage.setItem('cliente_cedula', cliente.documento || '');
                onLoginSuccess();
              } else {
                setError('Cliente no encontrado. Contacta al administrador.');
              }
            }
          }
        } catch (err: any) {
        console.log('Auth login failed, checking client in database')
        
        const emailToCheck = formData.email.toLowerCase()
        const { data: cliente } = await supabase
          .from('clients')
          .select('*')
          .eq('email', emailToCheck)
          .maybeSingle();
        
        if (cliente) {
          console.log('Client found in database, allowing login')
          localStorage.setItem('cliente_id', cliente.id);
          localStorage.setItem('cliente_nombre', cliente.nombre);
          localStorage.setItem('cliente_telefono', cliente.telefono || '');
          localStorage.setItem('cliente_email', cliente.email || '');
          localStorage.setItem('cliente_direccion', cliente.direccion || '');
          localStorage.setItem('cliente_ciudad', cliente.ciudad || '');
          localStorage.setItem('cliente_cedula', cliente.documento || '');
          onLoginSuccess();
        } else {
          setError('Credenciales incorrectas. Verifica tu email y contraseña.');
        }
      }
      } else {
        try {
          await registrarCliente(formData.email, formData.password, formData.nombre, formData.telefono);
          
          setSuccessMessage('¡Cuenta creada exitosamente! Bienvenido/a.');
          
          const supabase = getSupabase();
          if (supabase) {
            const { data: cliente } = await supabase
              .from('clients')
              .select('*')
              .eq('email', formData.email)
              .single();
            
            if (cliente) {
              localStorage.setItem('cliente_id', cliente.id);
              localStorage.setItem('cliente_nombre', formData.nombre);
              localStorage.setItem('cliente_telefono', formData.telefono);
              localStorage.setItem('cliente_email', formData.email);
              localStorage.setItem('cliente_direccion', '');
              localStorage.setItem('cliente_ciudad', '');
              localStorage.setItem('cliente_cedula', '');
              setTimeout(() => {
                onLoginSuccess();
              }, 1500);
            }
          }
        } catch (err: any) {
          if (err.message?.includes('already been registered')) {
            setError('Este email ya está registrado. Por favor inicia sesión.');
          } else {
            setError('Error al registrar: ' + err.message);
          }
        }
      }
    } catch (err) {
      setError('Error al procesar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)" }} />
      <div style={{
        background: '#fff', borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 400, maxHeight: "90vh", overflow: "auto", animation: "slideUp 0.3s ease-out", position: "relative"
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Cormorant Garamond',serif" }}>
            {existingClient ? 'Completar Registro' : (authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </h2>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            {existingClient 
              ? 'Ya tienes datos registrados. Solo ingresa tu contraseña.' 
              : (authMode === 'login' 
                ? 'Ingresa para continuar con tu reserva' 
                : 'Regístrate para hacer reservas')}
          </p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loadingGoogle || loading}
          style={{ 
            width: '100%', 
            padding: 14, 
            background: '#fff', 
            border: '1.5px solid #e8e4dc', 
            borderRadius: 12, 
            fontSize: 14, 
            fontWeight: 500, 
            cursor: loadingGoogle || loading ? 'not-allowed' : 'pointer',
            opacity: loadingGoogle || loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 20
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loadingGoogle ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e8e4dc' }} />
          <span style={{ padding: '0 12px', color: '#999', fontSize: 12 }}>o</span>
          <div style={{ flex: 1, height: 1, background: '#e8e4dc' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {authMode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>NOMBRE COMPLETO *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre completo"
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>
          )}

            <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>
              {authMode === 'login' ? 'EMAIL O TELÉFONO *' : 'EMAIL *'}
            </label>
            <input
              type={authMode === 'login' ? 'text' : 'email'}
              required
              value={formData.email}
              onChange={e => handleEmailChange(e.target.value)}
              onBlur={e => authMode === 'register' && checkEmailExists(e.target.value)}
              placeholder={authMode === 'login' ? 'tu@email.com o 593 99 999 9999' : 'tu@email.com'}
              style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
            />
          </div>

          {authMode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>TELÉFONO WHATSAPP *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="5939999999"
                style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
              />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>
              {authMode === 'login' ? 'CONTRASEÑA *' : 'CREAR CONTRASEÑA *'}
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={authMode === 'login' ? 'Tu contraseña' : 'Mínimo 4 caracteres'}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              style={{ width: '100%', padding: 14, border: '1.5px solid #e8e4dc', borderRadius: 12, fontSize: 14, background: '#fafaf8' }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#16a34a' }}>{successMessage}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: 16, background: '#1a1a1a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Procesando...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            {' '}
            <button 
              type="button"
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#c96070', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
            </button>
          </p>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: '#fafaf8', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#999' }}>
            Al {authMode === 'login' ? 'iniciar sesión' : 'registrarte'}, aceptas nuestros términos y condiciones.
          </p>
        </div>
      </div>
    </div>
  );
}
