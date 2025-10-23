---
timestamp: 'Thu Oct 23 2025 13:00:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_130039.46b009d7.md]]'
content_id: 30dc042f424371b69ee4ce6243d97871c771594786696f31d39eab72e1a80b05
---

# file: src/concepts/UserProfile/UserProfileConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { freshID } from "@utils/database.ts";
import { Empty, ID } from "@utils/types.ts";

interface ProfileSchema {
  _id: ID;
  user: ID;
  displayName: string;
  bio?: string;
  thumbnailImageURL?: string;
}

/**
 * @concept UserProfile
 * @purpose Store and manage user-specific descriptive information, distinct from authentication credentials.
 * @principle Users can create a profile with a display name, then update their profile information
 *   including bio and thumbnail image, establishing their public identity for the platform.
 */
export default class UserProfileConcept {
  private static readonly PREFIX = "UserProfile" + ".";

  /**
 * @state
 * a set of Profiles with
 *   a `user` ID
 *   a `displayName` String
 *   an optional `bio` String
 *   an optional `thumbnailImageURL` String
 */
  profiles: Collection<ProfileSchema>;

  constructor(private readonly db: Db) {
    this.profiles = this.db.collection(UserProfileConcept.PREFIX + "profiles");

    this.profiles.createIndex({ user: 1 }, { unique: true })
      .catch(console.error);
  }

  /**
   * @action createProfile
   * @requires `user` exists, no `ID` already exists for `user`, `displayName` is non-empty
   * @effects creates a new `ID` for `user` with the given `displayName`
   * @param {ID} user - The user ID to create a profile for.
   * @param {string} displayName - The display name for the profile.
   * @returns {{ profile: ID } | { error: string }} The profile ID or an error message.
   */
  async createProfile(
    { user, displayName }: { user: ID; displayName: string },
  ): Promise<{ profile: ID } | { error: string }> {
    if (!displayName || displayName.trim().length === 0) {
      return { error: "Display name cannot be empty." };
    }

    try {
      // The unique index on 'user' will prevent duplicates
      const existingProfile = await this._getProfileByUser({ user });
      if (existingProfile) {
        return { error: "A profile for this user already exists." };
      }

      const newProfile: ProfileSchema = {
        _id: freshID() as ID,
        user,
        displayName,
      };

      await this.profiles.insertOne(newProfile);
      return { profile: newProfile._id };
    } catch (e) {
      console.error("Unexpected error in createProfile:", e);
      return { error: "An unexpected database error occurred." };
    }
  }

  /**
   * @action updateDisplayName
   * @requires `profile` exists, `newDisplayName` is non-empty
   * @effects updates `profile.displayName` to `newDisplayName`
   * @param {ID} profile - The profile ID to update.
   * @param {string} newDisplayName - The new display name.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateDisplayName(
    { profile, newDisplayName }: { profile: ID; newDisplayName: string },
  ): Promise<Empty | { error: string }> {
    if (!newDisplayName || newDisplayName.trim().length === 0) {
      return { error: "Display name cannot be empty." };
    }
    const result = await this.profiles.updateOne({ _id: profile }, {
      $set: { displayName: newDisplayName },
    });
    if (result.matchedCount === 0) {
      return { error: "ID not found." };
    }
    return {};
  }

  /**
   * @action updateBio
   * @requires `profile` exists
   * @effects updates `profile.bio` to `newBio`
   * @param {ID} profile - The profile ID to update.
   * @param {string} newBio - The new bio text.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateBio(
    { profile, newBio }: { profile: ID; newBio: string },
  ): Promise<Empty | { error: string }> {
    const result = await this.profiles.updateOne({ _id: profile }, {
      $set: { bio: newBio },
    });
    if (result.matchedCount === 0) {
      return { error: "ID not found." };
    }
    return {};
  }

  /**
   * @action updateThumbnailImage
   * @requires `profile` exists
   * @effects updates `profile.thumbnailImageURL` to `newThumbnailImageURL`
   * @param {ID} profile - The profile ID to update.
   * @param {string} newThumbnailImageURL - The new thumbnail image URL.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async updateThumbnailImage(
    { profile, newThumbnailImageURL }: {
      profile: ID;
      newThumbnailImageURL: string;
    },
  ): Promise<Empty | { error: string }> {
    const result = await this.profiles.updateOne({ _id: profile }, {
      $set: { thumbnailImageURL: newThumbnailImageURL },
    });
    if (result.matchedCount === 0) {
      return { error: "ID not found." };
    }
    return {};
  }

  /**
   * @action deleteProfile
   * @requires `profile` exists
   * @effects deletes `profile` from the set
   * @param {ID} profile - The profile ID to delete.
   * @returns {Empty | { error: string }} An empty object on success, or an error message.
   */
  async deleteProfile(
    { profile }: { profile: ID },
  ): Promise<Empty | { error: string }> {
    const result = await this.profiles.deleteOne({ _id: profile });
    if (result.deletedCount === 0) {
      return { error: "ID not found." };
    }
    return {};
  }

  // QUERIES

  /**
   * @query _getProfileById
   * Retrieves a profile by its unique ID.
   * @param {ID} profile - The profile ID to query.
   * @returns {ProfileSchema | null} The profile if found, otherwise null.
   */
  async _getProfileById({
    profile,
  }: {
    profile: ID;
  }): Promise<ProfileSchema | null> {
    return this.profiles.findOne({ _id: profile });
  }

  /**
   * @query _getProfileByUser
   * Retrieves a profile by its associated user ID.
   * @param {ID} user - The user ID to query.
   * @returns {ProfileSchema | null} The profile if found, otherwise null.
   */
  async _getProfileByUser({
    user,
  }: {
    user: ID;
  }): Promise<ProfileSchema | null> {
    return this.profiles.findOne({ user });
  }
}

```
