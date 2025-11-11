import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useUserPermissions } from '../../hooks/useUserPermissions'
import LoadingSpinner from '../Common/LoadingSpinner'
import toast from 'react-hot-toast'

/**
 * Sayfa bazlı izin kontrolü yapan Protected Route
 */
const PermissionProtectedRoute = ({ children, pageId }) => {
  const { hasPermission, isLoading, isAdmin } = useUserPermissions()
  const location = useLocation()

  useEffect(() => {
    // İzinsiz erişim denemesi varsa toast göster
    if (location.state?.unauthorized) {
      toast.error('Bu sayfaya erişim izniniz bulunmamaktadır')
    }
  }, [location.state])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Admin her zaman erişebilir
  if (isAdmin) {
    return children
  }

  // Sayfa ID verilmişse izin kontrolü yap
  if (pageId && !hasPermission(pageId)) {
    toast.error('Bu sayfaya erişim izniniz bulunmamaktadır')
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PermissionProtectedRoute

