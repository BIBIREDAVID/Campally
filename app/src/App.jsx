import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Home from './pages/Home'
import StudentComplaints from './pages/student/Complaints'
import StudentAnnouncements from './pages/student/Announcements'
import StudentEvents from './pages/student/Events'
import AdminComplaints from './pages/admin/Complaints'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminEvents from './pages/admin/Events'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route element={<Layout />}>
              <Route path="/student/complaints" element={<StudentComplaints />} />
              <Route path="/student/announcements" element={<StudentAnnouncements />} />
              <Route path="/student/events" element={<StudentEvents />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<Layout />}>
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/events" element={<AdminEvents />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
