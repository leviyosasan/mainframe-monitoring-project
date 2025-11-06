import { Home, Settings, Monitor, Zap, Database, BarChart3, Mail, Globe, HardDrive, Terminal, FileText, Server, AlertTriangle, Mailbox, ChevronLeft, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

const Navbar = ({ isExpanded, setIsExpanded }) => {
  const [isDbOpen, setIsDbOpen] = useState(false)

  useEffect(() => {
    // Sidebar durum değiştiğinde alt menüyü kapat
    setIsDbOpen(false)
  }, [isExpanded])

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
    <aside className={`fixed top-0 left-0 z-40 h-screen bg-gray-900 border-r border-gray-700 shadow-lg transition-all duration-300 ${isExpanded ? 'w-56' : 'w-16'}`}>
      <div className="h-full flex flex-col">
        {/* Logo Section */}
        <div className="px-2 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/img/logo.png" alt="Chronis Logo" className="w-10 h-10 rounded-lg shadow-lg flex-shrink-0" />
              {isExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-white font-bold text-sm whitespace-nowrap">Chronis</h1>
                  <p className="text-gray-400 text-xs whitespace-nowrap">Monitoring</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <div className="px-2 py-2 border-b border-gray-700">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            title={isExpanded ? 'Daralt' : 'Genişlet'}
          >
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center ${isExpanded ? 'justify-start px-4 space-x-3' : 'justify-center'} p-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                  title={!isExpanded ? item.label : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="px-1 py-3 border-t border-gray-700 space-y-2">
          {/* Databases Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsDbOpen((p) => !p)}
              className={`w-full flex items-center ${isExpanded ? 'justify-start px-4 space-x-3' : 'justify-center'} p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors`}
              title={!isExpanded ? 'Databases' : ''}
            >
              <Database className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="text-sm font-medium whitespace-nowrap">Databases</span>}
              {isExpanded && <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isDbOpen ? 'rotate-90' : ''}`} />}
            </button>

            {/* Expanded: inline submenu (click to open) */}
            {isExpanded && (
              <div className={`mt-1 pl-2 space-y-1 overflow-hidden transition-all duration-200 ${isDbOpen ? 'max-h-48 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'}`}>
                <NavLink
                  to="/databases"
                  className={({ isActive }) =>
                    `w-full flex items-center justify-start px-6 space-x-3 p-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Server className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">Tüm DB'ler</span>
                </NavLink>
                <NavLink
                  to="/postgresql"
                  className={({ isActive }) =>
                    `w-full flex items-center justify-start px-6 space-x-3 p-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Server className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">PostgreSQL</span>
                </NavLink>
                <NavLink
                  to="/mssql"
                  className={({ isActive }) =>
                    `w-full flex items-center justify-start px-6 space-x-3 p-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Server className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">MSSQL</span>
                </NavLink>
              </div>
            )}

            {/* Collapsed: flyout submenu (click to open) */}
            {!isExpanded && (
              <div className={`absolute left-full top-0 ml-2 bg-gray-900 border border-gray-700 rounded-lg p-2 w-44 shadow-xl transition-all duration-200 origin-left ${isDbOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <NavLink
                  to="/databases"
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-2 rounded-md transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Server className="w-4 h-4" />
                  <span className="text-sm">Tüm DB'ler</span>
                </NavLink>
                <NavLink
                  to="/postgresql"
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-2 rounded-md transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Server className="w-4 h-4" />
                  <span className="text-sm">PostgreSQL</span>
                </NavLink>
                <NavLink
                  to="/mssql"
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-2 rounded-md transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Server className="w-4 h-4" />
                  <span className="text-sm">MSSQL</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* SMTP */}
          <NavLink
            to="/smtp"
            className={({ isActive }) =>
              `w-full flex items-center ${isExpanded ? 'justify-start px-4 space-x-3' : 'justify-center'} p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            title={!isExpanded ? 'SMTP' : ''}
          >
            <Mailbox className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium whitespace-nowrap">SMTP</span>}
          </NavLink>
          
          {/* Uyarılar */}
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `w-full flex items-center ${isExpanded ? 'justify-start px-4 space-x-3' : 'justify-center'} p-2 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            title={!isExpanded ? 'Uyarılar (3)' : ''}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium whitespace-nowrap">Uyarılar</span>}
            {/* Uyarı Badge */}
            <span className={`${isExpanded ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
              3
            </span>
          </NavLink>
          
          {/* Ayarlar */}
          <button 
            className={`w-full flex items-center ${isExpanded ? 'justify-start px-4 space-x-3' : 'justify-center'} p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-all duration-200`}
            title={!isExpanded ? 'Ayarlar' : ''}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium whitespace-nowrap">Ayarlar</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Navbar

