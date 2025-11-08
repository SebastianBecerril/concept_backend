---
timestamp: 'Fri Nov 07 2025 19:44:33 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_194433.09a54732.md]]'
content_id: 00f75746af8351d2f187cb3f32e1510ecd1f9878231f35a55f5f3bf0956f1718
---

# file: src\concepts\UserAuthentication\UserAuthenticationConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { MongoServerError } from "npm:mongodb";

// Note: In a real app, you would use a secure hashing library like bcrypt.
// For simplicity here, we're storing passwords as plain text.

interface UserSchema {
  _id: ID;
  username: string;
  password: string; // Hashed in a real app
  registrationDate: Date;
}

interface ActiveSessionSchema {
  _id: ID;
  user: ID;
  sessionId: string;
  creationTime: Date;
  expiryTime: Date;
}

/**
 * @concept UserAuthentication
 * @purpose Identify users and manage their access credentials.
 * @principle After a user registers with unique credentials, they can log in to prove their identity, establishing an authenticated session for further interactions.
 */
export default class UserAuthenticationConcept {
  private static readonly PREFIX = "UserAuthentication" + ".";
  private static readonly SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  users: Collection<UserSchema>;
  activeSessions: Collection<ActiveSessionSchema>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(UserAuthenticationConcept.PREFIX + "users");
    this.activeSessions = this.db.collection(UserAuthenticationConcept.PREFIX + "activeSessions");

    this.users.createIndex({ username: 1 }, { unique: true }).catch(console.error);
    this.activeSessions.createIndex({ sessionId: 1 }, { unique: true }).catch(console.error);
  }

  /**
   * @action register
   * @requires `username` is unique, `password` meets strength requirements
   * @effect creates a new `User` with the given `username` and `password`
   */
  async register({ username, password }: { username: string; password: string }): Promise<{ user: ID } | { error: string }> {
    if (!password || password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const userId = freshID();
    try {
      await this.users.insertOne({
        _id: userId,
        username,
        password, // Again, hash this in production
        registrationDate: new Date(),
      });
      return { user: userId };
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        return { error: "Username is already taken." };
      }
      return { error: "Failed to register user due to a system error." };
    }
  }

  /**
   * @action login
   * @requires `username` and `password` match an existing `User`
   * @effect creates a new `ActiveSession` for the matched `User`
   */
  async login({ username, password }: { username: string; password: string }): Promise<{ user: ID; sessionId: string } | { error: string }> {
    const user = await this.users.findOne({ username });
    if (!user || user.password !== password) { // Use bcrypt.compare in production
      return { error: "Invalid username or password." };
    }

    const sessionId = freshID();
    const now = new Date();
    const expiryTime = new Date(now.getTime() + UserAuthenticationConcept.SESSION_DURATION_MS);

    await this.activeSessions.insertOne({
      _id: sessionId as ID,
      user: user._id,
      sessionId: sessionId,
      creationTime: now,
      expiryTime: expiryTime,
    });

    return { user: user._id, sessionId };
  }

  /**
   * @action logout
   * @requires `sessionId` matches an existing `ActiveSession`
   * @effect removes the `ActiveSession`
   */
  async logout({ sessionId }: { sessionId: string }): Promise<Record<string, never> | { error: string }> {
    const result = await this.activeSessions.deleteOne({ sessionId });
    if (result.deletedCount === 0) {
      return { error: "Session not found or already logged out." };
    }
    return {};
  }

  // QUERIES

  /**
   * @query _isValidSession
   * Checks if a session is active and not expired. Returns the user ID associated with the session.
   * @param {string} sessionId - The session ID to validate.
   * @returns {{ user: ID }[]} An array containing the user object if the session is valid, otherwise an empty array.
   */
  async _isValidSession({ sessionId }: { sessionId: string }): Promise<{ user: ID }[]> {
    const session = await this.activeSessions.findOne({
      sessionId,
      expiryTime: { $gt: new Date() },
    });

    // FIX: All queries MUST return an array.
    // This now correctly returns [{ user: ... }] on success or [] on failure.
    return session ? [{ user: session.user }] : [];
  }
}
```

By making this change in `UserAuthenticationConcept.ts`, your `userEnrollments.sync.ts` file will now work correctly without any modifications. The chain of type inference will be preserved, resolving both the array error and the subsequent property access error on `.owner`.
