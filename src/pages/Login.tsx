import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

interface LoginProps {
  onClose: () => void
}

function Login({ onClose }: LoginProps) {
  const [isLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        await login(formData.email, formData.password)
        onClose()
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Password tidak cocok')
          return
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Registrasi gagal')
        }

        // Auto login after register
        await login(formData.email, formData.password)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-container" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" onClick={onClose}>✕</button>
        
        <div className="login-content">
          {/* Left Side - Branding */}
          <div className="login-brand">
            <div className="login-brand-content">
              <img src="/logo/pln.png" alt="PLN Logo" className="login-logo" />
              <h2>PLN Care</h2>
              <p className="login-tagline">Sistem Pengaduan Kabel Listrik</p>
              <div className="login-illustration">
                <div className="login-icon">⚡</div>
                <p>Laporkan masalah kabel listrik dengan mudah dan cepat</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="login-form-side">
            <div className="login-form-content">
              <h3>{isLogin ? 'Masuk ke Akun' : 'Daftar Akun Baru'}</h3>
              <p className="login-subtitle">
                {isLogin 
                  ? 'Silakan masuk untuk melanjutkan' 
                  : 'Buat akun untuk mulai melaporkan'}
              </p>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                {!isLogin && (
                  <div className="form-group">
                    <label htmlFor="name">Nama Lengkap</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contoh@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Konfirmasi Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Masukkan ulang password"
                      required={!isLogin}
                    />
                  </div>
                )}
                
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
