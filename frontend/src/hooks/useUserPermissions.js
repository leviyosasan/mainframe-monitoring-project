import { useQuery } from 'react-query'
import { useAuthStore } from '../store/authStore'
import permissionService from '../services/permissionService'

/**
 * Kullanıcının izinlerini getir ve kontrol et
 */
export const useUserPermissions = () => {
  const { user } = useAuthStore()

  // Admin her zaman tüm izinlere sahip
  const isAdmin = user?.role === 'admin'

  const { data, isLoading, error } = useQuery(
    ['userPermissions', user?.id],
    () => permissionService.getMyPermissions(),
    {
      enabled: !!user?.id,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 dakika cache
    }
  )

  // İzinleri map'le
  const permissions = {}
  let hasAllAccess = isAdmin || data?.data?.hasAllAccess || false

  if (!isAdmin && data?.data?.permissions) {
    data.data.permissions.forEach((perm) => {
      permissions[perm.pageId] = perm.hasAccess
    })
  }

  // Belirli bir sayfaya erişim izni kontrolü
  const hasPermission = (pageId) => {
    if (isAdmin) return true
    if (hasAllAccess) return true
    // Sadece açıkça true olan izinlere erişim ver (default false)
    return permissions[pageId] === true
  }

  return {
    permissions,
    hasAllAccess,
    hasPermission,
    isLoading,
    error,
    isAdmin,
  }
}

