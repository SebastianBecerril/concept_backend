---
timestamp: 'Thu Oct 23 2025 23:07:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_230746.9b6b6327.md]]'
content_id: 8cf51e1e452b03a63d45b7b58a0f7383ecf7c91e5ed635c779d6b1eefa9bf111
---

# file: src/concepts/UserEnrollments/UserEnrollmentsConcept.test.ts

```typescript
import { assertEquals, assertExists, assert } from "jsr:@std/assert";
import { testDb } from "../../../utils/database.ts";
import { ID } from "../../../utils/types.ts";
import UserEnrollmentsConcept from "./UserEnrollmentsConcept.ts";

Deno.test("UserEnrollmentsConcept", async (t) => {
  const [db, client] = await testDb();
  const enrollments = new UserEnrollmentsConcept(db);

  // Mock IDs for testing
  const userAlice = "user:Alice" as ID;
  const userBob = "user:Bob" as ID;
  const courseCS101 = "course:CS101" as ID;
  const coursePHYS201 = "course:PHYS201" as ID;
  const sectionA = "section:A" as ID;
  const sectionB = "section:B" as ID;
  const fakeEnrollmentId = "enrollment:fake" as ID;

  await t.step("Operational Principle: Manages enrollments and respects visibility settings", async () => {
    console.log("\n--- Testing Operational Principle ---");

    // 1. Alice enrolls in CS101 Section A and makes it visible.
    console.log("Action: Alice adds enrollment to CS101 (visible)");
    const aliceEnrollmentResult = await enrollments.addEnrollment({
      owner: userAlice,
      course: courseCS101,
      section: sectionA,
      visibility: true,
    });
    console.log("Result:", aliceEnrollmentResult);
    assert("enrollment" in aliceEnrollmentResult, "Alice's enrollment should succeed");
    const aliceEnrollmentId = aliceEnrollmentResult.enrollment;

    // 2. Bob enrolls in the same course (different section) and makes it private.
    console.log("Action: Bob adds enrollment to CS101 (private)");
    const bobEnrollmentResult = await enrollments.addEnrollment({
      owner: userBob,
      course: courseCS101,
      section: sectionB,
      visibility: false,
    });
    console.log("Result:", bobEnrollmentResult);
    assert("enrollment" in bobEnrollmentResult, "Bob's enrollment should succeed");

    // 3. Verify that all enrollments for the course can be queried.
    console.log("Query: Getting all enrollments for course CS101");
    const allCS101Enrollments = await enrollments._getEnrollmentsByCourse({ course: courseCS101 });
    console.log(`Found ${allCS101Enrollments.length} enrollments.`);
    assertEquals(allCS101Enrollments.length, 2, "Should find both enrollments for CS101");

    // 4. Verify that only visible enrollments are flagged as such.
    // In a real app, a sync/service would use this flag to filter.
    const visibleEnrollments = await enrollments._getVisibleEnrollments();
    console.log(`Found ${visibleEnrollments.length} visible enrollments.`);
    assertEquals(visibleEnrollments.length, 1, "Should only find one visible enrollment");
    assertEquals(visibleEnrollments[0]._id, aliceEnrollmentId, "The visible enrollment should be Alice's");
    assertEquals(visibleEnrollments[0].visibility, true);
  });

  await t.step("Interesting Scenario: Handles duplicate enrollment attempts", async () => {
    console.log("\n--- Testing Duplicate Enrollments ---");
    // Bob is already in CS101 from the previous test. Let's try to add him again.
    console.log("Action: Bob attempts to re-enroll in CS101");
    const duplicateResult = await enrollments.addEnrollment({
      owner: userBob,
      course: courseCS101,
      section: sectionA, // Different section, same course
      visibility: true,
    });
    console.log("Result:", duplicateResult);
    assert("error" in duplicateResult, "Duplicate enrollment should return an error");
    assertEquals(duplicateResult.error, "User is already enrolled in this course.");
  });

  await t.step("Interesting Scenario: Allows updating section and visibility", async () => {
    console.log("\n--- Testing Updates to Enrollment ---");
    // 1. Bob enrolls in a new course.
    console.log("Action: Bob adds enrollment to PHYS201");
    const physEnrollmentResult = await enrollments.addEnrollment({
      owner: userBob,
      course: coursePHYS201,
      section: sectionA,
      visibility: false,
    });
    assert("enrollment" in physEnrollmentResult, "Enrollment should succeed");
    const physEnrollmentId = physEnrollmentResult.enrollment;

    // 2. Update the section.
    console.log(`Action: Updating section for enrollment ${physEnrollmentId}`);
    const updateSectionResult = await enrollments.updateCourseSection({
      enrollment: physEnrollmentId,
      newSection: sectionB,
    });
    console.log("Result:", updateSectionResult);
    assertEquals(updateSectionResult, {}, "Section update should succeed");

    let updatedEnrollment = await enrollments._getEnrollmentById({ enrollment: physEnrollmentId });
    assertExists(updatedEnrollment, "Enrollment must exist after update");
    assertEquals(updatedEnrollment.section, sectionB, "Section should be updated to B");

    // 3. Update the visibility.
    console.log(`Action: Updating visibility for enrollment ${physEnrollmentId}`);
    const updateVisibilityResult = await enrollments.setEnrollmentVisibility({
      enrollment: physEnrollmentId,
      newVisibility: true,
    });
    console.log("Result:", updateVisibilityResult);
    assertEquals(updateVisibilityResult, {}, "Visibility update should succeed");

    updatedEnrollment = await enrollments._getEnrollmentById({ enrollment: physEnrollmentId });
    assertExists(updatedEnrollment, "Enrollment must still exist");
    assertEquals(updatedEnrollment.visibility, true, "Visibility should be updated to true");
  });

  await t.step("Interesting Scenario: Allows removing an enrollment", async () => {
    console.log("\n--- Testing Enrollment Removal ---");
    // 1. Get Alice's CS101 enrollment ID from the first test.
    const aliceEnrollments = await enrollments._getEnrollmentsByOwner({ owner: userAlice });
    const aliceCS101Enrollment = aliceEnrollments.find((e) => e.course === courseCS101);
    assertExists(aliceCS101Enrollment, "Alice's CS101 enrollment should exist before removal");
    const enrollmentIdToRemove = aliceCS101Enrollment._id;

    // 2. Remove the enrollment.
    console.log(`Action: Removing enrollment ${enrollmentIdToRemove}`);
    const removeResult = await enrollments.removeEnrollment({ enrollment: enrollmentIdToRemove });
    console.log("Result:", removeResult);
    assertEquals(removeResult, {}, "Removal should succeed");

    // 3. Verify it's gone.
    console.log(`Query: Verifying enrollment ${enrollmentIdToRemove} is deleted`);
    const removedEnrollment = await enrollments._getEnrollmentById({ enrollment: enrollmentIdToRemove });
    assertEquals(removedEnrollment, null, "Enrollment should be null after removal");
  });

  await t.step("Interesting Scenario: Rejects operations on non-existent enrollments", async () => {
    console.log("\n--- Testing Operations on Non-Existent Enrollments ---");

    // 1. Try to update section
    console.log(`Action: Updating section for fake enrollment ${fakeEnrollmentId}`);
    const updateSectionResult = await enrollments.updateCourseSection({
      enrollment: fakeEnrollmentId,
      newSection: sectionA,
    });
    console.log("Result:", updateSectionResult);
    assert("error" in updateSectionResult, "Update section should fail for non-existent enrollment");
    assertEquals(updateSectionResult.error, "Enrollment does not exist.");

    // 2. Try to update visibility
    console.log(`Action: Updating visibility for fake enrollment ${fakeEnrollmentId}`);
    const updateVisibilityResult = await enrollments.setEnrollmentVisibility({
      enrollment: fakeEnrollmentId,
      newVisibility: true,
    });
    console.log("Result:", updateVisibilityResult);
    assert("error" in updateVisibilityResult, "Update visibility should fail for non-existent enrollment");
    assertEquals(updateVisibilityResult.error, "Enrollment does not exist.");

    // 3. Try to remove
    console.log(`Action: Removing fake enrollment ${fakeEnrollmentId}`);
    const removeResult = await enrollments.removeEnrollment({ enrollment: fakeEnrollmentId });
    console.log("Result:", removeResult);
    assert("error" in removeResult, "Remove should fail for non-existent enrollment");
    assertEquals(removeResult.error, "Enrollment does not exist.");
  });

  // Clean up the database connection
  await client.close();
});
```
