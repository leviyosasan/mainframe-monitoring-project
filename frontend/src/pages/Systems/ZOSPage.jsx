import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ZOSPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [infoModal, setInfoModal] = useState(null);
  const [mainviewData, setMainviewData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [mainviewDataJespool, setMainviewDataJespool] = useState([]);
  const [mainviewDataJCPU,setMainviewDataJCPU ] = useState([]);
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [chartData, setChartData] = useState([]);

  // Sayı formatı yardımcı fonksiyonu
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  // Tablo kontrolü fonksiyonu
  const checkTableInfo = async () => {
    try {
      const response = await databaseAPI.checkTableExists();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_mvs_sysover tablosu bulunamadı!');
          return false;
        }
        
        if (tableInfo.rowCount === 0) {
          return false; // Sadece false döndür, uyarı verme
        }
        
        toast.success(`Tablo mevcut: ${tableInfo.rowCount} kayıt bulundu`);
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // Veri çekme fonksiyonu
  const fetchMainviewData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfo();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewMvsSysover();
      
      if (response.data.success) {
        setMainviewData(response.data.data);
        
        if (response.data.data.length === 0) {
          // Tablo boşsa sessizce devam et, uyarı verme
        } else {
          toast.success(`Veriler başarıyla yüklendi (${response.data.data.length} kayıt)`);
        }
      } else {
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };


  const checkTableInfoJespool = async () => {
    try {
      const responseJespool = await databaseAPI.checkTableExistsJespool();
      
      if (responseJespool.data.success) {
        const tableInfoJespool = responseJespool.data.tableInfo;
        
        if (!tableInfoJespool.exists) {
          toast.error('mainview_mvs_jespool tablosu bulunamadı!');
          return false;
        }
        
        if (tableInfoJespool.rowCount === 0) {
          return false; // Sadece false döndür, uyarı verme
        }
        
        toast.success(`Tablo mevcut: ${tableInfoJespool.rowCount} kayıt bulundu`);
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // Veri çekme fonksiyonu
  const fetchMainviewDataJespool = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoJespool();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const responseJespool = await databaseAPI.getMainviewMvsJespool();

      
      if (responseJespool.data.success) {
        setMainviewDataJespool(responseJespool.data.data);
        
        if (responseJespool.data.data.length === 0) {
          // Tablo boşsa sessizce devam et, uyarı verme
        } else {
          toast.success(`Veriler başarıyla yüklendi (${responseJespool.data.data.length} kayıt)`);
        }
      } else {
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };


  const fetchMainviewDataJCPU = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoJCPU();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const responseJCPU = await databaseAPI.getMainviewMvsJCPU();

      
      if (responseJCPU.data.success) {
        setMainviewDataJCPU(responseJCPU.data.data);
        
        if (responseJCPU.data.data.length === 0) {
          // Tablo boşsa sessizce devam et, uyarı verme
        } else {
          toast.success(`Veriler başarıyla yüklendi (${responseJCPU.data.data.length} kayıt)`);
        }
      } else {
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };


  const checkTableInfoJCPU = async () => {
    try {
      const responseJCPU = await databaseAPI.checkTableExistsJCPU();
      
      if (responseJCPU.data.success) {
        const tableInfoJCPU = responseJCPU.data.tableInfo;
        
        if (!tableInfoJCPU.exists) {
          toast.error('mainview_mvs_jcpu tablosu bulunamadı!');
          return false;
        }
        
        if (tableInfoJCPU.rowCount === 0) {
          return false; // Sadece false döndür, uyarı verme
        }
        
        toast.success(`Tablo mevcut: ${tableInfoJCPU.rowCount} kayıt bulundu`);
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table'); // Her modal açıldığında tablo sekmesine git
    setIsLoading(false); // Modal açıldığında loading'i false yap
    
    // CPU modalı açıldığında veri çek
    if (modalType === 'cpu') {
      fetchMainviewData();
    }
    // Spool modalı açıldığında veri çek
    if (modalType === 'spool') {
      fetchMainviewDataJespool();
    }
    if (modalType === 'addressSpace') {
      fetchMainviewDataJCPU();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
    setSelectedChart(null);
  };

  const openChart = (chartType) => {
    setSelectedChart(chartType);
    setChartTab('chart'); // Her grafik açıldığında grafik sekmesine git
    
    // Grafik türüne göre veri oluştur
    switch (chartType) {
      case 'cpuBusy':
        setChartData(generateCpuBusyChartData());
        break;
      case 'ziipBusy':
        setChartData(generateZiipBusyChartData());
        break;
      case 'cpuAvg':
        setChartData(generateCpuAvgChartData());
        break;
      case 'ioRate':
        setChartData(generateIoRateChartData());
        break;
      case 'queueIo':
        setChartData(generateQueueIoChartData());
        break;
      case 'dasdBusy':
        setChartData(generateDasdBusyChartData());
        break;
      case 'cpuSpu':
        setChartData(generateCpuSpuChartData());
        break;
      case 'cpuEpu':
        setChartData(generateCpuEpuChartData());
        break;
      case 'sqPu':
        setChartData(generateSqPuChartData());
        break;
      case 'esPu':
        setChartData(generateEsPuChartData());
        break;
      default:
        setChartData([]);
    }
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

  const openTimeFilter = () => {
    setTimeFilterModal(true);
  };

  const closeTimeFilter = () => {
    setTimeFilterModal(false);
  };

  const applyTimeFilter = () => {
    // Zaman filtresi uygulama mantığı buraya eklenecek
    console.log('Zaman filtresi uygulandı:', selectedTimeRange, customFromDate, customToDate);
    closeTimeFilter();
  };

  // Genel grafik verisi oluşturma fonksiyonu
  const generateChartData = (dataField, title) => {
    if (!mainviewData || mainviewData.length === 0) {
      return [];
    }
    
    const data = [];
    
    // Mevcut verilerden belirtilen alanın değerlerini al ve gerçek zamanları kullan
    mainviewData.forEach((item, index) => {
      // Gerçek bmctime alanını kullan, yoksa created_at kullan
      const timeField = item.bmctime || item.created_at;
      let time;
      
      if (timeField) {
        time = new Date(timeField);
      } else {
        // Eğer zaman bilgisi yoksa, index'e göre hesapla
        const now = new Date();
        time = new Date(now.getTime() - (mainviewData.length - index - 1) * 5 * 60 * 1000);
      }
      
      const value = parseFloat(item[dataField]) || 0;
      
      data.push({
        time: time.toISOString(),
        value: value,
        label: time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        originalData: item
      });
    });
    
    // Zaman sırasına göre sırala (en eski en başta)
    data.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    return data;
  };

  // CPU Busy% için gerçek veri ile grafik verisi oluştur
  const generateCpuBusyChartData = () => generateChartData('succpub', 'CPU Busy%');
  
  // zIIP Busy% için grafik verisi
  const generateZiipBusyChartData = () => generateChartData('sucziib', 'zIIP Busy%');
  
  // CPU Avg için grafik verisi
  const generateCpuAvgChartData = () => generateChartData('scicpavg', 'CPU Avg');
  
  // I/O Rate için grafik verisi
  const generateIoRateChartData = () => generateChartData('suciinrt', 'I/O Rate');
  
  // Queue I/O için grafik verisi
  const generateQueueIoChartData = () => generateChartData('suklqior', 'Queue I/O');
  
  // DASD Busy% için grafik verisi
  const generateDasdBusyChartData = () => generateChartData('sukadbpc', 'DASD Busy%');
  
  // CPU SPU için grafik verisi
  const generateCpuSpuChartData = () => generateChartData('csrecspu', 'CPU SPU');
  
  // CPU EPU için grafik verisi
  const generateCpuEpuChartData = () => generateChartData('csreecpu', 'CPU EPU');
  
  // SQ PU için grafik verisi
  const generateSqPuChartData = () => generateChartData('csresqpu', 'SQ PU');
  
  // ES PU için grafik verisi
  const generateEsPuChartData = () => generateChartData('csreespu', 'ES PU');

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
            <div className="bg-white rounded-xl shadow-2xl max-w-8xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                <div className="min-h-[400px]">
                    {/* Tablo Sekmesi */}
                    {activeTab === 'table' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-gray-800">Veri Tablosu</h4>
                          {activeModal === 'cpu' && (
                            <div className="flex space-x-3">
                              <button
                                onClick={openTimeFilter}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Zaman Filtresi
                              </button>
                              <button
                                onClick={fetchMainviewData}
                                disabled={dataLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                              </button>
                            </div>
                          )}
                          {activeModal === 'addressSpace' && (
                            <button
                              onClick={fetchMainviewDataJCPU}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          )}
                          {activeModal === 'spool' && (
                            <button
                              onClick={fetchMainviewDataJespool}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          )}
                        </div>
                        
                        {activeModal === 'cpu' ? (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {dataLoading ? (
                              <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                              </div>
                            ) : mainviewData.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1400px' }}>
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SYS</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU Busy%</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">zIIP Busy%</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU Avg</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">I/O Rate</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue I/O</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DASD Busy%</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU SPU</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU EPU</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SQ PU</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ES PU</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMC Time</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {mainviewData.map((row, index) => (
                                      <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{row.id}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{row.syxsysn || '-'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.succpub)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.sucziib)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.scicpavg)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.suciinrt)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.suklqior)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.sukadbpc)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.csrecspu)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.csreecpu)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.csresqpu)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.csreespu)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{row.time || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg">Henüz veri bulunmuyor</p>
                                <p className="text-gray-500 text-sm mt-2">Yenile butonuna tıklayarak veri yükleyebilirsiniz</p>
                              </div>
                            )}
                          </div>
                        ) : activeModal === 'addressSpace' ? (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {dataLoading ? (
                              <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                              </div>
                            ) : mainviewDataJCPU.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobname</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JES Job Number</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address Space Type</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Class Name</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASGRNMC</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Step Being Monitored</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ALL CPU seconds</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unadj CPU Util (All Enclaves)</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Using CPU %</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU Delay %</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Priority</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TCB Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% SRB Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval Unadj Remote Enclave CPU use</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Total CPU Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other Addr Space Enclave CPU Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">zIIP Total CPU Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">zIIP Interval CPU Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dep Enclave zIIP Total Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dep Enclave zIIP Interval Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dep Enclave zIIP On CP Total</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval CP time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Group Name</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Group Type</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recovery Process Boost</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Implicit CPU Critical Flag</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMC Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {mainviewDataJCPU.map((row, index) => (
                                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.jobname || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.jes_job_number || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.address_space_type || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.service_class_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.asgrnmc || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.job_step_being_monitored || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.all_cpu_seconds)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.unadj_cpu_util_with_all_enclaves)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.using_cpu_percentage)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.cpu_delay_percentage)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.average_priority)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.tcb_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.percentage_srb_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.interval_unadj_remote_enclave_cpu_use)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.job_total_cpu_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.other_address_space_enclave_cpu_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.ziip_total_cpu_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.ziip_interval_cpu_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.dependent_enclave_ziip_total_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.dependent_enclave_ziip_interval_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.dependent_enclave_ziip_on_cp_total)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.interval_cp_time)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.resource_group_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.resource_group_type || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.recovery_process_boost || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.implicit_cpu_critical_flag || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.time || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg">Henüz veri bulunmuyor</p>
                                <p className="text-gray-500 text-sm mt-2">Yenile butonuna tıklayarak veri yükleyebilirsiniz</p>
                              </div>
                            )}
                          </div>
                        ) : activeModal === 'spool' ? (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {dataLoading ? (
                              <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                              </div>
                            ) : mainviewDataJespool.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMC Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMF ID</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL VOLS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SPOOL %UTIL</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL TRACKS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USED TRACKS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIVE %UTIL</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL ACTIVE TRACKS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USED ACTIVE TRACKS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIVE VOLS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VOLUME</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VOLUME %UTIL</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VOLUME TRACKS</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VOLUME USED</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OTHER VOLS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {mainviewDataJespool.map((row, index) => (
                                      <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.time || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.smf_id || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.total_volumes)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.spool_util)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.total_tracks)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.used_tracks)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.active_spool_util)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.total_active_tracks)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.used_active_tracks)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.active_volumes)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.volume || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.status || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.volume_util)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.volume_tracks)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.volume_used)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.other_volumes)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg">Henüz veri bulunmuyor</p>
                                <p className="text-gray-500 text-sm mt-2">Yenile butonuna tıklayarak veri yükleyebilirsiniz</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <div className="text-4xl mb-4">📊</div>
                            <p className="text-gray-600 text-lg">Tablo verileri buraya eklenecek</p>
                            <p className="text-gray-500 text-sm mt-2">
                              {activeModal === 'addressSpace' && 'Address Space verileri'}
                              {activeModal === 'spool' && 'Spool işlem verileri'}
                            </p>
                          </div>
                        )}
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
                              {/* Grafik Butonu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChart('cpuBusy');
                                }}
                                className="absolute top-3 left-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Busy%</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewData.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewData[0]?.succpub || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewData[0]?.succpub || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewData[0]?.succpub || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewData[0]?.succpub)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
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
                              {/* Grafik Butonu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChart('ziipBusy');
                                }}
                                className="absolute top-3 left-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Busy%</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewData.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewData[0]?.sucziib || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewData[0]?.sucziib || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewData[0]?.sucziib || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewData[0]?.sucziib)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* CPU Utilization */}
                            <div 
                              onClick={() => openChart('cpuAvg')}
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
                              {/* Grafik Butonu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChart('cpuAvg');
                                }}
                                className="absolute top-3 left-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Utilization%</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewData.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewData[0]?.scicpavg || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewData[0]?.scicpavg || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewData[0]?.scicpavg || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewData[0]?.scicpavg)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
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
                              {/* Grafik Butonu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChart('ioRate');
                                }}
                                className="absolute top-3 left-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">I/O Rate%</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewData.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewData[0]?.suciinrt || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewData[0]?.suciinrt || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewData[0]?.suciinrt || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewData[0]?.suciinrt)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
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
                              {/* Grafik Butonu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChart('dasdBusy');
                                }}
                                className="absolute top-3 left-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </button>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">DASD Busy%</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewData.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewData[0]?.sukadbpc || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewData[0]?.sukadbpc || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewData[0]?.sukadbpc || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewData[0]?.sukadbpc)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Last Update - Tıklanamaz */}
                            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                                <div className="text-sm font-semibold text-blue-700">
                                  {mainviewData.length > 0 ? (
                                    <div className="space-y-1">
                                      <div className="text-lg font-bold text-blue-900">
                                        {new Date(mainviewData[0]?.bmctime || mainviewData[0]?.created_at || new Date()).toLocaleDateString('tr-TR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </div>
                                      <div className="text-sm text-blue-600">
                                        {new Date(mainviewData[0]?.bmctime || mainviewData[0]?.created_at || new Date()).toLocaleTimeString('tr-TR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-blue-400">Veri yok</span>
                                  )}
                                </div>
                              </div>
                        </div>
                          </div>
                        )}

                        {/* Address Space Grafik Kartları */}
                        {activeModal === 'addressSpace' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Jobname */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">Jobname</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                      {mainviewDataJCPU[0]?.jobname || '-'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* JES Job Number */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">JES Job Number</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                      {mainviewDataJCPU[0]?.jes_job_number || '-'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ALL CPU seconds - Grafik */}
                            <div 
                              onClick={() => openChart('allCpuSeconds')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">ALL CPU seconds</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.all_cpu_seconds)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Unadj CPU Util - Grafik */}
                            <div 
                              onClick={() => openChart('unadjCpuUtil')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Unadj CPU Util</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewDataJCPU[0]?.unadj_cpu_util_with_all_enclaves || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewDataJCPU[0]?.unadj_cpu_util_with_all_enclaves || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewDataJCPU[0]?.unadj_cpu_util_with_all_enclaves || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewDataJCPU[0]?.unadj_cpu_util_with_all_enclaves)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Using CPU % - Grafik */}
                            <div 
                              onClick={() => openChart('usingCpuPercentage')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Using CPU %</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewDataJCPU[0]?.using_cpu_percentage || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewDataJCPU[0]?.using_cpu_percentage || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewDataJCPU[0]?.using_cpu_percentage || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewDataJCPU[0]?.using_cpu_percentage)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* CPU Delay % - Grafik */}
                            <div 
                              onClick={() => openChart('cpuDelayPercentage')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Delay %</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewDataJCPU[0]?.cpu_delay_percentage || 0) < 10 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewDataJCPU[0]?.cpu_delay_percentage || 0) < 25 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewDataJCPU[0]?.cpu_delay_percentage || 0) < 40 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewDataJCPU[0]?.cpu_delay_percentage)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Average Priority */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">Average Priority</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.average_priority)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* TCB Time - Grafik */}
                            <div 
                              onClick={() => openChart('tcbTime')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">TCB Time</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.tcb_time)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* % SRB Time - Grafik */}
                            <div 
                              onClick={() => openChart('srbTime')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">% SRB Time</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.percentage_srb_time)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Job Total CPU Time - Grafik */}
                            <div 
                              onClick={() => openChart('jobTotalCpuTime')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Job Total CPU Time</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.job_total_cpu_time)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* zIIP Total CPU Time - Grafik */}
                            <div 
                              onClick={() => openChart('ziipTotalCpuTime')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Total CPU Time</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.ziip_total_cpu_time)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* zIIP Interval CPU Time - Grafik */}
                            <div 
                              onClick={() => openChart('ziipIntervalCpuTime')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Interval CPU Time</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJCPU.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJCPU[0]?.ziip_interval_cpu_time)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* LAST UPDATE - Tıklanamaz */}
                            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Spool Grafik Kartları */}
                        {activeModal === 'spool' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* SMF ID */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">SMF ID</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                      {mainviewDataJespool[0]?.smf_id || '-'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* TOTAL VOLS */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">TOTAL VOLS</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJespool[0]?.total_volumes)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* SPOOL %UTİL - Grafik */}
                            <div 
                              onClick={() => openChart('spoolUtil')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPOOL %UTİL</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewDataJespool[0]?.spool_util || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewDataJespool[0]?.spool_util || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewDataJespool[0]?.spool_util || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewDataJespool[0]?.spool_util)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* TOTAL TRACKS - Grafik */}
                            <div 
                              onClick={() => openChart('totalTracks')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">TOTAL TRACKS</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJespool[0]?.total_tracks)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* USED TRACKS - Grafik */}
                            <div 
                              onClick={() => openChart('usedTracks')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">USED TRACKS</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJespool[0]?.used_tracks)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ACTİVE %UTİL - Grafik */}
                            <div 
                              onClick={() => openChart('activeUtil')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">ACTİVE %UTİL</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      parseFloat(mainviewDataJespool[0]?.active_spool_util || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(mainviewDataJespool[0]?.active_spool_util || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(mainviewDataJespool[0]?.active_spool_util || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatNumber(mainviewDataJespool[0]?.active_spool_util)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ACTİVE TRACKS - Grafik */}
                            <div 
                              onClick={() => openChart('activeTracks')}
                              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">ACTİVE TRACKS</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJespool[0]?.total_active_tracks)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ACTİVE USED */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">ACTİVE USED</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJespool[0]?.used_active_tracks)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ACTİVE VOLS */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">ACTİVE VOLS</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(mainviewDataJespool[0]?.active_volumes)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* VOLUME */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">VOLUME</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                      {mainviewDataJespool[0]?.volume || '-'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* STATUS */}
                            <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 text-lg mb-2">STATUS</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {mainviewDataJespool.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      mainviewDataJespool[0]?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                      mainviewDataJespool[0]?.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                                      mainviewDataJespool[0]?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {mainviewDataJespool[0]?.status || '-'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* LAST UPDATE - Tıklanamaz */}
                            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              </div>
                            </div>
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
              </div>
            </div>
          </div>
        )}

        {/* Grafik Modalı */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                    {selectedChart === 'spoolUtil' && 'SPOOL %UTİL Grafiği'}
                    {selectedChart === 'totalTracks' && 'TOTAL TRACKS Grafiği'}
                    {selectedChart === 'usedTracks' && 'USED TRACKS Grafiği'}
                    {selectedChart === 'activeUtil' && 'ACTİVE %UTİL Grafiği'}
                    {selectedChart === 'activeTracks' && 'ACTİVE TRACKS Grafiği'}
                    {selectedChart === 'allCpuSeconds' && 'ALL CPU seconds Grafiği'}
                    {selectedChart === 'unadjCpuUtil' && 'Unadj CPU Util Grafiği'}
                    {selectedChart === 'usingCpuPercentage' && 'Using CPU % Grafiği'}
                    {selectedChart === 'cpuDelayPercentage' && 'CPU Delay % Grafiği'}
                    {selectedChart === 'tcbTime' && 'TCB Time Grafiği'}
                    {selectedChart === 'srbTime' && '% SRB Time Grafiği'}
                    {selectedChart === 'jobTotalCpuTime' && 'Job Total CPU Time Grafiği'}
                    {selectedChart === 'ziipTotalCpuTime' && 'zIIP Total CPU Time Grafiği'}
                    {selectedChart === 'ziipIntervalCpuTime' && 'zIIP Interval CPU Time Grafiği'}
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
                    <div>
                      {selectedChart === 'cpuBusy' ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-semibold text-gray-800">CPU Busy% - Zaman Serisi Grafiği</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setChartData(generateCpuBusyChartData())}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Yenile
                              </button>
                            </div>
                          </div>
                          
                          {chartData.length === 0 ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                                <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
                              </div>
                            </div>
                          ) : (
                            <>
                          {/* Line Chart */}
                          <div className="h-96 w-full">
                            <svg width="100%" height="100%" viewBox="0 0 1200 300" className="overflow-visible">
                              {/* Grid Lines */}
                              <defs>
                                <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                                  <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                              
                              {/* Y-axis labels */}
                              {[0, 20, 40, 60, 80, 100].map((value, index) => (
                                <text
                                  key={value}
                                  x="20"
                                  y={280 - (index * 50)}
                                  className="text-xs fill-gray-500"
                                  textAnchor="end"
                                >
                                  {value}%
                                </text>
                              ))}
                              
                              {/* X-axis labels (her 4 saatte bir) */}
                              {chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 8)) === 0).map((point, index) => (
                                <text
                                  key={index}
                                  x={80 + (index * 140)}
                                  y="295"
                                  className="text-xs fill-gray-500"
                                  textAnchor="middle"
                                >
                                  {point.label}
                                </text>
                              ))}
                              
                              {/* Chart Area */}
                              <defs>
                                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                                </linearGradient>
                              </defs>
                              
                              {/* Area under the curve */}
                              <path
                                d={`M 80,${280 - (chartData[0]?.value || 0) * 2.5} ${chartData.map((point, index) => 
                                  `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 2.5}`
                                ).join(' ')} L ${80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))},280 L 80,280 Z`}
                                fill="url(#areaGradient)"
                              />
                              
                              {/* Line */}
                              <path
                                d={`M 80,${280 - (chartData[0]?.value || 0) * 2.5} ${chartData.map((point, index) => 
                                  `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 2.5}`
                                ).join(' ')}`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              
                              {/* Data points */}
                              {chartData.map((point, index) => (
                                <circle
                                  key={index}
                                  cx={80 + (index * (1100 / Math.max(1, chartData.length - 1)))}
                                  cy={280 - point.value * 2.5}
                                  r="3"
                                  fill="#3b82f6"
                                  className="hover:r-4 transition-all duration-200"
                                >
                                  <title>{`${point.label}: ${point.value}%`}</title>
                                </circle>
                              ))}
                              
                              {/* Threshold lines */}
                              <line x1="80" y1={280 - 75 * 2.5} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 75 * 2.5} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                              <text x="90" y={280 - 75 * 2.5 - 5} className="text-xs fill-red-500 font-medium">Uyarı: 75%</text>
                              
                              <line x1="80" y1={280 - 90 * 2.5} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 90 * 2.5} stroke="#dc2626" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                              <text x="90" y={280 - 90 * 2.5 - 5} className="text-xs fill-red-600 font-medium">Kritik: 90%</text>
                            </svg>
                          </div>
                          
                          {/* Chart Stats */}
                          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}%
                              </div>
                              <div className="text-sm text-gray-500">Maksimum</div>
                              {chartData.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {chartData.find(d => d.value === Math.max(...chartData.map(d => d.value)))?.label || '-'}
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(1) : '0'}%
                              </div>
                              <div className="text-sm text-gray-500">Minimum</div>
                              {chartData.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {chartData.find(d => d.value === Math.min(...chartData.map(d => d.value)))?.label || '-'}
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) : '0'}%
                              </div>
                              <div className="text-sm text-gray-500">Ortalama</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {chartData.length}
                              </div>
                              <div className="text-sm text-gray-500">Veri Noktası</div>
                            </div>
                          </div>
                            </>
                          )}
                        </div>
                      ) : selectedChart === 'ziipBusy' ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-semibold text-gray-800">zIIP Busy% - Zaman Serisi Grafiği</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setChartData(generateZiipBusyChartData())}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Yenile
                              </button>
                            </div>
                          </div>
                          
                          {chartData.length === 0 ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                                <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Line Chart */}
                              <div className="h-96 w-full">
                                <svg width="100%" height="100%" viewBox="0 0 1200 300" className="overflow-visible">
                                  {/* Grid Lines */}
                                  <defs>
                                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid)" />
                                  
                                  {/* Y-axis labels */}
                                  {[0, 20, 40, 60, 80, 100].map((value, index) => (
                                    <text
                                      key={value}
                                      x="20"
                                      y={280 - (index * 50)}
                                      className="text-xs fill-gray-500"
                                      textAnchor="end"
                                    >
                                      {value}%
                                    </text>
                                  ))}
                                  
                                  {/* X-axis labels */}
                                  {chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 8)) === 0).map((point, index) => (
                                    <text
                                      key={index}
                                      x={80 + (index * 140)}
                                      y="295"
                                      className="text-xs fill-gray-500"
                                      textAnchor="middle"
                                    >
                                      {point.label}
                                    </text>
                                  ))}
                                  
                                  {/* Chart Area */}
                                  <defs>
                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>
                                  
                                  {/* Area under the curve */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 2.5} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 2.5}`
                                    ).join(' ')} L ${80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))},280 L 80,280 Z`}
                                    fill="url(#areaGradient)"
                                  />
                                  
                                  {/* Line */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 2.5} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 2.5}`
                                    ).join(' ')}`}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  
                                  {/* Data points */}
                                  {chartData.map((point, index) => (
                                    <circle
                                      key={index}
                                      cx={80 + (index * (1100 / Math.max(1, chartData.length - 1)))}
                                      cy={280 - point.value * 2.5}
                                      r="3"
                                      fill="#10b981"
                                      className="hover:r-4 transition-all duration-200"
                                    >
                                      <title>{`${point.label}: ${point.value}%`}</title>
                                    </circle>
                                  ))}
                                  
                                  {/* Threshold lines */}
                                  <line x1="80" y1={280 - 70 * 2.5} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 70 * 2.5} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 70 * 2.5 - 5} className="text-xs fill-red-500 font-medium">Uyarı: 70%</text>
                                  
                                  <line x1="80" y1={280 - 85 * 2.5} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 85 * 2.5} stroke="#dc2626" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 85 * 2.5 - 5} className="text-xs fill-red-600 font-medium">Kritik: 85%</text>
                                </svg>
                              </div>
                              
                              {/* Chart Stats */}
                              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">Maksimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.max(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(1) : '0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">Minimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.min(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) : '0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">Ortalama</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length}
                                  </div>
                                  <div className="text-sm text-gray-500">Veri Noktası</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : selectedChart === 'cpuAvg' ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-semibold text-gray-800">CPU Avg - Zaman Serisi Grafiği</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setChartData(generateCpuAvgChartData())}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Yenile
                              </button>
                            </div>
                          </div>
                          
                          {chartData.length === 0 ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                                <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Line Chart */}
                              <div className="h-96 w-full">
                                <svg width="100%" height="100%" viewBox="0 0 1200 300" className="overflow-visible">
                                  {/* Grid Lines */}
                                  <defs>
                                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid)" />
                                  
                                  {/* Y-axis labels */}
                                  {[0, 1, 2, 3, 4, 5].map((value, index) => (
                                    <text
                                      key={value}
                                      x="20"
                                      y={280 - (index * 50)}
                                      className="text-xs fill-gray-500"
                                      textAnchor="end"
                                    >
                                      {value}
                                    </text>
                                  ))}
                                  
                                  {/* X-axis labels */}
                                  {chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 8)) === 0).map((point, index) => (
                                    <text
                                      key={index}
                                      x={80 + (index * 140)}
                                      y="295"
                                      className="text-xs fill-gray-500"
                                      textAnchor="middle"
                                    >
                                      {point.label}
                                    </text>
                                  ))}
                                  
                                  {/* Chart Area */}
                                  <defs>
                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>
                                  
                                  {/* Area under the curve */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 50} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 50}`
                                    ).join(' ')} L ${80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))},280 L 80,280 Z`}
                                    fill="url(#areaGradient)"
                                  />
                                  
                                  {/* Line */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 50} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 50}`
                                    ).join(' ')}`}
                                    fill="none"
                                    stroke="#8b5cf6"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  
                                  {/* Data points */}
                                  {chartData.map((point, index) => (
                                    <circle
                                      key={index}
                                      cx={80 + (index * (1100 / Math.max(1, chartData.length - 1)))}
                                      cy={280 - point.value * 50}
                                      r="3"
                                      fill="#8b5cf6"
                                      className="hover:r-4 transition-all duration-200"
                                    >
                                      <title>{`${point.label}: ${point.value}`}</title>
                                    </circle>
                                  ))}
                                  
                                  {/* Threshold lines */}
                                  <line x1="80" y1={280 - 3 * 50} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 3 * 50} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 3 * 50 - 5} className="text-xs fill-red-500 font-medium">Uyarı: 3.0</text>
                                  
                                  <line x1="80" y1={280 - 4 * 50} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 4 * 50} stroke="#dc2626" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 4 * 50 - 5} className="text-xs fill-red-600 font-medium">Kritik: 4.0</text>
                                </svg>
                              </div>
                              
                              {/* Chart Stats */}
                              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(2) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-500">Maksimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.max(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(2) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-500">Minimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.min(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(2) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-500">Ortalama</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length}
                                  </div>
                                  <div className="text-sm text-gray-500">Veri Noktası</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : selectedChart === 'ioRate' ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-semibold text-gray-800">I/O Rate - Zaman Serisi Grafiği</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setChartData(generateIoRateChartData())}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Yenile
                              </button>
                            </div>
                          </div>
                          
                          {chartData.length === 0 ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                                <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Line Chart */}
                              <div className="h-96 w-full">
                                <svg width="100%" height="100%" viewBox="0 0 1200 300" className="overflow-visible">
                                  {/* Grid Lines */}
                                  <defs>
                                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid)" />
                                  
                                  {/* Y-axis labels */}
                                  {[0, 50, 100, 150, 200, 250].map((value, index) => (
                                    <text
                                      key={value}
                                      x="20"
                                      y={280 - (index * 50)}
                                      className="text-xs fill-gray-500"
                                      textAnchor="end"
                                    >
                                      {value}
                                    </text>
                                  ))}
                                  
                                  {/* X-axis labels */}
                                  {chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 8)) === 0).map((point, index) => (
                                    <text
                                      key={index}
                                      x={80 + (index * 140)}
                                      y="295"
                                      className="text-xs fill-gray-500"
                                      textAnchor="middle"
                                    >
                                      {point.label}
                                    </text>
                                  ))}
                                  
                                  {/* Chart Area */}
                                  <defs>
                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>
                                  
                                  {/* Area under the curve */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 1.1} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 1.1}`
                                    ).join(' ')} L ${80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))},280 L 80,280 Z`}
                                    fill="url(#areaGradient)"
                                  />
                                  
                                  {/* Line */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 1.1} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 1.1}`
                                    ).join(' ')}`}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  
                                  {/* Data points */}
                                  {chartData.map((point, index) => (
                                    <circle
                                      key={index}
                                      cx={80 + (index * (1100 / Math.max(1, chartData.length - 1)))}
                                      cy={280 - point.value * 1.1}
                                      r="3"
                                      fill="#f59e0b"
                                      className="hover:r-4 transition-all duration-200"
                                    >
                                      <title>{`${point.label}: ${point.value}`}</title>
                                    </circle>
                                  ))}
                                  
                                  {/* Threshold lines */}
                                  <line x1="80" y1={280 - 200 * 1.1} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 200 * 1.1} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 200 * 1.1 - 5} className="text-xs fill-red-500 font-medium">Uyarı: 200</text>
                                  
                                  <line x1="80" y1={280 - 250 * 1.1} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 250 * 1.1} stroke="#dc2626" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 250 * 1.1 - 5} className="text-xs fill-red-600 font-medium">Kritik: 250</text>
                                </svg>
                              </div>
                              
                              {/* Chart Stats */}
                              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-500">Maksimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.max(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(1) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-500">Minimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.min(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-500">Ortalama</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length}
                                  </div>
                                  <div className="text-sm text-gray-500">Veri Noktası</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : selectedChart === 'dasdBusy' ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-semibold text-gray-800">DASD Busy% - Zaman Serisi Grafiği</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setChartData(generateDasdBusyChartData())}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Yenile
                              </button>
                            </div>
                          </div>
                          
                          {chartData.length === 0 ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                                <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Line Chart */}
                              <div className="h-96 w-full">
                                <svg width="100%" height="100%" viewBox="0 0 1200 300" className="overflow-visible">
                                  {/* Grid Lines */}
                                  <defs>
                                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid)" />
                                  
                                  {/* Y-axis labels */}
                                  {[0, 20, 40, 60, 80, 100].map((value, index) => (
                                    <text
                                      key={value}
                                      x="20"
                                      y={280 - (index * 50)}
                                      className="text-xs fill-gray-500"
                                      textAnchor="end"
                                    >
                                      {value}%
                                    </text>
                                  ))}
                                  
                                  {/* X-axis labels */}
                                  {chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 8)) === 0).map((point, index) => (
                                    <text
                                      key={index}
                                      x={80 + (index * 140)}
                                      y="295"
                                      className="text-xs fill-gray-500"
                                      textAnchor="middle"
                                    >
                                      {point.label}
                                    </text>
                                  ))}
                                  
                                  {/* Chart Area */}
                                  <defs>
                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>
                                  
                                  {/* Area under the curve */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 2.5} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 2.5}`
                                    ).join(' ')} L ${80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))},280 L 80,280 Z`}
                                    fill="url(#areaGradient)"
                                  />
                                  
                                  {/* Line */}
                                  <path
                                    d={`M 80,${280 - (chartData[0]?.value || 0) * 2.5} ${chartData.map((point, index) => 
                                      `L ${80 + (index * (1100 / Math.max(1, chartData.length - 1)))},${280 - point.value * 2.5}`
                                    ).join(' ')}`}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  
                                  {/* Data points */}
                                  {chartData.map((point, index) => (
                                    <circle
                                      key={index}
                                      cx={80 + (index * (1100 / Math.max(1, chartData.length - 1)))}
                                      cy={280 - point.value * 2.5}
                                      r="3"
                                      fill="#ef4444"
                                      className="hover:r-4 transition-all duration-200"
                                    >
                                      <title>{`${point.label}: ${point.value}%`}</title>
                                    </circle>
                                  ))}
                                  
                                  {/* Threshold lines */}
                                  <line x1="80" y1={280 - 65 * 2.5} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 65 * 2.5} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 65 * 2.5 - 5} className="text-xs fill-red-500 font-medium">Uyarı: 65%</text>
                                  
                                  <line x1="80" y1={280 - 80 * 2.5} x2={80 + (chartData.length - 1) * (1100 / Math.max(1, chartData.length - 1))} y2={280 - 80 * 2.5} stroke="#dc2626" strokeWidth="1" strokeDasharray="5,5" opacity="0.7"/>
                                  <text x="90" y={280 - 80 * 2.5 - 5} className="text-xs fill-red-600 font-medium">Kritik: 80%</text>
                                </svg>
                              </div>
                              
                              {/* Chart Stats */}
                              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">Maksimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.max(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(1) : '0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">Minimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chartData.find(d => d.value === Math.min(...chartData.map(d => d.value)))?.label || '-'}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) : '0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">Ortalama</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {chartData.length}
                                  </div>
                                  <div className="text-sm text-gray-500">Veri Noktası</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <div className="text-6xl mb-4">📊</div>
                          <p className="text-gray-600 text-lg mb-2">
                            {selectedChart === 'lastUpdate' && 'Last Update% detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'spoolUtil' && 'SPOOL %UTİL detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'totalTracks' && 'TOTAL TRACKS detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'usedTracks' && 'USED TRACKS detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'activeUtil' && 'ACTİVE %UTİL detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'activeTracks' && 'ACTİVE TRACKS detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'allCpuSeconds' && 'ALL CPU seconds detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'unadjCpuUtil' && 'Unadj CPU Util detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'usingCpuPercentage' && 'Using CPU % detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'cpuDelayPercentage' && 'CPU Delay % detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'tcbTime' && 'TCB Time detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'srbTime' && '% SRB Time detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'jobTotalCpuTime' && 'Job Total CPU Time detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'ziipTotalCpuTime' && 'zIIP Total CPU Time detaylı grafiği buraya eklenecek'}
                            {selectedChart === 'ziipIntervalCpuTime' && 'zIIP Interval CPU Time detaylı grafiği buraya eklenecek'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Gerçek zamanlı veri görselleştirme bileşeni buraya entegre edilecek
                          </p>
                        </div>
                      )}
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
                        {selectedChart === 'allCpuSeconds' && 'ALL CPU seconds Threshold Ayarları'}
                        {selectedChart === 'unadjCpuUtil' && 'Unadj CPU Util Threshold Ayarları'}
                        {selectedChart === 'usingCpuPercentage' && 'Using CPU % Threshold Ayarları'}
                        {selectedChart === 'cpuDelayPercentage' && 'CPU Delay % Threshold Ayarları'}
                        {selectedChart === 'tcbTime' && 'TCB Time Threshold Ayarları'}
                        {selectedChart === 'srbTime' && '% SRB Time Threshold Ayarları'}
                        {selectedChart === 'jobTotalCpuTime' && 'Job Total CPU Time Threshold Ayarları'}
                        {selectedChart === 'ziipTotalCpuTime' && 'zIIP Total CPU Time Threshold Ayarları'}
                        {selectedChart === 'ziipIntervalCpuTime' && 'zIIP Interval CPU Time Threshold Ayarları'}
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
                                  selectedChart === 'lastUpdate' ? "5" :
                                  selectedChart === 'spoolUtil' ? "85" :
                                  selectedChart === 'totalTracks' ? "10000" :
                                  selectedChart === 'usedTracks' ? "8000" :
                                  selectedChart === 'activeUtil' ? "90" :
                                  selectedChart === 'activeTracks' ? "5000" :
                                  selectedChart === 'allCpuSeconds' ? "1000" :
                                  selectedChart === 'unadjCpuUtil' ? "90" :
                                  selectedChart === 'usingCpuPercentage' ? "90" :
                                  selectedChart === 'cpuDelayPercentage' ? "40" :
                                  selectedChart === 'tcbTime' ? "500" :
                                  selectedChart === 'srbTime' ? "50" :
                                  selectedChart === 'jobTotalCpuTime' ? "1000" :
                                  selectedChart === 'ziipTotalCpuTime' ? "800" :
                                  selectedChart === 'ziipIntervalCpuTime' ? "500" : "90"
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
                                  selectedChart === 'lastUpdate' ? "3" :
                                  selectedChart === 'spoolUtil' ? "70" :
                                  selectedChart === 'totalTracks' ? "8000" :
                                  selectedChart === 'usedTracks' ? "6000" :
                                  selectedChart === 'activeUtil' ? "75" :
                                  selectedChart === 'activeTracks' ? "4000" :
                                  selectedChart === 'allCpuSeconds' ? "800" :
                                  selectedChart === 'unadjCpuUtil' ? "75" :
                                  selectedChart === 'usingCpuPercentage' ? "75" :
                                  selectedChart === 'cpuDelayPercentage' ? "25" :
                                  selectedChart === 'tcbTime' ? "350" :
                                  selectedChart === 'srbTime' ? "35" :
                                  selectedChart === 'jobTotalCpuTime' ? "800" :
                                  selectedChart === 'ziipTotalCpuTime' ? "600" :
                                  selectedChart === 'ziipIntervalCpuTime' ? "350" : "75"
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
                                  selectedChart === 'lastUpdate' ? "2" :
                                  selectedChart === 'spoolUtil' ? "55" :
                                  selectedChart === 'totalTracks' ? "6000" :
                                  selectedChart === 'usedTracks' ? "4000" :
                                  selectedChart === 'activeUtil' ? "60" :
                                  selectedChart === 'activeTracks' ? "3000" :
                                  selectedChart === 'allCpuSeconds' ? "600" :
                                  selectedChart === 'unadjCpuUtil' ? "60" :
                                  selectedChart === 'usingCpuPercentage' ? "60" :
                                  selectedChart === 'cpuDelayPercentage' ? "10" :
                                  selectedChart === 'tcbTime' ? "200" :
                                  selectedChart === 'srbTime' ? "20" :
                                  selectedChart === 'jobTotalCpuTime' ? "600" :
                                  selectedChart === 'ziipTotalCpuTime' ? "400" :
                                  selectedChart === 'ziipIntervalCpuTime' ? "200" : "60"
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

        {/* Zaman Filtrele Modalı */}
        {timeFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Zaman ve Tarih Filtresi</h3>
                  <button 
                    onClick={closeTimeFilter}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Hızlı Zaman Aralıkları */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Hızlı Zaman Aralıkları</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: 'last5m', label: 'Son 5 dakika' },
                        { id: 'last15m', label: 'Son 15 dakika' },
                        { id: 'last30m', label: 'Son 30 dakika' },
                        { id: 'last1h', label: 'Son 1 saat' },
                        { id: 'last3h', label: 'Son 3 saat' },
                        { id: 'last6h', label: 'Son 6 saat' },
                        { id: 'last12h', label: 'Son 12 saat' },
                        { id: 'last24h', label: 'Son 24 saat' },
                        { id: 'last2d', label: 'Son 2 gün' }
                      ].map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setSelectedTimeRange(range.id)}
                          className={`p-3 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                            selectedTimeRange === range.id
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Özel Zaman Aralığı */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Özel Zaman Aralığı</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Başlangıç Tarihi ve Saati
                        </label>
                        <input
                          type="datetime-local"
                          value={customFromDate}
                          onChange={(e) => setCustomFromDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bitiş Tarihi ve Saati
                        </label>
                        <input
                          type="datetime-local"
                          value={customToDate}
                          onChange={(e) => setCustomToDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zaman Dilimi */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Zaman Dilimi</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tarayıcı Zamanı</p>
                          <p className="text-sm text-gray-500">Türkiye (UTC+03:00)</p>
                        </div>
                        <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Zaman Ayarlarını Değiştir
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={closeTimeFilter}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200"
                    >
                      İptal
                    </button>
                    <button
                      onClick={applyTimeFilter}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      Zaman Aralığını Uygula
                    </button>
                  </div>
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
