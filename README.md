# Budget Manager

Track income, categorized expenses, and recurring transactions, with charts for
category breakdown and income-vs-expense trends.

**Stack:** Next.js (App Router, TypeScript) · Tailwind + shadcn/ui · Prisma +
Postgres (Neon) · Recharts.

## Setup

1. Install dependencies (already done if you're reading this after scaffolding):
   ```bash
   npm install
   ```
2. Create a free Postgres database (e.g. [Neon](https://neon.tech)) and copy its
   connection string into `.env` as `DATABASE_URL`.
3. Push the schema and seed the default categories:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/start
- `npm run db:migrate` — apply Prisma migrations
- `npm run db:seed` — seed default categories (Gas, Food, Savings, Dates,
  Subscriptions, Rent, etc.)
- `npm run db:studio` — open Prisma Studio to browse the database

## Data model

- **Category** — name, icon, color, type (income/expense), optional budget limit.
- **Transaction** — amount, type, date, note, linked category.
- **RecurringTransaction** — amount, type, frequency (daily/weekly/monthly/yearly),
  next run date. On every dashboard load, `/api/recurring/run` materializes any
  recurring rules that are due into real transactions.

## Deploying

Push to a GitHub repo and import into [Vercel](https://vercel.com/new), setting
`DATABASE_URL` as an environment variable there too (same Neon connection string,
or a separate production database).
