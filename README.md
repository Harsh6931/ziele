# Ziele

Ziele is a social blogging platform with a React frontend and an Express backend. The backend now includes a starter tRPC layer next to the existing REST routes so the project can migrate feature-by-feature without breaking current pages.

## Project structure

- `frontend/`: React + Vite client
- `backend/`: Express MVC API, Prisma models, Clerk auth, and starter tRPC router
- `.github/workflows/ci.yml`: CI checks for formatting, linting, build, and tests

## Quick start

1. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
2. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
3. Fill in your real keys later for Clerk, PostgreSQL, Redis, Cloudinary, Resend, Gemini, and LibreTranslate.
4. Start the apps:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`

## Backend setup now included

- Express MVC routes remain available under `/api/*`
- tRPC starter router is mounted at `/trpc`
- health checks:
  - `GET /api/health`
  - `GET /api/health/readiness`
- Prisma scripts:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:push`

## Neon + Render deployment

- The repository includes `render.yaml` for deploying `backend/` as a Render web service.
- Render build command: `npm install && npm run build`
- Render pre-deploy command: `npm run db:deploy`
- Render start command: `npm start`
- Set `DATABASE_URL` to the Neon pooled connection string with `-pooler` in the hostname.
- Set `DIRECT_URL` to the Neon direct connection string without `-pooler`; Prisma migrations use this value.
- Set `CORS_ORIGIN` to the deployed frontend URL, for example `https://ziele-theta.vercel.app`. Use comma-separated origins if you need more than one.
- In the frontend host, set `VITE_API_BASE_URL` to the Render backend URL, for example `https://ziele-backend.onrender.com`.
- In production, set `VITE_USE_MOCK_FALLBACK=false` so failed backend requests do not silently use mock data.

## Quality scripts

Backend:
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm test`

Frontend:
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm test`
