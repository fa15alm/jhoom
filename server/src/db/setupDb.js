const openDb = require("./connection");

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
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `);

  // profiles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      date_of_birth TEXT,
      height_cm REAL,
      weight_kg REAL,
      bio TEXT,
      profile_picture_url TEXT,
      is_dob_public INTEGER DEFAULT 0,
      is_height_public INTEGER DEFAULT 0,
      is_weight_public INTEGER DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

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
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
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

  // goals table 
  await db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_value REAL,
      current_value REAL DEFAULT 0,
      unit TEXT,
      deadline DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

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

// run script safely
setupDb().catch((err) => {
  console.error("Error setting up database:", err);
});
