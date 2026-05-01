import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const docTypeLabels = {
  aadhaar: 'Aadhaar',
  iti_cert: 'ITI Certificate',
  skill_cert: 'Skill Certificate',
  reference: 'Reference Letter',
}

const formatDocType = (docType) => docTypeLabels[docType] || docType || 'Document'

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

function AdminPanel() {
  const navigate = useNavigate()
  const [pendingDocs, setPendingDocs] = useState([])
  const [actionStatus, setActionStatus] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    navigate('/login', { replace: true })
  }

  const loadPendingDocuments = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const response = await api.get('/api/admin/documents/pending')
      setPendingDocs(response.data || [])
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to load pending documents.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPendingDocuments()
  }, [])

  const handleAction = async (docId, status) => {
    setProcessingId(docId)
    setActionStatus('')

    try {
      await api.patch(`/api/admin/documents/${docId}/review`, { status })
      setPendingDocs((prev) => prev.filter((doc) => doc.id !== docId))
      setActionStatus(`Document ${status === 'approved' ? 'approved' : 'rejected'}.`)
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to update document status.'
      setActionStatus(message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Admin Panel</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Pending document reviews
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Documents queue</h2>
            <span className="text-sm text-slate-500">
              {pendingDocs.length} pending
            </span>
          </div>

          {loadError ? (
            <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {actionStatus ? (
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600">
              {actionStatus}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Worker</th>
                  <th className="py-2 pr-4 font-medium">Document Type</th>
                  <th className="py-2 pr-4 font-medium">Submitted</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td className="py-3 pr-4 text-slate-900 font-medium">
                      {doc.worker_name || 'Worker'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDocType(doc.doc_type)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 font-medium hover:bg-emerald-100 disabled:opacity-60"
                        onClick={() => handleAction(doc.id, 'approved')}
                        disabled={processingId === doc.id}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 font-medium hover:bg-rose-100 disabled:opacity-60"
                        onClick={() => handleAction(doc.id, 'rejected')}
                        disabled={processingId === doc.id}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pendingDocs.length && !isLoading ? (
              <p className="mt-4 text-sm text-slate-500">No pending documents.</p>
            ) : null}
            {isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading documents...</p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPanel
