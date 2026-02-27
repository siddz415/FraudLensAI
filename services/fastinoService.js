/**
 * Fastino Service — sends investigation data to Fastino AI for fraud risk scoring
 * and natural-language explanation generation.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const FASTINO_API_URL = 'https://api.fastino.ai/v1/chat/completions';

/**
 * Sends a summarized investigation prompt to Fastino AI and receives
 * a structured fraud risk score and explanation.
 *
 * @param {string} entityType - Type of entity being investigated.
 * @param {string} entityValue - The entity value.
 * @param {string} tavilySummary - Summarised OSINT data from Tavily.
 * @param {Array<string>} evidence - List of relevant evidence snippets.
 * @returns {Promise<{riskScore: number, summary: string}>} Risk score and explanation.
 */
async function scoreFraudRisk(entityType, entityValue, tavilySummary, evidence) {
  logger.step(4, `Sending investigation data to Fastino AI for risk scoring`);

  const evidenceText = evidence.slice(0, 5).join('\n- ');

  const prompt = `You are a fraud intelligence analyst. Analyze the following OSINT data about a suspicious entity and return a JSON object with exactly two fields:
- "riskScore": an integer from 0 to 100 representing fraud risk (0=completely safe, 100=confirmed fraud)
- "summary": a concise 2–3 sentence explanation of why this entity is suspicious or safe

Entity type: ${entityType}
Entity value: ${entityValue}

OSINT Summary:
${tavilySummary}

Key evidence:
- ${evidenceText}

Respond ONLY with valid JSON, no additional text.`;

  const response = await axios.post(
    FASTINO_API_URL,
    {
      model: 'fastino-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FASTINO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const rawContent = response.data.choices?.[0]?.message?.content || '{}';

  // Strip markdown code fences if present
  const cleaned = rawContent.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.error('Failed to parse Fastino AI response as JSON', rawContent);
    throw new Error('Invalid JSON response from Fastino AI');
  }

  const riskScore = Math.min(100, Math.max(0, parseInt(parsed.riskScore, 10) || 0));
  const summary = parsed.summary || 'No summary available.';

  logger.info(`Fastino AI risk score: ${riskScore}`);
  return { riskScore, summary };
}

module.exports = { scoreFraudRisk };
