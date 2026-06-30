import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <div className="loading-screen">Caricamento...</div>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
