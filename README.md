# Nail Salon Appointment Diary

A private daily appointment diary for one nail salon. It replaces a paper appointment book for salon staff; it is not a public customer booking system.

## Tech Stack

- React, TypeScript, Vite, Tailwind CSS
- React Query for server state
- Node.js, Express, Supabase/Postgres
- REST API, Zod validation, date-fns
- Vitest, React Testing Library, Supertest

## Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Create a Supabase project, then run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

Edit `server/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_ORIGIN=http://localhost:5173
```

Use the service role key only on the server. Do not expose it in the browser.

## Seed Data

```bash
npm run seed
```

This creates the salon staff, services, and several example appointments for today.

## Development

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000/api

Run only one side:

```bash
npm run dev:server
npm run dev:client
```

## Production Build

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

## Deploy To Vercel

Create the tables first by running `supabase/schema.sql` in Supabase.

Required Vercel environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLIENT_ORIGIN`

Deploy:

```bash
vercel
vercel --prod
```

Start the built server:

```bash
npm run build --workspace server
npm start --workspace server
```

## Environment Variables

Server:

- `PORT` - Express port, defaults to `4000`
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase server-only service role key
- `CLIENT_ORIGIN` - allowed browser origin, defaults to `http://localhost:5173`

Client:

- `VITE_API_URL` - API base URL, defaults to `/api` for Vite proxy

## Notes

- Booking dates are stored as `yyyy-MM-dd` strings to avoid timezone date shifting.
- Appointment overlaps are allowed by design and are displayed side by side when practical.
- No public booking, payments, availability checks, notifications, reports, or multi-branch features are included.
