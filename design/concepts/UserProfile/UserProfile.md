### concept UserProfile \[User, ]

*   **purpose**
    Store and manage user-specific descriptive information, distinct from authentication credentials.
*   **principle**
    After a user is created, their profile can be initialized and updated, allowing others to view their descriptive details.
*   **state**
    *   a set of Profiles with
        *   a `user` User
        *   a `displayName` String
        *   an optional `bio` String
        *   an optional `thumbnailImageURL` String
*   **actions**
    *   `createProfile(user: User, displayName: String): (profile: Profile)`
        *   **requires** `user` exists, no `Profile` already exists for `user`, `displayName` is non-empty
        *   **effect** creates a new `Profile` for `user` with the given `displayName`
    *   `updateDisplayName(profile: Profile, newDisplayName: String): ()`
        *   **requires** `profile` exists, `newDisplayName` is non-empty
        *   **effect** updates `profile.displayName` to `newDisplayName`
    *   `updateBio(profile: Profile, newBio: String): ()`
        *   **requires** `profile` exists
        *   **effect** updates `profile.bio` to `newBio`
    *   `updateThumbnailImage(profile: Profile, newThumbnailImageURL: String): ()`
        *   **requires** `profile` exists
        *   **effect** updates `profile.thumbnailImageURL` to `newThumbnailImageURL`
    * `deleteProfile(profile: Profile): ()`
        *   **requires** `profile` exists
        *   **effect** deletes `profile` from the set