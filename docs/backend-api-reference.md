# Jhoom Backend API Reference

Base URL (dev): `http://localhost:<PORT>` (port in server/.env / server/src/config.env.js).  
All JSON responses use `application/json`.

## Authentication

### Token format

Protected routes expect a JWT in the `Authorization` header.

- Header name: `Authorization`
- Format: `Bearer <token>`

If the header is missing or does not start with `Bearer ` you get:

```json
{
  "error": "No token provided"
}
```

If the token is invalid or expired you get:

```json
{
  "error": "Invalid token"
}
```

---

## Auth routes

Base path: `/api/auth`

### POST `/api/auth/register`

Register a new user and create their profile. Returns a JWT and basic user info.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "plaintext-password",
  "username": "uniqueUsername"
}
```

- `email` (string, required) – must be unique.
- `password` (string, required).
- `username` (string, required) – must be unique.

**Success response – 201**

```json
{
  "message": "User registered successfully",
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "uniqueUsername"
  }
}
```

**Error responses**

- 400 – Missing fields:

  ```json
  {
    "error": "Email, password and username are required"
  }
  ```

- 400 – Email already exists:

  ```json
  {
    "error": "Email already exists"
  }
  ```

- 400 – Username taken:

  ```json
  {
    "error": "Username already taken"
  }
  ```

- 500 – Server/db error:

  ```json
  {
    "error": "<error message>"
  }
  ```

---

### POST `/api/auth/login`

Log in an existing user. Returns a JWT and basic user info.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "plaintext-password"
}
```

- `email` (string, required).
- `password` (string, required).

**Success response – 200**

```json
{
  "message": "Login successful",
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Error responses**

- 400 – Missing fields:

  ```json
  {
    "error": "Email and password are required"
  }
  ```

- 400 – Invalid email or password:

  ```json
  {
    "error": "Invalid email or password"
  }
  ```

- 500 – Server/db error:

  ```json
  {
    "error": "<error message>"
  }
  ```

---

## Profile routes

Base path: `/api/profile`

### GET `/api/profile/me` (protected)

Get the logged-in user’s full profile. Requires `Authorization: Bearer <token>`.

**Headers**

- `Authorization: Bearer <token>`

**Success response – 200**

Returns the full row from `profiles` for the current user, e.g.:

```json
{
  "id": 1,
  "user_id": 1,
  "username": "uniqueUsername",
  "full_name": "User Name",
  "age": 25,
  "height_cm": 180,
  "weight_kg": 75,
  "bio": "Short bio",
  "profile_picture_url": "https://example.com/avatar.png",
  "is_age_public": 1,
  "is_height_public": 0,
  "is_weight_public": 1,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-02T00:00:00.000Z"
}
```

(Field names and shape follow the `profiles` table.)

**Error responses**

- 401 – Missing/invalid token:

  ```json
  {
    "error": "No token provided"
  }
  ```

  or

  ```json
  {
    "error": "Invalid token"
  }
  ```

- 404 – Profile not found:

  ```json
  {
    "error": "Profile not found"
  }
  ```

- 500 – Server/db error:

  ```json
  {
    "error": "<error message>"
  }
  ```

---

### PUT `/api/profile/me` (protected)

Update the logged-in user’s profile. Requires `Authorization: Bearer <token>`.

**Headers**

- `Authorization: Bearer <token>`

**Request body**

All fields are taken from `req.body` and written to the profile row; for now, the backend expects all of them to be present.

```json
{
  "full_name": "User Name",
  "age": 25,
  "height_cm": 180,
  "weight_kg": 75,
  "bio": "Short bio",
  "profile_picture_url": "https://example.com/avatar.png",
  "is_age_public": true,
  "is_height_public": false,
  "is_weight_public": true
}
```

Notes:

- `is_age_public`, `is_height_public`, `is_weight_public` are booleans in the request; backend converts them to `1` or `0`.
- `updated_at` is set automatically on the server.

**Success response – 200**

```json
{
  "message": "Profile updated successfully"
}
```

**Error responses**

- 401 – Missing/invalid token:

  ```json
  {
    "error": "No token provided"
  }
  ```

  or

  ```json
  {
    "error": "Invalid token"
  }
  ```

- 500 – Server/db error:

  ```json
  {
    "error": "<error message>"
  }
  ```

---

### GET `/api/profile/:id`

Get another user’s **public** profile by `user_id`. No auth required.

Path param:

- `id` – the `user_id` whose profile you want.

**Success response – 200**

Returns only public fields; private ones come back as `null` when their `is_*_public` flag is off.

```json
{
  "id": 1,
  "user_id": 1,
  "username": "uniqueUsername",
  "full_name": "User Name",
  "bio": "Short bio",
  "profile_picture_url": "https://example.com/avatar.png",
  "age": 25,
  "height_cm": null,
  "weight_kg": 75
}
```

In this example, `height_cm` is hidden because `is_height_public` is false.

**Error responses**

- 404 – Profile not found:

  ```json
  {
    "error": "Profile not found"
  }
  ```

- 500 – Server/db error:

  ```json
  {
    "error": "<error message>"
  }
  ```

---

## Test route

For quick health checks, there is a simple test route.

### GET `/`

**Success response – 200**

Plain text:

```text
Jhoom backend is running
```

---

## Quick header and URL summary

| Area    | Method | URL                  | Auth header               |
|---------|--------|----------------------|---------------------------|
| Test    | GET    | `/`                  | None                      |
| Auth    | POST   | `/api/auth/register` | None                      |
| Auth    | POST   | `/api/auth/login`    | None                      |
| Profile | GET    | `/api/profile/me`    | `Authorization: Bearer …` |
| Profile | PUT    | `/api/profile/me`    | `Authorization: Bearer …` |
| Profile | GET    | `/api/profile/:id`   | None                      |
