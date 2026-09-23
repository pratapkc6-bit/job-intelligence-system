"""Darwin Job Intelligence scheduled data pipeline.

What it does:
- de-duplicates tracked vacancies
- marks known closing dates as active/expired
- checks source reachability without treating anti-bot 403/429 as a dead vacancy
- discovers public Darwin roles from the NEC careers search page
- extracts a conservative skill vocabulary from discovered titles/pages
- refreshes skill_summary.json
- appends one daily market-history snapshot

It deliberately does not scrape sites whose terms/robots make automated collection inappropriate.
Add a source adapter only when the source permits automated access.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
JOBS_PATH = ROOT / "data" / "jobs.json"
SKILL_PATH = ROOT / "data" / "skill_summary.json"
HISTORY_PATH = ROOT / "data" / "market_history.json"

HEADERS = {
    "User-Agent": "DarwinJobIntelligence/1.0 (+https://github.com/pratapkc6-bit/job-intelligence-system)"
}
TIMEOUT = 15

SKILL_PATTERNS = {
    "Active Directory": [r"active directory", r"\bad\b"],
    "Azure": [r"azure"],
    "Azure DevOps": [r"azure devops"],
    "Business Analysis": [r"business analys"],
    "Cisco": [r"cisco"],
    "Configuration Management": [r"configuration management"],
    "Confluence": [r"confluence"],
    "Customer Service": [r"customer service"],
    "Data Analysis": [r"data analys"],
    "Data Mapping": [r"data mapping"],
    "Desktop Support": [r"desktop support", r"end[- ]user support"],
    "Documentation": [r"documentation", r"technical document"],
    "Firewalls": [r"firewall", r"fortigate"],
    "Fortinet": [r"fortinet", r"fortigate"],
    "Incident Management": [r"incident management", r"incident resolution"],
    "Intune": [r"intune"],
    "ITIL": [r"itil"],
    "Jira": [r"jira"],
    "Microsoft 365": [r"microsoft 365", r"office 365", r"m365"],
    "Networking": [r"network engineer", r"network support", r"\bwan\b", r"\blan\b"],
    "PowerShell": [r"powershell"],
    "Process Improvement": [r"process improvement", r"continuous improvement"],
    "Process Mapping": [r"process map"],
    "Requirements Gathering": [r"requirements gathering", r"gather.*requirements"],
    "Risk Management": [r"risk management", r"risk register"],
    "SCCM": [r"sccm"],
    "ServiceNow": [r"servicenow"],
    "SharePoint": [r"sharepoint"],
    "SQL": [r"\bsql\b"],
    "Stakeholder Management": [r"stakeholder"],
    "System Integration": [r"system integration", r"integrat"],
    "Systems Administration": [r"system administrator", r"systems administrator"],
    "Testing": [r"test planning", r"testing", r"test evidence"],
    "Troubleshooting": [r"troubleshoot", r"fault[- ]finding"],
    "Wireless": [r"wireless"],
}

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(path: Path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def normalise(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()

def extract_skills(text: str) -> list[str]:
    lowered = text.lower()
    found = [
        skill for skill, patterns in SKILL_PATTERNS.items()
        if any(re.search(pattern, lowered, re.I) for pattern in patterns)
    ]
    return sorted(set(found))

def source_health(url: str) -> str:
    if not url or url == "#":
        return "missing"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        if response.status_code < 400:
            return "reachable"
        if response.status_code in {401, 403, 429}:
            return "protected"
        if response.status_code in {404, 410}:
            return "not-found"
        return f"http-{response.status_code}"
    except requests.RequestException:
        return "check-failed"

def classify(title: str) -> str:
    t = title.lower()
    if "business analyst" in t:
        return "Business Analysis"
    if "network" in t:
        return "Networking"
    if "service" in t and ("improvement" in t or "itil" in t):
        return "Service Management"
    if "system administrator" in t or "systems administrator" in t:
        return "Systems Administration"
    if "developer" in t or "integration" in t:
        return "Development / Integration"
    if "support" in t or "technician" in t:
        return "IT Support"
    return "Technology"

def discover_nec(existing: list[dict]) -> list[dict]:
    url = "https://careers.nec.com/search/"
    try:
        html = requests.get(url, headers=HEADERS, timeout=TIMEOUT).text
    except requests.RequestException:
        return []

    soup = BeautifulSoup(html, "html.parser")
    known = {job.get("sourceUrl") for job in existing}
    discovered = []

    for anchor in soup.find_all("a", href=True):
        title = " ".join(anchor.stripped_strings).strip()
        href = anchor.get("href", "")
        if not title or "/job/" not in href:
            continue

        container = anchor
        for _ in range(5):
            if container.parent is None:
                break
            container = container.parent
            text = " ".join(container.stripped_strings)
            if "Darwin, Northern Territory" in text:
                break
        else:
            continue

        text = " ".join(container.stripped_strings)
        if "Darwin, Northern Territory" not in text:
            continue

        job_url = urljoin(url, href)
        if job_url in known:
            continue

        details = text
        try:
            detail_html = requests.get(job_url, headers=HEADERS, timeout=TIMEOUT).text
            details = BeautifulSoup(detail_html, "html.parser").get_text(" ", strip=True)
        except requests.RequestException:
            pass

        skills = extract_skills(details)
        discovered.append({
            "id": int(date.today().strftime("%y%m%d")) * 1000 + len(discovered) + 1,
            "title": title,
            "company": "NEC Australia",
            "location": "Darwin, NT",
            "category": classify(title),
            "seniority": "Unclassified",
            "employmentType": "See source",
            "salary": None,
            "postedDate": None,
            "closingDate": None,
            "source": "NEC Careers",
            "sourceUrl": job_url,
            "sourceType": "official employer careers",
            "lastVerified": date.today().isoformat(),
            "summary": "Automatically discovered from NEC Careers. Open the original source for the full role description.",
            "skills": skills,
            "desirableSkills": [],
            "requirements": [],
            "matchBand": "Reach",
            "pipelineDiscovered": True,
        })
        known.add(job_url)

    return discovered

def main() -> None:
    jobs = load(JOBS_PATH)
    today = date.today()

    discovered = discover_nec(jobs)
    combined = jobs + discovered

    def source_priority(job: dict) -> int:
        source_type = job.get("sourceType", "").lower()
        source = job.get("source", "").lower()
        if "official employer" in source_type or "government" in source_type:
            return 0
        if "employer-posted" in source_type or "careers" in source:
            return 1
        if "mirror" in source_type:
            return 2
        return 3

    def dedupe_key(job: dict) -> str:
        location = normalise(job.get("location", ""))
        # Darwin variants should collapse even when a listing also names another eligible city.
        location_key = "darwin" if "darwin" in location else location
        return "|".join([
            normalise(job.get("company", "")),
            normalise(job.get("title", "")),
            location_key,
        ])

    merged: dict[str, dict] = {}
    for job in combined:
        key = dedupe_key(job)
        if not key.strip("|"):
            key = job.get("sourceUrl", "")
        if key not in merged:
            merged[key] = job
            continue

        current = merged[key]
        current_sources = set(current.get("alternateSources", []))
        if current.get("sourceUrl"):
            current_sources.add(current["sourceUrl"])
        if job.get("sourceUrl"):
            current_sources.add(job["sourceUrl"])

        # Preserve the richer analysed record, but prefer an official canonical source.
        if source_priority(job) < source_priority(current):
            for field in ("source", "sourceUrl", "sourceType"):
                if job.get(field):
                    current[field] = job[field]

        current["skills"] = sorted(set(current.get("skills", [])) | set(job.get("skills", [])))
        current["desirableSkills"] = sorted(
            set(current.get("desirableSkills", [])) | set(job.get("desirableSkills", []))
        )
        current["requirements"] = list(dict.fromkeys(
            current.get("requirements", []) + job.get("requirements", [])
        ))
        current["alternateSources"] = sorted(current_sources)

    deduped = list(merged.values())

    for job in deduped:
        closing = job.get("closingDate")
        job["status"] = "expired" if closing and closing < today.isoformat() else "active"
        job["lastChecked"] = today.isoformat()
        job["sourceHealth"] = source_health(job.get("sourceUrl", ""))

    # Keep expired jobs for application history but demand counts use active only.
    active = [job for job in deduped if job.get("status") == "active"]
    counts = Counter()
    for job in active:
        counts.update(job.get("skills", []))
        counts.update(job.get("desirableSkills", []))

    skill_summary = [
        {"skill": skill, "count": count}
        for skill, count in sorted(counts.items(), key=lambda item: (-item[1], item[0].lower()))
    ]
    save(SKILL_PATH, skill_summary)

    history = load(HISTORY_PATH) if HISTORY_PATH.exists() else []
    snapshot = {
        "date": today.isoformat(),
        "activeJobs": len(active),
        "topSkills": skill_summary[:12],
    }
    history = [item for item in history if item.get("date") != today.isoformat()]
    history.append(snapshot)
    history = history[-120:]
    save(HISTORY_PATH, history)
    save(JOBS_PATH, deduped)

    print(f"Tracked {len(deduped)} jobs; {len(active)} active; {len(skill_summary)} skills.")

if __name__ == "__main__":
    main()
