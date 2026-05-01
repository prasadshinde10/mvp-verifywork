const express = require('express');
const cors = require('cors');

require('dotenv').config();
require('./config/db');
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/worker');
const scoreRoutes = require('./routes/score');
const employerRoutes = require('./routes/employer');
const adminRoutes = require('./routes/admin');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not configured.');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
