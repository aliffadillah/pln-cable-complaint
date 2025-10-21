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
  activeSection?: string
  onSectionChange?: (section: string) => void
}

function Sidebar({ isOpen, onClose, isAdmin, isPetugas, onLogout, activeSection = 'overview', onSectionChange }: SidebarProps) {
  const handleSectionClick = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    onClose();
  };

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
        <button 
          className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`} 
          onClick={() => handleSectionClick('overview')}
        >
          <LayoutDashboard className="nav-icon" size={20} />
          <span className="nav-text">Overview</span>
        </button>
        <button 
          className={`nav-item ${activeSection === 'complaints' ? 'active' : ''}`}
          onClick={() => handleSectionClick('complaints')}
        >
          <FileText className="nav-icon" size={20} />
          <span className="nav-text">Pengaduan</span>
        </button>
        {isAdmin && (
          <button 
            className={`nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => handleSectionClick('users')}
          >
            <Users className="nav-icon" size={20} />
            <span className="nav-text">Pengguna</span>
          </button>
        )}
        {isPetugas && (
          <button 
            className={`nav-item ${activeSection === 'tasks' ? 'active' : ''}`}
            onClick={() => handleSectionClick('tasks')}
          >
            <CheckSquare className="nav-icon" size={20} />
            <span className="nav-text">Tugas Saya</span>
          </button>
        )}
        <button 
          className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
          onClick={() => handleSectionClick('reports')}
        >
          <BarChart3 className="nav-icon" size={20} />
          <span className="nav-text">Laporan</span>
        </button>
        <button 
          className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => handleSectionClick('settings')}
        >
          <Settings className="nav-icon" size={20} />
          <span className="nav-text">Pengaturan</span>
        </button>
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
