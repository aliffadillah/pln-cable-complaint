import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { complaintsApi, workReportsApi } from '../services/api';
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
  Camera
} from 'lucide-react';
import './FieldOfficerDashboard.css';

interface Complaint {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  reporterName?: string;
  reporterPhone?: string;
  images?: string[];
  assignedAt?: string;
  createdAt: string;
}

interface WorkReport {
  complaintId: number;
  description: string;
  workDone: string;
  materialUsed: string;
  materialCost: number;
  laborCost: number;
  photosBefore: string[];
  photosAfter: string[];
}

export default function FieldOfficerDashboard() {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showWorkReportModal, setShowWorkReportModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [workReport, setWorkReport] = useState<WorkReport>({
    complaintId: 0,
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

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const fetchAssignedComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintsApi.getAll();
      // Filter hanya yang assigned ke user ini
      const assigned = data.filter((c: Complaint) => 
        ['ASSIGNED', 'ON_THE_WAY', 'WORKING', 'COMPLETED'].includes(c.status)
      );
      setComplaints(assigned);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId: number, newStatus: string) => {
    try {
      await complaintsApi.updateStatus(complaintId.toString(), newStatus);
      await fetchAssignedComplaints();
      alert('Status berhasil diupdate!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal update status');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} terlalu besar. Maksimal 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} bukan gambar`);
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
      alert('Harap isi semua field yang wajib');
      return;
    }

    try {
      setSubmitting(true);
      
      const reportData = {
        complaintId: workReport.complaintId.toString(),
        workStartTime: new Date().toISOString(),
        workEndTime: new Date().toISOString(),
        workDescription: workReport.workDone,
        materialsUsed: workReport.materialUsed ? [{ name: workReport.materialUsed, quantity: 1 }] : [],
        laborCost: workReport.laborCost,
        materialCost: workReport.materialCost,
        notes: workReport.description,
        beforePhotos: workReport.photosBefore,
        afterPhotos: workReport.photosAfter,
      };
      
      await workReportsApi.create(reportData);
      
      // Update status complaint ke COMPLETED
      await handleUpdateStatus(workReport.complaintId, 'COMPLETED');
      
      setShowWorkReportModal(false);
      alert('Laporan pengerjaan berhasil dikirim!');
      await fetchAssignedComplaints();
    } catch (error) {
      console.error('Error submitting work report:', error);
      alert('Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
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
            <p className="stat-title">Total Laporan</p>
            <h3>{complaints.length}</h3>
            <p className="stat-desc">Semua laporan</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <Truck size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Menunggu Review</p>
            <h3>{complaints.filter(c => c.status === 'ASSIGNED').length}</h3>
            <p className="stat-desc">Perlu review</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Disetujui</p>
            <h3>{complaints.filter(c => c.status === 'COMPLETED').length}</h3>
            <p className="stat-desc">Telah disetujui</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <Wrench size={28} />
          </div>
          <div className="stat-info">
            <p className="stat-title">Perlu Revisi</p>
            <h3>{complaints.filter(c => c.status === 'WORKING').length}</h3>
            <p className="stat-desc">Perlu perbaikan</p>
          </div>
        </div>
      </div>

      <div className="section-info">
        <h2>Selamat Datang, {user?.name}! 👋</h2>
        <p>Berikut adalah ringkasan tugas Anda hari ini.</p>
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
        {filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada tugas untuk ditampilkan</p>
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
                <div className="info-row">
                  <span className="info-item">
                    <MapPin size={16} />
                    {complaint.location}
                  </span>
                  {complaint.reporterName && (
                    <span className="info-item">
                      <User size={16} />
                      {complaint.reporterName}
                    </span>
                  )}
                  {complaint.reporterPhone && (
                    <span className="info-item">
                      <Phone size={16} />
                      {complaint.reporterPhone}
                    </span>
                  )}
                </div>
              </div>

              <div className="complaint-actions">
                {complaint.status === 'ASSIGNED' && (
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => handleUpdateStatus(complaint.id, 'ON_THE_WAY')}
                  >
                    <Truck size={18} />
                    Berangkat
                  </button>
                )}
                {complaint.status === 'ON_THE_WAY' && (
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => handleUpdateStatus(complaint.id, 'WORKING')}
                  >
                    <Wrench size={18} />
                    Mulai Pengerjaan
                  </button>
                )}
                {complaint.status === 'WORKING' && (
                  <button 
                    className="btn-action btn-success"
                    onClick={() => openWorkReportModal(complaint)}
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
      ASSIGNED: { text: 'Ditugaskan', class: 'status-assigned' },
      ON_THE_WAY: { text: 'Dalam Perjalanan', class: 'status-on-way' },
      WORKING: { text: 'Sedang Dikerjakan', class: 'status-working' },
      COMPLETED: { text: 'Selesai Dikerjakan', class: 'status-completed' }
    };
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { class: string }> = {
      RENDAH: { class: 'priority-low' },
      SEDANG: { class: 'priority-medium' },
      TINGGI: { class: 'priority-high' },
      DARURAT: { class: 'priority-urgent' }
    };
    const badge = badges[priority] || { class: 'priority-default' };
    return <span className={`priority-badge ${badge.class}`}>{priority}</span>;
  };

  if (loading) {
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
          <div className="loading">Loading...</div>
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
          {activeSection === 'reports' && (
            <div className="reports-section">
              <h2>Laporan Pengerjaan</h2>
              <p>Fitur laporan akan segera hadir...</p>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="settings-section">
              <h2>Pengaturan</h2>
              <p>Fitur pengaturan akan segera hadir...</p>
            </div>
          )}

        </div>
      </div>

      {/* Work Report Modal */}
      {showWorkReportModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowWorkReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Laporan Pengerjaan</h2>
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
                <label>Deskripsi Masalah <span className="required">*</span></label>
                <textarea
                  value={workReport.description}
                  onChange={(e) => setWorkReport({...workReport, description: e.target.value})}
                  placeholder="Jelaskan kondisi masalah yang ditemui..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pekerjaan yang Dilakukan <span className="required">*</span></label>
                <textarea
                  value={workReport.workDone}
                  onChange={(e) => setWorkReport({...workReport, workDone: e.target.value})}
                  placeholder="Jelaskan pekerjaan yang telah dilakukan..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Material yang Digunakan</label>
                <textarea
                  value={workReport.materialUsed}
                  onChange={(e) => setWorkReport({...workReport, materialUsed: e.target.value})}
                  placeholder="Contoh: Kabel 10m, MCB 20A, dll..."
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
                  />
                </div>
                <div className="form-group">
                  <label>Biaya Tenaga Kerja (Rp)</label>
                  <input
                    type="number"
                    value={workReport.laborCost}
                    onChange={(e) => setWorkReport({...workReport, laborCost: Number(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Foto Sebelum Perbaikan</label>
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
                  <span>Pilih Foto Sebelum</span>
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
                <label>Foto Setelah Perbaikan</label>
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
                  <span>Pilih Foto Setelah</span>
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
                  {submitting ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>
    </div>
  );
}
