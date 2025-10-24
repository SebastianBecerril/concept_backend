# Design Changes:

Overall, there were many design changes to the concepts and my application as a whole. Primarily, they were just optimized through conversation with the LLM, as seeing how it had context on concept design, it was much easier to iterate and improve my original concept. The biggest changes to my original design were as follows:
-  **Added two new concepts: UserAuthentication and UserProfile:** I did not intially consider these two concepts for my application, but quickly realized they were pretty essential in order for there to be correct functionality.
- **Eliminated the CourseSpace concept:** This concept just simply added an unnecessary and not innovative feature to the application that just overcomplicated implementation. Therefore, I decided it would be best to get rid of it and focus on the other concepts.

---
# Interesting Moments

1.  **Course Catalog API Logic Change:**  Initially, my CourseCatalog concept was dependent on the use of an API or some sort of interface to automatically import courses from the MIT Catalog. However, after conversing with the LLM, I realized that not only would this be hard to get access to, but it would also add so much complexity to the design. Therefore, I decided on a different approach of having a user-managed course catalog that while it may have some flaws, with sufficient constraints it should work well.
		[20251021_154642.84002535](context/design/brainstorming/individual-concept-brainstorming/course-catalog-brainstorming.md/20251021_154642.84002535.md)
2. **Hallucination in Community Implementation**: While working on my Community concept implementation, the LLM hallucinated me having written an action that I had not. This took me by surprise since it has access to context and the files I give it, I simply figured that by looking at the files it did not have the capability to hallucinate in that regard. It was just a good reminder that I am still working with LLMs.
		[20251023_201912.8016f23e](context/design/concepts/Community/implementation.md/20251023_201912.8016f23e.md)
3. **Augmented testing prompt**: Very quickly into my implementation of the concepts and the writing of the test suites, I realized that Context was very good at writing tests (of course, I would still look over them and fix any mistakes). Its test writing ability became even better after I added an enhancement to a background doc adding the expectations of the assignment for testing.
		[20251023_210733.55b8a554](context/design/concepts/Community/testing.md/20251023_210733.55b8a554.md)
4. **Last admin logic:** Also relating to testing, the LLM was able to come up with a case I had not thought about, which was what happens when there is one last admin remaining in the community. This case is definitely very relevant, so I was glad to see that the LLM was able to come up with it.
		[20251023_210733.55b8a554](context/design/concepts/Community/testing.md/20251023_210733.55b8a554.md)
5. **Went back on the double oriented relationships:** One of my big concerns while tweaking my concept specs was whether states needed to reference their parent and child. Initially, the LLM said this was good practice, but then during implementation, it went back on it. I thought that was kind of interesting and a little annoying.
		[20251023_215503.9f495759](context/design/concepts/CourseCatalog/implementation.md/20251023_215503.9f495759.md)
6. One last interesting thing that does not have a snapshot but rather just a general comment. I experimented with multiple workflows, from the AI writing the majority of my code to writing my own code aided by Cursor autocomplete to work faster and then having Context evaluate it. That is why different concepts have different levels of incremental work.