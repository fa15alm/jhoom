# Jhoom Backend Setup And Frontend Wiring Guide

This guide explains how to finish the backend for the current Jhoom frontend.
It is written for the code that already exists in this repo, not for a brand new backend.

The current backend lives in:

```text
server/
```

The current frontend lives in:

```text
frontend/
```

The most important idea is this:

```text
The frontend already has screens and API contract files.
The backend already has auth/profile foundations.
The next job is to add the missing backend routes and then replace frontend local state with API calls.
```

## Current Project State

### Backend Already Has

The backend currently uses:

```text
Express
SQLite
JWT auth
bcrypt password hashing
cors
dotenv
```

Existing backend entry points:

```text
server/src/server.js
server/src/app.js
```

Existing backend config:

```text
server/src/config/env.js
server/.env.example
```

Existing backend database files:

```text
server/src/db/connection.js
server/src/db/setupDb.js
server/src/db/seedDb.js
```

Existing backend auth/profile files:

```text
server/src/controllers/auth.controller.js
server/src/controllers/profile.controller.js
server/src/middleware/auth.middleware.js
server/src/routes/auth.routes.js
server/src/routes/profile.routes.js
```

Existing mounted routes in `server/src/app.js`:

```js
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
```

Existing API routes:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/profile/me
PUT  /api/profile/me
GET  /api/profile/:id
```

### Frontend Already Has

The frontend already has a central API client:

```text
frontend/src/services/api/client.js
```

The frontend already has API modules for:

```text
frontend/src/services/api/authApi.js
frontend/src/services/api/profileApi.js
frontend/src/services/api/logsApi.js
frontend/src/services/api/healthPlanApi.js
frontend/src/services/api/milestonesApi.js
frontend/src/services/api/socialApi.js
frontend/src/services/api/coachApi.js
frontend/src/services/api/index.js
```

This means the frontend already expects these backend areas:

```text
Auth
Profile/settings
Logs
Health plan/onboarding
Milestones
Social
AI coach/recommendations
```

The backend currently only fully covers:

```text
Auth
Profile
```

So the backend work is mostly adding the missing route groups.

## Recommended Build Order

Do the backend in this order:

1. Make server setup reliable.
2. Connect frontend auth to real login/register.
3. Add profile/settings persistence.
4. Add logs.
5. Add health plan/onboarding.
6. Add dashboard summary endpoints or derive dashboard from logs/plan.
7. Add milestones.
8. Add social posts/friends/comments/likes.
9. Add AI coach endpoints.
10. Add health integrations connection status.
11. Add file/photo upload.
12. Add tests and production hardening.

This order works because most later screens depend on auth and logs.

## Environment Setup

### Backend Environment

Create a real backend `.env` file from the example:

```bash
cd server
cp .env.example .env
```

Recommended `.env` for local development:

```text
PORT=5000
NODE_ENV=development
JWT_SECRET=replace_this_with_a_long_random_secret
DB_PATH=./database.db
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output into:

```text
JWT_SECRET=...
```

### Frontend Environment

Create a frontend `.env` file:

```bash
cd frontend
cp .env.example .env
```

For local development:

```text
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

For a physical phone, `localhost` means the phone itself, not your laptop.
If testing on a phone, use your computer's local network IP:

```text
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
```

## Make The Backend Easier To Run

The current `server/package.json` only lists dependencies. Add scripts so the server is easier to start.

Edit:

```text
server/package.json
```

Recommended version:

```json
{
  "scripts": {
    "dev": "node src/server.js",
    "start": "node src/server.js",
    "db:setup": "node src/db/setupDb.js",
    "db:seed": "node src/db/seedDb.js"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.1",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "sqlite": "^5.1.1",
    "sqlite3": "^6.0.1"
  }
}
```

Then run:

```bash
cd server
npm install
npm run db:setup
npm run dev
```

Open:

```text
http://localhost:5000/
```

Expected response:

```text
Jhoom backend is running
```

## Important Backend Fix Before Adding More Routes

### Fix Database Path Usage

Current file:

```text
server/src/db/connection.js
```

Currently the connection hardcodes:

```js
filename: "./database.db"
```

But `server/src/config/env.js` already defines:

```js
dbPath: process.env.DB_PATH || "./jhoom.db"
```

Update `connection.js` so it uses the env value:

```js
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const env = require("../config/env");

async function openDb() {
  return open({
    filename: env.dbPath,
    driver: sqlite3.Database,
  });
}

module.exports = openDb;
```

This makes `.env` actually control the database file.

## Current Backend Architecture Pattern

The current backend uses this pattern:

```text
route file -> auth middleware if protected -> controller -> database
```

Example:

```text
server/src/routes/profile.routes.js
```

uses:

```text
server/src/controllers/profile.controller.js
server/src/middleware/auth.middleware.js
server/src/db/connection.js
```

Keep using this pattern for all new features.

For each new backend area, add:

```text
server/src/routes/<feature>.routes.js
server/src/controllers/<feature>.controller.js
```

Then mount it in:

```text
server/src/app.js
```

## Route Groups The Frontend Expects

The frontend API files currently expect these routes.

### Auth

Frontend file:

```text
frontend/src/services/api/authApi.js
```

Routes:

```text
POST /api/auth/login
POST /api/auth/register
```

Status:

```text
Backend already has these.
Frontend still needs to call them instead of using mock login.
```

### Profile

Frontend file:

```text
frontend/src/services/api/profileApi.js
```

Routes:

```text
GET /api/profile/me
PUT /api/profile/me
GET /api/profile/:userId
```

Status:

```text
Backend already has these.
Settings screen still needs to hydrate/save profile through the API.
```

### Logs

Frontend file:

```text
frontend/src/services/api/logsApi.js
```

Routes expected by frontend:

```text
GET    /api/logs
POST   /api/logs
PUT    /api/logs/:logId
DELETE /api/logs/:logId
```

Status:

```text
Backend does not have these yet.
```

### Health Plan

Frontend file:

```text
frontend/src/services/api/healthPlanApi.js
```

Routes expected by frontend:

```text
GET  /api/health-plan
POST /api/health-plan/generate
PUT  /api/health-plan
```

Status:

```text
Backend does not have these yet.
```

### Milestones

Frontend file:

```text
frontend/src/services/api/milestonesApi.js
```

Routes expected by frontend:

```text
GET    /api/milestones
POST   /api/milestones
PUT    /api/milestones/:milestoneId
DELETE /api/milestones/:milestoneId
```

Status:

```text
Backend has a goals table, but no milestones routes yet.
Use the existing goals table or rename/align it with milestones.
```

### Social

Frontend file:

```text
frontend/src/services/api/socialApi.js
```

Routes expected by frontend:

```text
GET    /api/social/users?query=
GET    /api/social/feed/weekly
POST   /api/social/posts
POST   /api/social/posts/:postId/comments
DELETE /api/social/posts/:postId/comments/:commentId
POST   /api/social/posts/:postId/like
POST   /api/social/friends/:userId/request
DELETE /api/social/friends/:userId
```

Status:

```text
Backend has posts and connections tables, but no social routes yet.
Backend also needs comments and likes tables.
```

### AI Coach

Frontend file:

```text
frontend/src/services/api/coachApi.js
```

Routes expected by frontend:

```text
POST /api/coach/chat
GET  /api/coach/recommendations
```

Status:

```text
Backend does not have these yet.
These can start as rule-based placeholder responses before connecting a real AI provider.
```

## Update `server/src/app.js`

Current file only mounts auth/profile.

Recommended future `app.js`:

```js
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const logRoutes = require("./routes/log.routes");
const healthPlanRoutes = require("./routes/healthPlan.routes");
const milestoneRoutes = require("./routes/milestone.routes");
const socialRoutes = require("./routes/social.routes");
const coachRoutes = require("./routes/coach.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Jhoom backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/health-plan", healthPlanRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/coach", coachRoutes);

module.exports = app;
```

Only add a `require` after the route file exists, otherwise the server will crash.

## Database Tables To Add

The current database already has:

```text
users
profiles
posts
connections
goals
streaks
```

Add these tables for the current frontend:

```text
logs
health_plans
post_comments
post_likes
health_integrations
user_settings
```

### Logs Table

The log screen supports different types:

```text
workout
cardio
nutrition
caloriesBurned
sleep
steps
```

Because each type has different fields, use a JSON string column for values.

Add to `server/src/db/setupDb.js`:

```sql
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date_key TEXT NOT NULL,
  type_key TEXT NOT NULL,
  name TEXT NOT NULL,
  values_json TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

Suggested indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_logs_user_date
ON logs(user_id, date_key);

CREATE INDEX IF NOT EXISTS idx_logs_user_type
ON logs(user_id, type_key);
```

### Health Plans Table

The onboarding screen collects answers and generates a plan.

Add:

```sql
CREATE TABLE IF NOT EXISTS health_plans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  answers_json TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Post Comments Table

Add:

```sql
CREATE TABLE IF NOT EXISTS post_comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Post Likes Table

Add:

```sql
CREATE TABLE IF NOT EXISTS post_likes (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE(post_id, user_id),
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Health Integrations Table

This supports the settings toggle later.

Add:

```sql
CREATE TABLE IF NOT EXISTS health_integrations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  external_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  last_synced_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE(user_id, provider),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

Providers should be:

```text
apple_health
google_fit
```

For now, do not store real provider tokens until you have encryption and secure storage planned.

### User Settings Table

This supports units, privacy, and selected integration preference.

Add:

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  unit_system TEXT NOT NULL DEFAULT 'Metric',
  profile_visibility TEXT NOT NULL DEFAULT 'Friends only',
  selected_integration TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## Logs Backend

### Files To Add

```text
server/src/controllers/log.controller.js
server/src/routes/log.routes.js
```

### Route File

Create `server/src/routes/log.routes.js`:

```js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  getLogs,
  createLog,
  updateLog,
  deleteLog,
} = require("../controllers/log.controller");

router.get("/", protect, getLogs);
router.post("/", protect, createLog);
router.put("/:id", protect, updateLog);
router.delete("/:id", protect, deleteLog);

module.exports = router;
```

### Controller File

Create `server/src/controllers/log.controller.js`:

```js
const openDb = require("../db/connection");

function parseLog(row) {
  return {
    id: row.id,
    dateKey: row.date_key,
    typeKey: row.type_key,
    name: row.name,
    values: JSON.parse(row.values_json || "{}"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const getLogs = async (req, res) => {
  try {
    const db = await openDb();
    const { date, month, type } = req.query;
    const params = [req.user.id];
    const where = ["user_id = ?"];

    if (date) {
      where.push("date_key = ?");
      params.push(date);
    }

    if (month) {
      where.push("date_key LIKE ?");
      params.push(`${month}-%`);
    }

    if (type) {
      where.push("type_key = ?");
      params.push(type);
    }

    const rows = await db.all(
      `SELECT * FROM logs
       WHERE ${where.join(" AND ")}
       ORDER BY date_key DESC, created_at DESC`,
      params
    );

    res.json(rows.map(parseLog));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createLog = async (req, res) => {
  try {
    const { dateKey, typeKey, name, values } = req.body;

    if (!dateKey || !typeKey || !name || !values) {
      return res.status(400).json({
        error: "dateKey, typeKey, name and values are required",
      });
    }

    const db = await openDb();
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO logs
       (user_id, date_key, type_key, name, values_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        dateKey,
        typeKey,
        name,
        JSON.stringify(values),
        now,
        now,
      ]
    );

    const row = await db.get("SELECT * FROM logs WHERE id = ?", [result.lastID]);
    res.status(201).json(parseLog(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLog = async (req, res) => {
  try {
    const { dateKey, typeKey, name, values } = req.body;
    const db = await openDb();
    const now = new Date().toISOString();

    const existing = await db.get(
      "SELECT * FROM logs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Log not found" });
    }

    await db.run(
      `UPDATE logs
       SET date_key = ?,
           type_key = ?,
           name = ?,
           values_json = ?,
           updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        dateKey,
        typeKey,
        name,
        JSON.stringify(values),
        now,
        req.params.id,
        req.user.id,
      ]
    );

    const row = await db.get("SELECT * FROM logs WHERE id = ?", [req.params.id]);
    res.json(parseLog(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteLog = async (req, res) => {
  try {
    const db = await openDb();
    const existing = await db.get(
      "SELECT * FROM logs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Log not found" });
    }

    await db.run("DELETE FROM logs WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.id,
    ]);

    res.json({ message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getLogs,
  createLog,
  updateLog,
  deleteLog,
};
```

### Mount Logs Route

Edit:

```text
server/src/app.js
```

Add:

```js
const logRoutes = require("./routes/log.routes");
```

Then:

```js
app.use("/api/logs", logRoutes);
```

### Frontend Files To Edit For Logs

Primary file:

```text
frontend/app/log.js
```

Current state to replace:

```js
const [logs, setLogs] = useState(() => buildInitialLogs(todayKey));
```

Use:

```js
import { createLog, deleteLog, getLogs, updateLog } from "../src/services/api";
```

You will also need an auth token from a future auth store/context.

Backend-ready approach:

```js
const [logs, setLogs] = useState([]);
const [isLoadingLogs, setIsLoadingLogs] = useState(false);

async function loadLogs(dateKey) {
  setIsLoadingLogs(true);
  try {
    const data = await getLogs(token, { date: dateKey });
    setLogs(data);
  } catch (error) {
    setSaveError(error.message);
  } finally {
    setIsLoadingLogs(false);
  }
}
```

Then change:

```text
handleSave
handleDelete
handleSelectHistoryDate
handleSelectMetricDate
```

so they call the API instead of only updating local state.

Other frontend files that should read logs later:

```text
frontend/app/dashboard.js
frontend/app/milestones.js
frontend/app/ai.js
frontend/app/recommendations/index.js
frontend/app/settings/index.js
```

## Health Plan Backend

### Files To Add

```text
server/src/controllers/healthPlan.controller.js
server/src/routes/healthPlan.routes.js
```

### Route File

Create `server/src/routes/healthPlan.routes.js`:

```js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  getHealthPlan,
  generateHealthPlan,
  updateHealthPlan,
} = require("../controllers/healthPlan.controller");

router.get("/", protect, getHealthPlan);
router.post("/generate", protect, generateHealthPlan);
router.put("/", protect, updateHealthPlan);

module.exports = router;
```

### Controller File

Create `server/src/controllers/healthPlan.controller.js`:

```js
const openDb = require("../db/connection");

function buildPlanFromAnswers(answers) {
  const goal = answers.goal || "Build a balanced routine";
  const activityLevel = answers.activityLevel || "Beginner";
  const trainingDays = answers.trainingDays || "3 days per week";
  const sleepGoal = answers.sleepGoal || "7-8 hours";
  const equipment = answers.equipment || "available equipment";
  const dietaryPreference = answers.dietaryPreference || "balanced meals";

  return {
    title: goal,
    summary: `${activityLevel} - ${trainingDays} - ${sleepGoal}`,
    sections: [
      {
        title: "Training",
        body: `${goal} with ${trainingDays.toLowerCase()} using ${equipment.toLowerCase()}.`,
      },
      {
        title: "Recovery",
        body: `Build recovery around ${sleepGoal.toLowerCase()} and adjust for logged energy.`,
      },
      {
        title: "Nutrition",
        body: `Start with ${dietaryPreference.toLowerCase()} and tune portions from daily logs.`,
      },
    ],
    targets: {
      caloriesBurnedPerDay: 500,
      stepsPerDay: 8000,
    },
  };
}

function parsePlan(row) {
  return {
    id: row.id,
    answers: JSON.parse(row.answers_json || "{}"),
    plan: JSON.parse(row.plan_json || "{}"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const getHealthPlan = async (req, res) => {
  try {
    const db = await openDb();
    const row = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    if (!row) {
      return res.status(404).json({ error: "Health plan not found" });
    }

    res.json(parsePlan(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateHealthPlan = async (req, res) => {
  try {
    const answers = req.body;

    if (!answers || !answers.goal || !answers.activityLevel) {
      return res.status(400).json({
        error: "At least goal and activityLevel are required",
      });
    }

    const db = await openDb();
    const now = new Date().toISOString();
    const plan = buildPlanFromAnswers(answers);

    await db.run(
      `INSERT INTO health_plans
       (user_id, answers_json, plan_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         answers_json = excluded.answers_json,
         plan_json = excluded.plan_json,
         updated_at = excluded.updated_at`,
      [req.user.id, JSON.stringify(answers), JSON.stringify(plan), now, now]
    );

    const row = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    res.status(201).json(parsePlan(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateHealthPlan = async (req, res) => {
  try {
    const db = await openDb();
    const now = new Date().toISOString();
    const existing = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Health plan not found" });
    }

    const nextAnswers = req.body.answers || JSON.parse(existing.answers_json || "{}");
    const nextPlan = req.body.plan || JSON.parse(existing.plan_json || "{}");

    await db.run(
      `UPDATE health_plans
       SET answers_json = ?, plan_json = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        JSON.stringify(nextAnswers),
        JSON.stringify(nextPlan),
        now,
        req.user.id,
      ]
    );

    const row = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    res.json(parsePlan(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getHealthPlan,
  generateHealthPlan,
  updateHealthPlan,
};
```

### Mount Health Plan Route

Edit:

```text
server/src/app.js
```

Add:

```js
const healthPlanRoutes = require("./routes/healthPlan.routes");
app.use("/api/health-plan", healthPlanRoutes);
```

### Frontend Files To Edit For Health Plan

Primary file:

```text
frontend/app/(onboarding)/basic-info.js
```

Current temporary storage:

```js
saveOnboardingAnswers(...)
```

Replace with:

```js
import { generateHealthPlan } from "../../src/services/api";
```

Then on generate:

```js
const result = await generateHealthPlan(token, {
  ...basicInfo,
  ...planDetails,
});
```

Save the returned plan in your app state/store.

Other files that currently read from the temporary health-plan store:

```text
frontend/app/ai.js
frontend/app/dashboard.js
frontend/app/recommendations/index.js
frontend/src/features/health-plan/healthPlan.js
```

Eventually, `frontend/src/features/health-plan/healthPlan.js` should either:

```text
1. be removed,
2. become pure formatting helpers,
3. or become a frontend adapter around backend plan data.
```

## Milestones Backend

The frontend calls these "milestones".
The current database calls the table "goals".

You can choose one of two paths:

```text
Option A: keep the `goals` table and expose it through `/api/milestones`.
Option B: rename/add a `milestones` table.
```

The fastest path is Option A.

### Files To Add

```text
server/src/controllers/milestone.controller.js
server/src/routes/milestone.routes.js
```

### Route File

Create `server/src/routes/milestone.routes.js`:

```js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require("../controllers/milestone.controller");

router.get("/", protect, getMilestones);
router.post("/", protect, createMilestone);
router.put("/:id", protect, updateMilestone);
router.delete("/:id", protect, deleteMilestone);

module.exports = router;
```

### Controller Mapping

Map frontend milestone fields to database goal fields:

```text
title -> goals.title
detail -> goals.description
targetDate -> goals.deadline
progress -> goals.current_value / goals.target_value
completed -> goals.status
```

Suggested response shape for frontend:

```json
{
  "id": 1,
  "title": "Workout week",
  "detail": "Complete 4 workouts",
  "targetDate": "2026-05-30",
  "category": "Workouts",
  "progress": 0.5,
  "progressLabel": "2/4",
  "completed": false
}
```

### Frontend Files To Edit For Milestones

Primary file:

```text
frontend/app/milestones.js
```

Replace:

```js
const [milestones, setMilestones] = useState(starterMilestones);
```

with API loading:

```js
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  updateMilestone,
} from "../src/services/api";
```

Functions to update:

```text
handleSaveMilestone
handleEditMilestone
handleDeleteMilestone
handleToggleMilestone
```

Dashboard may also use milestones later:

```text
frontend/app/dashboard.js
```

## Social Backend

The frontend social screen supports:

```text
search users
send friend request
approve/remove/refuse friends
weekly feed
create post
upload photo placeholder
add comments
delete comments
like posts
report/block placeholder
```

The current backend has:

```text
posts
connections
```

But the current backend does not have:

```text
post_comments
post_likes
route/controller files
weekly feed query
search users route
```

### Files To Add

```text
server/src/controllers/social.controller.js
server/src/routes/social.routes.js
```

### Route File

Create `server/src/routes/social.routes.js`:

```js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  searchUsers,
  getWeeklyFeed,
  createPost,
  addComment,
  deleteComment,
  togglePostLike,
  sendFriendRequest,
  removeFriend,
} = require("../controllers/social.controller");

router.get("/users", protect, searchUsers);
router.get("/feed/weekly", protect, getWeeklyFeed);
router.post("/posts", protect, createPost);
router.post("/posts/:postId/comments", protect, addComment);
router.delete("/posts/:postId/comments/:commentId", protect, deleteComment);
router.post("/posts/:postId/like", protect, togglePostLike);
router.post("/friends/:userId/request", protect, sendFriendRequest);
router.delete("/friends/:userId", protect, removeFriend);

module.exports = router;
```

### Important Social Backend Details

Friend statuses should use consistent strings:

```text
pending
accepted
rejected
blocked
```

Weekly feed should reset every week.

Recommended approach:

```text
Posts stay in the database permanently.
The weekly feed endpoint only returns posts created between this week's Monday and next Monday.
```

That matches the frontend behavior where the feed resets each week.

### Frontend Files To Edit For Social

Primary file:

```text
frontend/app/social/index.js
```

Replace local constants/state:

```js
const FRIENDS = [...]
const [posts, setPosts] = useState(() => buildStarterPosts(...));
```

with:

```js
import {
  addComment,
  createPost,
  deleteComment,
  getWeeklyFeed,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  togglePostLike,
} from "../../src/services/api";
```

Functions to update:

```text
handleAddFriend
handleApprovePendingFriend
handleAddComment
handleDeleteComment
handleToggleLike
handleBlockFriend
handleCreatePost
```

Other social files:

```text
frontend/app/social/friends.js
frontend/app/social/post/[id].js
```

These should use the same social API once the backend routes exist.

## AI Coach Backend

The frontend expects:

```text
POST /api/coach/chat
GET  /api/coach/recommendations
```

Start simple.
Do not connect a real AI provider until the rest of the app data is reliable.

### Files To Add

```text
server/src/controllers/coach.controller.js
server/src/routes/coach.routes.js
```

### Route File

Create `server/src/routes/coach.routes.js`:

```js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  askHealthCoach,
  getRecommendations,
} = require("../controllers/coach.controller");

router.post("/chat", protect, askHealthCoach);
router.get("/recommendations", protect, getRecommendations);

module.exports = router;
```

### Placeholder Controller

Create `server/src/controllers/coach.controller.js`:

```js
const openDb = require("../db/connection");

const askHealthCoach = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const db = await openDb();
    const plan = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    res.json({
      reply:
        "Based on your current plan and logs, start with one realistic action today, log the result, and adjust tomorrow from recovery and energy.",
      context: {
        hasPlan: Boolean(plan),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    res.json([
      {
        title: "Training",
        body: "Complete today's planned movement and keep the intensity realistic.",
      },
      {
        title: "Recovery",
        body: "Use sleep and energy logs to decide whether to push or reduce intensity.",
      },
      {
        title: "Nutrition",
        body: "Log meals consistently so calorie and protein guidance can improve.",
      },
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  askHealthCoach,
  getRecommendations,
};
```

### Later Real AI Provider Integration

When ready, the AI coach endpoint should receive:

```text
user message
current health plan
recent logs
milestones
basic profile context
```

The backend should build a safe prompt and return:

```json
{
  "reply": "..."
}
```

Do not let the frontend call an AI provider directly.
Keep AI keys and prompt logic on the backend.

### Frontend Files To Edit For AI

Primary file:

```text
frontend/app/ai.js
```

Replace:

```js
setTimeout(() => {
  ...
}, 450);
```

with:

```js
import { askHealthCoach } from "../src/services/api";
```

Then:

```js
const response = await askHealthCoach(token, {
  message: trimmedQuestion,
});
```

Use:

```js
response.reply
```

for the coach message.

Recommendations screen:

```text
frontend/app/recommendations/index.js
```

Replace:

```js
getCurrentPlanSections()
```

with:

```js
getRecommendations(token)
```

## Settings And Integrations Backend

The settings page now has working local UI, but the backend still needs to persist:

```text
unit system
selected integration
integration status
profile visibility
profile details
profile photo URL
friend actions
log export/delete actions
account deletion
```

### Existing Profile Routes Can Handle Some Settings

Current route:

```text
PUT /api/profile/me
```

Can update:

```text
full_name
age
height_cm
weight_kg
bio
profile_picture_url
is_age_public
is_height_public
is_weight_public
```

But settings also needs:

```text
unit_system
profile_visibility
selected_integration
integration connection status
```

Use the `user_settings` and `health_integrations` tables described above.

### Recommended New Settings Routes

You can either:

```text
Option A: add settings routes under /api/profile/settings
Option B: create /api/settings
```

Simplest with current frontend:

```text
GET /api/profile/me
PUT /api/profile/me
```

and add fields to the profile response from joined `user_settings`.

Cleaner long-term:

```text
GET /api/settings
PUT /api/settings
POST /api/settings/integrations/:provider/connect
POST /api/settings/integrations/:provider/disconnect
```

If you choose the cleaner path, add:

```text
server/src/controllers/settings.controller.js
server/src/routes/settings.routes.js
```

Then add frontend file:

```text
frontend/src/services/api/settingsApi.js
```

And export it from:

```text
frontend/src/services/api/index.js
```

### Health Integrations Toggle

Current frontend file:

```text
frontend/app/settings/index.js
```

Current behavior:

```text
The Apple Health / Google Fit toggle only changes local state and displays a notice.
```

Backend-ready behavior:

```text
1. User selects Apple Health or Google Fit.
2. Frontend calls backend to save selected integration.
3. If provider requires connection, backend returns connection instructions or OAuth URL.
4. User completes provider auth/permission flow.
5. Backend saves connection status.
6. Logs/dashboard read imported health data.
```

Important note:

```text
Apple Health is normally device/native permission based.
Google Fit uses Google OAuth.
The exact implementation differs between Expo web, mobile app, and native builds.
```

For now, store only:

```text
selected provider
connection status
last synced time
```

Do not pretend real health sync exists until the native/provider flow is implemented.

### Frontend Files To Edit For Settings

Primary file:

```text
frontend/app/settings/index.js
```

Replace local state for:

```text
unitSystem
integration
profile
privacy
managedLogs
friendConnections
```

with backend data from:

```text
profileApi
logsApi
socialApi
future settingsApi
future integrationApi
```

Specific handlers to connect:

```text
handleUnitChange
handleIntegrationChange
handlePrivacyChange
handleSaveProfile
handleDeleteOldLogs
handleExportWeeklyLogs
handleAcceptFriend
handleRemoveFriend
```

## Auth Frontend Wiring

The backend already supports auth.
This should be the first frontend connection.

### Current Login File

```text
frontend/app/(auth)/login.js
```

Current temporary logic:

```js
const MOCK_LOGIN = {
  email: "demo@jhoom.app",
  password: "password123",
};
```

And:

```js
const isAuthorised =
  normalisedEmail === MOCK_LOGIN.email && password === MOCK_LOGIN.password;
```

Replace with:

```js
import { loginUser } from "../../src/services/api";
```

Then:

```js
try {
  const result = await loginUser({
    email: normalisedEmail,
    password,
  });

  // Save result.token and result.user in auth state/storage.
  router.replace("/dashboard");
} catch (error) {
  setLoginError("The details were incorrect.");
}
```

### Current Register File

```text
frontend/app/(auth)/register.js
```

Replace the temporary success route:

```js
router.replace("/(onboarding)/basic-info");
```

with:

```js
import { registerUser } from "../../src/services/api";
```

Then:

```js
try {
  const result = await registerUser({
    username,
    email,
    password,
  });

  // Save result.token and result.user in auth state/storage.
  router.replace("/(onboarding)/basic-info");
} catch (error) {
  setFormError(error.message);
}
```

## Add Auth State To The Frontend

Right now there is no shared token store.
Add one before connecting multiple protected endpoints.

Recommended file:

```text
frontend/src/store/authStore.js
```

Simple first version:

```js
let authState = {
  token: null,
  user: null,
};

export function setAuthSession(session) {
  authState = {
    token: session.token,
    user: session.user,
  };
}

export function getAuthSession() {
  return { ...authState };
}

export function clearAuthSession() {
  authState = {
    token: null,
    user: null,
  };
}
```

This is enough to start wiring screens during development.

Later, replace it with:

```text
React Context
or Zustand
or another real app state solution
plus secure token persistence
```

For Expo, token persistence options include:

```text
expo-secure-store for native app builds
localStorage fallback for web
```

## Dashboard Backend Data

The dashboard currently builds from local mock data in:

```text
frontend/app/dashboard.js
```

Current temporary source:

```js
const defaultDashboardSource = { ... }
```

The dashboard needs:

```text
streak count
calories burned today
sleep time today
steps today
workouts this week
tomorrow's workout
tomorrow's focus
weekly calories burned series
weekly steps series
weekly sleep series
monthly workout completion series
AI targets
```

You can build this in two ways.

### Option A: Frontend Composes Dashboard

Frontend calls:

```text
GET /api/logs?month=YYYY-MM
GET /api/health-plan
GET /api/milestones
GET /api/profile/me
```

Then `buildDashboardViewModel` maps data.

This keeps backend simpler.

### Option B: Backend Provides Dashboard Summary

Add:

```text
GET /api/dashboard
```

Backend returns:

```json
{
  "streakCount": 1,
  "caloriesBurned": "540 kcal",
  "sleepTime": "7h 48m",
  "steps": "8214",
  "workoutsThisWeek": "4 done",
  "tomorrowsWorkout": "Push day",
  "tomorrowsFocus": "Chest + shoulders",
  "weeklyCaloriesTargetPerDay": 500,
  "weeklyStepsTargetPerDay": 8000,
  "weeklyCaloriesBurned": [],
  "weeklyStepsCompleted": [],
  "weeklySleepTime": [],
  "monthlyWorkoutsCompleted": []
}
```

This keeps frontend simpler.

Recommended path:

```text
Start with Option A.
Move to Option B if dashboard calculations become complex.
```

## File Uploads And Profile Photos

The frontend has UI placeholders for profile photo and post photo upload.

Current files:

```text
frontend/app/(auth)/register.js
frontend/app/settings/index.js
frontend/app/social/index.js
```

The backend currently has no upload handling.

Recommended first backend path:

```text
Use multer for local development uploads.
Store uploaded files under server/uploads.
Save only the file URL/path in SQLite.
```

Install:

```bash
cd server
npm install multer
```

Add static serving in `server/src/app.js`:

```js
app.use("/uploads", express.static("uploads"));
```

Later, for production, use:

```text
S3
Cloudinary
Firebase Storage
or another object storage provider
```

Do not store image binary data directly in SQLite.

## Validation Rules To Add

The frontend currently validates many forms.
The backend must repeat important validation because frontend validation can be bypassed.

### Auth

Validate:

```text
email is present
email looks valid
password is present
password length >= 8
username is present
username is unique
email is unique
```

### Logs

Validate:

```text
dateKey is YYYY-MM-DD
typeKey is one of the allowed log types
name is present
values is an object
values size is not too large
```

### Health Plan

Validate:

```text
dateOfBirth format if present
height reasonable range
weight reasonable range
text fields max length
goal is one of the frontend choices
activityLevel is one of the frontend choices
```

### Social

Validate:

```text
caption length
comment length
cannot friend yourself
cannot create duplicate accepted connections
cannot like same post twice unless toggle behavior handles it
only comment owner can delete comment unless moderator/admin
```

### Settings

Validate:

```text
unit system is Imperial or Metric
profile visibility is Friends only or Private
integration provider is apple_health or google_fit
```

## Error Response Style

The frontend API client expects backend errors to use either:

```json
{
  "error": "Message here"
}
```

or:

```json
{
  "message": "Message here"
}
```

Best practice for this project:

```json
{
  "error": "Human readable error"
}
```

Keep that consistent.

The frontend client turns failed responses into:

```js
throw new Error(data?.error ?? data?.message ?? "API request failed");
```

That means screens can show:

```js
error.message
```

## Frontend Backend Wiring Checklist

### 1. Auth

Edit:

```text
frontend/app/(auth)/login.js
frontend/app/(auth)/register.js
frontend/src/store/authStore.js
```

Backend required:

```text
Already exists.
```

Goal:

```text
User can register/login with backend and get a token.
```

### 2. Profile And Settings

Edit:

```text
frontend/app/settings/index.js
frontend/src/services/api/profileApi.js
```

Backend required:

```text
Already has profile routes.
May need settings/integrations routes.
```

Goal:

```text
Settings screen loads and saves real profile/preferences.
```

### 3. Onboarding And Health Plan

Edit:

```text
frontend/app/(onboarding)/basic-info.js
frontend/app/ai.js
frontend/app/dashboard.js
frontend/app/recommendations/index.js
frontend/src/features/health-plan/healthPlan.js
```

Backend required:

```text
Add health plan routes/table.
```

Goal:

```text
Onboarding answers create a saved health plan.
```

### 4. Logs

Edit:

```text
frontend/app/log.js
frontend/app/dashboard.js
frontend/app/settings/index.js
frontend/app/ai.js
```

Backend required:

```text
Add logs table/routes/controller.
```

Goal:

```text
User can create, edit, delete, and filter persisted logs.
```

### 5. Milestones

Edit:

```text
frontend/app/milestones.js
frontend/app/dashboard.js
```

Backend required:

```text
Add milestone routes using existing goals table.
```

Goal:

```text
User can create/edit/delete goals and progress can be calculated from logs.
```

### 6. Social

Edit:

```text
frontend/app/social/index.js
frontend/app/social/friends.js
frontend/app/social/post/[id].js
frontend/app/settings/index.js
```

Backend required:

```text
Add social routes/controller plus comments/likes tables.
```

Goal:

```text
User can find friends, request friends, post weekly updates, comment, like, and manage connections.
```

### 7. AI Coach

Edit:

```text
frontend/app/ai.js
frontend/app/recommendations/index.js
```

Backend required:

```text
Add coach routes/controller.
Start placeholder, then connect real AI provider later.
```

Goal:

```text
AI coach responds using saved plan and logs.
```

## Testing The Backend Manually

Use Thunder Client, Postman, Insomnia, or curl.

### Test Root

```bash
curl http://localhost:5000/
```

Expected:

```text
Jhoom backend is running
```

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@jhoom.app","password":"password123","username":"demo"}'
```

Expected:

```json
{
  "message": "User registered successfully",
  "token": "...",
  "user": {
    "id": 1,
    "email": "demo@jhoom.app",
    "username": "demo"
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@jhoom.app","password":"password123"}'
```

Copy the token.

### Get My Profile

```bash
curl http://localhost:5000/api/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Log

After logs backend exists:

```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateKey": "2026-04-15",
    "typeKey": "sleep",
    "name": "Overnight sleep",
    "values": {
      "hours": "7.8",
      "bedtime": "23:10",
      "wakeTime": "07:05"
    }
  }'
```

### Generate Health Plan

After health plan backend exists:

```bash
curl -X POST http://localhost:5000/api/health-plan/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Gain muscle",
    "activityLevel": "Beginner",
    "trainingDays": "3 days per week",
    "equipment": "Gym access",
    "sleepGoal": "7-8 hours",
    "dietaryPreference": "High protein"
  }'
```

## Recommended Backend Folder Structure After Additions

```text
server/
  src/
    app.js
    server.js
    config/
      env.js
    controllers/
      auth.controller.js
      profile.controller.js
      log.controller.js
      healthPlan.controller.js
      milestone.controller.js
      social.controller.js
      coach.controller.js
      settings.controller.js
    db/
      connection.js
      setupDb.js
      seedDb.js
    middleware/
      auth.middleware.js
    routes/
      auth.routes.js
      profile.routes.js
      log.routes.js
      healthPlan.routes.js
      milestone.routes.js
      social.routes.js
      coach.routes.js
      settings.routes.js
```

Only add `settings.controller.js` and `settings.routes.js` if you decide not to keep settings inside profile routes.

## Suggested Backend Implementation Phases

### Phase 1: Foundation

Do:

```text
add package scripts
fix connection.js db path
run setupDb
test auth/profile
```

Frontend:

```text
connect login/register to authApi
add auth token store
```

### Phase 2: Logs

Do:

```text
add logs table
add log routes/controller
mount /api/logs
test CRUD manually
```

Frontend:

```text
connect log screen to logsApi
```

### Phase 3: Health Plan

Do:

```text
add health_plans table
add health plan routes/controller
mount /api/health-plan
```

Frontend:

```text
connect onboarding to generateHealthPlan
connect AI/dashboard/recommendations to saved plan
```

### Phase 4: Dashboard And Milestones

Do:

```text
add milestone routes/controller
use goals table or create milestones table
build dashboard data from logs and plan
```

Frontend:

```text
connect milestones screen
replace dashboard mock source
```

### Phase 5: Social

Do:

```text
add comments/likes tables
add social routes/controller
add weekly feed filtering
```

Frontend:

```text
connect social feed/search/comments/likes/friends
```

### Phase 6: AI And Integrations

Do:

```text
add coach routes/controller
add settings/integration persistence
add real provider connection planning
```

Frontend:

```text
connect AI chat
connect recommendations
connect settings integration toggle
```

## Production Hardening Checklist

Before real users:

```text
Use a strong JWT secret.
Use HTTPS in production.
Do not expose stack traces or raw database errors.
Add request validation.
Add rate limiting to auth routes.
Hash passwords with bcrypt.
Store tokens securely on frontend.
Protect all user data routes with auth middleware.
Check row ownership before update/delete.
Add database migrations instead of editing setupDb forever.
Add tests for controllers and routes.
Add CORS allowed origins instead of open cors.
Add upload size limits.
Add privacy checks for social/profile data.
Add AI safety rules before returning health advice.
```

## Backend And Frontend Contract Summary

Use this as the final target.

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/profile/me
PUT    /api/profile/me
GET    /api/profile/:userId

GET    /api/logs
POST   /api/logs
PUT    /api/logs/:logId
DELETE /api/logs/:logId

GET    /api/health-plan
POST   /api/health-plan/generate
PUT    /api/health-plan

GET    /api/milestones
POST   /api/milestones
PUT    /api/milestones/:milestoneId
DELETE /api/milestones/:milestoneId

GET    /api/social/users?query=
GET    /api/social/feed/weekly
POST   /api/social/posts
POST   /api/social/posts/:postId/comments
DELETE /api/social/posts/:postId/comments/:commentId
POST   /api/social/posts/:postId/like
POST   /api/social/friends/:userId/request
DELETE /api/social/friends/:userId

POST   /api/coach/chat
GET    /api/coach/recommendations
```

## Most Important Frontend Files To Know

Auth:

```text
frontend/app/(auth)/login.js
frontend/app/(auth)/register.js
frontend/src/services/api/authApi.js
```

Onboarding/health plan:

```text
frontend/app/(onboarding)/basic-info.js
frontend/src/services/api/healthPlanApi.js
frontend/src/features/health-plan/healthPlan.js
```

Dashboard:

```text
frontend/app/dashboard.js
```

Logs:

```text
frontend/app/log.js
frontend/src/services/api/logsApi.js
```

Milestones:

```text
frontend/app/milestones.js
frontend/src/services/api/milestonesApi.js
```

AI:

```text
frontend/app/ai.js
frontend/app/recommendations/index.js
frontend/src/services/api/coachApi.js
```

Social:

```text
frontend/app/social/index.js
frontend/app/social/friends.js
frontend/app/social/post/[id].js
frontend/src/services/api/socialApi.js
```

Settings:

```text
frontend/app/settings/index.js
frontend/src/services/api/profileApi.js
```

API base:

```text
frontend/src/services/api/client.js
frontend/.env.example
```

## Final Recommendation

Do not try to connect everything at once.

Use this path:

```text
Auth first.
Then logs.
Then onboarding/health plan.
Then dashboard.
Then milestones.
Then social.
Then AI.
Then integrations/uploads.
```

After each phase:

```text
1. Test the backend route manually.
2. Connect the frontend screen.
3. Run frontend lint.
4. Try the flow in the app.
5. Move to the next feature.
```

That gives you a backend that grows in the same shape as the frontend instead of fighting it.
