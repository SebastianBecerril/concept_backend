---
timestamp: 'Thu Oct 23 2025 22:38:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_223816.45a997cc.md]]'
content_id: 88b3792d6d328842f1c792bfc290594c3801294da7e5e2d314cfeb439ce857ed
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
      // If insertion failed due to unique constraint (race condition), find the existing term
      const existing = await this.terms.findOne({ name });
      if (existing) {
        return { term: existing._id };
      }
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
  async updateTermName({
    term,
    newName,
  }: {
    term: ID;
    newName: string;
  }): Promise<Empty | { error: string }> {
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
  async deleteTerm({
    term,
  }: {
    term: ID;
  }): Promise<Empty | { error: string }> {
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

  /**
   * @action createOrGetCourse
   * @requires `term` exists
   * @effects If a `Course` with the exact `courseNumber` in `term` already exists, its `courseName` and `department` are updated to the provided values (to reflect the latest community consensus or input), and the existing `Course` is returned. Otherwise, creates a new `Course` associated with `term` and the provided details, and returns it.
   * @param {ID} term - The ID of the term the course belongs to.
   * @param {string} courseNumber - The course number (e.g., "6.1040").
   * @param {string} courseName - The name of the course.
   * @param {string} department - The department offering the course.
   * @returns {{ course: ID } | { error: string }} The ID of the course or an error message.
   */
  async createOrGetCourse({
    term,
    courseNumber,
    courseName,
    department,
  }: {
    term: ID;
    courseNumber: string;
    courseName: string;
    department: string;
  }): Promise<{ course: ID } | { error: string }> {
    // Check if term exists
    const existingTerm = await this.terms.findOne({ _id: term });
    if (!existingTerm) {
      return { error: "Term does not exist." };
    }

    // Check if course already exists in this term
    const existingCourse = await this.courses.findOne({
      term: term,
      courseNumber: courseNumber,
    });

    if (existingCourse) {
      // Update existing course with new details (community consensus)
      try {
        await this.courses.updateOne(
          { _id: existingCourse._id },
          { $set: { courseName: courseName, department: department } },
        );
        return { course: existingCourse._id };
      } catch (e) {
        console.error("Error updating course details:", e);
        return {
          error: "Failed to update course details due to a system error.",
        };
      }
    }

    // Create new course
    const courseId = freshID();
    const newCourse: CourseSchema = {
      _id: courseId,
      term: term,
      courseNumber: courseNumber,
      courseName: courseName,
      department: department,
    };

    try {
      await this.courses.insertOne(newCourse);
      return { course: courseId };
    } catch (e) {
      console.error("Error creating course:", e);
      return { error: "Failed to create course due to a system error." };
    }
  }

  /**
   * @action updateCourseDetails
   * @requires `course` exists, and if `newCourseNumber` is different from `course.courseNumber`, then no other `Course` in `course.term` has `newCourseNumber`
   * @effects Updates the `courseNumber`, `courseName`, and `department` of `course`
   * @param {ID} course - The ID of the course to update.
   * @param {string} newCourseNumber - The new course number.
   * @param {string} newCourseName - The new course name.
   * @param {string} newDepartment - The new department.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateCourseDetails({
    course,
    newCourseNumber,
    newCourseName,
    newDepartment,
  }: {
    course: ID;
    newCourseNumber: string;
    newCourseName: string;
    newDepartment: string;
  }): Promise<Empty | { error: string }> {
    // Check if course exists
    const existingCourse = await this.courses.findOne({ _id: course });
    if (!existingCourse) {
      return { error: "Course does not exist." };
    }

    // Check if new course number is different
    if (newCourseNumber !== existingCourse.courseNumber) {
      // Check if another course in the same term has the new course number
      const courseConflict = await this.courses.findOne({
        term: existingCourse.term,
        courseNumber: newCourseNumber,
        _id: { $ne: course },
      });
      if (courseConflict) {
        return {
          error: "A course with this number already exists in this term.",
        };
      }
    }

    try {
      await this.courses.updateOne(
        { _id: course },
        {
          $set: {
            courseNumber: newCourseNumber,
            courseName: newCourseName,
            department: newDepartment,
          },
        },
      );
      return {};
    } catch (e) {
      console.error("Error updating course details:", e);
      return {
        error: "Failed to update course details due to a system error.",
      };
    }
  }

  /**
   * @action deleteCourse
   * @requires `course` exists, and no `Section` belongs to `course`
   * @effects Removes the `course` from the set
   * @param {ID} course - The ID of the course to delete.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async deleteCourse({
    course,
  }: {
    course: ID;
  }): Promise<Empty | { error: string }> {
    // Check if course exists
    const existingCourse = await this.courses.findOne({ _id: course });
    if (!existingCourse) {
      return { error: "Course does not exist." };
    }

    // Check if any sections belong to this course
    const sectionsInCourse = await this.sections.findOne({ course: course });
    if (sectionsInCourse) {
      return {
        error: "Cannot delete course because it has associated sections.",
      };
    }

    try {
      await this.courses.deleteOne({ _id: course });
      return {};
    } catch (e) {
      console.error("Error deleting course:", e);
      return { error: "Failed to delete course due to a system error." };
    }
  }

  /**
   * @action createOrGetSection
   * @requires `course` exists
   * @effects If an identical `Section` (matching all provided details) for `course` already exists, returns that `Section`. Otherwise, creates a new `Section` for `course` with the given details and returns it.
   * @param {ID} course - The ID of the course the section belongs to.
   * @param {string} classType - The type of class (e.g., "Lecture", "Recitation", "Lab").
   * @param {string[]} days - The days of the week the section meets.
   * @param {Date} startTime - The start time of the section.
   * @param {Date} endTime - The end time of the section.
   * @param {string} location - The location where the section meets.
   * @param {string} instructor - The instructor teaching the section.
   * @returns {{ section: ID } | { error: string }} The ID of the section or an error message.
   */
  async createOrGetSection({
    course,
    classType,
    days,
    startTime,
    endTime,
    location,
    instructor,
  }: {
    course: ID;
    classType: string;
    days: string[];
    startTime: Date;
    endTime: Date;
    location: string;
    instructor: string;
  }): Promise<{ section: ID } | { error: string }> {
    // Check if course exists
    const existingCourse = await this.courses.findOne({ _id: course });
    if (!existingCourse) {
      return { error: "Course does not exist." };
    }

    // Check if identical section already exists
    const existingSection = await this.sections.findOne({
      course: course,
      classType: classType,
      days: days,
      startTime: startTime,
      endTime: endTime,
      location: location,
      instructor: instructor,
    });

    if (existingSection) {
      return { section: existingSection._id };
    }

    // Create new section
    const sectionId = freshID();
    const newSection: SectionSchema = {
      _id: sectionId,
      course: course,
      classType: classType,
      days: days,
      startTime: startTime,
      endTime: endTime,
      location: location,
      instructor: instructor,
    };

    try {
      await this.sections.insertOne(newSection);
      return { section: sectionId };
    } catch (e) {
      console.error("Error creating section:", e);
      return { error: "Failed to create section due to a system error." };
    }
  }

  /**
   * @action updateSectionDetails
   * @requires `section` exists, and no other `Section` in `section.course` is identical to the section that would result from these updates
   * @effects Updates the `classType`, `days`, `startTime`, `endTime`, `location`, and `instructor` of `section`
   * @param {ID} section - The ID of the section to update.
   * @param {string} newClassType - The new class type.
   * @param {string[]} newDays - The new days of the week.
   * @param {Date} newStartTime - The new start time.
   * @param {Date} newEndTime - The new end time.
   * @param {string} newLocation - The new location.
   * @param {string} newInstructor - The new instructor.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateSectionDetails({
    section,
    newClassType,
    newDays,
    newStartTime,
    newEndTime,
    newLocation,
    newInstructor,
  }: {
    section: ID;
    newClassType: string;
    newDays: string[];
    newStartTime: Date;
    newEndTime: Date;
    newLocation: string;
    newInstructor: string;
  }): Promise<Empty | { error: string }> {
    // Check if section exists
    const existingSection = await this.sections.findOne({ _id: section });
    if (!existingSection) {
      return { error: "Section does not exist." };
    }

    // Check if another section in the same course would be identical after updates
    const identicalSection = await this.sections.findOne({
      course: existingSection.course,
      classType: newClassType,
      days: newDays,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation,
      instructor: newInstructor,
      _id: { $ne: section },
    });

    if (identicalSection) {
      return {
        error:
          "Another section with these exact details already exists in this course.",
      };
    }

    try {
      await this.sections.updateOne(
        { _id: section },
        {
          $set: {
            classType: newClassType,
            days: newDays,
            startTime: newStartTime,
            endTime: newEndTime,
            location: newLocation,
            instructor: newInstructor,
          },
        },
      );
      return {};
    } catch (e) {
      console.error("Error updating section details:", e);
      return {
        error: "Failed to update section details due to a system error.",
      };
    }
  }

  /**
   * @action deleteSection
   * @requires `section` exists
   * @effects Removes the `section` from the set
   * @param {ID} section - The ID of the section to delete.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async deleteSection({
    section,
  }: {
    section: ID;
  }): Promise<Empty | { error: string }> {
    // Check if section exists
    const existingSection = await this.sections.findOne({ _id: section });
    if (!existingSection) {
      return { error: "Section does not exist." };
    }

    try {
      await this.sections.deleteOne({ _id: section });
      return {};
    } catch (e) {
      console.error("Error deleting section:", e);
      return { error: "Failed to delete section due to a system error." };
    }
  }

  // QUERIES

  /**
   * @query Retrieves all terms from the catalog.
   * @returns {Promise<TermSchema[]>} A promise that resolves to an array of all terms, sorted alphabetically by name.
   */
  async _getTerms(): Promise<TermSchema[]> {
    return this.terms.find().sort({ name: 1 }).toArray();
  }

  /**
   * @query Retrieves a single term by its unique ID.
   * @param {ID} term - The ID of the term to retrieve.
   * @returns {Promise<TermSchema | null>} A promise that resolves to the term document or null if not found.
   */
  async _getTermById({ term }: { term: ID }): Promise<TermSchema | null> {
    return this.terms.findOne({ _id: term });
  }

  /**
   * @query Retrieves all courses associated with a specific term.
   * @param {ID} term - The ID of the term for which to retrieve courses.
   * @returns {Promise<CourseSchema[]>} A promise that resolves to an array of courses for the given term, sorted by course number.
   */
  async _getCoursesForTerm({ term }: { term: ID }): Promise<CourseSchema[]> {
    if (!term) {
      return [];
    }
    return this.courses.find({ term }).sort({ courseNumber: 1 }).toArray();
  }

  /**
   * @query Retrieves a single course by its unique ID.
   * @param {ID} course - The ID of the course to retrieve.
   * @returns {Promise<CourseSchema | null>} A promise that resolves to the course document or null if not found.
   */
  async _getCourseById({ course }: { course: ID }): Promise<CourseSchema | null> {
    return this.courses.findOne({ _id: course });
  }

  /**
   * @query Retrieves all sections associated with a specific course.
   * @param {ID} course - The ID of the course for which to retrieve sections.
   * @returns {Promise<SectionSchema[]>} A promise that resolves to an array of sections for the given course, sorted by class type and then start time.
   */
  async _getSectionsForCourse({ course }: { course: ID }): Promise<SectionSchema[]> {
    if (!course) {
      return [];
    }
    return this.sections.find({ course }).sort({ classType: 1, startTime: 1 }).toArray();
  }

  /**
   * @query Retrieves a single section by its unique ID.
   * @param {ID} section - The ID of the section to retrieve.
   * @returns {Promise<SectionSchema | null>} A promise that resolves to the section document or null if not found.
   */
  async _getSectionById({ section }: { section: ID }): Promise<SectionSchema | null> {
    return this.sections.findOne({ _id: section });
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

### concept Community \[User]

* **purpose**
  Group users into distinct social or organizational units and manage their membership and roles.
* **principle**
  After a user creates a community, they can invite other users to join as members and assign roles, enabling structured interaction within that unit.
* **state**
  * a set of Communities with
    * a `name` String
    * a `description` String
    * a `creationDate` DateTime
    * a `memberships` set of Memberships
  * a set of Memberships with
    * a `user` User
    * a `community` Community
    * a `role` String
    * a `joinDate` DateTime
* **actions**
  * `createCommunity(name: String, description: String, creator: User): (community: Community)`
    * **requires** `name` and `description` are non-empty, a `Community` with `name` does not exist, `creator` exists
    * **effect** creates a new `Community` with the given `name` and `description`, and adds `creator` as an `ADMIN` `Membership` to this `Community`
  * `updateCommunityDetails(community: Community, newName: String, newDescription: String, requester: User): ()`
    * **requires** `community` exists, `requester` is an `ADMIN` member of `community`
    * **effect** updates the `name` and `description` of `community`
  * `addMember(community: Community, user: User, inviter: User): ()`
    * **requires** `community` exists, `user` exists, `inviter` exists, `user` is not already a member of `community`, `inviter` is an `ADMIN` member of `community`
    * **effect** creates a `Membership` for `user` in `community` with `MEMBER` role
  * `removeMember(community: Community, user: User, requester: User): ()`
    * **requires** `community` exists, `user` is a member of `community`, (`requester` is an `ADMIN` member of `community` OR `requester` is `user`)
    * **effect** removes the `Membership` of `user` from `community`
  * `setMemberRole(membership: Membership, newRole: String, requester: User): ()`
    * **requires** `membership` exists, `newRole` is valid, `requester` is an `ADMIN` member of `membership.community`, `requester` is not attempting to demote themselves from `ADMIN` to `MEMBER` (unless there is another `ADMIN`)
    * **effect** updates `membership.role` to `newRole`
  * `deleteCommunity(community: Community, requester: User): ()`
    * **requires** `community` exists, `requester` is an `ADMIN` member of `community`
    * **effect** removes `community` and all associated `Memberships`

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
