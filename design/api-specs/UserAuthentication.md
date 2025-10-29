# API Specification: UserAuthentication Concept

**Purpose:** Identify users and manage their access credentials.

---

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Creates a new user account with the provided credentials.

**Requirements:**
- `username` is unique.
- `password` meets strength requirements (e.g., at least 6 characters long).

**Effects:**
- Creates a new `User` with the given `username` and a `password`.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuthentication/login

**Description:** Authenticates a user and creates a new session.

**Requirements:**
- `username` and `password` match an existing `User`.

**Effects:**
- Creates a new `ActiveSession` for the matched `User` with a unique `sessionId` and `expiryTime`, returning the `User` and `sessionId`.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "ID",
  "sessionId": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuthentication/logout

**Description:** Terminates an active user session.

**Requirements:**
- `sessionId` matches an existing `ActiveSession`.

**Effects:**
- Removes the `ActiveSession`.

**Request Body:**
```json
{
  "sessionId": "ID"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuthentication/invalidateExpiredSessions

**Description:** (System Action) Removes all sessions that have passed their expiry time.

**Requirements:**
- An `ActiveSession` exists where `currentTime` is after `expiryTime`.

**Effects:**
- Removes all `ActiveSessions` where `currentTime` is after `expiryTime`.

**Request Body:**
```json
{}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuthentication/_isValidSession

**Description:** (Query) Checks if a given session ID is currently active and valid.

**Requirements:**
- None.

**Effects:**
- None.

**Request Body:**
```json
{
  "sessionId": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "user": "ID"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuthentication/_getUserByUsername

**Description:** (Query) Retrieves a user's basic information by username.

**Requirements:**
- None.

**Effects:**
- None.

**Request Body:**
```json
{
  "username": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "user": "ID",
    "registrationDate": "Date"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---