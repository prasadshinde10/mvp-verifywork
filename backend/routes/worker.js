const express = require('express');
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

const requireWorker = (req, res, next) => {
  if (!req.user || req.user.role !== 'worker') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

router.use(auth);
router.use(requireWorker);

router.post('/profile', createProfile);
router.get('/profile', getProfile);
router.post('/documents', upload.single('file'), uploadDocument);
router.get('/documents', getDocuments);

module.exports = router;
