import { Home, Activity, Settings, Monitor, Zap, Database, BarChart3, Mail, Globe, HardDrive, Terminal, FileText, Server, AlertTriangle, Mailbox } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  const menuItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/zos', icon: Monitor, label: 'z/OS' },
    { to: '/cics', icon: Zap, label: 'CICS' },
    { to: '/db2', icon: Database, label: 'DB2' },
    { to: '/ims', icon: BarChart3, label: 'IMS' },
    { to: '/mq', icon: Mail, label: 'MQ' },
    { to: '/network', icon: Globe, label: 'Network' },
    { to: '/storage', icon: HardDrive, label: 'Storage' },
    { to: '/uss', icon: Terminal, label: 'USS' },
    { to: '/rmf', icon: FileText, label: 'RMF' },
  ]

  return (
    <aside className="fixed top-0 left-0 z-40 w-16 h-screen bg-gray-900 border-r border-gray-700 shadow-lg">
      <div className="h-full flex flex-col">
        {/* Logo Section */}
        <div className="px-2 py-4 border-b border-gray-700">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="px-1 py-3 border-t border-gray-700 space-y-2">
          <NavLink
            to="/postgresql"
            className={({ isActive }) =>
              `w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Server className="w-5 h-5" />
          </NavLink>
          
          {/* SMTP */}
          <NavLink
            to="/smtp"
            className={({ isActive }) =>
              `w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Mailbox className="w-5 h-5" />
          </NavLink>
          
          {/* Uyarılar */}
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <AlertTriangle className="w-5 h-5" />
            {/* Uyarı Badge */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              3
            </span>
          </NavLink>
          
          {/* Ayarlar */}
          <button className="w-full flex items-center justify-center p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-all duration-200">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Navbar

