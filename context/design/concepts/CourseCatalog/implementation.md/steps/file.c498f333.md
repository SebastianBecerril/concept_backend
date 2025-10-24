---
timestamp: 'Thu Oct 23 2025 21:48:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_214834.94131763.md]]'
content_id: c498f333795f91a93af174adce59b84668db1def034dc296d31a5ad4d6802e94
---

# file: src/concepts/CourseCatalog/CourseCatalogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

interface TermSchema {
  _id: ID;
  name: string;
  courses: ID[];
}

interface CourseSchema {
  _id: ID;
  term: ID;
  courseNumber: string;
  courseName: string;
  department: string;
  sections: ID[];
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
   *   a `courses` Array of Course IDs
   */
  terms: Collection<TermSchema>;

  /**
   * @state
   * a set of Courses with
   *   a `term` Term
   *   a `courseNumber` String
   *   a `courseName` String
   *   a `department` String
   *   a `sections` Array of Section IDs
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
    * a `courses` set of Courses
  * a set of Courses with
    * a `term` Term
    * a `courseNumber` String
    * a `courseName` String
    * a `department` String
    * a `sections` set of Sections
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
    * **effect** If a `Course` with the exact `courseNumber` in `term` already exists, its `courseName` and `department` are updated to the provided values (to reflect the latest community consensus or input), and the existing `Course` is returned. Otherwise, creates a new `Course` associated with `term` and the provided details, and returns it. The new `Course` is also implicitly added to `term`'s `set of Courses`.
  * `updateCourseDetails(course: Course, newCourseNumber: String, newCourseName: String, newDepartment: String): ()`
    * **requires** `course` exists, and if `newCourseNumber` is different from `course.courseNumber`, then no other `Course` in `course.term` has `newCourseNumber`.
    * **effect** Updates the `courseNumber`, `courseName`, and `department` of `course`.
  * `deleteCourse(course: Course): ()`
    * **requires** `course` exists, and no `Section` belongs to `course`.
    * **effect** Removes the `course` from the set. Also implicitly removes `course` from `course.term`'s `set of Courses`.
  * `createOrGetSection(course: Course, classType: String, days: set of Strings, startTime: DateTime, endTime: DateTime, location: String, instructor: String): (section: Section)`
    * **requires** `course` exists.
    * **effect** If an identical `Section` (matching all provided details) for `course` already exists, returns that `Section`. Otherwise, creates a new `Section` for `course` with the given details and returns it. The new `Section` is also implicitly added to `course`'s `set of Sections`.
  * `updateSectionDetails(section: Section, newClassType: String, newDays: set of Strings, newStartTime: DateTime, newEndTime: DateTime, newLocation: String, newInstructor: String): ()`
    * **requires** `section` exists, and no other `Section` in `section.course` is identical to the section that would result from these updates.
    * **effect** Updates the `classType`, `days`, `startTime`, `endTime`, `location`, and `instructor` of `section`.
  * `deleteSection(section: Section): ()`
    * **requires** `section` exists.
    * **effect** Removes the `section` from the set. Also implicitly removes `section` from `section.course`'s `set of Sections`.
