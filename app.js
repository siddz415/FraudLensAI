/**
 * FraudLensAI — Autonomous Fraud Investigation Agent
 * Main Express application entry point.
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health', require('./routes/health'));
app.use('/investigate', require('./routes/investigate'));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR]`, err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] FraudLensAI server running on port ${PORT}`);
});

module.exports = app;
