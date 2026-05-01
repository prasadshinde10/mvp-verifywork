const express = require('express');
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/auth');
const {
  createProfile,
  createJob,
  getJobs,
  getShortlist,
} = require('../controllers/employerController');

const router = express.Router();
const employerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const requireEmployer = (req, res, next) => {
  if (!req.user || req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied: employer role required' });
  }

  next();
};

router.use(employerLimiter);
router.use(auth);
router.use(requireEmployer);

router.post('/profile', createProfile);
router.post('/jobs', createJob);
router.get('/jobs', getJobs);
router.get('/jobs/:job_id/shortlist', getShortlist);

module.exports = router;
