---
timestamp: 'Thu Oct 23 2025 23:07:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_230713.e10d112c.md]]'
content_id: e8d510fcbb8a83e29f9447491ff68c0704d7ea51c2a9a2ec46124a10d77ee4f4
---

# file: src/concepts/UserEnrollments/UserEnrollmentsConcept.ts

```typescript
import { Collection, Db, MongoServerError } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

type User = ID;
type Course = ID;
type Section = ID;
type Enrollment = ID;

interface EnrollmentSchema {
  _id: Enrollment;
  owner: User;
  course: Course;
  section: Section;
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

    // This index enforces the rule that a user can only be enrolled in a course once.
    this.enrollments.createIndex({ owner: 1, course: 1 }, { unique: true })
      .catch(console.error);
  }

  /**
   * @action addEnrollment
   * @requires `owner`, `course`, and `section` exist, and no `Enrollment` for `owner` in `course` exists.
   * @effects Creates a new `Enrollment` for `owner` in `course` with `section` and `visibility`.
   */
  async addEnrollment({
    owner,
    course,
    section,
    visibility,
  }: {
    owner: User;
    course: Course;
    section: Section;
    visibility: boolean;
  }): Promise<{ enrollment: Enrollment } | { error: string }> {
    const enrollmentId = freshID();
  
    try {
      await this.enrollments.insertOne({
        _id: enrollmentId,
        owner,
        course,
        section,
        visibility,
      });
      return { enrollment: enrollmentId };
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        return { error: "User is already enrolled in this course." };
      }
      console.error("Error creating enrollment:", e);
      return { error: "Failed to create enrollment due to a system error." };
    }
  }

  /**
   * @action removeEnrollment
   * @requires An `Enrollment` with the given `enrollmentId` exists.
   * @effects Deletes the `Enrollment` record matching `enrollmentId`.
   */
  async removeEnrollment({ enrollmentId }: { enrollmentId: Enrollment }): Promise<Empty | { error: string }> {
    try {
      const result = await this.enrollments.deleteOne({ _id: enrollmentId });
      if (result.deletedCount === 0) {
        return { error: "Enrollment not found." };
      }
      return {};
    } catch (e) {
      console.error("Error removing enrollment:", e);
      return { error: "Failed to remove enrollment due to a system error." };
    }
  }

  /**
   * @action updateVisibility
   * @requires An `Enrollment` with the given `enrollmentId` exists.
   * @effects Updates the `visibility` field of the specified `Enrollment`.
   */
  async updateVisibility({ enrollmentId, visibility }: { enrollmentId: Enrollment; visibility: boolean }): Promise<Empty | { error: string }> {
    try {
      const result = await this.enrollments.updateOne(
        { _id: enrollmentId },
        { $set: { visibility } },
      );
      if (result.matchedCount === 0) {
        return { error: "Enrollment not found." };
      }
      return {};
    } catch (e) {
      console.error("Error updating visibility:", e);
      return { error: "Failed to update visibility due to a system error." };
    }
  }

  /**
   * @query _getEnrollmentById
   * @effects Returns a single enrollment record if found, otherwise null.
   */
  async _getEnrollmentById({ enrollmentId }: { enrollmentId: Enrollment }): Promise<EnrollmentSchema | null> {
    return this.enrollments.findOne({ _id: enrollmentId });
  }

  /**
   * @query _getEnrollmentsForUser
   * @effects Returns all enrollment records for a given user.
   */
  async _getEnrollmentsForUser({ owner }: { owner: User }): Promise<EnrollmentSchema[]> {
    return this.enrollments.find({ owner }).toArray();
  }

  /**
   * @query _getVisibleEnrollmentsForCourse
   * @effects Returns all enrollment records for a given course where visibility is true.
   */
  async _getVisibleEnrollmentsForCourse({ course }: { course: Course }): Promise<EnrollmentSchema[]> {
    return this.enrollments.find({ course, visibility: true }).toArray();
  }
}
```
