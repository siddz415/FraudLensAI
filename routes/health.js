/**
 * Health route — provides a simple liveness check for the API.
 * GET /health
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FraudLensAI',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
