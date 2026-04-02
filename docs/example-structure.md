jhoom/
├─ README.md
├─ docs/
│  ├─ mvp.md
│  ├─ api-contract.md
│  ├─ db-schema.md
│  └─ meeting-notes.md
├─ mobile/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login.tsx
│  │  │  └─ register.tsx
│  │  ├─ (tabs)/
│  │  │  ├─ feed.tsx
│  │  │  ├─ profile.tsx
│  │  │  └─ connections.tsx
│  │  └─ _layout.tsx
│  ├─ src/
│  │  ├─ components/
│  │  ├─ features/
│  │  │  ├─ auth/
│  │  │  ├─ profile/
│  │  │  ├─ feed/
│  │  │  └─ connections/
│  │  ├─ services/
│  │  ├─ hooks/
│  │  ├─ utils/
│  │  └─ types/
│  ├─ package.json
│  └─ app.json
├─ server/
│  ├─ src/
│  │  ├─ routes/
│  │  ├─ controllers/
│  │  ├─ services/
│  │  ├─ middleware/
│  │  ├─ db/
│  │  │  ├─ migrations/
│  │  │  ├─ seeds/
│  │  │  └─ connection.js
│  │  ├─ models/
│  │  └─ utils/
│  ├─ package.json
│  └─ .env.example
└─ .github/
   ├─ pull_request_template.md
   └─ ISSUE_TEMPLATE/
