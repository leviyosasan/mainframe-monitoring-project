import { useState, useEffect } from 'react'
import { Save, Shield, Users as UsersIcon, Search, CheckSquare, Square, ChevronDown, ChevronRight, Lock, Unlock } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const AdminPermissionManagementPage = () => {
  const { users, availablePages, isLoading, updatePermissions, isUpdating } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [localPermissions, setLocalPermissions] = useState({})
  const [hasChanges, setHasChanges] = useState({})
  const [expandedUsers, setExpandedUsers] = useState(new Set())

  // Local permissions state'ini başlat
  useEffect(() => {
    if (users.length > 0) {
      const initialPermissions = {}
      users.forEach((user) => {
        initialPermissions[user.userId] = {}
        user.permissions.forEach((perm) => {
          initialPermissions[user.userId][perm.pageId] = perm.hasAccess
        })
      })
      setLocalPermissions(initialPermissions)
    }
  }, [users])

  // Arama filtresi
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    )
  })

  // Accordion toggle
  const toggleUser = (userId) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // İzin sayısını hesapla
  const getPermissionCount = (userId) => {
    const userPerms = localPermissions[userId] || {}
    const user = users.find((u) => u.userId === userId)
    if (!user) return 0

    let count = 0
    availablePages.forEach((page) => {
      const hasAccess =
        userPerms[page.id] !== undefined
          ? userPerms[page.id]
          : user.permissions.find((p) => p.pageId === page.id)?.hasAccess ?? false
      if (hasAccess) count++
    })
    return count
  }

  // İzin değiştir
  const handlePermissionChange = (userId, pageId, hasAccess) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [pageId]: hasAccess,
      },
    }))
    setHasChanges((prev) => ({
      ...prev,
      [userId]: true,
    }))
  }

  // Kullanıcı izinlerini kaydet
  const handleSavePermissions = (userId) => {
    const userPermissions = localPermissions[userId] || {}
    const permissions = Object.keys(userPermissions).map((pageId) => ({
      pageId,
      hasAccess: userPermissions[pageId],
    }))

    updatePermissions(
      { userId, permissions },
      {
        onSuccess: () => {
          setHasChanges((prev) => ({
            ...prev,
            [userId]: false,
          }))
        },
      }
    )
  }

  // Kullanıcı için tüm izinleri seç/kaldır
  const handleToggleAllPermissions = (userId, selectAll) => {
    const newPermissions = {}
    availablePages.forEach((page) => {
      newPermissions[page.id] = selectAll
    })

    setLocalPermissions((prev) => ({
      ...prev,
      [userId]: newPermissions,
    }))
    setHasChanges((prev) => ({
      ...prev,
      [userId]: true,
    }))
  }

  // Tüm değişiklikleri kaydet
  const handleSaveAll = () => {
    Object.keys(hasChanges).forEach((userId) => {
      if (hasChanges[userId]) {
        handleSavePermissions(parseInt(userId))
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Yetkilendirme Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kullanıcıların sayfa erişim izinlerini yönetin
          </p>
        </div>
        {Object.keys(hasChanges).some((userId) => hasChanges[userId]) && (
          <button
            onClick={handleSaveAll}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Tümünü Kaydet
          </button>
        )}
      </div>

      {/* İstatistik */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Kullanıcı ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
        />
      </div>

      {/* Users List - Accordion */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kullanıcı bulunmuyor'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userPerms = localPermissions[user.userId] || {}
            const hasUserChanges = hasChanges[user.userId] || false
            const isExpanded = expandedUsers.has(user.userId)
            const permissionCount = getPermissionCount(user.userId)

            return (
              <div
                key={user.userId}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-sm"
              >
                {/* User Header - Clickable */}
                <div
                  onClick={() => toggleUser(user.userId)}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {user.firstName?.[0] || ''}
                          {user.lastName?.[0] || ''}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                          {permissionCount > 0 ? (
                            <Unlock className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          <span className="text-xs font-medium text-gray-700">
                            {permissionCount} / {availablePages.length}
                          </span>
                        </div>
                        {hasUserChanges && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions Panel - Expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4">
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleAllPermissions(user.userId, true)
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                            Tümünü Seç
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleAllPermissions(user.userId, false)
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Square className="w-3.5 h-3.5 mr-1.5" />
                            Tümünü Kaldır
                          </button>
                        </div>
                        {hasUserChanges && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSavePermissions(user.userId)
                            }}
                            disabled={isUpdating}
                            className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            Kaydet
                          </button>
                        )}
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {availablePages.map((page) => {
                          const hasAccess =
                            userPerms[page.id] !== undefined
                              ? userPerms[page.id]
                              : user.permissions.find((p) => p.pageId === page.id)?.hasAccess ??
                                false

                          return (
                            <label
                              key={page.id}
                              onClick={(e) => e.stopPropagation()}
                              className={`flex items-center gap-2 p-2.5 border rounded-md cursor-pointer transition-all ${
                                hasAccess
                                  ? 'border-primary-300 bg-primary-50'
                                  : 'border-gray-200 bg-white'
                              } hover:border-primary-400 hover:bg-primary-100`}
                            >
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={(e) =>
                                  handlePermissionChange(user.userId, page.id, e.target.checked)
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-xs font-medium text-gray-700">
                                {page.name}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminPermissionManagementPage

