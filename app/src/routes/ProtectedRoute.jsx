import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ allowedRole }) {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="screen-loading">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />
  }

  return <Outlet />
}
