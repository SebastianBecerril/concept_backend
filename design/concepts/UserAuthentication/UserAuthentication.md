### concept UserAuthentication

*   **purpose**
    Identify users and manage their access credentials.
*   **principle**
    After a user registers with unique credentials, they can log in to prove their identity, establishing an authenticated session for further interactions.
*   **state**
    *   a set of Users with
        *   a `username` String
        *   a `password` String
        *   a `registrationDate` DateTime
    *   a set of ActiveSessions with
        *   a `user` User
        *   a `sessionId` String
        *   a `creationTime` DateTime
        *   an `expiryTime` DateTime
*   **actions**
    *   `register(username: String, password: String): (user: User)`
        *   **requires** `username` is unique, `password` meets strength requirements
        *   **effect** creates a new `User` with the given `username` and a  `password`
    *   l`ogin(username: String, password: String): (user: User, sessionId: String)`
        *   **requires** `username` and `password` match an existing `User`
        *   **effect** creates a new `ActiveSession` for the matched `User` with a unique `sessionId` and `expiryTime`, returning the `User` and `sessionId`
    *   `logout(sessionId: String): ()`
        *   **requires** `sessionId` matches an existing `ActiveSession`
        *   **effect** removes the `ActiveSession`
    *   `system invalidateExpiredSessions(): ()`
        *   **requires** an `ActiveSession` exists where `currentTime` is after `expiryTime`
        *   **effect** removes all `ActiveSessions` where `currentTime` is after `expiryTime`