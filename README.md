# Nail Salon Appointment Diary

A private daily appointment diary for one nail salon. It replaces a paper appointment book for salon staff; it is not a public customer booking system.

## Tech Stack

- React, TypeScript, Vite, Tailwind CSS
- React Query for server state
- Node.js, Express, MongoDB, Mongoose
- REST API, Zod validation, date-fns
- Vitest, React Testing Library, Supertest

## Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` with your MongoDB connection string.

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

Use a MongoDB Atlas or other cloud MongoDB URI for production. A local MongoDB URI such as `mongodb://127.0.0.1:27017/...` will not be reachable from Vercel.

Required Vercel environment variable:

- `MONGODB_URI`

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
- `MONGODB_URI` - MongoDB connection string
- `CLIENT_ORIGIN` - allowed browser origin, defaults to `http://localhost:5173`

Client:

- `VITE_API_URL` - API base URL, defaults to `/api` for Vite proxy

## Notes

- Booking dates are stored as `yyyy-MM-dd` strings to avoid timezone date shifting.
- Appointment overlaps are allowed by design and are displayed side by side when practical.
- No public booking, payments, availability checks, notifications, reports, or multi-branch features are included.
