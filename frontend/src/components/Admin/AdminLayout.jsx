import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { LogOut, Settings, User, Bell, LayoutDashboard, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

const AdminLayout = () => {
  const navigate = useNavigate()
  const { admin, logout } = useAdminAuthStore()

  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    if (saved === '1') setIsCollapsed(true)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  const menuItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/card-management', icon: Eye, label: 'Kart Yönetimi' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-16' : 'w-56'} fixed top-0 left-0 z-40 h-screen bg-gray-900 border-r border-gray-700 shadow-lg transition-all duration-300`}> 
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="px-4 py-6 border-b border-gray-700">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <img src="/img/logo.png" alt="Chronis Logo" className="w-10 h-10" />
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-white">Chronis</h1>
                  <p className="text-xs text-gray-400">Management System</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Toggle Button */}
          <div className="px-3 py-2 border-b border-gray-700">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title={isCollapsed ? 'Genişlet' : 'Daralt'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-start px-4 space-x-3 py-3'} rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer - Admin Info */}
          <div className="px-2 py-3 border-t border-gray-700">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4 space-x-3'} py-3 bg-gray-800 rounded-lg`}>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{admin?.username}</p>
                  <p className="text-xs text-gray-400">{admin?.role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${isCollapsed ? 'ml-16' : 'ml-56'} transition-all duration-300`}>
        {/* Top Navbar */}
        <nav className={`bg-white border-b border-gray-200 fixed ${isCollapsed ? 'w-[calc(100%-4rem)]' : 'w-[calc(100%-14rem)]'} z-30 top-0 transition-all duration-300`}>
          <div className="px-6 py-3">
            <div className="flex items-center justify-end">
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

