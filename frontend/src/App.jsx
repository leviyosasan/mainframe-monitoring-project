import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
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

// Admin imports
import AdminLoginPage from './pages/Admin/AdminLoginPage'
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import AdminCardManagementPage from './pages/Admin/AdminCardManagementPage'
import AdminLayout from './components/Admin/AdminLayout'
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute'

function App() {
  return (
    <Routes>
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
      </Route>

      {/* User Routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/zos" element={<ZOSPage />} />
        <Route path="/cics" element={<CICSPage />} />
        <Route path="/db2" element={<DB2Page />} />
        <Route path="/ims" element={<IMSPage />} />
        <Route path="/mq" element={<MQPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/uss" element={<USSPage />} />
        <Route path="/rmf" element={<RMFPage />} />
        <Route path="/postgresql" element={<PostgreSQLPage />} />
        <Route path="/mssql" element={<MSSQLPage />} />
        <Route path="/databases" element={<AllDatabasesPage />} />
        <Route path="/smtp" element={<SMTPPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App

