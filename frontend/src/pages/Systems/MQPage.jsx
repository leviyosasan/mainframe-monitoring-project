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
    } catch (e) { toast.error('MQ_CONNZ veri çekme hatası'); }
    finally { setDataLoading(false); }
  };
  const fetchMqQm = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQQm(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQQm();
      if (res.data?.success) setMqQmData(res.data.data || []); else toast.error('MQ_QM veri hatası');
    } catch (e) { toast.error('MQ_QM veri çekme hatası'); }
    finally { setDataLoading(false); }
  };
  const fetchMqW2over = async () => {
    setDataLoading(true);
    try {
      const ok = await checkMQW2over(); if (!ok) { setDataLoading(false); return; }
      const res = await databaseAPI.getMainviewMQW2over();
      if (res.data?.success) setMqW2overData(res.data.data || []); else toast.error('MQ_W2OVER veri hatası');
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">MQ Message Queue</h1>

        {/* Kartlar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div onClick={() => openModal('mq_connz')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-cyan-100 rounded-xl mb-6 mx-auto group-hover:bg-cyan-200"><svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h4" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">MQ CONNZ</h2><p className="text-gray-500 text-sm font-medium">Bağlantı Bilgileri</p></div>
            </div>
          </div>
          <div onClick={() => openModal('mq_qm')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-6 mx-auto group-hover:bg-indigo-200"><svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 11h14M7 15h10" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">MQ QM</h2><p className="text-gray-500 text-sm font-medium">Queue Manager</p></div>
            </div>
          </div>
          <div onClick={() => openModal('mq_w2over')} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-center justify-center w-14 h-14 bg-rose-100 rounded-xl mb-6 mx-auto group-hover:bg-rose-200"><svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg></div>
              <div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">MQ W2OVER</h2><p className="text-gray-500 text-sm font-medium">Workload/Overflow</p></div>
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
                  <div className="text-gray-500 text-sm">Grafik kartları burada oluşturulacak (NetworkPage yapısı örnek alınabilir).</div>
                )}
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
