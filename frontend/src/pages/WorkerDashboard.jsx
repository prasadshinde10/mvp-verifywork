import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import TrustScoreCard from '../components/TrustScoreCard'

const documentTypes = [
  { label: 'Aadhaar', value: 'aadhaar' },
  { label: 'ITI Certificate', value: 'iti_cert' },
  { label: 'Skill Certificate', value: 'skill_cert' },
  { label: 'Reference Letter', value: 'reference' },
]

const DEFAULT_BREAKDOWN = {
  aadhaar: { points: 0 },
  iti_cert: { points: 0 },
  skill_or_experience: { points: 0 },
  reference: { points: 0 },
}

const docTypeLabels = {
  aadhaar: 'Aadhaar',
  iti_cert: 'ITI Certificate',
  skill_cert: 'Skill Certificate',
  reference: 'Reference Letter',
}

const formatDocType = (docType) => docTypeLabels[docType] || docType || 'Document'

const formatStatus = (status) => {
  const normalized = (status || '').toString().trim().toLowerCase()
  if (normalized === 'approved') {
    return 'Approved'
  }
  if (normalized === 'rejected') {
    return 'Rejected'
  }
  return 'Pending'
}

const formatDate = (value) => {
  if (!value) {
    return 'N/A'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const normalizeBreakdown = (raw) => {
  if (!raw) {
    return DEFAULT_BREAKDOWN
  }
  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_BREAKDOWN
  }
  return {
    aadhaar: parsed.aadhaar || DEFAULT_BREAKDOWN.aadhaar,
    iti_cert: parsed.iti_cert || DEFAULT_BREAKDOWN.iti_cert,
    skill_or_experience:
      parsed.skill_or_experience || DEFAULT_BREAKDOWN.skill_or_experience,
    reference: parsed.reference || DEFAULT_BREAKDOWN.reference,
  }
}

const formatDocument = (doc) => ({
  id: doc.id,
  type: formatDocType(doc.doc_type),
  status: formatStatus(doc.status),
  createdAt: formatDate(doc.created_at),
})

function WorkerDashboard() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [selectedType, setSelectedType] = useState(documentTypes[0].value)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [trustScore, setTrustScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState(DEFAULT_BREAKDOWN)

  const workerName = localStorage.getItem('userName') || 'Worker'
  const userEmail = localStorage.getItem('userEmail') || ''

  const layers = useMemo(
    () => [
      { label: 'Aadhaar', value: scoreBreakdown.aadhaar?.points ?? 0 },
      { label: 'ITI Certificate', value: scoreBreakdown.iti_cert?.points ?? 0 },
      {
        label: 'Skills/Experience',
        value: scoreBreakdown.skill_or_experience?.points ?? 0,
      },
      { label: 'Reference', value: scoreBreakdown.reference?.points ?? 0 },
    ],
    [scoreBreakdown],
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    navigate('/login', { replace: true })
  }

  const ensureProfile = useCallback(async () => {
    try {
      const response = await api.get('/api/worker/profile')
      return response.data
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err
      }
      const fallbackName = userEmail ? userEmail.split('@')[0] : workerName
      const createPayload = {
        full_name: workerName || fallbackName || 'Worker',
        trade: 'General',
        city: 'Nairobi',
        years_experience: 0,
      }
      const created = await api.post('/api/worker/profile', createPayload)
      return created.data
    }
  }, [userEmail, workerName])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const profile = await ensureProfile()
      setTrustScore(profile?.trust_score ?? 0)
      setScoreBreakdown(normalizeBreakdown(profile?.score_breakdown))
      const documentsResponse = await api.get('/api/worker/documents')
      setDocuments((documentsResponse.data || []).map(formatDocument))
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to load dashboard data.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [ensureProfile])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!selectedFile) {
      setUploadStatus('Please select a file to upload.')
      return
    }

    setIsUploading(true)
    setUploadStatus('')

    try {
      const formData = new FormData()
      formData.append('doc_type', selectedType)
      formData.append('file', selectedFile)

      const response = await api.post('/api/worker/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data) {
        setDocuments((prev) => [formatDocument(response.data), ...prev])
      }
      setSelectedFile(null)
      setUploadStatus('Document uploaded and pending verification.')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Upload failed. Please try again.'
      setUploadStatus(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Worker Dashboard</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome, {workerName}
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

        <TrustScoreCard score={trustScore} layers={layers} />

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Document Status
              </h2>
              {isLoading ? (
                <span className="text-xs text-slate-500">Loading...</span>
              ) : null}
            </div>
            <ul className="mt-4 space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{doc.type}</p>
                    <p className="text-xs text-slate-500">
                      Submitted {doc.createdAt}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      doc.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : doc.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {doc.status}
                  </span>
                </li>
              ))}
            </ul>
            {!documents.length && !isLoading ? (
              <p className="mt-4 text-sm text-slate-500">No documents uploaded yet.</p>
            ) : null}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Upload New Document
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleUpload}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Document Type
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">File</label>
                <input
                  type="file"
                  className="mt-2 w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </div>
              {uploadStatus ? (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  {uploadStatus}
                </div>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 transition disabled:opacity-60"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default WorkerDashboard
