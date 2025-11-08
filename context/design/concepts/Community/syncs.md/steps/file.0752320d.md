---
timestamp: 'Fri Nov 07 2025 18:21:20 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_182120.0be663e0.md]]'
content_id: 0752320dfd3e71d6cc19fadd16a93c0224db708e68499ec16876a6c934d24ad8
---

# file: src\concepts\Requesting\passthrough.ts

```typescript
/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  "/api/UserAuthentication/login": "public login endpoint to initiate sessions",
  "/api/UserAuthentication/register":
    "public registration endpoint for new users",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  "/api/Community/_getAllCommunities",
  "/api/Community/_getAllMemberships",
  "/api/Community/_getCommunityById",
  "/api/Community/_getMembershipById",
  "/api/Community/_getMembershipsByCommunity",
  "/api/Community/_getMembershipsByRole",
  "/api/Community/_getMembershipsByUser",
  "/api/Community/addMember",
  "/api/Community/createCommunity",
  "/api/Community/deleteCommunity",
  "/api/Community/removeMember",
  "/api/Community/setMemberRole",
  "/api/Community/updateCommunityDetails",
  "/api/CommunityBoard/_getPostById",
  "/api/CommunityBoard/_getPostsByCommunity",
  "/api/CommunityBoard/_getRepliesForPost",
  "/api/CommunityBoard/createPost",
  "/api/CommunityBoard/deletePost",
  "/api/CommunityBoard/deleteReply",
  "/api/CommunityBoard/replyToPost",
  "/api/CommunityBoard/updatePost",
  "/api/CommunityBoard/updateReply",
  "/api/CourseCatalog/_getCourseById",
  "/api/CourseCatalog/_getCoursesForTerm",
  "/api/CourseCatalog/_getSectionById",
  "/api/CourseCatalog/_getSectionsForCourse",
  "/api/CourseCatalog/_getTermById",
  "/api/CourseCatalog/_getTerms",
  "/api/CourseCatalog/createOrGetCourse",
  "/api/CourseCatalog/createOrGetSection",
  "/api/CourseCatalog/createOrGetTerm",
  "/api/CourseCatalog/deleteCourse",
  "/api/CourseCatalog/deleteSection",
  "/api/CourseCatalog/deleteTerm",
  "/api/CourseCatalog/updateCourseDetails",
  "/api/CourseCatalog/updateSectionDetails",
  "/api/CourseCatalog/updateTermName",
  "/api/UserAuthentication/_getUserByUsername",
  "/api/UserAuthentication/_isValidSession",
  "/api/UserAuthentication/invalidateExpiredSessions",
  "/api/UserAuthentication/logout",
  "/api/UserEnrollments/_getAllEnrollments",
  "/api/UserEnrollments/_getEnrollmentById",
  "/api/UserEnrollments/_getEnrollmentsByCourse",
  "/api/UserEnrollments/_getEnrollmentsByOwner",
  "/api/UserEnrollments/_getEnrollmentsBySection",
  "/api/UserEnrollments/_getVisibleEnrollments",
  "/api/UserEnrollments/addEnrollment",
  "/api/UserEnrollments/removeEnrollment",
  "/api/UserEnrollments/setEnrollmentVisibility",
  "/api/UserEnrollments/updateCourseSection",
  "/api/UserProfile/_getProfileById",
  "/api/UserProfile/_getProfileByUser",
  "/api/UserProfile/createProfile",
  "/api/UserProfile/deleteProfile",
  "/api/UserProfile/updateBio",
  "/api/UserProfile/updateDisplayName",
  "/api/UserProfile/updateThumbnailImage",
];

```
