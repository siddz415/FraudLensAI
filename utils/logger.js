/**
 * Logger utility — logs investigation steps with timestamps and labels.
 */

const logger = {
  step: (stepNum, message) => {
    console.log(`[${new Date().toISOString()}] [STEP ${stepNum}] ${message}`);
  },
  info: (message) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`);
  },
  error: (message, err) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, err?.message || err || '');
  },
};

module.exports = logger;
