import React, { useState } from 'react';

const ZOSPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [infoModal, setInfoModal] = useState(null);

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table'); // Her modal açıldığında tablo sekmesine git
    setIsLoading(true);
    // Simüle edilmiş veri yükleme
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
    setSelectedChart(null);
  };

  const openChart = (chartType) => {
    setSelectedChart(chartType);
    setChartTab('chart'); // Her grafik açıldığında grafik sekmesine git
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          z/OS System Management
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CPU Kartı */}
          <div 
            onClick={() => openModal('cpu')}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1"
          >
            <div className="p-8">
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6 mx-auto group-hover:bg-blue-200 transition-colors duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">CPU</h2>
                <p className="text-gray-500 text-sm font-medium">CPU Performans ve Kullanım</p>
                
                {/* Status Indicator */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Space Kartı */}
          <div 
            onClick={() => openModal('addressSpace')}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1"
          >
            <div className="p-8">
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-6 mx-auto group-hover:bg-green-200 transition-colors duration-300">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">Address Space</h2>
                <p className="text-gray-500 text-sm font-medium">Adres Alanı Yönetimi</p>
                
                {/* Status Indicator */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spool Kartı */}
          <div 
            onClick={() => openModal('spool')}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1"
          >
            <div className="p-8">
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6 mx-auto group-hover:bg-purple-200 transition-colors duration-300">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">Spool</h2>
                <p className="text-gray-500 text-sm font-medium">İş Kuyruğu Yönetimi</p>
                
                {/* Status Indicator */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modallar */}
        {activeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'cpu' && 'CPU Performans'}
                    {activeModal === 'addressSpace' && 'Address Space Yönetimi'}
                    {activeModal === 'spool' && 'Spool Yönetimi'}
                  </h3>
                  <button 
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Sekmeler */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Sekme İçerikleri */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                  </div>
                ) : (
                  <div className="min-h-[400px]">
                    {/* Tablo Sekmesi */}
                    {activeTab === 'table' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Veri Tablosu</h4>
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <p className="text-gray-600 text-lg">Tablo verileri buraya eklenecek</p>
                          <p className="text-gray-500 text-sm mt-2">
                            {activeModal === 'cpu' && 'CPU performans verileri'}
                            {activeModal === 'addressSpace' && 'Address Space verileri'}
                            {activeModal === 'spool' && 'Spool işlem verileri'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Grafik Sekmesi */}
                    {activeTab === 'chart' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Performans Grafikleri</h4>
                        
                        {/* CPU Grafik Kartları */}
                        {activeModal === 'cpu' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* CPU Busy */}
                            <div 
                              onClick={() => openChart('cpuBusy')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              {/* Info Icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo('cpuBusy');
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg">CPU Busy%</h5>
                              </div>
                            </div>

                            {/* zIIP Busy */}
                            <div 
                              onClick={() => openChart('ziipBusy')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              {/* Info Icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo('ziipBusy');
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg">zIIP Busy%</h5>
                              </div>
                            </div>

                            {/* CPU Utilization */}
                            <div 
                              onClick={() => openChart('cpuUtilization')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              {/* Info Icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo('cpuUtilization');
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg">CPU Utilization%</h5>
                              </div>
                            </div>

                            {/* I/O Rate */}
                            <div 
                              onClick={() => openChart('ioRate')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              {/* Info Icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo('ioRate');
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg">I/O Rate%</h5>
                              </div>
                            </div>

                            {/* DASD Busy */}
                            <div 
                              onClick={() => openChart('dasdBusy')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              {/* Info Icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo('dasdBusy');
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg">DASD Busy%</h5>
                              </div>
                            </div>

                            {/* Last Update - Tıklanamaz */}
                            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-500 text-lg">Last Update%</h5>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Diğer modaller için varsayılan içerik */}
                        {activeModal !== 'cpu' && (
                          <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <div className="text-6xl mb-4">📈</div>
                            <p className="text-gray-600 text-lg">Grafik bileşeni buraya eklenecek</p>
                            <p className="text-gray-500 text-sm mt-2">
                              {activeModal === 'addressSpace' && 'Address Space kullanım grafikleri'}
                              {activeModal === 'spool' && 'Spool işlem grafikleri'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Threshold Sekmesi */}
                    {activeTab === 'threshold' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Threshold Ayarları</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Kritik Eşik</span>
                                <input 
                                  type="number" 
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  defaultValue="90"
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Uyarı Eşiği</span>
                                <input 
                                  type="number" 
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  defaultValue="75"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5>
                            <div className="space-y-3">
                              <label className="flex items-center">
                                <input type="checkbox" className="mr-2" defaultChecked />
                                <span className="text-sm text-gray-600">E-posta bildirimi</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" className="mr-2" defaultChecked />
                                <span className="text-sm text-gray-600">SMS bildirimi</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" className="mr-2" />
                                <span className="text-sm text-gray-600">Sistem bildirimi</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                            İptal
                          </button>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                            Kaydet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grafik Modalı */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Grafik Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedChart === 'cpuBusy' && 'CPU Busy% Grafiği'}
                    {selectedChart === 'ziipBusy' && 'zIIP Busy% Grafiği'}
                    {selectedChart === 'cpuUtilization' && 'CPU Utilization% Grafiği'}
                    {selectedChart === 'ioRate' && 'I/O Rate% Grafiği'}
                    {selectedChart === 'dasdBusy' && 'DASD Busy% Grafiği'}
                    {selectedChart === 'lastUpdate' && 'Last Update% Grafiği'}
                  </h3>
                  <button 
                    onClick={closeChart}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Grafik Sekmeleri - Tüm kartlar için */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setChartTab('chart')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        chartTab === 'chart'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">📈</span>
                      Grafik
                    </button>
                    <button
                      onClick={() => setChartTab('threshold')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        chartTab === 'threshold'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">⚙️</span>
                      Threshold
                    </button>
                  </nav>
                </div>

                {/* Grafik İçeriği */}
                <div className="min-h-[400px]">
                  {/* Grafik Sekmesi */}
                  {chartTab === 'chart' && (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">📊</div>
                      <p className="text-gray-600 text-lg mb-2">
                        {selectedChart === 'cpuBusy' && 'CPU Busy% detaylı grafiği buraya eklenecek'}
                        {selectedChart === 'ziipBusy' && 'zIIP Busy% detaylı grafiği buraya eklenecek'}
                        {selectedChart === 'cpuUtilization' && 'CPU Utilization% detaylı grafiği buraya eklenecek'}
                        {selectedChart === 'ioRate' && 'I/O Rate% detaylı grafiği buraya eklenecek'}
                        {selectedChart === 'dasdBusy' && 'DASD Busy% detaylı grafiği buraya eklenecek'}
                        {selectedChart === 'lastUpdate' && 'Last Update% detaylı grafiği buraya eklenecek'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Gerçek zamanlı veri görselleştirme bileşeni buraya entegre edilecek
                      </p>
                    </div>
                  )}

                  {/* Threshold Sekmesi */}
                  {chartTab === 'threshold' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {selectedChart === 'cpuBusy' && 'CPU Busy% Threshold Ayarları'}
                        {selectedChart === 'ziipBusy' && 'zIIP Busy% Threshold Ayarları'}
                        {selectedChart === 'cpuUtilization' && 'CPU Utilization% Threshold Ayarları'}
                        {selectedChart === 'ioRate' && 'I/O Rate% Threshold Ayarları'}
                        {selectedChart === 'dasdBusy' && 'DASD Busy% Threshold Ayarları'}
                        {selectedChart === 'lastUpdate' && 'Last Update% Threshold Ayarları'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Kritik Eşik (%)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue={
                                  selectedChart === 'cpuBusy' ? "90" :
                                  selectedChart === 'ziipBusy' ? "85" :
                                  selectedChart === 'cpuUtilization' ? "95" :
                                  selectedChart === 'ioRate' ? "1000" :
                                  selectedChart === 'dasdBusy' ? "80" :
                                  selectedChart === 'lastUpdate' ? "5" : "90"
                                }
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Uyarı Eşiği (%)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue={
                                  selectedChart === 'cpuBusy' ? "75" :
                                  selectedChart === 'ziipBusy' ? "70" :
                                  selectedChart === 'cpuUtilization' ? "85" :
                                  selectedChart === 'ioRate' ? "800" :
                                  selectedChart === 'dasdBusy' ? "65" :
                                  selectedChart === 'lastUpdate' ? "3" : "75"
                                }
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Bilgi Eşiği (%)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue={
                                  selectedChart === 'cpuBusy' ? "60" :
                                  selectedChart === 'ziipBusy' ? "55" :
                                  selectedChart === 'cpuUtilization' ? "70" :
                                  selectedChart === 'ioRate' ? "600" :
                                  selectedChart === 'dasdBusy' ? "50" :
                                  selectedChart === 'lastUpdate' ? "2" : "60"
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5>
                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" defaultChecked />
                              <span className="text-sm text-gray-600">E-posta bildirimi</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" defaultChecked />
                              <span className="text-sm text-gray-600">SMS bildirimi</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="text-sm text-gray-600">Sistem bildirimi</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" defaultChecked />
                              <span className="text-sm text-gray-600">Otomatik raporlama</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                          İptal
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                          Kaydet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Modalı */}
        {infoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Info Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {infoModal === 'cpuBusy' && 'CPU Busy% Hakkında'}
                    {infoModal === 'ziipBusy' && 'zIIP Busy% Hakkında'}
                    {infoModal === 'cpuUtilization' && 'CPU Utilization% Hakkında'}
                    {infoModal === 'ioRate' && 'I/O Rate% Hakkında'}
                    {infoModal === 'dasdBusy' && 'DASD Busy% Hakkında'}
                    {infoModal === 'lastUpdate' && 'Last Update% Hakkında'}
                  </h3>
                  <button 
                    onClick={closeInfo}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Info Content */}
                <div className="space-y-6">
                  {/* CPU Busy Info */}
                  {infoModal === 'cpuBusy' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CPU Busy%, z/OS sistemindeki CPU'nun ne kadar meşgul olduğunu gösterir. 
                          Bu metrik, CPU'nun işlem yapmak için harcadığı zamanın toplam zamana oranını yüzde olarak ifade eder.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Normal Değerler</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>0-60%:</strong> Normal kullanım</li>
                          <li>• <strong>60-75%:</strong> Yüksek kullanım (dikkat)</li>
                          <li>• <strong>75-90%:</strong> Kritik kullanım (uyarı)</li>
                          <li>• <strong>90%+:</strong> Aşırı yük (acil müdahale)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yüksek CPU kullanımı, sistem performansının düşmesine, yanıt sürelerinin artmasına 
                          ve kullanıcı deneyiminin kötüleşmesine neden olabilir. Sürekli yüksek değerler 
                          sistem kararlılığını tehdit edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* zIIP Busy Info */}
                  {infoModal === 'ziipBusy' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          zIIP (z Integrated Information Processor) Busy%, özel zIIP işlemcilerinin 
                          kullanım oranını gösterir. Bu işlemciler DB2, Java ve diğer iş yükleri için optimize edilmiştir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Normal Değerler</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>0-55%:</strong> Normal kullanım</li>
                          <li>• <strong>55-70%:</strong> Yüksek kullanım (dikkat)</li>
                          <li>• <strong>70-85%:</strong> Kritik kullanım (uyarı)</li>
                          <li>• <strong>85%+:</strong> Aşırı yük (acil müdahale)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          zIIP işlemcileri, ana CPU yükünü azaltarak genel sistem performansını artırır. 
                          Yüksek zIIP kullanımı, bu işlemcilerin etkin çalıştığını gösterir ancak 
                          aşırı yüklenmesi performans sorunlarına yol açabilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CPU Utilization Info */}
                  {infoModal === 'cpuUtilization' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CPU Utilization%, sistemin genel CPU kullanım oranını gösterir. 
                          Bu metrik, tüm CPU çekirdeklerinin ortalama kullanımını yansıtır.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Normal Değerler</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>0-70%:</strong> Normal kullanım</li>
                          <li>• <strong>70-85%:</strong> Yüksek kullanım (dikkat)</li>
                          <li>• <strong>85-95%:</strong> Kritik kullanım (uyarı)</li>
                          <li>• <strong>95%+:</strong> Aşırı yük (acil müdahale)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CPU Utilization, sistemin genel sağlığının en önemli göstergelerinden biridir. 
                          Yüksek değerler, sistemin kapasitesine yaklaştığını ve performans sorunları 
                          yaşanabileceğini işaret eder.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* I/O Rate Info */}
                  {infoModal === 'ioRate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          I/O Rate, saniyede gerçekleştirilen girdi/çıktı işlemlerinin sayısını (IOPS) gösterir. 
                          Bu metrik, disk ve depolama sistemlerinin ne kadar yoğun kullanıldığını ifade eder.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Normal Değerler</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>0-600 IOPS:</strong> Normal kullanım</li>
                          <li>• <strong>600-800 IOPS:</strong> Yüksek kullanım (dikkat)</li>
                          <li>• <strong>800-1000 IOPS:</strong> Kritik kullanım (uyarı)</li>
                          <li>• <strong>1000+ IOPS:</strong> Aşırı yük (acil müdahale)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yüksek I/O oranları, depolama sisteminin yoğun kullanıldığını gösterir. 
                          Bu durum, disk gecikmelerinin artmasına ve genel sistem performansının 
                          düşmesine neden olabilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DASD Busy Info */}
                  {infoModal === 'dasdBusy' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          DASD (Direct Access Storage Device) Busy%, disk sürücülerinin ne kadar 
                          meşgul olduğunu gösterir. Bu metrik, disk erişim yoğunluğunu yüzde olarak ifade eder.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Normal Değerler</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>0-50%:</strong> Normal kullanım</li>
                          <li>• <strong>50-65%:</strong> Yüksek kullanım (dikkat)</li>
                          <li>• <strong>65-80%:</strong> Kritik kullanım (uyarı)</li>
                          <li>• <strong>80%+:</strong> Aşırı yük (acil müdahale)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yüksek DASD kullanımı, disk erişim gecikmelerinin artmasına neden olur. 
                          Bu durum, veritabanı performansının düşmesine ve kullanıcı deneyiminin 
                          kötüleşmesine yol açabilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Last Update Info */}
                  {infoModal === 'lastUpdate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Last Update%, sistem metriklerinin en son ne zaman güncellendiğini gösterir. 
                          Bu bilgi, veri tazeliğini ve sistem izlemenin sağlıklı çalışıp çalışmadığını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Normal Değerler</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>0-2 dakika:</strong> Çok güncel</li>
                          <li>• <strong>2-5 dakika:</strong> Güncel</li>
                          <li>• <strong>5-10 dakika:</strong> Eski (dikkat)</li>
                          <li>• <strong>10+ dakika:</strong> Çok eski (uyarı)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Güncel olmayan veriler, yanlış kararlar alınmasına neden olabilir. 
                          Eski veriler, gerçek zamanlı sistem durumunu yansıtmaz ve 
                          kritik durumların geç fark edilmesine yol açabilir.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZOSPage;
