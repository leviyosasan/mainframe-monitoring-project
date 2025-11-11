import { Home, Monitor, Zap, Database, BarChart3, Mail, Globe, HardDrive, Terminal, FileText, AlertTriangle, Mailbox, ChevronLeft, ChevronRight, TrendingUp, Sliders, LogOut, Grid3x3 } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

const Navbar = ({ isExpanded, setIsExpanded }) => {
  const [isAppsOpen, setIsAppsOpen] = useState(false)
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Sidebar durum değiştiğinde alt menüleri kapat
    setIsAppsOpen(false)
  }, [isExpanded])

  const handleLogout = () => {
    logout()
  }

  const menuItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard', iconColor: 'text-blue-400' },
    { to: '/zos', icon: Monitor, label: 'z/OS', iconColor: 'text-cyan-400' },
    { to: '/cics', icon: Zap, label: 'CICS', iconColor: 'text-yellow-400' },
    { to: '/db2', icon: Database, label: 'DB2', iconColor: 'text-indigo-400' },
    { to: '/ims', icon: BarChart3, label: 'IMS', iconColor: 'text-purple-400' },
    { to: '/mq', icon: Mail, label: 'MQ', iconColor: 'text-pink-400' },
    { to: '/network', icon: Globe, label: 'Network', iconColor: 'text-green-400' },
    { to: '/storage', icon: HardDrive, label: 'Storage', iconColor: 'text-orange-400' },
    { to: '/uss', icon: Terminal, label: 'USS', iconColor: 'text-emerald-400' },
    { to: '/rmf', icon: FileText, label: 'CMF', iconColor: 'text-teal-400' },
  ]

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen bg-gray-900 border-r border-gray-700 shadow-lg transition-all duration-300 overflow-hidden ${isExpanded ? 'w-48' : 'w-14'}`}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Logo Section */}
        <div className="px-2 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <img src="/img/logo.png" alt="Chronis Logo" className="w-8 h-8 rounded-lg shadow-lg flex-shrink-0" />
              {isExpanded && (
                <div className="overflow-hidden min-w-0">
                  <h1 className="text-white font-bold text-xs whitespace-nowrap">Chronis</h1>
                  <p className="text-gray-400 text-[10px] whitespace-nowrap">Monitoring</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <div className="px-2 py-1.5 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center p-1.5 text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
            title={isExpanded ? 'Daralt' : 'Genişlet'}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-1 py-2 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              const isActive = location.pathname === item.to
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={`flex items-center ${isExpanded ? 'justify-start px-2.5 space-x-2.5' : 'justify-center'} p-1.5 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={!isExpanded ? item.label : ''}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : item.iconColor}`} />
                    {isExpanded && (
                      <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                    )}
                  </NavLink>
                </li>
              )
            })}
            
            {/* Uygulamalar Dropdown */}
            <li>
              <div className="relative">
                <button 
                  onClick={() => setIsAppsOpen((p) => !p)}
                  className={`w-full flex items-center ${isExpanded ? 'justify-start px-2.5 space-x-2.5' : 'justify-center'} p-1.5 rounded-md transition-all duration-200 text-gray-300 hover:bg-gray-800 hover:text-white`}
                  title={!isExpanded ? 'Uygulamalar' : ''}
                >
                  <Grid3x3 className="w-4 h-4 flex-shrink-0 text-violet-400" />
                  {isExpanded && <span className="text-xs font-medium whitespace-nowrap">Uygulamalar</span>}
                  {isExpanded && <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${isAppsOpen ? 'rotate-90' : ''}`} />}
                </button>

                {/* Expanded: inline submenu (click to open) */}
                {isExpanded && (
                  <div className={`mt-0.5 pl-1.5 space-y-0.5 overflow-hidden transition-all duration-200 ${isAppsOpen ? 'max-h-96 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'}`}>
                    <NavLink
                      to="/uygulamalar"
                      className={({ isActive }) =>
                        `w-full flex items-center justify-start px-4 space-x-2 p-1.5 rounded-md transition-all duration-200 ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <Grid3x3 className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
                      <span className="text-xs font-medium whitespace-nowrap">Tüm Uygulamalar</span>
                    </NavLink>
                    <NavLink
                      to="/analiz"
                      className={({ isActive }) =>
                        `w-full flex items-center justify-start px-4 space-x-2 p-1.5 rounded-md transition-all duration-200 ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                      <span className="text-xs font-medium whitespace-nowrap">Chronalyze</span>
                    </NavLink>
                    <NavLink
                      to="/ozellestir"
                      className={({ isActive }) =>
                        `w-full flex items-center justify-start px-4 space-x-2 p-1.5 rounded-md transition-all duration-200 ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <Sliders className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                      <span className="text-xs font-medium whitespace-nowrap">Chronizer</span>
                    </NavLink>
                    <NavLink
                      to="/databases"
                      className={({ isActive }) =>
                        `w-full flex items-center justify-start px-4 space-x-2 p-1.5 rounded-md transition-all duration-200 ${
                          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <Database className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                      <span className="text-xs font-medium whitespace-nowrap">Databases</span>
                    </NavLink>
                    <NavLink
                      to="/smtp"
                      className={({ isActive }) =>
                        `w-full flex items-center justify-start px-4 space-x-2 p-1.5 rounded-md transition-all duration-200 ${
                          isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <Mailbox className="w-3.5 h-3.5 flex-shrink-0 text-green-400" />
                      <span className="text-xs font-medium whitespace-nowrap">SMTP</span>
                    </NavLink>
                    <NavLink
                      to="/alerts"
                      className={({ isActive }) =>
                        `w-full flex items-center justify-start px-4 space-x-2 p-1.5 rounded-md transition-all duration-200 relative ${
                          isActive ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                      <span className="text-xs font-medium whitespace-nowrap">Uyarılar</span>
                      <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        3
                      </span>
                    </NavLink>
                  </div>
                )}

                {/* Collapsed: flyout submenu (click to open) */}
                {!isExpanded && (
                  <div className={`absolute left-full top-0 ml-2 bg-gray-900 border border-gray-700 rounded-lg p-1.5 w-44 shadow-xl transition-all duration-200 origin-left ${isAppsOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <NavLink
                      to="/uygulamalar"
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Grid3x3 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-violet-400'}`} />
                          <span className="text-xs">Tüm Uygulamalar</span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/analiz"
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <TrendingUp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                          <span className="text-xs">Chronalyze</span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/ozellestir"
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Sliders className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                          <span className="text-xs">Chronizer</span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/databases"
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Database className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                          <span className="text-xs">Databases</span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/smtp"
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                          isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Mailbox className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-green-400'}`} />
                          <span className="text-xs">SMTP</span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/alerts"
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-1.5 rounded-md transition-colors relative ${
                          isActive ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <AlertTriangle className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-red-400'}`} />
                          <span className="text-xs">Uyarılar</span>
                          <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            3
                          </span>
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="px-1 py-2 border-t border-gray-700 space-y-1 flex-shrink-0 overflow-hidden">
          {/* Kullanıcı Bilgisi */}
          <div className={`${isExpanded ? 'px-1.5' : 'px-1'}`}>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `w-full flex items-center ${isExpanded ? 'justify-start px-2 space-x-2' : 'justify-center'} p-1.5 rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
              title={!isExpanded ? 'Profil' : ''}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-white">
                  {user?.firstName?.[0] || ''}
                  {user?.lastName?.[0] || ''}
                </span>
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{user?.firstName} {user?.lastName}</div>
                  <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
                </div>
              )}
            </NavLink>
          </div>

          {/* Çıkış Yap */}
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center ${isExpanded ? 'justify-start px-2.5 space-x-2.5' : 'justify-center'} p-1.5 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-md transition-all duration-200`}
            title={!isExpanded ? 'Çıkış Yap' : ''}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {isExpanded && <span className="text-xs font-medium whitespace-nowrap">Çıkış Yap</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Navbar

