import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      })

      const token = response.data?.token
      const role = response.data?.role || response.data?.user?.role
      const name = response.data?.user?.name || response.data?.user?.fullName

      if (token) {
        localStorage.setItem('token', token)
      }
      if (role) {
        localStorage.setItem('userRole', role)
      }
      if (name) {
        localStorage.setItem('userName', name)
      }

      const normalizedRole = role?.toLowerCase()
      const destination =
        normalizedRole === 'worker'
          ? '/worker'
          : normalizedRole === 'employer'
            ? '/employer'
            : normalizedRole === 'admin'
              ? '/admin'
              : '/login'

      if (!token || destination === '/login') {
        setError('Unable to determine your role. Please contact support.')
        return
      }

      navigate(destination)
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please check your credentials.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-slate-500 mt-2">
          Sign in to manage your VerifyWork account.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error ? (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 transition disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6">
          Need an account?{' '}
          <Link className="text-slate-900 font-medium" to="/register">
            Register now
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
