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
      if (res.data?.success) setMqConnzData(res.data.data || []); else toast.error('MQ_CONNZ veri hatası');
      // status güncelle
      setIsConnzActive(true);
    } catch (e) { toast.error('MQ_CONNZ veri çekme hatası'); }
    finally { setDataLoading(false); }
  };
  const fetchMqQm = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQQm(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQQm();
      if (res.data?.success) setMqQmData(res.data.data || []); else toast.error('MQ_QM veri hatası');
      setIsQmActive(true);
    } catch (e) { toast.error('MQ_QM veri çekme hatası'); }
    finally { setDataLoading(false); }
  };
  const fetchMqW2over = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQW2over(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQW2over();
      if (res.data?.success) setMqW2overData(res.data.data || []); else toast.error('MQ_W2OVER veri hatası');
      setIsW2overActive(true);
    } catch (e) { toast.error('MQ_W2OVER veri çekme hatası'); }
    finally { setDataLoading(false); }
  };

  // Zaman filtresi
  const openTimeFilter = () => setTimeFilterModal(true);
  const closeTimeFilter = () => setTimeFilterModal(false);
  const clearTimeFilter = () => { setFilteredMqConnzData([]); setFilteredMqQmData([]); setFilteredMqW2overData([]); setIsFiltered(false); setSelectedTimeRange('last6h'); setCustomFromDate(''); setCustomToDate(''); toast.success('Zaman filtresi temizlendi'); };
  const applyTimeFilter = () => {
    try {
      const apply = (arr) => {
        const list = arr || [];
        const toDate = selectedTimeRange === 'custom' ? new Date(customToDate) : new Date();
        let fromDate = selectedTimeRange === 'custom' ? new Date(customFromDate) : new Date(toDate.getTime() - 6 * 3600 * 1000);
        switch (selectedTimeRange) {
          case 'last5m': fromDate = new Date(toDate.getTime() - 5*60*1000); break;
          case 'last15m': fromDate = new Date(toDate.getTime() - 15*60*1000); break;
          case 'last30m': fromDate = new Date(toDate.getTime() - 30*60*1000); break;
          case 'last1h': fromDate = new Date(toDate.getTime() - 60*60*1000); break;
          case 'last3h': fromDate = new Date(toDate.getTime() - 3*60*60*1000); break;
          case 'last6h': fromDate = new Date(toDate.getTime() - 6*60*60*1000); break;
          case 'last12h': fromDate = new Date(toDate.getTime() - 12*60*60*1000); break;
          case 'last24h': fromDate = new Date(toDate.getTime() - 24*60*60*1000); break;
          case 'last2d': fromDate = new Date(toDate.getTime() - 2*24*60*60*1000); break;
        }
        return list.filter(i => {
          const t = new Date(i.record_timestamp || i.bmctime || i.created_at || i.updated_at);
          return !isNaN(t) && t >= fromDate && t <= toDate;
        });
      };
      setFilteredMqConnzData(apply(mqConnzData));
      setFilteredMqQmData(apply(mqQmData));
      setFilteredMqW2overData(apply(mqW2overData));
      setIsFiltered(true);
      toast.success('Zaman filtresi uygulandı');
      closeTimeFilter();
    } catch (e) { toast.error('Zaman filtresi sırasında hata'); }
  };

  // Export yardımcıları (kolaylaştırılmış - tablo alanları örnek)
  const exportToExcel = (rows, filename) => {
    if (!rows || rows.length === 0) return toast.error('Aktarılacak veri bulunamadı');
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h] ?? '').join(','))].join('\n');
    const BOM='\uFEFF'; const blob=new Blob([BOM+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${filename}_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success('Excel indirildi');
  };
  const exportToPDF = (rows, filename) => {
    if (!rows || rows.length === 0) return toast.error('Aktarılacak veri bulunamadı');
    // Basit PDF: jsPDF autotable benzeri dış import NetworkPage’deki gibi dinamik yüklenebilir
    toast('PDF export bu sayfada basitleştirilmiş placeholder');
  };

  const modalColor = 'cyan';

  // Sayfa açılışında rozet durumlarını kontrol et
  useEffect(() => {
    const refreshStatuses = async () => {1
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

  // Grafik kartı için ikon seçici (kolon adına göre)
  const renderIconForKey = (key, iconClasses) => {
    const k = String(key || '').toLowerCase();
    // Öncelik: spesifik desenler (exception vs reply gibi)
    if (k.includes('exception') || k.includes('error') || k.includes('fail')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      );
    }
    if (k.includes('event') || k.includes('listener')) {
      // Bildirim/olay: zil simgesi
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
        </svg>
      );
    }
    // Saat/tarih
    if (k.includes('time') || k.includes('second') || k.includes('timestamp')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      );
    }
    // Yüzde / kullanım
    if (k.includes('percent') || k.includes('util') || k.includes('ratio')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 16h4v4H6zM11 12h4v8h-4zM16 9h4v11h-4z" />
        </svg>
      );
    }
    // Sayaç / adet
    if (k.includes('count') || k.includes('total') || k.includes('num') || k.includes('events')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M13 4v16M4 8h16M4 14h16" />
        </svg>
      );
    }
    // Durum / status
    if (k.includes('status') || k.includes('state')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      );
    }
    // Derinlik/queue
    if (k.includes('depth') || k.includes('queue')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h11M5 12h14M2 17h14" />
        </svg>
      );
    }
    // Retry/transmit
    if (k.includes('retry') || k.includes('transmit')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0111-6M19 9a7 7 0 01-11 6" />
        </svg>
      );
    }
    // Dead letter -> mail
    if (k.includes('dead_letter') || k.includes('letter')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      );
    }
    // Reply (cevap) → ok
    if (k.includes('reply')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9V5l-7 7 7 7v-4h8v-6h-8z" />
        </svg>
      );
    }
    // Free pages / page
    if (k.includes('page')) {
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h8l4 4v12H7a2 2 0 01-2-2V6a2 2 0 012-2zM15 4v4h4" />
        </svg>
      );
    }
    // Varsayılan (liste)
    return (
      <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M8 17h8" />
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

                {/* Toolbar */}
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Veri Tablosu</h4>
                  <div className="flex space-x-3">
                    <button onClick={() => exportToExcel(isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData), activeModal.toUpperCase())} className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md">Excel'e Aktar</button>
                    <button onClick={() => exportToPDF(isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData), activeModal.toUpperCase())} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md">PDF'e Aktar</button>
                    <button onClick={openTimeFilter} className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 ${isFiltered ? 'text-blue-700 bg-blue-100 border-blue-300 hover:bg-blue-200' : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>Zaman Filtresi</button>
                    <button onClick={() => (activeModal==='mq_connz'?fetchMqConnz():activeModal==='mq_qm'?fetchMqQm():fetchMqW2over())} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md">Yenile</button>
                  </div>
                </div>

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
                              {Object.keys(((isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData))[0] || {})).map(k => (
                                <th key={k} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(isFiltered ? (activeModal==='mq_connz'?filteredMqConnzData:activeModal==='mq_qm'?filteredMqQmData:filteredMqW2overData) : (activeModal==='mq_connz'?mqConnzData:activeModal==='mq_qm'?mqQmData:mqW2overData)).map((row, idx) => (
                              <tr key={idx} className={idx%2===0?'bg-white':'bg-gray-50'}>
                                {Object.values(row).map((v,i)=>(<td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{v ?? '-'}</td>))}
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
                      const numericKeys = Object.keys(first || {}).filter(k => {
                        const v = first[k];
                        if (v === null || v === undefined) return false;
                        const str = String(v).toLowerCase();
                        // string/text/tarih alanları ve kimlikler hariç
                        if (/[a-z]/.test(str) && isNaN(Number(v))) return false;
                        if (k.toLowerCase().includes('name')) return false;
                        if (k.toLowerCase().includes('system')) return false;
                        if (k.toLowerCase().includes('host')) return false;
                        if (k.toLowerCase().includes('ip')) return false;
                        if (k.toLowerCase().includes('job')) return false;
                        if (k.toLowerCase().includes('step')) return false;
                        if (k.toLowerCase().includes('time')) return false;
                        if (k.toLowerCase().includes('date')) return false;
                        if (k.toLowerCase()==='id') return false;
                        // sayıya çevrilebilen alanlar
                        return !isNaN(Number(v));
                      });
                      if (!rows || rows.length === 0) {
                        return (
                          <div className="p-8 text-center bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="text-gray-600">Önce Tablo sekmesinden veri yükleyin</div>
                          </div>
                        );
                      }
                      if (numericKeys.length === 0) {
                        return (
                          <div className="p-8 text-center bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-2">ℹ️</div>
                            <div className="text-gray-600">Sayısal alan bulunamadı. Metin alanları için grafik oluşturulmaz.</div>
                          </div>
                        );
                      }
                      const formatNum = (n) => {
                        const num = Number(n);
                        if (isNaN(num)) return '-';
                        if (Math.abs(num) >= 1000000) return (num/1000000).toFixed(2) + 'M';
                        if (Math.abs(num) >= 1000) return (num/1000).toFixed(2) + 'K';
                        return num.toString();
                      };
                      const palette = activeModal==='mq_connz'
                        ? { iconBg: 'bg-gray-100 group-hover:bg-gray-200', iconText: 'text-gray-500', badge: 'text-cyan-700 bg-cyan-50 border-cyan-200' }
                        : activeModal==='mq_qm'
                          ? { iconBg: 'bg-gray-100 group-hover:bg-gray-200', iconText: 'text-gray-500', badge: 'text-indigo-700 bg-indigo-50 border-indigo-200' }
                          : { iconBg: 'bg-gray-100 group-hover:bg-gray-200', iconText: 'text-gray-500', badge: 'text-rose-700 bg-rose-50 border-rose-200' };
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {numericKeys.map((key) => (
                            <div key={key} onClick={() => openChart(key)} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300 cursor-pointer p-6 hover:-translate-y-2">
                              <div className="text-center">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${palette.iconBg}`}>
                                  {renderIconForKey(key, `w-6 h-6 ${palette.iconText}`)}
                                </div>
                                <h5 className="font-bold text-gray-800 group-hover:text-gray-600 text-lg mb-2">{key}</h5>
                                <div className="mt-2">
                                  <span className={`inline-block px-3 py-1 text-sm font-semibold border rounded-full ${palette.badge}`}>
                                    {formatNum(first[key])}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Son Güncelleme */}
                          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg></div>
                              <h5 className="font-bold text-gray-500 text-lg">LAST UPDATE</h5>
                              <div className="text-sm text-gray-700 mt-1">{first.record_timestamp ? new Date(first.record_timestamp).toLocaleString('tr-TR') : (first.updated_at || first.created_at || '-')}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grafik Detay Modalı */}
        {selectedChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedChart} Grafiği</h3>
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
                        const width = 1200; const height = 300; const left = 80; const bottom = 280; const top = 20;
                        const len = chartData.length;
                        const vals = chartData.map(d => Number(d.value) || 0);
                        let vMin = Math.min(...vals);
                        let vMax = Math.max(...vals);
                        if (!isFinite(vMin)) vMin = 0; if (!isFinite(vMax)) vMax = 1;
                        if (vMax === vMin) vMax = vMin + 1;
                        const pad = (vMax - vMin) * 0.1;
                        const dMin = vMin - pad;
                        const dMax = vMax + pad;
                        const yPos = (v) => bottom - ((v - dMin) / (dMax - dMin)) * (bottom - top);
                        const stepX = 1100 / Math.max(1, len - 1);
                        const xPos = (i) => left + i * stepX;
                        const tickCount = 5;
                        const ticks = Array.from({ length: tickCount }, (_, i) => dMin + (i * (dMax - dMin)) / (tickCount - 1));
                        const formatTick = (n) => {
                          const num = Number(n);
                          if (Math.abs(num) >= 1000000) return (num/1000000).toFixed(2)+'M';
                          if (Math.abs(num) >= 1000) return (num/1000).toFixed(2)+'K';
                          return num.toFixed(2);
                        };
                        const areaD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ') + ` L ${xPos(len-1)},${bottom} L ${xPos(0)},${bottom} Z`;
                        const lineD = `M ${xPos(0)},${yPos(chartData[0]?.value || 0)} ` + chartData.map((p,i)=>`L ${xPos(i)},${yPos(p.value)}`).join(' ');
                        return (
                          <>
                            <div className="h-96 w-full">
                              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                                <defs>
                                  <pattern id="grid-mq" width="40" height="30" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-mq)" />
                                {ticks.map((t, i) => (
                                  <text key={i} x="20" y={yPos(t)} className="text-xs fill-gray-500" textAnchor="end">{formatTick(t)}</text>
                                ))}
                                {chartData.filter((_,i)=> i % Math.max(1, Math.floor(len/8))===0).map((p,i)=> (
                                  <text key={i} x={xPos(i)} y="295" className="text-xs fill-gray-500" textAnchor="middle">{new Date(p.label).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</text>
                                ))}
                                <defs>
                                  <linearGradient id="areaGradientMq" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05"/>
                                  </linearGradient>
                                </defs>
                                <path d={areaD} fill="url(#areaGradientMq)" />
                                <path d={lineD} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                {chartData.map((p,i)=> (
                                  <circle key={i} cx={xPos(i)} cy={yPos(p.value)} r="3" fill="#06b6d4"><title>{`${new Date(p.label).toLocaleString('tr-TR')}: ${p.value}`}</title></circle>
                                ))}
                              </svg>
                            </div>
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-gray-900">{Math.max(...vals).toFixed(2)}</div><div className="text-sm text-gray-500">Maksimum</div></div>
                              <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-gray-900">{Math.min(...vals).toFixed(2)}</div><div className="text-sm text-gray-500">Minimum</div></div>
                              <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-gray-900">{(vals.reduce((s,d)=>s+d,0)/vals.length).toFixed(2)}</div><div className="text-sm text-gray-500">Ortalama</div></div>
                              <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-gray-900">{len}</div><div className="text-sm text-gray-500">Veri Noktası</div></div>
                            </div>
                          </>
                        );
                      })()
                    )
                  ) : (
                    <div className="space-y-6"><h4 className="text-lg font-semibold text-gray-800">{selectedChart} için Threshold Ayarları</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gray-50 rounded-lg p-6"><h5 className="font-semibold text-gray-800 mb-4">Uyarı Eşikleri</h5><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Kritik Eşik</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="90"/></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Uyarı Eşiği</span><input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" defaultValue="75"/></div></div></div><div className="bg-gray-50 rounded-lg p-6"><h5 className="font-semibold text-gray-800 mb-4">Bildirim Ayarları</h5><div className="space-y-3"><label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked/><span className="text-sm text-gray-600">E-posta</span></label><label className="flex items-center"><input type="checkbox" className="mr-2"/><span className="text-sm text-gray-600">Sistem bildirimi</span></label></div></div></div><div className="flex justify-end space-x-3 mt-6"><button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">İptal</button><button className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700">Kaydet</button></div></div>
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
      </div>
    </div>
  );
};

export default MQPage;
