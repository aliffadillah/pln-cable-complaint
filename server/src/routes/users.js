import express from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authenticate, isAdminUtama } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get all users (Admin only)
router.get('/', authenticate, isAdminUtama, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            complaints: true,
            assignedTasks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Check permission: admin can see all, others only their own
    if (req.user.role !== 'ADMIN_UTAMA' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            complaints: true,
            assignedTasks: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Create new user (Admin only)
router.post('/', authenticate, isAdminUtama, async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'PETUGAS_LAPANGAN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_USER',
        details: `Admin created user ${user.name}`
      }
    })

    res.status(201).json({ 
      message: 'User created successfully',
      user 
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Update user (Admin only or self)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, isActive, role } = req.body

    // Check permission
    if (req.user.role !== 'ADMIN_UTAMA' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Non-admin cannot change role or isActive
    const updateData = { name, email }
    if (req.user.role === 'ADMIN_UTAMA') {
      updateData.isActive = isActive
      updateData.role = role
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER',
        details: `User ${user.name} updated`
      }
    })

    res.json({ 
      message: 'User updated successfully',
      user 
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user (Admin only)
router.delete('/:id', authenticate, isAdminUtama, async (req, res) => {
  try {
    const { id } = req.params

    // Cannot delete self
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await prisma.user.delete({
      where: { id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_USER',
        details: `Admin deleted user ${id}`
      }
    })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
