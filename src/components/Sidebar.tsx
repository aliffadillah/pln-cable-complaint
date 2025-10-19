import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
  isPetugas: boolean
  onLogout: () => void
}

function Sidebar({ isOpen, onClose, isAdmin, isPetugas, onLogout }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo/pln.png" alt="PLN Logo" />
          <div className="sidebar-logo-text">
            <h2>PLN Care</h2>
            <p>Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a href="#overview" className="nav-item active" onClick={onClose}>
          <LayoutDashboard className="nav-icon" size={20} />
          <span className="nav-text">Overview</span>
        </a>
        <a href="#complaints" className="nav-item" onClick={onClose}>
          <FileText className="nav-icon" size={20} />
          <span className="nav-text">Pengaduan</span>
        </a>
        {isAdmin && (
          <a href="#users" className="nav-item" onClick={onClose}>
            <Users className="nav-icon" size={20} />
            <span className="nav-text">Pengguna</span>
          </a>
        )}
        {isPetugas && (
          <a href="#tasks" className="nav-item" onClick={onClose}>
            <CheckSquare className="nav-icon" size={20} />
            <span className="nav-text">Tugas Saya</span>
          </a>
        )}
        <a href="#reports" className="nav-item" onClick={onClose}>
          <BarChart3 className="nav-icon" size={20} />
          <span className="nav-text">Laporan</span>
        </a>
        <a href="#settings" className="nav-item" onClick={onClose}>
          <Settings className="nav-icon" size={20} />
          <span className="nav-text">Pengaturan</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={onLogout}>
          <LogOut className="nav-icon" size={20} />
          <span className="nav-text">Keluar</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
