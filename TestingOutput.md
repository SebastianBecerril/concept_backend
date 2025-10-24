```
Check file:///C:/Users/sebas/OneDrive/Desktop/6.1040/concept_backend/src/concepts/Community/CommunityConcept.test.ts
Check file:///C:/Users/sebas/OneDrive/Desktop/6.1040/concept_backend/src/concepts/CommunityBoard/CommunityBoardConcept.test.ts
Check file:///C:/Users/sebas/OneDrive/Desktop/6.1040/concept_backend/src/concepts/CourseCatalog/CourseCatalogConcept.test.ts
Check file:///C:/Users/sebas/OneDrive/Desktop/6.1040/concept_backend/src/concepts/UserAuthentication/UserAuthenticationConcept.test.ts        
Check file:///C:/Users/sebas/OneDrive/Desktop/6.1040/concept_backend/src/concepts/UserEnrollments/UserEnrollmentsConcept.test.ts
Check file:///C:/Users/sebas/OneDrive/Desktop/6.1040/concept_backend/src/concepts/UserProfile/UserProfileConcept.test.ts
running 1 test from ./src/concepts/Community/CommunityConcept.test.ts
CommunityConcept ...
  Operational Principle: Create, invite, and manage roles ...
------- output -------
--- Testing Operational Principle ---
Action: createCommunity (Alice)
Result: { community: "019a1433-d0c3-7f8a-9f35-fe00b1e23669" }

Action: addMember (Alice invites Bob)
Result: {}

Action: setMemberRole (Alice promotes Bob to ADMIN)
Result: {}
--- Operational Principle Test Passed ---
----- output end -----
  Operational Principle: Create, invite, and manage roles ... ok (851ms)
  Interesting Scenario 1: Authorization Failures ...
------- output -------

--- Testing Authorization Failures ---
Action: updateCommunityDetails (Charlie, non-member)
Result: { error: "Requester is not an ADMIN member of this community." }

Action: addMember (Bob, non-admin, invites Charlie)
Result: { error: "Inviter is not an ADMIN member of this community." }

Action: deleteCommunity (Bob, non-admin)
Result: { error: "Requester is not an ADMIN member of this community." }
--- Authorization Failures Test Passed ---
----- output end -----
  Interesting Scenario 1: Authorization Failures ... ok (364ms)
  Interesting Scenario 2: Self-Removal and Last Admin Rule ...
------- output -------

--- Testing Self-Removal and Last Admin Rule ---
Action: removeMember (Bob removes himself)
Result: {}

Action: setMemberRole (Alice demotes herself as last admin)
Result: {
  error: "Cannot demote yourself from ADMIN to MEMBER when you are the only ADMIN."
}

Action: setMemberRole (Alice demotes herself with another admin present)
Result: {}
--- Self-Removal and Last Admin Rule Test Passed ---
----- output end -----
  Interesting Scenario 2: Self-Removal and Last Admin Rule ... ok (849ms)
  Interesting Scenario 3: Duplicate and Invalid Data ...
------- output -------

--- Testing Duplicate and Invalid Data ---
Action: createCommunity (Duplicate name)
Result: { error: "A community with this name already exists." }

Action: addMember (Bob, already a member)
Result: { error: "User is already a member of this community." }

Action: updateCommunityDetails (Name conflict)
Result: { error: "A community with this name already exists." }
--- Duplicate and Invalid Data Test Passed ---
----- output end -----
  Interesting Scenario 3: Duplicate and Invalid Data ... ok (313ms)
  Interesting Scenario 4: Deletion Cascade ...
------- output -------

--- Testing Deletion Cascade ---
Action: deleteCommunity (Bob deletes 'Deno Fans')
Result: {}
--- Deletion Cascade Test Passed ---
----- output end -----
  Interesting Scenario 4: Deletion Cascade ... ok (380ms)
CommunityConcept ... ok (3s)
running 0 tests from ./src/concepts/CommunityBoard/CommunityBoardConcept.test.ts
running 1 test from ./src/concepts/CourseCatalog/CourseCatalogConcept.test.ts
CourseCatalog Concept ...
  Operational Principle: Create a shared catalog ...
------- post-test output -------
--- Testing Operational Principle ---
Action: createOrGetTerm({ name: 'Fall 2024' })
Result: { term: "019a1433-e05a-7c46-92c4-52df1e1130dd" }
Action: createOrGetCourse({ term: termId, courseNumber: '6.1040', ... })
Result: { course: "019a1433-e0c4-74f7-b0f3-2a3828807371" }
Action: createOrGetSection({ course: courseId, classType: 'Lecture', ... })
Result: { section: "019a1433-e135-759e-8782-bdbda355becc" }
--- Verifying reuse of existing entries ---
Action: createOrGetTerm({ name: 'Fall 2024' }) again
Result: { term: "019a1433-e05a-7c46-92c4-52df1e1130dd" }
Action: createOrGetCourse({ ... }) again
Result: { course: "019a1433-e0c4-74f7-b0f3-2a3828807371" }
Action: createOrGetSection({ ... }) again
Result: { section: "019a1433-e135-759e-8782-bdbda355becc" }
----- post-test output end -----
  Operational Principle: Create a shared catalog ... ok (617ms)
  Scenario 1: Dependency checks on deletion ...
------- post-test output -------

--- Testing Deletion Dependencies ---
Action: deleteTerm with a course inside
Result: { error: "Cannot delete term because it has associated courses." }
Action: deleteCourse with a section inside
Result: { error: "Cannot delete course because it has associated sections." }
Action: deleteSection (should succeed)
Action: deleteCourse (should succeed now)
Action: deleteTerm (should succeed now)
----- post-test output end -----
  Scenario 1: Dependency checks on deletion ... ok (723ms)
  Scenario 2: Update actions and conflict handling ...
------- post-test output -------

--- Testing Updates and Conflicts ---
Action: updateTermName to a conflicting name
Result: { error: "A term with this name already exists." }
Action: updateCourseDetails to a conflicting course number
Result: { error: "A course with this number already exists in this term." }
Action: updateTermName to a unique name
----- post-test output end -----
  Scenario 2: Update actions and conflict handling ... ok (844ms)
  Scenario 3: Handling non-existent entities ...
------- post-test output -------

--- Testing Actions on Non-existent Entities ---
Action: updateTermName on a fake term
Action: createOrGetCourse in a fake term
Action: deleteCourse on a fake course
Action: createOrGetSection for a fake course
----- post-test output end -----
  Scenario 3: Handling non-existent entities ... ok (124ms)
  Scenario 4: Section uniqueness and updates ...
------- post-test output -------

--- Testing Section Uniqueness ---
Action: updateSectionDetails to create a duplicate
Result: {
  error: "Another section with these exact details already exists in this course."
}
----- post-test output end -----
  Scenario 4: Section uniqueness and updates ... ok (269ms)
CourseCatalog Concept ... ok (3s)
running 1 test from ./src/concepts/UserAuthentication/UserAuthenticationConcept.test.ts
UserAuthenticationConcept ...
  Principle: register, login, and have a valid session ... ok (447ms)
  Action: register ...
    requires username to be unique ... ok (109ms)
    requires password to meet strength requirements ... ok (32ms)
  Action: register ... ok (142ms)
  Action: login ...
    requires a matching username ... ok (32ms)
    requires a matching password ... ok (36ms)
  Action: login ... ok (139ms)
  Action: logout ...
    effects: removes the active session ... ok (72ms)
    requires a valid sessionId ... ok (45ms)
  Action: logout ... ok (266ms)
  System Action: invalidateExpiredSessions ... ok (248ms)
UserAuthenticationConcept ... ok (2s)
running 1 test from ./src/concepts/UserEnrollments/UserEnrollmentsConcept.test.ts
UserEnrollmentsConcept ...
  Operational Principle: Manages enrollments and respects visibility settings ...
------- post-test output -------

--- Testing Operational Principle ---
Action: Alice adds enrollment to CS101 (visible)
Result: { enrollment: "019a1433-f9ca-7ecf-b76a-5ee519bc0e51" }
Action: Bob adds enrollment to CS101 (private)
Result: { enrollment: "019a1433-fb11-705b-916d-fe12578bfda0" }
Query: Getting all enrollments for course CS101
Found 2 enrollments.
Found 1 visible enrollments.
----- post-test output end -----
  Operational Principle: Manages enrollments and respects visibility settings ... ok (445ms)
  Interesting Scenario: Handles duplicate enrollment attempts ...
------- post-test output -------

--- Testing Duplicate Enrollments ---
Action: Bob attempts to re-enroll in CS101
Result: { error: "User is already enrolled in this course." }
----- post-test output end -----
  Interesting Scenario: Handles duplicate enrollment attempts ... ok (33ms)
  Interesting Scenario: Allows updating section and visibility ...
------- post-test output -------

--- Testing Updates to Enrollment ---
Action: Bob adds enrollment to PHYS201
Action: Updating section for enrollment 019a1433-fba9-7770-8cef-a7df12f5e072
Result: {}
Action: Updating visibility for enrollment 019a1433-fba9-7770-8cef-a7df12f5e072
Result: {}
----- post-test output end -----
  Interesting Scenario: Allows updating section and visibility ... ok (228ms)
  Interesting Scenario: Allows removing an enrollment ...
------- post-test output -------

--- Testing Enrollment Removal ---
Action: Removing enrollment 019a1433-f9ca-7ecf-b76a-5ee519bc0e51
Result: {}
Query: Verifying enrollment 019a1433-f9ca-7ecf-b76a-5ee519bc0e51 is deleted
----- post-test output end -----
  Interesting Scenario: Allows removing an enrollment ... ok (135ms)
  Interesting Scenario: Rejects operations on non-existent enrollments ...
------- post-test output -------

--- Testing Operations on Non-Existent Enrollments ---
Action: Updating section for fake enrollment enrollment:fake
Result: { error: "Enrollment does not exist." }
Action: Updating visibility for fake enrollment enrollment:fake
Result: { error: "Enrollment does not exist." }
Action: Removing fake enrollment enrollment:fake
Result: { error: "Enrollment does not exist." }
----- post-test output end -----
  Interesting Scenario: Rejects operations on non-existent enrollments ... ok (98ms)
UserEnrollmentsConcept ... ok (1s)
running 1 test from ./src/concepts/UserProfile/UserProfileConcept.test.ts
UserProfileConcept ...
  Principle: create, update, and view a profile ... ok (401ms)
  Handles invalid inputs and unmet requirements ... ok (206ms)
  Queries retrieve correct data ... ok (241ms)
UserProfileConcept ... ok (2s)

ok | 5 passed (29 steps) | 0 failed (15s)
```