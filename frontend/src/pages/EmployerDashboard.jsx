import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const formatNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function EmployerDashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [activeJobId, setActiveJobId] = useState(null)
  const [shortlist, setShortlist] = useState([])
  const [formState, setFormState] = useState({
    tradeRequired: 'General',
    minTrustScore: '20',
  })
  const [formStatus, setFormStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const employerName = localStorage.getItem('userName') || 'Employer'
  const userEmail = localStorage.getItem('userEmail') || ''

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    navigate('/login', { replace: true })
  }

  const ensureEmployerProfile = async () => {
    const fallbackName = userEmail ? userEmail.split('@')[0] : employerName
    const profileName = employerName || fallbackName || 'Employer'
    const payload = {
      company_name: `${profileName} Co.`,
      contact_name: profileName,
      phone: '0000000000',
      city: 'Nairobi',
    }
    try {
      await api.post('/api/employer/profile', payload)
    } catch (err) {
      if (err.response?.status === 409) {
        return
      }
      throw err
    }
  }

  const loadJobs = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const response = await api.get('/api/employer/jobs')
      const loadedJobs = response.data || []
      setJobs(loadedJobs)
      setActiveJobId((prev) => prev || loadedJobs[0]?.id || null)
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await ensureEmployerProfile()
          const response = await api.get('/api/employer/jobs')
          const loadedJobs = response.data || []
          setJobs(loadedJobs)
          setActiveJobId((prev) => prev || loadedJobs[0]?.id || null)
          return
        } catch (profileErr) {
          const message =
            profileErr.response?.data?.message ||
            profileErr.response?.data?.error ||
            'Unable to create employer profile.'
          setLoadError(message)
          return
        }
      }
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to fetch jobs.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadShortlist = async (jobId) => {
    if (!jobId) {
      setShortlist([])
      return
    }
    try {
      const response = await api.get(`/api/employer/jobs/${jobId}/shortlist`)
      setShortlist(response.data || [])
    } catch (err) {
      setShortlist([])
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (activeJobId) {
      loadShortlist(activeJobId)
    } else {
      setShortlist([])
    }
  }, [activeJobId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormStatus('')
    setIsSubmitting(true)

    try {
      const payload = {
        trade_required: formState.tradeRequired,
        min_trust_score: formState.minTrustScore,
      }
      const response = await api.post('/api/employer/jobs', payload)
      const newJob = response.data || {
        id: Date.now(),
        trade_required: formState.tradeRequired,
        min_trust_score: formatNumber(formState.minTrustScore, 0),
      }
      setJobs((prev) => [newJob, ...prev])
      setFormState({ tradeRequired: formState.tradeRequired, minTrustScore: '' })
      setActiveJobId(newJob.id)
      setFormStatus('Job posted successfully.')
      await loadShortlist(newJob.id)
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to post job. Please try again.'
      setFormStatus(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeJob = jobs.find((job) => job.id === activeJobId)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Employer Dashboard</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Manage your jobs
            </h1>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loadError ? (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">Post a new job</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Trade required
              </label>
              <input
                name="tradeRequired"
                value={formState.tradeRequired}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. General"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Minimum trust score
              </label>
              <input
                name="minTrustScore"
                value={formState.minTrustScore}
                onChange={handleChange}
                type="number"
                min="0"
                max="100"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="20"
              />
            </div>
            {formStatus ? (
              <div className="md:col-span-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600">
                {formStatus}
              </div>
            ) : null}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full md:w-auto rounded-lg bg-slate-900 text-white px-6 py-2 font-medium hover:bg-slate-800 transition disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post job'}
              </button>
            </div>
          </form>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your job postings</h2>
              {isLoading ? (
                <span className="text-xs text-slate-500">Loading...</span>
              ) : null}
            </div>
            <div className="mt-4 space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Trade: {job.trade_required || 'General'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Minimum TrustScore: {formatNumber(job.min_trust_score, 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-slate-900 hover:text-slate-700"
                      onClick={() => setActiveJobId(job.id)}
                    >
                      View shortlist
                    </button>
                  </div>
                </div>
              ))}
              {!jobs.length && !isLoading ? (
                <p className="text-sm text-slate-500">No jobs posted yet.</p>
              ) : null}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900">Shortlisted workers</h2>
            {activeJob ? (
              <div className="mt-4 space-y-4">
                {shortlist.length ? (
                  shortlist.map((worker) => (
                    <div
                      key={worker.id}
                      className="border border-slate-100 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {worker.full_name || 'Worker'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {worker.trade || 'Trade'} · {worker.city || 'City'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          TrustScore
                        </p>
                        <p className="text-lg font-semibold text-emerald-600">
                          {formatNumber(worker.trust_score, 0)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No workers shortlisted yet.</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Select a job to view its shortlist.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default EmployerDashboard
