# Global Trade Hub

A B2B SaaS platform for global product sourcing and trade management. Connect with verified manufacturers, run AI-powered sourcing searches, manage your product gallery, and handle email campaigns — all in one place.

## Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Syne + DM Sans (typography)
- TanStack Query

**Backend**
- Node.js + Express + TypeScript
- LangChain (AI sourcing agent)
- Firecrawl + Apify (web scraping)
- Passport.js (JWT + OAuth authentication)
- Resend (email delivery)
- PostgreSQL

## Project Structure

```
global-trade-hub/
├── src/                    # Frontend (React)
│   ├── components/
│   │   ├── layout/         # LeftNavbar, TopHeader
│   │   ├── sourcing/       # Sourcing page, chat, manufacturer cards
│   │   ├── aiStudio/       # AI image generation UI
│   │   ├── calculator/     # Price calculator
│   │   ├── gallery/        # Product gallery
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Route-level page components
│   ├── hooks/              # Custom React hooks
│   └── services/           # API client services
├── backend/                # Backend (Express API)
│   └── src/
│       ├── routes/         # auth, sourcing, imageGeneration, email
│       ├── services/       # langchain, firecrawl, apify, auth, email
│       ├── models/         # TypeScript interfaces
│       └── config/         # Environment config
└── email-templates/        # HTML email templates
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Clone & install

```sh
git clone https://github.com/jerooson/global-trade-hub.git
cd global-trade-hub

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure environment

```sh
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `ANTHROPIC_API_KEY` | For AI sourcing agent |
| `FIRECRAWL_API_KEY` | For web scraping |
| `APIFY_API_KEY` | For manufacturer scraping |
| `RESEND_API_KEY` | For email campaigns |
| `FRONTEND_URL` | e.g. `http://localhost:8080` |

### 3. Run development servers

In two separate terminals:

```sh
# Terminal 1 — Frontend (http://localhost:8080)
npm run dev

# Terminal 2 — Backend (http://localhost:3001)
cd backend && npm run dev
```

## Pages

| Route | Description |
|---|---|
| `/login` | Authentication |
| `/dashboard` | Overview stats and quick actions |
| `/` | Product gallery |
| `/workspace/:productId` | Sourcing workspace with AI chat |
| `/ai-studio` | AI image generation |
| `/email-campaigns` | Email campaign management |

## Backend API

| Endpoint | Description |
|---|---|
| `POST /api/auth/login` | Email/password login |
| `POST /api/auth/register` | New user registration |
| `POST /api/auth/refresh` | Refresh access token |
| `POST /api/sourcing/search` | AI-powered manufacturer search |
| `GET /api/sourcing/manufacturers` | Cached search results |
| `POST /api/image/generate` | AI image generation |
| `POST /api/email/send` | Send email campaigns |

## Deployment

```sh
# Build frontend
npm run build          # outputs to dist/

# Build backend
cd backend && npm run build && npm start
```

The frontend is deployed via GitHub Actions (see `.github/workflows/deploy.yml`).
