---
timestamp: 'Tue Oct 21 2025 15:39:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_153928.20eb904a.md]]'
content_id: f8f6ca1debf93053a27892c34caf7f2106b26063bb92386f0c25779bb0472fe2
---

# response:

That's a very insightful question, and it gets to the heart of why concept design emphasizes strict independence and separation of concerns.

### Part 1: Combining into One Concept - Feasibility and Practicality

**Is it possible?** Yes, it is *technically possible* to merge the responsibilities of data storage and external synchronization into a single `CourseCatalog` concept.

**Is it practical in concept design?** **Generally, no, it is not practical or recommended within the concept design methodology.** Doing so undermines the core principles and benefits of concept design.

Let's break down why, referencing the Concept Design Rubric:

1. **Independence (Critical Failure):**
   * **Criterion:** "Concepts are fully independent of each other, and can therefore be understood and used independently of one another."
   * **Problem with combination:** A combined concept would directly refer to and depend on the external API's schema, endpoints, and behavior (e.g., rate limits, error codes). It could not be understood or reused without knowing these external specifics. Your `CourseCatalog` would cease to be an abstract catalog of courses and become an "MIT Hydrant Catalog."
   * **Evidence of failing:** The concept's purpose or actions would inevitably mention "fetching from MIT Hydrant" or "parsing Hydrant API response."

2. **Separation of Concerns (Critical Failure):**
   * **Criterion:** "Concept does not conflate two concerns that could be broken into separate concepts that could be reused independently of one another."
   * **Problem with combination:** Storing and providing access to academic data is one concern. Interacting with and synchronizing from an external, potentially changing, data source is a distinctly separate concern. These can be, and ideally should be, reused independently.
   * **Example Failing:** "The state admits a factoring into two or more independent parts" (e.g., catalog data vs. sync status, external IDs). Or "The concept contains references to external objects and stores properties of them that are not needed for this concept" (e.g., storing the last successful sync timestamp *within* the `Term` object, which is purely a catalog item).

3. **Completeness (Compromised):**
   * **Criterion:** "Each concept provides a complete and coherent unit of functionality that delivers the value described in the purpose without the help of other concepts."
   * **Problem with combination:** While it might seem complete, the *purpose* would become diluted. Is its purpose to *be* a catalog, or to *maintain a sync'd catalog*? The latter is more complex and less universally applicable. The "catalog" aspect would be less complete if it also had to handle the intricacies of sync.

4. **Purpose & Principle (Diluted):**
   * The purpose would become "Keep a catalog of terms, courses, and sections, *and actively maintain it by syncing with an external API*." This conflates "what it is" with "how it's maintained."
   * The principle would become a very long, multi-step scenario trying to cover both the state's utility and the sync process, making it less archetypal and harder to grasp.

**What a combined concept might look like (and why it's problematic):**

If we were to force this, the `CourseCatalog` concept might look something like this:

### concept CourseCatalog (Combined, *Not Recommended*)

* **purpose**
  Provide a current registry of academic terms, courses, and sections, **actively synchronized with an external academic course data source for up-to-date information.**
* **principle**
  An administrator requests a sync for a term, **which triggers the concept to fetch external course data**, compare it with existing local data, and then create, update, or delete terms, courses, and sections to reflect the external source, allowing users and other concepts to reliably access the latest catalog information.
* **state**
  * a set of Terms with
    * an externalId String
    * a name String
    * a lastSyncTime DateTime (problematic, mixed concern)
    * a syncStatus of PENDING or SYNCING or COMPLETED or FAILED (problematic, mixed concern)
    * a set of Courses
  * ... (Courses and Sections would also need `externalId` and potentially other sync-related metadata)
* **actions**
  * **createTerm(externalId: String, name: String): (term: Term)**
    * **(existing logic)**
  * **updateTerm(term: Term, newName: String): ()**
    * **(existing logic)**
  * **deleteTerm(term: Term): ()**
    * **(existing logic)**
  * **createCourse(...): (course: Course)**
    * **(existing logic)**
  * **updateCourse(...): ()**
    * **(existing logic)**
  * **deleteCourse(...): ()**
    * **(existing logic)**
  * **createSection(...): (section: Section)**
    * **(existing logic)**
  * **updateSection(...): ()**
    * **(existing logic)**
  * **deleteSection(...): ()**
    * **(existing logic)**
  * **initiateExternalSync(termExternalId: String): (syncResult: SyncStatus)**
    * **requires** `termExternalId` is valid, and no sync for it is currently `SYNCING`
    * **effect** Fetches data from external API, transforms it, compares with existing data, and creates/updates/deletes `Term`s, `Course`s, and `Section`s. Updates the `syncStatus` and `lastSyncTime` of the `Term`.
    * *(This action would be massive and complex, violating "balanced attention to behavioral detail" by doing too much in one action.)*

**Why this combined version is worse:**

* The `Term` object in the state now contains synchronization metadata (`lastSyncTime`, `syncStatus`). This blurs its identity as purely an academic term. If you wanted to reuse `CourseCatalog` for a manual data entry system, these fields would be irrelevant.
* The `initiateExternalSync` action would be immensely complex, involving network requests, data parsing, comparison logic, and cascading updates/deletions across multiple entity types. This makes the concept difficult to read, understand, test, and maintain.
* If the external API changes, this *entire concept* might need to be rewritten, rather than just a dedicated `ExternalCatalogSync` concept and its associated API client/transformer.

**Recommendation:** Stick with the two-concept approach (`CourseCatalog` for data storage, `ExternalCatalogSync` for external integration). It's cleaner, more modular, more robust, and fully aligns with concept design principles.

***

### Part 2: Research on MIT Course Catalog API Options

You're right to ask about the API! Many universities, including MIT, don't provide a single, well-documented, public REST API for their entire course catalog that's designed for external, third-party developers. They usually have:

1. **Public-facing websites:** These are designed for human browsing (e.g., [catalog.mit.edu](https://catalog.mit.edu/) for general catalog info, [student.mit.edu/schedules](https://student.mit.edu/schedules) for semester schedules). While you *could* scrape these, it's brittle and prone to breaking with any UI changes.
2. **Internal APIs:** Many university-developed tools (like Hydrant, CourseRoad, OpenGrades mentioned by you) likely leverage internal APIs or direct database access that is available to MIT-affiliated systems and developers. These are generally not exposed publicly for security, stability, and resource reasons.
3. **Data Exports/Feeds:** Sometimes universities provide periodic data exports (e.g., CSV, XML, JSON files) for approved partners or internal use. These are typically not real-time but can be a stable source.

**Specific to MIT:**

From my research, there isn't an official, public, documented REST API that allows arbitrary external developers to pull the entire, up-to-the-minute MIT course catalog data (terms, courses, sections, times, locations, instructors) programmatically.

The tools you mentioned (`Hydrant`, `CourseRoad`, `OpenGrades`) are likely using either:

* **Internal MIT data sources:** This is the most probable scenario, given the real-time scheduling information Hydrant displays. These tools are built by or for MIT students/departments and have privileged access.
* **Sophisticated web scraping:** While possible, maintaining a scraper for real-time schedule changes across all sections is a significant engineering challenge and prone to breakage.

**Therefore, for your project, you have a few practical options depending on your context:**

1. **Hypothetical API (Recommended for Concept Design):** For the purpose of concept design, you should *design as if* a robust, well-structured API exists. This is what we did in the `ExternalCatalogSync` concept by assuming `rawTermData: JSON` and then transforming it. This allows you to focus on the *behavior* of synchronization rather than the *implementation details* of web scraping or internal access. The API schema used in the `ExternalCatalogSync` concept's explanation (with `externalId`, `name`, `courseNumber`, etc.) is a good example of what a clean, hypothetical API *would* provide.

2. **Web Scraping (Publicly Accessible, but Complex and Fragile):**
   * **Mechanism:** You would use a library (e.g., Python's Beautiful Soup + Requests, Node.js's Puppeteer or Cheerio) to fetch and parse the HTML from pages like `catalog.mit.edu` and individual course/section pages.
   * **Pros:** No special access needed.
   * **Cons:** Very sensitive to website layout changes, often slow, can be seen as an abuse of resources if not done carefully, and parsing dates/times from varied HTML formats can be tricky. It's generally a last resort for production systems.

3. **Internal MIT Access (If Applicable):**
   * If you are an MIT student or have an MIT affiliation and are developing this project within MIT's ecosystem, you might be able to inquire about internal data feeds or APIs. This would be the most reliable and efficient method.

**What kind of API structure should you imagine?**

For concept design, imagine a RESTful API with endpoints like these:

* `GET /terms`: Returns a list of available academic terms (e.g., Fall 2024, Spring 2025).
  ```json
  [
    {"id": "FA2024", "name": "Fall 2024"},
    {"id": "SP2025", "name": "Spring 2025"}
  ]
  ```
* `GET /terms/{termId}/courses`: Returns all courses for a specific term.
  ```json
  [
    {
      "id": "6.0001",
      "number": "6.0001",
      "name": "Introduction to Computer Science and Programming in Python",
      "department": "EECS",
      "description": "...",
      "sections_url": "/terms/FA2024/courses/6.0001/sections"
    },
    // ... other courses
  ]
  ```
* `GET /terms/{termId}/courses/{courseId}/sections`: Returns all sections for a specific course in a term.
  ```json
  [
    {
      "id": "L01",
      "classType": "Lecture",
      "days": ["M", "W"],
      "startTime": "10:00",
      "endTime": "11:30",
      "location": "32-155",
      "instructor": "Prof. Smith"
    },
    {
      "id": "R01",
      "classType": "Recitation",
      "days": ["F"],
      "startTime": "14:00",
      "endTime": "15:00",
      "location": "32-141",
      "instructor": "TA Jones"
    }
    // ... other sections
  ]
  ```

This hypothetical structure aligns perfectly with the `ExternalCatalogSync` concept's role in fetching `rawTermData` and transforming it into your `CourseCatalog`'s state. You can assume this type of API exists for the purpose of your concept design.
