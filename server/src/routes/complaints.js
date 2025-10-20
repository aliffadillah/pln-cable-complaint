import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, isAdminUtama, isPetugasOrAdmin } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get all complaints
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, assignedTo, limit } = req.query

    const where = {}
    
    // Petugas can only see assigned complaints
    if (req.user.role === 'PETUGAS_LAPANGAN') {
      where.assignedTo = req.user.id
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo && req.user.role === 'ADMIN_UTAMA') {
      where.assignedTo = assignedTo
    }

    const queryOptions = {
      where,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        officer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    }

    // Add limit if provided
    if (limit) {
      queryOptions.take = parseInt(limit)
    }

    const complaints = await prisma.complaint.findMany(queryOptions)

    res.json(complaints)
  } catch (error) {
    console.error('Get complaints error:', error)
    res.status(500).json({ error: 'Failed to get complaints' })
  }
})

// Get complaint by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        officer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    // Check permission for Petugas
    if (req.user.role === 'PETUGAS_LAPANGAN' && 
        complaint.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ complaint })
  } catch (error) {
    console.error('Get complaint error:', error)
    res.status(500).json({ error: 'Failed to get complaint' })
  }
})

// Generate unique ticket number
function generateTicketNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `PLN-${year}-${random}`
}

// Create complaint (Internal - with login)
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      latitude, 
      longitude, 
      priority,
      images
    } = req.body

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Required fields missing' })
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

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        title,
        description,
        location,
        latitude,
        longitude,
        priority: priority || 'MEDIUM',
        reporterId: req.user.id,
        isPublic: false,
        images: imageArray
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create initial update
    await prisma.complaintUpdate.create({
      data: {
        complaintId: complaint.id,
        message: 'Complaint created',
        status: 'PENDING'
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_COMPLAINT',
        details: `Created complaint: ${title}`
      }
    })

    res.status(201).json({ 
      message: 'Complaint created successfully',
      complaint 
    })
  } catch (error) {
    console.error('Create complaint error:', error)
    res.status(500).json({ error: 'Failed to create complaint' })
  }
})

// Assign complaint to officer (Admin only)
router.post('/:id/assign', authenticate, isAdminUtama, async (req, res) => {
  try {
    const { id } = req.params
    const { assignedTo } = req.body

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo is required' })
    }

    // Check if officer exists
    const officer = await prisma.user.findUnique({
      where: { id: assignedTo }
    })

    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' })
    }

    if (officer.role !== 'PETUGAS_LAPANGAN') {
      return res.status(400).json({ error: 'User is not a field officer' })
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        assignedTo,
        assignedAt: new Date(),
        status: 'ASSIGNED'
      },
      include: {
        officer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Add update
    await prisma.complaintUpdate.create({
      data: {
        complaintId: id,
        message: `Ditugaskan kepada ${officer.name}`,
        status: 'ASSIGNED'
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ASSIGN_COMPLAINT',
        details: `Assigned complaint ${complaint.ticketNumber} to ${officer.name}`
      }
    })

    res.json({ 
      message: 'Complaint assigned successfully',
      complaint 
    })
  } catch (error) {
    console.error('Assign complaint error:', error)
    res.status(500).json({ error: 'Failed to assign complaint' })
  }
})

// Update complaint status (Petugas or Admin)
router.put('/:id/status', authenticate, isPetugasOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, message } = req.body

    if (!status) {
      return res.status(400).json({ error: 'Status is required' })
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id }
    })

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    // Check permission for Petugas
    if (req.user.role === 'PETUGAS_LAPANGAN' && complaint.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Not assigned to this complaint' })
    }

    const updateData = {
      status,
      updatedAt: new Date()
    }

    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: updateData
    })

    // Add update
    await prisma.complaintUpdate.create({
      data: {
        complaintId: id,
        message: message || `Status updated to ${status}`,
        status
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_STATUS',
        details: `Updated complaint ${complaint.ticketNumber} status to ${status}`
      }
    })

    res.json({ 
      message: 'Status updated successfully',
      complaint: updatedComplaint
    })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// Update complaint (Admin only)
router.put('/:id', authenticate, isAdminUtama, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      title, 
      description, 
      location, 
      latitude, 
      longitude, 
      status, 
      priority, 
      assignedTo 
    } = req.body

    const updateData = {
      title,
      description,
      location,
      latitude,
      longitude,
      status,
      priority,
      assignedTo
    }

    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        },
        officer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_COMPLAINT',
        details: `Updated complaint: ${complaint.title}`
      }
    })

    res.json({ 
      message: 'Complaint updated successfully',
      complaint 
    })
  } catch (error) {
    console.error('Update complaint error:', error)
    res.status(500).json({ error: 'Failed to update complaint' })
  }
})

// Add complaint update (Petugas or Admin)
router.post('/:id/updates', authenticate, isPetugasOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { message, status } = req.body

    if (!message || !status) {
      return res.status(400).json({ error: 'Message and status required' })
    }

    // Check if Petugas is assigned
    const complaint = await prisma.complaint.findUnique({
      where: { id }
    })

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    if (req.user.role === 'PETUGAS_LAPANGAN' && 
        complaint.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Not assigned to this complaint' })
    }

    // Create update
    const update = await prisma.complaintUpdate.create({
      data: {
        complaintId: id,
        message,
        status
      }
    })

    // Update complaint status
    await prisma.complaint.update({
      where: { id },
      data: { 
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADD_COMPLAINT_UPDATE',
        details: `Added update to complaint ${id}`
      }
    })

    res.status(201).json({ 
      message: 'Update added successfully',
      update 
    })
  } catch (error) {
    console.error('Add update error:', error)
    res.status(500).json({ error: 'Failed to add update' })
  }
})

// Delete complaint (Admin only)
router.delete('/:id', authenticate, isAdminUtama, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.complaint.delete({
      where: { id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_COMPLAINT',
        details: `Deleted complaint ${id}`
      }
    })

    res.json({ message: 'Complaint deleted successfully' })
  } catch (error) {
    console.error('Delete complaint error:', error)
    res.status(500).json({ error: 'Failed to delete complaint' })
  }
})

// Get statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const where = {}
    
    // For Petugas, only show their assigned complaints
    if (req.user.role === 'PETUGAS_LAPANGAN') {
      where.assignedTo = req.user.id
    }

    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints
    ] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: 'PENDING' } }),
      prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } })
    ])

    const stats = {
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints
    }

    // Add assigned tasks count for Petugas
    if (req.user.role === 'PETUGAS_LAPANGAN') {
      stats.myAssignedTasks = totalComplaints
    }

    res.json(stats)
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to get statistics' })
  }
})

// Get statistics overview (Admin only)
router.get('/stats/overview', authenticate, isAdminUtama, async (req, res) => {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      totalUsers,
      totalPetugas
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PETUGAS_LAPANGAN' } })
    ])

    res.json({
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        totalUsers,
        totalPetugas
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to get statistics' })
  }
})

export default router
