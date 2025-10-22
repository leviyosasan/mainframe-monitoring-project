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
  
  getMainviewMvsJCPU: (config) => api.post('/database/mainview-mvs-jcpu', config),

  getMainviewNetworkStacks: (config) => api.post('/database/mainview-network-stacks', config),
  
  checkTableExistsStacks: (config) => api.post('/database/check-table-stacks', config),

  getMainviewNetworkStackCPU: (config) => api.post('/database/mainview-network-stackcpu', config),
  
  checkTableExistsStackCPU: (config) => api.post('/database/check-table-stackcpu', config),

  getMainviewNetworkVtamcsa: (config) => api.post('/database/mainview-network-vtamcsa', config),
  
  checkTableExistsVtamcsa: (config) => api.post('/database/check-table-vtamcsa', config),

  // VTMBUFF
  getMainviewNetworkVtmbuff: (config) => api.post('/database/mainview-network-vtmbuff', config),
  checkTableExistsVtmbuff: (config) => api.post('/database/check-table-vtmbuff', config),

  // TCPSTOR
  getMainviewNetworkTcpstor: (config) => api.post('/database/mainview-network-tcpstor', config),
  checkTableExistsTcpstor: (config) => api.post('/database/check-table-tcpstor', config),

  // CONNSRPZ
  getMainviewNetworkConnsrpz: (config) => api.post('/database/mainview-network-connsrpz', config),
  checkTableExistsConnsrpz: (config) => api.post('/database/check-table-connsrpz', config),

    // Get mainview_network_tcpconf data
    getMainviewNetworkTcpconf: (config) => api.post('/database/mainview-network-tcpconf', config),
 
    // Check table exists for tcpconf
    checkTableExiststcpconf: (config) => api.post('/database/check-table-tcpconf', config),
   
    // Get mainview_network_tcpcons data
    getMainviewNetworktcpcons: (config) => api.post('/database/mainview-network-tcpcons', config),
   
    // Check table exists for tcpcons
    checkTableExiststcpcons: (config) => api.post('/database/check-table-tcpcons', config),
   
    // Get mainview_network_udpconf data
    getMainviewNetworkUdpconf: (config) => api.post('/database/mainview-network-udpconf', config),
   
    // Check table exists for udpconf
    checkTableExistsudpconf: (config) => api.post('/database/check-table-udpconf', config),
   
    // Get mainview_network_actcons data
    getMainviewNetworkactcons: (config) => api.post('/database/mainview-network-actcons', config),
   
    // Check table exists for actcons
    checkTableExistsactcons: (config) => api.post('/database/check-table-actcons', config),
}

export default api