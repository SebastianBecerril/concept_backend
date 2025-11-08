---
timestamp: 'Fri Nov 07 2025 19:44:33 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_194433.09a54732.md]]'
content_id: 6691c80ba6140f7aded9fd37aa0b0f3133f8d960092318f2e67f25be9fb20c4e
---

# problem:

1. **`UserAuthentication._isValidSession` is not returning an array:** Just like the original problem in `UserEnrollmentsConcept`, your `UserAuthentication` concept likely has a query that uses `findOne` and returns a single session object or `null` instead of an array.
2. **Cascading Type Error:** Because the first query (`_isValidSession`) breaks the contract, the type inference for the entire `where` clause fails. When your code gets to the second query (`_getEnrollmentById`), TypeScript no longer knows that `enrollmentRecord` should be an `EnrollmentSchema`. It defaults to a generic `{}`, which doesn't have an `.owner` property, causing the second error.
