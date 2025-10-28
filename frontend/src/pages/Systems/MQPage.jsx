import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { databaseAPI } from '../../services/api';

const MQPage = () => {
  const [activeModal, setActiveModal] = useState(null); // 'mq_connz' | 'mq_qm' | 'mq_w2over'
  const [activeTab, setActiveTab] = useState('table');
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  const [mqConnzData, setMqConnzData] = useState([]);
  const [mqQmData, setMqQmData] = useState([]);
  const [mqW2overData, setMqW2overData] = useState([]);

  const [filteredMqConnzData, setFilteredMqConnzData] = useState([]);
  const [filteredMqQmData, setFilteredMqQmData] = useState([]);
  const [filteredMqW2overData, setFilteredMqW2overData] = useState([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [isConnzActive, setIsConnzActive] = useState(null); // true/false/null
  const [isQmActive, setIsQmActive] = useState(null);
  const [isW2overActive, setIsW2overActive] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [chartData, setChartData] = useState([]);
  const [infoModal, setInfoModal] = useState(null);

  // MQ CONNZ özel kolon başlık eşlemesi
  const getConnzDisplayLabel = (rawKey) => {
    const key = String(rawKey || '').trim();
    if (!key) return '';
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1) Application Name Type Of Information
    if (n === 'applname' || n === 'applicationname' || n === 'appname' || n === 'applicationnametype' || n === 'applicationnametypeofinformation' || n === 'appnametype') {
      return 'Application Name Type Of Information';
    }

    // 2) Address Space Identifier
    if (n === 'asid' || n === 'addressspaceidentifier') {
      return 'Address Space Identifier';
    }

    // 3) Application Type(Maximum)
    if (n === 'appltypemax' || n === 'applicationtypemax' || n === 'applicationtype' || n === 'appltype') {
      return 'Application Type(Maximum)';
    }

    // 4) CICS Transaction Id
    if (n === 'cicstranid' || n === 'cicstransid' || n === 'cicstransactionid') {
      return 'CICS Transaction Id';
    }

    // 5) CICS Task number
    if (n === 'cicstasknumber' || n === 'cicstaskno' || n === 'cicstask') {
      return 'CICS Task number';
    }

    // 6) IMS PSB Name
    if (n === 'imspsbname' || n === 'psbname' || n === 'psb') {
      return 'IMS PSB Name';
    }

    // 7) Object Name(Maximum)
    if (n === 'objectnamemaximum' || n === 'objectnamemax' || n === 'objnamemax' || n === 'objname' || n === 'objectname') {
      return 'Object Name(Maximum)';
    }

    // 8) Queue Manager
    if (n === 'queuemanager' || n === 'qmgr' || n === 'qm' || n === 'queuemgr') {
      return 'Queue Manager';
    }

    // Varsayılan: orijinal key'i göster
    return key;
  };

  const getDisplayLabelForActive = (rawKey) => {
    return activeModal === 'mq_connz' ? getConnzDisplayLabel(rawKey) : rawKey;
  };

  const tabs = [
    { id: 'table', name: 'Tablo', icon: '📊' },
    { id: 'chart', name: 'Grafik', icon: '📈' },
    { id: 'threshold', name: 'Threshold', icon: '⚙️' },
  ];

  const openModal = (type) => {
    setActiveModal(type);
    setActiveTab('table');
    if (type === 'mq_connz') fetchMqConnz();
    if (type === 'mq_qm') fetchMqQm();
    if (type === 'mq_w2over') fetchMqW2over();
  };

  const closeModal = () => setActiveModal(null);

  const openInfo = (chartType) => {
    setInfoModal(chartType);
  };

  const closeInfo = () => {
    setInfoModal(null);
  };

  // Tablo kontrolleri
  const checkMQConnz = async () => {
    try {
      const res = await databaseAPI.checkTableExistsMQConnz();
      if (res.data?.success && res.data.tableInfo?.exists) return true;
      toast.error('mainview_mq_connz tablosu bulunamadı!');
      return false;
    } catch (e) { toast.error('MQ_CONNZ tablo kontrolü başarısız'); return false; }
  };
  const checkMQQm = async () => {
    try {
      const res = await databaseAPI.checkTableExistsMQQm();
      if (res.data?.success && res.data.tableInfo?.exists) return true;
      toast.error('mainview_mq_qm tablosu bulunamadı!');
      return false;
    } catch (e) { toast.error('MQ_QM tablo kontrolü başarısız'); return false; }
  };
  const checkMQW2over = async () => {
    try {
      const res = await databaseAPI.checkTableExistsMQW2over();
      if (res.data?.success && res.data.tableInfo?.exists) return true;
      toast.error('mainview_mq_w2over tablosu bulunamadı!');
      return false;
    } catch (e) { toast.error('MQ_W2OVER tablo kontrolü başarısız'); return false; }
  };

  // Veri çekme
  const fetchMqConnz = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQConnz(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQConnz();
      if (res.data?.success) {
        const dataWithIndex = (res.data.data || []).map((item, index) => ({
          ...item,
          index: index + 1
        }));
        setMqConnzData(dataWithIndex);
      } else toast.error('MQ_CONNZ veri hatası');
      setIsConnzActive(true);
    } catch (e) { toast.error('MQ_CONNZ veri çekme hatası'); }
    finally { setDataLoading(false); }
  };
  const fetchMqQm = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQQm(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQQm();
      if (res.data?.success) {
        const dataWithIndex = (res.data.data || []).map((item, index) => ({
          ...item,
          index: index + 1
        }));
        setMqQmData(dataWithIndex);
      } else toast.error('MQ_QM veri hatası');
      setIsQmActive(true);
    } catch (e) { toast.error('MQ_QM veri çekme hatası'); }
    finally { setDataLoading(false); }
  };
  const fetchMqW2over = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQW2over(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQW2over();
      if (res.data?.success) {
        const dataWithIndex = (res.data.data || []).map((item, index) => ({
          ...item,
          index: index + 1
        }));
        setMqW2overData(dataWithIndex);
      } else toast.error('MQ_W2OVER veri hatası');
      setIsW2overActive(true);
    } catch (e) { toast.error('MQ_W2OVER veri çekme hatası'); }
    finally { setDataLoading(false); }
  };

  // Zaman filtresi
  const openTimeFilter = () => setTimeFilterModal(true);
  const closeTimeFilter = () => setTimeFilterModal(false);
  const clearTimeFilter = () => { 
    setFilteredMqConnzData([]); 
    setFilteredMqQmData([]); 
    setFilteredMqW2overData([]); 
    setIsFiltered(false); 
    setSelectedTimeRange('last6h'); 
    setCustomFromDate(''); 
    setCustomToDate(''); 
    toast.success('Zaman filtresi temizlendi'); 
  };
  
  const applyTimeFilter = () => {
    try {
      const applyFilter = (data) => {
        if (!data || data.length === 0) return [];
        
        let fromDate;
        const toDate = selectedTimeRange === 'custom' ? new Date(customToDate) : new Date();
        
        if (selectedTimeRange === 'custom') {
          if (!customFromDate || !customToDate) {
            toast.error('Lütfen başlangıç ve bitiş tarihlerini seçin');
            return [];
          }
          fromDate = new Date(customFromDate);
        } else {
          switch (selectedTimeRange) {
            case 'last5m':
              fromDate = new Date(toDate.getTime() - 5 * 60 * 1000);
              break;
            case 'last15m':
              fromDate = new Date(toDate.getTime() - 15 * 60 * 1000);
              break;
            case 'last30m':
              fromDate = new Date(toDate.getTime() - 30 * 60 * 1000);
              break;
            case 'last1h':
              fromDate = new Date(toDate.getTime() - 1 * 60 * 60 * 1000);
              break;
            case 'last3h':
              fromDate = new Date(toDate.getTime() - 3 * 60 * 60 * 1000);
              break;
            case 'last6h':
              fromDate = new Date(toDate.getTime() - 6 * 60 * 60 * 1000);
              break;
            case 'last12h':
              fromDate = new Date(toDate.getTime() - 12 * 60 * 60 * 1000);
              break;
            case 'last24h':
              fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
              break;
            case 'last2d':
              fromDate = new Date(toDate.getTime() - 2 * 24 * 60 * 60 * 1000);
              break;
            default:
              fromDate = new Date(toDate.getTime() - 6 * 60 * 60 * 1000);
          }
        }
        
        const filtered = data.filter(item => {
          const itemTime = new Date(item.record_timestamp || item.bmctime || item.created_at || item.updated_at);
          return !isNaN(itemTime) && itemTime >= fromDate && itemTime <= toDate;
        });
        
        // Index'leri yeniden ekle
        return filtered.map((item, index) => ({
          ...item,
          index: index + 1
        }));
      };
      
      setFilteredMqConnzData(applyFilter(mqConnzData));
      setFilteredMqQmData(applyFilter(mqQmData));
      setFilteredMqW2overData(applyFilter(mqW2overData));
      
      setIsFiltered(true);
      toast.success('Zaman filtresi uygulandı');
      closeTimeFilter();
    } catch (e) { 
      console.error('Zaman filtresi hatası:', e);
      toast.error('Zaman filtresi sırasında hata'); 
    }
  };

  // Export yardımcıları - Excel (CSV)
  const exportToExcel = (rows, filename) => {
    if (!rows || rows.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }
    
    try {
      let rawHeaders = Object.keys(rows[0] || {});
      
      // Index kolonunu çıkar
      rawHeaders = rawHeaders.filter(h => h !== 'index');
      
      // Header'ları temizle ve formatla
      const cleanHeader = (header) => {
        return header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };
      
      const headers = rawHeaders.map((h) => {
        const isConnz = String(filename || '').toUpperCase().includes('MQ_CONNZ');
        return isConnz ? getConnzDisplayLabel(h) : cleanHeader(h);
      });
      
      // CSV satırlarını oluştur - güvenli formatlama
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Virgül, tırnak veya newline içeriyorsa tırnak içine al
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };
      
      const formatValue = (value) => {
        if (value === null || value === undefined) return '';
        
        // Date objesi ise
        if (value instanceof Date) {
          return value.toLocaleString('tr-TR');
        }
        
        // String olarak tarih formatını kontrol et
        if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
          try {
            return new Date(value).toLocaleString('tr-TR');
          } catch {
            return value;
          }
        }
        
        // Number formatlama (binlik ayracı)
        if (typeof value === 'number') {
          return value.toLocaleString('tr-TR');
        }
        
        return String(value);
      };
      
      const csvRows = rows.map(row => 
        rawHeaders.map(header => {
          const value = row[header];
          return escapeCSV(formatValue(value));
        }).join(',')
      );
      
      const csv = [headers.join(','), ...csvRows].join('\r\n');
      
      // UTF-8 BOM ile blob oluştur (Türkçe karakterler için)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      
      // Dosyayı indir
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/[^a-zA-Z0-9_]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Excel dosyası başarıyla indirildi');
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel oluşturulurken hata oluştu');
    }
  };
  
  // Export yardımcıları - PDF
  const exportToPDF = (rows, filename) => {
    if (!rows || rows.length === 0) {
      toast.error('Aktarılacak veri bulunamadı');
      return;
    }
    
    try {
      // jsPDF ve autoTable eklentisini dinamik olarak yükle
      const loadScripts = () => {
        return new Promise((resolve, reject) => {
          // Script zaten yüklenmişse direkt resolve et
          if (window.jspdf && window.jspdf.autoTable) {
            resolve();
            return;
          }
          
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
          if (!window.jspdf) {
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jsPDFScript.onload = onScriptLoad;
            jsPDFScript.onerror = onScriptError;
            document.head.appendChild(jsPDFScript);
          } else {
            onScriptLoad();
          }
          
          // autoTable eklentisini yükle
          if (!window.jspdf?.autoTable) {
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = onScriptLoad;
            autoTableScript.onerror = onScriptError;
            document.head.appendChild(autoTableScript);
          } else {
            onScriptLoad();
          }
        });
      };
      
      loadScripts().then(() => {
        const { jsPDF } = window.jspdf;
        // Geniş tablolar için yatay sayfa
        const doc = new jsPDF('l', 'pt', 'a4');

        // Yardımcılar
        const cleanHeader = (header) => header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const isConnz = String(filename || '').toUpperCase().includes('MQ_CONNZ');
        const formatDataValue = (value) => {
          if (value === null || value === undefined) return '-';
          if (value instanceof Date) return value.toLocaleString('tr-TR');
          if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
            try { return new Date(value).toLocaleString('tr-TR'); } catch { return value; }
          }
          if (typeof value === 'number') return value.toLocaleString('tr-TR');
          let stringValue = String(value);
          if (stringValue.length > 60) stringValue = stringValue.substring(0, 57) + '...';
          return stringValue;
        };

        let rawHeaders = Object.keys(rows[0] || {}).filter(h => h !== 'index');
        const colCount = rawHeaders.length;
        const currentDate = new Date().toLocaleString('tr-TR');

        // Dinamik boyutlar (tüm sütunları tek tabloda sığdırmak için)
        const fontSize = colCount > 24 ? 5 : colCount > 18 ? 6 : 7;
        const headPad = 3;
        const bodyPad = 2;
        const minCellWidth = colCount > 24 ? 18 : colCount > 18 ? 22 : 28;

        // Başlık
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`${filename} Raporu`, 40, 40);
        
        // Tarih
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Oluşturulma Tarihi: ${currentDate}`, 40, 58);

        const headers = rawHeaders.map(h => isConnz ? getConnzDisplayLabel(h) : cleanHeader(h));
        const tableData = rows.map(row => rawHeaders.map(h => formatDataValue(row[h])));

        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 70,
          styles: {
            fontSize,
            cellPadding: bodyPad,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [220, 220, 220]
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            cellPadding: headPad,
            overflow: 'linebreak',
            minCellWidth
          },
          bodyStyles: {
            overflow: 'linebreak',
            cellPadding: bodyPad
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          columnStyles: {
            ...(rawHeaders.reduce((acc, header, index) => {
              const h = header.toLowerCase();
              if (h.includes('timestamp') || h.includes('created_at') || h.includes('updated_at') || h.includes('time') || h.includes('date')) {
                acc[index] = { fontSize: Math.max(4, fontSize - 1) };
              } else if (h.includes('id')) {
                acc[index] = { cellWidth: 'auto' };
              }
              return acc;
            }, {}))
          },
          margin: { top: 40, left: 10, right: 10 },
          tableWidth: 'wrap'
        });

        const cleanFileName = filename.replace(/[^a-zA-Z0-9_]/g, '_');
        const fileName = `${cleanFileName}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        toast.success('PDF başarıyla indirildi');
      }).catch((error) => {
        console.error('PDF script yükleme hatası:', error);
        toast.error('PDF oluşturma hatası. Lütfen sayfayı yenileyin ve tekrar deneyin.');
      });
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  const modalColor = 'cyan';

  // Sayfa açılışında rozet durumlarını kontrol et
  useEffect(() => {
    const refreshStatuses = async () => {
      try {
        const [c1, c2, c3] = await Promise.all([
          databaseAPI.checkTableExistsMQConnz(),
          databaseAPI.checkTableExistsMQQm(),
          databaseAPI.checkTableExistsMQW2over(),
        ]);
        const ok1 = c1?.data?.tableInfo?.exists && (c1.data.tableInfo.rowCount ?? 1) >= 0;
        const ok2 = c2?.data?.tableInfo?.exists && (c2.data.tableInfo.rowCount ?? 1) >= 0;
        const ok3 = c3?.data?.tableInfo?.exists && (c3.data.tableInfo.rowCount ?? 1) >= 0;
        setIsConnzActive(!!ok1);
        setIsQmActive(!!ok2);
        setIsW2overActive(!!ok3);
      } catch (err) {
        // En azından bilinmiyor durumuna getir
        if (isConnzActive === null) setIsConnzActive(false);
        if (isQmActive === null) setIsQmActive(false);
        if (isW2overActive === null) setIsW2overActive(false);
      }
    };
    refreshStatuses();
  }, []);

  const StatusPill = ({ active }) => {
    const isTrue = active === true;
    const isFalse = active === false;
    const bg = isTrue ? 'bg-green-100' : isFalse ? 'bg-red-100' : 'bg-gray-100';
    const dot = isTrue ? 'bg-green-500' : isFalse ? 'bg-red-500' : 'bg-gray-400';
    const text = isTrue ? 'text-green-800' : isFalse ? 'text-red-800' : 'text-gray-800';
    const label = isTrue ? 'Aktif' : isFalse ? 'Pasif' : 'Kontrol';
    return (
      <div className="mt-4 flex items-center justify-center">
        <div className={`flex items-center space-x-2 ${bg} rounded-full px-3 py-1`}>
          <div className={`w-2 h-2 ${dot} rounded-full`}></div>
          <span className={`text-xs font-medium ${text}`}>{label}</span>
        </div>
      </div>
    );
  };

  // Grafik detay açıcı
  const openChart = (key) => {
    setSelectedChart(key);
    setChartTab('chart');
    const rows = isFiltered
      ? (activeModal==='mq_connz' ? filteredMqConnzData : activeModal==='mq_qm' ? filteredMqQmData : filteredMqW2overData)
      : (activeModal==='mq_connz' ? mqConnzData : activeModal==='mq_qm' ? mqQmData : mqW2overData);
    const points = rows.map((r) => ({
      label: r.record_timestamp || r.bmctime || r.updated_at || r.created_at,
      value: Number(r[key]) || 0,
    })).filter(p => !isNaN(p.value));
    setChartData(points);
  };

  // Grafik kartı için ikon seçici (kolon adına göre) - Daha detaylı ikon eşleştirmeleri
  const renderIconForKey = (key, iconClasses) => {
    const k = String(key || '').toLowerCase();
    
    // 0. Özel MQ alan adları için öncelikli eşleştirmeler - Daha spesifik kontrol
    if ((k.includes('msg') || k.includes('mes')) && k.length <= 10) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    }
    
    if (k.includes('comlv') || k.includes('comlvx') || k.includes('compare')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    }
    
    if (k.includes('getr') || (k.includes('get') && k.length > 3 && k.length < 10)) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    }
    
    if (k.includes('put') || (k.includes('send') && k.length < 10)) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      );
    }
    
    // 0.5. Özel channel ve retry pattern'leri
    if (k.includes('retry') || k.includes('retrying')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    // 0.6. Depth (Derinlik) pattern'i
    if (k.includes('depth') || k.includes('yüksek') || k.includes('high')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5m14-7H5" />
        </svg>
      );
    }
    
    // 0.7. Local/Transmit queue pattern'i
    if (k.includes('local_queues') || k.includes('transmit_queues')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    
    // 0.8. Channel pattern'i
    if (k.includes('channel') && !k.includes('message')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      );
    }
    
    // 0.9. Free pages pattern'i
    if (k.includes('free_pages') || k.includes('page_set') || k.includes('page')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      );
    }
    
    // 0.10. Events count pattern'i
    if (k.includes('events_count') || (k.includes('events') && k.includes('count'))) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
        </svg>
      );
    }
    
    // Özel q ile başlayan alanlar için queue manager şeması
    if (k.startsWith('qm') && k.length <= 10) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    }
    
    // q ile başlayan diğer alanlar için kuyruk ikonu
    if (k.startsWith('q') && k.length <= 10 && !k.includes('msg') && !k.includes('mes')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    // 1. Bağlantı ve iletişim
    if (k.includes('conn') || k.includes('link') || k.includes('connection')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    }
    
    // 2. Queue (Kuyruk) - Sadece queue kelimesini içerenler için
    if (k.includes('queue') && !k.startsWith('q')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h11M5 12h14M2 17h14" />
        </svg>
      );
    }
    
    // 3. Channel (Kanal)
    if (k.includes('channel') || k.includes('kanal')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      );
    }
    
    // 4. Message (Mesaj)
    if (k.includes('message') || k.includes('msg')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    }
    
    // 5. Application (Uygulama)
    if (k.includes('app') || k.includes('applic')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // 6. Manager (Yönetici)
    if (k.includes('manager') || k.includes('qmgr')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    }
    
    // 7. Depth (Derinlik)
    if (k.includes('depth') || k.includes('derinlik')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5m14-7H5" />
        </svg>
      );
    }
    
    // 8. Count (Sayaç)
    if (k.includes('count') || k.includes('sayac')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M13 4v16M4 8h16M4 14h16" />
        </svg>
      );
    }
    
    // 9. Status (Durum)
    if (k.includes('status') || k.includes('state') || k.includes('durum')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    // 10. Rate (Hız/Oran)
    if (k.includes('rate') || k.includes('speed') || k.includes('throughput')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    
    // 11. Workload (İş Yükü)
    if (k.includes('workload') || k.includes('load')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    
    // 12. Overflow (Taşma)
    if (k.includes('overflow') || k.includes('taşma')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
        </svg>
      );
    }
    
    // 13. Exception (Hata)
    if (k.includes('exception') || k.includes('error') || k.includes('fail')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      );
    }
    
    // 14. Free/Used/Buffer (Serbest/Kullanılan/Bellek)
    if (k.includes('free') || k.includes('used') || k.includes('buffer') || k.includes('memory')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      );
    }
    
    // 15. Time/Duration (Zaman/Süre)
    if (k.includes('time') || k.includes('duration') || k.includes('second') || k.includes('timestamp')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    // 16. Percentage/Utilization (Yüzde/Kullanım)
    if (k.includes('percent') || k.includes('util') || k.includes('ratio') || k.includes('usage')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    
    // 17. Size/Capacity (Boyut/Kapasite)
    if (k.includes('size') || k.includes('capacity') || k.includes('limit') || k.includes('max') || k.includes('min')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      );
    }
    
    // 18. Retry/Transmit (Yeniden Deneme/Gönderme)
    if (k.includes('retry') || k.includes('transmit') || k.includes('send')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0111-6M19 9a7 7 0 01-11 6" />
        </svg>
      );
    }
    
    // 19. Dead Letter (Ölü Mektup)
    if (k.includes('dead_letter') || k.includes('letter')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      );
    }
    
    // 20. Total/Num/Events (Toplam/Sayı/Olaylar)
    if (k.includes('total') || k.includes('num') || k.includes('events') || k.includes('sum')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M13 4v16M4 8h16M4 14h16" />
        </svg>
      );
    }
    
    // 21. Reply/Response (Cevap/Yanıt)
    if (k.includes('reply') || k.includes('response')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      );
    }
    
    // 22. Page (Sayfa)
    if (k.includes('page')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h8l4 4v12H7a2 2 0 01-2-2V6a2 2 0 012-2zM15 4v4h4" />
        </svg>
      );
    }
    
    // 23. Event/Listener (Olay/Dinleyici)
    if (k.includes('event') || k.includes('listener')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
        </svg>
      );
    }
    
    // 24. ID/Identifier (Kimlik)
    if (k.includes('id') && !k.includes('middle') && !k.includes('middleware')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      );
    }
    
    // 25. Varsayılan - Bar/Bars (Grafik/Bars)
    return (
      <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">MQ Message Queue</h1>

        {/* Kartlar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div onClick={() => openModal('mq_connz')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-cyan-100 rounded-xl mb-6 mx-auto group-hover:bg-cyan-200"><svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h4" /></svg></div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">MQ CONNZ</h2>
                <p className="text-gray-500 text-sm font-medium">Bağlantı Bilgileri</p>
                <StatusPill active={isConnzActive} />
              </div>
            </div>
          </div>
          <div onClick={() => openModal('mq_qm')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-6 mx-auto group-hover:bg-indigo-200"><svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 11h14M7 15h10" /></svg></div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">MQ QM</h2>
                <p className="text-gray-500 text-sm font-medium">Queue Manager</p>
                <StatusPill active={isQmActive} />
              </div>
            </div>
          </div>
          <div onClick={() => openModal('mq_w2over')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-rose-100 rounded-xl mb-6 mx-auto group-hover:bg-rose-200"><svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">MQ W2OVER</h2>
                <p className="text-gray-500 text-sm font-medium">Workload/Overflow</p>
                <StatusPill active={isW2overActive} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {activeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'mq_connz' && 'MQ CONNZ Yönetimi'}
                    {activeModal === 'mq_qm' && 'MQ QM Yönetimi'}
                    {activeModal === 'mq_w2over' && 'MQ W2OVER Yönetimi'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                {/* Sekmeler */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {tabs.map(t => (
                      <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab===t.id ? `border-${modalColor}-500 text-${modalColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <span className="mr-2">{t.icon}</span>{t.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Toolbar - Sadece Tablo sekmesinde göster */}
                {activeTab === 'table' && (
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Veri Tablosu</h4>
                    <div className="flex space-x-3">
                      <button onClick={() => exportToExcel(isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData), activeModal.toUpperCase())} className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md">Excel'e Aktar</button>
                      <button onClick={() => exportToPDF(isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData), activeModal.toUpperCase())} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md">PDF'e Aktar</button>
                      <button onClick={openTimeFilter} className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 ${isFiltered ? 'text-blue-700 bg-blue-100 border-blue-300 hover:bg-blue-200' : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>Zaman Filtresi</button>
                      <button onClick={() => (activeModal==='mq_connz'?fetchMqConnz():activeModal==='mq_qm'?fetchMqQm():fetchMqW2over())} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md">Yenile</button>
                    </div>
                  </div>
                )}

                {/* İçerik */}
                {activeTab === 'table' && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {dataLoading ? (
                      <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div><p className="mt-4 text-gray-600">Veriler yükleniyor...</p></div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {(() => {
                                const keys = Object.keys(((isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData))[0] || {}));
                                // Index'i en başa taşı
                                const sortedKeys = ['index', ...keys.filter(k => k !== 'index')];
                                return sortedKeys.map(k => (
                                  <th key={k} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {k === 'index' ? '#' : getDisplayLabelForActive(k)}
                                  </th>
                                ));
                              })()}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData)).map((row, idx) => (
                              <tr key={idx} className={idx%2===0?'bg-white':'bg-gray-50'}>
                                {(() => {
                                  const keys = Object.keys(row);
                                  const sortedKeys = ['index', ...keys.filter(k => k !== 'index')];
                                  return sortedKeys.map((k, i) => (
                                    <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {row[k] ?? '-'}
                                    </td>
                                  ));
                                })()}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chart' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Performans Grafikleri</h4>
                    {(() => {
                      const rows = isFiltered
                        ? (activeModal==='mq_connz' ? filteredMqConnzData : activeModal==='mq_qm' ? filteredMqQmData : filteredMqW2overData)
                        : (activeModal==='mq_connz' ? mqConnzData : activeModal==='mq_qm' ? mqQmData : mqW2overData);
                      const first = rows?.[0] || {};
                      
                      if (!rows || rows.length === 0) {
                        return (
                          <div className="p-8 text-center bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="text-gray-600">Önce Tablo sekmesinden veri yükleyin</div>
                          </div>
                        );
                      }

                      // MQ CONNZ Grafik Kartları - Dinamik olarak veri tablosundaki alanları göster
                      if (activeModal === 'mq_connz') {
                        // Get all keys from the data
                        const dataKeys = Object.keys(first);
                        const numericKeys = dataKeys.filter(k => {
                          const v = first[k];
                          if (v === null || v === undefined) return false;
                          // Exclude non-numeric fields
                          if (k.toLowerCase().includes('name') || 
                              k.toLowerCase().includes('system') || 
                              k.toLowerCase().includes('host') || 
                              k.toLowerCase().includes('ip') || 
                              k.toLowerCase().includes('id') ||
                              k.toLowerCase().includes('time') ||
                              k.toLowerCase().includes('date') ||
                              k.toLowerCase().includes('timestamp')) return false;
                          return !isNaN(Number(v)) && isFinite(Number(v));
                        });

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {numericKeys.length > 0 ? numericKeys.map((key) => (
                              <div key={key} onClick={() => openChart(key)} className="group relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(key);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-cyan-100 hover:bg-cyan-200 text-cyan-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300 flex-shrink-0">
                                    {renderIconForKey(key, 'w-7 h-7 text-gray-700')}
                                  </div>
                                  <h5 className="font-semibold text-gray-800 group-hover:text-gray-600 text-xs mb-3 line-clamp-2 px-2 min-h-[2rem]">{getConnzDisplayLabel(key)}</h5>
                                  <div className="mt-auto">
                                    {first[key] !== null && first[key] !== undefined ? (
                                      <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                                        {typeof first[key] === 'number' ? first[key].toLocaleString() : first[key]}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-sm">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg">
                                <div className="text-4xl mb-2">📊</div>
                                <div className="text-gray-600">Sayısal veri bulunamadı</div>
                              </div>
                            )}

                            {/* LAST UPDATE */}
                            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col">
                              <div className="flex-grow flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
                                  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-semibold text-gray-600 text-xs mb-3">LAST UPDATE</h5>
                                {first.record_timestamp ? (
                                  <div className="text-xs text-gray-500">
                                    {new Date(first.record_timestamp).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">-</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // MQ QM Grafik Kartları - Dinamik olarak veri tablosundaki alanları göster
                      if (activeModal === 'mq_qm') {
                        const dataKeys = Object.keys(first);
                        const numericKeys = dataKeys.filter(k => {
                          const v = first[k];
                          if (v === null || v === undefined) return false;
                          if (k.toLowerCase().includes('name') || 
                              k.toLowerCase().includes('system') || 
                              k.toLowerCase().includes('host') || 
                              k.toLowerCase().includes('ip') || 
                              k.toLowerCase().includes('id') ||
                              k.toLowerCase().includes('time') ||
                              k.toLowerCase().includes('date') ||
                              k.toLowerCase().includes('timestamp')) return false;
                          return !isNaN(Number(v)) && isFinite(Number(v));
                        });

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {numericKeys.length > 0 ? numericKeys.map((key) => (
                              <div key={key} onClick={() => openChart(key)} className="group relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(key);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300 flex-shrink-0">
                                    {renderIconForKey(key, 'w-7 h-7 text-gray-700')}
                                  </div>
                                  <h5 className="font-semibold text-gray-800 group-hover:text-gray-600 text-xs mb-3 line-clamp-2 px-2 min-h-[2rem]">{key}</h5>
                                  <div className="mt-auto">
                                    {first[key] !== null && first[key] !== undefined ? (
                                      <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        {typeof first[key] === 'number' ? first[key].toLocaleString() : first[key]}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-sm">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg">
                                <div className="text-4xl mb-2">📊</div>
                                <div className="text-gray-600">Sayısal veri bulunamadı</div>
                              </div>
                            )}

                            {/* LAST UPDATE */}
                            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col">
                              <div className="flex-grow flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
                                  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-semibold text-gray-600 text-xs mb-3">LAST UPDATE</h5>
                                {first.record_timestamp ? (
                                  <div className="text-xs text-gray-500">
                                    {new Date(first.record_timestamp).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">-</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // MQ W2OVER Grafik Kartları - Dinamik olarak veri tablosundaki alanları göster
                      if (activeModal === 'mq_w2over') {
                        const dataKeys = Object.keys(first);
                        const numericKeys = dataKeys.filter(k => {
                          const v = first[k];
                          if (v === null || v === undefined) return false;
                          if (k.toLowerCase().includes('name') || 
                              k.toLowerCase().includes('system') || 
                              k.toLowerCase().includes('host') || 
                              k.toLowerCase().includes('ip') || 
                              k.toLowerCase().includes('id') ||
                              k.toLowerCase().includes('time') ||
                              k.toLowerCase().includes('date') ||
                              k.toLowerCase().includes('timestamp')) return false;
                          return !isNaN(Number(v)) && isFinite(Number(v));
                        });

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {numericKeys.length > 0 ? numericKeys.map((key) => (
                              <div key={key} onClick={() => openChart(key)} className="group relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInfo(key);
                                  }}
                                  className="absolute top-3 right-3 w-6 h-6 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300 flex-shrink-0">
                                    {renderIconForKey(key, 'w-7 h-7 text-gray-700')}
                                  </div>
                                  <h5 className="font-semibold text-gray-800 group-hover:text-gray-600 text-xs mb-3 line-clamp-2 px-2 min-h-[2rem]">{key}</h5>
                                  <div className="mt-auto">
                                    {first[key] !== null && first[key] !== undefined ? (
                                      <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        {typeof first[key] === 'number' ? first[key].toLocaleString() : first[key]}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-sm">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg">
                                <div className="text-4xl mb-2">📊</div>
                                <div className="text-gray-600">Sayısal veri bulunamadı</div>
                              </div>
                            )}

                            {/* LAST UPDATE */}
                            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col">
                              <div className="flex-grow flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
                                  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="font-semibold text-gray-600 text-xs mb-3">LAST UPDATE</h5>
                                {first.record_timestamp ? (
                                  <div className="text-xs text-gray-500">
                                    {new Date(first.record_timestamp).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">-</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Fallback for other cases
                      return (
                        <div className="p-8 text-center bg-gray-50 rounded-lg">
                          <div className="text-4xl mb-2">📈</div>
                          <div className="text-gray-600">Grafik kartları buraya eklenecek</div>
                          <div className="text-gray-500 text-sm mt-2">{activeModal} grafikleri</div>
                        </div>
                      );
                    })()}
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
                            <input type="checkbox" className="mr-2" />
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
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700">Kaydet</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grafik Detay Modalı */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {getDisplayLabelForActive(selectedChart)} - Zaman Serisi Grafiği
                  </h3>
                  <button onClick={() => setSelectedChart(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setChartTab('chart')} className={`py-2 px-1 border-b-2 font-medium text-sm ${ chartTab === 'chart' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}><span className="mr-2">📈</span>Grafik</button>
                    <button onClick={() => setChartTab('threshold')} className={`py-2 px-1 border-b-2 font-medium text-sm ${ chartTab === 'threshold' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}><span className="mr-2">⚙️</span>Threshold</button>
                  </nav>
                </div>
                <div className="min-h-[400px]">
                  {chartTab === 'chart' ? (
                    chartData.length === 0 ? (
                      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                          <p className="text-gray-500 text-sm">Önce tablo sekmesinden veri yükleyin</p>
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
                        
                        const formatTickWithPercent = (n) => {
                          const num = Number(n);
                          return num.toFixed(0) + '%';
                        };
                        
                        const areaD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ') + ` L ${xPos(len-1)},${bottom} L ${xPos(0)},${bottom} Z`;
                        const lineD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ');
                        
                        // Threshold değerleri
                        const criticalThreshold = 90;
                        const warningThreshold = 75;
                        const showThresholds = vMax > 50;
                        
                        return (
                          <>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-800">{getDisplayLabelForActive(selectedChart)}</h4>
                                <button onClick={() => {
                                  const rows = isFiltered
                                    ? (activeModal==='mq_connz' ? filteredMqConnzData : activeModal==='mq_qm' ? filteredMqQmData : filteredMqW2overData)
                                    : (activeModal==='mq_connz' ? mqConnzData : activeModal==='mq_qm' ? mqQmData : mqW2overData);
                                  const points = rows.map((r) => ({
                                    label: r.record_timestamp || r.bmctime || r.updated_at || r.created_at,
                                    value: Number(r[selectedChart]) || 0,
                                  })).filter(p => !isNaN(p.value));
                                  setChartData(points);
                                }} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">Yenile</button>
                              </div>
                              <div className="h-96 w-full">
                                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                                  {/* Grid pattern */}
                                  <defs>
                                    <pattern id="grid-mq-detailed" width="40" height="35" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 35" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid-mq-detailed)" />
                                  
                                  {/* Y-axis labels */}
                                  {ticks.map((t, i) => (
                                    <g key={i}>
                                      <line x1={left} y1={yPos(t)} x2={width-20} y2={yPos(t)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                                      <text x="20" y={yPos(t) + 4} className="text-xs fill-gray-600 font-medium" textAnchor="end">
                                        {showThresholds ? formatTickWithPercent(t) : formatTick(t)}
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
                                      <line x1={left} y1={yPos(criticalThreshold)} x2={width-20} y2={yPos(criticalThreshold)} stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                                      <text x={width-40} y={yPos(criticalThreshold) - 5} className="text-xs fill-red-600 font-semibold" textAnchor="end">Kritik: {criticalThreshold}%</text>
                                      
                                      <line x1={left} y1={yPos(warningThreshold)} x2={width-20} y2={yPos(warningThreshold)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                                      <text x={width-40} y={yPos(warningThreshold) - 5} className="text-xs fill-amber-600 font-semibold" textAnchor="end">Uyarı: {warningThreshold}%</text>
                                    </>
                                  )}
                                  
                                  {/* Area gradient */}
                                  <defs>
                                    <linearGradient id="areaGradientMqDetailed" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>
                                  
                                  {/* Area under curve */}
                                  <path d={areaD} fill="url(#areaGradientMqDetailed)" />
                                  
                                  {/* Line */}
                                  <path d={lineD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  
                                  {/* Data points */}
                                  {chartData.map((p,i)=> (
                                    <circle key={i} cx={xPos(i)} cy={yPos(p.value)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2">
                                      <title>{`${new Date(p.label).toLocaleString('tr-TR')}: ${p.value}`}</title>
                                    </circle>
                                  ))}
                                </svg>
                              </div>
                            </div>
                            
                            {/* Statistics */}
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
                                <div className="text-3xl font-bold text-blue-900">{Math.max(...vals).toFixed(1)}</div>
                                <div className="text-sm text-blue-700 font-medium">Maksimum</div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
                                <div className="text-3xl font-bold text-green-900">{Math.min(...vals).toFixed(1)}</div>
                                <div className="text-sm text-green-700 font-medium">Minimum</div>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
                                <div className="text-3xl font-bold text-purple-900">{(vals.reduce((s,d)=>s+d,0)/vals.length).toFixed(1)}</div>
                                <div className="text-sm text-purple-700 font-medium">Ortalama</div>
                              </div>
                              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
                                <div className="text-3xl font-bold text-orange-900">{len}</div>
                                <div className="text-sm text-orange-700 font-medium">Veri Noktası</div>
                              </div>
                            </div>
                          </>
                        );
                      })()
                    )
                  ) : (
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
                              <input type="checkbox" className="mr-2" />
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
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700">Kaydet</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zaman Filtresi Modalı */}
        {timeFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Zaman ve Tarih Filtresi</h3>
                  <button onClick={() => setTimeFilterModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Hızlı Zaman Aralıkları</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[{id:'last5m',label:'Son 5 Dakika'},{id:'last15m',label:'Son 15 Dakika'},{id:'last30m',label:'Son 30 Dakika'},{id:'last1h',label:'Son 1 Saat'},{id:'last3h',label:'Son 3 Saat'},{id:'last6h',label:'Son 6 Saat'},{id:'last12h',label:'Son 12 Saat'},{id:'last24h',label:'Son 24 Saat'},{id:'last2d',label:'Son 2 Gün'},{id:'custom',label:'Özel Aralık'}].map(r => (
                        <button key={r.id} onClick={()=>setSelectedTimeRange(r.id)} className={`p-3 text-sm font-medium rounded-lg border transition-colors duration-200 ${selectedTimeRange===r.id?'bg-blue-50 border-blue-500 text-blue-700':'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                  {selectedTimeRange==='custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
                        <input type="datetime-local" value={customFromDate} onChange={(e)=>setCustomFromDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
                        <input type="datetime-local" value={customToDate} onChange={(e)=>setCustomToDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button onClick={() => { clearTimeFilter(); setTimeFilterModal(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Temizle</button>
                    <button onClick={applyTimeFilter} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Zaman Aralığını Uygula</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {infoModal && (() => {
          // Key'e göre Türkçe açıklamalar
          const getFieldDescription = (key) => {
            const k = String(key || '').toLowerCase();
            
            // QMSG - Queue Message
            if (k.includes('qmsg') || k.includes('msg')) {
              return 'Kuyrukta bekleyen mesaj sayısını gösterir. Bu değer yüksek ise mesajlar işlenemiyor demektir.';
            }
            
            // COM_LV - Commit Level
            if (k.includes('comlv') || k.includes('com_lv')) {
              return 'Queue Manager\'ın commit seviyesini gösterir. Yüksek değerler transaction yönetimi için kritiktir.';
            }
            
            // GET/PUT operations
            if (k.includes('getr') || k.includes('get')) {
              return 'Mesaj alım (get) işlemlerinin sayısını gösterir. Bu metrik queue performansını ölçer.';
            }
            if (k.includes('put') || k.includes('send')) {
              return 'Mesaj gönderme (put) işlemlerinin sayısını gösterir. Queue\'ya mesaj gönderilme oranını ölçer.';
            }
            
            // RETRY
            if (k.includes('retry')) {
              return 'Yeniden deneme sayısını gösterir. Yüksek değerler bağlantı problemlerini işaret eder.';
            }
            
            // DEPTH
            if (k.includes('depth')) {
              return 'Kuyruk derinliğini gösterir. Kaç mesajın sırada beklediğini ölçer.';
            }
            
            // CHANNEL
            if (k.includes('channel') && !k.includes('message')) {
              return 'Aktif channel sayısını gösterir. Queue Manager arasındaki iletişimi ölçer.';
            }
            
            // QM - Queue Manager specific
            if (k.startsWith('qm') || k.includes('queue_manager')) {
              return 'Queue Manager durumunu gösterir. MQ altyapısının sağlık ve performans metriklerini ölçer.';
            }
            
            // QUEUE related
            if (k.includes('queue') || k.startsWith('q') && !k.includes('msg')) {
              return 'Kuyruk durumunu ve işlem sayılarını gösterir. MQ queue operasyonlarını ölçer.';
            }
            
            // COUNT based
            if (k.includes('count') || k.includes('num') || k.includes('total')) {
              return 'Toplam işlem veya kayıt sayısını gösterir. Sistem aktivitesini ölçer.';
            }
            
            // FREE/USED/BUFFER
            if (k.includes('free') || k.includes('used') || k.includes('buffer')) {
              return 'Bellek kullanımını gösterir. Sistem kaynaklarının tüketimini ölçer.';
            }
            
            // PAGES
            if (k.includes('page') || k.includes('pageset')) {
              return 'Sayfa ve sayfa seti durumunu gösterir. Bellek yönetimini ölçer.';
            }
            
            // EVENTS
            if (k.includes('event') || k.includes('listener')) {
              return 'Event sayısını ve dinleyici durumunu gösterir. Sistem olaylarını ölçer.';
            }
            
            // Timestamp/TIME
            if (k.includes('time') || k.includes('date') || k.includes('timestamp')) {
              return 'Zaman damgası bilgisini gösterir. Kayıt oluşturma veya güncelleme zamanını ölçer.';
            }
            
            // Varsayılan genel açıklama
            return 'Bu veri alanı MQ sisteminin performans ve durum metriklerini ölçer. IBM MQ queue manager\'ın çalışma bilgilerini sağlar.';
          };
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[130]">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {getDisplayLabelForActive(infoModal)} Hakkında
                    </h3>
                    <button onClick={closeInfo} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Ne Ölçer?</h4>
                      <p className="text-blue-800 text-sm">
                        {getFieldDescription(infoModal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button onClick={closeInfo} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MQPage;
