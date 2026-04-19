# Jhoom

Jhoom is a social fitness app being developed for COMP208 (Group Software Project) at the University of Liverpool.  
It aims to help users stay active by combining workout tracking with a social feed, profiles, and connections between friends.

## Features (MVP)

- User registration and login
- Password reset and email verification token flow
- User profiles (basic info and fitness goals)
- Profile photo upload storage for web
- Social feed for sharing achievements and updates
- Friends/connections between users, including accept, refuse, block, and report actions
- Progress tracking for workouts, cardio, nutrition, calories burned, sleep, and steps
- Dashboard metrics generated from saved logs

## Other Features

- Diet and workout guides and tips based on goals
- AI Fitness Chatbot

## Tech Stack

- Mobile app: React Native with Expo
- Backend: Node.js with Express
- Database: SQLite3

## Project Structure

- `frontend/` – React Native / Expo app, including Expo Web
- `server/` – Express server and SQLite database
- `docs/` – Documentation (API reference, code style, etc.)

## Getting Started (Development)

1. Clone the repo:
   - `git clone https://github.com/fa15alm/jhoom`
   - `cd jhoom`

2. Install dependencies:
   - `npm run install:all`

3. Run the web app and backend together:
   - `npm run dev`

The backend runs at `http://0.0.0.0:5001`. On web, the frontend uses the
current browser hostname with port `5001`, so mobile browsers on the same Wi-Fi
can create accounts without a `localhost` mismatch.

Useful individual commands:

- `npm --prefix server run setup-db` – create/update the SQLite schema.
- `npm --prefix server run dev` – run only the Express API.
- `npm --prefix frontend run web` – run only Expo Web.
- `npm --prefix frontend run lint` – lint the frontend.
- `npm run smoke` – start a temporary production-style server and verify auth,
  upload, dashboard, and account export endpoints.

## Hosting

For a single-server deployment:

1. Install dependencies:
   - `npm run install:all`

2. Build the web app:
   - `npm run build`

3. Start the hosted app:
   - `npm start`

In production, set these environment variables:

- `NODE_ENV=production`
- `JWT_SECRET=<long-random-secret>`
- `PORT=<server-port>`
- `HOST=0.0.0.0`
- `DB_PATH=<persistent-sqlite-path>`
- `CORS_ORIGIN=<your-site-origin>` if the API and frontend are hosted on different origins
- `PUBLIC_APP_URL=<your-public-site-url>` for email links
- `UPLOAD_DIR=<persistent-upload-folder>` for profile photos
- `UPLOAD_MAX_BYTES=2097152` or another byte limit
- `EMAIL_FROM=<verified-sender-email>` and `RESEND_API_KEY=<key>` for real email delivery
- `OPENAI_API_KEY=<key>` when replacing the local AI coach fallback with a real model

Keep `EXPO_PUBLIC_API_URL` unset for same-origin web hosting. Set it only when
the frontend and API are deployed on different domains.

`npm start` serves both the API and the exported Expo web app. API routes live
under `/api`, and all browser routes fall back to the built frontend.

Before deploying, run:

- `npm run lint`
- `npm run build`
- `npm run smoke`

## Production Notes

- Units are metric across the app: cm, kg, km, min, kcal, g, hours, and steps.
- SQLite works for a small hosted MVP. For heavier usage, move the schema to
  Postgres and replace the setup script with a migration tool.
- Profile photos currently use local disk storage. On hosts with ephemeral
  filesystems, point `UPLOAD_DIR` at persistent storage or swap the upload
  controller for S3/R2/Supabase Storage.
- Password reset and email verification are implemented. They send real email
  when Resend env vars are present; otherwise development responses include or
  log the link.
- The AI coach still uses local deterministic guidance unless `OPENAI_API_KEY`
  is wired into the coach controller.

Check the `docs/` folder for:
- `backend-api-reference.md` – API endpoints and request/response formats  
- `code-style.md` – Coding standards for this project **(WIP)**

## Team Members

- Faisal Mughal
- Moiz Tawawala
- Muzammil Mannan
- Husaam Hashmi
- Julian Causby
- Zainah Kashif
- Aleena Ali
