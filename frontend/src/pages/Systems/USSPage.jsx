import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { databaseAPI } from '../../services/api';

const USSPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [zfsData, setZfsData] = useState([]);
  const [filteredZfsData, setFilteredZfsData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
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
  
  // Grafik filtreleri
  const [selectedFilesystem, setSelectedFilesystem] = useState('all');
  const [chartTab, setChartTab] = useState('chart');
  const [infoModal, setInfoModal] = useState(null);

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

  // ZFS verilerini çek
  const fetchZfsData = async () => {
    try {
      // Direkt API'den veri çek, tablo kontrolü yapma
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
        // API başarısız, test verisi göster
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
        setFilteredZfsData([]);
        setIsFiltered(false);
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('ZFS veri yükleme hatası:', error);
      // Hata durumunda test verisi göster
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
      setFilteredZfsData([]);
      setIsFiltered(false);
      toast.info('Test verisi yüklendi (bağlantı hatası)', { autoClose: 3000 });
    } finally {
      // Veri yükleme tamamlandı
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
    
    // Modal rengini ayarla ve veri çek
    if (modalType === 'ZFS') {
      setModalColor('blue');
      
      // Önce test verisi göster
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
      setFilteredZfsData([]);
      setIsFiltered(false);
      
      // Test verisi gösterildikten sonra gerçek veriyi çek
      setTimeout(() => {
      fetchZfsData();
      }, 200);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
  };

  // Grafik fonksiyonları
  const openChart = (chartType) => {
    setSelectedChart(chartType);
    
    // Eğer veri yoksa test verisi oluştur
    if (zfsData.length === 0) {
      // Test verisi oluştur
      const testData = [
        {
          filesystem: 'TEST_ZFS_001',
          mount_point: '/test/mount',
          size: 1073741824, // 1GB
          used: 536870912,  // 512MB
          available: 536870912, // 512MB
          use_percent: 50,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 saat önce
          _raw: { test: true }
        },
        {
          filesystem: 'TEST_ZFS_001',
          mount_point: '/test/mount',
          size: 1073741824, // 1GB
          used: 644245094,  // 600MB
          available: 429496730, // 400MB
          use_percent: 60,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 saat önce
          _raw: { test: true }
        },
        {
          filesystem: 'TEST_ZFS_001',
          mount_point: '/test/mount',
          size: 1073741824, // 1GB
          used: 751619276,  // 700MB
          available: 322122548, // 300MB
          use_percent: 70,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
          _raw: { test: true }
        },
        {
          filesystem: 'TEST_ZFS_001',
          mount_point: '/test/mount',
          size: 1073741824, // 1GB
          used: 858993459,  // 800MB
          available: 214748365, // 200MB
          use_percent: 80,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 saat önce
          _raw: { test: true }
        },
        {
          filesystem: 'TEST_ZFS_001',
          mount_point: '/test/mount',
          size: 1073741824, // 1GB
          used: 966367641,  // 900MB
          available: 107374183, // 100MB
          use_percent: 90,
          timestamp: new Date().toISOString(), // şimdi
          _raw: { test: true }
        }
      ];
      
      setZfsData(testData);
      setFilteredZfsData([]);
      setIsFiltered(false);
      
      // Test verisi ile grafik oluştur
      setTimeout(() => {
        generateChartData(chartType);
      }, 100);
    } else {
      generateChartData(chartType);
    }
  };

  const closeChart = () => {
    setSelectedChart(null);
    setChartData([]);
  };

  // Info modal fonksiyonları
  const openInfo = (chartType) => {
    setInfoModal(chartType);
  };

  const closeInfo = () => {
    setInfoModal(null);
  };

  // Grafik filtre fonksiyonları
  const handleFilesystemChange = (event) => {
    setSelectedFilesystem(event.target.value);
  };

  // Filesystem tıklama fonksiyonu
  const handleFilesystemClick = (filesystem) => {
    setSelectedFilesystem(filesystem);
    setActiveTab('chart');
  };

  // Filtrelenmiş veri hesaplama fonksiyonları
  const getFilteredData = () => {
    let dataToUse = isFiltered ? filteredZfsData : zfsData;
    
    // Filtre seçimi varsa sadece seçili filesystem'i kullan
    if (selectedFilesystem !== 'all') {
      dataToUse = dataToUse.filter(item => item.filesystem === selectedFilesystem);
    }
    
    return dataToUse;
  };

  const getTotalSize = () => {
    const filteredData = getFilteredData();
    return filteredData.reduce((sum, item) => sum + (parseFloat(item.size) || 0), 0);
  };

  const getTotalUsed = () => {
    const filteredData = getFilteredData();
    return filteredData.reduce((sum, item) => sum + (parseFloat(item.used) || 0), 0);
  };

  const getTotalAvailable = () => {
    const filteredData = getFilteredData();
    return filteredData.reduce((sum, item) => sum + (parseFloat(item.available) || 0), 0);
  };

  const getAverageUsage = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return 0;
    const totalUsage = filteredData.reduce((sum, item) => sum + (parseFloat(item.use_percent) || 0), 0);
    return totalUsage / filteredData.length;
  };

  const generateChartData = (chartType) => {
    let dataToUse = isFiltered ? filteredZfsData : zfsData;
    
    // Filtre seçimi varsa sadece seçili filesystem'i kullan
    if (selectedFilesystem !== 'all') {
      dataToUse = dataToUse.filter(item => item.filesystem === selectedFilesystem);
    }
    
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
      
      return {
        time: time.toISOString(),
        value: value,
        label: time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        originalData: item
      };
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
                  <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-700">Aktif</span>
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
                            disabled={zfsData.length === 0}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel'e Aktar
                          </button>
                          <button
                            onClick={exportToPDF}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                            disabled={zfsData.length === 0}
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
                            disabled={false}
                            className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Yenile
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
                          {sortedData.length > 0 ? (
                            sortedData.map((row, index) => (
                                <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                 <td 
                                   className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium cursor-pointer hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                   onClick={() => handleFilesystemClick(row.filesystem)}
                                   title="Grafik sekmesinde bu filesystem'i göster"
                                 >
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
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="px-4 py-4 text-center text-gray-400">
                                <div className="text-sm">Veri yükleniyor...</div>
                              </td>
                            </tr>
                          )}
                             </tbody>
                             </table>
                           </div>
                         </div>
                    </div>
                  )}

                  {/* Grafik Sekmesi */}
                  {activeTab === 'chart' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-gray-800">ZFS Filesystem Performans Grafikleri</h4>
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-gray-700">Filesystem:</label>
                          <select
                            value={selectedFilesystem}
                            onChange={handleFilesystemChange}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="all">Tümü</option>
                            {zfsData.length > 0 && [...new Set(zfsData.map(item => item.filesystem))].map((filesystem, index) => (
                              <option key={index} value={filesystem}>
                                {filesystem}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
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
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openInfo('size');
                               }}
                               className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
                             >
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
                              {formatSize(getTotalSize())}
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
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openInfo('used');
                               }}
                               className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
                             >
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
                              {formatSize(getTotalUsed())}
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
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openInfo('available');
                               }}
                               className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
                             >
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
                              {formatSize(getTotalAvailable())}
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
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openInfo('use_percent');
                               }}
                               className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
                             >
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
                              getAverageUsage() < 60 ? 'bg-green-100 text-green-800' :
                              getAverageUsage() < 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {getAverageUsage().toFixed(1)}%
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
                            {(() => {
                              const dataToUse = isFiltered ? filteredZfsData : zfsData;
                              if (dataToUse.length === 0) {
                                return (
                                  <>
                                    <p className="text-gray-700 font-medium">
                                      {new Date().toLocaleDateString('tr-TR')}
                                    </p>
                                    <p className="text-blue-600 text-sm">
                                      {new Date().toLocaleTimeString('tr-TR')}
                                    </p>
                                  </>
                                );
                              }
                              
                              // En son verinin timestamp'ini bul
                              const latestData = dataToUse.reduce((latest, current) => {
                                const currentTime = new Date(current.timestamp || current.created_at || current.updated_at || 0);
                                const latestTime = new Date(latest.timestamp || latest.created_at || latest.updated_at || 0);
                                return currentTime > latestTime ? current : latest;
                              });
                              
                              const lastUpdateTime = new Date(latestData.timestamp || latestData.created_at || latestData.updated_at || new Date());
                              
                              return (
                                <>
                                  <p className="text-gray-700 font-medium">
                                    {lastUpdateTime.toLocaleDateString('tr-TR')}
                                  </p>
                                  <p className="text-blue-600 text-sm">
                                    {lastUpdateTime.toLocaleTimeString('tr-TR')}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
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
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Normal Eşik</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue="50"
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
                              <span className="text-sm text-gray-600">Webhook bildirimi</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Disk Kullanım Eşikleri</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Kritik Disk Kullanımı</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue="95"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Uyarı Disk Kullanımı</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue="85"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Zaman Ayarları</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Kontrol Aralığı (dakika)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue="5"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Bildirim Gecikmesi (dk)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue="2"
                              />
                            </div>
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
             <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

                 {/* Sekmeler */}
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
                       <span className="mr-2">📈</span>Grafik
                     </button>
                     <button
                       onClick={() => setChartTab('threshold')}
                       className={`py-2 px-1 border-b-2 font-medium text-sm ${
                         chartTab === 'threshold'
                           ? 'border-blue-500 text-blue-600'
                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                       }`}
                     >
                       <span className="mr-2">⚙️</span>Threshold
                     </button>
                   </nav>
                 </div>

                 {/* Grafik İçeriği */}
                 {chartTab === 'chart' && (
                   <>
                     {chartData.length > 0 ? (
                       <div className="space-y-4">
                         {/* Grafik Başlığı */}
                         <div className="flex justify-between items-center mb-6">
                           <h4 className="text-lg font-semibold text-gray-800">
                             {selectedChart === 'size' && 'Filesystem Size - Zaman Serisi Grafiği'}
                             {selectedChart === 'used' && 'Used Space - Zaman Serisi Grafiği'}
                             {selectedChart === 'available' && 'Available Space - Zaman Serisi Grafiği'}
                             {selectedChart === 'use_percent' && 'Usage Percentage - Zaman Serisi Grafiği'}
                           </h4>
                           <div className="flex space-x-2">
                             <button
                               onClick={() => generateChartData(selectedChart)}
                               className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                             >
                               Yenile
                             </button>
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

                         {/* Grafik İstatistikleri */}
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                           <div className="bg-gray-50 rounded-lg p-4">
                             <div className="text-sm text-gray-600">Maksimum</div>
                             <div className="text-2xl font-bold text-gray-900">
                               {selectedChart === 'use_percent' 
                                 ? `${Math.max(...chartData.map(item => item.value)).toFixed(1)}%`
                                 : formatSize(Math.max(...chartData.map(item => item.value)))
                               }
                             </div>
                             <div className="text-xs text-gray-500 mt-1">
                               {(() => {
                                 const maxIndex = chartData.findIndex(item => item.value === Math.max(...chartData.map(item => item.value)));
                                 return chartData[maxIndex]?.label || '-';
                               })()}
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
                             <div className="text-xs text-gray-500 mt-1">
                               {(() => {
                                 const minIndex = chartData.findIndex(item => item.value === Math.min(...chartData.map(item => item.value)));
                                 return chartData[minIndex]?.label || '-';
                               })()}
                             </div>
                           </div>
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
                             <div className="text-sm text-gray-600">Veri Noktası</div>
                             <div className="text-2xl font-bold text-gray-900">
                               {chartData.length}
                             </div>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                         <div className="text-center">
                           <div className="text-4xl mb-4">📊</div>
                           <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                           <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
                         </div>
                       </div>
                     )}
                   </>
                 )}

                 {/* Threshold Sekmesi */}
                 {chartTab === 'threshold' && (
                   <div className="space-y-6">
                     <h4 className="text-lg font-semibold text-gray-800">
                       {selectedChart === 'size' && 'Filesystem Size Threshold Ayarları'}
                       {selectedChart === 'used' && 'Used Space Threshold Ayarları'}
                       {selectedChart === 'available' && 'Available Space Threshold Ayarları'}
                       {selectedChart === 'use_percent' && 'Usage Percentage Threshold Ayarları'}
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-gray-50 rounded-lg p-6">
                         <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                         <div className="space-y-3">
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-gray-600">Kritik Eşik</span>
                             <input 
                               type="number" 
                               className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                               defaultValue={
                                 selectedChart === 'size' ? "1000000000" :
                                 selectedChart === 'used' ? "800000000" :
                                 selectedChart === 'available' ? "200000000" :
                                 selectedChart === 'use_percent' ? "90" : "90"
                               }
                             />
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-gray-600">Uyarı Eşiği</span>
                             <input 
                               type="number" 
                               className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                               defaultValue={
                                 selectedChart === 'size' ? "800000000" :
                                 selectedChart === 'used' ? "600000000" :
                                 selectedChart === 'available' ? "400000000" :
                                 selectedChart === 'use_percent' ? "75" : "75"
                               }
                             />
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-gray-600">Bilgi Eşiği</span>
                             <input 
                               type="number" 
                               className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                               defaultValue={
                                 selectedChart === 'size' ? "600000000" :
                                 selectedChart === 'used' ? "400000000" :
                                 selectedChart === 'available' ? "600000000" :
                                 selectedChart === 'use_percent' ? "60" : "60"
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
         )}

         {/* Info Modalı */}
         {infoModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
             <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="p-6">
                 {/* Info Modal Header */}
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-bold text-gray-800">
                     {infoModal === 'size' && 'Filesystem Size Hakkında'}
                     {infoModal === 'used' && 'Used Space Hakkında'}
                     {infoModal === 'available' && 'Available Space Hakkında'}
                     {infoModal === 'use_percent' && 'Usage Percentage Hakkında'}
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
                   {/* Filesystem Size Info */}
                   {infoModal === 'size' && (
                     <div className="space-y-4">
                       <div className="bg-blue-50 rounded-lg p-4">
                         <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                         <p className="text-blue-800 text-sm">
                           Filesystem Size, ZFS dosya sisteminin toplam kapasitesini gösterir. 
                           Bu metrik, dosya sisteminin ne kadar alan kullanabileceğini belirtir.
                         </p>
                       </div>
                       <div className="bg-yellow-50 rounded-lg p-4">
                         <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                         <p className="text-yellow-800 text-sm">
                           Dosya sistemi boyutu, sistemin ne kadar veri saklayabileceğini belirler. 
                           Yetersiz boyut, veri kaybına ve sistem performans sorunlarına neden olabilir.
                         </p>
                       </div>
                     </div>
                   )}

                   {/* Used Space Info */}
                   {infoModal === 'used' && (
                     <div className="space-y-4">
                       <div className="bg-blue-50 rounded-lg p-4">
                         <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                         <p className="text-blue-800 text-sm">
                           Used Space, ZFS dosya sisteminde gerçekten kullanılan alan miktarını gösterir. 
                           Bu metrik, dosyalar ve metadata için ayrılan toplam alanı belirtir.
                         </p>
                       </div>
                       <div className="bg-yellow-50 rounded-lg p-4">
                         <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                         <p className="text-yellow-800 text-sm">
                           Yüksek kullanım oranı, dosya sistemi doluluk sorunlarına işaret eder. 
                           Bu durum sistem performansını düşürür ve yeni veri yazma işlemlerini engelleyebilir.
                         </p>
                       </div>
                     </div>
                   )}

                   {/* Available Space Info */}
                   {infoModal === 'available' && (
                     <div className="space-y-4">
                       <div className="bg-blue-50 rounded-lg p-4">
                         <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                         <p className="text-blue-800 text-sm">
                           Available Space, ZFS dosya sisteminde kullanılabilir kalan alan miktarını gösterir. 
                           Bu metrik, yeni veri yazmak için ne kadar alan kaldığını belirtir.
                         </p>
                       </div>
                       <div className="bg-yellow-50 rounded-lg p-4">
                         <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                         <p className="text-yellow-800 text-sm">
                           Yetersiz kullanılabilir alan, yeni dosya oluşturma işlemlerini engelleyebilir. 
                           Bu durum uygulamaların çalışmasını durdurabilir ve sistem hatalarına neden olabilir.
                         </p>
                       </div>
                     </div>
                   )}

                   {/* Usage Percentage Info */}
                   {infoModal === 'use_percent' && (
                     <div className="space-y-4">
                       <div className="bg-blue-50 rounded-lg p-4">
                         <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                         <p className="text-blue-800 text-sm">
                           Usage Percentage, ZFS dosya sisteminin ne kadarının kullanıldığını yüzde olarak gösterir. 
                           Bu metrik, toplam kapasiteye göre kullanım oranını belirtir.
                         </p>
                       </div>
                       <div className="bg-yellow-50 rounded-lg p-4">
                         <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                         <p className="text-yellow-800 text-sm">
                           Yüksek kullanım yüzdesi, dosya sisteminin dolmakta olduğunu gösterir. 
                           Bu durum sistem performansını düşürür ve veri kaybı riskini artırır.
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

export default USSPage;
