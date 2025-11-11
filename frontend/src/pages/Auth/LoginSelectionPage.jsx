import { Link, useNavigate } from 'react-router-dom'
import { User, Shield, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

const LoginSelectionPage = () => {
  const { accessToken } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Eğer kullanıcı zaten login olmuşsa, dashboard'a yönlendir
    if (accessToken) {
      navigate('/dashboard', { replace: true })
    }
  }, [accessToken, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <div className="w-full max-w-4xl">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/img/logo.png" alt="Chronis Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Chronis Monitoring System</h1>
          <p className="text-gray-300 text-lg">Sisteme giriş yapmak için bir seçenek seçin</p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Kullanıcı Girişi */}
          <Link
            to="/login"
            className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2"
          >
            {/* Hover Işık Efekti */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500/5 group-hover:to-blue-500/10 transition-all duration-500 rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/0 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-500 blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50 group-hover:bg-blue-500 group-hover:shadow-blue-500/75 group-hover:shadow-xl transition-all duration-300">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Kullanıcı Girişi</h2>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors">
                Normal kullanıcılar için giriş sayfası. Dashboard ve sistem sayfalarına erişim sağlar.
              </p>
              <div className="flex items-center text-blue-500 font-semibold group-hover:text-blue-400 group-hover:translate-x-2 transition-all duration-300">
                <span>Giriş Yap</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </Link>

          {/* Admin Girişi */}
          <Link
            to="/admin"
            className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2"
          >
            {/* Hover Işık Efekti */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-purple-500/5 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/0 rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all duration-500 blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50 group-hover:bg-purple-500 group-hover:shadow-purple-500/75 group-hover:shadow-xl transition-all duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">Admin Girişi</h2>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors">
                Yöneticiler için özel giriş sayfası. Admin paneli ve sistem yönetimi erişimi sağlar.
              </p>
              <div className="flex items-center text-purple-500 font-semibold group-hover:text-purple-400 group-hover:translate-x-2 transition-all duration-300">
                <span>Giriş Yap</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            © 2025 Chronis. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginSelectionPage

