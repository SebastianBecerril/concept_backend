---
timestamp: 'Thu Oct 23 2025 20:59:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_205923.bde61ecf.md]]'
content_id: ea06f39c56b4c02689b36111beb7e9cc5b7adf59349dc2e7391e347aa9a32dd6
---

# trace:

The following trace demonstrates how the `principle` of the `Community` concept is fulfilled by a sequence of actions.

**Principle:** After a user creates a community, they can invite other users to join as members and assign roles, enabling structured interaction within that unit.

1. **A user creates a community.**
   * **Action:** `Community.createCommunity`
   * **Inputs:** `name: "Tech Innovators"`, `description: "Discussing the future of tech."`, `creator: userAlice`
   * **State Change:**
     * A new `Community` document is created.
     * A new `Membership` document is created for `userAlice` with `role: "ADMIN"`.
     * The community's `memberships` array contains the ID of Alice's new membership.

2. **The creator (an ADMIN) invites another user to join.**
   * **Action:** `Community.addMember`
   * **Inputs:** `community: <communityId>`, `user: userBob`, `inviter: userAlice`
   * **State Change:**
     * A new `Membership` document is created for `userBob` with the default `role: "MEMBER"`.
     * The community's `memberships` array is updated to include the ID of Bob's new membership.

3. **The creator (an ADMIN) assigns a new role to the member.**
   * **Action:** `Community.setMemberRole`
   * **Inputs:** `membership: <bobMembershipId>`, `newRole: "ADMIN"`, `requester: userAlice`
   * **State Change:**
     * The `role` field in `userBob`'s `Membership` document is updated from `"MEMBER"` to `"ADMIN"`.

This sequence successfully demonstrates the principle: a community is created, members are added, and roles are managed, enabling structured interaction as intended by the concept's purpose.
