---
timestamp: 'Thu Oct 23 2025 20:16:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_201633.37c3f5aa.md]]'
content_id: a92ea2ea7b1c70f5350af15c586a618aff702c753e5d15ab4ed136f07206856a
---

# file: src/concepts/Community/CommunityConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

interface CommunitySchema {
  _id: ID;
  name: string;
  description: string;
  creationDate: Date;
  memberships: ID[];
}

interface MembershipSchema {
  _id: ID;
  user: ID;
  community: ID;
  role: string;
  joinDate: Date;
}

/**
 * @concept Community
 * @purpose Group users into distinct social or organizational units and manage their membership and roles.
 * @principle After a user creates a community, they can invite other users to join as members and assign roles, enabling structured interaction within that unit.
 */
export default class CommunityConcept {
  private static readonly PREFIX = "Community" + ".";

  /**
   * @state
   * a set of Communities with
   *   a `name` String
   *   a `description` String
   *   a `creationDate` DateTime
   *   a `memberships` Array of Membership IDs
   */
  communities: Collection<CommunitySchema>;

  /**
   * @state
   * a set of Memberships with
   *   a `user` User
   *   a `community` Community
   *   a `role` String
   *   a `joinDate` DateTime
   */
  memberships: Collection<MembershipSchema>;

  constructor(private readonly db: Db) {
    this.communities = this.db.collection(
      CommunityConcept.PREFIX + "communities",
    );
    this.memberships = this.db.collection(
      CommunityConcept.PREFIX + "memberships",
    );

    this.communities.createIndex({ name: 1 }, { unique: true })
      .catch(console.error);
    this.memberships.createIndex({ user: 1, community: 1 }, { unique: true })
      .catch(console.error);
  }

  /**
   * @action createCommunity
   * @requires `name` and `description` are non-empty, a `Community` with `name` does not exist, `creator` exists
   * @effects creates a new `Community` with the given `name` and `description`, and adds `creator` as an `ADMIN` `Membership` to this `Community`
   * @param {string} name - The name of the community.
   * @param {string} description - The description of the community.
   * @param {ID} creator - The ID of the user creating the community.
   * @returns {{ community: ID } | { error: string }} The ID of the new community or an error message.
   */
  async createCommunity({
    name,
    description,
    creator,
  }: {
    name: string;
    description: string;
    creator: ID;
  }): Promise<{ community: ID } | { error: string }> {
    // Check if name and description are non-empty
    if (!name.trim()) {
      return { error: "Community name cannot be empty." };
    }
    if (!description.trim()) {
      return { error: "Community description cannot be empty." };
    }

    // Check if a Community with this name already exists
    const existingCommunity = await this.communities.findOne({ name });
    if (existingCommunity) {
      return { error: "A community with this name already exists." };
    }

    const communityId = freshID();
    const membershipId = freshID();
    const creationDate = new Date();

    const newCommunity: CommunitySchema = {
      _id: communityId,
      name,
      description,
      creationDate,
      memberships: [membershipId],
    };

    const newMembership: MembershipSchema = {
      _id: membershipId,
      user: creator,
      community: communityId,
      role: "ADMIN",
      joinDate: creationDate,
    };

    try {
      await this.communities.insertOne(newCommunity);
      await this.memberships.insertOne(newMembership);
      return { community: communityId };
    } catch (e) {
      console.error("Error creating community:", e);
      return { error: "Failed to create community due to a system error." };
    }
  }

  /**
   * @action updateCommunityDetails
   * @requires `community` exists, `requester` is an `ADMIN` member of `community`
   * @effects updates the `name` and `description` of `community`
   * @param {ID} community - The ID of the community to update.
   * @param {string} newName - The new name for the community.
   * @param {string} newDescription - The new description for the community.
   * @param {ID} requester - The ID of the user requesting the update.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateCommunityDetails({
    community,
    newName,
    newDescription,
    requester,
  }: {
    community: ID;
    newName: string;
    newDescription: string;
    requester: ID;
  }): Promise<Empty | { error: string }> {
    // Check if community exists
    const existingCommunity = await this.communities.findOne({
      _id: community,
    });
    if (!existingCommunity) {
      return { error: "Community does not exist." };
    }

    // Check if requester is an ADMIN member of the community
    const membership = await this.memberships.findOne({
      user: requester,
      community: community,
      role: "ADMIN",
    });
    if (!membership) {
      return { error: "Requester is not an ADMIN member of this community." };
    }

    // Check if new name and description are non-empty
    if (!newName.trim()) {
      return { error: "Community name cannot be empty." };
    }
    if (!newDescription.trim()) {
      return { error: "Community description cannot be empty." };
    }

    // Check if a different community with the new name already exists
    if (newName !== existingCommunity.name) {
      const nameConflict = await this.communities.findOne({ name: newName });
      if (nameConflict) {
        return { error: "A community with this name already exists." };
      }
    }

    try {
      await this.communities.updateOne(
        { _id: community },
        { $set: { name: newName, description: newDescription } },
      );
      return {};
    } catch (e) {
      console.error("Error updating community details:", e);
      return {
        error: "Failed to update community details due to a system error.",
      };
    }
  }
}

```

### concept Community \[User]

* **purpose**
  Group users into distinct social or organizational units and manage their membership and roles.
* **principle**
  After a user creates a community, they can invite other users to join as members and assign roles, enabling structured interaction within that unit.
* **state**
  * a set of Communities with
    * a `name` String
    * a `description` String
    * a `creationDate` DateTime
    * a `memberships` set of Memberships
  * a set of Memberships with
    * a `user` User
    * a `community` Community
    * a `role` String
    * a `joinDate` DateTime
* **actions**
  * `createCommunity(name: String, description: String, creator: User): (community: Community)`
    * **requires** `name` and `description` are non-empty, a `Community` with `name` does not exist, `creator` exists
    * **effect** creates a new `Community` with the given `name` and `description`, and adds `creator` as an `ADMIN` `Membership` to this `Community`
  * `updateCommunityDetails(community: Community, newName: String, newDescription: String, requester: User): ()`
    * **requires** `community` exists, `requester` is an `ADMIN` member of `community`
    * **effect** updates the `name` and `description` of `community`
  * `addMember(community: Community, user: User, inviter: User): ()`
    * **requires** `community` exists, `user` exists, `inviter` exists, `user` is not already a member of `community`, `inviter` is an `ADMIN` member of `community`
    * **effect** creates a `Membership` for `user` in `community` with `MEMBER` role
  * `removeMember(community: Community, user: User, requester: User): ()`
    * **requires** `community` exists, `user` is a member of `community`, (`requester` is an `ADMIN` member of `community` OR `requester` is `user`)
    * **effect** removes the `Membership` of `user` from `community`
  * `setMemberRole(membership: Membership, newRole: String, requester: User): ()`
    * **requires** `membership` exists, `newRole` is valid, `requester` is an `ADMIN` member of `membership.community`, `requester` is not attempting to demote themselves from `ADMIN` to `MEMBER` (unless there is another `ADMIN`)
    * **effect** updates `membership.role` to `newRole`
  * `deleteCommunity(community: Community, requester: User): ()`
    * **requires** `community` exists, `requester` is an `ADMIN` member of `community`
    * **effect** removes `community` and all associated `Memberships`
