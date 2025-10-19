# PLN Care - Backend Server

Backend API untuk Sistem Pengaduan Kabel Listrik PLN dengan authentication berbasis role.

## Tech Stack

- **Node.js** & **Express.js** - Backend framework
- **PostgreSQL** - Database
- **Prisma ORM** - Database ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

Pastikan sudah terinstall:
- Node.js (v18 atau lebih tinggi)
- PostgreSQL (v14 atau lebih tinggi)
- npm atau yarn

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup Database

Buat database PostgreSQL baru:

```sql
CREATE DATABASE pln_care_db;
```

### 3. Configure Environment

Copy `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pln_care_db?schema=public"
JWT_SECRET="your-secret-key"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

### 4. Run Migrations

```bash
npm run prisma:migrate
```

### 5. Seed Database

```bash
npm run prisma:seed
```

### 6. Start Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## 👥 Default Users

Setelah seeding, Anda dapat login dengan:

### Admin Utama
- **Email**: `admin@pln.co.id`
- **Password**: `password123`
- **Hak Akses**: Full access ke semua fitur

### Petugas Lapangan
- **Email**: `petugas1@pln.co.id` atau `petugas2@pln.co.id`
- **Password**: `password123`
- **Hak Akses**: Hanya dapat mengakses tugas yang di-assign

## Role & Permissions

### ADMIN_UTAMA (Admin Utama)
- Dapat melihat semua laporan
- Dapat membuat, mengupdate, dan menghapus laporan
- Dapat assign laporan ke petugas
- Dapat mengelola user (CRUD)
- Dapat melihat statistik dan dashboard
- Full access ke seluruh sistem

### PETUGAS_LAPANGAN (Petugas Lapangan)
- Dapat melihat laporan yang di-assign ke mereka
- Dapat menambahkan update pada laporan yang di-assign
- Dapat mengubah status laporan yang di-assign
- Tidak dapat mengakses laporan lain
- Tidak dapat mengelola user
- Tidak dapat menghapus laporan

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/register      - Register user baru
POST   /api/auth/login         - Login
GET    /api/auth/me            - Get current user
POST   /api/auth/logout        - Logout
```

### Users (Admin Only)

```
GET    /api/users              - Get all users
GET    /api/users/:id          - Get user by ID
POST   /api/users              - Create new user
PUT    /api/users/:id          - Update user
DELETE /api/users/:id          - Delete user
```

### Complaints

```
GET    /api/complaints                  - Get all complaints
GET    /api/complaints/:id              - Get complaint by ID
POST   /api/complaints                  - Create complaint
PUT    /api/complaints/:id              - Update complaint (Admin)
DELETE /api/complaints/:id              - Delete complaint (Admin)
POST   /api/complaints/:id/updates      - Add update to complaint
GET    /api/complaints/stats/overview   - Get statistics (Admin)
```

### Example Request

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pln.co.id",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@pln.co.id",
    "name": "Admin Utama PLN",
    "role": "ADMIN_UTAMA"
  }
}
```

#### Create Complaint (Authenticated)
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Kabel Putus",
    "description": "Kabel listrik putus di jalan raya",
    "location": "Jl. Sudirman No. 45",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "priority": "HIGH"
  }'
```

## 🗄️ Database Schema

### Users
- `id` - UUID (Primary Key)
- `email` - String (Unique)
- `password` - String (Hashed)
- `name` - String
- `role` - Enum (ADMIN_UTAMA, PETUGAS_LAPANGAN)
- `isActive` - Boolean
- `createdAt` - DateTime
- `updatedAt` - DateTime

### Complaints
- `id` - UUID (Primary Key)
- `title` - String
- `description` - String
- `location` - String
- `latitude` - Float (Optional)
- `longitude` - Float (Optional)
- `status` - Enum (PENDING, IN_PROGRESS, RESOLVED, REJECTED)
- `priority` - Enum (LOW, MEDIUM, HIGH, URGENT)
- `reporterId` - UUID (Foreign Key to Users)
- `assignedTo` - UUID (Foreign Key to Users, Optional)
- `createdAt` - DateTime
- `updatedAt` - DateTime
- `resolvedAt` - DateTime (Optional)

### ComplaintUpdates
- `id` - UUID (Primary Key)
- `complaintId` - UUID (Foreign Key to Complaints)
- `message` - String
- `status` - Enum
- `createdAt` - DateTime

### ActivityLogs
- `id` - UUID (Primary Key)
- `userId` - UUID (Foreign Key to Users)
- `action` - String
- `details` - String (Optional)
- `ipAddress` - String (Optional)
- `createdAt` - DateTime

## 🛠️ Useful Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## Security Features

- Password hashing dengan bcryptjs
- JWT authentication
- Role-based access control
- Activity logging
- Input validation
- CORS configuration

## Notes

- Token JWT berlaku selama 7 hari
- Password di-hash menggunakan bcryptjs dengan salt rounds 10
- Semua endpoint (kecuali auth) memerlukan authentication
- Activity logs mencatat semua aksi penting user

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
