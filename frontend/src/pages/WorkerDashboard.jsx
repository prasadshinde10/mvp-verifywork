import { useMemo, useState } from 'react'
import api from '../api/axios'
import TrustScoreCard from '../components/TrustScoreCard'

const documentTypes = ['Government ID', 'Trade Certificate', 'Employment Proof', 'Address Proof']

function WorkerDashboard() {
  const [documents, setDocuments] = useState([
    { id: 1, type: 'Government ID', status: 'Approved', updatedAt: 'Apr 18, 2026' },
    { id: 2, type: 'Trade Certificate', status: 'Pending', updatedAt: 'Apr 22, 2026' },
    { id: 3, type: 'Employment Proof', status: 'Rejected', updatedAt: 'Apr 25, 2026' },
  ])
  const [selectedType, setSelectedType] = useState(documentTypes[0])
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const workerName = localStorage.getItem('userName') || 'Worker'

  const trustScore = useMemo(
    () => ({
      score: 78,
      layers: [
        { label: 'Identity', value: 82 },
        { label: 'Employment', value: 72 },
        { label: 'Skills', value: 88 },
        { label: 'Documents', value: 70 },
      ],
    }),
    [],
  )

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
      formData.append('documentType', selectedType)
      formData.append('file', selectedFile)

      await api.post('/api/worker/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setDocuments((prev) => [
        {
          id: Date.now(),
          type: selectedType,
          status: 'Pending',
          updatedAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          }),
        },
        ...prev,
      ])
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
        <div className="max-w-6xl mx-auto px-6 py-5">
          <p className="text-sm text-slate-500">Worker Dashboard</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome, {workerName}
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <TrustScoreCard score={trustScore.score} layers={trustScore.layers} />

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Document Status
            </h2>
            <ul className="mt-4 space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{doc.type}</p>
                    <p className="text-xs text-slate-500">Updated {doc.updatedAt}</p>
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
                    <option key={type} value={type}>
                      {type}
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
