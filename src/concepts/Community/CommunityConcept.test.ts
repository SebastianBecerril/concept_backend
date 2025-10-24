import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "../../utils/database.ts";
import { ID } from "../../utils/types.ts";
import CommunityConcept from "./CommunityConcept.ts";

// Mock user IDs for testing
const userAlice = "user:Alice" as ID; // Will be the creator and admin
const userBob = "user:Bob" as ID; // Will be invited as a member
const userCharlie = "user:Charlie" as ID; // An outside user

Deno.test("CommunityConcept", async (t) => {
  const [db, client] = await testDb();
  const communityConcept = new CommunityConcept(db);

  // Helper function to find a membership ID, useful for actions like `setMemberRole`
  const getMembershipId = async (
    user: ID,
    community: ID,
  ): Promise<ID | null> => {
    const memberships = await communityConcept._getMembershipsByUser({ user });
    const membership = memberships.find((m) => m.community === community);
    return membership?._id ?? null;
  };

  let communityId: ID;

  await t.step(
    "Operational Principle: Create, invite, and manage roles",
    async () => {
      console.log("--- Testing Operational Principle ---");

      // 1. Alice creates a community.
      console.log("Action: createCommunity (Alice)");
      const createResult = await communityConcept.createCommunity({
        name: "Deno Fans",
        description: "A community for Deno enthusiasts.",
        creator: userAlice,
      });
      console.log("Result:", createResult);
      assert(
        "community" in createResult,
        "Expected community creation to succeed",
      );
      communityId = createResult.community;
      assertExists(communityId);

      // Verify Alice was automatically made an ADMIN.
      const aliceMemberships = await communityConcept._getMembershipsByUser({
        user: userAlice,
      });
      const aliceMembership = aliceMemberships.find((m) =>
        m.community === communityId
      );
      assertEquals(aliceMembership?.role, "ADMIN");

      // 2. Alice (as admin) invites Bob to the community.
      console.log("\nAction: addMember (Alice invites Bob)");
      const addResult = await communityConcept.addMember({
        community: communityId,
        user: userBob,
        inviter: userAlice,
      });
      console.log("Result:", addResult);
      assertEquals(addResult, {}, "Expected adding member to succeed");

      // Verify Bob is a 'MEMBER'.
      const bobMemberships = await communityConcept._getMembershipsByUser({
        user: userBob,
      });
      const bobMembership = bobMemberships.find((m) =>
        m.community === communityId
      );
      assertEquals(bobMembership?.role, "MEMBER");

      // 3. Alice (as admin) promotes Bob to an ADMIN role.
      const bobMembershipId = await getMembershipId(userBob, communityId);
      assertExists(bobMembershipId, "Bob's membership ID should exist");

      console.log("\nAction: setMemberRole (Alice promotes Bob to ADMIN)");
      const setResult = await communityConcept.setMemberRole({
        membership: bobMembershipId,
        newRole: "ADMIN",
        requester: userAlice,
      });
      console.log("Result:", setResult);
      assertEquals(setResult, {}, "Expected setting role to succeed");

      // Verify Bob's role is now 'ADMIN'.
      const updatedBobMembership = await communityConcept._getMembershipById({
        membership: bobMembershipId,
      });
      assertEquals(updatedBobMembership?.role, "ADMIN");
      console.log("--- Operational Principle Test Passed ---");
    },
  );

  await t.step("Interesting Scenario 1: Authorization Failures", async () => {
    console.log("\n--- Testing Authorization Failures ---");

    // Demote Bob back to MEMBER to test non-admin failures.
    const bobMembershipId = await getMembershipId(userBob, communityId);
    assertExists(bobMembershipId);
    await communityConcept.setMemberRole({
      membership: bobMembershipId,
      newRole: "MEMBER",
      requester: userAlice,
    });

    // A non-member (Charlie) tries to update community details.
    console.log("Action: updateCommunityDetails (Charlie, non-member)");
    const updateFail = await communityConcept.updateCommunityDetails({
      community: communityId,
      newName: "Deno Haters",
      newDescription: "A place to complain.",
      requester: userCharlie,
    });
    console.log("Result:", updateFail);
    assert("error" in updateFail, "Expected update by non-member to fail");

    // A regular member (Bob) tries to add another user.
    console.log("\nAction: addMember (Bob, non-admin, invites Charlie)");
    const addFail = await communityConcept.addMember({
      community: communityId,
      user: userCharlie,
      inviter: userBob,
    });
    console.log("Result:", addFail);
    assert("error" in addFail, "Expected adding member by non-admin to fail");

    // A non-admin (Bob) tries to delete the community.
    console.log("\nAction: deleteCommunity (Bob, non-admin)");
    const deleteFail = await communityConcept.deleteCommunity({
      community: communityId,
      requester: userBob,
    });
    console.log("Result:", deleteFail);
    assert("error" in deleteFail, "Expected deletion by non-admin to fail");
    console.log("--- Authorization Failures Test Passed ---");
  });

  await t.step(
    "Interesting Scenario 2: Self-Removal and Last Admin Rule",
    async () => {
      console.log("\n--- Testing Self-Removal and Last Admin Rule ---");

      // Bob removes himself from the community.
      console.log("Action: removeMember (Bob removes himself)");
      const selfRemoveResult = await communityConcept.removeMember({
        community: communityId,
        user: userBob,
        requester: userBob,
      });
      console.log("Result:", selfRemoveResult);
      assertEquals(selfRemoveResult, {}, "Expected self-removal to succeed");
      const bobMemberships = await communityConcept._getMembershipsByUser({
        user: userBob,
      });
      const bobMembership = bobMemberships.find((m) =>
        m.community === communityId
      );
      assertEquals(
        bobMembership,
        undefined,
        "Bob should no longer be a member",
      );

      // Alice is now the only admin. She tries to demote herself. This should fail.
      const aliceMembershipId = await getMembershipId(userAlice, communityId);
      assertExists(aliceMembershipId);

      console.log(
        "\nAction: setMemberRole (Alice demotes herself as last admin)",
      );
      const demoteFail = await communityConcept.setMemberRole({
        membership: aliceMembershipId,
        newRole: "MEMBER",
        requester: userAlice,
      });
      console.log("Result:", demoteFail);
      assert("error" in demoteFail, "Expected demotion of last admin to fail");
      assertEquals(
        demoteFail.error,
        "Cannot demote yourself from ADMIN to MEMBER when you are the only ADMIN.",
      );

      // Alice invites Bob back and promotes him to admin, then successfully demotes herself.
      await communityConcept.addMember({
        community: communityId,
        user: userBob,
        inviter: userAlice,
      });
      const bobMembershipId = await getMembershipId(userBob, communityId);
      assertExists(bobMembershipId);
      await communityConcept.setMemberRole({
        membership: bobMembershipId,
        newRole: "ADMIN",
        requester: userAlice,
      });

      console.log(
        "\nAction: setMemberRole (Alice demotes herself with another admin present)",
      );
      const demoteSuccess = await communityConcept.setMemberRole({
        membership: aliceMembershipId,
        newRole: "MEMBER",
        requester: userAlice,
      });
      console.log("Result:", demoteSuccess);
      assertEquals(
        demoteSuccess,
        {},
        "Expected demotion to succeed with another admin present",
      );

      const updatedAliceMembership = await communityConcept._getMembershipById({
        membership: aliceMembershipId,
      });
      assertEquals(
        updatedAliceMembership?.role,
        "MEMBER",
        "Alice should now be a MEMBER",
      );
      console.log("--- Self-Removal and Last Admin Rule Test Passed ---");
    },
  );

  await t.step(
    "Interesting Scenario 3: Duplicate and Invalid Data",
    async () => {
      console.log("\n--- Testing Duplicate and Invalid Data ---");

      // Try to create a community with the same name.
      console.log("Action: createCommunity (Duplicate name)");
      const duplicateCreate = await communityConcept.createCommunity({
        name: "Deno Fans",
        description: "Another one.",
        creator: userCharlie,
      });
      console.log("Result:", duplicateCreate);
      assert(
        "error" in duplicateCreate,
        "Expected duplicate community creation to fail",
      );
      assertEquals(
        duplicateCreate.error,
        "A community with this name already exists.",
      );

      // Try to add Bob again, who is already a member.
      console.log("\nAction: addMember (Bob, already a member)");
      const duplicateAdd = await communityConcept.addMember({
        community: communityId,
        user: userBob,
        inviter: userBob, // Bob is now an admin
      });
      console.log("Result:", duplicateAdd);
      assert(
        "error" in duplicateAdd,
        "Expected adding an existing member to fail",
      );
      assertEquals(
        duplicateAdd.error,
        "User is already a member of this community.",
      );

      // Create a temporary second community.
      const tempCommunityResult = await communityConcept.createCommunity({
        name: "Node Fans",
        description: "Old school.",
        creator: userCharlie,
      });
      assert("community" in tempCommunityResult);

      // Try to update "Deno Fans" to have the name "Node Fans".
      console.log("\nAction: updateCommunityDetails (Name conflict)");
      const updateConflict = await communityConcept.updateCommunityDetails({
        community: communityId,
        newName: "Node Fans",
        newDescription: "Updated description",
        requester: userBob, // Bob is an admin
      });
      console.log("Result:", updateConflict);
      assert(
        "error" in updateConflict,
        "Expected update with name conflict to fail",
      );
      assertEquals(
        updateConflict.error,
        "A community with this name already exists.",
      );
      console.log("--- Duplicate and Invalid Data Test Passed ---");
    },
  );

  await t.step("Interesting Scenario 4: Deletion Cascade", async () => {
    console.log("\n--- Testing Deletion Cascade ---");

    // Verify current state: 2 communities ("Deno Fans", "Node Fans").
    // Memberships: Alice (MEMBER, Deno), Bob (ADMIN, Deno), Charlie (ADMIN, Node).
    const allCommunities = await communityConcept._getAllCommunities();
    const allMemberships = await communityConcept._getAllMemberships();
    assertEquals(allCommunities.length, 2);
    assertEquals(allMemberships.length, 3);

    console.log("Action: deleteCommunity (Bob deletes 'Deno Fans')");
    const deleteResult = await communityConcept.deleteCommunity({
      community: communityId,
      requester: userBob,
    });
    console.log("Result:", deleteResult);
    assertEquals(deleteResult, {}, "Expected community deletion to succeed");

    // Verify community and its memberships are gone.
    const deletedCommunity = await communityConcept._getCommunityById({
      community: communityId,
    });
    const deletedMemberships = await communityConcept
      ._getMembershipsByCommunity({ community: communityId });

    assertEquals(
      deletedCommunity,
      null,
      "The 'Deno Fans' community should be deleted",
    );
    assertEquals(
      deletedMemberships.length,
      0,
      "Memberships for 'Deno Fans' should be deleted",
    );

    // Verify the other community and its membership still exist.
    const remainingCommunities = await communityConcept._getAllCommunities();
    const remainingMemberships = await communityConcept._getAllMemberships();
    assertEquals(
      remainingCommunities.length,
      1,
      "Only 'Node Fans' community should remain",
    );
    assertEquals(
      remainingMemberships.length,
      1,
      "Only Charlie's membership should remain",
    );
    console.log("--- Deletion Cascade Test Passed ---");
  });

  // Close the database connection
  await client.close();
});
