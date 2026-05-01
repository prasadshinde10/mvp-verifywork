const getScoreColor = (score) => {
  if (score >= 70) {
    return 'text-emerald-600'
  }
  if (score >= 40) {
    return 'text-amber-500'
  }
  return 'text-rose-500'
}

const getScoreRing = (score) => {
  if (score >= 70) {
    return '#10b981'
  }
  if (score >= 40) {
    return '#f59e0b'
  }
  return '#f43f5e'
}

const getStatusLabel = (score) => {
  if (score >= 80) {
    return 'Fully Trusted'
  }
  if (score >= 50) {
    return 'Partially Verified'
  }
  return 'Unverified'
}

function TrustScoreCard({ score, layers }) {
  const normalizedScore = Math.min(100, Math.max(0, score))
  const ringColor = getScoreRing(normalizedScore)
  const textColor = getScoreColor(normalizedScore)
  const status = getStatusLabel(normalizedScore)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${ringColor} ${normalizedScore}%, #e2e8f0 ${normalizedScore}% 100%)`,
            }}
          >
            <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
              <span className={`text-2xl font-semibold ${textColor}`}>
                {normalizedScore}
              </span>
              <span className="text-xs text-slate-500">TrustScore</span>
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Verification Status
            </p>
            <p className="text-lg font-semibold text-slate-900">{status}</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {layers.map((layer) => (
            <div key={layer.label}>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{layer.label}</span>
                <span className="font-medium text-slate-900">{layer.value}%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: `${Math.min(100, Math.max(0, layer.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrustScoreCard
