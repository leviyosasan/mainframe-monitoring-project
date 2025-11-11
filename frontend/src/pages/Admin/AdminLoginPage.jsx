import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { ShieldCheck, Lock, User } from 'lucide-react'
import axios from 'axios'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const setAdminAuth = useAdminAuthStore((state) => state.setAuth)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      
      // Normal login endpoint'ini kullan
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      })

      const { user, accessToken } = response.data.data

      // Kullanıcının admin olup olmadığını kontrol et
      if (user.role !== 'admin') {
        setError('Bu sayfaya erişim için admin yetkisi gereklidir!')
        setLoading(false)
        return
      }

      // Admin store'a kaydet
      const adminUser = {
        id: user.id,
        username: user.email.split('@')[0],
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
      
      setAdminAuth(adminUser, accessToken)
      navigate('/admin/dashboard')
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Giriş başarısız. Lütfen tekrar deneyin.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/img/logo.png" alt="Chronis Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Chronis Monitoring System</h1>
          <p className="text-gray-300">Admin Panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Yönetici Girişi
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-purple-500/50"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            © 2025 Chronis. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage

