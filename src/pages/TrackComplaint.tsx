import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './TrackComplaint.css'

interface ComplaintData {
  ticketNumber: string
  title: string
  description: string
  location: string
  status: string
  priority: string
  images?: string[]
  assignedOfficer: {
    name: string
    phone: string
  } | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  timeline: Array<{
    message: string
    status: string
    createdAt: string
  }>
  workReport: {
    workDescription: string
    workStartTime: string
    workEndTime: string
    beforePhotos: string[]
    afterPhotos: string[]
    status: string
    submittedAt: string
  } | null
  statusInfo: {
    label: string
    description: string
    color: string
  }
}

const TrackComplaintContent = () => {
  const { ticketNumber: urlTicketNumber } = useParams()
  const [ticketNumber, setTicketNumber] = useState(urlTicketNumber || '')
  const [complaint, setComplaint] = useState<ComplaintData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-search if ticket number in URL
  useEffect(() => {
    if (urlTicketNumber) {
      fetchComplaint(urlTicketNumber)
    }
  }, [urlTicketNumber])

  const fetchComplaint = async (ticket: string) => {
    setError('')
    setLoading(true)
    setComplaint(null)

    try {
      const response = await fetch(`http://localhost:5000/api/public/complaints/${ticket}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch complaint')
      }

      setComplaint(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketNumber) {
      fetchComplaint(ticketNumber)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityBadge = (priority: string) => {
    const classes = {
      LOW: 'priority-low',
      MEDIUM: 'priority-medium',
      HIGH: 'priority-high',
      URGENT: 'priority-urgent'
    }
    const labels = {
      LOW: 'Rendah',
      MEDIUM: 'Sedang',
      HIGH: 'Tinggi',
      URGENT: 'Mendesak'
    }
    return (
      <span className={`priority-badge ${classes[priority as keyof typeof classes]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="track-complaint-content">
      <div className="track-header">
        <h2>Lacak Status Laporan</h2>
        <p>Masukkan nomor tiket untuk melihat status laporan Anda</p>
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
            placeholder="Contoh: PLN-2025-123456"
            className="search-input"
            required
          />
          <button type="submit" className="btn-search" disabled={loading}>
            {loading ? 'Mencari...' : 'Lacak'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {complaint && (
        <div className="complaint-details">
          <div className="detail-header">
            <div className="header-main">
              <h2>{complaint.title}</h2>
              <div className="badge-group">
                {getPriorityBadge(complaint.priority)}
                <span className={`status-badge status-${complaint.statusInfo.color}`}>
                  {complaint.statusInfo.label}
                </span>
              </div>
            </div>
            <div className="ticket-info">
              <span className="ticket-label">Nomor Tiket:</span>
              <span className="ticket-value">{complaint.ticketNumber}</span>
            </div>
          </div>

          <div className="detail-content">
            <div className="info-section">
              <h3>Informasi Laporan</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{complaint.statusInfo.label}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tanggal Lapor:</span>
                  <span className="info-value">{formatDate(complaint.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Lokasi:</span>
                  <span className="info-value">{complaint.location}</span>
                </div>
                {complaint.assignedOfficer && (
                  <div className="info-item">
                    <span className="info-label">Petugas:</span>
                    <span className="info-value">
                      {complaint.assignedOfficer.name}
                      <br />
                      <small>{complaint.assignedOfficer.phone}</small>
                    </span>
                  </div>
                )}
              </div>

              <div className="description-box">
                <h4>Deskripsi Masalah:</h4>
                <p>{complaint.description}</p>
              </div>

              {complaint.images && complaint.images.length > 0 && (
                <div className="complaint-photos">
                  <h4>Foto Bukti:</h4>
                  <div className="photo-grid">
                    {complaint.images.map((photo, idx) => (
                      <img key={idx} src={photo} alt={`Bukti ${idx + 1}`} className="complaint-photo" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="status-section">
              <h3>Status Perkembangan</h3>
              <div className="status-info-box">
                <div className={`status-icon status-icon-${complaint.statusInfo.color}`}>
                  {getStatusIcon(complaint.status)}
                </div>
                <div>
                  <h4>{complaint.statusInfo.label}</h4>
                  <p>{complaint.statusInfo.description}</p>
                </div>
              </div>
            </div>

            {complaint.workReport && (
              <div className="work-report-section">
                <h3>Laporan Pekerjaan</h3>
                <div className="work-report-box">
                  <div className="work-info">
                    <p><strong>Deskripsi Pekerjaan:</strong></p>
                    <p>{complaint.workReport.workDescription}</p>
                    <div className="work-time">
                      <span>🕐 Mulai: {formatDate(complaint.workReport.workStartTime)}</span>
                      <span>🕐 Selesai: {formatDate(complaint.workReport.workEndTime)}</span>
                    </div>
                  </div>

                  {complaint.workReport.beforePhotos.length > 0 && (
                    <div className="work-photos">
                      <h4>Foto Sebelum:</h4>
                      <div className="photo-grid">
                        {complaint.workReport.beforePhotos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`Before ${idx + 1}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {complaint.workReport.afterPhotos.length > 0 && (
                    <div className="work-photos">
                      <h4>Foto Sesudah:</h4>
                      <div className="photo-grid">
                        {complaint.workReport.afterPhotos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`After ${idx + 1}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="timeline-section">
              <h3>Timeline</h3>
              <div className="timeline">
                {complaint.timeline.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">{formatDate(item.createdAt)}</div>
                      <div className="timeline-message">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="form-footer">
        <p>
          Belum punya laporan? <a href="/public-complaint">Buat laporan baru</a>
        </p>
      </div>
    </div>
  )
}

const TrackComplaint = () => {
  const navigate = useNavigate()

  return (
    <div className="track-complaint-page">
      <header className="public-header">
        <div className="header-container">
          <div className="logo-container" onClick={() => navigate('/')}>
            <img src="/logo/pln.png" alt="PLN Logo" className="logo" />
            <div className="logo-text">
              <h1>PLN Care</h1>
              <p>Sistem Pengaduan Kabel</p>
            </div>
          </div>
          <button className="nav-button" onClick={() => navigate('/public-complaint')}>
            Buat Laporan
          </button>
        </div>
      </header>

      <main className="public-main">
        <TrackComplaintContent />
      </main>

      <footer className="public-footer">
        <p>&copy; 2025 PLN Care. Semua hak cipta dilindungi.</p>
      </footer>
    </div>
  )
}

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    PENDING: '⏳',
    REVIEWED: '👁️',
    ASSIGNED: '👤',
    ON_THE_WAY: '🚗',
    WORKING: '🔧',
    COMPLETED: '✅',
    APPROVED: '✓',
    RESOLVED: '✓',
    REVISION_NEEDED: '🔄',
    REJECTED: '✗',
    CANCELLED: '✗'
  }
  return icons[status] || '📋'
}

export default TrackComplaint
