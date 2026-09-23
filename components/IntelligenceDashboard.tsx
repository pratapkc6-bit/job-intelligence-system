"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { jobs, profile } from "@/lib/data";
import type { ApplicationStatus, Job } from "@/lib/types";

type AppRecord = {
  status: ApplicationStatus;
  notes: string;
  updatedAt: string;
};

type AppMap = Record<string, AppRecord>;

const APP_KEY = "darwin-job-intelligence-applications-v2";
const STATUSES: ApplicationStatus[] = [
  "Not tracked",
  "Saved",
  "Considering",
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const projectIdeas: Record<string, string> = {
  "Active Directory": "Build a Windows onboarding lab: users, groups, permissions and account lifecycle.",
  "Microsoft 365": "Build a Microsoft 365 support runbook covering users, licences, MFA and common incidents.",
  "Desktop Support": "Build an IT help-desk lab with device setup, ticket triage and troubleshooting evidence.",
  "Networking": "Build a small network troubleshooting lab with VLAN, DNS, DHCP and connectivity scenarios.",
  "Business Analysis": "Create a requirements-to-solution case study with process map, user stories and acceptance criteria.",
  "Requirements Gathering": "Create a requirements workshop pack with stakeholder questions, traceability and acceptance criteria.",
  "SQL": "Build a support analytics database and dashboard using SQL queries on ticket data.",
  "System Integration": "Build a small API integration that synchronises records between two systems.",
  "ServiceNow": "Create a ServiceNow-style incident/change workflow prototype and document the lifecycle.",
  "ITIL": "Create an ITIL incident/problem/change mini service desk and measure SLA outcomes.",
  "Testing": "Build a test plan, test cases, defect log and evidence pack for an existing portfolio app.",
  "Azure DevOps": "Create a CI/CD lab that builds, tests and deploys a small application from GitHub.",
};

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

function profileHas(skill: string) {
  const target = normalise(skill);
  const aliases: Record<string, string[]> = {
    "customer service": ["communication"],
    "stakeholder management": ["communication"],
    "technical support": ["troubleshooting"],
    "it support": ["troubleshooting"],
    "process improvement": ["process improvement"],
    "data analysis": ["excel"],
    "reporting": ["excel"],
    "documentation": ["communication"],
    "requirements analysis": ["information systems"],
    "systems analysis": ["information systems"],
    "business analysis": ["information systems"],
    "ict projects": ["information systems"],
    "software development": ["python", "java"],
    "apis": ["python", "java"],
  };
  const userSkills = profile.skills.map(normalise);
  if (userSkills.some((item) => item === target || item.includes(target) || target.includes(item))) return true;
  return (aliases[target] ?? []).some((alias) =>
    userSkills.some((item) => item.includes(alias) || alias.includes(item)),
  );
}

function jobIntelligence(job: Job, app?: AppRecord) {
  const matched = job.skills.filter(profileHas);
  const missing = job.skills.filter((skill) => !profileHas(skill));
  const raw = job.skills.length ? matched.length / job.skills.length : 0;
  const educationBoost =
    ["Business Analysis", "Systems Analysis", "Development / Integration"].includes(job.category) ? 0.1 : 0;
  const juniorBoost = /entry|junior|l1/i.test(job.seniority) ? 0.08 : 0;
  const score = Math.min(100, Math.round((raw + educationBoost + juniorBoost) * 100));

  let action = "BUILD";
  let reason = "Build evidence for the biggest missing technical requirements before prioritising this role.";

  if (app?.status === "Interview") {
    action = "PREPARE INTERVIEW";
    reason = "This application is at interview stage, so interview evidence and role-specific questions come first.";
  } else if (/senior|lead|director/i.test(job.seniority) && score < 60) {
    action = "DEVELOPMENT TARGET";
    reason = "The role is senior and the current evidence match is limited; use it to guide future skill development.";
  } else if (score >= 55 || job.matchBand === "Strong Match") {
    action = "APPLY";
    reason = "There is enough verified alignment to justify investigating the role and tailoring application evidence.";
  } else if (score >= 30) {
    action = "LEARN";
    reason = "The role is within reach, but closing one or two recurring gaps would strengthen the application.";
  }

  return { matched, missing, score, action, reason };
}

function daysUntil(date: string | null) {
  if (!date) return null;
  const end = new Date(date + "T23:59:59").getTime();
  const now = Date.now();
  return Math.ceil((end - now) / 86400000);
}

function interviewQuestions(job: Job, missing: string[]) {
  const questions = [
    `Tell me about a time you solved a problem relevant to ${job.category}.`,
    `How would you approach your first 30 days in the ${job.title} role?`,
  ];
  for (const skill of job.skills.slice(0, 4)) {
    questions.push(`Explain how you would use or troubleshoot ${skill} in a real workplace scenario.`);
  }
  if (missing.length) {
    questions.push(`You have less direct evidence in ${missing[0]}. How would you close that gap quickly and safely?`);
  }
  return questions.slice(0, 6);
}

function projectFor(missing: string[]) {
  for (const skill of missing) {
    if (projectIdeas[skill]) return { skill, idea: projectIdeas[skill] };
  }
  const skill = missing[0] ?? "portfolio evidence";
  return {
    skill,
    idea: `Build a small documented lab that demonstrates ${skill}, including setup, testing, screenshots and lessons learned.`,
  };
}

export default function IntelligenceDashboard() {
  const [apps, setApps] = useState<AppMap>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState<number>(jobs[0]?.id ?? 0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(APP_KEY);
      if (saved) setApps(JSON.parse(saved));
    } catch {
      localStorage.removeItem(APP_KEY);
    }
  }, []);

  function openIntelligence(jobId: number) {
    setSelectedId(jobId);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById("job-intelligence")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    });
  }

  function updateApplication(jobId: number, patch: Partial<AppRecord>) {
    setApps((current) => {
      const previous = current[String(jobId)] ?? {
        status: "Not tracked" as ApplicationStatus,
        notes: "",
        updatedAt: "",
      };
      const next = {
        ...current,
        [String(jobId)]: {
          ...previous,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
      localStorage.setItem(APP_KEY, JSON.stringify(next));
      return next;
    });
  }

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(jobs.map((job) => job.category))).sort()],
    [],
  );

  const visibleJobs = useMemo(() => {
    const q = normalise(query);
    return jobs
      .filter((job) => {
        const matchesQuery =
          !q ||
          normalise(
            [job.title, job.company, job.category, job.location, ...job.skills].join(" "),
          ).includes(q);
        const matchesCategory = category === "All" || job.category === category;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        const ai = jobIntelligence(a, apps[String(a.id)]);
        const bi = jobIntelligence(b, apps[String(b.id)]);
        return bi.score - ai.score || (b.postedDate ?? "").localeCompare(a.postedDate ?? "");
      });
  }, [query, category, apps]);

  const selected = jobs.find((job) => job.id === selectedId) ?? jobs[0];
  const selectedApp = selected ? apps[String(selected.id)] : undefined;
  const selectedIntel = selected ? jobIntelligence(selected, selectedApp) : null;
  const selectedProject = selectedIntel ? projectFor(selectedIntel.missing) : null;

  const skillDemand = useMemo(() => {
    const map = new Map<string, { count: number; gap: number }>();
    for (const job of jobs) {
      for (const skill of job.skills) {
        const item = map.get(skill) ?? { count: 0, gap: 0 };
        item.count += 1;
        if (!profileHas(skill)) item.gap += 1;
        map.set(skill, item);
      }
    }
    return [...map.entries()]
      .map(([skill, values]) => ({ skill, ...values }))
      .sort((a, b) => b.count - a.count || b.gap - a.gap || a.skill.localeCompare(b.skill));
  }, []);

  const trackedApps = Object.entries(apps)
    .filter(([, value]) => value.status !== "Not tracked")
    .map(([id, value]) => ({
      job: jobs.find((job) => String(job.id) === id),
      ...value,
    }))
    .filter((item) => item.job);

  const bestFit = [...jobs]
    .map((job) => ({ job, intel: jobIntelligence(job, apps[String(job.id)]) }))
    .sort((a, b) => b.intel.score - a.intel.score)[0];

  const topGap = skillDemand
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap || b.count - a.count)[0];

  const closingSoon = jobs
    .map((job) => ({ job, days: daysUntil(job.closingDate) }))
    .filter((item) => item.days !== null && item.days >= 0 && item.days <= 14)
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">DARWIN IT CAREER COMMAND CENTRE</p>
          <h1>Real jobs. Evidence. One next action.</h1>
          <p className="heroCopy">
            Current Darwin and NT technology opportunities, requirement extraction, skill-demand
            analysis, personal matching, resume tailoring, interview preparation and application tracking.
          </p>
        </div>
        <div className="statusCard">
          <span className="statusDot" />
          <div>
            <strong>{jobs.length} verified real roles</strong>
            <p>Sources checked 23 Sep 2026 · no sample companies</p>
          </div>
        </div>
      </header>

      <section className="statsGrid commandStats">
        <article className="statCard">
          <span>Best current evidence match</span>
          <strong>{bestFit?.intel.score ?? 0}%</strong>
          <small>{bestFit?.job.title ?? "No roles"}</small>
        </article>
        <article className="statCard">
          <span>Highest recurring gap</span>
          <strong>{topGap?.gap ?? 0}</strong>
          <small>{topGap?.skill ?? "No gap detected"}</small>
        </article>
        <article className="statCard">
          <span>Closing within 14 days</span>
          <strong>{closingSoon.length}</strong>
          <small>{closingSoon[0] ? `${closingSoon[0].job.title}: ${closingSoon[0].days}d` : "None with known deadline"}</small>
        </article>
        <article className="statCard">
          <span>Applications tracked</span>
          <strong>{trackedApps.length}</strong>
          <small>{trackedApps.filter((item) => ["Assessment","Interview"].includes(item.status)).length} active assessment/interview</small>
        </article>
      </section>

      <section className="panel nextActionPanel">
        <div>
          <p className="eyebrow">NEXT ACTION</p>
          <h2>{bestFit?.job.title}</h2>
          <p className="muted">
            {bestFit?.intel.action}: {bestFit?.intel.reason}
          </p>
        </div>
        {bestFit && (
          <button className="primaryButton" onClick={() => openIntelligence(bestFit.job.id)}>
            Open intelligence
          </button>
        )}
      </section>

      <section className="panel jobsPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">REAL OPPORTUNITIES</p>
            <h2>Darwin / NT technology roles</h2>
          </div>
          <span className="pill">Source evidence retained</span>
        </div>
        <div className="filterBar">
          <input
            aria-label="Search jobs"
            placeholder="Search role, company or skill"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="jobGrid">
          {visibleJobs.map((job) => {
            const intel = jobIntelligence(job, apps[String(job.id)]);
            const days = daysUntil(job.closingDate);
            return (
              <button
                type="button"
                className={`jobCard ${selected?.id === job.id ? "selectedJob" : ""}`}
                key={job.id}
                onClick={() => openIntelligence(job.id)}
              >
                <div className="jobCardTop">
                  <span className={`actionBadge action-${intel.action.toLowerCase().replaceAll(" ", "-")}`}>
                    {intel.action}
                  </span>
                  <strong>{intel.score}%</strong>
                </div>
                <h3>{job.title}</h3>
                <p>{job.company}</p>
                <small>{job.location} · {job.employmentType}</small>
                <div className="chipRow">
                  {job.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
                <div className="jobMeta">
                  <span>{job.postedDate ? `Posted ${job.postedDate}` : "Posted date unavailable"}</span>
                  {days !== null && days >= 0 && <span>{days}d to close</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selected && selectedIntel && selectedProject && (
        <section className="intelligenceGrid" id="job-intelligence">
          <article className="panel jobDetailPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">JOB INTELLIGENCE</p>
                <h2>{selected.title}</h2>
                <p className="muted">{selected.company} · {selected.location}</p>
              </div>
              <div className="scoreRing">{selectedIntel.score}%</div>
            </div>

            <p className="jobSummary">{selected.summary}</p>

            <div className="detailFacts">
              <div><span>Salary</span><strong>{selected.salary ?? "Not stated"}</strong></div>
              <div><span>Seniority</span><strong>{selected.seniority}</strong></div>
              <div><span>Employment</span><strong>{selected.employmentType}</strong></div>
              <div><span>Closing</span><strong>{selected.closingDate ?? "Not stated"}</strong></div>
            </div>

            <div className="evidenceColumns">
              <div>
                <h3>Verified matches</h3>
                <div className="chipRow positive">
                  {selectedIntel.matched.length
                    ? selectedIntel.matched.map((skill) => <span key={skill}>{skill}</span>)
                    : <span>No direct matches detected</span>}
                </div>
              </div>
              <div>
                <h3>Gaps, not claims</h3>
                <div className="chipRow warning">
                  {selectedIntel.missing.length
                    ? selectedIntel.missing.map((skill) => <span key={skill}>{skill}</span>)
                    : <span>No core gaps detected</span>}
                </div>
              </div>
            </div>

            <div className="requirementsBlock">
              <h3>Requirements extracted</h3>
              <ul>{selected.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>

            <div className="sourceBox">
              <div>
                <span>Evidence source</span>
                <strong>{selected.source}</strong>
                <small>Last verified {selected.lastVerified}</small>
              </div>
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open original ↗</a>
            </div>
          </article>

          <aside className="panel actionPanel">
            <p className="eyebrow">ACTION ENGINE</p>
            <h2>{selectedIntel.action}</h2>
            <p className="muted">{selectedIntel.reason}</p>

            <div className="actionSection">
              <h3>Application tracker</h3>
              <select
                value={selectedApp?.status ?? "Not tracked"}
                onChange={(event) =>
                  updateApplication(selected.id, { status: event.target.value as ApplicationStatus })
                }
              >
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
              <textarea
                rows={3}
                placeholder="Application notes, follow-up, contact..."
                value={selectedApp?.notes ?? ""}
                onChange={(event) => updateApplication(selected.id, { notes: event.target.value })}
              />
            </div>

            <div className="actionSection">
              <h3>Learning / project gap</h3>
              <strong>{selectedProject.skill}</strong>
              <p>{selectedProject.idea}</p>
            </div>

            <div className="actionSection">
              <h3>Interview preparation</h3>
              <ol>
                {interviewQuestions(selected, selectedIntel.missing).map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            </div>

            <div className="actionButtons">
              <Link className="primaryLink" href={`/resume?job=${selected.id}`}>
                Tailor resume
              </Link>
              <a className="secondaryLink" href={selected.sourceUrl} target="_blank" rel="noreferrer">
                Verify / apply ↗
              </a>
            </div>
          </aside>
        </section>
      )}

      <section className="contentGrid intelligenceLower">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">SKILL INTELLIGENCE</p>
              <h2>Demand vs your evidence</h2>
            </div>
            <span className="pill">Current verified snapshot</span>
          </div>
          <div className="skillDemandTable">
            {skillDemand.slice(0, 14).map((item) => (
              <div className="skillDemandRow" key={item.skill}>
                <strong>{item.skill}</strong>
                <span>{item.count} roles</span>
                <span className={item.gap ? "gapCount" : "coveredCount"}>
                  {item.gap ? `gap in ${item.gap}` : "covered"}
                </span>
              </div>
            ))}
          </div>
          <p className="baselineNote">
            7/30/90-day trend collection starts from this live baseline. Historical arrows appear after
            scheduled snapshots accumulate instead of fabricating a trend from one day of data.
          </p>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">APPLICATION PIPELINE</p>
              <h2>Your tracked roles</h2>
            </div>
          </div>
          {trackedApps.length ? (
            <div className="applicationList">
              {trackedApps.map((item) => (
                <button key={item.job!.id} onClick={() => openIntelligence(item.job!.id)}>
                  <div><strong>{item.job!.title}</strong><span>{item.job!.company}</span></div>
                  <span className="pill">{item.status}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">
              No applications tracked yet. Save or update a job from the intelligence panel and it will appear here.
            </p>
          )}
        </article>
      </section>

      <footer>
        Darwin Job Intelligence · real-source V2 · GitHub Actions + GitHub Pages · evidence before confidence.
      </footer>
    </main>
  );
}
