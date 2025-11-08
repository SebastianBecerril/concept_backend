---
timestamp: 'Fri Nov 07 2025 20:57:57 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_205757.e9f14456.md]]'
content_id: 612414b8532f487e628bd9ac3d12ce416883bc1d4db90c469e47353ee526f208
---

# response:

You are absolutely right to question this. That is an excellent catch, and you've pinpointed a subtle but important inconsistency that should be fixed.

**You are correct: they should all use the same thing.**

Using different names (`session` vs. `sessionId`) for the same piece of data is a classic source of bugs and confusion. While the backend would technically work (because each sync only cares about its own internal variable names), it creates a messy and error-prone API for the frontend. The frontend developer would have to remember "for this route I send `session`, but for that route I send `sessionId`," which is a recipe for disaster.

Let's fix this.

### The Problem and The Solution

* **The Problem:** In some of your sync files (like `community.sync.ts` and `userProfile.sync.ts`), the variable for the session token was named `session`. In others (like `userEnrollments.sync.ts`), it was named `sessionId`.
* **The Solution:** We need to standardize on one name. The name **`sessionId`** is slightly more descriptive and is a better practice, as it makes it clear that we are passing the *identifier* of the session, not the entire session object.

We will update all synchronizations to expect a request parameter named `sessionId`.

### Action Plan: How to Fix This

You need to go into the synchronization files that are using `session` and update them to use `sessionId`. This is a simple but critical refactor.

Here is a specific example from your `community.sync.ts` file.

**BEFORE (in `community.sync.ts`):**

```typescript
// Notice the use of 'session' here
export const CreateCommunityRequest: Sync = ({ request, name, description, session, creator }) => ({
  when: actions([
    Requesting.request,
    // and here
    { path: "/Community/createCommunity", name, description, session }, 
    { request },
  ]),
  // and here, requiring an alias because the names don't match the concept's parameter
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user: creator }),
  then: actions([
    Community.createCommunity,
    { name, description, creator },
  ]),
});
```

**AFTER (The Correct, Standardized Version):**

```typescript
// Change 'session' to 'sessionId'
export const CreateCommunityRequest: Sync = ({ request, name, description, sessionId, creator }) => ({
  when: actions([
    Requesting.request,
    // Change it here
    { path: "/Community/createCommunity", name, description, sessionId },
    { request },
  ]),
  // Now the variable name matches the concept parameter, making the code cleaner (no alias needed)
  where: (frames) => frames.query(UserAuthentication._getUserForSession, { sessionId }, { user: creator }),
  then: actions([
    Community.createCommunity,
    { name, description, creator },
  ]),
});
```

You would need to apply this same change to **all** synchronizations in all files that are currently using `session` instead of `sessionId`.

### Your Updated Prompt for the Agentic Coder

Once you have made this change across your backend sync files, your instructions for the frontend become much simpler, cleaner, and more robust. You no longer need to warn the agent about checking different parameter names.

Here is the revised, superior prompt:

> **"Please update our frontend application to handle authenticated API routes based on our new backend design.**
>
> **The core task is to modify all API calls that correspond to the `exclusions` list in the `passthrough.ts` file. These routes are no longer direct action calls; they are now authenticated requests that require a user session.**
>
> **Here are the specific implementation requirements:**
>
> 1. **Implement Session Storage:**
>    * When a user successfully logs in via the `/api/UserAuthentication/login` endpoint, extract the `sessionId` from the response.
>    * Store this `sessionId` in the browser's `localStorage`.
>    * When the user logs out, the `sessionId` must be removed from `localStorage`.
> 2. **Update the API Client:**
>    * For every API call to a route listed in the `passthrough.ts` `exclusions` list, you must modify the function to perform these steps:
>      a. Read the `sessionId` from `localStorage`.
>      b. If the `sessionId` does not exist, the request should fail and the user should ideally be redirected to the login page.
>      c. Add the `sessionId` to the JSON body of the `POST` request. The parameter name for the session token **must always be `sessionId`**.
> 3. **Handle Authentication Errors:**
>    * If an API call fails due to an invalid or expired session, the backend will likely return an error. The frontend should handle this gracefully by clearing any invalid session data from `localStorage` and redirecting the user to the login page.
>
> **For reference, all public, read-only routes in the `passthrough.ts` `inclusions` list do not need to be changed.**"

By making this small change, you have significantly improved the quality and maintainability of your API. Your instinct was exactly right—consistency is key.
