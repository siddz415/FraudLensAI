/**
 * Demo investigation service — generates deterministic mock investigation
 * responses so the UI can be used without external dependencies.
 */

const { getRiskLevel } = require('../utils/riskLevel');

function computeRiskScore(type, value) {
  const source = `${type}:${value}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 101;
  }

  return Math.max(5, Math.min(95, hash));
}

function inferConnections(type, value) {
  const safeValue = String(value || '').toLowerCase();

  if (type === 'email') {
    const domain = safeValue.split('@')[1] || 'unknown-domain.test';
    return [
      { type: 'domain', value: domain },
      { type: 'wallet', value: '0xDEMOFRAUDLENS001' },
    ];
  }

  if (type === 'domain') {
    return [
      { type: 'email', value: `alerts@${safeValue}` },
      { type: 'wallet', value: '0xDEMOFRAUDLENS002' },
    ];
  }

  if (type === 'phone') {
    return [
      { type: 'email', value: 'support@unknown-domain.test' },
      { type: 'domain', value: 'unknown-domain.test' },
    ];
  }

  return [
    { type: 'domain', value: 'wallet-tracker.test' },
    { type: 'email', value: 'ops@wallet-tracker.test' },
  ];
}

function buildDemoInvestigation(type, value) {
  const riskScore = computeRiskScore(type, value);
  const riskLevel = getRiskLevel(riskScore);
  const graphConnections = inferConnections(type, value);

  return {
    entity: value,
    riskScore,
    riskLevel,
    summary:
      'Demo mode result: this investigation is simulated because live integrations are not configured. Configure Tavily, Fastino, and Neo4j to get real intelligence output.',
    evidence: [
      `Simulated signal: repeated mention pattern detected for ${value}.`,
      `Simulated signal: shared infrastructure overlap for ${type} entities.`,
      'Simulated signal: historical complaint clustering above baseline.',
    ],
    graphConnections,
    mode: 'demo',
  };
}

module.exports = { buildDemoInvestigation };
