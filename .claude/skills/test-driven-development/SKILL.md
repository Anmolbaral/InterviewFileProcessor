---
name: test-driven-development
description: Write the failing test before the code for any bug fix or new behavior in parser.py, then make it pass with the smallest change, then simplify. Use whenever adding a feature, fixing a defect, or changing parsing, chunking, search, storage, or validation logic in this repository, including small changes and changes that "obviously work".
---

# Test-driven development

The parser's job is to be trusted, and a test written after the code tends to describe what the code does rather than what it must do. Writing the test first forces the behavior to be stated in terms of inputs and observable outputs, and watching it fail proves the test can fail at all. In this repository that discipline caught a grouping rule whose prose and code disagreed before either shipped.

## Loop

1. **Red.** Add or extend a test in `test_parser.py` that states the required behavior. Run just that test and watch it fail for the reason you expect, not from a typo or an import error:

   ```sh
   python -m unittest -v test_parser.ParserTests.test_name
   ```

2. **Green.** Make the smallest change in `parser.py` that turns it green. Resist fixing neighbors or improving names while red; note them and come back.
3. **Refactor.** With the suite green, remove duplication and restore clarity. Rerun the full suite after each refactor step.
4. **Finish** with the definition of done in AGENTS.md: pyflakes, the whole suite, `python parser.py`, `python parser.py --check`.

## Where tests come from

- Prefer the supplied transcripts through the existing `ProvidedTranscriptTests` class; they exercise both transcript templates and are what the product actually ships against. These tests skip without the private manifest, so a behavior that must be tested in a fresh clone also needs a synthetic case.
- For edge cases the real files lack, extend the existing `fixture()` in `test_parser.py` or build a small python-docx document in the temporary directory, as the nested-runs test does. Do not invent large fixtures.
- One meaningful check per piece of logic. Assert on observable records, such as passage IDs, texts, warnings, chunk memberships, or search hits, not on implementation details.
- Tampering and failure paths count as behavior: a test that proves `--check` rejects a changed row is worth more than a second test of the happy path.

## What needs no test

Documentation, comments, and renames with no behavior change. A one-line change to a message string. Use judgment, and when unsure, ask whether a future regression here would corrupt evidence or mislead a user; if yes, test it.
