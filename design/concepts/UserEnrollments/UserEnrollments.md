### concept UserEnrollments \[User, Course, Section]

*   **purpose**
    Enable users to declare and manage their enrollment in specific course sections and control its visibility to other members in their communities.
*   **principle**
    After a user adds an enrollment, their registered courses and sections can be viewed by other community members, subject to visibility settings.
*   **state**
    *   a set of Enrollments with
        *   an `owner` User
        *   a `course` Course
        *   a `section` Section
        *   a `visibility` flag
*   **actions**
    *   `addEnrollment(owner: User, course: Course, section: Section, visibility: flag): (enrollment: Enrollment)`
        *   **requires** `owner` exists, `course` exists, `section` exists, and no `Enrollment` for `owner` in `course` exists
        *   **effect** creates a new `Enrollment` for `owner` for `course` with `section` and `visibility`
    * `updateCourseSection(enrollment: Enrollment, newSection: Section): ()`
        *   **requires** `enrollment` exists, `newSection` exists.
        *   **effect** updates `enrollment.section` to `newSection`.
    *   `setEnrollmentVisibility(enrollment: Enrollment, newVisibility: flag): ()`
        *   **requires** `enrollment` exists, `newVisibility` is valid
        *   **effect** updates `enrollment.visibility` to `newVisibility`
    *   `removeEnrollment(enrollment: Enrollment): ()`
        *   **requires** `enrollment` exists
        *   **effect** deletes the `enrollment`