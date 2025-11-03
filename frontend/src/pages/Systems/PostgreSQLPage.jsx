import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react';

const PostgreSQLPage = () => {
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, testing, success, error
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    host: '192.168.60.148',
    port: '5432',
    database: 'mainview',
    user: 'postgres',
    password: '12345678'
  });
  const [editConfig, setEditConfig] = useState({
    host: '',
    port: '',
    database: '',
    user: '',
    password: ''
  });

  const testConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbConfig)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setConnectionStatus('success');
        setConnectionInfo(data);
      } else {
        setConnectionStatus('error');
        setErrorMessage(data.message || 'Bağlantı hatası');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage('Sunucuya bağlanılamadı');
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Database className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'Bağlantı test ediliyor...';
      case 'success':
        return 'Bağlantı başarılı!';
      case 'error':
        return 'Bağlantı başarısız!';
      default:
        return 'Bağlantı durumu bilinmiyor';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleShowConfig = () => {
    setShowAuthModal(true);
    setAuthError('');
    setAuthData({ username: '', password: '' });
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authData.username === 'admin' && authData.password === 'admin123') {
      setShowConfig(true);
      setShowAuthModal(false);
      setAuthError('');
    } else {
      setAuthError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  const handleHideConfig = () => {
    setShowConfig(false);
  };

  const handleEditConfig = () => {
    setEditConfig(dbConfig);
    setShowEditModal(true);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setDbConfig(editConfig);
    setShowEditModal(false);
    setConnectionStatus('idle'); // Reset connection status
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditConfig({
      host: '',
      port: '',
      database: '',
      user: '',
      password: ''
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Database Yönetimi
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Bağlantı Durumu</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <span className={`text-lg font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              
              {connectionStatus === 'error' && errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Hata Detayı:</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}
              
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {connectionStatus === 'testing' ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
              </button>
            </div>
          </div>

          {/* Database Configuration Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Veritabanı Konfigürasyonu</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Veritabanı Bilgileri</h3>
                <div className="flex gap-2">
                  {!showConfig ? (
                    <button
                      onClick={handleShowConfig}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Göster
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleEditConfig}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={handleHideConfig}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Gizle
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {showConfig ? dbConfig.host : '••••••••••••••••'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {showConfig ? dbConfig.port : '••••'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {showConfig ? dbConfig.database : '••••••••'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {showConfig ? dbConfig.user : '••••••••'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    ••••••••••••••••
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Kimlik Doğrulama</h2>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={authData.username}
                  onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kullanıcı adınızı girin"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Şifrenizi girin"
                  required
                />
              </div>
              
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{authError}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Veritabanı Konfigürasyonu Düzenle</h2>
            </div>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host
                </label>
                <input
                  type="text"
                  value={editConfig.host}
                  onChange={(e) => setEditConfig({ ...editConfig, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="192.168.1.100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={editConfig.port}
                  onChange={(e) => setEditConfig({ ...editConfig, port: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5432"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database
                </label>
                <input
                  type="text"
                  value={editConfig.database}
                  onChange={(e) => setEditConfig({ ...editConfig, database: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="mainview"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <input
                  type="text"
                  value={editConfig.user}
                  onChange={(e) => setEditConfig({ ...editConfig, user: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="postgres"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={editConfig.password}
                  onChange={(e) => setEditConfig({ ...editConfig, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostgreSQLPage;
