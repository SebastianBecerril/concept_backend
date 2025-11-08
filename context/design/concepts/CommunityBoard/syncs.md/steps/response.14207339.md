---
timestamp: 'Fri Nov 07 2025 20:27:00 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251107_202700.30172c1d.md]]'
content_id: 142073394bd2a41a6d4252c647c36501a1f05d76cb05012f41554a5558e13b2c
---

# response:

Excellent question. This is a perfect example of the framework's "intentional design" philosophy in action. Let's break down exactly what that warning means and how to fix it correctly.

### The "What": What does "UNVERIFIED ROUTE" mean?

This warning is a helpful and important security feature from the `Requesting` concept. It means:

1. The system automatically scanned your `CommunityBoardConcept.ts` file.
2. It discovered a new public method that could be an API endpoint: `_getReplyById`.
3. It generated the potential route for it: `/api/CommunityBoard/_getReplyById`.
4. It then checked the `passthrough.ts` configuration file and found that this new route is **not listed in either the `inclusions` or the `exclusions` array.**

The system is essentially saying, "I've found a new door to the application. I'm not going to let anyone use it until you explicitly tell me whether to lock it (`exclusions`) or leave it open to the public (`inclusions`)."

### The "Why": Why did this happen?

This happened because you just added the `_getReplyById` query to your `CommunityBoardConcept.ts` file to support the `DeleteOwnReplyRequest` synchronization. Every time you add a new action or query to a concept, the `Requesting` concept will discover it and require you to classify it.

### The "How to Fix": The Decision You Need to Make

You have two choices, and the correct one depends on the intended purpose of the `_getReplyById` query.

**Option 1: Make it Publicly Accessible**

If you want any user or client application to be able to fetch a reply directly just by knowing its ID, you would add it to the `inclusions` list. This is rare for a query this specific.

**Option 2: Keep it Private / For Internal Use**

If the query's main purpose is to be used *by other synchronizations* (which is exactly why you created it) and it should **not** be an exposed public API endpoint, you must add it to the `exclusions` list.

### Recommendation

**Choose Option 2: Add it to the `exclusions` list.**

The `_getReplyById` query is an internal implementation detail needed to securely authorize a deletion. There is no user-facing scenario where someone should be able to call this endpoint directly. Exposing it unnecessarily increases the surface area of your API. Keeping it private is the most secure and architecturally clean decision.

### The Corrected Code

Here is the updated `passthrough.ts` file with the required fix. I have added the new route to the `exclusions` list.
