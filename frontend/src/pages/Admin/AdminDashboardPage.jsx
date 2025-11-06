import { useAdminAuthStore } from '../../store/adminAuthStore'

const AdminDashboardPage = () => {
  const admin = useAdminAuthStore((state) => state.admin)

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src="/img/logo.png" 
            alt="Chronis Logo" 
            className="w-32 h-32 animate-pulse"
          />
        </div>

        {/* Hoş Geldiniz Mesajı */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">
            Chronis Admin Dashboard'a Hoş Geldiniz
          </h1>
          <p className="text-xl text-gray-600">
            Merhaba, <span className="font-semibold text-primary-600">{admin?.username}</span>
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Sistem yönetimi ve kullanıcı kontrolleri için yan menüden ilgili bölümlere erişebilirsiniz.
          </p>
        </div>

        {/* Dekoratif Elemanlar */}
        <div className="flex justify-center space-x-4 pt-8">
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
