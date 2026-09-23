# Darwin Job Intelligence

A portfolio-grade system for turning real Darwin / Northern Territory IT vacancies into practical career actions.

Instead of learning technologies at random, the project tracks local IT roles, extracts recurring skills, compares them with a personal skill profile, and produces three useful outcomes:

- **APPLY** — roles worth investigating now.
- **LEARN** — skills that repeatedly block otherwise realistic roles.
- **BUILD** — portfolio projects that can prove those skills.

## V1 status

The first version is intentionally small and inspectable:

- Next.js dashboard foundation
- sample Darwin-style IT job records
- deterministic Python skill-demand analysis
- PostgreSQL / Neon schema
- scheduled GitHub Actions analysis workflow
- architecture documentation

The sample job records are placeholders and are clearly labelled. Live job-source ingestion comes next so the system does not quietly transform fiction into career advice, a surprisingly popular software feature.

## Stack

- Next.js + TypeScript
- Python
- PostgreSQL / Neon
- GitHub Actions
- Vercel (deployment target)

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Run the Python analyser:

```bash
python scripts/analyse_jobs.py
```

## Database

The initial relational model is in `database/schema.sql`.

Core entities:

- companies
- jobs
- skills
- job_skills
- my_skills
- applications

## Roadmap

### V1 — Foundation
Dashboard, schema, deterministic analysis and sample data.

### V2 — Live Darwin jobs
Ingest current vacancies from approved/public sources, normalize them, remove duplicates, and preserve source URLs and dates.

### V3 — Skill intelligence
Track skill frequency, role categories, employers and changes over time.

### V4 — Personal matching
Compare vacancy requirements with a personal skill profile and explain gaps with evidence.

### V5 — Learning and portfolio loop
Convert high-value gaps into lessons and portfolio projects.

### V6 — Application intelligence
Track applications, tailored evidence, interview topics and outcomes.

## Portfolio story

> I built a Darwin-focused job intelligence platform that converts local vacancy data into skill-demand analysis, job-readiness signals and learning priorities. I designed the data model, built the analysis pipeline in Python, used PostgreSQL for persistence, automated analysis with GitHub Actions, and built the dashboard with Next.js for deployment on Vercel.

## Current limitation

V1 ships with sample records only. No scraped or third-party job advertisement text is redistributed in the repository.
