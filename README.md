# Darwin Job Intelligence

A live Darwin / Northern Territory IT career command centre that turns real vacancy evidence into practical career actions.

## What the system does

1. Tracks real Darwin/NT technology vacancies with source URLs and verification dates.
2. De-duplicates the same vacancy across multiple sources and marks known closing dates as expired.
3. Extracts technical and business requirements into a consistent skill vocabulary.
4. Builds a Darwin IT skill-demand snapshot and records daily history for future 7/30/90-day trends.
5. Compares each vacancy with a verified personal profile and separates matches from gaps.
6. Produces an evidence-based action: APPLY, LEARN, BUILD, PREPARE INTERVIEW, or DEVELOPMENT TARGET.
7. Tailors a resume to a selected role without inventing experience or unsupported skills.
8. Converts missing requirements into learning priorities and portfolio-project ideas.
9. Tracks application status and notes privately in the user's browser.
10. Presents the above in one mobile-friendly career command centre.

## Live deployment

Production:

`https://pratapkc6-bit.github.io/job-intelligence-system/`

Resume Maker:

`https://pratapkc6-bit.github.io/job-intelligence-system/resume/`

The site is hosted by GitHub Pages and deployed by GitHub Actions.

## Current live data

The repository no longer uses fictional employers. The live dataset is seeded from current Darwin/NT vacancies verified on 23 September 2026 and is refreshed by the intelligence pipeline.

Current sources include public employer/government career pages and traceable public job listings. The pipeline automatically discovers public Darwin roles from NEC Careers and verifies the known source links. Additional source adapters can be added only where automated access is appropriate.

The system stores short structured facts, extracted skills and source links rather than redistributing full third-party job advertisements.

## Stack

- Next.js + TypeScript
- Python
- GitHub Actions
- GitHub Pages
- Browser LocalStorage for private application/profile state
- PostgreSQL/Neon schema retained for a future authenticated multi-device version

## Intelligence pipeline

`scripts/intelligence_pipeline.py` runs every morning at approximately 06:40 Darwin time.

It:

- discovers supported public employer vacancies
- validates known sources
- de-duplicates cross-source vacancies
- applies closing-date expiry
- extracts conservative skill signals
- refreshes skill demand
- stores a daily market snapshot
- commits changed public job intelligence
- rebuilds and deploys the refreshed dashboard

Source definitions are documented in `data/source_catalog.json`.

## Resume Maker

The Resume Maker can:

- open directly from a selected job
- accept pasted job requirements
- compare requirements against verified skills
- reorder relevant evidence
- tailor the professional summary
- show missing requirements separately
- copy the resume
- print/save as PDF
- save profile edits locally on the device

It deliberately does not insert unsupported skills or experience.

## Privacy

Personal application status, notes and edited resume profile data stay in the browser. They are not committed to this public GitHub repository.

## Run locally

```bash
npm install
npm run dev
```

Run the intelligence pipeline:

```bash
pip install -r requirements.txt
python scripts/intelligence_pipeline.py
```

## Database model

`database/schema.sql` contains a PostgreSQL/Neon model for a later authenticated, cross-device version:

- companies
- jobs
- skills
- job_skills
- my_skills
- applications

## Portfolio story

> I built a Darwin-focused career intelligence platform that tracks traceable local technology vacancies, extracts skill demand, compares job requirements with verified evidence, converts gaps into learning and portfolio actions, prepares interview questions, generates tailored resumes, and tracks application progress. I built the dashboard with Next.js and TypeScript, the intelligence pipeline in Python, automated refresh/deployment with GitHub Actions, and hosted the application on GitHub Pages.

## Important limitation

No static website can safely contain a private AI/search API key. The current matching and decision engine is transparent and deterministic. The architecture can later add a secure backend for richer language-model extraction or authenticated multi-device storage without exposing secrets in GitHub Pages.
