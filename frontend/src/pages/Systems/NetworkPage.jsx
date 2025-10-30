import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const NetworkPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [infoModal, setInfoModal] = useState(null);
  const [stacksData, setStacksData] = useState([]);
  const [stackCpuData, setStackCpuData] = useState([]);
  const [vtamcsaData, setVtamcsaData] = useState([]);
  const [tcpconfData, setTcpconfData] = useState([]);
  const [tcpconsData, setTcpconsData] = useState([]);
  const [udpconfData, setUdpconfData] = useState([]);
  const [actconsData, setActconsData] = useState([]);
  const [vtmbuffData, setVtmbuffData] = useState([]);
  const [tcpstorData, setTcpstorData] = useState([]);
  const [connsrpzData, setConnsrpzData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [filteredStacksData, setFilteredStacksData] = useState([]);
  const [filteredStackCpuData, setFilteredStackCpuData] = useState([]);
  const [filteredVtamcsaData, setFilteredVtamcsaData] = useState([]);
  const [filteredVtmbuffData, setFilteredVtmbuffData] = useState([]);
  const [filteredConnsrpzData, setFilteredConnsrpzData] = useState([]);
  const [filteredTcpstorData, setFilteredTcpstorData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [chartData, setChartData] = useState([]);
  
  // Stacks sıralama state'leri
  const [stacksSortColumn, setStacksSortColumn] = useState(null);
  const [stacksSortDirection, setStacksSortDirection] = useState('asc');
  
  // STACKCPU sıralama state'leri
  const [stackCpuSortColumn, setStackCpuSortColumn] = useState(null);
  const [stackCpuSortDirection, setStackCpuSortDirection] = useState('asc');
  
  // VTAMCSA sıralama state'leri
  const [vtamcsaSortColumn, setVtamcsaSortColumn] = useState(null);
  const [vtamcsaSortDirection, setVtamcsaSortDirection] = useState('asc');

  // STACKS için IP Address ve BMC Time filtreleme state'leri
  const [ipAddressFilter, setIpAddressFilter] = useState('');
  const [bmcTimeFilter, setBmcTimeFilter] = useState('');

  // Sayı formatı yardımcı fonksiyonu
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  // VTAMCSA için sayı formatı (sonundaki .00 kaldırılır)
  const formatVtamcsaNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    // Eğer sayı tam sayı ise .00 kısmını kaldır
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  // Akıllı min/max formatlama fonksiyonu
  const formatMinMaxValue = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    // Eğer sayı tam sayı ise ondalık kısmı gösterme
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  // STACKS için IP Address filtreleme fonksiyonu
  const filterStacksByIpAddress = (data) => {
    if (!ipAddressFilter) return data;
    return data.filter(row => 
      row.ipaddrc8 && row.ipaddrc8.toLowerCase().includes(ipAddressFilter.toLowerCase())
    );
  };

  // STACKS için BMC Time filtreleme fonksiyonu (zaman aralığına göre)
  const filterStacksByBmcTime = (data) => {
    if (!bmcTimeFilter) {
      console.log('BMC Time filtresi yok, tüm veri döndürülüyor:', data.length);
      return data;
    }
    
    const now = new Date();
    let startDate, endDate;
    
    // Seçilen zaman aralığına göre tarih hesaplama
    switch (bmcTimeFilter) {
      case 'last1h':
        startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'custom':
        if (customFromDate && customToDate) {
          startDate = new Date(customFromDate);
          endDate = new Date(customToDate);
        } else {
          console.log('Özel tarih aralığı seçilmiş ama tarihler eksik');
          return data;
        }
        break;
      default:
        console.log('Bilinmeyen zaman aralığı:', bmcTimeFilter);
        return data;
    }
    
    console.log('BMC Time filtresi uygulanıyor:', {
      filter: bmcTimeFilter,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dataLength: data.length
    });
    
    const filteredData = data.filter(row => {
      if (!row.bmctime) {
        console.log('BMC Time eksik satır:', row);
        return false;
      }
      const bmcTime = new Date(row.bmctime);
      const isInRange = bmcTime >= startDate && bmcTime <= endDate;
      if (!isInRange) {
        console.log('Tarih aralığı dışında:', {
          bmcTime: bmcTime.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }
      return isInRange;
    });
    
    console.log('Filtrelenmiş veri sayısı:', filteredData.length);
    return filteredData;
  };

  // STACKS için birleşik filtreleme fonksiyonu
  const getFilteredStacksData = () => {
    console.log('getFilteredStacksData çağrıldı:', {
      originalDataLength: stacksData.length,
      ipAddressFilter,
      bmcTimeFilter
    });
    
    let filtered = stacksData;
    console.log('IP Address filtresi öncesi:', filtered.length);
    
    filtered = filterStacksByIpAddress(filtered);
    console.log('IP Address filtresi sonrası:', filtered.length);
    
    filtered = filterStacksByBmcTime(filtered);
    console.log('BMC Time filtresi sonrası:', filtered.length);
    
    return filtered;
  };

  // Stacks sıralama fonksiyonu
  const handleStacksSort = (column) => {
    if (column === 'jobnam8' || column === 'stepnam8' || column === 'jtarget' || 
        column === 'asid8' || column === 'mvslvlx8' || column === 'startc8' || 
        column === 'ipaddrc8' || column === 'status18' || column === 'bmctime' || 
        column === 'time') {
      return; // String ve zaman sütunları için sıralama yapma
    }

    const newDirection = stacksSortColumn === column && stacksSortDirection === 'asc' ? 'desc' : 'asc';
    setStacksSortColumn(column);
    setStacksSortDirection(newDirection);
  };

  // STACKCPU sıralama fonksiyonu
  const handleStackCpuSort = (column) => {
    if (column === 'statstks' || column === 'bmctime' || column === 'time') {
      return; // String ve zaman sütunları için sıralama yapma
    }

    const newDirection = stackCpuSortColumn === column && stackCpuSortDirection === 'asc' ? 'desc' : 'asc';
    setStackCpuSortColumn(column);
    setStackCpuSortDirection(newDirection);
  };

  // VTAMCSA sıralama fonksiyonu
  const handleVtamcsaSort = (column) => {
    if (column === 'j_system' || column === 'bmctime' || column === 'time') {
      return; // String ve zaman sütunları için sıralama yapma
    }

    const newDirection = vtamcsaSortColumn === column && vtamcsaSortDirection === 'asc' ? 'desc' : 'asc';
    setVtamcsaSortColumn(column);
    setVtamcsaSortDirection(newDirection);
  };

  // Stacks sütun istatistikleri hesaplama
  const getStacksColumnStats = (column) => {
    const dataToUse = getFilteredStacksData();
    if (!dataToUse || dataToUse.length === 0) return { min: 0, max: 0 };
    
    const values = dataToUse
      .map(row => parseFloat(row[column]) || 0)
      .filter(val => !isNaN(val));
    
    if (values.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // STACKCPU sütun istatistikleri hesaplama
  const getStackCpuColumnStats = (column) => {
    const dataToUse = isFiltered ? filteredStackCpuData : stackCpuData;
    if (!dataToUse || dataToUse.length === 0) return { min: 0, max: 0 };
    
    const values = dataToUse
      .map(row => parseFloat(row[column]) || 0)
      .filter(val => !isNaN(val));
    
    if (values.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // VTAMCSA sütun istatistikleri hesaplama
  const getVtamcsaColumnStats = (column) => {
    const dataToUse = isFiltered ? filteredVtamcsaData : vtamcsaData;
    if (!dataToUse || dataToUse.length === 0) return { min: 0, max: 0 };
    
    const values = dataToUse
      .map(row => parseFloat(row[column]) || 0)
      .filter(val => !isNaN(val));
    
    if (values.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // Excel'e aktarma fonksiyonu
  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }

    // Veri türüne göre sütun başlıklarını belirle
    let headers = [];
    let csvData = [];
    
    if (activeModal === 'STACKS') {
      headers = ['Job Name', 'Step Name', 'Target Field', 'ASID', 'MVS Level', 'Version', 'Start Time', 'IP Address', 'Status', 'BMC Time', 'Time'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.jobnam8 || '',
          row.stepnam8 || '',
          row.jtarget || '',
          row.asid8 || '',
          row.mvslvlx8 || '',
          row.ver_rel || '',
          row.startc8 || '',
          row.ipaddrc8 || '',
          row.status18 || '',
          row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '',
          row.time || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'STACKCPU') {
      headers = ['TCPIP Stack Name', 'Interval Packets Received', 'Packets Received per Second', 'Current Output Requests', 'Output Requests per Second', 'BMC Time', 'Time'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.statstks || '',
          formatNumber(row.ippktrcd),
          row.ippktrtr || '',
          formatNumber(row.ipoutred),
          row.ipoutrtr || '',
          row.bmctime || '',
          row.time || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'vtamcsa') {
      headers = ['J System', 'CSA Cur', 'CSA Max', 'CSA Lim', 'CSA Usage', 'C24 Cur', 'C24 Max', 'VTM Cur', 'VTM Max', 'BMC Time', 'Time'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.j_system || '',
          formatVtamcsaNumber(row.csacur),
          formatVtamcsaNumber(row.csamax),
          formatVtamcsaNumber(row.csalim),
          formatVtamcsaNumber(row.csausage),
          formatVtamcsaNumber(row.c24cur),
          formatVtamcsaNumber(row.c24max),
          formatVtamcsaNumber(row.vtmcur),
          formatVtamcsaNumber(row.vtmmax),
          row.bmctime || '',
          row.time || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'tcpconf') {
      headers = ['Job Name', 'Step Name', 'Target Field', 'System Name', 'Created At', 'Updated At'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.job_name || '',
          row.step_name || '',
          row.target_field || '',
          row.system_name || '',
          row.created_at || '',
          row.updated_at || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'tcpcons') {
      headers = ['Foreign IP Address', 'Foreign Port', 'Local IP Address', 'Local Port', 'State', 'System Name', 'Created At', 'Updated At'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.foreign_ip_address || '',
          row.foreign_port || '',
          row.local_ip_address || '',
          row.local_port || '',
          row.state || '',
          row.system_name || '',
          row.created_at || '',
          row.updated_at || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'udpconf') {
      headers = ['Job Name', 'Step Name', 'Target Field', 'System Name', 'Created At', 'Updated At'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.job_name || '',
          row.step_name || '',
          row.target_field || '',
          row.system_name || '',
          row.created_at || '',
          row.updated_at || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'actcons') {
      headers = ['Foreign IP Address', 'Foreign Port', 'Local IP Address', 'Local Port', 'State', 'System Name', 'Created At', 'Updated At'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.foreign_ip_address || '',
          row.foreign_port || '',
          row.local_ip_address || '',
          row.local_port || '',
          row.state || '',
          row.system_name || '',
          row.created_at || '',
          row.updated_at || ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'VTMBUFF') {
      headers = ['System', 'IOBuf Size', 'IOBuf Times Expanded', 'LPBuf Size', 'LPBuf Times Expanded', 'LFBuf Size', 'LFBuf Times Expanded', 'Timestamp'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.system_name || '',
          row.iobuf_size ?? '',
          row.iobuf_times_expanded ?? '',
          row.lpbuf_size ?? '',
          row.lpbuf_times_expanded ?? '',
          row.lfbuf_size ?? '',
          row.lfbuf_times_expanded ?? '',
          row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'connsrpz') {
      headers = ['Foreign IP', 'Active Conns', 'Avg RTT (ms)', 'Max RTT (ms)', 'Bytes In', 'Bytes Out', 'Stack', 'Remote Host', 'Timestamp'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.foreign_ip_address || '',
          row.active_conns ?? '',
          row.average_rtt_ms ?? '',
          row.max_rtt_ms ?? '',
          row.interval_bytes_in_sum ?? '',
          row.interval_bytes_out_sum ?? '',
          row.stack_name || '',
          row.remote_host_name || '',
          row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : ''
        ].join(','))
      ].join('\n');
    } else if (activeModal === 'tcpstor') {
      headers = ['Step', 'System', 'ECSA Current', 'ECSA Max', 'ECSA Limit', 'ECSA Free', 'Private Current', 'Private Max', 'Timestamp'];
      csvData = [
        headers.join(','),
        ...data.map(row => [
          row.step_name || '',
          row.system_name || '',
          row.ecsa_current ?? '',
          row.ecsa_max ?? '',
          row.ecsa_limit ?? '',
          row.ecsa_free ?? '',
          row.private_current ?? '',
          row.private_max ?? '',
          row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : ''
        ].join(','))
      ].join('\n');
    }

    // BOM ekle (Türkçe karakterler için)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
    
    // Dosyayı indir
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Veriler Excel formatında indirildi');
  };

  // PDF'e aktarma fonksiyonu
  const exportToPDF = (data, filename) => {
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Başlık ekle
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`${filename} Raporu`, 14, 22);
        
        // Tarih ekle
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const currentDate = new Date().toLocaleString('tr-TR');
        doc.text(`Oluşturulma Tarihi: ${currentDate}`, 14, 30);

        // Veri türüne göre tablo verilerini hazırla
        let tableData = [];
        let headers = [];
        
        if (activeModal === 'STACKS') {
          headers = ['Job Name', 'Step Name', 'Target Field', 'ASID', 'MVS Level', 'Version', 'Start Time', 'IP Address', 'Status', 'BMC Time', 'Time'];
          tableData = data.map(row => [
            row.jobnam8 || '-',
            row.stepnam8 || '-',
            row.jtarget || '-',
            row.asid8 || '-',
            row.mvslvlx8 || '-',
            row.ver_rel || '-',
            row.startc8 || '-',
            row.ipaddrc8 || '-',
            row.status18 || '-',
            row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-',
            row.time || '-'
          ]);
        } else if (activeModal === 'STACKCPU') {
          headers = ['TCPIP Stack Name', 'Packets In', 'Packets In per Second', 'Packets Out', 'Packets Out per Second', 'BMC Time', 'Time'];
          tableData = data.map(row => [
            row.statstks || '-',
            formatNumber(row.ippktrcd),
            row.ippktrtr || '-',
            formatNumber(row.ipoutred),
            row.ipoutrtr || '-',
            row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-',
            row.time || '-'
          ]);
        } else if (activeModal === 'vtamcsa') {
          headers = ['J System', 'CSA Cur', 'CSA Max', 'CSA Lim', 'CSA Usage', 'C24 Cur', 'C24 Max', 'VTM Cur', 'VTM Max', 'BMC Time', 'Time'];
          tableData = data.map(row => [
            row.j_system || '-',
            formatVtamcsaNumber(row.csacur),
            formatVtamcsaNumber(row.csamax),
            formatVtamcsaNumber(row.csalim),
            formatVtamcsaNumber(row.csausage),
            formatVtamcsaNumber(row.c24cur),
            formatVtamcsaNumber(row.c24max),
            formatVtamcsaNumber(row.vtmcur),
            formatVtamcsaNumber(row.vtmmax),
            row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-',
            row.time || '-'
          ]);
        } else if (activeModal === 'tcpconf') {
          headers = ['Job Name', 'Step Name', 'Target Field', 'System Name', 'Created At', 'Updated At'];
          tableData = data.map(row => [
            row.job_name || '-',
            row.step_name || '-',
            row.target_field || '-',
            row.system_name || '-',
            row.created_at || '-',
            row.updated_at || '-'
          ]);
        } else if (activeModal === 'tcpcons') {
          headers = ['Foreign IP Address', 'Foreign Port', 'Local IP Address', 'Local Port', 'State', 'System Name', 'Created At', 'Updated At'];
          tableData = data.map(row => [
            row.foreign_ip_address || '-',
            row.foreign_port || '-',
            row.local_ip_address || '-',
            row.local_port || '-',
            row.state || '-',
            row.system_name || '-',
            row.created_at || '-',
            row.updated_at || '-'
          ]);
        } else if (activeModal === 'udpconf') {
          headers = ['Job Name', 'Step Name', 'Target Field', 'System Name', 'Created At', 'Updated At'];
          tableData = data.map(row => [
            row.job_name || '-',
            row.step_name || '-',
            row.target_field || '-',
            row.system_name || '-',
            row.created_at || '-',
            row.updated_at || '-'
          ]);
        } else if (activeModal === 'actcons') {
          headers = ['Foreign IP Address', 'Foreign Port', 'Local IP Address', 'Local Port', 'State', 'System Name', 'Created At', 'Updated At'];
          tableData = data.map(row => [
            row.foreign_ip_address || '-',
            row.foreign_port || '-',
            row.local_ip_address || '-',
            row.local_port || '-',
            row.state || '-',
            row.system_name || '-',
            row.created_at || '-',
            row.updated_at || '-'
          ]);
        } else if (activeModal === 'VTMBUFF') {
          headers = ['System', 'IOBuf Size', 'IOBuf Times Expanded', 'LPBuf Size', 'LPBuf Times Expanded', 'LFBuf Size', 'LFBuf Times Expanded', 'Timestamp'];
          tableData = data.map(row => [
            row.system_name || '-',
            row.iobuf_size ?? '-',
            row.iobuf_times_expanded ?? '-',
            row.lpbuf_size ?? '-',
            row.lpbuf_times_expanded ?? '-',
            row.lfbuf_size ?? '-',
            row.lfbuf_times_expanded ?? '-',
            row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : '-'
          ]);
        } else if (activeModal === 'connsrpz') {
          headers = ['Foreign IP', 'Active Conns', 'Avg RTT (ms)', 'Max RTT (ms)', 'Bytes In', 'Bytes Out', 'Stack', 'Remote Host', 'Timestamp'];
          tableData = data.map(row => [
            row.foreign_ip_address || '-',
            row.active_conns ?? '-',
            row.average_rtt_ms ?? '-',
            row.max_rtt_ms ?? '-',
            row.interval_bytes_in_sum ?? '-',
            row.interval_bytes_out_sum ?? '-',
            row.stack_name || '-',
            row.remote_host_name || '-',
            row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : '-'
          ]);
        } else if (activeModal === 'tcpstor') {
          headers = ['Step', 'System', 'ECSA Current', 'ECSA Max', 'ECSA Limit', 'ECSA Free', 'Private Current', 'Private Max', 'Timestamp'];
          tableData = data.map(row => [
            row.step_name || '-',
            row.system_name || '-',
            row.ecsa_current ?? '-',
            row.ecsa_max ?? '-',
            row.ecsa_limit ?? '-',
            row.ecsa_free ?? '-',
            row.private_current ?? '-',
            row.private_max ?? '-',
            row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : '-'
          ]);
        }
        
        // Tablo oluştur
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 40,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left'
          },
          headStyles: {
            fillColor: [242, 242, 242],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [249, 249, 249]
          }
        });

        // PDF'i indir
        const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success('PDF başarıyla indirildi');
      }).catch((error) => {
        console.error('Script yükleme hatası:', error);
        toast.error('PDF oluşturma hatası. Lütfen sayfayı yenileyin ve tekrar deneyin.');
      });
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  // Tablo kontrolü fonksiyonu
  const checkTableInfoStacks = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExistsStacks !== 'function') {
        console.error('checkTableExistsStacks fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExistsStacks();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_stacks tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // Veri çekme fonksiyonu (optimize edilmiş)
  const fetchStacksData = async () => {
    setDataLoading(true);
    const startTime = performance.now(); // Performans ölçümü
    
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoStacks();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworkStacks();
      
      if (response.data.success) {
        setStacksData(response.data.data);
        
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        
        if (response.data.data.length === 0) {
          // Tablo boşsa sessizce devam et, uyarı verme
        } else {
          toast.success(`Veriler başarıyla yüklendi (${response.data.data.length} kayıt) - ${loadTime}ms`);
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

  // STACKCPU tablo kontrolü fonksiyonu
  const checkTableInfoStackCPU = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExistsStackCPU !== 'function') {
        console.error('checkTableExistsStackCPU fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExistsStackCPU();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_stackcpu tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // STACKCPU veri çekme fonksiyonu
  const fetchStackCpuData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoStackCPU();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworkStackCPU();
      
      if (response.data.success) {
        setStackCpuData(response.data.data);
        
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

  // VTAMCSA tablo kontrolü fonksiyonu
  const checkTableInfoVtamcsa = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExistsVtamcsa !== 'function') {
        console.error('checkTableExistsVtamcsa fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExistsVtamcsa();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_vtamcsa tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // VTAMCSA veri çekme fonksiyonu
  const fetchVtamcsaData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoVtamcsa();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworkVtamcsa();
      
      if (response.data.success) {
        setVtamcsaData(response.data.data);
        
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

  // TCPCONF Tablo kontrolü fonksiyonu
  const checkTableInfoTcpconf = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExiststcpconf !== 'function') {
        console.error('checkTableExiststcpconf fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExiststcpconf();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_tcpconf tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // TCPCONF Veri çekme fonksiyonu
  const fetchTcpconfData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoTcpconf();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworkTcpconf();
      
      if (response.data.success) {
        setTcpconfData(response.data.data);
        
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

  // TCPCONS Tablo kontrolü fonksiyonu
  const checkTableInfoTcpcons = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExiststcpcons !== 'function') {
        console.error('checkTableExiststcpcons fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExiststcpcons();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_tcpcons tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // TCPCONS Veri çekme fonksiyonu
  const fetchTcpconsData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoTcpcons();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworktcpcons();
      
      if (response.data.success) {
        setTcpconsData(response.data.data);
        
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

  // UDPCONF Tablo kontrolü fonksiyonu
  const checkTableInfoUdpconf = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExistsudpconf !== 'function') {
        console.error('checkTableExistsudpconf fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExistsudpconf();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_udpconf tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // UDPCONF Veri çekme fonksiyonu
  const fetchUdpconfData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoUdpconf();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworkUdpconf();
      
      if (response.data.success) {
        setUdpconfData(response.data.data);
        
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

  // ACTCONS Tablo kontrolü fonksiyonu
  const checkTableInfoActcons = async () => {
    try {
      // Önce API fonksiyonunun var olup olmadığını kontrol et
      if (typeof databaseAPI.checkTableExistsactcons !== 'function') {
        console.error('checkTableExistsactcons fonksiyonu bulunamadı!');
        console.log('Mevcut databaseAPI fonksiyonları:', Object.keys(databaseAPI));
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }
      
      const response = await databaseAPI.checkTableExistsactcons();
      
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        
        if (!tableInfo.exists) {
          toast.error('mainview_network_actcons tablosu bulunamadı!');
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
      console.error('Error details:', error.response?.data);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // ACTCONS Veri çekme fonksiyonu
  const fetchActconsData = async () => {
    setDataLoading(true);
    try {
      // Önce tablo kontrolü yap
      const tableExists = await checkTableInfoActcons();
      if (!tableExists) {
        setDataLoading(false);
        return;
      }
      
      const response = await databaseAPI.getMainviewNetworkactcons();
      
      if (response.data.success) {
        setActconsData(response.data.data);
        
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

  // VTMBUFF Tablo kontrolü fonksiyonu
  const checkTableInfoVtmbuff = async () => {
    try {
      if (typeof databaseAPI.checkTableExistsVtmbuff !== 'function') {
        console.error('checkTableExistsVtmbuff fonksiyonu bulunamadı!');
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }

      const response = await databaseAPI.checkTableExistsVtmbuff();
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        if (!tableInfo.exists) {
          toast.error('mainview_network_vtmbuff tablosu bulunamadı!');
          return false;
        }
        if (tableInfo.rowCount === 0) return false;
        toast.success(`Tablo mevcut: ${tableInfo.rowCount} kayıt bulundu`);
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // VTMBUFF veri çekme fonksiyonu
  const fetchVtmbuffData = async () => {
    setDataLoading(true);
    try {
      const tableExists = await checkTableInfoVtmbuff();
      if (!tableExists) { setDataLoading(false); return; }

      const response = await databaseAPI.getMainviewNetworkVtmbuff();
      if (response.data.success) {
        const dataWithIndex = (response.data.data || []).map((item, index) => ({
          ...item,
          index: index + 1
        }));
        setVtmbuffData(dataWithIndex);
        if (response.data.data.length > 0) toast.success(`Veriler başarıyla yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally { setDataLoading(false); }
  };

  // TCPSTOR Tablo kontrolü fonksiyonu
  const checkTableInfoTcpstor = async () => {
    try {
      if (typeof databaseAPI.checkTableExistsTcpstor !== 'function') {
        console.error('checkTableExistsTcpstor fonksiyonu bulunamadı!');
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }

      const response = await databaseAPI.checkTableExistsTcpstor();
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        if (!tableInfo.exists) {
          toast.error('mainview_network_tcpstor tablosu bulunamadı!');
          return false;
        }
        if (tableInfo.rowCount === 0) return false;
        toast.success(`Tablo mevcut: ${tableInfo.rowCount} kayıt bulundu`);
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // TCPSTOR veri çekme fonksiyonu
  const fetchTcpstorData = async () => {
    setDataLoading(true);
    try {
      const tableExists = await checkTableInfoTcpstor();
      if (!tableExists) { setDataLoading(false); return; }

      const response = await databaseAPI.getMainviewNetworkTcpstor();
      if (response.data.success) {
        const dataWithIndex = (response.data.data || []).map((item, index) => ({
          ...item,
          index: index + 1
        }));
        setTcpstorData(dataWithIndex);
        if (response.data.data.length > 0) toast.success(`Veriler başarıyla yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally { setDataLoading(false); }
  };

  // CONNSRPZ Tablo kontrolü fonksiyonu
  const checkTableInfoConnsrpz = async () => {
    try {
      if (typeof databaseAPI.checkTableExistsConnsrpz !== 'function') {
        console.error('checkTableExistsConnsrpz fonksiyonu bulunamadı!');
        toast.error('API fonksiyonu bulunamadı! Lütfen sayfayı yenileyin.');
        return false;
      }

      const response = await databaseAPI.checkTableExistsConnsrpz();
      if (response.data.success) {
        const tableInfo = response.data.tableInfo;
        if (!tableInfo.exists) {
          toast.error('mainview_network_connsrpz tablosu bulunamadı!');
          return false;
        }
        if (tableInfo.rowCount === 0) return false;
        toast.success(`Tablo mevcut: ${tableInfo.rowCount} kayıt bulundu`);
        return true;
      }
    } catch (error) {
      console.error('Tablo kontrolü hatası:', error);
      toast.error(`Tablo kontrolü başarısız: ${error.message}`);
      return false;
    }
  };

  // CONNSRPZ veri çekme fonksiyonu
  const fetchConnsrpzData = async () => {
    setDataLoading(true);
    try {
      const tableExists = await checkTableInfoConnsrpz();
      if (!tableExists) { setDataLoading(false); return; }

      const response = await databaseAPI.getMainviewNetworkConnsrpz();
      if (response.data.success) {
        const dataWithIndex = (response.data.data || []).map((item, index) => ({
          ...item,
          index: index + 1
        }));
        setConnsrpzData(dataWithIndex);
        if (response.data.data.length > 0) toast.success(`Veriler başarıyla yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('Veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      toast.error(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally { setDataLoading(false); }
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setActiveTab('table');
    setDataLoading(false); // Modal açıldığında loading'i false yap
    
    // Stacks modalı açıldığında veri çek
    if (modalType === 'STACKS') {
      fetchStacksData();
    }
    
    // STACKCPU modalı açıldığında veri çek
    if (modalType === 'STACKCPU') {
      fetchStackCpuData();
    }
    
    // VTAMCSA modalı açıldığında veri çek
    if (modalType === 'vtamcsa') {
      fetchVtamcsaData();
    }
    
    // TCPCONF modalı açıldığında veri çek
    if (modalType === 'tcpconf') {
      fetchTcpconfData();
    }
    
    // TCPCONS modalı açıldığında veri çek
    if (modalType === 'tcpcons') {
      fetchTcpconsData();
    }
    
    // UDPCONF modalı açıldığında veri çek
    if (modalType === 'udpconf') {
      fetchUdpconfData();
    }
    
    // ACTCONS modalı açıldığında veri çek
    if (modalType === 'actcons') {
      fetchActconsData();
    }
    // VTMBUFF modalı açıldığında veri çek
    if (modalType === 'VTMBUFF') {
      fetchVtmbuffData();
    }

    // CONNSRPZ modalı açıldığında veri çek
    if (modalType === 'connsrpz') {
      fetchConnsrpzData();
    }

    // TCPSTOR modalı açıldığında veri çek
    if (modalType === 'tcpstor') {
      fetchTcpstorData();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab('table');
    setSelectedChart(null);
  };

  const openChart = (chartType) => {
    setSelectedChart(chartType);
    setChartTab('chart');
    // Grafik veri setini seçilen karta göre hazırla
    // VTMBUFF
    if (chartType === 'vtmbuffIOBufSize') setChartData((isFiltered ? filteredVtmbuffData : vtmbuffData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.iobuf_size) || 0 })));
    if (chartType === 'vtmbuffLPBufSize') setChartData((isFiltered ? filteredVtmbuffData : vtmbuffData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.lpbuf_size) || 0 })));
    if (chartType === 'vtmbuffLFBufSize') setChartData((isFiltered ? filteredVtmbuffData : vtmbuffData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.lfbuf_size) || 0 })));
    if (chartType === 'vtmbuffIOBufTimesExpanded') setChartData((isFiltered ? filteredVtmbuffData : vtmbuffData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.iobuf_times_expanded) || 0 })));
    if (chartType === 'vtmbuffLPBufTimesExpanded') setChartData((isFiltered ? filteredVtmbuffData : vtmbuffData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.lpbuf_times_expanded) || 0 })));
    if (chartType === 'vtmbuffLFBufTimesExpanded') setChartData((isFiltered ? filteredVtmbuffData : vtmbuffData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.lfbuf_times_expanded) || 0 })));

    // TCPSTOR
    if (chartType === 'tcpstorEcsaCurrent') setChartData((isFiltered ? filteredTcpstorData : tcpstorData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.ecsa_current) || 0 })));
    if (chartType === 'tcpstorEcsaMax') setChartData((isFiltered ? filteredTcpstorData : tcpstorData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.ecsa_max) || 0 })));
    if (chartType === 'tcpstorEcsaLimit') setChartData((isFiltered ? filteredTcpstorData : tcpstorData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.ecsa_limit) || 0 })));
    if (chartType === 'tcpstorEcsaFree') setChartData((isFiltered ? filteredTcpstorData : tcpstorData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.ecsa_free) || 0 })));
    if (chartType === 'tcpstorPrivateCurrent') setChartData((isFiltered ? filteredTcpstorData : tcpstorData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.private_current) || 0 })));
    if (chartType === 'tcpstorPrivateMax') setChartData((isFiltered ? filteredTcpstorData : tcpstorData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.private_max) || 0 })));

    // CONNSRPZ
    if (chartType === 'connsrpzActiveConns') setChartData((isFiltered ? filteredConnsrpzData : connsrpzData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.active_conns) || 0 })));
    if (chartType === 'connsrpzAvgRtt') setChartData((isFiltered ? filteredConnsrpzData : connsrpzData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.average_rtt_ms) || 0 })));
    if (chartType === 'connsrpzMaxRtt') setChartData((isFiltered ? filteredConnsrpzData : connsrpzData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.max_rtt_ms) || 0 })));
    if (chartType === 'connsrpzBytesIn') setChartData((isFiltered ? filteredConnsrpzData : connsrpzData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.interval_bytes_in_sum) || 0 })));
    if (chartType === 'connsrpzBytesOut') setChartData((isFiltered ? filteredConnsrpzData : connsrpzData).map(r => ({ label: r.record_timestamp || r.created_at || r.updated_at, value: Number(r.interval_bytes_out_sum) || 0 })));
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

  // STACKS için zaman filtresi uygulama
  const applyStacksTimeFilter = () => {
    const timeRangeLabels = {
      'last1h': 'Son 1 Saat',
      'last6h': 'Son 6 Saat', 
      'last24h': 'Son 24 Saat',
      'last7d': 'Son 7 Gün',
      'last30d': 'Son 30 Gün',
      'custom': customFromDate && customToDate ? 
        `${new Date(customFromDate).toLocaleDateString('tr-TR')} - ${new Date(customToDate).toLocaleDateString('tr-TR')}` : 
        'Özel Tarih Aralığı'
    };
    
    setBmcTimeFilter(selectedTimeRange);
    setTimeFilterModal(false);
    
    const label = timeRangeLabels[selectedTimeRange];
    toast.success(`BMC Time filtresi uygulandı: ${label}`);
    
    console.log('BMC Time filtresi uygulandı:', selectedTimeRange);
  };

  const closeTimeFilter = () => {
    setTimeFilterModal(false);
  };

  // STACKS için BMC Time filtresini temizleme
  const clearStacksTimeFilter = () => {
    setBmcTimeFilter('');
    console.log('BMC Time filtresi temizlendi');
    toast.success('BMC Time filtresi temizlendi');
  };

  const clearTimeFilter = () => {
    setFilteredStacksData([]);
    setFilteredStackCpuData([]);
    setFilteredVtamcsaData([]);
    setFilteredVtmbuffData([]);
    setFilteredConnsrpzData([]);
    setFilteredTcpstorData([]);
    setIsFiltered(false);
    setSelectedTimeRange('last6h');
    setCustomFromDate('');
    setCustomToDate('');
    toast.success('Zaman filtresi temizlendi');
  };

  const applyTimeFilter = () => {
    try {
      let filteredStacks = [...stacksData];
      let filteredStackCpu = [...stackCpuData];
      let filteredVtamcsa = [...vtamcsaData];
      let filteredVtmbuff = [...vtmbuffData];
      let filteredConnsrpz = [...connsrpzData];
      let filteredTcpstor = [...tcpstorData];
      
      // Özel tarih aralığı seçilmişse
      if (selectedTimeRange === 'custom') {
        if (!customFromDate || !customToDate) {
          toast.error('Lütfen başlangıç ve bitiş tarihlerini seçin');
          return;
        }
        
        const fromDate = new Date(customFromDate);
        const toDate = new Date(customToDate);
        
        filteredStacks = stacksData.filter(item => {
          const itemTime = new Date(item.created_at || item.updated_at);
          return itemTime >= fromDate && itemTime <= toDate;
        });
        
        filteredStackCpu = stackCpuData.filter(item => {
          const itemTime = new Date(item.created_at || item.updated_at);
          return itemTime >= fromDate && itemTime <= toDate;
        });
        
        filteredVtamcsa = vtamcsaData.filter(item => {
          const itemTime = new Date(item.created_at || item.updated_at);
          return itemTime >= fromDate && itemTime <= toDate;
        });

        // VTMBUFF/CONNSRPZ/TCPSTOR - record_timestamp alanına göre
        filteredVtmbuff = vtmbuffData.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.created_at || item.updated_at);
          return itemTime >= fromDate && itemTime <= toDate;
        }).map((item, index) => ({ ...item, index: index + 1 }));
        filteredConnsrpz = connsrpzData.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.created_at || item.updated_at);
          return itemTime >= fromDate && itemTime <= toDate;
        }).map((item, index) => ({ ...item, index: index + 1 }));
        filteredTcpstor = tcpstorData.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.created_at || item.updated_at);
          return itemTime >= fromDate && itemTime <= toDate;
        }).map((item, index) => ({ ...item, index: index + 1 }));
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
        
        filteredStacks = stacksData.filter(item => {
          const itemTime = new Date(item.created_at || item.updated_at);
          return itemTime >= fromDate;
        });
        
        filteredStackCpu = stackCpuData.filter(item => {
          const itemTime = new Date(item.created_at || item.updated_at);
          return itemTime >= fromDate;
        });
        
        filteredVtamcsa = vtamcsaData.filter(item => {
          const itemTime = new Date(item.created_at || item.updated_at);
          return itemTime >= fromDate;
        });

        // VTMBUFF/CONNSRPZ/TCPSTOR - record_timestamp alanına göre
        filteredVtmbuff = vtmbuffData.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.created_at || item.updated_at);
          return itemTime >= fromDate;
        }).map((item, index) => ({ ...item, index: index + 1 }));
        filteredConnsrpz = connsrpzData.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.created_at || item.updated_at);
          return itemTime >= fromDate;
        }).map((item, index) => ({ ...item, index: index + 1 }));
        filteredTcpstor = tcpstorData.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.created_at || item.updated_at);
          return itemTime >= fromDate;
        }).map((item, index) => ({ ...item, index: index + 1 }));
      }
      
      setFilteredStacksData(filteredStacks);
      setFilteredStackCpuData(filteredStackCpu);
      setFilteredVtamcsaData(filteredVtamcsa);
      setFilteredVtmbuffData(filteredVtmbuff);
      setFilteredConnsrpzData(filteredConnsrpz);
      setFilteredTcpstorData(filteredTcpstor);
      setIsFiltered(true);
      
      const totalFiltered =
        filteredStacks.length +
        filteredStackCpu.length +
        filteredVtamcsa.length +
        filteredVtmbuff.length +
        filteredConnsrpz.length +
        filteredTcpstor.length;
      toast.success(`Filtreleme uygulandı. ${totalFiltered} kayıt bulundu.`);
      closeTimeFilter();
      
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      toast.error('Filtreleme sırasında hata oluştu');
    }
  };

  const tabs = [
    { id: 'table', name: 'Tablo', icon: '📊' },
    { id: 'chart', name: 'Grafik', icon: '📈' },
    { id: 'threshold', name: 'Threshold', icon: '⚙️' }
  ];

    // Aktif moda göre renk belirleme (Örnek)
    const getModalColor = (modal = activeModal) => {
        switch(modal) {
            case 'STACKCPU': return 'green';
            case 'vtamcsa': return 'purple';
            case 'tcpconf': return 'indigo';
            case 'tcpcons': return 'teal';
            case 'udpconf': return 'amber';
            case 'actcons': return 'rose';
            case 'VTMBUFF': return 'red';
            case 'connsrpz': return 'pink';
            case 'tcpstor': return 'sky';
            case 'STACKS':
            default: return 'blue';
        }
    }
    const modalColor = getModalColor();

  // Stacks sıralanmış veri - IP Address ve BMC Time filtrelerini de dahil et
  const stacksDataToUse = getFilteredStacksData();
  const sortedStacksData = [...stacksDataToUse].sort((a, b) => {
    if (!stacksSortColumn) return 0;
    
    const aValue = parseFloat(a[stacksSortColumn]) || 0;
    const bValue = parseFloat(b[stacksSortColumn]) || 0;
    
    if (stacksSortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // STACKCPU sıralanmış veri - filtrelenmiş veri varsa onu kullan
  const stackCpuDataToUse = isFiltered ? filteredStackCpuData : stackCpuData;
  const sortedStackCpuData = [...stackCpuDataToUse].sort((a, b) => {
    if (!stackCpuSortColumn) return 0;
    
    const aValue = parseFloat(a[stackCpuSortColumn]) || 0;
    const bValue = parseFloat(b[stackCpuSortColumn]) || 0;
    
    if (stackCpuSortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // VTAMCSA sıralanmış veri - filtrelenmiş veri varsa onu kullan
  const vtamcsaDataToUse = isFiltered ? filteredVtamcsaData : vtamcsaData;
  const sortedVtamcsaData = [...vtamcsaDataToUse].sort((a, b) => {
    if (!vtamcsaSortColumn) return 0;
    
    const aValue = parseFloat(a[vtamcsaSortColumn]) || 0;
    const bValue = parseFloat(b[vtamcsaSortColumn]) || 0;
    
    if (vtamcsaSortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Network Management
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* STACKS Kartı (Eklendi) */}
          <div onClick={() => openModal('STACKS')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6 mx-auto group-hover:bg-blue-200"><svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h4M8 7a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 01-2 2h-4a2 2 0 01-2-2V7z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a2 2 0 00-2-2h-4a2 2 0 00-2 2v8a2 2 0 002 2h4a2 2 0 002-2V7z"></path></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">STACKS</h2><p className="text-gray-500 text-sm font-medium">Genel STACK Bilgileri</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* STACKCPU Kartı (Eklendi) */}
          <div onClick={() => openModal('STACKCPU')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-6 mx-auto group-hover:bg-green-200"><svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">STACKCPU</h2><p className="text-gray-500 text-sm font-medium">CPU ve Paket İstatistikleri</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* VTAMCSA Kartı (Eklendi) */}
          <div onClick={() => openModal('vtamcsa')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6 mx-auto group-hover:bg-purple-200"><svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">VTAMCSA</h2><p className="text-gray-500 text-sm font-medium">VTAM ve CSA Yönetimi</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* TCPCONF Kartı */}
          <div onClick={() => openModal('tcpconf')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-6 mx-auto group-hover:bg-indigo-200"><svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">TCPCONF</h2><p className="text-gray-500 text-sm font-medium">TCP/IP Yapılandırma</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* TCPCONS Kartı */}
          <div onClick={() => openModal('tcpcons')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-teal-100 rounded-xl mb-6 mx-auto group-hover:bg-teal-200"><svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">TCPCONS</h2><p className="text-gray-500 text-sm font-medium">TCP/IP Bağlantı Durumu</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* UDPCONF Kartı */}
          <div onClick={() => openModal('udpconf')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-amber-100 rounded-xl mb-6 mx-auto group-hover:bg-amber-200"><svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">UDPCONF</h2><p className="text-gray-500 text-sm font-medium">UDP Yapılandırma</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* ACTCONS Kartı */}
          <div onClick={() => openModal('actcons')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-rose-100 rounded-xl mb-6 mx-auto group-hover:bg-rose-200"><svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">ACTCONS</h2><p className="text-gray-500 text-sm font-medium">Aktif Bağlantı Durumu</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* VTMBUFF Kartı */}
          <div onClick={() => openModal('VTMBUFF')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-6 mx-auto group-hover:bg-red-200"><svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h-4m-2 0H7" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">VTMBUFF</h2><p className="text-gray-500 text-sm font-medium">VTAM Buffer İstatistikleri</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* CONNSRPZ Kartı */}
          <div onClick={() => openModal('connsrpz')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-pink-100 rounded-xl mb-6 mx-auto group-hover:bg-pink-200"><svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M12 20.005v-5.292a4 4 0 00-4-4h-2M18 15.713a4 4 0 00-4-4h-2" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">CONNSRPZ</h2><p className="text-gray-500 text-sm font-medium">Connection Hızı ve Durumu</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
            </div>
          </div>

          {/* TCPSTOR Kartı */}
          <div onClick={() => openModal('tcpstor')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-sky-100 rounded-xl mb-6 mx-auto group-hover:bg-sky-200"><svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">TCPSTOR</h2><p className="text-gray-500 text-sm font-medium">TCP Storage Yönetimi</p><div className="mt-4 flex items-center justify-center"><div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><span className="text-xs font-medium text-gray-600">Aktif</span></div></div></div>
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
                    {activeModal === 'STACKS' && 'STACKS Yönetimi'}
                    {activeModal === 'STACKCPU' && 'STACKCPU Yönetimi'}
                    {activeModal === 'vtamcsa' && 'VTAMCSA Yönetimi'}
                    {activeModal === 'tcpconf' && 'TCPCONF Yönetimi'}
                    {activeModal === 'tcpcons' && 'TCPCONS Yönetimi'}
                    {activeModal === 'udpconf' && 'UDPCONF Yönetimi'}
                    {activeModal === 'actcons' && 'ACTCONS Yönetimi'}
                    {activeModal === 'VTMBUFF' && 'VTAM Buffer Yönetimi'}
                    {activeModal === 'connsrpz' && 'Connection RPZ Yönetimi'}
                    {activeModal === 'tcpstor' && 'TCP Storage Yönetimi'}
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
                        {activeModal === 'STACKS' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(sortedStacksData, 'STACKS')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || sortedStacksData.length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(sortedStacksData, 'STACKS')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || sortedStacksData.length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              PDF'e Aktar
                            </button>
                            <button
                              onClick={openTimeFilter}
                              className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 flex items-center ${
                                bmcTimeFilter 
                                  ? 'text-blue-700 bg-blue-100 border-blue-300 hover:bg-blue-200' 
                                  : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              BMC Time Filtresi
                              {bmcTimeFilter && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                                  Aktif
                                </span>
                              )}
                            </button>
                            {bmcTimeFilter && (
                              <button
                                onClick={clearStacksTimeFilter}
                                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Temizle
                              </button>
                            )}
                            <button
                              onClick={fetchStacksData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'STACKCPU' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(sortedStackCpuData, 'STACKCPU')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || sortedStackCpuData.length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(sortedStackCpuData, 'STACKCPU')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || sortedStackCpuData.length === 0}
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
                              onClick={fetchStackCpuData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'vtamcsa' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(sortedVtamcsaData, 'VTAMCSA')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || sortedVtamcsaData.length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(sortedVtamcsaData, 'VTAMCSA')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || sortedVtamcsaData.length === 0}
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
                              onClick={fetchVtamcsaData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'tcpconf' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(isFiltered ? filteredTcpconfData : tcpconfData, 'TCPCONF')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredTcpconfData : tcpconfData).length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(isFiltered ? filteredTcpconfData : tcpconfData, 'TCPCONF')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredTcpconfData : tcpconfData).length === 0}
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
                              onClick={fetchTcpconfData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'tcpcons' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(isFiltered ? filteredTcpconsData : tcpconsData, 'TCPCONS')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredTcpconsData : tcpconsData).length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(isFiltered ? filteredTcpconsData : tcpconsData, 'TCPCONS')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredTcpconsData : tcpconsData).length === 0}
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
                              onClick={fetchTcpconsData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'udpconf' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(isFiltered ? filteredUdpconfData : udpconfData, 'UDPCONF')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredUdpconfData : udpconfData).length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(isFiltered ? filteredUdpconfData : udpconfData, 'UDPCONF')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredUdpconfData : udpconfData).length === 0}
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
                              onClick={fetchUdpconfData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'actcons' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(isFiltered ? filteredActconsData : actconsData, 'ACTCONS')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredActconsData : actconsData).length === 0}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Excel'e Aktar
                            </button>
                            <button
                              onClick={() => exportToPDF(isFiltered ? filteredActconsData : actconsData, 'ACTCONS')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredActconsData : actconsData).length === 0}
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
                              onClick={fetchActconsData}
                              disabled={dataLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dataLoading ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                          </div>
                        )}
                        {activeModal === 'VTMBUFF' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => exportToExcel(isFiltered ? filteredVtmbuffData : vtmbuffData, 'VTMBUFF')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredVtmbuffData : vtmbuffData).length === 0}
                            >Excel'e Aktar</button>
                            <button
                              onClick={() => exportToPDF(isFiltered ? filteredVtmbuffData : vtmbuffData, 'VTMBUFF')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200 flex items-center"
                              disabled={dataLoading || (isFiltered ? filteredVtmbuffData : vtmbuffData).length === 0}
                            >PDF'e Aktar</button>
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
                            <button onClick={fetchVtmbuffData} disabled={dataLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md">{dataLoading ? 'Yükleniyor...' : 'Yenile'}</button>
                          </div>
                        )}

                        {activeModal === 'connsrpz' && (
                          <div className="flex space-x-3">
                            <button onClick={() => exportToExcel(isFiltered ? filteredConnsrpzData : connsrpzData, 'CONNSRPZ')} className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md" disabled={dataLoading || (isFiltered ? filteredConnsrpzData : connsrpzData).length === 0}>Excel'e Aktar</button>
                            <button onClick={() => exportToPDF(isFiltered ? filteredConnsrpzData : connsrpzData, 'CONNSRPZ')} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md" disabled={dataLoading || (isFiltered ? filteredConnsrpzData : connsrpzData).length === 0}>PDF'e Aktar</button>
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
                            <button onClick={fetchConnsrpzData} disabled={dataLoading} className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md">{dataLoading ? 'Yükleniyor...' : 'Yenile'}</button>
                          </div>
                        )}

                        {activeModal === 'tcpstor' && (
                          <div className="flex space-x-3">
                            <button onClick={() => exportToExcel(isFiltered ? filteredTcpstorData : tcpstorData, 'TCPSTOR')} className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md" disabled={dataLoading || (isFiltered ? filteredTcpstorData : tcpstorData).length === 0}>Excel'e Aktar</button>
                            <button onClick={() => exportToPDF(isFiltered ? filteredTcpstorData : tcpstorData, 'TCPSTOR')} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md" disabled={dataLoading || (isFiltered ? filteredTcpstorData : tcpstorData).length === 0}>PDF'e Aktar</button>
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
                            <button onClick={fetchTcpstorData} disabled={dataLoading} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md">{dataLoading ? 'Yükleniyor...' : 'Yenile'}</button>
                          </div>
                        )}
                      </div>
                      
                      {activeModal === 'STACKS' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {/* Sade Filtreleme */}
                          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-700">IP Address:</span>
                                  <input
                                    type="text"
                                    placeholder="192.168.1.1"
                                    value={ipAddressFilter}
                                    onChange={(e) => {
                                      setIpAddressFilter(e.target.value);
                                      console.log('IP Address filtresi değişti:', e.target.value);
                                    }}
                                    className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                                  />
                                </div>
                              </div>
                              
                              {/* Sade Sonuç Gösterimi */}
                              {ipAddressFilter && (
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-1 border border-green-200">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-green-700">
                                      <span className="font-semibold">{sortedStacksData.length}</span> kayıt
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      setIpAddressFilter('');
                                      console.log('IP Address filtresi temizlendi');
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors duration-200"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>Temizle</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : sortedStacksData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">J Target</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MVS Level</th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleStacksSort('ver_rel')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>Version</span>
                                          {stacksSortColumn === 'ver_rel' ? (
                                            <span className="text-blue-600 font-bold">
                                              {stacksSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getStacksColumnStats('ver_rel').min)} | Max: {formatMinMaxValue(getStacksColumnStats('ver_rel').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMC Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {sortedStacksData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.jobnam8 || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.stepnam8 || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.jtarget || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.asid8 || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.mvslvlx8 || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ver_rel || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.startc8 || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ipaddrc8 || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                          row.status18?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                                          row.status18?.toLowerCase() === 'inactive' ? 'bg-red-100 text-red-800' :
                                          row.status18?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {row.status18 || '-'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                      ) : activeModal === 'STACKCPU' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : sortedStackCpuData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATSTKS</th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleStackCpuSort('ippktrcd')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>IPPKTRCD</span>
                                          {stackCpuSortColumn === 'ippktrcd' ? (
                                            <span className="text-blue-600 font-bold">
                                              {stackCpuSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getStackCpuColumnStats('ippktrcd').min)} | Max: {formatMinMaxValue(getStackCpuColumnStats('ippktrcd').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleStackCpuSort('ippktrtr')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>IPPKTRTR</span>
                                          {stackCpuSortColumn === 'ippktrtr' ? (
                                            <span className="text-blue-600 font-bold">
                                              {stackCpuSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getStackCpuColumnStats('ippktrtr').min)} | Max: {formatMinMaxValue(getStackCpuColumnStats('ippktrtr').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleStackCpuSort('ipoutred')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>IPOUTRED</span>
                                          {stackCpuSortColumn === 'ipoutred' ? (
                                            <span className="text-blue-600 font-bold">
                                              {stackCpuSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getStackCpuColumnStats('ipoutred').min)} | Max: {formatMinMaxValue(getStackCpuColumnStats('ipoutred').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleStackCpuSort('ipoutrtr')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>IPOUTRTR</span>
                                          {stackCpuSortColumn === 'ipoutrtr' ? (
                                            <span className="text-blue-600 font-bold">
                                              {stackCpuSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getStackCpuColumnStats('ipoutrtr').min)} | Max: {formatMinMaxValue(getStackCpuColumnStats('ipoutrtr').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMC Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {sortedStackCpuData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.statstks || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.ippktrcd)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ippktrtr || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.ipoutred)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ipoutrtr || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                      ) : activeModal === 'vtamcsa' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : sortedVtamcsaData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">J System</th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('csacur')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>CSA Cur</span>
                                          {vtamcsaSortColumn === 'csacur' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('csacur').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('csacur').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('csamax')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>CSA Max</span>
                                          {vtamcsaSortColumn === 'csamax' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('csamax').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('csamax').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('csalim')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>CSA Lim</span>
                                          {vtamcsaSortColumn === 'csalim' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('csalim').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('csalim').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('csausage')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>CSA Usage</span>
                                          {vtamcsaSortColumn === 'csausage' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('csausage').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('csausage').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('c24cur')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>C24 Cur</span>
                                          {vtamcsaSortColumn === 'c24cur' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('c24cur').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('c24cur').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('c24max')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>C24 Max</span>
                                          {vtamcsaSortColumn === 'c24max' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('c24max').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('c24max').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('vtmcur')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>VTM Cur</span>
                                          {vtamcsaSortColumn === 'vtmcur' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('vtmcur').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('vtmcur').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th 
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                      onClick={() => handleVtamcsaSort('vtmmax')}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>VTM Max</span>
                                          {vtamcsaSortColumn === 'vtmmax' ? (
                                            <span className="text-blue-600 font-bold">
                                              {vtamcsaSortDirection === 'asc' ? '↑ Küçükten Büyüğe' : '↓ Büyükten Küçüğe'}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">↕ Sırala</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 font-normal">
                                          Min: {formatMinMaxValue(getVtamcsaColumnStats('vtmmax').min)} | Max: {formatMinMaxValue(getVtamcsaColumnStats('vtmmax').max)}
                                        </div>
                                      </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMC Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {sortedVtamcsaData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.j_system || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.csacur)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.csamax)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.csalim)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.csausage)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.c24cur)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.c24max)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.vtmcur)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatVtamcsaNumber(row.vtmmax)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.bmctime ? new Date(row.bmctime).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                      ) : activeModal === 'tcpconf' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : tcpconfData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stack Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Def Receive Bufsize</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Def Send Bufsize</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Receive Bufsize</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Queue Depth</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Retran Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Retran Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roundtrip Gain</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance Gain</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance Multiple</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Keepalive</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay ACK</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restrict Low Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send Garbage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TCP Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTLS</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finwait2 Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {tcpconfData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.job_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.stack_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.def_receive_bufsize || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.def_send_bufsize || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.def_max_receive_bufsize || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.maximum_queue_depth || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.max_retran_time || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.min_retran_time || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.roundtrip_gain || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.variance_gain || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.variance_multiple || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.default_keepalive || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.delay_ack || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.restrict_low_port || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.send_garbage || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.tcp_timestamp || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ttls || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.finwait2time || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.system_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.created_at ? new Date(row.created_at).toLocaleString('tr-TR') : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.updated_at ? new Date(row.updated_at).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                      ) : activeModal === 'tcpcons' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : tcpconsData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foreign IP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remote Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type of Open</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bytes In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bytes Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remote Host</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {tcpconsData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.foreign_ip_address || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.remote_port || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.local_port || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.application_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.type_of_open || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.interval_bytes_in || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.interval_bytes_out || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                          row.connection_status === 'ESTABLISHED' ? 'bg-green-100 text-green-800' :
                                          row.connection_status === 'LISTEN' ? 'bg-blue-100 text-blue-800' :
                                          row.connection_status === 'CLOSE_WAIT' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {row.connection_status || '-'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.remote_host_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.system_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.created_at ? new Date(row.created_at).toLocaleString('tr-TR') : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.updated_at ? new Date(row.updated_at).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                      ) : activeModal === 'udpconf' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : udpconfData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stack Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Def Recv Bufsize</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Def Send Bufsize</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Summing</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restrict Low Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UDP Queue Limit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {udpconfData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.job_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.stack_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.def_recv_bufsize || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.def_send_bufsize || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.check_summing || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.restrict_low_port || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.udp_queue_limit || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.system_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.created_at ? new Date(row.created_at).toLocaleString('tr-TR') : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.updated_at ? new Date(row.updated_at).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                      ) : activeModal === 'actcons' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : actconsData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foreign IP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remote Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local IP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type of Open</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bytes In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bytes Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remote Host</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {actconsData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.foreign_ip_address || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.remote_port || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.local_ip_address || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.local_port || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.application_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.type_of_open || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.interval_bytes_in || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.interval_bytes_out || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                          row.connection_status === 'ESTABLISHED' ? 'bg-green-100 text-green-800' :
                                          row.connection_status === 'LISTEN' ? 'bg-blue-100 text-blue-800' :
                                          row.connection_status === 'CLOSE_WAIT' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {row.connection_status || '-'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.remote_host_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.system_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.created_at ? new Date(row.created_at).toLocaleString('tr-TR') : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.updated_at ? new Date(row.updated_at).toLocaleString('tr-TR') : '-'}
                                      </td>
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
                          ) : activeModal === 'VTMBUFF' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : (isFiltered ? filteredVtmbuffData : vtmbuffData).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IOBuf Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IOBuf Times Expanded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LPBuf Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LPBuf Times Expanded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LFBuf Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LFBuf Times Expanded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {(isFiltered ? filteredVtmbuffData : vtmbuffData).map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.index || index + 1}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.system_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.iobuf_size ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.iobuf_times_expanded ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.lpbuf_size ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.lpbuf_times_expanded ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.lfbuf_size ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.lfbuf_times_expanded ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : '-'}</td>
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
                      ) : activeModal === 'connsrpz' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : (isFiltered ? filteredConnsrpzData : connsrpzData).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foreign IP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Conns</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg RTT (ms)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max RTT (ms)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bytes In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bytes Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stack</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remote Host</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {(isFiltered ? filteredConnsrpzData : connsrpzData).map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.index || index + 1}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.foreign_ip_address || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.active_conns ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.average_rtt_ms ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.max_rtt_ms ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.interval_bytes_in_sum ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.interval_bytes_out_sum ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.stack_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.remote_host_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : '-'}</td>
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
                      ) : activeModal === 'tcpstor' ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {dataLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
                            </div>
                          ) : (isFiltered ? filteredTcpstorData : tcpstorData).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECSA Current</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECSA Max</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECSA Limit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECSA Free</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Private Current</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Private Max</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {(isFiltered ? filteredTcpstorData : tcpstorData).map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.index || index + 1}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.step_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.system_name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ecsa_current ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ecsa_max ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ecsa_limit ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ecsa_free ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.private_current ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.private_max ?? '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.record_timestamp ? new Date(row.record_timestamp).toLocaleString('tr-TR') : '-'}</td>
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
                        <p className="text-gray-500 text-sm mt-2">{activeModal} verileri</p>
                      </div>
                      )}
                    </div>
                  )}

                  {/* Grafik Sekmesi (Basit Placeholder, TCPCONF için örnek kartlar) */}
                  {activeTab === 'chart' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Performans Grafikleri</h4>

                      {/* VTMBUFF için Grafik Kartları (tablodaki kolonlarla uyumlu) */}
                      {activeModal === 'VTMBUFF' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* System */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffSystem'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">System</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.system_name ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.system_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* IOBuf Size */}
                          <div onClick={() => openChart('vtmbuffIOBufSize')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffIobufSize'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">IOBuf Size</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.iobuf_size ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.iobuf_size}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* IOBuf Times Expanded */}
                          <div onClick={() => openChart('vtmbuffIOBufTimesExpanded')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffIobufTimes'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">IOBuf Times Expanded</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.iobuf_times_expanded ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-rose-100 text-rose-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.iobuf_times_expanded}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* LPBuf Size */}
                          <div onClick={() => openChart('vtmbuffLPBufSize')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffLpbufSize'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200"><svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10M20 7v10M4 12h16" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">LPBuf Size</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.lpbuf_size ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.lpbuf_size}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* LPBuf Times Expanded */}
                          <div onClick={() => openChart('vtmbuffLPBufTimesExpanded')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffLpbufTimes'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">LPBuf Times Expanded</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.lpbuf_times_expanded ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.lpbuf_times_expanded}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* LFBuf Size */}
                          <div onClick={() => openChart('vtmbuffLFBufSize')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffLfbufSize'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-lime-200"><svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M8 17h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">LFBuf Size</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.lfbuf_size ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-lime-100 text-lime-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.lfbuf_size}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* LFBuf Times Expanded */}
                          <div onClick={() => openChart('vtmbuffLFBufTimesExpanded')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('vtmbuffLfbufTimes'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">LFBuf Times Expanded</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.lfbuf_times_expanded ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-fuchsia-100 text-fuchsia-800">
                                    {(isFiltered ? filteredVtmbuffData : vtmbuffData)[0]?.lfbuf_times_expanded}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg></div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">{(isFiltered ? filteredVtmbuffData : vtmbuffData)?.[0]?.record_timestamp ? new Date((isFiltered ? filteredVtmbuffData : vtmbuffData)[0].record_timestamp).toLocaleString('tr-TR') : '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TCPSTOR için Grafik Kartları (tablodaki kolonlarla uyumlu) */}
                      {activeModal === 'tcpstor' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Step */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorStep'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Step</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.step_name ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-sky-100 text-sky-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.step_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* System */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorSystem'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">System</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.system_name ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.system_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* ECSA Current */}
                          <div onClick={() => openChart('tcpstorEcsaCurrent')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorEcsaCurrent'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M8 17h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">ECSA Current</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.ecsa_current ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.ecsa_current}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* ECSA Max */}
                          <div onClick={() => openChart('tcpstorEcsaMax')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorEcsaMax'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">ECSA Max</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.ecsa_max ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-rose-100 text-rose-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.ecsa_max}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* ECSA Limit */}
                          <div onClick={() => openChart('tcpstorEcsaLimit')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorEcsaLimit'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">ECSA Limit</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.ecsa_limit ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.ecsa_limit}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* ECSA Free */}
                          <div onClick={() => openChart('tcpstorEcsaFree')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorEcsaFree'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8M3 12h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">ECSA Free</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.ecsa_free ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.ecsa_free}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Private Current */}
                          <div onClick={() => openChart('tcpstorPrivateCurrent')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorPrivateCurrent'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M8 17h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Private Current</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.private_current ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-lime-100 text-lime-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.private_current}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Private Max */}
                          <div onClick={() => openChart('tcpstorPrivateMax')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpstorPrivateMax'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Private Max</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.private_max ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-fuchsia-100 text-fuchsia-800">
                                    {(isFiltered ? filteredTcpstorData : tcpstorData)[0]?.private_max}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Created/Updated at info not displayed as a card - keep LAST UPDATE card */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg></div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">{(isFiltered ? filteredTcpstorData : tcpstorData)?.[0]?.record_timestamp ? new Date((isFiltered ? filteredTcpstorData : tcpstorData)[0].record_timestamp).toLocaleString('tr-TR') : '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CONNSRPZ için Grafik Kartları (tablodaki kolonlarla uyumlu) */}
                      {activeModal === 'connsrpz' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Foreign IP */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzForeignIp'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h10M9 20h6" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Foreign IP</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.foreign_ip_address ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.foreign_ip_address}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Active Conns */}
                          <div onClick={() => openChart('connsrpzActiveConns')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzActiveConns'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Active Conns</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.active_conns ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-pink-100 text-pink-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.active_conns}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Avg/Max RTT */}
                          <div onClick={() => openChart('connsrpzAvgRtt')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzRtt'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8M3 12h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Avg/Max RTT (ms)</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.average_rtt_ms ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.average_rtt_ms} / {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.max_rtt_ms ?? '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Bytes In */}
                          <div onClick={() => openChart('connsrpzBytesIn')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzBytesIn'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Bytes In</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.interval_bytes_in_sum ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.interval_bytes_in_sum}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Bytes Out */}
                          <div onClick={() => openChart('connsrpzBytesOut')} className="group relative bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzBytesOut'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8M3 12h8" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Bytes Out</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.interval_bytes_out_sum ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.interval_bytes_out_sum}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Stack */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzStack'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Stack</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.stack_name ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.stack_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Remote Host */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('connsrpzRemoteHost'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0" /></svg></div>
                              <h5 className="font-bold text-gray-800 text-lg mb-2">Remote Host</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.remote_host_name ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-800">
                                    {(isFiltered ? filteredConnsrpzData : connsrpzData)[0]?.remote_host_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg></div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">{(isFiltered ? filteredConnsrpzData : connsrpzData)?.[0]?.record_timestamp ? new Date((isFiltered ? filteredConnsrpzData : connsrpzData)[0].record_timestamp).toLocaleString('tr-TR') : '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TCPCONF için Grafik Kartları */}
                      {activeModal === 'tcpconf' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Job Name */}
                          <div onClick={() => openChart('tcpconfJobName')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfJobName'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Job Name</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Stack Name */}
                          <div onClick={() => openChart('tcpconfStackName')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfStackName'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Stack Name</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Buffer Sizes */}
                          <div onClick={() => openChart('tcpconfBuffers')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfBuffers'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Buffer Sizes</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Queue Depth */}
                          <div onClick={() => openChart('tcpconfQueueDepth')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfQueueDepth'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200"><svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Queue Depth</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Retransmission Times */}
                          <div onClick={() => openChart('tcpconfRetrans')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfRetrans'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Retransmission</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Roundtrip Gain */}
                          <div onClick={() => openChart('tcpconfRoundtrip')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfRoundtrip'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200"><svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Roundtrip Gain</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Variance Metrics */}
                          <div onClick={() => openChart('tcpconfVariance')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfVariance'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-200"><svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Variance Metrics</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Keepalive Settings */}
                          <div onClick={() => openChart('tcpconfKeepalive')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconfKeepalive'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200"><svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Keepalive Settings</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
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
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ACTCONS için Grafik Kartları */}
                      {activeModal === 'actcons' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Foreign IP Address */}
                          <div onClick={() => openChart('actconsForeignIP')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('actconsForeignIP'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-200"><svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Foreign IP</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Port Information */}
                          <div onClick={() => openChart('actconsPorts')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('actconsPorts'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Port Info</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Application Name */}
                          <div onClick={() => openChart('actconsApplication')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('actconsApplication'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200"><svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Application</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Type of Open */}
                          <div onClick={() => openChart('actconsTypeOpen')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('actconsTypeOpen'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Type of Open</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Data Transfer */}
                          <div onClick={() => openChart('actconsDataTransfer')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('actconsDataTransfer'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200"><svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Data Transfer</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Connection Status */}
                          <div onClick={() => openChart('actconsStatus')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('actconsStatus'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Connection Status</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Remote Host Name */}
                          <div onClick={() => openChart('actconsRemoteHost')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('actconsRemoteHost'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Remote Host</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                           {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6"> <div className="text-center"> <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"> <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> </div> <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5> </div> </div>
                        </div>
                      )}

                      {/* TCPCONS için Grafik Kartları */}
                      {activeModal === 'tcpcons' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Foreign IP Address */}
                          <div onClick={() => openChart('tcpconsForeignIP')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsForeignIP'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Foreign IP</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Port Information */}
                          <div onClick={() => openChart('tcpconsPorts')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsPorts'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Port Info</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Application Name */}
                          <div onClick={() => openChart('tcpconsApplication')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsApplication'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200"><svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Application</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Type of Open */}
                          <div onClick={() => openChart('tcpconsTypeOpen')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsTypeOpen'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Type of Open</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Bytes In/Out */}
                          <div onClick={() => openChart('tcpconsBytes')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsBytes'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200"><svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Data Transfer</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Connection Status */}
                          <div onClick={() => openChart('tcpconsStatus')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsStatus'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Connection Status</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Remote Host Name */}
                          <div onClick={() => openChart('tcpconsRemoteHost')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('tcpconsRemoteHost'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-200"><svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Remote Host</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                           {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6"> <div className="text-center"> <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"> <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> </div> <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5> </div> </div>
                        </div>
                      )}

                      {/* UDPCONF için Grafik Kartları */}
                      {activeModal === 'udpconf' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Job Name */}
                          <div onClick={() => openChart('udpconfJobName')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('udpconfJobName'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200"><svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Job Name</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Stack Name */}
                          <div onClick={() => openChart('udpconfStackName')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('udpconfStackName'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Stack Name</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Buffer Sizes */}
                          <div onClick={() => openChart('udpconfBuffers')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            <button onClick={(e) => { e.stopPropagation(); openInfo('udpconfBuffers'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200"><svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Buffer Sizes</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Check Summing */}
                          <div onClick={() => openChart('udpconfCheckSumming')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('udpconfCheckSumming'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Check Summing</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* Restrict Low Port */}
                          <div onClick={() => openChart('udpconfRestrictPort')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('udpconfRestrictPort'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Restrict Low Port</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                          {/* UDP Queue Limit */}
                          <div onClick={() => openChart('udpconfQueueLimit')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                             <button onClick={(e) => { e.stopPropagation(); openInfo('udpconfQueueLimit'); }} className={`absolute top-3 right-3 w-6 h-6 bg-${modalColor}-100 hover:bg-${modalColor}-200 text-${modalColor}-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Queue Limit</h5>
                              <div className="text-2xl font-bold text-gray-900"><span className="text-gray-400">-</span></div>
                            </div>
                          </div>
                           {/* Last Update */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6"> <div className="text-center"> <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"> <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> </div> <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5> </div> </div>
                        </div>
                      )}

                      {/* STACKCPU Grafik Kartları */}
                      {activeModal === 'STACKCPU' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* STATSTKS */}
                          <div 
                            onClick={() => openChart('statstks')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('statstks');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">TCPIP Stack Name</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stackCpuData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    {stackCpuData[0]?.statstks || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* IPPKTRCD */}
                          <div 
                            onClick={() => openChart('ippktrcd')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('ippktrcd');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Interval Packets Received</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stackCpuData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    {formatNumber(stackCpuData[0]?.ippktrcd)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* IPPKTRTR */}
                          <div 
                            onClick={() => openChart('ippktrtr')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('ippktrtr');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Packets Received per Second</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stackCpuData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    {stackCpuData[0]?.ippktrtr || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* IPOUTRED */}
                          <div 
                            onClick={() => openChart('ipoutred')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('ipoutred');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Current Output Requests</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stackCpuData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    {formatNumber(stackCpuData[0]?.ipoutred)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* IPOUTRTR */}
                          <div 
                            onClick={() => openChart('ipoutrtr')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('ipoutrtr');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h-4m-2 0H7" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Output Requests per Second</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stackCpuData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    {stackCpuData[0]?.ipoutrtr || '-'}
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
                              <h5 className="font-bold text-gray-500 text-lg mb-2">LAST UPDATE</h5>
                              {stackCpuData.length > 0 && (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="font-medium">
                                    {stackCpuData[stackCpuData.length - 1]?.created_at 
                                      ? new Date(stackCpuData[stackCpuData.length - 1].created_at).toLocaleString('tr-TR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })
                                      : stackCpuData[stackCpuData.length - 1]?.updated_at
                                        ? new Date(stackCpuData[stackCpuData.length - 1].updated_at).toLocaleString('tr-TR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                          })
                                        : '-'
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* VTAMCSA Grafik Kartları */}
                      {activeModal === 'vtamcsa' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* CSA Cur */}
                          <div 
                            onClick={() => openChart('csacur')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('csacur');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Current ECSA Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.csacur)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* System Field */}
                          <div 
                            onClick={() => openChart('systemField')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('systemField');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">System Field</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {vtamcsaData[0]?.j_system || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CSA Max */}
                          <div 
                            onClick={() => openChart('csamax')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('csamax');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Maximum ECSA Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.csamax)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CSA Lim */}
                          <div 
                            onClick={() => openChart('csalim')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('csalim');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">CSA Limit</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.csalim)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CSA Usage */}
                          <div 
                            onClick={() => openChart('csausage')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('csausage');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">ECSA Storage Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.csausage)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* C24 Cur */}
                          <div 
                            onClick={() => openChart('c24cur')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('c24cur');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h-4m-2 0H7" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Current CSA24 Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.c24cur)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* C24 Max */}
                          <div 
                            onClick={() => openChart('c24max')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('c24max');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Maximum CSA24 Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.c24max)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* VTM Cur */}
                          <div 
                            onClick={() => openChart('vtmcur')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('vtmcur');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Current Private Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.vtmcur)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CTM Max */}
                          <div 
                            onClick={() => openChart('vtmmax')}
                            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('vtmmax');
                              }}
                              className="absolute top-3 right-3 w-6 h-6 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Maximum Private Usage</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {vtamcsaData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                    {formatVtamcsaNumber(vtamcsaData[0]?.vtmmax)}
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
                              <h5 className="font-bold text-gray-500 text-lg mb-2">LAST UPDATE</h5>
                              {vtamcsaData.length > 0 && (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="font-medium">
                                    {vtamcsaData[vtamcsaData.length - 1]?.created_at 
                                      ? new Date(vtamcsaData[vtamcsaData.length - 1].created_at).toLocaleString('tr-TR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })
                                      : vtamcsaData[vtamcsaData.length - 1]?.updated_at
                                        ? new Date(vtamcsaData[vtamcsaData.length - 1].updated_at).toLocaleString('tr-TR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                          })
                                        : '-'
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STACKS Grafik Kartları */}
                      {activeModal === 'STACKS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Job Name */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('jobName');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Job Name</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.jobnam8 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step Name */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('stepName');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Step Name</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.stepnam8 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>


                          {/* ASID - Grafik */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('asid');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Stack ASID</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.asid8 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* MVS Level - Grafik */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('mvsLevel');
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">MVS Level</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.mvslvlx8 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Version - Grafik */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('version');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Stack Vers</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.ver_rel || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* IP Address - Grafik */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('ipAddress');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Stack IPaddr</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.ipaddrc8 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status - Grafik */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('status');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Stack Status</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    stacksData[0]?.status18?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                                    stacksData[0]?.status18?.toLowerCase() === 'inactive' ? 'bg-red-100 text-red-800' :
                                    stacksData[0]?.status18?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {stacksData[0]?.status18 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Start Time - Grafik */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('startTime');
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Start time of Stack</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.startc8 || '-'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Target Field */}
                          <div className="group relative bg-white rounded-2xl border border-gray-200 p-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInfo('targetField');
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
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">Target Field</h5>
                              <div className="text-2xl font-bold text-gray-900">
                                {stacksData.length > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {stacksData[0]?.jtarget || '-'}
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
                              <h5 className="font-bold text-gray-500 text-lg mb-2">LAST UPDATE</h5>
                              {stacksData.length > 0 && (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="font-medium">
                                    {stacksData[stacksData.length - 1]?.created_at 
                                      ? new Date(stacksData[stacksData.length - 1].created_at).toLocaleString('tr-TR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })
                                      : stacksData[stacksData.length - 1]?.updated_at
                                        ? new Date(stacksData[stacksData.length - 1].updated_at).toLocaleString('tr-TR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                          })
                                        : '-'
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Diğer modal tipleri için placeholder - artık VTMBUFF, tcpstor ve connsrpz eklendi */}
                      {activeModal !== 'tcpconf' && activeModal !== 'actcons' && activeModal !== 'STACKS' && activeModal !== 'STACKCPU' && activeModal !== 'vtamcsa' && activeModal !== 'tcpcons' && activeModal !== 'udpconf' && activeModal !== 'VTMBUFF' && activeModal !== 'tcpstor' && activeModal !== 'connsrpz' && (
                           <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <div className="text-4xl mb-4">📈</div>
                            <p className="text-gray-600 text-lg">Grafik kartları buraya eklenecek</p>
                            <p className="text-gray-500 text-sm mt-2">{activeModal} grafikleri</p>
                          </div>
                      )}
                    </div>
                  )}

                  {/* Threshold Sekmesi (Basit Placeholder) */}
                  {activeTab === 'threshold' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Threshold Ayarları</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Kritik Eşik</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="90"/></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Uyarı Eşiği</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="75"/></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5>
                          <div className="space-y-3">
                            <label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked /><span className="text-sm text-gray-600">E-posta bildirimi</span></label>
                            <label className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm text-gray-600">SMS bildirimi</span></label>
                            <label className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm text-gray-600">Sistem bildirimi</span></label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button>
                        <button className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700`}>Kaydet</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grafik Detay Modalı - ZOS sayfasındaki çizim şablonu ile benzer basit çizim */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedChart === 'vtmbuffIOBufSize' && 'IOBuf Size - Zaman Serisi Grafiği'}
                    {selectedChart === 'vtmbuffLPBufSize' && 'LPBuf Size - Zaman Serisi Grafiği'}
                    {selectedChart === 'vtmbuffLFBufSize' && 'LFBuf Size - Zaman Serisi Grafiği'}
                    {selectedChart === 'vtmbuffIOBufTimesExpanded' && 'IOBuf Times Expanded - Zaman Serisi Grafiği'}
                    {selectedChart === 'vtmbuffLPBufTimesExpanded' && 'LPBuf Times Expanded - Zaman Serisi Grafiği'}
                    {selectedChart === 'vtmbuffLFBufTimesExpanded' && 'LFBuf Times Expanded - Zaman Serisi Grafiği'}
                    {selectedChart === 'tcpstorEcsaCurrent' && 'ECSA Current - Zaman Serisi Grafiği'}
                    {selectedChart === 'tcpstorEcsaMax' && 'ECSA Max - Zaman Serisi Grafiği'}
                    {selectedChart === 'tcpstorEcsaLimit' && 'ECSA Limit - Zaman Serisi Grafiği'}
                    {selectedChart === 'tcpstorEcsaFree' && 'ECSA Free - Zaman Serisi Grafiği'}
                    {selectedChart === 'tcpstorPrivateCurrent' && 'Private Current - Zaman Serisi Grafiği'}
                    {selectedChart === 'tcpstorPrivateMax' && 'Private Max - Zaman Serisi Grafiği'}
                    {selectedChart === 'connsrpzActiveConns' && 'Active Conns - Zaman Serisi Grafiği'}
                    {selectedChart === 'connsrpzAvgRtt' && 'Average RTT (ms) - Zaman Serisi Grafiği'}
                    {selectedChart === 'connsrpzMaxRtt' && 'Max RTT (ms) - Zaman Serisi Grafiği'}
                    {selectedChart === 'connsrpzBytesIn' && 'Bytes In - Zaman Serisi Grafiği'}
                    {selectedChart === 'connsrpzBytesOut' && 'Bytes Out - Zaman Serisi Grafiği'}
                  </h3>
                  <button onClick={closeChart} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                 <div className="border-b border-gray-200 mb-6">
                   <nav className="-mb-px flex space-x-8">
                      <button onClick={() => setChartTab('chart')} className={`py-2 px-1 border-b-2 font-medium text-sm ${ chartTab === 'chart' ? `border-${modalColor}-500 text-${modalColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}><span className="mr-2">📈</span>Grafik</button>
                      <button onClick={() => setChartTab('threshold')} className={`py-2 px-1 border-b-2 font-medium text-sm ${ chartTab === 'threshold' ? `border-${modalColor}-500 text-${modalColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}><span className="mr-2">⚙️</span>Threshold</button>
                   </nav>
                 </div>
                <div className="min-h-[400px]">
                  {chartTab === 'chart' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-semibold text-gray-800">Zaman Serisi Grafiği</h4>
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

                          // Y ekseni için ölçek seçimi: yüzde mi, mutlak mı?
                          const isPercentScale = vMax <= 100 && vMin >= 0;

                          const getNiceMax = (value) => {
                            const raw = Math.max(value, 1);
                            const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
                            const normalized = raw / magnitude;
                            let niceNormalized = 1;
                            if (normalized > 5) niceNormalized = 10;
                            else if (normalized > 2) niceNormalized = 5;
                            else if (normalized > 1) niceNormalized = 2;
                            return niceNormalized * magnitude;
                          };

                          const minVal = 0;
                          const maxVal = isPercentScale ? 100 : getNiceMax(vMax);
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
                          const formatTickWithPercent = (n) => {
                            const num = Number(n);
                            return num.toFixed(0) + '%';
                          };
                          
                          const areaD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ') + ` L ${xPos(len-1)},${bottom} L ${xPos(0)},${bottom} Z`;
                          const lineD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ');
                          
                          const criticalThreshold = 90;
                          const warningThreshold = 75;
                          const showThresholds = isPercentScale;
                          
                          return (
                            <>
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="text-lg font-semibold text-gray-800">{selectedChart}</h4>
                                  <button onClick={() => {
                                    openChart(selectedChart);
                                  }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Yenile</button>
                                </div>
                                <div className="h-96 w-full">
                                  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                                    {/* Grid pattern */}
                                    <defs>
                                      <pattern id="grid-network" width="40" height="35" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 35" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                                      </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid-network)" />
                                    
                                    {/* Y-axis labels */}
                                    {ticks.map((t, i) => (
                                      <g key={i}>
                                        <line x1={left} y1={yPos(t)} x2={width-20} y2={yPos(t)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                                        <text x="20" y={yPos(t) + 4} className="text-xs fill-gray-600 font-medium" textAnchor="end">
                                          {isPercentScale ? formatTickWithPercent(t) : formatTick(t)}
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
                                        <line x1={left} y1={yPos(criticalThreshold)} x2={width-20} y2={yPos(criticalThreshold)} stroke="#dc2626" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
                                        <text x={width-10} y={yPos(criticalThreshold) + 4} className="text-xs fill-red-600 font-medium" textAnchor="end">
                                          Kritik: {criticalThreshold}%
                                        </text>
                                        
                                        <line x1={left} y1={yPos(warningThreshold)} x2={width-20} y2={yPos(warningThreshold)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
                                        <text x={width-10} y={yPos(warningThreshold) + 4} className="text-xs fill-amber-600 font-medium" textAnchor="end">
                                          Uyarı: {warningThreshold}%
                                        </text>
                                      </>
                                    )}
                                    
                                    {/* Gradient area and line */}
                                    <defs>
                                      <linearGradient id="areaGradientNetwork" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                                      </linearGradient>
                                    </defs>
                                    
                                    <path d={areaD} fill="url(#areaGradientNetwork)" />
                                    <path d={lineD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    
                                    {/* Data points */}
                                    {chartData.map((p,i)=> (
                                      <g key={i}>
                                        <circle cx={xPos(i)} cy={yPos(p.value)} r="5" fill="#3b82f6" stroke="white" strokeWidth="2">
                                          <title>{`${new Date(p.label).toLocaleString('tr-TR')}: ${p.value}`}</title>
                                        </circle>
                                      </g>
                                    ))}
                                  </svg>
                                </div>
                              </div>

                              {/* Statistics */}
                              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 text-center shadow-sm">
                                  <div className="text-3xl font-bold text-blue-900">{chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}</div>
                                  <div className="text-sm text-blue-700 font-semibold mt-1">Maksimum</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 text-center shadow-sm">
                                  <div className="text-3xl font-bold text-green-900">{chartData.length > 0 ? Math.min(...chartData.map(d => d.value)).toFixed(1) : '0'}</div>
                                  <div className="text-sm text-green-700 font-semibold mt-1">Minimum</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 text-center shadow-sm">
                                  <div className="text-3xl font-bold text-purple-900">{chartData.length > 0 ? (chartData.reduce((s, d) => s + d.value, 0) / chartData.length).toFixed(1) : '0'}</div>
                                  <div className="text-sm text-purple-700 font-semibold mt-1">Ortalama</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 text-center shadow-sm">
                                  <div className="text-3xl font-bold text-orange-900">{chartData.length}</div>
                                  <div className="text-sm text-orange-700 font-semibold mt-1">Veri Noktası</div>
                                </div>
                              </div>
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                  {chartTab === 'threshold' && ( <div className="space-y-6"><h4 className="text-lg font-semibold text-gray-800">{selectedChart} için Threshold Ayarları</h4> {/* Basit Threshold içeriği */} <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gray-50 rounded-lg p-6"><h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Kritik Eşik</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="90"/></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Uyarı Eşiği</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="75"/></div></div></div><div className="bg-gray-50 rounded-lg p-6"><h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5><div className="space-y-3"><label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked /><span className="text-sm text-gray-600">E-posta</span></label><label className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm text-gray-600">SMS</span></label></div></div></div><div className="flex justify-end space-x-3 mt-6"><button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button><button className={`px-4 py-2 text-sm font-medium text-white bg-${modalColor}-600 border border-transparent rounded-md hover:bg-${modalColor}-700`}>Kaydet</button></div></div> )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Modalı (Basit Placeholder, TCPCONF için örnek) */}
        {infoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                     {infoModal === 'connectionCount' && 'Connection Count Hakkında'}
                     {infoModal === 'activeConnections' && 'Active Connections Hakkında'}
                     {infoModal === 'networkThroughput' && 'Network Throughput Hakkında'}
                     {infoModal === 'sessionCount' && 'Session Count Hakkında'}
                     {infoModal === 'activeSessions' && 'Active Sessions Hakkında'}
                     {infoModal === 'sessionUtilization' && 'Session Utilization Hakkında'}
                     {infoModal === 'jobName' && 'Job Name Hakkında'}
                     {infoModal === 'stepName' && 'Step Name Hakkında'}
                     {infoModal === 'targetField' && 'Target Field Hakkında'}
                     {infoModal === 'asid' && 'Stack ASID Hakkında'}
                     {infoModal === 'mvsLevel' && 'MVS Level Hakkında'}
                     {infoModal === 'version' && 'Stack Vers Hakkında'}
                     {infoModal === 'ipAddress' && 'Stack IPaddr Hakkında'}
                     {infoModal === 'status' && 'Stack Status Hakkında'}
                     {infoModal === 'startTime' && 'Start time of Stack Hakkında'}
                     {infoModal === 'statstks' && 'TCPIP Stack Name Hakkında'}
                     {infoModal === 'ippktrcd' && 'Interval Packets Received Hakkında'}
                     {infoModal === 'ippktrtr' && 'Packets Received per Second Hakkında'}
                     {infoModal === 'ipoutred' && 'Current Output Requests Hakkında'}
                     {infoModal === 'ipoutrtr' && 'Output Requests per Second Hakkında'}
                     {infoModal === 'csacur' && 'Current ECSA Usage Hakkında'}
                     {infoModal === 'systemField' && 'System Field Hakkında'}
                     {infoModal === 'csamax' && 'Maximum ECSA Usage Hakkında'}
                     {infoModal === 'csalim' && 'CSA Limit Hakkında'}
                     {infoModal === 'csausage' && 'ECSA Storage Usage Hakkında'}
                     {infoModal === 'c24cur' && 'Current CSA24 Usage Hakkında'}
                     {infoModal === 'c24max' && 'Maximum CSA24 Usage Hakkında'}
                     {infoModal === 'vtmcur' && 'Current Private Usage Hakkında'}
                     {infoModal === 'vtmmax' && 'Maximum Private Usage Hakkında'}
                     {infoModal === 'tcpConfig' && 'TCP Config Hakkında'}
                     {infoModal === 'tcpSettings' && 'TCP Settings Hakkında'}
                     {infoModal === 'tcpConnections' && 'TCP Connections Hakkında'}
                     {infoModal === 'connectionStates' && 'Connection States Hakkında'}
                     {infoModal === 'udpConfig' && 'UDP Config Hakkında'}
                     {infoModal === 'udpSettings' && 'UDP Settings Hakkında'}
                     {infoModal === 'vtmbuffSystem' && 'VTMBUFF System Hakkında'}
                     {infoModal === 'vtmbuffIobufSize' && 'IOBuf Size Hakkında'}
                     {infoModal === 'vtmbuffIobufTimes' && 'IOBuf Times Expanded Hakkında'}
                     {infoModal === 'vtmbuffLpbufSize' && 'LPBuf Size Hakkında'}
                     {infoModal === 'vtmbuffLpbufTimes' && 'LPBuf Times Expanded Hakkında'}
                     {infoModal === 'vtmbuffLfbufSize' && 'LFBuf Size Hakkında'}
                     {infoModal === 'vtmbuffLfbufTimes' && 'LFBuf Times Expanded Hakkında'}
                     {infoModal === 'tcpstorStep' && 'TCPSTOR Step Hakkında'}
                     {infoModal === 'tcpstorSystem' && 'TCPSTOR System Hakkında'}
                     {infoModal === 'tcpstorEcsaCurrent' && 'ECSA Current Hakkında'}
                     {infoModal === 'tcpstorEcsaMax' && 'ECSA Max Hakkında'}
                     {infoModal === 'tcpstorEcsaLimit' && 'ECSA Limit Hakkında'}
                     {infoModal === 'tcpstorEcsaFree' && 'ECSA Free Hakkında'}
                     {infoModal === 'tcpstorPrivateCurrent' && 'Private Current Hakkında'}
                     {infoModal === 'tcpstorPrivateMax' && 'Private Max Hakkında'}
                     {infoModal === 'connsrpzForeignIp' && 'CONNSRPZ Foreign IP Hakkında'}
                     {infoModal === 'connsrpzActiveConns' && 'Active Conns Hakkında'}
                     {infoModal === 'connsrpzRtt' && 'RTT (ms) Hakkında'}
                     {infoModal === 'connsrpzBytesIn' && 'Bytes In Hakkında'}
                     {infoModal === 'connsrpzBytesOut' && 'Bytes Out Hakkında'}
                     {infoModal === 'connsrpzStack' && 'Stack Hakkında'}
                     {infoModal === 'connsrpzRemoteHost' && 'Remote Host Hakkında'}
                     {!['connectionCount', 'activeConnections', 'networkThroughput', 'sessionCount', 'activeSessions', 'sessionUtilization', 'jobName', 'stepName', 'targetField', 'asid', 'mvsLevel', 'version', 'ipAddress', 'status', 'startTime', 'statstks', 'ippktrcd', 'ippktrtr', 'ipoutred', 'ipoutrtr', 'csacur', 'systemField', 'csamax', 'csalim', 'csausage', 'c24cur', 'c24max', 'vtmcur', 'vtmmax', 'tcpConfig', 'tcpSettings', 'tcpConnections', 'connectionStates', 'udpConfig', 'udpSettings', 'vtmbuffSystem', 'vtmbuffIobufSize', 'vtmbuffIobufTimes', 'vtmbuffLpbufSize', 'vtmbuffLpbufTimes', 'vtmbuffLfbufSize', 'vtmbuffLfbufTimes', 'tcpstorStep', 'tcpstorSystem', 'tcpstorEcsaCurrent', 'tcpstorEcsaMax', 'tcpstorEcsaLimit', 'tcpstorEcsaFree', 'tcpstorPrivateCurrent', 'tcpstorPrivateMax', 'connsrpzForeignIp', 'connsrpzActiveConns', 'connsrpzRtt', 'connsrpzBytesIn', 'connsrpzBytesOut', 'connsrpzStack', 'connsrpzRemoteHost'].includes(infoModal) && `${infoModal} Hakkında`}
                  </h3>
                  <button onClick={closeInfo} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="space-y-6">
                    {/* Job Name Info */}
                    {infoModal === 'jobName' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Job Name field displays the Multiple Virtual Storage (MVS) jobname of this TCP/IP instance.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step Name Info */}
                    {infoModal === 'stepName' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Step Name field displays the Multiple Virtual Storage (MVS) stepname of this TCP/IP instance.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Target Field Info */}
                    {infoModal === 'targetField' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Target field shows the name of the target for a row data that appears in a view displaying SSI context data.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stack ASID Info */}
                    {infoModal === 'asid' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Stack ASID field displays the Multiple Virtual Storage (MVS) address space ID of this TCP/IP instance.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* MVS Level Info */}
                    {infoModal === 'mvsLevel' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The operating system level on the LPAR where the TCP/IP stack is running.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stack Vers Info */}
                    {infoModal === 'version' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Stack Vers field displays the version and release of the TCP/IP stack. This value is extracted from the TSEB control block.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stack IPaddr Info */}
                    {infoModal === 'ipAddress' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The primary IP address for this stack.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stack Status Info */}
                    {infoModal === 'status' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Stack Status field displays the status of the IP stack. Valid statuses are as follows:
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Durum Türleri</h4>
                          <ul className="text-green-800 text-sm space-y-1">
                            <li>• <strong>Active:</strong> Stack aktif ve çalışıyor</li>
                            <li>• <strong>Inactive:</strong> Stack pasif veya durdurulmuş</li>
                            <li>• <strong>Quiescing:</strong> Stack kapatılmaya hazırlanıyor</li>
                            <li>• <strong>Terminating:</strong> Stack sonlandırılıyor</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Start time of Stack Info */}
                    {infoModal === 'startTime' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-blue-800 text-sm">
                            The Start time of Stack field displays the date and the time that this TCP/IP instance was started.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TCPIP Stack Name Info */}
                    {infoModal === 'statstks' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-green-800 text-sm">
                            The TCPIP stack name.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Interval Packets Received Info */}
                    {infoModal === 'ippktrcd' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-green-800 text-sm">
                            This field represents the number of v4 Packets Received on this stack since the start of the current interval.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Packets Received per Second Info */}
                    {infoModal === 'ippktrtr' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-green-800 text-sm">
                            This field represents the rate of v4 Packets Received on this stack since the start of the current interval. It is presented as Packets Received per second, and is the number of packets received in this interval divided by the number of seconds since the start of the current interval.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current Output Requests Info */}
                    {infoModal === 'ipoutred' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-green-800 text-sm">
                            This field represents the number of v4 Outputs Requested on this stack since the start of the current interval.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Output Requests per Second Info */}
                    {infoModal === 'ipoutrtr' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-green-800 text-sm">
                            This field represents the rate of v4 Output Request on this stack since the start of the current interval. It is presented as Output Requests per second, and is the number of Output Requests in this interval divided by the number of seconds since the start of the current interval.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current ECSA Usage Info */}
                    {infoModal === 'csacur' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The Current ECSA Usage field displays the VTAM common storage area (CSA) allocation for buffers.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* System Field Info */}
                    {infoModal === 'systemField' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The System field shows the name of the MVS system Afor a resource that appears in a view displaying SSI context data.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Maximum ECSA Usage Info */}
                    {infoModal === 'csamax' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The Maximum ECSA Usage field displays the largest common storage area (CSA) allocation level for buffers since the last DISPLAY BFRUSE command.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CSA Limit Info */}
                    {infoModal === 'csalim' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The CSA Limit field displays the maximum amount of common storage area (CSA) that VTAM can use for buffers. Limits are enforced on the requested amount of storage, but CSA can be NO LIMIT (which means that VTAM can request as much CSA as is available). The CSA Limit field is set to the CSA LIMIT for 31-bit and 24-bit addressable common storage.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ECSA Storage Usage Info */}
                    {infoModal === 'csausage' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The current percentage of ECSA Storage being used. This is the Current ECSA Storage divided by the Maximum ECSA Storage. storage area (CSA) allocation level for buffers since the last DISPLAY BFRUSE command.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current CSA24 Usage Info */}
                    {infoModal === 'c24cur' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The Current CSA24 Usage field displays the amount of 24-bit addressable common storage (CSA24) that is allocated for VTAM buffers.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Maximum CSA24 Usage Info */}
                    {infoModal === 'c24max' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The Maximum CSA24 Usage field displays the largest amount of 24-bit addressable common storage (CSA24) that has been allocated for buffers since the last DISPLAY BFRUSE command.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current Private Usage Info */}
                    {infoModal === 'vtmcur' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The Current Private Usage field displays the amount of VTAM private storage that is in use. This display does not include the amount of private storage that is required to load the VTAM modules.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Maximum Private Usage Info */}
                    {infoModal === 'vtmmax' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-purple-800 text-sm">
                            The Maximum Private Usage field displays the largest amount of VTAM primate storage that was in use since VTAM was started.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* VTMBUFF Info Modals */}
                    {infoModal === 'vtmbuffSystem' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            VTAM buffer yönetim sisteminin adını gösterir. Buffer allocation ve memory management işlemlerini takip eder.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'vtmbuffIobufSize' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            IOBuf (Input/Output Buffer) boyutunu gösterir. VTAM'ın veri alış-veriş işlemleri için kullandığı buffer alanının büyüklüğünü ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'vtmbuffIobufTimes' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            IOBuf buffer'ın kaç kez genişletildiğini gösterir. Yüksek değerler bellek baskısını işaret eder.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'vtmbuffLpbufSize' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            LPBuf (Line Protocol Buffer) boyutunu gösterir. Line protokol işlemleri için kullanılan buffer boyutunu ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'vtmbuffLpbufTimes' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            LPBuf buffer'ın kaç kez genişletildiğini gösterir. Line protokol buffer büyüklüğünün yetersizliğini işaret eder.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'vtmbuffLfbufSize' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            LFBuf (Logon Frame Buffer) boyutunu gösterir. Logon ve authentication işlemleri için buffer boyutunu ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'vtmbuffLfbufTimes' && (
                      <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-teal-800 text-sm">
                            LFBuf buffer'ın kaç kez genişletildiğini gösterir. Logon buffer yetersizliklerini işaret eder.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CONNSRPZ Info Modals */}
                    {infoModal === 'connsrpzForeignIp' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Karşı tarafın (remote host) IP adresini gösterir. Bağlantının hedef IP bilgisini verir.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'connsrpzActiveConns' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Aktif TCP/IP bağlantılarının sayısını gösterir. Aynı anda açık olan bağlantıları ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'connsrpzRtt' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Round Trip Time (RTT) değerini milisaniye olarak gösterir. Ağ gecikme süresini ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'connsrpzBytesIn' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Gelen veri miktarını byte cinsinden gösterir. Bağlantı üzerinden alınan toplam veriyi ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'connsrpzBytesOut' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Giden veri miktarını byte cinsinden gösterir. Bağlantı üzerinden gönderilen toplam veriyi ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'connsrpzStack' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Bağlantının ait olduğu TCP/IP stack adını gösterir. Hangi stack üzerinden bağlantı kurulduğunu belirtir.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'connsrpzRemoteHost' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-amber-800 text-sm">
                            Uzak host'un adını gösterir. Bağlantının hedef host bilgisini verir.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TCPSTOR Info Modals */}
                    {infoModal === 'tcpstorStep' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            TCP/IP storage yönetiminin step adını gösterir. Memory management için step bilgisini verir.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorSystem' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            TCP/IP storage yönetiminin sistem bilgisini gösterir. Hangi sistem üzerinde storage yönetimi yapıldığını belirtir.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorEcsaCurrent' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            ECSA (Extended Common Storage Area) mevcut kullanımını gösterir. TCP/IP için ayrılmış mevcut bellek miktarını ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorEcsaMax' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            ECSA maksimum kullanımını gösterir. TCP/IP için ayrılmış bellek limitini ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorEcsaLimit' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            ECSA limit değerini gösterir. TCP/IP için maksimum ayrılabilir bellek limitini ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorEcsaFree' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            ECSA boş bellek miktarını gösterir. TCP/IP için kullanılabilir serbest bellek alanını ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorPrivateCurrent' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            Private memory mevcut kullanımını gösterir. TCP/IP için özel bellek alanının mevcut kullanımını ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {infoModal === 'tcpstorPrivateMax' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Ne Ölçer?</h4>
                          <p className="text-orange-800 text-sm">
                            Private memory maksimum kullanımını gösterir. TCP/IP için özel bellek alanının maksimum limitini ölçer.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Diğer info modal tipleri için placeholder */}
                    {!['jobName', 'stepName', 'targetField', 'asid', 'mvsLevel', 'version', 'ipAddress', 'status', 'startTime', 'statstks', 'ippktrcd', 'ippktrtr', 'ipoutred', 'ipoutrtr', 'csacur', 'systemField', 'csamax', 'csalim', 'csausage', 'c24cur', 'c24max', 'vtmcur', 'vtmmax', 'vtmbuffSystem', 'vtmbuffIobufSize', 'vtmbuffIobufTimes', 'vtmbuffLpbufSize', 'vtmbuffLpbufTimes', 'vtmbuffLfbufSize', 'vtmbuffLfbufTimes', 'tcpstorStep', 'tcpstorSystem', 'tcpstorEcsaCurrent', 'tcpstorEcsaMax', 'tcpstorEcsaLimit', 'tcpstorEcsaFree', 'tcpstorPrivateCurrent', 'tcpstorPrivateMax', 'connsrpzForeignIp', 'connsrpzActiveConns', 'connsrpzRtt', 'connsrpzBytesIn', 'connsrpzBytesOut', 'connsrpzStack', 'connsrpzRemoteHost'].includes(infoModal) && (
                    <div className={`bg-${modalColor}-50 rounded-lg p-4`}>
                      <h4 className={`font-semibold text-${modalColor}-900 mb-2`}>Açıklama</h4>
                      <p className={`text-${modalColor}-800 text-sm`}>
                         {infoModal} metriği ile ilgili detaylı açıklama buraya eklenecektir.
                      </p>
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
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'STACKS' ? 'Zaman Filtresi' : 'Zaman ve Tarih Filtresi'}
                  </h3>
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
                    {activeModal === 'STACKS' ? (
                      <button
                        onClick={applyStacksTimeFilter}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        Zaman Filtresini Uygula
                      </button>
                    ) : (
                      <button
                        onClick={applyTimeFilter}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        Zaman Aralığını Uygula
                      </button>
                    )}
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

export default NetworkPage;