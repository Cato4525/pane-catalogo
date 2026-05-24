import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '../../routes/ProtectedRoute'
import StorePage from '../../pages/store/Tienda'
import LoginPage from '../../modules/admin/auth/pages/LoginPage'
import AdminLayout from '../../layouts/AdminLayout/AdminLayout'
import DashboardPage from '../../modules/admin/dashboard/pages/DashboardPage'
import ProductsPage from '../../modules/admin/products/pages/ProductsPage'
import CategoriesPage from '../../modules/admin/categories/pages/CategoriesPage'
import ConsultasPage from '../../modules/admin/consultas/pages/ConsultasPage'
import ReservasPage from '../../modules/admin/reservas/pages/ReservasPage'
import VentasPage from '../../modules/admin/ventas/pages/VentasPage'
import PosPage from '../../modules/admin/pos/pages/PosPage'
import ReservasPOSPage from '../../modules/admin/reservas-pos/pages/ReservasPOSPage'
import ClientsPage from '../../modules/admin/clients/pages/ClientsPage'
import ReportsPage from '../../modules/admin/reports/pages/ReportsPage'
import InventoryPage from '../../modules/admin/inventory/pages/InventoryPage'
import SettingsPage from '../../modules/admin/settings/pages/SettingsPage'
import UsersPage from '../../modules/admin/users/pages/UsersPage'
import { useAuthStore } from '../../store/authStore'

function AdminRoute() {
  const user = useAuthStore((state) => state.user)
  return user?.rol === 'admin' || user?.rol === 'gerente' || user?.rol === 'soporte' 
    ? <AdminLayout><Outlet /></AdminLayout> 
    : <Navigate to="/admin/dashboard" replace />
}

function VendedorRoute() {
  const user = useAuthStore((state) => state.user)
  return (user?.rol === 'admin' || user?.rol === 'vendedor' || user?.rol === 'gerente') ? <AdminLayout><Outlet /></AdminLayout> : <Navigate to="/admin/dashboard" replace />
}

function ReportesRoute() {
  const user = useAuthStore((state) => state.user)
  return (user?.rol === 'admin' || user?.rol === 'reportes') ? <AdminLayout><Outlet /></AdminLayout> : <Navigate to="/admin/dashboard" replace />
}

function DashboardRoute() {
  const user = useAuthStore((state) => state.user)
  return user ? <AdminLayout><Outlet /></AdminLayout> : <Navigate to="/admin/login" replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tienda" replace />} />
      <Route path="/tienda" element={<StorePage />} />
      
      <Route element={<PublicRoute />}>
        <Route path="/admin/login" element={<LoginPage />} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route element={<DashboardRoute />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
        </Route>
        
        <Route element={<AdminRoute />}>
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/categorias" element={<CategoriesPage />} />
          <Route path="/admin/consultas" element={<ConsultasPage />} />
          <Route path="/admin/reservas" element={<ReservasPage />} />
          <Route path="/admin/configuracion" element={<SettingsPage />} />
          <Route path="/admin/usuarios" element={<UsersPage />} />
        </Route>
        
        <Route element={<VendedorRoute />}>
          <Route path="/admin/ventas" element={<VentasPage />} />
          <Route path="/admin/pos" element={<PosPage />} />
          <Route path="/admin/reservas-pos" element={<ReservasPOSPage />} />
          <Route path="/admin/clientes" element={<ClientsPage />} />
        </Route>
        
        <Route element={<ReportesRoute />}>
          <Route path="/admin/reportes" element={<ReportsPage />} />
          <Route path="/admin/inventario" element={<InventoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/tienda" replace />} />
    </Routes>
  )
}
