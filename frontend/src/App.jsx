import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPanel from './pages/AdminPanel'
import EmployerDashboard from './pages/EmployerDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkerDashboard from './pages/WorkerDashboard'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/employer" element={<EmployerDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
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
