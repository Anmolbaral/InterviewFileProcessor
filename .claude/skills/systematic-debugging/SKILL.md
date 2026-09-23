---
name: systematic-debugging
description: Find the root cause of a failing test, a wrong parser result, a check-mode failure, or any surprising value in this repository before changing code. Use whenever something fails, misbehaves, or produces an unexpected number, even when the fix looks obvious and even when the user only reports a symptom such as "the count is off" or "check fails".
---

# Systematic debugging

A fix that silences the reported symptom without explaining it is a second bug waiting to be found. In this codebase the cost of guessing is high: canonical text, citation IDs, and fingerprints feed every later claim, so a wrong "fix" in the parser corrupts evidence quietly. Two real examples set the bar. Text inside a Word smart tag vanished silently until a probe compared python-docx's reading with a raw XML read; the fix was a second reader in the parser, not a special case. FTS5's integrity check looked like the right verification until a probe showed it needs a writable connection, which our check mode never has; the design changed, not a workaround.

## Procedure

1. **Reproduce first.** Run the exact command or test that fails and keep its real output. If the report is vague, turn it into a command: a unittest name, `python parser.py --check`, a `--search` query, or a read-only query with `sqlite3 -readonly data/parsed/transcripts.sqlite`. No reproduction, no edit.
2. **Read the whole path.** Follow the value from input to the failing point in `parser.py`, and grep every caller of any function you might touch. The smallest edit in the wrong place is not lazy, it is wrong.
3. **State one hypothesis and test it with evidence.** Write a throwaway probe in the session scratchpad, never in the repo: a few lines that isolate the suspected behavior against the real files or a python-docx fixture. Print what you expected and what you got. If the probe disagrees with the hypothesis, form a new one; do not start editing on a hunch.
4. **Fix at the cause.** Prefer one change where all callers route through it over a guard in each caller. If the cause is in a library's behavior, make the parser detect it and fail loudly or record a warning; do not paper over it.
5. **Prove it.** Rerun the reproduction, then the definition of done from AGENTS.md: pyflakes, the unittest suite, `python parser.py`, `python parser.py --check`. If the bug was silent, add the test that would have caught it, using the existing fixture or the supplied files.

## Report

Say what failed, what the cause was, how the probe showed it, what changed, and which checks ran with their actual output. If something remains unexplained, say so rather than closing the issue.
