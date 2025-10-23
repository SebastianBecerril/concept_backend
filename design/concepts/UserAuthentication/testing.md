[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@testing-concepts](../../background/testing-concepts.md)

[@UserAuthentication](UserAuthentication.md)

[@implementation](implementation.md)

# test: UserAuthentication
# response:

Here is the test implementation for the `UserAuthentication` concept, followed by a trace that demonstrates the concept's principle.

# file: src/UserAuthentication/UserAuthenticationConcept.test.ts

```typescript
import {
  assertEquals,
  assert,
  assertExists,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";
import { ID } from "@utils/types.ts";

// Utility to mock waiting for a short duration
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test("UserAuthenticationConcept", async (t) => {
  // `testDb` provides a clean database for each test file run.
  const [db, client] = await testDb();
  const authConcept = new UserAuthenticationConcept(db);

  await t.step("Principle: register, login, and have a valid session", async () => {
    // 1. A user registers with unique credentials.
    // The `register` action should succeed and return the new user's ID.
    const registerResult = await authConcept.register({
      username: "alice",
      password: "password123",
    });
    assert("user" in registerResult, "Registration should succeed and return a user object");
    const userId = registerResult.user;
    assertExists(userId, "User ID should not be null or undefined");

    // 2. They can log in to prove their identity.
    // The `login` action should succeed with the same credentials.
    const loginResult = await authConcept.login({
      username: "alice",
      password: "password123",
    });
    assert("sessionId" in loginResult, "Login should succeed and return a session object");
    assertEquals(loginResult.user, userId, "Logged in user ID should match registered user ID");
    const sessionId = loginResult.sessionId;
    assertExists(sessionId, "Session ID should not be null or undefined");

    // 3. Establishing an authenticated session for further interactions.
    // A query should confirm the session is valid and linked to the correct user.
    const sessionValidation = await authConcept._isValidSession({ sessionId });
    assert("user" in sessionValidation, "Session should be valid after login");
    assertEquals(sessionValidation.user, userId, "Valid session should belong to the logged-in user");
  });

  await t.step("Action: register", async (t) => {
    await t.step("requires username to be unique", async () => {
      // First registration is successful.
      await authConcept.register({ username: "bob", password: "password123" });

      // A second attempt with the same username should fail.
      const result = await authConcept.register({ username: "bob", password: "anotherpassword" });
      assert("error" in result, "Registration should fail for a duplicate username");
      assertEquals(result.error, "Username already taken.");
    });

    await t.step("requires password to meet strength requirements", async () => {
      // This registration should fail because the password is too short.
      const result = await authConcept.register({ username: "charlie", password: "123" });
      assert("error" in result, "Registration should fail for a weak password");
      assertEquals(result.error, "Password must be at least 6 characters long.");
    });
  });

  await t.step("Action: login", async (t) => {
    // Setup a user to test login failures against.
    await authConcept.register({ username: "dave", password: "securepassword" });

    await t.step("requires a matching username", async () => {
      const result = await authConcept.login({ username: "david", password: "securepassword" });
      assert("error" in result, "Login should fail with an incorrect username");
      assertEquals(result.error, "Invalid username or password.");
    });

    await t.step("requires a matching password", async () => {
      const result = await authConcept.login({ username: "dave", password: "wrongpassword" });
      assert("error" in result, "Login should fail with an incorrect password");
      assertEquals(result.error, "Invalid username or password.");
    });
  });

  await t.step("Action: logout", async (t) => {
    // Setup a logged-in user.
    const registerResult = await authConcept.register({ username: "eve", password: "logoutpassword" });
    assert("user" in registerResult);
    const loginResult = await authConcept.login({ username: "eve", password: "logoutpassword" });
    assert("sessionId" in loginResult);
    const sessionId = loginResult.sessionId;

    await t.step("effects: removes the active session", async () => {
      const logoutResult = await authConcept.logout({ sessionId });
      assertEquals(logoutResult, {}, "Logout should return an empty object on success");

      // Verify the session is no longer in the state.
      const validationResult = await authConcept._isValidSession({ sessionId });
      assertEquals(validationResult, {}, "Session should be invalid after logout");
    });

    await t.step("requires a valid sessionId", async () => {
      const fakeSessionId = "fake-session-id" as ID;
      const result = await authConcept.logout({ sessionId: fakeSessionId });
      assert("error" in result, "Logout should fail for a non-existent session ID");
      assertEquals(result.error, "Session not found or already expired.");
    });
  });

  await t.step("System Action: invalidateExpiredSessions", async () => {
    // Setup a user.
    const registerResult = await authConcept.register({ username: "frank", password: "expiredpassword" });
    assert("user" in registerResult);
    const userId = registerResult.user;

    // Manually insert a session that is already expired.
    const expiredSessionId = "expired-session" as ID;
    const expiredTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    await authConcept.activeSessions.insertOne({
      _id: expiredSessionId,
      user: userId,
      creationTime: expiredTime,
      expiryTime: expiredTime,
    });

    // Manually insert a valid session to ensure it is not deleted.
    const validSessionId = "valid-session" as ID;
    const validTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in the future
    await authConcept.activeSessions.insertOne({
      _id: validSessionId,
      user: userId,
      creationTime: new Date(),
      expiryTime: validTime,
    });
    
    // Run the system action to clean up.
    await authConcept.invalidateExpiredSessions();

    // Verify the expired session was removed.
    const expiredSessionCheck = await authConcept.activeSessions.findOne({ _id: expiredSessionId });
    assertEquals(expiredSessionCheck, null, "Expired session should be removed from the database");

    // Verify the valid session remains.
    const validSessionCheck = await authConcept.activeSessions.findOne({ _id: validSessionId });
    assertExists(validSessionCheck, "Valid session should not be removed");
  });

  // Close the database connection after all tests in this file are done.
  await client.close();
});
```

# trace:

This trace describes the sequence of actions that fulfills the concept's principle: "After a user registers with unique credentials, they can log in to prove their identity, establishing an authenticated session for further interactions."

1.  **Action**: `UserAuthentication.register({ username: "alice", password: "password123" })`
    *   **Requires**: The username "alice" does not exist in the state, and "password123" meets the strength requirements.
    *   **Effect**: A new `User` is created and stored. The state now contains a user record for "alice".
    *   **Return**: `{ user: "user-id-alice" }`

2.  **Action**: `UserAuthentication.login({ username: "alice", password: "password123" })`
    *   **Requires**: A user with the username "alice" and the corresponding password exists in the state. This requirement is met by the previous action.
    *   **Effect**: A new `ActiveSession` is created and stored, linking "user-id-alice" to a new, unique session ID. The session is given an expiration time in the future.
    *   **Return**: `{ user: "user-id-alice", sessionId: "session-id-123" }`

3.  **Interaction**: The application now holds "session-id-123", which represents an authenticated session for the user "alice". It can use this session ID in subsequent interactions with other concepts. To verify its validity, a query can be performed:
    *   **Query**: `UserAuthentication._isValidSession({ sessionId: "session-id-123" })`
    *   **Effect**: The state is read. The query finds the active session and confirms its expiration time has not passed.
    *   **Return**: `{ user: "user-id-alice" }`

This sequence successfully demonstrates the core purpose of the concept: creating a user identity and then establishing a verifiable, temporary session to represent that identity.