---
timestamp: 'Tue Oct 21 2025 13:15:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_131539.cbcc4e8a.md]]'
content_id: 4253efc528c6d3943375ac8780c99f53bd29d4ac09b72e84a8a6729b519a98ec
---

# response:

Here are the concept specifications for the six concepts, designed to be independent, complete, and adhere to the rubric, incorporating the improvements and the new `Community`, `UserAuthentication`, and `UserProfile` concepts.

***

### concept CourseCatalog

* **purpose**\
  Provide a comprehensive and current registry of academic terms, courses, and sections for reference and use.
* **principle**\
  After an administrator creates terms, courses, and their sections, the catalog offers these details for lookup by name or number.
* **state**
  * a set of Terms with
    * a name String
  * a set of Courses with
    * a term Term
    * a courseNumber String
    * a courseName String
    * a department String
  * a set of Sections with
    * a course Course
    * a classType String
    * a days set of Strings
    * a startTime DateTime
    * an endTime DateTime
    * a location String
    * an instructor String
* **actions**
  * **createTerm(name: String): (term: Term)**
    * **requires** a term with `name` does not exist
    * **effect** creates a new `Term` with the given `name`
  * **updateTermName(term: Term, newName: String): ()**
    * **requires** `term` exists
    * **effect** updates the `name` of `term` to `newName`
  * **deleteTerm(term: Term): ()**
    * **requires** `term` exists, and no `Course` in `term` exists
    * **effect** removes the `term` from the set
  * **createCourse(term: Term, courseNumber: String, courseName: String, department: String): (course: Course)**
    * **requires** `term` exists, and a `Course` with `courseNumber` in `term` does not exist
    * **effect** creates a new `Course` associated with `term`
  * **updateCourseDetails(course: Course, newCourseNumber: String, newCourseName: String, newDepartment: String): ()**
    * **requires** `course` exists, a `Course` with `newCourseNumber` (if changed) in `course.term` does not already exist
    * **effect** updates the `courseNumber`, `courseName`, and `department` of `course`
  * **deleteCourse(course: Course): ()**
    * **requires** `course` exists, and no `Section` of `course` exists
    * **effect** removes the `course` from the set
  * **createSection(course: Course, classType: String, days: set of Strings, startTime: DateTime, endTime: DateTime, location: String, instructor: String): (section: Section)**
    * **requires** `course` exists
    * **effect** creates a new `Section` for `course`
  * **updateSectionDetails(section: Section, newClassType: String, newDays: set of Strings, newStartTime: DateTime, newEndTime: DateTime, newLocation: String, newInstructor: String): ()**
    * **requires** `section` exists
    * **effect** updates the `classType`, `days`, `startTime`, `endTime`, `location`, and `instructor` of `section`
  * **deleteSection(section: Section): ()**
    * **requires** `section` exists
    * **effect** removes the `section` from the set

***

### concept Community \[User]

* **purpose**\
  Group users into distinct social or organizational units and manage their membership and roles.
* **principle**\
  After a user creates a community, they can invite other users to join as members and assign roles, enabling structured interaction within that unit.
* **state**
  * a set of Communities with
    * a name String
    * a description String
    * a creationDate DateTime
  * a set of Memberships with
    * a user User
    * a community Community
    * a role of ADMIN or MEMBER
    * a joinDate DateTime
* **actions**
  * **createCommunity(name: String, description: String, creator: User): (community: Community)**
    * **requires** `name` is non-empty, a `Community` with `name` does not exist, `creator` exists
    * **effect** creates a new `Community` with the given `name` and `description`, and adds `creator` as an `ADMIN` `Membership` to this `Community`
  * **updateCommunityDetails(community: Community, newName: String, newDescription: String, requester: User): ()**
    * **requires** `community` exists, `requester` is an `ADMIN` member of `community`
    * **effect** updates the `name` and `description` of `community`
  * **addMember(community: Community, user: User, inviter: User): ()**
    * **requires** `community` exists, `user` exists, `inviter` exists, `user` is not already a member of `community`, `inviter` is an `ADMIN` member of `community`
    * **effect** creates a `Membership` for `user` in `community` with `MEMBER` role
  * **removeMember(community: Community, user: User, requester: User): ()**
    * **requires** `community` exists, `user` is a member of `community`, (`requester` is an `ADMIN` member of `community` OR `requester` is `user`)
    * **effect** removes the `Membership` of `user` from `community`
  * **setMemberRole(membership: Membership, newRole: Role, requester: User): ()**
    * **requires** `membership` exists, `newRole` is valid, `requester` is an `ADMIN` member of `membership.community`, `requester` is not attempting to demote themselves from `ADMIN` to `MEMBER` (unless there is another `ADMIN`)
    * **effect** updates `membership.role` to `newRole`
  * **deleteCommunity(community: Community, requester: User): ()**
    * **requires** `community` exists, `requester` is an `ADMIN` member of `community`, `community` has no `Memberships` (other than the `requester` if they are the sole admin)
    * **effect** removes `community` and all associated `Memberships`

***

### concept UserEnrollments \[User, Course, Section, Community]

* **purpose**\
  Enable users within a community to declare and manage their enrollment in specific course sections and control its visibility to other community members.
* **principle**\
  After a user adds an enrollment in a community, their registered courses and sections can be viewed by other community members, subject to visibility settings.
* **state**
  * a set of Enrollments with
    * an owner User
    * a community Community
    * a course Course
    * a section Section
    * a visibility of PUBLIC or PRIVATE
* **actions**
  * **addEnrollment(owner: User, community: Community, course: Course, section: Section, visibility: VISIBILITY): (enrollment: Enrollment)**
    * **requires** `owner` exists, `community` exists, `course` exists, `section` exists, `owner` is a member of `community`, and no `Enrollment` for `owner` in `course` within `community` exists
    * **effect** creates a new `Enrollment` for `owner` in `community` for `course` with `section` and `visibility`
  * **updateEnrollmentSection(enrollment: Enrollment, newSection: Section): ()**
    * **requires** `enrollment` exists, `newSection` exists, `newSection.course` is the same `Course` as `enrollment.course`
    * **effect** updates `enrollment.section` to `newSection`
  * **setEnrollmentVisibility(enrollment: Enrollment, newVisibility: VISIBILITY): ()**
    * **requires** `enrollment` exists, `newVisibility` is valid
    * **effect** updates `enrollment.visibility` to `newVisibility`
  * **removeEnrollment(enrollment: Enrollment): ()**
    * **requires** `enrollment` exists
    * **effect** deletes the `enrollment`

***

### concept CommunityBoard \[User, Course, Community]

* **purpose**\
  Provide a shared forum for community members to post and discuss academic or community-related topics.
* **principle**\
  After a user within a community creates a tagged posting (optionally linked to a course), other community members can reply, fostering focused discussion. Authors can edit or delete their contributions.
* **state**
  * a set of Postings with
    * an author User
    * a community Community
    * a title String
    * a body String
    * a tags set of Strings
    * an optional course Course
    * a set of Replies
  * a set of Replies with
    * an author User
    * a body String
* **actions**
  * **createPost(author: User, community: Community, title: String, body: String, tags: set of Strings, optional course: Course): (posting: Posting)**
    * **requires** `author` exists, `community` exists, `author` is a member of `community`, `body` is non-empty, `tags` are non-empty, `course` (if provided) exists
    * **effect** creates a new `Posting` in `community` authored by `author` with the given details
  * **updatePost(posting: Posting, newTitle: String, newBody: String, newTags: set of Strings, optional newCourse: Course, requester: User): ()**
    * **requires** `posting` exists, `requester` is `posting.author`, `newBody` is non-empty, `newTags` are non-empty, `newCourse` (if provided) exists
    * **effect** updates the `title`, `body`, `tags`, and `course` of `posting`
  * **replyToPost(posting: Posting, author: User, body: String): (reply: Reply)**
    * **requires** `posting` exists, `author` exists, `author` is a member of `posting.community`, `body` is non-empty
    * **effect** creates a new `Reply` on `posting` authored by `author`
  * **updateReply(reply: Reply, newBody: String, requester: User): ()**
    * **requires** `reply` exists, `requester` is `reply.author`, `newBody` is non-empty
    * **effect** updates the `body` of `reply`
  * **deletePost(posting: Posting, requester: User): ()**
    * **requires** `posting` exists, (`requester` is `posting.author` OR `requester` is an `ADMIN` member of `posting.community`)
    * **effect** removes the `posting` and all its associated `Replies`
  * **deleteReply(reply: Reply, requester: User): ()**
    * **requires** `reply` exists, (`requester` is `reply.author` OR `requester` is an `ADMIN` member of `reply.posting.community`)
    * **effect** removes the `reply` from its `Posting`

***

### concept UserAuthentication

* **purpose**\
  Identify users and manage their access credentials.
* **principle**\
  After a user registers with unique credentials, they can log in to prove their identity, establishing an authenticated session for further interactions.
* **state**
  * a set of Users with
    * a username String
    * a passwordHash String
    * a registrationDate DateTime
  * a set of ActiveSessions with
    * a user User
    * a token String
    * a creationTime DateTime
    * an expiryTime DateTime
* **actions**
  * **register(username: String, password: String): (user: User)**
    * **requires** `username` is unique, `password` meets strength requirements
    * **effect** creates a new `User` with the given `username` and a hashed `password`
  * **login(username: String, password: String): (user: User, token: String)**
    * **requires** `username` and `password` match an existing `User`
    * **effect** creates a new `ActiveSession` for the matched `User` with a unique `token` and `expiryTime`, returning the `User` and `token`
  * **logout(token: String): ()**
    * **requires** `token` matches an existing `ActiveSession`
    * **effect** removes the `ActiveSession`
  * **changePassword(user: User, oldPassword: String, newPassword: String): ()**
    * **requires** `user` exists, `oldPassword` matches `user`'s current password, `newPassword` meets strength requirements
    * **effect** updates `user.passwordHash` with the new hashed password
  * **resetPassword(username: String, newPassword: String): ()**
    * **requires** `username` exists, `newPassword` meets strength requirements (assuming an out-of-band verification process for security that is not part of this concept)
    * **effect** updates the `passwordHash` for the `User` associated with `username`
  * **system invalidateExpiredSessions(): ()**
    * **requires** an `ActiveSession` exists where `currentTime` is after `expiryTime`
    * **effect** removes all `ActiveSessions` where `currentTime` is after `expiryTime`

***

### concept UserProfile \[User]

* **purpose**\
  Store and manage user-specific descriptive information, distinct from authentication credentials.
* **principle**\
  After a user is created, their profile can be initialized and updated, allowing others to view their descriptive details.
* **state**
  * a set of Profiles with
    * a user User
    * a displayName String
    * an optional bio String
    * an optional thumbnailImageURL String
* **actions**
  * **createProfile(user: User, displayName: String): (profile: Profile)**
    * **requires** `user` exists, no `Profile` already exists for `user`, `displayName` is non-empty
    * **effect** creates a new `Profile` for `user` with the given `displayName`
  * **updateDisplayName(profile: Profile, newDisplayName: String): ()**
    * **requires** `profile` exists, `newDisplayName` is non-empty
    * **effect** updates `profile.displayName` to `newDisplayName`
  * **updateBio(profile: Profile, newBio: String): ()**
    * **requires** `profile` exists
    * **effect** updates `profile.bio` to `newBio`
  * **updateThumbnailImage(profile: Profile, newThumbnailImageURL: String): ()**
    * **requires** `profile` exists
    * **effect** updates `profile.thumbnailImageURL` to `newThumbnailImageURL`
