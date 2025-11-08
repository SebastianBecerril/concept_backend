---
timestamp: 'Fri Nov 07 2025 17:55:07 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_175507.3f6832c1.md]]'
content_id: 47a6f19096ce28eee35dfd2fee2af4ad1f84943bb99a7de1bde29e4eb202b8c2
---

# file: src/syncs/community.sync.ts

```typescript
/**
 * @file src/syncs/community.sync.ts
 * @description This file contains all the synchronizations for the Community concept.
 * It handles API request/response cycles for all community actions and ensures
 * data integrity by cascading deletions to related concepts like CommunityBoard.
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
    [Community.updateCommunityDetails, {}, {}], // Success is an empty object
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
 * from the CommunityBoard to prevent orphaned data. This is a critical rule for
 * maintaining a consistent application state.
 */
export const CascadeCommunityDeletionToPosts: Sync = ({ community, requester, post }) => ({
  when: actions(
    [Community.deleteCommunity, { community, requester }, {}]
  ),
  // Note: This assumes a `_getPostsByCommunity` query exists on the CommunityBoard concept.
  where: (frames) => frames.query(CommunityBoard._getPostsByCommunity, { community }, { post }),
  then: actions(
    // The original `requester` (a community admin) has the authority to delete posts
    // in that community, as per the CommunityBoard concept's rules.
    [CommunityBoard.deletePost, { post, requester }]
  ),
});
```
