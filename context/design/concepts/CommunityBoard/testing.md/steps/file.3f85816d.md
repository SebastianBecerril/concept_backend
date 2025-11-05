---
timestamp: 'Tue Nov 04 2025 19:34:37 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251104_193437.70d6da41.md]]'
content_id: 3f85816d9f72a41dd31077c7962c40a1bf02be3afe565a6c5f0528afa38620f8
---

# file: src/concepts/CommunityBoard/CommunityBoardConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import {
  assertEquals,
  assertExists,
  assert,
} from "jsr:@std/assert";
import CommunityBoardConcept from "./CommunityBoardConcept.ts";

// # trace:
// This trace demonstrates the operational principle:
// 1. `communityBoard.createPost(...)` by `userAlice`.
// 2. `communityBoard._getPostById(...)` to verify creation.
// 3. `communityBoard.replyToPost(...)` by `userBob`.
// 4. `communityBoard._getPostById(...)` and `communityBoard._getRepliesForPost(...)` to verify reply association.
// 5. `communityBoard.updatePost(...)` by `userAlice`.
// 6. `communityBoard._getPostById(...)` to verify post update.
// 7. `communityBoard.updateReply(...)` by `userBob`.
// 8. `communityBoard._getRepliesForPost(...)` to verify reply update.
// 9. `communityBoard.deleteReply(...)` by `userBob`.
// 10. `communityBoard._getRepliesForPost(...)` and `communityBoard._getPostById(...)` to verify reply deletion.
// 11. `communityBoard.deletePost(...)` by `userAlice`.
// 12. `communityBoard._getPostById(...)` to verify post deletion.

// --- Mock Data ---
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const communityCS = "community:CS" as ID;
const courseCS101 = "course:CS101" as ID;

Deno.test("Operational Principle: Users can create, reply to, update, and delete posts and replies", async () => {
  const [db, client] = await testDb();
  const communityBoard = new CommunityBoardConcept(db);

  // 1. Alice creates a post
  console.log("Action: Alice creates a post about homework");
  const createPostResult = await communityBoard.createPost({
    author: userAlice,
    community: communityCS,
    title: "Homework 1 Question",
    body: "Is question 3 about recursion?",
    tags: ["homework", "recursion"],
    course: courseCS101,
  });
  assert("posting" in createPostResult, "Post creation should succeed");
  const postId = createPostResult.posting;
  console.log("Success: Post created with ID:", postId);

  let post = (await communityBoard._getPostById({ posting: postId }))[0];
  assertExists(post);
  assertEquals(post.author, userAlice);
  assertEquals(post.title, "Homework 1 Question");

  // 2. Bob replies to the post
  console.log("Action: Bob replies to Alice's post");
  const replyResult = await communityBoard.replyToPost({
    posting: postId,
    author: userBob,
    body: "Yes, I think so! The TA mentioned it in office hours.",
  });
  assert("reply" in replyResult, "Replying to post should succeed");
  const replyId = replyResult.reply;
  console.log("Success: Reply created with ID:", replyId);

  post = (await communityBoard._getPostById({ posting: postId }))[0];
  assertExists(post);
  assertEquals(post.replies.length, 1);
  assertEquals(post.replies[0], replyId);

  const replies = await communityBoard._getRepliesForPost({ posting: postId });
  assertEquals(replies.length, 1);
  assertEquals(replies[0]._id, replyId);
  assertEquals(replies[0].author, userBob);

  // 3. Alice updates her post
  console.log("Action: Alice updates her post");
  const updatePostResult = await communityBoard.updatePost({
    posting: postId,
    requester: userAlice,
    newTitle: "Homework 1 Question [Clarified]",
    newBody: "Is question 3 about tail recursion specifically?",
    newTags: ["homework", "recursion", "clarification"],
  });
  assertEquals(updatePostResult, {}, "Post update should succeed");
  console.log("Success: Post updated");

  post = (await communityBoard._getPostById({ posting: postId }))[0];
  assertExists(post);
  assertEquals(post.title, "Homework 1 Question [Clarified]");
  assertEquals(post.body, "Is question 3 about tail recursion specifically?");

  // 4. Bob updates his reply
  console.log("Action: Bob updates his reply");
  const updateReplyResult = await communityBoard.updateReply({
    reply: replyId,
    requester: userBob,
    newBody: "Ah, good question. I'm not sure about *tail* recursion.",
  });
  assertEquals(updateReplyResult, {}, "Reply update should succeed");
  console.log("Success: Reply updated");

  const updatedReplies = await communityBoard._getRepliesForPost({ posting: postId });
  assertEquals(updatedReplies[0].body, "Ah, good question. I'm not sure about *tail* recursion.");

  // 5. Bob deletes his reply
  console.log("Action: Bob deletes his reply");
  const deleteReplyResult = await communityBoard.deleteReply({
    reply: replyId,
    requester: userBob,
  });
  assertEquals(deleteReplyResult, {}, "Reply deletion should succeed");
  console.log("Success: Reply deleted");

  const repliesAfterDelete = await communityBoard._getRepliesForPost({ posting: postId });
  assertEquals(repliesAfterDelete.length, 0);
  post = (await communityBoard._getPostById({ posting: postId }))[0];
  assertExists(post);
  assertEquals(post.replies.length, 0);

  // 6. Alice deletes her post
  console.log("Action: Alice deletes her post");
  const deletePostResult = await communityBoard.deletePost({
    posting: postId,
    requester: userAlice,
  });
  assertEquals(deletePostResult, {}, "Post deletion should succeed");
  console.log("Success: Post deleted");

  const postAfterDelete = await communityBoard._getPostById({ posting: postId });
  assertEquals(postAfterDelete.length, 0);

  await client.close();
});

Deno.test("Scenario: Authorization failures", async () => {
  const [db, client] = await testDb();
  const communityBoard = new CommunityBoardConcept(db);

  // Setup: Alice creates a post, Bob replies
  const { posting: postId } = await communityBoard.createPost({
    author: userAlice,
    community: communityCS,
    title: "Original Title",
    body: "Original Body",
    tags: ["original"],
  }) as { posting: ID };
  const { reply: replyId } = await communityBoard.replyToPost({
    posting: postId,
    author: userBob,
    body: "Original Reply",
  }) as { reply: ID };

  // 1. Bob tries to update Alice's post (should fail)
  console.log("Action: Bob tries to update Alice's post");
  const updatePostFail = await communityBoard.updatePost({
    posting: postId,
    requester: userBob, // Bob is not the author
    newTitle: "New Title",
    newBody: "New Body",
    newTags: ["new"],
  });
  assert("error" in updatePostFail, "Update should fail for non-author");
  assertEquals(updatePostFail.error, "User is not authorized to update this post");
  console.log("Success: Bob failed to update Alice's post as expected");

  // 2. Alice tries to update Bob's reply (should fail)
  console.log("Action: Alice tries to update Bob's reply");
  const updateReplyFail = await communityBoard.updateReply({
    reply: replyId,
    requester: userAlice, // Alice is not the author
    newBody: "New Reply Body",
  });
  assert("error" in updateReplyFail, "Update should fail for non-author");
  assertEquals(updateReplyFail.error, "User is not authorized to update this reply");
  console.log("Success: Alice failed to update Bob's reply as expected");

  // 3. Bob tries to delete Alice's post (should fail)
  console.log("Action: Bob tries to delete Alice's post");
  const deletePostFail = await communityBoard.deletePost({
    posting: postId,
    requester: userBob, // Bob is not the author
  });
  assert("error" in deletePostFail, "Deletion should fail for non-author");
  assertEquals(deletePostFail.error, "User is not authorized to delete this post");
  console.log("Success: Bob failed to delete Alice's post as expected");

  // 4. Alice tries to delete Bob's reply (should fail)
  console.log("Action: Alice tries to delete Bob's reply");
  const deleteReplyFail = await communityBoard.deleteReply({
    reply: replyId,
    requester: userAlice, // Alice is not the author
  });
  assert("error" in deleteReplyFail, "Deletion should fail for non-author");
  assertEquals(deleteReplyFail.error, "User is not authorized to delete this reply");
  console.log("Success: Alice failed to delete Bob's reply as expected");

  await client.close();
});

Deno.test("Scenario: Input validation failures", async () => {
  const [db, client] = await testDb();
  const communityBoard = new CommunityBoardConcept(db);

  // 1. Create post with empty body
  console.log("Action: Try to create a post with an empty body");
  const emptyBodyPost = await communityBoard.createPost({
    author: userAlice,
    community: communityCS,
    title: "Test",
    body: "",
    tags: ["test"],
  });
  assert("error" in emptyBodyPost, "Should fail with empty body");
  assertEquals(emptyBodyPost.error, "Post body cannot be empty");
  console.log("Success: Failed as expected");

  // 2. Create post with no tags
  console.log("Action: Try to create a post with no tags");
  const noTagsPost = await communityBoard.createPost({
    author: userAlice,
    community: communityCS,
    title: "Test",
    body: "A body",
    tags: [],
  });
  assert("error" in noTagsPost, "Should fail with no tags");
  assertEquals(noTagsPost.error, "Post must have at least one tag");
  console.log("Success: Failed as expected");

  // Setup a valid post for other tests
  const { posting: postId } = await communityBoard.createPost({
    author: userAlice,
    community: communityCS,
    title: "Valid Post",
    body: "Valid Body",
    tags: ["valid"],
  }) as { posting: ID };

  // 3. Reply with empty body
  console.log("Action: Try to reply with an empty body");
  const emptyBodyReply = await communityBoard.replyToPost({
    posting: postId,
    author: userBob,
    body: "  ", // whitespace only
  });
  assert("error" in emptyBodyReply, "Should fail with empty reply body");
  assertEquals(emptyBodyReply.error, "Reply body cannot be empty");
  console.log("Success: Failed as expected");

  await client.close();
});

Deno.test("Scenario: Deleting a post cascades to delete its replies", async () => {
  const [db, client] = await testDb();
  const communityBoard = new CommunityBoardConcept(db);

  // 1. Alice creates a post
  console.log("Action: Alice creates a post");
  const { posting: postId } = await communityBoard.createPost({
    author: userAlice,
    community: communityCS,
    title: "Post to be deleted",
    body: "This post will have replies",
    tags: ["delete-test"],
  }) as { posting: ID };
  console.log("Success: Post created:", postId);

  // 2. Bob and Alice reply to the post
  console.log("Action: Bob and Alice reply to the post");
  const { reply: replyId1 } = await communityBoard.replyToPost({
    posting: postId,
    author: userBob,
    body: "First reply",
  }) as { reply: ID };
  const { reply: replyId2 } = await communityBoard.replyToPost({
    posting: postId,
    author: userAlice,
    body: "Second reply",
  }) as { reply: ID };
  console.log("Success: Replies created:", replyId1, replyId2);

  let replies = await communityBoard._getRepliesForPost({ posting: postId });
  assertEquals(replies.length, 2, "Should have 2 replies before deletion");

  // 3. Alice deletes the post
  console.log("Action: Alice deletes the post");
  await communityBoard.deletePost({
    posting: postId,
    requester: userAlice,
  });
  console.log("Success: Post deleted");

  // 4. Verify post and replies are gone
  const postAfterDelete = await communityBoard._getPostById({ posting: postId });
  assertEquals(postAfterDelete.length, 0, "Post should be deleted");
  console.log("Verified: Post is gone");

  replies = await communityBoard._getRepliesForPost({ posting: postId });
  assertEquals(replies.length, 0, "Replies should be cascade-deleted");
  console.log("Verified: Replies are gone");

  await client.close();
});

Deno.test("Scenario: Actions on non-existent items fail gracefully", async () => {
  const [db, client] = await testDb();
  const communityBoard = new CommunityBoardConcept(db);

  const nonExistentPostId = "post:fake" as ID;
  const nonExistentReplyId = "reply:fake" as ID;

  // 1. Reply to non-existent post
  console.log("Action: Reply to non-existent post");
  const replyFail = await communityBoard.replyToPost({
    posting: nonExistentPostId,
    author: userAlice,
    body: "A reply",
  });
  assert("error" in replyFail, "Should fail to reply to non-existent post");
  assertEquals(replyFail.error, "Cannot reply to a non-existent post");
  console.log("Success: Failed as expected");

  // 2. Update non-existent post
  console.log("Action: Update non-existent post");
  const updateFail = await communityBoard.updatePost({
    posting: nonExistentPostId,
    requester: userAlice,
    newTitle: "t",
    newBody: "b",
    newTags: ["a"],
  });
  assert("error" in updateFail, "Should fail to update non-existent post");
  assertEquals(updateFail.error, "Post not found");
  console.log("Success: Failed as expected");

  // 3. Delete non-existent post
  console.log("Action: Delete non-existent post");
  const deleteFail = await communityBoard.deletePost({
    posting: nonExistentPostId,
    requester: userAlice,
  });
  assert("error" in deleteFail, "Should fail to delete non-existent post");
  assertEquals(deleteFail.error, "Post not found");
  console.log("Success: Failed as expected");

  // 4. Update non-existent reply
  console.log("Action: Update non-existent reply");
  const updateReplyFail = await communityBoard.updateReply({
    reply: nonExistentReplyId,
    requester: userAlice,
    newBody: "new body",
  });
  assert("error" in updateReplyFail, "Should fail to update non-existent reply");
  assertEquals(updateReplyFail.error, "Reply not found");
  console.log("Success: Failed as expected");

  // 5. Delete non-existent reply
  console.log("Action: Delete non-existent reply");
  const deleteReplyFail = await communityBoard.deleteReply({
    reply: nonExistentReplyId,
    requester: userAlice,
  });
  assert("error" in deleteReplyFail, "Should fail to delete non-existent reply");
  assertEquals(deleteReplyFail.error, "Reply not found");
  console.log("Success: Failed as expected");

  await client.close();
});
```
