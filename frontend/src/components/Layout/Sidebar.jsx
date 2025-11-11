import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, User, BarChart3 } from 'lucide-react'
import { useUserPermissions } from '../../hooks/useUserPermissions'

const Sidebar = () => {
  const { hasPermission, isAdmin } = useUserPermissions()

  // Menü öğeleri - izin kontrolü ile
  const allNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', pageId: null }, // Dashboard her zaman erişilebilir
    { to: '/analiz', icon: BarChart3, label: 'Analiz', pageId: 'analiz' },
    { to: '/profile', icon: User, label: 'Profil', pageId: null }, // Profil her zaman erişilebilir
    { to: '/users', icon: Users, label: 'Kullanıcılar', pageId: null }, // Kullanıcılar sayfası varsa eklenebilir
    { to: '/settings', icon: Settings, label: 'Ayarlar', pageId: null }, // Ayarlar her zaman erişilebilir
  ]

  // İzin kontrolü ile filtrele
  const navItems = allNavItems.filter((item) => {
    if (!item.pageId) return true // pageId yoksa her zaman göster
    return hasPermission(item.pageId)
  })

  return (
    <aside className="fixed top-0 left-0 z-40 w-12 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 lg:translate-x-0">
      <div className="h-full px-1 pb-4 overflow-y-auto bg-white">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4 pb-4 border-b border-gray-200">
          <img src="/img/logo.png" alt="Chronis Logo" className="w-10 h-10" />
        </div>
        
        <ul className="space-y-1 font-medium">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-center p-2 rounded group transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar

