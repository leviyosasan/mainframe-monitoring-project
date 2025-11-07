import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, Loader, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';

const PostgreSQLPage = () => {
  const [connections, setConnections] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [testingConnectionId, setTestingConnectionId] = useState(null);
  const [newConnection, setNewConnection] = useState({
    name: '',
    host: '',
    port: '5432',
    database: '',
    user: '',
    password: '',
    active: true
  });

  // localStorage'dan bağlantıları yükle
  useEffect(() => {
    const savedConnections = localStorage.getItem('postgresql_connections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    } else {
      // Varsayılan bağlantıyı ekle
      const defaultConnection = {
        id: Date.now().toString(),
        name: 'Varsayılan Bağlantı',
        host: '192.168.60.148',
        port: '5432',
        database: 'mainview',
        user: 'postgres',
        password: '12345678',
        active: true,
        lastTested: null,
        status: 'idle'
      };
      setConnections([defaultConnection]);
      localStorage.setItem('postgresql_connections', JSON.stringify([defaultConnection]));
    }
  }, []);

  // Bağlantıları localStorage'a kaydet
  const saveConnections = (updatedConnections) => {
    localStorage.setItem('postgresql_connections', JSON.stringify(updatedConnections));
    setConnections(updatedConnections);
  };

  // Yeni bağlantı ekle
  const handleAddConnection = (e) => {
    e.preventDefault();
    const connection = {
      id: Date.now().toString(),
      ...newConnection,
      lastTested: null,
      status: 'idle'
    };
    const updatedConnections = [...connections, connection];
    saveConnections(updatedConnections);
    setNewConnection({
      name: '',
      host: '',
      port: '5432',
      database: '',
      user: '',
      password: '',
      active: true
    });
    setShowAddModal(false);
  };

  // Bağlantı düzenle
  const handleEditConnection = (connection) => {
    setEditingConnection({ ...connection });
    setShowEditModal(true);
  };

  // Bağlantı güncelle
  const handleUpdateConnection = (e) => {
    e.preventDefault();
    const updatedConnections = connections.map(conn =>
      conn.id === editingConnection.id ? editingConnection : conn
    );
    saveConnections(updatedConnections);
    setShowEditModal(false);
    setEditingConnection(null);
  };

  // Bağlantı sil
  const handleDeleteConnection = (id) => {
    if (window.confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) {
      const updatedConnections = connections.filter(conn => conn.id !== id);
      saveConnections(updatedConnections);
    }
  };

  // Bağlantı aktif/pasif yap
  const handleToggleActive = (id) => {
    const updatedConnections = connections.map(conn =>
      conn.id === id ? { ...conn, active: !conn.active } : conn
    );
    saveConnections(updatedConnections);
  };

  // Bağlantı test et
  const testConnection = async (connection) => {
    setTestingConnectionId(connection.id);
    const updatedConnections = connections.map(conn => {
      if (conn.id === connection.id) {
        return { ...conn, status: 'testing' };
      }
      return conn;
    });
    saveConnections(updatedConnections);

    try {
      const response = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: connection.host,
          port: connection.port,
          database: connection.database,
          user: connection.user,
          password: connection.password
        })
      });

      const data = await response.json();
      const finalConnections = connections.map(conn => {
        if (conn.id === connection.id) {
          return {
            ...conn,
            status: response.ok ? 'success' : 'error',
            lastTested: new Date().toISOString(),
            errorMessage: response.ok ? null : (data.message || 'Bağlantı hatası')
          };
        }
        return conn;
      });
      saveConnections(finalConnections);
    } catch (error) {
      const finalConnections = connections.map(conn => {
        if (conn.id === connection.id) {
          return {
            ...conn,
            status: 'error',
            lastTested: new Date().toISOString(),
            errorMessage: 'Sunucuya bağlanılamadı'
          };
        }
        return conn;
      });
      saveConnections(finalConnections);
    } finally {
      setTestingConnectionId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'testing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'testing':
        return 'Test ediliyor...';
      case 'success':
        return 'Başarılı';
      case 'error':
        return 'Başarısız';
      default:
        return 'Test edilmedi';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            PostgreSQL Bağlantı Yönetimi
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Bağlantı Ekle
          </button>
        </div>

        {/* Bağlantı Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                connection.active ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {connection.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(connection.status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(connection.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(connection.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    connection.active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={connection.active ? 'Pasif Yap' : 'Aktif Yap'}
                >
                  {connection.active ? (
                    <Power className="w-5 h-5" />
                  ) : (
                    <PowerOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-500">Host:</span>{' '}
                  <span className="font-medium text-gray-900">{connection.host}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Port:</span>{' '}
                  <span className="font-medium text-gray-900">{connection.port}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Database:</span>{' '}
                  <span className="font-medium text-gray-900">{connection.database}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">User:</span>{' '}
                  <span className="font-medium text-gray-900">{connection.user}</span>
                </div>
                {connection.lastTested && (
                  <div className="text-xs text-gray-400">
                    Son test: {new Date(connection.lastTested).toLocaleString('tr-TR')}
                  </div>
                )}
                {connection.errorMessage && connection.status === 'error' && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {connection.errorMessage}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => testConnection(connection)}
                  disabled={testingConnectionId === connection.id || !connection.active}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {testingConnectionId === connection.id ? 'Test Ediliyor...' : 'Test Et'}
                </button>
                <button
                  onClick={() => handleEditConnection(connection)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {connections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz bağlantı yok</h3>
            <p className="text-gray-500 mb-4">Yeni bir bağlantı ekleyerek başlayın</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Yeni Bağlantı Ekle
            </button>
          </div>
        )}
      </div>

      {/* Yeni Bağlantı Ekleme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Yeni Bağlantı Ekle</h2>
            </div>

            <form onSubmit={handleAddConnection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bağlantı Adı *
                </label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Production DB"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host *
                </label>
                <input
                  type="text"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port *
                </label>
                <input
                  type="number"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ ...newConnection, port: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5432"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database *
                </label>
                <input
                  type="text"
                  value={newConnection.database}
                  onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mainview"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  value={newConnection.user}
                  onChange={(e) => setNewConnection({ ...newConnection, user: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="postgres"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre *
                </label>
                <input
                  type="password"
                  value={newConnection.password}
                  onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={newConnection.active}
                  onChange={(e) => setNewConnection({ ...newConnection, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Aktif olarak kaydet
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewConnection({
                      name: '',
                      host: '',
                      port: '5432',
                      database: '',
                      user: '',
                      password: '',
                      active: true
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bağlantı Düzenleme Modal */}
      {showEditModal && editingConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Edit className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Bağlantı Düzenle</h2>
            </div>

            <form onSubmit={handleUpdateConnection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bağlantı Adı *
                </label>
                <input
                  type="text"
                  value={editingConnection.name}
                  onChange={(e) => setEditingConnection({ ...editingConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host *
                </label>
                <input
                  type="text"
                  value={editingConnection.host}
                  onChange={(e) => setEditingConnection({ ...editingConnection, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port *
                </label>
                <input
                  type="number"
                  value={editingConnection.port}
                  onChange={(e) => setEditingConnection({ ...editingConnection, port: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database *
                </label>
                <input
                  type="text"
                  value={editingConnection.database}
                  onChange={(e) => setEditingConnection({ ...editingConnection, database: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  value={editingConnection.user}
                  onChange={(e) => setEditingConnection({ ...editingConnection, user: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre *
                </label>
                <input
                  type="password"
                  value={editingConnection.password}
                  onChange={(e) => setEditingConnection({ ...editingConnection, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mevcut şifreyi korumak için boş bırakın"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingConnection.active}
                  onChange={(e) => setEditingConnection({ ...editingConnection, active: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="edit-active" className="text-sm font-medium text-gray-700">
                  Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingConnection(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Güncelle
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
