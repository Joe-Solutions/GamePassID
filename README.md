# Registration Hub

Online license database for tournament game players. Encoders sign in, capture player details (including a profile photo), choose a game and player category, then issue a license ID.

## Features

- Encoder-only registration console
- Player categories: **Casual**, **Amateur**, **Student**
- Game selection for the license
- Webcam profile capture (with file upload fallback)
- Searchable licensed players directory and license cards
- Local SQLite database (no separate DB server)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo encoder login

- Username: `encoder`
- Password: `encoder123`

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3`

Data and uploaded photos are stored under `data/` (created automatically on first run). The database starts with no players — encoders register them from the console.
