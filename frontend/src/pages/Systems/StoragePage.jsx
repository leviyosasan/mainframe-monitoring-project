import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StoragePage = () => {
  // State management
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [infoModal, setInfoModal] = useState(null);
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Storage data states
  const [csasumData, setCsasumData] = useState([]);
  const [frminfoCenterData, setFrminfoCenterData] = useState([]);
  const [frminfoFixedData, setFrminfoFixedData] = useState([]);
  const [frminfoHighVirtualData, setFrminfoHighVirtualData] = useState([]);
  const [sysfrmizData, setSysfrmizData] = useState([]);
  
  // Table info states
  const [csasumTableInfo, setCsasumTableInfo] = useState(null);
  const [frminfoCenterTableInfo, setFrminfoCenterTableInfo] = useState(null);
  const [frminfoFixedTableInfo, setFrminfoFixedTableInfo] = useState(null);
  const [frminfoHighVirtualTableInfo, setFrminfoHighVirtualTableInfo] = useState(null);
  const [sysfrmizTableInfo, setSysfrmizTableInfo] = useState(null);

  // Helper functions
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  const formatValue = (value, columnName) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // String sütunlar için özel format
    if (columnName === 'system_name' || columnName === 'server_name' || columnName === 'spgid') {
      return value.toString();
    }
    
    // Timestamp sütunu için özel format
    if (columnName === 'timestamp' || columnName === 'bmctime') {
      if (value instanceof Date) {
        return value.toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      // String olarak gelen tarih için
      if (typeof value === 'string') {
        const date = new Date(value);
        return date.toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      return value.toString();
    }
    
    // Tarih/saat sütunları için özel format
    if (columnName === 'bmctime') {
      if (value instanceof Date) {
        return value.toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      // String olarak gelen tarih için
      if (typeof value === 'string') {
        const date = new Date(value);
        return date.toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      return value.toString();
    }
    
    if (columnName === 'time') {
      if (value instanceof Date) {
        return value.toLocaleTimeString('tr-TR');
      }
      // String olarak gelen saat için
      if (typeof value === 'string') {
        const date = new Date(`2000-01-01T${value}`);
        return date.toLocaleTimeString('tr-TR');
      }
      return value.toString();
    }
    
    // Sayısal sütunlar için formatNumber kullan
    return formatNumber(value);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getCurrentData = () => {
    switch (activeModal) {
      case 'CSASUM': return csasumData;
      case 'FRMINFO_CENTER': return frminfoCenterData;
      case 'FRMINFO_FIXED': return frminfoFixedData;
      case 'FRMINFO_HIGH_VIRTUAL': return frminfoHighVirtualData;
      case 'SYSFRMIZ': return sysfrmizData;
      default: return [];
    }
  };

  const getCurrentTableInfo = () => {
    switch (activeModal) {
      case 'CSASUM': return csasumTableInfo;
      case 'FRMINFO_CENTER': return frminfoCenterTableInfo;
      case 'FRMINFO_FIXED': return frminfoFixedTableInfo;
      case 'FRMINFO_HIGH_VIRTUAL': return frminfoHighVirtualTableInfo;
      case 'SYSFRMIZ': return sysfrmizTableInfo;
      default: return null;
    }
  };

  // Data fetching functions
  const fetchCsasumData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewStorageCsasum({});
      if (response.data.success) {
        setCsasumData(response.data.data);
        toast.success(`CSASUM verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('CSASUM veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('CSASUM veri yüklenirken hata:', error);
      toast.error(`CSASUM veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFrminfoCenterData = async () => {
    setIsLoading(true);
    try {
      console.log('=== FRMINFO CENTER DEBUG ===');
      console.log('Calling API...');
      const response = await databaseAPI.getMainviewStorageFrminfoCenter({});
      console.log('Response received:', response);
      if (response.data.success) {
        setFrminfoCenterData(response.data.data);
        toast.success(`FRMINFO Center verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO Center veri yüklenirken hata oluştu');
      }
      console.log('=== END FRMINFO CENTER DEBUG ===');
    } catch (error) {
      console.error('FRMINFO Center veri yüklenirken hata:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      toast.error(`FRMINFO Center veri yüklenirken hata oluştu: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFrminfoFixedData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewStorageFrminfofixed({});
      console.log('=== FRONTEND DEBUG ===');
      console.log('Response:', response);
      console.log('Response data:', response.data);
      if (response.data.success) {
        console.log('Data received:', response.data.data);
        if (response.data.data.length > 0) {
          console.log('First row in frontend:', response.data.data[0]);
          console.log('First row keys:', Object.keys(response.data.data[0]));
          console.log('First row timestamp:', response.data.data[0].timestamp);
          console.log('First row system_name:', response.data.data[0].system_name);
          console.log('First row server_name:', response.data.data[0].server_name);
        }
        setFrminfoFixedData(response.data.data);
        toast.success(`FRMINFO Fixed verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO Fixed veri yüklenirken hata oluştu');
      }
      console.log('=== END FRONTEND DEBUG ===');
    } catch (error) {
      console.error('FRMINFO Fixed veri yüklenirken hata:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`FRMINFO Fixed veri yüklenirken hata oluştu: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFrminfoHighVirtualData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewStorageFrminfoHighVirtual({});
      if (response.data.success) {
        setFrminfoHighVirtualData(response.data.data);
        toast.success(`FRMINFO High Virtual verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO High Virtual veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('FRMINFO High Virtual veri yüklenirken hata:', error);
      toast.error(`FRMINFO High Virtual veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSysfrmizData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewStoragesysfrmiz({});
      if (response.data.success) {
        setSysfrmizData(response.data.data);
        toast.success(`SYSFRMIZ verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('SYSFRMIZ veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('SYSFRMIZ veri yüklenirken hata:', error);
      toast.error(`SYSFRMIZ veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Table info checking functions
  const checkCsasumTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsCsasum({});
      setCsasumTableInfo(response.data);
    } catch (error) {
      console.error('CSASUM tablo kontrolü hatası:', error);
    }
  };

  const checkFrminfoCenterTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsFrminfoCenter({});
      setFrminfoCenterTableInfo(response.data);
    } catch (error) {
      console.error('FRMINFO Center tablo kontrolü hatası:', error);
    }
  };

  const checkFrminfoFixedTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsFrminfofixed({});
      setFrminfoFixedTableInfo(response.data);
    } catch (error) {
      console.error('FRMINFO Fixed tablo kontrolü hatası:', error);
    }
  };

  const checkFrminfoHighVirtualTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsFrminfoHighVirtual({});
      setFrminfoHighVirtualTableInfo(response.data);
    } catch (error) {
      console.error('FRMINFO High Virtual tablo kontrolü hatası:', error);
    }
  };

  const checkSysfrmizTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsSysfrmiz({});
      setSysfrmizTableInfo(response.data);
    } catch (error) {
      console.error('SYSFRMIZ tablo kontrolü hatası:', error);
    }
  };

  // Export function
  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Veriler Excel formatında indirildi');
  };

  // Tabs configuration
  const tabs = [
    { id: 'table', name: 'Tablo', icon: '📊' },
    { id: 'chart', name: 'Grafik', icon: '📈' },
    { id: 'threshold', name: 'Threshold', icon: '⚙️' }
  ];

  // Modal color system
  const getModalColor = (modal = activeModal) => {
    switch(modal) {
      case 'CSASUM': return 'blue';
      case 'FRMINFO_CENTER': return 'green';
      case 'FRMINFO_FIXED': return 'purple';
      case 'FRMINFO_HIGH_VIRTUAL': return 'orange';
      case 'SYSFRMIZ': return 'indigo';
      default: return 'blue';
    }
  };
  const modalColor = getModalColor();

  // Modal functions
  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table');
    setIsLoading(false);
    
    // Modal açıldığında veri çek
    if (modalType === 'CSASUM') {
      fetchCsasumData();
    } else if (modalType === 'FRMINFO_CENTER') {
      fetchFrminfoCenterData();
    } else if (modalType === 'FRMINFO_FIXED') {
      fetchFrminfoFixedData();
    } else if (modalType === 'FRMINFO_HIGH_VIRTUAL') {
      fetchFrminfoHighVirtualData();
    } else if (modalType === 'SYSFRMIZ') {
      fetchSysfrmizData();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const openChart = (chartType) => {
    setSelectedChart(chartType);
    setChartTab('chart');
    // Grafik veri setini seçilen karta göre hazırla
    const currentData = getCurrentData();
    if (currentData && currentData.length > 0) {
      setChartData(currentData.map(r => ({ 
        label: r.record_timestamp || r.created_at || r.updated_at, 
        value: Number(r[chartType]) || 0 
      })));
    }
  };

  const closeChart = () => {
    setSelectedChart(null);
    setActiveModal(null);
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

  const clearTimeFilter = () => {
    setIsFiltered(false);
    setFilteredData([]);
    toast.success('Zaman filtresi temizlendi');
  };

  const applyTimeFilter = () => {
    // Time filter logic here
    toast.success('Zaman filtresi uygulandı');
    setTimeFilterModal(false);
  };

  // Table rendering functions
  const renderTableHeaders = () => {
    const data = getCurrentData();
    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]);
    return (
      <tr>
        {headers.map((header, index) => (
          <th
            key={index}
            onClick={() => handleSort(header)}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          >
            <div className="flex items-center space-x-1">
              <span>{header}</span>
              {sortColumn === header && (
                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
          </th>
        ))}
      </tr>
    );
  };

  const renderTableRows = () => {
    const data = getCurrentData();
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan="100%" className="px-6 py-4 text-center text-gray-500">
            Veri bulunamadı
          </td>
        </tr>
      );
    }

    return data.map((row, index) => (
      <tr key={index} className="hover:bg-gray-50">
        {Object.entries(row).map(([columnName, value], cellIndex) => (
          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatValue(value, columnName)}
          </td>
        ))}
      </tr>
    ));
  };

  // Load data function
  const loadDataForActiveTab = () => {
    if (activeModal === 'CSASUM') {
      fetchCsasumData();
    } else if (activeModal === 'FRMINFO_CENTER') {
      fetchFrminfoCenterData();
    } else if (activeModal === 'FRMINFO_FIXED') {
      fetchFrminfoFixedData();
    } else if (activeModal === 'FRMINFO_HIGH_VIRTUAL') {
      fetchFrminfoHighVirtualData();
    } else if (activeModal === 'SYSFRMIZ') {
      fetchSysfrmizData();
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Storage Management
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CSASUM Kartı */}
          <div onClick={() => openModal('CSASUM')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 mx-auto group-hover:bg-blue-200">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">CSASUM</h2>
                <p className="text-gray-500 text-sm font-medium">Common Storage Area Summary</p>
                <div className="mt-4 flex items-center justify-center">
                  {csasumData.length > 0 ? (
                    <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs font-medium text-green-800">Aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">Pasif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FRMINFO Center Kartı */}
          <div onClick={() => openModal('FRMINFO_CENTER')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 mx-auto group-hover:bg-green-200">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO Center</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information Center</p>
                <div className="mt-4 flex items-center justify-center">
                  {frminfoCenterData.length > 0 ? (
                    <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs font-medium text-green-800">Aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">Pasif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FRMINFO Fixed Kartı */}
          <div onClick={() => openModal('FRMINFO_FIXED')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 mx-auto group-hover:bg-purple-200">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO Fixed</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information Fixed</p>
                <div className="mt-4 flex items-center justify-center">
                  {frminfoFixedData.length > 0 ? (
                    <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs font-medium text-green-800">Aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">Pasif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FRMINFO High Virtual Kartı */}
          <div onClick={() => openModal('FRMINFO_HIGH_VIRTUAL')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4 mx-auto group-hover:bg-orange-200">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO High Virtual</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information High Virtual</p>
                <div className="mt-4 flex items-center justify-center">
                  {frminfoHighVirtualData.length > 0 ? (
                    <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs font-medium text-green-800">Aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">Pasif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SYSFRMIZ Kartı */}
          <div onClick={() => openModal('SYSFRMIZ')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4 mx-auto group-hover:bg-indigo-200">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">SYSFRMIZ</h2>
                <p className="text-gray-500 text-sm font-medium">System Frame Information</p>
                <div className="mt-4 flex items-center justify-center">
                  {sysfrmizData.length > 0 ? (
                    <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs font-medium text-green-800">Aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">Pasif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MODALLAR --- */}

        {/* Ana Modal (Tüm tipler için, basit yapı) */}
        {activeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-8xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header (Dinamik) */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'CSASUM' && 'CPU Performans'}
                    {activeModal === 'FRMINFO_CENTER' && 'FRMINFO Center Yönetimi'}
                    {activeModal === 'FRMINFO_FIXED' && 'FRMINFO Fixed Yönetimi'}
                    {activeModal === 'FRMINFO_HIGH_VIRTUAL' && 'FRMINFO High Virtual Yönetimi'}
                    {activeModal === 'SYSFRMIZ' && 'SYSFRMIZ Yönetimi'}
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
                           className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                              activeTab === tab.id
                              ? `border-blue-500 text-blue-600` // Dinamik renk
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
                        <h4 className="text-lg font-semibold text-gray-800">Veri Tablosu</h4>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => exportToExcel(getCurrentData(), activeModal)}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                            disabled={isLoading || getCurrentData().length === 0}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel'e Aktar
                          </button>
                          <button
                            onClick={() => exportToExcel(getCurrentData(), activeModal)}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                            disabled={isLoading || getCurrentData().length === 0}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF'e Aktar
                          </button>
                          <button
                            onClick={openTimeFilter}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Zaman Filtresi
                          </button>
                          <button
                            onClick={loadDataForActiveTab}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Yükleniyor...' : 'Yenile'}
                          </button>
                        </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                            <span className="text-gray-600">Veriler yükleniyor...</span>
                          </div>
                        ) : getCurrentData().length === 0 ? (
                          <div className="flex items-center justify-center py-12">
                            <span className="text-gray-500">Veri bulunamadı</span>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                {renderTableHeaders()}
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {renderTableRows()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grafik Sekmesi */}
                  {activeTab === 'chart' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Performans Grafikleri</h4>

                      {/* CSASUM için Grafik Kartları */}
                      {activeModal === 'CSASUM' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* CSA In Use Percent */}
                          <div onClick={() => openChart('csa_in_use_percent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csa_in_use_percent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CSA In Use %</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.csa_in_use_percent > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.csa_in_use_percent ? `${formatNumber(getCurrentData()[0].csa_in_use_percent)}%` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* ECSA In Use Percent */}
                          <div onClick={() => openChart('ecsa_in_use_percent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-blue-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ecsa_in_use_percent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">ECSA In Use %</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.ecsa_in_use_percent > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.ecsa_in_use_percent ? `${formatNumber(getCurrentData()[0].ecsa_in_use_percent)}%` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* RUCSA In Use Percent */}
                          <div onClick={() => openChart('rucsa_in_use_percent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-purple-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('rucsa_in_use_percent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">RUCSA In Use %</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.rucsa_in_use_percent > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.rucsa_in_use_percent ? `${formatNumber(getCurrentData()[0].rucsa_in_use_percent)}%` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SQA In Use Percent */}
                          <div onClick={() => openChart('sqa_in_use_percent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-orange-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sqa_in_use_percent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SQA In Use %</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.sqa_in_use_percent > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.sqa_in_use_percent ? `${formatNumber(getCurrentData()[0].sqa_in_use_percent)}%` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* Total CS Used Percent */}
                          <div onClick={() => openChart('total_cs_used_percent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-red-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('total_cs_used_percent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Total CS Used %</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.total_cs_used_percent > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.total_cs_used_percent ? `${formatNumber(getCurrentData()[0].total_cs_used_percent)}%` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* High Shared Storage Used Percent */}
                          <div onClick={() => openChart('percent_used_high_shared_storage')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-indigo-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('percent_used_high_shared_storage'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">High Shared Storage %</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.percent_used_high_shared_storage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.percent_used_high_shared_storage ? `${formatNumber(getCurrentData()[0].percent_used_high_shared_storage)}%` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-blue-50 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg">Last Update</h5>
                              <div className="text-sm text-blue-700 mt-1">
                                {getCurrentData()?.[0]?.created_at ? (
                                  <>
                                    <div>{new Date(getCurrentData()[0].created_at).toLocaleDateString('tr-TR')}</div>
                                    <div>{new Date(getCurrentData()[0].created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</div>
                                  </>
                                ) : (
                                  <>
                                    <div>22.10.2025</div>
                                    <div>10:55:00</div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRMINFO_CENTER için Grafik Kartları */}
                      {activeModal === 'FRMINFO_CENTER' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* CPU Busy% */}
                          <div onClick={() => openChart('cpuBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                45.00%
                              </div>
                            </div>
                          </div>

                          {/* zIIP Busy% */}
                          <div onClick={() => openChart('ziipBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ziipBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                12.00%
                              </div>
                            </div>
                          </div>

                          {/* CPU Utilization% */}
                          <div onClick={() => openChart('cpuUtilizationPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuUtilizationPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Utilization%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                1.00%
                              </div>
                            </div>
                          </div>

                          {/* I/O Rate% */}
                          <div onClick={() => openChart('ioRatePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ioRatePercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">I/O Rate%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                154.00%
                              </div>
                            </div>
                          </div>

                          {/* DASD Busy% */}
                          <div onClick={() => openChart('dasdBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('dasdBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">DASD Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                123.00%
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-blue-50 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg">Last Update</h5>
                              <div className="text-sm text-blue-700 mt-1">
                                <div>22.10.2025</div>
                                <div>10:55:00</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRMINFO_FIXED için Grafik Kartları */}
                      {activeModal === 'FRMINFO_FIXED' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* CPU Busy% */}
                          <div onClick={() => openChart('cpuBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                45.00%
                              </div>
                            </div>
                          </div>

                          {/* zIIP Busy% */}
                          <div onClick={() => openChart('ziipBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ziipBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                12.00%
                              </div>
                            </div>
                          </div>

                          {/* CPU Utilization% */}
                          <div onClick={() => openChart('cpuUtilizationPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuUtilizationPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Utilization%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                1.00%
                              </div>
                            </div>
                          </div>

                          {/* I/O Rate% */}
                          <div onClick={() => openChart('ioRatePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ioRatePercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">I/O Rate%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                154.00%
                              </div>
                            </div>
                          </div>

                          {/* DASD Busy% */}
                          <div onClick={() => openChart('dasdBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('dasdBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">DASD Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                123.00%
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-blue-50 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg">Last Update</h5>
                              <div className="text-sm text-blue-700 mt-1">
                                <div>22.10.2025</div>
                                <div>10:55:00</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRMINFO_HIGH_VIRTUAL için Grafik Kartları */}
                      {activeModal === 'FRMINFO_HIGH_VIRTUAL' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* CPU Busy% */}
                          <div onClick={() => openChart('cpuBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                45.00%
                              </div>
                            </div>
                          </div>

                          {/* zIIP Busy% */}
                          <div onClick={() => openChart('ziipBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ziipBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                12.00%
                              </div>
                            </div>
                          </div>

                          {/* CPU Utilization% */}
                          <div onClick={() => openChart('cpuUtilizationPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuUtilizationPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Utilization%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                1.00%
                              </div>
                            </div>
                          </div>

                          {/* I/O Rate% */}
                          <div onClick={() => openChart('ioRatePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ioRatePercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">I/O Rate%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                154.00%
                              </div>
                            </div>
                          </div>

                          {/* DASD Busy% */}
                          <div onClick={() => openChart('dasdBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('dasdBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">DASD Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                123.00%
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-blue-50 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg">Last Update</h5>
                              <div className="text-sm text-blue-700 mt-1">
                                <div>22.10.2025</div>
                                <div>10:55:00</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SYSFRMIZ için Grafik Kartları */}
                      {activeModal === 'SYSFRMIZ' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* CPU Busy% */}
                          <div onClick={() => openChart('cpuBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                45.00%
                              </div>
                            </div>
                          </div>

                          {/* zIIP Busy% */}
                          <div onClick={() => openChart('ziipBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ziipBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">zIIP Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                12.00%
                              </div>
                            </div>
                          </div>

                          {/* CPU Utilization% */}
                          <div onClick={() => openChart('cpuUtilizationPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('cpuUtilizationPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Utilization%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                1.00%
                              </div>
                            </div>
                          </div>

                          {/* I/O Rate% */}
                          <div onClick={() => openChart('ioRatePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('ioRatePercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">I/O Rate%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                154.00%
                              </div>
                            </div>
                          </div>

                          {/* DASD Busy% */}
                          <div onClick={() => openChart('dasdBusyPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <div className="absolute top-3 left-3 w-3 h-3 bg-green-400 rounded-sm"></div>
                            <button onClick={(e) => { e.stopPropagation(); openInfo('dasdBusyPercent'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">DASD Busy%</h5>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                123.00%
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-blue-50 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg">Last Update</h5>
                              <div className="text-sm text-blue-700 mt-1">
                                <div>22.10.2025</div>
                                <div>10:55:00</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Threshold Sekmesi */}
                  {activeTab === 'threshold' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800">Threshold Ayarları</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">⚙️</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Threshold Ayarları</h3>
                        <p className="text-gray-600">
                          {activeModal} için threshold ayarları burada yapılacak
                        </p>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedChart} Grafiği
                  </h3>
                  <button
                    onClick={closeChart}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Grafik Tabları - Görseldeki gibi sadece 2 tab */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setChartTab('chart')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                      chartTab === 'chart'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Grafik
                  </button>
                  <button
                    onClick={() => setChartTab('threshold')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                      chartTab === 'threshold'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Threshold
                  </button>
                </div>

                <div className="min-h-[400px]">
                  {chartTab === 'chart' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-semibold text-gray-800">{selectedChart} - Zaman Serisi Grafiği</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openChart(selectedChart)}
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
                            <p className="text-gray-500 text-sm">Önce ilgili tablodan veri yükleyin</p>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const width = 1200; const height = 350; const left = 80; const bottom = 320; const top = 40;
                          const len = chartData.length;
                          const vals = chartData.map(d => Number(d.value) || 0);
                          let vMin = Math.min(...vals);
                          let vMax = Math.max(...vals);
                          if (!isFinite(vMin)) vMin = 0; if (!isFinite(vMax)) vMax = 100;
                          if (vMax === vMin) vMax = vMin + 10;
                          
                          // Y eksenini maksimum değere göre ayarla
                          const maxVal = Math.max(vMax, 100);
                          const minVal = 0;
                          const range = maxVal - minVal;
                          const step = range / 5;
                          
                          const yPos = (v) => bottom - ((v - minVal) / range) * (bottom - top);
                          const stepX = 1100 / Math.max(1, len - 1);
                          const xPos = (i) => left + i * stepX;
                          
                          const ticks = Array.from({ length: 6 }, (_, i) => minVal + (i * step));
                          const formatTick = (n) => {
                            const num = Number(n);
                            if (Math.abs(num) >= 1000000) return (num/1000000).toFixed(1)+'M';
                            if (Math.abs(num) >= 1000) return (num/1000).toFixed(1)+'K';
                            return num.toFixed(1);
                          };
                          
                          const areaD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ') + ` L ${xPos(len-1)},${bottom} L ${xPos(0)},${bottom} Z`;
                          const lineD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ');
                          
                          const criticalThreshold = 85;
                          const warningThreshold = 70;
                          const showThresholds = vMax > 50;
                          
                          return (
                            <>
                              <div className="h-96 w-full">
                                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                                  {/* Grid pattern */}
                                  <defs>
                                    <pattern id="grid-storage" width="40" height="35" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 35" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid-storage)" />
                                  
                                  {/* Y-axis labels */}
                                  {ticks.map((t, i) => (
                                    <g key={i}>
                                      <line x1={left} y1={yPos(t)} x2={width-20} y2={yPos(t)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                                      <text x="20" y={yPos(t) + 4} className="text-xs fill-gray-600 font-medium" textAnchor="end">
                                        {formatTick(t)}
                                      </text>
                                    </g>
                                  ))}
                                  
                                  {/* X-axis labels */}
                                  {chartData.filter((_,i)=> i % Math.max(1, Math.floor(len/10))===0).map((p,i)=> {
                                    const displayIndex = i * Math.max(1, Math.floor(len/10));
                                    return (
                                      <text key={i} x={xPos(Math.min(displayIndex, len-1))} y="345" className="text-xs fill-gray-600 font-medium" textAnchor="middle">
                                        {new Date(p.label).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}
                                      </text>
                                    );
                                  })}
                                  
                                  {/* Threshold lines */}
                                  {showThresholds && (
                                    <>
                                      <line x1={left} y1={yPos((criticalThreshold/100) * maxVal)} x2={width-20} y2={yPos((criticalThreshold/100) * maxVal)} stroke="#dc2626" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
                                      <text x={width-10} y={yPos((criticalThreshold/100) * maxVal) + 4} className="text-xs fill-red-600 font-medium" textAnchor="end">
                                        Kritik: {criticalThreshold}%
                                      </text>
                                      
                                      <line x1={left} y1={yPos((warningThreshold/100) * maxVal)} x2={width-20} y2={yPos((warningThreshold/100) * maxVal)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
                                      <text x={width-10} y={yPos((warningThreshold/100) * maxVal) + 4} className="text-xs fill-amber-600 font-medium" textAnchor="end">
                                        Uyarı: {warningThreshold}%
                                      </text>
                                    </>
                                  )}
                                  
                                  {/* Gradient area and line - Yeşil renk */}
                                  <defs>
                                    <linearGradient id="areaGradientStorage" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>
                                  
                                  <path d={areaD} fill="url(#areaGradientStorage)" />
                                  <path d={lineD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  
                                  {/* Data points */}
                                  {chartData.map((p,i)=> (
                                    <g key={i}>
                                      <circle cx={xPos(i)} cy={yPos(p.value)} r="5" fill="#10b981" stroke="white" strokeWidth="2">
                                        <title>{`${new Date(p.label).toLocaleString('tr-TR')}: ${p.value}`}</title>
                                      </circle>
                                    </g>
                                  ))}
                                </svg>
                              </div>

                              {/* Statistics - Görseldeki gibi */}
                              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg p-5 text-center shadow-sm border border-gray-200">
                                  <div className="text-3xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-600 font-semibold mt-1">Maksimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {(() => {
                                        const maxValue = Math.max(...chartData.map(d => d.value));
                                        const maxIndex = chartData.findIndex(d => d.value === maxValue);
                                        return new Date(chartData[maxIndex]?.label).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
                                      })()}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white rounded-lg p-5 text-center shadow-sm border border-gray-200">
                                  <div className="text-3xl font-bold text-gray-900">
                                    {chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(1) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-600 font-semibold mt-1">Minimum</div>
                                  {chartData.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {(() => {
                                        const minValue = Math.min(...chartData.map(d => d.value));
                                        const minIndex = chartData.findIndex(d => d.value === minValue);
                                        return new Date(chartData[minIndex]?.label).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
                                      })()}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white rounded-lg p-5 text-center shadow-sm border border-gray-200">
                                  <div className="text-3xl font-bold text-gray-900">
                                    {chartData.length > 0 ? (chartData.reduce((s, d) => s + d.value, 0) / chartData.length).toFixed(1) : '0'}
                                  </div>
                                  <div className="text-sm text-gray-600 font-semibold mt-1">Ortalama</div>
                                </div>
                                <div className="bg-white rounded-lg p-5 text-center shadow-sm border border-gray-200">
                                  <div className="text-3xl font-bold text-gray-900">{chartData.length}</div>
                                  <div className="text-sm text-gray-600 font-semibold mt-1">Veri Noktası</div>
                                </div>
                              </div>
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                  {chartTab === 'threshold' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800">{selectedChart} için Threshold Ayarları</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Kritik Eşik</span>
                              <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="90"/>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Uyarı Eşiği</span>
                              <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="75"/>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5>
                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" defaultChecked />
                              <span className="text-sm text-gray-600">E-posta</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="text-sm text-gray-600">SMS</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Kaydet</button>
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

export default StoragePage;