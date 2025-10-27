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
    if (columnName === 'timestamp' || columnName === 'system_name' || columnName === 'server_name') {
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
      const response = await databaseAPI.getMainviewStorageCsasum();
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
      const response = await databaseAPI.getMainviewStorageFrminfoCenter();
      if (response.data.success) {
        setFrminfoCenterData(response.data.data);
        toast.success(`FRMINFO Center verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO Center veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('FRMINFO Center veri yüklenirken hata:', error);
      toast.error(`FRMINFO Center veri yüklenirken hata oluştu: ${error.message}`);
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
      const response = await databaseAPI.getMainviewStorageFrminfoHighVirtual();
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
      const response = await databaseAPI.getMainviewStoragesysfrmiz();
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
      const response = await databaseAPI.checkTableExistsCsasum();
      setCsasumTableInfo(response.data);
    } catch (error) {
      console.error('CSASUM tablo kontrolü hatası:', error);
    }
  };

  const checkFrminfoCenterTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsFrminfoCenter();
      setFrminfoCenterTableInfo(response.data);
    } catch (error) {
      console.error('FRMINFO Center tablo kontrolü hatası:', error);
    }
  };

  const checkFrminfoFixedTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsFrminfofixed();
      setFrminfoFixedTableInfo(response.data);
    } catch (error) {
      console.error('FRMINFO Fixed tablo kontrolü hatası:', error);
    }
  };

  const checkFrminfoHighVirtualTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsFrminfoHighVirtual();
      setFrminfoHighVirtualTableInfo(response.data);
    } catch (error) {
      console.error('FRMINFO High Virtual tablo kontrolü hatası:', error);
    }
  };

  const checkSysfrmizTable = async () => {
    try {
      const response = await databaseAPI.checkTableExistsSysfrmiz();
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
                      <h4 className="text-lg font-semibold text-gray-800">Grafik Görünümü</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">📈</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Grafik Görünümü</h3>
                        <p className="text-gray-600">
                          {activeModal} verilerinin grafik görünümü burada gösterilecek
                        </p>
                      </div>
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