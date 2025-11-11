import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useEffect } from 'react'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuthStore()

  useEffect(() => {
    // AccessToken varsa isAuthenticated'ı true yap
    if (accessToken && !isAuthenticated) {
      useAuthStore.setState({ isAuthenticated: true })
    }
  }, [accessToken, isAuthenticated])

  // AccessToken veya isAuthenticated kontrolü
  // Eğer accessToken varsa, kullanıcı authenticated kabul edilir
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children || <Outlet />
}

export default ProtectedRoute

