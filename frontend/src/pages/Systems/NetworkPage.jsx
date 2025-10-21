import React, { useState } from 'react';

const NetworkPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [infoModal, setInfoModal] = useState(null);

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table');
    // Basit yapıda veri çekme işlemi yok
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
    setSelectedChart(null);
  };

  const openChart = (chartType) => {
    setSelectedChart(chartType);
    setChartTab('chart');
  };

  const closeChart = () => {
    setSelectedChart(null);
    setChartTab('chart');
  };

  const openInfo = (chartType) => {
    setInfoModal(chartType);
  };

  const closeInfo = () => {
    setInfoModal(null);
  };

  const tabs = [
    { id: 'table', name: 'Tablo', icon: '📊' },
    { id: 'chart', name: 'Grafik', icon: '📈' },
    { id: 'threshold', name: 'Threshold', icon: '⚙️' }
  ];

    // Aktif moda göre renk belirleme (Örnek)
    const getModalColor = (modal = activeModal) => {
        switch(modal) {
            case 'STACKCPU': return 'green';
            case 'vtamcsa': return 'purple';
            case 'tcpconf': return 'indigo';
            case 'tcpcons': return 'teal';
            case 'udfconf': return 'amber';
            case 'actcons': return 'rose';
            case 'VTMBUFF': return 'red';
            case 'connsrpz': return 'pink';
            case 'tcpstor': return 'sky';
            case 'STACKS':
            default: return 'blue';
        }
    }
    const modalColor = getModalColor();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Network Management
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* STACKS Kartı (Eklendi) */}
          <div onClick={() => openModal('STACKS')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6 mx-auto group-hover:bg-blue-200"><svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h4M8 7a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 01-2 2h-4a2 2 0 01-2-2V7z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a2 2 0 00-2-2h-4a2 2 0 00-2 2v8a2 2 0 002 2h4a2 2 0 002-2V7z"></path></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">STACKS</h2><p className="text-gray-500 text-sm font-medium">Genel STACK Bilgileri</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* STACKCPU Kartı (Eklendi) */}
          <div onClick={() => openModal('STACKCPU')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-6 mx-auto group-hover:bg-green-200"><svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">STACKCPU</h2><p className="text-gray-500 text-sm font-medium">CPU ve Paket İstatistikleri</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* VTAMCSA Kartı (Eklendi) */}
          <div onClick={() => openModal('vtamcsa')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6 mx-auto group-hover:bg-purple-200"><svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">VTAMCSA</h2><p className="text-gray-500 text-sm font-medium">VTAM ve CSA Yönetimi</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* TCPCONF Kartı */}
          <div onClick={() => openModal('tcpconf')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-6 mx-auto group-hover:bg-indigo-200"><svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">TCPCONF</h2><p className="text-gray-500 text-sm font-medium">TCP/IP Yapılandırma</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* TCPCONS Kartı */}
          <div onClick={() => openModal('tcpcons')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-teal-100 rounded-xl mb-6 mx-auto group-hover:bg-teal-200"><svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">TCPCONS</h2><p className="text-gray-500 text-sm font-medium">TCP/IP Bağlantı Durumu</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* UDFCONF Kartı */}
          <div onClick={() => openModal('udfconf')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-amber-100 rounded-xl mb-6 mx-auto group-hover:bg-amber-200"><svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">UDFCONF</h2><p className="text-gray-500 text-sm font-medium">UDP Yapılandırma</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* ACTCONS Kartı */}
          <div onClick={() => openModal('actcons')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-rose-100 rounded-xl mb-6 mx-auto group-hover:bg-rose-200"><svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">ACTCONS</h2><p className="text-gray-500 text-sm font-medium">Aktif Bağlantı Durumu</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* VTMBUFF Kartı */}
          <div onClick={() => openModal('VTMBUFF')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-6 mx-auto group-hover:bg-red-200"><svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h-4m-2 0H7" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">VTMBUFF</h2><p className="text-gray-500 text-sm font-medium">VTAM Buffer İstatistikleri</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* CONNSRPZ Kartı */}
          <div onClick={() => openModal('connsrpz')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-pink-100 rounded-xl mb-6 mx-auto group-hover:bg-pink-200"><svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M12 20.005v-5.292a4 4 0 00-4-4h-2M18 15.713a4 4 0 00-4-4h-2" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">CONNSRPZ</h2><p className="text-gray-500 text-sm font-medium">Connection Hızı ve Durumu</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* TCPSTOR Kartı */}
          <div onClick={() => openModal('tcpstor')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-sky-100 rounded-xl mb-6 mx-auto group-hover:bg-sky-200"><svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">TCPSTOR</h2><p className="text-gray-500 text-sm font-medium">TCP Storage Yönetimi</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>
        </div>

        {/* --- MODALLAR --- */}

        {/* Ana Modal (Tüm tipler için, basit yapı) */}
        {activeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header (Dinamik) */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'STACKS' && 'STACKS Yönetimi'}
                    {activeModal === 'STACKCPU' && 'STACKCPU Yönetimi'}
                    {activeModal === 'vtamcsa' && 'VTAMCSA Yönetimi'}
                    {activeModal === 'tcpconf' && 'TCPCONF Yönetimi'}
                    {activeModal === 'tcpcons' && 'TCPCONS Yönetimi'}
                    {activeModal === 'udfconf' && 'UDFCONF Yönetimi'}
                    {activeModal === 'actcons' && 'ACTCONS Yönetimi'}
                    {activeModal === 'VTMBUFF' && 'VTAM Buffer Yönetimi'}
                    {activeModal === 'connsrpz' && 'Connection RPZ Yönetimi'}
                    {activeModal === 'tcpstor' && 'TCP Storage Yönetimi'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                {/* Sekmeler (Dinamik Renk) */}
                <div className="border-b border-gray-200 mb-6">
                   <nav className="-mb-px flex space-x-8">
                     {tabs.map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === tab.id
                              ? `border-${modalColor}-500 text-${modalColor}-600` // Dinamik renk
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                           }`}
                        >
                           <span className="mr-2">{tab.icon}</span>{tab.name}
                        </button>
                     ))}
                  </nav>
                </div>

                {/* Sekme İçerikleri */}
                <div className="min-h-[400px]">
                  {/* Tablo Sekmesi (Basit Placeholder) */}
                  {activeTab === 'table' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-gray-800">Veri Tablosu</h4>
                        {/* Yenile butonu kaldırıldı, gerekirse eklenebilir */}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <p className="text-gray-600 text-lg">Tablo verileri buraya eklenecek</p>
                        <p className="text-gray-500 text-sm mt-2">{activeModal} verileri</p>
                      </div>
                    </div>
                  )}

                  {/* Grafik Sekmesi (Basit Placeholder, TCPCONF için örnek kartlar) */}
                  {activeTab === 'chart' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Performans Grafikleri</h4>

                      {/* TCPCONF için Örnek Kartlar */}
                      {activeModal === 'tcpconf' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Connection Count */}
                          <div onClick={() => openChart('connectionCount')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('connectionCount'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Connection Count</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Active Connections */}
                          <div onClick={() => openChart('activeConnections')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('activeConnections'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Active Connections</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Network Throughput */}
                          <div onClick={() => openChart('networkThroughput')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('networkThroughput'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Network Throughput</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                           {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6"> <div className="text-center"> <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"> <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> </div> <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5> </div> </div>
                        </div>
                      )}

                      {/* ACTCONS için Örnek Kartlar */}
                      {activeModal === 'actcons' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Session Count */}
                          <div onClick={() => openChart('sessionCount')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('sessionCount'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Session Count</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Active Sessions */}
                          <div onClick={() => openChart('activeSessions')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('activeSessions'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Active Sessions</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Session Utilization */}
                          <div onClick={() => openChart('sessionUtilization')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('sessionUtilization'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Session Utilization</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                           {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6"> <div className="text-center"> <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"> <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> </div> <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5> </div> </div>
                        </div>
                      )}

                      {/* Diğer modal tipleri için placeholder */}
                      {activeModal !== 'tcpconf' && activeModal !== 'actcons' && (
                           <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <div className="text-4xl mb-4">📈</div>
                            <p className="text-gray-600 text-lg">Grafik kartları buraya eklenecek</p>
                            <p className="text-gray-500 text-sm mt-2">{activeModal} grafikleri</p>
                          </div>
                      )}
                    </div>
                  )}

                  {/* Threshold Sekmesi (Basit Placeholder) */}
                  {activeTab === 'threshold' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Threshold Ayarları</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Kritik Eşik</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="90"/></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Uyarı Eşiği</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="75"/></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5>
                          <div className="space-y-3">
                            <label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked /><span className="text-sm text-gray-600">E-posta bildirimi</span></label>
                            <label className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm text-gray-600">SMS bildirimi</span></label>
                            <label className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm text-gray-600">Sistem bildirimi</span></label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button>
                        <button className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700`}>Kaydet</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grafik Detay Modalı (Basit Placeholder, TCPCONF için örnek) */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {/* TCPCONF Örnekleri */}
                    {selectedChart === 'connectionCount' && 'Connection Count Grafiği'}
                    {selectedChart === 'activeConnections' && 'Active Connections Grafiği'}
                    {selectedChart === 'networkThroughput' && 'Network Throughput Grafiği'}
                    {/* ACTCONS Örnekleri */}
                    {selectedChart === 'sessionCount' && 'Session Count Grafiği'}
                    {selectedChart === 'activeSessions' && 'Active Sessions Grafiği'}
                    {selectedChart === 'sessionUtilization' && 'Session Utilization Grafiği'}
                    {/* Diğer chart tipleri için başlıklar eklenebilir */}
                    {!['connectionCount', 'activeConnections', 'networkThroughput', 'sessionCount', 'activeSessions', 'sessionUtilization'].includes(selectedChart) && `${selectedChart} Grafiği`}
                  </h3>
                  <button onClick={closeChart} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                 <div className="border-b border-gray-200 mb-6">
                   <nav className="-mb-px flex space-x-8">
                      <button onClick={() => setChartTab('chart')} className={`py-2 px-1 border-b-2 font-medium text-sm ${ chartTab === 'chart' ? `border-${modalColor}-500 text-${modalColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}><span className="mr-2">📈</span>Grafik</button>
                      <button onClick={() => setChartTab('threshold')} className={`py-2 px-1 border-b-2 font-medium text-sm ${ chartTab === 'threshold' ? `border-${modalColor}-500 text-${modalColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}><span className="mr-2">⚙️</span>Threshold</button>
                   </nav>
                 </div>
                <div className="min-h-[400px]">
                  {chartTab === 'chart' && ( <div className="bg-gray-50 rounded-lg p-8 text-center"><div className="text-6xl mb-4">📊</div><p className="text-gray-600 text-lg mb-2">{selectedChart} detaylı grafiği buraya eklenecek</p><p className="text-gray-500 text-sm">Grafik bileşeni entegrasyonu gerekli</p></div> )}
                  {chartTab === 'threshold' && ( <div className="space-y-6"><h4 className="text-lg font-semibold text-gray-800">{selectedChart} için Threshold Ayarları</h4> {/* Basit Threshold içeriği */} <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gray-50 rounded-lg p-6"><h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Kritik Eşik</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="90"/></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Uyarı Eşiği</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="75"/></div></div></div><div className="bg-gray-50 rounded-lg p-6"><h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5><div className="space-y-3"><label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked /><span className="text-sm text-gray-600">E-posta</span></label><label className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm text-gray-600">SMS</span></label></div></div></div><div className="flex justify-end space-x-3 mt-6"><button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button><button className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700`}>Kaydet</button></div></div> )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Modalı (Basit Placeholder, TCPCONF için örnek) */}
        {infoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                     {infoModal === 'connectionCount' && 'Connection Count Hakkında'}
                     {infoModal === 'activeConnections' && 'Active Connections Hakkında'}
                     {infoModal === 'networkThroughput' && 'Network Throughput Hakkında'}
                     {infoModal === 'sessionCount' && 'Session Count Hakkında'}
                     {infoModal === 'activeSessions' && 'Active Sessions Hakkında'}
                     {infoModal === 'sessionUtilization' && 'Session Utilization Hakkında'}
                     {!['connectionCount', 'activeConnections', 'networkThroughput', 'sessionCount', 'activeSessions', 'sessionUtilization'].includes(infoModal) && `${infoModal} Hakkında`}
                  </h3>
                  <button onClick={closeInfo} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="space-y-6">
                    {/* Placeholder Info */}
                    <div className={`bg-${modalColor}-50 rounded-lg p-4`}>
                      <h4 className={`font-semibold text-${modalColor}-900 mb-2`}>Açıklama</h4>
                      <p className={`text-${modalColor}-800 text-sm`}>
                         {infoModal} metriği ile ilgili detaylı açıklama buraya eklenecektir.
                      </p>
                  </div>
                     {/* Gerekirse Normal Değerler vb. eklenebilir */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkPage;