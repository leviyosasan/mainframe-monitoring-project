import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Token ekleme
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Token yenileme ve hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Token yenileme
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { refreshToken } = useAuthStore.getState()
        
        if (!refreshToken) {
          throw new Error('Refresh token bulunamadı')
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data

        useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Hata mesajlarını göster
    const errorMessage = error.response?.data?.message || 'Bir hata oluştu'
    
    if (error.response?.status !== 401) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

// Database API functions
export const databaseAPI = {
  // Test database connection
  testConnection: (config) => api.post('/database/test-connection', config),
  
  // Get mainview_mvs_sysover data
  getMainviewMvsSysover: (config) => api.post('/database/mainview-mvs-sysover', config),

  //Get mainview_mvs_jespool data
  getMainviewMvsJespool: (config) => api.post('/database/mainview-mvs-jespool', config),
  
  // Check table exists and get info
  checkTableExists: (config) => api.post('/database/check-table', config),

  // Check table exists and get info
  checkTableExistsJespool: (config) => api.post('/database/check-table-jespool', config),

  checkTableExistsJCPU: (config) => api.post('/database/check-table-jcpu', config),
  
  getMainviewMvsJCPU: (config) => api.post('/database/mainview-mvs-jcpu', config)
}

export default api

