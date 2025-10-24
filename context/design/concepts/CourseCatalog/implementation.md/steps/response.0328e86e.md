---
timestamp: 'Thu Oct 23 2025 21:52:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251023_215222.2d12ffb5.md]]'
content_id: 0328e86ef0ac86130b4f4f337f9d111715ddcda02089ad6d78ded656a17e2df6
---

# response:

Excellent question. This gets to the very heart of the difference between traditional data modeling and the specific philosophy of Concept Design.

To answer you directly:

**Yes, to be truly compliant with the principles of Concept Design as laid out in the documentation, you absolutely should get rid of the two-way relationships.**

While you *could* make it work with bidirectional links, doing so fundamentally undermines the core benefits that the methodology aims to provide. It's not just a minor style preference; it's a decision that directly conflicts with the foundational goals of the approach.

Let's break down exactly *why*, using the principles from the document you're working from.

### 1. Conflict with "Improved separation of concerns resulting in simpler and more robust design"

This is the most important principle your current model violates.

* **What is the "concern" of a Term?** A Term's essential concern is its own identity and name (e.g., "Fall 2024").
* **What is the "concern" of a Course?** A Course's concern is its identity, its details (name, number), and its relationship *to a Term*.

By adding `courses: ID[]` to the `TermSchema`, you are mixing concerns. The `Term` document is now responsible for two things:

1. Defining itself.
2. Keeping an accurate list of all `Course` documents that point to it.

The relationship (`belongs to`) is already perfectly and non-redundantly captured in the `Course` document (`term: ID`). Storing it a second time in the `Term` document complicates its concern. **A simpler design is one where a relationship is stored in exactly one place.**

### 2. Conflict with "Atomic Actions"

The provided text emphasizes that concepts interact through **atomic actions**. Your action implementations should strive to be as atomic as possible (ideally, a single database operation).

Let's look at the action `deleteCourse(course: Course)`:

* **With your current model (bidirectional):** This action requires *two* separate, non-atomic database operations:
  1. `this.courses.deleteOne({ _id: course._id })`
  2. `this.terms.updateOne({ _id: course.term }, { $pull: { courses: course._id } })`
     What happens if operation #1 succeeds but #2 fails (due to a network blip, for instance)? You now have a "dangling reference." Your `Term` document incorrectly claims a `Course` exists when it doesn't. Your database is in an **inconsistent state**. This is the definition of a non-robust design.

* **With the proposed model (unidirectional):** The action is a **single, atomic database operation**:
  1. `this.courses.deleteOne({ _id: course._id })`
     That's it. The system remains perfectly consistent. This is inherently **simpler and more robust**.

### 3. Conflict with "Simpler Implementation"

Every action that creates, deletes, or *moves* a relationship becomes more complex with bidirectional links.

Consider an action you haven't defined yet, but might need: `moveCourseToNewTerm(course: Course, newTerm: Term)`.

* **With your current model:** This would be a three-step nightmare.
  1. Update the `term` field in the `Course` document.
  2. `$pull` the course ID from the old `Term`'s `courses` array.
  3. `$push` the course ID to the new `Term`'s `courses` array.
     This is complex, error-prone, and requires a transaction to be truly atomic.

* **With the proposed model:** It's one simple, atomic update.
  1. `this.courses.updateOne({ _id: course._id }, { $set: { term: newTerm._id } })`

### Analogy: A File System

Think of your database collections like a file system.

* A file's path (`/documents/reports/report.docx`) tells you exactly which folders it belongs to. The file "knows" its parent.
* A folder (`/documents/reports/`) does **not** contain a hardcoded list of every file inside it. To find the files, you simply *ask* the system: "Show me all files whose path starts with `/documents/reports/`".

Your proposed model is the file system model. The `Course` (the file) knows its `Term` (the folder). To find all courses in a term, you just ask the `courses` collection: `this.courses.find({ term: termId })`. This is efficient (with an index), simple, and always consistent.

### Conclusion

So, is it *possible* to write code with two-way relationships? Yes. But in doing so, you are actively choosing a design that is:

* Less simple.
* Less robust.
* More complex to implement and maintain.
* Prone to data inconsistency.

You would be fighting against the very grain of Concept Design, which explicitly states its goal is to achieve the opposites of those traits. Therefore, to be compliant with the *spirit and intent* of the methodology, you should model relationships unidirectionally from child to parent.
