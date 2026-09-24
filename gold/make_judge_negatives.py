"""Build the judge calibration set: seeded-error stores (one corrupted finding each, copied from run r4) and the
human labels for five real runs. Run from the project root with the venv Python: python gold/make_judge_negatives.py"""

import json
import shutil
import sys
from contextlib import closing
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from extract import RUBRIC_VERSION, open_findings, review  # noqa: E402
from parser import DEFAULT_DATABASE, open_database  # noqa: E402

RUNS = Path("results/runs")
SOURCE = RUNS / "1.6.0-r4" / "findings.sqlite"
OUT = Path("results/judge-negatives")

# case, finding in r4, changes, why it must fail. Several are traps: the wrong claim uses the words a regex looks for,
# or keeps a correct qualification beside a wrong statement.
NEGATIVES = [
    ("G01/G02", "E1:F001", {"statement": "The company currently runs ServiceNow as its ITSM platform.",
                            "vendor": "ServiceNow"}, "current platform stated as ServiceNow, not custom"),
    ("G02", "E1:F012", {"context_id": "E1:C01", "statement": "At the current employer, ServiceNow is a validated "
                        "system with GxP change workflows that Zendesk lacked."}, "Thermo capability moved to current"),
    ("G03", "E1:F083", {"statement": "ServiceNow implementation total cost of ownership was exactly twice its "
                        "competitors', the same gap as its license price versus Zendesk."}, "exact ratio, merged"),
    ("G05", "E2:F008", {"statement": "Calloway Biosciences has turned on the full BMC Helix AIOps suite and is "
                        "evaluating further add-ons.", "relationship": "deployed"}, "AIOps turned on (keyword trap)"),
    ("G05", "E3:F064", {"statement": "The company purchased Freshservice's analytics add-on for custom compliance "
                        "reporting."}, "analytics add-on purchased"),
    ("G06", "E3:F069", {"statement": "Solara has decided to move to ServiceNow when its Freshservice contract ends."},
     "conditional move stated as decided"),
    ("G08", "E1:F078", {"statement": "ServiceNow integrated with SAP and the security tools at Thermo Fisher, alongside "
                        "single sign-on with Active Directory and Workday."}, "SAP and security integrations asserted"),
    ("G09", "E1:F090", {"statement": "Thermo purchased separate non-production environments so business users could "
                        "test workflows, which drove the unexpected testing cost."},
     "environments purchased; the correct clarification is left in the qualification (trap)"),
    ("G10", "E1:F035", {"statement": "In strict priority order, Thermo Fisher's top five ITSM purchasing criteria were "
                        "scalability, integration capabilities, cost or total cost of ownership, user experience, and "
                        "customization."}, "ranking reordered, scalability first"),
    ("G11", "E2:F023", {"statement": "In strict priority order, the top five purchasing criteria were out-of-the-box "
                        "support for compliance workflows, total cost of ownership, implementation speed, integration "
                        "capability, and ease of administration for a small team."}, "first two criteria swapped"),
    ("G13", "E2:F079", {"qualifications": ["The original plan was therefore about five months: the seven-month rollout "
                                           "includes the two-month SAP delay."]}, "five-month plan calculated"),
    ("G15", "E1:F074", {"statement": "About 3-5 full-time employees maintained ServiceNow, and partners were engaged "
                        "for major upgrades or complex flows."},
     "full-time; the 30-40% qualification is left in place (trap)"),
    ("G16", "E1:F092", {"statement": "The expert rated the likelihood of continuing with ServiceNow 9 on the requested "
                        "1 to 7 scale.", "qualifications": []}, "stored as 9 on the 1-7 scale"),
    ("G17", "E3:F005", {"context_id": "E3:C01", "statement": "Solara ran Ivanti Service Manager, formerly Ivanti Heat, "
                        "on-premises before Freshservice."}, "prior Ivanti moved to Solara"),
]
# Human labels for the unedited model output of five runs; r1-r3 develop the judge prompt, r4-r5 are held out.
FAILS = {("G05", "r2"): "statement lists GRC as an included module; only the qualification says started (user decision)",
         ("G13", "r1"): "no finding cites both timing passages", ("G13", "r2"): "no finding cites both timing passages"}
AMBIGUOUS = {("G10", "r4"): "E1:F038 calls scalability 'the top criterion' for the single-factor question"}
CASES = ["G01/G02", "G02", "G03", "G05", "G06", "G08", "G09", "G10", "G11", "G13", "G15", "G16", "G17"]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    transcripts = open_database(DEFAULT_DATABASE, readonly=True)
    labels = []
    for number, (case, finding_id, changes, why) in enumerate(NEGATIVES, start=1):
        path = OUT / f"negative-{number:02d}-{case.replace('/', '-')}.sqlite"
        shutil.copyfile(SOURCE, path)
        with closing(open_findings(path)) as store:
            review(store, transcripts, finding_id, "edited", note=f"seeded calibration error: {why}", changes=changes)
        labels.append(dict(store=str(path), case=case, split="holdout", raw=False, expected="fail", seeded=True,
                           note=f"{finding_id}: {why}"))
    for run in ("r1", "r2", "r3", "r4", "r5"):
        store = RUNS / f"1.6.0-{run}" / "findings.sqlite"
        for case in CASES:
            if (case, run) in AMBIGUOUS:
                continue
            labels.append(dict(store=str(store), case=case, split="dev" if run in ("r1", "r2", "r3") else "holdout",
                               raw=True, expected="fail" if (case, run) in FAILS else "pass",
                               note=FAILS.get((case, run), "all rubric items expressed; no violation")))
    Path("gold/judge-labels.json").write_text(json.dumps(dict(
        rubric_version=RUBRIC_VERSION, excluded=[dict(case=c, run=r, why=w) for (c, r), w in AMBIGUOUS.items()],
        labels=labels), indent=1) + "\n")
    print(f"{len(NEGATIVES)} seeded stores in {OUT}; {len(labels)} labels")


if __name__ == "__main__":
    main()
