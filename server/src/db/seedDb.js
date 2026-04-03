const openDb = require("./connection");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

async function seed() {
  const db = await openDb();
  await db.exec("PRAGMA foreign_keys = ON;");
  console.log("Seeding database...");

//FIXED USERS FOR TESTING 
  const users = [
    { email: "test1@example.com", password: "hashedpassword1" },
    { email: "test2@example.com", password: "hashedpassword2" },
  ];

  for (const u of users) {
    await db.run(
      "INSERT INTO users (email, password_hash, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))",
      [u.email, u.password]
    );
  }

//PROFILES
  const profiles = [
    { user_id: 1, username: "testuser1", full_name: "Test User One", age: 25, height_cm: 170, weight_kg: 65, bio: "I love fitness!" },
    { user_id: 2, username: "testuser2", full_name: "Test User Two", age: 30, height_cm: 180, weight_kg: 75, bio: "Gym enthusiast." },
  ];

  for (const p of profiles) {
    await db.run(
      "INSERT INTO profiles (user_id, username, full_name, age, height_cm, weight_kg, bio, is_age_public, is_height_public, is_weight_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, datetime('now'), datetime('now'))",
      [p.user_id, p.username, p.full_name, p.age, p.height_cm, p.weight_kg, p.bio]
    );
  }

  //POSTS
  const postContents = [
    "I ran 5km today!",
    "Completed a 100 pushups challenge!",
    "Yoga session done!",
    "Hit a new personal best in bench press!",
  ];
  const achievementTypes = ["running", "strength", "flexibility", "strength"];

  for (let i = 0; i < 6; i++) {
    const user_id = randomChoice([1, 2]);
    const content = randomChoice(postContents);
    const type = achievementTypes[randomInt(0, achievementTypes.length - 1)];
    await db.run(
      "INSERT INTO posts (user_id, content, achievement_type, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      [user_id, content, type]
    );
  }

  //CONNECTIONS 
  await db.run(
    "INSERT INTO connections (requester_id, receiver_id, status, created_at, updated_at) VALUES (1, 2, 'pending', datetime('now'), datetime('now'))"
  );


//GOALS
  const goalTitles = ["Lose Weight", "Run 50 km", "Gain Muscle", "Daily Yoga"];
  for (let i = 0; i < 4; i++) {
    const user_id = randomChoice([1, 2]);
    const title = goalTitles[i];
    await db.run(
      "INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, date('now', '+7 days'), 'active', datetime('now'), datetime('now'))",
      [user_id, title, `This is the ${title} goal`, randomInt(5, 50), randomInt(0, 5), "units"]
    );
  }

//STREAKS 
for (const user_id of [1, 2]) {
  const daysAgo = randomInt(0, 3);   const dateString = `-${daysAgo} day`; 
  await db.run(
    `INSERT INTO streaks 
     (user_id, current_streak, longest_streak, last_activity_date, updated_at) 
     VALUES (?, ?, ?, date('now', '${dateString}'), datetime('now'))`,
    [user_id, randomInt(0, 5), randomInt(5, 10)]
  );
}

  console.log("Database seeded successfully!");
}

seed();