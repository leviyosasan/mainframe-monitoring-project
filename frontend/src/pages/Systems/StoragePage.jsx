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
      const response = await databaseAPI.getMainviewStorageFrminfofixed();
      if (response.data.success) {
        setFrminfoFixedData(response.data.data);
        toast.success(`FRMINFO Fixed verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO Fixed veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('FRMINFO Fixed veri yüklenirken hata:', error);
      toast.error(`FRMINFO Fixed veri yüklenirken hata oluştu: ${error.message}`);
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
        {Object.values(row).map((value, cellIndex) => (
          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatNumber(value)}
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CSASUM Kartı */}
          <div onClick={() => openModal('CSASUM')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6 mx-auto group-hover:bg-blue-200">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">CSASUM</h2>
                <p className="text-gray-500 text-sm font-medium">Common Storage Area Summary</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FRMINFO Center Kartı */}
          <div onClick={() => openModal('FRMINFO_CENTER')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-6 mx-auto group-hover:bg-green-200">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO Center</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information Center</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FRMINFO Fixed Kartı */}
          <div onClick={() => openModal('FRMINFO_FIXED')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6 mx-auto group-hover:bg-purple-200">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO Fixed</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information Fixed</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FRMINFO High Virtual Kartı */}
          <div onClick={() => openModal('FRMINFO_HIGH_VIRTUAL')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-orange-100 rounded-xl mb-6 mx-auto group-hover:bg-orange-200">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO High Virtual</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information High Virtual</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SYSFRMIZ Kartı */}
          <div onClick={() => openModal('SYSFRMIZ')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-6 mx-auto group-hover:bg-indigo-200">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">SYSFRMIZ</h2>
                <p className="text-gray-500 text-sm font-medium">System Frame Information</p>
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
                <div className="flex space-x-1 mb-6">
                  <button
                    onClick={() => setActiveTab('table')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      activeTab === 'table'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    📊 Veri Tablosu
                  </button>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      activeTab === 'chart'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    📈 Grafik
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'table' && (
                  <div className="space-y-6">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex flex-wrap items-center space-x-3">
                        <button
                          onClick={loadDataForActiveTab}
                          disabled={isLoading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Refresh Data
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => exportToExcel(getCurrentData(), `${activeModal}_data`)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export Excel
                        </button>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                    </div>
                  </div>
                )}

                {activeTab === 'chart' && (
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📈</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Grafik Görünümü</h3>
                      <p className="text-gray-600">
                        {activeModal} verilerinin grafik görünümü burada gösterilecek
                      </p>
                    </div>
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

export default StoragePage;