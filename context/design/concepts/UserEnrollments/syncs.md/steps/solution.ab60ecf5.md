---
timestamp: 'Fri Nov 07 2025 19:42:04 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_194204.7667d780.md]]'
content_id: ab60ecf5646538aadc7dd95e2cb4d46b26413585280d29c495050ac2d9b46812
---

# solution:

The solution is to correct the implementation of the `UserEnrollmentsConcept` to ensure all its queries adhere to the framework's contract by returning an array. The synchronization file (`userEnrollments.sync.ts`) is written correctly and does not need to be changed.

By modifying `_getEnrollmentById` to return `EnrollmentSchema[]`, the `Frames.query` method will work as expected, correctly creating new frames and allowing TypeScript to infer the proper types, which resolves both errors simultaneously.

Here is the corrected version of your `UserEnrollmentsConcept.ts` file.
