# Gold cases

The 18 regression cases the extraction must pass (`python extract.py --evaluate`). The deterministic checks live in `evaluate()` in [`extract.py`](../extract.py); the meaning each case checks is the rubric below (`GOLD_RUBRICS`, rubric 1.0.0), which the model judge scores and the extractor never sees. Passages are citation IDs in the transcripts in [`inputs/`](../inputs/). Results for every run are in [results/README.md](../results/README.md).

The cases come from the [evidence audit](evidence-audit.md), a full read of the three interviews. Its `E1:P021`-style paragraph IDs are the same citation IDs the parser assigns; the `.txt` extracts it mentions were an exploratory step and are not published.

## G01/G02 current employer and Thermo Fisher stay distinct

Scored once every section holding E1:P016, E1:P021, E1:P049 has run.

- **Must** (E1:P016): The current employer runs a custom, non-commercial ITSM platform.
- **Must** (E1:P016, E1:P049): The current employer used ServiceNow before and moved off it.
- **Must** (E1:P021): Thermo Fisher, a former employer, ran ServiceNow.

## G02 compliance discussion returns to Thermo Fisher

Scored once every section holding E1:P057 has run.

- **Must** (E1:P057): The validated-system and GxP change-workflow advantages over Zendesk are described as Thermo Fisher's.
- **Must not** (E1:P057): These capabilities are attributed to the current employer.

## G03 Thermo cost is implementation TCO

Scored once every section holding E1:P201 has run.

- **Must** (E1:P201): ServiceNow's implementation total cost of ownership was roughly double its competitors', stated as an approximation.
- **Must not** (E1:P201): The TCO comparison is merged with the P110 license comparison ("almost double Zendesk"), or given as an exact ratio.

## G04 Xena/Abzena does not create two proven employers

Scored once every section holding E1:P016, E1:P049 has run.

- Deterministic only: checked by field and wording rules in `evaluate()`, with no judge rubric.

## G05 module status stays installed/evaluated/considered/unpurchased

Scored once every section holding E1:P021, E1:P049, E2:P022, E2:P114, E3:P022, E3:P131 has run.

- **Must** (E1:P021): Thermo had started implementing GRC; it is not described as a completed or live module.
- **Must** (E1:P049): ServiceNow asset management at the current employer is a possible future step, not deployed.
- **Must** (E2:P022): Calloway is evaluating the full AIOps suite and has not turned it on.
- **Must** (E2:P114): The Digital Workplace mobile experience was a separate SKU added mid-implementation.
- **Must** (E3:P022): Solara recently turned on the Project module.
- **Must** (E3:P131): Solara has not purchased the analytics add-on.
- **Must not** (E1:P021, E1:P049, E2:P022, E2:P114, E3:P022, E3:P131): GRC as complete, current-employer asset management as deployed, AIOps as turned on, or the analytics add-on as purchased.

## G06 future ServiceNow moves stay conditional

Scored once every section holding E2:P156, E3:P140, E3:P144 has run.

- **Must** (E2:P156): Calloway's possible ServiceNow evaluation is conditional.
- **Must** (E3:P140, E3:P144): Solara's possible ServiceNow re-evaluation is conditional (for example, on significant growth).
- **Must not** (E2:P156, E3:P140, E3:P144): Either move is described as active, planned, or decided.

## G07/G08 interviewer premises are not supporting evidence

- Deterministic only: checked by field and wording rules in `evaluate()`, with no judge rubric.

## G08 compliance and integration claims stay within the expert's answer

Scored once every section holding E1:P057, E1:P180, E1:P188 has run.

- **Must not** (E1:P057): A SOX capability is asserted from this answer (the expert described GxP; SOX came from the question).
- **Must not** (E1:P180, E1:P188): SAP or security-tool integrations are asserted (the answers support AD/Workday and a Databricks/legacy-ERP example).

## G09 testing-access clarification qualifies the P237 yes

Scored once every section holding E1:P237, E1:P241, E1:P243, E1:P245 has run.

- **Must** (E1:P241): The unexpected cost came from underestimating how many business users needed access to test workflows.
- **Must** (E1:P237, E1:P245): The initial "yes" is carried with its later clarification, not stated alone.
- **Must not** (E1:P237, E1:P241, E1:P243, E1:P245): Separate non-production environments were purchased.

## G10 Thermo ranking and decisive reason remain distinct

Scored once every section holding E1:P086, E1:P102 has run.

- **Must** (E1:P086): The strict ranking puts integration first and scalability second.
- **Must** (E1:P102): Scalability was the single factor that set ServiceNow apart.
- **Must not** (E1:P086, E1:P102): The ranking and the decisive reason are merged (for example, scalability as the top-ranked criterion).

## G11 Calloway ranking and BMC choice rationale are retained

Scored once every section holding E2:P047, E2:P055 has run.

- **Must** (E2:P047): Five criteria in order: total cost of ownership, compliance, implementation speed, integration, ease of administration.
- **Must** (E2:P055): BMC was chosen as the best balance of cost and compliance readiness.
- **Must not** (E2:P047): The criteria appear in a different order.

## G12 Thermo expected and actual rollout durations preserve months

Scored once every section holding E1:P176, E1:P192 has run.

- Deterministic only: checked by field and wording rules in `evaluate()`, with no judge rubric.

## G13 BMC timing tension remains linked and unreconciled

Scored once every section holding E2:P089, E2:P139 has run.

- **Must** (E2:P089, E2:P139): One finding connects the "faster than expected" seven-month rollout with the SAP delay of almost two months "from the original plan".
- **Must** (E2:P089, E2:P139): The relationship is left unresolved; neither account is declared wrong.
- **Must not** (E2:P089, E2:P139): A reconciled original-plan length (such as five months) is stated or implied.

## G14 license prices retain company, amount, unit, currency, and stated basis

Scored once every section holding E1:P110, E2:P110, E3:P098 has run.

- Deterministic only: checked by field and wording rules in `evaluate()`, with no judge rubric.

## G15 Thermo staffing is not full-time headcount

Scored once every section holding E1:P171 has run.

- **Must** (E1:P171): About 3-5 employees maintained the system.
- **Must** (E1:P171): Each spent about 30-40% of their time on it.
- **Must** (E1:P171): Partners were engaged for major upgrades or complex work.
- **Must not** (E1:P171): The employees are described as full-time or as FTEs, or an FTE figure is presented as stated.

## G16 continuation rating preserves the 1-7 versus 9/10 mismatch

Scored once every section holding E1:P252, E1:P254 has run.

- **Must** (E1:P254): The expert answered 9 out of 10.
- **Must** (E1:P252, E1:P254): The question asked for a 1-7 rating; the mismatch is recorded and not rescaled.
- **Must not** (E1:P252, E1:P254): Stored as 9/7 or converted to another scale.

## G17 Ivanti products and experience are not conflated

Scored once every section holding E2:P039, E3:P017 has run.

- **Must** (E3:P017): The former employer ran Ivanti Service Manager, formerly Ivanti Heat, on-premises.
- **Must** (E2:P039): Calloway evaluated Ivanti Neurons for ITSM without buying it.
- **Must not** (E2:P039, E3:P017): The two products or experiences are merged, or Expert 3's Ivanti use is attributed to Solara.

## G18 no market-share percentage is inferred from interviews

- Deterministic only: checked by field and wording rules in `evaluate()`, with no judge rubric.

## Judge calibration

[`judge-labels.json`](judge-labels.json) holds human verdicts for the five 1.6.0 runs (development and held-out splits) and for the 14 seeded negatives; `python extract.py --calibrate gold/judge-labels.json` scores the judge against them.
