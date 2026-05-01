const pool = require('../config/db');

const LAYER_POINTS = 25;
const APPROVED_STATUS = 'approved';

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const getStatusLabel = (score) => {
  if (score <= 40) {
    return 'Unverified';
  }

  if (score <= 70) {
    return 'Partially Verified';
  }

  return 'Fully Trusted';
};

const computeBreakdown = (documents, yearsExperience) => {
  const hasApprovedDoc = (docType) =>
    documents.some(
      (doc) => normalize(doc.doc_type) === docType && normalize(doc.status) === APPROVED_STATUS
    );

  const aadhaarApproved = hasApprovedDoc('aadhaar');
  const itiApproved = hasApprovedDoc('iti_cert');
  const skillApproved = hasApprovedDoc('skill_cert');
  const referenceApproved = hasApprovedDoc('reference');
  const experienceQualified = Number(yearsExperience || 0) >= 2;
  const skillOrExperienceApproved = skillApproved || experienceQualified;

  const breakdown = {
    aadhaar: {
      approved: aadhaarApproved,
      points: aadhaarApproved ? LAYER_POINTS : 0,
    },
    iti_cert: {
      approved: itiApproved,
      points: itiApproved ? LAYER_POINTS : 0,
    },
    skill_or_experience: {
      approved: skillOrExperienceApproved,
      points: skillOrExperienceApproved ? LAYER_POINTS : 0,
      experienceQualified,
      skillApproved,
    },
    reference: {
      approved: referenceApproved,
      points: referenceApproved ? LAYER_POINTS : 0,
    },
  };

  const trustScore =
    breakdown.aadhaar.points +
    breakdown.iti_cert.points +
    breakdown.skill_or_experience.points +
    breakdown.reference.points;

  return { breakdown, trustScore };
};

const computeTrustScore = async (req, res) => {
  const workerId = Number.parseInt(req.params.worker_id, 10);

  if (Number.isNaN(workerId)) {
    return res.status(400).json({ error: 'Invalid worker_id' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const workerResult = await client.query(
      'SELECT id, years_experience FROM workers WHERE id = $1',
      [workerId]
    );

    if (!workerResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const documentsResult = await client.query(
      'SELECT doc_type, status FROM documents WHERE worker_id = $1',
      [workerId]
    );

    const { breakdown, trustScore } = computeBreakdown(
      documentsResult.rows,
      workerResult.rows[0].years_experience
    );
    const statusLabel = getStatusLabel(trustScore);
    const breakdownPayload = JSON.stringify(breakdown);

    await client.query(
      `INSERT INTO verifications (worker_id, trust_score, score_breakdown, status_label)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (worker_id)
       DO UPDATE SET trust_score = EXCLUDED.trust_score,
                     score_breakdown = EXCLUDED.score_breakdown,
                     status_label = EXCLUDED.status_label`,
      [workerId, trustScore, breakdownPayload, statusLabel]
    );

    await client.query(
      `UPDATE workers
       SET trust_score = $1,
           score_breakdown = $2::jsonb
       WHERE id = $3`,
      [trustScore, breakdownPayload, workerId]
    );

    await client.query('COMMIT');

    return res.json({
      trust_score: trustScore,
      breakdown,
      status_label: statusLabel,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to compute trust score for worker ${workerId}:`, error);
    return res.status(500).json({ error: 'Failed to compute trust score' });
  } finally {
    client.release();
  }
};

module.exports = {
  computeTrustScore,
};
