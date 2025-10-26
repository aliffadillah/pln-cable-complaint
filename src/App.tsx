import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import PublicComplaint from './pages/PublicComplaint'
import TrackComplaint from './pages/TrackComplaint'
import FieldOfficerDashboard from './pages/FieldOfficerDashboard'
import { useAuth } from './context/AuthContext'

function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo-container">
            <img src="/logo/pln.png" alt="PLN Logo" className="logo" />
            <div className="logo-text">
              <h1>PLN Care</h1>
              <p>Sistem Pengaduan Kabel</p>
            </div>
          </div>
          <div className="nav-buttons">
            <button className="nav-button-outline" onClick={() => navigate('/track')}>
              Lacak Laporan
            </button>
            <button className="nav-button" onClick={() => setShowLogin(true)}>
              Masuk
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h2>
              Laporkan Masalah Kabel Listrik <span className="highlight">dengan Mudah</span>
            </h2>
            <p>
              Sistem pengaduan modern yang memudahkan Anda melaporkan permasalahan 
              kabel listrik. Cepat, efisien, dan transparan.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/public-complaint')}>
                Buat Laporan
              </button>
              <button className="btn-secondary" onClick={() => navigate('/track')}>
                Cek Status
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="illustration-icon">⚡</div>
              <h3 style={{ color: 'var(--primary-blue)', marginTop: '1rem' }}>
                Laporan Real-time
              </h3>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                Pantau status pengaduan Anda secara real-time dengan sistem tracking yang canggih
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="section-title">
            <h2>Mengapa Memilih PLN Care?</h2>
            <p>Solusi pengaduan yang dirancang untuk kemudahan Anda</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Cepat & Mudah</h3>
              <p>
                Laporkan masalah kabel listrik hanya dalam beberapa klik. 
                Antarmuka yang intuitif dan user-friendly.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Lokasi Akurat</h3>
              <p>
                Sistem GPS terintegrasi untuk menentukan lokasi masalah 
                secara akurat dan mempercepat respons.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Respons Cepat</h3>
              <p>
                Tim teknisi kami siap merespons laporan Anda dengan cepat 
                untuk penanganan yang efektif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>Siap Melaporkan Masalah?</h2>
          <p>
        Bergabunglah dengan ribuan pengguna yang telah merasakan 
        kemudahan sistem pengaduan PLN Care.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/public-complaint')}>
          Mulai Sekarang
        </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-about">
              <h3>PLN Care</h3>
              <p>
                Sistem pengaduan permasalahan kabel listrik yang modern, 
                efisien, dan terpercaya untuk melayani masyarakat Indonesia.
              </p>
            </div>
            <div className="footer-links">
              <h4>Layanan</h4>
              <ul>
                <li><a href="#lapor">Buat Laporan</a></li>
                <li><a href="#status">Cek Status</a></li>
                <li><a href="#riwayat">Riwayat</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Tentang</h4>
              <ul>
                <li><a href="#about">Tentang Kami</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#kontak">Kontak</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privasi</a></li>
                <li><a href="#terms">Syarat & Ketentuan</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 PLN Care. Semua hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  )
}

function App() {
  const { isAuthenticated, user } = useAuth()

  // Redirect to appropriate dashboard based on role
  const getDashboard = () => {
    if (!isAuthenticated) return <LandingPage />
    
    if (user?.role === 'PETUGAS_LAPANGAN') {
      return <FieldOfficerDashboard />
    }
    
    return <AdminDashboard />
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={getDashboard()} />
        <Route path="/public-complaint" element={<PublicComplaint />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/track/:ticketNumber" element={<TrackComplaint />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={isAuthenticated ? getDashboard() : <LandingPage />} />
        <Route path="/admin" element={isAuthenticated && user?.role !== 'PETUGAS_LAPANGAN' ? <AdminDashboard /> : <LandingPage />} />
        <Route path="/field-officer" element={isAuthenticated && user?.role === 'PETUGAS_LAPANGAN' ? <FieldOfficerDashboard /> : <LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App
