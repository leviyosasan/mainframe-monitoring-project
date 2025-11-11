import api from './api'

class PermissionService {
  /**
   * Tüm kullanıcıların izinlerini getir
   */
  async getAllPermissions() {
    const response = await api.get('/permissions')
    return response.data
  }

  /**
   * Kullanıcı izinlerini güncelle
   */
  async updateUserPermissions(userId, permissions) {
    const response = await api.put(`/permissions/${userId}`, { permissions })
    return response.data
  }

  /**
   * Mevcut kullanıcının izinlerini getir
   */
  async getMyPermissions() {
    const response = await api.get('/permissions/me')
    return response.data
  }

  /**
   * Kullanıcının belirli bir sayfaya erişim izni kontrol et
   */
  async checkUserPermission(userId, pageId) {
    const response = await api.get(`/permissions/${userId}/${pageId}`)
    return response.data
  }
}

export default new PermissionService()

