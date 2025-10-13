import api from './api'

class AuthService {
  /**
   * Kullanıcı kaydı
   */
  async register(data) {
    const response = await api.post('/auth/register', data)
    return response.data
  }

  /**
   * Kullanıcı girişi
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  }

  /**
   * Token yenileme
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  }

  /**
   * Çıkış yap
   */
  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  }

  /**
   * Mevcut kullanıcı bilgisi
   */
  async getMe() {
    const response = await api.get('/auth/me')
    return response.data
  }
}

export default new AuthService()

