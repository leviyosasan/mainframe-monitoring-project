import { User, Mail, Calendar, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/Common/Button'

const ProfilePage = () => {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
        <p className="text-gray-600 mt-1">Profil bilgilerinizi görüntüleyin ve düzenleyin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                {user?.role}
              </span>
            </div>
            <Button variant="primary" className="w-full mt-6">
              Profili Düzenle
            </Button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kişisel Bilgiler</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Ad Soyad</p>
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Rol</p>
                  <p className="text-sm font-medium text-gray-900">{user?.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Güvenlik</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Mevcut Şifre</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Yeni Şifre</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Yeni Şifre (Tekrar)</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <Button variant="primary">Şifreyi Güncelle</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

