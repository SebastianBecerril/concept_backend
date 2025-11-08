---
timestamp: 'Fri Nov 07 2025 19:41:17 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_194117.a0563489.md]]'
content_id: 598fa19e8bb3a5b11e7966c6c2bf61b58b8f2921660f92f2d256deaf22e2c23e
---

# prompt: In lines like this frames = await frames.query(UserAuthentication.\_isValidSession, { sessionId }, { user }); frames = await frames.query(UserEnrollments.\_getEnrollmentById, { enrollment }, { enrollmentRecord }); eturn frames.filter(($) => $\[enrollmentRecord]?.owner === $\[user]); I get two types of errors: I get an error in the queries because they do not return arrays and then for owner it says that property owner does not exist on type {}. how do i fix this
