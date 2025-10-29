# API Specification: UserEnrollments Concept

**Purpose:** Enable users to declare and manage their enrollment in specific course sections and control its visibility to other members in their communities.

---

## API Endpoints

### POST /api/UserEnrollments/addEnrollment

**Description:** Creates a new course enrollment for a user.

**Requirements:**
- `owner` exists
- `course` exists
- `section` exists
- no `Enrollment` for `owner` in `course` exists

**Effects:**
- creates a new `Enrollment` for `owner` for `course` with `section` and `visibility`

**Request Body:**
```json
{
  "owner": "ID",
  "course": "ID",
  "section": "ID",
  "visibility": "boolean"
}
```

**Success Response Body (Action):**
```json
{
  "enrollment": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserEnrollments/updateCourseSection

**Description:** Updates the section for an existing enrollment.

**Requirements:**
- `enrollment` exists
- `newSection` exists

**Effects:**
- updates `enrollment.section` to `newSection`

**Request Body:**
```json
{
  "enrollment": "ID",
  "newSection": "ID"
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
### POST /api/UserEnrollments/setEnrollmentVisibility

**Description:** Sets the visibility flag for an existing enrollment.

**Requirements:**
- `enrollment` exists
- `newVisibility` is valid

**Effects:**
- updates `enrollment.visibility` to `newVisibility`

**Request Body:**
```json
{
  "enrollment": "ID",
  "newVisibility": "boolean"
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
### POST /api/UserEnrollments/removeEnrollment

**Description:** Deletes an existing enrollment.

**Requirements:**
- `enrollment` exists

**Effects:**
- deletes the `enrollment`

**Request Body:**
```json
{
  "enrollment": "ID"
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
### POST /api/UserEnrollments/_getEnrollmentById

**Description:** Retrieves a single enrollment by its unique ID.

**Request Body:**
```json
{
  "enrollment": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "owner": "ID",
    "course": "ID",
    "section": "ID",
    "visibility": "boolean"
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
### POST /api/UserEnrollments/_getEnrollmentsByOwner

**Description:** Retrieves all enrollments for a specific user.

**Request Body:**
```json
{
  "owner": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "owner": "ID",
    "course": "ID",
    "section": "ID",
    "visibility": "boolean"
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
### POST /api/UserEnrollments/_getEnrollmentsByCourse

**Description:** Retrieves all enrollments for a specific course.

**Request Body:**
```json
{
  "course": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "owner": "ID",
    "course": "ID",
    "section": "ID",
    "visibility": "boolean"
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
### POST /api/UserEnrollments/_getEnrollmentsBySection

**Description:** Retrieves all enrollments for a specific section.

**Request Body:**
```json
{
  "section": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "owner": "ID",
    "course": "ID",
    "section": "ID",
    "visibility": "boolean"
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
### POST /api/UserEnrollments/_getVisibleEnrollments

**Description:** Retrieves all enrollments that are set to be visible.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "owner": "ID",
    "course": "ID",
    "section": "ID",
    "visibility": "boolean"
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
### POST /api/UserEnrollments/_getAllEnrollments

**Description:** Retrieves all enrollments in the system.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "owner": "ID",
    "course": "ID",
    "section": "ID",
    "visibility": "boolean"
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