---
timestamp: 'Tue Nov 04 2025 19:36:06 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251104_193606.99eb9c10.md]]'
content_id: 5eed426169935bda9e13702cba46f22d7bd8b98d2e46cd5e172487cd1a100b80
---

# trace:

The following trace demonstrates the operational principle of the `CommunityBoard` concept.

1. **Alice creates a post.**
   * **Action**: `createPost({ author: "user:Alice", community: "community:CS", title: "Introduction to Concepts", body: "This is a post about concept design.", tags: ["design", "concepts"], course: "course:CS101" })`
   * **State Change**: A new `Posting` document is created. Its `_id` is returned.
   * **Result**: `{ posting: "..." }`
2. **Bob replies to Alice's post.**
   * **Action**: `replyToPost({ posting: "...", author: "user:Bob", body: "Great post, very informative!" })`
   * **State Change**: A new `Reply` document is created. The ID of this new reply is added to the `replies` array of the original `Posting` document.
   * **Result**: `{ reply: "..." }`
3. **Alice updates her post.**
   * **Action**: `updatePost({ posting: "...", requester: "user:Alice", newTitle: "Intro to Concept Design", newBody: "An updated post about concept design.", newTags: ["design", "concepts", "software-engineering"] })`
   * **State Change**: The `title`, `body`, and `tags` fields of the specified `Posting` document are updated.
   * **Result**: `{}`
4. **Bob updates his reply.**
   * **Action**: `updateReply({ reply: "...", requester: "user:Bob", newBody: "This is an even better post now!" })`
   * **State Change**: The `body` of the specified `Reply` document is updated.
   * **Result**: `{}`
5. **Alice deletes her post.**
   * **Action**: `deletePost({ posting: "...", requester: "user:Alice" })`
   * **State Change**: The `Posting` document is deleted. All `Reply` documents whose IDs were in the post's `replies` array are also deleted.
   * **Result**: `{}`
