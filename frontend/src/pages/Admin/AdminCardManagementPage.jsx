import { useState, useEffect } from 'react'
import { Eye, EyeOff, RefreshCw, Plus, Edit2, Trash2, X, Save } from 'lucide-react'

const AdminCardManagementPage = () => {
  // Varsayılan kartlar
  const defaultCards = [
    { id: 'zos', title: 'z/OS', icon: '🖥️', path: '/zos', visible: true },
    { id: 'cics', title: 'CICS', icon: '⚡', path: '/cics', visible: true },
    { id: 'db2', title: 'DB2', icon: '🗄️', path: '/db2', visible: true },
    { id: 'ims', title: 'IMS', icon: '📊', path: '/ims', visible: true },
    { id: 'mq', title: 'MQ', icon: '📨', path: '/mq', visible: true },
    { id: 'network', title: 'Network', icon: '🌐', path: '/network', visible: true },
    { id: 'storage', title: 'Storage', icon: '💾', path: '/storage', visible: true },
    { id: 'uss', title: 'USS', icon: '🐧', path: '/uss', visible: true },
    { id: 'rmf', title: 'CMF', icon: '📋', path: '/rmf', visible: true }
  ]

  // Kartları localStorage'dan yükle
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('dashboard-cards')
    return saved ? JSON.parse(saved) : defaultCards
  })

  // Modal state'leri
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    icon: '🔧',
    path: '',
    visible: true
  })

  // Popüler emoji listesi
  const popularEmojis = [
    '🖥️', '⚡', '🗄️', '📊', '📨', '🌐', '💾', '🐧', '📋',
    '🔧', '⚙️', '🛠️', '📡', '🔌', '💻', '🖨️', '📱', '⌨️',
    '🌟', '🚀', '💡', '🔥', '⭐', '✨', '🎯', '📈', '📉'
  ]

  // Kartları kaydet
  useEffect(() => {
    localStorage.setItem('dashboard-cards', JSON.stringify(cards))
  }, [cards])

  // Form değişikliklerini yakala
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Yeni kart ekle
  const handleAddCard = () => {
    if (!formData.title || !formData.path) {
      alert('Lütfen tüm alanları doldurun!')
      return
    }

    const newCard = {
      id: formData.title.toLowerCase().replace(/\s+/g, '-'),
      ...formData
    }

    setCards(prev => [...prev, newCard])
    setShowAddModal(false)
    setFormData({ title: '', icon: '🔧', path: '', visible: true })
  }

  // Kartı düzenle
  const handleEditCard = (card) => {
    setEditingCard(card)
    setFormData({
      title: card.title,
      icon: card.icon,
      path: card.path,
      visible: card.visible
    })
  }

  // Düzenlemeyi kaydet
  const handleSaveEdit = () => {
    if (!formData.title || !formData.path) {
      alert('Lütfen tüm alanları doldurun!')
      return
    }

    setCards(prev => prev.map(card => 
      card.id === editingCard.id 
        ? { ...card, ...formData }
        : card
    ))
    setEditingCard(null)
    setFormData({ title: '', icon: '🔧', path: '', visible: true })
  }

  // Kartı sil
  const handleDeleteCard = (cardId) => {
    if (confirm('Bu kartı silmek istediğinizden emin misiniz?')) {
      setCards(prev => prev.filter(card => card.id !== cardId))
    }
  }

  // Görünürlüğü değiştir
  const toggleCardVisibility = (cardId) => {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ))
  }

  // Tüm kartları göster/gizle
  const showAllCards = () => {
    setCards(prev => prev.map(card => ({ ...card, visible: true })))
  }

  const hideAllCards = () => {
    setCards(prev => prev.map(card => ({ ...card, visible: false })))
  }

  // Varsayılana sıfırla
  const resetToDefault = () => {
    if (confirm('Tüm değişiklikler silinecek ve varsayılan kartlara dönülecek. Emin misiniz?')) {
      setCards(defaultCards)
    }
  }

  // İstatistikler
  const visibleCount = cards.filter(c => c.visible).length
  const hiddenCount = cards.filter(c => !c.visible).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kart Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Toplam: <span className="font-medium">{cards.length}</span> • 
            Görünür: <span className="text-green-600 font-medium">{visibleCount}</span> • 
            Gizli: <span className="text-red-600 font-medium">{hiddenCount}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kart</span>
          </button>
          <button
            onClick={hideAllCards}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            <span>Tümünü Gizle</span>
          </button>
          <button
            onClick={showAllCards}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Tümünü Göster</span>
          </button>
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Kart Grid */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`relative border-2 rounded-lg p-3 transition-all group ${
                card.visible
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-red-200 bg-red-50/50 opacity-50'
              }`}
            >
              {/* Action Buttons */}
              <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditCard(card)}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Düzenle"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Sil"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-col items-center space-y-2">
                {/* Icon */}
                <span className="text-3xl">{card.icon}</span>

                {/* Title */}
                <span className="font-medium text-gray-900 text-center text-sm">{card.title}</span>

                {/* Path */}
                <span className="text-xs text-gray-500">{card.path}</span>
                
                {/* Toggle Button */}
                <button
                  onClick={() => toggleCardVisibility(card.id)}
                  className={`w-full flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    card.visible
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {card.visible ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Gizle</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Göster</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCard) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCard ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingCard(null)
                  setFormData({ title: '', icon: '🔧', path: '', visible: true })
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kart İsmi
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="örn: PostgreSQL"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon Seçin
                </label>
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="text-center mb-2">
                    <span className="text-5xl">{formData.icon}</span>
                  </div>
                  <div className="grid grid-cols-9 gap-1">
                    {popularEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                        className={`text-2xl p-1 rounded hover:bg-gray-100 ${
                          formData.icon === emoji ? 'bg-primary-100 ring-2 ring-primary-500' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full mt-2 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="veya emoji yapıştırın"
                  />
                </div>
              </div>

              {/* Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sayfa Yolu (Path)
                </label>
                <input
                  type="text"
                  name="path"
                  value={formData.path}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="örn: /postgresql"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCard(null)
                    setFormData({ title: '', icon: '🔧', path: '', visible: true })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={editingCard ? handleSaveEdit : handleAddCard}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCard ? 'Kaydet' : 'Ekle'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCardManagementPage
