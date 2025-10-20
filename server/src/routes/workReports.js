import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, isAdminUtama, isPetugasOrAdmin } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Submit work report (Petugas Lapangan only)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      complaintId,
      workStartTime,
      workEndTime,
      workDescription,
      materialsUsed,
      laborCost,
      materialCost,
      notes,
      technicianNotes,
      beforePhotos,
      afterPhotos
    } = req.body

    // Validate required fields
    if (!complaintId || !workStartTime || !workEndTime || !workDescription) {
      return res.status(400).json({ 
        error: 'Field wajib: complaintId, workStartTime, workEndTime, workDescription' 
      })
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId }
    })

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint tidak ditemukan' })
    }

    // Check if user is assigned to this complaint
    if (req.user.role === 'PETUGAS_LAPANGAN' && complaint.assignedTo !== req.user.id) {
      return res.status(403).json({ 
        error: 'Anda tidak memiliki akses untuk complaint ini' 
      })
    }

    // Check if work report already exists
    const existingReport = await prisma.workReport.findUnique({
      where: { complaintId }
    })

    if (existingReport) {
      return res.status(400).json({ 
        error: 'Laporan pekerjaan sudah ada untuk complaint ini' 
      })
    }

    // Calculate total cost
    const totalCost = (laborCost || 0) + (materialCost || 0)

    // Create work report
    const workReport = await prisma.workReport.create({
      data: {
        complaintId,
        workStartTime: new Date(workStartTime),
        workEndTime: new Date(workEndTime),
        workDescription,
        materialsUsed: materialsUsed || [],
        laborCost: laborCost ? parseFloat(laborCost) : null,
        materialCost: materialCost ? parseFloat(materialCost) : null,
        totalCost,
        notes,
        technicianNotes,
        beforePhotos: beforePhotos || [],
        afterPhotos: afterPhotos || [],
        reviewStatus: 'PENDING'
      },
      include: {
        complaint: {
          select: {
            ticketNumber: true,
            title: true
          }
        }
      }
    })

    // Update complaint status to COMPLETED
    await prisma.complaint.update({
      where: { id: complaintId },
      data: { 
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    })

    // Add complaint update
    await prisma.complaintUpdate.create({
      data: {
        complaintId,
        message: 'Pekerjaan selesai dilakukan oleh petugas. Menunggu review dari admin.',
        status: 'COMPLETED'
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBMIT_WORK_REPORT',
        details: `Submitted work report for complaint ${complaint.ticketNumber}`
      }
    })

    res.status(201).json({
      success: true,
      message: 'Laporan pekerjaan berhasil dikirim',
      data: workReport
    })
  } catch (error) {
    console.error('Submit work report error:', error)
    res.status(500).json({ error: 'Gagal mengirim laporan pekerjaan' })
  }
})

// Update work report (Petugas Lapangan only, if status is REVISION_NEEDED)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const {
      workStartTime,
      workEndTime,
      workDescription,
      materialsUsed,
      laborCost,
      materialCost,
      notes,
      technicianNotes,
      beforePhotos,
      afterPhotos
    } = req.body

    // Check if work report exists
    const existingReport = await prisma.workReport.findUnique({
      where: { id },
      include: {
        complaint: true
      }
    })

    if (!existingReport) {
      return res.status(404).json({ error: 'Laporan pekerjaan tidak ditemukan' })
    }

    // Check if user is assigned to this complaint
    if (req.user.role === 'PETUGAS_LAPANGAN' && 
        existingReport.complaint.assignedTo !== req.user.id) {
      return res.status(403).json({ 
        error: 'Anda tidak memiliki akses untuk laporan ini' 
      })
    }

    // Check if report can be edited (only if PENDING or REVISION_NEEDED)
    if (!['PENDING', 'REVISION_NEEDED'].includes(existingReport.reviewStatus)) {
      return res.status(400).json({ 
        error: 'Laporan yang sudah disetujui tidak dapat diubah' 
      })
    }

    // Calculate total cost
    const totalCost = (laborCost || existingReport.laborCost || 0) + 
                      (materialCost || existingReport.materialCost || 0)

    // Update work report
    const workReport = await prisma.workReport.update({
      where: { id },
      data: {
        workStartTime: workStartTime ? new Date(workStartTime) : undefined,
        workEndTime: workEndTime ? new Date(workEndTime) : undefined,
        workDescription: workDescription || undefined,
        materialsUsed: materialsUsed || undefined,
        laborCost: laborCost ? parseFloat(laborCost) : undefined,
        materialCost: materialCost ? parseFloat(materialCost) : undefined,
        totalCost,
        notes: notes || undefined,
        technicianNotes: technicianNotes || undefined,
        beforePhotos: beforePhotos || undefined,
        afterPhotos: afterPhotos || undefined,
        reviewStatus: 'PENDING', // Reset to pending after edit
        reviewNotes: null,
        reviewedAt: null,
        reviewedBy: null
      }
    })

    // Update complaint status back to COMPLETED
    await prisma.complaint.update({
      where: { id: existingReport.complaintId },
      data: { 
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_WORK_REPORT',
        details: `Updated work report for complaint ${existingReport.complaint.ticketNumber}`
      }
    })

    res.json({
      success: true,
      message: 'Laporan pekerjaan berhasil diperbarui',
      data: workReport
    })
  } catch (error) {
    console.error('Update work report error:', error)
    res.status(500).json({ error: 'Gagal memperbarui laporan pekerjaan' })
  }
})

// Get work report by ID
router.get('/:id', authenticate, isPetugasOrAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const workReport = await prisma.workReport.findUnique({
      where: { id },
      include: {
        complaint: {
          include: {
            officer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!workReport) {
      return res.status(404).json({ error: 'Laporan pekerjaan tidak ditemukan' })
    }

    // Check permission for Petugas
    if (req.user.role === 'PETUGAS_LAPANGAN' && 
        workReport.complaint.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak' })
    }

    res.json({
      success: true,
      data: workReport
    })
  } catch (error) {
    console.error('Get work report error:', error)
    res.status(500).json({ error: 'Gagal mengambil laporan pekerjaan' })
  }
})

// Get all work reports (Admin only, or Petugas for their own)
router.get('/', authenticate, isPetugasOrAdmin, async (req, res) => {
  try {
    const { status, complaintId } = req.query

    const where = {}
    
    // Petugas can only see their own reports
    if (req.user.role === 'PETUGAS_LAPANGAN') {
      where.complaint = {
        assignedTo: req.user.id
      }
    }

    if (status) {
      where.reviewStatus = status
    }

    if (complaintId) {
      where.complaintId = complaintId
    }

    const workReports = await prisma.workReport.findMany({
      where,
      include: {
        complaint: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            location: true,
            status: true,
            officer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    res.json({
      success: true,
      data: workReports
    })
  } catch (error) {
    console.error('Get work reports error:', error)
    res.status(500).json({ error: 'Gagal mengambil laporan pekerjaan' })
  }
})

// Review work report (Admin only)
router.post('/:id/review', authenticate, isAdminUtama, async (req, res) => {
  try {
    const { id } = req.params
    const { reviewStatus, reviewNotes } = req.body

    if (!reviewStatus || !['APPROVED', 'REVISION_NEEDED', 'REJECTED'].includes(reviewStatus)) {
      return res.status(400).json({ 
        error: 'reviewStatus harus APPROVED, REVISION_NEEDED, atau REJECTED' 
      })
    }

    // Check if work report exists
    const existingReport = await prisma.workReport.findUnique({
      where: { id },
      include: {
        complaint: true
      }
    })

    if (!existingReport) {
      return res.status(404).json({ error: 'Laporan pekerjaan tidak ditemukan' })
    }

    // Update work report review
    const workReport = await prisma.workReport.update({
      where: { id },
      data: {
        reviewStatus,
        reviewNotes,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      include: {
        complaint: {
          select: {
            ticketNumber: true,
            title: true
          }
        }
      }
    })

    // Update complaint status based on review
    let newComplaintStatus
    let updateMessage

    switch (reviewStatus) {
      case 'APPROVED':
        newComplaintStatus = 'RESOLVED'
        updateMessage = 'Laporan pekerjaan telah disetujui. Pekerjaan selesai.'
        break
      case 'REVISION_NEEDED':
        newComplaintStatus = 'REVISION_NEEDED'
        updateMessage = `Laporan pekerjaan perlu revisi. Catatan: ${reviewNotes || 'Tidak ada catatan'}`
        break
      case 'REJECTED':
        newComplaintStatus = 'REJECTED'
        updateMessage = `Laporan pekerjaan ditolak. Alasan: ${reviewNotes || 'Tidak ada alasan'}`
        break
    }

    await prisma.complaint.update({
      where: { id: existingReport.complaintId },
      data: { 
        status: newComplaintStatus,
        resolvedAt: reviewStatus === 'APPROVED' ? new Date() : null,
        updatedAt: new Date()
      }
    })

    // Add complaint update
    await prisma.complaintUpdate.create({
      data: {
        complaintId: existingReport.complaintId,
        message: updateMessage,
        status: newComplaintStatus
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'REVIEW_WORK_REPORT',
        details: `Reviewed work report for complaint ${existingReport.complaint.ticketNumber} - Status: ${reviewStatus}`
      }
    })

    res.json({
      success: true,
      message: 'Review berhasil disimpan',
      data: workReport
    })
  } catch (error) {
    console.error('Review work report error:', error)
    res.status(500).json({ error: 'Gagal melakukan review' })
  }
})

export default router
