import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PermissionsProvider } from './contexts/PermissionsContext'
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import ClientsList from './pages/ClientsList'
import ClientsWithVehicles from './pages/ClientsWithVehicles'
import Establishments from './pages/Establishments'
import CompanySettings from './pages/CompanySettings'
import Users from './pages/Users'
import Services from './pages/Services'
import VehicleCategories from './pages/VehicleCategories'
import NewUser from './pages/NewUser'
import NewClient from './pages/NewClient'
import Reminders from './pages/Reminders'
import Appointments from './pages/Appointments'
import Operational from './pages/Operational'
import OperationalHistory from './pages/OperationalHistory'
import Products from './pages/Products'
import NewProduct from './pages/NewProduct'
import Suppliers from './pages/Suppliers'
import PaymentMethods from './pages/PaymentMethods'
import Payroll from './pages/Payroll'
import Commissions from './pages/Commissions'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import { Layout } from './components/layout/Layout'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuperAdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientsWithVehicles />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CompanySettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/estabelecimento"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Establishments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/servicos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Services />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias-veiculos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleCategories />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/novo-usuario"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewUser />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/novo-cliente"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewClient />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lembretes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reminders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agendamentos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Appointments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/operacional"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Operational />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OperationalHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fornecedores"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suppliers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/novo-produto"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewProduct />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meios-pagamento"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentMethods />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/folha-pagamento"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Payroll />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissionamento"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Commissions />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback - redireciona para dashboard se logado, senão para home */}
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </PermissionsProvider>
    </AuthProvider>
  )
}

export default App
