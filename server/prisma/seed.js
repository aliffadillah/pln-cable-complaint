import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Admin Utama
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pln.co.id' },
    update: {},
    create: {
      email: 'admin@pln.co.id',
      password: hashedPassword,
      name: 'Admin Utama PLN',
      role: 'ADMIN_UTAMA',
      isActive: true,
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create Petugas Lapangan 1
  const officer1 = await prisma.user.upsert({
    where: { email: 'petugas1@pln.co.id' },
    update: {},
    create: {
      email: 'petugas1@pln.co.id',
      password: hashedPassword,
      name: 'Budi Santoso',
      role: 'PETUGAS_LAPANGAN',
      isActive: true,
    },
  })
  console.log('✅ Petugas 1 created:', officer1.email)

  // Create Petugas Lapangan 2
  const officer2 = await prisma.user.upsert({
    where: { email: 'petugas2@pln.co.id' },
    update: {},
    create: {
      email: 'petugas2@pln.co.id',
      password: hashedPassword,
      name: 'Siti Nurhaliza',
      role: 'PETUGAS_LAPANGAN',
      isActive: true,
    },
  })
  console.log('✅ Petugas 2 created:', officer2.email)

  // Create sample complaints
  const complaint1 = await prisma.complaint.create({
    data: {
      title: 'Kabel Putus di Jalan Sudirman',
      description: 'Terdapat kabel listrik yang putus dan menggantung di Jalan Sudirman No. 45',
      location: 'Jl. Sudirman No. 45, Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      status: 'PENDING',
      priority: 'HIGH',
      reporterId: admin.id,
    },
  })
  console.log('✅ Sample complaint created:', complaint1.title)

  const complaint2 = await prisma.complaint.create({
    data: {
      title: 'Tiang Listrik Miring',
      description: 'Tiang listrik di depan rumah miring dan terlihat berbahaya',
      location: 'Jl. Gatot Subroto No. 12, Jakarta',
      latitude: -6.2297,
      longitude: 106.8227,
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      reporterId: officer1.id,
      assignedTo: officer2.id,
    },
  })
  console.log('✅ Sample complaint created:', complaint2.title)

  console.log('🎉 Seed completed!')
  console.log('\n📝 Default credentials:')
  console.log('   Admin Utama:')
  console.log('   Email: admin@pln.co.id')
  console.log('   Password: password123')
  console.log('\n   Petugas Lapangan:')
  console.log('   Email: petugas1@pln.co.id')
  console.log('   Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
