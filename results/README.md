# Results

Every extraction run, kept as its findings store plus two readable files: `findings.txt` (`python extract.py --list --findings results/runs/<run>/findings.sqlite`) and `gold.txt` (`python extract.py --evaluate --judge --findings results/runs/<run>/findings.sqlite`). This page is compiled from those files. Runs are single samples of a non-deterministic model.

## Runs

| Run | Model | Prompt | Sections run (failed) | Findings | Gold, raw output | Gold, after review |
| --- | --- | --- | --- | --- | --- | --- |
| [1.2.0](runs/1.2.0/) | grok-4.7 | 1.2.0 | 30 (0) | 304 | 6 of 18 | 11 of 18 |
| [1.3.0-pilot](runs/1.3.0-pilot/) | grok-4.7 | 1.3.0 | 5 (0) | 63 | 3 of 18 | 3 of 18 |
| [1.4.0](runs/1.4.0/) | grok-4.7 | 1.4.0 | 30 (0) | 301 | 10 of 18 | 10 of 18 |
| [1.5.0](runs/1.5.0/) | grok-4.7 | 1.5.0 | 17 (1) | 148 | 3 of 18 | 3 of 18 |
| [1.5.0-fast](runs/1.5.0-fast/) | grok-4.20-0309-non-reasoning | 1.5.0 | 27 (0) | 168 | 6 of 18 | 6 of 18 |
| [1.5.0-grok46](runs/1.5.0-grok46/) | grok-4.6 | 1.5.0 | 27 (0) | 257 | 17 of 18 | 17 of 18 |
| [1.6.0-r1](runs/1.6.0-r1/) | grok-4.6 | 1.6.0 | 30 (0) | 265 | 17 of 18 | 17 of 18 |
| [1.6.0-r2](runs/1.6.0-r2/) | grok-4.6 | 1.6.0 | 30 (0) | 261 | 13 of 18 | 13 of 18 |
| [1.6.0-r3](runs/1.6.0-r3/) | grok-4.6 | 1.6.0 | 30 (0) | 264 | 16 of 18 | 16 of 18 |
| [1.6.0-r4](runs/1.6.0-r4/) | grok-4.6 | 1.6.0 | 30 (0) | 261 | 15 of 18 | 15 of 18 |
| [1.6.0-r5](runs/1.6.0-r5/) | grok-4.6 | 1.6.0 | 30 (0) | 274 | 13 of 18 | 13 of 18 |
| [1.6.0-skills-r1](runs/1.6.0-skills-r1/) | grok-4.6 | 1.6.0 + skills | 30 (0) | 273 | 15 of 18 | 15 of 18 |

`1.2.0` is the store the dashboard shows; it is the only one with review decisions. A pilot or partial run reports cases whose sections did not run as `not run`, never as a pass.

## Gold cases by run, raw output

✓ pass, ✗ fail. The definitions are in [gold/cases.md](../gold/cases.md).

| Case | 1.2.0 | 1.3.0-pilot | 1.4.0 | 1.5.0 | 1.5.0-fast | 1.5.0-grok46 | 1.6.0-r1 | 1.6.0-r2 | 1.6.0-r3 | 1.6.0-r4 | 1.6.0-r5 | 1.6.0-skills-r1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G01/G02 | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G02 | ✓ | ✗ | ✓ | absent | absent | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| G03 | ✗ | not run | ✓ | not run | absent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G04 | absent | ✗ | absent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G05 | ✗ | not run | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| G06 | ✗ | not run | ✗ | not run | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G07/G08 | ✗ | not run | ✓ | not run | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G08 | ✓ | ✓ | ✓ | not run | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G09 | ✓ | ✓ | ✓ | not run | absent | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| G10 | ✓ | not run | ✓ | not run | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G11 | ✗ | not run | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G12 | ✗ | ✓ | ✓ | not run | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G13 | not run | not run | not run | not run | not run | not run | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| G14 | ✗ | not run | ✗ | not run | absent | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| G15 | ✓ | not run | ✓ | not run | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| G16 | absent | not run | absent | not run | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| G17 | ✗ | not run | ✗ | ✓ | absent | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| G18 | ✓ | not run | ✓ | not run | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Passing** | **6** | **3** | **10** | **3** | **6** | **17** | **17** | **13** | **16** | **15** | **13** | **15** |

## Model judge beside the gate

`--judge` asks `claude-sonnet-5` whether the raw findings express each case's rubric. It is reported beside the deterministic result and never changes it. Cells show deterministic / judge; a dash means the case has no rubric or its sections did not run.

| Case | 1.2.0 | 1.3.0-pilot | 1.4.0 | 1.5.0 | 1.5.0-fast | 1.5.0-grok46 | 1.6.0-r1 | 1.6.0-r2 | 1.6.0-r3 | 1.6.0-r4 | 1.6.0-r5 | 1.6.0-skills-r1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G01/G02 | ✗ / ✓ | ✗ / ✓ | ✓ / ✓ | ✗ / ✗ | ✗ / ✗ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G02 | ✓ / ✓ | ✗ / ✓ | ✓ / ✓ | absent / absent | absent / absent | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✗ / ✓ | ✓ / ✓ |
| G03 | ✗ / ✓ | not run / ✓ | ✓ / ✓ | not run / not run | absent / absent | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G04 | – | – | – | – | – | – | – | – | – | – | – | – |
| G05 | ✗ / ✗ | not run / not run | ✗ / ✓ | ✗ / not run | ✗ / ✗ | ✓ / ✓ | ✓ / ✓ | ✗ / ✓ | ✗ / ✓ | ✗ / ✓ | ✗ / ✓ | ✗ / ✓ |
| G06 | ✗ / ✓ | not run / not run | ✗ / ✓ | not run / not run | ✗ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G07/G08 | – | – | – | – | – | – | – | – | – | – | – | – |
| G08 | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | not run / not run | ✗ / ✗ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G09 | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | not run / not run | absent / absent | ✓ / ✓ | ✓ / ✓ | ✗ / ✓ | ✓ / ✓ | ✗ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G10 | ✓ / ✗ | not run / not run | ✓ / ✓ | not run / not run | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G11 | ✗ / ✓ | not run / not run | ✗ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G12 | – | – | – | – | – | – | – | – | – | – | – | – |
| G13 | not run / not run | not run / not run | not run / not run | not run / not run | not run / not run | not run / not run | ✗ / ✗ | ✗ / ✗ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✗ / ✗ |
| G14 | – | – | – | – | – | – | – | – | – | – | – | – |
| G15 | ✓ / ✓ | not run / not run | ✓ / ✓ | not run / not run | ✗ / ✓ | ✓ / ✓ | ✓ / ✓ | ✗ / ✓ | ✗ / ✓ | ✗ / ✓ | ✗ / ✓ | ✓ / ✓ |
| G16 | absent / ✗ | not run / not run | absent / ✗ | not run / not run | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| G17 | ✗ / ✓ | not run / not run | ✗ / ✓ | ✓ / ✓ | absent / ✗ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | ✗ / ✓ | ✓ / ✓ |
| G18 | – | – | – | – | – | – | – | – | – | – | – | – |

## Other outputs

- [`judge-negatives/`](judge-negatives/): 14 copies of run 1.6.0-r4, each with one deliberately wrong finding, built by [`gold/make_judge_negatives.py`](../gold/make_judge_negatives.py) to check that the judge fails them.
- Compare any two runs with `python extract.py --compare results/runs/1.6.0-r1/findings.sqlite results/runs/1.6.0-skills-r1/findings.sqlite`.
