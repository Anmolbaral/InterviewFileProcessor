# Synquery: build, test, revise, deliver

Status: the parser is implemented and its 12 checks passed on the supplied interviews. The client-facing application, semantic extraction, and workflow checks remain planned. This roadmap supersedes the earlier suggestion to integrate LightRAG before building the client workflow.

Build in the `InterviewFileProcessor/` project root, following [AGENTS.md](AGENTS.md). Milestone times, layouts, and stack examples here are guidance; the implementation guide defines the behavioral requirements and minimal-scope rules.

## Outcome and scope

Build one ITSM Evidence Workspace for the three supplied interviews. An analyst should be able to compare company cases, inspect evidence, assemble an editable conclusion, and export material for a report. Add real follow-up questions once that complete workflow works.

The starting question remains the client's question about vendor market share by customer type and why. Show the observed vendor relationships and buying reasons these interviews support, and explicitly identify why population share cannot be calculated from them. Do not silently replace market share with mention counts.

One project, three source interviews, four substantive company contexts. Thermo Fisher is Expert 1's historical deployment; the same expert's current employer uses custom ITSM. Four contexts are not four independent respondents. Additional historical mentions remain available in the original source, even when not included as primary comparison rows.

The required submission is a working prototype OR a clear architecture writeup, plus 3–5 prioritized next steps. We are aiming for the prototype with a short architecture explanation, reproducible run instructions, known limitations, and demo notes. A hosted URL or a video is optional; the assignment does not require either.

## Build–test–revise schedule

Five-hour target, six-hour absolute ceiling for the exercise. Account for any exercise time already spent; these are allocations, not extra time. Test each milestone before moving on. Fix the most consequential failure within that milestone rather than accumulating a separate unfinished testing phase.

| Time | Build | Test | Revise / completion gate |
| --- | --- | --- | --- |
| 0:00–0:40 | Correct the source extraction, settle the shared records, and prepare the minimum reviewed facts for the four cases. Sketch the single-page layout. | Confirm original files are unchanged; verify source IDs, quotation text, attribution, and units for each displayed claim. | Remove or flag unsupported fields. Do not proceed with silently incorrect company/time context. |
| 0:40–2:10 | Build the comparison and evidence drawer using real prepared data. Include vendor/status filters, useful default columns, readable missing values, and surrounding source context. | Click every source action. Check filters, empty results, keyboard focus, long quotations, and return to the selected row. | Fix the largest comprehension or navigation problem. End with a usable comparison-to-source flow. |
| 2:10–3:00 | Add selected findings, an editable conclusion, draft preservation, and one complete useful export; add a second format if time and client value justify it. | Select findings from multiple cases; remove one; edit; navigate; export; open the export. Check citation, qualifier, and unit preservation; test refresh if persistence ships. | Repair any mismatch between screen and export. End with a complete analyst workflow that does not depend on generation. |
| 3:00–3:45 | If the core is sound, add bounded live questions against reviewed records and their linked source passages. Implement honest loading, unavailable, error, and insufficient-evidence states. | Run the grounded questions below. Inspect actual retrieved sources, not just the fluent answer. Simulate unavailable generation and an invalid source reference. | Retain only answers with resolvable citations; label generated text as a draft. If live answering cannot be completed, disclose that and use clearly labeled prepared findings. |
| 3:45–4:30 | Run an end-to-end analyst task and refine frontend readability and behavior. | Test the full demo, a narrow window, keyboard operation, empty selections, missing values, long text, and export portability. | Fix defects that prevent understanding or completion before decorative changes. Record remaining limitations. |
| 4:30–5:00 | Finish run instructions, architecture, tradeoffs, evaluation results, the prioritized roadmap, and demo script. | Follow the setup steps from a stopped app; confirm what works with and without model credentials. Audit the handoff against the assignment. | Rewrite documentation to describe what actually shipped. Remove promises about unimplemented features. |
| 5:00–6:00 maximum | Contingency for observed defects, setup friction, or one justified improvement. | Recheck affected behavior and the complete demo after changes. | Stop at six hours. Do not spend the buffer adding features without finishing validation and handoff. |

For a four-hour version, omit live Q&A and reduce the final refinement pass by 15 minutes. Keep citations, source inspection, editable findings, export, and the roadmap. Never disguise prepared answers as live AI output.

## Frontend work, explicitly

### 1. Project header

- Project title, client research question, source count, and a plain-language scope statement.
- Show that the material supports case comparisons and buying explanations, while market-share estimates need additional data.
- Provide a source list for the three interviews. Do not add an upload flow or multi-project navigation.

### 2. Comparison surface

- Default columns: company/context, scale facts, vendor and relationship, reported selection/rejection reasons, evidence action.
- Make current-at-interview versus prior experience visible. Do not rely on color or a tooltip alone.
- Show vendor relationships such as deployed, evaluated, and considered distinctly. A hypothetical future switch is not a deployment.
- Keep cost and implementation details available in case details; do not build separate pages or a vendor leaderboard.
- Keep a stable row identity when filtering; show active filters and a clear way to reset them. Four rows do not need pagination.
- Display “Not stated” or an explicit unresolved value rather than zeros, fabricated estimates, or unexplained blanks.
- Evidence buttons should identify the claim they support. Do not make users guess which part of a row a citation covers.

### 3. Evidence drawer

- Open the relevant exact passage, with source filename, expert, speaker, company/time context, paragraph reference, and timestamp only where the source actually provides one.
- Highlight the relevant text and let the analyst expand nearby conversation, including the interviewer question and later qualifications when applicable.
- Show supporting and qualifying passages together for a finding that requires both.
- Permit selection into the brief without changing the original source.
- Escape closes the drawer; focus returns to the opening control. An overlay drawer needs appropriate focus containment. Keep the selected table row/filter state intact.

### 4. Question panel, if live answering ships

- Place three useful starter questions beside a free-text question field. The prepared comparison remains available without prompting.
- Show progress and prevent accidental duplicate submissions. An unavailable model should not leave a permanent spinner.
- Present a concise draft answer with clickable evidence and explicit gaps or tensions. Do not invent a numeric confidence badge.
- “Prepared finding,” “Generated draft,” and reviewed source facts have different meanings; label those states honestly.
- If the answer refers to invalid source IDs, withhold the unsupported material and explain that a supported answer could not be completed. Do not merely hide the citation.

### 5. Brief and export

- Add/remove selected findings and edit one concise conclusion. Avoid a rich text editor or slide designer.
- Keep original evidence immutable. Editing a finding leaves it a draft even when its source facts were reviewed.
- Retain selection across filters and drawer changes. Prefer local draft persistence when feasible and explain its refresh/cross-browser limits in the handoff.
- Start with one useful export containing the selected data, conclusion, and evidence, such as a Markdown brief with a table. Add a separate CSV export if it saves client work within the budget.
- Include source filenames, paragraph references, relevant quotes, units, employment/relationship context, and material caveats. An export must make sense outside the application.

### 6. Frontend finishing pass

- Prioritize clear type hierarchy, comfortable reading width, aligned columns, consistent spacing, and visible interactive controls.
- Use restrained status colors with text labels. Avoid decorative charts that suggest statistical validity.
- Check at a normal desktop width and a narrower window, for example 1280 and 768 pixels. On narrow layouts, stack panels or allow intentional table scrolling rather than clipping controls.
- Check keyboard access, visible focus, input labels, contrast, and drawer behavior. This is a usability check, not a claim of a complete accessibility audit.
- Cover empty filters, no selected findings, missing data, long quotations, generation errors, and generation unavailable. Do not invent loading states for already bundled synchronous data.
- Show clear feedback when a finding is added or a file is exported, without interrupting the task.

## Technical approach and ownership

Use the existing MVP brief's source, passage, case, claim, and finding records. Inspect existing code first; React/TypeScript is a reasonable default if no application exists. Add a backend only when required for live model calls or another implemented feature; Python is an option, not a requirement. Keep credentials outside the client. Prepared project data can be versioned JSON with source/extraction fingerprints; browser-local state is sufficient if draft persistence ships.

The first questioning implementation should use a plain retrieval function over the reviewed case records and their linked original passages. No generic adapter or multiple-provider interface is needed before a second implementation exists. Include evidence from each relevant case for comparative questions, preserve adjacent/qualifying context, and return insufficient evidence for questions the available material does not support. Do not send all documents through a single undifferentiated prompt or claim the first retrieval function has exhaustive semantic coverage.

Store original source records, reviewed observations, analyst drafts, and source references. Compute filtered views, selected exports, and question-specific drafts on demand. Cache a derived retrieval index only if an implemented retriever needs one; it is not the source of truth.

Use AI to propose observations for review, optionally choose relevant evidence, and draft answers. Use deterministic code for parsing, IDs/versioning, source lookup, validation, filtering, and export. Quotation text comes from the source store, not the model. Humans review semantic support and the known difficult cases; passing reference checks alone does not establish truth or completeness.

LightRAG is optional and has not been tested on these transcripts. Only run a capped 45-minute experiment within the remaining exercise budget after the core workflow works and a concrete retrieval limitation has been identified. Compare it on the same questions against the simpler retrieval baseline. Keep it only if it fixes the relevant miss without breaking attribution, citations, latency usability, or setup. Do not let installing a package count as a successful experiment. Do not change the UI contract if the retriever changes.

For coding agents, the coordinator owns the shared contract, integration, scope, and final demo. After the contract is fixed, delegate bounded tasks with separate file ownership: source-data preparation and validation; comparison/evidence frontend; brief/export or later question function. Avoid parallel agents editing the same types or inventing new schemas. Each task should return changed files, what was checked, and remaining limitations. A polished UI built against invented facts does not satisfy the task.

## Evidence and behavior checks

Keep one meaningful source-integrity check and one end-to-end workflow check. Do not spend the time box writing tests that merely mirror styling or implementation. The following question checks apply to prepared comparisons even if live Q&A is omitted.

| Check | Expected behavior |
| --- | --- |
| Expert 1's current vendor | Custom ITSM at the current employer; Thermo Fisher's ServiceNow experience is historical. |
| Calloway's BMC decision | Report cost relative to compliance/capability with source support, without claiming this establishes segment-wide vendor preference. |
| Solara's Freshservice price | Approximately $40 per agent per month; retain the unit and interview-specific nature of the estimate. |
| Hypothetical switching | Distinguish consideration from an adopted platform or completed switch. |
| Market share | No inferred population percentages; show supported case evidence and missing denominator/market/sampling/date information. |
| BMC rollout timing | Surface the unresolved tension between seven months being faster than expected and a later report of a delay versus the original plan. |
| Source validity | Every referenced passage exists in the expected source version; displayed quotations match canonical text. |
| Selected evidence and export | Filtering does not silently discard selections; exported claims preserve citations, units, period, and caveats. |
| Model unavailable | Prepared comparison and inspect/edit/export remain usable; live Q&A is clearly unavailable. |

For each evaluation question, record pass/fail, the actual cited passages, and any correction made. Fix the underlying source mapping, data, retrieval, prompt, or presentation problem; then rerun that case and any affected checks. Do not tweak a prompt merely to make one answer sound better without verifying its evidence.

## Submission package and evaluation fit

- **Prototype and reproducible run instructions:** the complete compare → inspect → select → edit → export task, plus honest status for live Q&A. This demonstrates execution.
- **Short product rationale:** intended analyst job, why these features matter, why the market-share limitation is explicit, and what was intentionally deferred. This demonstrates judgment.
- **Concise architecture note:** raw DOCX → passages → reviewed case/claim records → optional retrieval/generation → UI/export. Explain AI versus deterministic work, what is stored versus computed, source integrity, and limitations. This demonstrates communication and engineering reasoning.
- **Test/evaluation results:** real checks performed and known failures. Never claim checks passed before running them.
- **Prioritized near-term roadmap:** the five items below, with reasons and observable completion conditions.
- **AI-assisted work note:** briefly state how Claude/Codex helped with extraction proposals, implementation, critique, or testing and what was independently checked. This demonstrates the requested AI-assisted craft without making the framework itself the product.
- **Two-minute demo script:** open the comparison; investigate ServiceNow's premium using a live question or clearly labeled prepared finding; open Calloway evidence; show Expert 1's current/prior distinction; edit a conclusion; export it with sources and caveats.

If implementation cannot be completed within the time box, the assignment explicitly permits an architecture writeup. Deliver the actual implementation state and a clear architecture covering the same flow; never represent a static mock or prepared response as working generation.

## Near-term roadmap for the first design partner

These are priorities after the take-home, not extra prototype requirements. Order reflects the risk to a client using findings in an active report. Before sharing a hosted deployment with real client data, add the necessary access controls; a local demo does not establish production readiness.

| Priority | Next improvement | Why first / completion signal |
| --- | --- | --- |
| 1 | Persist analyst corrections and evidence review. Track draft/reviewed status and which findings depend on a changed claim. | A wrong company attribution is a direct trust failure. Done when a reviewer can correct it and dependent findings are visibly marked for re-review. |
| 2 | Make a fourth similar DOCX usable through reliable intake, parsing warnings, versioning, processing status/retry, and review. | Removes manual preparation for the next project. Done when the new interview becomes comparable without code edits or silent source loss. |
| 3 | Improve question quality using design-partner questions and a labeled evaluation set. Compare retrieval approaches, including lexical/vector and optional graph retrieval, only against observed misses. | Prevents confident omissions and unsupported synthesis. Done when agreed questions retrieve the required and qualifying evidence and abstain where it is absent. |
| 4 | Add project persistence and shared briefs with appropriate access controls and a basic change history. | Supports several analysts working on the same project. Done when a colleague can reopen an authorized project and understand edits and source versions. |
| 5 | Fit exports to the partner's actual Excel/report/slide template. | Removes the remaining copying and reformatting work. Done when the analyst can use an exported finding with citations and caveats intact in their real deliverable. |

## Explicit cuts

No universal ingestion, multi-project dashboard, autonomous agent tool loop, graph visualization, custom graph database, market-share pie chart, vendor ranking from incomparable scores, billing, or automatic slide generator in the take-home. Reuse existing infrastructure only when it helps finish a validated client action within the time box.

## Agent kickoff instruction

Start in the InterviewFileProcessor/ project root and read AGENTS.md, this roadmap, and MVP-BUILD-BRIEF.md. Follow AGENTS.md for implementation choices and this roadmap for milestone order. Build and verify one usable milestone at a time using the supplied transcripts. Preserve source files and never modify sources/. Put code and new derived records in this project. Verify the implemented parser and reuse its records, then implement comparison and exact-source inspection. Complete selection, editable conclusions, and export before adding live questions or experimenting with graph retrieval. After each milestone, report what works, the checks actually run, and the next highest-value correction. Keep the total exercise within 4–6 hours and finish with a truthful submission package and prioritized roadmap.
