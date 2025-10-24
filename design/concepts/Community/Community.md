### concept Community \[User]

*   **purpose**
    Group users into distinct social or organizational units and manage their membership and roles.
*   **principle**
    After a user creates a community, they can invite other users to join as members and assign roles, enabling structured interaction within that unit.
*   **state**
    *   a set of Communities with
        *   a `name` String
        *   a `description` String
        *   a `creationDate` DateTime
        *   a `memberships` set of Memberships
    *   a set of Memberships with
        *   a `user` User
        *   a `community` Community
        *   a `role` String
        *   a `joinDate` DateTime
*   **actions**
    *   `createCommunity(name: String, description: String, creator: User): (community: Community)`
        *   **requires** `name` and `description` are non-empty, a `Community` with `name` does not exist, `creator` exists
        *   **effect** creates a new `Community` with the given `name` and `description`, and adds `creator` as an `ADMIN` `Membership` to this `Community`
    *   `updateCommunityDetails(community: Community, newName: String, newDescription: String, requester: User): ()`
        *   **requires** `community` exists, `requester` is an `ADMIN` member of `community`
        *   **effect** updates the `name` and `description` of `community`
    *   `addMember(community: Community, user: User, inviter: User): ()`
        *   **requires** `community` exists, `user` exists, `inviter` exists, `user` is not already a member of `community`, `inviter` is an `ADMIN` member of `community`
        *   **effect** creates a `Membership` for `user` in `community` with `MEMBER` role
    *   `removeMember(community: Community, user: User, requester: User): ()`
        *   **requires** `community` exists, `user` is a member of `community`, (`requester` is an `ADMIN` member of `community` OR `requester` is `user`)
        *   **effect** removes the `Membership` of `user` from `community`
    *   `setMemberRole(membership: Membership, newRole: String, requester: User): ()`
        *   **requires** `membership` exists, `newRole` is valid, `requester` is an `ADMIN` member of `membership.community`, `requester` is not attempting to demote themselves from `ADMIN` to `MEMBER` (unless there is another `ADMIN`)
        *   **effect** updates `membership.role` to `newRole`
    *   `deleteCommunity(community: Community, requester: User): ()`
        *   **requires** `community` exists, `requester` is an `ADMIN` member of `community`
        *   **effect** removes `community` and all associated `Memberships`
