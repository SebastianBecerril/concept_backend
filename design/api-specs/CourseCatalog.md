# API Specification: CourseCatalog Concept

**Purpose:** Provide a community-curated and reliable registry of academic terms, courses, and sections, enabling users to easily find and reference shared academic offerings.

---

## API Endpoints

### POST /api/CourseCatalog/createOrGetTerm

**Description:** Creates a new academic term or retrieves an existing one if a term with the same name already exists.

**Requirements:**
- None.

**Effects:**
- If a `Term` with the exact `name` already exists, returns that `Term`.
- Otherwise, creates a new `Term` with the given `name` and returns it.

**Request Body:**
```json
{
  "name": "String"
}
```

**Success Response Body (Action):**
```json
{
  "term": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/CourseCatalog/updateTermName

**Description:** Updates the name of a specified academic term.

**Requirements:**
- The specified `term` must exist.
- No other `Term` with the `newName` can exist.

**Effects:**
- Updates the `name` of the specified `term` to `newName`.

**Request Body:**
```json
{
  "term": "ID",
  "newName": "String"
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
### POST /api/CourseCatalog/deleteTerm

**Description:** Deletes a specified academic term from the catalog.

**Requirements:**
- The specified `term` must exist.
- No `Course` can be associated with the `term`.

**Effects:**
- Removes the specified `term` from the set of terms.

**Request Body:**
```json
{
  "term": "ID"
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
### POST /api/CourseCatalog/createOrGetCourse

**Description:** Creates a new course or retrieves/updates an existing one within a specific term.

**Requirements:**
- The specified `term` must exist.

**Effects:**
- If a `Course` with the exact `courseNumber` in the `term` already exists, its `courseName` and `department` are updated, and the existing `Course` is returned.
- Otherwise, a new `Course` is created with the provided details and returned.

**Request Body:**
```json
{
  "term": "ID",
  "courseNumber": "String",
  "courseName": "String",
  "department": "String"
}
```

**Success Response Body (Action):**
```json
{
  "course": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/CourseCatalog/updateCourseDetails

**Description:** Updates the details of a specified course.

**Requirements:**
- The specified `course` must exist.
- If `newCourseNumber` is different, no other `Course` in the same term can have that `newCourseNumber`.

**Effects:**
- Updates the `courseNumber`, `courseName`, and `department` of the specified `course`.

**Request Body:**
```json
{
  "course": "ID",
  "newCourseNumber": "String",
  "newCourseName": "String",
  "newDepartment": "String"
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
### POST /api/CourseCatalog/deleteCourse

**Description:** Deletes a specified course from the catalog.

**Requirements:**
- The specified `course` must exist.
- No `Section` can be associated with the `course`.

**Effects:**
- Removes the specified `course` from the set of courses.

**Request Body:**
```json
{
  "course": "ID"
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
### POST /api/CourseCatalog/createOrGetSection

**Description:** Creates a new section for a course, or retrieves an existing section if one with identical details already exists.

**Requirements:**
- The specified `course` must exist.

**Effects:**
- If an identical `Section` (matching all details) for the `course` already exists, returns that `Section`.
- Otherwise, creates a new `Section` for the `course` with the given details and returns it.

**Request Body:**
```json
{
  "course": "ID",
  "classType": "String",
  "days": "set of Strings",
  "startTime": "DateTime",
  "endTime": "DateTime",
  "location": "String",
  "instructor": "String"
}
```

**Success Response Body (Action):**
```json
{
  "section": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/CourseCatalog/updateSectionDetails

**Description:** Updates the details of a specified section.

**Requirements:**
- The specified `section` must exist.
- No other `Section` in the same course can be identical to the section that would result from these updates.

**Effects:**
- Updates the `classType`, `days`, `startTime`, `endTime`, `location`, and `instructor` of the specified `section`.

**Request Body:**
```json
{
  "section": "ID",
  "newClassType": "String",
  "newDays": "set of Strings",
  "newStartTime": "DateTime",
  "newEndTime": "DateTime",
  "newLocation": "String",
  "newInstructor": "String"
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
### POST /api/CourseCatalog/deleteSection

**Description:** Deletes a specified section from the catalog.

**Requirements:**
- The specified `section` must exist.

**Effects:**
- Removes the specified `section` from the set of sections.

**Request Body:**
```json
{
  "section": "ID"
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
### POST /api/CourseCatalog/_getTerms

**Description:** Retrieves all academic terms from the catalog.

**Requirements:**
- None.

**Effects:**
- Returns an array of all terms, sorted alphabetically by name.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "name": "string"
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
### POST /api/CourseCatalog/_getTermById

**Description:** Retrieves a single term by its unique ID.

**Requirements:**
- The `term` with the given ID must exist.

**Effects:**
- Returns an array containing the term document, or an empty array if not found.

**Request Body:**
```json
{
  "term": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "name": "string"
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
### POST /api/CourseCatalog/_getCoursesForTerm

**Description:** Retrieves all courses associated with a specific term.

**Requirements:**
- The `term` with the given ID must exist.

**Effects:**
- Returns an array of courses for the given term, sorted by course number.

**Request Body:**
```json
{
  "term": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "ID",
    "term": "ID",
    "courseNumber": "string",
    "courseName": "string",
    "department": "string"
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
### POST /api/CourseCatalog/_getCourseById

**Description:** Retrieves a single course by its unique ID.

**Requirements:**
- The `course` with the given ID must exist.

**Effects:**
- Returns an array containing the course document, or an empty array if not found.

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
    "term": "ID",
    "courseNumber": "string",
    "courseName": "string",
    "department": "string"
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
### POST /api/CourseCatalog/_getSectionsForCourse

**Description:** Retrieves all sections associated with a specific course.

**Requirements:**
- The `course` with the given ID must exist.

**Effects:**
- Returns an array of sections for the given course, sorted by class type and then start time.

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
    "course": "ID",
    "classType": "string",
    "days": ["string"],
    "startTime": "DateTime",
    "endTime": "DateTime",
    "location": "string",
    "instructor": "string"
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
### POST /api/CourseCatalog/_getSectionById

**Description:** Retrieves a single section by its unique ID.

**Requirements:**
- The `section` with the given ID must exist.

**Effects:**
- Returns an array containing the section document, or an empty array if not found.

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
    "course": "ID",
    "classType": "string",
    "days": ["string"],
    "startTime": "DateTime",
    "endTime": "DateTime",
    "location": "string",
    "instructor": "string"
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