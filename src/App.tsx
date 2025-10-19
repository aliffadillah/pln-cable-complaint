import './App.css'

function App() {
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
          <button className="nav-button">Masuk</button>
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
              <button className="btn-primary">Buat Laporan</button>
              <button className="btn-secondary">Cek Status</button>
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
              <div className="feature-icon">🔔</div>
              <h3>Notifikasi Real-time</h3>
              <p>
                Dapatkan update langsung mengenai status pengaduan Anda 
                melalui notifikasi real-time.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Tracking Transparan</h3>
              <p>
                Pantau progress penanganan dari awal hingga selesai dengan 
                sistem tracking yang transparan.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Aman & Terpercaya</h3>
              <p>
                Data Anda terlindungi dengan enkripsi tingkat tinggi. 
                Privasi dan keamanan adalah prioritas kami.
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

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          <div className="stat-item">
            <h3>10K+</h3>
            <p>Laporan Terselesaikan</p>
          </div>
          <div className="stat-item">
            <h3>95%</h3>
            <p>Tingkat Kepuasan</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Layanan Tersedia</p>
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
          <button className="btn-primary">Mulai Sekarang</button>
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
    </div>
  )
}

export default App
