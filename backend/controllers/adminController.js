const pool = require('../config/db');
const { computeTrustScoreForWorker } = require('./scoreController');

const getPendingDocuments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.worker_id, d.doc_type, d.url, d.status, d.created_at,
              w.full_name AS worker_name
       FROM documents d
       JOIN workers w ON w.id = d.worker_id
       WHERE d.status = 'pending'
       ORDER BY d.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch pending documents:', error);
    return res.status(500).json({ error: 'Failed to fetch pending documents' });
  }
};

const reviewDocument = async (req, res) => {
  const docId = Number.parseInt(req.params.doc_id, 10);
  const status = (req.body?.status || '').toString().trim().toLowerCase();

  if (Number.isNaN(docId)) {
    return res.status(400).json({ error: 'Invalid doc_id' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  let document;

  try {
    const result = await pool.query(
      `UPDATE documents
       SET status = $1
       WHERE id = $2
       RETURNING id, worker_id, doc_type, url, status, created_at`,
      [status, docId]
    );

    document = result.rows[0];
  } catch (error) {
    console.error('Failed to update document status:', error);
    return res.status(500).json({ error: 'Failed to update document status' });
  }

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  try {
    const scoreResult = await computeTrustScoreForWorker(document.worker_id);
    return res.json({
      document,
      trust_score: scoreResult.trust_score,
      status_label: scoreResult.status_label,
      breakdown: scoreResult.breakdown,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    console.error('Failed to recompute trust score:', error);
    return res.status(500).json({ error: 'Failed to recompute trust score' });
  }
};

const getAllWorkers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.user_id, w.full_name, w.phone, w.trade, w.city,
              w.iti_institute, w.years_experience, w.trust_score, w.score_breakdown,
              COUNT(d.id)::int AS document_count
       FROM workers w
       LEFT JOIN documents d ON d.worker_id = w.id
       GROUP BY w.id
       ORDER BY w.full_name NULLS LAST`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch workers:', error);
    return res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

module.exports = {
  getPendingDocuments,
  reviewDocument,
  getAllWorkers,
};
