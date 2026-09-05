import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { profile, role, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">Campus Portal</span>
        <nav>
          <NavLink to={role === 'admin' ? '/admin/complaints' : '/student/complaints'}>Complaints</NavLink>
          <NavLink to={role === 'admin' ? '/admin/announcements' : '/student/announcements'}>Announcements</NavLink>
          <NavLink to={role === 'admin' ? '/admin/events' : '/student/events'}>Events</NavLink>
        </nav>
        <div className="user-info">
          <span>{profile?.name ?? '...'} ({role})</span>
          <button onClick={() => signOut()}>Log out</button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
