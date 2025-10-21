import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Cpu, Database, Zap, BarChart3, Mail, Globe, HardDrive, Terminal, FileText, Server, AlertTriangle, Mailbox } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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

  // Sayfa içindeki kartlar
  const pageCards = {
    'zos': [
      { id: 'cpu', title: 'CPU', icon: Cpu, description: 'CPU performans ve kullanım', keywords: ['cpu', 'işlemci', 'performans', 'busy', 'utilization'] },
      { id: 'addressSpace', title: 'Address Space', icon: Database, description: 'Adres Alanı Yönetimi', keywords: ['address', 'space', 'adres', 'alan'] },
      { id: 'spool', title: 'Spool', icon: FileText, description: 'İş Kuyruğu Yönetimi', keywords: ['spool', 'kuyruk', 'iş', 'job'] }
    ],
    'cics': [
      { id: 'transactions', title: 'Transactions', icon: Zap, description: 'CICS İşlem Yönetimi', keywords: ['transaction', 'işlem', 'cics'] },
      { id: 'programs', title: 'Programs', icon: FileText, description: 'Program Yönetimi', keywords: ['program', 'programlar'] },
      { id: 'resources', title: 'Resources', icon: Database, description: 'Kaynak Yönetimi', keywords: ['resource', 'kaynak'] }
    ],
    'db2': [
      { id: 'databases', title: 'Databases', icon: Database, description: 'Veritabanı Yönetimi', keywords: ['database', 'veritabanı', 'db2'] },
      { id: 'tables', title: 'Tables', icon: BarChart3, description: 'Tablo Yönetimi', keywords: ['table', 'tablo'] },
      { id: 'connections', title: 'Connections', icon: Globe, description: 'Bağlantı Yönetimi', keywords: ['connection', 'bağlantı'] }
    ],
    'ims': [
      { id: 'databases', title: 'Databases', icon: Database, description: 'IMS Veritabanı Yönetimi', keywords: ['database', 'veritabanı', 'ims'] },
      { id: 'transactions', title: 'Transactions', icon: Zap, description: 'IMS İşlem Yönetimi', keywords: ['transaction', 'işlem'] },
      { id: 'regions', title: 'Regions', icon: Server, description: 'Bölge Yönetimi', keywords: ['region', 'bölge'] }
    ],
    'mq': [
      { id: 'queues', title: 'Queues', icon: Mail, description: 'Kuyruk Yönetimi', keywords: ['queue', 'kuyruk', 'mq'] },
      { id: 'channels', title: 'Channels', icon: Globe, description: 'Kanal Yönetimi', keywords: ['channel', 'kanal'] },
      { id: 'messages', title: 'Messages', icon: FileText, description: 'Mesaj Yönetimi', keywords: ['message', 'mesaj'] }
    ],
    'network': [
      { id: 'stacks', title: 'STACKS', icon: Server, description: 'Genel STACK Bilgileri', keywords: ['stacks', 'stack', 'genel', 'bilgi'] },
      { id: 'stackcpu', title: 'STACKCPU', icon: Cpu, description: 'CPU ve Paket İstatistikleri', keywords: ['stackcpu', 'cpu', 'paket', 'istatistik'] },
      { id: 'vtamcsa', title: 'VTAMCSA', icon: Database, description: 'VTAM ve CSA Yönetimi', keywords: ['vtamcsa', 'vtam', 'csa', 'yönetim'] },
      { id: 'tcpconf', title: 'TCPCONF', icon: Globe, description: 'TCP/IP Yapılandırma', keywords: ['tcpconf', 'tcp', 'ip', 'yapılandırma', 'config'] },
      { id: 'tcpcons', title: 'TCPCONS', icon: Zap, description: 'TCP/IP Bağlantı Durumu', keywords: ['tcpcons', 'tcp', 'bağlantı', 'durum', 'connection'] },
      { id: 'udfconf', title: 'UDFCONF', icon: AlertTriangle, description: 'UDP Yapılandırma', keywords: ['udfconf', 'udp', 'yapılandırma', 'config'] },
      { id: 'actcons', title: 'ACTCONS', icon: Server, description: 'Aktif Bağlantı Durumu', keywords: ['actcons', 'aktif', 'bağlantı', 'durum'] },
      { id: 'vtmbuff', title: 'VTMBUFF', icon: BarChart3, description: 'VTAM Buffer İstatistikleri', keywords: ['vtmbuff', 'vtam', 'buffer', 'istatistik'] },
      { id: 'connsrpz', title: 'CONNSRPZ', icon: Globe, description: 'Connection Hızı ve Durumu', keywords: ['connsrpz', 'connection', 'hız', 'durum', 'speed'] },
      { id: 'tcpstor', title: 'TCPSTOR', icon: HardDrive, description: 'TCP Storage Yönetimi', keywords: ['tcpstor', 'tcp', 'storage', 'depolama', 'yönetim'] }
    ],
    'storage': [
      { id: 'volumes', title: 'Volumes', icon: HardDrive, description: 'Depolama Birimleri', keywords: ['volume', 'depolama', 'storage'] },
      { id: 'datasets', title: 'Datasets', icon: Database, description: 'Veri Setleri', keywords: ['dataset', 'veri', 'set'] },
      { id: 'backup', title: 'Backup', icon: FileText, description: 'Yedekleme Yönetimi', keywords: ['backup', 'yedek'] }
    ],
    'uss': [
      { id: 'files', title: 'Files', icon: FileText, description: 'Dosya Yönetimi', keywords: ['file', 'dosya', 'uss'] },
      { id: 'processes', title: 'Processes', icon: Terminal, description: 'İşlem Yönetimi', keywords: ['process', 'işlem'] },
      { id: 'users', title: 'Users', icon: Server, description: 'Kullanıcı Yönetimi', keywords: ['user', 'kullanıcı'] }
    ],
    'rmf': [
      { id: 'reports', title: 'Reports', icon: FileText, description: 'RMF Raporları', keywords: ['report', 'rapor', 'rmf'] },
      { id: 'performance', title: 'Performance', icon: BarChart3, description: 'Performans Analizi', keywords: ['performance', 'performans'] },
      { id: 'monitoring', title: 'Monitoring', icon: AlertTriangle, description: 'İzleme Yönetimi', keywords: ['monitoring', 'izleme'] }
    ]
  };

  // Arama fonksiyonu
  const searchResults = () => {
    if (!searchTerm.trim()) return { pages: [], cards: [] };

    const term = searchTerm.toLowerCase();
    const results = { pages: [], cards: [] };

    // Sayfaları ara
    mainviewCards.forEach(page => {
      if (page.title.toLowerCase().includes(term)) {
        results.pages.push(page);
      }
    });

    // Sayfa içindeki kartları ara
    Object.entries(pageCards).forEach(([pageId, cards]) => {
      cards.forEach(card => {
        const matchesTitle = card.title.toLowerCase().includes(term);
        const matchesDescription = card.description.toLowerCase().includes(term);
        const matchesKeywords = card.keywords.some(keyword => keyword.includes(term));
        
        if (matchesTitle || matchesDescription || matchesKeywords) {
          const pageInfo = mainviewCards.find(p => p.id === pageId);
          results.cards.push({
            ...card,
            pageId,
            pageTitle: pageInfo?.title || pageId,
            pagePath: pageInfo?.path || `/${pageId}`
          });
        }
      });
    });

    return results;
  };

  const results = searchResults();
  const hasResults = results.pages.length > 0 || results.cards.length > 0;

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
                placeholder="Sistem ara... (örn: cpu, database, network, ağ)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                className="px-3 py-1.5 w-64 focus:outline-none rounded-lg text-sm"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                  setShowSearchResults(false);
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
          
          {/* Arama Sonuçları Dropdown */}
          {showSearchResults && searchTerm && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
              {hasResults ? (
                <div className="p-4">
                  {/* Sayfalar */}
                  {results.pages.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Server className="w-4 h-4 mr-2" />
                        Sayfalar ({results.pages.length})
                      </h3>
                      <div className="space-y-1">
                        {results.pages.map((page) => (
                          <button
                            key={page.id}
                            onClick={() => {
                              navigate(page.path);
                              setShowSearchResults(false);
                              setIsSearchOpen(false);
                              setSearchTerm('');
                            }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                          >
                            <span className="text-lg mr-3">{page.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{page.title}</div>
                              <div className="text-sm text-gray-500">Sistem sayfası</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sayfa İçindeki Kartlar */}
                  {results.cards.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Cpu className="w-4 h-4 mr-2" />
                        Kartlar ({results.cards.length})
                      </h3>
                      <div className="space-y-1">
                        {results.cards.map((card, index) => (
                          <button
                            key={`${card.pageId}-${card.id}-${index}`}
                            onClick={() => {
                              navigate(card.pagePath);
                              setShowSearchResults(false);
                              setIsSearchOpen(false);
                              setSearchTerm('');
                            }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                          >
                            <card.icon className="w-4 h-4 text-gray-600 mr-3" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{card.title}</div>
                              <div className="text-sm text-gray-500">{card.description}</div>
                              <div className="text-xs text-blue-600 mt-1">→ {card.pageTitle}</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">"{searchTerm}" için sonuç bulunamadı</p>
                  <p className="text-xs mt-1">Farklı anahtar kelimeler deneyin</p>
                </div>
              )}
            </div>
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

