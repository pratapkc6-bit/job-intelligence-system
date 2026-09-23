-- Darwin Job Intelligence V1 relational model for PostgreSQL / Neon.

CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    external_id TEXT,
    company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Darwin, NT',
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    description TEXT,
    salary_text TEXT,
    posted_at DATE,
    closing_at DATE,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'unknown')),
    UNIQUE (source, source_url)
);

CREATE TABLE IF NOT EXISTS skills (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    confidence NUMERIC(4,3),
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS my_skills (
    skill_id BIGINT PRIMARY KEY REFERENCES skills(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('NEW', 'LEARNING', 'PRACTISING', 'JOB-READY', 'MASTERED')),
    evidence_url TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'considering' CHECK (
        status IN ('considering', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn')
    ),
    applied_at DATE,
    follow_up_at DATE,
    resume_version TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id ON job_skills(skill_id);
