import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Check if user is Admin Utama
export const isAdminUtama = (req, res, next) => {
  if (req.user.role !== 'ADMIN_UTAMA') {
    return res.status(403).json({ 
      error: 'Access denied. Admin Utama role required.' 
    })
  }
  next()
}

// Check if user is Petugas Lapangan or Admin
export const isPetugasOrAdmin = (req, res, next) => {
  if (!['PETUGAS_LAPANGAN', 'ADMIN_UTAMA'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Petugas or Admin role required.' 
    })
  }
  next()
}

// Check if user is Petugas Lapangan
export const isPetugasLapangan = (req, res, next) => {
  if (req.user.role !== 'PETUGAS_LAPANGAN') {
    return res.status(403).json({ 
      error: 'Access denied. Petugas Lapangan role required.' 
    })
  }
  next()
}
