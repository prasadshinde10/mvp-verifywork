const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const pool = require('../config/db');

const BUCKET_NAME = process.env.SUPABASE_WORKER_DOCUMENTS_BUCKET || 'worker-documents';
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 7;
let supabaseClient;

const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};

const getWorkerId = async (userId) => {
  const result = await pool.query('SELECT id FROM workers WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
};

const createProfile = async (req, res) => {
  const {
    full_name: fullName,
    phone,
    trade,
    city,
    iti_institute: itiInstitute,
    years_experience: yearsExperience,
  } = req.body || {};

  try {
    const result = await pool.query(
      `INSERT INTO workers (user_id, full_name, phone, trade, city, iti_institute, years_experience)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, full_name, phone, trade, city, iti_institute, years_experience, trust_score, score_breakdown`,
      [
        req.user.id,
        fullName || null,
        phone || null,
        trade || null,
        city || null,
        itiInstitute || null,
        yearsExperience || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Worker profile already exists' });
    }

    if (error.code === '23502') {
      return res.status(400).json({ error: 'Missing required worker profile fields' });
    }

    console.error('Failed to create worker profile:', error);
    return res.status(500).json({ error: 'Failed to create worker profile' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, full_name, phone, trade, city, iti_institute, years_experience, trust_score, score_breakdown
       FROM workers
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch worker profile:', error);
    return res.status(500).json({ error: 'Failed to fetch worker profile' });
  }
};

const uploadDocument = async (req, res) => {
  const { doc_type: docType } = req.body || {};
  const file = req.file;

  if (!docType) {
    return res.status(400).json({ error: 'doc_type is required' });
  }

  if (!file) {
    return res.status(400).json({ error: 'Document file is required' });
  }

  let workerId;

  try {
    workerId = await getWorkerId(req.user.id);
  } catch (error) {
    console.error('Failed to fetch worker id:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }

  if (!workerId) {
    return res.status(404).json({ error: 'Worker profile not found' });
  }

  let supabase;

  try {
    supabase = getSupabaseClient();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const extension = path.extname(file.originalname || '').toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return res.status(400).json({ error: 'Unsupported document type' });
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported document mime type' });
  }

  const sanitizedDocType = docType.trim().replace(/[^a-z0-9_-]/gi, '');

  if (!sanitizedDocType) {
    return res.status(400).json({ error: 'Invalid doc_type value' });
  }

  const fileName = `${req.user.id}/${sanitizedDocType}-${uuidv4()}${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload failed:', uploadError);
    return res.status(500).json({ error: 'Failed to upload document' });
  }

  const usePublicUrl = process.env.SUPABASE_STORAGE_PUBLIC === 'true';
  let fileUrl;

  if (usePublicUrl) {
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    fileUrl = publicUrlData?.publicUrl;
  } else {
    const expiresInRaw = Number.parseInt(
      process.env.SUPABASE_SIGNED_URL_EXPIRES_IN || DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
      10
    );
    const expiresIn = Number.isNaN(expiresInRaw)
      ? DEFAULT_SIGNED_URL_EXPIRY_SECONDS
      : expiresInRaw;
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, expiresIn);

    if (signedUrlError) {
      console.error('Failed to create signed URL:', signedUrlError);
      return res.status(500).json({ error: 'Failed to generate document URL' });
    }

    fileUrl = signedUrlData?.signedUrl;
  }

  if (!fileUrl) {
    return res.status(500).json({ error: 'Failed to generate document URL' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO documents (worker_id, doc_type, url, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, worker_id, doc_type, url, status, created_at`,
      [workerId, docType, fileUrl, 'pending']
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to save document record:', error);
    return res.status(500).json({ error: 'Failed to save document record' });
  }
};

const getDocuments = async (req, res) => {
  let workerId;

  try {
    workerId = await getWorkerId(req.user.id);
  } catch (error) {
    console.error('Failed to fetch worker id:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }

  if (!workerId) {
    return res.status(404).json({ error: 'Worker profile not found' });
  }

  try {
    const result = await pool.query(
      `SELECT id, worker_id, doc_type, url, status, created_at
       FROM documents
       WHERE worker_id = $1
       ORDER BY created_at DESC`,
      [workerId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

module.exports = {
  createProfile,
  getProfile,
  uploadDocument,
  getDocuments,
};
