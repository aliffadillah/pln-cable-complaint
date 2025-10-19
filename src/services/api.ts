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
