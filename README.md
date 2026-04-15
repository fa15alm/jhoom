# Jhoom

Jhoom is a social fitness app being developed for COMP208 (Group Software Project) at the University of Liverpool.  
It aims to help users stay active by combining workout tracking with a social feed, profiles, and connections between friends.

## Features (MVP)

- User registration and login
- User profiles (basic info and fitness goals)
- Social feed for sharing achievements and updates
- Friends/connections between users
- Simple progress tracking for workouts or activities

## Other Features

- Diet and workout guides and tips based on goals
- AI Fitness Chatbot

## Tech Stack

- Frontend app: React Native with Expo / Expo Router
- Backend: Node.js with Express
- Database: SQLite3

## Project Structure

- `frontend/app/` – Expo Router route screens
- `frontend/src/` – shared UI, hooks, feature logic, services, and future frontend stores
- `server/` – Express server and SQLite database
- `docs/` – Documentation (API reference, code style, etc.)

## Getting Started (Development)

1. Clone the repo:
   - `git clone https://github.com/fa15alm/jhoom`
   - `cd jhoom`

2. Backend:
   - `cd server`
   - `npm install`
   - `node src/server.js`

3. Frontend app:
   - `cd frontend`
   - `npm install`
   - `npx expo start`

Check the `docs/` folder for:
- `backend-api-reference.md` – API endpoints and request/response formats  
- `frontend-backend-readiness.md` – frontend structure and backend wiring order
- `code-style.md` – Coding standards for this project **(WIP)**

## Team Members

- Faisal Mughal
- Moiz Tawawala
- Muzammil Mannan
- Husaam Hashmi
- Julian Causby
- Zainah Kashif
- Aleena Ali
