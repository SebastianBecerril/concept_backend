# API Specification: Community Concept

**Purpose:** Group users into distinct social or organizational units and manage their membership and roles.

---

## API Endpoints

### POST /api/Community/createCommunity

**Description:** Creates a new community and assigns the creator as the first administrator.

**Requirements:**
- `name` and `description` are non-empty.
- A `Community` with the given `name` does not already exist.
- The `creator` user exists.

**Effects:**
- Creates a new `Community` with the given `name` and `description`.
- Adds the `creator` as an `ADMIN` `Membership` to this new `Community`.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "creator": "string (ID)"
}
```

**Success Response Body (Action):**
```json
{
  "community": "string (ID)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/Community/updateCommunityDetails

**Description:** Updates the name and description of an existing community.

**Requirements:**
- The `community` exists.
- The `requester` is an `ADMIN` member of the `community`.

**Effects:**
- Updates the `name` and `description` of the specified `community`.

**Request Body:**
```json
{
  "community": "string (ID)",
  "newName": "string",
  "newDescription": "string",
  "requester": "string (ID)"
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
### POST /api/Community/addMember

**Description:** Adds a user to a community with the default 'MEMBER' role.

**Requirements:**
- The `community` exists.
- The `user` to be added exists.
- The `inviter` exists.
- The `user` is not already a member of the `community`.
- The `inviter` is an `ADMIN` member of the `community`.

**Effects:**
- Creates a `Membership` for the `user` in the `community` with the `MEMBER` role.

**Request Body:**
```json
{
  "community": "string (ID)",
  "user": "string (ID)",
  "inviter": "string (ID)"
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
### POST /api/Community/removeMember

**Description:** Removes a user from a community.

**Requirements:**
- The `community` exists.
- The `user` is a member of the `community`.
- The `requester` is an `ADMIN` member of the `community`, OR the `requester` is the same as the `user` being removed.

**Effects:**
- Removes the `Membership` of the `user` from the `community`.

**Request Body:**
```json
{
  "community": "string (ID)",
  "user": "string (ID)",
  "requester": "string (ID)"
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
### POST /api/Community/setMemberRole

**Description:** Changes the role of a member within a community.

**Requirements:**
- The `membership` exists.
- The `newRole` is a valid role (e.g., 'ADMIN', 'MEMBER').
- The `requester` is an `ADMIN` member of the community associated with the `membership`.
- The `requester` is not attempting to demote themselves from `ADMIN` to `MEMBER` unless there is at least one other `ADMIN` in the community.

**Effects:**
- Updates the `role` of the specified `membership` to `newRole`.

**Request Body:**
```json
{
  "membership": "string (ID)",
  "newRole": "string",
  "requester": "string (ID)"
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
### POST /api/Community/deleteCommunity

**Description:** Permanently deletes a community and all its associated memberships.

**Requirements:**
- The `community` exists.
- The `requester` is an `ADMIN` member of the `community`.

**Effects:**
- Removes the `community` and all associated `Memberships`.

**Request Body:**
```json
{
  "community": "string (ID)",
  "requester": "string (ID)"
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
### POST /api/Community/_getCommunityById

**Description:** Retrieves a community by its unique ID.

**Requirements:**
- N/A

**Effects:**
- Returns an array containing the community object if found, otherwise an empty array.

**Request Body:**
```json
{
  "community": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "name": "string",
    "description": "string",
    "creationDate": "string (ISO 8601)",
    "memberships": ["string (ID)"]
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
### POST /api/Community/_getMembershipById

**Description:** Retrieves a membership by its unique ID.

**Requirements:**
- N/A

**Effects:**
- Returns an array containing the membership object if found, otherwise an empty array.

**Request Body:**
```json
{
  "membership": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "user": "string (ID)",
    "community": "string (ID)",
    "role": "string",
    "joinDate": "string (ISO 8601)"
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
### POST /api/Community/_getMembershipsByCommunity

**Description:** Retrieves all memberships for a specific community.

**Requirements:**
- N/A

**Effects:**
- Returns an array of all membership objects associated with the given community.

**Request Body:**
```json
{
  "community": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "user": "string (ID)",
    "community": "string (ID)",
    "role": "string",
    "joinDate": "string (ISO 8601)"
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
### POST /api/Community/_getMembershipsByUser

**Description:** Retrieves all memberships for a specific user.

**Requirements:**
- N/A

**Effects:**
- Returns an array of all membership objects associated with the given user.

**Request Body:**
```json
{
  "user": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "user": "string (ID)",
    "community": "string (ID)",
    "role": "string",
    "joinDate": "string (ISO 8601)"
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
### POST /api/Community/_getMembershipsByRole

**Description:** Retrieves all memberships with a specific role in a community.

**Requirements:**
- N/A

**Effects:**
- Returns an array of membership objects within the specified community that have the specified role.

**Request Body:**
```json
{
  "community": "string (ID)",
  "role": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "user": "string (ID)",
    "community": "string (ID)",
    "role": "string",
    "joinDate": "string (ISO 8601)"
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
### POST /api/Community/_getAllCommunities

**Description:** Retrieves all communities in the system.

**Requirements:**
- N/A

**Effects:**
- Returns an array of all community objects.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "name": "string",
    "description": "string",
    "creationDate": "string (ISO 8601)",
    "memberships": ["string (ID)"]
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
### POST /api/Community/_getAllMemberships

**Description:** Retrieves all memberships in the system.

**Requirements:**
- N/A

**Effects:**
- Returns an array of all membership objects.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string (ID)",
    "user": "string (ID)",
    "community": "string (ID)",
    "role": "string",
    "joinDate": "string (ISO 8601)"
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