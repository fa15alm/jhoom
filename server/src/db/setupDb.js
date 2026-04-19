const openDb = require("./connection");

async function columnExists(db, tableName, columnName) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function addColumnIfMissing(db, tableName, columnName, definition) {
  if (await columnExists(db, tableName, columnName)) {
    return;
  }

  await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

async function setupDb() {
  const db = await openDb();

  // foreign key enforcement
  await db.exec("PRAGMA foreign_keys = ON;");

  // users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified_at DATETIME,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `);

  await addColumnIfMissing(db, "users", "email_verified_at", "DATETIME");

  // profiles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      date_of_birth TEXT,
      age INTEGER,
      height_cm REAL,
      weight_kg REAL,
      bio TEXT,
      profile_picture_url TEXT,
      is_dob_public INTEGER DEFAULT 0,
      is_age_public INTEGER DEFAULT 0,
      is_height_public INTEGER DEFAULT 0,
      is_weight_public INTEGER DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await addColumnIfMissing(db, "profiles", "date_of_birth", "TEXT");
  await addColumnIfMissing(db, "profiles", "age", "INTEGER");
  await addColumnIfMissing(db, "profiles", "profile_picture_url", "TEXT");
  await addColumnIfMissing(db, "profiles", "is_dob_public", "INTEGER DEFAULT 0");
  await addColumnIfMissing(db, "profiles", "is_age_public", "INTEGER DEFAULT 0");

  //health plan table
  await db.exec(`
  CREATE TABLE IF NOT EXISTS health_plans (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    answers_json TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_health_plans_user_id
  ON health_plans(user_id);
`);
  
  // posts table 
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      achievement_type TEXT,
      image_url TEXT,
      week_key TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await addColumnIfMissing(db, "posts", "image_url", "TEXT");
  await addColumnIfMissing(db, "posts", "week_key", "TEXT");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL,
      UNIQUE(post_id, user_id),
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // connections table 
  await db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY,
      requester_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(requester_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_pair
    ON connections(requester_id, receiver_id);
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_blocks (
      id INTEGER PRIMARY KEY,
      blocker_id INTEGER NOT NULL,
      blocked_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL,
      UNIQUE(blocker_id, blocked_id),
      FOREIGN KEY(blocker_id) REFERENCES users(id),
      FOREIGN KEY(blocked_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY,
      reporter_id INTEGER NOT NULL,
      reported_user_id INTEGER,
      post_id INTEGER,
      comment_id INTEGER,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(reporter_id) REFERENCES users(id),
      FOREIGN KEY(reported_user_id) REFERENCES users(id),
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE SET NULL,
      FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE SET NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON password_reset_tokens(token_hash);
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash
    ON email_verification_tokens(token_hash);
  `);

  // goals table 
  await db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      goal_type TEXT DEFAULT 'custom',
      target_value REAL,
      current_value REAL DEFAULT 0,
      unit TEXT,
      goal_config_json TEXT,
      deadline DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await addColumnIfMissing(db, "goals", "goal_type", "TEXT DEFAULT 'custom'");
  await addColumnIfMissing(db, "goals", "goal_config_json", "TEXT");

  //logs table
  await db.exec(`
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
`);

  await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_logs_user_date
  ON logs(user_id, date_key);

  CREATE INDEX IF NOT EXISTS idx_logs_user_type
  ON logs(user_id, type_key);
`);
  
  // streaks table 
  await db.exec(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date DATE,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  
  console.log("Jhoom database setup complete. All tables created.");
  await db.close();
}

if (require.main === module) {
  setupDb().catch((err) => {
    console.error("Error setting up database:", err);
    process.exit(1);
  });
}

module.exports = setupDb;
