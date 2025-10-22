---
timestamp: 'Tue Oct 21 2025 15:58:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_155808.5d631d52.md]]'
content_id: 7a10d8946f7f206b88182dab09a768317d44762b65ac4247df99cd3a246b8abe
---

# response:

That's an excellent question, and it delves into a nuanced area of action design that is very relevant to concept design principles.

Let's break down `createOrGet` actions in comparison to separate `create` and `get` or `upsert` patterns.

### Are `createOrGet` actions standard and good practice?

**Yes, `createOrGet` actions (or similar patterns like "find or create") are generally considered good practice and are standard in many contexts, especially when dealing with unique entities and aiming for idempotency.**

Here's why:

1. **Idempotency:** This is the primary benefit. An idempotent operation is one that can be applied multiple times without changing the result beyond the initial application. If a user tries to add "Fall 2024" as a term, calling `createOrGetTerm("Fall 2024")` multiple times will always result in the same "Fall 2024" term being present, and the same `Term` object (identifier) being returned. This simplifies the client's logic and makes the system more robust against network retries or multiple concurrent requests.

2. **Simplified Caller Logic:** The client (e.g., your UI or another concept) doesn't need to perform a `get` operation first, then check if it exists, and then call `create` if it doesn't. It can simply state its intent: "I need this entity to exist with these properties, and give me a reference to it."

3. **Encapsulation of Uniqueness Logic:** The `CourseCatalog` concept itself is responsible for enforcing its uniqueness constraints (e.g., only one "Fall 2024" term, only one "6.0001" course per term). By using `createOrGet`, this logic is centralized within the concept's action, preventing callers from having to replicate it and potentially introduce bugs.

4. **Community-Curated Data Model Fit:** In your user-populated `CourseCatalog`, `createOrGet` is particularly well-suited. Users aren't always thinking "Am I creating a brand new term?" but rather "I'm taking a class in Fall 2024, ensure 'Fall 2024' is in the system for me to associate my class with." This aligns perfectly with the principle of building a shared, consistent registry from user contributions.

### `createOrGet` vs. `upsert` vs. Separate `create` and `get`

Let's clarify the distinctions:

1. **Separate `create` and `get` (e.g., `createTerm(name: String)` and `getTermByName(name: String)`):**
   * **When to use:**
     * When the caller *explicitly needs to differentiate* between creating a *new, guaranteed unique* entity and retrieving an existing one. For example, if trying to create a new user account should *fail* if a username already exists, you'd want a dedicated `createAccount` that returns an error on conflict.
     * When you want the caller to have maximum control over the flow.
     * In public APIs where different clients might have different specific needs for strict creation vs. retrieval.
   * **Downside for your use case:** It forces the client to implement the `if exists then get else create` logic, which can lead to race conditions if not handled carefully (e.g., two users try to create "Fall 2024" concurrently after a `get` returns null, both then try `create`).

2. **`createOrGet` (as designed for your `CourseCatalog`):**
   * **Definition:** "If an entity matching the key (e.g., `name` for `Term`, `courseNumber` for `Course`) exists, return it. Otherwise, create it with the provided details and return it." This often includes **minor updates** to non-key fields if the existing entity's details (like `courseName` or `department` for a `Course`) differ from the provided input, reflecting the "latest input wins" or "community consensus" idea.
   * **Key behavior:** The core identifying property (e.g., `courseNumber` for a `Course`) is the lookup key. Other properties might be updated upon retrieval to ensure consistency.
   * **When to use:**
     * When the primary goal is to **ensure an entity exists** and obtain a reference to it, regardless of whether it's new or existing.
     * When **idempotency** is a high priority.
     * For **community-curated data** where the exact creation event is less important than having a canonical, up-to-date entry.
     * When you want to **encapsulate the "find-or-create" logic** within the concept itself.

3. **`upsert` (Update or Insert):**
   * **Definition:** "If an entity matching the key exists, update its mutable properties with the provided values. Otherwise, insert a new entity with the provided values."
   * **Key behavior:** The emphasis is more strongly on the **update** aspect for existing records. All provided mutable fields are typically applied to an existing record.
   * **Difference from `createOrGet`:** `upsert` implies a more comprehensive *modification* of an existing entity if found. `createOrGet` in your context focuses on ensuring the entity *exists* (and provides a reference) and makes *specific, limited updates* to non-key fields to reflect latest information, rather than a full overwrite. For example, your `createOrGetCourse` updates `courseName` and `department` but not `courseNumber` (which is the key). An `upsert` might typically expect to update *all* non-key fields.
   * **When to use:**
     * When you have a complete set of data that represents the *current desired state* of an entity, and you want to apply it, whether the entity is new or existing.
     * Common in database operations (e.g., MongoDB's `upsert: true` option for `updateMany`).

### Conclusion for your `CourseCatalog`

The `createOrGet` actions as defined are **highly appropriate and robust for your `CourseCatalog` concept** given the shift to a community-curated model. They:

* **Align with the Purpose:** Users contribute, the system maintains a canonical registry.
* **Support the Principle:** Users input classes, the system reuses or creates.
* **Promote Data Consistency:** By checking for existing entries and making minor updates to non-key fields (`courseName`, `department`), it helps converge on a consistent view.
* **Simplify Interactions:** For users, it's a straightforward "add this class" action without worrying if someone else already added it.

Therefore, for this specific project and its constraints, `createOrGet` is not just "good," but arguably the *best* practice to achieve the desired balance of user experience, data consistency, and practical implementation without external syncs.
