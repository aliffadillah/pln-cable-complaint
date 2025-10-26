import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { complaintsApi, workReportsApi, usersApi } from '../services/api';
import {
  Bell,
  ChevronDown,
  User,
  Menu,
  Settings,
  LogOut,
  ClipboardList,
  Truck,
  Wrench,
  CheckCircle,
  MapPin,
  Phone,
  X,
  Camera,
  Mail,
  Lock,
  Save,
  UserCircle
} from 'lucide-react';
import './FieldOfficerDashboard.css';

interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  images?: string[];
  assignedAt?: string;
  createdAt: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  officer?: {
    id: string;
    name: string;
    email: string;
  };
  updates?: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
}

interface WorkReport {
  complaintId: string;
  description: string;
  workDone: string;
  materialUsed: string;
  materialCost: number;
  laborCost: number;
  photosBefore: string[];
  photosAfter: string[];
}

interface WorkReportData {
  id: string;
  complaintId: string;
  workStartTime: string;
  workEndTime: string;
  workDescription: string;
  materialsUsed: any[];
  laborCost: number;
  materialCost: number;
  notes: string;
  beforePhotos: string[];
  afterPhotos: string[];
  reviewStatus: string;
  reviewNotes?: string;
  createdAt: string;
  complaint?: {
    ticketNumber: string;
    title: string;
    location: string;
  };
}

export default function FieldOfficerDashboard() {
  const { user, logout } = useAuth();
  const { alert, showSuccess, showError, showWarning, hideAlert } = useCustomAlert();
  
  console.log('FieldOfficerDashboard rendered, user:', user);
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workReports, setWorkReports] = useState<WorkReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedReport, setSelectedReport] = useState<WorkReportData | null>(null);
  const [showWorkReportModal, setShowWorkReportModal] = useState(false);
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [workReport, setWorkReport] = useState<WorkReport>({
    complaintId: '',
    description: '',
    workDone: '',
    materialUsed: '',
    materialCost: 0,
    laborCost: 0,
    photosBefore: [],
    photosAfter: []
  });
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Settings state
  const [settingsTab, setSettingsTab] = useState<'profile' | 'password'>('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Initial load
  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'reports') {
      fetchWorkReports();
    } else if (activeSection === 'tasks' || activeSection === 'complaints') {
      fetchAssignedComplaints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const fetchAssignedComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintsApi.getAll();
      console.log('Fetched complaints:', data);
      
      // Backend mengembalikan array langsung
      const complaintsArray = Array.isArray(data) ? data : [];
      
      // Filter hanya yang assigned ke user ini dan status yang relevan
      const assigned = complaintsArray.filter((c: Complaint) => 
        ['ASSIGNED', 'ON_THE_WAY', 'WORKING', 'COMPLETED'].includes(c.status)
      );
      
      setComplaints(assigned);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      showError('Gagal memuat data pengaduan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchWorkReports = async () => {
    try {
      setLoading(true);
      const response = await workReportsApi.getAll();
      console.log('Fetched work reports:', response);
      
      // Backend mengembalikan { success: true, data: [...] }
      const reportsArray = response.data || response || [];
      setWorkReports(Array.isArray(reportsArray) ? reportsArray : []);
    } catch (error) {
      console.error('Error fetching work reports:', error);
      showError('Gagal memuat data laporan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    try {
      await complaintsApi.updateStatus(complaintId, newStatus);
      await fetchAssignedComplaints();
      showSuccess('Status berhasil diupdate!');
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Gagal update status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const confirmStatusUpdate = (complaintId: string, newStatus: string, actionName: string) => {
    const messages: Record<string, { title: string; message: string }> = {
      'ON_THE_WAY': {
        title: 'Konfirmasi Keberangkatan',
        message: 'Apakah Anda yakin ingin mengubah status menjadi "Dalam Perjalanan"? Pastikan Anda sudah siap untuk menuju lokasi.'
      },
      'WORKING': {
        title: 'Konfirmasi Mulai Pengerjaan',
        message: 'Apakah Anda yakin ingin memulai pengerjaan? Pastikan Anda sudah berada di lokasi dan siap untuk bekerja.'
      }
    };

    const dialogContent = messages[newStatus] || {
      title: 'Konfirmasi Tindakan',
      message: `Apakah Anda yakin ingin melakukan tindakan: ${actionName}?`
    };

    setConfirmAction({
      title: dialogContent.title,
      message: dialogContent.message,
      onConfirm: () => handleUpdateStatus(complaintId, newStatus)
    });
    setShowConfirmDialog(true);
  };

  const confirmSubmitReport = (complaint: Complaint) => {
    setConfirmAction({
      title: 'Konfirmasi Submit Laporan',
      message: 'Apakah Anda yakin ingin membuat laporan pengerjaan? Pastikan semua data sudah lengkap dan benar.',
      onConfirm: () => {
        setShowConfirmDialog(false);
        setConfirmAction(null);
        openWorkReportModal(complaint);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        showWarning(`File ${file.name} terlalu besar. Maksimal 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        showWarning(`File ${file.name} bukan gambar`);
        return false;
      }
      return true;
    });

    if (type === 'before') {
      setBeforeImages(prev => [...prev, ...validFiles]);
      // Convert to base64
      for (const file of validFiles) {
        const base64 = await convertToBase64(file);
        setWorkReport(prev => ({
          ...prev,
          photosBefore: [...prev.photosBefore, base64]
        }));
      }
    } else {
      setAfterImages(prev => [...prev, ...validFiles]);
      // Convert to base64
      for (const file of validFiles) {
        const base64 = await convertToBase64(file);
        setWorkReport(prev => ({
          ...prev,
          photosAfter: [...prev.photosAfter, base64]
        }));
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
      setWorkReport(prev => ({
        ...prev,
        photosBefore: prev.photosBefore.filter((_, i) => i !== index)
      }));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
      setWorkReport(prev => ({
        ...prev,
        photosAfter: prev.photosAfter.filter((_, i) => i !== index)
      }));
    }
  };

  const openWorkReportModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setWorkReport({
      complaintId: complaint.id,
      description: '',
      workDone: '',
      materialUsed: '',
      materialCost: 0,
      laborCost: 0,
      photosBefore: [],
      photosAfter: []
    });
    setBeforeImages([]);
    setAfterImages([]);
    setShowWorkReportModal(true);
  };

  const handleSubmitWorkReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workReport.description || !workReport.workDone) {
      showWarning('Harap isi semua field yang wajib');
      return;
    }

    if (workReport.photosBefore.length === 0 || workReport.photosAfter.length === 0) {
      showWarning('Harap upload minimal 1 foto sebelum dan 1 foto sesudah perbaikan');
      return;
    }

    // Confirm before submitting
    setConfirmAction({
      title: 'Konfirmasi Kirim Laporan',
      message: 'Apakah Anda yakin ingin mengirim laporan pengerjaan ini? Setelah dikirim, laporan akan direview oleh admin. Pastikan semua data dan foto sudah benar.',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          setShowConfirmDialog(false);
          
          const reportData = {
            complaintId: workReport.complaintId,
            workStartTime: new Date().toISOString(),
            workEndTime: new Date().toISOString(),
            workDescription: workReport.workDone,
            materialsUsed: workReport.materialUsed ? [{ 
              name: workReport.materialUsed, 
              quantity: 1,
              unit: 'unit' 
            }] : [],
            laborCost: Number(workReport.laborCost) || 0,
            materialCost: Number(workReport.materialCost) || 0,
            notes: workReport.description,
            beforePhotos: workReport.photosBefore,
            afterPhotos: workReport.photosAfter,
          };
          
          console.log('Submitting work report:', reportData);
          const response = await workReportsApi.create(reportData);
          console.log('Work report response:', response);
          
          setShowWorkReportModal(false);
          showSuccess('Laporan pengerjaan berhasil dikirim!');
          
          // Refresh data
          await fetchAssignedComplaints();
          if (activeSection === 'reports') {
            await fetchWorkReports();
          }
        } catch (error) {
          console.error('Error submitting work report:', error);
          showError('Gagal mengirim laporan: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
          setSubmitting(false);
          setConfirmAction(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.name || !profileData.email) {
      showWarning('Nama dan email harus diisi');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      showWarning('Format email tidak valid');
      return;
    }

    try {
      setSavingProfile(true);
      
      await usersApi.update(user?.id || '', {
        name: profileData.name,
        email: profileData.email
      });
      
      showSuccess('Profil berhasil diperbarui!');
      
      // Refresh current user data - reload to update all user info
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Gagal memperbarui profil: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showWarning('Semua field password harus diisi');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showWarning('Password baru minimal 6 karakter');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showWarning('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    try {
      setChangingPassword(true);
      
      await usersApi.changePassword(
        user?.id || '', 
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      
      showSuccess('Password berhasil diubah! Silakan login kembali.');
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Logout user to login with new password
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Gagal mengubah password: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setChangingPassword(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // Render functions
  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon blue">
            <ClipboardList size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Total Tugas</p>
            <h3>{complaints.length}</h3>
            <p className="stat-desc">Semua tugas assigned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <Truck size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Tugas Baru</p>
            <h3>{complaints.filter(c => c.status === 'ASSIGNED').length}</h3>
            <p className="stat-desc">Perlu ditindaklanjuti</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Selesai Dikerjakan</p>
            <h3>{complaints.filter(c => c.status === 'COMPLETED').length}</h3>
            <p className="stat-desc">Menunggu review</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <Wrench size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Dalam Pengerjaan</p>
            <h3>{complaints.filter(c => ['ON_THE_WAY', 'WORKING'].includes(c.status)).length}</h3>
            <p className="stat-desc">Sedang diproses</p>
          </div>
        </div>
      </div>

      <div className="section-info">
        <h2>Selamat Datang, {user?.name}! 👋</h2>
        <p>Berikut adalah ringkasan tugas Anda hari ini. Anda memiliki {complaints.filter(c => c.status === 'ASSIGNED').length} tugas baru yang perlu ditindaklanjuti.</p>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-section">
      <div className="section-header">
        <h2>Tugas Saya</h2>
        <p>Kelola semua tugas yang ditugaskan kepada Anda</p>
      </div>

      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          Semua ({complaints.length})
        </button>
        <button 
          className={filter === 'ASSIGNED' ? 'active' : ''} 
          onClick={() => setFilter('ASSIGNED')}
        >
          Ditugaskan ({complaints.filter(c => c.status === 'ASSIGNED').length})
        </button>
        <button 
          className={filter === 'ON_THE_WAY' ? 'active' : ''} 
          onClick={() => setFilter('ON_THE_WAY')}
        >
          Dalam Perjalanan ({complaints.filter(c => c.status === 'ON_THE_WAY').length})
        </button>
        <button 
          className={filter === 'WORKING' ? 'active' : ''} 
          onClick={() => setFilter('WORKING')}
        >
          Dikerjakan ({complaints.filter(c => c.status === 'WORKING').length})
        </button>
        <button 
          className={filter === 'COMPLETED' ? 'active' : ''} 
          onClick={() => setFilter('COMPLETED')}
        >
          Selesai ({complaints.filter(c => c.status === 'COMPLETED').length})
        </button>
      </div>

      <div className="complaints-list">
        {loading ? (
          <div className="loading">Memuat data tugas...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>Tidak ada tugas untuk ditampilkan</p>
            {filter !== 'all' && (
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Coba ubah filter untuk melihat tugas lainnya
              </p>
            )}
          </div>
        ) : (
          filteredComplaints.map(complaint => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-header">
                <div>
                  <h3>{complaint.title}</h3>
                  <p className="ticket-number">#{complaint.ticketNumber}</p>
                </div>
                <div className="badges">
                  {getStatusBadge(complaint.status)}
                  {getPriorityBadge(complaint.priority)}
                </div>
              </div>

              <div className="complaint-body">
                <p className="description">{complaint.description}</p>
                
                {complaint.images && complaint.images.length > 0 && (
                  <div className="complaint-images">
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
                      Foto Laporan:
                    </p>
                    <div className="image-preview-grid" style={{ marginBottom: '1rem' }}>
                      {complaint.images.slice(0, 3).map((image: string, index: number) => (
                        <div key={index} className="image-preview-item">
                          <img src={image} alt={`Foto ${index + 1}`} />
                        </div>
                      ))}
                      {complaint.images.length > 3 && (
                        <div className="image-preview-item" style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          fontWeight: 600
                        }}>
                          +{complaint.images.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="info-row">
                  <span className="info-item">
                    <MapPin size={16} />
                    {complaint.location}
                  </span>
                  {(complaint.reporterName || complaint.reporter?.name) && (
                    <span className="info-item">
                      <User size={16} />
                      {complaint.reporterName || complaint.reporter?.name}
                    </span>
                  )}
                  {(complaint.reporterPhone || complaint.reporterEmail) && (
                    <span className="info-item">
                      <Phone size={16} />
                      {complaint.reporterPhone || complaint.reporterEmail || complaint.reporter?.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="complaint-actions">
                {complaint.status === 'ASSIGNED' && (
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => confirmStatusUpdate(complaint.id, 'ON_THE_WAY', 'Berangkat')}
                  >
                    <Truck size={18} />
                    Berangkat
                  </button>
                )}
                {complaint.status === 'ON_THE_WAY' && (
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => confirmStatusUpdate(complaint.id, 'WORKING', 'Mulai Pengerjaan')}
                  >
                    <Wrench size={18} />
                    Mulai Pengerjaan
                  </button>
                )}
                {complaint.status === 'WORKING' && (
                  <button 
                    className="btn-action btn-success"
                    onClick={() => confirmSubmitReport(complaint)}
                  >
                    <ClipboardList size={18} />
                    Submit Laporan
                  </button>
                )}
                {complaint.status === 'COMPLETED' && (
                  <span className="status-info">
                    <CheckCircle size={18} />
                    Menunggu review admin
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      PENDING: { text: 'Menunggu', class: 'status-assigned' },
      ASSIGNED: { text: 'Ditugaskan', class: 'status-assigned' },
      ON_THE_WAY: { text: 'Dalam Perjalanan', class: 'status-on-way' },
      WORKING: { text: 'Sedang Dikerjakan', class: 'status-working' },
      COMPLETED: { text: 'Selesai Dikerjakan', class: 'status-completed' },
      RESOLVED: { text: 'Selesai & Disetujui', class: 'status-completed' },
      REVISION_NEEDED: { text: 'Perlu Revisi', class: 'status-working' },
      REJECTED: { text: 'Ditolak', class: 'status-on-way' }
    };
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      LOW: { text: 'Rendah', class: 'priority-low' },
      RENDAH: { text: 'Rendah', class: 'priority-low' },
      MEDIUM: { text: 'Sedang', class: 'priority-medium' },
      SEDANG: { text: 'Sedang', class: 'priority-medium' },
      HIGH: { text: 'Tinggi', class: 'priority-high' },
      TINGGI: { text: 'Tinggi', class: 'priority-high' },
      URGENT: { text: 'Darurat', class: 'priority-urgent' },
      DARURAT: { text: 'Darurat', class: 'priority-urgent' }
    };
    const badge = badges[priority] || { text: priority, class: 'priority-default' };
    return <span className={`priority-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getReviewStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      PENDING: { text: 'Menunggu Review', class: 'status-assigned' },
      APPROVED: { text: 'Disetujui', class: 'status-completed' },
      REJECTED: { text: 'Ditolak', class: 'status-on-way' },
      NEEDS_REVISION: { text: 'Perlu Revisi', class: 'status-working' }
    };
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderReports = () => {
    const filteredReports = workReports.filter(report => {
      if (reportFilter === 'all') return true;
      return report.reviewStatus === reportFilter;
    });

    if (loading) {
      return (
        <div className="reports-section">
          <div className="loading">Memuat laporan...</div>
        </div>
      );
    }

    return (
      <div className="reports-section">
        <div className="section-header">
          <h2>Laporan Pengerjaan</h2>
          <p>Daftar semua laporan pengerjaan yang telah Anda submit</p>
        </div>

        <div className="filters">
          <button 
            className={reportFilter === 'all' ? 'active' : ''} 
            onClick={() => setReportFilter('all')}
          >
            Semua ({workReports.length})
          </button>
          <button 
            className={reportFilter === 'PENDING' ? 'active' : ''} 
            onClick={() => setReportFilter('PENDING')}
          >
            Menunggu Review ({workReports.filter(r => r.reviewStatus === 'PENDING').length})
          </button>
          <button 
            className={reportFilter === 'APPROVED' ? 'active' : ''} 
            onClick={() => setReportFilter('APPROVED')}
          >
            Disetujui ({workReports.filter(r => r.reviewStatus === 'APPROVED').length})
          </button>
          <button 
            className={reportFilter === 'NEEDS_REVISION' ? 'active' : ''} 
            onClick={() => setReportFilter('NEEDS_REVISION')}
          >
            Perlu Revisi ({workReports.filter(r => r.reviewStatus === 'NEEDS_REVISION').length})
          </button>
        </div>

        <div className="complaints-list">
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada laporan untuk ditampilkan</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <div key={report.id} className="complaint-card">
                <div className="complaint-header">
                  <div>
                    <h3>{report.complaint?.title || 'Laporan Pengerjaan'}</h3>
                    <p className="ticket-number">#{report.complaint?.ticketNumber || report.complaintId}</p>
                  </div>
                  <div className="badges">
                    {getReviewStatusBadge(report.reviewStatus)}
                  </div>
                </div>

                <div className="complaint-body">
                  <p className="description">{report.workDescription}</p>
                  <div className="info-row">
                    <span className="info-item">
                      <MapPin size={16} />
                      {report.complaint?.location || 'Lokasi tidak tersedia'}
                    </span>
                    <span className="info-item">
                      <span style={{ fontWeight: 600 }}>Biaya Total:</span> {formatCurrency(report.laborCost + report.materialCost)}
                    </span>
                    <span className="info-item">
                      <span style={{ fontWeight: 600 }}>Tanggal:</span> {formatDate(report.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="complaint-actions">
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowReportDetailModal(true);
                    }}
                  >
                    <ClipboardList size={18} />
                    Lihat Detail
                  </button>
                  {report.reviewStatus === 'APPROVED' && (
                    <span className="status-info">
                      <CheckCircle size={18} />
                      Disetujui oleh admin
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Pengaturan</h2>
        <p>Kelola profil dan keamanan akun Anda</p>
      </div>

      <div className="settings-tabs">
        <button 
          className={`settings-tab ${settingsTab === 'profile' ? 'active' : ''}`}
          onClick={() => setSettingsTab('profile')}
        >
          <UserCircle size={20} />
          <span>Profil Saya</span>
        </button>
        <button 
          className={`settings-tab ${settingsTab === 'password' ? 'active' : ''}`}
          onClick={() => setSettingsTab('password')}
        >
          <Lock size={20} />
          <span>Ubah Password</span>
        </button>
      </div>

      {settingsTab === 'profile' && (
        <div className="settings-content">
          <div className="settings-grid-2col">
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Informasi Profil</h3>
                <p>Perbarui informasi profil Anda</p>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>
                    <UserCircle size={18} />
                    Nama Lengkap <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={18} />
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="Masukkan email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value="Petugas Lapangan"
                    disabled
                    style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="settings-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={savingProfile}
                  >
                    <Save size={18} />
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Informasi Akun</h3>
                <p>Detail akun Anda</p>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">User ID</span>
                  <span className="info-value">{user?.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role</span>
                  <span className="info-value">Petugas Lapangan</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status Akun</span>
                  <span className="info-value">
                    <span className="status-badge status-completed">Aktif</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsTab === 'password' && (
        <div className="settings-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Ubah Password</h3>
              <p>Pastikan password Anda aman dan mudah diingat</p>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>
                  <Lock size={18} />
                  Password Saat Ini <span className="required">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Masukkan password saat ini"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} />
                  Password Baru <span className="required">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} />
                  Konfirmasi Password Baru <span className="required">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Konfirmasi password baru"
                  required
                  minLength={6}
                />
              </div>

              <div className="password-requirements">
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Persyaratan Password:</strong>
                </p>
                <ul style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1.5rem' }}>
                  <li>Minimal 6 karakter</li>
                  <li>Disarankan menggunakan kombinasi huruf, angka, dan simbol</li>
                  <li>Hindari menggunakan password yang mudah ditebak</li>
                </ul>
              </div>

              <div className="settings-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={changingPassword}
                >
                  <Lock size={18} />
                  {changingPassword ? 'Mengubah Password...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>

          <div className="settings-card" style={{ background: '#fff7ed', border: '2px solid #f59e0b' }}>
            <div className="settings-card-header">
              <h3 style={{ color: '#f59e0b' }}>⚠️ Perhatian</h3>
            </div>
            <div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Setelah mengubah password, Anda akan logout otomatis dan perlu login kembali menggunakan password baru.
              </p>
              <p style={{ margin: 0 }}>
                Pastikan Anda mengingat password baru Anda dengan baik.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (initialLoading) {
    return (
      <div className="field-officer-dashboard">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isAdmin={false}
          isPetugas={true}
          onLogout={logout}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="main-content">
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                border: '4px solid #e5e7eb', 
                borderTopColor: '#0066cc',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }} />
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Memuat dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="field-officer-dashboard">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isAdmin={false}
        isPetugas={true}
        onLogout={logout}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div>
              <h1>Dashboard Petugas Lapangan</h1>
              <p>Kelola tugas yang ditugaskan kepada Anda</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="notification-btn">
              <Bell size={20} />
              <span className="notification-badge">
                {complaints.filter(c => c.status === 'ASSIGNED').length}
              </span>
            </button>
            <div className="user-menu">
              <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  <User size={20} />
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">Petugas Lapangan</span>
                </div>
                <ChevronDown size={16} />
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <button className="menu-item">
                    <Settings size={16} />
                    Pengaturan
                  </button>
                  <button className="menu-item" onClick={logout}>
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content">
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'tasks' && renderTasks()}
          {activeSection === 'complaints' && renderTasks()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'settings' && renderSettings()}
        </div>
      </div>

      {/* Work Report Modal */}
      {showWorkReportModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowWorkReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Laporan Pengerjaan</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  {selectedComplaint.title}
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowWorkReportModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitWorkReport}>
              <div className="form-group">
                <label>Tiket</label>
                <input type="text" value={selectedComplaint.ticketNumber} disabled />
              </div>

              <div className="form-group">
                <label>Lokasi</label>
                <input type="text" value={selectedComplaint.location} disabled />
              </div>

              <div className="form-group">
                <label>Catatan/Kondisi yang Ditemui <span className="required">*</span></label>
                <textarea
                  value={workReport.description}
                  onChange={(e) => setWorkReport({...workReport, description: e.target.value})}
                  placeholder="Jelaskan kondisi kabel, kerusakan yang ditemui, lokasi detail, dll..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pekerjaan yang Dilakukan <span className="required">*</span></label>
                <textarea
                  value={workReport.workDone}
                  onChange={(e) => setWorkReport({...workReport, workDone: e.target.value})}
                  placeholder="Jelaskan langkah-langkah perbaikan yang telah dilakukan..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Material yang Digunakan</label>
                <textarea
                  value={workReport.materialUsed}
                  onChange={(e) => setWorkReport({...workReport, materialUsed: e.target.value})}
                  placeholder="Contoh: Kabel NYY 3x2.5mm 25m, MCB 20A 1 unit, Isolasi listrik 1 roll"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Biaya Material (Rp)</label>
                  <input
                    type="number"
                    value={workReport.materialCost}
                    onChange={(e) => setWorkReport({...workReport, materialCost: Number(e.target.value)})}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Biaya Tenaga Kerja (Rp)</label>
                  <input
                    type="number"
                    value={workReport.laborCost}
                    onChange={(e) => setWorkReport({...workReport, laborCost: Number(e.target.value)})}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              {(workReport.materialCost > 0 || workReport.laborCost > 0) && (
                <div className="form-group">
                  <label>Total Biaya</label>
                  <input
                    type="text"
                    value={formatCurrency(workReport.materialCost + workReport.laborCost)}
                    disabled
                    style={{ fontWeight: 600, fontSize: '1.1rem', color: '#0066cc' }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Foto Sebelum Perbaikan <span className="required">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageChange(e, 'before')}
                  className="file-input"
                  id="before-photos"
                />
                <label htmlFor="before-photos" className="file-input-label">
                  <Camera size={20} />
                  <span>Pilih Foto Sebelum (Max 5MB per foto)</span>
                </label>
                {beforeImages.length > 0 && (
                  <div className="image-preview-grid">
                    {beforeImages.map((file, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={URL.createObjectURL(file)} alt={`Before ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index, 'before')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Foto Setelah Perbaikan <span className="required">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageChange(e, 'after')}
                  className="file-input"
                  id="after-photos"
                />
                <label htmlFor="after-photos" className="file-input-label">
                  <Camera size={20} />
                  <span>Pilih Foto Setelah (Max 5MB per foto)</span>
                </label>
                {afterImages.length > 0 && (
                  <div className="image-preview-grid">
                    {afterImages.map((file, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={URL.createObjectURL(file)} alt={`After ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index, 'after')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowWorkReportModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Mengirim Laporan...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Report Detail Modal */}
      {showReportDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowReportDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Laporan Pengerjaan</h2>
              <button className="close-btn" onClick={() => setShowReportDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label>Tiket Pengaduan</label>
                <input 
                  type="text" 
                  value={`#${selectedReport.complaint?.ticketNumber || selectedReport.complaintId}`} 
                  disabled 
                />
              </div>

              {selectedReport.complaint && (
                <>
                  <div className="form-group">
                    <label>Judul Pengaduan</label>
                    <input type="text" value={selectedReport.complaint.title} disabled />
                  </div>

                  <div className="form-group">
                    <label>Lokasi</label>
                    <input type="text" value={selectedReport.complaint.location} disabled />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Deskripsi Pekerjaan</label>
                <textarea
                  value={selectedReport.workDescription}
                  rows={3}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Catatan</label>
                <textarea
                  value={selectedReport.notes || '-'}
                  rows={2}
                  disabled
                />
              </div>

              {selectedReport.materialsUsed && selectedReport.materialsUsed.length > 0 && (
                <div className="form-group">
                  <label>Material yang Digunakan</label>
                  <textarea
                    value={selectedReport.materialsUsed.map((m: any) => `${m.name} (${m.quantity})`).join(', ')}
                    rows={2}
                    disabled
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Biaya Material</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedReport.materialCost)}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Biaya Tenaga Kerja</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedReport.laborCost)}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Total Biaya</label>
                <input
                  type="text"
                  value={formatCurrency(selectedReport.laborCost + selectedReport.materialCost)}
                  disabled
                  style={{ fontWeight: 600, fontSize: '1.1rem' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Waktu Mulai</label>
                  <input
                    type="text"
                    value={formatDate(selectedReport.workStartTime)}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Waktu Selesai</label>
                  <input
                    type="text"
                    value={formatDate(selectedReport.workEndTime)}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status Review</label>
                <div style={{ marginTop: '0.5rem' }}>
                  {getReviewStatusBadge(selectedReport.reviewStatus)}
                </div>
              </div>

              {selectedReport.reviewNotes && (
                <div className="form-group">
                  <label>Catatan Review dari Admin</label>
                  <textarea
                    value={selectedReport.reviewNotes}
                    rows={3}
                    disabled
                    style={{ 
                      background: selectedReport.reviewStatus === 'APPROVED' ? '#d1fae5' : '#fef3c7',
                      color: '#1a1a1a'
                    }}
                  />
                </div>
              )}

              {selectedReport.beforePhotos && selectedReport.beforePhotos.length > 0 && (
                <div className="form-group">
                  <label>Foto Sebelum Perbaikan</label>
                  <div className="image-preview-grid">
                    {selectedReport.beforePhotos.map((photo: string, index: number) => (
                      <div key={index} className="image-preview-item">
                        <img src={photo} alt={`Before ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.afterPhotos && selectedReport.afterPhotos.length > 0 && (
                <div className="form-group">
                  <label>Foto Setelah Perbaikan</label>
                  <div className="image-preview-grid">
                    {selectedReport.afterPhotos.map((photo: string, index: number) => (
                      <div key={index} className="image-preview-item">
                        <img src={photo} alt={`After ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowReportDetailModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="modal-overlay" onClick={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{confirmAction.title}</h2>
              <button className="close-btn" onClick={() => {
                setShowConfirmDialog(false);
                setConfirmAction(null);
              }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#4b5563', marginBottom: '2rem' }}>
                {confirmAction.message}
              </p>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setConfirmAction(null);
                  }}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={confirmAction.onConfirm}
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
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
