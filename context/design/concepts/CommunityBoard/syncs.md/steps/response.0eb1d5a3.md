---
timestamp: 'Fri Nov 07 2025 19:26:12 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_192612.ac44b3e4.md]]'
content_id: 0eb1d5a39e97167172c529c45d5a6ed60726915602a45d8353b3f04a81835b5d
---

# response:

Of course. This is an excellent idea. The process of refining the synchronizations revealed a set of core principles and common pitfalls. By embedding these lessons into a detailed prompt, you can guide the LLM to produce a high-quality, robust synchronization file on the first attempt.

Here is a comprehensive, reusable prompt template. You can fill in the placeholders and provide it to the LLM for future sync generation tasks.

***

### The Master Prompt for Generating Concept Design Synchronizations

You are an expert software developer specializing in the Concept Design architecture. Your task is to generate a complete and robust TypeScript synchronization file (`.sync.ts`) for the `{ConceptName}` concept.

You will be provided with all necessary context, including concept specifications, the target concept's implementation, and the application's passthrough routing rules. You must adhere strictly to the following core principles to ensure the generated code is secure, correct, and efficient.

**Core Principles for Synchronization Generation:**

1. **Strict Adherence to Provided APIs:** You **MUST** only use the actions and queries that are explicitly defined in the provided concept specifications and implemented in the `.ts` files. Do not invent or hallucinate new queries. If a seemingly necessary query is missing (e.g., a direct lookup for a user's membership), you must achieve the same result by chaining the existing, provided queries (e.g., get all memberships, then filter).

2. **The "Authorize in `where`, Execute in `then`" Pattern:** This is the most critical security principle. For every action that modifies state or accesses protected data, the `where` clause **MUST** perform all necessary authentication and authorization checks *before* the `then` clause is reached.
   * **Authentication:** Always use the `UserAuthentication` (or `Sessioning`) concept to get an authenticated `user` from the provided `session`.
   * **Authorization:** After authenticating, verify the user's permissions. For example, before an `updatePost` action, the `where` clause must query for the post and filter to ensure the authenticated user is the post's author. This prevents the action from even being called for an unauthorized user.

3. **Handle TypeScript's `unknown` Type in Frames:** Variables that are bound from a query's output into a `Frame` (e.g., `post`, `replyDoc`) are of type `unknown`. To access their properties within a `.filter()` or other logic, you **MUST** use structural type assertions.
   * **Correct:** `return frames.filter(($) => ($[user] as User) === ($[post] as { author: User }).author);`
   * **Incorrect:** `return frames.filter(($) => $[user] === $[post].author);` // This will cause a type error.

4. **Separate Syncs for Separate Roles:** If a concept's action allows multiple roles to perform it (e.g., "author OR admin"), you **MUST** create separate, clearly named synchronizations for each role's request flow. For example:
   * `DeleteOwnPostRequest` (where clause checks for authorship)
   * `DeletePostAsAdminRequest` (where clause checks for admin role)

5. **Implement the Full Request/Response Cycle:** For every route for `{ConceptName}` that is listed in the `exclusions` of the `passthrough.ts` file, you **MUST** generate a pair of synchronizations:
   * **A `...Request` sync:** This sync is triggered by `Requesting.request`, contains the `where` clause for authorization, and fires the concept action in its `then` clause.
   * **A `...Response` sync:** This sync is triggered by both the `Requesting.request` and the resulting concept action (e.g., `CommunityBoard.createPost`). It captures the output of the action (both success, like `{ posting: ... }`, and failure, like `{ error: ... }`) and uses it to call `Requesting.respond`.

6. **Robust `where` Clause Logic:** The `where` clause is an `async` function that takes `Frames` and **MUST** return `Frames`.
   * The standard pattern is a chain of `await frames.query(...)`.
   * If any query in the chain returns no results, the `Frames` object will naturally become empty. This correctly and safely halts the synchronization.
   * **Do not** manually return an empty array `[]`. This will cause a type error.

**Your Task:**

Based on all the provided context files below, generate the complete code for `src/syncs/{conceptName}.sync.ts`. The file should be a single, ready-to-use TypeScript code block.

**\[CONTEXT START]**

*Include the full text of all relevant files here, clearly marking each one.*

* **File: `src/concepts/{ConceptName}/{ConceptName}Concept.ts`**
* **File: `src/concepts/UserAuthentication/UserAuthenticationConcept.ts` (or equivalent for session management)**
* **File: `src/concepts/{AnotherRelevantConcept}/{AnotherRelevantConcept}Concept.ts` (e.g., `CommunityConcept.ts`)**
* **File: `src/concepts/Requesting/passthrough.ts`**
* **(Optional) All relevant concept specifications (the markdown/text descriptions).**

**\[CONTEXT END]**
