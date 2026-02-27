/**
 * Tavily Service — performs OSINT searches using the Tavily Search API.
 * Retrieves reputation signals, scam mentions, and related entities.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * Searches Tavily for information about the given entity.
 *
 * @param {string} entityType - Type of entity ("email", "phone", "wallet", "domain").
 * @param {string} entityValue - The entity value to investigate.
 * @returns {Promise<Object>} Tavily search response containing results and metadata.
 */
async function searchEntity(entityType, entityValue) {
  logger.step(1, `Searching Tavily for ${entityType}: ${entityValue}`);

  const query = `${entityValue} fraud scam complaint reputation report`;

  const response = await axios.post(
    TAVILY_API_URL,
    {
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 10,
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  logger.info(`Tavily returned ${response.data.results?.length || 0} result(s)`);
  return response.data;
}

module.exports = { searchEntity };
