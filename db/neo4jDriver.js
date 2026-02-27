/**
 * Neo4j driver singleton — creates and exports a single driver instance
 * configured from environment variables.
 */

const neo4j = require('neo4j-driver');

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  throw new Error(
    'Missing required Neo4j environment variables: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD'
  );
}

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

module.exports = driver;
