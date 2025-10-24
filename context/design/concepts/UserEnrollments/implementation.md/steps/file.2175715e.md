---
timestamp: 'Thu Oct 23 2025 22:55:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_225514.26db2d28.md]]'
content_id: 2175715e8fcbbbf33233f794cda30fdb970267b4e34737de15f6cac2c4ccaa3e
---

# file: src/concepts/UserEnrollments/UserEnrollmentsConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

interface EnrollmentSchema {
  _id: ID;
  owner: ID;
  course: ID;
  section: ID;
  visibility: boolean;
}

/**
 * @concept UserEnrollments
 * @purpose Enable users to declare and manage their enrollment in specific course sections and control its visibility to other members in their communities.
 * @principle After a user adds an enrollment, their registered courses and sections can be viewed by other community members, subject to visibility settings.
 */
export default class UserEnrollmentsConcept {
  private static readonly PREFIX = "UserEnrollments" + ".";

  /**
   * @state
   * a set of Enrollments with
   *   an `owner` User
   *   a `course` Course
   *   a `section` Section
   *   a `visibility` flag
   */
  enrollments: Collection<EnrollmentSchema>;

  constructor(private readonly db: Db) {
    this.enrollments = this.db.collection(
      UserEnrollmentsConcept.PREFIX + "enrollments",
    );

    this.enrollments.createIndex({ owner: 1, course: 1 }, { unique: true })
      .catch(console.error);
  }

  /**
   * @action addEnrollment
   * @requires `owner` exists, `course` exists, `section` exists, and no `Enrollment` for `owner` in `course` exists
   * @effects creates a new `Enrollment` for `owner` for `course` with `section` and `visibility`
   * @param {ID} owner - The ID of the user creating the enrollment.
   * @param {ID} course - The ID of the course to enroll in.
   * @param {ID} section - The ID of the section to enroll in.
   * @param {boolean} visibility - The visibility setting for the enrollment.
   * @returns {{ enrollment: ID } | { error: string }} The ID of the new enrollment or an error message.
   */
  async addEnrollment({
    owner,
    course,
    section,
    visibility,
  }: {
    owner: ID;
    course: ID;
    section: ID;
    visibility: boolean;
  }): Promise<{ enrollment: ID } | { error: string }> {
    // Check if enrollment already exists for this owner in this course
    const existingEnrollment = await this.enrollments.findOne({
      owner: owner,
      course: course,
    });
    if (existingEnrollment) {
      return { error: "User is already enrolled in this course." };
    }

    const enrollmentId = freshID();

    const newEnrollment: EnrollmentSchema = {
      _id: enrollmentId,
      owner: owner,
      course: course,
      section: section,
      visibility: visibility,
    };

    try {
      await this.enrollments.insertOne(newEnrollment);
      return { enrollment: enrollmentId };
    } catch (e) {
      console.error("Error creating enrollment:", e);
      return { error: "Failed to create enrollment due to a system error." };
    }
  }
}

```
