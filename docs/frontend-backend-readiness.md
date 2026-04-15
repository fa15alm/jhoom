# Frontend Backend Readiness

The frontend is structured so backend wiring can be added without rewriting screens.

## Route Screens

Expo Router route files stay in `frontend/app`. These files own screen layout and navigation only.

## Shared Source

- `frontend/src/shared/ui` contains reusable UI components.
- `frontend/src/shared/hooks` contains reusable hooks.
- `frontend/src/shared/types` is reserved for shared frontend domain types.

## Feature Logic

Feature-specific data and helpers live in `frontend/src/features`.

Current folder:

- `health-plan` stores onboarding answers and generated-plan helpers until the backend owns that data.

Recommended next folders:

- `auth`
- `dashboard`
- `logs`
- `milestones`
- `social`
- `settings`

## API Layer

All backend calls should go through `frontend/src/services/api`.

Current API modules:

- `authApi.js` maps to the existing server auth routes.
- `profileApi.js` maps to the existing server profile routes.
- `logsApi.js`, `healthPlanApi.js`, `milestonesApi.js`, `socialApi.js`, and `coachApi.js` define the frontend contract for the backend routes still to build.

## Local Backend URL

The frontend default API base URL is:

```text
http://localhost:5000/api
```

Override it with:

```text
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

## Backend Wiring Order

1. Auth: replace mock login/register with `authApi`.
2. Profile/settings: hydrate user profile from `profileApi`.
3. Onboarding/health plan: persist answers and generated plan.
4. Logs: replace local log state with `logsApi`.
5. Dashboard: build dashboard from logs, plan, and integrations.
6. Milestones: persist goals and auto-calculate progress from logs.
7. Social: persist friends, weekly posts, likes, comments, and privacy controls.
8. AI coach: send plan/log context to the backend AI endpoint.
