---
timestamp: 'Fri Nov 07 2025 20:33:52 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_203352.59451820.md]]'
content_id: 4a2c0be9e8de2a78a3eb1fe8b2c534e62e9320aa0e8f58b344ff88565a57e2e5
---

# file: src\syncs\community.sync.ts

```typescript
/**
 * @file src/syncs/community.sync.ts
 * @description This file contains all the synchronizations for the Community concept.
 * It handles API request/response cycles for all community actions using session-based
 * authentication and ensures data integrity by cascading deletions to related concepts.
 */

import { Community, CommunityBoard, Requesting, UserAuthentication } from "@concepts";
import { actions, Sync } from "@engine";

// --- Create Community ---

export const CreateCommunityRequest: Sync = ({ request, name, description, session, creator }) => ({
  when: actions([
    Requesting.request,
    { path: "/Community/createCommunity", name, description, session },
    { request },
  ]),
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: creator }),
  then: actions([
    Community.createCommunity,
    { name, description, creator },
  ]),
});

export const CreateCommunityResponse: Sync = ({ request, community }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/createCommunity" }, { request }],
    [Community.createCommunity, {}, { community }],
  ),
  then: actions([Requesting.respond, { request, community }]),
});

export const CreateCommunityResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/createCommunity" }, { request }],
    [Community.createCommunity, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Update Community Details ---

export const UpdateCommunityDetailsRequest: Sync = ({ request, community, newName, newDescription, session, requester }) => ({
  when: actions([
    Requesting.request,
    { path: "/Community/updateCommunityDetails", community, newName, newDescription, session },
    { request },
  ]),
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: requester }),
  then: actions([
    Community.updateCommunityDetails,
    { community, newName, newDescription, requester },
  ]),
});

export const UpdateCommunityDetailsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/updateCommunityDetails" }, { request }],
    [Community.updateCommunityDetails, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "Community details updated successfully." }]),
});

export const UpdateCommunityDetailsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/updateCommunityDetails" }, { request }],
    [Community.updateCommunityDetails, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Add Member to Community ---

export const AddMemberRequest: Sync = ({ request, community, user, session, inviter }) => ({
  when: actions([
    Requesting.request,
    { path: "/Community/addMember", community, user, session },
    { request },
  ]),
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: inviter }),
  then: actions([
    Community.addMember,
    { community, user, inviter },
  ]),
});

export const AddMemberResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/addMember" }, { request }],
    [Community.addMember, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "Member added successfully." }]),
});

export const AddMemberResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/addMember" }, { request }],
    [Community.addMember, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Remove Member from Community ---

export const RemoveMemberRequest: Sync = ({ request, community, user, session, requester }) => ({
  when: actions([
    Requesting.request,
    { path: "/Community/removeMember", community, user, session },
    { request },
  ]),
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: requester }),
  then: actions([
    Community.removeMember,
    { community, user, requester },
  ]),
});

export const RemoveMemberResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/removeMember" }, { request }],
    [Community.removeMember, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "Member removed successfully." }]),
});

export const RemoveMemberResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/removeMember" }, { request }],
    [Community.removeMember, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Set Member Role ---

export const SetMemberRoleRequest: Sync = ({ request, membership, newRole, session, requester }) => ({
  when: actions([
    Requesting.request,
    { path: "/Community/setMemberRole", membership, newRole, session },
    { request },
  ]),
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: requester }),
  then: actions([
    Community.setMemberRole,
    { membership, newRole, requester },
  ]),
});

export const SetMemberRoleResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/setMemberRole" }, { request }],
    [Community.setMemberRole, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "Member role updated successfully." }]),
});

export const SetMemberRoleResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/setMemberRole" }, { request }],
    [Community.setMemberRole, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Delete Community ---

export const DeleteCommunityRequest: Sync = ({ request, community, session, requester }) => ({
  when: actions([
    Requesting.request,
    { path: "/Community/deleteCommunity", community, session },
    { request },
  ]),
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: requester }),
  then: actions([
    Community.deleteCommunity,
    { community, requester },
  ]),
});

export const DeleteCommunityResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/deleteCommunity" }, { request }],
    [Community.deleteCommunity, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "Community deleted successfully." }]),
});

export const DeleteCommunityResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Community/deleteCommunity" }, { request }],
    [Community.deleteCommunity, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Data Integrity Synchronizations ---

/**
 * When a community is deleted, this sync finds and deletes all associated posts
 * from the CommunityBoard to prevent orphaned data.
 */
export const CascadeCommunityDeletionToPosts: Sync = ({ community, requester, post }) => ({
  when: actions(
    [Community.deleteCommunity, { community, requester }, {}]
  ),
  // This is the idiomatic way to find all related posts.
  where: (frames) => frames.query(CommunityBoard._getPostsByCommunity, { community }, { post }),
  then: actions(
    // The original `requester` (an admin) has the authority to delete the posts.
    [CommunityBoard.deletePost, { post, requester }]
  ),
});
```
