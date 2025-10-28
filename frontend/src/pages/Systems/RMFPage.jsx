import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

// CSS stilleri tanımı
const customStyles = `
  /* Pulse Subtle Animasyonu */
  @keyframes pulseSubtle {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.95;
      transform: scale(1.005);
    }
  }
  
  .pulse-subtle {
    animation: pulseSubtle 3s ease-in-out infinite;
  }
  
  /* Primary Renk Paleti CSS Değişkenleri */
  .rmf-primary-50 { background-color: #eff6ff; }
  .rmf-primary-100 { background-color: #dbeafe; }
  .rmf-primary-200 { background-color: #bfdbfe; }
  .rmf-primary-300 { background-color: #93c5fd; }
  .rmf-primary-400 { background-color: #60a5fa; }
  .rmf-primary-500 { background-color: #3b82f6; }
  .rmf-primary-600 { background-color: #2563eb; }
  .rmf-primary-700 { background-color: #1d4ed8; }
  .rmf-primary-800 { background-color: #1e40af; }
  .rmf-primary-900 { background-color: #1e3a8a; }
  
  /* Primary Text Renkleri */
  .rmf-text-primary-50 { color: #eff6ff; }
  .rmf-text-primary-100 { color: #dbeafe; }
  .rmf-text-primary-200 { color: #bfdbfe; }
  .rmf-text-primary-300 { color: #93c5fd; }
  .rmf-text-primary-400 { color: #60a5fa; }
  .rmf-text-primary-500 { color: #3b82f6; }
  .rmf-text-primary-600 { color: #2563eb; }
  .rmf-text-primary-700 { color: #1d4ed8; }
  .rmf-text-primary-800 { color: #1e40af; }
  .rmf-text-primary-900 { color: #1e3a8a; }
  
  /* Primary Border Renkleri */
  .rmf-border-primary-50 { border-color: #eff6ff; }
  .rmf-border-primary-100 { border-color: #dbeafe; }
  .rmf-border-primary-200 { border-color: #bfdbfe; }
  .rmf-border-primary-300 { border-color: #93c5fd; }
  .rmf-border-primary-400 { border-color: #60a5fa; }
  .rmf-border-primary-500 { border-color: #3b82f6; }
  .rmf-border-primary-600 { border-color: #2563eb; }
  .rmf-border-primary-700 { border-color: #1d4ed8; }
  .rmf-border-primary-800 { border-color: #1e40af; }
  .rmf-border-primary-900 { border-color: #1e3a8a; }
  
  /* Hover Durumları */
  .rmf-hover-primary-100:hover { background-color: #dbeafe; }
  .rmf-hover-primary-200:hover { background-color: #bfdbfe; }
  .rmf-hover-primary-500:hover { background-color: #3b82f6; }
  .rmf-hover-primary-600:hover { background-color: #2563eb; }
  .rmf-hover-primary-700:hover { background-color: #1d4ed8; }
`;

// Style tag'i head'e ekle (sadece bir kez)
if (typeof document !== 'undefined' && !document.getElementById('rmf-custom-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'rmf-custom-styles';
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const RMFPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [chartData, setChartData] = useState([]);
  const [infoModal, setInfoModal] = useState(null);
  
  // Optimized: Single object to store all data states
  const [data, setData] = useState({
    rmf_pgspp: [],
    rmf_ard: [],
    rmf_trx: [],
    rmf_asrm: [],
    rmf_srcs: [],
    rmf_asd: [],
    rmf_spag: [],
    cmf_dspcz: [],
    cmf_xcfsys: [],
    cmf_jcsa: [],
    cmf_xcfmbr: [],
    cmf_syscpc: []
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  
  // Helper functions
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  const formatValue = (value, columnName) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // TIME tipi sütunlar için özel kontrol (trx tablosunda 'time' sütunu TIME WITH TIME ZONE)
    if (columnName === 'time' && typeof value === 'string') {
      return value.toString(); // TIME formatını direkt göster
    }
    
    // Timestamp, bmctime, created_at, updated_at için tarih formatı
    if (columnName.includes('timestamp') || columnName === 'bmctime' || columnName === 'record_timestamp' || columnName === 'created_at' || columnName === 'updated_at') {
      try {
        return new Date(value).toLocaleString('tr-TR');
      } catch {
        return value.toString();
      }
    }
    
    // Sayısal değerler için formatla (RMF ARD için)
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    
    // Boolean değerler
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return value.toString();
  };

  // Optimized: API mapping
  const apiMapping = {
    rmf_pgspp: databaseAPI.getMainviewRmfPgspp,
    rmf_ard: databaseAPI.getMainviewRmfArd,
    rmf_trx: databaseAPI.getMainviewRmfTrx,
    rmf_asrm: databaseAPI.getMainviewRmfAsrm,
    rmf_srcs: databaseAPI.getMainviewRmfSrcs,
    rmf_asd: databaseAPI.getMainviewRmfAsd,
    rmf_spag: databaseAPI.getMainviewRmfSpag,
    cmf_dspcz: databaseAPI.getMainviewCmfDspcz,
    cmf_xcfsys: databaseAPI.getMainviewCmfXcfsys,
    cmf_jcsa: databaseAPI.getMainviewCmfJcsa,
    cmf_xcfmbr: databaseAPI.getMainviewCmfXcfmbr,
    cmf_syscpc: databaseAPI.getMainviewCmfSyscpc
  };

  // Column name mapping for display
  const columnMapping = {
    rmf_pgspp: {
      'id': 'ID',
      'pdgnum': 'Page Data Set Number',
      'pdgtypc': 'Page Data Set Type',
      'pdgser': 'Volume Serial Number',
      'pdredevc': 'Device Number',
      'pdgstat': 'Page Data Set Status',
      'pdislupc': 'Page Slot In Use Percentage',
      'pdipxtav': 'Average Page Transfer Time',
      'pdipiort': 'I/O Request Rate',
      'pdippbav': 'Average Pages per Burst',
      'pdgvioc': 'VIO Eligibility',
      'pdibsyPC': 'In Use Percentage',
      'PDIBSYPC': 'In Use Percentage',
      'pdgdsn': 'Page Data Set Name',
      'timestamp': 'Timestamp'
    },
    rmf_ard: {
      'jobname': 'JOBNAME',
      'device_connection_time_seconds': 'Device Connection Time for the Job',
      'current_fixed_frames_16m': 'Current Fixed Frames < 16M',
      'current_fixed_frame_count': 'Current Fixed Frame Count',
      'cross_memory_register': 'Cross Memory Register',
      'session_srm_service_absorption_rate': 'Session SRM Service Absorption Rate',
      'session_cpu_seconds_tcb_mode': 'Session CPU Seconds in TCB Mode',
      'cpu_seconds': 'CPU Seconds',
      'excp_rate_per_second': 'EXCP Rate-Per-Second',
      'swap_page_rate_per_second': 'Swap Page Rate-Per-Second',
      'interval_lpa_page_rate': 'Interval LPA Page Rate',
      'interval_csa_page_in_rate': 'Interval CSA Page-In Rate',
      'realtime_non_vio_page_rate': 'Realtime Non-VIO Page Rate',
      'private_vio_hiperspace_page_rate': 'Private VIO and Hiperspace Page Rate',
      'created_at': 'Created At',
      'updated_at': 'Updated At'
    },
    rmf_trx: {
      'mxgcnm': 'Service Class Name',
      'mxgcpn': 'Period Number',
      'mxgtypc': 'WLM Type',
      'mxiasac': 'Average Number of AS Counted',
      'mxixavg': 'Average Active Time',
      'mxirate': 'Transaction Rate',
      'mxircp': 'Transactions Completed',
      'bmctime': 'BMC Time',
      'time': 'Time'
    }
  };

  // Columns to hide from display
  const hiddenColumns = {
    rmf_ard: ['id'],
    rmf_pgspp: [],
    rmf_trx: ['id']
  };

  const getDisplayName = (columnName, modalType) => {
    // PDIBSYPC için kapsamlı kontrol - tüm olası formatlar
    if (columnName && typeof columnName === 'string') {
      const upperColumnName = columnName.toUpperCase();
      if (upperColumnName === 'PDIBSYPC' || 
          upperColumnName === 'PDIBSYPC' || 
          upperColumnName.includes('PDIBSYPC') ||
          columnName === 'pdibsyPC' ||
          columnName.toLowerCase().includes('pdibsypc')) {
        return 'In Use Percentage';
      }
    }
    
    if (columnMapping[modalType] && columnMapping[modalType][columnName]) {
      return columnMapping[modalType][columnName];
    }
    return columnName;
  };

  const getCurrentRawData = () => {
    return activeModal ? data[activeModal] || [] : [];
  };

  const getCurrentData = () => {
    return isFiltered ? filteredData : getCurrentRawData();
  };

  // Sıralanmış veri - filtrelenmiş veri varsa on>, kullan
  const dataToUse = isFiltered ? filteredData : getCurrentRawData();
  const sortedData = [...dataToUse].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = parseFloat(a[sortColumn]) || 0;
    const bValue = parseFloat(b[sortColumn]) || 0;
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // Optimized: Single generic fetch function
  const fetchData = async (modalType) => {
    if (!apiMapping[modalType]) {
      toast.error('Geçersiz kart seçimi');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiMapping[modalType]();
      if (response.data.success) {
        setData(prev => ({ ...prev, [modalType]: response.data.data }));
        toast.success(`Veriler yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('Veri bulunamadı');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadDataForActiveModal = () => {
    if (activeModal) {
      fetchData(activeModal);
    }
  };

  // OLD DATA FETCHING FUNCTIONS - TO BE REMOVED
  /* Data fetching functions
  const fetchRmfPgsppData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfPgspp();
      if (response.data.success) {
        setRmfPgsppData(response.data.data);
        toast.success(`PGSPP verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('Veri bulunamadı');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRmfArdData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfArd();
      if (response.data.success) {
        setRmfArdData(response.data.data);
        toast.success(`ARD verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRmfTrxData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfTrx();
      if (response.data.success) {
        setRmfTrxData(response.data.data);
        toast.success(`TRX verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRmfAsrmData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfAsrm();
      if (response.data.success) {
        setRmfAsrmData(response.data.data);
        toast.success(`ASRM verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRmfSrcsData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfSrcs();
      if (response.data.success) {
        setRmfSrcsData(response.data.data);
        toast.success(`SRCS verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRmfAsdData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfAsd();
      if (response.data.success) {
        setRmfAsdData(response.data.data);
        toast.success(`ASD verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRmfSpagData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewRmfSpag();
      if (response.data.success) {
        setRmfSpagData(response.data.data);
        toast.success(`SPAG verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCmfDspczData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewCmfDspcz();
      if (response.data.success) {
        setCmfDspczData(response.data.data);
        toast.success(`DSPCZ verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCmfXcfsysData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewCmfXcfsys();
      if (response.data.success) {
        setCmfXcfsysData(response.data.data);
        toast.success(`XCFSYS verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCmfJcsaData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewCmfJcsa();
      if (response.data.success) {
        setCmfJcsaData(response.data.data);
        toast.success(`JCSA verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCmfXcfmbrData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewCmfXcfmbr();
      if (response.data.success) {
        setCmfXcfmbrData(response.data.data);
        toast.success(`XCFMBR verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCmfSyscpcData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewCmfSyscpc();
      if (response.data.success) {
        setCmfSyscpcData(response.data.data);
        toast.success(`SYSCPC verileri yüklendi (${response.data.data.length} kayıt)`);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  */

  const tabs = [
    { id: 'table', name: 'Tablo', icon: '📊' },
    { id: 'chart', name: 'Grafik', icon: '📈' }
  ];

  const handleSort = (column) => {
    // RMF ARD için özel kurallar
    if (activeModal === 'rmf_ard') {
      // Sıralanamaz kolonlar
      if (column === 'id' || 
          column === 'jobname' || 
          column === 'cross_memory_register' ||
          column.includes('created_at') || 
          column.includes('updated_at') ||
          column.includes('device_connection_time')) {
        return;
      }
    } else if (activeModal === 'rmf_trx') {
      // Sıralanamaz kolonlar
      if (column === 'id' || 
          column === 'mxgcnm' || 
          column === 'mxgcpn' ||
          column === 'mxgtypc' ||
          column === 'bmctime' || 
          column === 'time') {
        return;
      }
    } else {
      // Diğer kartlar için genel kurallar
      if (column.includes('timestamp') || column.includes('time') || 
          column === 'id' || column.includes('name') || column.includes('type') || 
          column.includes('status') || column.includes('serial')) {
        return;
      }
    }
    
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Kolon istatistikleri hesaplama
  const getColumnStats = (column) => {
    const data = getCurrentRawData();
    if (!data || data.length === 0) return { min: 0, max: 0 };
    
    const values = data
      .map(row => parseFloat(row[column]) || 0)
      .filter(val => !isNaN(val));
    
    if (values.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // Export to Excel function
  const exportToExcel = () => {
    const data = getCurrentData();
    if (!data || data.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvData = [
      headers.map(header => getDisplayName(header, activeModal)).join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined || value === '') return '';
          if (typeof value === 'number') return value;
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // BOM ekle (Türkçe karakterler için)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
    
    // Dosyayı indir
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const cardTitle = cardData.find(card => card.id === activeModal)?.title || 'rmf_data';
    link.setAttribute('href', url);
    link.setAttribute('download', `${cardTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Veriler Excel formatında indirildi');
  };

  // Export to PDF function
  const exportToPDF = () => {
    const data = getCurrentData();
    if (!data || data.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }

    try {
      // jsPDF ve autoTable eklentisini dinamik olarak yükle
      const loadScripts = () => {
        return new Promise((resolve, reject) => {
          let loadedCount = 0;
          const totalScripts = 2;

          const onScriptLoad = () => {
            loadedCount++;
            if (loadedCount === totalScripts) {
              resolve();
            }
          };

          const onScriptError = () => {
            reject(new Error('Script yükleme hatası'));
          };

          // jsPDF yükle
          const jsPDFScript = document.createElement('script');
          jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          jsPDFScript.onload = onScriptLoad;
          jsPDFScript.onerror = onScriptError;
          document.head.appendChild(jsPDFScript);

          // autoTable eklentisini yükle
          const autoTableScript = document.createElement('script');
          autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
          autoTableScript.onload = onScriptLoad;
          autoTableScript.onerror = onScriptError;
          document.head.appendChild(autoTableScript);
        });
      };

      loadScripts().then(() => {
        const data = getCurrentData();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Başlık ekle
        const cardTitle = cardData.find(card => card.id === activeModal)?.title || 'RMF Data';
        doc.setFontSize(16);
        doc.text(`${cardTitle} Raporu`, 20, 20);
        
        // Tarih ekle
        doc.setFontSize(10);
        doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
        
        // Tablo verilerini hazırla
        const headers = Object.keys(data[0]);
        const displayHeaders = headers.map(header => getDisplayName(header, activeModal));
        const tableData = data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined || value === '') return '-';
            if (typeof value === 'number') return formatNumber(value);
            return value.toString();
          })
        );

        // AutoTable kullanarak tablo oluştur
        doc.autoTable({
          head: [displayHeaders],
          body: tableData,
          startY: 35,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
          alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        // PDF'i indir
        const fileName = `${cardTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success('PDF oluşturuldu ve indirildi');
      }).catch((error) => {
        console.error('Script yükleme hatası:', error);
        toast.error('PDF oluşturma sırasında hata oluştu');
      });
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturma sırasında hata oluştu');
    }
  };

  // Refresh data function
  const refreshData = () => {
    if (activeModal) {
      loadDataForActiveModal();
    }
  };

  const renderTableHeaders = () => {
    const data = getCurrentData();
    if (!data || data.length === 0) return null;

    let headers = Object.keys(data[0]);
    
    // Hidden columns'u filtrele
    if (hiddenColumns[activeModal]) {
      headers = headers.filter(header => !hiddenColumns[activeModal].includes(header));
    }
    
    // Sıralanabilir kolon mu kontrol et
    const isSortableColumn = (column) => {
      // RMF ARD için özel kurallar
      if (activeModal === 'rmf_ard') {
        // Sıralanamaz kolonlar
        if (column === 'id' || 
            column === 'jobname' || 
            column === 'cross_memory_register' ||
            column.includes('created_at') || 
            column.includes('updated_at')) {
          return false;
        }
        // Diğer kolonlar sayısal olduğu için sıralanabilir
        return true;
      }
      
      // RMF TRX için özel kurallar
      if (activeModal === 'rmf_trx') {
        // Sıralanamaz kolonlar
        if (column === 'id' || 
            column === 'mxgcnm' || 
            column === 'mxgcpn' || 
            column === 'mxgtypc' ||
            column === 'bmctime' || 
            column === 'time') {
          return false;
        }
        // Diğer kolonlar sayısal olduğu için sıralanabilir
        return true;
      }
      
      // Diğer kartlar için genel kurallar
      return !(column.includes('timestamp') || column.includes('time') || 
               column === 'id' || column.includes('name') || column.includes('type') || 
               column.includes('status') || column.includes('serial'));
    };
    
    return (
      <tr>
        {headers.map((header, index) => {
          const isSortable = isSortableColumn(header);
          return (
            <th
              key={index}
              onClick={() => handleSort(header)}
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                isSortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <span>{getDisplayName(header, activeModal)}</span>
                  {isSortable && (
                    sortColumn === header ? (
                      <span className="text-blue-600 font-bold">
                        {sortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">↕ Sırala</span>
                    )
                  )}
                </div>
                {isSortable && (
                  <div className="text-xs text-gray-400 font-normal">
                    Min: {getColumnStats(header).min.toFixed(2)} | Max: {getColumnStats(header).max.toFixed(2)}
                  </div>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    );
  };

  const renderTableRows = () => {
    if (!sortedData || sortedData.length === 0) {
      return (
        <tr>
          <td colSpan="100%" className="px-6 py-4 text-center text-gray-500">
            Veri bulunamadı
          </td>
        </tr>
      );
    }

    return sortedData.map((row, index) => {
      // Hidden columns'u filtrele
      const filteredEntries = Object.entries(row).filter(([columnName]) => {
        if (hiddenColumns[activeModal]) {
          return !hiddenColumns[activeModal].includes(columnName);
        }
        return true;
      });
      
      return (
        <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          {filteredEntries.map(([columnName, value], cellIndex) => (
            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatValue(value, columnName)}
            </td>
          ))}
        </tr>
      );
    });
  };

  // Grafik fonksiyonları
  const openChart = (chartType) => {
    setSelectedChart(chartType);
    setChartTab('chart');
    
    let chartDataPoints = [];
    
    // TRX verisine göre grafik verisi oluştur
    if (activeModal === 'rmf_trx') {
      const trxData = data.rmf_trx || [];
      
      const chartFieldMapping = {
        'mxiasac': 'mxiasac',
        'mxixavg': 'mxixavg',
        'mxirate': 'mxirate',
        'mxircp': 'mxircp'
      };
      
      const field = chartFieldMapping[chartType];
      if (field && trxData.length > 0) {
        chartDataPoints = trxData.map((item, index) => ({
          x: index,
          y: parseFloat(item[field]) || 0,
          label: item.mxgcnm || '',
          value: parseFloat(item[field]) || 0
        }));
      }
    } 
    // ARD verisine göre grafik verisi oluştur
    else if (activeModal === 'rmf_ard') {
      const ardData = data.rmf_ard || [];
      
      const chartFieldMapping = {
        'device_connection_time_seconds': 'device_connection_time_seconds',
        'current_fixed_frames_16m': 'current_fixed_frames_16m',
        'current_fixed_frame_count': 'current_fixed_frame_count',
        'session_srm_service_absorption_rate': 'session_srm_service_absorption_rate',
        'session_cpu_seconds_tcb_mode': 'session_cpu_seconds_tcb_mode',
        'cpu_seconds': 'cpu_seconds',
        'excp_rate_per_second': 'excp_rate_per_second',
        'swap_page_rate_per_second': 'swap_page_rate_per_second',
        'interval_lpa_page_rate': 'interval_lpa_page_rate',
        'interval_csa_page_in_rate': 'interval_csa_page_in_rate',
        'realtime_non_vio_page_rate': 'realtime_non_vio_page_rate',
        'private_vio_hiperspace_page_rate': 'private_vio_hiperspace_page_rate'
      };
      
      const field = chartFieldMapping[chartType];
      if (field && ardData.length > 0) {
        chartDataPoints = ardData.map((item, index) => ({
          x: index,
          y: parseFloat(item[field]) || 0,
          label: item.jobname || '',
          value: parseFloat(item[field]) || 0
        }));
      }
    }
    // PGSPP verisine göre grafik verisi oluştur
    else if (activeModal === 'rmf_pgspp') {
      const pgsppData = data.rmf_pgspp || [];
      
      const chartFieldMapping = {
        'pdislupc': 'pdislupc',
        'pdipxtav': 'pdipxtav',
        'pdipiort': 'pdipiort',
        'pdippbav': 'pdippbav',
        'pdibsyPC': 'pdibsyPC'
      };
      
      const field = chartFieldMapping[chartType];
      if (field && pgsppData.length > 0) {
        chartDataPoints = pgsppData.map((item, index) => ({
          x: index,
          y: parseFloat(item[field]) || 0,
          label: item.pdgdsn || '',
          value: parseFloat(item[field]) || 0
        }));
      }
    }
    
    setChartData(chartDataPoints);
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

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table');
    // Kart değişince filtreyi sıfırla
    setIsFiltered(false);
    setFilteredData([]);
  };

  useEffect(() => {
    if (activeModal) {
      loadDataForActiveModal();
    }
  }, [activeModal]);

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
  };

  const openTimeFilter = () => {
    setTimeFilterModal(true);
  };

  const closeTimeFilter = () => {
    setTimeFilterModal(false);
  };

  const clearTimeFilter = () => {
    setFilteredData([]);
    setIsFiltered(false);
    setSelectedTimeRange('last6h');
    setCustomFromDate('');
    setCustomToDate('');
    toast.success('Zaman filtresi temizlendi');
  };

  const applyTimeFilter = () => {
    try {
      const currentData = getCurrentRawData();
      if (!currentData || currentData.length === 0) {
        toast.error('Filtrelenecek veri bulunamadı');
        closeTimeFilter();
        return;
      }

      let filtered = [];

      // Özel tarih aralığı seçilmişse
      if (selectedTimeRange === 'custom') {
        if (!customFromDate || !customToDate) {
          toast.error('Lütfen başlangıç ve bitiş tarihlerini seçin');
          return;
        }
        
        const fromDate = new Date(customFromDate);
        const toDate = new Date(customToDate);
        
        filtered = currentData.filter(item => {
          const itemTime = new Date(item.timestamp || item.bmctime || item.record_timestamp || item.time);
          return itemTime >= fromDate && itemTime <= toDate;
        });
      } else {
        // Hızlı zaman aralıkları
        const now = new Date();
        let fromDate;
        
        switch (selectedTimeRange) {
          case 'last5m':
            fromDate = new Date(now.getTime() - 5 * 60 * 1000);
            break;
          case 'last15m':
            fromDate = new Date(now.getTime() - 15 * 60 * 1000);
            break;
          case 'last30m':
            fromDate = new Date(now.getTime() - 30 * 60 * 1000);
            break;
          case 'last1h':
            fromDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case 'last3h':
            fromDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
            break;
          case 'last6h':
            fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            break;
          case 'last12h':
            fromDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            break;
          case 'last24h':
            fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'last2d':
            fromDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
            break;
          default:
            fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        }
        
        filtered = currentData.filter(item => {
          const itemTime = new Date(item.timestamp || item.bmctime || item.record_timestamp || item.time);
          return itemTime >= fromDate;
        });
      }
      
      // Filtrelenmiş verileri set et
      setFilteredData(filtered);
      setIsFiltered(true);
      
      toast.success(`Filtreleme uygulandı. ${filtered.length} kayıt bulundu.`);
      closeTimeFilter();
      
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      toast.error('Filtreleme sırasında hata oluştu');
    }
  };

  const cardData = [
    {
      id: 'rmf_pgspp',
      title: 'RMF PGSPP',
      description: 'Page Space Performance',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'blue'
    },
    {
      id: 'rmf_ard',
      title: 'RMF ARD',
      description: 'Application Response Data',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: 'green'
    },
    {
      id: 'rmf_trx',
      title: 'RMF TRX',
      description: 'Transaction Performance',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'purple'
    },
    {
      id: 'rmf_asrm',
      title: 'RMF ASRM',
      description: 'Address Space Resource',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      color: 'indigo'
    },
    {
      id: 'rmf_srcs',
      title: 'RMF SRCS',
      description: 'System Resource Data',
      icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      color: 'red'
    },
    {
      id: 'rmf_asd',
      title: 'RMF ASD',
      description: 'Address Space Data',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      color: 'yellow'
    },
    {
      id: 'rmf_spag',
      title: 'RMF SPAG',
      description: 'Storage Paging Data',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      color: 'pink'
    },
    {
      id: 'cmf_dspcz',
      title: 'CMF DSPCZ',
      description: 'Data Space Cache',
      icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
      color: 'teal'
    },
    {
      id: 'cmf_xcfsys',
      title: 'CMF XCFSYS',
      description: 'Cross System Coupling',
      icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z',
      color: 'cyan'
    },
    {
      id: 'cmf_jcsa',
      title: 'CMF JCSA',
      description: 'Job Control Storage',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      color: 'orange'
    },
    {
      id: 'cmf_xcfmbr',
      title: 'CMF XCFMBR',
      description: 'Cross System Member',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'emerald'
    },
    {
      id: 'cmf_syscpc',
      title: 'CMF SYSCPC',
      description: 'System CPU Cache',
      icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      color: 'rose'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 group-hover:bg-blue-200 text-blue-600',
      green: 'bg-green-100 group-hover:bg-green-200 text-green-600',
      purple: 'bg-purple-100 group-hover:bg-purple-200 text-purple-600',
      indigo: 'bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600',
      red: 'bg-red-100 group-hover:bg-red-200 text-red-600',
      yellow: 'bg-yellow-100 group-hover:bg-yellow-200 text-yellow-600',
      pink: 'bg-pink-100 group-hover:bg-pink-200 text-pink-600',
      teal: 'bg-teal-100 group-hover:bg-teal-200 text-teal-600',
      cyan: 'bg-cyan-100 group-hover:bg-cyan-200 text-cyan-600',
      orange: 'bg-orange-100 group-hover:bg-orange-200 text-orange-600',
      emerald: 'bg-emerald-100 group-hover:bg-emerald-200 text-emerald-600',
      rose: 'bg-rose-100 group-hover:bg-rose-200 text-rose-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          RMF Resource Measurement
        </h1>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cardData.map((card) => (
            <div 
              key={card.id}
              onClick={() => openModal(card.id)}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1"
            >
              <div className="p-8">
                {/* Icon */}
                <div className={`flex items-center justify-center w-14 h-14 rounded-xl mb-6 mx-auto transition-colors duration-300 ${getColorClasses(card.color)}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">
                    {card.title}
                  </h2>
                  <p className="text-gray-500 text-sm font-medium mb-4">{card.description}</p>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-green-700">Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {activeModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-8xl w-full mx-4 max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header - Sticky */}
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {cardData.find(card => card.id === activeModal)?.title} Detayları
                  </h3>
                  <button 
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 flex items-center justify-center"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                        <div className="flex items-center space-x-4">
                          <h4 className="text-lg font-semibold text-gray-800">Veri Tablosu</h4>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={exportToExcel}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel'e Aktar
                          </button>
                          <button
                            onClick={exportToPDF}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Zaman Filtresi
                          </button>
                          <button
                            onClick={refreshData}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                          >
                            Yenile
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {isLoading ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
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
                      
                      {/* RMF TRX için özel grafik kartları */}
                      {activeModal === 'rmf_trx' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Service Class Name - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxgcnm');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Service Class Name</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_trx[0]?.mxgcnm || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Period Number - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxgcpn');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Period Number</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_trx[0]?.mxgcpn || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* WLM Type - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxgtypc');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">WLM Type</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_trx[0]?.mxgtypc || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                            {/* Average Number of AS Counted */}
                          <div 
                            onClick={() => openChart('mxiasac')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxiasac');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Average Number of AS Counted</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_trx[0]?.mxiasac || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Average Active Time */}
                          <div 
                            onClick={() => openChart('mxixavg')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxixavg');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Average Active Time</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_trx[0]?.mxixavg || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Transaction Rate */}
                          <div 
                            onClick={() => openChart('mxirate')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxirate');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Transaction Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_trx[0]?.mxirate || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Transactions Completed */}
                          <div 
                            onClick={() => openChart('mxircp')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mxircp');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Transactions Completed</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_trx[0]?.mxircp || 0)}
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
                                {data.rmf_trx && data.rmf_trx.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_trx[0]?.bmctime || new Date()).toLocaleDateString('tr-TR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_trx[0]?.bmctime || new Date()).toLocaleTimeString('tr-TR', {
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
                      ) : activeModal === 'rmf_pgspp' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Sayısal olmayan kartlar - Info Only */}
                          
                          {/* Page Data Set Number - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdgnum');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 rmf-primary-100 rmf-hover-primary-200 rmf-text-primary-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 rmf-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 rmf-text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Page Data Set Number</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold rmf-primary-100 rmf-text-primary-800">
                                    {data.rmf_pgspp[0]?.pdgnum || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Page Data Set Type - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdgtypc');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Page Data Set Type</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_pgspp[0]?.pdgtypc || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Volume Serial Number - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdgser');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Volume Serial Number</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_pgspp[0]?.pdgser || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Device Number - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdredevc');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Device Number</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_pgspp[0]?.pdredevc || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Page Data Set Status - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdgstat');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Page Data Set Status</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_pgspp[0]?.pdgstat || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* VIO Eligibility - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdgvioc');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">VIO Eligibility</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_pgspp[0]?.pdgvioc || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Page Data Set Name - Tıklanamaz */}
                          <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={() => openInfo('pdgdsn')}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Page Data Set Name</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_pgspp[0]?.pdgdsn || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sayısal kartlar - Tıklanabilir */}
                          {/* Page Slot In Use Percentage */}
                          <div 
                            onClick={() => openChart('pdislupc')}
                            className="group relative bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            {/* Info Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdislupc');
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
                                openChart('pdislupc');
                              }}
                              className="absolute top-3 left-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Page Slot In Use Percentage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    parseFloat(data.rmf_pgspp[0]?.pdislupc || 0) < 60 ? 'bg-green-100 text-green-800' :
                                    parseFloat(data.rmf_pgspp[0]?.pdislupc || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                                    parseFloat(data.rmf_pgspp[0]?.pdislupc || 0) < 90 ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {formatNumber(data.rmf_pgspp[0]?.pdislupc || 0)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Average Page Transfer Time */}
                          <div 
                            onClick={() => openChart('pdipxtav')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdipxtav');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            
                            {/* Grafik ikonu */}
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>

                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Average Page Transfer Time</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_pgspp[0]?.pdipxtav || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* I/O Request Rate */}
                          <div 
                            onClick={() => openChart('pdipiort')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdipiort');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            
                            {/* Grafik ikonu */}
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>

                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">I/O Request Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_pgspp[0]?.pdipiort || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Average Pages per Burst */}
                          <div 
                            onClick={() => openChart('pdippbav')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdippbav');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            
                            {/* Grafik ikonu */}
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>

                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Average Pages per Burst</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_pgspp[0]?.pdippbav || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* In Use Percentage */}
                          <div 
                            onClick={() => openChart('pdibsyPC')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdibsyPC');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            
                            {/* Grafik ikonu */}
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>

                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">In Use Percentage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_pgspp[0]?.pdibsyPC || 0)}
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
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_pgspp[0]?.timestamp || new Date()).toLocaleDateString('tr-TR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_pgspp[0]?.timestamp || new Date()).toLocaleTimeString('tr-TR', {
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
                      ) : activeModal === 'rmf_ard' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* JOBNAME - Info Only */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('jobname');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9 nesnesinde" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">JOBNAME</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_ard[0]?.jobname || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-苞</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sayısal kartlar - Tıklanabilir */}
                          {/* Device Connection Time for the Job */}
                          <div 
                            onClick={() => openChart('device_connection_time_seconds')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('device_connection_time_seconds');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Device Connection Time</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.device_connection_time_seconds || 0)}s
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CPU Seconds */}
                          <div 
                            onClick={() => openChart('cpu_seconds')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('cpu_seconds');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CPU Seconds</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.cpu_seconds || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Current Fixed Frames < 16M */}
                          <div 
                            onClick={() => openChart('current_fixed_frames_16m')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('current_fixed_frames_16m');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Fixed Frames &lt; 16M</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.current_fixed_frames_16m || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Current Fixed Frame Count */}
                          <div 
                            onClick={() => openChart('current_fixed_frame_count')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('current_fixed_frame_count');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Fixed Frame Count</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.current_fixed_frame_count || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Session SRM Service Absorption Rate */}
                          <div 
                            onClick={() => openChart('session_srm_service_absorption_rate')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('session_srm_service_absorption_rate');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SRM Absorption Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.session_srm_service_absorption_rate || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Session CPU Seconds in TCB Mode */}
                          <div 
                            onClick={() => openChart('session_cpu_seconds_tcb_mode')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('session_cpu_seconds_tcb_mode');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Session CPU (TCB)</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.session_cpu_seconds_tcb_mode || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* EXCP Rate Per Second */}
                          <div 
                            onClick={() => openChart('excp_rate_per_second')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('excp_rate_per_second');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">EXCP Rate/Sec</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.excp_rate_per_second || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Swap Page Rate Per Second */}
                          <div 
                            onClick={() => openChart('swap_page_rate_per_second')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('swap_page_rate_per_second');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Swap Page Rate/Sec</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.swap_page_rate_per_second || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Interval LPA Page Rate */}
                          <div 
                            onClick={() => openChart('interval_lpa_page_rate')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('interval_lpa_page_rate');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">LPA Page Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.interval_lpa_page_rate || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Interval CSA Page-In Rate */}
                          <div 
                            onClick={() => openChart('interval_csa_page_in_rate')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('interval_csa_page_in_rate');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CSA Page-In Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.interval_csa_page_in_rate || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Realtime Non-VIO Page Rate */}
                          <div 
                            onClick={() => openChart('realtime_non_vio_page_rate')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('realtime_non_vio_page_rate');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Realtime Non-VIO Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.realtime_non_vio_page_rate || 0)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Private VIO and Hiperspace Page Rate */}
                          <div 
                            onClick={() => openChart('private_vio_hiperspace_page_rate')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('private_vio_hiperspace_page_rate');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">VIO Hiperspace Rate</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {formatNumber(data.rmf_ard[0]?.private_vio_hiperspace_page_rate || 0)}
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
                                {data.rmf_ard && data.rmf_ard.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_ard[0]?.created_at || new Date()).toLocaleDateString('tr-TR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_ard[0]?.created_at || new Date()).toLocaleTimeString('tr-TR', {
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
                      ) : (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-蓝图" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d=" Harper 9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-700 mb-2">Grafik Görünümü</h4>
                            <p className="text-gray-500 mb-4">
                              {cardData.find(card => card.id === activeModal)?.description} - Grafik Analizi
                            </p>
                            <p className="text-sm text-gray-400">
                              Performans grafikleri yakında eklenecek...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grafik Modalı - Tüm RMF kartları için */}
        {selectedChart && ['rmf_trx', 'rmf_pgspp', 'rmf_ard'].includes(activeModal) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
            onClick={closeChart}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {/* RMF TRX */}
                    {selectedChart === 'mxiasac' && 'Average Number of AS Counted'}
                    {selectedChart === 'mxixavg' && 'Average Active Time'}
                    {selectedChart === 'mxirate' && 'Transaction Rate'}
                    {selectedChart === 'mxircp' && 'Transactions Completed'}
                    {/* RMF PGSPP */}
                    {selectedChart === 'pdislupc' && 'Service LPA Page Count'}
                    {selectedChart === 'pdipxtav' && 'Page Type Average'}
                    {selectedChart === 'pdipiort' && 'I/O Rate'}
                    {selectedChart === 'pdippbav' && 'Page Protection Buffer Average'}
                    {selectedChart === 'pdibsyPC' && 'In Use Percentage'}
                    {/* RMF ARD */}
                    {selectedChart === 'device_connection_time_seconds' && 'Device Connection Time'}
                    {selectedChart === 'cpu_seconds' && 'CPU Seconds'}
                    {selectedChart === 'current_fixed_frames_16m' && 'Current Fixed Frames < 16M'}
                    {selectedChart === 'current_fixed_frame_count' && 'Current Fixed Frame Count'}
                    {selectedChart === 'session_srm_service_absorption_rate' && 'Session SRM Service Absorption Rate'}
                    {selectedChart === 'session_cpu_seconds_tcb_mode' && 'Session CPU Seconds (TCB Mode)'}
                    {selectedChart === 'excp_rate_per_second' && 'EXCP Rate Per Second'}
                    {selectedChart === 'swap_page_rate_per_second' && 'Swap Page Rate Per Second'}
                    {selectedChart === 'interval_lpa_page_rate' && 'Interval LPA Page Rate'}
                    {selectedChart === 'interval_csa_page_in_rate' && 'Interval CSA Page-In Rate'}
                    {selectedChart === 'realtime_non_vio_page_rate' && 'Realtime Non-VIO Page Rate'}
                    {selectedChart === 'private_vio_hiperspace_page_rate' && 'Private VIO and Hiperspace Page Rate'}
                  </h3>
                  <button 
                    onClick={closeChart}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Grafik Sekmeleri - Tüm RMF kartları için */}
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
                      {/* Grafik */}
                {chartData && chartData.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Grafik</h4>
                      <div className="h-96 bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden p-4">
                        <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                          {(() => {
                            const margin = { top: 20, right: 40, bottom: 40, left: 50 };
                            const width = 800 - margin.left - margin.right;
                            const height = 300 - margin.top - margin.bottom;
                            const values = chartData.map(d => d.y);
                            const minY = Math.min(...values);
                            const maxY = Math.max(...values);
                            const range = maxY - minY || 1;
                            
                            const xPos = (i) => margin.left + (i / Math.max(chartData.length - 1, 1)) * width;
                            const yPos = (value) => margin.top + height - ((value - minY) / range) * height;
                            
                            let lineD = chartData.map((d, i) => 
                              `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(d.y)}`
                            ).join(' ');
                            
                            const firstX = xPos(0);
                            const lastX = xPos(chartData.length - 1);
                            let areaD = `${lineD} L ${lastX} ${height + margin.top} L ${firstX} ${height + margin.top} Z`;
                            
                            const gridLines = [];
                            for (let i = 0; i <= 5; i++) {
                              const y = margin.top + (height / 5) * i;
                              const value = maxY - (range / 5) * i;
                              gridLines.push(
                                <g key={i}>
                                  <line x1={margin.left} y1={y} x2={width + margin.left} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                                  <text x={margin.left - 10} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#6b7280">
                                    {formatNumber(value)}
                                  </text>
                                </g>
                              );
                            }
                            
                            return (
                              <>
                                <rect width="800" height="300" fill="#f9fafb" />
                                {gridLines}
                                <defs>
                                  <linearGradient id="areaGradientRMF" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                                  </linearGradient>
                                </defs>
                                <path d={areaD} fill="url(#areaGradientRMF)" />
                                <path d={lineD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                {chartData.map((d, i) => (
                                  <circle key={i} cx={xPos(i)} cy={yPos(d.y)} r="5" fill="#3b82f6" stroke="white" strokeWidth="2">
                                    <title>{`Nokta ${i + 1}: ${d.label || ''} - Değer: ${formatNumber(d.y)}`}</title>
                                  </circle>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* İstatistikler */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Ortalama</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.length > 0 
                        ? formatNumber(chartData.reduce((sum, d) => sum + d.y, 0) / chartData.length)
                        : '-'
                      }
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Min</div>
                    <div className="text-2xl font-bold text-green-600">
                      {chartData.length > 0 
                        ? formatNumber(Math.min(...chartData.map(d => d.y)))
                        : '-'
                      }
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Max</div>
                    <div className="text-2xl font-bold text-red-600">
                      {chartData.length > 0 
                        ? formatNumber(Math.max(...chartData.map(d => d.y)))
                        : '-'
                      }
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Veri Noktası</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {chartData.length}
                    </div>
                  </div>
                </div>
                    </div>
                  )}

                  {/* Threshold Sekmesi */}
                  {chartTab === 'threshold' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {selectedChart === 'pdislupc' && 'Page Slot In Use Percentage Threshold Ayarları'}
                        {selectedChart === 'pdipxtav' && 'Average Page Transfer Time Threshold Ayarları'}
                        {selectedChart === 'pdipiort' && 'I/O Request Rate Threshold Ayarları'}
                        {selectedChart === 'pdippbav' && 'Average Pages per Burst Threshold Ayarları'}
                        {selectedChart === 'pdibsyPC' && 'In Use Percentage Threshold Ayarları'}
                        {selectedChart === 'mxiasac' && 'Average Number of AS Counted Threshold Ayarları'}
                        {selectedChart === 'mxixavg' && 'Average Active Time Threshold Ayarları'}
                        {selectedChart === 'mxirate' && 'Transaction Rate Threshold Ayarları'}
                        {selectedChart === 'mxircp' && 'Transactions Completed Threshold Ayarları'}
                        {selectedChart === 'device_connection_time_seconds' && 'Device Connection Time Threshold Ayarları'}
                        {selectedChart === 'cpu_seconds' && 'CPU Seconds Threshold Ayarları'}
                        {selectedChart === 'current_fixed_frames_16m' && 'Current Fixed Frames < 16M Threshold Ayarları'}
                        {selectedChart === 'current_fixed_frame_count' && 'Current Fixed Frame Count Threshold Ayarları'}
                        {selectedChart === 'session_srm_service_absorption_rate' && 'Session SRM Service Absorption Rate Threshold Ayarları'}
                        {selectedChart === 'session_cpu_seconds_tcb_mode' && 'Session CPU Seconds (TCB Mode) Threshold Ayarları'}
                        {selectedChart === 'excp_rate_per_second' && 'EXCP Rate Per Second Threshold Ayarları'}
                        {selectedChart === 'swap_page_rate_per_second' && 'Swap Page Rate Per Second Threshold Ayarları'}
                        {selectedChart === 'interval_lpa_page_rate' && 'Interval LPA Page Rate Threshold Ayarları'}
                        {selectedChart === 'interval_csa_page_in_rate' && 'Interval CSA Page-In Rate Threshold Ayarları'}
                        {selectedChart === 'realtime_non_vio_page_rate' && 'Realtime Non-VIO Page Rate Threshold Ayarları'}
                        {selectedChart === 'private_vio_hiperspace_page_rate' && 'Private VIO and Hiperspace Page Rate Threshold Ayarları'}
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
                                  selectedChart === 'pdislupc' ? "90" :
                                  selectedChart === 'pdipxtav' ? "1000" :
                                  selectedChart === 'pdipiort' ? "500" :
                                  selectedChart === 'pdippbav' ? "100" :
                                  selectedChart === 'pdibsyPC' ? "95" :
                                  selectedChart === 'mxiasac' ? "1000" :
                                  selectedChart === 'mxixavg' ? "500" :
                                  selectedChart === 'mxirate' ? "10000" :
                                  selectedChart === 'mxircp' ? "5000" :
                                  selectedChart === 'device_connection_time_seconds' ? "300" :
                                  selectedChart === 'cpu_seconds' ? "1000" :
                                  selectedChart === 'current_fixed_frames_16m' ? "10000" :
                                  selectedChart === 'current_fixed_frame_count' ? "50000" :
                                  selectedChart === 'session_srm_service_absorption_rate' ? "95" :
                                  selectedChart === 'session_cpu_seconds_tcb_mode' ? "800" :
                                  selectedChart === 'excp_rate_per_second' ? "1000" :
                                  selectedChart === 'swap_page_rate_per_second' ? "100" :
                                  selectedChart === 'interval_lpa_page_rate' ? "50" :
                                  selectedChart === 'interval_csa_page_in_rate' ? "30" :
                                  selectedChart === 'realtime_non_vio_page_rate' ? "200" :
                                  selectedChart === 'private_vio_hiperspace_page_rate' ? "150" : "90"
                                }
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Uyarı Eşiği (%)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue={
                                  selectedChart === 'pdislupc' ? "75" :
                                  selectedChart === 'pdipxtav' ? "750" :
                                  selectedChart === 'pdipiort' ? "350" :
                                  selectedChart === 'pdippbav' ? "75" :
                                  selectedChart === 'pdibsyPC' ? "80" :
                                  selectedChart === 'mxiasac' ? "750" :
                                  selectedChart === 'mxixavg' ? "350" :
                                  selectedChart === 'mxirate' ? "7500" :
                                  selectedChart === 'mxircp' ? "3500" :
                                  selectedChart === 'device_connection_time_seconds' ? "200" :
                                  selectedChart === 'cpu_seconds' ? "750" :
                                  selectedChart === 'current_fixed_frames_16m' ? "7500" :
                                  selectedChart === 'current_fixed_frame_count' ? "35000" :
                                  selectedChart === 'session_srm_service_absorption_rate' ? "80" :
                                  selectedChart === 'session_cpu_seconds_tcb_mode' ? "600" :
                                  selectedChart === 'excp_rate_per_second' ? "750" :
                                  selectedChart === 'swap_page_rate_per_second' ? "75" :
                                  selectedChart === 'interval_lpa_page_rate' ? "35" :
                                  selectedChart === 'interval_csa_page_in_rate' ? "20" :
                                  selectedChart === 'realtime_non_vio_page_rate' ? "150" :
                                  selectedChart === 'private_vio_hiperspace_page_rate' ? "100" : "75"
                                }
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Bilgi Eşiği (%)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                defaultValue={
                                  selectedChart === 'pdislupc' ? "60" :
                                  selectedChart === 'pdipxtav' ? "500" :
                                  selectedChart === 'pdipiort' ? "200" :
                                  selectedChart === 'pdippbav' ? "50" :
                                  selectedChart === 'pdibsyPC' ? "65" :
                                  selectedChart === 'mxiasac' ? "500" :
                                  selectedChart === 'mxixavg' ? "200" :
                                  selectedChart === 'mxirate' ? "5000" :
                                  selectedChart === 'mxircp' ? "2000" :
                                  selectedChart === 'device_connection_time_seconds' ? "100" :
                                  selectedChart === 'cpu_seconds' ? "500" :
                                  selectedChart === 'current_fixed_frames_16m' ? "5000" :
                                  selectedChart === 'current_fixed_frame_count' ? "20000" :
                                  selectedChart === 'session_srm_service_absorption_rate' ? "65" :
                                  selectedChart === 'session_cpu_seconds_tcb_mode' ? "400" :
                                  selectedChart === 'excp_rate_per_second' ? "500" :
                                  selectedChart === 'swap_page_rate_per_second' ? "50" :
                                  selectedChart === 'interval_lpa_page_rate' ? "20" :
                                  selectedChart === 'interval_csa_page_in_rate' ? "10" :
                                  selectedChart === 'realtime_non_vio_page_rate' ? "100" :
                                  selectedChart === 'private_vio_hiperspace_page_rate' ? "75" : "60"
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
                        { id: 'last2d', label: 'Son 2 gün' },
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

                  {/* Özel Zaman Aralığı */}
                  {selectedTimeRange === 'custom' && (
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
                      onClick={clearTimeFilter}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200"
                    >
                      Filtreyi Temizle
                    </button>
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

        {/* Info Modal */}
        {infoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Info Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {infoModal === 'pdgnum' && 'PDGNUM Hakkında'}
                    {infoModal === 'pdgtypc' && 'PDGTYPC Hakkında'}
                    {infoModal === 'pdgser' && 'PDGSER Hakkında'}
                    {infoModal === 'pdredevc' && 'PDREDEVC Hakkında'}
                    {infoModal === 'pdgstat' && 'PDGSTAT Hakkında'}
                    {infoModal === 'pdislupc' && 'PDISLUPC Hakkında'}
                    {infoModal === 'pdipxtav' && 'PDIPXTAV Hakkında'}
                    {infoModal === 'pdipiort' && 'PDIPIORT Hakkında'}
                    {infoModal === 'pdippbav' && 'PDIPPBAV Hakkında'}
                    {infoModal === 'pdgvioc' && 'PDGVIOC Hakkında'}
                    {infoModal === 'pdibsyPC' && 'PDIBSYPC Hakkında'}
                    {infoModal === 'pdgdsn' && 'PDGDSN Hakkında'}
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
                  {/* Page Data Set Number Info Card */}
                  {infoModal === 'pdgnum' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Page Data Set Number (PDGNUM), RMF PGSPP kayıtlarında sayfa veri setini benzersiz şekilde 
                          tanımlayan alanı gösterir. Bu alan, sayfa veri setinin sistem içindeki kimliğini belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Format:</strong> İki hexadecimal basamak (00-FF)</li>
                          <li>• <strong>Benzersizlik:</strong> Her sayfa veri seti için farklı değer</li>
                          <li>• <strong>Kimlik:</strong> Sayfa veri setinin sistem içindeki tanımlayıcısı</li>
                          <li>• <strong>Örnek:</strong> 01, 02, 0A, FF gibi hexadecimal değerler</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Page Data Set Number, sayfa performansının hangi veri setinden geldiğini belirlemek için kritik öneme sahiptir. 
                          Bu bilgi sayesinde hangi sayfa veri setinin performans sorunları yaşadığını tespit edebilir ve 
                          sistem optimizasyonu yapabilirsiniz. Ayrıca sayfa veri setlerinin kullanım dağılımını analiz etmek için gereklidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Page Data Set Type Info Card */}
                  {infoModal === 'pdgtypc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Page Data Set Type (PDGTYPC), RMF PGSPP kayıtlarında sayfa veri setinin türünü 
                          belirten alanı gösterir. Bu alan, sayfa veri setinin hangi tipte olduğunu ve 
                          nasıl kullanıldığını tanımlar.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Veri Seti Türü:</strong> Sayfa veri setinin kategorisini belirtir</li>
                          <li>• <strong>Kullanım Amacı:</strong> Veri setinin hangi amaçla kullanıldığını gösterir</li>
                          <li>• <strong>Sistem Tanımı:</strong> z/OS tarafından atanan tür bilgisi</li>
                          <li>• <strong>Performans Etkisi:</strong> Farklı türler farklı performans karakteristikleri gösterir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Page Data Set Type, sayfa veri setinin özelliklerini ve davranışını anlamak için kritik öneme sahiptir. 
                          Farklı türdeki veri setleri farklı performans karakteristikleri gösterir ve farklı optimizasyon 
                          stratejileri gerektirir. Bu bilgi sayesinde hangi tür veri setlerinin sistem performansını 
                          nasıl etkilediğini analiz edebilir ve uygun performans ayarlamalarını yapabilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Volume Serial Number Info Card */}
                  {infoModal === 'pdgser' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Volume Serial Number (PDGSER), RMF PGSPP kayıtlarında sayfa veri setinin bulunduğu volume'ü 
                          benzersiz şekilde tanımlayan alanı gösterir. Bu alan, sayfa veri setinin hangi depolama cihazında 
                          saklandığını belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Format:</strong> En fazla altı karakter (alfanumerik)</li>
                          <li>• <strong>Benzersizlik:</strong> Her volume için farklı seri numarası</li>
                          <li>• <strong>Depolama:</strong> Sayfa veri setinin fiziksel konumunu gösterir</li>
                          <li>• <strong>SCM İstisnası:</strong> Storage Class Memory (SCM) sayfalama için geçerli değildir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Volume Serial Number, sayfa verilerinin hangi depolama cihazında saklandığını belirlemek için kritik öneme sahiptir. 
                          Bu bilgi sayesinde performans sorunlarının hangi volume'den kaynaklandığını tespit edebilirsiniz. 
                          Disk performansı ve I/O sıkışmalarını analiz etmek için kullanılır. Ayrıca sayfa veri setlerinin 
                          volume'ler arasındaki dağılımını optimize etmek için gereklidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Device Number Info Card */}
                  {infoModal === 'pdredevc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Device Number (PDREDEVC), RMF PGSPP kayıtlarında sayfa veri setinin bulunduğu fiziksel I/O cihazını 
                          benzersiz şekilde tanımlayan alanı gösterir. Bu alan, sayfa verilerinin hangi fiziksel cihazda 
                          saklandığını belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Format:</strong> En fazla beş hexadecimal basamak</li>
                          <li>• <strong>Benzersizlik:</strong> Her fiziksel I/O cihazı için farklı numara</li>
                          <li>• <strong>Cihaz Kimliği:</strong> Sayfa veri setinin fiziksel depolama cihazını gösterir</li>
                          <li>• <strong>SCM İstisnası:</strong> Storage Class Memory (SCM) sayfalama için geçerli değildir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Device Number, sayfa verilerinin hangi fiziksel I/O cihazında bulunduğunu belirlemek için kritik öneme sahiptir. 
                          Bu bilgi sayesinde performans sorunlarının hangi cihazdan kaynaklandığını tespit edebilirsiniz. 
                          I/O performansı ve cihaz yoğunluğunu analiz etmek için kullanılır. Ayrıca sayfa veri setlerinin 
                          fiziksel cihazlar arasındaki dağılımını optimize etmek için gereklidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Page Data Set Status Info Card */}
                  {infoModal === 'pdgstat' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Page Data Set Status (PDGSTAT), RMF PGSPP kayıtlarında sayfa veri setinin mevcut durumunu 
                          gösteren alanı gösterir. Bu alan, sayfa veri setinin sistem içindeki operasyonel durumunu 
                          ve kullanılabilirlik seviyesini belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Durum Göstergesi:</strong> Sayfa veri setinin operasyonel durumu</li>
                          <li>• <strong>Kullanılabilirlik:</strong> Veri setinin erişilebilirlik seviyesi</li>
                          <li>• <strong>Sistem Durumu:</strong> Sayfa veri setinin sistem içindeki konumu</li>
                          <li>• <strong>Operasyonel Bilgi:</strong> Veri setinin çalışma durumu hakkında bilgi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Page Data Set Status, sayfa veri setinin kullanılabilirlik durumunu belirlemek için kritik öneme sahiptir. 
                          Bu bilgi sayesinde hangi veri setlerinin aktif olduğunu, hangilerinin sorun yaşadığını tespit edebilirsiniz. 
                          Sistem yönetimi ve performans optimizasyonu için gerekli olan bu bilgi, sayfa veri setlerinin 
                          sağlık durumunu izlemek ve proaktif bakım yapmak için kullanılır.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Page Slot In Use Percentage Info Card */}
                  {infoModal === 'pdislupc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Page Slot In Use Percentage (PDISLUPC), RMF PGSPP kayıtlarında bu sayfa veri setindeki 
                          sayfa slotlarının ne kadarının şu anda kullanımda olduğunu yüzde olarak gösteren alanı gösterir. 
                          Bu metrik, sayfa veri setinin doluluk oranını belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Format:</strong> Yüzde değeri (0-100%)</li>
                          <li>• <strong>Hesaplama:</strong> Kullanılan slot sayısı / Toplam slot sayısı × 100</li>
                          <li>• <strong>Slot Durumu:</strong> Aktif olarak kullanılan sayfa slotları</li>
                          <li>• <strong>Kapasite Göstergesi:</strong> Veri setinin doluluk seviyesi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Page Slot In Use Percentage, sayfa veri setinin kapasite kullanımını izlemek için kritik öneme sahiptir. 
                          Yüksek yüzde değerleri veri setinin dolmaya yakın olduğunu gösterir ve performans sorunlarına yol açabilir. 
                          Bu metrik sayesinde proaktif kapasite planlaması yapabilir, yeni sayfa veri setleri ekleme ihtiyacını 
                          önceden tespit edebilir ve sistem performansını optimize edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Average Page Transfer Time Info Card */}
                  {infoModal === 'pdipxtav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Average Page Transfer Time (PDIPXTAV), RMF PGSPP kayıtlarında sayfa veri setinden gerçek 
                          belleğe tek bir sayfayı aktarmak için gereken ortalama milisaniye süresini gösteren alanı gösterir. 
                          Bu metrik, sayfa aktarım performansının bir göstergesidir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Milisaniye (ms)</li>
                          <li>• <strong>Hesaplama:</strong> Belirli zaman aralığındaki ortalama değer</li>
                          <li>• <strong>Aktarım Yönü:</strong> Sayfa veri setinden gerçek belleğe</li>
                          <li>• <strong>Performans Göstergesi:</strong> I/O aktarım hızının ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Average Page Transfer Time, sayfa aktarım performansını değerlendirmek için kritik öneme sahiptir. 
                          Yüksek değerler I/O darboğazlarını ve depolama performans sorunlarını gösterir. Bu metrik sayesinde 
                          hangi sayfa veri setlerinin yavaş performans sergilediğini tespit edebilir, depolama optimizasyonu 
                          yapabilir ve sistem yanıt sürelerini iyileştirebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* I/O Request Rate Info Card */}
                  {infoModal === 'pdipiort' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          I/O Request Rate (PDIPIORT), RMF PGSPP kayıtlarında belirli zaman aralığında bu sayfa veri setine 
                          yönelik saniye başına yapılan sayfalama I/O isteklerinin oranını gösteren alanı gösterir. 
                          Bu metrik, sayfa veri setinin I/O yoğunluğunu ölçer.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> İstek/saniye (requests per second)</li>
                          <li>• <strong>Kapsam:</strong> Sayfalama I/O istekleri</li>
                          <li>• <strong>Zaman Aralığı:</strong> Belirli ölçüm periyodu boyunca</li>
                          <li>• <strong>Aktivite Göstergesi:</strong> Sayfa veri setinin I/O yoğunluğu</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          I/O Request Rate, sayfa veri setinin ne kadar yoğun kullanıldığını belirlemek için kritik öneme sahiptir. 
                          Yüksek değerler o veri setinin sistem performansında önemli rol oynadığını gösterir. Bu metrik sayesinde 
                          hangi sayfa veri setlerinin en çok I/O trafiği aldığını tespit edebilir, I/O dağılımını optimize edebilir 
                          ve performans darboğazlarını önceden belirleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Average Pages per Burst Info Card */}
                  {infoModal === 'pdippbav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Average Pages per Burst (PDIPPBAV), RMF PGSPP kayıtlarında page-in veya page-out işlemi sonucunda 
                          sayfa veri setinden veya sayfa veri setine yapılan her I/O isteği başına aktarılan ortalama sayfa 
                          sayısını gösteren alanı gösterir. Bu metrik, I/O verimliliğinin bir göstergesidir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/I/O isteği (pages per I/O request)</li>
                          <li>• <strong>İşlem Türü:</strong> Page-in ve page-out operasyonları</li>
                          <li>• <strong>Hesaplama:</strong> Toplam aktarılan sayfa / Toplam I/O isteği</li>
                          <li>• <strong>Verimlilik Göstergesi:</strong> I/O operasyonlarının etkinliği</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Average Pages per Burst, I/O operasyonlarının verimliliğini değerlendirmek için kritik öneme sahiptir. 
                          Yüksek değerler daha verimli I/O operasyonlarını gösterirken, düşük değerler I/O overhead'ının 
                          yüksek olduğunu işaret eder. Bu metrik sayesinde sayfalama performansını optimize edebilir, 
                          I/O verimliliğini artırabilir ve sistem kaynaklarının daha etkin kullanılmasını sağlayabilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* VIO Eligibility Info Card */}
                  {infoModal === 'pdgvioc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          VIO Eligibility (PDGVIOC), RMF PGSPP kayıtlarında sayfa veri setinin VIO (Virtual I/O) 
                          sayfalarını kabul edip etmediğini belirten alanı gösterir. Bu alan, sayfa veri setinin 
                          VIO uygunluk durumunu gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>VIO Sayfaları:</strong> Virtual I/O sayfalarının kabul durumu</li>
                          <li>• <strong>Yapılandırma:</strong> SYS1.PARMLIB(IEASYSxx) üyesinde tanımlanır</li>
                          <li>• <strong>Uygunluk Durumu:</strong> VIO-eligible sayfa veri setleri</li>
                          <li>• <strong>Sistem Parametresi:</strong> IEASYSxx parmlib üyesi ile kontrol edilir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          VIO Eligibility, sayfa veri setinin Virtual I/O özelliklerinden yararlanıp yararlanamayacağını 
                          belirlemek için kritik öneme sahiptir. VIO uygun veri setleri daha hızlı I/O performansı 
                          sağlayabilir. Bu bilgi sayesinde hangi sayfa veri setlerinin VIO avantajlarından 
                          yararlandığını tespit edebilir ve sistem performansını optimize edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* In Use Percentage Info Card */}
                  {infoModal === 'pdibsyPC' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          In Use Percentage (PDIBSYPC), RMF PGSPP kayıtlarında ölçüm aralığının ne kadarında 
                          sayfa veri setinin Auxiliary Storage Manager (ASM) tarafından kullanıldığını yüzde olarak 
                          gösteren alanı gösterir. Bu metrik, sayfa veri setinin aktif kullanım süresini belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Yüzde değeri (0-100%)</li>
                          <li>• <strong>Hesaplama:</strong> Kullanım süresi / Toplam ölçüm aralığı × 100</li>
                          <li>• <strong>ASM Kullanımı:</strong> Auxiliary Storage Manager tarafından aktif kullanım</li>
                          <li>• <strong>Zaman Aralığı:</strong> Belirli ölçüm periyodu boyunca</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          In Use Percentage, sayfa veri setinin ne kadar aktif kullanıldığını belirlemek için kritik öneme sahiptir. 
                          Yüksek değerler o veri setinin sistem için önemli olduğunu gösterirken, düşük değerler 
                          az kullanılan veri setlerini işaret eder. Bu metrik sayesinde sayfa veri setlerinin 
                          kullanım yoğunluğunu analiz edebilir, kaynak planlaması yapabilir ve performans optimizasyonu gerçekleştirebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Page Data Set Name Info Card */}
                  {infoModal === 'pdgdsn' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Page Data Set Name (PDGDSN), RMF PGSPP kayıtlarında sayfa veri setinin adını içeren 
                          alanı gösterir. Bu alan, sayfa veri setinin sistem içindeki tam ismini belirtir ve 
                          veri setini benzersiz şekilde tanımlar.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>İçerik:</strong> Sayfa veri setinin tam adı</li>
                          <li>• <strong>Benzersizlik:</strong> Her sayfa veri seti için farklı isim</li>
                          <li>• <strong>Tanımlama:</strong> Veri setini sistem içinde benzersiz tanımlama</li>
                          <li>• <strong>SCM İstisnası:</strong> Storage Class Memory (SCM) sayfalama için geçerli değildir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Page Data Set Name, sayfa veri setlerini tanımlamak ve yönetmek için kritik öneme sahiptir. 
                          Bu bilgi sayesinde hangi veri setinin performans sorunları yaşadığını kesin olarak tespit edebilir, 
                          sistem yöneticileri ile iletişimde doğru veri setini belirtebilir ve sayfa veri setlerinin 
                          organizasyonunu anlayabilirsiniz. Ayrıca kapasité planlaması ve bakım işlemleri için gereklidir.
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

export default RMFPage;
