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

    // Hata mesajlarını göster (sadece kritik sunucu hataları için toast göster)
    // Chatbot kendi hata mesajlarını gösteriyor, bu yüzden chatbot istekleri için toast gösterme
    const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu'
    const isChatbotRequest = originalRequest.url?.includes('/database/') && 
                              (originalRequest.url?.includes('mainview') || originalRequest.url?.includes('check-table'))
    
    // Aktif bağlantı hatası için özel mesaj göster
    if (errorMessage.includes('Aktif bağlantı bulunamadı')) {
      toast.error('Aktif bağlantı bulunamadı. Lütfen PostgreSQL sayfasından aktif bir bağlantı ekleyin.')
      return Promise.reject(error)
    }
    
    // Sadece kritik sunucu hataları (500, 502, 503, 504) için toast göster ve chatbot istekleri değilse
    const isCriticalError = error.response?.status >= 500 && error.response?.status < 600
    if (error.response?.status !== 401 && !isChatbotRequest && isCriticalError) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

// Aktif bağlantıları al
const getActiveConnections = () => {
  try {
    const savedConnections = localStorage.getItem('postgresql_connections');
    if (savedConnections) {
      const connections = JSON.parse(savedConnections);
      return connections.filter(conn => conn.active === true);
    }
  } catch (error) {
    console.error('Bağlantılar yüklenirken hata:', error);
  }
  return [];
};

// İlk aktif bağlantıyı al veya varsayılan config döndür
const getConnectionConfig = () => {
  const activeConnections = getActiveConnections();
  if (activeConnections.length > 0) {
    const connection = activeConnections[0]; // İlk aktif bağlantıyı kullan
    return {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      password: connection.password
    };
  }
  // Aktif bağlantı yoksa null döndür
  return null;
};

// Database API çağrıları için wrapper - aktif bağlantı kontrolü yapar
const dbApiCall = (endpoint, config) => {
  const connectionConfig = config || getConnectionConfig();
  if (!connectionConfig) {
    return Promise.reject(new Error('Aktif bağlantı bulunamadı. Lütfen PostgreSQL sayfasından aktif bir bağlantı ekleyin.'));
  }
  return api.post(endpoint, connectionConfig);
};

// Database API functions
export const databaseAPI = {
  // Test database connection
  testConnection: (config) => api.post('/database/test-connection', config),
  
  // Get all tables
  getAllTables: (config) => dbApiCall('/database/get-all-tables', config),
  
  // Get table columns
  getTableColumns: (tableName, config) => {
    const connectionConfig = config || getConnectionConfig();
    if (!connectionConfig) {
      return Promise.reject(new Error('Aktif bağlantı bulunamadı. Lütfen PostgreSQL sayfasından aktif bir bağlantı ekleyin.'));
    }
    return api.post('/database/get-table-columns', { tableName, config: connectionConfig });
  },
  
  // Get table data
  getTableData: (tableName, columns, limit, config) => {
    const connectionConfig = config || getConnectionConfig();
    if (!connectionConfig) {
      return Promise.reject(new Error('Aktif bağlantı bulunamadı. Lütfen PostgreSQL sayfasından aktif bir bağlantı ekleyin.'));
    }
    return api.post('/database/get-table-data', { tableName, columns, limit, config: connectionConfig });
  },
  
  // Get mainview_mvs_sysover data
  getMainviewMvsSysover: (config) => dbApiCall('/database/mainview-mvs-sysover', config),

  //Get mainview_mvs_jespool data
  getMainviewMvsJespool: (config) => dbApiCall('/database/mainview-mvs-jespool', config),
  
  // Check table exists and get info
  checkTableExists: (config) => dbApiCall('/database/check-table', config),

  // Check table exists and get info
  checkTableExistsJespool: (config) => dbApiCall('/database/check-table-jespool', config),

  checkTableExistsJCPU: (config) => dbApiCall('/database/check-table-jcpu', config),
  
  getMainviewMvsJCPU: (config) => dbApiCall('/database/mainview-mvs-jcpu', config),

  getLatestCpuData: (config) => dbApiCall('/database/latest-cpu', config),

  getMainviewNetworkStacks: (config) => dbApiCall('/database/mainview-network-stacks', config),
  
  checkTableExistsStacks: (config) => dbApiCall('/database/check-table-stacks', config),

  getMainviewNetworkStackCPU: (config) => dbApiCall('/database/mainview-network-stackcpu', config),
  
  checkTableExistsStackCPU: (config) => dbApiCall('/database/check-table-stackcpu', config),

  getMainviewNetworkVtamcsa: (config) => dbApiCall('/database/mainview-network-vtamcsa', config),
  
  checkTableExistsVtamcsa: (config) => dbApiCall('/database/check-table-vtamcsa', config),

  // VTMBUFF
  getMainviewNetworkVtmbuff: (config) => dbApiCall('/database/mainview-network-vtmbuff', config),
  checkTableExistsVtmbuff: (config) => dbApiCall('/database/check-table-vtmbuff', config),

  // TCPSTOR
  getMainviewNetworkTcpstor: (config) => dbApiCall('/database/mainview-network-tcpstor', config),
  checkTableExistsTcpstor: (config) => dbApiCall('/database/check-table-tcpstor', config),

  // CONNSRPZ
  getMainviewNetworkConnsrpz: (config) => dbApiCall('/database/mainview-network-connsrpz', config),
  checkTableExistsConnsrpz: (config) => dbApiCall('/database/check-table-connsrpz', config),

    // Get mainview_network_tcpconf data
    getMainviewNetworkTcpconf: (config) => dbApiCall('/database/mainview-network-tcpconf', config),
 
    // Check table exists for tcpconf
    checkTableExiststcpconf: (config) => dbApiCall('/database/check-table-tcpconf', config),
   
    // Get mainview_network_tcpcons data
    getMainviewNetworktcpcons: (config) => dbApiCall('/database/mainview-network-tcpcons', config),
   
    // Check table exists for tcpcons
    checkTableExiststcpcons: (config) => dbApiCall('/database/check-table-tcpcons', config),
   
    // Get mainview_network_udpconf data
    getMainviewNetworkUdpconf: (config) => dbApiCall('/database/mainview-network-udpconf', config),
   
    // Check table exists for udpconf
    checkTableExistsudpconf: (config) => dbApiCall('/database/check-table-udpconf', config),
   
    // Get mainview_network_actcons data
    getMainviewNetworkactcons: (config) => dbApiCall('/database/mainview-network-actcons', config),
   
    // Check table exists for actcons
    checkTableExistsactcons: (config) => dbApiCall('/database/check-table-actcons', config),

    // ZFS
    getMainviewUSSZFS: (config) => dbApiCall('/database/mainview-uss-zfs', config),
    checkTableExistsZFS: (config) => dbApiCall('/database/check-table-zfs', config),

    // MQ - Message Queue
    getMainviewMQConnz: (config) => dbApiCall('/database/mainview-mq-connz', config),
    checkTableExistsMQConnz: (config) => dbApiCall('/database/check-table-mq-connz', config),

    getMainviewMQQm: (config) => dbApiCall('/database/mainview-mq-qm', config),
    checkTableExistsMQQm: (config) => dbApiCall('/database/check-table-mq-qm', config),

    getMainviewMQW2over: (config) => dbApiCall('/database/mainview-mq-w2over', config),
    checkTableExistsMQW2over: (config) => dbApiCall('/database/check-table-mq-w2over', config),

    // Storage
    getMainviewStorageCsasum: (config) => dbApiCall('/database/mainview-storage-csasum', config),
    checkTableExistsCsasum: (config) => dbApiCall('/database/check-table-csasum', config),

    getMainviewStorageFrminfoCenter: (config) => dbApiCall('/database/mainview-storage-frminfo-central', config),
    checkTableExistsFrminfoCenter: (config) => dbApiCall('/database/check-table-frminfo-central', config),
    
    getMainviewStorageFrminfofixed: (config) => dbApiCall('/database/mainview-storage-frminfo-fixed', config),
    checkTableExistsFrminfofixed: (config) => dbApiCall('/database/check-table-frminfo-fixed', config),
    
    getMainviewStorageFrminfoHighVirtual: (config) => dbApiCall('/database/mainview-storage-frminfo-high-virtual', config),
    checkTableExistsFrminfoHighVirtual: (config) => dbApiCall('/database/check-table-frminfo-high-virtual', config),
    
    getMainviewStoragesysfrmiz: (config) => dbApiCall('/database/mainview-storage-sysfrmiz', config),
    checkTableExistsSysfrmiz: (config) => dbApiCall('/database/check-table-sysfrmiz', config),

    // RMF tables
    getMainviewRmfPgspp: (config) => dbApiCall('/database/mainview-rmf-pgspp', config),
    checkTableExistsRmfPgspp: (config) => dbApiCall('/database/check-table-rmf-pgspp', config),
    
    getMainviewRmfArd: (config) => dbApiCall('/database/mainview-rmf-ard', config),
    checkTableExistsRmfArd: (config) => dbApiCall('/database/check-table-rmf-ard', config),
    
    getMainviewRmfTrx: (config) => dbApiCall('/database/mainview-rmf-trx', config),
    checkTableExistsRmfTrx: (config) => dbApiCall('/database/check-table-rmf-trx', config),
    
    getMainviewRmfAsrm: (config) => dbApiCall('/database/mainview-rmf-asrm', config),
    checkTableExistsRmfAsrm: (config) => dbApiCall('/database/check-table-rmf-asrm', config),
    
    getMainviewRmfSrcs: (config) => dbApiCall('/database/mainview-rmf-srcs', config),
    checkTableExistsRmfSrcs: (config) => dbApiCall('/database/check-table-rmf-srcs', config),
    
    getMainviewRmfAsd: (config) => dbApiCall('/database/mainview-rmf-asd', config),
    checkTableExistsRmfAsd: (config) => dbApiCall('/database/check-table-rmf-asd', config),
    
    getMainviewRmfSpag: (config) => dbApiCall('/database/mainview-rmf-spag', config),
    checkTableExistsRmfSpag: (config) => dbApiCall('/database/check-table-rmf-spag', config),

    // CMF tables
    getMainviewCmfDspcz: (config) => dbApiCall('/database/mainview-cmf-dspcz', config),
    checkTableExistsCmfDspcz: (config) => dbApiCall('/database/check-table-cmf-dspcz', config),
    
    getMainviewCmfXcfsys: (config) => dbApiCall('/database/mainview-cmf-xcfsys', config),
    checkTableExistsCmfXcfsys: (config) => dbApiCall('/database/check-table-cmf-xcfsys', config),
    
    getMainviewCmfJcsa: (config) => dbApiCall('/database/mainview-cmf-jcsa', config),
    checkTableExistsCmfJcsa: (config) => dbApiCall('/database/check-table-cmf-jcsa', config),
    
    getMainviewCmfXcfmbr: (config) => dbApiCall('/database/mainview-cmf-xcfmbr', config),
    checkTableExistsCmfXcfmbr: (config) => dbApiCall('/database/check-table-cmf-xcfmbr', config),
    
    getMainviewCmfSyscpc: (config) => dbApiCall('/database/mainview-cmf-syscpc', config),
    checkTableExistsCmfSyscpc: (config) => dbApiCall('/database/check-table-cmf-syscpc', config),

}

export default api