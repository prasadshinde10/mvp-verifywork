const express = require('express');
const cors = require('cors');

require('dotenv').config();
require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
