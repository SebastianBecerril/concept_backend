---
timestamp: 'Thu Oct 23 2025 22:44:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_224416.07a5ea1b.md]]'
content_id: ee6314dd23db7bc6192f7120c9769949ff29c69883f841a6e7f0675cc24d59e7
---

# file: src/concepts/CourseCatalog/CourseCatalogConcept.test.ts

```typescript
import {
  assert,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import CourseCatalogConcept from "./CourseCatalogConcept.ts";

Deno.test("CourseCatalog Concept", async (t) => {
  const [db, client] = await testDb();
  const catalog = new CourseCatalogConcept(db);

  let termId: ID;
  let courseId: ID;
  let sectionId: ID;

  await t.step("Operational Principle: Create a shared catalog", async () => {
    console.log("--- Testing Operational Principle ---");

    // 1. A user contributes a term
    console.log("Action: createOrGetTerm({ name: 'Fall 2024' })");
    let result = await catalog.createOrGetTerm({ name: "Fall 2024" });
    console.log("Result:", result);
    assert("term" in result, "Should return a term ID");
    termId = result.term;
    assertExists(termId);

    // 2. A user contributes a course to that term
    console.log(
      "Action: createOrGetCourse({ term: termId, courseNumber: '6.1040', ... })",
    );
    let courseResult = await catalog.createOrGetCourse({
      term: termId,
      courseNumber: "6.1040",
      courseName: "Software Design",
      department: "EECS",
    });
    console.log("Result:", courseResult);
    assert("course" in courseResult, "Should return a course ID");
    courseId = courseResult.course;
    assertExists(courseId);

    // 3. A user contributes a section to that course
    console.log(
      "Action: createOrGetSection({ course: courseId, classType: 'Lecture', ... })",
    );
    const sectionDetails = {
      course: courseId,
      classType: "Lecture",
      days: ["Monday", "Wednesday"],
      startTime: new Date("2024-09-04T10:00:00Z"),
      endTime: new Date("2024-09-04T11:30:00Z"),
      location: "32-123",
      instructor: "Daniel Jackson",
    };
    let sectionResult = await catalog.createOrGetSection(sectionDetails);
    console.log("Result:", sectionResult);
    assert("section" in sectionResult, "Should return a section ID");
    sectionId = sectionResult.section;
    assertExists(sectionId);

    // 4. Another user contributes the SAME term, course, and section, verifying reuse
    console.log("--- Verifying reuse of existing entries ---");
    console.log("Action: createOrGetTerm({ name: 'Fall 2024' }) again");
    result = await catalog.createOrGetTerm({ name: "Fall 2024" });
    console.log("Result:", result);
    assert("term" in result, "Should return a term ID");
    assertEquals(result.term, termId, "Should return the same term ID");

    console.log("Action: createOrGetCourse({ ... }) again");
    courseResult = await catalog.createOrGetCourse({
      term: termId,
      courseNumber: "6.1040",
      courseName: "Software Design & Implementation", // Note: updated name
      department: "EECS",
    });
    console.log("Result:", courseResult);
    assert("course" in courseResult, "Should return a course ID");
    assertEquals(courseResult.course, courseId, "Should return same course ID");

    console.log("Action: createOrGetSection({ ... }) again");
    sectionResult = await catalog.createOrGetSection(sectionDetails);
    console.log("Result:", sectionResult);
    assert("section" in sectionResult, "Should return a section ID");
    assertEquals(
      sectionResult.section,
      sectionId,
      "Should return same section ID",
    );

    // 5. Verify state with queries
    const fetchedCourse = await catalog._getCourseById({ course: courseId });
    assertEquals(
      fetchedCourse?.courseName,
      "Software Design & Implementation",
      "Course name should be updated by the last `createOrGetCourse` call",
    );
  });

  await t.step(
    "Scenario 1: Dependency checks on deletion",
    async () => {
      console.log("\n--- Testing Deletion Dependencies ---");
      // Setup
      const termRes = await catalog.createOrGetTerm({ name: "Spring 2025" });
      assert("term" in termRes, "Should return a term ID");
      const delTermId = termRes.term;
      const courseRes = await catalog.createOrGetCourse({
        term: delTermId,
        courseNumber: "21M.011",
        courseName: "Intro to Western Music",
        department: "Music",
      });
      assert("course" in courseRes, "Should return a course ID");
      const delCourseId = courseRes.course;
      await catalog.createOrGetSection({
        course: delCourseId,
        classType: "Recitation",
        days: ["Friday"],
        startTime: new Date("2025-02-10T14:00:00Z"),
        endTime: new Date("2025-02-10T15:00:00Z"),
        location: "4-270",
        instructor: "Jane Doe",
      });
      const sections = await catalog._getSectionsForCourse({
        course: delCourseId,
      });
      const delSectionId = sections[0]._id;

      // Attempt to delete term with a course
      console.log("Action: deleteTerm with a course inside");
      let errorRes = await catalog.deleteTerm({ term: delTermId });
      console.log("Result:", errorRes);
      assert(
        "error" in errorRes,
        "Should not be able to delete a term with courses",
      );
      assertEquals(
        errorRes.error,
        "Cannot delete term because it has associated courses.",
      );

      // Attempt to delete course with a section
      console.log("Action: deleteCourse with a section inside");
      errorRes = await catalog.deleteCourse({ course: delCourseId });
      console.log("Result:", errorRes);
      assert(
        "error" in errorRes,
        "Should not be able to delete a course with sections",
      );
      assertEquals(
        errorRes.error,
        "Cannot delete course because it has associated sections.",
      );

      // Delete in correct order
      console.log("Action: deleteSection (should succeed)");
      const successRes1 = await catalog.deleteSection({
        section: delSectionId,
      });
      assert(!("error" in successRes1), "Section deletion should succeed");

      console.log("Action: deleteCourse (should succeed now)");
      const successRes2 = await catalog.deleteCourse({ course: delCourseId });
      assert(!("error" in successRes2), "Course deletion should succeed now");

      console.log("Action: deleteTerm (should succeed now)");
      const successRes3 = await catalog.deleteTerm({ term: delTermId });
      assert(!("error" in successRes3), "Term deletion should succeed now");

      const finalTerm = await catalog._getTermById({ term: delTermId });
      assertEquals(finalTerm, null, "Term should be gone");
    },
  );

  await t.step(
    "Scenario 2: Update actions and conflict handling",
    async () => {
      console.log("\n--- Testing Updates and Conflicts ---");
      // Setup
      const term1Res = await catalog.createOrGetTerm({ name: "IAP 2025" });
      assert("term" in term1Res, "Should return a term ID");
      const term1Id = term1Res.term;
      await catalog.createOrGetTerm({ name: "Summer 2025" });
      const course1Res = await catalog.createOrGetCourse({
        term: term1Id,
        courseNumber: "MAS.110",
        courseName: "Fundamentals of Media",
        department: "MAS",
      });
      assert("course" in course1Res, "Should return a course ID");
      const course1Id = course1Res.course;
      await catalog.createOrGetCourse({
        term: term1Id,
        courseNumber: "2.007",
        courseName: "Design and Manufacturing",
        department: "MechE",
      });

      // Attempt to update term name to a conflicting name
      console.log("Action: updateTermName to a conflicting name");
      let errorRes = await catalog.updateTermName({
        term: term1Id,
        newName: "Summer 2025",
      });
      console.log("Result:", errorRes);
      assert("error" in errorRes, "Update should fail due to name conflict");
      assertEquals(errorRes.error, "A term with this name already exists.");

      // Attempt to update course number to a conflicting number in the same term
      console.log("Action: updateCourseDetails to a conflicting course number");
      errorRes = await catalog.updateCourseDetails({
        course: course1Id,
        newCourseNumber: "2.007",
        newCourseName: "New Name",
        newDepartment: "New Dept",
      });
      console.log("Result:", errorRes);
      assert("error" in errorRes, "Update should fail due to number conflict");
      assertEquals(
        errorRes.error,
        "A course with this number already exists in this term.",
      );

      // Successful update
      console.log("Action: updateTermName to a unique name");
      const successRes = await catalog.updateTermName({
        term: term1Id,
        newName: "IAP 2025 (Revised)",
      });
      assert(!("error" in successRes), "Term name update should succeed");
      const updatedTerm = await catalog._getTermById({ term: term1Id });
      assertEquals(updatedTerm?.name, "IAP 2025 (Revised)");
    },
  );

  await t.step("Scenario 3: Handling non-existent entities", async () => {
    console.log("\n--- Testing Actions on Non-existent Entities ---");
    const fakeId = "fake:id" as ID;

    console.log("Action: updateTermName on a fake term");
    let res = await catalog.updateTermName({ term: fakeId, newName: "New" });
    assertEquals(res.error, "Term does not exist.");

    console.log("Action: createOrGetCourse in a fake term");
    const courseRes = await catalog.createOrGetCourse({
      term: fakeId,
      courseNumber: "1.00",
      courseName: "Fake Course",
      department: "Fake Dept",
    });
    assert("error" in courseRes, "Should return an error");
    assertEquals(courseRes.error, "Term does not exist.");

    console.log("Action: deleteCourse on a fake course");
    res = await catalog.deleteCourse({ course: fakeId });
    assertEquals(res.error, "Course does not exist.");

    console.log("Action: createOrGetSection for a fake course");
    const sectionRes = await catalog.createOrGetSection({
      course: fakeId,
      classType: "Lab",
      days: [],
      startTime: new Date(),
      endTime: new Date(),
      location: "Nowhere",
      instructor: "Nobody",
    });
    assert("error" in sectionRes, "Should return an error");
    assertEquals(sectionRes.error, "Course does not exist.");
  });

  await t.step(
    "Scenario 4: Section uniqueness and updates",
    async () => {
      console.log("\n--- Testing Section Uniqueness ---");
      // Setup is from the principle test (termId, courseId)
      const sectionDetails = {
        course: courseId,
        classType: "Recitation",
        days: ["Tuesday"],
        startTime: new Date("2024-09-05T13:00:00Z"),
        endTime: new Date("2024-09-05T14:00:00Z"),
        location: "26-100",
        instructor: "TA Bob",
      };
      const section1Res = await catalog.createOrGetSection(sectionDetails);
      assert("section" in section1Res, "Should return a section ID");
      const section1Id = section1Res.section;
      const section2Res = await catalog.createOrGetSection({
        ...sectionDetails,
        instructor: "TA Alice",
      }); // Different instructor, so new section
      assert("section" in section2Res, "Should return a section ID");
      const section2Id = section2Res.section;

      assertNotEquals(
        section1Id,
        section2Id,
        "Sections with different instructors should be different",
      );

      // Attempt to update section 2 to be identical to section 1
      console.log("Action: updateSectionDetails to create a duplicate");
      const errorRes = await catalog.updateSectionDetails({
        section: section2Id,
        newClassType: sectionDetails.classType,
        newDays: sectionDetails.days,
        newStartTime: sectionDetails.startTime,
        newEndTime: sectionDetails.endTime,
        newLocation: sectionDetails.location,
        newInstructor: "TA Bob", // This makes it identical to section 1
      });
      console.log("Result:", errorRes);
      assert("error" in errorRes, "Update should fail due to uniqueness");
      assertEquals(
        errorRes.error,
        "Another section with these exact details already exists in this course.",
      );
    },
  );

  await client.close();
});

```
