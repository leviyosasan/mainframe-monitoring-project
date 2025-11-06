import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { LogOut, Settings, User, Bell, LayoutDashboard, Eye } from 'lucide-react'

const AdminLayout = () => {
  const navigate = useNavigate()
  const { admin, logout } = useAdminAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  const menuItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/card-management', icon: Eye, label: 'Kullanıcı Dashboard Kart Yönetimi' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-gray-900 border-r border-gray-700">
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="px-4 py-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <img src="/img/logo.png" alt="Chronis Logo" className="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-white">Chronis Admin</h1>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer - Admin Info */}
          <div className="px-3 py-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{admin?.username}</p>
                <p className="text-xs text-gray-400">{admin?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Top Navbar */}
        <nav className="bg-white border-b border-gray-200 fixed w-[calc(100%-16rem)] z-30 top-0">
          <div className="px-6 py-3">
            <div className="flex items-center justify-end space-x-4">
              {/* Bildirimler */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Ayarlar */}
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>

              {/* Çıkış */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Çıkış</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16 px-6 py-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

