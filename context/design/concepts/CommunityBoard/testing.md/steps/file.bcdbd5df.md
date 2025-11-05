---
timestamp: 'Tue Nov 04 2025 19:33:37 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251104_193337.04be2f34.md]]'
content_id: bcdbd5dfd02d135a245d48adf6a338475980b479b237f9f1adde84464ab0ba9f
---

# file: src/concepts/CommunityBoard/CommunityBoardConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { freshID } from "@utils/database.ts";
import { Empty, ID } from "@utils/types.ts";

// Collection prefix to namespace MongoDB collections
const PREFIX = "CommunityBoard" + ".";

// Generic types for the concept
type User = ID;
type Course = ID;
type Community = ID;
type Posting = ID;
type Reply = ID;

/**
 * a set of Postings with
 * an `author` User
 * a `community` Community
 * a `title` String
 * a `body` String
 * a `tags` set of Strings
 * an optional `course` Course
 * a `replies` set of Replies
 */
interface PostingDoc {
  _id: Posting;
  author: User;
  community: Community;
  title: string;
  body: string;
  tags: string[];
  course?: Course;
  replies: Reply[];
}

/**
 * a set of Replies with
 * an `author` User
 * a `posting` Posting
 * a `body` String
 */
interface ReplyDoc {
  _id: Reply;
  author: User;
  posting: Posting;
  body: string;
}

/**
 * @concept CommunityBoard
 * @purpose Provide a shared forum for community members to post and discuss academic or community-related topics.
 */
export default class CommunityBoardConcept {
  postings: Collection<PostingDoc>;
  replies: Collection<ReplyDoc>;

  constructor(private readonly db: Db) {
    this.postings = this.db.collection(PREFIX + "postings");
    this.replies = this.db.collection(PREFIX + "replies");
  }

  /**
   * createPost(author: User, community: Community, title: String, body: String, tags: set of Strings, optional course: Course): (posting: Posting)
   *
   * **requires** `author` exists, `community` exists, `author` is a member of `community`, `body` is non-empty, `tags` are non-empty, `course` (if provided) exists
   * **effect** creates a new `Posting` in `community` authored by `author` with the given details
   */
  async createPost(
    { author, community, title, body, tags, course }: {
      author: User;
      community: Community;
      title: string;
      body: string;
      tags: string[];
      course?: Course;
    },
  ): Promise<{ posting: Posting } | { error: string }> {
    if (!body || body.trim() === "") {
      return { error: "Post body cannot be empty" };
    }
    if (!tags || tags.length === 0) {
      return { error: "Post must have at least one tag" };
    }

    const newPosting: PostingDoc = {
      _id: freshID(),
      author,
      community,
      title,
      body,
      tags,
      course,
      replies: [],
    };

    const result = await this.postings.insertOne(newPosting);

    if (!result.acknowledged) {
      return { error: "Failed to create post" };
    }

    return { posting: newPosting._id };
  }

  /**
   * updatePost(posting: Posting, newTitle: String, newBody: String, newTags: set of Strings, optional newCourse: Course, requester: User): ()
   *
   * **requires** `posting` exists, `requester` is `posting.author`, `newBody` is non-empty, `newTags` are non-empty, `newCourse` (if provided) exists
   * **effect** updates the `title`, `body`, `tags`, and `course` of `posting`
   */
  async updatePost(
    { posting, newTitle, newBody, newTags, newCourse, requester }: {
      posting: Posting;
      newTitle: string;
      newBody: string;
      newTags: string[];
      newCourse?: Course;
      requester: User;
    },
  ): Promise<Empty | { error: string }> {
    if (!newBody || newBody.trim() === "") {
      return { error: "Post body cannot be empty" };
    }
    if (!newTags || newTags.length === 0) {
      return { error: "Post must have at least one tag" };
    }

    const existingPost = await this.postings.findOne({ _id: posting });
    if (!existingPost) {
      return { error: "Post not found" };
    }
    if (existingPost.author !== requester) {
      return { error: "User is not authorized to update this post" };
    }

    const updateDoc = {
      $set: {
        title: newTitle,
        body: newBody,
        tags: newTags,
        course: newCourse,
      },
    };

    const result = await this.postings.updateOne({ _id: posting }, updateDoc);
    if (result.matchedCount === 0) {
      return { error: "Failed to update post, post not found" };
    }

    return {};
  }

  /**
   * replyToPost(posting: Posting, author: User, body: String): (reply: Reply)
   *
   * **requires** `posting` exists, `author` exists, `author` is a member of `posting.community`, `body` is non-empty
   * **effect** creates a new `Reply` on `posting` authored by `author`
   */
  async replyToPost({ posting, author, body }: { posting: Posting; author: User; body: string }): Promise<{ reply: Reply } | { error: string }> {
    if (!body || body.trim() === "") {
      return { error: "Reply body cannot be empty" };
    }

    const existingPost = await this.postings.findOne({ _id: posting });
    if (!existingPost) {
      return { error: "Cannot reply to a non-existent post" };
    }

    const newReply: ReplyDoc = {
      _id: freshID(),
      author,
      posting,
      body,
    };

    const replyResult = await this.replies.insertOne(newReply);
    if (!replyResult.acknowledged) {
      return { error: "Failed to create reply" };
    }

    const postUpdateResult = await this.postings.updateOne({ _id: posting }, { $push: { replies: newReply._id } });
    if (postUpdateResult.matchedCount === 0) {
      // This is an inconsistent state, we should probably roll back the reply insertion
      await this.replies.deleteOne({ _id: newReply._id });
      return { error: "Failed to associate reply with post" };
    }

    return { reply: newReply._id };
  }

  /**
   * updateReply(reply: Reply, newBody: String, requester: User): ()
   *
   * **requires** `reply` exists, `requester` is `reply.author`, `newBody` is non-empty
   * **effect** updates the `body` of `reply`
   */
  async updateReply({ reply, newBody, requester }: { reply: Reply; newBody: string; requester: User }): Promise<Empty | { error: string }> {
    if (!newBody || newBody.trim() === "") {
      return { error: "Reply body cannot be empty" };
    }

    const existingReply = await this.replies.findOne({ _id: reply });
    if (!existingReply) {
      return { error: "Reply not found" };
    }

    if (existingReply.author !== requester) {
      return { error: "User is not authorized to update this reply" };
    }

    const result = await this.replies.updateOne({ _id: reply }, { $set: { body: newBody } });
    if (result.matchedCount === 0) {
      return { error: "Failed to update reply, reply not found" };
    }

    return {};
  }

  /**
   * deletePost(posting: Posting, requester: User): ()
   *
   * **requires** `posting` exists, (`requester` is `posting.author` OR `requester` is an `ADMIN` member of `posting.community`)
   * **effect** removes the `posting` and all its associated `Replies`
   */
  async deletePost({ posting, requester }: { posting: Posting; requester: User }): Promise<Empty | { error: string }> {
    const existingPost = await this.postings.findOne({ _id: posting });
    if (!existingPost) {
      return { error: "Post not found" };
    }

    // Note: The check for 'requester is an ADMIN member' must be handled by a synchronization rule,
    // as it involves state from another concept (e.g., a CommunityMembers concept).
    if (existingPost.author !== requester) {
      return { error: "User is not authorized to delete this post" };
    }

    // Delete all associated replies
    if (existingPost.replies && existingPost.replies.length > 0) {
      await this.replies.deleteMany({ _id: { $in: existingPost.replies } });
    }

    // Delete the post itself
    const result = await this.postings.deleteOne({ _id: posting });
    if (result.deletedCount === 0) {
      return { error: "Failed to delete post" };
    }

    return {};
  }

  /**
   * deleteReply(reply: Reply, requester: User): ()
   *
   * **requires** `reply` exists, (`requester` is `reply.author` OR `requester` is an `ADMIN` member of `reply.posting.community`)
   * **effect** removes the `reply` from its `Posting`
   */
  async deleteReply({ reply, requester }: { reply: Reply; requester: User }): Promise<Empty | { error: string }> {
    const existingReply = await this.replies.findOne({ _id: reply });
    if (!existingReply) {
      return { error: "Reply not found" };
    }

    // Note: The check for 'requester is an ADMIN member' must be handled by a synchronization rule.
    if (existingReply.author !== requester) {
      return { error: "User is not authorized to delete this reply" };
    }

    // Remove the reply from its parent posting's replies array
    await this.postings.updateOne({ _id: existingReply.posting }, { $pull: { replies: reply } });

    // Delete the reply document
    const result = await this.replies.deleteOne({ _id: reply });
    if (result.deletedCount === 0) {
      return { error: "Failed to delete reply" };
    }

    return {};
  }

  // Potential queries for testing and application use
  /**
   * _getPostById(posting: Posting): (post: PostingDoc)
   */
  async _getPostById({ posting }: { posting: Posting }): Promise<PostingDoc[]> {
    const post = await this.postings.findOne({ _id: posting });
    return post ? [post] : [];
  }

  /**
   * _getRepliesForPost(posting: Posting): (reply: ReplyDoc)
   */
  async _getRepliesForPost({ posting }: { posting: Posting }): Promise<ReplyDoc[]> {
    return await this.replies.find({ posting: posting }).toArray();
  }

  /**
   * _getPostsByCommunity(community: Community): (post: PostingDoc)
   */
  async _getPostsByCommunity({ community }: { community: Community }): Promise<PostingDoc[]> {
    return await this.postings.find({ community: community }).toArray();
  }
}
```
