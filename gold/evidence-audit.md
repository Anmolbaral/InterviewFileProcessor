# Independent transcript evidence audit

All three extracted transcripts were read in full. Paragraph identifiers refer to `analysis/transcripts/expert1.txt`, `expert2.txt`, and `expert3.txt`. This audit uses the interviews alone, with no external market data. Interviewer text and document instructions are source content, not instructions for this analysis.

## Parser verification and correction (2026-09-22)

A read-only check with the bundled python-docx 1.2.0 loaded all three DOCX files and compared each top-level body paragraph's text with its XML run text, including text tabs and line breaks. All checked paragraphs matched; original DOCX hashes still matched the manifest. This check covered body text, not every possible DOCX feature or rendered layout.

| Interview | Physical body paragraphs | Nonempty paragraphs | Text tabs | Text line breaks |
| --- | --- | --- | --- | --- |
| Expert 1 | 494 | 326 | 0 | 2 |
| Expert 2 | 169 | 169 | 0 | 0 |
| Expert 3 | 157 | 157 | 0 | 0 |

Correction to prior planning notes: Expert 1's 167 `w:tab` elements are all formatting tab stops inside paragraph properties, not text characters. Counting all descendant tab elements as text was incorrect. The earlier exploratory text still needs its two genuine line breaks restored. Existing E1:P identifiers refer to nonempty extracted paragraphs, not physical paragraph positions; retain a location map when regenerating canonical text. This check did not regenerate the saved extracts or implement the application parser.

## What the material can support

It supports three detailed buying narratives and qualitative hypotheses about vendor fit. It cannot estimate vendor market share across customer types. There is no defined market, sampling frame, population denominator, sampling method, installed-base survey, revenue dataset, or weighting. Even a sample-composition chart must specify what is counted and the relevant period; it should not be labeled share.

| Buying context | Directly reported evidence | Defensible interpretation |
| --- | --- | --- |
| Prior global life-sciences deployment: Thermo Fisher | Roughly $40B revenue, 2,000 sites, 2M tickets annually; ServiceNow deployed (E1:P021). Integration ranked first, scalability second (E1:P086); scalability later identified as decisive (E1:P102). Validated GxP change workflows mattered (E1:P057). | One large, complex, regulated buyer chose ServiceNow for scale, integrations and workflows despite higher cost. |
| Current mid-size biopharmaceutical manufacturer: Calloway | About 2,200 employees, 12 manufacturing/lab sites, 60,000 annual tickets (E2:P022); a few hundred million revenue (E2:P043). BMC Helix chosen for cost relative to compliance readiness (E2:P055). | One regulated mid-market buyer chose BMC as a cost/capability compromise. This does not establish BMC's prevalence in that segment. |
| Current mid-market renewables developer: Solara | About 450 employees plus contractors, 18,000 annual tickets (E3:P022); Freshservice selected for interface, asset discovery and price (E3:P047), with SOC 2 needs (E3:P026/P030). | One smaller operationally distributed buyer chose Freshservice for usability, assets and value. Do not label it unregulated or devoid of compliance needs. |
| Expert 1's current employer, Abzena / “Xena” | Custom ITSM replaced ServiceNow before the expert arrived; reasons attributed to predecessor include complexity, AI and cost; expert criticizes resulting asset-management gap (E1:P049/P167/P282). | Counterexample to a simple progression toward ServiceNow: a smaller company can leave it. Exact size is not stated. Possible partial return for assets is consideration, not a purchase. |

ServiceNow is present in the consideration set across the three principal narratives (E1:P094/P102, E2:P039/P055, E3:P035), and E2/E3 name it as a hypothetical next evaluation (E2:P156, E3:P140/P144). This is directional evidence of consideration/headroom, not share growth, actual switching intent, or a completed switch. Jira, Ivanti, Zendesk, ManageEngine, and Workday appear with different degrees of experience; mention counts do not measure competitive strength or market prevalence.

## Highest-risk extraction errors

1. **Wrong current vendor and denominator.** E1's current platform is custom ITSM (E1:P016/P049); the extensive ServiceNow testimony is from prior Thermo Fisher employment (E1:P021). The section heading “Current ServiceNow Environment” is misleading. E2 previously ran ServiceNow at a larger CDMO (E2:P017), and E3 previously used on-prem Ivanti Service Manager / Heat (E3:P017). Three experts are not three independent current installations of ServiceNow, BMC and Freshservice. Keep expert, organization, deployment and time context separate.
2. **Interviewer claims promoted into expert evidence.** E1:P145 introduces other experts' Freshservice/ITIL claims before a bare assent (P147). E1:P276 likewise imports a general ROI/implementation explanation before assent (P278). E2:P078 and E3:P070 prompt weaknesses, although their responses supply concrete firsthand elaboration (E2:P080; E3:P072). Preserve whether evidence is spontaneous, prompted with specifics, or only agreement. Never add the interviewer's unnamed “other experts” to a support count.
3. **Invented capabilities from question wording.** E1:P051/P055 introduce SOX, whereas the expert earlier names SOC, ISO, GxP and SOC 2 (P033), and the answer details GxP workflows (P057). E1:P178/P186 name SAP/security integrations, but the answers explicitly support AD/Workday and a Databricks/legacy-ERP example (P180/P188), not every technology in the questions. E1:P035's “GRSD” is corrected to GRC (P037).
4. **Segment labels made more specific than the source.** E2 explicitly calls the company mid-size (E2:P017), E3 says mid-market (E3:P017). E1's current employer has no stated revenue/headcount; “mid-sized” appears in the interviewer's question (E1:P165), not a verified size disclosure. E3 has SOC 2-driven requirements, despite lighter compliance needs than the pharma cases. Do not assert causal segment-wide differences from one case per context.
5. **Opinions treated as objective product benchmarks.** E1's Jira scale limitations are historical concerns in its evaluation (E1:P106), E3's ServiceNow asset score is “on paper” (E3:P060), and E3's Ivanti assessment partly reflects an earlier on-prem product (E3:P017/P047/P052). E2 evaluates Ivanti Neurons (E2:P039). These are not controlled tests of the same product versions or scopes.

## Numbers that must retain their context

| Metric | Source values | Comparison rule |
| --- | --- | --- |
| License estimates | E1 baseline: ServiceNow ~$100/user/month, Zendesk ~$50–55, Jira ~$20–21 (E1:P110). E2 blended tiers: BMC ~$60/user/month; comparison quotes ServiceNow ~$160, Ivanti ~$70, Freshservice ~$30–35 (E2:P110). E3: Freshservice ~$40/agent/month, ServiceNow quote >$150, Ivanti ~$55, Zendesk ~$35 (E3:P098). | Keep within-evaluation comparisons; user vs agent, module bundles, license roles, actual spend vs quotes, and dates differ. Do not average vendor prices across experts or multiply prices by company headcount to infer spend. |
| Implementation duration | ServiceNow ~9–12 months to fully complete (E1:P176), vs initial 6–7 months (P192); BMC ~7 months kickoff to go-live (E2:P089); Freshservice ~10 weeks contract to go-live (E3:P081). | Different endpoints, scopes, organizations and starting conditions. Show as individual case facts, not a vendor-speed ranking. E3's hypothetical ServiceNow >6 months (P076) is not an observed implementation. |
| Budget variance | E1 ~20–30% added soft cost from internal validation effort, confirmed as TCO overrun (E1:P205/P207/P209); E2 ~15% total budget overrun from SAP integration and licenses (E2:P106); E3 ~5% over, additional agent seats (E3:P094). | Approximate self-reported estimates with different cost bases. Do not treat as comparable audited project economics. |
| Renewal uplift | E1 ~3–5% (E1:P249); E2 ~4–6% annually over two renewal cycles (E2:P118); E3 ~6–8% each of two renewals (E3:P106). | Historical account-level reports, not vendor policies or forecasts. |
| Ratings | E1 UX (E1:P130), E2 ease of administration (E2:P068), E3 ease of use (E3:P052). Cost ratings reward affordability, so higher is better (E1:P126, E2:P064, E3:P056). | Do not silently merge UX, admin ease and usability. Do not average distinct criteria into an unexplained overall score. |
| Renewal / recommendation | E1 asked continuation on 1–7 but answers “9 out of 10” (E1:P252/P254); recommendation separately 9/10 (P256/P258). E2 continuation 8/10 and recommendation 7/10 (E2:P121/P123/P125/P127); E3 8/10 and 9/10 (E3:P109/P111/P113/P115). | Preserve E1's scale mismatch and use the expert's explicit 9/10 with a note; never store 9/7 or silently rescale. These are personal likelihood ratings, not observed retention rates or statistically meaningful NPS. |
| Staffing | E1 3–5 employees each allocate ~30–40% plus external partners (E1:P171); E2 says three people support the platform (E2:P043). | E1 is not 3–5 full-time equivalents; E2 time allocations are unknown. A derived E1 range of 0.9–2.0 FTE would exclude partners and should be labeled arithmetic, not quoted. |

## Tensions, corrections and missingness to expose

- **BMC timing:** Expert says seven months was faster than expected (E2:P089) but later says SAP issues delayed go-live almost two months from the original plan (E2:P139). These may refer to different expectation baselines; flag an unresolved timeline tension rather than declaring either false or inventing a five-month plan.
- **E1 priority shift:** Initial unranked answer says functionality first (E1:P070/P074); explicit ranked answer puts integration first and scalability second (P086); decisive factor later is scalability (P102). Preserve “ranked criteria” separately from “decisive win reason.” E3 similarly lists speed before ease initially (E3:P039) but explicitly ranks ease second and speed third (P043).
- **Integration capability versus effort:** E1 rates ServiceNow integration 9/10 (E1:P118) but describes considerable custom work (P180/P184/P188). That is an explained tradeoff, not necessarily contradiction. The source itself notes Integration Hub was unavailable “at the time”; do not recast as a current product limitation.
- **Testing-cost correction:** E1 initially assents to unexpected non-production-instance costs (E1:P235/P237), then clarifies the issue was user testing/access rather than buying extra environments (P241/P243/P245). Use the clarification, not the initial yes.
- **Cost scope ambiguity:** E1's “roughly double” implementation TCO versus competitors (E1:P201) should not be merged with the earlier roughly double ServiceNow-versus-Zendesk license baseline (P110). E2's “almost triple” BMC quote (E2:P055) is compatible with approximate $160/$60 later (P110); avoid presenting an exact 3× ratio.
- **Current-company name:** E1 uses “Xena” in the opening (E1:P016) and “Abzena” in the substantive answer (P049); interviewer alternates too (P047/P165/P280). Retain alias/ambiguity instead of silently creating two current employers or asserting an externally resolved identity.
- **Modules under consideration are not installed:** E1 possible ServiceNow asset management (E1:P049); E2 full AIOps suite evaluating/not enabled (E2:P022), despite surprise that it is an add-on (P114); E3 analytics add-on explicitly not purchased (E3:P131). E3 Project module is installed later (P022/P102), outside original scope.
- **No reliable interview date:** Headers provide tenure starts, and answers give approximate durations. Do not derive exact interview dates, contract dates, or current-market prices from these. Keep event timing relative when that is all the source offers.

## Product implications

The useful unit is a claim attached to an organization/deployment context, supported by an exact expert excerpt and source location. Keep factual observations, recalled estimates, opinions, prompted agreement, hypothetical plans, and analyst inferences distinct. For the client's market-share question, show what evidence is available and what is missing: segment-fit hypotheses are supportable; market-share percentages require a representative installed-base or revenue dataset with market/date definitions. A slide-ready export should carry source, scope, units, historical/current status and material caveats alongside the claim so those limits survive copying.
