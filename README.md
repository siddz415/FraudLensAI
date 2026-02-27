# FraudLensAI

An autonomous fraud investigation agent built with Node.js, Neo4j, Tavily Search API, and Fastino AI.

## Features

- **POST /investigate** — Accepts a suspicious entity (email, phone, crypto wallet, or domain) and runs a 4-step autonomous investigation:
  1. OSINT search via [Tavily API](https://tavily.com) (scam mentions, complaints, reputation signals)
  2. Store entity as a node in Neo4j graph database
  3. Extract and link related entities (domains, emails, wallets) as graph relationships
  4. Score fraud risk and generate explanation via [Fastino AI](https://fastino.ai)
- **GET /health** — Liveness check endpoint

## Tech Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js + Express |
| Graph database | Neo4j |
| OSINT search | Tavily Search API |
| AI risk scoring | Fastino AI |
| HTTP client | Axios |
| Config | dotenv |

## Project Structure

```
├── app.js                    # Express entry point
├── routes/
│   ├── health.js             # GET /health
│   └── investigate.js        # POST /investigate (orchestration)
├── services/
│   ├── tavilyService.js      # Tavily OSINT search
│   ├── fastinoService.js     # Fastino AI risk scoring
│   └── neo4jService.js       # Neo4j graph operations
├── db/
│   └── neo4jDriver.js        # Neo4j driver singleton
├── utils/
│   ├── entityExtractor.js    # Extract related entities from OSINT results
│   ├── riskLevel.js          # riskScore → riskLevel helper
│   └── logger.js             # Step-by-step investigation logger
└── .env.example              # Environment variable template
```

## Setup

### Prerequisites

- Node.js 18+
- A running Neo4j instance (local or [Neo4j Aura](https://neo4j.com/cloud/aura/))
- Tavily API key
- Fastino AI API key

### Installation

```bash
git clone https://github.com/siddz415/FraudLensAI.git
cd FraudLensAI
npm install
cp .env.example .env
# Edit .env and fill in your credentials
npm start
```

## Environment Variables

| Variable | Description |
|---|---|
| `TAVILY_API_KEY` | Tavily Search API key |
| `FASTINO_API_KEY` | Fastino AI API key |
| `NEO4J_URI` | Neo4j connection URI (e.g. `bolt://localhost:7687`) |
| `NEO4J_USER` | Neo4j username |
| `NEO4J_PASSWORD` | Neo4j password |
| `PORT` | Server port (default: `3000`) |

## API Reference

### `GET /health`

Returns service liveness status.

**Response:**
```json
{
  "status": "ok",
  "service": "FraudLensAI",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `POST /investigate`

Runs the full fraud investigation flow.

**Request body:**
```json
{
  "type": "email | phone | wallet | domain",
  "value": "suspicious@example.com"
}
```

**Response:**
```json
{
  "entity": "suspicious@example.com",
  "riskScore": 82,
  "riskLevel": "Critical",
  "summary": "This email address has been linked to multiple phishing campaigns...",
  "evidence": [
    "User reports on ScamAdviser indicate...",
    "..."
  ],
  "graphConnections": [
    { "value": "evil-domain.com", "type": "domain" },
    { "value": "0xABCDEF...", "type": "wallet" }
  ]
}
```

**Risk levels:**

| Score range | Level |
|---|---|
| 0–39 | Low |
| 40–59 | Medium |
| 60–79 | High |
| 80–100 | Critical |

## Deployment (Render)

1. Push the repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all environment variables from `.env.example` in the Render dashboard.
