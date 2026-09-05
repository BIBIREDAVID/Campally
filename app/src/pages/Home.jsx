import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { role, loading } = useAuth()

  if (loading) return <div className="screen-loading">Loading...</div>

  return <Navigate to={role === 'admin' ? '/admin/complaints' : '/student/complaints'} replace />
}
