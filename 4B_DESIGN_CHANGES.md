# Backend Changes Made for Assignment 4B

I made minimal changes to my backend. The following are the changes that I made:
- **Implemented CommunityBoard concept and tests:** I was not able to get this done during assignment 4a, so I finalized this implementation and testing suite through the use of Context for its use in my frontend.
- **Adjusted logic in Community concept:** I ran into a bug where once a user created a community, sometimes they would not be automatically added. As such, I made some changes to the `createCommunity` action defined in my Community concept implementation.
- **New Queries in Course Catalog Concept:** I realized that I needed a couple of new queries in order to make my frontend implementation easier and more concise. Because of this, I added the `_getSectionsbyId`, `_getCourseById`, and `_getSectionsForCourse` queries.