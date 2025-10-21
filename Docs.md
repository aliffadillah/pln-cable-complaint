# PLN Cable Complaint System - Implementation Guide

## Fitur Baru yang Diimplementasikan

### 1. **Public Complaint Submission** (Tanpa Login)
- Masyarakat umum dapat membuat laporan tanpa harus login
- Sistem akan generate nomor tiket unik (format: `PLN-2025-XXXXXX`)
- Form capture: nama, email, telepon, lokasi, deskripsi masalah
- Email konfirmasi dengan nomor tiket (upcoming feature)

### 2. **Ticket Tracking System**
- Tracking status laporan menggunakan nomor tiket
- Tidak perlu login, cukup input nomor tiket
- Tampilkan timeline lengkap perkembangan laporan
- Informasi petugas yang ditugaskan (jika sudah assigned)

### 3. **Extended Status Flow**
Alur status complaint yang lebih lengkap:
- `PENDING` → Laporan baru masuk
- `REVIEWED` → Admin sudah review
- `ASSIGNED` → Ditugaskan ke petugas
- `ON_THE_WAY` → Petugas dalam perjalanan
- `WORKING` → Petugas sedang mengerjakan
- `COMPLETED` → Pekerjaan selesai, menunggu approval
- `APPROVED` → Admin approve laporan
- `RESOLVED` → Kasus selesai dan ditutup
- `REVISION_NEEDED` → Perlu revisi
- `REJECTED` → Ditolak
- `CANCELLED` → Dibatalkan

### 4. **Work Report System**
Petugas lapangan dapat submit laporan pekerjaan:
- Waktu mulai dan selesai pengerjaan
- Deskripsi detail pekerjaan
- Material yang digunakan
- Biaya tenaga kerja dan material
- Upload foto before/after
- Catatan teknisi

### 5. **Admin Review System**
Admin dapat review laporan pekerjaan:
- Approve
- Request revision dengan catatan
- Reject dengan alasan

## Database Schema Updates

### New Models:
1. **WorkReport** - Laporan pekerjaan dari petugas
2. **ReviewStatus** - Status review (PENDING, APPROVED, REVISION_NEEDED, REJECTED)

### Updated Models:
1. **Complaint**:
   - `ticketNumber` (unique) - Nomor tiket untuk tracking
   - `isPublic` (boolean) - Membedakan laporan publik vs internal
   - `reporterName`, `reporterEmail`, `reporterPhone` - Info pelapor publik
   - `assignedAt` - Waktu assignment ke petugas
   
2. **User**:
   - Added `SUPERVISOR` role
   - `phone` field untuk kontak

## API Endpoints Baru

### Public Endpoints (No Authentication)
```
POST   /api/public/complaints          # Submit complaint publik
GET    /api/public/complaints/:ticket  # Track by ticket number
GET    /api/public/stats               # Public statistics
```

### Work Report Endpoints (Authentication Required)
```
GET    /api/work-reports                  # Get all work reports
GET    /api/work-reports/:id              # Get work report by ID
POST   /api/work-reports                  # Submit work report (Petugas)
PUT    /api/work-reports/:id              # Update work report (Petugas)
POST   /api/work-reports/:id/review       # Review work report (Admin)
```

### Updated Complaint Endpoints
```
POST   /api/complaints/:id/assign         # Assign to officer (Admin)
PUT    /api/complaints/:id/status         # Update status (Petugas/Admin)
```

## Frontend Pages

### New Pages:
1. **`/public-complaint`** - Form laporan untuk masyarakat umum
2. **`/track`** - Halaman tracking dengan nomor tiket
3. **`/track/:ticketNumber`** - Direct link untuk tracking specific ticket

### Updated Pages:
- Landing page dengan tombol "Buat Laporan" dan "Lacak Laporan"
- Dashboard (akan ditambahkan fitur assign dan review)

## Testing Guide

### 1. Test Public Complaint Submission
```bash
# Buka browser
http://localhost:5173/public-complaint

# Isi form dengan data:
- Nama: Ahmad Hidayat
- Email: ahmad@example.com
- Phone: 081234567890
- Judul: Kabel Putus
- Deskripsi: Detail masalah
- Lokasi: Jl. Sudirman No. 123
- Priority: HIGH

# Submit dan simpan nomor tiket yang muncul
```

### 2. Test Ticket Tracking
```bash
# Buka browser
http://localhost:5173/track

# Masukkan nomor tiket yang didapat dari submission
# Atau gunakan sample ticket dari seed: PLN-2025-527266

# Verify:
- Status ditampilkan dengan benar
- Timeline update muncul
- Informasi lengkap tampil
```

### 3. Test Admin Login
```bash
# Buka browser
http://localhost:5173

# Klik "Masuk"
Email: admin@pln.co.id
Password: password123

# Verify:
- Login berhasil
- Dashboard muncul
- Bisa lihat semua complaints
```

### 4. Test Petugas Login
```bash
Email: petugas1@pln.co.id
Password: password123

# Verify:
- Hanya lihat assigned tasks
```

## Next Steps (Coming Soon)

### 1. Field Officer Dashboard
- List tugas yang di-assign
- Form submit work report
- Update status real-time
- Upload foto from mobile

### 2. Enhanced Admin Dashboard
- Assign complaint ke petugas
- Review work reports
- Approve/reject dengan catatan
- Statistics and analytics

### 3. Notification System
- Email notifications
- SMS notifications (optional)
- Real-time updates via WebSocket

### 4. Advanced Features
- Google Maps integration untuk lokasi
- Image upload untuk foto complaint
- Rating system untuk feedback
- Export reports to PDF/Excel

## Troubleshooting

### Database Issues
```bash
cd server
npx prisma migrate reset --force
npx prisma migrate dev
npm run prisma:seed
```

### Port Already in Use
```bash
# Backend (5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### CORS Issues
- Pastikan backend running di port 5000
- Pastikan frontend running di port 5173
- Check CORS configuration di server/src/index.js

## Documentation

### API Documentation
Lihat file `server/README.md` untuk detail API endpoints

### Database Schema
Lihat file `server/prisma/schema.prisma` untuk detail schema

### Seeding Guide
Lihat file `server/SEEDING_GUIDE.md` untuk panduan populate data

## Alur Lengkap Sistem

```
[MASYARAKAT UMUM]
    ↓ Submit complaint via /public-complaint (dapat ticket number)
    ↓ Lacak status via /track/:ticketNumber
    
[ADMIN/SUPERVISOR]
    ↓ Login ke dashboard
    ↓ Review complaint baru
    ↓ Assign ke Petugas Lapangan
    
[PETUGAS LAPANGAN]
    ↓ Login dan lihat assigned tasks
    ↓ Update status: ON_THE_WAY → WORKING
    ↓ Kerjakan perbaikan
    ↓ Upload foto before/after
    ↓ Submit work report (COMPLETED)
    
[ADMIN/SUPERVISOR]
    ↓ Review work report
    ↓ APPROVE → Status RESOLVED
    ↓ atau REVISION_NEEDED → Petugas revisi
    
[MASYARAKAT]
    ↓ Notifikasi status update
    ↓ Check hasil via tracking page
    ↓ (Optional) Berikan rating
```

## Implementation Checklist

- [x] Update database schema
- [x] Public complaint API endpoints
- [x] Work report API endpoints
- [x] Ticket tracking API
- [x] Public complaint submission page
- [x] Ticket tracking page
- [x] Routing setup with react-router
- [x] Database migration
- [x] Sample data seeding
- [ ] Field Officer Dashboard (In Progress)
- [ ] Admin review interface
- [ ] Notification system
- [ ] Image upload functionality
- [ ] Maps integration

## Current Status

**Backend**: Running on http://localhost:5000
**Frontend**: Running on http://localhost:5173
**Database**: Migrated and seeded

**Ready to test**: Public complaint submission and tracking system!
