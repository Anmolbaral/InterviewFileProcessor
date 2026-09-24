# Analytics Dashboard: evidence workspace for three ITSM interviews

A client-facing workspace over three expert-interview transcripts about IT service management vendors. It compares
company cases, shows the exact transcript passage behind every claim, lets an analyst select findings and edit a
conclusion, and exports a Markdown brief with citations and caveats. The interviews explain specific buying decisions;
they cannot establish vendor market share, and the product says so wherever that question comes up.

Three layers, each checkable on its own:

1. `parser.py` preserves every transcript paragraph with its source location and fingerprints in SQLite.
2. `extract.py` has a model propose source-bound findings section by section, then validates every citation and
   applies deterministic rules before storing them as unreviewed proposals.
3. `dashboard.py` builds one JSON bundle from the verified passages and findings; the React app in `web/` renders it.
   No server, and no model call at view time.

## Run

Python 3.10 or newer (verified on 3.11 and 3.13), dependencies pinned in `requirements.txt`. Node 20+ for `web/` only.

```sh
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
python parser.py && python parser.py --check          # parse and verify the transcripts
python extract.py --batches                           # the extraction schedule
python extract.py --render E1:S06                     # the exact model input for one section
python extract.py --extract all --workers 3           # propose findings (needs XAI_API_KEY)
python extract.py --check                             # verify stored findings; list attribution flags
python extract.py --evaluate                          # the gold regression gate
python dashboard.py --build && python dashboard.py --check
python -m unittest -v test_parser.py test_extract.py test_dashboard.py
cd web && npm install && npm test && npm run build && npm run dev   # http://localhost:5173/
```

Inputs are private and git-ignored: `analysis/transcripts/manifest.json` lists each DOCX with `expert`, `source`, and
`sha256`. For a fresh clone, copy `manifest.example.json` there and fill in the path and hash. Outputs go to
`data/parsed/transcripts.sqlite` and a separate `data/parsed/findings.sqlite` (`--manifest`, `--database`,
`--findings` override). `--extract` reads `XAI_API_KEY` from the environment or a git-ignored `.env`; everything else
runs without a key. Synthetic tests run without private files; real-file tests fail rather than skip when the
manifest's files are missing or changed.

## Evidence contract

- **Canonical text is never normalized.** Each paragraph is a passage (`E1:B0030`) with a citation ID for nonempty
  ones (`E1:P021`), its speaker and timestamp, section, and original XML. Every document records its source SHA-256
  and an extraction fingerprint over all stored content and parser versions.
- **Fail closed.** `parser.py --check` reparses the originals read-only and fails on changed inputs, tampered rows, or
  stale derived data. `render_passages` quotes only at an expected fingerprint for every document requested.
- **Findings are proposals bound to evidence.** Each finding names its company context, kind (`company_scale`,
  `vendor_relationship`, `selection_criteria`, `pricing`, `implementation`, `rating`), statement, vendor and
  relationship, evidence type, optional quantity, qualifications, and supporting, qualifying, and context passages,
  each passage in one role. Records carry the source fingerprints they were checked against; a changed transcript
  makes them stale, never silently relabeled.
- **Review never inherits trust.** `extract.py --review ID reviewed|rejected` and `--edit ID --changes '{...}'` log
  every decision; any edit leaves the record `edited` until reviewed again.
- **Companies keep their names from evidence.** A company record stays as first proposed; a later name (the spoken
  name of an employer the header anonymizes, a spelling variant) is an alias record accepted only when a cited passage
  contains it.

## Extraction

Each transcript section is one model call (`grok-4.6` by default; `--model` to change). The header before the first
heading gets no call of its own because every section already carries it. Each call sees the section, the interview's
introduction, every known company with the passages that identify it, and the most recent passage naming exactly one
company, so a section that continues a former employer's account without naming it can still be filed correctly.
Sections of one interview run in order, interviews in parallel, and an unchanged input is reused without a call.

Deterministic rules then apply before anything is stored:

- every cited passage must have been shown to the model, be body text, and match the expected fingerprint;
- interviewer text is never supporting evidence; it moves to context, and a finding left with no expert passage is
  rejected;
- quantities keep the source wording; currency is labeled `dollars`; a figure's own words set a missing unit ("seven
  months"); only a price borrows a unit or period from the rest of its answer, and only when that answer names one
  unit, marked as `carried`;
- an answer on a different rating scale than its question ("1 to 7" asked, "9 out of 10" given) is labeled, never
  rescaled.

`extract.py --check` also flags findings whose company disagrees with the conversation's company anchor. Flags ask
for review; they do not fail the check.

## Quality gate

`python extract.py --evaluate` checks 18 gold cases (G01–G18) drawn from an evidence audit: current versus former
employer, module status, interviewer premises, corrections, quantities and units, rating scales, and the market-share
limit. The cases are the spec: a failure means the system needs fixing. Each case is scored after review and on raw
model output alone; an interview missing from the store reports `not_run`, never a pass. The gate exits 1 until every
case passes and refuses to run on transcripts other than the reviewed versions.

Measured runs (one run each; the model is non-deterministic, so these are single samples):

| Run | Model | Findings | Gold, raw output |
| --- | --- | --- | --- |
| Prompt 1.2.0 (current `findings.sqlite`, shown in the dashboard) | grok-4.7 | 304 | 6 of 18 (11 after review) |
| Prompt 1.4.0 | grok-4.7 | 301 | 9 of 18 |
| Prompt 1.5.0 | grok-4.20-0309-non-reasoning | 168 | 6 of 18 |

The reasoning model took about 45 minutes a run and the non-reasoning model about 45 seconds; the fast model missed
five cases outright, including a whole cost section. The dashboard still shows the 1.2.0 store until a new run is
reviewed and swapped in. `grok-4.6`, now the default, sits between the two on reasoning effort; its gold result is not
recorded yet.

## Dashboard

`dashboard.py --build` writes `web/src/data/bundle.json` (git-ignored; it contains transcript text) after the parser
and findings checks pass. `--check` re-renders every shipped passage and fails when the bundle no longer matches the
transcripts or lags the findings store. The web app opens on company cases, with a vendor comparison view, an
evidence panel showing each finding above its cited passages, status words on every finding, a red label on disputed
or unestablished companies, a brief with an editable conclusion kept in `localStorage`, and a Markdown export that
carries citations, units, status, and caveats.

## Verification

65 Python tests (parser, extraction, dashboard) and 15 Vitest tests, including a rendered smoke test over the real
bundle; `npm run build` type-checks and bundles. The definition of done is in [AGENTS.md](AGENTS.md).

## Limits

- Citation checks prove a passage exists and matches its version, not that it supports the statement; that is review.
- Three findings are reviewed; everything else is a labeled model proposal.
- Findings are extracted per section, so two accounts of one event in different sections are not linked
  automatically (gold case G13).
- The parser's heading and speaker rules are verified for these three files, not a general transcript format.

## Next

1. **Company registry first.** Settle each interview's companies, former employers, and names once, with a check that
   a name belongs to its company, before any findings are extracted.
2. **Smaller, question-led model calls.** Use the existing exchange chunks and the prepared questions so each call does
   one narrow task, plus a second pass for missed facts; measure against the gold on raw output.
3. **Repeated runs.** Report per-case pass rates across runs with intervals before adopting a prompt or model.
4. **Review inside the dashboard,** writing to the existing review log.
5. **Cited answers to the prepared questions,** abstaining per company when evidence is incomplete or conflicting.
