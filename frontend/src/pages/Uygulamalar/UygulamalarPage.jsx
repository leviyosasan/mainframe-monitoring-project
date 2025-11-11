import { useNavigate } from 'react-router-dom'
import { TrendingUp, Sliders, Database, Mailbox, AlertTriangle, ArrowRight } from 'lucide-react'

const UygulamalarPage = () => {
  const navigate = useNavigate()

  const applications = [
    {
      id: 'analiz',
      title: 'Chronalyze',
      description: 'Analiz ve raporlama uygulaması',
      icon: TrendingUp,
      path: '/analiz',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
    },
    {
      id: 'ozellestir',
      title: 'Chronizer',
      description: 'Özelleştirme ve konfigürasyon',
      icon: Sliders,
      path: '/ozellestir',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
    },
    {
      id: 'databases',
      title: 'Databases',
      description: 'Veritabanı yönetim ve izleme',
      icon: Database,
      path: '/databases',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverColor: 'hover:bg-indigo-100',
    },
    {
      id: 'smtp',
      title: 'SMTP',
      description: 'E-posta sunucu yönetimi',
      icon: Mailbox,
      path: '/smtp',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
    },
    {
      id: 'alerts',
      title: 'Uyarılar',
      description: 'Sistem uyarıları ve bildirimler',
      icon: AlertTriangle,
      path: '/alerts',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverColor: 'hover:bg-red-100',
      badge: 3,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Uygulamalar</h1>
        <p className="text-gray-600 mt-1">Tüm uygulamalara erişim sağlayın</p>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((app) => {
          const IconComponent = app.icon
          return (
            <div
              key={app.id}
              onClick={() => navigate(app.path)}
              className={`relative group cursor-pointer ${app.bgColor} ${app.borderColor} border-2 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${app.hoverColor}`}
            >
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${app.color} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  {app.badge && (
                    <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {app.badge}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {app.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {app.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Uygulamaya Git</span>
                  <div className={`w-7 h-7 bg-gradient-to-br ${app.color} rounded-full flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform duration-300`}>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UygulamalarPage

