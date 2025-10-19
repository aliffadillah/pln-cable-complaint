import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'
import {
  Bell,
  ChevronDown,
  User,
  Menu,
  X,
  MapPin,
  Eye,
  Plus,
  UserPlus,
  Download,
  Upload,
  Calendar,
  FileBarChart,
  Clipboard,
  CheckSquare,
  FileText,
  Settings,
  LogOut
} from 'lucide-react'

interface DashboardStats {
  totalComplaints: number
  pendingComplaints: number
  inProgressComplaints: number
  resolvedComplaints: number
  myAssignedTasks?: number
}

interface RecentComplaint {
  id: string
  title: string
  status: string
  priority: string
  location: string
  createdAt: string
}

function Dashboard() {
  const { user, logout, isAdmin, isPetugas } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const token = localStorage.getItem('token')

    try {
      // Fetch stats
      const statsResponse = await fetch(`${API_URL}/complaints/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch recent complaints
      const complaintsResponse = await fetch(`${API_URL}/complaints?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const complaintsData = await complaintsResponse.json()
      setRecentComplaints(complaintsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'badge-warning'
      case 'IN_PROGRESS':
        return 'badge-info'
      case 'RESOLVED':
        return 'badge-success'
      case 'REJECTED':
        return 'badge-danger'
      default:
        return 'badge-default'
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'badge-danger'
      case 'HIGH':
        return 'badge-warning'
      case 'MEDIUM':
        return 'badge-info'
      case 'LOW':
        return 'badge-success'
      default:
        return 'badge-default'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memuat dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${showMobileMenu ? 'active' : ''}`}
        onClick={() => setShowMobileMenu(false)}
      ></div>

      {/* Sidebar Component */}
      <Sidebar
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        isAdmin={isAdmin}
        isPetugas={isPetugas}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>Dashboard</h1>
            <p className="breadcrumb">
              <span>Home</span> / <span className="active">Dashboard</span>
            </p>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" title="Notifikasi">
              <span className="notification-badge">3</span>
              <Bell size={20} />
            </button>
            <div className="user-menu">
              <button
                className="user-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">
                    {user?.role === 'ADMIN_UTAMA' ? 'Admin Utama' : 'Petugas Lapangan'}
                  </span>
                </div>
                <ChevronDown size={16} className="dropdown-icon" />
              </button>
              {showProfileMenu && (
                <div className="user-dropdown">
                  <a href="#profile">
                    <User size={18} /> Profil
                  </a>
                  <a href="#settings">
                    <Settings size={18} /> Pengaturan
                  </a>
                  <hr />
                  <a href="#logout" onClick={handleLogout}>
                    <LogOut size={18} /> Keluar
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Clipboard size={28} strokeWidth={2} />
            </div>
            <div className="stat-content">
              <h3>{stats?.totalComplaints || 0}</h3>
              <p>Total Pengaduan</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">
              <Calendar size={28} strokeWidth={2} />
            </div>
            <div className="stat-content">
              <h3>{stats?.pendingComplaints || 0}</h3>
              <p>Menunggu</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <Settings size={28} strokeWidth={2} />
            </div>
            <div className="stat-content">
              <h3>{stats?.inProgressComplaints || 0}</h3>
              <p>Dalam Proses</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <CheckSquare size={28} strokeWidth={2} />
            </div>
            <div className="stat-content">
              <h3>{stats?.resolvedComplaints || 0}</h3>
              <p>Selesai</p>
            </div>
          </div>
        </div>

        {/* Additional Stats for Petugas */}
        {isPetugas && stats?.myAssignedTasks !== undefined && (
          <div className="info-banner">
            <Clipboard className="info-icon" size={24} strokeWidth={2} />
            <p>
              Anda memiliki <strong>{stats.myAssignedTasks}</strong> tugas yang ditugaskan kepada Anda
            </p>
          </div>
        )}

        {/* Recent Complaints */}
        <div className="card">
          <div className="card-header">
            <h2>Pengaduan Terbaru</h2>
            <a href="#all-complaints" className="btn-link">
              Lihat Semua →
            </a>
          </div>
          <div className="card-body">
            {recentComplaints.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" size={56} strokeWidth={1.5} />
                <p>Belum ada pengaduan</p>
              </div>
            ) : (
              <div className="complaints-table">
                <table>
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Lokasi</th>
                      <th>Status</th>
                      <th>Prioritas</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td data-label="Judul">
                          <div className="complaint-title">
                            <strong>{complaint.title}</strong>
                          </div>
                        </td>
                        <td data-label="Lokasi">
                          <span className="location">
                            <MapPin size={14} /> {complaint.location}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${getStatusBadgeClass(complaint.status)}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td data-label="Prioritas">
                          <span className={`badge ${getPriorityBadgeClass(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td data-label="Tanggal">
                          <span className="date">{formatDate(complaint.createdAt)}</span>
                        </td>
                        <td data-label="Aksi">
                          <button className="btn-action" title="Lihat Detail">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Aksi Cepat</h2>
          <div className="actions-grid">
            {isAdmin && (
              <>
                <button className="action-card">
                  <Plus className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Buat Pengaduan Baru</span>
                </button>
                <button className="action-card">
                  <UserPlus className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Tambah Petugas</span>
                </button>
                <button className="action-card">
                  <FileBarChart className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Lihat Laporan</span>
                </button>
                <button className="action-card">
                  <Download className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Export Data</span>
                </button>
              </>
            )}
            {isPetugas && (
              <>
                <button className="action-card">
                  <Plus className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Buat Pengaduan</span>
                </button>
                <button className="action-card">
                  <CheckSquare className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Lihat Tugas</span>
                </button>
                <button className="action-card">
                  <FileText className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Update Status</span>
                </button>
                <button className="action-card">
                  <Upload className="action-icon" size={32} strokeWidth={2} />
                  <span className="action-text">Upload Foto</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        aria-label="Toggle Menu"
      >
        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  )
}

export default Dashboard
