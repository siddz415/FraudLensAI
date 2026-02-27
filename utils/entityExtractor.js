/**
 * Entity extractor — parses Tavily search results to identify related entities
 * (domains, emails, crypto wallets) mentioned in OSINT snippets.
 */

// Regex patterns for entity detection
const PATTERNS = {
  email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  domain: /\b(?:https?:\/\/)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\b/g,
  wallet: /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,})\b/g,
};

/**
 * Extracts related entities from a list of Tavily result snippets.
 *
 * @param {Array<{content?: string, url?: string}>} results - Tavily result objects.
 * @param {string} sourceValue - The original entity value (to avoid self-referencing).
 * @returns {Array<{type: string, value: string}>} Deduplicated list of related entities.
 */
function extractRelatedEntities(results, sourceValue) {
  const found = new Map();

  const addEntity = (type, value) => {
    const key = `${type}:${value}`;
    if (value && value !== sourceValue && !found.has(key)) {
      found.set(key, { type, value });
    }
  };

  for (const result of results) {
    const text = `${result.content || ''} ${result.url || ''}`;

    // Extract emails
    const emails = text.match(PATTERNS.email) || [];
    emails.forEach((e) => addEntity('email', e.toLowerCase()));

    // Extract crypto wallets
    const wallets = text.match(PATTERNS.wallet) || [];
    wallets.forEach((w) => addEntity('wallet', w));

    // Extract domains from URLs only (avoid overly broad domain extraction)
    if (result.url) {
      try {
        const hostname = new URL(result.url).hostname.replace(/^www\./, '');
        if (hostname && hostname !== sourceValue) {
          addEntity('domain', hostname);
        }
      } catch {
        // Ignore malformed URLs
      }
    }
  }

  return Array.from(found.values());
}

module.exports = { extractRelatedEntities };
