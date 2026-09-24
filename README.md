# ITSM interview evidence workspace

A research workspace over three expert interviews about IT service management (ITSM) vendors. It compares the company
cases the experts describe, shows the exact transcript passage behind every claim, lets an analyst select findings and
edit a conclusion, and exports a Markdown brief with citations and caveats. The interviews explain specific buying
decisions; they cannot establish vendor market share, and the workspace says so wherever that question comes up.

A model proposes findings section by section; code validates every citation before storing them, and they stay
labeled unreviewed until a person checks them. How the pieces fit is in [ARCHITECTURE.md](ARCHITECTURE.md).

| Folder | What is in it |
| --- | --- |
| [`inputs/`](inputs/) | What goes in: the three interview transcripts (DOCX, unmodified) and `manifest.json` with their SHA-256 hashes. |
| [`gold/`](gold/) | The evidence audit, the 18 gold cases drawn from it with their rubrics, the judge's human labels, and the script that builds its calibration set. |
| [`results/`](results/) | What came out: every extraction run's findings store, readable findings list, and gold result, with a summary. |
| [`web/`](web/) | The dashboard; `web/src/data/bundle.json` is the built data it shows. |
| `parser.py`, `extract.py`, `dashboard.py` | The three pipeline stages, each with its test module. |

## Run

Python 3.10 or newer (verified on 3.11), dependencies pinned in `requirements.txt`; Node 20+ for `web/`.

```sh
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
python parser.py                                      # parse the transcripts into data/parsed/transcripts.sqlite
python extract.py --batches                           # the extraction schedule
python extract.py --render E1:S06                     # the exact model input for one section
python extract.py --extract all --workers 3           # propose findings (needs XAI_API_KEY)
python dashboard.py --build --findings results/runs/1.2.0/findings.sqlite   # rebuild web/src/data/bundle.json
cd web && npm install && npm run dev                  # http://localhost:5173/
```

A fresh clone runs as is: `inputs/manifest.json` lists each transcript with its `sha256`, and the parser refuses a
file whose hash differs; to process other interviews, point `--manifest` at your own (see `manifest.example.json`).
New runs write to the local `data/parsed/` directory, which is not tracked. `--extract` reads `XAI_API_KEY`, and
`--judge` reads `ANTHROPIC_API_KEY`, from the environment or a git-ignored `.env`; everything else runs without a key.
`--manifest`, `--database`, and `--findings` override the default paths.

Inspecting and comparing runs:

```sh
python extract.py --list --findings results/runs/1.6.0-r1/findings.sqlite       # a run's findings with citations
python extract.py --evaluate --findings results/runs/1.6.0-r1/findings.sqlite   # its gold result
python extract.py --compare results/runs/1.6.0-r1/findings.sqlite results/runs/1.6.0-skills-r1/findings.sqlite
```

## Test

```sh
python parser.py --check                              # reparse read-only; fail on changed inputs or tampered rows
python extract.py --check                             # verify stored findings; list attribution flags
python extract.py --evaluate                          # the 18-case gold gate; exits 1 until every case passes
python extract.py --evaluate --judge                  # add the model judge's verdicts beside the gate
python dashboard.py --check                           # the bundle still matches transcripts and findings
pyflakes parser.py test_parser.py extract.py test_extract.py dashboard.py test_dashboard.py
python -m unittest -v test_parser.py test_extract.py test_dashboard.py   # 83 tests
cd web && npm test && npm run build                   # 15 Vitest tests, then type-check and bundle
```

Synthetic tests build their own DOCX fixtures; real-file tests fail rather than skip when the manifest's files are
missing or changed. The full definition of done is in [AGENTS.md](AGENTS.md).

## Deploy

Not deployed. The workspace runs locally with `npm run dev`; `npm run build` produces a static site in `web/dist/`
with no server and no model call at view time, which any static host could serve. The data it shows is
`web/src/data/bundle.json`, built by `dashboard.py --build` from the transcripts and findings published here.

## Architecture

[ARCHITECTURE.md](ARCHITECTURE.md) covers the three stages and the web app, where AI is used and where code decides,
stored versus computed data, identifiers, the gold gate with measured runs, limits, and next steps.
