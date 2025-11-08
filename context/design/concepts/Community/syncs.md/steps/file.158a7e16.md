---
timestamp: 'Fri Nov 07 2025 17:51:46 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_175146.a18cf38e.md]]'
content_id: 158a7e167285548f77a8be4737904fabe2158f2ac63bbf4c6510b6de89a2dd50
---

# file: src\syncs\sample.sync.ts

```typescript
/**
 * Sample synchronizations: feel free to delete this entire file!
 */

import { LikertSurvey, Requesting } from "@concepts";
import { actions, Sync } from "@engine";

export const CreateSurveyRequest: Sync = (
  { request, author, title, scaleMin, scaleMax },
) => ({
  when: actions([
    Requesting.request,
    { path: "/LikertSurvey/createSurvey", author, title, scaleMin, scaleMax },
    { request },
  ]),
  then: actions([LikertSurvey.createSurvey, {
    author,
    title,
    scaleMin,
    scaleMax,
  }]),
});

export const CreateSurveyResponse: Sync = ({ request, survey }) => ({
  when: actions(
    [Requesting.request, { path: "/LikertSurvey/createSurvey" }, { request }],
    [LikertSurvey.createSurvey, {}, { survey }],
  ),
  then: actions([Requesting.respond, { request, survey }]),
});

export const AddQuestionRequest: Sync = ({ request, survey, text }) => ({
  when: actions([
    Requesting.request,
    { path: "/LikertSurvey/addQuestion", survey, text },
    { request },
  ]),
  then: actions([LikertSurvey.addQuestion, { survey, text }]),
});

export const AddQuestionResponse: Sync = ({ request, question }) => ({
  when: actions(
    [Requesting.request, { path: "/LikertSurvey/addQuestion" }, { request }],
    [LikertSurvey.addQuestion, {}, { question }],
  ),
  then: actions([Requesting.respond, { request, question }]),
});

```

### concept CommunityBoard \[User, Course, Community]

* **purpose**
  Provide a shared forum for community members to post and discuss academic or community-related topics.
* **principle**
  After a user within a community creates a tagged posting (optionally linked to a course), other community members can reply, fostering focused discussion. Authors can edit or delete their contributions.
* **state**
  * a set of Postings with
    * an `author` User
    * a `community` Community
    * a `title` String
    * a `body` String
    * a `tags` set of Strings
    * an optional `course` Course
    * a `replies` set of Replies
  * a set of Replies with
    * an `author` User
    * a `posting` Posting
    * a `body` String
* **actions**
  * `createPost(author: User, community: Community, title: String, body: String, tags: set of Strings, optional course: Course): (posting: Posting)`
    * **requires** `author` exists, `community` exists, `author` is a member of `community`, `body` is non-empty, `tags` are non-empty, `course` (if provided) exists
    * **effect** creates a new `Posting` in `community` authored by `author` with the given details
  * `updatePost(posting: Posting, newTitle: String, newBody: String, newTags: set of Strings, optional newCourse: Course, requester: User): ()`
    * **requires** `posting` exists, `requester` is `posting.author`, `newBody` is non-empty, `newTags` are non-empty, `newCourse` (if provided) exists
    * **effect** updates the `title`, `body`, `tags`, and `course` of `posting`
  * `replyToPost(posting: Posting, author: User, body: String): (reply: Reply)`
    * **requires** `posting` exists, `author` exists, `author` is a member of `posting.community`, `body` is non-empty
    * **effect** creates a new `Reply` on `posting` authored by `author`
  * `updateReply(reply: Reply, newBody: String, requester: User): ()`
    * **requires** `reply` exists, `requester` is `reply.author`, `newBody` is non-empty
    * **effect** updates the `body` of `reply`
  * `deletePost(posting: Posting, requester: User): ()`
    * **requires** `posting` exists, (`requester` is `posting.author` OR `requester` is an `ADMIN` member of `posting.community`)
    * **effect** removes the `posting` and all its associated `Replies`
  * `deleteReply(reply: Reply, requester: User): ()`
    * **requires** `reply` exists, (`requester` is `reply.author` OR `requester` is an `ADMIN` member of `reply.posting.community`)
    * **effect** removes the `reply` from its `Posting`

### concept CourseCatalog

* **purpose**
  Provide a community-curated and reliable registry of academic terms, courses, and sections, enabling users to easily find and reference shared academic offerings.
* **principle**
  Users contribute academic terms, courses, and sections by providing their details. The catalog intelligently reuses existing entries or creates new ones, thereby building a consistent, shared registry that facilitates academic coordination and connection for the community.
* **state**
  * a set of Terms with
    * a `name` String
  * a set of Courses with
    * a `term` Term
    * a `courseNumber` String
    * a `courseName` String
    * a `department` String
  * a set of Sections with
    * a `course` Course
    * a `classType` String
    * a `days` set of Strings
    * a `startTime` DateTime
    * an `endTime` DateTime
    * a `location` String
    * an `instructor` String
* **actions**
  * `createOrGetTerm(name: String): (term: Term)`
    * **requires**
    * **effect** If a `Term` with the exact `name` already exists, returns that `Term`. Otherwise, creates a new `Term` with the given `name` and returns it.
  * `updateTermName(term: Term, newName: String): ()`
    * **requires** `term` exists, and no other `Term` with `newName` exists.
    * **effect** Updates the `name` of `term` to `newName`.
  * `deleteTerm(term: Term): ()`
    * **requires** `term` exists, and no `Course` belongs to `term`.
    * **effect** Removes the `term` from the set.
  * `createOrGetCourse(term: Term, courseNumber: String, courseName: String, department: String): (course: Course)`
    * **requires** `term` exists.
    * **effect** If a `Course` with the exact `courseNumber` in `term` already exists, its `courseName` and `department` are updated to the provided values (to reflect the latest community consensus or input), and the existing `Course` is returned. Otherwise, creates a new `Course` associated with `term` and the provided details, and returns it.
  * `updateCourseDetails(course: Course, newCourseNumber: String, newCourseName: String, newDepartment: String): ()`
    * **requires** `course` exists, and if `newCourseNumber` is different from `course.courseNumber`, then no other `Course` in `course.term` has `newCourseNumber`.
    * **effect** Updates the `courseNumber`, `courseName`, and `department` of `course`.
  * `deleteCourse(course: Course): ()`
    * **requires** `course` exists, and no `Section` belongs to `course`.
    * **effect** Removes the `course` from the set.
  * `createOrGetSection(course: Course, classType: String, days: set of Strings, startTime: DateTime, endTime: DateTime, location: String, instructor: String): (section: Section)`
    * **requires** `course` exists.
    * **effect** If an identical `Section` (matching all provided details) for `course` already exists, returns that `Section`. Otherwise, creates a new `Section` for `course` with the given details and returns it.
  * `updateSectionDetails(section: Section, newClassType: String, newDays: set of Strings, newStartTime: DateTime, newEndTime: DateTime, newLocation: String, newInstructor: String): ()`
    * **requires** `section` exists, and no other `Section` in `section.course` is identical to the section that would result from these updates.
    * **effect** Updates the `classType`, `days`, `startTime`, `endTime`, `location`, and `instructor` of `section`.
  * `deleteSection(section: Section): ()`
    * **requires** `section` exists.
    * **effect** Removes the `section` from the set.

### concept UserAuthentication

* **purpose**
  Identify users and manage their access credentials.
* **principle**
  After a user registers with unique credentials, they can log in to prove their identity, establishing an authenticated session for further interactions.
* **state**
  * a set of Users with
    * a `username` String
    * a `password` String
    * a `registrationDate` DateTime
  * a set of ActiveSessions with
    * a `user` User
    * a `sessionId` String
    * a `creationTime` DateTime
    * an `expiryTime` DateTime
* **actions**
  * `register(username: String, password: String): (user: User)`
    * **requires** `username` is unique, `password` meets strength requirements
    * **effect** creates a new `User` with the given `username` and a  `password`
  * l`ogin(username: String, password: String): (user: User, sessionId: String)`
    * **requires** `username` and `password` match an existing `User`
    * **effect** creates a new `ActiveSession` for the matched `User` with a unique `sessionId` and `expiryTime`, returning the `User` and `sessionId`
  * `logout(sessionId: String): ()`
    * **requires** `sessionId` matches an existing `ActiveSession`
    * **effect** removes the `ActiveSession`
  * `system invalidateExpiredSessions(): ()`
    * **requires** an `ActiveSession` exists where `currentTime` is after `expiryTime`
    * **effect** removes all `ActiveSessions` where `currentTime` is after `expiryTime`

### concept UserEnrollments \[User, Course, Section]

* **purpose**
  Enable users to declare and manage their enrollment in specific course sections and control its visibility to other members in their communities.
* **principle**
  After a user adds an enrollment, their registered courses and sections can be viewed by other community members, subject to visibility settings.
* **state**
  * a set of Enrollments with
    * an `owner` User
    * a `course` Course
    * a `section` Section
    * a `visibility` flag
* **actions**
  * `addEnrollment(owner: User, course: Course, section: Section, visibility: flag): (enrollment: Enrollment)`
    * **requires** `owner` exists, `course` exists, `section` exists, and no `Enrollment` for `owner` in `course` exists
    * **effect** creates a new `Enrollment` for `owner` for `course` with `section` and `visibility`
  * `updateCourseSection(enrollment: Enrollment, newSection: Section): ()`
    * **requires** `enrollment` exists, `newSection` exists.
    * **effect** updates `enrollment.section` to `newSection`.
  * `setEnrollmentVisibility(enrollment: Enrollment, newVisibility: flag): ()`
    * **requires** `enrollment` exists, `newVisibility` is valid
    * **effect** updates `enrollment.visibility` to `newVisibility`
  * `removeEnrollment(enrollment: Enrollment): ()`
    * **requires** `enrollment` exists
    * **effect** deletes the `enrollment`

### concept UserProfile \[User, ]

* **purpose**
  Store and manage user-specific descriptive information, distinct from authentication credentials.
* **principle**
  After a user is created, their profile can be initialized and updated, allowing others to view their descriptive details.
* **state**
  * a set of Profiles with
    * a `user` User
    * a `displayName` String
    * an optional `bio` String
    * an optional `thumbnailImageURL` String
* **actions**
  * `createProfile(user: User, displayName: String): (profile: Profile)`
    * **requires** `user` exists, no `Profile` already exists for `user`, `displayName` is non-empty
    * **effect** creates a new `Profile` for `user` with the given `displayName`
  * `updateDisplayName(profile: Profile, newDisplayName: String): ()`
    * **requires** `profile` exists, `newDisplayName` is non-empty
    * **effect** updates `profile.displayName` to `newDisplayName`
  * `updateBio(profile: Profile, newBio: String): ()`
    * **requires** `profile` exists
    * **effect** updates `profile.bio` to `newBio`
  * `updateThumbnailImage(profile: Profile, newThumbnailImageURL: String): ()`
    * **requires** `profile` exists
    * **effect** updates `profile.thumbnailImageURL` to `newThumbnailImageURL`
  * `deleteProfile(profile: Profile): ()`
    * **requires** `profile` exists
    * **effect** deletes `profile` from the set
