import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
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
  latitude?: number;
  longitude?: number;
  priority: string;
  status: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  assignedTo?: string;
  assignedToUser?: {
    name: string;
  };
  images?: string[];
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
  assignedAt?: string;
  resolvedAt?: string;
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
    location?: string;
    officer?: {
      id: string;
      name: string;
      email: string;
    };
  };
  technician?: {
    name: string;
  };
  workStartTime: string;
  workEndTime: string;
  workDescription: string;
  materialsUsed?: Array<{ name: string; quantity: number; unit: string }>;
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;
  beforePhotos?: string[];
  afterPhotos?: string[];
  notes?: string;
  technicianNotes?: string;
  reviewStatus: string;
  reviewNotes?: string;
  submittedAt: string;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
  };
  reviewedAt?: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  resolved: number;
}

// Edit User Form Component
function EditUserForm({ 
  user, 
  onSubmit, 
  onCancel 
}: { 
  user: UserData; 
  onSubmit: (data: { name: string; email: string; role: string; isActive: boolean }) => void;
  onCancel: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: selectedRole,
      isActive: isActive
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label>Nama Lengkap</label>
          <input 
            type="text" 
            name="name" 
            className="form-control" 
            defaultValue={user.name}
            required 
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            name="email" 
            className="form-control" 
            defaultValue={user.email}
            required 
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select 
            name="role" 
            className="form-control" 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
          >
            <option value="ADMIN_UTAMA">Admin Utama</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="PETUGAS_LAPANGAN">Petugas Lapangan</option>
          </select>
        </div>
        
        {/* Status Aktif/Nonaktif untuk Petugas Lapangan */}
        {selectedRole === 'PETUGAS_LAPANGAN' && (
          <div className="form-group">
            <label className="status-toggle-label">
              <span className="status-label-text">Status Petugas</span>
              <div className="status-toggle-wrapper">
                <input 
                  type="radio" 
                  name="isActive" 
                  value="true" 
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  className="status-radio"
                  id="status-active"
                />
                <label htmlFor="status-active" className="status-option status-active">
                  <CheckSquare size={18} />
                  <span>Aktif</span>
                </label>
                
                <input 
                  type="radio" 
                  name="isActive" 
                  value="false" 
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  className="status-radio"
                  id="status-inactive"
                />
                <label htmlFor="status-inactive" className="status-option status-inactive">
                  <Trash2 size={18} />
                  <span>Nonaktif</span>
                </label>
              </div>
            </label>
            <small className="form-hint">
              {isActive ? 
                '✓ Petugas dapat menerima penugasan laporan' : 
                '✗ Petugas tidak dapat menerima penugasan baru'}
            </small>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary">
          <CheckSquare size={18} />
          Simpan Perubahan
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const { alert, showSuccess, showError, showWarning, hideAlert } = useCustomAlert();
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
  const fieldOfficerCandidates = users.filter((member) => member.role === 'PETUGAS_LAPANGAN');
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
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
      
      // Always fetch users (needed for assign modal dropdown)
      if (isAdmin) {
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
      showError('Gagal memuat data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleAssignComplaint = async (complaintId: number, userId: string) => {
    try {
      await complaintsApi.assign(complaintId.toString(), userId);
      await fetchData();
      setShowAssignModal(false);
      setSelectedOfficerId('');
      showSuccess('Petugas berhasil ditugaskan!');
    } catch (error) {
      console.error('Error assigning complaint:', error);
      showError('Gagal menugaskan petugas');
    }
  };

  const handleReviewWorkReport = async (reportId: number, status: string, notes: string = '') => {
    try {
      await workReportsApi.review(reportId.toString(), status, notes);
      await fetchData();
      setShowReviewModal(false);
      showSuccess('Review berhasil dikirim!');
    } catch (error) {
      console.error('Error reviewing work report:', error);
      showError('Gagal mereview laporan');
    }
  };

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: string }) => {
    try {
      await usersApi.create(data);
      setShowUserModal(false);
      await fetchData();
      showSuccess('User berhasil ditambahkan!');
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Gagal menambahkan user: ' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    
    try {
      await usersApi.delete(userId.toString());
      await fetchData();
      showSuccess('User berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Gagal menghapus user');
    }
  };

  const handleEditUser = (userData: UserData) => {
    setSelectedUser(userData);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (userId: number, data: { name: string; email: string; role: string; isActive: boolean }) => {
    try {
      await usersApi.update(userId.toString(), data);
      await fetchData();
      setShowEditUserModal(false);
      setSelectedUser(null);
      showSuccess('Data user berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Gagal memperbarui data user: ' + (error as Error).message);
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
                          <button 
                            className="btn-sm btn-info" 
                            title="Lihat Detail"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowDetailModal(true);
                            }}
                          >
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

          <div className="insight-card team-card-enhanced">
            <div className="team-card-header">
              <div className="team-header-content">
                <div className="team-icon-wrapper">
                  <User size={24} className="team-icon" />
                </div>
                <div>
                  <h3>Tim Lapangan Aktif</h3>
                  <span className="team-subtitle">
                    <span className="team-count">{totalActiveOfficers}</span> dari <span className="team-total">{totalFieldOfficers}</span> petugas siap bertugas
                  </span>
                </div>
              </div>
              {totalActiveOfficers > 0 && (
                <div className="team-progress-mini">
                  <div 
                    className="team-progress-fill" 
                    style={{ width: `${(totalActiveOfficers / totalFieldOfficers) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
            <ul className="team-list-enhanced">
              {displayedFieldOfficers.length ? (
                displayedFieldOfficers.map((officer, index) => (
                  <li key={officer.id} className="team-member-enhanced" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="team-member-left">
                      <div className={`team-avatar-enhanced ${officer.isActive ? 'active' : 'inactive'}`}>
                        {officer.name.slice(0, 2).toUpperCase()}
                        <div className="avatar-status-indicator"></div>
                      </div>
                      <div className="team-info-enhanced">
                        <span className="team-name-enhanced">{officer.name}</span>
                        <span className="team-email-enhanced">{officer.email}</span>
                      </div>
                    </div>
                    <div className="team-status-wrapper">
                      <span className={`team-status-badge ${officer.isActive ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        {officer.isActive ? 'Aktif' : 'Offline'}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="team-empty-enhanced">
                  <div className="empty-icon">
                    <User size={48} />
                  </div>
                  <p className="empty-title">Belum Ada Petugas</p>
                  <p className="empty-subtitle">Tambahkan petugas lapangan untuk memulai</p>
                </li>
              )}
            </ul>
            {totalFieldOfficers > 4 && (
              <div className="team-card-footer">
                <button 
                  className="btn-view-all"
                  onClick={() => setActiveSection('users')}
                >
                  Lihat Semua Petugas ({totalFieldOfficers})
                </button>
              </div>
            )}
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
                    <button 
                      className="btn-sm btn-info" 
                      title="Lihat Detail"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setShowDetailModal(true);
                      }}
                    >
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
                      <button 
                        className="btn-sm btn-info" 
                        title="Edit User"
                        onClick={() => handleEditUser(userData)}
                      >
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
        <div className="modal-overlay" onClick={() => {
          setShowAssignModal(false);
          setSelectedOfficerId('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tugaskan Petugas</h2>
              <button className="close-btn" onClick={() => {
                setShowAssignModal(false);
                setSelectedOfficerId('');
              }}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Tiket:</strong> {selectedComplaint.ticketNumber}</p>
              <p><strong>Judul:</strong> {selectedComplaint.title}</p>
              <div className="form-group">
                <label>Pilih Petugas</label>
                <select 
                  id="assign-user"
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  disabled={users.filter(u => u.role === 'PETUGAS_LAPANGAN').length === 0}
                >
                  <option value="">-- Pilih Petugas --</option>
                  {users.filter(u => u.role === 'PETUGAS_LAPANGAN').length === 0 ? (
                    <option value="" disabled>Tidak ada petugas lapangan tersedia</option>
                  ) : (
                    users.filter(u => u.role === 'PETUGAS_LAPANGAN').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.isActive ? '✓ Aktif' : '○ Nonaktif'}
                      </option>
                    ))
                  )}
                </select>
                {users.filter(u => u.role === 'PETUGAS_LAPANGAN').length === 0 && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Belum ada petugas lapangan. Silakan tambah user dengan role "Petugas Lapangan" terlebih dahulu di menu Pengguna.
                  </p>
                )}
              </div>
              
              {selectedOfficerId && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '8px',
                  border: '1px solid #60a5fa'
                }}>
                  <p style={{ margin: 0, color: '#1e40af', fontSize: '0.875rem', fontWeight: '600' }}>
                    📌 Petugas yang dipilih: {users.find(u => u.id === Number(selectedOfficerId))?.name}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1e40af', fontSize: '0.8125rem' }}>
                    Klik tombol "Tugaskan" untuk mengkonfirmasi penugasan.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOfficerId('');
                }}
              >
                Batal
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  if (selectedOfficerId) {
                    handleAssignComplaint(selectedComplaint.id, selectedOfficerId);
                  }
                }}
                disabled={!selectedOfficerId}
              >
                Tugaskan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Laporan Pengaduan</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Informasi Tiket */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>🎫 Informasi Tiket</h3>
                <div className="review-grid">
                  <div><strong>Nomor Tiket:</strong> <code style={{ backgroundColor: '#f0f9ff', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#0066cc' }}>{selectedComplaint.ticketNumber}</code></div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedComplaint.status)}</div>
                  <div><strong>Prioritas:</strong> {getPriorityBadge(selectedComplaint.priority)}</div>
                  <div><strong>Tanggal Lapor:</strong> {new Date(selectedComplaint.createdAt).toLocaleString('id-ID')}</div>
                  {selectedComplaint.assignedAt && (
                    <div><strong>Ditugaskan:</strong> {new Date(selectedComplaint.assignedAt).toLocaleString('id-ID')}</div>
                  )}
                  {selectedComplaint.resolvedAt && (
                    <div><strong>Diselesaikan:</strong> {new Date(selectedComplaint.resolvedAt).toLocaleString('id-ID')}</div>
                  )}
                </div>
              </div>

              {/* Informasi Pelapor */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>👤 Informasi Pelapor</h3>
                <div className="review-grid">
                  <div><strong>Nama:</strong> {selectedComplaint.reporterName || '-'}</div>
                  <div><strong>Email:</strong> {selectedComplaint.reporterEmail || '-'}</div>
                  <div><strong>Telepon:</strong> {selectedComplaint.reporterPhone || '-'}</div>
                  <div><strong>Tipe Laporan:</strong> <span className="role-badge">{selectedComplaint.isPublic ? 'Publik' : 'Internal'}</span></div>
                </div>
              </div>

              {/* Informasi Pengaduan */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📋 Detail Pengaduan</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Judul:</strong>
                  <p style={{ margin: 0, padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    {selectedComplaint.title}
                  </p>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Deskripsi:</strong>
                  <p style={{ margin: 0, padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedComplaint.description}
                  </p>
                </div>
              </div>

              {/* Lokasi */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📍 Lokasi</h3>
                <div className="review-grid">
                  <div style={{ gridColumn: '1 / -1' }}><strong>Alamat:</strong> {selectedComplaint.location}</div>
                  {selectedComplaint.latitude && selectedComplaint.longitude && (
                    <>
                      <div><strong>Latitude:</strong> {selectedComplaint.latitude}</div>
                      <div><strong>Longitude:</strong> {selectedComplaint.longitude}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Foto Laporan */}
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📷 Foto Laporan</h3>
                  <div className="photo-grid">
                    {selectedComplaint.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Foto ${index + 1}`}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Petugas yang Ditugaskan */}
              {selectedComplaint.assignedToUser && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>👷 Petugas yang Ditugaskan</h3>
                  <div className="review-grid">
                    <div><strong>Nama Petugas:</strong> {selectedComplaint.assignedToUser.name}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedWorkReport && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Laporan Pengerjaan</h2>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Informasi Pengaduan */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📋 Informasi Pengaduan</h3>
                <div className="review-grid">
                  <div><strong>Tiket:</strong> {selectedWorkReport.complaint?.ticketNumber}</div>
                  <div><strong>Judul:</strong> {selectedWorkReport.complaint?.title}</div>
                  <div><strong>Lokasi:</strong> {selectedWorkReport.complaint?.location || '-'}</div>
                  <div><strong>Petugas:</strong> {selectedWorkReport.complaint?.officer?.name || '-'}</div>
                </div>
              </div>

              {/* Waktu Pengerjaan */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>⏰ Waktu Pengerjaan</h3>
                <div className="review-grid">
                  <div><strong>Mulai:</strong> {new Date(selectedWorkReport.workStartTime).toLocaleString('id-ID')}</div>
                  <div><strong>Selesai:</strong> {new Date(selectedWorkReport.workEndTime).toLocaleString('id-ID')}</div>
                  <div><strong>Durasi:</strong> {(() => {
                    const start = new Date(selectedWorkReport.workStartTime);
                    const end = new Date(selectedWorkReport.workEndTime);
                    const diffMs = end.getTime() - start.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours} jam ${minutes} menit`;
                  })()}</div>
                </div>
              </div>

              {/* Deskripsi Pekerjaan */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📝 Deskripsi Pekerjaan</h3>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedWorkReport.workDescription}</p>
              </div>

              {/* Material yang Digunakan */}
              {selectedWorkReport.materialsUsed && selectedWorkReport.materialsUsed.length > 0 && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>🔧 Material yang Digunakan</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Material</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>Jumlah</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkReport.materialsUsed.map((material, index) => (
                        <tr key={index}>
                          <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>{material.name}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{material.quantity}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{material.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Rincian Biaya */}
              <div className="review-section">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>💰 Rincian Biaya</h3>
                <div className="cost-breakdown">
                  <div className="cost-row">
                    <span>Biaya Material:</span>
                    <span><strong>Rp {(selectedWorkReport.materialCost || 0).toLocaleString('id-ID')}</strong></span>
                  </div>
                  <div className="cost-row">
                    <span>Biaya Tenaga Kerja:</span>
                    <span><strong>Rp {(selectedWorkReport.laborCost || 0).toLocaleString('id-ID')}</strong></span>
                  </div>
                  <div className="cost-row" style={{ borderTop: '2px solid #1e40af', marginTop: '0.5rem', paddingTop: '0.5rem', fontSize: '1.1rem', color: '#1e40af' }}>
                    <span><strong>Total Biaya:</strong></span>
                    <span><strong>Rp {(selectedWorkReport.totalCost || 0).toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Foto Sebelum */}
              {selectedWorkReport.beforePhotos && selectedWorkReport.beforePhotos.length > 0 && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📷 Foto Sebelum Pekerjaan</h3>
                  <div className="photo-grid">
                    {selectedWorkReport.beforePhotos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo} 
                        alt={`Sebelum ${index + 1}`}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Foto Sesudah */}
              {selectedWorkReport.afterPhotos && selectedWorkReport.afterPhotos.length > 0 && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📷 Foto Sesudah Pekerjaan</h3>
                  <div className="photo-grid">
                    {selectedWorkReport.afterPhotos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo} 
                        alt={`Sesudah ${index + 1}`}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan Tambahan */}
              {selectedWorkReport.notes && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>📌 Catatan Tambahan</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px' }}>{selectedWorkReport.notes}</p>
                </div>
              )}

              {/* Catatan Teknisi */}
              {selectedWorkReport.technicianNotes && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>🔧 Catatan Teknisi</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', backgroundColor: '#dbeafe', padding: '1rem', borderRadius: '8px' }}>{selectedWorkReport.technicianNotes}</p>
                </div>
              )}

              {/* Informasi Review */}
              {selectedWorkReport.reviewedAt && (
                <div className="review-section">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e40af' }}>✅ Informasi Review</h3>
                  <div className="review-grid">
                    <div><strong>Status:</strong> {getStatusBadge(selectedWorkReport.reviewStatus)}</div>
                    <div><strong>Direview oleh:</strong> {selectedWorkReport.reviewer?.name || '-'}</div>
                    <div><strong>Tanggal Review:</strong> {new Date(selectedWorkReport.reviewedAt).toLocaleString('id-ID')}</div>
                    {selectedWorkReport.reviewNotes && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Catatan Review:</strong>
                        <p style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>{selectedWorkReport.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tombol Aksi */}
              {selectedWorkReport.reviewStatus === 'PENDING' && (
                <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #e5e7eb' }}>
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-content modal-edit-user" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={() => setShowEditUserModal(false)}>×</button>
            </div>
            <EditUserForm 
              user={selectedUser}
              onSubmit={(data) => handleUpdateUser(selectedUser.id, data)}
              onCancel={() => setShowEditUserModal(false)}
            />
          </div>
        </div>
      )}

      {/* Custom Alert */}
      {alert.isVisible && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
          autoClose={alert.autoClose}
          duration={alert.duration}
        />
      )}
    </div>
  );
}
