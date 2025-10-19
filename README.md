# 🔌 PLN Care - Sistem Pengaduan Kabel Listrik

Sistem pengaduan permasalahan kabel listrik modern dengan role-based authentication, built with React, TypeScript, PostgreSQL, dan Prisma ORM.

![Tech Stack](https://img.shields.io/badge/React-19.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-green)

## Features

- **Role-Based Authentication** (Admin Utama & Petugas Lapangan)
- **Modern UI** dengan design system PLN
- **Responsive Design** untuk semua device
- **PostgreSQL Database** dengan Prisma ORM
- **JWT Authentication** untuk keamanan
- **Activity Logging** untuk tracking
- **Real-time Updates** untuk status laporan

## Role Permissions

### Admin Utama
- Full access ke semua fitur
- Manage users (Create, Read, Update, Delete)
- Manage complaints (Create, Read, Update, Delete)
- Assign tasks to officers
- View statistics & dashboard

### Petugas Lapangan
- View assigned complaints
- Update complaint status
- Add updates to assigned tasks
- Cannot manage users
- Cannot view unassigned complaints

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Clone repository
git clone https://github.com/aliffadillah/pln-cable-complaint.git
cd pln-cable-complaint

# Setup backend
cd server
npm install
cp .env.example .env
# Edit server/.env with your database credentials

# Run migrations and seed
npm run prisma:migrate
npm run prisma:seed

# Setup frontend
cd ..
npm install
cp .env.example .env
```

### Running

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

🌐 Frontend: http://localhost:5173  
🔌 Backend: http://localhost:5000

## 🔑 Default Credentials

**Admin Utama:**
- Email: `admin@pln.co.id`
- Password: `password123`

**Petugas Lapangan:**
- Email: `petugas1@pln.co.id`
- Password: `password123`

## 📚 Documentation

- [📖 Setup Guide](./SETUP_GUIDE.md) - Panduan lengkap setup
- [⚡ Quick Start](./QUICKSTART.md) - Panduan cepat
- [🔌 API Documentation](./server/README.md) - API endpoints

## 🛠️ Tech Stack

**Frontend:**
- React 19.1 + TypeScript
- Vite
- CSS3 (Custom Design System)

**Backend:**
- Node.js + Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcryptjs

## 📁 Project Structure

```
pln-cable-complaint/
├── src/                    # Frontend source
│   ├── context/           # React Context (Auth)
│   ├── services/          # API services
│   ├── pages/             # Page components
│   └── App.tsx
├── server/                # Backend source
│   ├── prisma/           # Database schema
│   ├── src/
│   │   ├── routes/       # API routes
│   │   └── middleware/   # Auth middleware
│   └── .env              # Backend config
├── .env                  # Frontend config
└── package.json
```

## 🔒 Environment Variables

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (`server/.env`):**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/pln_care_db"
JWT_SECRET="your-secret-key"
PORT=5000
```

⚠️ **Jangan commit file `.env` ke repository!**

## 🧪 Database Management

```bash
# Open Prisma Studio
cd server
npm run prisma:studio

# Reset database
npm run prisma:migrate reset
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License

## 👨‍💻 Author

**Alif Fadillah**
- GitHub: [@aliffadillah](https://github.com/aliffadillah)

---

⚡ Built with ❤️ for PLN Indonesia
