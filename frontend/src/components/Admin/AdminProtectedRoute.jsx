import { Navigate } from 'react-router-dom'
import { useAdminAuthStore } from '../../store/adminAuthStore'

const AdminProtectedRoute = ({ children }) => {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default AdminProtectedRoute

