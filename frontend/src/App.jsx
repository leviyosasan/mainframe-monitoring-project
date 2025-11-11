import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import PermissionProtectedRoute from './components/Auth/PermissionProtectedRoute'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ZOSPage from './pages/Systems/ZOSPage'
import CICSPage from './pages/Systems/CICSPage'
import DB2Page from './pages/Systems/DB2Page'
import IMSPage from './pages/Systems/IMSPage'
import MQPage from './pages/Systems/MQPage'
import NetworkPage from './pages/Systems/NetworkPage'
import StoragePage from './pages/Systems/StoragePage'
import USSPage from './pages/Systems/USSPage'
import RMFPage from './pages/Systems/RMFPage'
import PostgreSQLPage from './pages/Systems/PostgreSQLPage'
import MSSQLPage from './pages/Systems/MSSQLPage'
import AllDatabasesPage from './pages/Systems/AllDatabasesPage'
import AlertsPage from './pages/Alerts/AlertsPage'
import SMTPPage from './pages/SMTP/SMTPPage'
import AnalizPage from './pages/Analiz/AnalizPage'
import OzellestirPage from './pages/Ozellestir/OzellestirPage'
import ProfilePage from './pages/Profile/ProfilePage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import LoginSelectionPage from './pages/Auth/LoginSelectionPage'

// Admin imports
import AdminLoginPage from './pages/Admin/AdminLoginPage'
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import AdminCardManagementPage from './pages/Admin/AdminCardManagementPage'
import AdminUserManagementPage from './pages/Admin/AdminUserManagementPage'
import AdminPermissionManagementPage from './pages/Admin/AdminPermissionManagementPage'
import AdminLayout from './components/Admin/AdminLayout'
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Auth Routes - Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="card-management" element={<AdminCardManagementPage />} />
        <Route path="user-management" element={<AdminUserManagementPage />} />
        <Route path="permission-management" element={<AdminPermissionManagementPage />} />
      </Route>

      {/* Main Login Selection Page */}
      <Route path="/" element={<LoginSelectionPage />} />

      {/* User Routes - Protected */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route 
          path="zos" 
          element={
            <PermissionProtectedRoute pageId="zos">
              <ZOSPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="cics" 
          element={
            <PermissionProtectedRoute pageId="cics">
              <CICSPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="db2" 
          element={
            <PermissionProtectedRoute pageId="db2">
              <DB2Page />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="ims" 
          element={
            <PermissionProtectedRoute pageId="ims">
              <IMSPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="mq" 
          element={
            <PermissionProtectedRoute pageId="mq">
              <MQPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="network" 
          element={
            <PermissionProtectedRoute pageId="network">
              <NetworkPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="storage" 
          element={
            <PermissionProtectedRoute pageId="storage">
              <StoragePage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="uss" 
          element={
            <PermissionProtectedRoute pageId="uss">
              <USSPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="rmf" 
          element={
            <PermissionProtectedRoute pageId="rmf">
              <RMFPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="postgresql" 
          element={
            <PermissionProtectedRoute pageId="postgresql">
              <PostgreSQLPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="mssql" 
          element={
            <PermissionProtectedRoute pageId="mssql">
              <MSSQLPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="databases" 
          element={
            <PermissionProtectedRoute pageId="databases">
              <AllDatabasesPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="smtp" 
          element={
            <PermissionProtectedRoute pageId="smtp">
              <SMTPPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="alerts" 
          element={
            <PermissionProtectedRoute pageId="alerts">
              <AlertsPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="analiz" 
          element={
            <PermissionProtectedRoute pageId="analiz">
              <AnalizPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route 
          path="ozellestir" 
          element={
            <PermissionProtectedRoute pageId="ozellestir">
              <OzellestirPage />
            </PermissionProtectedRoute>
          } 
        />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App

