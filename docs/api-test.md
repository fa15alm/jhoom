# How to test it

Test in this order so you do not confuse yourself.

---

## 1. Run the DB setup

From inside `server/`, run your DB setup file so the tables exist first. Your current backend depends on the schema already being created.

```bash
node src/db/setupDb.js
```

If that works, you should see the log message from your teammate’s setup script.

---

## 2. Start the server

Then run:

```bash
node src/server.js
```

If it starts correctly, your terminal should show the port log from `server.js`.

---

## 3. Test the root route

Open: <http://localhost:5000/>

If your `app.js` contains the basic root route, you should get something like:
`Jhoom backend is running`

---

## 4. Test auth routes

Use **Postman**, **Insomnia**, or **Thunder Client** in VS Code. For a beginner‑friendly setup, **Thunder Client** (VS Code extension) is probably the easiest.

### Register

- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Body (JSON):

```json
{
  "email": "test1@example.com",
  "password": "password123",
  "username": "testuser1"
}
```

**Expected:**
- success message
- token
- user object

### Login

- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Body (JSON):

```json
{
  "email": "test1@example.com",
  "password": "password123"
}
```

**Expected:**
- success message
- token
- user object

---

## 5. Test protected profile route

After login, copy the token.

- Method: `GET`
- URL: `http://localhost:5000/api/profile/me`
- Headers:

```text
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:**
- your profile row from the database

---

## 6. Test profile update

- Method: `PUT`
- URL: `http://localhost:5000/api/profile/me`
- Headers:

```text
Authorization: Bearer YOUR_TOKEN_HERE
```

- Body (JSON):

```json
{
  "full_name": "Test User",
  "age": 20,
  "height_cm": 180,
  "weight_kg": 75,
  "bio": "I like gym",
  "profile_picture_url": "",
  "is_age_public": true,
  "is_height_public": false,
  "is_weight_public": true
}
```

**Expected:**
- success message

---

## 7. Test public profile

- Method: `GET`
- URL: `http://localhost:5000/api/profile/1`

**Expected:**
- only the public fields should be shown for `age`/`height`/`weight` based on your privacy flags.
