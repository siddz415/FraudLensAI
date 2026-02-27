/**
 * Investigate route — orchestrates the 4-step autonomous fraud investigation flow.
 * POST /investigate
 *
 * Body: { "type": "email|phone|wallet|domain", "value": "string" }
 */

const express = require('express');
const router = express.Router();

const { searchEntity } = require('../services/tavilyService');
const { scoreFraudRisk } = require('../services/fastinoService');
const { buildDemoInvestigation } = require('../services/demoInvestigationService');
const { extractRelatedEntities } = require('../utils/entityExtractor');
const { getRiskLevel } = require('../utils/riskLevel');
const logger = require('../utils/logger');

// Allowed entity types
const VALID_TYPES = ['email', 'phone', 'wallet', 'domain'];
const REQUIRED_ENV_VARS = [
  'TAVILY_API_KEY',
  'FASTINO_API_KEY',
  'NEO4J_URI',
  'NEO4J_USER',
  'NEO4J_PASSWORD',
];

router.post('/', async (req, res) => {
  const { type, value } = req.body;

  // Input validation
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid or missing "type". Must be one of: ${VALID_TYPES.join(', ')}.`,
    });
  }
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing "value".' });
  }

  const entityValue = value.trim();
  logger.info(`Starting investigation for ${type}: ${entityValue}`);

  const missingConfig = REQUIRED_ENV_VARS.filter((envName) => !process.env[envName]);
  const forceDemoMode = String(process.env.DEMO_MODE).toLowerCase() === 'true';

  if (forceDemoMode || missingConfig.length > 0) {
    logger.info(
      `Returning demo investigation result${
        missingConfig.length > 0 ? ` (missing config: ${missingConfig.join(', ')})` : ''
      }`
    );
    return res.json(buildDemoInvestigation(type, entityValue));
  }

  try {
    let storeEntity;
    let storeRelationships;
    let getConnections;

    try {
      ({ storeEntity, storeRelationships, getConnections } = require('../services/neo4jService'));
    } catch (neo4jLoadError) {
      logger.error('Neo4j service unavailable', neo4jLoadError);
      return res.status(500).json({
        error: 'Neo4j configuration is missing or invalid. Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in .env.',
      });
    }

    // ── Step 1: OSINT Search via Tavily ──────────────────────────────────────
    const tavilyData = await searchEntity(type, entityValue);
    const results = tavilyData.results || [];
    const tavilySummary = tavilyData.answer || results.map((r) => r.content).join(' ').slice(0, 1000);
    const evidence = results.map((r) => r.content).filter(Boolean);

    // ── Step 2: Store entity node in Neo4j ───────────────────────────────────
    // We use a provisional score of 0 here; it will be updated after Fastino scoring.
    await storeEntity(type, entityValue, 0);

    // ── Step 3: Extract and store related entities / relationships ───────────
    const relatedEntities = extractRelatedEntities(results, entityValue);
    const graphConnections = await storeRelationships(entityValue, relatedEntities);

    // ── Step 4: Fraud risk scoring via Fastino AI ────────────────────────────
    const { riskScore, summary } = await scoreFraudRisk(type, entityValue, tavilySummary, evidence);

    // Update Neo4j node with the final risk score
    await storeEntity(type, entityValue, riskScore);

    const riskLevel = getRiskLevel(riskScore);
    logger.info(`Investigation complete — riskScore: ${riskScore}, riskLevel: ${riskLevel}`);

    // Retrieve the full connection list from the graph (includes previously stored nodes)
    const neo4jConnections = await getConnections(entityValue);

    return res.json({
      entity: entityValue,
      riskScore,
      riskLevel,
      summary,
      evidence: evidence.slice(0, 5),
      graphConnections: neo4jConnections.length > 0 ? neo4jConnections : graphConnections,
    });
  } catch (err) {
    logger.error('Investigation failed', err);
    return res.status(500).json({ error: 'Investigation failed.', details: err.message });
  }
});

module.exports = router;
