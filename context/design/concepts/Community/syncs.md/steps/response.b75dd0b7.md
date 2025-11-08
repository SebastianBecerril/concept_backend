---
timestamp: 'Fri Nov 07 2025 17:52:21 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_175221.7412788d.md]]'
content_id: b75dd0b74802ce22eb9ce7bfbb47ab2429a631c6b9637caf5c38a17380deb543
---

# response:

Of course. Based on the concepts you've provided, here are the essential synchronizations your `Community` concept would need to integrate properly with your application's request flow and maintain data integrity with other concepts like `CommunityBoard`.

These syncs handle two primary responsibilities:

1. **API Integration**: They connect incoming HTTP requests (via the `Requesting` concept) to the appropriate actions in your `Community` concept, including handling authentication and authorization.
2. **Data Integrity**: They ensure that when a significant event happens (like deleting a community), related data in other concepts (like posts in `CommunityBoard`) is handled correctly.

Here are the key synchronizations, complete with their specifications and TypeScript implementations.

***

### 1. Handling API Requests for Community Actions

These synchronizations expose the `Community` concept's functionality through an API, using the request/response pattern mediated by the `Requesting` concept. We'll use the user's session to identify the `requester` and ensure they have the correct permissions.

#### Create a Community

This pair of syncs allows a logged-in user to create a new community.

```sync
sync CreateCommunityRequest
when
    Requesting.request (path: "/Community/createCommunity", name, description, session): (request)
where
    in UserAuthentication: user of session is creator
then
    Community.createCommunity (name, description, creator)

sync CreateCommunityResponse
when
    Requesting.request (path: "/Community/createCommunity"): (request)
    Community.createCommunity (): (community?, error?)
then
    Requesting.respond (request, community?, error?)
```

#### Add a Member to a Community

This allows an admin of a community to add another user. The `Community.addMember` action itself contains the logic to verify that the `inviter` is an admin.

```sync
sync AddMemberRequest
when
    Requesting.request (path: "/Community/addMember", community, user, session): (request)
where
    in UserAuthentication: user of session is inviter
then
    Community.addMember (community, user, inviter)

sync AddMemberResponse
when
    Requesting.request (path: "/Community/addMember"): (request)
    Community.addMember (): (error?)
then
    Requesting.respond (request, status: "success" | error)
```

#### Delete a Community

This allows an admin to delete a community they manage.

```sync
sync DeleteCommunityRequest
when
    Requesting.request (path: "/Community/deleteCommunity", community, session): (request)
where
    in UserAuthentication: user of session is requester
then
    Community.deleteCommunity (community, requester)

sync DeleteCommunityResponse
when
    Requesting.request (path: "/Community/deleteCommunity"): (request)
    Community.deleteCommunity (): (error?)
then
    Requesting.respond (request, status: "success" | error)
```

### 2. Maintaining Data Integrity (Cascading Deletes)

This is a critical synchronization that ensures your application state remains consistent. When a community is deleted, all content associated with it should also be removed.

#### Cascade Deletion to CommunityBoard Posts

When a community is deleted, this sync finds all posts within that community (using the `CommunityBoard` concept) and deletes them.

```sync
sync CascadeCommunityDeletionToPosts
when
    Community.deleteCommunity (community, requester)
where
    in CommunityBoard: post has community
then
    CommunityBoard.deletePost (post, requester)
```

### Implementation File

You can place all of these synchronizations into a new file, for example: `src/syncs/community.sync.ts`.

```typescript
// file: src/syncs/community.sync.ts

import { Community, CommunityBoard, Requesting, UserAuthentication } from "@concepts";
import { actions, Sync } from "@engine";

// --- API Request Handling ---

// Create Community
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


// Add Member
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
        [Community.addMember, {}, {}], // Success is an empty object
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


// Delete Community
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


// --- Data Integrity ---

/**
 * When a community is deleted, this sync finds and deletes all associated posts
 * from the CommunityBoard.
 */
export const CascadeCommunityDeletionToPosts: Sync = ({ community, requester, post }) => ({
    when: actions(
        [Community.deleteCommunity, { community, requester }, {}]
    ),
    where: (frames) => frames.query(CommunityBoard._getPostsByCommunity, { community }, { post }),
    then: actions(
        // The original `requester` (a community admin) has authority to delete posts in that community.
        [CommunityBoard.deletePost, { post, requester }]
    ),
});
```

### Additional Considerations

* **User Deletion**: Your `UserAuthentication` concept doesn't currently have a `deleteUser` action. If you were to add one, you would need a crucial sync to handle the consequences: when a user is deleted, their memberships in all communities should be removed. This would look something like:
  ```sync
  sync OnUserDeletionRemoveMemberships
  when
      UserAuthentication.deleteUser (user)
  where
      in Community: membership belongs to user
  then
      Community.removeMember (membership.community, user, user) // Self-removal
  ```
* **Completeness**: The examples above cover the most destructive or creation-oriented actions. You would follow the same request/response pattern for other actions like `updateCommunityDetails`, `removeMember`, and `setMemberRole`.
* **Queries**: For read-only operations (like getting a list of communities or members), you can either create dedicated syncs for custom API paths or rely on the default [passthrough routes](http://passthrough.ts) if you deem the queries to be public and safe for direct exposure.
