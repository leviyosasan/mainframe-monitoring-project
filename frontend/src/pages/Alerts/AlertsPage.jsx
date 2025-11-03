import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react';

const AlertsPage = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Örnek uyarı verileri
  const alerts = [
    {
      id: 1,
      title: 'CPU Busy% Kritik Eşik Aşıldı',
      description: 'CPU Busy% değeri %92.5 ile kritik eşik (%90) aşıldı',
      system: 'z/OS',
      metric: 'CPU Busy%',
      value: '92.5%',
      threshold: '90%',
      severity: 'critical',
      timestamp: '2024-01-15 14:30:25',
      status: 'active'
    },
    {
      id: 2,
      title: 'zIIP Busy% Uyarı Eşiği Aşıldı',
      description: 'zIIP Busy% değeri %78.2 ile uyarı eşiği (%70) aşıldı',
      system: 'z/OS',
      metric: 'zIIP Busy%',
      value: '78.2%',
      threshold: '70%',
      severity: 'warning',
      timestamp: '2024-01-15 14:25:10',
      status: 'active'
    },
    {
      id: 3,
      title: 'I/O Rate% Kritik Eşik Aşıldı',
      description: 'I/O Rate% değeri 1,250 IOPS ile kritik eşik (1,000) aşıldı',
      system: 'z/OS',
      metric: 'I/O Rate%',
      value: '1,250 IOPS',
      threshold: '1,000 IOPS',
      severity: 'critical',
      timestamp: '2024-01-15 14:20:45',
      status: 'active'
    },
    {
      id: 4,
      title: 'DASD Busy% Uyarı Eşiği Aşıldı',
      description: 'DASD Busy% değeri %68.5 ile uyarı eşiği (%65) aşıldı',
      system: 'z/OS',
      metric: 'DASD Busy%',
      value: '68.5%',
      threshold: '65%',
      severity: 'warning',
      timestamp: '2024-01-15 14:15:30',
      status: 'resolved'
    },
    {
      id: 5,
      title: 'CPU Utilization% Bilgi Eşiği Aşıldı',
      description: 'CPU Utilization% değeri %72.3 ile bilgi eşiği (%70) aşıldı',
      system: 'z/OS',
      metric: 'CPU Utilization%',
      value: '72.3%',
      threshold: '70%',
      severity: 'info',
      timestamp: '2024-01-15 14:10:15',
      status: 'resolved'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.metric.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistem Uyarıları</h1>
          <p className="text-gray-600">Eşik değerlerini aşan sistem metrikleri ve uyarıları</p>
        </div>

        {/* Filtreler ve Arama */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Arama */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Uyarı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Durum Filtresi */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aktif
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Çözüldü
              </button>
            </div>
          </div>
        </div>

        {/* Uyarı Listesi */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Severity Icon */}
                  <div className="flex-shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity === 'critical' ? 'Kritik' : 
                         alert.severity === 'warning' ? 'Uyarı' : 'Bilgi'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status === 'active' ? 'Aktif' : 'Çözüldü'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{alert.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Sistem:</span>
                        <span className="ml-2 font-medium text-gray-900">{alert.system}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Metrik:</span>
                        <span className="ml-2 font-medium text-gray-900">{alert.metric}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mevcut Değer:</span>
                        <span className="ml-2 font-medium text-red-600">{alert.value}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Eşik:</span>
                        <span className="ml-2 font-medium text-gray-900">{alert.threshold}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center text-gray-500 text-sm ml-4">
                  <Clock className="w-4 h-4 mr-1" />
                  {alert.timestamp}
                </div>
              </div>

              {/* Action Buttons */}
              {alert.status === 'active' && (
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                    Görmezden Gel
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors">
                    Çözüldü Olarak İşaretle
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Boş Durum */}
        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Uyarı Bulunamadı</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Arama kriterlerinize uygun uyarı bulunamadı.' : 'Şu anda aktif uyarı bulunmuyor.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
