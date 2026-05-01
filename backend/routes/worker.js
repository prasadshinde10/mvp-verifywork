const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const auth = require('../middleware/auth');
const {
  createProfile,
  getProfile,
  uploadDocument,
  getDocuments,
} = require('../controllers/workerController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const workerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const requireWorker = (req, res, next) => {
  if (!req.user || req.user.role !== 'worker') {
    return res.status(403).json({ error: 'Access denied: worker role required' });
  }

  next();
};

router.use(workerLimiter);
router.use(auth);
router.use(requireWorker);

router.post('/profile', createProfile);
router.get('/profile', getProfile);
router.post('/documents', upload.single('file'), uploadDocument);
router.get('/documents', getDocuments);

module.exports = router;
