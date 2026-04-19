# Frontend Source Structure

The `app/` folder is reserved for Expo Router routes. Shared code and feature logic live here so screens stay easier to follow.

## Folders

- `features/` - feature-specific frontend logic, data builders, and future API adapters.
- `services/` - app-wide service clients, including the backend API client.
- `shared/` - reusable UI, hooks, domain types, and utilities.
- `store/` - future global state/context for auth, user profile, logs, and health plan data.
- `shared/types/` - shared domain type placeholders.

## Backend Connection Rule

Screens should not call `fetch` directly. Add backend calls to `services/api/`, then use those functions from feature modules or screens.

Set `EXPO_PUBLIC_API_URL` in `.env` when the backend host changes. On web, leave it unset for local development so the app can use the current browser hostname with port `5001`.
