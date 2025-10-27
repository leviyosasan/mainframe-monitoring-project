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
    setActiveModal('chart');
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
                    {activeModal === 'CSASUM' && 'CSASUM Yönetimi'}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* CSA In Use Percent */}
                          <div onClick={() => openChart('csasumCsaInUsePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csasumCsaInUsePercent'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CSA In Use %</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.csa_in_use_percent ? `${formatNumber(getCurrentData()[0].csa_in_use_percent)}%` : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* ECSA In Use Percent */}
                          <div onClick={() => openChart('csasumEcsaInUsePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csasumEcsaInUsePercent'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">ECSA In Use %</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.ecsa_in_use_percent ? `${formatNumber(getCurrentData()[0].ecsa_in_use_percent)}%` : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Total CS Used Percent */}
                          <div onClick={() => openChart('csasumTotalCsUsedPercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csasumTotalCsUsedPercent'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Total CS Used %</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.total_cs_used_percent ? `${formatNumber(getCurrentData()[0].total_cs_used_percent)}%` : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Available Common Storage Percent */}
                          <div onClick={() => openChart('csasumAvailableCommonStoragePercent')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csasumAvailableCommonStoragePercent'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Available CS %</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.available_common_storage_percent ? `${formatNumber(getCurrentData()[0].available_common_storage_percent)}%` : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">
                                {getCurrentData()?.[0]?.timestamp ? new Date(getCurrentData()[0].timestamp).toLocaleString('tr-TR') : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRMINFO_CENTER için Grafik Kartları */}
                      {activeModal === 'FRMINFO_CENTER' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* SPISPC Average */}
                          <div onClick={() => openChart('frminfoCenterSpispcav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoCenterSpispcav'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPISPC Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spispcav ? formatNumber(getCurrentData()[0].spispcav) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* SPILPF Average */}
                          <div onClick={() => openChart('frminfoCenterSpilpfav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoCenterSpilpfav'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPILPF Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spilpfav ? formatNumber(getCurrentData()[0].spilpfav) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* SPICPF Average */}
                          <div onClick={() => openChart('frminfoCenterSpicpfav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoCenterSpicpfav'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPICPF Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spicpfav ? formatNumber(getCurrentData()[0].spicpfav) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* SPIQPC Average */}
                          <div onClick={() => openChart('frminfoCenterSpiqpcav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoCenterSpiqpcav'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPIQPC Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spiqpcav ? formatNumber(getCurrentData()[0].spiqpcav) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">
                                {getCurrentData()?.[0]?.bmctime ? new Date(getCurrentData()[0].bmctime).toLocaleString('tr-TR') : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRMINFO_FIXED için Grafik Kartları */}
                      {activeModal === 'FRMINFO_FIXED' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* SQA Average */}
                          <div onClick={() => openChart('frminfoFixedSqaAvg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoFixedSqaAvg'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SQA Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.sqa_avg ? formatNumber(getCurrentData()[0].sqa_avg) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* LPA Average */}
                          <div onClick={() => openChart('frminfoFixedLpaAvg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoFixedLpaAvg'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">LPA Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.lpa_avg ? formatNumber(getCurrentData()[0].lpa_avg) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* CSA Average */}
                          <div onClick={() => openChart('frminfoFixedCsaAvg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoFixedCsaAvg'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CSA Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.csa_avg ? formatNumber(getCurrentData()[0].csa_avg) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Fixed Percentage */}
                          <div onClick={() => openChart('frminfoFixedPercentage')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoFixedPercentage'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Fixed %</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.fixed_percentage ? `${formatNumber(getCurrentData()[0].fixed_percentage)}%` : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">
                                {getCurrentData()?.[0]?.timestamp ? new Date(getCurrentData()[0].timestamp).toLocaleString('tr-TR') : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRMINFO_HIGH_VIRTUAL için Grafik Kartları */}
                      {activeModal === 'FRMINFO_HIGH_VIRTUAL' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* HV Common Average */}
                          <div onClick={() => openChart('frminfoHighVirtualHvCommonAvg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoHighVirtualHvCommonAvg'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">HV Common Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.hv_common_avg ? formatNumber(getCurrentData()[0].hv_common_avg) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* HV Shared Average */}
                          <div onClick={() => openChart('frminfoHighVirtualHvSharedAvg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoHighVirtualHvSharedAvg'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">HV Shared Avg</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.hv_shared_avg ? formatNumber(getCurrentData()[0].hv_shared_avg) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* HV Common Max */}
                          <div onClick={() => openChart('frminfoHighVirtualHvCommonMax')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoHighVirtualHvCommonMax'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">HV Common Max</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.hv_common_max ? formatNumber(getCurrentData()[0].hv_common_max) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* HV Shared Max */}
                          <div onClick={() => openChart('frminfoHighVirtualHvSharedMax')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('frminfoHighVirtualHvSharedMax'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">HV Shared Max</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.hv_shared_max ? formatNumber(getCurrentData()[0].hv_shared_max) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">
                                {getCurrentData()?.[0]?.timestamp ? new Date(getCurrentData()[0].timestamp).toLocaleString('tr-TR') : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SYSFRMIZ için Grafik Kartları */}
                      {activeModal === 'SYSFRMIZ' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* SPL Average */}
                          <div onClick={() => openChart('sysfrmizSpl')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sysfrmizSpl'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPL</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spl ? formatNumber(getCurrentData()[0].spl) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* SPIUONLF */}
                          <div onClick={() => openChart('sysfrmizSpiuonlf')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sysfrmizSpiuonlf'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPIUONLF</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spiuonlf ? formatNumber(getCurrentData()[0].spiuonlf) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* SPIFINAV */}
                          <div onClick={() => openChart('sysfrmizSpifinav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sysfrmizSpifinav'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPIFINAV</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.spifinav ? formatNumber(getCurrentData()[0].spifinav) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* SPREFCNP */}
                          <div onClick={() => openChart('sysfrmizSprefcnp')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sysfrmizSprefcnp'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPREFCNP</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {getCurrentData()?.[0]?.sprefncp ? formatNumber(getCurrentData()[0].sprefncp) : <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </div>

                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">
                                {getCurrentData()?.[0]?.bmctime ? new Date(getCurrentData()[0].bmctime).toLocaleString('tr-TR') : '-'}
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
      </div>
    </div>
  );
};

export default StoragePage;