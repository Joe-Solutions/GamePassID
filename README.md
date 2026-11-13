# Registration Hub

Online license database for tournament game players. Encoders sign in, capture player details (including a profile photo), choose a game and player category, then issue a license ID.

## Features

- Encoder-only registration console
- Player categories: **Casual**, **Amateur**, **Student**
- Game selection for the license
- Webcam profile capture (with file upload fallback)
- Searchable licensed players directory and license cards
- PostgreSQL via Prisma Migrate

## Quick start

1. Create a PostgreSQL database (example name: `registration_hub`).
2. Copy env and set your connection string:

```bash
cp .env.example .env
```

3. Install, migrate, seed, and run:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo encoder login

- Username: `encoder`
- Password: `encoder123`

## Database

Prisma manages schema and migrations under `prisma/`.

| Script | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply migrations (`prisma migrate dev`) |
| `npm run db:deploy` | Apply migrations in CI/production |
| `npm run db:seed` | Seed games + demo encoder |
| `npm run db:studio` | Open Prisma Studio |

Uploaded photos are still stored under `data/uploads/photos/` (created automatically).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
