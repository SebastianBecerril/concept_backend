---
timestamp: 'Fri Nov 07 2025 20:33:52 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_203352.59451820.md]]'
content_id: dfbcac8f68f81dc47cc39dd6e249d6d872861319f5955e4746783a6287471f76
---

# file: src\syncs\courseCatalog.sync.ts

```typescript
import { CourseCatalog, Requesting, UserAuthentication } from "@concepts";
import { actions, Sync } from "@engine";

// --- Authorization Helper ---
// A common 'where' clause pattern for checking if a request comes from a valid, logged-in session.
const isAuthed = (sessionId: symbol, user: symbol) =>
  async (frames: any) => {
    return frames.query(
      UserAuthentication._isValidSession,
      { sessionId },
      { user },
    );
  };

// --- Syncs for Term Management ---

/**
 * @sync CreateOrGetTermRequest
 * @description Handles a request to create or get an academic term. Requires a valid session.
 */
export const CreateOrGetTermRequest: Sync = ({ request, sessionId, user, name }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/createOrGetTerm", sessionId, name },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.createOrGetTerm, { name }]),
});

export const CreateOrGetTermResponse: Sync = ({ request, term }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/createOrGetTerm" }, { request }],
    [CourseCatalog.createOrGetTerm, {}, { term }],
  ),
  then: actions([Requesting.respond, { request, term }]),
});

export const CreateOrGetTermErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/createOrGetTerm" }, { request }],
    [CourseCatalog.createOrGetTerm, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync UpdateTermNameRequest
 * @description Handles a request to update a term's name. Requires a valid session.
 */
export const UpdateTermNameRequest: Sync = ({ request, sessionId, user, term, newName }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/updateTermName", sessionId, term, newName },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.updateTermName, { term, newName }]),
});

export const UpdateTermNameResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/updateTermName" }, { request }],
    [CourseCatalog.updateTermName, {}, {}], // Success is an empty object
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const UpdateTermNameErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/updateTermName" }, { request }],
    [CourseCatalog.updateTermName, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync DeleteTermRequest
 * @description Handles a request to delete a term. Requires a valid session.
 */
export const DeleteTermRequest: Sync = ({ request, sessionId, user, term }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/deleteTerm", sessionId, term },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.deleteTerm, { term }]),
});

export const DeleteTermResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/deleteTerm" }, { request }],
    [CourseCatalog.deleteTerm, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeleteTermErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/deleteTerm" }, { request }],
    [CourseCatalog.deleteTerm, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Syncs for Course Management ---

/**
 * @sync CreateOrGetCourseRequest
 * @description Handles a request to create or get a course. Requires a valid session.
 */
export const CreateOrGetCourseRequest: Sync = ({ request, sessionId, user, term, courseNumber, courseName, department }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/createOrGetCourse", sessionId, term, courseNumber, courseName, department },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.createOrGetCourse, { term, courseNumber, courseName, department }]),
});

export const CreateOrGetCourseResponse: Sync = ({ request, course }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/createOrGetCourse" }, { request }],
    [CourseCatalog.createOrGetCourse, {}, { course }],
  ),
  then: actions([Requesting.respond, { request, course }]),
});

export const CreateOrGetCourseErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/createOrGetCourse" }, { request }],
    [CourseCatalog.createOrGetCourse, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync UpdateCourseDetailsRequest
 * @description Handles a request to update course details. Requires a valid session.
 */
export const UpdateCourseDetailsRequest: Sync = ({ request, sessionId, user, course, newCourseNumber, newCourseName, newDepartment }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/updateCourseDetails", sessionId, course, newCourseNumber, newCourseName, newDepartment },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.updateCourseDetails, { course, newCourseNumber, newCourseName, newDepartment }]),
});

export const UpdateCourseDetailsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/updateCourseDetails" }, { request }],
    [CourseCatalog.updateCourseDetails, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const UpdateCourseDetailsErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/updateCourseDetails" }, { request }],
    [CourseCatalog.updateCourseDetails, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync DeleteCourseRequest
 * @description Handles a request to delete a course. Requires a valid session.
 */
export const DeleteCourseRequest: Sync = ({ request, sessionId, user, course }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/deleteCourse", sessionId, course },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.deleteCourse, { course }]),
});

export const DeleteCourseResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/deleteCourse" }, { request }],
    [CourseCatalog.deleteCourse, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeleteCourseErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/deleteCourse" }, { request }],
    [CourseCatalog.deleteCourse, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Syncs for Section Management ---

/**
 * @sync CreateOrGetSectionRequest
 * @description Handles a request to create or get a section. Requires a valid session.
 */
export const CreateOrGetSectionRequest: Sync = ({ request, sessionId, user, course, classType, days, startTime, endTime, location, instructor }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/createOrGetSection", sessionId, course, classType, days, startTime, endTime, location, instructor },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.createOrGetSection, { course, classType, days, startTime, endTime, location, instructor }]),
});

export const CreateOrGetSectionResponse: Sync = ({ request, section }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/createOrGetSection" }, { request }],
    [CourseCatalog.createOrGetSection, {}, { section }],
  ),
  then: actions([Requesting.respond, { request, section }]),
});

export const CreateOrGetSectionErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/createOrGetSection" }, { request }],
    [CourseCatalog.createOrGetSection, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync UpdateSectionDetailsRequest
 * @description Handles a request to update section details. Requires a valid session.
 */
export const UpdateSectionDetailsRequest: Sync = ({ request, sessionId, user, section, newClassType, newDays, newStartTime, newEndTime, newLocation, newInstructor }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/updateSectionDetails", sessionId, section, newClassType, newDays, newStartTime, newEndTime, newLocation, newInstructor },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.updateSectionDetails, { section, newClassType, newDays, newStartTime, newEndTime, newLocation, newInstructor }]),
});

export const UpdateSectionDetailsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/updateSectionDetails" }, { request }],
    [CourseCatalog.updateSectionDetails, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const UpdateSectionDetailsErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/updateSectionDetails" }, { request }],
    [CourseCatalog.updateSectionDetails, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync DeleteSectionRequest
 * @description Handles a request to delete a section. Requires a valid session.
 */
export const DeleteSectionRequest: Sync = ({ request, sessionId, user, section }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CourseCatalog/deleteSection", sessionId, section },
    { request },
  ]),
  where: isAuthed(sessionId, user),
  then: actions([CourseCatalog.deleteSection, { section }]),
});

export const DeleteSectionResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/deleteSection" }, { request }],
    [CourseCatalog.deleteSection, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeleteSectionErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CourseCatalog/deleteSection" }, { request }],
    [CourseCatalog.deleteSection, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
