import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const result = await loginAdmin(email, password)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsSuccess(true)
      setTimeout(() => navigate('/admin/dashboard'), 900)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0a;
          overflow: hidden;
          position: relative;
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: floatBlob 8s ease-in-out infinite;
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #ff6b6b, #ee0979);
          top: -150px; left: -100px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #a855f7, #6366f1);
          top: 200px; right: -120px;
          animation-delay: -3s;
        }
        .blob-3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #f59e0b, #f97316);
          bottom: -100px; left: 30%;
          animation-delay: -5s;
        }

        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .left-panel {
          display: none;
          flex: 1;
          position: relative;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }
        @media (min-width: 900px) {
          .left-panel { display: flex; }
        }

        .left-content {
          position: relative;
          z-index: 2;
          color: white;
          max-width: 400px;
        }

        .brand-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
          margin-bottom: 32px;
        }

        .brand-dot {
          width: 6px; height: 6px;
          background: #ff6b6b;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .left-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 4vw, 58px);
          line-height: 1.1;
          margin-bottom: 20px;
          color: white;
        }

        .left-title em {
          font-style: italic;
          background: linear-gradient(135deg, #ff6b6b, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-subtitle {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          font-weight: 300;
          margin-bottom: 48px;
        }

        .stats-row {
          display: flex;
          gap: 32px;
        }

        .stat { display: flex; flex-direction: column; gap: 4px; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: white; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }

        .deco-card {
          position: absolute;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 16px 20px;
          color: white;
          font-size: 12px;
          animation: floatCard 6s ease-in-out infinite;
          z-index: 1;
        }
        .deco-card-1 { top: 15%; right: 8%; animation-delay: -1s; }
        .deco-card-2 { bottom: 20%; left: 5%; animation-delay: -3s; }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        .deco-card-label { color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .deco-card-value { font-weight: 500; font-size: 18px; color: white; }
        .deco-card-sub { color: #4ade80; font-size: 11px; margin-top: 2px; }

        .right-panel {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 32px;
          position: relative;
          z-index: 2;
        }

        @media (min-width: 900px) {
          .right-panel {
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(20px);
            border-left: 1px solid rgba(255,255,255,0.06);
          }
        }

        .form-header { margin-bottom: 40px; }
        .form-eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #ff6b6b; font-weight: 500; margin-bottom: 12px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 36px; color: white; line-height: 1.1; margin-bottom: 10px; }
        .form-subtitle { font-size: 14px; color: rgba(255,255,255,0.35); font-weight: 300; }

        .field-group { margin-bottom: 20px; }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        .field-label.focused { color: #ff6b6b; }

        .field-wrap { position: relative; }

        .field-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.2);
          width: 18px;
          height: 18px;
          transition: color 0.2s;
          pointer-events: none;
        }
        .field-focused .field-icon { color: #ff6b6b; }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 14px 16px 14px 46px;
          color: white;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.25s;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.15); }
        .field-input:focus {
          background: rgba(255,255,255,0.08);
          border-color: #ff6b6b;
          box-shadow: 0 0 0 3px rgba(255,107,107,0.12);
        }
        .field-input.has-right { padding-right: 46px; }

        .toggle-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.2);
          padding: 4px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .toggle-btn:hover { color: rgba(255,255,255,0.6); }

        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          animation: shakeError 0.4s ease;
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .error-text { font-size: 13px; color: #f87171; }

        .submit-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 28px;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ff6b6b, #ee0979, #f59e0b);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .submit-btn span, .submit-btn svg { position: relative; z-index: 1; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(238,9,121,0.35); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        .submit-btn.success::before { background: #22c55e; animation: none; }
        .btn-text { color: white; font-size: 14px; font-weight: 500; }

        .divider { display: flex; align-items: center; gap: 16px; margin: 28px 0 20px; }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .divider-text { font-size: 11px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 1px; }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.25);
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: rgba(255,255,255,0.6); }

        .dev-hint {
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }
        .dev-hint-text { font-size: 12px; color: rgba(255,255,255,0.25); font-family: 'Courier New', monospace; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeSlideUp 0.5s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      <div className="login-root">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />

        {/* Panel izquierdo decorativo */}
        <div className="left-panel">
          <div className="left-content">
            <div className="brand-tag">
              <div className="brand-dot" />
              Panel de control
            </div>
            <h1 className="left-title">
              Tu tienda,<br />
              <em>tu estilo.</em>
            </h1>
            <p className="left-subtitle">
              Gestiona colecciones, pedidos e inventario
              desde un solo lugar diseñado para marcas que
              se mueven rápido.
            </p>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">∞</span>
                <span className="stat-label">Productos</span>
              </div>
              <div className="stat">
                <span className="stat-num">24/7</span>
                <span className="stat-label">Disponible</span>
              </div>
              <div className="stat">
                <span className="stat-num">1</span>
                <span className="stat-label">Admin</span>
              </div>
            </div>
          </div>

          <div className="deco-card deco-card-1">
            <div className="deco-card-label">Ventas hoy</div>
            <div className="deco-card-value">$1,240</div>
            <div className="deco-card-sub">↑ 12% vs ayer</div>
          </div>
          <div className="deco-card deco-card-2">
            <div className="deco-card-label">Nuevos pedidos</div>
            <div className="deco-card-value">8</div>
            <div className="deco-card-sub">pendientes</div>
          </div>
        </div>

        {/* Panel derecho - formulario */}
        <div className="right-panel">
          <div className="form-header animate-in delay-1">
            <div className="form-eyebrow">Acceso exclusivo</div>
            <h2 className="form-title">Bienvenido<br />de vuelta</h2>
            <p className="form-subtitle">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-box">
                <svg width="16" height="16" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="error-text">{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="field-group animate-in delay-2">
              <label className={`field-label ${focusedField === 'email' ? 'focused' : ''}`}>
                Correo electrónico
              </label>
              <div className={`field-wrap ${focusedField === 'email' ? 'field-focused' : ''}`}>
                <svg className="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="username"
                  className="field-input"
                  placeholder="admin@pane.local"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="field-group animate-in delay-3">
              <label className={`field-label ${focusedField === 'password' ? 'focused' : ''}`}>
                Contraseña
              </label>
              <div className={`field-wrap ${focusedField === 'password' ? 'field-focused' : ''}`}>
                <svg className="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                  className="field-input has-right"
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="animate-in delay-4">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`submit-btn ${isSuccess ? 'success' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="btn-text">Verificando...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="btn-text">¡Bienvenido!</span>
                  </>
                ) : (
                  <span className="btn-text">Iniciar sesión →</span>
                )}
              </button>
            </div>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">o</span>
            <div className="divider-line" />
          </div>

          <a href="/tienda" className="back-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la tienda
          </a>

          {import.meta.env.DEV && (
            <div className="dev-hint">
              <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="dev-hint-text">admin@pane.local · admin123</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}