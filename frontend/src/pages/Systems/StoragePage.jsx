import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Display label overrides for FRMINFO_FIXED
const FRMINFO_FIXED_LABELS = {
  sqa_avg: 'Average SQA Frames',
  sqa_min: 'Minimum SQA Frames',
  sqa_max: 'Maximum SQA Frames',
  lpa_avg: 'Average LPA Frames',
  lpa_min: 'Minimum LPA Frames',
  lpa_max: 'Maximum LPA Frames',
  csa_avg: 'Average CSA Frames',
  lsqa_avg: 'Average LSQA Frames',
  lsqa_min: 'Minimum LSQA Frames',
  lsqa_max: 'Maximum LSQA Frames',
  private_avg: 'Average Private Frames',
  private_min: 'Minimum Private Frames',
  private_max: 'Maximum Private Frames',
  fixed_below_16m_avg: 'Average Fixed <16M',
  fixed_below_16m_min: 'Minimum Fixed <16M',
  fixed_below_16m_max: 'Maximum Fixed <16M',
  fixed_total_avg: 'Average Fixed Total',
  fixed_total_min: 'Minimum Fixed Total',
  fixed_total_max: 'Maximum Fixed Total',
  fixed_percentage: 'Fixed Frames Average Percentage'
};

// Display label overrides for FRMINFO_HIGH_VIRTUAL
const FRMINFO_HIGH_VIRTUAL_LABELS = {
  hv_common_avg: 'Average High Virtual Common Frames',
  hv_common_min: 'Minimum High Virtual Common Frames',
  hv_common_max: 'Maximum High Virtual Common Frames',
  hv_shared_avg: 'Average High Virtual Shared Frames',
  hv_shared_min: 'Minimum High Virtual Shared Frames',
  hv_shared_max: 'Maximum High Virtual Shared Frames'
};

// Display label overrides for FRMINFO_CENTER
const FRMINFO_CENTER_LABELS = {
  // SQA
  spispcav: 'Average SQA Frames',
  spispcmn: 'Minimum SQA Frames',
  spispcmx: 'Maximum SQA Frames',
  // LPA
  spilpfav: 'Average LPA Frames',
  spilpfmn: 'Minimum LPA Frames',
  spilpfmx: 'Maximum LPA Frames',
  // CSA
  spicpfav: 'Average CSA Frames',
  spicpfmn: 'Minimum CSA Frames',
  spicpfmx: 'Maximum CSA Frames',
  // LSQA
  spiqpcav: 'Average LSQA Frames',
  spiqpcmn: 'Minimum LSQA Frames',
  spiqpcmx: 'Maximum LSQA Frames',
  // Private
  spiapfav: 'Average Private Frames',
  spiapfmn: 'Minimum Private Frames',
  spiapfmx: 'Maximum Private Frames',
  // Available frames
  spiafcav: 'Available Frames (Average)',
  spiafcmn: 'Available Frames (Minimum)',
  // Central Total
  spitfuav: 'Average Central Total',
  spiafumn: 'Minimum Central Total',
  spiafumx: 'Maximum Central Total',
  // Percentage
  spitcpct: 'Central Frames Average Percentage'
};

// Display label overrides for SYSFRMIZ
const SYSFRMIZ_LABELS = {
  spgid: 'SMF ID',
  spiuonlf: 'LPAR Online Storage (Average)',
  spluicav: 'Current UIC',
  spifinav: 'Average Nucleus Frames (Average)',
  sprefncp: '% Nucleus Frames (Average)',
  spispcav: 'Average SQA Frames (Average)',
  spreasrp: '% SQA Frames (Average)',
  spilpfav: 'Average LPA Frames (Average)',
  sprealpp: '% LPA Frames (Average)',
  spicpfav: 'Average CSA Frames (Average)',
  spreavpp: '% CSA Frames (Average)',
  spiqpcav: 'Average LSQA Frames (Average)',
  sprelsqp: '% LSQA Frames (Average)',
  spiapfav: 'Average Private Frames (Average)',
  spreprvp: '% Private Frames (Average)',
  spiafcav: 'Available Frames (Average)',
  spreavlp: '% Available Frames (Average)',
  spihvcav: 'Average High Virtual Common Frames',
  sprecmnp: '% High Virtual Common Frames',
  spihvsav: 'Average High Virtual Shared Frames',
  spreshrp: '% High Virtual Shared Frames'
};

// Info texts for metrics (extendable)
const INFO_TEXTS = {
  // CSASUM
  csa_in_use_percent: {
    title: 'CSA Kullanım Yüzdesi',
    what: 'CSA (Common Storage Area) alanının ne kadarının kullanıldığını gösterir.',
    why: 'Yüksek kullanım, bellek yönetimi baskısı ve olası performans sorunlarına neden olabilir.'
  },
  ecsa_in_use_percent: {
    title: 'ECSA Kullanım Yüzdesi',
    what: 'ECSA (Extended CSA) kullanım oranını gösterir.',
    why: 'Süreğen yüksek oranlar adresleme hatalarına ve alan yetersizliğine yol açabilir.'
  },
  rucsa_in_use_percent: {
    title: 'RUCSA Kullanım Yüzdesi',
    what: 'RUCSA alanının doluluk oranını gösterir.',
    why: 'Yüksek doluluk, sistem bileşenlerinin alan bulmasını zorlaştırır.'
  },
  sqa_in_use_percent: {
    title: 'SQA Kullanım Yüzdesi',
    what: 'SQA (Subpool) alanlarının toplam kullanım oranını gösterir.',
    why: 'Yüksek değerler bellek tahsis başarısızlıklarına neden olabilir.'
  },
  total_cs_used_percent: {
    title: 'Toplam CS Kullanımı',
    what: 'Tüm ortak depolama alanlarının toplam kullanım yüzdesi.',
    why: 'Genel kapasite baskısını ve ölçek ihtiyacını gösterir.'
  },
  percent_used_high_shared_storage: {
    title: 'High Shared Storage Kullanımı',
    what: 'Yüksek adres alanındaki paylaşımlı depolama kullanım oranı.',
    why: 'Aşırı kullanım, tahsis gecikmelerine ve servis bozulmalarına yol açabilir.'
  },
  // FRMINFO_FIXED (Türkçe başlıklar)
  sqa_avg: { title: 'Sabit SQA Çerçeveleri (Ortalama)', what: 'Aralık boyunca SQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  sqa_min: { title: 'Sabit SQA Çerçeveleri (Minimum)', what: 'Aralık boyunca SQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  sqa_max: { title: 'Sabit SQA Çerçeveleri (Maksimum)', what: 'Aralık boyunca SQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  lpa_avg: { title: 'Sabit LPA Çerçeveleri (Ortalama)', what: 'Aralık boyunca LPA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  lpa_min: { title: 'Sabit LPA Çerçeveleri (Minimum)', what: 'Aralık boyunca LPA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  lpa_max: { title: 'Sabit LPA Çerçeveleri (Maksimum)', what: 'Aralık boyunca LPA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  csa_avg: { title: 'Sabit CSA Çerçeveleri (Ortalama)', what: 'Aralık boyunca CSA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  lsqa_avg: { title: 'Sabit LSQA Çerçeveleri (Ortalama)', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  lsqa_min: { title: 'Sabit LSQA Çerçeveleri (Minimum)', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  lsqa_max: { title: 'Sabit LSQA Çerçeveleri (Maksimum)', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  private_avg: { title: 'Sabit Private Çerçeveler (Ortalama)', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  private_min: { title: 'Sabit Private Çerçeveler (Minimum)', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  private_max: { title: 'Sabit Private Çerçeveler (Maksimum)', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  fixed_below_16m_avg: { title: '16MB Altı Sabit Çerçeveler (Ortalama)', what: 'Aralık boyunca 16MB altında kalan sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  fixed_below_16m_min: { title: '16MB Altı Sabit Çerçeveler (Minimum)', what: 'Aralık boyunca 16MB altında kalan sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  fixed_below_16m_max: { title: '16MB Altı Sabit Çerçeveler (Maksimum)', what: 'Aralık boyunca 16MB altında kalan sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  fixed_total_avg: { title: 'Toplam Sabit Çerçeveler (Ortalama)', what: 'Aralık boyunca sabitlenen tüm merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  fixed_total_min: { title: 'Toplam Sabit Çerçeveler (Minimum)', what: 'Aralık boyunca sabitlenen tüm merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  fixed_total_max: { title: 'Toplam Sabit Çerçeveler (Maksimum)', what: 'Aralık boyunca sabitlenen tüm merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  fixed_percentage: { title: 'Sabit Çerçeveler Ortalama Yüzdesi', what: 'Aralık boyunca kullanılan kullanılabilir depolama çerçeveleri içindeki sabit çerçevelerin ortalama yüzdesidir.' },
  // FRMINFO_CENTER (Türkçe başlıklar)
  spispcav: { title: 'Ortalama SQA Çerçeveleri', what: 'Aralık boyunca SQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spispcmn: { title: 'Minimum SQA Çerçeveleri', what: 'Aralık boyunca SQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spispcmx: { title: 'Maksimum SQA Çerçeveleri', what: 'Aralık boyunca SQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  spilpfav: { title: 'Ortalama LPA Çerçeveleri', what: 'Aralık boyunca LPA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spilpfmn: { title: 'Minimum LPA Çerçeveleri', what: 'Aralık boyunca LPA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spilpfmx: { title: 'Maksimum LPA Çerçeveleri', what: 'Aralık boyunca LPA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  spicpfav: { title: 'Ortalama CSA Çerçeveleri', what: 'Aralık boyunca CSA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spicpfmn: { title: 'Minimum CSA Çerçeveleri', what: 'Aralık boyunca CSA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spicpfmx: { title: 'Maksimum CSA Çerçeveleri', what: 'Aralık boyunca CSA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  spiqpcav: { title: 'Ortalama LSQA Çerçeveleri', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spiqpcmn: { title: 'Minimum LSQA Çerçeveleri', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spiqpcmx: { title: 'Maksimum LSQA Çerçeveleri', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  spiapfav: { title: 'Ortalama Private Çerçeveler', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spiapfmn: { title: 'Minimum Private Çerçeveler', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spiapfmx: { title: 'Maksimum Private Çerçeveler', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  spiafcav: { title: 'Kullanılabilir Çerçeveler (Ortalama)', what: 'Aralık boyunca kullanılabilir merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spiafcmn: { title: 'Kullanılabilir Çerçeveler (Minimum)', what: 'Aralık boyunca kullanılabilir merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spitfuav: { title: 'Ortalama Merkezi Toplam', what: 'Aralık boyunca kullanılan tüm merkezi depolama çerçevelerinin ortalama sayısıdır.' },
  spiafumn: { title: 'Minimum Merkezi Toplam', what: 'Aralık boyunca kullanılan tüm merkezi depolama çerçevelerinin en düşük sayısıdır.' },
  spiafumx: { title: 'Maksimum Merkezi Toplam', what: 'Aralık boyunca kullanılan tüm merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
  spitcpct: { title: 'Merkezi Çerçeveler Ortalama Yüzdesi', what: 'Aralık boyunca kullanılan merkezi depolama çerçevelerinin ortalama yüzde oranıdır.' },
  // FRMINFO_HIGH_VIRTUAL
  hv_common_avg: { title: 'Average High Virtual Common Frames – SPIHVCAV', what: 'The Average High Virtual Common Frames field contains the average number of central storage frames that were occupied by High Virtual Common storage during the interval.' },
  hv_common_min: { title: 'Minimum High Virtual Common Frames – SPIHVCMN', what: 'The Minimum High Virtual Common Frames field contains the minimum number of central storage frames that were occupied by High Virtual Common storage during the interval.' },
  hv_common_max: { title: 'Maximum High Virtual Common Frames – SPIHVCMX', what: 'The Maximum High Virtual Common Frames field contains the maximum number of central storage frames that were occupied by High Virtual Common storage during the interval.' },
  hv_shared_avg: { title: 'Average High Virtual Shared Frames – SPIHVSAV', what: 'The Average High Virtual Shared Frames field contains the average number of central storage frames that were occupied by High Virtual Shared Memory Objects during the interval.' },
  hv_shared_min: { title: 'Minimum High Virtual Shared Frames – SPIHVSMN', what: 'The Minimum High Virtual Shared Frames field contains the minimum number of central storage frames that were occupied by High Virtual Shared Memory Objects during the interval.' },
  hv_shared_max: { title: 'Maximum High Virtual Shared Frames – SPIHVSMX', what: 'The Maximum High Virtual Shared Frames field contains the maximum number of central storage frames that were occupied by High Virtual Shared Memory Objects during the interval.' },
  // SYSFRMIZ (örnek)
  spl: { title: 'SPL', what: 'System Private Lines kapasitesi/ayar metriği.', why: 'Kaynak sınırlamaları performansı etkileyebilir.' },
  spiuonlf: { title: 'SPIUONLF', what: 'In-use on-line frame sayısı.', why: 'Artış, yük yoğunluğunu gösterir.' },
  spifinav: { title: 'SPIFINAV', what: 'Available frames göstergesi.', why: 'Düşük değer, tahsis başarısızlık riskini artırır.' },
  // Varsayılan
  default: {
    title: 'Metrik Hakkında',
    what: 'Bu kart, ilgili metrik için güncel değeri ve kısa trend bilgisini gösterir.',
    why: 'Metrik, kapasite ve performans takibi için önemlidir. Eşik aşımı olası riskleri işaret eder.'
  }
};

// Tabs definition
const tabs = [
  { id: 'table', name: 'Tablo', icon: '📊' },
  { id: 'chart', name: 'Grafik', icon: '📈' }
];

const StoragePage = () => {
  // State management
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartTab, setChartTab] = useState('chart');
  const [thWarning, setThWarning] = useState(75);
  const [thCritical, setThCritical] = useState(90);
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('thresholds');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [infoModal, setInfoModal] = useState(null);
  const [timeFilterModal, setTimeFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('last6h');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredForModal, setFilteredForModal] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [dbHealthy, setDbHealthy] = useState(null);
  const [dbLastCheckedAt, setDbLastCheckedAt] = useState(null);
  
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

  // Pretty print column names for display only
  const formatHeaderName = (name) => {
    if (!name) return '';
    // Replace underscores with spaces for readability on all tables
    return String(name).replace(/_/g, ' ');
  };

  // Database health check
  const checkDatabaseHealth = async () => {
    try {
      const res = await databaseAPI.checkTableExistsCsasum({});
      const ok = Boolean(res?.data);
      setDbHealthy(ok);
      setDbLastCheckedAt(new Date());
    } catch (e) {
      setDbHealthy(false);
      setDbLastCheckedAt(new Date());
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
    const id = setInterval(checkDatabaseHealth, 60000);
    return () => clearInterval(id);
  }, []);

  

  // Context-aware display name
  const getDisplayName = (columnName) => {
    const raw = String(columnName || '').trim();
    const key = raw.toLowerCase();
    const norm = key.replace(/[^a-z0-9]/g, '');
    if (activeModal === 'FRMINFO_FIXED') {
      return FRMINFO_FIXED_LABELS[norm] || FRMINFO_FIXED_LABELS[key] || formatHeaderName(columnName);
    }
    if (activeModal === 'FRMINFO_HIGH_VIRTUAL') {
      return FRMINFO_HIGH_VIRTUAL_LABELS[norm] || FRMINFO_HIGH_VIRTUAL_LABELS[key] || formatHeaderName(columnName);
    }
    if (activeModal === 'FRMINFO_CENTER') {
      return FRMINFO_CENTER_LABELS[norm] || FRMINFO_CENTER_LABELS[key] || formatHeaderName(columnName);
    }
    if (activeModal === 'SYSFRMIZ') {
      return SYSFRMIZ_LABELS[norm] || SYSFRMIZ_LABELS[key] || formatHeaderName(columnName);
    }
    return formatHeaderName(columnName);
  };

  // Threshold helpers
  const getThresholdKey = (metric, modal = activeModal) => {
    const m = String(metric || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const scope = String(modal || '').toLowerCase();
    return `${scope}:${m}`;
  };

  const getThreshold = (metric, modal = activeModal) => {
    const key = getThresholdKey(metric, modal);
    const local = thresholds[key];
    if (local) return local;
    try {
      const saved = JSON.parse(localStorage.getItem('thresholds') || '{}');
      return saved[key] || { warning: 75, critical: 90 };
    } catch { return { warning: 75, critical: 90 }; }
  };

  const setThresholdForMetric = (metric, valueObj, modal = activeModal) => {
    const key = getThresholdKey(metric, modal);
    setThresholds((prev) => {
      const next = { ...prev, [key]: valueObj };
      try { localStorage.setItem('thresholds', JSON.stringify(next)); } catch {}
      return next;
    });
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
    
    // (bmctime already handled with timestamp above)
    
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
    // Aktif modal için uygulanmış filtre varsa onu döndür
    if (isFiltered && filteredForModal === activeModal) {
      return filteredData;
    }
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
      const response = await databaseAPI.getMainviewStorageFrminfoCenter({});
      if (response.data.success) {
        setFrminfoCenterData(response.data.data);
        toast.success(`FRMINFO Central verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO Central veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('FRMINFO Central veri yüklenirken hata:', error);
      toast.error(`FRMINFO Central veri yüklenirken hata oluştu: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFrminfoFixedData = async () => {
    setIsLoading(true);
    try {
      const response = await databaseAPI.getMainviewStorageFrminfofixed({});
      if (response.data.success) {
        setFrminfoFixedData(response.data.data);
        toast.success(`FRMINFO Fixed verileri yüklendi (${response.data.data.length} kayıt)`);
      } else {
        toast.error('FRMINFO Fixed veri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('FRMINFO Fixed veri yüklenirken hata:', error);
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
      console.error('FRMINFO Central tablo kontrolü hatası:', error);
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

  // Export functions
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

  const exportToPDF = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı');
      return;
    }

    // jsPDF ve AutoTable eklentisini dinamik yükle ve tabloyu düzgün biçimle
    const ensureJsPDF = () => new Promise((resolve) => {
      if (window.jspdf?.jsPDF) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = () => resolve();
      document.head.appendChild(s);
    });

    const ensureAutoTable = () => new Promise((resolve) => {
      if (window.jspdf?.jsPDF && typeof window.jspdf.jsPDF === 'function' && typeof window.jspdf.jsPDF.API?.autoTable === 'function') {
        return resolve();
      }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';
      s.onload = () => resolve();
      document.head.appendChild(s);
    });

    Promise.resolve()
      .then(ensureJsPDF)
      .then(ensureAutoTable)
      .then(() => {
        const { jsPDF } = window.jspdf;
        const headers = Object.keys(data[0]);
        // İstek gereği tüm PDF'ler A4 yatay
        const doc = new jsPDF('l', 'mm', 'a4');

        // Başlık ve tarih
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${filename} - Veri Raporu`, 14, 16);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, 14, 24);

        const body = data.map((row) => headers.map((h) => String(row[h] ?? '')));

        // AutoTable ile düzgün hücre genişliği ve satır kaydırma
        doc.autoTable({
          head: [headers],
          body,
          startY: 30,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: headers.length > 12 ? 6 : headers.length > 8 ? 7 : 8,
            cellPadding: 1.5,
            overflow: 'linebreak', // uzun metinlerde satır kaydırma
            valign: 'middle',
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: 20,
            halign: 'left',
            fontStyle: 'bold',
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          tableWidth: 'wrap',
          horizontalPageBreak: true, // sütunlar çoksa yatay sayfa kırımı
          columnStyles: headers.reduce((acc, h, i) => {
            acc[i] = { cellWidth: 'wrap', minCellWidth: headers.length > 12 ? 14 : headers.length > 8 ? 18 : 24, halign: 'left' };
            return acc;
          }, {}),
          didDrawPage: (dataArg) => {
            // Sayfa numarası
            const pageCount = doc.internal.getNumberOfPages();
            const str = `${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`;
            doc.setFontSize(8);
            doc.text(str, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' });
          },
        });

        const now = new Date();
        const two = (n) => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${two(now.getMonth()+1)}-${two(now.getDate())}_${two(now.getHours())}-${two(now.getMinutes())}-${two(now.getSeconds())}`;
        doc.save(`${filename}_${stamp}.pdf`);
        toast.success('Veriler PDF formatında indirildi');
      })
      .catch(() => toast.error('PDF oluşturulurken bir hata oluştu'));
  };

  

  // (removed unused modal color helpers)

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
        // Grafik zaman etiketi için olası alanları sırayla dene
        label: r.bmctime || r.timestamp || r.record_timestamp || r.created_at || r.updated_at, 
        value: Number(r[chartType]) || 0 
      })));
    }
    // Yüklü eşikleri getir
    const t = getThreshold(chartType);
    setThWarning(Number(t.warning || 75));
    setThCritical(Number(t.critical || 90));
  };

  const closeChart = () => {
    setSelectedChart(null);
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
    setFilteredForModal(null);
    toast.success('Zaman filtresi temizlendi');
  };

  const applyTimeFilter = () => {
    // Aktif modalın verisi üzerinden zaman filtresi uygula
    let baseData = [];
    switch (activeModal) {
      case 'CSASUM': baseData = csasumData || []; break;
      case 'FRMINFO_CENTER': baseData = frminfoCenterData || []; break;
      case 'FRMINFO_FIXED': baseData = frminfoFixedData || []; break;
      case 'FRMINFO_HIGH_VIRTUAL': baseData = frminfoHighVirtualData || []; break;
      case 'SYSFRMIZ': baseData = sysfrmizData || []; break;
      default: baseData = []; break;
    }

    const getRecordDate = (row) => {
      const raw = row?.bmctime || row?.timestamp || row?.record_timestamp || row?.created_at || row?.updated_at;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    };

    const now = new Date();
    let from = null;
    let to = now;

    switch (selectedTimeRange) {
      case 'last5m': from = new Date(now.getTime() - 5 * 60 * 1000); break;
      case 'last15m': from = new Date(now.getTime() - 15 * 60 * 1000); break;
      case 'last30m': from = new Date(now.getTime() - 30 * 60 * 1000); break;
      case 'last1h': from = new Date(now.getTime() - 1 * 60 * 60 * 1000); break;
      case 'last3h': from = new Date(now.getTime() - 3 * 60 * 60 * 1000); break;
      case 'last6h': from = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
      case 'last12h': from = new Date(now.getTime() - 12 * 60 * 60 * 1000); break;
      case 'last24h': from = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'last2d': from = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); break;
      case 'custom':
        from = customFromDate ? new Date(customFromDate) : null;
        to = customToDate ? new Date(customToDate) : now;
        break;
      default:
        from = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    }

    const next = baseData.filter((row) => {
      const d = getRecordDate(row);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    setFilteredData(next);
    setFilteredForModal(activeModal);
    setIsFiltered(true);
    toast.success('Zaman filtresi uygulandı');
    setTimeFilterModal(false);
  };

  // Info texts for metrics (extendable)
  const INFO_TEXTS = {
    // CSASUM
    csa_in_use_percent: {
      title: 'CSA Kullanım Yüzdesi',
      what: 'CSA (Common Storage Area) alanının ne kadarının kullanıldığını gösterir.',
      why: 'Yüksek kullanım, bellek yönetimi baskısı ve olası performans sorunlarına neden olabilir.'
    },
    ecsa_in_use_percent: {
      title: 'ECSA Kullanım Yüzdesi',
      what: 'ECSA (Extended CSA) kullanım oranını gösterir.',
      why: 'Süreğen yüksek oranlar adresleme hatalarına ve alan yetersizliğine yol açabilir.'
    },
    rucsa_in_use_percent: {
      title: 'RUCSA Kullanım Yüzdesi',
      what: 'RUCSA alanının doluluk oranını gösterir.',
      why: 'Yüksek doluluk, sistem bileşenlerinin alan bulmasını zorlaştırır.'
    },
    sqa_in_use_percent: {
      title: 'SQA Kullanım Yüzdesi',
      what: 'SQA (Subpool) alanlarının toplam kullanım oranını gösterir.',
      why: 'Yüksek değerler bellek tahsis başarısızlıklarına neden olabilir.'
    },
    total_cs_used_percent: {
      title: 'Toplam CS Kullanımı',
      what: 'Tüm ortak depolama alanlarının toplam kullanım yüzdesi.',
      why: 'Genel kapasite baskısını ve ölçek ihtiyacını gösterir.'
    },
    percent_used_high_shared_storage: {
      title: 'High Shared Storage Kullanımı',
      what: 'Yüksek adres alanındaki paylaşımlı depolama kullanım oranı.',
      why: 'Aşırı kullanım, tahsis gecikmelerine ve servis bozulmalarına yol açabilir.'
    },

    // FRMINFO_FIXED (Türkçe başlıklar)
    sqa_avg: { title: 'Sabit SQA Çerçeveleri (Ortalama)', what: 'Aralık boyunca SQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    sqa_min: { title: 'Sabit SQA Çerçeveleri (Minimum)', what: 'Aralık boyunca SQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    sqa_max: { title: 'Sabit SQA Çerçeveleri (Maksimum)', what: 'Aralık boyunca SQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    lpa_avg: { title: 'Sabit LPA Çerçeveleri (Ortalama)', what: 'Aralık boyunca LPA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    lpa_min: { title: 'Sabit LPA Çerçeveleri (Minimum)', what: 'Aralık boyunca LPA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    lpa_max: { title: 'Sabit LPA Çerçeveleri (Maksimum)', what: 'Aralık boyunca LPA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    csa_avg: { title: 'Sabit CSA Çerçeveleri (Ortalama)', what: 'Aralık boyunca CSA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    lsqa_avg: { title: 'Sabit LSQA Çerçeveleri (Ortalama)', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    lsqa_min: { title: 'Sabit LSQA Çerçeveleri (Minimum)', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    lsqa_max: { title: 'Sabit LSQA Çerçeveleri (Maksimum)', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    private_avg: { title: 'Sabit Private Çerçeveler (Ortalama)', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    private_min: { title: 'Sabit Private Çerçeveler (Minimum)', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    private_max: { title: 'Sabit Private Çerçeveler (Maksimum)', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    fixed_below_16m_avg: { title: '16MB Altı Sabit Çerçeveler (Ortalama)', what: 'Aralık boyunca 16MB altında kalan sabit merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    fixed_below_16m_min: { title: '16MB Altı Sabit Çerçeveler (Minimum)', what: 'Aralık boyunca 16MB altında kalan sabit merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    fixed_below_16m_max: { title: '16MB Altı Sabit Çerçeveler (Maksimum)', what: 'Aralık boyunca 16MB altında kalan sabit merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    fixed_total_avg: { title: 'Toplam Sabit Çerçeveler (Ortalama)', what: 'Aralık boyunca sabitlenen tüm merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    fixed_total_min: { title: 'Toplam Sabit Çerçeveler (Minimum)', what: 'Aralık boyunca sabitlenen tüm merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    fixed_total_max: { title: 'Toplam Sabit Çerçeveler (Maksimum)', what: 'Aralık boyunca sabitlenen tüm merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    fixed_percentage: { title: 'Sabit Çerçeveler Ortalama Yüzdesi', what: 'Aralık boyunca kullanılan kullanılabilir depolama çerçeveleri içindeki sabit çerçevelerin ortalama yüzdesidir.' },

    // FRMINFO_CENTER (Türkçe başlıklar)
    spispcav: { title: 'Ortalama SQA Çerçeveleri', what: 'Aralık boyunca SQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spispcmn: { title: 'Minimum SQA Çerçeveleri', what: 'Aralık boyunca SQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spispcmx: { title: 'Maksimum SQA Çerçeveleri', what: 'Aralık boyunca SQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    spilpfav: { title: 'Ortalama LPA Çerçeveleri', what: 'Aralık boyunca LPA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spilpfmn: { title: 'Minimum LPA Çerçeveleri', what: 'Aralık boyunca LPA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spilpfmx: { title: 'Maksimum LPA Çerçeveleri', what: 'Aralık boyunca LPA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    spicpfav: { title: 'Ortalama CSA Çerçeveleri', what: 'Aralık boyunca CSA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spicpfmn: { title: 'Minimum CSA Çerçeveleri', what: 'Aralık boyunca CSA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spicpfmx: { title: 'Maksimum CSA Çerçeveleri', what: 'Aralık boyunca CSA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    spiqpcav: { title: 'Ortalama LSQA Çerçeveleri', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spiqpcmn: { title: 'Minimum LSQA Çerçeveleri', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spiqpcmx: { title: 'Maksimum LSQA Çerçeveleri', what: 'Aralık boyunca LSQA sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    spiapfav: { title: 'Ortalama Private Çerçeveler', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spiapfmn: { title: 'Minimum Private Çerçeveler', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spiapfmx: { title: 'Maksimum Private Çerçeveler', what: 'Aralık boyunca Private Area adres alanı sayfalarının işgal ettiği merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    spiafcav: { title: 'Kullanılabilir Çerçeveler (Ortalama)', what: 'Aralık boyunca kullanılabilir merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spiafcmn: { title: 'Kullanılabilir Çerçeveler (Minimum)', what: 'Aralık boyunca kullanılabilir merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spitfuav: { title: 'Ortalama Merkezi Toplam', what: 'Aralık boyunca kullanılan tüm merkezi depolama çerçevelerinin ortalama sayısıdır.' },
    spiafumn: { title: 'Minimum Merkezi Toplam', what: 'Aralık boyunca kullanılan tüm merkezi depolama çerçevelerinin en düşük sayısıdır.' },
    spiafumx: { title: 'Maksimum Merkezi Toplam', what: 'Aralık boyunca kullanılan tüm merkezi depolama çerçevelerinin en yüksek sayısıdır.' },
    spitcpct: { title: 'Merkezi Çerçeveler Ortalama Yüzdesi', what: 'Aralık boyunca kullanılan merkezi depolama çerçevelerinin ortalama yüzde oranıdır.' },

    // FRMINFO_HIGH_VIRTUAL
    hv_common_avg: { title: 'Average High Virtual Common Frames – SPIHVCAV', what: 'The Average High Virtual Common Frames field contains the average number of central storage frames that were occupied by High Virtual Common storage during the interval.' },
    hv_common_min: { title: 'Minimum High Virtual Common Frames – SPIHVCMN', what: 'The Minimum High Virtual Common Frames field contains the minimum number of central storage frames that were occupied by High Virtual Common storage during the interval.' },
    hv_common_max: { title: 'Maximum High Virtual Common Frames – SPIHVCMX', what: 'The Maximum High Virtual Common Frames field contains the maximum number of central storage frames that were occupied by High Virtual Common storage during the interval.' },
    hv_shared_avg: { title: 'Average High Virtual Shared Frames – SPIHVSAV', what: 'The Average High Virtual Shared Frames field contains the average number of central storage frames that were occupied by High Virtual Shared Memory Objects during the interval.' },
    hv_shared_min: { title: 'Minimum High Virtual Shared Frames – SPIHVSMN', what: 'The Minimum High Virtual Shared Frames field contains the minimum number of central storage frames that were occupied by High Virtual Shared Memory Objects during the interval.' },
    hv_shared_max: { title: 'Maximum High Virtual Shared Frames – SPIHVSMX', what: 'The Maximum High Virtual Shared Frames field contains the maximum number of central storage frames that were occupied by High Virtual Shared Memory Objects during the interval.' },

    // SYSFRMIZ (örnek)
    spl: { title: 'SPL', what: 'System Private Lines kapasitesi/ayar metriği.', why: 'Kaynak sınırlamaları performansı etkileyebilir.' },
    spiuonlf: { title: 'SPIUONLF', what: 'In-use on-line frame sayısı.', why: 'Artış, yük yoğunluğunu gösterir.' },
    spifinav: { title: 'SPIFINAV', what: 'Available frames göstergesi.', why: 'Düşük değer, tahsis başarısızlık riskini artırır.' },

    // Varsayılan
    default: {
      title: 'Metrik Hakkında',
      what: 'Bu kart, ilgili metrik için güncel değeri ve kısa trend bilgisini gösterir.',
      why: 'Metrik, kapasite ve performans takibi için önemlidir. Eşik aşımı olası riskleri işaret eder.'
    }
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
              <span>{getDisplayName(header)}</span>
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

    const rows = (() => {
      if (!sortColumn) return data;
      const copy = [...data];
      copy.sort((a, b) => {
        const av = a?.[sortColumn];
        const bv = b?.[sortColumn];
        const na = Number(av);
        const nb = Number(bv);
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          return sortDirection === 'asc' ? na - nb : nb - na;
        }
        const sa = String(av ?? '');
        const sb = String(bv ?? '');
        return sortDirection === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
      return copy;
    })();

    return rows.map((row, index) => (
      <tr key={index} className="hover:bg-gray-50">
        {Object.entries(row).map(([columnName, value], cellIndex) => (
          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatValue(value, columnName)}
          </td>
        ))}
      </tr>
    ));
  };

  // Derive ALL columns for FRMINFO_CENTER charts from table headers
  const getFrminfoCenterNumericColumns = () => {
    const data = frminfoCenterData;
    if (!data || data.length === 0) return [];
    const sample = data[0] || {};
    return Object.keys(sample);
  };

  // Derive ALL columns for FRMINFO_FIXED charts from table headers
  const getFrminfoFixedNumericColumns = () => {
    const data = frminfoFixedData;
    if (!data || data.length === 0) return [];
    const sample = data[0] || {};
    return Object.keys(sample);
  };

  // Derive ALL columns for FRMINFO_HIGH_VIRTUAL charts
  const getFrminfoHighVirtualNumericColumns = () => {
    const data = frminfoHighVirtualData;
    if (!data || data.length === 0) return [];
    const sample = data[0] || {};
    return Object.keys(sample);
  };

  // Derive ALL columns for SYSFRMIZ charts
  const getSysfrmizNumericColumns = () => {
    const data = sysfrmizData;
    if (!data || data.length === 0) return [];
    const sample = data[0] || {};
    return Object.keys(sample);
  };
  // Derive ALL columns for CSASUM charts from table headers
  const getCsasumNumericColumns = () => {
    const data = csasumData;
    if (!data || data.length === 0) return [];
    const sample = data[0] || {};
    return Object.keys(sample);
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
                  {dbHealthy ? (
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

          {/* FRMINFO Central Kartı */}
          <div onClick={() => openModal('FRMINFO_CENTER')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 mx-auto group-hover:bg-green-200">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">FRMINFO Central</h2>
                <p className="text-gray-500 text-sm font-medium">Frame Information Central</p>
                <div className="mt-4 flex items-center justify-center">
                  {dbHealthy ? (
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
                  {dbHealthy ? (
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
                  {dbHealthy ? (
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
                  {dbHealthy ? (
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
          <div onClick={closeModal} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-8xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="p-6 pb-3 flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {activeModal === 'CSASUM' && 'CSASUM Yönetimi'}
                    {activeModal === 'FRMINFO_CENTER' && 'FRMINFO Central Yönetimi'}
                    {activeModal === 'FRMINFO_FIXED' && 'FRMINFO Fixed Yönetimi'}
                    {activeModal === 'FRMINFO_HIGH_VIRTUAL' && 'FRMINFO High Virtual Yönetimi'}
                    {activeModal === 'SYSFRMIZ' && 'SYSFRMIZ Yönetimi'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                {/* Sekmeler (Dinamik Renk) */}
                <div className="px-6 border-b border-gray-200">
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
              </div>
              <div className="p-6">
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
                            onClick={() => exportToPDF(getCurrentData(), activeModal)}
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
                            className="pl-3 pr-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors duration-200 inline-flex items-center space-x-2 shadow-sm"
                          >
                            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="9" strokeWidth="1.6"/>
                              <path d="M12 7v4.5l2.8 2.8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Zaman Filtresi</span>
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
                          {getCsasumNumericColumns().map((colKey) => {
                            const value = getCurrentData()?.[0]?.[colKey];
                            const isNumeric = Number.isFinite(Number(value));
                            const isAlert = Number(value) > 80;
                            return (
                              <div key={colKey} onClick={isNumeric ? () => openChart(colKey) : undefined} className={`group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 p-6 ${isNumeric ? 'cursor-pointer hover:-translate-y-2' : 'cursor-default'}`}>
                                
                                <button onClick={(e) => { e.stopPropagation(); openInfo(colKey); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </button>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName(colKey)}</h5>
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {value !== undefined && value !== null && value !== '' ? formatValue(value, colKey) : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

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

                      {/* FRMINFO_CENTER için Grafik Kartları - Tüm sayısal sütunlar */}
                      {activeModal === 'FRMINFO_CENTER' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {getFrminfoCenterNumericColumns().map((colKey) => {
                            const value = getCurrentData()?.[0]?.[colKey];
                            const isNumeric = Number.isFinite(Number(value));
                            const isAlert = Number(value) > 80;
                            return (
                              <div key={colKey} onClick={isNumeric ? () => openChart(colKey) : undefined} className={`group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 p-6 ${isNumeric ? 'cursor-pointer hover:-translate-y-2' : 'cursor-default'}`}>
                                
                                <button onClick={(e) => { e.stopPropagation(); openInfo(colKey); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </button>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName(colKey)}</h5>
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {value !== undefined && value !== null && value !== '' ? formatValue(value, colKey) : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

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
                                {getCurrentData()?.[0]?.bmctime ? (
                                  <>
                                    <div>{new Date(getCurrentData()[0].bmctime).toLocaleDateString('tr-TR')}</div>
                                    <div>{new Date(getCurrentData()[0].bmctime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</div>
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

                      {/* FRMINFO_FIXED için Grafik Kartları */}
                      {activeModal === 'FRMINFO_FIXED' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {getFrminfoFixedNumericColumns().map((colKey) => {
                            const value = getCurrentData()?.[0]?.[colKey];
                            const isNumeric = Number.isFinite(Number(value));
                            const isAlert = Number(value) > 80;
                            return (
                              <div key={colKey} onClick={isNumeric ? () => openChart(colKey) : undefined} className={`group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 p-6 ${isNumeric ? 'cursor-pointer hover:-translate-y-2' : 'cursor-default'}`}>
                                
                                <button onClick={(e) => { e.stopPropagation(); openInfo(colKey); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </button>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName(colKey)}</h5>
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {value !== undefined && value !== null && value !== '' ? `${formatValue(value, colKey)}` : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* SQA Average */}
                          <div onClick={() => openChart('sqa_avg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sqa_avg'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('sqa_avg')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.sqa_avg > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.sqa_avg ? `${formatNumber(getCurrentData()[0].sqa_avg)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SQA Min */}
                          <div onClick={() => openChart('sqa_min')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sqa_min'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('sqa_min')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.sqa_min > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.sqa_min ? `${formatNumber(getCurrentData()[0].sqa_min)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SQA Max */}
                          <div onClick={() => openChart('sqa_max')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sqa_max'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('sqa_max')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.sqa_max > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.sqa_max ? `${formatNumber(getCurrentData()[0].sqa_max)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* LPA Average */}
                          <div onClick={() => openChart('lpa_avg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('lpa_avg'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('lpa_avg')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.lpa_avg > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.lpa_avg ? `${formatNumber(getCurrentData()[0].lpa_avg)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* LPA Min */}
                          <div onClick={() => openChart('lpa_min')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('lpa_min'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('lpa_min')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.lpa_min > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.lpa_min ? `${formatNumber(getCurrentData()[0].lpa_min)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* LPA Max */}
                          <div onClick={() => openChart('lpa_max')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('lpa_max'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('lpa_max')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.lpa_max > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.lpa_max ? `${formatNumber(getCurrentData()[0].lpa_max)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* CSA Average */}
                          <div onClick={() => openChart('csa_avg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csa_avg'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('csa_avg')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.csa_avg > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.csa_avg ? `${formatNumber(getCurrentData()[0].csa_avg)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* CSA Min */}
                          <div onClick={() => openChart('csa_min')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csa_min'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('csa_min')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.csa_min > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.csa_min ? `${formatNumber(getCurrentData()[0].csa_min)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* CSA Max */}
                          <div onClick={() => openChart('csa_max')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('csa_max'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('csa_max')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.csa_max > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.csa_max ? `${formatNumber(getCurrentData()[0].csa_max)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* Fixed Percentage */}
                          <div onClick={() => openChart('fixed_percentage')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('fixed_percentage'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('fixed_percentage')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.fixed_percentage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.fixed_percentage ? `${formatNumber(getCurrentData()[0].fixed_percentage)}%` : '-'}
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
                                {getCurrentData()?.[0]?.timestamp ? (
                                  <>
                                    <div>{new Date(getCurrentData()[0].timestamp).toLocaleDateString('tr-TR')}</div>
                                    <div>{new Date(getCurrentData()[0].timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</div>
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

                      {/* FRMINFO_HIGH_VIRTUAL için Grafik Kartları */}
                      {activeModal === 'FRMINFO_HIGH_VIRTUAL' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* HV Common Average */}
                          <div onClick={() => openChart('hv_common_avg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('hv_common_avg'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('hv_common_avg')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.hv_common_avg > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.hv_common_avg ? `${formatNumber(getCurrentData()[0].hv_common_avg)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* HV Common Min */}
                          <div onClick={() => openChart('hv_common_min')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('hv_common_min'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('hv_common_min')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.hv_common_min > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.hv_common_min ? `${formatNumber(getCurrentData()[0].hv_common_min)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* HV Common Max */}
                          <div onClick={() => openChart('hv_common_max')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('hv_common_max'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('hv_common_max')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.hv_common_max > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.hv_common_max ? `${formatNumber(getCurrentData()[0].hv_common_max)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* HV Shared Average */}
                          <div onClick={() => openChart('hv_shared_avg')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('hv_shared_avg'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('hv_shared_avg')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.hv_shared_avg > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.hv_shared_avg ? `${formatNumber(getCurrentData()[0].hv_shared_avg)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* HV Shared Min */}
                          <div onClick={() => openChart('hv_shared_min')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('hv_shared_min'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('hv_shared_min')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.hv_shared_min > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.hv_shared_min ? `${formatNumber(getCurrentData()[0].hv_shared_min)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* HV Shared Max */}
                          <div onClick={() => openChart('hv_shared_max')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('hv_shared_max'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('hv_shared_max')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.hv_shared_max > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.hv_shared_max ? `${formatNumber(getCurrentData()[0].hv_shared_max)}` : '-'}
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
                                {getCurrentData()?.[0]?.timestamp ? (
                                  <>
                                    <div>{new Date(getCurrentData()[0].timestamp).toLocaleDateString('tr-TR')}</div>
                                    <div>{new Date(getCurrentData()[0].timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</div>
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

                      {/* SYSFRMIZ için Grafik Kartları */}
                      {activeModal === 'SYSFRMIZ' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {getSysfrmizNumericColumns().map((colKey) => {
                            const value = getCurrentData()?.[0]?.[colKey];
                            const isNumeric = Number.isFinite(Number(value));
                            const isAlert = Number(value) > 80;
                            return (
                              <div key={colKey} onClick={isNumeric ? () => openChart(colKey) : undefined} className={`group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 p-6 ${isNumeric ? 'cursor-pointer hover:-translate-y-2' : 'cursor-default'}`}>
                                
                                <button onClick={(e) => { e.stopPropagation(); openInfo(colKey); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </button>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName(colKey)}</h5>
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {value !== undefined && value !== null && value !== '' ? formatValue(value, colKey) : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* SPL */}
                          <div onClick={() => openChart('spl')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('spl'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">SPL</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.spl > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.spl ? `${formatNumber(getCurrentData()[0].spl)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPIUONLF */}
                          <div onClick={() => openChart('spiuonlf')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('spiuonlf'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('spiuonlf')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.spiuonlf > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.spiuonlf ? `${formatNumber(getCurrentData()[0].spiuonlf)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPIFINAV */}
                          <div onClick={() => openChart('spifinav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('spifinav'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('spifinav')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.spifinav > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.spifinav ? `${formatNumber(getCurrentData()[0].spifinav)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPREFNCP */}
                          <div onClick={() => openChart('sprefncp')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sprefncp'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('sprefncp')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.sprefncp > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.sprefncp ? `${formatNumber(getCurrentData()[0].sprefncp)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPISPCav */}
                          <div onClick={() => openChart('spispcav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('spispcav'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('spispcav')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.spispcav > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.spispcav ? `${formatNumber(getCurrentData()[0].spispcav)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPREASRP */}
                          <div onClick={() => openChart('spreasrp')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('spreasrp'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('spreasrp')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.spreasrp > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.spreasrp ? `${formatNumber(getCurrentData()[0].spreasrp)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPILPFAV */}
                          <div onClick={() => openChart('spilpfav')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('spilpfav'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('spilpfav')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.spilpfav > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.spilpfav ? `${formatNumber(getCurrentData()[0].spilpfav)}` : '-'}
                              </div>
                            </div>
                          </div>

                          {/* SPREALPP */}
                          <div onClick={() => openChart('sprealpp')} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                            
                            <button onClick={(e) => { e.stopPropagation(); openInfo('sprealpp'); }} className="absolute top-3 right-3 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{getDisplayName('sprealpp')}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCurrentData()?.[0]?.sprealpp > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {getCurrentData()?.[0]?.sprealpp ? `${formatNumber(getCurrentData()[0].sprealpp)}` : '-'}
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
                                {getCurrentData()?.[0]?.bmctime ? (
                                  <>
                                    <div>{new Date(getCurrentData()[0].bmctime).toLocaleDateString('tr-TR')}</div>
                                    <div>{new Date(getCurrentData()[0].bmctime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</div>
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grafik Modalı - ZOSPage (2479-2529) stiline benzer başlık ve aksiyonlar */}
        {selectedChart && (
          <div onClick={closeChart} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="p-6 pb-3 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">{getDisplayName(selectedChart)} Grafiği</h3>
                  <button onClick={closeChart} className="text-gray-500 hover:text-gray-700 text-2xl" title="Kapat">×</button>
                </div>
                <div className="px-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setChartTab('chart')} className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center ${chartTab === 'chart' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-6 4 3 3-5" />
                      </svg>
                      Grafik
                    </button>
                    <button onClick={() => setChartTab('threshold')} className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center ${chartTab === 'threshold' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046a1 1 0 00-2.6 0l-.2 1.074a7.967 7.967 0 00-1.86.77L5.1 2.3a1 1 0 00-1.4 1.4l.59 1.54c-.3.59-.53 1.23-.68 1.9L2.5 7.8a1 1 0 000 2l1.11.66c.15.67.38 1.31.68 1.9l-.59 1.54a1 1 0 001.4 1.4l1.54-.59c.59.3 1.23.53 1.9.68l.66 1.11a1 1 0 002 0l.66-1.11c.67-.15 1.31-.38 1.9-.68l1.54.59a1 1 0 001.4-1.4l-.59-1.54c.3-.59.53-1.23.68-1.9l1.11-.66a1 1 0 000-2l-1.11-.66a7.967 7.967 0 00-.68-1.9l.59-1.54a1 1 0 00-1.4-1.4l-1.54.59a7.967 7.967 0 00-1.9-.68l-.66-1.11zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      Threshold
                    </button>
                  </nav>
                </div>
              </div>
              <div className="p-6">
                <div className="min-h-[300px]">
                  {chartTab === 'chart' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm md:text-lg font-semibold text-gray-800">{getDisplayName(selectedChart)} - Zaman Serisi Grafiği</h4>
                        <button
                          onClick={() => openChart(selectedChart)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Yenile
                        </button>
                      </div>

                      {chartData.length === 0 ? (
                        <div className="h-72 flex items-center justify-center bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-4xl mb-4">📊</div>
                            <p className="text-gray-600 text-lg mb-2">Veri bulunamadı</p>
                            <p className="text-gray-500 text-sm">Önce ilgili karttan veri yükleyin</p>
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

                          const isPercentMetric = /(percent|pct|percentage|busy|util)/i.test(String(selectedChart || ''));
                          // Dynamic y-scale so all points are visible
                          let maxVal = isPercentMetric ? Math.max(100, vMax) : Math.max(vMax, 100);
                          let minVal = Math.min(0, vMin);
                          // Add 10% headroom
                          const pad = Math.max(1, (maxVal - minVal) * 0.1);
                          maxVal += pad;
                          if (!isPercentMetric) {
                            minVal -= pad;
                          } else {
                            minVal = Math.max(0, minVal);
                          }
                          const range = Math.max(1e-6, maxVal - minVal);
                          const step = range / 5;

                          const yPos = (v) => bottom - ((v - minVal) / range) * (bottom - top);
                          const stepX = 1100 / Math.max(1, len - 1);
                          const xPos = (i) => left + i * stepX;

                          const ticks = (() => {
                            if (isPercentMetric) {
                              const upper = Math.ceil(maxVal / 20) * 20;
                              const arr = [];
                              for (let t = 0; t <= upper; t += 20) arr.push(t);
                              return arr;
                            }
                            return Array.from({ length: 6 }, (_, i) => minVal + (i * step));
                          })();
                          const formatTick = (n) => {
                            const num = Number(n);
                            if (isPercentMetric) return `${num.toFixed(0)}%`;
                            if (Math.abs(num) >= 1000000) return (num/1000000).toFixed(1)+'M';
                            if (Math.abs(num) >= 1000) return (num/1000).toFixed(1)+'K';
                            return num.toFixed(1);
                          };

                          const areaD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ') + ` L ${xPos(len-1)},${bottom} L ${xPos(0)},${bottom} Z`;
                          const lineD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ');

                          const { warning: warningThreshold, critical: criticalThreshold } = getThreshold(selectedChart);
                          const showThresholds = isPercentMetric || vMax > 50;

                          const lineColor = isPercentMetric ? '#10b981' : '#3b82f6';
                          const gradientStart = isPercentMetric ? '#10b981' : '#3b82f6';
                          const gradientId = 'areaGradientStorageModal';

                          return (
                            <>
                              <div className="h-80 w-full">
                                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                                  <defs>
                                    <pattern id="grid-storage-modal" width="40" height="35" patternUnits="userSpaceOnUse">
                                      <path d="M 40 0 L 0 0 0 35" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid-storage-modal)" />

                                  {ticks.map((t, i) => (
                                    <g key={i}>
                                      <line x1={left} y1={yPos(t)} x2={width-20} y2={yPos(t)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                                      <text x="20" y={yPos(t) + 4} className="text-xs fill-gray-600 font-medium" textAnchor="end">
                                        {formatTick(t)}
                                      </text>
                                    </g>
                                  ))}

                                  {chartData.filter((_,i)=> i % Math.max(1, Math.floor(len/10))===0).map((p,i)=> {
                                    const displayIndex = i * Math.max(1, Math.floor(len/10));
                                    return (
                                      <text key={i} x={xPos(Math.min(displayIndex, len-1))} y="345" className="text-xs fill-gray-600 font-medium" textAnchor="middle">
                                        {new Date(p.label).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}
                                      </text>
                                    );
                                  })}

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

                                  <defs>
                                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor={gradientStart} stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor={gradientStart} stopOpacity="0.05"/>
                                    </linearGradient>
                                  </defs>

                                  <path d={areaD} fill={`url(#${gradientId})`} />
                                  <path d={lineD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                  {chartData.map((p,i)=> (
                                    <g key={i}>
                                      <circle cx={xPos(i)} cy={yPos(p.value)} r="5" fill={lineColor} stroke="white" strokeWidth="2">
                                        <title>{`${new Date(p.label).toLocaleString('tr-TR')}: ${p.value}`}</title>
                                      </circle>
                                    </g>
                                  ))}
                                </svg>
                              </div>

                              {(() => {
                                const fmt = (v) => (isPercentMetric ? `${Number(v).toFixed(1)}%` : Number(v).toFixed(1));
                                if (chartData.length === 0) return null;
                                const valuesOnly = chartData.map(d => Number(d.value) || 0);
                                const maxValStat = Math.max(...valuesOnly);
                                const minValStat = Math.min(...valuesOnly);
                                const maxIdx = valuesOnly.indexOf(maxValStat);
                                const minIdx = valuesOnly.indexOf(minValStat);
                                const maxTime = new Date(chartData[maxIdx]?.label || Date.now()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                const minTime = new Date(chartData[minIdx]?.label || Date.now()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                const avgVal = valuesOnly.reduce((s, v) => s + v, 0) / valuesOnly.length;
                                return (
                                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                      <div className="text-2xl md:text-3xl font-semibold text-gray-900">{fmt(maxValStat)}</div>
                                      <div className="text-sm text-gray-500 font-normal mt-2">Maksimum</div>
                                      <div className="text-xs text-gray-400 mt-1">{maxTime}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                      <div className="text-2xl md:text-3xl font-semibold text-gray-900">{fmt(minValStat)}</div>
                                      <div className="text-sm text-gray-500 font-normal mt-2">Minimum</div>
                                      <div className="text-xs text-gray-400 mt-1">{minTime}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                      <div className="text-2xl md:text-3xl font-semibold text-gray-900">{fmt(avgVal)}</div>
                                      <div className="text-sm text-gray-500 font-normal mt-2">Ortalama</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                      <div className="text-2xl md:text-3xl font-semibold text-gray-900">{chartData.length}</div>
                                      <div className="text-sm text-gray-500 font-normal mt-2">Veri Noktası</div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                  {chartTab === 'threshold' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800">{getDisplayName(selectedChart)} için Threshold Ayarları</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Kritik Eşik</span>
                              <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" value={thCritical} onChange={(e)=> setThCritical(Number(e.target.value))}/>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Uyarı Eşiği</span>
                              <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" value={thWarning} onChange={(e)=> setThWarning(Number(e.target.value))}/>
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
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200" onClick={()=> { const t = getThreshold(selectedChart); setThWarning(Number(t.warning||75)); setThCritical(Number(t.critical||90)); }}>İptal</button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700" onClick={()=> { setThresholdForMetric(selectedChart, { warning: Number(thWarning), critical: Number(thCritical) }); toast.success('Threshold kaydedildi'); }}>Kaydet</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bilgi (Info) Modalı */}
        {infoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[130]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {(INFO_TEXTS[infoModal]?.title) || `${String(infoModal).toUpperCase()} Hakkında`}
                  </h3>
                  <button onClick={closeInfo} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="text-blue-800 font-semibold mb-1">Ne Ölçer?</h4>
                    <p className="text-blue-900 text-sm">
                      {(INFO_TEXTS[infoModal]?.what) || INFO_TEXTS.default.what}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                    <h4 className="text-amber-800 font-semibold mb-1">Neden Önemli?</h4>
                    <p className="text-amber-900 text-sm">
                      {(INFO_TEXTS[infoModal]?.why) || INFO_TEXTS.default.why}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zaman Filtresi Modalı */}
        {timeFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[120]" onClick={closeTimeFilter}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
              <div className="p-6 pb-3 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Zaman ve Tarih Filtresi</h3>
                <button onClick={closeTimeFilter} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-3">Hızlı Zaman Aralıkları</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
                    {[
                      { id:'last5m', label:'Son 5 dakika' },
                      { id:'last15m', label:'Son 15 dakika' },
                      { id:'last30m', label:'Son 30 dakika' },
                      { id:'last1h', label:'Son 1 saat' },
                      { id:'last3h', label:'Son 3 saat' },
                      { id:'last6h', label:'Son 6 saat' },
                      { id:'last12h', label:'Son 12 saat' },
                      { id:'last24h', label:'Son 24 saat' },
                      { id:'last2d', label:'Son 2 gün' },
                      { id:'custom', label:'Özel Aralık' }
                    ].map((opt)=> (
                      <button
                        key={opt.id}
                        onClick={()=> setSelectedTimeRange(opt.id)}
                        className={`${selectedTimeRange===opt.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'} border rounded-lg px-4 py-3 text-sm font-medium`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTimeRange === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Başlangıç</div>
                      <input
                        type="datetime-local"
                        value={customFromDate}
                        onChange={(e)=> setCustomFromDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Bitiş</div>
                      <input
                        type="datetime-local"
                        value={customToDate}
                        onChange={(e)=> setCustomToDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-2">Zaman Dilimi</div>
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                    <div>
                      <div className="font-medium">Tarayıcı Zamanı</div>
                      <div>{Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC{(new Date().getTimezoneOffset()/ -60).toString().padStart(2,'0')}:00)</div>
                    </div>
                    <div className="text-blue-600 font-medium">Zaman Ayarlarını Değiştir</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button onClick={clearTimeFilter} className="text-sm text-gray-500 hover:text-gray-700">Temizle</button>
                  <div className="space-x-3">
                    <button onClick={closeTimeFilter} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button>
                    <button onClick={applyTimeFilter} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Zaman Aralığını Uygula</button>
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

export default StoragePage;