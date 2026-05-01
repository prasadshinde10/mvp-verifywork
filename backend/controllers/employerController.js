const pool = require('../config/db');

const getEmployerId = async (userId) => {
  const result = await pool.query('SELECT id FROM employers WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
};

const createProfile = async (req, res) => {
  const {
    company_name: companyName,
    contact_name: contactName,
    phone,
    city,
  } = req.body || {};

  try {
    const result = await pool.query(
      `INSERT INTO employers (user_id, company_name, contact_name, phone, city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, company_name, contact_name, phone, city`,
      [req.user.id, companyName || null, contactName || null, phone || null, city || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Employer profile already exists' });
    }

    if (error.code === '23502') {
      return res.status(400).json({ error: 'Missing required employer profile fields' });
    }

    console.error('Failed to create employer profile:', error);
    return res.status(500).json({ error: 'Failed to create employer profile' });
  }
};

const createJob = async (req, res) => {
  const { trade_required: tradeRequired, min_trust_score: minTrustScoreRaw } = req.body || {};

  if (!tradeRequired) {
    return res.status(400).json({ error: 'trade_required is required' });
  }

  const minTrustScore =
    minTrustScoreRaw === undefined || minTrustScoreRaw === null || minTrustScoreRaw === ''
      ? 0
      : Number.parseInt(minTrustScoreRaw, 10);

  if (Number.isNaN(minTrustScore)) {
    return res.status(400).json({ error: 'min_trust_score must be a number' });
  }

  let employerId;

  try {
    employerId = await getEmployerId(req.user.id);
  } catch (error) {
    console.error('Failed to fetch employer id:', error);
    return res.status(500).json({ error: 'Failed to create job' });
  }

  if (!employerId) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (employer_id, trade_required, min_trust_score)
       VALUES ($1, $2, $3)
       RETURNING id, employer_id, trade_required, min_trust_score`,
      [employerId, tradeRequired, minTrustScore]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create job:', error);
    return res.status(500).json({ error: 'Failed to create job' });
  }
};

const getJobs = async (req, res) => {
  let employerId;

  try {
    employerId = await getEmployerId(req.user.id);
  } catch (error) {
    console.error('Failed to fetch employer id:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }

  if (!employerId) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  try {
    const result = await pool.query(
      `SELECT id, employer_id, trade_required, min_trust_score
       FROM jobs
       WHERE employer_id = $1
       ORDER BY id DESC`,
      [employerId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

const getShortlist = async (req, res) => {
  const jobId = Number.parseInt(req.params.job_id, 10);

  if (Number.isNaN(jobId)) {
    return res.status(400).json({ error: 'Invalid job_id' });
  }

  let employerId;

  try {
    employerId = await getEmployerId(req.user.id);
  } catch (error) {
    console.error('Failed to fetch employer id:', error);
    return res.status(500).json({ error: 'Failed to fetch shortlist' });
  }

  if (!employerId) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  try {
    const jobResult = await pool.query(
      `SELECT trade_required, min_trust_score
       FROM jobs
       WHERE id = $1 AND employer_id = $2`,
      [jobId, employerId]
    );

    if (!jobResult.rows.length) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { trade_required: tradeRequired, min_trust_score: minTrustScore } = jobResult.rows[0];
    const minimumScore = Number.isNaN(Number(minTrustScore)) ? 0 : Number(minTrustScore);

    const workersResult = await pool.query(
      `SELECT id, user_id, full_name, phone, trade, city, iti_institute, years_experience, trust_score
       FROM workers
       WHERE trade = $1 AND trust_score >= $2
       ORDER BY trust_score DESC NULLS LAST`,
      [tradeRequired, minimumScore]
    );

    return res.json(workersResult.rows);
  } catch (error) {
    console.error('Failed to fetch shortlist:', error);
    return res.status(500).json({ error: 'Failed to fetch shortlist' });
  }
};

module.exports = {
  createProfile,
  createJob,
  getJobs,
  getShortlist,
};
