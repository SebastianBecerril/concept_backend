
### concept CommunityBoard \[User, Course, Community]

*   **purpose**
    Provide a shared forum for community members to post and discuss academic or community-related topics.
*   **principle**
    After a user within a community creates a tagged posting (optionally linked to a course), other community members can reply, fostering focused discussion. Authors can edit or delete their contributions.
*   **state**
    *   a set of Postings with
        *   an `author` User
        *   a `community` Community
        *   a `title` String
        *   a `body` String
        *   a `tags` set of Strings
        *   an optional `course` Course
        *   a `replies` set of Replies
    *   a set of Replies with
        *   an `author` User
        *   a `posting` Posting
        *   a `body` String
*   **actions**
    *   `createPost(author: User, community: Community, title: String, body: String, tags: set of Strings, optional course: Course): (posting: Posting)`
        *   **requires** `author` exists, `community` exists, `author` is a member of `community`, `body` is non-empty, `tags` are non-empty, `course` (if provided) exists
        *   **effect** creates a new `Posting` in `community` authored by `author` with the given details
    *   `updatePost(posting: Posting, newTitle: String, newBody: String, newTags: set of Strings, optional newCourse: Course, requester: User): ()`
        *   **requires** `posting` exists, `requester` is `posting.author`, `newBody` is non-empty, `newTags` are non-empty, `newCourse` (if provided) exists
        *   **effect** updates the `title`, `body`, `tags`, and `course` of `posting`
    *   `replyToPost(posting: Posting, author: User, body: String): (reply: Reply)`
        *   **requires** `posting` exists, `author` exists, `author` is a member of `posting.community`, `body` is non-empty
        *   **effect** creates a new `Reply` on `posting` authored by `author`
    *   `updateReply(reply: Reply, newBody: String, requester: User): ()`
        *   **requires** `reply` exists, `requester` is `reply.author`, `newBody` is non-empty
        *   **effect** updates the `body` of `reply`
    *   `deletePost(posting: Posting, requester: User): ()`
        *   **requires** `posting` exists, (`requester` is `posting.author` OR `requester` is an `ADMIN` member of `posting.community`)
        *   **effect** removes the `posting` and all its associated `Replies`
    *   `deleteReply(reply: Reply, requester: User): ()`
        *   **requires** `reply` exists, (`requester` is `reply.author` OR `requester` is an `ADMIN` member of `reply.posting.community`)
        *   **effect** removes the `reply` from its `Posting`
