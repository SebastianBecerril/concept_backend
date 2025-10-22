---
timestamp: 'Tue Oct 21 2025 15:34:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_153446.40c38f46.md]]'
content_id: 71edfe2c8cc45ecc5cbc16d90dcec061443f7a3ec47014207c18f1e3997570ef
---

# response:

This is an excellent problem to tackle with concept design, as it clearly separates the *data storage* (your `CourseCatalog` concept) from the *data ingestion* mechanism.

Your current `CourseCatalog` concept is well-defined for holding the data. To integrate with an external API like MIT Hydrant, you'll need a way to:

1. **Fetch data** from the external API.
2. **Transform** that data into the structure expected by your `CourseCatalog` concept.
3. **Update your `CourseCatalog`** with the new/changed/deleted information.

The most efficient and straightforward way to do this in the context of concept design is to introduce a **new concept dedicated to external synchronization** (e.g., `ExternalCatalogSync` or `CatalogIngestion`). This keeps your `CourseCatalog` pure and independent, as it shouldn't know *how* or *where* the data comes from, only *what* data it holds and *how* it can be manipulated.

Here's a breakdown of the recommended approach:

***

## 1. Refine the `CourseCatalog` Concept

Your `CourseCatalog` is already quite good, but we need to add a few things to facilitate synchronization with an external source:

* **`externalId` fields:** To map records in your local catalog back to their source in the external API, you need unique identifiers from the external system.
* **`update` actions:** Your current concept has `create` and `delete` but is missing `update` actions for `Term`, `Course`, and `Section` details. These are crucial if the external data changes.
* **Course Number Type:** `courseNumber: Number` might be too restrictive if MIT Hydrant uses course numbers like "6.0001", "HST.030", or other alphanumeric strings. `String` is generally safer.

### Revised `CourseCatalog` Concept

* **purpose**
  Keep a database catalog of academic terms, courses, and sections for selection and tagging, mirrored from an external source.
* **principle**
  After an administrator imports and synchronizes a term's catalog from an external source, users and other concepts can reliably select and reference courses/sections by their unique identifiers, number, and/or name.
* **state**
  * a set of Terms with
    * an externalId String (e.g., "FA2024" or "2024\_FALL")
    * a name String (e.g., "Fall 2024")
    * a set of Courses
  * a set of Courses with
    * an externalId String (e.g., "6.0001")
    * a term Term
    * a courseNumber String (changed from Number for flexibility)
    * a courseName String
    * a department String
    * a set of Sections
  * a set of Sections with
    * an externalId String (e.g., "L01")
    * a course Course
    * a classType String
    * a days set of Strings
    * a startTime DateTime
    * an endTime DateTime
    * a location String
    * an instructor String
* **actions**
  * **createTerm(externalId: String, name: String): (term: Term)**
    * **requires** a term with `externalId` does not exist
    * **effect** creates a new `Term` with the given `externalId` and `name`
  * **updateTerm(term: Term, newName: String): ()**
    * **requires** `term` exists
    * **effect** updates the `name` of `term` to `newName`
  * **deleteTerm(term: Term): ()**
    * **requires** `term` exists, and no `Course` in `term` exists
    * **effect** removes the `term` from the set
  * **createCourse(term: Term, externalId: String, courseNumber: String, courseName: String, department: String): (course: Course)**
    * **requires** `term` exists, and a `Course` with `externalId` in `term` does not exist
    * **effect** creates a new `Course` associated with `term`
  * **updateCourse(course: Course, newCourseNumber: String, newCourseName: String, newDepartment: String): ()**
    * **requires** `course` exists, a `Course` with `newCourseNumber` (if changed) in `course.term` does not already exist
    * **effect** updates the `courseNumber`, `courseName`, and `department` of `course`
  * **deleteCourse(course: Course): ()**
    * **requires** `course` exists, and no `Section` of `course` exists
    * **effect** removes the `course` from the set
  * **createSection(course: Course, externalId: String, classType: String, days: set of Strings, startTime: DateTime, endTime: DateTime, location: String, instructor: String): (section: Section)**
    * **requires** `course` exists, and a `Section` with `externalId` for `course` does not exist
    * **effect** creates a new `Section` for `course`
  * **updateSection(section: Section, newClassType: String, newDays: set of Strings, newStartTime: DateTime, newEndTime: DateTime, newLocation: String, newInstructor: String): ()**
    * **requires** `section` exists
    * **effect** updates the `classType`, `days`, `startTime`, `endTime`, `location`, and `instructor` of `section`
  * **deleteSection(section: Section): ()**
    * **requires** `section` exists
    * **effect** removes the `section` from the set

***

## 2. Introduce `ExternalCatalogSync` Concept

This new concept will handle the interaction with the external API and orchestrate the updates to `CourseCatalog`.

### concept ExternalCatalogSync \[Term, Course, Section]

* **purpose**
  Maintain a synchronized, up-to-date copy of an external academic course catalog in the local `CourseCatalog` concept.
* **principle**
  An administrator initiates a sync for a term, which fetches current external course data, intelligently compares it with existing local data, and then creates, updates, or deletes terms, courses, and sections in the `CourseCatalog` to reflect the external source.
* **state**
  * a set of SyncRecords with
    * a termExternalId String (the external ID of the term being synced)
    * a lastSyncTime DateTime
    * a syncStatus of IN\_PROGRESS or COMPLETED or FAILED
    * an optional errorMessage String
* **actions**
  * **initiateTermSync(termExternalId: String): (syncRecord: SyncRecord)**
    * **requires** a `termExternalId` is provided, and no sync for this `termExternalId` is currently `IN_PROGRESS`
    * **effect** creates a `SyncRecord` for the `termExternalId` with `syncStatus` `IN_PROGRESS` and `lastSyncTime` set to the current time. (This action signals the start of the process, the actual fetching and updating happens externally or via system actions/syncs.)
  * **system processTermData(termExternalId: String, rawTermData: JSON): ()**
    * **requires** a `SyncRecord` for `termExternalId` is `IN_PROGRESS`
    * **effect** processes `rawTermData` to update `CourseCatalog` (see below for detailed logic) and updates the `SyncRecord` to `COMPLETED` or `FAILED` accordingly. This is where the core logic of comparing and calling `CourseCatalog` actions resides. This action is *triggered* by the system after fetching data.
  * **markSyncFailed(termExternalId: String, errorMessage: String): ()**
    * **requires** a `SyncRecord` for `termExternalId` is `IN_PROGRESS`
    * **effect** updates the `SyncRecord` to `FAILED` with the `errorMessage`.

***

## 3. Implementation Details & Workflow

Now, let's connect the pieces:

### A. External API Client (Non-Concept)

This would be a module *outside* of your concept definitions, responsible for:

* Making actual HTTP requests to the MIT Hydrant-like API.
* Handling API keys, rate limiting, and network errors.
* Returning raw JSON data.

```typescript
// Example: src/apiClients/mitHydrant.ts
import axios from 'axios';

interface ExternalTerm {
    id: string; // e.g., "FA2024"
    name: string; // e.g., "Fall 2024"
    courses: ExternalCourse[];
}

interface ExternalCourse {
    id: string; // e.g., "6.0001"
    number: string;
    name: string;
    department: string;
    sections: ExternalSection[];
}

interface ExternalSection {
    id: string; // e.g., "L01"
    type: string; // e.g., "Lecture", "Recitation"
    days: string[]; // e.g., ["M", "W", "F"]
    startTime: string; // e.g., "09:00"
    endTime: string; // e.g., "09:50"
    location: string;
    instructor: string;
}

export async function fetchTermCatalog(termExternalId: string): Promise<ExternalTerm | null> {
    try {
        const response = await axios.get(`https://api.hydrant.mit.edu/terms/${termExternalId}/catalog`);
        return response.data; // Assuming response.data matches ExternalTerm structure
    } catch (error) {
        console.error(`Error fetching catalog for term ${termExternalId}:`, error);
        return null;
    }
}
```

### B. Data Transformation Logic (Non-Concept, but used by `ExternalCatalogSync`)

This layer maps the raw data from the external API to the precise structure expected by your `CourseCatalog` concept.

```typescript
// Example: src/transformers/catalogTransformer.ts
import { ExternalTerm, ExternalCourse, ExternalSection } from '../apiClients/mitHydrant';
import { Term, Course, Section } from '../concepts/CourseCatalog'; // Assuming these are types for your concept entities

export interface TransformedTermData {
    externalId: string;
    name: string;
    courses: {
        externalId: string;
        courseNumber: string;
        courseName: string;
        department: string;
        sections: {
            externalId: string;
            classType: string;
            days: string[];
            startTime: Date; // Transformed from string
            endTime: Date;   // Transformed from string
            location: string;
            instructor: string;
        }[];
    }[];
}

export function transformExternalTerm(externalTerm: ExternalTerm): TransformedTermData {
    return {
        externalId: externalTerm.id,
        name: externalTerm.name,
        courses: externalTerm.courses.map(course => ({
            externalId: course.id,
            courseNumber: course.number,
            courseName: course.name,
            department: course.department,
            sections: course.sections.map(section => ({
                externalId: section.id,
                classType: section.type,
                days: new Set(section.days), // Convert to Set
                startTime: new Date(`1970-01-01T${section.startTime}:00Z`), // Example conversion, adjust timezone
                endTime: new Date(`1970-01-01T${section.endTime}:00Z`),     // Example conversion, adjust timezone
                location: section.location,
                instructor: section.instructor,
            }))
        }))
    };
}
```

### C. The `ExternalCatalogSync` Logic (Orchestration)

This is where the actual concept logic happens. When `initiateTermSync` is called, a background process (or a subsequent system sync) would fetch the data and then call `processTermData`.

The `processTermData` action (or its underlying implementation) is the core of the sync. It performs an "upsert" (update or insert) operation:

```typescript
// Within the implementation of ExternalCatalogSync concept:

import { fetchTermCatalog } from '../apiClients/mitHydrant';
import { transformExternalTerm, TransformedTermData } from '../transformers/catalogTransformer';
import { CourseCatalog } from './CourseCatalog'; // Your CourseCatalog concept's API/service

// This would likely be triggered by a sync from ExternalCatalogSync.initiateTermSync
// or an external job scheduler listening to SyncRecord state.
async function performTermSync(termExternalId: string) {
    // 1. Update SyncRecord to IN_PROGRESS (handled by initiateTermSync)
    // ExternalCatalogSync.initiateTermSync(termExternalId);

    try {
        // 2. Fetch raw data
        const rawExternalTerm = await fetchTermCatalog(termExternalId);
        if (!rawExternalTerm) {
            throw new Error("Failed to fetch data from external API.");
        }

        // 3. Transform data
        const transformedData = transformExternalTerm(rawExternalTerm);

        // 4. Call the system action to process
        ExternalCatalogSync.processTermData(termExternalId, transformedData);

    } catch (error) {
        ExternalCatalogSync.markSyncFailed(termExternalId, error.message);
    }
}

// Logic for the `ExternalCatalogSync.processTermData` action
async function processTermDataAction(termExternalId: string, transformedData: TransformedTermData) {
    // A. Handle Term
    let localTerm = await CourseCatalog.getTermByExternalId(termExternalId); // Assuming a query method
    if (!localTerm) {
        localTerm = await CourseCatalog.createTerm(transformedData.externalId, transformedData.name);
    } else if (localTerm.name !== transformedData.name) {
        await CourseCatalog.updateTerm(localTerm, transformedData.name);
    }

    // Keep track of existing local courses/sections for deletion detection
    const existingLocalCourses = await CourseCatalog.getCoursesInTerm(localTerm); // Assuming query method
    const existingLocalSectionsByCourse = new Map<string, Section[]>();
    for (const course of existingLocalCourses) {
        existingLocalSectionsByCourse.set(course.id, await CourseCatalog.getSectionsForCourse(course));
    }


    const updatedCourseExternalIds = new Set<string>();

    // B. Handle Courses within the Term
    for (const externalCourse of transformedData.courses) {
        updatedCourseExternalIds.add(externalCourse.externalId);
        let localCourse = existingLocalCourses.find(c => c.externalId === externalCourse.externalId);

        if (!localCourse) {
            localCourse = await CourseCatalog.createCourse(localTerm, externalCourse.externalId, externalCourse.courseNumber, externalCourse.courseName, externalCourse.department);
        } else if (
            localCourse.courseNumber !== externalCourse.courseNumber ||
            localCourse.courseName !== externalCourse.courseName ||
            localCourse.department !== externalCourse.department
        ) {
            await CourseCatalog.updateCourse(localCourse, externalCourse.courseNumber, externalCourse.courseName, externalCourse.department);
        }

        const updatedSectionExternalIds = new Set<string>();
        const existingLocalSections = existingLocalSectionsByCourse.get(localCourse.id) || [];

        // C. Handle Sections within the Course
        for (const externalSection of externalCourse.sections) {
            updatedSectionExternalIds.add(externalSection.externalId);
            let localSection = existingLocalSections.find(s => s.externalId === externalSection.externalId);

            if (!localSection) {
                await CourseCatalog.createSection(localCourse, externalSection.externalId, externalSection.classType, externalSection.days, externalSection.startTime, externalSection.endTime, externalSection.location, externalSection.instructor);
            } else if (
                localSection.classType !== externalSection.classType ||
                // Compare other fields
                !setEquals(localSection.days, externalSection.days) || // Need a helper for set comparison
                localSection.startTime.getTime() !== externalSection.startTime.getTime() ||
                localSection.endTime.getTime() !== externalSection.endTime.getTime() ||
                localSection.location !== externalSection.location ||
                localSection.instructor !== externalSection.instructor
            ) {
                await CourseCatalog.updateSection(localSection, externalSection.classType, externalSection.days, externalSection.startTime, externalSection.endTime, externalSection.location, externalSection.instructor);
            }
        }

        // D. Delete Sections that no longer exist externally
        for (const localSection of existingLocalSections) {
            if (!updatedSectionExternalIds.has(localSection.externalId)) {
                await CourseCatalog.deleteSection(localSection);
            }
        }
    }

    // E. Delete Courses that no longer exist externally
    for (const localCourse of existingLocalCourses) {
        if (!updatedCourseExternalIds.has(localCourse.externalId)) {
            await CourseCatalog.deleteCourse(localCourse);
        }
    }

    // Finally, mark sync as COMPLETED
    // Assuming a concept action for this: ExternalCatalogSync.markSyncCompleted(termExternalId);
}

function setEquals<T>(set1: Set<T>, set2: Set<T>): boolean {
    if (set1.size !== set2.size) {
        return false;
    }
    for (const item of set1) {
        if (!set2.has(item)) {
            return false;
        }
    }
    return true;
}
```

### D. Synchronization (Syncs between concepts)

You could use syncs to trigger the fetching and processing.

```
// This sync is conceptual. In a real system, `initiateTermSync` would trigger
// an asynchronous job that performs the fetch and then calls `processTermData`.

// sync triggerExternalFetchAndProcess
// when ExternalCatalogSync.initiateTermSync(termExternalId)
// then (System internally fetches raw data and calls ExternalCatalogSync.processTermData(termExternalId, rawData) or ExternalCatalogSync.markSyncFailed)
```

**Note:** The direct fetching from `initiateTermSync` is often handled by a background process that listens to the `SyncRecord` state. When a `SyncRecord` is set to `IN_PROGRESS`, an external job scheduler (or a system-level sync) picks it up, calls the API client, transforms the data, and then calls the `ExternalCatalogSync.processTermData` system action.

***

## Why this approach is efficient and straightforward:

1. **Clear Separation of Concerns:**
   * `CourseCatalog` (your original concept) only cares about *storing and manipulating* the catalog data. It doesn't know about HTTP requests, JSON parsing, or external API specifics.
   * `ExternalCatalogSync` is solely responsible for the *sync process*: triggering, fetching, transforming, and orchestrating updates. This keeps your core data model clean.
   * API Client and Transformer are non-concept implementation details, reusable and testable independently.

2. **Idempotency and Resilience:** The "upsert" logic (create if not exists, update if exists, delete if missing) ensures that running the sync multiple times will result in the same consistent state. This is crucial for external integrations.

3. **Controlled Updates:** Changes to the `CourseCatalog` only happen via its well-defined actions, ensuring data integrity.

4. **Auditability:** The `ExternalCatalogSync` concept maintains `SyncRecords`, giving you a history of when syncs occurred, their status, and any errors, which is vital for debugging and operational visibility.

5. **Scalability:** You can easily adapt the `ExternalCatalogSync` concept for:
   * **Scheduled Syncs:** A system action could periodically call `initiateTermSync`.
   * **Partial Syncs:** If the external API provides webhooks for changes, you could trigger more granular updates instead of full term re-syncs.
   * **Multiple Sources:** If you ever need to ingest from another university's catalog, you'd add another `ExternalCatalogSync` concept (or extend this one) and a new API client/transformer, without touching the `CourseCatalog`.

This robust design ensures that your application's core academic data is reliable, manageable, and can evolve independently of the external data sources it relies upon.
