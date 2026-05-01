const express = require('express');
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/auth');
const { computeTrustScore } = require('../controllers/scoreController');

const router = express.Router();
const scoreLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
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

router.use(scoreLimiter);
router.use(auth);
router.use(requireAdmin);

router.post('/compute/:worker_id', computeTrustScore);

module.exports = router;
