import { useState } from 'react'
import api from '../api/axios'

function EmployerDashboard() {
  const [jobs, setJobs] = useState([
    {
      id: 101,
      title: 'Residential Electrician',
      trade: 'Electrical',
      city: 'Nairobi',
      description: 'Install and maintain wiring for new residential builds.',
      shortlist: [
        { id: 1, name: 'Maya Patel', trade: 'Electrical', trustScore: 86, city: 'Nairobi' },
        { id: 2, name: 'Dennis Owino', trade: 'Electrical', trustScore: 79, city: 'Thika' },
      ],
    },
    {
      id: 102,
      title: 'Waterproofing Specialist',
      trade: 'Masonry',
      city: 'Mombasa',
      description: 'Lead waterproofing for commercial foundations.',
      shortlist: [
        { id: 3, name: 'Amina Hassan', trade: 'Masonry', trustScore: 91, city: 'Mombasa' },
      ],
    },
  ])
  const [activeJobId, setActiveJobId] = useState(jobs[0]?.id || null)
  const [formState, setFormState] = useState({
    title: '',
    trade: '',
    city: '',
    description: '',
  })
  const [formStatus, setFormStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormStatus('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/api/employer/jobs', formState)
      const newJob = response.data?.job || {
        id: Date.now(),
        ...formState,
        shortlist: [],
      }
      setJobs((prev) => [newJob, ...prev])
      setFormState({ title: '', trade: '', city: '', description: '' })
      setActiveJobId(newJob.id)
      setFormStatus('Job posted successfully.')
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
        <div className="max-w-6xl mx-auto px-6 py-5">
          <p className="text-sm text-slate-500">Employer Dashboard</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manage your jobs</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">Post a new job</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700">Job Title</label>
              <input
                name="title"
                value={formState.title}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Senior Plumber"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Trade</label>
              <input
                name="trade"
                value={formState.trade}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Plumbing"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">City</label>
              <input
                name="city"
                value={formState.city}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Kisumu"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Job Description
              </label>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleChange}
                rows="3"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Describe responsibilities and requirements"
                required
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
            <h2 className="text-lg font-semibold text-slate-900">Your job postings</h2>
            <div className="mt-4 space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-slate-100 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500">
                        {job.trade} · {job.city}
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
                  <p className="text-sm text-slate-600 mt-3">{job.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900">Shortlisted workers</h2>
            {activeJob ? (
              <div className="mt-4 space-y-4">
                {activeJob.shortlist.length ? (
                  activeJob.shortlist.map((worker) => (
                    <div
                      key={worker.id}
                      className="border border-slate-100 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{worker.name}</p>
                        <p className="text-sm text-slate-500">
                          {worker.trade} · {worker.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          TrustScore
                        </p>
                        <p className="text-lg font-semibold text-emerald-600">
                          {worker.trustScore}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No workers shortlisted yet.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a job to view its shortlist.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default EmployerDashboard
