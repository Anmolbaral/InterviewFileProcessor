---
name: verification-before-completion
description: Produce fresh evidence in the current session before saying that a change is done, a test passes, a fix works, or a document is correct in this repository. Use before every "done", "fixed", "verified", or "passes" statement, before any commit or push, and when summarizing work, including documentation-only changes and changes another agent made.
---

# Verification before completion

Claims about this codebase are only as good as the command output behind them. The README rule is that it states nothing a passing test or a session run does not back, and the same standard applies to what you tell the user. A check that was planned is not a check that ran. A result remembered from an earlier session is not evidence for the current state of the files.

## Definition of done for code changes

Run these from the project root, in a venv with the pinned requirements, and keep the output:

```sh
python -m pyflakes parser.py test_parser.py
python -m unittest -v test_parser.py
python parser.py
python parser.py --check
```

Then run the thing the change actually touched: the `--search` query, the `sqlite3 -readonly` query, the specific unittest, or the function call in a scratch script. A green suite does not show that a new command line flag prints what the README says it prints.

## Definition of done for documentation changes

Every relative link resolves to a file that exists. Every command in a code block was run in this session, or is marked as not run. Every number, count, and version was produced by a command whose output you saw. Prose that promises behavior no test covers is removed or reworded as a limitation.

## How to report

- Lead with what was verified and how: the command and the line of output that proves it, such as `Ran 15 tests ... OK` or `Verified data/parsed/transcripts.sqlite`.
- List what was not run, and say so plainly. "Not run" is an acceptable status; an implied pass is not.
- Name any deviation from the plan or the request, and any claim the evidence does not reach.
- Never describe an outcome you did not observe. If a command failed, quote the failure.

## Before a commit

Commit only when the user asks. Run the definition of done first, then `git status --short` to confirm that only intended files are staged and that `analysis/`, `data/`, DOCX files, credentials, and ignored drafts are absent.
