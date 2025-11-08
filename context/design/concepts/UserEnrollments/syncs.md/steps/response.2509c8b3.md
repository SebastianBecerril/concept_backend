---
timestamp: 'Fri Nov 07 2025 19:44:33 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_194433.09a54732.md]]'
content_id: 2509c8b3cb8c9cc9c1f1b51a86e01873c44444205f03cf65eeb9ad704cfa9c02
---

# response:

You are absolutely right to point that out, and my apologies. The issue is cascading. You fixed the query in `UserEnrollmentsConcept`, but the error is happening because another query in the same chain, `UserAuthentication._isValidSession`, also violates the "queries must return an array" rule.

When the first `.query()` in the chain breaks this rule, it corrupts the `frames` object, and TypeScript loses all the type information for subsequent operations. This is why you're still seeing the `owner` error, even though the `_getEnrollmentById` query is now correct.
