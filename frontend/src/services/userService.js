import api from './api'

class UserService {
  /**
   * Tüm kullanıcıları getir
   */
  async getAllUsers(page = 1, limit = 10) {
    const response = await api.get(`/users?page=${page}&limit=${limit}`)
    return response.data
  }

  /**
   * Kullanıcı detayı
   */
  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`)
    return response.data
  }

  /**
   * Yeni kullanıcı oluştur
   */
  async createUser(data) {
    const response = await api.post('/users', data)
    return response.data
  }

  /**
   * Kullanıcı güncelle
   */
  async updateUser(userId, data) {
    const response = await api.put(`/users/${userId}`, data)
    return response.data
  }

  /**
   * Kullanıcı sil
   */
  async deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`)
    return response.data
  }

  /**
   * Şifre değiştir
   */
  async updatePassword(userId, oldPassword, newPassword) {
    const response = await api.put(`/users/${userId}/password`, {
      oldPassword,
      newPassword,
    })
    return response.data
  }
}

export default new UserService()

