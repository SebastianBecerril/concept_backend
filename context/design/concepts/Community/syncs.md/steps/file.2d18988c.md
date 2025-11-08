---
timestamp: 'Fri Nov 07 2025 18:29:12 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_182912.fd16a4f2.md]]'
content_id: 2d18988c142213a8f36fa265f8c81faf281dd2e05a7ba807d2da329ef4de5b4a
---

# file: src/concepts/Requesting/passthrough.ts

```typescript
/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query. This file
 * allows you to explicitly configure this behavior.
 *
 * - INCLUSIONS: Routes that are safe for direct, public access.
 *   These are typically read-only queries. Each must have a justification.
 *
 * - EXCLUSIONS: Routes that MUST be handled by a synchronization.
 *   This includes ALL actions that modify data and any queries that
 *   require authentication or special authorization logic.
 */

/**
 * INCLUSIONS
 *
 * These routes are deemed public and safe for direct access. The server
 * will directly execute the corresponding concept query.
 */
export const inclusions: Record<string, string> = {
  // --- UserAuthentication ---
  "/api/UserAuthentication/login": "Public endpoint for users to log in and create a session.",
  "/api/UserAuthentication/register": "Public endpoint for new users to register an account.",

  // --- UserProfile ---
  "/api/UserProfile/_getProfileById": "Publicly view a user's profile by its ID.",
  "/api/UserProfile/_getProfileByUser": "Publicly view a user's profile by their user ID.",

  // --- Community ---
  "/api/Community/_getAllCommunities": "Publicly list all available communities.",
  "/api/Community/_getCommunityById": "Publicly view a single community's details.",
  "/api/Community/_getMembershipById": "Publicly view the details of a single membership.",
  "/api/Community/_getMembershipsByCommunity": "Publicly list the members of a specific community.",
  "/api/Community/_getMembershipsByRole": "Publicly filter members of a community by their role.",

  // --- CommunityBoard ---
  "/api/CommunityBoard/_getPostById": "Publicly view a single post.",
  "/api/CommunityBoard/_getPostsByCommunity": "Publicly list all posts within a community.",
  "/api/CommunityBoard/_getRepliesForPost": "Publicly view all replies to a post.",

  // --- CourseCatalog ---
  "/api/CourseCatalog/_getTermById": "Publicly view a specific academic term.",
  "/api/CourseCatalog/_getTerms": "Publicly list all academic terms.",
  "/api/CourseCatalog/_getCourseById": "Publicly view a specific course.",
  "/api/CourseCatalog/_getCoursesForTerm": "Publicly list all courses for a given term.",
  "/api/CourseCatalog/_getSectionById": "Publicly view a specific course section.",
  "/api/CourseCatalog/_getSectionsForCourse": "Publicly list all sections for a given course.",
};

/**
 * EXCLUSIONS
 *
 * These routes are protected and will trigger a `Requesting.request` action
 * instead of passing through. They MUST be handled by a synchronization.
 */
export const exclusions: Array<string> = [
  // ALL actions are excluded because they modify state and require authentication.
  // --- Community Actions ---
  "/api/Community/addMember",
  "/api/Community/createCommunity",
  "/api/Community/deleteCommunity",
  "/api/Community/removeMember",
  "/api/Community/setMemberRole",
  "/api/Community/updateCommunityDetails",

  // --- CommunityBoard Actions ---
  "/api/CommunityBoard/createPost",
  "/api/CommunityBoard/deletePost",
  "/api/CommunityBoard/deleteReply",
  "/api/CommunityBoard/replyToPost",
  "/api/CommunityBoard/updatePost",
  "/api/CommunityBoard/updateReply",

  // --- CourseCatalog Actions ---
  "/api/CourseCatalog/createOrGetCourse",
  "/api/CourseCatalog/createOrGetSection",
  "/api/CourseCatalog/createOrGetTerm",
  "/api/CourseCatalog/deleteCourse",
  "/api/CourseCatalog/deleteSection",
  "/api/CourseCatalog/deleteTerm",
  "/api/CourseCatalog/updateCourseDetails",
  "/api/CourseCatalog/updateSectionDetails",
  "/api/CourseCatalog/updateTermName",

  // --- UserAuthentication Actions & Sensitive Queries ---
  "/api/UserAuthentication/logout",
  "/api/UserAuthentication/invalidateExpiredSessions", // System action
  "/api/UserAuthentication/_getUserByUsername", // Sensitive query, might reveal user existence
  "/api/UserAuthentication/_isValidSession", // Internal-only security check

  // --- UserEnrollments (All routes are excluded due to privacy) ---
  // A user's enrollment is private information. Access must be controlled by syncs.
  "/api/UserEnrollments/addEnrollment",
  "/api/UserEnrollments/removeEnrollment",
  "/api/UserEnrollments/setEnrollmentVisibility",
  "/api/UserEnrollments/updateCourseSection",
  "/api/UserEnrollments/_getAllEnrollments",
  "/api/UserEnrollments/_getEnrollmentById",
  "/api/UserEnrollments/_getEnrollmentsByCourse",
  "/api/UserEnrollments/_getEnrollmentsByOwner",
  "/api/UserEnrollments/_getEnrollmentsBySection",
  "/api/UserEnrollments/_getVisibleEnrollments",

  // --- UserProfile Actions ---
  "/api/UserProfile/createProfile",
  "/api/UserProfile/deleteProfile",
  "/api/UserProfile/updateBio",
  "/api/UserProfile/updateDisplayName",
  "/api/UserProfile/updateThumbnailImage",

  // --- Sensitive/Protected Community Queries ---
  "/api/Community/_getAllMemberships", // Broad query, potentially un-performant and not needed for public API.
  "/api/Community/_getMembershipsByUser", // Requires a dedicated sync to handle logic like "get my memberships".
];
```

### Rationale and Final Check

1. **Security First:** All actions that modify data (`create`, `update`, `delete`, `addMember`, etc.) are correctly placed in `exclusions`. Your `community.sync.ts` file will handle their security.
2. **Public Queries Enabled:** All simple, public, read-only queries (like getting a list of communities or posts) are now correctly in `inclusions`. These endpoints will work immediately without any syncs.
3. **Privacy Respected:** All routes for `UserEnrollments` are excluded, as this is sensitive data. Any API endpoint to view enrollments (e.g., `/api/my-enrollments`) must be custom-built with a sync to ensure a user can only see their own data. The same logic was applied to `Community/_getMembershipsByUser`.
4. **Clarity and Intent:** The file is now much clearer. It serves as documentation for your API's public surface area. Anyone reading it can understand which routes are public and which are protected.

With your `community.sync.ts` file and this corrected `passthrough.ts` file, your architecture is now sound and follows the intended design patterns. **You are ready to move on.**
