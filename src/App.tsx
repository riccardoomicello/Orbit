import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AppuntamentiPage from './pages/AppuntamentiPage'
import RoutinePage from './pages/RoutinePage'
import FinanzaPage from './pages/FinanzaPage'
import ExtraPage from './pages/ExtraPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="appuntamenti" element={<AppuntamentiPage />} />
                <Route path="routine" element={<RoutinePage />} />
                <Route path="finanza" element={<FinanzaPage />} />
                <Route path="extra" element={<ExtraPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
