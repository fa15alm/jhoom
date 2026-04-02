users
- id INTEGER PRIMARY KEY
- email TEXT UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

profiles
- id INTEGER PRIMARY KEY
- user_id INTEGER UNIQUE NOT NULL
- username TEXT UNIQUE NOT NULL
- full_name TEXT
- age INTEGER
- height_cm REAL
- weight_kg REAL
- bio TEXT
- profile_picture_url TEXT
- is_age_public INTEGER DEFAULT 0
- is_height_public INTEGER DEFAULT 0
- is_weight_public INTEGER DEFAULT 0
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

posts
- id INTEGER PRIMARY KEY
- user_id INTEGER NOT NULL
- content TEXT NOT NULL
- achievement_type TEXT
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

connections
- id INTEGER PRIMARY KEY
- requester_id INTEGER NOT NULL
- receiver_id INTEGER NOT NULL
- status TEXT NOT NULL -- pending, accepted, rejected
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

goals
- id INTEGER PRIMARY KEY
- user_id INTEGER NOT NULL
- title TEXT NOT NULL
- description TEXT
- target_value REAL
- current_value REAL DEFAULT 0
- unit TEXT
- deadline DATE
- status TEXT DEFAULT 'active'
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

streaks
- id INTEGER PRIMARY KEY
- user_id INTEGER UNIQUE NOT NULL
- current_streak INTEGER DEFAULT 0
- longest_streak INTEGER DEFAULT 0
- last_activity_date DATE
- updated_at DATETIME NOT NULL
