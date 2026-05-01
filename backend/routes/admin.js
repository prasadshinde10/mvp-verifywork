const express = require('express');
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/auth');
const {
  getPendingDocuments,
  reviewDocument,
  getAllWorkers,
} = require('../controllers/adminController');

const router = express.Router();
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: admin role required' });
  }

  next();
};

router.use(adminLimiter);
router.use(auth);
router.use(requireAdmin);

router.get('/documents/pending', getPendingDocuments);
router.patch('/documents/:doc_id/review', reviewDocument);
router.get('/workers', getAllWorkers);

module.exports = router;
