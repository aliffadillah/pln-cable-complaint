const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token')

// API call helper with auth
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken()
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API call failed')
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register: async (data: { email: string; password: string; name: string; role?: string }) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  logout: async () => {
    return apiCall('/auth/logout', { method: 'POST' })
  },

  getCurrentUser: async () => {
    return apiCall('/auth/me')
  },
}

// Users API
export const usersApi = {
  getAll: async () => {
    return apiCall('/users')
  },

  getById: async (id: string) => {
    return apiCall(`/users/${id}`)
  },

  create: async (data: { email: string; password: string; name: string; role: string }) => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<{ name: string; email: string; isActive: boolean; role: string }>) => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiCall(`/users/${id}`, { method: 'DELETE' })
  },

  changePassword: async (id: string, currentPassword: string, newPassword: string) => {
    return apiCall(`/users/${id}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
}

// Complaints API
export const complaintsApi = {
  getAll: async (params?: { status?: string; priority?: string; assignedTo?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return apiCall(`/complaints${query ? `?${query}` : ''}`)
  },

  getById: async (id: string) => {
    return apiCall(`/complaints/${id}`)
  },

  create: async (data: {
    title: string
    description: string
    location: string
    latitude?: number
    longitude?: number
    priority?: string
  }) => {
    return apiCall('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<{
    title: string
    description: string
    location: string
    latitude: number
    longitude: number
    status: string
    priority: string
    assignedTo: string
  }>) => {
    return apiCall(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  assign: async (id: string, assignedTo: string) => {
    return apiCall(`/complaints/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo }),
    })
  },

  updateStatus: async (id: string, status: string, message?: string) => {
    return apiCall(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, message }),
    })
  },

  delete: async (id: string) => {
    return apiCall(`/complaints/${id}`, { method: 'DELETE' })
  },

  addUpdate: async (id: string, data: { message: string; status: string }) => {
    return apiCall(`/complaints/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getStats: async () => {
    return apiCall('/complaints/stats/overview')
  },
}

// Work Reports API
export const workReportsApi = {
  getAll: async (params?: { status?: string; complaintId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return apiCall(`/work-reports${query ? `?${query}` : ''}`)
  },

  getById: async (id: string) => {
    return apiCall(`/work-reports/${id}`)
  },

  create: async (data: {
    complaintId: string
    workStartTime: string
    workEndTime: string
    workDescription: string
    materialsUsed?: any[]
    laborCost?: number
    materialCost?: number
    notes?: string
    technicianNotes?: string
    beforePhotos?: string[]
    afterPhotos?: string[]
  }) => {
    return apiCall('/work-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<{
    workStartTime: string
    workEndTime: string
    workDescription: string
    materialsUsed: any[]
    laborCost: number
    materialCost: number
    notes: string
    technicianNotes: string
    beforePhotos: string[]
    afterPhotos: string[]
  }>) => {
    return apiCall(`/work-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  review: async (id: string, reviewStatus: string, reviewNotes?: string) => {
    return apiCall(`/work-reports/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ reviewStatus, reviewNotes }),
    })
  },
}

// Public API (no authentication required)
export const publicApi = {
  createComplaint: async (data: {
    title: string
    description: string
    location: string
    reporterName: string
    reporterEmail: string
    reporterPhone: string
    latitude?: number
    longitude?: number
    priority?: string
  }) => {
    const response = await fetch(`${API_URL}/public/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create complaint')
    }
    
    return response.json()
  },

  trackComplaint: async (ticketNumber: string) => {
    const response = await fetch(`${API_URL}/public/complaints/${ticketNumber}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch complaint')
    }
    
    return response.json()
  },

  getStats: async () => {
    const response = await fetch(`${API_URL}/public/stats`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch stats')
    }
    
    return response.json()
  },
}
