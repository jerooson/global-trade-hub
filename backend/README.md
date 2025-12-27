# Global Trade Hub - Backend API

Backend API for the Global Trade Hub platform, providing sourcing agent functionality with LangChain, Firecrawl, and LLM integration.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - `GROQ_API_KEY` (recommended - cheapest) or `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - `FIRECRAWL_API_KEY`

3. **Run development server:**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:3001`

## API Endpoints

### POST `/api/sourcing/search`
Search for manufacturers based on natural language query.

**Request:**
```json
{
  "query": "LED manufacturer in Ningbo",
  "filters": {
    "location": ["Ningbo"],
    "minConfidence": 0.7,
    "manufacturerType": "factory"
  }
}
```

**Response:**
```json
{
  "searchId": "uuid",
  "query": "LED manufacturer in Ningbo",
  "parsedQuery": {
    "product": "LED",
    "location": ["Ningbo"],
    "type": "manufacturer"
  },
  "results": [
    {
      "id": "1688_0_...",
      "name": "Company Name",
      "type": "Factory",
      "confidence": 85,
      "address": "Ningbo, Zhejiang, China",
      "contact": "Contact Name",
      "email": "contact@example.com",
      "phone": "+86-xxx-xxxx-xxxx",
      "products": ["LED strips", "LED panels"]
    }
  ],
  "totalResults": 5,
  "searchTime": 2.3
}
```

### POST `/api/sourcing/classify`
Classify a manufacturer as factory or trading company.

### GET `/api/sourcing/manufacturers`
Get cached search results with sorting and filtering.

## Testing

Use **Postman** or **Thunder Client** (VS Code extension) to test the API:

1. Start the server: `npm run dev`
2. Test health endpoint: `GET http://localhost:3001/health`
3. Test search endpoint: `POST http://localhost:3001/api/sourcing/search`

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Express app entry
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   │   ├── langchain/        # LangChain agent
│   │   ├── firecrawl/        # 1688.com scraping
│   │   ├── llm/              # LLM client
│   │   ├── classifier/       # Manufacturer classification
│   │   ├── enrichment/       # Data enrichment
│   │   ├── sourcing/         # Search orchestration
│   │   └── cache/            # In-memory caching
│   ├── models/               # TypeScript interfaces
│   ├── utils/                # Utility functions
│   └── config/               # Configuration
├── package.json
└── tsconfig.json
```

## Environment Variables

See `.env.example` for all required variables.

## Development

- **TypeScript**: Strict mode enabled
- **Hot Reload**: Uses `tsx watch` for development
- **Port**: Default 3001 (configurable via `PORT` env var)

## Production

Build and run:
```bash
npm run build
npm start
```

