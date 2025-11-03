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
  const [prevActiveTab, setPrevActiveTab] = useState('table');
  
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
      'pdibsypc': 'In Use Percentage',
      'pdibsypc': 'In Use Percentage',
      'pdgdsn': 'Page Data Set Name',
      'timestamp': 'Timestamp'
    },
    rmf_ard: {
      'jobname': 'Jobname',
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
    },
    rmf_asrm: {
      'ASGNAME': 'Jobname',
      'asgname': 'Jobname',
      'ASGCNMC': 'Service Class Name',
      'asgcnmc': 'Service Class Name',
      'ASGPGP': 'Service Class Index or Performance Period',
      'asgpgp': 'Service Class Index or Performance Period',
      'ASSACTM': 'The TRANSACTION ACTIVE time',
      'assactm': 'The TRANSACTION ACTIVE time',
      'ASGRTM': 'Current Residency Time',
      'asgrtm': 'Current Residency Time',
      'ASSTRC': 'Session Transaction Count',
      'asstrc': 'Session Transaction Count',
      'ASSJSW': 'Swap Total',
      'assjsw': 'Swap Total',
      'ASSSCSCK': 'CPU Service Unit Count',
      'assscsck': 'CPU Service Unit Count',
      'ASSMSOCK': 'Service Units Consumed Using Real Storage',
      'assmsock': 'Service Units Consumed Using Real Storage',
      'ASSIOCCK': 'I/O Service Units Consumed by the Transaction',
      'assiock': 'I/O Service Units Consumed by the Transaction',
      'ASSIOCK': 'I/O Service Units Consumed by the Transaction',
      'assiocck': 'I/O Service Units Consumed by the Transaction',
      'ASSSRSCK': 'SRB Processor Service Consumed by Transaction',
      'asssrsck': 'SRB Processor Service Consumed by Transaction',
      'ASSWMCK': 'Total Service Units',
      'asswmck': 'Total Service Units'
    },
    rmf_srcs: {
      'SPLAFCAV': 'Available Frames',
      'splafcav': 'Available Frames',
      'SPLUICAV': 'Current UIC',
      'spluicav': 'Current UIC',
      'SPLSTFAV': 'SQA Frames Count',
      'splstfav': 'SQA Frames Count',
      'SPLLPFAV': 'LPA Frame Count',
      'spllpfav': 'LPA Frame Count',
      'SPLLFFAV': 'LPA Fixed Frame Count',
      'spllffav': 'LPA Fixed Frame Count',
      'SPLCPFAV': 'Pageable CSA and MLPA Frames Count',
      'splcpfav': 'Pageable CSA and MLPA Frames Count',
      'SPLCLFAV': 'Fixed LPA and CSA Frames Count',
      'splclfav': 'Fixed LPA and CSA Frames Count',
      'SPLRFFAV': 'Private Non-LSQA Fixed Frame Count',
      'splrffav': 'Private Non-LSQA Fixed Frame Count',
      'SPLQPCAV': 'Private Fixed Frames Count',
      'splqpcav': 'Private Fixed Frames Count',
      'SPLQPEAV': 'LSQA Frame Count',
      'splqpeav': 'LSQA Frame Count',
      'SCLINAV': 'Current IN Queue Length',
      'sclinav': 'Current IN Queue Length',
      'SCLLOTAV': 'Address Spaces Logically Swapped Out',
      'scllotav': 'Address Spaces Logically Swapped Out',
      'SCLOTRAV': 'Current Out Ready Queue Length',
      'sclotrav': 'Current Out Ready Queue Length',
      'SCLOTWAV': 'Current Out Wait Queue Length',
      'sclotwav': 'Current Out Wait Queue Length'
    },
    rmf_spag: {
      'SPLLNIRT': 'LPA Page-In Rate',
      'spllnirt': 'LPA Page-In Rate',
      'SPLCINRT': 'CSA Page-In Rate',
      'splcinrt': 'CSA Page-In Rate',
      'SPLCOTRT': 'CSA Page-Out Rate',
      'splcotrt': 'CSA Page-Out Rate',
      'SSLTSWRT': 'Total Swap Rate',
      'ssltswrt': 'Total Swap Rate',
      'SPLSINRT': 'Swap Page-In Rate',
      'splsinrt': 'Swap Page-In Rate',
      'SPLSOTRT': 'Swap Page-Out Rate',
      'splsotrt': 'Swap Page-Out Rate',
      'SPLPPIRT': 'VIO and Non-VIO Page-In Rate',
      'splppirt': 'VIO and Non-VIO Page-In Rate',
      'SPLPORT': 'VIO and Non-VIO Page-Out Rate',
      'splpport': 'VIO and Non-VIO Page-Out Rate',
      'SPLHVPRT': 'VIO Paging Rate',
      'splhvprt': 'VIO Paging Rate',
      'SPLCTWAV': 'Common Area Target Working Set',
      'splctwav': 'Common Area Target Working Set',
      'SPLAFCAV': 'Available Frames',
      'splafcav': 'Available Frames',
      'SPLUICAV': 'Current UIC',
      'spluicav': 'Current UIC',
      'SPLPESRT': 'Pages To Expanded',
      'splpesrt': 'Pages To Expanded',
      'SPLMGAAV': 'Current Migration Age',
      'splmgaav': 'Current Migration Age',
      'SPLESFAV': 'Available Expanded Storage Frames',
      'splesfav': 'Available Expanded Storage Frames',
      'SPLPEART': 'Pages To Auxiliary',
      'splpeart': 'Pages To Auxiliary'
    },
    cmf_dspcz: {
      'ONAM': 'Owner Name',
      'onam': 'Owner Name',
      'DSPNAME': 'Data Space Name (Count)',
      'dspname': 'Data Space Name (Count)',
      'ASID': 'ASID',
      'asid': 'ASID',
      'KEY': 'Storage Key',
      'key': 'Storage Key',
      'TYPX': 'Data Space Type',
      'typx': 'Data Space Type',
      'SCOX': 'Data Space Scope',
      'scox': 'Data Space Scope',
      'REFX': 'Storage Reference',
      'refx': 'Storage Reference',
      'PROX': 'Storage Protect',
      'prox': 'Storage Protect',
      'CSIZ': 'Current Size (Average)',
      'csiz': 'Current Size (Average)',
      'CSIZAVG': 'Current Size (Average)',
      'csizavg': 'Current Size (Average)',
      'CSIZ_SUM': 'Current Size (Sum)',
      'csizsum': 'Current Size (Sum)',
      'MSIZ': 'Maximum Size (Average)',
      'msiz': 'Maximum Size (Average)',
      'MSIZAVG': 'Maximum Size (Average)',
      'msizavg': 'Maximum Size (Average)',
      'MSIZ_SUM': 'Maximum Size (Sum)',
      'msizsum': 'Maximum Size (Sum)'
    },
    cmf_xcfsys: {
      'from_system': 'From System',
      'to_system': 'To System',
      'transport_class': 'Transport Class',
      'total_messages': 'Total Messages',
      'percent_messages_big': '% Messages Big',
      'percent_messages_fit': '% Messages Fit',
      'percent_messages_small': '% Messages Small',
      'no_paths_count': 'No Paths Count',
      'no_buffers_count': 'No Buffers Count',
      'percent_messages_degraded': '% Messages Degraded',
      'transport_class_longest_message': 'Transport Class Longest Message',
      'avg_used_message_blocks': 'Avg Used Message Blocks',
      'percent_transport_class_buffers_used': '% of Transport Class Buffers Used',
      'max_message': 'Maximum Message',
      'percent_system_buffers_used': '% of System Buffers Used',
      'max_message_blocks': 'Maximum Message Blocks',
      'path_direction': 'Path Direction'
    },
    cmf_jcsa: {
      'jobname': 'Jobname',
      'jes_id': 'JES ID',
      'asid': 'Address Space ID',
      'csa_in_use_percent': 'CSA In Use Percent',
      'ecsa_in_use_percent': 'ECSA In Use Percent',
      'sqa_in_use_percent': 'SQA In Use Percent',
      'esqa_in_use_percent': 'ESQA In Use Percent',
      'csa_in_use': 'CSA in Use',
      'ecsa_in_use': 'ECSA in Use',
      'sqa_in_use': 'SQA In Use',
      'esqa_in_use': 'ESQA In Use',
      'total_used_common_storage': 'Used Common Storage',
      'total_used_percent': 'Total Used Common Storage Percent'
    },
    cmf_xcfmbr: {},
    cmf_syscpc: {
      'smf_id': 'SMF ID',
      'SMF_ID': 'SMF ID',
      'system_name': 'System Name',
      'SYSTEM_NAME': 'System Name',
      'hardware_name': 'Hardware Name',
      'HARDWARE_NAME': 'Hardware Name',
      'cpu_model': 'CPU Model',
      'CPU_MODEL': 'CPU Model',
      'cpc_capacity': 'CPC Capacity',
      'CPC_CAPACITY': 'CPC Capacity',
      'base_cpc_capacity': 'Base CPC Capacity',
      'BASE_CPC_CAPACITY': 'Base CPC Capacity',
      'capacity_on_demand': 'Capacity on Demand',
      'CAPACITY_ON_DEMAND': 'Capacity on Demand'
    }
  };

  // Columns to hide from display
  const hiddenColumns = {
    rmf_ard: ['id'],
    rmf_pgspp: [],
    rmf_trx: ['id'],
    rmf_asrm: ['id'],
    rmf_asd: ['id'],
    rmf_spag: ['id'],
    rmf_srcs: ['id'],
    cmf_dspcz: ['id'],
    cmf_jcsa: ['id'],
    cmf_xcfmbr: ['id'],
    cmf_syscpc: ['id']
  };

  const getDisplayName = (columnName, modalType) => {
    const normalizeTurkish = (text) => {
      if (!text || typeof text !== 'string') return text;
      return text
        .replace(/İ/g, 'I')
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'i')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u');
    };
    // pdibsypc için kapsamlı kontrol - tüm olası formatlar
    if (columnName && typeof columnName === 'string') {
      const upperColumnName = columnName.toUpperCase();
      if (upperColumnName === 'pdibsypc' || 
          upperColumnName === 'pdibsypc' || 
          upperColumnName.includes('pdibsypc') ||
          columnName === 'pdibsypc' ||
          columnName.toLowerCase().includes('pdibsypc')) {
        return normalizeTurkish('In Use Percentage');
      }
    }
    
    if (columnMapping[modalType] && columnMapping[modalType][columnName]) {
      return normalizeTurkish(columnMapping[modalType][columnName]);
    }
    // Fallback for unmapped column names: remove underscores
    if (typeof columnName === 'string') {
      return normalizeTurkish(columnName.replace(/_/g, ' '));
    }
    return normalizeTurkish(columnName);
  };

  // Başlıkları düzenle: Title Case (ilk harf büyük, diğerleri küçük)
  const toTitleCase = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const getCurrentRawData = () => {
    return activeModal ? data[activeModal] || [] : [];
  };

  // Numeric column detector: only treat columns as sortable if numeric
  const isNumericColumn = (column) => {
    const rows = getCurrentRawData();
    for (let i = 0; i < rows.length; i++) {
      const value = rows[i]?.[column];
      if (value !== null && value !== undefined && value !== '') {
        const num = Number(value);
        return !isNaN(num) && isFinite(num);
      }
    }
    return false;
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
    // Only allow sorting for numeric columns
    if (!isNumericColumn(column)) {
      return;
    }
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
        // Diğer kolonlar sadece sayısalsa sıralanabilir
        return isNumericColumn(column);
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
        // Diğer kolonlar sadece sayısalsa sıralanabilir
        return isNumericColumn(column);
      }
      
      // Diğer kartlar için genel kurallar
      const passesGeneralRule = !(column.includes('timestamp') || column.includes('time') || 
               column === 'id' || column.includes('name') || column.includes('type') || 
               column.includes('status') || column.includes('serial'));
      return passesGeneralRule && isNumericColumn(column);
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
        chartDataPoints = trxData
          .map((item, index) => {
            const dateVal = new Date(item.bmctime || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            return {
          x: index,
          y: parseFloat(item[field]) || 0,
          label: item.mxgcnm || '',
              value: parseFloat(item[field]) || 0,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
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
        chartDataPoints = ardData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            return {
          x: index,
          y: parseFloat(item[field]) || 0,
          label: item.jobname || '',
              value: parseFloat(item[field]) || 0,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
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
        'pdibsypc': 'pdibsypc'
      };
      
      const field = chartFieldMapping[chartType];
      if (field && pgsppData.length > 0) {
        chartDataPoints = pgsppData
          .map((item, index) => {
            const dateVal = new Date(item.timestamp || item.record_timestamp || item.bmctime || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            return {
          x: index,
          y: parseFloat(item[field]) || 0,
          label: item.pdgdsn || '',
              value: parseFloat(item[field]) || 0,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // SRCS verisine göre grafik verisi oluştur
    else if (activeModal === 'rmf_srcs') {
      const srcsData = data.rmf_srcs || [];
      const chartFieldMapping = {
        'splafcav': 'splafcav',
        'spluicav': 'spluicav',
        'splstfav': 'splstfav',
        'spllpfav': 'spllpfav',
        'spllffav': 'spllffav',
        'splcpfav': 'splcpfav',
        'splclfav': 'splclfav',
        'splrffav': 'splrffav',
        'splqpcav': 'splqpcav',
        'splqpeav': 'splqpeav',
        'sclinav': 'sclinav',
        'scllotav': 'scllotav',
        'sclotrav': 'sclotrav',
        'sclotwav': 'sclotwav'
      };
      const field = chartFieldMapping[chartType];
      if (field && srcsData.length > 0) {
        chartDataPoints = srcsData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawVal = item[field] ?? item[field.toUpperCase?.()] ?? item[field.toLowerCase?.()];
            return {
              x: index,
              y: parseFloat(rawVal) || 0,
              label: '',
              value: parseFloat(rawVal) || 0,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // ASRM verisine göre grafik verisi oluştur
    else if (activeModal === 'rmf_asrm') {
      const asrmData = data.rmf_asrm || [];
      const chartFieldMapping = {
        'asgpgp': 'asgpgp',
        'assactm': 'assactm',
        'asgrtm': 'asgrtm',
        'asstrc': 'asstrc',
        'assjsw': 'assjsw',
        'assscsck': 'assscsck',
        'assmsock': 'assmsock',
        'assiocck': 'assiocck',
        'asssrsck': 'asssrsck',
        'asswmck': 'asswmck'
      };
      const field = chartFieldMapping[chartType];
      if (field && asrmData.length > 0) {
        chartDataPoints = asrmData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawVal = item[field] ?? item[field.toUpperCase?.()] ?? item[field.toLowerCase?.()];
            return {
              x: index,
              y: parseFloat(rawVal) || 0,
              label: item.asgname || item.ASGNAME || '',
              value: parseFloat(rawVal) || 0,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // ASD verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'rmf_asd') {
      const asdData = data.rmf_asd || [];
      const field = chartType; // chartType doğrudan kolon adı olacak
      if (field && asdData.length > 0) {
        chartDataPoints = asdData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // SPAG verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'rmf_spag') {
      const spagData = data.rmf_spag || [];
      const field = chartType;
      if (field && spagData.length > 0) {
        chartDataPoints = spagData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // CMF DSPCZ verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'cmf_dspcz') {
      const dspczData = data.cmf_dspcz || [];
      const field = chartType;
      if (field && dspczData.length > 0) {
        chartDataPoints = dspczData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // CMF XCFSYS verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'cmf_xcfsys') {
      const xcfsysData = data.cmf_xcfsys || [];
      const field = chartType;
      if (field && xcfsysData.length > 0) {
        chartDataPoints = xcfsysData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // CMF JCSA verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'cmf_jcsa') {
      const jcsaData = data.cmf_jcsa || [];
      const field = chartType;
      if (field && jcsaData.length > 0) {
        chartDataPoints = jcsaData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // CMF XCFMBR verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'cmf_xcfmbr') {
      const xcfmbrData = data.cmf_xcfmbr || [];
      const field = chartType;
      if (field && xcfmbrData.length > 0) {
        chartDataPoints = xcfmbrData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    // CMF SYSCPC verisine göre grafik verisi oluştur (dinamik kolonlar)
    else if (activeModal === 'cmf_syscpc') {
      const syscpcData = data.cmf_syscpc || [];
      const field = chartType;
      if (field && syscpcData.length > 0) {
        chartDataPoints = syscpcData
          .map((item, index) => {
            const dateVal = new Date(item.created_at || item.updated_at || item.timestamp || item.record_timestamp || item.time || Date.now());
            const timeStr = isNaN(dateVal.getTime())
              ? ''
              : dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const rawCandidate = item[field] ?? item[field?.toUpperCase?.()] ?? item[field?.toLowerCase?.()];
            const numericValue = parseFloat(rawCandidate);
            return {
              x: index,
              y: isNaN(numericValue) ? 0 : numericValue,
              label: '',
              value: isNaN(numericValue) ? 0 : numericValue,
              timeStr,
              dateVal,
            };
          })
          .sort((a, b) => (a.dateVal?.getTime?.() || 0) - (b.dateVal?.getTime?.() || 0))
          .map((d, idx) => ({ ...d, x: idx }));
      }
    }
    
    setChartData(chartDataPoints);
  };

  const closeChart = () => {
    setSelectedChart(null);
    setChartTab('chart');
  };

  const openInfo = (chartType) => {
    setPrevActiveTab(activeTab);
    // Convert to lowercase to ensure consistent matching
    const normalizedType = typeof chartType === 'string' ? chartType.toLowerCase() : chartType;
    setInfoModal(normalizedType);
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
    // Sıralama durumunu sıfırla
    setSortColumn(null);
    setSortDirection('asc');
  };

  useEffect(() => {
    if (activeModal) {
      loadDataForActiveModal();
    }
  }, [activeModal]);

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
    // Sıralama durumunu sıfırla
    setSortColumn(null);
    setSortDirection('asc');
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
          const itemTime = new Date(
            item.created_at || item.updated_at || item.timestamp || item.bmctime || item.record_timestamp || item.time
          );
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
          const itemTime = new Date(
            item.created_at || item.updated_at || item.timestamp || item.bmctime || item.record_timestamp || item.time
          );
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
          CMF Resource Measurement
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
                    {(cardData.find(card => card.id === activeModal)?.title || 'RMF') + ' Detayları'}
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
                            className="group relative bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Average Active Time */}
                          <div 
                            onClick={() => openChart('mxixavg')}
                            className="group relative bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Transaction Rate */}
                          <div 
                            onClick={() => openChart('mxirate')}
                            className="group relative bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Transactions Completed */}
                          <div 
                            onClick={() => openChart('mxircp')}
                            className="group relative bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
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
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Page Slot In Use Percentage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_pgspp && data.rmf_pgspp.length > 0 ? (
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800`}>
                                    {formatNumber(data.rmf_pgspp[0]?.pdislupc || 0)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
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
                            onClick={() => openChart('pdibsypc')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('pdibsypc');
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
                                    {formatNumber(data.rmf_pgspp[0]?.pdibsypc || 0)}%
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
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Jobname</h5>
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
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Device Connection Time</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* CPU Seconds */}
                          <div 
                            onClick={() => openChart('cpu_seconds')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">CPU Seconds</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Current Fixed Frames < 16M */}
                          <div 
                            onClick={() => openChart('current_fixed_frames_16m')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Fixed Frames &lt; 16M</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Current Fixed Frame Count */}
                          <div 
                            onClick={() => openChart('current_fixed_frame_count')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Fixed Frame Count</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Session SRM Service Absorption Rate */}
                          <div 
                            onClick={() => openChart('session_srm_service_absorption_rate')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">SRM Absorption Rate</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Session CPU Seconds in TCB Mode */}
                          <div 
                            onClick={() => openChart('session_cpu_seconds_tcb_mode')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Session CPU (TCB)</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* EXCP Rate Per Second */}
                          <div 
                            onClick={() => openChart('excp_rate_per_second')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">EXCP Rate/Sec</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Swap Page Rate Per Second */}
                          <div 
                            onClick={() => openChart('swap_page_rate_per_second')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Swap Page Rate/Sec</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Interval LPA Page Rate */}
                          <div 
                            onClick={() => openChart('interval_lpa_page_rate')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">LPA Page Rate</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Interval CSA Page-In Rate */}
                          <div 
                            onClick={() => openChart('interval_csa_page_in_rate')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">CSA Page-In Rate</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Realtime Non-VIO Page Rate */}
                          <div 
                            onClick={() => openChart('realtime_non_vio_page_rate')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">Realtime Non-VIO Rate</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Private VIO and Hiperspace Page Rate */}
                          <div 
                            onClick={() => openChart('private_vio_hiperspace_page_rate')}
                            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
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
                            {/* Tıklanabilir göstergesi */}
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">VIO Hiperspace Rate</h5>
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
                            <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
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
                      ) : activeModal === 'rmf_asrm' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Info-only cards */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('asgname');
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
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Jobname</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_asrm && data.rmf_asrm.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_asrm[0]?.asgname || data.rmf_asrm[0]?.ASGNAME || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('asgcnmc');
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
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Service Class Name</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {data.rmf_asrm && data.rmf_asrm.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {data.rmf_asrm[0]?.asgcnmc || data.rmf_asrm[0]?.ASGCNMC || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Clickable numeric cards */}
                          {[
                            { key: 'asgpgp', title: 'Service Class Index or Performance Period' },
                            { key: 'assactm', title: 'The TRANSACTION ACTIVE time' },
                            { key: 'asgrtm', title: 'Current Residency Time' },
                            { key: 'asstrc', title: 'Session Transaction Count' },
                            { key: 'assjsw', title: 'Swap Total' },
                            { key: 'assscsck', title: 'CPU Service Unit Count' },
                            { key: 'assmsock', title: 'Service Units Consumed Using Real Storage' },
                            { key: 'assiocck', title: 'I/O Service Units Consumed by the Transaction' },
                            { key: 'asssrsck', title: 'SRB Processor Service Consumed by Transaction' },
                            { key: 'asswmck', title: 'Total Service Units' }
                          ].map((itemCfg, idx) => (
                            <div 
                              key={idx}
                              onClick={() => openChart(itemCfg.key)}
                              className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo(itemCfg.key);
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              {/* Tıklanabilir göstergesi */}
                              <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{itemCfg.title}</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {data.rmf_asrm && data.rmf_asrm.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(data.rmf_asrm[0]?.[itemCfg.key] || data.rmf_asrm[0]?.[itemCfg.key.toUpperCase()] || 0)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                            </div>
                          ))}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.rmf_asrm && data.rmf_asrm.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_asrm[0]?.created_at || data.rmf_asrm[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_asrm[0]?.created_at || data.rmf_asrm[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'rmf_srcs' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[
                            { key: 'splafcav', title: 'Available Frames' },
                            { key: 'spluicav', title: 'Current UIC' },
                            { key: 'splstfav', title: 'SQA Frames Count' },
                            { key: 'spllpfav', title: 'LPA Frame Count' },
                            { key: 'spllffav', title: 'LPA Fixed Frame Count' },
                            { key: 'splcpfav', title: 'Pageable CSA and MLPA Frames Count' },
                            { key: 'splclfav', title: 'Fixed LPA and CSA Frames Count' },
                            { key: 'splrffav', title: 'Private Non-LSQA Fixed Frame Count' },
                            { key: 'splqpcav', title: 'Private Fixed Frames Count' },
                            { key: 'splqpeav', title: 'LSQA Frame Count' },
                            { key: 'sclinav', title: 'Current IN Queue Length' },
                            { key: 'scllotav', title: 'Address Spaces Logically Swapped Out' },
                            { key: 'sclotrav', title: 'Current Out Ready Queue Length' },
                            { key: 'sclotwav', title: 'Current Out Wait Queue Length' }
                          ].map((itemCfg, idx) => (
                            <div 
                              key={idx}
                              onClick={() => openChart(itemCfg.key)}
                              className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer p-6 hover:-translate-y-3 hover:scale-[1.02] pulse-subtle"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInfo(itemCfg.key);
                                }}
                                className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              {/* Tıklanabilir göstergesi */}
                              <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{itemCfg.title}</h5>
                                <div className="text-2xl font-bold text-gray-900">
                                  {data.rmf_srcs && data.rmf_srcs.length > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                      {formatNumber(data.rmf_srcs[0]?.[itemCfg.key] || data.rmf_srcs[0]?.[itemCfg.key.toUpperCase()] || 0)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                            </div>
                          ))}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.rmf_srcs && data.rmf_srcs.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_srcs[0]?.created_at || data.rmf_srcs[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_srcs[0]?.created_at || data.rmf_srcs[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'rmf_asd' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.rmf_asd || [];
                            const first = rows[0] || {};
                            const timeLike = ['created_at','updated_at','timestamp','bmctime','record_timestamp','time'];
                            const keys = Object.keys(first || {})
                              .filter(k => k !== 'id')
                              .filter(k => !timeLike.includes(String(k).toLowerCase()));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(keyName);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'rmf_asd'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.rmf_asd && data.rmf_asd.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_asd[0]?.created_at || data.rmf_asd[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_asd[0]?.created_at || data.rmf_asd[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'rmf_spag' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.rmf_spag || [];
                            const first = rows[0] || {};
                            const timeLike = ['created_at','updated_at','timestamp','bmctime','record_timestamp','time'];
                            const keys = Object.keys(first || {})
                              .filter(k => k !== 'id')
                              .filter(k => !timeLike.includes(String(k).toLowerCase()));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                {isNumericColumn(keyName) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInfo(keyName);
                                    }}
                                    className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                )}
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'rmf_spag'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.rmf_spag && data.rmf_spag.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.rmf_spag[0]?.created_at || data.rmf_spag[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.rmf_spag[0]?.created_at || data.rmf_spag[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'cmf_dspcz' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.cmf_dspcz || [];
                            const first = rows[0] || {};
                            const timeLike = ['created_at','updated_at','timestamp','bmctime','record_timestamp','time'];
                            const keys = Object.keys(first || {})
                              .filter(k => k !== 'id')
                              .filter(k => !timeLike.includes(String(k).toLowerCase()));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(keyName);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'cmf_dspcz'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.cmf_dspcz && data.cmf_dspcz.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.cmf_dspcz[0]?.created_at || data.cmf_dspcz[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.cmf_dspcz[0]?.created_at || data.cmf_dspcz[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'cmf_xcfsys' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.cmf_xcfsys || [];
                            const first = rows[0] || {};
                            const timeLike = ['created_at','updated_at','timestamp','bmctime','record_timestamp','time'];
                            const keys = Object.keys(first || {})
                              .filter(k => k !== 'id')
                              .filter(k => !timeLike.includes(String(k).toLowerCase()));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(keyName);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'cmf_xcfsys'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.cmf_xcfsys && data.cmf_xcfsys.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.cmf_xcfsys[0]?.created_at || data.cmf_xcfsys[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.cmf_xcfsys[0]?.created_at || data.cmf_xcfsys[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'cmf_jcsa' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.cmf_jcsa || [];
                            const first = rows[0] || {};
                            const keys = Object.keys(first || {})
                              .filter(k => k !== 'id')
                              .filter(k => !['created_at', 'updated_at', 'timestamp', 'bmctime', 'record_timestamp', 'time', 'last_update_time', 'bmc_time'].includes(k));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(keyName);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'cmf_jcsa'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.cmf_jcsa && data.cmf_jcsa.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.cmf_jcsa[0]?.created_at || data.cmf_jcsa[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.cmf_jcsa[0]?.created_at || data.cmf_jcsa[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'cmf_xcfmbr' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.cmf_xcfmbr || [];
                            const first = rows[0] || {};
                            const keys = Object.keys(first || {})
                              .filter(k => !['id','created_at','updated_at','timestamp','bmctime','record_timestamp','time'].includes(k));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(keyName);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'cmf_xcfmbr'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.cmf_xcfmbr && data.cmf_xcfmbr.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.cmf_xcfmbr[0]?.created_at || data.cmf_xcfmbr[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.cmf_xcfmbr[0]?.created_at || data.cmf_xcfmbr[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-blue-400">Veri yok</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeModal === 'cmf_syscpc' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const rows = data.cmf_syscpc || [];
                            const first = rows[0] || {};
                            const timeLike = ['created_at','updated_at','timestamp','bmctime','record_timestamp','time'];
                            const keys = Object.keys(first || {})
                              .filter(k => k !== 'id')
                              .filter(k => !timeLike.includes(String(k).toLowerCase()));
                            const nonNumeric = keys.filter(k => !isNumericColumn(k));
                            const numeric = keys.filter(k => isNumericColumn(k));
                            const ordered = [...nonNumeric, ...numeric];
                            return ordered.map((keyName, idx) => (
                              <div 
                                key={`${keyName}-${idx}`}
                                onClick={() => {
                                  if (isNumericColumn(keyName)) openChart(keyName);
                                }}
                                className={`group relative rounded-2xl transition-all duration-500 p-6 ${
                                  isNumericColumn(keyName)
                                    ? 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/40 cursor-pointer hover:-translate-y-3 hover:scale-[1.02] pulse-subtle'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(keyName);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse group-hover:bg-green-500 transition-colors duration-300"></div>
                                )}
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-300">{toTitleCase(getDisplayName(keyName, 'cmf_syscpc'))}</h5>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {rows.length > 0 ? (
                                      (() => {
                                        const rawVal = rows[0]?.[keyName] ?? rows[0]?.[keyName?.toUpperCase?.()];
                                        const display = isNumericColumn(keyName)
                                          ? formatNumber(Number(rawVal) || 0)
                                          : (rawVal === null || rawVal === undefined || rawVal === ''
                                              ? '-'
                                              : String(rawVal));
                                        return (
                                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                            {display}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                                {isNumericColumn(keyName) && (
                                  <div className="absolute bottom-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}

                          {/* Last Update */}
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-blue-800 text-lg mb-2">Last Update</h5>
                              <div className="text-sm font-semibold text-blue-700">
                                {data.cmf_syscpc && data.cmf_syscpc.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date(data.cmf_syscpc[0]?.created_at || data.cmf_syscpc[0]?.updated_at || new Date()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {new Date(data.cmf_syscpc[0]?.created_at || data.cmf_syscpc[0]?.updated_at || new Date()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
        {selectedChart && ['rmf_trx', 'rmf_pgspp', 'rmf_ard', 'rmf_asrm', 'rmf_srcs', 'rmf_asd', 'rmf_spag', 'cmf_dspcz', 'cmf_xcfsys', 'cmf_jcsa', 'cmf_xcfmbr', 'cmf_syscpc'].includes(activeModal) && (
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
                    {selectedChart === 'pdibsypc' && 'In Use Percentage'}
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
                    {/* RMF ASRM */}
                    {selectedChart === 'asgpgp' && 'Service Class Index or Performance Period'}
                    {selectedChart === 'assactm' && 'The TRANSACTION ACTIVE time'}
                    {selectedChart === 'asgrtm' && 'Current Residency Time'}
                    {selectedChart === 'asstrc' && 'Session Transaction Count'}
                    {selectedChart === 'assjsw' && 'Swap Total'}
                    {selectedChart === 'assscsck' && 'CPU Service Unit Count'}
                    {selectedChart === 'assmsock' && 'Service Units Consumed Using Real Storage'}
                    {selectedChart === 'assiocck' && 'I/O Service Units Consumed by the Transaction'}
                    {selectedChart === 'asssrsck' && 'SRB Processor Service Consumed by Transaction'}
                    {selectedChart === 'asswmck' && 'Total Service Units'}
                    {/* RMF SRCS */}
                    {selectedChart === 'splafcav' && 'Available Frames'}
                    {selectedChart === 'spluicav' && 'Current UIC'}
                    {selectedChart === 'splstfav' && 'SQA Frames Count'}
                    {selectedChart === 'spllpfav' && 'LPA Frame Count'}
                    {selectedChart === 'spllffav' && 'LPA Fixed Frame Count'}
                    {selectedChart === 'splcpfav' && 'Pageable CSA and MLPA Frames Count'}
                    {selectedChart === 'splclfav' && 'Fixed LPA and CSA Frames Count'}
                    {selectedChart === 'splrffav' && 'Private Non-LSQA Fixed Frame Count'}
                    {selectedChart === 'splqpcav' && 'Private Fixed Frames Count'}
                    {selectedChart === 'splqpeav' && 'LSQA Frame Count'}
                    {selectedChart === 'sclinav' && 'Current IN Queue Length'}
                    {selectedChart === 'scllotav' && 'Address Spaces Logically Swapped Out'}
                    {selectedChart === 'sclotrav' && 'Current Out Ready Queue Length'}
                    {selectedChart === 'sclotwav' && 'Current Out Wait Queue Length'}
                    {/* RMF ASD - Dinamik başlık */}
                    {activeModal === 'rmf_asd' && selectedChart && getDisplayName(selectedChart, 'rmf_asd')}
                    {/* RMF SPAG - Dinamik başlık */}
                    {activeModal === 'rmf_spag' && selectedChart && getDisplayName(selectedChart, 'rmf_spag')}
                    {activeModal === 'cmf_dspcz' && selectedChart && getDisplayName(selectedChart, 'cmf_dspcz')}
                    {activeModal === 'cmf_xcfsys' && selectedChart && getDisplayName(selectedChart, 'cmf_xcfsys')}
                    {activeModal === 'cmf_jcsa' && selectedChart && getDisplayName(selectedChart, 'cmf_jcsa')}
                    {activeModal === 'cmf_xcfmbr' && selectedChart && getDisplayName(selectedChart, 'cmf_xcfmbr')}
                    {activeModal === 'cmf_syscpc' && selectedChart && getDisplayName(selectedChart, 'cmf_syscpc')}
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
                            
                            // X-axis with time labels (when available)
                            const axisY = margin.top + height;
                            const xAxis = (
                              <g>
                                <line x1={margin.left} y1={axisY} x2={width + margin.left} y2={axisY} stroke="#e5e7eb" strokeWidth="1" />
                                {(() => {
                                  const maxTicks = 8;
                                  const n = chartData.length;
                                  const step = Math.max(1, Math.floor(n / maxTicks));
                                  const tickIndices = [];
                                  for (let i = 0; i < n; i += step) tickIndices.push(i);
                                  if (tickIndices[tickIndices.length - 1] !== n - 1) tickIndices.push(n - 1);
                                  return tickIndices.map((ti, idx) => (
                                    <g key={`xtick-${idx}`}>
                                      <line x1={xPos(ti)} y1={axisY} x2={xPos(ti)} y2={axisY + 4} stroke="#9ca3af" strokeWidth="1" />
                                      <text x={xPos(ti)} y={axisY + 16} textAnchor="middle" fontSize="10" fill="#6b7280">
                                        {chartData[ti]?.timeStr || `${ti + 1}`}
                                      </text>
                                    </g>
                                  ));
                                })()}
                              </g>
                            );
                            
                            return (
                              <>
                                <rect width="800" height="300" fill="#f9fafb" />
                                {gridLines}
                                {xAxis}
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
                        {selectedChart === 'pdibsypc' && 'In Use Percentage Threshold Ayarları'}
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
                                  selectedChart === 'pdibsypc' ? "95" :
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
                                  selectedChart === 'pdibsypc' ? "80" :
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
                                  selectedChart === 'pdibsypc' ? "65" :
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]" onClick={() => { setActiveTab(prevActiveTab || 'table'); closeInfo(); }}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Info Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {(() => {
                      if (!infoModal) return '';
                      const displayName = getDisplayName(infoModal, activeModal);
                      // Eğer mapping bulunamazsa veya sonuç infoModal ile aynıysa, title case'e çevir
                      if (!displayName || displayName === infoModal) {
                        return toTitleCase(infoModal);
                      }
                      return displayName;
                    })()}
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
                  {/* RMF TRX Info Cards */}
                  {infoModal === 'mxgcnm' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Service Class Name (MXGCNM), işlemlerin atandığı servis sınıfı, rapor sınıfı veya performans grubunun adını belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          WLM (Workload Manager) yapısında, servis sınıfı iş yüklerinin hedeflerini (response time, velocity vb.) tanımlar. 
                          Rapor sınıfları ve performans grupları, tarihi uyumluluk ve raporlama için kullanılır. MXGCNM, TRX kayıtlarında 
                          bu sınıflandırmayı metin olarak taşır ve korelasyon için anahtar bir alandır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Performans analizinde belirli bir servis sınıfının hedeflerini tutturup tutturmadığını ve hangi iş yüklerinin 
                          sınıfı zorladığını görmenizi sağlar. Kapasite planlama ve WLM politikası iyileştirmeleri için kritik önemdedir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'mxgcpn' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Period Number (MXGCPN), servis/rapor sınıfı veya performans grubundaki dönem numarasını belirtir. 
                          Her sınıf en fazla sekiz döneme sahip olabilir. Veri onaltılık (hex) formatta tutulabilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Dönemler, iş yükü yoğunlaştıkça farklı hedef ve paylaştırma politikalarının uygulanmasını sağlar (ör. period 1 öncelikli). 
                          MXGCPN, dönem bazlı performans eğrilerini ve WLM geçiş davranışını analiz etmek için kullanılır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Hangi dönemde darboğaz oluştuğunu, hedef sapmalarının hangi aşamada başladığını görmenizi sağlar. 
                          Dönem eşiklerinin ve hedeflerinin doğru ayarlanması için gereklidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'mxgtypc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          WLM Type (MXGTYPC), raporlanan servis sınıfının türünü (ör. service class, report class, performance group) metin olarak belirtir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Değer, WLM raporlama/denetim bağlamını ayırt etmek için kullanılır. Analizde aynı isimli fakat farklı türde 
                          sınıfların karışmasını engeller ve veri modelinde doğru birleştirmeyi sağlar.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yanlış sınıf türü üzerinden yorum, hatalı tuning’e yol açabilir. MXGTYPC, doğru bağlamda karşılaştırma ve 
                          trend analizi yapılmasına yardımcı olur.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'mxiasac' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Average Number of AS Counted (MXIASAC), gecikme yaşayan veya CPU kullanan adres alanlarının ortalama sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Örnekleme periyodunda delay veya kullanım sinyali bulunan address space sayısı üzerinden hesaplanır. 
                          Yük yoğunluğu ve eşzamanlılık seviyesini yansıtan bir metriktir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Aynı anda aktif/engellenmiş adres alanı sayısındaki artış, CPU, I/O veya bellek rekabetine işaret eder. 
                          Kapasite artışı veya WLM hedef ayarı gereksinimini erkenden gösterir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'mxixavg' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Average Active Time (MXIXAVG), işlemlerin yürütme (execution) fazındaki ortalama süreyi saniye cinsinden gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          TRX kayıtları bazında, transaction’ın aktif CPU kullanımı ve bekleme dışı çalışma zamanının ortalaması alınır. 
                          CPU bound/delay bound ayrımı için yardımcı bir göstergedir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yürütme süresindeki artış, uygulama verimsizliği, CPU rekabeti veya I/O beklemeleri ile ilişkili olabilir. 
                          Tuning önceliklendirmesi ve SLA takibi için ana metriktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'mxirate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Transaction Rate (MXIRATE), birim zamanda tamamlanan işlem (transaction) hızını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Ölçüm penceresi boyunca sonlanan transaction sayısı üzerinden oran hesaplanır. 
                          Trafik yoğunluğu ve throughput trendlerini analiz etmek için kullanılır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Throughput düşüşü, altyapı darboğazı, WLM kısıtı veya uygulama yavaşlamasına işaret edebilir. 
                          Kapasite planlaması ve ölçeklendirme kararlarında temel bir göstergedir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'mxircp' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Transactions Completed (MXIRCP), tamamlanan toplam işlem sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Belirli zaman aralığında "ended" durumuna gelen transaction’ların sayımıdır. 
                          Hacim (volume) ölçüsü olup hata/başarı oranı analizine temel oluşturur.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Tamamlanan işlem sayısındaki ani düşüşler üretim kesintilerini, sıra birikmelerini veya 
                          back-end bağımlılık problemlerini gösterebilir. Operasyonel sağlık takibi için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}
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
                  {infoModal === 'pdibsypc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          In Use Percentage (pdibsypc) alanı, sayfa veri setinin ölçüm aralığı boyunca ne kadar yüzdesinin 
                          Auxiliary Storage Manager (ASM) tarafından kullanıldığını söyler.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Yüzde değeri (0-100%)</li>
                          <li>• <strong>Hesaplama:</strong> Kullanım süresi / Toplam ölçüm aralığı × 100</li>
                          <li>• <strong>ASM Kullanımı:</strong> Auxiliary Storage Manager (Yardımcı Depolama Yöneticisi) tarafından aktif kullanım</li>
                          <li>• <strong>Zaman Aralığı:</strong> Belirli ölçüm periyodu boyunca hesaplanır</li>
                          <li>• <strong>Kapsam:</strong> Sayfa veri setinin aktif kullanım durumu</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          In Use Percentage, sayfa veri setinin ne kadar aktif kullanıldığını belirlemek için kritik öneme sahiptir. 
                          Yüksek değerler, o veri setinin sistem için önemli olduğunu ve ASM tarafından yoğun şekilde kullanıldığını 
                          gösterir. Bu metrik sayesinde sayfa veri setlerinin kullanım yoğunluğunu analiz edebilir, kaynak planlaması 
                          yapabilir, performans darboğazlarını tespit edebilir ve optimizasyon stratejileri geliştirebilirsiniz.
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

                  {/* ============== RMF ARD INFO CARDS ============== */}
                  {infoModal === 'jobname' && activeModal === 'rmf_ard' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Jobname alanı, adres alanını kullanan iş biriminin kullanıcı kimliğini (userid), iş adını veya prosedür adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Kaynak: SMF/RMF kayıtlarından alınır</li>
                          <li>Format: 1-8 karakterlik isim/prosedür</li>
                          <li>Bağlam: Adres alanı/iş birimi tanımlaması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Performans veya kaynak kullanım sorunlarını doğrudan ilgili iş veya kullanıcı ile ilişkilendirmenizi sağlar.</p>
                      </div>
                    </div>
                  )}
                  
                  {infoModal==='device_connection_time_seconds' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Device Connection Time for the Job (İş İçin Cihaz Bağlantı Süresi) alanı, iş için herhangi bir cihazın aktif olduğu saniye sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• <strong>Birim:</strong> Saniye (seconds)</li>
                          <li>• <strong>Kapsam:</strong> İş için aktif olan tüm cihazlar</li>
                          <li>• <strong>Ölçüm:</strong> Cihaz bağlantı süresi toplamı</li>
                          <li>• <strong>Zaman Aralığı:</strong> Oturum başlangıcından itibaren</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Device Connection Time, işin I/O operasyonlarını ve cihaz kullanım yoğunluğunu değerlendirmek için kritik öneme sahiptir. 
                          Yüksek değerler, işin yoğun I/O aktivitesi gerçekleştirdiğini ve cihazlara uzun süre bağlı kaldığını gösterir. 
                          Bu metrik sayesinde I/O performansını analiz edebilir, cihaz bağlantı sürelerini optimize edebilir, 
                          I/O darboğazlarını tespit edebilir ve kaynak kullanımını daha verimli hale getirebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}


                  {infoModal === 'current_fixed_frames_16m' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Fixed Frames &lt; 16M alanı, adres alanı en son örneklendiğinde 16M çizgisinin altındaki sabit depolama çerçevelerinin anlık sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Kapsam: 16MB altı alan</li>
                          <li>Örnekleme: interval başı/sırasında örnek</li>
                          <li>Tür: sabitlenmiş (fixed) çerçeve sayısı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Eski mimari bağımlılıkları ve alt-16MB baskısını saptamada yardımcı olur; sanal depolama baskısını azaltmak için ipucu verir.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'current_fixed_frame_count' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Fixed Frame Count, adres alanı tarafından şu anda tutulan toplam sabit depolama çerçevesi sayısını gösterir (paylaşılan sayfalar hariç).
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Kapsam: tüm adres alanı</li>
                          <li>Dahil değil: paylaşılan sayfalar</li>
                          <li>Ölçüm: anlık sayım</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Aşırı sabitleme bellek esnekliğini düşürür; sistemin sayfalama/verimliliğini olumsuz etkileyebilir.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'cross_memory_register' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Cross Memory Register, işin başka bir adres alanı ile iletişim kurmak için cross memory talimatlarını kullanıp kullanmadığını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Değer: Gösterge (X/boş)</li>
                          <li>Kapsam: adres alanları arası erişim</li>
                          <li>Etkiler: güvenlik ve performans</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Çapraz bellek kullanımı, bağımlılıkları ve muhtemel kaynak çekişmelerini anlamaya yardımcı olur.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'session_srm_service_absorption_rate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Session SRM Service Absorption Rate, oturum başladığından beri işlemin sistem kaynaklarını tüketme hızını gösteren bir sayıdır.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: SRM servis birimi/süre</li>
                          <li>Kapsam: oturum başlangıcından itibaren</li>
                          <li>Kaynak: WLM/SRM ölçümleri</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">İşlem yükünün sistem kaynak tüketim oranını yansıtır; kapasite planlama ve önceliklemeye temel oluşturur.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'session_cpu_seconds_tcb_mode' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Session CPU Seconds in TCB Mode, oturum başladığından beri TCB modunda iş tarafından tüketilen CPU saniyesi sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: saniye</li>
                          <li>Bağlam: TCB (Task Control Block) modu</li>
                          <li>Kapsam: oturum bazlı kümülatif</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">İşin CPU tüketimini ve TCB yükünü değerlendirerek işlem verimliliğini analiz etmeye yardımcı olur.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'cpu_seconds' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CPU Seconds, oturum başlangıcından bu yana adres alanı tarafından tüketilen toplam CPU süresini (saniye) gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: saniye</li>
                          <li>Kapsam: oturum başlangıcından itibaren kümülatif</li>
                          <li>Kaynak: CPU muhasebe ölçümleri</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">CPU tüketiminin eğilimini izleyerek kapasite, maliyet ve performans etkilerini değerlendirmeyi sağlar.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'excp_rate_per_second' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          EXCP Rate Per Second, bu aralıkta adres alanı tarafından saniye başına gerçekleştirilen EXCP sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: işlem/saniye</li>
                          <li>Kapsam: interval bazlı</li>
                          <li>Kaynak: I/O istek ölçümleri</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">EXCP yoğunluğu, I/O baskısını ve potansiyel darboğazları ortaya koyar; iş akışlarını optimize etmeyi sağlar.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'swap_page_rate_per_second' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Swap Page Rate Per Second, adres alanının swap işlemi nedeniyle saniye başına gerçekleşen page-in veya page-out sayısını gösterir. Değer bu aralıktaki aktiviteyi yansıtır.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: sayfa/saniye</li>
                          <li>Kapsam: swap kaynaklı sayfalama</li>
                          <li>Zaman: interval boyunca</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Yüksek swap sayfalaması yanıt süresini olumsuz etkiler; bellek kapasitesi ve yerleşimi için sinyal verir.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'interval_lpa_page_rate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Interval LPA Page Rate, bu aralıkta link pack area (LPA) sayfa veri setinden saniye başına sayfa çekme (page-in) sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: sayfa/saniye</li>
                          <li>Kaynak: LPA veri seti</li>
                          <li>Zaman: interval</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">LPA erişim yoğunluğu, ortak kod ve modül kullanımındaki baskıyı gösterir; LPA optimizasyonu için girdidir.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'interval_csa_page_in_rate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Interval CSA Page-In Rate, aralık başında gerçekleşen CSA page-in olaylarının sayısını gösterir. Bu değer, ortak alandaki (common area) sayfa hataları nedeniyle sayfalama sorunlarına yol açabilecek adres alanlarını belirlemenize yardımcı olabilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Birim: sayfa</li>
                          <li>Zaman: interval başlangıcı</li>
                          <li>Kapsam: CSA (Common Service Area)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">CSA tarafındaki sayfa hataları, ortak alan baskısını ve olası yapılandırma sorunlarını işaret eder.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'realtime_non_vio_page_rate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Realtime Non-VIO Page Rate, son 15 saniyede adres alanı için gerçekleşen VIO olmayan page-in ve page-out işlemlerinin saniye başına sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Pencere: ~15 saniyelik yakın gerçek zaman</li>
                          <li>Kapsam: Non-VIO sayfalama</li>
                          <li>Birim: işlem/saniye</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Kısa dönemli sayfalama baskısını gösterir; ani yük sıçramalarını ve bellek baskısını yakalamaya yardımcı olur.</p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'private_vio_hiperspace_page_rate' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Private VIO and Hiperspace Page Rate, işlem için gerçekleşen özel VIO ve hiperspace page-in/page-out sayısını gösterir. Şu anda swap dışı olan işler için bu değer raporlanmaz.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>Kapsam: Özel VIO + Hiperspace</li>
                          <li>Zaman: interval/gerçek zaman penceresi</li>
                          <li>Koşul: Swap dışı işlerde raporlanmaz</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Uygulamaların VIO/hiperspace kullanımını göstererek I/O ve bellek stratejilerini optimize etmenizi sağlar.</p>
                      </div>
                    </div>
                  )}

                  {/* ============== RMF ASRM INFO CARDS ============== */}
                  {infoModal === 'asgname' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Jobname (ASGNAME) alanı, adres uzayını kullanan iş biriminin kullanıcı kimliğini (userid), iş adını (job name)
                          veya prosedür adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Bu alan, adres uzayını kullanan iş birimini tanımlayan kimlik bilgisini taşır. Z/OS sisteminde her adres uzayı
                          bir kullanıcı kimliği, iş adı veya prosedür adı ile ilişkilendirilir. Bu değer, sistem kaynaklarının hangi
                          iş birimi tarafından kullanıldığını takip etmek için kullanılır ve diğer performans metrikleriyle korelasyon
                          için anahtar rol oynar.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Performans sorunlarını belirli bir iş, kullanıcı veya prosedürle ilişkilendirmek için kritik öneme sahiptir.
                          Kök neden analizi, kapasite planlaması ve kaynak kullanım maliyetlendirmesi için temel tanımlayıcıdır.
                          Sistem yöneticileri bu bilgiyi kullanarak hangi işlerin sistem kaynaklarını yoğun kullandığını tespit edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asgcnmc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Service Class Name (ASGCNMC) alanı, işin servis sınıfı adını içerir. BMC AMI Ops UI hariç, yetkiniz varsa
                          mevcut değer üzerine yeni bir servis sınıfı adı (veya QUIESCE veya RESUME) yazarak değiştirebilirsiniz.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Servis sınıfı, z/OS Workload Manager (WLM) tarafından iş yüklerine atanan performans hedeflerini ve
                          kaynak paylaştırma kurallarını tanımlar. WLM, servis sınıfları üzerinden response time, velocity gibi
                          hedefleri uygular. Bu alan, aktif WLM politikasındaki servis sınıfı yapılandırması ile performans verilerinin
                          eşleştirilmesi için kullanılır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yanlış servis sınıfı ataması veya uygunsuz hedefler, performans düşüşüne yol açabilir. Servis sınıfı adını
                          bilmek, WLM tuning, SLA takibi ve performans analizi için kritiktir. Ayrıca, yetkili kullanıcılar bu alan
                          üzerinden QUIESCE veya RESUME komutlarını kullanarak işleri kontrol edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asgpgp' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Service Class Index veya Performance Period (ASGPGP), z/OS Workload Manager (WLM)'in aktif Servis Politikasında
                          transaction'ın servis hedeflerini bulmak için kullandığı numarayı içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Servis Sınıfı İndeksi, WLM'in her servis sınıfı için tanımlı dönemleri (period) ve bu dönemlerdeki servis
                          hedeflerini takip etmek için kullandığı sayısal bir değerdir. WLM politikasında, servis sınıfları birden fazla
                          performans dönemine sahip olabilir ve her dönemde farklı hedefler tanımlanabilir. Bu alan, transaction'ın
                          hangi dönem/indeks altında çalıştığını ve hangi hedeflerin uygulandığını belirler.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Darboğazların ve performans sorunlarının hangi performans döneminde oluştuğunu belirlemek için kritiktir.
                          Bu bilgi, WLM politikasındaki dönem eşiklerinin ve hedef ayarlarının doğru yapılandırılıp yapılandırılmadığını
                          değerlendirmek ve tuning kararları almak için gereklidir. Ayrıca, performans eğrilerinin hangi dönemde
                          başladığını anlamak için kullanılır.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'assactm' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          TRANSACTION ACTIVE (ASSACTM) alanı, mevcut transaction'ın başladığından bu yana geçen süreyi içerir.
                          Zaman değeri hh.mm.ss formatında ifade edilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Bu metrik, transaction'ın aktif olduğu toplam süreyi ölçer. Transaction başladığında zamanlayıcı başlar ve
                          transaction sonlanana kadar devam eder. Değer, işlem yaşam döngüsü boyunca yürütme ve aktif fazdaki sürenin
                          toplamını gösterir. Bekleme durumları, I/O işlemleri ve CPU kullanımı gibi faktörler bu süreyi etkiler.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Transaction aktif süresindeki anormallikler, uygulama verimsizliği, kaynak rekabeti veya I/O gecikmeleri gibi
                          sorunlara işaret edebilir. SLA takibi, response time analizi ve performans sorunlarının tespiti için kritik
                          bir metriktir. Uzun aktif süreler, sistem darboğazları veya uygulama performans sorunları anlamına gelebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asgrtm' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Residency Time (ASGRTM) alanı, address space'in en son swap-out edildiğinden bu yana geçen süreyi gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Residency time, bir address space'in bellekte (real storage) ne kadar süredir kesintisiz kaldığını ölçer.
                          Address space swap-out edildiğinde bu sayaç sıfırlanır ve tekrar swap-in edildiğinde yeniden başlar. Bu metrik,
                          bellek baskısı altında çalışma kümeleri (working set) davranışlarını anlamak için kullanılır. Uzun süreli
                          residency, swap aktivitesinin düşük olduğunu ve bellek kaynaklarının yeterli olduğunu gösterebilir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Sık swap-in/swap-out işlemleri, performansı olumsuz etkiler çünkü disk I/O'larına neden olur ve latency artışı
                          yaratır. Residency süresi, bellek tuning ve kapasite planlaması için önemli bir sinyaldir. Kısa residency
                          süreleri, bellek baskısı ve yetersiz bellek kaynaklarına işaret edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asstrc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Session Transaction Count (ASSTRC) alanı, oturum süresince iş için gerçekleşen transaction sayısını gösterir.
                          Değer yalnızca iş şu anda bellekte (storage) olduğunda verilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Bu metrik, bir iş oturumunun başlamasından itibaren gerçekleşen toplam transaction sayısını ölçer. Sayaç,
                          address space bellekte olduğu sürece güncellenir. Swap-out durumunda sayaç durur ve swap-in sonrası devam eder.
                          Bu, iş hacmi (volume) göstergesidir ve throughput ölçümleriyle birlikte değerlendirilmelidir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Transaction sayısındaki anormal düşüşler, kuyruk birikmeleri, bağımlılık sorunları veya sistem darboğazlarına
                          işaret edebilir. Operasyonel sağlık, throughput analizi ve kapasite planlaması için kritik bir göstergedir.
                          Yüksek transaction sayıları, sistem üzerindeki iş yükü yoğunluğunu gösterir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'assjsw' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Swap Total (ASSJSW) alanı, oturum başladığından bu yana address space'in kaç kez swap-in veya swap-out edildiğini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Bu metrik, bir address space'in oturum süresince toplam swap işlemi sayısını ölçer. Her swap-in ve swap-out
                          işlemi bu sayaca eklenir. Yüksek swap sayısı, bellek baskısı, sayfa hataları ve yetersiz bellek kaynaklarıyla
                          ilişkili olabilir. Sistem konfigürasyonu, bellek ayarları ve WLM politikalarıyla birlikte analiz edilmelidir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Fazla swap işlemi, disk I/O'larına neden olarak latency artışı ve throughput düşüşü yaratır. Bu, sistem performansını
                          olumsuz etkiler. Swap toplam sayısı, kapasite planlaması ve bellek tuning kararları için temel bir göstergedir.
                          Yüksek değerler, bellek kaynaklarının yetersiz olduğunu veya bellek ayarlarının optimize edilmesi gerektiğini gösterir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'assscsck' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CPU Service Unit Count (ASSSCSCK) alanı, oturum başladığından bu yana address space tarafından tüketilen
                          CPU servis birimlerinin (binler cinsinden) sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          CPU servis birimleri, z/OS sisteminde CPU kaynak tüketiminin normalize edilmiş ölçüsüdür. Bu birimler,
                          farklı işlemci tipleri ve sistem konfigürasyonları arasında tutarlı karşılaştırma sağlar. Değer binler
                          cinsinden ifade edilir, bu nedenle gerçek CPU tüketimini hesaplamak için 1000 ile çarpılması gerekebilir.
                          Servis birimleri, iş yükleri arasında adil karşılaştırma ve maliyetlendirme için kullanılır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CPU tüketiminin izlenmesi, maliyetlendirme, kapasite planlaması ve performans ayarlamaları için gereklidir.
                          Yüksek CPU servis birimi tüketimi, CPU-bound iş yüklerini veya performans sorunlarını gösterir. Bu metrik,
                          hangi işlerin sistem CPU kaynaklarını yoğun kullandığını tespit etmek ve CPU kapasitesi planlaması yapmak için
                          kritik öneme sahiptir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'assmsock' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Service Units Consumed Using Real Storage (ASSMSOCK) alanı, transaction başladığından bu yana gerçek bellek
                          (real storage) kullanımı için tüketilen servis birimlerinin sayısını gösterir. Son swap-in döneminde biriken
                          servis birimleri bu değere dahildir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Bu metrik, transaction'ın gerçek bellek (real storage) kullanımı için harcadığı kaynakları servis birimi
                          cinsinden ölçer. Gerçek bellek tüketimi, paging ve swap davranışıyla birlikte değerlendirilmelidir. Yüksek
                          değerler, büyük çalışma kümesi (working set) boyutuna veya yoğun bellek kullanımına işaret edebilir.
                          Son swap-in dönemindeki birimler dahil olduğu için, güncel bellek kullanım profili hakkında bilgi verir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Bellek baskısı ve performans arasındaki ilişkiyi anlamaya yardımcı olur. Bu metrik, bellek ayarlamaları,
                          kapasite planlaması ve bellek kaynaklarının optimal kullanımı için kritik kararlar alınmasını sağlar.
                          Yüksek bellek servis birimi tüketimi, bellek kaynaklarının yetersiz olduğunu veya bellek optimizasyonu
                          gerektiğini gösterebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'assiocck' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          I/O Service Units Consumed by the Transaction (ASSIOCCK) alanı, transaction başladığından bu yana I/O işlemleri
                          için tüketilen servis birimlerinin sayısını gösterir. Son swap-in döneminde biriken I/O servis birimleri
                          bu değere dahildir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          I/O servis birimleri, transaction'ın disk okuma/yazma işlemleri ve diğer I/O operasyonları için harcadığı
                          kaynakları ölçer. Bu değer, disk/cihaz gecikmeleri, throughput ve I/O sıklığı ile birlikte değerlendirilmelidir.
                          Yüksek değerler, I/O-bound davranışa, yavaş cihazlara veya yoğun disk aktivitesine işaret edebilir.
                          Son swap-in dönemindeki birimler dahil olduğu için, güncel I/O kullanım profili hakkında bilgi verir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          I/O darboğazları, transaction'ın toplam yanıt süresini önemli ölçüde artırabilir. Bu metrik, sorunlu cihaz/volume
                          tespiti, I/O performans iyileştirmeleri ve kapasite planlaması için kritik öneme sahiptir. Yüksek I/O servis
                          birimi tüketimi, disk kaynaklarının optimize edilmesi gerektiğini veya I/O alt yapısının genişletilmesi
                          gerektiğini gösterebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asssrsck' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          SRB Processor Service Consumed by Transaction (ASSSRSCK) alanı, transaction başladığından bu yana transaction'ın
                          CPU kodunun SRB (Supervisor Request Block) işlemleri için tüketilen toplam servis birimlerini gösterir.
                          Son swap-in döneminde biriken birimler bu değere dahildir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          SRB (Supervisor Request Block) işlemleri, z/OS çekirdek seviyesinde (supervisor mode) yürütülen işlemlerdir.
                          Bu işlemler, sistem servis çağrıları, I/O tamamlanma işlemleri ve diğer sistem seviyesi operasyonları içerir.
                          SRB işlemleri, transaction'ın CPU tüketim profilini etkiler ve normal TCB (Task Control Block) işlemlerinden
                          farklı olarak çekirdek seviyesinde çalışır. Son swap-in dönemindeki birimler dahil olduğu için, güncel SRB
                          kullanım profili hakkında bilgi verir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yüksek SRB tüketimi, sistem seviyesinde optimizasyon gerektirebilir. Bu metrik, CPU planlaması, kapasite planlaması
                          ve sistem performans analizi için önemlidir. SRB işlemleri, sistem kaynaklarının kullanımını etkiler ve çekirdek
                          seviyesindeki darboğazları tespit etmek için kullanılır. Aşırı SRB tüketimi, sistem seviyesinde performans sorunlarına
                          veya optimize edilmesi gereken sistem servislerine işaret edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asswmck' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Total Service Units (ASSWMCK) alanı, oturum süresince address space tarafından tüketilen toplam SRM
                          (System Resource Manager) servis birimlerinin (binler cinsinden) sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          SRM servis birimleri, z/OS Sistem Kaynak Yöneticisi (System Resource Manager) tarafından kullanılan normalize
                          edilmiş ölçüm birimidir. Bu birimler, farklı kaynak tüketimlerini (CPU, I/O, bellek, SRB vb.) ortak bir ölçekte
                          ifade eder. Değer binler cinsinden ifade edilir, bu nedenle gerçek tüketimi hesaplamak için 1000 ile çarpılması
                          gerekebilir. SRM servis birimleri, maliyetlendirme, kaynak paylaştırma ve farklı iş yükleri arasında adil
                          karşılaştırma için kullanılır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Toplam servis birimi tüketimi, bir işin sistem üzerindeki genel etkisini ve kaynak kullanımını gösterir.
                          Bu metrik, kapasite planlaması, maliyetlendirme ve SLA değerlendirmeleri için esastır. Yüksek toplam servis
                          birimi tüketimi, sistem kaynaklarının yoğun kullanıldığını gösterir ve kapasite artışı veya kaynak optimizasyonu
                          gerektiğine işaret edebilir. İş yükleri arasında karşılaştırma yapmak ve adil kaynak dağıtımı sağlamak için
                          kritik bir göstergedir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== RMF SRCS INFO CARDS ============== */}
                  {infoModal === 'splafcav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Available Frames (SPLAFCAV) alanı, şu anda kullanılabilir olan merkezi depolama (central storage) frame sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Bu metrik, sistemdeki kullanılabilir bellek frame'lerinin sayısını gösterir. Frame'ler, z/OS sisteminde bellek yönetiminin
                          temel birimidir. Merkezi depolama (central storage), sistemin fiziksel bellek kaynaklarını ifade eder. Bu değer,
                          sistemin bellek kullanılabilirliğini ve bellek baskısının olup olmadığını gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Düşük kullanılabilir frame sayısı, bellek baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik,
                          bellek kapasitesi planlaması, bellek yönetimi ve sistem performansı için kritik öneme sahiptir. Yetersiz kullanılabilir
                          frame, paging ve swap aktivitesini artırabilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'spluicav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current UIC (SPLUICAV) alanı, mevcut sistem unreferenced interval count (UIC) değerini içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          UIC (Unreferenced Interval Count), z/OS Storage Management'daki bellek yönetimi için kullanılan bir sayaçtır.
                          Bu değer, referans edilmeyen bellek sayfalarının sayısını ölçer ve sistem bellek yönetimi algoritmaları tarafından
                          kullanılır. UIC, bellek temizleme ve sayfa yönetimi kararlarında önemli bir faktördür.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          UIC değeri, bellek kullanım verimliliği ve bellek yönetimi performansını değerlendirmek için kullanılır. Yüksek UIC
                          değerleri, bellek sayfalarının düşük kullanımını veya bellek sızıntısı gibi sorunları gösterebilir. Bu metrik,
                          bellek optimizasyonu ve sistem performansı için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'splstfav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          SQA Frames Count (SPLSTFAV) alanı, interval süresince işe tahsis edilen toplam SQA (System Queue Area) frame sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          SQA (System Queue Area), z/OS sisteminin sistem seviyesi veri yapılarını ve kuyruk yönetimini desteklemek için kullanılan
                          özel bir bellek alanıdır. Yüksek SQA frame sayısı, sistem gerçek depolama (real storage) kısıtlamalarında bir sorun
                          olduğunu gösterebilir. Bu metrik, sistem seviyesi bellek kullanımını ve kaynak tahsisini gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Yüksek SQA frame sayısı, bellek baskısı ve gerçek depolama kısıtlamalarına işaret edebilir. Bu durum, sistem performansını
                          etkileyebilir ve bellek kaynaklarının optimize edilmesi gerektiğini gösterebilir. Sistem seviyesi bellek kullanımını
                          izlemek ve kapasite planlaması yapmak için kritik öneme sahiptir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'spllpfav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          LPA Frame Count (SPLLPFAV) alanı, son toplama döngüsü sırasında depolamada bulunan toplam LPA (Link Pack Area) frame sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          LPA (Link Pack Area), z/OS sisteminde sıkça kullanılan modüllerin paylaşımlı bir bellek alanında saklandığı özel bir alandır.
                          Bu alan, sistem performansını artırmak için tasarlanmıştır. LPA frame sayısı, sistemin paylaşımlı kod ve veri yapıları için
                          ne kadar bellek kullandığını gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          LPA kullanımı, sistem performansını etkiler çünkü paylaşımlı modüller bellekte tutulur ve hızlı erişim sağlanır.
                          LPA frame sayısını izlemek, bellek kullanımını optimize etmek ve sistem performansını artırmak için önemlidir.
                          Yüksek LPA kullanımı, bellek kaynaklarının verimli kullanıldığını gösterebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'spllffav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          LPA Fixed Frame Count (SPLLFFAV) alanı, son toplama döngüsü sırasında depolamada bulunan toplam sabit (fixed) LPA frame sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Sabit LPA frame'leri, swap-out edilemeyen ve gerçek bellekte kalması gereken LPA frame'lerini ifade eder. Bu frame'ler,
                          sistemin kritik modüllerini içerir ve performans için bellekte sabit tutulmalıdır. Sabit LPA frame sayısı, sistemin
                          kritik kod bileşenleri için ne kadar bellek ayırdığını gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Sabit LPA frame'leri, sistem performansı için kritik öneme sahiptir. Bu frame'ler swap-out edilemez, bu nedenle gerçek
                          bellek kaynaklarını kullanır. Yüksek sabit LPA frame sayısı, bellek kaynaklarının kritik sistem bileşenleri için
                          kullanıldığını gösterir ve bellek planlaması için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'splcpfav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Pageable CSA and MLPA Frames Count (SPLCPFAV) alanı, şu anda sayfalanabilir (pageable) olan CSA ve MLPA frame'lerinin sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          CSA (Common System Area) ve MLPA (Modified Link Pack Area), sistem seviyesi veri yapıları ve paylaşımlı kod alanlarıdır.
                          Sayfalanabilir frame'ler, gerekirse diske sayfalanabilir (paged out) ve bellek kaynaklarını optimize etmeye yardımcı olur.
                          Bu metrik, sistemin esnek bellek yönetimi için kullandığı frame sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Sayfalanabilir CSA ve MLPA frame'leri, bellek esnekliği sağlar ve bellek kaynaklarının optimize edilmesine yardımcı olur.
                          Bu frame'ler, bellek baskısı altında diske sayfalanabilir, böylece diğer işler için bellek kaynakları serbest bırakılır.
                          Bu metrik, bellek yönetimi ve kapasite planlaması için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'splclfav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Fixed LPA and CSA Frames Count (SPLCLFAV) alanı, şu anda sabit (fixed) olan CSA ve LPA frame'lerinin sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Sabit LPA ve CSA frame'leri, swap-out edilemeyen ve gerçek bellekte kalması gereken frame'lerdir. Bu frame'ler,
                          sistemin kritik veri yapılarını ve modüllerini içerir. Sabit frame sayısı, sistemin performans için gerekli olan
                          minimum bellek gereksinimini gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Sabit LPA ve CSA frame'leri, sistem performansı ve kararlılığı için kritiktir. Bu frame'ler swap-out edilemez ve
                          gerçek bellek kaynaklarını kullanır. Yüksek sabit frame sayısı, sistemin kritik bileşenleri için ne kadar bellek
                          ayırdığını gösterir ve bellek planlaması için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'splrffav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Private Non-LSQA Fixed Frame Count (SPLRFFAV) alanı, son toplama döngüsü süresince depolamada bulunan özel (private)
                          sabit (fixed) non-LSQA frame'lerinin toplam sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Özel non-LSQA sabit frame'leri, belirli bir address space'e ait olan ve swap-out edilemeyen frame'lerdir. LSQA (Local
                          System Queue Area) hariç, bu frame'ler address space'in özel bellek alanını oluşturur. Bu frame'ler, address space'in
                          kritik veri yapılarını ve modüllerini içerir ve gerçek bellekte sabit tutulmalıdır.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Özel sabit frame sayısı, address space'lerin gerçek bellek gereksinimlerini gösterir. Yüksek sabit frame sayısı,
                          bellek kaynaklarının yoğun kullanıldığını ve potansiyel bellek baskısı riskini gösterir. Bu metrik, bellek kapasitesi
                          planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'splqpcav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Private Fixed Frames Count (SPLQPCAV) alanı, LSQA frame'leri olmayan özel sabit frame'lerin mevcut sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Özel sabit frame'ler, belirli bir address space'e ait olan ve swap-out edilemeyen frame'lerdir. LSQA hariç, bu frame'ler
                          address space'in özel bellek alanını oluşturur. Bu metrik, sistemin özel bellek gereksinimlerini ve gerçek bellek
                          kullanımını gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Özel sabit frame sayısı, address space'lerin gerçek bellek gereksinimlerini ve bellek kullanım profilini gösterir.
                          Yüksek değerler, bellek kaynaklarının yoğun kullanıldığını ve bellek planlaması için önemli olduğunu gösterir.
                          Bu metrik, kapasite planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'splqpeav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          LSQA Frame Count (SPLQPEAV) alanı, tüm address space'ler için tahsis edilen toplam LSQA (Local System Queue Area) frame sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          LSQA (Local System Queue Area), her address space için yerel sistem kuyruklarını ve veri yapılarını desteklemek için
                          kullanılan özel bir bellek alanıdır. LSQA frame sayısı, sistemin tüm address space'ler için toplam LSQA gereksinimini
                          gösterir. Bu alan, address space seviyesi sistem operasyonları için kritiktir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          LSQA frame sayısı, sistem seviyesi bellek kullanımını ve address space'lerin sistem kaynak gereksinimlerini gösterir.
                          Yüksek LSQA kullanımı, bellek kaynaklarının sistem operasyonları için kullanıldığını gösterir. Bu metrik, bellek
                          planlaması ve kapasite yönetimi için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'sclinav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current IN Queue Length (SCLINAV) alanı, SMR (Storage Management Routines) IN kuyruğundaki toplam address space sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          SMR IN kuyruğu, belleğe alınmayı (swap-in) bekleyen address space'leri içerir. Bu kuyruk, bellek yönetimi süreçlerinde
                          kritik bir rol oynar. Yüksek IN kuyruk uzunluğu, birçok address space'in belleğe alınmayı beklediğini gösterir.
                          Bu, bellek baskısı veya yetersiz bellek kaynaklarının bir göstergesi olabilir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          IN kuyruk uzunluğu, bellek yönetimi performansını ve bellek kaynaklarının yeterliliğini gösterir. Uzun IN kuyrukları,
                          bellek baskısı, gecikmiş swap-in işlemleri ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek
                          kapasitesi planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'scllotav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Address Spaces Logically Swapped Out (SCLLOTAV) alanı, SRM (System Resource Manager) kuyruklarında mantıksal olarak
                          swap-out edilmiş toplam address space sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          Mantıksal olarak swap-out edilmiş address space'ler, SRM tarafından bellek yönetimi için kuyruklarda tutulan ve
                          fiziksel bellekte olmayan address space'lerdir. Bu metrik, sistemin bellek yönetimi süreçlerinde ne kadar address
                          space'in bellek dışında olduğunu gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Mantıksal swap-out sayısı, bellek yönetimi ve bellek baskısı seviyesini gösterir. Yüksek sayılar, birçok address space'in
                          bellek dışında olduğunu ve bellek kaynaklarının sınırlı olduğunu gösterebilir. Bu metrik, bellek kapasitesi planlaması
                          ve performans analizi için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'sclotrav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Out Ready Queue Length (SCLOTRAV) alanı, SMR (Storage Management Routines) OUT ready kuyruğundaki toplam address space sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          SMR OUT ready kuyruğu, swap-out işlemi için hazır olan address space'leri içerir. Bu kuyruk, bellek yönetimi süreçlerinde
                          address space'lerin bellekten çıkarılmasını yönetir. OUT ready kuyruk uzunluğu, bellek yönetimi aktivitesini ve swap-out
                          işlemlerinin durumunu gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          OUT ready kuyruk uzunluğu, bellek yönetimi performansını ve swap-out işlemlerinin yoğunluğunu gösterir. Yüksek kuyruk
                          uzunlukları, bellek baskısı ve yoğun swap-out aktivitesine işaret edebilir. Bu metrik, bellek planlaması ve performans
                          optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'sclotwav' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Out Wait Queue Length (SCLOTWAV) alanı, SMR (Storage Management Routines) OUT wait kuyruğundaki toplam address space sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <p className="text-green-800 text-sm">
                          SMR OUT wait kuyruğu, swap-out işlemi için bekleyen (waiting) address space'leri içerir. Bu kuyruk, bellek yönetimi
                          süreçlerinde swap-out işlemlerinin tamamlanmasını bekleyen address space'leri yönetir. OUT wait kuyruk uzunluğu,
                          bellek yönetimi aktivitesini ve swap-out işlemlerinin bekleme durumunu gösterir.
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          OUT wait kuyruk uzunluğu, bellek yönetimi performansını ve swap-out işlemlerinin gecikme durumunu gösterir. Uzun wait
                          kuyrukları, swap-out işlemlerinin geciktiğini veya bellek yönetimi darboğazları olduğunu gösterebilir. Bu metrik,
                          bellek planlaması ve performans sorunlarının tespiti için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== RMF SPAG INFO CARDS ============== */}
                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'spllnirt' || infoModal.toLowerCase() === 'lpa_page_in_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          LPA Page-In Rate (SPLLNIRT), son 15 saniye içinde LPA (Link Pack Area) sayfalarının sayfa saniye cinsinden sayfa içine (page-in) alınma oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>LPA:</strong> Link Pack Area, paylaşımlı kod ve veri yapılarını içerir</li>
                          <li>• <strong>Page-In:</strong> Diskten belleğe sayfa aktarım işlemi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          LPA Page-In Rate, sistem performansını ve bellek yönetimi verimliliğini değerlendirmek için kritiktir. Yüksek page-in oranları, bellek baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek planlaması ve sistem performansı optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splcinrt' || infoModal.toLowerCase() === 'csa_page_in_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CSA Page-In Rate (SPLCINRT), son 15 saniye içinde CSA (Common System Area) sayfalarının sayfa saniye cinsinden sayfa içine (page-in) alınma oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>CSA:</strong> Common System Area, sistem seviyesi veri yapılarını içerir</li>
                          <li>• <strong>Kullanım:</strong> Sistem kuyrukları ve paylaşımlı veri yapıları için</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CSA Page-In Rate, sistem seviyesi bellek yönetimi ve performansını değerlendirmek için önemlidir. Yüksek page-in oranları, bellek baskısı ve sistem kaynaklarının yoğun kullanıldığını gösterir. Bu metrik, bellek planlaması ve sistem performansı optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splcotrt' || infoModal.toLowerCase() === 'csa_page_out_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CSA Page-Out Rate (SPLCOTRT), son 15 saniye içinde CSA (Common System Area) sayfalarının sayfa saniye cinsinden sayfa dışına (page-out) alınma oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>Page-Out:</strong> Bellekten diske sayfa yazma işlemi</li>
                          <li>• <strong>Amaç:</strong> Bellek kaynaklarını serbest bırakmak</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CSA Page-Out Rate, bellek yönetimi ve sistem performansını değerlendirmek için önemlidir. Yüksek page-out oranları, bellek baskısı ve yoğun disk I/O aktivitesine işaret edebilir. Bu metrik, bellek planlaması ve sistem performansı optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'ssltswrt' || infoModal.toLowerCase() === 'total_swap_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Total Swap Rate (SSLTSWRT), son 15 saniye içinde herhangi bir swap nedeniyle swap-out edilen tüm address space'lerin dakika başına swap (swap-per-minute) oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Swap/dakika (swap per minute)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>Kapsam:</strong> Tüm swap-out edilen address space'ler</li>
                          <li>• <strong>Swap:</strong> Address space'lerin belleğe alınıp çıkarılması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Total Swap Rate, bellek yönetimi performansını ve bellek baskısı seviyesini değerlendirmek için kritiktir. Yüksek swap oranları, bellek kaynaklarının sınırlı olduğunu ve sistem performansının etkilenebileceğini gösterir. Bu metrik, bellek kapasitesi planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splsinrt' || infoModal.toLowerCase() === 'swap_page_in_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Swap Page-In Rate (SPLSINRT), son 15 saniye içinde swap sayfa içine (page-in) alma oranını sayfa saniye cinsinden gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>Swap Page-In:</strong> Swap edilmiş address space'lerin sayfalarının diskten belleğe geri yüklenmesi</li>
                          <li>• <strong>Aktivite:</strong> Bellek baskısı göstergesi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Swap Page-In Rate, bellek yönetimi performansını ve bellek kaynaklarının yeterliliğini değerlendirmek için kritiktir. Yüksek swap page-in oranları, bellek baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek kapasitesi planlaması ve sistem performansı optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splsotrt' || infoModal.toLowerCase() === 'swap_page_out_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Swap Page-Out Rate (SPLSOTRT), son 15 saniye içinde swap sayfa dışına (page-out) alma oranını sayfa saniye cinsinden gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>Swap Page-Out:</strong> Address space'lerin sayfalarının belleğen diske yazılması</li>
                          <li>• <strong>Amaç:</strong> Bellek kaynaklarını serbest bırakmak ve bellek baskısını azaltmak</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Swap Page-Out Rate, bellek yönetimi performansını ve bellek baskısı seviyesini değerlendirmek için kritiktir. Yüksek swap page-out oranları, bellek kaynaklarının sınırlı olduğunu ve yoğun disk I/O aktivitesine işaret edebilir. Bu metrik, bellek kapasitesi planlaması ve sistem performansı optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splppirt' || infoModal.toLowerCase() === 'vio_non_vio_page_in_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          VIO and Non-VIO Page-In Rate (SPLPPIRT), interval süresince sistem için VIO sayfa içine (page-in) alma ve non-VIO sayfa içine alma işlemlerinin saniye başına oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Kapsam:</strong> VIO ve Non-VIO page-in işlemleri</li>
                          <li>• <strong>VIO:</strong> Virtual I/O, hipervisor seviyesinde gerçekleştirilen sanal I/O</li>
                          <li>• <strong>Zaman Aralığı:</strong> Interval süresince sistem genelindeki aktivite</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          VIO ve Non-VIO Page-In Rate, sistem bellek yönetimi ve I/O performansını değerlendirmek için önemlidir. Bu metrik, bellek yönetimi verimliliğini ve I/O aktivitesinin sistem üzerindeki etkisini gösterir. Yüksek oranlar, bellek baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splpport' || infoModal.toLowerCase() === 'vio_non_vio_page_out_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          VIO and Non-VIO Page-Out Rate (SPLPORT), interval süresince sistem için VIO sayfa dışına (page-out) alma ve non-VIO sayfa dışına alma işlemlerinin saniye başına oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Kapsam:</strong> VIO ve Non-VIO page-out işlemleri</li>
                          <li>• <strong>VIO:</strong> Virtual I/O, hipervisor seviyesinde gerçekleştirilen sanal I/O</li>
                          <li>• <strong>Amaç:</strong> Bellek kaynaklarını serbest bırakmak</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          VIO ve Non-VIO Page-Out Rate, sistem bellek yönetimi ve I/O performansını değerlendirmek için önemlidir. Bu metrik, bellek yönetimi verimliliğini ve I/O aktivitesinin sistem üzerindeki etkisini gösterir. Yüksek oranlar, bellek baskısı ve yoğun disk I/O aktivitesine işaret edebilir. Bu metrik, bellek planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splhvprt' || infoModal.toLowerCase() === 'vio_paging_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          VIO Paging Rate (SPLHVPRT), interval süresince sistem için VIO sayfa içine (page-in) alma ve VIO sayfa dışına (page-out) alma işlemlerinin saniye başına oranını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Kapsam:</strong> VIO page-in ve page-out işlemleri</li>
                          <li>• <strong>VIO:</strong> Virtual I/O, hipervisor seviyesinde gerçekleştirilen sanal I/O</li>
                          <li>• <strong>Toplam Aktivite:</strong> VIO sayfalama aktivitesinin toplam oranı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          VIO Paging Rate, sistem bellek yönetimi ve sanal I/O performansını değerlendirmek için önemlidir. Bu metrik, VIO aktivitesinin sistem üzerindeki etkisini ve bellek yönetimi verimliliğini gösterir. Yüksek VIO paging oranları, bellek baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splctwav' || infoModal.toLowerCase() === 'common_area_target_wset') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Common Area Target Working Set (SPLCTWAV), iş için belirlenen ortak alan için hedef çalışma seti boyutunu gösteren bir ila üç haneli bir sayı içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Format:</strong> 1-3 haneli sayı</li>
                          <li>• <strong>Kapsam:</strong> Ortak alan (common area) için hedef çalışma seti</li>
                          <li>• <strong>Kullanım:</strong> Bellek yönetimi algoritmaları tarafından kullanılır</li>
                          <li>• <strong>Etki:</strong> Sayfa çalma (page stealing) işlemlerini etkiler</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Common Area Target Working Set, bellek yönetimi ve performans optimizasyonu için kritiktir. Bu değer, sayfa çalma aktivitesini ve bellek yönetimi davranışını etkiler. Doğru hedef çalışma seti boyutu, bellek kullanımını optimize eder ve performans sorunlarını önler. Bu metrik, bellek planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splafcav' || infoModal.toLowerCase() === 'available_frames') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Available Frames (SPLAFCAV), şu anda kullanılabilir olan merkezi depolama (central storage) frame sayısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Frame sayısı</li>
                          <li>• <strong>Kapsam:</strong> Merkezi depolama (central storage)</li>
                          <li>• <strong>Frame:</strong> z/OS sisteminde bellek yönetiminin temel birimi</li>
                          <li>• <strong>Gösterge:</strong> Sistemin bellek kullanılabilirliği</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Düşük kullanılabilir frame sayısı, bellek baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek kapasitesi planlaması, bellek yönetimi ve sistem performansı için kritik öneme sahiptir. Yetersiz kullanılabilir frame, paging ve swap aktivitesini artırabilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'spluicav' || infoModal.toLowerCase() === 'current_uic') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current UIC (SPLUICAV), mevcut sistem unreferenced interval count (UIC) değerini içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>UIC:</strong> Unreferenced Interval Count</li>
                          <li>• <strong>Kullanım:</strong> z/OS Storage Management bellek yönetimi için sayaç</li>
                          <li>• <strong>Ölçüm:</strong> Referans edilmeyen bellek sayfalarının sayısı</li>
                          <li>• <strong>Kullanım Amacı:</strong> Bellek temizleme ve sayfa yönetimi kararları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          UIC değeri, bellek kullanım verimliliği ve bellek yönetimi performansını değerlendirmek için kullanılır. Yüksek UIC değerleri, bellek sayfalarının düşük kullanımını veya bellek sızıntısı gibi sorunları gösterebilir. Bu metrik, bellek optimizasyonu ve sistem performansı için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splpesrt' || infoModal.toLowerCase() === 'pages_to_expanded_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Pages To Expanded (SPLPESRT), son 15 saniye içinde tüm sayfaların merkezi depolamadan genişletilmiş depolamaya (expanded storage) taşınma oranını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>Yön:</strong> Merkezi depolamadan genişletilmiş depolamaya</li>
                          <li>• <strong>Genişletilmiş Depolama:</strong> Merkezi depolamadan daha yavaş, diskten daha hızlı bellek katmanı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Pages To Expanded Rate, bellek yönetimi ve bellek hiyerarşisi kullanımını değerlendirmek için önemlidir. Yüksek oranlar, bellek baskısı ve bellek kaynaklarının optimize edilmesi gerektiğini gösterir. Bu metrik, bellek planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splmgaav' || infoModal.toLowerCase() === 'current_migration_age') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Migration Age (SPLMGAAV), mevcut genişletilmiş depolama (expanded storage) göç yaşını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Göç Yaşı:</strong> Genişletilmiş depolamadan yardımcı depolamaya sayfa göçü için kullanılan yaş</li>
                          <li>• <strong>Kullanım:</strong> Bellek yönetimi algoritmaları tarafından kullanılır</li>
                          <li>• <strong>Karar:</strong> Sayfaların ne zaman yardımcı depolamaya taşınacağını belirler</li>
                          <li>• <strong>Denge:</strong> Bellek kullanımı ve performans arasındaki dengeyi sağlar</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Current Migration Age, bellek yönetimi ve bellek hiyerarşisi kullanımını değerlendirmek için önemlidir. Bu değer, sayfa göç aktivitesini ve bellek kaynaklarının verimliliğini etkiler. Doğru göç yaşı, bellek kullanımını optimize eder ve performans sorunlarını önler. Bu metrik, bellek planlaması ve performans optimizasyonu için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splesfav' || infoModal.toLowerCase() === 'available_expanded_frames') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Available Expanded Storage Frames (SPLESFAV), genişletilmiş depolamada (expanded storage) şu anda kullanılabilir olan frame sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Frame sayısı</li>
                          <li>• <strong>Kapsam:</strong> Genişletilmiş depolama (expanded storage)</li>
                          <li>• <strong>Karakteristik:</strong> Merkezi depolamadan daha yavaş, diskten daha hızlı</li>
                          <li>• <strong>Gösterge:</strong> Genişletilmiş depolama kaynaklarının kullanılabilirliği</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Available Expanded Storage Frames, bellek yönetimi ve bellek hiyerarşisi kullanımını değerlendirmek için kritiktir. Düşük kullanılabilir frame sayısı, genişletilmiş depolama baskısı ve potansiyel performans sorunlarına işaret edebilir. Bu metrik, bellek kapasitesi planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeModal === 'rmf_spag' && infoModal && (infoModal.toLowerCase() === 'splpeart' || infoModal.toLowerCase() === 'pages_to_auxiliary_rate') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Pages To Auxiliary (SPLPEART), son 15 saniye içinde tüm sayfaların genişletilmiş depolamadan (expanded storage) yardımcı depolamaya (auxiliary storage) taşınma oranını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• <strong>Birim:</strong> Sayfa/saniye (pages per second)</li>
                          <li>• <strong>Zaman Aralığı:</strong> Son 15 saniye</li>
                          <li>• <strong>Yön:</strong> Genişletilmiş depolamadan yardımcı depolamaya</li>
                          <li>• <strong>Yardımcı Depolama:</strong> Genellikle disk depolaması, en yavaş bellek katmanı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Pages To Auxiliary Rate, bellek yönetimi ve bellek hiyerarşisi kullanımını değerlendirmek için kritiktir. Yüksek oranlar, bellek baskısı ve yoğun disk I/O aktivitesine işaret edebilir. Bu metrik, bellek planlaması ve performans optimizasyonu için önemlidir. Yüksek oranlar, performans sorunlarına ve gecikmelere neden olabilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== RMF ASD INFO CARDS ============== */}
                  {infoModal === 'jobname' && activeModal === 'rmf_asd' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Jobname alanı, adres alanını kullanan iş biriminin kullanıcı kimliğini (userid), iş adını veya prosedür adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kaynak: SMF/RMF kayıtlarından alınır</li>
                          <li>• Format: 1-8 karakterlik isim/prosedür</li>
                          <li>• Bağlam: Adres alanı/iş birimi tanımlaması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">Performans veya kaynak kullanım sorunlarını doğrudan ilgili iş veya kullanıcı ile ilişkilendirmenizi sağlar.</p>
                      </div>
                    </div>
                  )}
                  
                  {infoModal === 'service_class_name' && activeModal === 'rmf_asd' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Service Class Name (Servis Sınıfı Adı) alanı, işin servis sınıfı adını içerir. BMC AMI Ops UI dışında, 
                          yetkiniz varsa mevcut değerin üzerine yeni bir servis sınıfı adı (veya QUIESCE ya da RESUME) yazarak değiştirebilirsiniz.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kaynak: WLM (Workload Manager) servis politikası</li>
                          <li>• Değiştirilebilir: Yetkili kullanıcılar tarafından</li>
                          <li>• Özel komutlar: QUIESCE, RESUME</li>
                          <li>• Kapsam: İşin performans sınıflandırması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Service Class Name, işin hangi performans sınıfına ait olduğunu gösterir ve WLM tarafından 
                          kaynak tahsisi ve performans hedeflerinin belirlenmesi için kullanılır. Bu değer, işin önceliğini 
                          ve kaynak gereksinimlerini anlamak için kritiktir.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {infoModal === 'service_class_index' && activeModal === 'rmf_asd' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Service Class Index (Servis Sınıfı İndeksi) veya Performance Period (Performans Dönemi), 
                          z/OS Workload Manager (WLM) tarafından işlemin servis hedeflerini aktif Servis Politikasında 
                          bulmak için kullanılan sayıdır.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kaynak: z/OS WLM (Workload Manager)</li>
                          <li>• Kullanım: Aktif Servis Politikasında servis hedeflerini bulma</li>
                          <li>• Alternatif: Performance Period olarak da kullanılabilir</li>
                          <li>• Bağlam: WLM servis yapılandırması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Service Class Index, WLM'in işin performans hedeflerini ve kaynak tahsisini nasıl yöneteceğini 
                          belirleyen kritik bir değerdir. Bu indeks, aktif servis politikasında doğru performans hedeflerinin 
                          uygulanmasını sağlar ve işin kaynak gereksinimlerini optimize eder.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== CMF DSPCZ INFO CARDS ============== */}
                  {infoModal === 'onam' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Owner Name (ONAM) alanı, veri alanını sahip olan adres alanının adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kaynak: Veri alanı sahiplik bilgisi</li>
                          <li>• Format: Adres alanı adı</li>
                          <li>• Kapsam: CMF DSPCZ kayıtları</li>
                          <li>• Kullanım: Veri alanının sahipliğini belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Owner Name, veri alanının hangi adres alanına ait olduğunu belirlemek için kritiktir. 
                          Bu bilgi, veri alanının erişimi, yönetimi ve sorun giderme işlemleri için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'dspname' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Data Space Name (DSPNAME) alanı, veri alanının adını içerir. Veri alanı adı sekiz karakter uzunluğundadır ve veri alanı oluşturulduğunda atanır.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: 8 karakter</li>
                          <li>• Atama: Veri alanı oluşturulduğunda</li>
                          <li>• Kullanım: Veri alanı tanımlayıcısı</li>
                          <li>• Kapsam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Data Space Name, veri alanını benzersiz şekilde tanımlamak için kritiktir. 
                          Bu isim, veri alanını referans etmek, yönetmek ve izlemek için kullanılır.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asid' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          ASID (Address Space ID) alanı, adres alanının z/OS tarafından oluşturulan sayısal tanımlayıcısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kaynak: z/OS tarafından üretilir</li>
                          <li>• Format: Sayısal tanımlayıcı</li>
                          <li>• Kullanım: Adres alanı benzersiz kimliği</li>
                          <li>• Kapsam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          ASID, adres alanını benzersiz şekilde tanımlamak için kritiktir. 
                          Bu değer, adres alanını izlemek, yönetmek ve sorun gidermek için kullanılır.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'key' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Storage Key (KEY) alanı, veri alanının depolama anahtarını içerir. Depolama anahtarı DSPSERV CREATE isteğinde belirtilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kaynak: DSPSERV CREATE makrosunda belirtilir</li>
                          <li>• Format: Depolama anahtarı değeri</li>
                          <li>• Kullanım: Bellek koruma ve erişim kontrolü</li>
                          <li>• Kapsam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Storage Key, veri alanının bellek korumasını ve erişim kontrolünü belirlemek için kritiktir. 
                          Bu anahtar, veri alanının güvenliğini ve izolasyonunu sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'typx' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Data Space Type (TYPX) alanı, veri alanının türünü tanımlar. Geçerli türler: Basic (veri alanını gösterir) ve Hiper (hiperspace'i gösterir).
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Basic: Veri alanı</li>
                          <li>• Hiper: Hiperspace</li>
                          <li>• Kullanım: Veri alanı türü tanımlaması</li>
                          <li>• Kapsam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Data Space Type, veri alanının türünü belirlemek için kritiktir. 
                          Bu bilgi, veri alanının özelliklerini ve kullanım şeklini anlamak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'scox' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Data Space Scope (SCOX) alanı, veri alanına hangi adres alanlarının referans verebileceğini tanımlar.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kapsam: Adres alanları erişim kontrolü</li>
                          <li>• Kullanım: Veri alanı erişim politikası</li>
                          <li>• Format: Erişim kapsamı tanımlaması</li>
                          <li>• Bağlam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Data Space Scope, veri alanına hangi adres alanlarının erişebileceğini belirlemek için kritiktir. 
                          Bu bilgi, veri alanının güvenliğini ve izolasyonunu sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'refx' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Storage Reference (REFX) alanı, veri alanına hangi tür programların referans verebileceğini tanımlar.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kapsam: Program türleri erişim kontrolü</li>
                          <li>• Kullanım: Program erişim politikası</li>
                          <li>• Format: Erişim referansı tanımlaması</li>
                          <li>• Bağlam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Storage Reference, veri alanına hangi program türlerinin erişebileceğini belirlemek için kritiktir. 
                          Bu bilgi, veri alanının güvenliğini ve erişim kontrolünü sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'prox' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Storage Protect (PROX) alanı, veri alanının getirme korumasına sahip olup olmadığını tanımlar.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Kapsam: Getirme koruması</li>
                          <li>• Kullanım: Bellek koruma politikası</li>
                          <li>• Format: Koruma durumu tanımlaması</li>
                          <li>• Bağlam: CMF DSPCZ kayıtları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Storage Protect, veri alanının bellek korumasına sahip olup olmadığını belirlemek için kritiktir. 
                          Bu bilgi, veri alanının güvenliğini ve entegrasyonunu sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'csiz' || infoModal === 'csizavg') && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Size (Average) (CSIZ) alanı, veri alanı veya hiperspace içinde şu anda adreslenebilir çerçeve (sayfa) sayısını içerir. 
                          Değer, alanın başlangıç boyutunu (DSPSERV CREATE makrosunda belirtilen) ve herhangi bir genişletmeyi (DSPSERV EXTEND makrosu kullanılarak eklenen) temsil eder.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Çerçeve (sayfa) sayısı</li>
                          <li>• Kapsam: Veri alanı veya hiperspace içinde adreslenebilir alan</li>
                          <li>• Başlangıç Boyutu: DSPSERV CREATE makrosunda belirtilen değer</li>
                          <li>• Genişletme: DSPSERV EXTEND makrosu ile eklenen alan</li>
                          <li>• Hesaplama: Başlangıç boyutu + genişletmeler</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Current Size, veri alanının mevcut boyutunu ve kullanılabilir alanını belirlemek için kritiktir. 
                          Bu metrik, veri alanının kapasitesini ve genişletme gereksinimlerini analiz etmek için önemlidir.
                          Değer, başlangıç boyutu ve genişletmelerin toplamını temsil eder, böylece veri alanının mevcut durumunu anlamanızı sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'msiz' || infoModal === 'msizavg') && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Maximum Size (Average) (MSIZ) alanı, veri alanı veya hiperspace'in potansiyel olarak adresleyebileceği maksimum çerçeve (sayfa) sayısını içerir. 
                          Bu değer, veri alanı oluşturulduğunda DSPSERV makrosunda belirtilmiştir. 
                          Bu, çalışma seti boyutunu yansıtmaz ve "yüksek su işareti" değildir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Çerçeve (sayfa) sayısı</li>
                          <li>• Kapsam: Veri alanı veya hiperspace'in potansiyel maksimum alanı</li>
                          <li>• Kaynak: DSPSERV CREATE makrosunda belirtilir</li>
                          <li>• Belirtme: Veri alanı oluşturulduğunda tanımlanır</li>
                          <li>• Önemli Not: Çalışma seti boyutunu yansıtmaz ve "yüksek su işareti" değildir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Maximum Size, veri alanının potansiyel maksimum kapasitesini belirlemek için kritiktir. 
                          Bu metrik, veri alanının genişletme potansiyelini ve kapasite planlamasını analiz etmek için önemlidir.
                          Bu değer, veri alanının teorik maksimum sınırını gösterir ve kaynak planlaması için rehberlik sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'csizsum' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Current Size (Sum) (CSIZ_SUM) alanı, tüm veri alanları veya hiperspace'ler içinde şu anda adreslenebilir çerçeve (sayfa) sayısının toplamını içerir.
                          Değer, alanların başlangıç boyutlarının (DSPSERV CREATE makrosunda belirtilen) ve herhangi bir genişletmenin (DSPSERV EXTEND makrosu kullanılarak eklenen) toplamını temsil eder.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Çerçeve (sayfa) sayısı toplamı</li>
                          <li>• Kapsam: Tüm veri alanları ve hiperspace'ler içinde adreslenebilir alan toplamı</li>
                          <li>• Başlangıç Boyutu: DSPSERV CREATE makrosunda belirtilen değerlerin toplamı</li>
                          <li>• Genişletme: DSPSERV EXTEND makrosu ile eklenen alanların toplamı</li>
                          <li>• Hesaplama: Tüm alanların (başlangıç boyutu + genişletmeler) toplamı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Current Size (Sum), tüm veri alanlarının toplam mevcut boyutunu ve kullanılabilir alanını belirlemek için kritiktir. 
                          Bu metrik, toplam kapasiteyi, genişletme gereksinimlerini ve sistem kaynakları planlamasını analiz etmek için önemlidir.
                          Değer, tüm veri alanlarının mevcut durumunu genel bir bakış açısıyla anlamanızı sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'msizsum' && activeModal === 'cmf_dspcz' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Maximum Size (Sum) (MSIZ_SUM) alanı, tüm veri alanları veya hiperspace'lerin potansiyel olarak adresleyebileceği maksimum çerçeve (sayfa) sayısının toplamını içerir.
                          Bu değerler, veri alanları oluşturulduğunda DSPSERV makrosunda belirtilmiştir. Bu, çalışma seti boyutunu yansıtmaz ve "yüksek su işareti" değildir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Çerçeve (sayfa) sayısı toplamı</li>
                          <li>• Kapsam: Tüm veri alanları ve hiperspace'lerin potansiyel maksimum alanı toplamı</li>
                          <li>• Kaynak: DSPSERV CREATE makrosunda belirtilen değerlerin toplamı</li>
                          <li>• Belirtme: Veri alanları oluşturulduğunda tanımlanır</li>
                          <li>• Önemli Not: Çalışma seti boyutunu yansıtmaz ve "yüksek su işareti" değildir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Maximum Size (Sum), tüm veri alanlarının toplam potansiyel maksimum kapasitesini belirlemek için kritiktir. 
                          Bu metrik, toplam genişletme potansiyelini ve kapasite planlamasını analiz etmek için önemlidir.
                          Bu değer, tüm veri alanlarının teorik maksimum sınırını gösterir ve sistem kaynakları planlaması için rehberlik sağlar.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== CMF XCFSYS INFO CARDS ============== */}
                  {infoModal === 'from_system' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          From System (XSGFSYS) alanı, veri yolunun kaynağı olan sistemin adını gösterir. Örneğin, veri yolu SYSA'dan SYSB'ye gidiyorsa, bu alan SYSA'yı gösterir. Bu alan boş ise, sistem adı bilinmiyor demektir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Sistem adı (VARCHAR)</li>
                          <li>• Kapsam: XCF veri yolu kaynağı</li>
                          <li>• Boş Değer: Sistem adı bilinmiyor</li>
                          <li>• Kullanım: Veri yolunun kaynak sistemini belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          From System, veri yolunun hangi sistemden başladığını belirlemek için kritiktir. Bu bilgi, XCF veri yolu performansını analiz etmek, sorun giderme işlemleri yapmak ve veri akışını takip etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'to_system' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          To System (XSGTSYS) alanı, veri yolunun hedefi olan sistemin adını gösterir. Örneğin, veri yolu SYSA'dan SYSB'ye gidiyorsa, bu alan SYSB'yi gösterir. Bu alan boş ise, sistem adı bilinmiyor demektir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Sistem adı (VARCHAR)</li>
                          <li>• Kapsam: XCF veri yolu hedefi</li>
                          <li>• Boş Değer: Sistem adı bilinmiyor</li>
                          <li>• Kullanım: Veri yolunun hedef sistemini belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          To System, veri yolunun hangi sisteme gittiğini belirlemek için kritiktir. Bu bilgi, XCF veri yolu performansını analiz etmek, sorun giderme işlemleri yapmak ve veri akışını takip etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'transport_class' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Transport Class (XSGTCN) alanı, XCF'ye tanımlı taşıma sınıfının adını gösterir. Bu alan boş ise, yol gelen (inbound) bir yoldur.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Taşıma sınıfı adı (VARCHAR)</li>
                          <li>• Kapsam: XCF taşıma sınıfı tanımı</li>
                          <li>• Boş Değer: Yol gelen (inbound) yönlü</li>
                          <li>• Kullanım: XCF veri yolunun taşıma sınıfını belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Transport Class, XCF veri yolunun taşıma sınıfını belirlemek için kritiktir. Bu bilgi, veri yolunun performansını ve önceliğini anlamak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'total_messages' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Total Messages (XSITOTM) alanı, belirtilen taşıma sınıfı için bu sistem tarafından gönderilen veya alınan toplam mesaj sayısını gösterir. Bu, tampondan büyük mesajları, tampona sığan mesajları ve tampondan küçük mesajları içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Mesaj sayısı (BIGINT)</li>
                          <li>• Kapsam: Tüm mesaj türleri (büyük, sığan, küçük)</li>
                          <li>• İçerik: Gönderilen ve alınan mesajlar</li>
                          <li>• Kullanım: Toplam mesaj aktivitesi ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Total Messages, sistem arası iletişim hacmini ve XCF veri yolunun kullanım yoğunluğunu belirlemek için kritiktir. Bu metrik, veri yolu performansını analiz etmek ve kapasite planlaması yapmak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_messages_big' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Messages Big (XSIPBIG) alanı, taşıma sınıfı tampon uzunluğundan daha büyük mesajların yüzdesini gösterir. Örneğin, 100 toplam mesaj varsa ve bunlardan 10'u tampon boyutundan büyükse, bu alan 10 gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (NUMERIC(7,4))</li>
                          <li>• Kapsam: Tampon boyutundan büyük mesajlar</li>
                          <li>• Hesaplama: (Büyük mesaj sayısı / Toplam mesaj sayısı) × 100</li>
                          <li>• Kullanım: Büyük mesaj oranı ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Messages Big, sistem arası iletişimde büyük mesajların oranını belirlemek için kritiktir. Yüksek değerler, veri yolu performansını etkileyebilir ve tampon boyutu optimizasyonu gerektirebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_messages_fit' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Messages Fit (XSIPFIT) alanı, taşıma sınıfı tampon uzunluğuna eşit isteklerin yüzdesini gösterir. Örneğin, 100 toplam mesaj varsa ve bunlardan 70'i tampon boyutuna sığıyorsa, bu alan 70 gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (NUMERIC(7,4))</li>
                          <li>• Kapsam: Tampon boyutuna eşit mesajlar</li>
                          <li>• Hesaplama: (Sığan mesaj sayısı / Toplam mesaj sayısı) × 100</li>
                          <li>• Kullanım: Tampon boyutuna sığan mesaj oranı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Messages Fit, mesaj boyutlarının tampon boyutuna uygunluğunu belirlemek için kritiktir. Yüksek değerler, veri yolu performansının optimum olduğunu gösterir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_messages_small' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Messages Small (XSIPSML) alanı, taşıma sınıfı tampon uzunluğundan küçük mesaj isteklerinin yüzdesini gösterir. Örneğin, 100 toplam mesaj varsa ve bunlardan 20'si tampon boyutundan küçükse, bu alan 20 gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (NUMERIC(7,4))</li>
                          <li>• Kapsam: Tampon boyutundan küçük mesajlar</li>
                          <li>• Hesaplama: (Küçük mesaj sayısı / Toplam mesaj sayısı) × 100</li>
                          <li>• Kullanım: Küçük mesaj oranı ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Messages Small, küçük mesajların oranını belirlemek için kritiktir. Düşük değerler, veri yolu performansının iyi olduğunu gösterir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'no_paths_count' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          No Paths Count (XSINOP) alanı, yol yok durumunun kaç kez oluştuğunu gösterir. Bu alan, yerel yollar için sıfır gösterir. Çıkan (outbound) yollar için, bu alanın değeri belirtilen taşıma sınıfı içindir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayı (BIGINT)</li>
                          <li>• Kapsam: Yol yok durumu sayısı</li>
                          <li>• Yerel Yollar: 0 gösterir</li>
                          <li>• Kullanım: Yol erişilebilirlik sorunları</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          No Paths Count, veri yolunun erişilebilirlik sorunlarını belirlemek için kritiktir. Yüksek değerler, veri yolu bağlantı sorunlarına işaret edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'no_buffers_count' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          No Buffers Count (XSIBSY) alanı, hiç tampon kullanılabilir olmadığı için bir mesajın reddedilme sayısını gösterir. Yerel veya çıkan (outbound) yollar için, bu alandaki değer belirtilen taşıma sınıfındaki tüm reddedilen mesajları içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayı (BIGINT)</li>
                          <li>• Kapsam: Tampon eksikliği reddeden mesajlar</li>
                          <li>• İçerik: Taşıma sınıfındaki tüm reddedilen mesajlar</li>
                          <li>• Kullanım: Tampon kaynak yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          No Buffers Count, tampon eksikliği nedeniyle reddedilen mesajları belirlemek için kritiktir. Yüksek değerler, tampon kaynağı yetersizliğine işaret edebilir ve kapasite artışı gerektirebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_messages_degraded' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Messages Degraded (XSIPDEG) alanı, taşıma sınıfı tampon boyutundan daha büyük olan ve geciktirilen mesajların yüzdesini gösterir. Örneğin, 20 mesaj tampon boyutundan büyükse ve bunlardan 10'u geciktirildiyse, bu alan 50 gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (NUMERIC(7,4))</li>
                          <li>• Kapsam: Geciktirilen büyük mesajlar</li>
                          <li>• Hesaplama: (Geciktirilen büyük mesajlar / Büyük mesajlar) × 100</li>
                          <li>• Kullanım: Performans düşüşü ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Messages Degraded, veri yolu performans düşüşünü belirlemek için kritiktir. Yüksek değerler, sistem performans sorunlarına işaret edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'transport_class_longest_message' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Transport Class Longest Message (XSGTCL) alanı, belirtilen taşıma sınıfı için tampona sığan en uzun mesajın uzunluğunu gösterir. Bu alan yalnızca çıkan (outbound) yollar için geçerlidir. Gelen (inbound) yollar için bu alan boştur.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Uzunluk (BIGINT)</li>
                          <li>• Kapsam: Tampona sığan en uzun mesaj</li>
                          <li>• Geçerlilik: Yalnızca çıkan (outbound) yollar</li>
                          <li>• Kullanım: Tampon boyutu optimizasyonu</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Transport Class Longest Message, tampon boyutunu optimize etmek için kritiktir. Bu metrik, veri yolu kapasitesini analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'avg_used_message_blocks' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Average Used Message Blocks (XSIAUSE) alanı, sistemde kullanılan mesaj tampon alanının 1K baytlık bloklarının ortalama sayısını gösterir. Yerel veya çıkan (outbound) yol ise, değer belirtilen taşıma sınıfı içindir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: 1K bayt blok sayısı (NUMERIC(7,4))</li>
                          <li>• Kapsam: Ortalama kullanılan mesaj tampon alanı</li>
                          <li>• Hesaplama: Kullanılan toplam blok / Zaman</li>
                          <li>• Kullanım: Tampon alanı kullanım yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Average Used Message Blocks, tampon alanı kullanımını belirlemek için kritiktir. Bu metrik, tampon kaynağı planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_transport_class_buffers_used' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent of Transport Class Buffers Used (XSIPSMX) alanı, kullanılan XCF taşıma sınıfı tamponlarının yüzdesini gösterir. Örneğin, 20 XCF taşıma tamponu varsa ve bunlardan 10'u kullanılıyorsa, bu alan 50 gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (NUMERIC(7,4))</li>
                          <li>• Kapsam: XCF taşıma sınıfı tamponları</li>
                          <li>• Hesaplama: (Kullanılan tamponlar / Toplam tamponlar) × 100</li>
                          <li>• Kullanım: Taşıma sınıfı tampon kullanım yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent of Transport Class Buffers Used, taşıma sınıfı tampon kullanımını belirlemek için kritiktir. Yüksek değerler, tampon kaynağı yetersizliğine işaret edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'max_message' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Maximum Message (XSGSMX) alanı, belirtilen taşıma sınıfı için müşteri tarafından tanımlanan maksimum 1K baytlık tampon alanı blok sayısını gösterir. Yerel veya çıkan (outbound) yol ise, değer taşıma sınıfı içindir. Bu değer SETXCF komutu ile değiştirilebilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: 1K bayt blok sayısı (BIGINT)</li>
                          <li>• Kapsam: Müşteri tanımlı maksimum tampon alanı</li>
                          <li>• Değiştirme: SETXCF komutu ile yapılabilir</li>
                          <li>• Kullanım: Tampon alanı kapasite yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Maximum Message, tampon alanı kapasitesini belirlemek için kritiktir. Bu metrik, kapasite planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_system_buffers_used' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent of System Buffers Used (XSIPUSE) alanı, kullanılan XCF sistem tamponlarının yüzdesini gösterir. Örneğin, 20 XCF tamponu mevcut ise ve bunlardan 10'u şu anda kullanılıyorsa, bu alan 50 gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (NUMERIC(7,4))</li>
                          <li>• Kapsam: XCF sistem tamponları</li>
                          <li>• Hesaplama: (Kullanılan tamponlar / Mevcut tamponlar) × 100</li>
                          <li>• Kullanım: Sistem tampon kullanım yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent of System Buffers Used, sistem tampon kullanımını belirlemek için kritiktir. Yüksek değerler, sistem kaynak yetersizliğine işaret edebilir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'max_message_blocks' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Maximum Message Blocks (XSGMXB) alanı, bu sistem için XCF'de tanımlı mesaj tampon alanının maksimum 1K baytlık blok sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: 1K bayt blok sayısı (BIGINT)</li>
                          <li>• Kapsam: XCF'de tanımlı maksimum tampon alanı</li>
                          <li>• Tanımlama: XCF yapılandırmasında belirtilir</li>
                          <li>• Kullanım: Sistem tampon kapasite yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Maximum Message Blocks, sistem tampon kapasitesini belirlemek için kritiktir. Bu metrik, kapasite planlaması ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'path_direction' && activeModal === 'cmf_xcfsys' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Path Direction (XSGDIRC) alanı, XCF yolunun yönünü gösterir. Bu alanın olası değerleri şunlardır: INBOUND (Gelen), OUTBOUND (Çıkan), LOCAL (Yerel).
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Yön değeri (VARCHAR)</li>
                          <li>• Değerler: INBOUND, OUTBOUND, LOCAL</li>
                          <li>• INBOUND: Gelen yol</li>
                          <li>• OUTBOUND: Çıkan yol</li>
                          <li>• LOCAL: Yerel yol</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Path Direction, XCF yolunun yönünü belirlemek için kritiktir. Bu bilgi, veri yolu performansını ve bağlantı türünü anlamak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== CMF XCFMBR INFO CARDS ============== */}
                  {infoModal === 'system_name' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          System Name (XDGSNAM) alanı, belirtilen XCF üyesinin tanımlandığı sistemin adını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Sistem adı (VARCHAR)</li>
                          <li>• Kapsam: XCF üyesinin tanımlandığı sistem</li>
                          <li>• Kaynak: XCF grup tanımlaması</li>
                          <li>• Kullanım: Üyenin kaynak sistemini belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          System Name, XCF üyesinin hangi sistemde tanımlandığını belirlemek için kritiktir. Bu bilgi, üye bilgilerini takip etmek ve sorun giderme işlemleri yapmak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'group_name' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Group Name (XDGGRP) alanı, XCF üyesinin ait olduğu XCF grup adını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Grup adı (VARCHAR)</li>
                          <li>• Kapsam: XCF grup üyelik bilgisi</li>
                          <li>• Kaynak: XCF grup tanımlaması</li>
                          <li>• Kullanım: Üyenin grup üyeliğini belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Group Name, XCF üyesinin hangi gruba ait olduğunu belirlemek için kritiktir. Bu bilgi, grup içi iletişimi ve üye yönetimini takip etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'member_name' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Member Name (XDGMEM) alanı, bu kayıttaki verinin temsil ettiği XCF üyesinin adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Üye adı (VARCHAR)</li>
                          <li>• Kapsam: XCF üye tanımlaması</li>
                          <li>• Kaynak: XCF grup üyelik kayıtları</li>
                          <li>• Kullanım: Üyenin benzersiz tanımlayıcısı</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Member Name, XCF üyesini benzersiz şekilde tanımlamak için kritiktir. Bu bilgi, üye verilerini takip etmek ve performans analizi yapmak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'job_name' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Job Name (XDDJNAM) alanı, üyenin XCF grubuna katıldığında iş adını gösterir. Bu alan sadece sistem zOS 1.2 ve üzerinde çalışıyorsa ve üye yerel sistemde tanımlıysa geçerli veri içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: İş adı (VARCHAR)</li>
                          <li>• Koşul: zOS 1.2 ve üzeri gerekli</li>
                          <li>• Koşul: Üye yerel sistemde tanımlı olmalı</li>
                          <li>• Kullanım: Üyeyle ilişkili işi belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Job Name, XCF üyesinin hangi işle ilişkili olduğunu belirlemek için kritiktir. Bu bilgi, üye davranışını ve iş performansını analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_received_group_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Received of the Groups Signals (XDIRGTP) alanı, XCF üyesi tarafından alınan bu grup sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Grup sinyalleri alım oranı</li>
                          <li>• Hesaplama: (Alınan grup sinyalleri / Toplam grup sinyalleri) × 100</li>
                          <li>• Kullanım: Grup içi iletişim etkinliği ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Received of the Groups Signals, XCF üyesinin grup içi iletişimde ne kadar aktif olduğunu belirlemek için kritiktir. Bu metrik, grup performansını ve üye etkinliğini analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_received_system_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Received of the System Signals (XDIRSTP) alanı, XCF üyesi tarafından alınan bu sistem sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Sistem sinyalleri alım oranı</li>
                          <li>• Hesaplama: (Alınan sistem sinyalleri / Toplam sistem sinyalleri) × 100</li>
                          <li>• Kullanım: Sistem düzeyinde iletişim etkinliği ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Received of the System Signals, XCF üyesinin sistem düzeyinde ne kadar aktif olduğunu belirlemek için kritiktir. Bu metrik, sistem performansını ve üye etkinliğini analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_received_total_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Received of the Total Signals (XDIRTTP) alanı, XCF üyesi tarafından alınan tüm sistem sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Tüm sistemlerin sinyalleri alım oranı</li>
                          <li>• Hesaplama: (Alınan toplam sinyaller / Toplam sinyaller) × 100</li>
                          <li>• Kullanım: Genel iletişim etkinliği ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Received of the Total Signals, XCF üyesinin tüm sistemlerle olan iletişiminde ne kadar aktif olduğunu belirlemek için kritiktir. Bu metrik, genel performansı analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_sent_group_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Sent of the Groups Signals (XDISGTP) alanı, XCF üyesi tarafından gönderilen bu grup sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Grup sinyalleri gönderim oranı</li>
                          <li>• Hesaplama: (Gönderilen grup sinyalleri / Toplam grup sinyalleri) × 100</li>
                          <li>• Kullanım: Grup içi iletişim etkinliği ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Sent of the Groups Signals, XCF üyesinin grup içi iletişimde ne kadar aktif gönderici olduğunu belirlemek için kritiktir. Bu metrik, grup performansını ve üye etkinliğini analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_sent_system_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Sent of the System Signals (XDISSTP) alanı, XCF üyesi tarafından gönderilen bu sistem sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Sistem sinyalleri gönderim oranı</li>
                          <li>• Hesaplama: (Gönderilen sistem sinyalleri / Toplam sistem sinyalleri) × 100</li>
                          <li>• Kullanım: Sistem düzeyinde iletişim etkinliği ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Sent of the System Signals, XCF üyesinin sistem düzeyinde ne kadar aktif gönderici olduğunu belirlemek için kritiktir. Bu metrik, sistem performansını ve üye etkinliğini analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_sent_total_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Sent of the Total Signals (XDISTTP) alanı, XCF üyesi tarafından gönderilen tüm sistem sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Tüm sistemlerin sinyalleri gönderim oranı</li>
                          <li>• Hesaplama: (Gönderilen toplam sinyaller / Toplam sinyaller) × 100</li>
                          <li>• Kullanım: Genel iletişim etkinliği ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Sent of the Total Signals, XCF üyesinin tüm sistemlerle olan iletişiminde ne kadar aktif gönderici olduğunu belirlemek için kritiktir. Bu metrik, genel performansı analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_group_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Groups Signals (XDITGTP) alanı, XCF üyesi tarafından gönderilen ve alınan bu grup sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Grup sinyalleri toplam etkinlik oranı</li>
                          <li>• Hesaplama: (Gönderilen + Alınan grup sinyalleri) / Toplam grup sinyalleri × 100</li>
                          <li>• Kullanım: Grup içi toplam iletişim ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Groups Signals, XCF üyesinin grup içi toplam iletişim etkinliğini belirlemek için kritiktir. Bu metrik, grup performansını ve üye etkinliğini kapsamlı olarak analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_system_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent System Signals (XDITSTP) alanı, XCF üyesi tarafından gönderilen ve alınan bu sistem sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Sistem sinyalleri toplam etkinlik oranı</li>
                          <li>• Hesaplama: (Gönderilen + Alınan sistem sinyalleri) / Toplam sistem sinyalleri × 100</li>
                          <li>• Kullanım: Sistem düzeyinde toplam iletişim ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent System Signals, XCF üyesinin sistem düzeyinde toplam iletişim etkinliğini belirlemek için kritiktir. Bu metrik, sistem performansını ve üye etkinliğini kapsamlı olarak analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'percent_total_signals' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Percent Total Signals (XDITTTP) alanı, XCF üyesi tarafından gönderilen ve alınan tüm sistem sinyallerinin yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (DECIMAL)</li>
                          <li>• Kapsam: Tüm sistemlerin sinyalleri toplam etkinlik oranı</li>
                          <li>• Hesaplama: (Gönderilen + Alınan toplam sinyaller) / Toplam sinyaller × 100</li>
                          <li>• Kullanım: Genel toplam iletişim ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Percent Total Signals, XCF üyesinin tüm sistemlerle olan toplam iletişim etkinliğini belirlemek için kritiktir. Bu metrik, genel performansı kapsamlı olarak analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'signals_received_by_member' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Signals Received by Member (XDIRCNT) alanı, XCF üyesi tarafından alınan toplam sinyal sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sinyal sayısı (BIGINT)</li>
                          <li>• Kapsam: XCF üyesinin aldığı tüm sinyaller</li>
                          <li>• Kaynak: XCF grup iletişim kayıtları</li>
                          <li>• Kullanım: Üye alım aktivitesi ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Signals Received by Member, XCF üyesinin ne kadar iletişim aldığını belirlemek için kritiktir. Bu metrik, üye aktivitesini ve grup içi iletişim yoğunluğunu analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'signals_sent_by_member' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Signals Sent by Member (XDISCNT) alanı, XCF üyesi tarafından gönderilen toplam sinyal sayısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sinyal sayısı (BIGINT)</li>
                          <li>• Kapsam: XCF üyesinin gönderdiği tüm sinyaller</li>
                          <li>• Kaynak: XCF grup iletişim kayıtları</li>
                          <li>• Kullanım: Üye gönderim aktivitesi ölçümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Signals Sent by Member, XCF üyesinin ne kadar iletişim gönderdiğini belirlemek için kritiktir. Bu metrik, üye aktivitesini ve grup içi iletişim yoğunluğunu analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'status' && activeModal === 'cmf_xcfmbr' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Status (XDGSTAC) alanı, XCF üyesinin durumunu temsil eden bir karakter dizisini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Durum karakter dizisi (VARCHAR)</li>
                          <li>• Kapsam: XCF üye durumu tanımlaması</li>
                          <li>• Kaynak: XCF grup durum bilgisi</li>
                          <li>• Kullanım: Üyenin mevcut durumunu belirleme</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Status, XCF üyesinin mevcut durumunu belirlemek için kritiktir. Bu bilgi, üye sağlığını izlemek ve sorun giderme işlemleri yapmak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== CMF JCSA INFO CARDS ============== */}
                  {infoModal === 'jobname' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Jobname (CDREJNAM) alanı, işin 1-8 karakterlik adını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: 1-8 karakterlik isim</li>
                          <li>• Kapsam: İş tanımlayıcısı</li>
                          <li>• Kaynak: CMF JCSA kayıtları</li>
                          <li>• Kullanım: İş benzersiz kimliği</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Jobname, işi benzersiz şekilde tanımlamak için kritiktir. Bu bilgi, veri izleme ve sorun giderme için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'jes_id' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          JES ID (CDREJID) alanı, adres alanı için JES iş numarasını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: JES iş numarası (VARCHAR)</li>
                          <li>• Kapsam: JES sistem entegrasyonu</li>
                          <li>• Kaynak: CMF JCSA kayıtları</li>
                          <li>• Kullanım: JES iş takibi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          JES ID, işin JES sistemindeki tanımlayıcısını belirlemek için kritiktir. Bu bilgi, JES entegrasyonu ve izleme için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'asid' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Address Space ID (CDREASID) alanı, adres alanının z/OS tarafından oluşturulan sayısal tanımlayıcısını gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayısal tanımlayıcı (INTEGER)</li>
                          <li>• Kapsam: Z/OS adres alanı kimliği</li>
                          <li>• Kaynak: z/OS tarafından üretilir</li>
                          <li>• Kullanım: Adres alanı benzersiz kimliği</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Address Space ID, adres alanını benzersiz şekilde tanımlamak için kritiktir. Bu değer, adres alanını izlemek, yönetmek ve sorun gidermek için kullanılır.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'csa_in_use_percent' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CSA In Use Percent (CDRECSUP) alanı, görünüm türüne göre CSA kullanımı hakkında farklı bilgiler gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (FLOAT)</li>
                          <li>• Kapsam: CSA kullanım oranı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                          <li>• Bağlam: İş bilgileri görünümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CSA In Use Percent, CSA kullanım oranını belirlemek için kritiktir. Bu metrik, bellek kullanımını ve kaynak planlamasını analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'ecsa_in_use_percent' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          ECSA In Use Percent (CDREECUP) alanı, görünüm türüne göre farklı bilgiler gösterir. İş bilgileri görünümünde, iş tarafından şu anda kullanılan ECSA'nın yüzdesini gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (FLOAT)</li>
                          <li>• Kapsam: ECSA kullanım oranı</li>
                          <li>• İş Bilgisi: İş tarafından kullanılan ECSA yüzdesi</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          ECSA In Use Percent, ECSA kullanım oranını belirlemek için kritiktir. Bu metrik, bellek kullanımını ve kaynak planlamasını analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'sqa_in_use_percent' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          SQA In Use Percent (CDRESQUP) alanı, görünüm türüne göre SQA kullanımı hakkında farklı bilgiler gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (FLOAT)</li>
                          <li>• Kapsam: SQA kullanım oranı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                          <li>• Bağlam: İş bilgileri görünümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          SQA In Use Percent, SQA kullanım oranını belirlemek için kritiktir. Bu metrik, bellek kullanımını ve kaynak planlamasını analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'esqa_in_use_percent' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          ESQA In Use Percent (CDREESUP) alanı, görünüm türüne göre ESQA kullanımı hakkında farklı bilgiler gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (FLOAT)</li>
                          <li>• Kapsam: ESQA kullanım oranı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                          <li>• Bağlam: İş bilgileri görünümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          ESQA In Use Percent, ESQA kullanım oranını belirlemek için kritiktir. Bu metrik, bellek kullanımını ve kaynak planlamasını analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'csa_in_use' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CSA in Use (CDRECSAU) alanı, görünüm türüne göre farklı bilgiler gösterir. İş bilgileri görünümünde, iş tarafından şu anda kullanılan CSA miktarını gösteren sayısal bir değer gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayısal değer (BIGINT)</li>
                          <li>• Kapsam: CSA kullanım miktarı</li>
                          <li>• İş Bilgisi: İş tarafından kullanılan CSA miktarı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CSA in Use, CSA kullanım miktarını belirlemek için kritiktir. Bu metrik, bellek kaynak yönetimini ve planlama için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'ecsa_in_use' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          ECSA in Use (CDREECSU) alanı, görünüm türüne göre farklı bilgiler gösterir. İş bilgileri görünümünde, iş tarafından şu anda kullanılan ECSA miktarını gösteren sayısal bir değer gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayısal değer (BIGINT)</li>
                          <li>• Kapsam: ECSA kullanım miktarı</li>
                          <li>• İş Bilgisi: İş tarafından kullanılan ECSA miktarı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          ECSA in Use, ECSA kullanım miktarını belirlemek için kritiktir. Bu metrik, bellek kaynak yönetimini ve planlama için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'sqa_in_use' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          SQA In Use (CDRESQAU) alanı, görünüm türüne göre farklı bilgiler gösterir. İş bilgileri görünümünde, iş tarafından şu anda kullanılan SQA miktarını gösteren sayısal bir değer gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayısal değer (BIGINT)</li>
                          <li>• Kapsam: SQA kullanım miktarı</li>
                          <li>• İş Bilgisi: İş tarafından kullanılan SQA miktarı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          SQA In Use, SQA kullanım miktarını belirlemek için kritiktir. Bu metrik, bellek kaynak yönetimini ve planlama için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'esqa_in_use' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          ESQA In Use (CDREESQU) alanı, görünüm türüne göre farklı bilgiler gösterir. İş bilgileri görünümünde, iş tarafından şu anda kullanılan ESQA miktarını gösteren sayısal bir değer gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayısal değer (BIGINT)</li>
                          <li>• Kapsam: ESQA kullanım miktarı</li>
                          <li>• İş Bilgisi: İş tarafından kullanılan ESQA miktarı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          ESQA In Use, ESQA kullanım miktarını belirlemek için kritiktir. Bu metrik, bellek kaynak yönetimini ve planlama için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'total_used_common_storage' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Used Common Storage (CDRETU) alanı, iş bilgileri görünümünde, iş tarafından şu anda kullanılan toplam ortak depolama miktarını gösteren sayısal bir değer gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Sayısal değer (BIGINT)</li>
                          <li>• Kapsam: Toplam ortak depolama kullanımı</li>
                          <li>• İş Bilgisi: İş tarafından kullanılan toplam ortak depolama</li>
                          <li>• Kullanım: Bellek kaynak yönetimi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Used Common Storage, toplam ortak depolama kullanımını belirlemek için kritiktir. Bu metrik, bellek kaynak yönetimini ve planlama için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {infoModal === 'total_used_percent' && activeModal === 'cmf_jcsa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Total Used Common Storage Percent (CDRETUP) alanı, görünüm türüne göre ortak depolama kullanımı hakkında farklı bilgiler gösterir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: Yüzde (FLOAT)</li>
                          <li>• Kapsam: Toplam ortak depolama kullanım oranı</li>
                          <li>• Kullanım: Görünüm türüne göre değişir</li>
                          <li>• Bağlam: İş bilgileri görünümü</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Total Used Common Storage Percent, toplam ortak depolama kullanım oranını belirlemek için kritiktir. Bu metrik, bellek kullanımını ve kaynak planlamasını analiz etmek için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== CMF SYSCPC INFO CARDS ============== */}
                  {(infoModal === 'smf_id' || infoModal === 'SMF_ID') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          SMF ID alanı, SMF kayıtlarında kullanılan sistem tanımlayıcısını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Sistem tanımlayıcısı (VARCHAR)</li>
                          <li>• Kapsam: SMF kayıt tanımlaması</li>
                          <li>• Kaynak: SMF sistem tanımlaması</li>
                          <li>• Kullanım: SMF kayıtlarında sistem tanımlama</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          SMF ID, sistemin SMF kayıtlarında nasıl tanımlandığını belirlemek için kritiktir. Bu bilgi, SMF kayıt takibi ve sistem analizi için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'system_name' || infoModal === 'SYSTEM_NAME') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          System name alanı, CVTSNAME'de tanımlanan sistem adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Sistem adı (VARCHAR)</li>
                          <li>• Kapsam: CVTSNAME tanımlaması</li>
                          <li>• Kaynak: Z/OS sistem adı</li>
                          <li>• Kullanım: Sistem benzersiz tanımlaması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          System name, sistemin benzersiz kimliğini belirlemek için kritiktir. Bu bilgi, sistem takibi ve yönetimi için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'hardware_name' || infoModal === 'HARDWARE_NAME') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Hardware Name alanı, işlemci yapılandırmasının donanım adını içerir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Donanım adı (VARCHAR)</li>
                          <li>• Kapsam: İşlemci yapılandırması</li>
                          <li>• Kaynak: Donanım fabrika tanımlaması</li>
                          <li>• Kullanım: Donanım tanımlaması</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Hardware Name, işlemci donanımını tanımlamak için kritiktir. Bu bilgi, donanım takibi ve kapasite planlaması için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'cpu_model' || infoModal === 'CPU_MODEL') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CPU Model alanı, CPC (central processing complex) model tanımlayıcısını içerir. CPC aynı zamanda CEC (central electronic complex) olarak da anılır.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Model tanımlayıcısı (VARCHAR)</li>
                          <li>• Kapsam: CPC/CEC model tanımı</li>
                          <li>• CPC: Central Processing Complex</li>
                          <li>• CEC: Central Electronic Complex</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CPU Model, işlemci donanım modelini belirlemek için kritiktir. Bu bilgi, performans analizi ve kapasite planlaması için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'cpc_capacity' || infoModal === 'CPC_CAPACITY') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          CPC Capacity alanı, saatteki milyon servis birimi (MSU) cinsinden mevcut CPC CPU kapasitesini içerir. On/Off Capacity on Demand (OOCoD) nedeniyle, bu alan CPC kalıcı kapasitesinden farklı bir değere sahip olabilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: MSU/saat (milyon servis birimi)</li>
                          <li>• Kapsam: Mevcut CPC CPU kapasitesi</li>
                          <li>• OOCoD: On/Off Capacity on Demand etkisi</li>
                          <li>• Kullanım: Dinamik kapasite takibi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          CPC Capacity, sistemin mevcut CPU kapasitesini belirlemek için kritiktir. Bu metrik, kapasite planlaması, maliyet yönetimi ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'base_cpc_capacity' || infoModal === 'BASE_CPC_CAPACITY') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Base CPC Capacity alanı, saatteki milyon servis birimi (MSU) cinsinden CPC CPU kalıcı kapasitesini içerir. On/Off Capacity on Demand (OOCoD) nedeniyle, bu alan mevcut CPC kapasitesinden farklı bir değere sahip olabilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Birim: MSU/saat (milyon servis birimi)</li>
                          <li>• Kapsam: CPC CPU kalıcı kapasitesi</li>
                          <li>• OOCoD: On/Off Capacity on Demand etkisi</li>
                          <li>• Kullanım: Temel kapasite takibi</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Base CPC Capacity, sistemin kalıcı CPU kapasitesini belirlemek için kritiktir. Bu metrik, kapasite planlaması, maliyet analizi ve OOCoD kullanımını anlamak için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {(infoModal === 'capacity_on_demand' || infoModal === 'CAPACITY_ON_DEMAND') && activeModal === 'cmf_syscpc' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                        <p className="text-blue-800 text-sm">
                          Capacity on Demand alanı, On/Off Capacity on Demand (OOCoD)'in aktif olup olmadığını gösterir. OOCoD, iş yükü gereksinimlerini karşılamaya yardımcı olmak için CP kapasite seviyesini artırmanızı sağlar. CP kapasitesi MSU cinsinden ifade edilir.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                        <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
                          <li>• Format: Aktif/Pasif durumu</li>
                          <li>• OOCoD: On/Off Capacity on Demand</li>
                          <li>• Kapsam: CP kapasite yönetimi</li>
                          <li>• Birim: MSU (milyon servis birimi)</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                        <p className="text-yellow-800 text-sm">
                          Capacity on Demand, OOCoD'nin aktif olup olmadığını belirlemek için kritiktir. Bu bilgi, dinamik kapasite yönetimi, maliyet kontrolü ve performans optimizasyonu için önemlidir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============== RMF ASD INFO CARDS (Dinamik - özel alanlar hariç) ============== */}
                  {activeModal === 'rmf_asd' && infoModal && !['jobname', 'service_class_name', 'service_class_index'].includes(infoModal.toLowerCase()) && (() => {
                    const rows = data.rmf_asd || [];
                    const first = rows[0] || {};
                    const timeLike = ['created_at','updated_at','timestamp','bmctime','record_timestamp','time'];
                    const keys = Object.keys(first || {})
                      .filter(k => k !== 'id')
                      .filter(k => !timeLike.includes(String(k).toLowerCase()));
                    
                    // Eğer bu keyName mevcut kolonlar arasındaysa ve infoModal ile eşleşiyorsa
                    if (keys.includes(infoModal)) {
                      const displayName = getDisplayName(infoModal, 'rmf_asd');
                      const isNumeric = isNumericColumn(infoModal);
                      
                      return (
                        <div className="space-y-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                            <p className="text-blue-800 text-sm">
                              {displayName} alanı, RMF ASD (Address Space Data) kayıtlarında {isNumeric ? 'sayısal bir değer' : 'metin/alfanümerik bir değer'} içerir.
                              {isNumeric ? ' Bu metrik, sistem performansı ve kaynak kullanımı ile ilgili ölçümler sağlar.' : ' Bu alan, sistem yapılandırması veya tanımlayıcı bilgiler içerir.'}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-semibold text-green-900 mb-2">Teknik Detaylar</h4>
                            <p className="text-green-800 text-sm">
                              {isNumeric 
                                ? 'Bu metrik, RMF ASD kayıtlarından alınan sayısal bir performans değeridir. Değer, sistem tarafından toplanan ham verilerden hesaplanır ve zaman içindeki değişimlerini analiz etmek için kullanılır.'
                                : 'Bu alan, RMF ASD kayıtlarından alınan tanımlayıcı veya yapılandırma bilgisidir. Bu değerler, sistem yapılandırması, tanımlayıcılar veya durum bilgileri gibi kategorik veriler içerebilir.'}
                            </p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-900 mb-2">Neden Önemli?</h4>
                            <p className="text-yellow-800 text-sm">
                              {isNumeric
                                ? 'Bu metrik, sistem performansını ve kaynak kullanımını izlemek için önemlidir. Zaman içindeki değişimlerini analiz ederek, performans sorunlarını tespit etmek, kapasite planlaması yapmak ve optimizasyon kararları almak için kullanılabilir.'
                                : 'Bu alan, sistem yapılandırmasını ve tanımlayıcı bilgileri anlamak için önemlidir. Bu bilgiler, kayıtları kategorize etmek, filtrelemek ve analiz etmek için kullanılabilir.'}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
