import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { complaintsApi, usersApi, workReportsApi } from '../services/api';
import {
  Bell,
  ChevronDown,
  User,
  Menu,
  Settings,
  LogOut,
  Clipboard,
  Calendar,
  CheckSquare,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import './AdminDashboard.css';

interface Complaint {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  assignedTo?: number;
  assignedToUser?: {
    name: string;
  };
  createdAt: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface WorkReport {
  id: number;
  complaint: {
    ticketNumber: string;
    title: string;
    officer?: {
      id: string;
      name: string;
      email: string;
    };
  };
  technician?: {
    name: string;
  };
  workDescription: string;
  reviewStatus: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  submittedAt: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  resolved: number;
}

export default function AdminDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, completed: 0, resolved: 0 });
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  const completionRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const completionRatePercentage = Math.min(Math.max(completionRate, 0), 100);
  const assignedComplaints = complaints.filter((complaint) => Boolean(complaint.assignedTo)).length;
  const unassignedComplaints = complaints.filter((complaint) => !complaint.assignedTo).length;
  const unresolvedComplaints = Math.max(stats.total - stats.resolved, 0);
  const pendingReviewReports = workReports.filter((report) => report.reviewStatus?.toUpperCase() !== 'APPROVED').length;
  const fieldOfficerCandidates = users.filter((member) => member.role?.toLowerCase().includes('field'));
  const totalFieldOfficers = fieldOfficerCandidates.length;
  const activeFieldOfficersOnly = fieldOfficerCandidates.filter((member) => member.isActive);
  const totalActiveOfficers = activeFieldOfficersOnly.length;
  const displayedFieldOfficers = (totalActiveOfficers ? activeFieldOfficersOnly : fieldOfficerCandidates).slice(0, 4);
  const displayedOfficerCount = totalActiveOfficers || totalFieldOfficers;
  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };
  const lastUpdatedAt = formatDateTime(complaints[0]?.createdAt);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWorkReport, setSelectedWorkReport] = useState<WorkReport | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch complaints for overview and complaints section
      if (activeSection === 'overview' || activeSection === 'complaints') {
        const complaintsData = await complaintsApi.getAll();
        setComplaints(complaintsData);
        
        // Calculate stats
        setStats({
          total: complaintsData.length,
          pending: complaintsData.filter((c: Complaint) => c.status === 'PENDING').length,
          inProgress: complaintsData.filter((c: Complaint) => ['REVIEWED', 'ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(c.status)).length,
          completed: complaintsData.filter((c: Complaint) => c.status === 'COMPLETED').length,
          resolved: complaintsData.filter((c: Complaint) => c.status === 'RESOLVED').length,
        });
      }
      
      // Fetch users for users section
      if (activeSection === 'users' && isAdmin) {
        console.log('Fetching users...');
        const usersData = await usersApi.getAll();
        console.log('Users data:', usersData);
        // Backend returns { users: [...] }
        setUsers(usersData.users || usersData);
      }
      
      // Fetch work reports for reports section
      if (activeSection === 'reports') {
        console.log('Fetching work reports...');
        const reportsData = await workReportsApi.getAll();
        console.log('Work reports data:', reportsData);
        // Backend returns { success: true, data: [...] }
        setWorkReports(reportsData.data || reportsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleAssignComplaint = async (complaintId: number, userId: number) => {
    try {
      await complaintsApi.assign(complaintId.toString(), userId.toString());
      await fetchData();
      setShowAssignModal(false);
      alert('Petugas berhasil ditugaskan!');
    } catch (error) {
      console.error('Error assigning complaint:', error);
      alert('Gagal menugaskan petugas');
    }
  };

  const handleReviewWorkReport = async (reportId: number, status: string, notes: string = '') => {
    try {
      await workReportsApi.review(reportId.toString(), status, notes);
      await fetchData();
      setShowReviewModal(false);
      alert('Review berhasil dikirim!');
    } catch (error) {
      console.error('Error reviewing work report:', error);
      alert('Gagal mereview laporan');
    }
  };

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: string }) => {
    try {
      await usersApi.create(data);
      setShowUserModal(false);
      await fetchData();
      alert('User berhasil ditambahkan!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Gagal menambahkan user: ' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    
    try {
      await usersApi.delete(userId.toString());
      await fetchData();
      alert('User berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus user');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      PENDING: { text: 'Pending', class: 'badge-warning' },
      REVIEWED: { text: 'Direview', class: 'badge-info' },
      ASSIGNED: { text: 'Ditugaskan', class: 'badge-primary' },
      ON_THE_WAY: { text: 'Perjalanan', class: 'badge-orange' },
      WORKING: { text: 'Dikerjakan', class: 'badge-purple' },
      COMPLETED: { text: 'Selesai', class: 'badge-success' },
      APPROVED: { text: 'Disetujui', class: 'badge-green' },
      RESOLVED: { text: 'Resolved', class: 'badge-dark-green' }
    };
    const badge = badges[status] || { text: status, class: 'badge-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      RENDAH: 'priority-low',
      SEDANG: 'priority-medium',
      TINGGI: 'priority-high',
      DARURAT: 'priority-urgent'
    };
    return <span className={`priority-badge ${badges[priority] || 'priority-default'}`}>{priority}</span>;
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Render sections
  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-layout">
        <div className="overview-main">
          <div className="stats-grid stats-grid-elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Clipboard size={28} />
              </div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total Pengaduan</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">
                <Calendar size={28} />
              </div>
              <div className="stat-content">
                <h3>{unassignedComplaints}</h3>
                <p>Belum Assign</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <Settings size={28} />
              </div>
              <div className="stat-content">
                <h3>{totalActiveOfficers}</h3>
                <p>Petugas Aktif</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <CheckSquare size={28} />
              </div>
              <div className="stat-content">
                <h3>{completionRatePercentage}%</h3>
                <p>Tingkat Selesai</p>
              </div>
            </div>
          </div>

          <div className="panel recent-complaints">
            <div className="panel-header">
              <div>
                <h2>Pengaduan Terbaru</h2>
                <p className="panel-subtitle">Diperbarui {lastUpdatedAt}</p>
              </div>
              <button
                type="button"
                className="btn-link"
                onClick={() => setActiveSection('complaints')}
              >
                Lihat Semua
              </button>
            </div>
            <div className="table-container compact">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tiket</th>
                    <th>Judul</th>
                    <th>Status</th>
                    <th>Prioritas</th>
                    <th>Petugas</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.slice(0, 10).map(complaint => (
                    <tr key={complaint.id}>
                      <td><code>{complaint.ticketNumber}</code></td>
                      <td>{complaint.title}</td>
                      <td>{getStatusBadge(complaint.status)}</td>
                      <td>{getPriorityBadge(complaint.priority)}</td>
                      <td>{complaint.assignedToUser?.name || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-sm btn-info" title="Lihat Detail">
                            <Eye size={16} />
                            <span>Detail</span>
                          </button>
                          {!complaint.assignedTo && complaint.status === 'PENDING' && (
                            <button
                              className="btn-sm btn-primary"
                              title="Assign Petugas"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowAssignModal(true);
                              }}
                            >
                              <UserPlus size={16} />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="overview-sidebar">
          <div className="insight-card hero-card">
            <span className="badge">Progress Layanan</span>
            <h3>Halo, {user?.name?.split(' ')[0] || 'Admin'} 👋</h3>
            <p className="panel-subtitle">
              {completionRate}% pengaduan terselesaikan dari {stats.total} tiket aktif.
            </p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionRatePercentage}%` }} />
            </div>
            <div className="insight-metrics">
              <div>
                <h4>{stats.pending}</h4>
                <span>Pending</span>
              </div>
              <div>
                <h4>{stats.inProgress}</h4>
                <span>Dalam Proses</span>
              </div>
              <div>
                <h4>{stats.resolved}</h4>
                <span>Selesai</span>
              </div>
            </div>
          </div>

          <div className="insight-card team-card">
            <div className="panel-header minimal">
              <h3>Tim Lapangan Aktif</h3>
              <span className="panel-subtitle">{displayedOfficerCount || 0} petugas siap bertugas</span>
            </div>
            <ul className="team-list">
              {displayedFieldOfficers.length ? (
                displayedFieldOfficers.map((officer) => (
                  <li key={officer.id} className="team-member">
                    <div className="team-avatar">{officer.name.slice(0, 2).toUpperCase()}</div>
                    <div className="team-info">
                      <span className="team-name">{officer.name}</span>
                      <span className="team-email">{officer.email}</span>
                    </div>
                    <span className={`team-status ${officer.isActive ? 'active' : 'inactive'}`}>
                      {officer.isActive ? 'Aktif' : 'Offline'}
                    </span>
                  </li>
                ))
              ) : (
                <li className="team-empty">Belum ada petugas lapangan terdaftar.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );

  const renderComplaints = () => (
    <div className="complaints-section">
      <div className="section-header">
        <h2>Manajemen Pengaduan</h2>
        <div className="section-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari tiket atau judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Direview</option>
            <option value="ASSIGNED">Ditugaskan</option>
            <option value="WORKING">Dikerjakan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tiket</th>
              <th>Judul</th>
              <th>Lokasi</th>
              <th>Pelapor</th>
              <th>Status</th>
              <th>Prioritas</th>
              <th>Petugas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map(complaint => (
              <tr key={complaint.id}>
                <td><code>{complaint.ticketNumber}</code></td>
                <td>{complaint.title}</td>
                <td>{complaint.location}</td>
                <td>{complaint.reporterName || complaint.reporterEmail || '-'}</td>
                <td>{getStatusBadge(complaint.status)}</td>
                <td>{getPriorityBadge(complaint.priority)}</td>
                <td>{complaint.assignedToUser?.name || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-info" title="Lihat Detail">
                      <Eye size={16} />
                      <span>Detail</span>
                    </button>
                    {!complaint.assignedTo && (
                      <button 
                        className="btn-sm btn-primary"
                        title="Assign Petugas"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowAssignModal(true);
                        }}
                      >
                        <UserPlus size={16} />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-section">
      <div className="section-header">
        <h2>Manajemen Pengguna</h2>
        <button className="btn-primary" onClick={() => setShowUserModal(true)}>
          <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Bergabung</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Tidak ada data pengguna. Silakan tambah pengguna baru.
                </td>
              </tr>
            ) : (
              users.map(userData => (
                <tr key={userData.id}>
                  <td>{userData.name}</td>
                  <td>{userData.email}</td>
                  <td>
                    <span className="role-badge">
                      {userData.role === 'ADMIN_UTAMA' ? 'Admin' : 
                       userData.role === 'SUPERVISOR' ? 'Supervisor' : 'Petugas'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${userData.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {userData.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>{new Date(userData.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-sm btn-info" title="Edit User">
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      <button 
                        className="btn-sm btn-danger" 
                        title="Hapus User"
                        onClick={() => handleDeleteUser(userData.id)}
                      >
                        <Trash2 size={16} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-section">
      <div className="section-header">
        <h2>Laporan Pengerjaan</h2>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tiket</th>
              <th>Judul Pengaduan</th>
              <th>Petugas</th>
              <th>Biaya Total</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {workReports.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Belum ada laporan pengerjaan.
                </td>
              </tr>
            ) : (
              workReports.map(report => (
                <tr key={report.id}>
                  <td><code>{report.complaint?.ticketNumber}</code></td>
                  <td>{report.complaint?.title}</td>
                  <td>{report.complaint?.officer?.name || '-'}</td>
                  <td>Rp {report.totalCost?.toLocaleString('id-ID') || '0'}</td>
                  <td>{getStatusBadge(report.reviewStatus)}</td>
                  <td>{new Date(report.submittedAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-sm btn-info"
                        title="Review Laporan"
                        onClick={() => {
                          setSelectedWorkReport(report);
                          setShowReviewModal(true);
                        }}
                      >
                        <Eye size={16} />
                        <span>Review</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className={`mobile-overlay ${showMobileMenu ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)} />

      <Sidebar
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        isAdmin={isAdmin}
        isPetugas={false}
        onLogout={handleLogout}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <Menu size={24} />
            </button>
            <div>
              <h1>{activeSection === 'overview' ? 'Dashboard' : 
                   activeSection === 'complaints' ? 'Pengaduan' :
                   activeSection === 'users' ? 'Pengguna' :
                   activeSection === 'reports' ? 'Laporan' : 'Pengaturan'}</h1>
              <p className="breadcrumb">Home / {activeSection}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn">
              <span className="notification-badge">3</span>
              <Bell size={20} />
            </button>
            <div className="user-menu">
              <button className="user-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="user-avatar">{user?.name.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">Administrator</span>
                </div>
                <ChevronDown size={16} />
              </button>
              {showProfileMenu && (
                <div className="user-dropdown">
                  <a href="#profile"><User size={18} /> Profil</a>
                  <a href="#settings"><Settings size={18} /> Pengaturan</a>
                  <hr />
                  <a href="#logout" onClick={handleLogout}><LogOut size={18} /> Keluar</a>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'complaints' && renderComplaints()}
              {activeSection === 'users' && renderUsers()}
              {activeSection === 'reports' && renderReports()}
              {activeSection === 'settings' && (
                <div className="settings-section">
                  <h2>Pengaturan</h2>
                  <p>Fitur pengaturan akan segera hadir...</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah User Baru</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateUser({
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
                  role: formData.get('role') as string
                });
              }}>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input type="text" name="name" required placeholder="Nama lengkap" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" required placeholder="Minimal 6 karakter" />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" required>
                    <option value="">-- Pilih Role --</option>
                    <option value="PETUGAS_LAPANGAN">Petugas Lapangan</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN_UTAMA">Admin Utama</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Simpan</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tugaskan Petugas</h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Tiket:</strong> {selectedComplaint.ticketNumber}</p>
              <p><strong>Judul:</strong> {selectedComplaint.title}</p>
              <div className="form-group">
                <label>Pilih Petugas</label>
                <select 
                  id="assign-user"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignComplaint(selectedComplaint.id, Number(e.target.value));
                    }
                  }}
                >
                  <option value="">-- Pilih Petugas --</option>
                  {users.filter(u => u.role === 'PETUGAS_LAPANGAN').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedWorkReport && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Laporan Pengerjaan</h2>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Petugas:</strong> {selectedWorkReport.complaint?.officer?.name || selectedWorkReport.technician?.name || '-'}</p>
              <p><strong>Deskripsi:</strong> {selectedWorkReport.workDescription}</p>
              <p><strong>Total Biaya:</strong> Rp {selectedWorkReport.totalCost?.toLocaleString('id-ID') || '0'}</p>
              <div className="modal-actions">
                <button 
                  className="btn-success"
                  onClick={() => handleReviewWorkReport(selectedWorkReport.id, 'APPROVED')}
                >
                  ✓ Setujui
                </button>
                <button 
                  className="btn-warning"
                  onClick={() => handleReviewWorkReport(selectedWorkReport.id, 'REVISION_NEEDED', 'Perlu revisi')}
                >
                  ⟳ Revisi
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleReviewWorkReport(selectedWorkReport.id, 'REJECTED', 'Ditolak')}
                >
                  × Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
