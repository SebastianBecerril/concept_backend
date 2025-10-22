---
timestamp: 'Tue Oct 21 2025 17:44:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_174444.3b222b72.md]]'
content_id: 825697f5e89c1daa962715b82ccdd21362a3f5a93ec0b96c43e7931c476e3f3f
---

# response:

You've hit on a very important usability point, and it's an excellent way to refine the concept design! Your desire for users to "input their courses once for the semesters and leave it at that, then they can change the visibility when they want" suggests that the current `UserEnrollments` concept might be conflating two distinct concerns:

1. **A user's personal, "master" schedule:** What courses they are *actually taking* in a given semester. This is independent of any community.
2. **Sharing/visibility of that schedule within a specific community:** How much of that master schedule they choose to expose to a particular community, and with what visibility settings.

If `community` is part of the core `Enrollment` record, then indeed, to share their schedule with Fraternity Alpha and also with Fraternity Beta (if they were in two, or an alumni group), they would logically have to create separate `Enrollment` records for the same course in each community. That's definitely a hassle.

Let's refactor the concepts to better align with your desired user experience and achieve stronger separation of concerns.

### Proposed Refactoring: Two Concepts

We can split the `UserEnrollments` concept into two:

1. **`UserCourseSchedule` (new name, core concept):** This concept will represent a user's *actual academic schedule for a given term*. It's personal and community-agnostic.
2. **`CommunityScheduleSharing` (new concept):** This concept will manage *how* a user's `UserCourseSchedule` entries are exposed to different communities, including visibility settings.

***

### Refined Concept 1: `UserCourseSchedule` \[User, Course, Section, Term]

* **purpose**
  Enable users to record and manage their personal academic schedule for specific terms, including the courses and sections they are taking.
* **principle**
  After a user adds a course and section to their schedule for a term, it becomes part of their central academic record for that term, allowing them to manage their personal academic commitments.
* **state**
  * a set of `ScheduleEntries` with
    * an `owner` User
    * a `term` Term
    * a `course` Course
    * a `section` Section
* **actions**
  * `addCourseToSchedule(owner: User, term: Term, course: Course, section: Section): (entry: ScheduleEntry)`
    * **requires** `owner` exists, `term` exists, `course` exists, `section` exists, `section.course` is `course` (validation via sync), and no `ScheduleEntry` for `owner` in `term` for `course` exists.
    * **effect** creates a new `ScheduleEntry` for `owner` in `term` for `course` with `section`.
  * `updateCourseSection(entry: ScheduleEntry, newSection: Section): ()`
    * **requires** `entry` exists, `newSection` exists, `newSection.course` is the same `Course` as `entry.course` (validation via sync).
    * **effect** updates `entry.section` to `newSection`.
  * `removeCourseFromSchedule(entry: ScheduleEntry): ()`
    * **requires** `entry` exists.
    * **effect** deletes the `entry`.

**Why this change?**

* **"Input once" achieved:** A user adds "CS101, Section X, Fall 2024" once to their `UserCourseSchedule`. This becomes their personal record.
* **No `community` or `visibility`:** This concept is purely about the *fact* of enrollment, not how it's shared.
* **`Term` parameter:** Explicitly adding `Term` to `ScheduleEntry` is crucial to define "for the semester," allowing a user to enroll in the same `Course` across different terms (e.g., CS101 in Fall 2024 and CS102 in Spring 2025).

***

### New Concept 2: `CommunityScheduleSharing` \[User, Community, ScheduleEntry]

* **purpose**
  Enable users to control which of their `UserCourseSchedule` entries are visible to specific communities, and manage the visibility settings within those communities.
* **principle**
  After a user shares a course from their personal schedule with a community and sets its visibility, other members of that community can view that specific course, subject to the chosen visibility, without affecting how the course is shared with other communities.
* **state**
  * a set of `SharedEnrollmentSettings` with
    * an `owner` User
    * a `community` Community
    * a `scheduleEntry` ScheduleEntry (reference to an entry from `UserCourseSchedule`)
    * a `visibility` flag
* **actions**
  * `shareScheduleEntry(owner: User, community: Community, scheduleEntry: ScheduleEntry, visibility: Flag): (setting: SharedEnrollmentSetting)`
    * **requires** `owner` exists, `community` exists, `scheduleEntry` exists, `scheduleEntry.owner` is `owner`, `owner` is a member of `community` (validation via sync), and no `SharedEnrollmentSetting` for `owner` in `community` for `scheduleEntry` exists.
    * **effect** creates a new `SharedEnrollmentSetting` for `owner` in `community` for `scheduleEntry` with `visibility`.
  * `setSharedVisibility(setting: SharedEnrollmentSetting, newVisibility: Flag): ()`
    * **requires** `setting` exists, `newVisibility` is valid.
    * **effect** updates `setting.visibility` to `newVisibility`.
  * `unshareScheduleEntry(setting: SharedEnrollmentSetting): ()`
    * **requires** `setting` exists.
    * **effect** deletes the `setting`.

**Why this new concept?**

* **Separation of Concerns:** Clearly distinguishes between *being enrolled* and *sharing enrollment*.
* **"Change visibility when they want" achieved:** For a given `ScheduleEntry`, a user can create multiple `SharedEnrollmentSettings` (one for each community) and adjust the `visibility` for each independently.
* **Community-specific settings:** `visibility` is now correctly scoped to a specific `community` and `scheduleEntry`.
* **User Journey:** The user flow now becomes:
  1. Input my semester schedule once (using `UserCourseSchedule`).
  2. For each community, select which of my schedule entries I want to share, and with what visibility (using `CommunityScheduleSharing`).

***

### Updated Syncs

The existing syncs would need to be updated to trigger off actions in `CommunityScheduleSharing` rather than `UserEnrollments`.

* **sync enrollGrantsSpaceMembership**
  * **when** `CommunityScheduleSharing.shareScheduleEntry(owner, community, scheduleEntry, visibility)`
  * **where** `in CourseSpace: space.course is scheduleEntry.course`
  * **then** `CourseSpace.addMember(space, owner)`

* **sync unshareRemovesSpaceMembership**
  * **when** `CommunityScheduleSharing.unshareScheduleEntry(setting)`
  * **where** `in CourseSpace: space.course is setting.scheduleEntry.course`
  * **then** `CourseSpace.removeMember(space, setting.owner)`
  * *Self-correction:* This sync needs to be careful. If a user *unshares* a course from one community, but is still sharing it (or even just enrolled in it, assuming `CourseSpace` membership implies *any* enrollment, not just *shared* ones) in another community, they shouldn't be removed from the `CourseSpace` if that `CourseSpace` is meant to be for *all* members in *any* community taking that course. If `CourseSpace` is truly per-course and independent of community, then membership should derive from the `UserCourseSchedule` directly. If `CourseSpace` is also *community-scoped*, then the problem is more complex. Let's assume for now that a `CourseSpace` is just *per course*, not per-community-per-course.

* **sync createSpaceOnFirstCommunityShare** (renamed from `createSpaceOnFirstEnrollment`)
  * **when** `CommunityScheduleSharing.shareScheduleEntry(owner, community, scheduleEntry, visibility)`
  * **where** `no CourseSpace space exists for scheduleEntry.course`
  * **then** `CourseSpace.createSpace(scheduleEntry.course, scheduleEntry.course.courseName, "Discussion space for " + scheduleEntry.course.courseName)`
    * *Note:* The `name` and `description` for `createSpace` now derive directly from the `Course` in `CourseCatalog` (which `scheduleEntry.course` is a reference to). This assumes `Course` has a `courseName` field.

***

### Addressing Independence (Re-visiting previous feedback)

With this split, the independence of the concepts becomes much clearer:

* **`UserCourseSchedule`:** Purely manages a user's personal academic record.
  * The `section.course is course` check in `addCourseToSchedule` and `updateCourseSection` still implies knowledge of `CourseCatalog`'s structure. This *should* ideally be moved to a sync that validates the incoming `section` reference against the `course` reference *before* the action is allowed to proceed.
  * Example validation sync:
    ```
    sync ValidateSectionCourse
    when
        Request.addCourseToSchedule(owner, term, course, section) // User request
    where
        in CourseCatalog: exists sec where sec is section and sec.course is course
    then
        UserCourseSchedule.addCourseToSchedule(owner, term, course, section) // If valid, proceed
    else // if where clause fails
        Request.error("Section does not belong to specified course")
    ```

* **`CommunityScheduleSharing`:** Manages sharing settings for existing schedule entries with communities.
  * The `owner is a member of community` check in `shareScheduleEntry` should also be moved to an authorization sync involving your (yet-to-be-defined) `Community` concept.

This refactoring significantly improves both the usability for the end-user (addressing your "input once" concern) and the conceptual clarity and independence of your design.
