---
timestamp: 'Fri Nov 07 2025 18:48:48 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_184848.0b4e7a7e.md]]'
content_id: e1440a6da14d846b4774fa8ba38938bd9a418124f6b73402f5ad8cb48d798568
---

# file: src/syncs/communityBoard.sync.ts

```typescript
import { Community, CommunityBoard, Requesting, UserAuthentication } from "@concepts";
import { actions, Sync } from "@engine";

// =================================================================================================
// Create Post
// =================================================================================================

/**
 * Handles a request to create a new post.
 * It authenticates the user and verifies they are a member of the community before creating the post.
 */
export const CreatePostRequest: Sync = (
  { request, session, user, community, title, body, tags, course },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/createPost", session, community, title, body, tags, course },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate user from session
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    // 2. Verify the authenticated user is a member of the target community.
    //    If they are not a member, the query returns no frames, and the sync stops.
    frames = await frames.query(Community._getMembershipByUserAndCommunity, { user, community }, {});
    return frames;
  },
  then: actions([
    // Note: The `author` parameter is filled with the authenticated `user` variable.
    CommunityBoard.createPost,
    { author: user, community, title, body, tags, course },
  ]),
});

/**
 * Responds to the original request after a post has been created (or failed to be created).
 */
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

/**
 * Handles a request to update an existing post.
 * The concept action itself verifies authorship, so this sync just needs to pass the authenticated user.
 */
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

/**
 * Responds to the original request after a post has been updated.
 */
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

/**
 * Handles a request to add a reply to a post.
 * It authenticates the user and verifies they are a member of the post's community.
 */
export const ReplyToPostRequest: Sync = ({ request, session, user, posting, body, community }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/replyToPost", session, posting, body },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate the user.
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    // 2. Find the community the post belongs to.
    frames = await frames.query(CommunityBoard._getPostById, { posting }, { community });
    // 3. Verify the user is a member of that community.
    frames = await frames.query(Community._getMembershipByUserAndCommunity, { user, community }, {});
    return frames;
  },
  then: actions([CommunityBoard.replyToPost, { posting, author: user, body }]),
});

/**
 * Responds to the original request after a reply has been created.
 */
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

/**
 * Handles a request to update a reply.
 * The concept action verifies authorship, so this sync just passes the authenticated user.
 */
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

/**
 * Responds to the original request after a reply has been updated.
 */
export const UpdateReplyResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/updateReply" }, { request }],
    [CommunityBoard.updateReply, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// Delete Post (Handles both Author and Admin deletion)
// =================================================================================================
// NOTE: The `deletePost` action has an authorization check for the author.
// A separate sync is needed for Admins, which would ideally call a different,
// admin-specific action or the current action would need its logic updated to support both cases.
// For now, we only implement the author-based deletion as the concept code only supports that.

/**
 * Handles a request from a user to delete their own post.
 */
export const DeleteOwnPostRequest: Sync = ({ request, session, user, posting, post }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/deletePost", session, posting },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    frames = await frames.query(CommunityBoard._getPostById, { posting }, { post });
    // Filter to ensure the authenticated user is the author of the post.
    return frames.filter(($) => $[user] === $[post].author);
  },
  then: actions([CommunityBoard.deletePost, { posting, requester: user }]),
});

/**
 * Responds after a post deletion is attempted.
 */
export const DeletePostResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/deletePost" }, { request }],
    [CommunityBoard.deletePost, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// Delete Reply (Handles both Author and Admin deletion)
// =================================================================================================
// NOTE: Similar to deletePost, the concept implementation only supports deletion by the author.

/**
 * Handles a request from a user to delete their own reply.
 */
export const DeleteOwnReplyRequest: Sync = ({ request, session, user, reply, replyDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/CommunityBoard/deleteReply", session, reply },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
    // We assume a `_getReplyById` query exists to fetch the reply's author for verification.
    frames = await frames.query(CommunityBoard._getReplyById, { reply }, { replyDoc });
    return frames.filter(($) => $[user] === $[replyDoc].author);
  },
  then: actions([CommunityBoard.deleteReply, { reply, requester: user }]),
});

/**
 * Responds after a reply deletion is attempted.
 */
export const DeleteReplyResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/CommunityBoard/deleteReply" }, { request }],
    [CommunityBoard.deleteReply, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
