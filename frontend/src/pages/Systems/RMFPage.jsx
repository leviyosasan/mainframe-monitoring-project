import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

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
    
    if (columnName.includes('timestamp') || columnName.includes('time') || columnName === 'bmctime' || columnName === 'record_timestamp') {
      try {
        return new Date(value).toLocaleString('tr-TR');
      } catch {
        return value.toString();
      }
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

  const getCurrentRawData = () => {
    return activeModal ? data[activeModal] || [] : [];
  };

  const getCurrentData = () => {
    return isFiltered ? filteredData : getCurrentRawData();
  };

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
    { id: 'chart', name: 'Grafik', icon: '📈' },
    { id: 'threshold', name: 'Threshold', icon: '⚙️' }
  ];

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
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
      headers.join(','),
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
          head: [headers],
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
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                              <input type="checkbox" className="mr-2" defaultChecked />
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
      </div>
    </div>
  );
};

export default RMFPage;
