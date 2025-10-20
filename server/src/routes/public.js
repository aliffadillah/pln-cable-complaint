import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Generate unique ticket number
function generateTicketNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `PLN-${year}-${random}`
}

// Create public complaint (no authentication required)
router.post('/complaints', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      latitude, 
      longitude,
      reporterName,
      reporterEmail,
      reporterPhone,
      priority,
      images
    } = req.body

    // Validate required fields
    if (!title || !description || !location || !reporterName || !reporterEmail || !reporterPhone) {
      return res.status(400).json({ 
        error: 'Semua field wajib diisi (title, description, location, reporterName, reporterEmail, reporterPhone)' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(reporterEmail)) {
      return res.status(400).json({ error: 'Format email tidak valid' })
    }

    // Validate images (optional)
    let imageArray = []
    if (images && Array.isArray(images)) {
      if (images.length > 5) {
        return res.status(400).json({ error: 'Maksimal 5 foto' })
      }
      imageArray = images
    }

    // Generate unique ticket number
    let ticketNumber
    let isUnique = false
    
    while (!isUnique) {
      ticketNumber = generateTicketNumber()
      const existing = await prisma.complaint.findUnique({
        where: { ticketNumber }
      })
      if (!existing) isUnique = true
    }

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        title,
        description,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        priority: priority || 'MEDIUM',
        isPublic: true,
        reporterName,
        reporterEmail,
        reporterPhone,
        status: 'PENDING',
        images: imageArray
      }
    })

    // Create initial update
    await prisma.complaintUpdate.create({
      data: {
        complaintId: complaint.id,
        message: 'Laporan Anda telah diterima dan sedang dalam antrian untuk ditinjau',
        status: 'PENDING'
      }
    })

    res.status(201).json({ 
      success: true,
      message: 'Laporan berhasil dikirim! Simpan nomor tiket Anda untuk melacak status.',
      data: {
        ticketNumber: complaint.ticketNumber,
        complaintId: complaint.id,
        status: complaint.status,
        createdAt: complaint.createdAt,
        trackingUrl: `/track/${complaint.ticketNumber}`
      }
    })
  } catch (error) {
    console.error('Create public complaint error:', error)
    res.status(500).json({ 
      error: 'Gagal mengirim laporan. Silakan coba lagi.' 
    })
  }
})

// Track complaint by ticket number (no authentication required)
router.get('/complaints/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params

    const complaint = await prisma.complaint.findUnique({
      where: { ticketNumber },
      include: {
        officer: {
          select: {
            name: true,
            phone: true
          }
        },
        updates: {
          orderBy: { createdAt: 'desc' }
        },
        workReport: {
          select: {
            workStartTime: true,
            workEndTime: true,
            workDescription: true,
            beforePhotos: true,
            afterPhotos: true,
            reviewStatus: true,
            submittedAt: true
          }
        }
      }
    })

    if (!complaint) {
      return res.status(404).json({ 
        error: 'Nomor tiket tidak ditemukan. Pastikan Anda memasukkan nomor tiket dengan benar.' 
      })
    }

    // Format response for public view (hide sensitive data)
    const publicData = {
      ticketNumber: complaint.ticketNumber,
      title: complaint.title,
      description: complaint.description,
      location: complaint.location,
      status: complaint.status,
      priority: complaint.priority,
      images: complaint.images,
      assignedOfficer: complaint.officer ? {
        name: complaint.officer.name,
        phone: complaint.officer.phone
      } : null,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      resolvedAt: complaint.resolvedAt,
      timeline: complaint.updates.map(update => ({
        message: update.message,
        status: update.status,
        images: update.images,
        createdAt: update.createdAt
      })),
      workReport: complaint.workReport ? {
        workDescription: complaint.workReport.workDescription,
        workStartTime: complaint.workReport.workStartTime,
        workEndTime: complaint.workReport.workEndTime,
        beforePhotos: complaint.workReport.beforePhotos,
        afterPhotos: complaint.workReport.afterPhotos,
        status: complaint.workReport.reviewStatus,
        submittedAt: complaint.workReport.submittedAt
      } : null,
      statusInfo: getStatusInfo(complaint.status)
    }

    res.json({ 
      success: true,
      data: publicData 
    })
  } catch (error) {
    console.error('Track complaint error:', error)
    res.status(500).json({ 
      error: 'Gagal melacak laporan. Silakan coba lagi.' 
    })
  }
})

// Helper function to get status information
function getStatusInfo(status) {
  const statusMap = {
    'PENDING': {
      label: 'Menunggu Review',
      description: 'Laporan Anda sedang menunggu untuk ditinjau oleh admin',
      color: 'gray'
    },
    'REVIEWED': {
      label: 'Sudah Ditinjau',
      description: 'Laporan Anda telah ditinjau dan akan segera ditindaklanjuti',
      color: 'blue'
    },
    'ASSIGNED': {
      label: 'Ditugaskan',
      description: 'Petugas lapangan telah ditugaskan untuk menangani laporan Anda',
      color: 'blue'
    },
    'ON_THE_WAY': {
      label: 'Petugas Dalam Perjalanan',
      description: 'Petugas sedang menuju lokasi',
      color: 'purple'
    },
    'WORKING': {
      label: 'Sedang Dikerjakan',
      description: 'Petugas sedang mengerjakan perbaikan',
      color: 'yellow'
    },
    'COMPLETED': {
      label: 'Selesai Dikerjakan',
      description: 'Pekerjaan selesai, menunggu verifikasi admin',
      color: 'orange'
    },
    'APPROVED': {
      label: 'Disetujui',
      description: 'Laporan pekerjaan telah disetujui',
      color: 'green'
    },
    'RESOLVED': {
      label: 'Selesai',
      description: 'Laporan Anda telah selesai ditangani',
      color: 'green'
    },
    'REVISION_NEEDED': {
      label: 'Perlu Revisi',
      description: 'Pekerjaan perlu dilakukan perbaikan',
      color: 'orange'
    },
    'REJECTED': {
      label: 'Ditolak',
      description: 'Laporan tidak dapat diproses',
      color: 'red'
    },
    'CANCELLED': {
      label: 'Dibatalkan',
      description: 'Laporan dibatalkan',
      color: 'red'
    }
  }

  return statusMap[status] || {
    label: status,
    description: 'Status tidak diketahui',
    color: 'gray'
  }
}

// Get public statistics (optional - for landing page)
router.get('/stats', async (req, res) => {
  try {
    const [totalComplaints, resolvedComplaints, avgResponseTime] = await Promise.all([
      prisma.complaint.count({ where: { isPublic: true } }),
      prisma.complaint.count({ where: { isPublic: true, status: 'RESOLVED' } }),
      prisma.complaint.aggregate({
        where: { 
          isPublic: true, 
          status: 'RESOLVED',
          resolvedAt: { not: null }
        },
        _avg: {
          id: true // This is a placeholder, we'll calculate properly
        }
      })
    ])

    res.json({
      success: true,
      data: {
        totalComplaints,
        resolvedComplaints,
        resolutionRate: totalComplaints > 0 
          ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) 
          : 0
      }
    })
  } catch (error) {
    console.error('Get public stats error:', error)
    res.status(500).json({ error: 'Gagal mengambil statistik' })
  }
})

export default router
