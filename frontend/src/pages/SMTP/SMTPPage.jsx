import React, { useState } from 'react';
import { Mail, Plus, Trash2, Edit, Save, X, TestTube, Send } from 'lucide-react';

const SMTPPage = () => {
  const [smtpConfig, setSmtpConfig] = useState({
    server: 'smtp.company.com',
    port: '587',
    username: 'alerts@company.com',
    password: '••••••••',
    fromEmail: 'alerts@company.com',
    fromName: 'BMC MainView Alerts',
    useTLS: true,
    useSSL: false
  });

  const [emailAddresses, setEmailAddresses] = useState([
    { id: 1, email: 'admin@company.com', name: 'Sistem Yöneticisi', isActive: true },
    { id: 2, email: 'ops@company.com', name: 'Operasyon Ekibi', isActive: true },
    { id: 3, email: 'manager@company.com', name: 'IT Müdürü', isActive: false },
    { id: 4, email: 'monitor@company.com', name: 'Monitoring Ekibi', isActive: true }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEmail, setNewEmail] = useState({ email: '', name: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleConfigChange = (field, value) => {
    setSmtpConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailChange = (id, field, value) => {
    setEmailAddresses(prev => 
      prev.map(email => 
        email.id === id ? { ...email, [field]: value } : email
      )
    );
  };

  const handleAddEmail = () => {
    if (newEmail.email && newEmail.name) {
      const newId = Math.max(...emailAddresses.map(e => e.id)) + 1;
      setEmailAddresses(prev => [...prev, { 
        id: newId, 
        ...newEmail, 
        isActive: true 
      }]);
      setNewEmail({ email: '', name: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteEmail = (id) => {
    setEmailAddresses(prev => prev.filter(email => email.id !== id));
  };

  const handleToggleActive = (id) => {
    setEmailAddresses(prev => 
      prev.map(email => 
        email.id === id ? { ...email, isActive: !email.isActive } : email
      )
    );
  };

  const handleTestConnection = () => {
    // SMTP bağlantı testi simülasyonu
    alert('SMTP bağlantısı test ediliyor...');
  };

  const handleSendTestEmail = () => {
    // Test e-postası gönderme simülasyonu
    alert('Test e-postası gönderiliyor...');
  };

  const activeEmails = emailAddresses.filter(email => email.isActive);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SMTP E-posta Ayarları</h1>
          <p className="text-gray-600">Uyarı e-postalarının gönderileceği adresler ve SMTP sunucu ayarları</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SMTP Sunucu Ayarları */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">SMTP Sunucu Ayarları</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>{isEditing ? 'İptal' : 'Düzenle'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Sunucu</label>
                  <input
                    type="text"
                    value={smtpConfig.server}
                    onChange={(e) => handleConfigChange('server', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                  <input
                    type="text"
                    value={smtpConfig.port}
                    onChange={(e) => handleConfigChange('port', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={smtpConfig.username}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <input
                  type="password"
                  value={smtpConfig.password}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gönderen E-posta</label>
                  <input
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gönderen Adı</label>
                  <input
                    type="text"
                    value={smtpConfig.fromName}
                    onChange={(e) => handleConfigChange('fromName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={smtpConfig.useTLS}
                    onChange={(e) => handleConfigChange('useTLS', e.target.checked)}
                    disabled={!isEditing}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">TLS Kullan</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={smtpConfig.useSSL}
                    onChange={(e) => handleConfigChange('useSSL', e.target.checked)}
                    disabled={!isEditing}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">SSL Kullan</span>
                </label>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>İptal</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Kaydet</span>
                  </button>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleTestConnection}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Bağlantıyı Test Et</span>
                </button>
                <button
                  onClick={handleSendTestEmail}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Test E-postası Gönder</span>
                </button>
              </div>
            </div>
          </div>

          {/* E-posta Adresleri */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">E-posta Adresleri</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>E-posta Ekle</span>
              </button>
            </div>

            {/* Yeni E-posta Ekleme Formu */}
            {showAddForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-800 mb-4">Yeni E-posta Adresi Ekle</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">E-posta Adresi</label>
                    <input
                      type="email"
                      value={newEmail.email}
                      onChange={(e) => setNewEmail(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ornek@company.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      value={newEmail.name}
                      onChange={(e) => setNewEmail(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ad Soyad"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={handleAddEmail}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ekle
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {/* E-posta Listesi */}
            <div className="space-y-3">
              {emailAddresses.map((email) => (
                <div
                  key={email.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    email.isActive 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Mail className={`w-5 h-5 ${email.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{email.name}</p>
                      <p className="text-sm text-gray-600">{email.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(email.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        email.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {email.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(email.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Özet Bilgi */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">E-posta Özeti</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Toplam Adres:</span>
                  <span className="ml-2 font-medium text-blue-900">{emailAddresses.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Aktif Adres:</span>
                  <span className="ml-2 font-medium text-blue-900">{activeEmails.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMTPPage;
