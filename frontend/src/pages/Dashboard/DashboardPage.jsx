import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Cpu, Database, Zap, BarChart3, Mail, Globe, HardDrive, Terminal, FileText, Server, AlertTriangle, Mailbox } from 'lucide-react';
import { useUserPermissions } from '../../hooks/useUserPermissions';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { hasPermission, isLoading: permissionsLoading } = useUserPermissions();

  // Admin tarafından oluşturulan kartları yükle
  const [mainviewCards, setMainviewCards] = useState(() => {
    const saved = localStorage.getItem('dashboard-cards')
    if (saved) {
      const cards = JSON.parse(saved)
      // Her karta görsel özellikleri ekle
      return cards.map(card => ({
        ...card,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        hoverColor: 'hover:bg-slate-100',
        textColor: 'text-slate-800',
        iconBg: 'bg-slate-200'
      }))
    }

    // Varsayılan kartlar
    return [
      { 
        id: 'zos', 
        title: 'z/OS', 
        icon: '🖥️', 
        path: '/zos', 
        visible: true,
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
        visible: true,
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
        visible: true,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        hoverColor: 'hover:bg-slate-100',
        textColor: 'text-slate-800',
        iconBg: 'bg-slate-200'
      },
      { 
        id: 'mq', 
        title: 'MQ', 
        icon: '📊', 
        path: '/mq', 
        visible: true,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        hoverColor: 'hover:bg-slate-100',
        textColor: 'text-slate-800',
        iconBg: 'bg-slate-200'
      },
      { 
        id: 'tso', 
        title: 'TSO', 
        icon: '📨', 
        path: '/tso', 
        visible: true,
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
        visible: true,
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
        visible: true,
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
        visible: true,
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
        visible: true,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        hoverColor: 'hover:bg-slate-100',
        textColor: 'text-slate-800',
        iconBg: 'bg-slate-200'
      },
    ]
  })

  // localStorage değişikliklerini dinle (admin değişikliklerini canlı görmek için)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('dashboard-cards')
      if (saved) {
        const cards = JSON.parse(saved)
        setMainviewCards(cards.map(card => ({
          ...card,
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          hoverColor: 'hover:bg-slate-100',
          textColor: 'text-slate-800',
          iconBg: 'bg-slate-200'
        })))
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Aynı tab'de değişiklikler için interval kontrolü
    const interval = setInterval(() => {
      handleStorageChange()
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, []);

  // Sayfa içindeki kartlar (arama için)
  const pageCards = {
    zos: [
      { id: 'cpu', title: 'CPU Kullanımı', icon: Cpu, description: 'İşlemci kullanım oranları', keywords: ['cpu', 'işlemci', 'processor', 'usage'] },
      { id: 'memory', title: 'Bellek Kullanımı', icon: Database, description: 'Bellek istatistikleri', keywords: ['memory', 'bellek', 'ram'] },
    ],
    cics: [
      { id: 'transactions', title: 'İşlemler', icon: Zap, description: 'CICS işlem istatistikleri', keywords: ['transaction', 'işlem', 'cics'] },
      { id: 'performance', title: 'Performans', icon: BarChart3, description: 'CICS performans metrikleri', keywords: ['performance', 'performans', 'metrics'] },
    ],
    db2: [
      { id: 'queries', title: 'Sorgular', icon: Database, description: 'Veritabanı sorgu istatistikleri', keywords: ['query', 'sorgu', 'database', 'veritabanı'] },
      { id: 'connections', title: 'Bağlantılar', icon: Globe, description: 'Aktif bağlantılar', keywords: ['connection', 'bağlantı', 'active'] },
    ],
    mq: [
      { id: 'queues', title: 'Kuyruklar', icon: BarChart3, description: 'MQ kuyruk durumları', keywords: ['queue', 'kuyruk', 'mq'] },
      { id: 'messages', title: 'Mesajlar', icon: Mail, description: 'Mesaj istatistikleri', keywords: ['message', 'mesaj', 'msg'] },
    ],
    network: [
      { id: 'bandwidth', title: 'Bant Genişliği', icon: Globe, description: 'Ağ trafiği', keywords: ['bandwidth', 'network', 'ağ', 'trafik', 'traffic'] },
      { id: 'connections-net', title: 'Bağlantılar', icon: Globe, description: 'Aktif ağ bağlantıları', keywords: ['connection', 'bağlantı', 'network', 'ağ'] },
    ],
    storage: [
      { id: 'disk', title: 'Disk Kullanımı', icon: HardDrive, description: 'Disk alanı istatistikleri', keywords: ['disk', 'storage', 'depolama', 'alan', 'space'] },
      { id: 'io', title: 'I/O İstatistikleri', icon: BarChart3, description: 'Giriş/Çıkış metrikleri', keywords: ['io', 'input', 'output', 'giriş', 'çıkış'] },
    ],
    uss: [
      { id: 'processes', title: 'Süreçler', icon: Terminal, description: 'USS süreç listesi', keywords: ['process', 'süreç', 'uss'] },
      { id: 'files', title: 'Dosyalar', icon: FileText, description: 'Dosya sistemi durumu', keywords: ['file', 'dosya', 'filesystem'] },
    ],
    rmf: [
      { id: 'reports', title: 'Raporlar', icon: FileText, description: 'RMF raporları', keywords: ['report', 'rapor', 'rmf'] },
      { id: 'metrics', title: 'Metrikler', icon: BarChart3, description: 'Sistem metrikleri', keywords: ['metric', 'metrik', 'statistics', 'istatistik'] },
    ],
  };

  // Arama fonksiyonu
  const searchResults = () => {
    if (!searchTerm.trim()) return { pages: [], cards: [] };

    const term = searchTerm.toLowerCase();
    const results = { pages: [], cards: [] };

    // Sayfaları ara (sadece görünür ve izinli olanları)
    mainviewCards.forEach(page => {
      const pageId = page.path?.replace('/', '') || page.id;
      if (
        page.title.toLowerCase().includes(term) && 
        page.visible !== false &&
        hasPermission(pageId)
      ) {
        results.pages.push(page);
      }
    });

    // Sayfa içindeki kartları ara (sadece görünür ve izinli sayfaların kartlarını)
    Object.entries(pageCards).forEach(([pageId, cards]) => {
      // Sayfa görünür değilse veya izin yoksa kartlarını da gösterme
      const page = mainviewCards.find(p => p.id === pageId)
      if (page && page.visible === false) return;
      if (!hasPermission(pageId)) return;

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

  // Filter cards based on search term, admin visibility settings, and user permissions
  const filteredCards = useMemo(() => {
    if (permissionsLoading) return [];
    
    return mainviewCards.filter(card => {
      // Admin görünürlük kontrolü
      if (card.visible === false) return false;
      
      // Arama filtresi
      if (searchTerm && !card.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // İzin kontrolü - path'den pageId çıkar
      const pageId = card.path?.replace('/', '') || card.id;
      if (!hasPermission(pageId)) {
        return false;
      }
      
      return true;
    });
  }, [mainviewCards, searchTerm, hasPermission, permissionsLoading]);

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

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
      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Server className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Erişilebilir Sayfa Bulunamadı</h3>
          <p className="text-gray-500 text-center max-w-md">
            {searchTerm 
              ? 'Arama kriterlerinize uygun sayfa bulunamadı.' 
              : 'Henüz size erişim izni verilmiş sayfa bulunmuyor. Lütfen yöneticinizle iletişime geçin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="relative group cursor-pointer"
              onClick={() => navigate(card.path)}
            >
              {/* Card Container */}
              <div className={`relative ${card.bgColor} ${card.borderColor} border-2 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${card.hoverColor}`}>
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-50 rounded-xl`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 ${card.iconBg} rounded-full animate-pulse`}></div>
                      <div className={`w-1.5 h-1.5 ${card.iconBg} rounded-full opacity-70`}></div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-3 ${card.textColor}`}>
                    {card.title}
                  </h3>

                  {/* Status */}
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-600">Çevrimiçi</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Sisteme Giriş</span>
                    <div className={`w-7 h-7 ${card.iconBg} rounded-full flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform duration-300`}>
                      <svg
                        className="w-4 h-4 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage
