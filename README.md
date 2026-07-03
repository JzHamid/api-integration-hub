# API Integration Hub

Portfolio project for Jazhem Hamid. API Integration Hub is a polished
developer-tool dashboard that demonstrates full-stack API work with Next.js
App Router, TypeScript, Tailwind CSS, Route Handlers, and Zod validation.

## Features

- Dark responsive API console UI with summary cards, health status, request log,
  and JSON response previews.
- GitHub profile lookup through a server-side route handler using the public
  GitHub REST API.
- Weather lookup through Open-Meteo with city geocoding or latitude/longitude
  coordinates.
- Internal CRM mock APIs for clients and tasks with in-memory data.
- Contact form API with Zod-validated request bodies.
- Webhook receiver with strict payload validation and last-event memory preview.
- Consistent JSON success/error envelopes across local API routes.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Route Handlers
- Zod
- Public REST APIs: GitHub and Open-Meteo

## API Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Returns dashboard service health data. |
| `/api/github/[username]` | `GET` | Fetches GitHub profile and recent repo highlights. |
| `/api/weather?city=New York` | `GET` | Fetches geocoded Open-Meteo weather by city. |
| `/api/weather?lat=40.7128&lon=-74.0060` | `GET` | Fetches Open-Meteo weather by coordinates. |
| `/api/clients` | `GET` | Returns mock CRM clients. |
| `/api/clients` | `POST` | Creates a mock client with Zod validation. |
| `/api/tasks` | `GET` | Returns mock CRM tasks. |
| `/api/tasks` | `POST` | Creates a mock task with Zod validation. |
| `/api/contact` | `POST` | Validates contact form submissions. |
| `/api/webhook` | `GET` | Returns the last received webhook in this runtime. |
| `/api/webhook` | `POST` | Validates and stores a webhook payload in memory. |

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Phase 1 does not require API keys. Copy `.env.example` to `.env.local` only when
future integrations need secrets.

## Validation Examples

Create a client:

```json
{
  "name": "Jordan Lee",
  "company": "Circuit Works",
  "email": "jordan@circuitworks.example",
  "status": "prospect",
  "source": "Dashboard form"
}
```

Create a task:

```json
{
  "title": "Qualify webhook lead",
  "owner": "Jazhem",
  "status": "open",
  "priority": "medium",
  "dueDate": "2026-07-12"
}
```

Webhook payload:

```json
{
  "event": "client.created",
  "source": "portfolio-demo",
  "occurredAt": "2026-07-02T17:00:00.000Z",
  "data": {
    "clientId": "client_1002",
    "plan": "growth",
    "seats": 4
  }
}
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Future Improvements

- Add persisted database storage for CRM records and webhook events.
- Add optional authenticated GitHub requests for higher rate limits.
- Add email delivery for validated contact submissions.
- Add API request analytics and filtering.
- Add automated route handler tests for validation and error responses.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
