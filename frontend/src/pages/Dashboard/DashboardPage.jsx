import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const mainviewCards = [
    {
      id: 'zos',
      title: 'z/OS',
      icon: '🖥️',
      path: '/zos',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'cics',
      title: 'CICS',
      icon: '⚡',
      path: '/cics',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'db2',
      title: 'DB2',
      icon: '🗄️',
      path: '/db2',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'ims',
      title: 'IMS',
      icon: '📊',
      path: '/ims',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'mq',
      title: 'MQ',
      icon: '📨',
      path: '/mq',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'network',
      title: 'Network',
      icon: '🌐',
      path: '/network',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'storage',
      title: 'Storage',
      icon: '💾',
      path: '/storage',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'uss',
      title: 'USS',
      icon: '🐧',
      path: '/uss',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    },
    {
      id: 'rmf',
      title: 'RMF',
      icon: '📋',
      path: '/rmf',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverColor: 'hover:bg-slate-100',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-200'
    }
  ];

  // Filter cards based on search term
  const filteredCards = mainviewCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 relative">
      {/* Search Bar - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200">
              <Search className="w-4 h-4 text-gray-400 ml-2" />
              <input
                type="text"
                placeholder="Sistem ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 w-48 focus:outline-none rounded-lg text-sm"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                }}
                className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 text-sm">Ara</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="relative group cursor-pointer"
              onClick={() => navigate(card.path)}
            >
              {/* Glassmorphism Card */}
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-7 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/90">
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-20 rounded-xl group-hover:opacity-30 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-2 transition-all duration-500`}>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-1.5 h-1.5 ${card.iconBg} rounded-full group-hover:scale-125 transition-all duration-300`}></div>
                      <div className={`w-1 h-1 ${card.iconBg} rounded-full opacity-60 group-hover:opacity-100 transition-all duration-300`}></div>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-4 ${card.textColor} group-hover:translate-y-[-1px] transition-transform duration-300`}>
                    {card.title}
                  </h3>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center mb-5">
                    <div className={`w-2.5 h-2.5 ${card.iconBg} rounded-full mr-2 group-hover:scale-110 transition-transform duration-300`}></div>
                    <span className={`text-sm font-medium ${card.textColor} opacity-80`}>
                      Sistem Durumu
                    </span>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${card.textColor} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}>
                      Sisteme Eriş
                    </span>
                    <div className={`w-7 h-7 ${card.iconBg} rounded-full flex items-center justify-center group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300`}>
                      <svg 
                        className={`w-3.5 h-3.5 ${card.textColor}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2.5} 
                          d="M13 7l5 5m0 0l-5 5m5-5H6" 
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 ${card.bgColor} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-500`}></div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default DashboardPage

