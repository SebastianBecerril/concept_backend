---
timestamp: 'Fri Nov 07 2025 19:42:04 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_194204.7667d780.md]]'
content_id: e13b5ca4bb508e2fd3aeceb334a992bb788828f94ff618b063f7d67de2bcda44
---

# problem:

You're encountering two main TypeScript errors in your `userEnrollments.sync.ts` file:

1. **Query Return Type Mismatch:** The error regarding queries not returning arrays stems from a violation of a core rule in the concept implementation guidelines. The `Frames.query` method in the synchronization engine is designed to work with concept queries that **always** return an array of results, even if there's only one or zero matches. In your `UserEnrollmentsConcept.ts` file, the `_getEnrollmentById` query uses MongoDB's `findOne`, which returns a single object or `null`, not an array.

2. **Incorrect Type Inference:** The error `property owner does not exist on type {}` is a direct consequence of the first error. Because `_getEnrollmentById` returned an unexpected type (an object instead of an array), the `Frames.query` method failed to correctly process it. This broke TypeScript's type inference chain. As a result, when you try to access `$[enrollmentRecord]` inside the `.filter()` method, TypeScript doesn't know it's an `EnrollmentSchema` object; it infers a generic, empty type like `{}` or `unknown`, which doesn't have an `owner` property.
