# 🌱 Database Seeding Guide

## Apa itu Database Seeding?

Database seeding adalah proses mengisi database dengan data awal (sample data) untuk development dan testing.

## 📋 Data yang Akan Di-seed

### 👥 Users (3 users)

#### 1. Admin Utama
- **Email**: `admin@pln.co.id`
- **Password**: `password123`
- **Role**: ADMIN_UTAMA
- **Nama**: Admin Utama PLN
- **Hak Akses**: Full access (CRUD users, complaints, assign tasks, view stats)

#### 2. Petugas Lapangan 1
- **Email**: `petugas1@pln.co.id`
- **Password**: `password123`
- **Role**: PETUGAS_LAPANGAN
- **Nama**: Budi Santoso
- **Hak Akses**: View & update assigned complaints only

#### 3. Petugas Lapangan 2
- **Email**: `petugas2@pln.co.id`
- **Password**: `password123`
- **Role**: PETUGAS_LAPANGAN
- **Nama**: Siti Nurhaliza
- **Hak Akses**: View & update assigned complaints only

### 📋 Sample Complaints (2 complaints)

#### 1. Kabel Putus di Jalan Sudirman
- Status: PENDING
- Priority: HIGH
- Location: Jl. Sudirman No. 45, Jakarta
- Reporter: Admin Utama

#### 2. Tiang Listrik Miring
- Status: IN_PROGRESS
- Priority: MEDIUM
- Location: Jl. Gatot Subroto No. 12, Jakarta
- Reporter: Petugas 1
- Assigned to: Petugas 2

## 🚀 Cara Menjalankan Seed

### Prerequisites
Pastikan sudah:
1. ✅ Install dependencies: `npm install`
2. ✅ Setup database: PostgreSQL running
3. ✅ Configure `.env`: DATABASE_URL sudah benar
4. ✅ Run migrations: `npm run prisma:migrate`

### Jalankan Seed

```bash
cd server
npm run prisma:seed
```

Output yang diharapkan:
```
🌱 Starting seed...
✅ Admin created: admin@pln.co.id
✅ Petugas 1 created: petugas1@pln.co.id
✅ Petugas 2 created: petugas2@pln.co.id
✅ Sample complaint created: Kabel Putus di Jalan Sudirman
✅ Sample complaint created: Tiang Listrik Miring
🎉 Seed completed!

📝 Default credentials:
   Admin Utama:
   Email: admin@pln.co.id
   Password: password123

   Petugas Lapangan:
   Email: petugas1@pln.co.id
   Password: password123
```

## 🔄 Reset & Re-seed Database

Jika ingin reset database dan seed ulang:

```bash
cd server

# Reset database (hapus semua data dan jalankan ulang migrations)
npx prisma migrate reset

# Seed akan otomatis berjalan setelah reset
# Atau jalankan manual:
npm run prisma:seed
```

## 🧪 Testing Login

### Via cURL (Command Line)

**Login sebagai Admin:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@pln.co.id\",\"password\":\"password123\"}"
```

**Login sebagai Petugas:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"petugas1@pln.co.id\",\"password\":\"password123\"}"
```

### Via Frontend

1. Buka http://localhost:5173
2. Klik tombol "Masuk"
3. Gunakan credentials di atas

## 🔒 Password Hash

- Password di-hash menggunakan `bcryptjs` dengan salt rounds 10
- Password original: `password123`
- Hash akan berbeda setiap kali seed dijalankan (karena salt random)

## 📊 Verify Data

### Via Prisma Studio

```bash
cd server
npm run prisma:studio
```

Akan membuka GUI di http://localhost:5555

### Via psql (PostgreSQL CLI)

```bash
psql -U postgres -d pln_care_db

-- List all users
SELECT id, email, name, role, "isActive" FROM users;

-- List all complaints
SELECT id, title, status, priority FROM complaints;

-- Exit
\q
```

## 🛠️ Troubleshooting

### Error: "Unique constraint failed on the fields: (email)"

**Penyebab**: User dengan email tersebut sudah ada di database.

**Solusi**:
```bash
# Hapus user yang ada atau reset database
npx prisma migrate reset
```

### Error: "Can't reach database server"

**Penyebab**: PostgreSQL tidak running atau DATABASE_URL salah.

**Solusi**:
1. Start PostgreSQL service
2. Check DATABASE_URL di `server/.env`
3. Test connection: `psql -U postgres`

### Error: "Invalid `prisma.user.create()` invocation"

**Penyebab**: Schema tidak sync atau migration belum dijalankan.

**Solusi**:
```bash
npm run prisma:generate
npm run prisma:migrate
```

## 📝 Custom Seed

Untuk menambahkan data custom, edit file `server/prisma/seed.js`:

```javascript
// Tambahkan user baru
const officer3 = await prisma.user.create({
  data: {
    email: 'petugas3@pln.co.id',
    password: hashedPassword,
    name: 'Ahmad Wijaya',
    role: 'PETUGAS_LAPANGAN',
    isActive: true,
  },
})

// Tambahkan complaint baru
const complaint3 = await prisma.complaint.create({
  data: {
    title: 'Lampu Jalan Mati',
    description: 'Lampu jalan sudah mati sejak 3 hari',
    location: 'Jl. Thamrin No. 88, Jakarta',
    status: 'PENDING',
    priority: 'LOW',
    reporterId: officer3.id,
  },
})
```

Kemudian jalankan seed lagi:
```bash
npm run prisma:seed
```

## ✅ Checklist

Sebelum development, pastikan:
- [ ] PostgreSQL service running
- [ ] Database `pln_care_db` sudah dibuat
- [ ] File `.env` dan `server/.env` sudah dikonfigurasi
- [ ] Dependencies terinstall (`npm install`)
- [ ] Migrations sudah dijalankan (`npm run prisma:migrate`)
- [ ] Seed berhasil dijalankan (`npm run prisma:seed`)
- [ ] Backend server berjalan (`npm run dev`)
- [ ] Bisa login dengan credentials di atas

---

**Happy Coding! 🚀**
