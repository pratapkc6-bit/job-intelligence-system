"""Generate skill-demand data from local job records.

V1 intentionally keeps collection and analysis separate. This script can run in
GitHub Actions today and later read jobs fetched from approved job sources or the
database.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JOBS_PATH = ROOT / "data" / "jobs.json"
OUTPUT_PATH = ROOT / "data" / "skill_summary.json"


def main() -> None:
    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    counts: Counter[str] = Counter()

    for job in jobs:
        counts.update(job.get("skills", []))

    summary = [
        {"skill": skill, "count": count}
        for skill, count in sorted(counts.items(), key=lambda item: (-item[1], item[0].lower()))
    ]

    OUTPUT_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"Analysed {len(jobs)} jobs and detected {len(summary)} distinct skills.")


if __name__ == "__main__":
    main()
