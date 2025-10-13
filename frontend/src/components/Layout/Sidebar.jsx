import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, User } from 'lucide-react'

const Sidebar = () => {
  // Geçici: Login atlandığı için tüm menüleri göster
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'Profil' },
    { to: '/users', icon: Users, label: 'Kullanıcılar' },
    { to: '/settings', icon: Settings, label: 'Ayarlar' },
  ]

  return (
    <aside className="fixed top-0 left-0 z-40 w-12 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 lg:translate-x-0">
      <div className="h-full px-1 pb-4 overflow-y-auto bg-white">
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

