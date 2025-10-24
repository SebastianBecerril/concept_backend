---
timestamp: 'Thu Oct 23 2025 22:06:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_220636.81965e9d.md]]'
content_id: c7835435d63939c1383a1407d8ba30b753131c832c94e7edb89349c001ab7064
---

# file: src/concepts/CourseCatalog/CourseCatalogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

interface TermSchema {
  _id: ID;
  name: string;
}

interface CourseSchema {
  _id: ID;
  term: ID;
  courseNumber: string;
  courseName: string;
  department: string;
}

interface SectionSchema {
  _id: ID;
  course: ID;
  classType: string;
  days: string[];
  startTime: Date;
  endTime: Date;
  location: string;
  instructor: string;
}

/**
 * @concept CourseCatalog
 * @purpose Provide a community-curated and reliable registry of academic terms, courses, and sections, enabling users to easily find and reference shared academic offerings.
 * @principle Users contribute academic terms, courses, and sections by providing their details. The catalog intelligently reuses existing entries or creates new ones, thereby building a consistent, shared registry that facilitates academic coordination and connection for the community.
 */
export default class CourseCatalogConcept {
  private static readonly PREFIX = "CourseCatalog" + ".";

  /**
   * @state
   * a set of Terms with
   *   a `name` String
   */
  terms: Collection<TermSchema>;

  /**
   * @state
   * a set of Courses with
   *   a `term` Term
   *   a `courseNumber` String
   *   a `courseName` String
   *   a `department` String
   */
  courses: Collection<CourseSchema>;

  /**
   * @state
   * a set of Sections with
   *   a `course` Course
   *   a `classType` String
   *   a `days` Array of Strings
   *   a `startTime` DateTime
   *   an `endTime` DateTime
   *   a `location` String
   *   an `instructor` String
   */
  sections: Collection<SectionSchema>;

  constructor(private readonly db: Db) {
    this.terms = this.db.collection(
      CourseCatalogConcept.PREFIX + "terms",
    );
    this.courses = this.db.collection(
      CourseCatalogConcept.PREFIX + "courses",
    );
    this.sections = this.db.collection(
      CourseCatalogConcept.PREFIX + "sections",
    );

    this.terms.createIndex({ name: 1 }, { unique: true })
      .catch(console.error);
    this.courses.createIndex({ term: 1, courseNumber: 1 }, { unique: true })
      .catch(console.error);

    // Prevent duplicate sections with identical details (same course, time, location, instructor, etc.)
    // This allows multiple sections of the same course with different times/instructors/locations
    this.sections.createIndex({
      course: 1,
      classType: 1,
      days: 1,
      startTime: 1,
      endTime: 1,
      location: 1,
      instructor: 1,
    }, { unique: true })
      .catch(console.error);
  }

  /**
   * @action createOrGetTerm
   * @requires
   * @effects If a `Term` with the exact `name` already exists, returns that `Term`. Otherwise, creates a new `Term` with the given `name` and returns it.
   * @param {string} name - The name of the term.
   * @returns {{ term: ID } | { error: string }} The ID of the term or an error message.
   */
  async createOrGetTerm(
    { name }: { name: string },
  ): Promise<{ term: ID } | { error: string }> {
    // Check if term already exists
    const existingTerm = await this.terms.findOne({ name });
    if (existingTerm) {
      return { term: existingTerm._id };
    }

    // Create new term
    const termId = freshID();
    const newTerm: TermSchema = {
      _id: termId,
      name,
    };

    try {
      await this.terms.insertOne(newTerm);
      return { term: termId };
    } catch (e) {
      console.error("Error creating term:", e);
      return { error: "Failed to create term due to a system error." };
    }
  }

  /**
   * @action updateTermName
   * @requires `term` exists, and no other `Term` with `newName` exists
   * @effects Updates the `name` of `term` to `newName`
   * @param {ID} term - The ID of the term to update.
   * @param {string} newName - The new name for the term.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateTermName(
    { term, newName }: { term: ID; newName: string },
  ): Promise<Empty | { error: string }> {
    // Check if term exists
    const existingTerm = await this.terms.findOne({ _id: term });
    if (!existingTerm) {
      return { error: "Term does not exist." };
    }

    // Check if new name is different
    if (newName === existingTerm.name) {
      return {};
    }

    // Check if another term with the new name already exists
    const nameConflict = await this.terms.findOne({ name: newName });
    if (nameConflict) {
      return { error: "A term with this name already exists." };
    }

    try {
      await this.terms.updateOne(
        { _id: term },
        { $set: { name: newName } },
      );
      return {};
    } catch (e) {
      console.error("Error updating term name:", e);
      return { error: "Failed to update term name due to a system error." };
    }
  }

  /**
   * @action deleteTerm
   * @requires `term` exists, and no `Course` belongs to `term`
   * @effects Removes the `term` from the set
   * @param {ID} term - The ID of the term to delete.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async deleteTerm({ term }: { term: ID }): Promise<Empty | { error: string }> {
    // Check if term exists
    const existingTerm = await this.terms.findOne({ _id: term });
    if (!existingTerm) {
      return { error: "Term does not exist." };
    }

    // Check if any courses belong to this term
    const coursesInTerm = await this.courses.findOne({ term: term });
    if (coursesInTerm) {
      return { error: "Cannot delete term because it has associated courses." };
    }

    try {
      await this.terms.deleteOne({ _id: term });
      return {};
    } catch (e) {
      console.error("Error deleting term:", e);
      return { error: "Failed to delete term due to a system error." };
    }
  }
}

```

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
