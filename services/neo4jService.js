/**
 * Neo4j Service — manages graph nodes and relationships for investigated entities.
 * Stores entities as nodes and links related entities discovered during OSINT.
 */

const driver = require('../db/neo4jDriver');
const logger = require('../utils/logger');

/**
 * Creates or merges an Entity node in Neo4j.
 *
 * @param {string} type - Entity type ("email", "phone", "wallet", "domain").
 * @param {string} value - The entity value.
 * @param {number} riskScore - Calculated fraud risk score.
 * @returns {Promise<void>}
 */
async function storeEntity(type, value, riskScore) {
  logger.step(2, `Storing entity node in Neo4j: ${type}=${value}`);

  const session = driver.session();
  try {
    await session.run(
      `MERGE (e:Entity {value: $value})
       SET e.type = $type, e.riskScore = $riskScore, e.updatedAt = datetime()`,
      { type, value, riskScore }
    );
  } finally {
    await session.close();
  }
}

/**
 * Creates related entity nodes and RELATED_TO relationships from the main entity.
 *
 * @param {string} sourceValue - The primary entity value (node source).
 * @param {Array<{type: string, value: string}>} relatedEntities - Discovered related entities.
 * @returns {Promise<Array<string>>} Array of related entity value strings.
 */
async function storeRelationships(sourceValue, relatedEntities) {
  logger.step(3, `Storing ${relatedEntities.length} relationship(s) for: ${sourceValue}`);

  const session = driver.session();
  const stored = [];

  try {
    for (const related of relatedEntities) {
      await session.run(
        `MERGE (src:Entity {value: $sourceValue})
         MERGE (rel:Entity {value: $relatedValue})
         SET rel.type = $relatedType
         MERGE (src)-[:RELATED_TO]->(rel)`,
        {
          sourceValue,
          relatedValue: related.value,
          relatedType: related.type,
        }
      );
      stored.push(related.value);
    }
  } finally {
    await session.close();
  }

  return stored;
}

/**
 * Retrieves all entities directly connected to the given entity value.
 *
 * @param {string} value - The primary entity value.
 * @returns {Promise<Array<{value: string, type: string}>>} List of connected entities.
 */
async function getConnections(value) {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (e:Entity {value: $value})-[:RELATED_TO]->(connected)
       RETURN connected.value AS value, connected.type AS type`,
      { value }
    );
    return result.records.map((r) => ({
      value: r.get('value'),
      type: r.get('type'),
    }));
  } finally {
    await session.close();
  }
}

module.exports = { storeEntity, storeRelationships, getConnections };
