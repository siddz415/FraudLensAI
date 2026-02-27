/**
 * Calculates the qualitative risk level based on a numeric risk score (0–100).
 *
 * @param {number} score - Fraud risk score between 0 and 100.
 * @returns {string} Risk level: "Low", "Medium", "High", or "Critical".
 */
function getRiskLevel(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

module.exports = { getRiskLevel };
