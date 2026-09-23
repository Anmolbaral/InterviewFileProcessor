# Synquery transcript parser

Deterministic parsing layer for the three supplied DOCX interviews. It preserves literal text and source locations, validates its records, and stores them in one local SQLite database, together with derived exchange chunks and a keyword index. No LLM, server, fact extraction, or frontend yet.

## Run

From the project root. Requires Python 3.10 or newer; verified on 3.11 and 3.13. Dependencies are pinned in `requirements.txt`; SQLite ships with Python.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python parser.py
python parser.py --check
python parser.py --search '"forty dollars per agent"'
python -m unittest -v test_parser.py
```

Input: `analysis/transcripts/manifest.json`, a JSON array of entries with `expert` (positive integer), `source` (DOCX path, absolute or relative to the manifest), `sha256` (the file's lowercase SHA-256), and optionally `paragraphs` (expected nonempty paragraph count). Output: `data/parsed/transcripts.sqlite`. Override either with `--manifest` and `--database`.

A run hashes each file. A document whose content hash, parser version, and python-docx version match its stored rows is validated and reused without parsing. Changed or new documents are parsed and validated, then written in one transaction, so a failed input leaves the previous contents intact. Stored rows that fail validation stop the run. `--check` reparses every source, opens the database read-only, and fails on changed inputs, stale or tampered rows, or broken references without writing anything. It also recomputes the derived chunks from the stored passages and fails if the chunk rows, memberships, or keyword-index rows differ. The database path cannot be a source, the manifest, an exploratory extract, or anything under `sources/`.

```sh
sqlite3 -header -column data/parsed/transcripts.sqlite "SELECT id, speaker_label, timestamp_raw, substr(text, 1, 60) AS text FROM passages WHERE citation_id = 'E1:P021'"
```

## Private inputs and Git

`.gitignore` excludes the original DOCX files, `analysis/` (manifest, exploratory extracts, evidence audit, Ponytail reference), `data/` (the database), credentials, environments, and caches. Code, tests, pins, this README, and the plans are eligible for version control. Inspect `git status --short` before committing.

For a fresh clone, copy `manifest.example.json` to `analysis/transcripts/manifest.json`, replace the path and the all-zero hash (`shasum -a 256 file.docx`), and run the parser. Synthetic tests run without private files. The two real-file tests skip when the manifest is absent, and fail rather than skip when its files are missing or changed.

## Database contract

Two canonical tables, two derived tables, and one FTS5 index; `PRAGMA user_version` holds the schema version (1). Foreign keys are enforced on every connection the parser opens.

`documents`: one row per interview with `id`, `source_filename`, `source_sha256`, `parser_version`, `python_docx_version`, `extraction_sha256`, `coverage`, plus `warnings` and `ancillary_parts` as JSON text. Ancillary parts are headers, footers, footnotes, endnotes, and comments by XML part name; they never become interview turns.

`passages`: one row per top-level body paragraph, referencing its document.

- `id`: physical paragraph reference such as `E1:B0030`. Primary key.
- `paragraph_index`: one-based position, blank paragraphs included.
- `citation_id`: existing nonempty-paragraph reference such as `E1:P021`; null for blanks, unique otherwise. Not the physical position.
- `text`: exact paragraph text with its whitespace, tabs, line breaks, and `[AUDIO ...]` markers. Never normalized.
- `kind` (`blank`, `heading`, `turn_marker`, `text`), `style_name`, and `heading_basis` (`style` or `bold_underline`).
- `section_id`: the passage holding the current literal heading. Headings are navigation hints, not facts.
- `turn_id`, `speaker_label`, `timestamp_raw`: taken verbatim from an explicit `Expert N HH:MM:SS` or `AI Interviewer HH:MM:SS` paragraph and carried to the following text paragraphs until the next marker or heading. Preamble text keeps nulls.
- `anomaly_markers`: the `[AUDIO ...]` markers as JSON text.
- `raw_xml`: the paragraph's original XML element, namespace-trimmed, so formatting the columns do not model stays recoverable.

Canonical `text` is the run content found anywhere inside the paragraph, cross-checked against python-docx's own reading. A difference keeps the complete text, adds a warning naming the passage, and marks the document `partial`. Tables, text boxes, tracked changes, drawings, and equations also warn and mark `partial`. A document with no recognizable turn markers gets a warning. The extraction fingerprint covers all stored content plus parser and library versions; downstream records should keep both `source_sha256` and `extraction_sha256` and reject a mismatch until reviewed.

### Derived: exchange chunks and keyword search

`chunks` groups text passages into exchanges: one interviewer turn plus the replies that follow it until the next interviewer turn or heading. The opening greeting and an unanswered final question are one-turn exchanges; text outside any turn, the preamble in these files, is an `unattributed` chunk. `chunk_passages` holds each chunk's ordered passage IDs, and the database enforces that a text passage belongs to at most one chunk. Chunk `text` is the member texts joined with newlines. `header` is the interview profile and section, for example `E3 | Expert 3 Head of IT Operations at Solara Renewables (2020 - present) | Cost & Total Cost of Ownership`, with `header_passage_ids` naming the passages it came from. Both exist for keyword search only. The header describes the interview, not the company a given exchange discusses, and is never evidence for attribution. Every derived row is rebuilt on every run.

`chunks_fts` indexes text and header with the `porter unicode61` tokenizer, so `agent` matches `Agents` and `$40` is indexed as `40`. `search(connection, query, document_id=None, limit=10)` returns BM25-ranked hits, header words at half weight, with `passage_ids` as evidence and `header` plus `header_passage_ids` as search context; a query FTS5 cannot parse is retried as its bare words, all required. `render_passages(connection, passage_ids)` returns each passage with its own speaker, timestamp, citation, and text, and is the way to display an exchange or place one in a prompt. `neighbors(connection, chunk_id, before=1, after=1)` returns the surrounding chunks within the same section only; a whole section or transcript is `passages WHERE section_id = ?` or `WHERE document_id = ? ORDER BY paragraph_index`.

## Scope

A small parser for this paragraph-based interview layout. Heading detection from bold+underline and the two speaker labels are conventions verified for these files, not a general classifier. Original DOCX files stay unchanged and authoritative. Company or time attribution and reviewed claims belong to later layers.

## Verification

Tests cover text fidelity, ID mapping, strict records, deterministic output, database round trip and reuse, changed or corrupt sources, partial coverage, nested runs, tampered rows, protected paths, preservation of the previous database after a failed run, exchange grouping, keyword search, and derived-row integrity. The real-file tests compare every stored paragraph with a separate XML read and verify the original hashes.

| Interview | Body paragraphs | Citation IDs | Turn labels | Headings | Exchanges |
| --- | --- | --- | --- | --- | --- |
| Expert 1 | 494 | 326 | 158 | 9 | 80 |
| Expert 2 | 169 | 169 | 79 | 9 | 40 |
| Expert 3 | 157 | 157 | 73 | 9 | 37 |

All 820 paragraphs are retained and both readers agreed on every one. Interviewer-led exchanges number 79, 39, and 36; the extra one per interview is the opening greeting, and each interview also has one unattributed preamble chunk. Expert 1's two text line breaks are preserved; its 167 formatting tab stops are not text.

## Files

- `parser.py`: models, parser, validation, SQLite store, exchange chunks, keyword search, CLI.
- `test_parser.py`: integrity and failure checks.
- `requirements.txt`: two pinned dependencies.
- `data/parsed/transcripts.sqlite`: generated, ignored by git.

Next: reviewed source-linked facts as tables referencing `passages.id`. See [AGENTS.md](AGENTS.md), [BUILD-TEST-ROADMAP.md](BUILD-TEST-ROADMAP.md), and [MVP-BUILD-BRIEF.md](MVP-BUILD-BRIEF.md).
