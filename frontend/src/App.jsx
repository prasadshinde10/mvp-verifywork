import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPanel from './pages/AdminPanel'
import EmployerDashboard from './pages/EmployerDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkerDashboard from './pages/WorkerDashboard'

const roleHome = {
  worker: '/worker',
  employer: '/employer',
  admin: '/admin',
}

const getRoleFromToken = (token) => {
  if (!token) {
    return null
  }

  const tokenParts = token.split('.')
  if (tokenParts.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(atob(tokenParts[1]))
    return payload?.role?.toLowerCase() || null
  } catch {
    return null
  }
}

const getStoredRole = () => {
  const storedRole = localStorage.getItem('userRole')
  if (storedRole) {
    return storedRole.toLowerCase()
  }

  return getRoleFromToken(localStorage.getItem('token'))
}

const getRoleRedirect = (role) => roleHome[role] || '/login'

const ProtectedRoute = ({ allowedRole, children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }

  const role = getStoredRole()
  if (!role) {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    return <Navigate to="/login" replace />
  }

  if (role !== allowedRole) {
    return <Navigate to={getRoleRedirect(role)} replace />
  }

  return children
}

function App() {
  const token = localStorage.getItem('token')
  const role = getStoredRole()
  const roleRedirect = token && role ? getRoleRedirect(role) : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={roleRedirect ? <Navigate to={roleRedirect} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={roleRedirect ? <Navigate to={roleRedirect} replace /> : <Register />}
        />
        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedRole="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer"
          element={
            <ProtectedRoute allowedRole="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm text-slate-500">404</p>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Page not found
                </h1>
                <p className="text-slate-500 mt-2">
                  The page you are looking for does not exist.
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App
