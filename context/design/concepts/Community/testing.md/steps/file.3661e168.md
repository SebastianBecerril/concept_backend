---
timestamp: 'Thu Oct 23 2025 20:59:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_205923.bde61ecf.md]]'
content_id: 3661e168e8a41641c16f8dd9f6a5516ea1ad18b0d55bf8a0cf8875f305e82992
---

# file: src/concepts/Community/CommunityConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import CommunityConcept from "./CommunityConcept.ts";

// Mock User IDs for testing
const userAlice = "user:alice" as ID;
const userBob = "user:bob" as ID;
const userCharlie = "user:charlie" as ID;

Deno.test("CommunityConcept", async (t) => {
  const [db, client] = await testDb();
  const communityConcept = new CommunityConcept(db);

  // NOTE: The `addMember` action in the provided implementation incorrectly checks
  // for user existence in another concept. To satisfy this dependency for the test,
  // we manually insert mock users into a collection that mimics UserAuthentication.
  // In a truly independent concept, this setup would not be necessary.
  const mockUserCollection = db.collection("UserAuthentication.users");
  await mockUserCollection.insertMany([
    { _id: userAlice },
    { _id: userBob },
    { _id: userCharlie },
  ]);

  let communityId: ID;
  let aliceMembershipId: ID;
  let bobMembershipId: ID;

  await t.step("createCommunity", async (t) => {
    await t.step("should fail if name is empty", async () => {
      const result = await communityConcept.createCommunity({
        name: "  ",
        description: "A community with an invalid name.",
        creator: userAlice,
      });
      assertExists(result.error);
      assertEquals(result.error, "Community name cannot be empty.");
    });

    await t.step(
      "should successfully create a community and make the creator an ADMIN",
      async () => {
        const result = await communityConcept.createCommunity({
          name: "Deno Enthusiasts",
          description: "A group for people who love Deno.",
          creator: userAlice,
        });

        assertNotEquals(result.error, undefined);
        assertExists(result.community);
        communityId = result.community!;

        const community = await communityConcept.communities.findOne({
          _id: communityId,
        });
        assertExists(community);
        assertEquals(community.name, "Deno Enthusiasts");

        const membership = await communityConcept.memberships.findOne({
          user: userAlice,
          community: communityId,
        });
        assertExists(membership);
        assertEquals(membership.role, "ADMIN");
        assertEquals(community.memberships.length, 1);
        assertEquals(community.memberships[0], membership._id);
        aliceMembershipId = membership._id;
      },
    );

    await t.step("should fail if community name already exists", async () => {
      const result = await communityConcept.createCommunity({
        name: "Deno Enthusiasts",
        description: "Another group with the same name.",
        creator: userBob,
      });
      assertExists(result.error);
      assertEquals(result.error, "A community with this name already exists.");
    });
  });

  await t.step("updateCommunityDetails", async (t) => {
    await t.step("should fail if requester is not an ADMIN", async () => {
      // First, create a temporary user to try the update
      const nonAdmin = userCharlie;
      const result = await communityConcept.updateCommunityDetails({
        community: communityId,
        newName: "New Name",
        newDescription: "New Desc",
        requester: nonAdmin,
      });
      assertExists(result.error);
      assertEquals(
        result.error,
        "Requester is not an ADMIN member of this community.",
      );
    });

    await t.step("should successfully update details by an ADMIN", async () => {
      const result = await communityConcept.updateCommunityDetails({
        community: communityId,
        newName: "Deno & Fresh Fans",
        newDescription: "A group for Deno and the Fresh framework.",
        requester: userAlice,
      });

      assertEquals(result.error, undefined);
      const updatedCommunity = await communityConcept.communities.findOne({
        _id: communityId,
      });
      assertExists(updatedCommunity);
      assertEquals(updatedCommunity.name, "Deno & Fresh Fans");
      assertEquals(
        updatedCommunity.description,
        "A group for Deno and the Fresh framework.",
      );
    });
  });

  await t.step("addMember", async (t) => {
    await t.step("should fail if inviter is not an ADMIN", async () => {
      // To test this, we'll first add Bob as a regular member
      const addBobResult = await communityConcept.addMember({
        community: communityId,
        user: userBob,
        inviter: userAlice, // Alice is the admin
      });
      assertEquals(addBobResult.error, undefined);

      // Now, Bob (a MEMBER) tries to invite Charlie
      const result = await communityConcept.addMember({
        community: communityId,
        user: userCharlie,
        inviter: userBob,
      });
      assertExists(result.error);
      assertEquals(
        result.error,
        "Inviter is not an ADMIN member of this community.",
      );
    });

    await t.step("should fail if user is already a member", async () => {
      const result = await communityConcept.addMember({
        community: communityId,
        user: userBob, // Bob is already a member
        inviter: userAlice,
      });
      assertExists(result.error);
      assertEquals(result.error, "User is already a member of this community.");
    });

    await t.step("should successfully add a new MEMBER", async () => {
      // Bob was added in a previous step, let's find his membership
      const membership = await communityConcept.memberships.findOne({
        user: userBob,
        community: communityId,
      });
      assertExists(membership);
      bobMembershipId = membership._id;
      assertEquals(membership.role, "MEMBER");

      const community = await communityConcept.communities.findOne({
        _id: communityId,
      });
      assertEquals(community?.memberships.length, 2);
    });
  });

  await t.step("setMemberRole", async (t) => {
    await t.step("should fail if requester is not an ADMIN", async () => {
      const result = await communityConcept.setMemberRole({
        membership: bobMembershipId,
        newRole: "ADMIN",
        requester: userBob, // Bob is not an admin
      });
      assertExists(result.error);
      assertEquals(
        result.error,
        "Requester is not an ADMIN member of this community.",
      );
    });

    await t.step(
      "should fail if last ADMIN tries to demote themselves",
      async () => {
        const result = await communityConcept.setMemberRole({
          membership: aliceMembershipId,
          newRole: "MEMBER",
          requester: userAlice,
        });
        assertExists(result.error);
        assertEquals(
          result.error,
          "Cannot demote yourself from ADMIN to MEMBER when you are the only ADMIN.",
        );
      },
    );

    await t.step(
      "should successfully promote a MEMBER to ADMIN",
      async () => {
        const result = await communityConcept.setMemberRole({
          membership: bobMembershipId,
          newRole: "ADMIN",
          requester: userAlice,
        });
        assertEquals(result.error, undefined);

        const bobMembership = await communityConcept.memberships.findOne({
          _id: bobMembershipId,
        });
        assertEquals(bobMembership?.role, "ADMIN");
      },
    );

    await t.step(
      "should successfully demote an ADMIN when another exists",
      async () => {
        // Now that Bob is also an admin, Alice can demote herself.
        const result = await communityConcept.setMemberRole({
          membership: aliceMembershipId,
          newRole: "MEMBER",
          requester: userBob, // Bob (the other admin) performs the action
        });
        assertEquals(result.error, undefined);

        const aliceMembership = await communityConcept.memberships.findOne({
          _id: aliceMembershipId,
        });
        assertEquals(aliceMembership?.role, "MEMBER");
      },
    );
  });

  await t.step("removeMember", async (t) => {
    await t.step(
      "should fail if requester is not an ADMIN and not the user themselves",
      async () => {
        const result = await communityConcept.removeMember({
          community: communityId,
          user: userBob,
          requester: userCharlie, // Not in community
        });
        assertExists(result.error);
        assertEquals(
          result.error,
          "Requester is not authorized to remove this member.",
        );
      },
    );

    await t.step("should allow a user to remove themselves", async () => {
      const result = await communityConcept.removeMember({
        community: communityId,
        user: userAlice, // Alice is now a MEMBER
        requester: userAlice,
      });
      assertEquals(result.error, undefined);

      const aliceMembership = await communityConcept.memberships.findOne({
        _id: aliceMembershipId,
      });
      assertEquals(aliceMembership, null);

      const community = await communityConcept.communities.findOne({
        _id: communityId,
      });
      assertEquals(community?.memberships.length, 1);
    });

    await t.step("should allow an ADMIN to remove another user", async () => {
      // Add Alice back so Bob has someone to remove
      await communityConcept.addMember({
        community: communityId,
        user: userAlice,
        inviter: userBob,
      });

      const result = await communityConcept.removeMember({
        community: communityId,
        user: userAlice,
        requester: userBob, // Bob is the ADMIN
      });
      assertEquals(result.error, undefined);

      const community = await communityConcept.communities.findOne({
        _id: communityId,
      });
      assertEquals(community?.memberships.length, 1); // Only Bob remains
    });
  });

  await t.step("deleteCommunity", async (t) => {
    await t.step("should fail if requester is not an ADMIN", async () => {
      // Demote Bob so there are no admins
      const selfDemoteResult = await communityConcept.setMemberRole({
        membership: bobMembershipId,
        newRole: "MEMBER",
        requester: userBob, // This will fail as he's the last admin
      });
      assertExists(selfDemoteResult.error);

      // We'll use a user not in the community to test the auth
      const result = await communityConcept.deleteCommunity({
        community: communityId,
        requester: userCharlie,
      });
      assertExists(result.error);
      assertEquals(
        result.error,
        "Requester is not an ADMIN member of this community.",
      );
    });

    await t.step(
      "should successfully delete the community and all its memberships",
      async () => {
        const result = await communityConcept.deleteCommunity({
          community: communityId,
          requester: userBob, // Bob is still the ADMIN
        });
        assertEquals(result.error, undefined);

        const community = await communityConcept.communities.findOne({
          _id: communityId,
        });
        assertEquals(community, null);

        const memberships = await communityConcept.memberships
          .find({
            community: communityId,
          })
          .toArray();
        assertEquals(memberships.length, 0);
      },
    );
  });

  await client.close();
});
```
