---
timestamp: 'Fri Nov 07 2025 20:53:20 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_205320.2689eff1.md]]'
content_id: b7a7fe5ef61b70743ccc800cce2fea8a33690c92b231cb5753b4418fbde7175a
---

# response:

That's an excellent and very perceptive question. You've hit on the exact workflow transition between the backend logic and the frontend implementation. Your interpretation of the instructions is spot on.

Let's break down your questions with clear, actionable answers.

### 1) Does that mean that public routes are left as is?

**Yes, that is exactly right.**

Any route that you have listed in the `inclusions` section of your `passthrough.ts` file is a public, unauthenticated route. The frontend's interaction with these routes **does not change at all**.

* **Example:** Your `passthrough.ts` includes `"/api/Community/_getAllCommunities"`.
* **Frontend Impact:** The frontend can continue to make a simple `POST` request to this endpoint with an empty body, just as it would have before. It does not need to provide a session token or any other form of authentication. The backend will pass the request directly through to the `Community._getAllCommunities` query and return the results.

Your `inclusions` list essentially defines the public, read-only surface of your API that anyone can access.

***

### 2) For the ones that are excluded, what should I tell my agentic coder to switch in the frontend?

This is the core of the task. For every route in your `exclusions` list, the frontend's method of calling it must be updated. You are no longer directly calling a concept action; you are creating an **authenticated request** that your synchronizations will then process.

Here is a clear, step-by-step breakdown of the required changes, which you can then formulate into a prompt for your agentic coder.

#### The Fundamental Frontend Changes Required:

1. **Session Management:** The frontend must now manage the user's session.
   * **On Login:** After a successful call to `/api/UserAuthentication/login`, the frontend must capture the `sessionId` from the response body.
   * **Store the Session ID:** This `sessionId` must be stored securely in the browser, typically in `localStorage` or `sessionStorage`. `localStorage` will persist the login across browser tabs and sessions, while `sessionStorage` will clear it when the tab is closed.
   * **On Logout:** When the user logs out (or the session expires), the stored `sessionId` must be deleted from storage.

2. **API Client Modification:** Your frontend code that makes API calls needs to be updated. For every excluded route, the API call must now include the stored `sessionId`.
   * The `sessionId` must be read from browser storage.
   * It must be added as a field in the JSON body of the `POST` request.

3. **The Parameter Name:** The name of the field you add to the JSON body is critical. It must match the variable name your synchronization is expecting. Looking at your sync files, you consistently use either `session` or `sessionId`.
   * In `community.sync.ts`, you use `session`: `when: actions([{ ..., session }, { request }])`
   * In `userEnrollments.sync.ts`, you use `sessionId`: `when: actions([{ ..., sessionId }, { request }])`
   * **Instruction:** The frontend must pass the parameter with the exact name that the corresponding `Request` synchronization expects in its `when` clause.

#### A "Before and After" Example

Let's use the `updateCommunityDetails` action as a concrete example.

**Before (Direct Passthrough - Hypothetical):**
The frontend would have made a direct call with only the action's parameters.

```javascript
// In the frontend API client
async function updateCommunityDetails(communityId, newName, newDescription) {
  const response = await fetch("/api/Community/updateCommunityDetails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      community: communityId,
      newName: newName,
      newDescription: newDescription,
    }),
  });
  return response.json();
}
```

**After (Authenticated Request via Syncs - What you need now):**
The frontend must now retrieve the session token and include it in the body.

```javascript
// In the frontend API client
async function updateCommunityDetails(communityId, newName, newDescription) {
  // 1. Retrieve the stored session ID
  const sessionId = localStorage.getItem("sessionId"); 
  if (!sessionId) {
    // Handle case where user is not logged in (e.g., redirect to login page)
    throw new Error("User is not authenticated.");
  }

  // 2. Make the API call, now including the session ID
  const response = await fetch("/api/Community/updateCommunityDetails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      community: communityId,
      newName: newName,
      newDescription: newDescription,
      session: sessionId, // <-- THE CRITICAL ADDITION
    }),
  });
  return response.json();
}
```

### Prompt for Your Agentic Coder

Here is a comprehensive prompt you can use, incorporating all the necessary details.

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
>      c. Add the `sessionId` to the JSON body of the `POST` request.
> 3. **Use the Correct Parameter Name:**
>    * The name of the session parameter in the request body is crucial. You must check the corresponding synchronization file in the backend to find the correct name. For example:
>      * For `/api/Community/createCommunity`, the sync expects a parameter named `session`.
>      * For `/api/UserEnrollments/addEnrollment`, the sync expects a parameter named `sessionId`.
>    * Please ensure the frontend sends the correct parameter name for each specific route.
> 4. **Handle Authentication Errors:**
>    * If an API call fails due to an invalid or expired session, the backend will likely return an error. The frontend should handle this gracefully by clearing any invalid session data from `localStorage` and redirecting the user to the login page.
>
> **For reference, all public, read-only routes in the `passthrough.ts` `inclusions` list do not need to be changed.**"

This prompt is detailed, specific, and gives the agent everything it needs to successfully adapt the frontend to your secure and robust backend.
