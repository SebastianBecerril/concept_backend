---
timestamp: 'Fri Nov 07 2025 20:23:47 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_202347.cfddf6c9.md]]'
content_id: 80ba61b128685f3ce18121152c06d7273b8fecbdfc73f13440ae1d1d31a665ec
---

# file: src\syncs\userProfile.sync.ts

```typescript
import { Requesting, UserAuthentication, UserProfile } from "@concepts";
import { actions, Sync } from "@engine";
import { ID } from "@utils/types.ts";

/**
 * =============================================================================
 * SYNC 1: Automatic Profile Creation
 *
 * This sync automatically creates a basic UserProfile whenever a new user
 * successfully registers. This ensures every user has a profile from the start.
 * =============================================================================
 */
export const AutoCreateProfileOnRegistration: Sync = ({ user, username }) => ({
  when: actions([UserAuthentication.register, { username }, { user }]),
  then: actions([UserProfile.createProfile, { user, displayName: username }]),
});

/**
 * =============================================================================
 * SYNC 2: Handle Request to Create a Profile
 *
 * This handles the direct API request to create a profile for an authenticated
 * user who might not have one. It assumes the user is logged in and provides
 * their session ID.
 * =============================================================================
 */
export const CreateProfileRequest: Sync = ({ request, session, user, displayName }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/UserProfile/createProfile", session, displayName },
    { request },
  ]),
  where: async (frames) => {
    // Authorize: Get the user associated with the session
    return await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { user });
  },
  then: actions([
    UserProfile.createProfile,
    { user, displayName },
  ]),
});

export const CreateProfileResponse: Sync = ({ request, profile }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}, { profile }],
  ),
  then: actions([Requesting.respond, { request, profile }]),
});

export const CreateProfileErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * =============================================================================
 * SYNC 3: Handle Request to Update Display Name
 *
 * This handles an authenticated request to update a user's display name.
 * It verifies that the requester owns the profile they are trying to modify.
 * =============================================================================
 */
export const UpdateDisplayNameRequest: Sync = ({ request, session, profile, newDisplayName, requester, profileDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/UserProfile/updateDisplayName", session, profile, newDisplayName },
    { request },
  ]),
  where: async (frames) => {
    // Authorize: Get requester's user ID from session
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { requester });
    // Get the profile document to check its owner
    frames = await frames.query(UserProfile._getProfileById, { profile }, { profileDoc });
    // Ensure the requester is the owner of the profile
    return frames.filter(($) => {
      const doc = $[profileDoc] as { user: ID } | undefined;
      return doc !== undefined && doc.user === $[requester];
    });
  },
  then: actions([
    UserProfile.updateDisplayName,
    { profile, newDisplayName },
  ]),
});

export const UpdateDisplayNameResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/updateDisplayName" }, { request }],
    [UserProfile.updateDisplayName, {}, {}], // Success returns an empty object
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const UpdateDisplayNameErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/updateDisplayName" }, { request }],
    [UserProfile.updateDisplayName, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * =============================================================================
 * SYNC 4: Handle Request to Update Bio
 *
 * This handles an authenticated request to update a user's bio.
 * It verifies that the requester owns the profile.
 * =============================================================================
 */
export const UpdateBioRequest: Sync = ({ request, session, profile, newBio, requester, profileDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/UserProfile/updateBio", session, profile, newBio },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { requester });
    frames = await frames.query(UserProfile._getProfileById, { profile }, { profileDoc });
    return frames.filter(($) => {
      const doc = $[profileDoc] as { user: ID } | undefined;
      return doc !== undefined && doc.user === $[requester];
    });
  },
  then: actions([UserProfile.updateBio, { profile, newBio }]),
});

export const UpdateBioResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/updateBio" }, { request }],
    [UserProfile.updateBio, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const UpdateBioErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/updateBio" }, { request }],
    [UserProfile.updateBio, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * =============================================================================
 * SYNC 5: Handle Request to Update Thumbnail Image
 *
 * This handles an authenticated request to update a user's thumbnail image URL.
 * It verifies that the requester owns the profile.
 * =============================================================================
 */
export const UpdateThumbnailImageRequest: Sync = ({ request, session, profile, newThumbnailImageURL, requester, profileDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/UserProfile/updateThumbnailImage", session, profile, newThumbnailImageURL },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { requester });
    frames = await frames.query(UserProfile._getProfileById, { profile }, { profileDoc });
    return frames.filter(($) => {
      const doc = $[profileDoc] as { user: ID } | undefined;
      return doc !== undefined && doc.user === $[requester];
    });
  },
  then: actions([
    UserProfile.updateThumbnailImage,
    { profile, newThumbnailImageURL },
  ]),
});

export const UpdateThumbnailImageResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/updateThumbnailImage" }, { request }],
    [UserProfile.updateThumbnailImage, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const UpdateThumbnailImageErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/updateThumbnailImage" }, { request }],
    [UserProfile.updateThumbnailImage, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * =============================================================================
 * SYNC 6: Handle Request to Delete Profile
 *
 * This handles an authenticated request to delete a user's profile.
 * It verifies that the requester owns the profile.
 * =============================================================================
 */
export const DeleteProfileRequest: Sync = ({ request, session, profile, requester, profileDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/UserProfile/deleteProfile", session, profile },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(UserAuthentication._getUserForSession, { sessionId: session }, { requester });
    frames = await frames.query(UserProfile._getProfileById, { profile }, { profileDoc });
    return frames.filter(($) => {
      const doc = $[profileDoc] as { user: ID } | undefined;
      return doc !== undefined && doc.user === $[requester];
    });
  },
  then: actions([UserProfile.deleteProfile, { profile }]),
});

export const DeleteProfileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/deleteProfile" }, { request }],
    [UserProfile.deleteProfile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeleteProfileErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/UserProfile/deleteProfile" }, { request }],
    [UserProfile.deleteProfile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
