import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { databaseAPI } from '../../services/api';

const USSPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [zfsData, setZfsData] = useState([]);
  const [filteredZfsData, setFilteredZfsData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [modalColor, setModalColor] = useState('blue');

  // Format number helper
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  };

  // Format size helper for ZFS data
  const formatSize = (size) => {
    if (!size || size === '-') return '-';
    const num = parseFloat(size);
    if (isNaN(num)) return size;
    
    if (num >= 1024 * 1024 * 1024) {
      return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (num >= 1024 * 1024) {
      return `${(num / (1024 * 1024)).toFixed(2)} MB`;
    } else if (num >= 1024) {
      return `${(num / 1024).toFixed(2)} KB`;
    } else {
      return `${num} B`;
    }
  };

  // Sort function
  const handleSort = (column) => {
    if (column === 'id' || column === 'timestamp' || column === 'time') {
      return; // String ve zaman sütunları için sıralama yapma
    }

    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sıralanmış veri - filtrelenmiş veri varsa onu kullan
  const dataToUse = isFiltered ? filteredZfsData : zfsData;
  const sortedData = [...dataToUse].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = parseFloat(a[sortColumn]) || 0;
    const bVal = parseFloat(b[sortColumn]) || 0;
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Export to Excel
  const exportToExcel = () => {
    if (!zfsData || zfsData.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }

    const headers = [
      'Filesystem',
      'Mount Point', 
      'Size',
      'Used',
      'Available',
      'Use%',
      'Timestamp'
    ];

    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => [
        row.filesystem || '',
        row.mount_point || '',
        row.size || '',
        row.used || '',
        row.available || '',
        row.use_percent || '',
        row.timestamp ? new Date(row.timestamp).toLocaleString('tr-TR') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `zfs_filesystem_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Excel dosyası başarıyla indirildi');
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!zfsData || zfsData.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }

    try {
      const loadScripts = () => {
        return new Promise((resolve, reject) => {
          if (window.jspdf) {
            resolve();
            return;
          }

          const jspdfScript = document.createElement('script');
          jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          jspdfScript.onload = () => {
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = () => resolve();
            autoTableScript.onerror = () => reject(new Error('AutoTable script failed to load'));
            document.head.appendChild(autoTableScript);
          };
          jspdfScript.onerror = () => reject(new Error('jsPDF script failed to load'));
          document.head.appendChild(jspdfScript);
        });
      };

      loadScripts().then(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Başlık
        doc.setFontSize(16);
        doc.text('ZFS File System Raporu', 20, 20);
        
        // Tarih
        doc.setFontSize(10);
        doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
        
        // Tablo verilerini hazırla
        const tableData = sortedData.map(row => [
          row.filesystem || '-',
          row.mount_point || '-',
          formatSize(row.size),
          formatSize(row.used),
          formatSize(row.available),
          row.use_percent ? `${row.use_percent}%` : '-',
          row.timestamp ? new Date(row.timestamp).toLocaleString('tr-TR') : '-'
        ]);

        const headers = ['Filesystem', 'Mount Point', 'Size', 'Used', 'Available', 'Use%', 'Timestamp'];

        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 40,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Filesystem
            1: { cellWidth: 25 }, // Mount Point
            2: { cellWidth: 20 }, // Size
            3: { cellWidth: 20 }, // Used
            4: { cellWidth: 20 }, // Available
            5: { cellWidth: 15 }, // Use%
            6: { cellWidth: 30 }  // Timestamp
          }
        });

        // PDF'i indir
        const fileName = `zfs_filesystem_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success('PDF başarıyla indirildi');
      }).catch(error => {
        console.error('PDF oluşturma hatası:', error);
        toast.error('PDF oluşturulurken hata oluştu');
      });
    } catch (error) {
      console.error('PDF export hatası:', error);
      toast.error('PDF export işlemi başarısız');
    }
  };

  // Tablo kontrolü fonksiyonu
  const checkTableInfo = async () => {
    try {
      const response = await databaseAPI.checkTableExistsZFS({});
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_zfs_file_systems tablosu bulunamadı!');
          return false;
        }
        
        if (tableInfo.rowCount === 0) {
          return false; // Sadece false döndür, uyarı verme
        }
        
        toast.success(`Tablo mevcut: ${tableInfo.rowCount} kayıt bulundu`, { autoClose: 2000 });
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // ZFS verilerini çek
  const fetchZfsData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfo();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }

      const response = await databaseAPI.getMainviewUSSZFS({});
      if (response.data.success) {
        // PostgreSQL mainview_zfs_file_systems tablosundaki alanları map et
        const mapped = (response.data.data || []).map((row) => {
          // PostgreSQL tablosundaki gerçek kolon isimlerini kullan
          const total = parseFloat(row.total_aggregate_size || row.size || 0) || 0;
          const usedPct = parseFloat(row.aggregate_used_percent || row.used_percent || 0) || 0;
          const usedSize = total && usedPct ? (total * usedPct) / 100 : 0;
          const availableSize = total ? Math.max(total - usedSize, 0) : 0;

        return {
            filesystem: row.zfs_file_system_name || row.filesystem_name || '-',
            mount_point: row.mount_mode || row.mount_point || '-',
            size: total,
            used: usedSize,
            available: availableSize,
            use_percent: row.aggregate_used_percent || row.used_percent || null,
            timestamp: row.created_at || row.updated_at || row.timestamp || null,
            // Orijinal alanları da sakla (ileride gerekebilir)
            _raw: row,
          };
        });

        setZfsData(mapped);
        // Yeni veri yüklendiğinde filtreleme durumunu sıfırla
        setFilteredZfsData([]);
        setIsFiltered(false);
        
        if (mapped.length === 0) {
          // Test verisi ekle
          const testData = [{
            filesystem: 'TEST_ZFS_001',
            mount_point: '/test/mount',
            size: 1073741824, // 1GB
            used: 536870912,  // 512MB
            available: 536870912, // 512MB
            use_percent: 50,
            timestamp: new Date().toISOString(),
            _raw: { test: true }
          }];
          setZfsData(testData);
          toast.info('Test verisi yüklendi (gerçek veri bulunamadı)', { autoClose: 3000 });
        } else {
          toast.success(`Veriler başarıyla yüklendi (${mapped.length} kayıt)`, { autoClose: 2000 });
        }
      } else {
        setZfsData([]);
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('ZFS veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
      setZfsData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Arama fonksiyonu
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredZfsData([]);
      setIsFiltered(false);
      return;
    }

    const filtered = zfsData.filter(row => 
      Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(term.toLowerCase())
      )
    );
    
    setFilteredZfsData(filtered);
    setIsFiltered(true);
  };

  // Zaman filtresi fonksiyonları
  const openTimeFilter = () => {
    setTimeFilterModal(true);
  };

  const closeTimeFilter = () => {
    setTimeFilterModal(false);
  };

  const clearTimeFilter = () => {
    setFilteredZfsData([]);
    setIsFiltered(false);
    setSelectedTimeRange('last6h');
    setCustomFromDate('');
    setCustomToDate('');
    toast.success('Zaman filtresi temizlendi');
  };

  const applyTimeFilter = () => {
    try {
      let filteredData = [...zfsData];
      const now = new Date();
      let fromDate, toDate;

      // Hızlı zaman aralıkları
      switch (selectedTimeRange) {
        case 'last5m':
          fromDate = new Date(now.getTime() - 5 * 60 * 1000);
          toDate = now;
          break;
        case 'last15m':
          fromDate = new Date(now.getTime() - 15 * 60 * 1000);
          toDate = now;
          break;
        case 'last30m':
          fromDate = new Date(now.getTime() - 30 * 60 * 1000);
          toDate = now;
          break;
        case 'last1h':
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          toDate = now;
          break;
        case 'last3h':
          fromDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'last6h':
          fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'last12h':
          fromDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'last24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'last2d':
          fromDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'custom':
          if (!customFromDate || !customToDate) {
            toast.error('Lütfen başlangıç ve bitiş tarihlerini seçin');
            return;
          }
          fromDate = new Date(customFromDate);
          toDate = new Date(customToDate);
          break;
        default:
          fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          toDate = now;
      }

      // Filtreleme
      filteredData = filteredData.filter(row => {
        const rowDate = new Date(row.timestamp);
        return rowDate >= fromDate && rowDate <= toDate;
      });

      setFilteredZfsData(filteredData);
      setIsFiltered(true);
      setTimeFilterModal(false);
      toast.success(`Zaman filtresi uygulandı (${filteredData.length} kayıt)`);
    } catch (error) {
      console.error('Zaman filtresi hatası:', error);
      toast.error('Zaman filtresi uygulanırken hata oluştu');
    }
  };

  // Modal fonksiyonları
  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table');
    setIsLoading(false);
    
    // Modal rengini ayarla
    if (modalType === 'ZFS') {
      setModalColor('blue');
      fetchZfsData();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
  };

  // Grafik fonksiyonları
  const openChart = (chartType) => {
    setSelectedChart(chartType);
    generateChartData(chartType);
  };

  const closeChart = () => {
    setSelectedChart(null);
    setChartData([]);
  };

  const generateChartData = (chartType) => {
    const dataToUse = isFiltered ? filteredZfsData : zfsData;
    
    if (!dataToUse || dataToUse.length === 0) {
      setChartData([]);
      return;
    }

    const data = dataToUse.map((item, index) => {
      let time;
      const timeField = item.timestamp || item.created_at || item.updated_at;
      
      if (timeField) {
        time = new Date(timeField);
      } else {
        // Eğer zaman bilgisi yoksa, index'e göre hesapla
        const now = new Date();
        time = new Date(now.getTime() - (dataToUse.length - index - 1) * 5 * 60 * 1000);
      }
      
      let value = 0;
      let title = '';
      
      switch (chartType) {
        case 'size':
          value = parseFloat(item.size) || 0;
          title = 'Filesystem Size (GB)';
          break;
        case 'used':
          value = parseFloat(item.used) || 0;
          title = 'Used Space (GB)';
          break;
        case 'available':
          value = parseFloat(item.available) || 0;
          title = 'Available Space (GB)';
          break;
        case 'use_percent':
          value = parseFloat(item.use_percent) || 0;
          title = 'Usage Percentage (%)';
          break;
        default:
          value = 0;
          title = 'Unknown';
      }
      
      data.push({
        time: time.toISOString(),
        value: value,
        label: time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        originalData: item
      });
    });
    
    // Zaman sırasına göre sırala (en eski en başta)
    data.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    setChartData(data);
  };

  // ZFS grafik verisi oluşturma fonksiyonları
  const generateSizeChartData = () => generateChartData('size');
  const generateUsedChartData = () => generateChartData('used');
  const generateAvailableChartData = () => generateChartData('available');
  const generateUsagePercentChartData = () => generateChartData('use_percent');

  // Component mount olduğunda veri çek
  useEffect(() => {
    // Component mount olduğunda veri çekme
  }, []);

  const tabs = [
    { id: 'table', name: 'Tablo', icon: '📊' },
    { id: 'chart', name: 'Grafik', icon: '📈' },
    { id: 'threshold', name: 'Threshold', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          USS Unix System Services
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ZFS Filesystem Card */}
          <div onClick={() => openModal('ZFS')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6 mx-auto group-hover:bg-blue-200">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">ZFS Filesystem</h2>
                <p className="text-gray-500 text-sm font-medium">Dosya Sistemi Yönetimi</p>
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

        {/* --- MODALLAR --- */}

        {/* Ana Modal (ZFS için) */}
        {activeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-8xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'ZFS' && 'ZFS File System Yönetimi'}
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
                              ? `border-${modalColor}-500 text-${modalColor}-600`
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
                  {/* Tablo Sekmesi */}
                  {activeTab === 'table' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-gray-800">ZFS File System Veri Tablosu</h4>
                        <div className="flex space-x-3">
                          <button
                            onClick={exportToExcel}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                            disabled={dataLoading || zfsData.length === 0}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel'e Aktar
                          </button>
                          <button
                            onClick={exportToPDF}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                            disabled={dataLoading || zfsData.length === 0}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF'e Aktar
                          </button>
                          <button
                            onClick={openTimeFilter}
                            className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 flex items-center ${
                              isFiltered 
                                ? 'text-blue-700 bg-blue-100 border-blue-300 hover:bg-blue-200' 
                                : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Zaman Filtresi
                          </button>
                          <button
                            onClick={fetchZfsData}
                            disabled={dataLoading}
                            className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                          </button>
                        </div>
                      </div>

                      {/* Arama */}
                      <div className="flex items-center space-x-4">
                        <input
                          type="text"
                          placeholder="Ara..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600">
                          {isFiltered ? `${filteredZfsData.length} kayıt gösteriliyor` : `${zfsData.length} kayıt`}
                        </span>
                      </div>

                      {/* Tablo */}
                      {dataLoading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                        </div>
                      ) : sortedData.length > 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filesystem</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mount Point</th>
                                <th 
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                  onClick={() => handleSort('size')}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <span>Size</span>
                                      {sortColumn === 'size' ? (
                                        <span className="text-blue-600 font-bold">
                                          {sortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                    </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">↕ Sırala</span>
                                      )}
                                    </div>
                                  </div>
                                </th>
                                <th 
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                  onClick={() => handleSort('used')}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <span>Used</span>
                                      {sortColumn === 'used' ? (
                                        <span className="text-blue-600 font-bold">
                                          {sortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">↕ Sırala</span>
                                      )}
                                    </div>
                                  </div>
                                </th>
                                <th 
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                  onClick={() => handleSort('available')}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <span>Available</span>
                                      {sortColumn === 'available' ? (
                                        <span className="text-blue-600 font-bold">
                                          {sortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">↕ Sırala</span>
                                      )}
                                    </div>
                                  </div>
                                </th>
                                <th 
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                  onClick={() => handleSort('use_percent')}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <span>Use%</span>
                                      {sortColumn === 'use_percent' ? (
                                        <span className="text-blue-600 font-bold">
                                          {sortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">↕ Sırala</span>
                                      )}
                                    </div>
                                  </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sortedData.map((row, index) => (
                                <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {row.filesystem || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {row.mount_point || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatSize(row.size)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatSize(row.used)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatSize(row.available)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      parseFloat(row.use_percent || 0) < 60 ? 'bg-green-100 text-green-800' :
                                      parseFloat(row.use_percent || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                      parseFloat(row.use_percent || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {row.use_percent ? `${row.use_percent}%` : '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {row.timestamp ? new Date(row.timestamp).toLocaleString('tr-TR') : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <p className="text-gray-600 text-lg">Henüz veri bulunmuyor</p>
                          <p className="text-gray-500 text-sm mt-2">Yenile butonuna tıklayarak veri yükleyebilirsiniz</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grafik Sekmesi */}
                  {activeTab === 'chart' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">ZFS Filesystem Performans Grafikleri</h4>
                      
                      {/* ZFS Performans Kartları - Grid Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Filesystem Size Kartı */}
                        <div 
                          onClick={() => openChart('size')}
                          className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1"
                        >
                          {/* Sol üst köşe - Grafik ikonu */}
                          <div className="absolute top-3 left-3">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                          </div>
                          
                          {/* Sağ üst köşe - Info ikonu */}
                          <div className="absolute top-3 right-3">
                            <button className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Ana ikon */}
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4 mx-auto">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                          </div>

                          {/* Başlık */}
                          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Filesystem Size</h3>
                          
                          {/* Değer badge */}
                          <div className="text-center">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                              {zfsData.length > 0 ? formatSize(zfsData[0]?.size || 0) : '0 B'}
                            </span>
                          </div>
                        </div>

                        {/* Used Space Kartı */}
                        <div 
                          onClick={() => openChart('used')}
                          className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1"
                        >
                          {/* Sol üst köşe - Grafik ikonu */}
                          <div className="absolute top-3 left-3">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                          </div>
                          
                          {/* Sağ üst köşe - Info ikonu */}
                          <div className="absolute top-3 right-3">
                            <button className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Ana ikon */}
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4 mx-auto">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>

                          {/* Başlık */}
                          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Used Space</h3>
                          
                          {/* Değer badge */}
                          <div className="text-center">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                              {zfsData.length > 0 ? formatSize(zfsData[0]?.used || 0) : '0 B'}
                            </span>
                          </div>
                        </div>

                        {/* Available Space Kartı */}
                        <div 
                          onClick={() => openChart('available')}
                          className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1"
                        >
                          {/* Sol üst köşe - Grafik ikonu */}
                          <div className="absolute top-3 left-3">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                          </div>
                          
                          {/* Sağ üst köşe - Info ikonu */}
                          <div className="absolute top-3 right-3">
                            <button className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Ana ikon */}
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4 mx-auto">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>

                          {/* Başlık */}
                          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Available Space</h3>
                          
                          {/* Değer badge */}
                          <div className="text-center">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                              {zfsData.length > 0 ? formatSize(zfsData[0]?.available || 0) : '0 B'}
                            </span>
                          </div>
                        </div>

                        {/* Usage Percentage Kartı */}
                        <div 
                          onClick={() => openChart('use_percent')}
                          className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1"
                        >
                          {/* Sol üst köşe - Grafik ikonu */}
                          <div className="absolute top-3 left-3">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                          </div>
                          
                          {/* Sağ üst köşe - Info ikonu */}
                          <div className="absolute top-3 right-3">
                            <button className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Ana ikon */}
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4 mx-auto">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>

                          {/* Başlık */}
                          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Usage %</h3>
                          
                          {/* Değer badge - Kullanım yüzdesine göre renk */}
                          <div className="text-center">
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-md ${
                              parseFloat(zfsData[0]?.use_percent || 0) < 60 ? 'bg-green-100 text-green-800' :
                              parseFloat(zfsData[0]?.use_percent || 0) < 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {zfsData.length > 0 ? `${zfsData[0]?.use_percent || 0}%` : '0%'}
                            </span>
                          </div>
                        </div>

                        {/* Last Update Kartı - Özel tasarım */}
                        <div className="group relative bg-blue-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 p-6 hover:-translate-y-1">
                          {/* Ana ikon - Saat */}
                          <div className="flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mb-4 mx-auto">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>

                          {/* Başlık */}
                          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Last Update</h3>
                          
                          {/* Tarih */}
                          <div className="text-center">
                            <p className="text-gray-700 font-medium">
                              {new Date().toLocaleDateString('tr-TR')}
                            </p>
                            <p className="text-blue-600 text-sm">
                              {new Date().toLocaleTimeString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Threshold Sekmesi */}
                  {activeTab === 'threshold' && (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-4">⚙️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Threshold Ayarları</h3>
                      <p className="text-gray-600">Threshold ayarları yakında eklenecek</p>
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
                        { id: 'last5m', label: 'Son 5 Dakika' },
                        { id: 'last15m', label: 'Son 15 Dakika' },
                        { id: 'last30m', label: 'Son 30 Dakika' },
                        { id: 'last1h', label: 'Son 1 Saat' },
                        { id: 'last3h', label: 'Son 3 Saat' },
                        { id: 'last6h', label: 'Son 6 Saat' },
                        { id: 'last12h', label: 'Son 12 Saat' },
                        { id: 'last24h', label: 'Son 24 Saat' },
                        { id: 'last2d', label: 'Son 2 Gün' },
                        { id: 'custom', label: 'Özel Aralık' }
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

                  {/* Özel Tarih Aralığı */}
                  {selectedTimeRange === 'custom' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Özel Tarih Aralığı</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Başlangıç Tarihi
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
                            Bitiş Tarihi
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
                  )}

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
                      className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700 transition-colors duration-200`}
                    >
                      Zaman Aralığını Uygula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grafik Modalı */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedChart === 'size' && 'Filesystem Size Grafiği'}
                    {selectedChart === 'used' && 'Used Space Grafiği'}
                    {selectedChart === 'available' && 'Available Space Grafiği'}
                    {selectedChart === 'use_percent' && 'Usage Percentage Grafiği'}
                  </h3>
                  <button 
                    onClick={closeChart}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {chartData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Grafik İstatistikleri */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Ortalama</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedChart === 'use_percent' 
                            ? `${(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length).toFixed(1)}%`
                            : formatSize(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)
                          }
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Maksimum</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedChart === 'use_percent' 
                            ? `${Math.max(...chartData.map(item => item.value)).toFixed(1)}%`
                            : formatSize(Math.max(...chartData.map(item => item.value)))
                          }
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Minimum</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedChart === 'use_percent' 
                            ? `${Math.min(...chartData.map(item => item.value)).toFixed(1)}%`
                            : formatSize(Math.min(...chartData.map(item => item.value)))
                          }
                        </div>
                      </div>
                    </div>

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
                        {(() => {
                          const maxValue = Math.max(...chartData.map(item => item.value));
                          const minValue = Math.min(...chartData.map(item => item.value));
                          const range = maxValue - minValue;
                          const step = range / 5;
                          const labels = [];
                          for (let i = 0; i <= 5; i++) {
                            labels.push(minValue + (step * i));
                          }
                          return labels;
                        })().map((value, index) => (
                          <text
                            key={value}
                            x="20"
                            y={280 - (index * 50)}
                            className="text-xs fill-gray-500"
                            textAnchor="end"
                          >
                            {selectedChart === 'use_percent' ? `${value.toFixed(1)}%` : formatSize(value)}
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
                        
                        {/* Line Chart */}
                        {chartData.length > 1 && (() => {
                          const maxValue = Math.max(...chartData.map(item => item.value));
                          const minValue = Math.min(...chartData.map(item => item.value));
                          const range = maxValue - minValue || 1;
                          
                          const points = chartData.map((point, index) => {
                            const x = 80 + (index * (1000 / (chartData.length - 1)));
                            const y = 250 - ((point.value - minValue) / range) * 200;
                            return `${x},${y}`;
                          }).join(' L ');
                          
                          return (
                            <g>
                              <path
                                d={`M ${points}`}
                                fill="none"
                                stroke={selectedChart === 'use_percent' ? '#ef4444' : '#3b82f6'}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {chartData.map((point, index) => {
                                const x = 80 + (index * (1000 / (chartData.length - 1)));
                                const y = 250 - ((point.value - minValue) / range) * 200;
                                return (
                                  <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill={selectedChart === 'use_percent' ? '#ef4444' : '#3b82f6'}
                                    className="hover:r-6 transition-all duration-200"
                                  />
                                );
                              })}
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-600 text-lg">Grafik verisi bulunamadı</p>
                    <p className="text-gray-500 text-sm mt-2">Veri yüklemek için yenile butonuna tıklayın</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default USSPage;
