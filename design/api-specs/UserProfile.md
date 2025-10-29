# API Specification: UserProfile Concept

**Purpose:** Store and manage user-specific descriptive information, distinct from authentication credentials.

---

## API Endpoints

### POST /api/UserProfile/createProfile

**Description:** Creates a new profile for a user with a given display name.

**Requirements:**
- `user` exists.
- No `Profile` already exists for `user`.
- `displayName` is non-empty.

**Effects:**
- Creates a new `Profile` for `user` with the given `displayName`.

**Request Body:**
```json
{
  "user": "string (User ID)",
  "displayName": "string"
}
```

**Success Response Body (Action):**
```json
{
  "profile": "string (Profile ID)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserProfile/updateDisplayName

**Description:** Updates the display name for a given profile.

**Requirements:**
- `profile` exists.
- `newDisplayName` is non-empty.

**Effects:**
- Updates `profile.displayName` to `newDisplayName`.

**Request Body:**
```json
{
  "profile": "string (Profile ID)",
  "newDisplayName": "string"
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
### POST /api/UserProfile/updateBio

**Description:** Updates the biography text for a given profile.

**Requirements:**
- `profile` exists.

**Effects:**
- Updates `profile.bio` to `newBio`.

**Request Body:**
```json
{
  "profile": "string (Profile ID)",
  "newBio": "string"
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
### POST /api/UserProfile/updateThumbnailImage

**Description:** Updates the thumbnail image URL for a given profile.

**Requirements:**
- `profile` exists.

**Effects:**
- Updates `profile.thumbnailImageURL` to `newThumbnailImageURL`.

**Request Body:**
```json
{
  "profile": "string (Profile ID)",
  "newThumbnailImageURL": "string"
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
### POST /api/UserProfile/deleteProfile

**Description:** Deletes a profile from the system.

**Requirements:**
- `profile` exists.

**Effects:**
- Deletes `profile` from the set.

**Request Body:**
```json
{
  "profile": "string (Profile ID)"
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
### POST /api/UserProfile/_getProfileById

**Description:** Retrieves a profile by its unique ID.

**Requirements:**
- The profile must exist to retrieve data.

**Effects:**
- Returns the profile data if found.

**Request Body:**
```json
{
  "profile": "string (Profile ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (Profile ID)",
    "user": "string (User ID)",
    "displayName": "string",
    "bio": "string",
    "thumbnailImageURL": "string"
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
### POST /api/UserProfile/_getProfileByUser

**Description:** Retrieves a profile by its associated user ID.

**Requirements:**
- The user must have an associated profile to retrieve data.

**Effects:**
- Returns the user's profile data if found.

**Request Body:**
```json
{
  "user": "string (User ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (Profile ID)",
    "user": "string (User ID)",
    "displayName": "string",
    "bio": "string",
    "thumbnailImageURL": "string"
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