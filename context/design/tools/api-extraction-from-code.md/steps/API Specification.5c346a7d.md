---
timestamp: 'Tue Oct 28 2025 19:50:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251028_195020.731bdce0.md]]'
content_id: 5c346a7daede91d568e141439fd581cf888ff8e308d9f31aae93bb42d6a228f9
---

# API Specification: UserProfile Concept

**Purpose:** Store and manage user-specific descriptive information, distinct from authentication credentials.

***

## API Endpoints

### POST /api/UserProfile/createProfile

**Description:** Creates a new profile for a given user with a specified display name.

**Requirements:**

* The `user` must exist.
* A `Profile` must not already exist for the given `user`.
* The `displayName` must not be an empty string.

**Effects:**

* Creates a new `Profile` record associated with the `user`.
* Sets the `displayName` for the new profile.

**Request Body:**

```json
{
  "user": "User",
  "displayName": "String"
}
```

**Success Response Body (Action):**

```json
{
  "profile": "Profile"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserProfile/updateDisplayName

**Description:** Updates the display name for an existing profile.

**Requirements:**

* The `profile` must exist.
* The `newDisplayName` must not be an empty string.

**Effects:**

* Updates the `displayName` of the specified `profile` to `newDisplayName`.

**Request Body:**

```json
{
  "profile": "Profile",
  "newDisplayName": "String"
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

***

### POST /api/UserProfile/updateBio

**Description:** Updates the biography text for an existing profile.

**Requirements:**

* The `profile` must exist.

**Effects:**

* Updates the `bio` of the specified `profile` to `newBio`.

**Request Body:**

```json
{
  "profile": "Profile",
  "newBio": "String"
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

***

### POST /api/UserProfile/updateThumbnailImage

**Description:** Updates the thumbnail image URL for an existing profile.

**Requirements:**

* The `profile` must exist.

**Effects:**

* Updates the `thumbnailImageURL` of the specified `profile` to `newThumbnailImageURL`.

**Request Body:**

```json
{
  "profile": "Profile",
  "newThumbnailImageURL": "String"
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

***

### POST /api/UserProfile/deleteProfile

**Description:** Deletes an existing user profile.

**Requirements:**

* The `profile` must exist.

**Effects:**

* Deletes the specified `profile` from the system.

**Request Body:**

```json
{
  "profile": "Profile"
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

***
