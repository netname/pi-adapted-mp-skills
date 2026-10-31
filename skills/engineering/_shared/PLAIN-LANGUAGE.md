# Plain technical language

Apply this policy to human-facing planning questions, specs, designs, ADRs, tickets, research summaries, handoffs and review reports. Use plain technical language informed by STE; this is not ASD-STE100 compliance. Preserve technical accuracy and the reader's ability to make an informed decision.

## Writing

1. Explain the purpose first. For a long artifact, start with what changes, why it matters and what needs a decision; put detailed mechanisms afterward.
2. Name who does what. Prefer “The coordinator checks the test results” to “Verification is performed.”
3. Use familiar words and consistent terms. Reuse the project glossary; explain an unfamiliar term at first use. Add only recurring domain terms to the glossary, not every ordinary word.
4. Keep each sentence focused. Split several actions or conditions into separate sentences. Do not enforce a fixed word count or remove useful context merely to shorten text.
5. State observable behavior. Replace “handle errors appropriately” with the required response. Explain tradeoffs with concrete consequences and examples where useful.
6. Preserve exact identifiers, commands, units, conditions, exceptions, requirement strength and uncertainty. Do not turn “may” into “must”, an assumption into a fact, or an example into a new requirement.
7. Distinguish observed facts, proposals, accepted decisions and open questions. Link authoritative requirements instead of creating competing copies.
8. Before presenting, check whether a reader can explain the intended behavior and next decision without guessing. Correct unclear wording without silently changing scope.

## Questions

- In live conversation, ask one main decision at a time. A short batch of up to three independent questions is acceptable when it reduces effort; do not dump every currently answerable question into one round.
- Explain why the answer matters when that is not obvious. Ask about user-visible behavior before asking the user to select technical mechanisms.
- Use short, distinct options when helpful. Explain meaningful consequences, label recommendations and give their reason. Do not make the recommended answer sound like the only reasonable choice.
- Allow “I don't know” or another answer when valid. Research discoverable facts yourself; do not make the user supply facts the agent can inspect.
- Reuse previous answers and explicit authorization. Ask again only if context changed or the answer is genuinely ambiguous; explain why.
- In live conversation, ask dependent questions after their prerequisites are resolved. In an asynchronous questionnaire, include necessary questions together and mark dependent questions with explicit conditions. Record uncertainty instead of inventing a decision.

Example: replace “What consistency semantics should govern quotation persistence?” with “Should the application save quotations so staff can open them later?” If yes, ask “When a product price changes, should a saved quotation keep its original price or use the new price?” Explain the consequences before recommending an option. This is a wording example, not a requirement to add saving to the quotation lab.

## Existing review, no extra stage

The author checks wording before presenting. The existing comprehension reviewer identifies passages that require guessing, unexplained terms and rewrites that changed meaning. The reviewer explains behavior and decisions in their own words; the human checks whether that explanation is usable. Flag ambiguity that affects scope or behavior as a substantive finding. Treat stylistic preferences as suggestions, not new approval gates.

Writing instructions and a fluent rewrite do not guarantee comprehension. Use actual reader feedback and the worked example. Do not add a readability score, controlled dictionary, separate reviewer or automated language gate by default.

## References

These sources inform the local policy; their full rules are not imported:

- [ASD-STE100 overview](https://www.asd-ste100.org/about_STE.html): writing rules and controlled vocabulary for technical documentation.
- [Google developer documentation: voice and tone](https://developers.google.com/style/tone): clear, direct language for a broad audience.
- [GOV.UK: designing good questions](https://www.gov.uk/service-manual/design/designing-good-questions) and [question pages](https://design-system.service.gov.uk/patterns/question-pages/): understandable, necessary questions and reuse of previous answers. The chat guidance above adapts these form-design principles.
