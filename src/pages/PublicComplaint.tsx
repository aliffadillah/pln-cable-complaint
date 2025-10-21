import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PublicComplaint.css'

const PublicComplaintForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    priority: 'MEDIUM'
  })
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticketNumber, setTicketNumber] = useState('')

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    const maxFiles = 5
    
    // Validate file count
    if (imageFiles.length + files.length > maxFiles) {
      setError(`Maksimal ${maxFiles} foto`)
      return
    }

    setUploading(true)
    setError('')

    try {
      const newImages: string[] = []
      const newFiles: File[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file size
        if (file.size > maxSize) {
          setError(`File ${file.name} terlalu besar. Maksimal 5MB`)
          continue
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} bukan gambar`)
          continue
        }

        // Convert to base64
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })

        const base64 = await base64Promise
        newImages.push(base64)
        newFiles.push(file)
      }

      setImages([...images, ...newImages])
      setImageFiles([...imageFiles, ...newFiles])
    } catch (err) {
      setError('Gagal mengupload foto')
    } finally {
      setUploading(false)
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImageFiles(imageFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/public/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: images // Send base64 images
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit complaint')
      }

      setTicketNumber(data.data.ticketNumber)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (ticketNumber) {
    return (
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h2>Laporan Berhasil Dikirim!</h2>
        <p>Nomor Tiket Anda:</p>
        <div className="ticket-number">{ticketNumber}</div>
        <p className="success-message">
          Simpan nomor tiket ini untuk melacak status laporan Anda.
          Anda juga akan menerima email konfirmasi.
        </p>
        <div className="success-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate(`/track/${ticketNumber}`)}
          >
            Lacak Status
          </button>
          <button 
            className="btn-secondary"
            onClick={() => {
              setTicketNumber('')
              setFormData({
                title: '',
                description: '',
                location: '',
                reporterName: '',
                reporterEmail: '',
                reporterPhone: '',
                priority: 'MEDIUM'
              })
            }}
          >
            Buat Laporan Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="public-complaint-form">
      <div className="form-header">
        <h2>Buat Laporan Gangguan</h2>
        <p>Silakan lengkapi form di bawah ini untuk melaporkan masalah kabel listrik Anda</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Informasi Pelapor</h3>
          <div className="form-group">
            <label htmlFor="reporterName">
              Nama Lengkap <span className="required">*</span>
            </label>
            <input
              type="text"
              id="reporterName"
              name="reporterName"
              value={formData.reporterName}
              onChange={handleChange}
              required
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reporterEmail">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="reporterEmail"
                name="reporterEmail"
                value={formData.reporterEmail}
                onChange={handleChange}
                required
                placeholder="contoh@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reporterPhone">
                Nomor Telepon <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="reporterPhone"
                name="reporterPhone"
                value={formData.reporterPhone}
                onChange={handleChange}
                required
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Detail Laporan</h3>
          <div className="form-group">
            <label htmlFor="title">
              Judul Laporan <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Contoh: Kabel Putus di Jalan Sudirman"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              Lokasi <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Deskripsi Masalah <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Jelaskan detail masalah yang Anda alami..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">
              Tingkat Prioritas <span className="required">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="LOW">Rendah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Tinggi</option>
              <option value="URGENT">Mendesak</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="images">
              Foto Bukti (Opsional)
            </label>
            <p className="field-hint">Maksimal 5 foto, ukuran masing-masing maksimal 5MB</p>
            
            <div className="image-upload-container">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input"
                disabled={uploading || images.length >= 5}
              />
              <label htmlFor="images" className={`file-input-label ${uploading || images.length >= 5 ? 'disabled' : ''}`}>
                <span className="upload-icon">📷</span>
                <span>{uploading ? 'Mengupload...' : 'Pilih Foto'}</span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      title="Hapus foto"
                    >
                      ✕
                    </button>
                    <div className="image-info">
                      {imageFiles[index]?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || uploading}
          >
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </form>

      <div className="form-footer">
        <p>
          Sudah punya nomor tiket? <a href="/track">Lacak status laporan Anda</a>
        </p>
      </div>
    </div>
  )
}

const PublicComplaint = () => {
  const navigate = useNavigate()

  return (
    <div className="public-complaint-page">
      <header className="public-header">
        <div className="header-container">
          <div className="logo-container" onClick={() => navigate('/')}>
            <img src="/logo/pln.png" alt="PLN Logo" className="logo" />
            <div className="logo-text">
              <h1>PLN Care</h1>
              <p>Sistem Pengaduan Kabel</p>
            </div>
          </div>
          <button className="nav-button" onClick={() => navigate('/track')}>
            Lacak Laporan
          </button>
        </div>
      </header>

      <main className="public-main">
        <PublicComplaintForm />
      </main>

      <footer className="public-footer">
        <p>&copy; 2025 PLN Care. Semua hak cipta dilindungi.</p>
      </footer>
    </div>
  )
}

export default PublicComplaint
