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

// Create complaint
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      latitude, 
      longitude, 
      priority 
    } = req.body

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Required fields missing' })
    }

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        location,
        latitude,
        longitude,
        priority: priority || 'MEDIUM',
        reporterId: req.user.id
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
