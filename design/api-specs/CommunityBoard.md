# API Specification: CommunityBoard Concept

**Purpose:** Provide a shared forum for community members to post and discuss academic or community-related topics.

---

## API Endpoints

### POST /api/CommunityBoard/createPost

**Description:** Creates a new posting in a community authored by the user.

**Requirements:**
- `author` exists
- `community` exists
- `author` is a member of `community`
- `body` is non-empty
- `tags` are non-empty
- `course` (if provided) exists

**Effects:**
- Creates a new `Posting` in `community` authored by `author` with the given details.

**Request Body:**
```json
{
  "author": "string",
  "community": "string",
  "title": "string",
  "body": "string",
  "tags": ["string"],
  "course": "string"
}
```

**Success Response Body (Action):**
```json
{
  "posting": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/CommunityBoard/updatePost

**Description:** Updates the content of an existing posting.

**Requirements:**
- `posting` exists
- `requester` is `posting.author`
- `newBody` is non-empty
- `newTags` are non-empty
- `newCourse` (if provided) exists

**Effects:**
- Updates the `title`, `body`, `tags`, and `course` of `posting`.

**Request Body:**
```json
{
  "posting": "string",
  "newTitle": "string",
  "newBody": "string",
  "newTags": ["string"],
  "newCourse": "string",
  "requester": "string"
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
### POST /api/CommunityBoard/replyToPost

**Description:** Creates a new reply to a specific posting.

**Requirements:**
- `posting` exists
- `author` exists
- `author` is a member of `posting.community`
- `body` is non-empty

**Effects:**
- Creates a new `Reply` on `posting` authored by `author`.

**Request Body:**
```json
{
  "posting": "string",
  "author": "string",
  "body": "string"
}
```

**Success Response Body (Action):**
```json
{
  "reply": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/CommunityBoard/updateReply

**Description:** Updates the content of an existing reply.

**Requirements:**
- `reply` exists
- `requester` is `reply.author`
- `newBody` is non-empty

**Effects:**
- Updates the `body` of `reply`.

**Request Body:**
```json
{
  "reply": "string",
  "newBody": "string",
  "requester": "string"
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
### POST /api/CommunityBoard/deletePost

**Description:** Deletes a posting and all of its associated replies.

**Requirements:**
- `posting` exists
- `requester` is `posting.author` OR `requester` is an `ADMIN` member of `posting.community`

**Effects:**
- Removes the `posting` and all its associated `Replies`.

**Request Body:**
```json
{
  "posting": "string",
  "requester": "string"
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
### POST /api/CommunityBoard/deleteReply

**Description:** Deletes a specific reply from a posting.

**Requirements:**
- `reply` exists
- `requester` is `reply.author` OR `requester` is an `ADMIN` member of `reply.posting.community`

**Effects:**
- Removes the `reply` from its `Posting`.

**Request Body:**
```json
{
  "reply": "string",
  "requester": "string"
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
### POST /api/CommunityBoard/_getPostById

**Description:** Retrieves a single post by its ID.

**Requirements:**
- None specified.

**Effects:**
- None specified.

**Request Body:**
```json
{
  "posting": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "author": "string",
    "community": "string",
    "title": "string",
    "body": "string",
    "tags": ["string"],
    "course": "string",
    "replies": ["string"]
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
### POST /api/CommunityBoard/_getRepliesForPost

**Description:** Retrieves all replies for a specific posting.

**Requirements:**
- None specified.

**Effects:**
- None specified.

**Request Body:**
```json
{
  "posting": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "author": "string",
    "posting": "string",
    "body": "string"
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
### POST /api/CommunityBoard/_getPostsByCommunity

**Description:** Retrieves all posts within a specific community.

**Requirements:**
- None specified.

**Effects:**
- None specified.

**Request Body:**
```json
{
  "community": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "author": "string",
    "community": "string",
    "title": "string",
    "body": "string",
    "tags": ["string"],
    "course": "string",
    "replies": ["string"]
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