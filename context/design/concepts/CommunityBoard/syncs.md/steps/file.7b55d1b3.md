---
timestamp: 'Fri Nov 07 2025 19:03:10 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_190310.484f2f07.md]]'
content_id: 7b55d1b33be46f64460604f94ef5bf46d591339ccfdf00a5444a44d736ae4bbf
---

# file: src/syncs/communityBoard.sync.ts

```typescript
import { Community, CommunityBoard, Requesting, UserAuthentication } from "@concepts";
import { actions, Sync } from "@engine";
import { ID } from "@utils/types.ts";

// Define local types for casting, since we can't import from concept implementation files.
type User = ID;
type Community = ID;
type Posting = ID;
type Reply = ID;

// =================================================================================================
// Create Post
// =================================================================================================

export const CreatePostRequest: Sync = (
  { request, session, user, community, title, body, tags, course, membership },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/createPost", session, community, title, body, tags, course },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    // Get all memberships for the community, which creates a frame for each member.
    frames = await frames.query(Community._getMembershipsByCommunity, { community }, { membership });
    // Filter down to the single frame (if any) where the member's user ID matches the authenticated user.
    // If there is no match, the sync stops here.
    return frames.filter(($) => ($[membership] as { user: User }).user === $[user]);
  },
  then: actions([
    CommunityBoard.createPost,
    { author: user, community, title, body, tags, course },
  ]),
});

export const CreatePostResponse: Sync = ({ request, posting, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/createPost" }, { request }],
    [CommunityBoard.createPost, {}, { posting, error }],
  ),
  then: actions([Requesting.respond, { request, posting, error }]),
});

// =================================================================================================
// Update Post
// =================================================================================================

export const UpdatePostRequest: Sync = (
  { request, session, user, posting, newTitle, newBody, newTags, newCourse },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/updatePost", session, posting, newTitle, newBody, newTags, newCourse },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
  },
  then: actions([
    CommunityBoard.updatePost,
    { posting, newTitle, newBody, newTags, newCourse, requester: user },
  ]),
});

export const UpdatePostResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/updatePost" }, { request }],
    [CommunityBoard.updatePost, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// Reply to Post
// =================================================================================================

export const ReplyToPostRequest: Sync = ({ request, session, user, posting, body, post, membership }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/replyToPost", session, posting, body },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    frames = await frames.query(CommunityBoard._getPostById, { posting }, { post });
    const communityId = (frames[0]?.[post] as { community: Community })?.community;
    if (!communityId) return []; // Post not found, stop.
    frames = await frames.query(Community._getMembershipsByCommunity, { community: communityId }, { membership });
    return frames.filter(($) => ($[membership] as { user: User }).user === $[user]);
  },
  then: actions([CommunityBoard.replyToPost, { posting, author: user, body }]),
});

export const ReplyToPostResponse: Sync = ({ request, reply, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/replyToPost" }, { request }],
    [CommunityBoard.replyToPost, {}, { reply, error }],
  ),
  then: actions([Requesting.respond, { request, reply, error }]),
});

// =================================================================================================
// Update Reply
// =================================================================================================

export const UpdateReplyRequest: Sync = ({ request, session, user, reply, newBody }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/updateReply", session, reply, newBody },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
  },
  then: actions([CommunityBoard.updateReply, { reply, newBody, requester: user }]),
});

export const UpdateReplyResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/updateReply" }, { request }],
    [CommunityBoard.updateReply, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// Delete Post
// =================================================================================================

export const DeleteOwnPostRequest: Sync = ({ request, session, user, posting, post }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/deletePost", session, posting },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    frames = await frames.query(CommunityBoard._getPostById, { posting }, { post });
    // Using a structural type assertion to check the author property on the post object.
    return frames.filter(($) => $[user] === ($[post] as { author: User }).author);
  },
  then: actions([CommunityBoard.deletePost, { posting, requester: user }]),
});

export const DeletePostResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/deletePost" }, { request }],
    [CommunityBoard.deletePost, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// Delete Reply
// =================================================================================================

export const DeleteOwnReplyRequest: Sync = ({ request, session, user, reply, replyDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/deleteReply", session, reply },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    // Use the newly added _getReplyById query
    frames = await frames.query(CommunityBoard._getReplyById, { reply }, { replyDoc });
    // Using a structural type assertion to check the author on the reply object.
    return frames.filter(($) => $[user] === ($[replyDoc] as { author: User }).author);
  },
  then: actions([CommunityBoard.deleteReply, { reply, requester: user }]),
});

export const DeleteReplyResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/deleteReply" }, { request }],
    [CommunityBoard.deleteReply, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
