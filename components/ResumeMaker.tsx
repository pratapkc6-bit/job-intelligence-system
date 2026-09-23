"use client";

import { useEffect, useMemo, useState } from "react";
import jobsJson from "@/data/jobs.json";
import defaultProfileJson from "@/data/profile.json";

type Experience = {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
};

type Education = {
  qualification: string;
  institution: string;
  year: string;
};

type Profile = {
  name: string;
  location: string;
  email: string;
  phone: string;
  links: string[];
  headline: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
};

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  skills: string[];
};

const STORAGE_KEY = "darwin-job-intelligence-resume-profile-v1";
const jobs = jobsJson as Job[];
const defaultProfile = defaultProfileJson as Profile;

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ");
}

function containsSkill(requirements: string, skill: string) {
  const req = normalise(requirements);
  const target = normalise(skill).trim();
  return target.length > 1 && req.includes(target);
}

function scoreBullet(bullet: string, requirements: string) {
  const words = normalise(requirements)
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const text = normalise(bullet);
  return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

function buildPlainText(
  profile: Profile,
  title: string,
  company: string,
  matchedSkills: string[],
  orderedSkills: string[],
  orderedExperience: Experience[],
) {
  const contact = [profile.location, profile.phone, profile.email, ...profile.links]
    .filter(Boolean)
    .join(" | ");

  const target = title ? `Target role: ${title}${company ? ` at ${company}` : ""}` : "";
  const skillPhrase = matchedSkills.slice(0, 4).join(", ");
  const tailoredSummary = skillPhrase
    ? `${profile.summary} For this application, the strongest verified alignment is in ${skillPhrase}.`
    : profile.summary;

  const experienceText = orderedExperience
    .map(
      (item) =>
        `${item.role} | ${item.company} | ${item.location} | ${item.period}\n${item.bullets
          .map((bullet) => `- ${bullet}`)
          .join("\n")}`,
    )
    .join("\n\n");

  const educationText = profile.education
    .map((item) => `${item.qualification} | ${item.institution} | ${item.year}`)
    .join("\n");

  return [
    profile.name,
    profile.headline,
    contact,
    target,
    "",
    "PROFESSIONAL SUMMARY",
    tailoredSummary,
    "",
    "CORE SKILLS",
    orderedSkills.join(" | "),
    "",
    "EXPERIENCE",
    experienceText,
    "",
    "EDUCATION",
    educationText,
  ]
    .filter((line, index, array) => !(line === "" && array[index - 1] === ""))
    .join("\n");
}

export default function ResumeMaker() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [selectedJobId, setSelectedJobId] = useState(String(jobs[0]?.id ?? ""));
  const [jobTitle, setJobTitle] = useState(jobs[0]?.title ?? "");
  const [company, setCompany] = useState(jobs[0]?.company ?? "");
  const [requirements, setRequirements] = useState(jobs[0]?.skills.join(", ") ?? "");
  const [generatedRequirements, setGeneratedRequirements] = useState(requirements);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored) as Profile);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const requestedJob = new URLSearchParams(window.location.search).get("job");
    if (requestedJob) {
      const job = jobs.find((item) => String(item.id) === requestedJob);
      if (job) {
        setSelectedJobId(String(job.id));
        setJobTitle(job.title);
        setCompany(job.company);
        setRequirements(job.skills.join(", "));
        setGeneratedRequirements(job.skills.join(", "));
      }
    }
  }, []);

  const selectedJob = jobs.find((job) => String(job.id) === selectedJobId);

  function chooseJob(id: string) {
    setSelectedJobId(id);
    const job = jobs.find((item) => String(item.id) === id);
    if (!job) return;
    setJobTitle(job.title);
    setCompany(job.company);
    setRequirements(job.skills.join(", "));
  }

  function saveProfile() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const matchedSkills = useMemo(
    () => profile.skills.filter((skill) => containsSkill(generatedRequirements, skill)),
    [profile.skills, generatedRequirements],
  );

  const requestedSkills = useMemo(() => {
    if (selectedJob && requirements === selectedJob.skills.join(", ")) {
      return selectedJob.skills;
    }
    return requirements
      .split(/[,\n;•]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1 && item.length < 80);
  }, [requirements, selectedJob]);

  const gaps = useMemo(
    () =>
      requestedSkills.filter(
        (requested) =>
          !profile.skills.some(
            (skill) =>
              normalise(requested).includes(normalise(skill)) ||
              normalise(skill).includes(normalise(requested)),
          ),
      ),
    [requestedSkills, profile.skills],
  );

  const orderedSkills = useMemo(
    () => [
      ...matchedSkills,
      ...profile.skills.filter((skill) => !matchedSkills.includes(skill)),
    ],
    [matchedSkills, profile.skills],
  );

  const orderedExperience = useMemo(
    () =>
      profile.experience.map((item) => ({
        ...item,
        bullets: [...item.bullets].sort(
          (a, b) =>
            scoreBullet(b, generatedRequirements) - scoreBullet(a, generatedRequirements),
        ),
      })),
    [profile.experience, generatedRequirements],
  );

  const tailoredSummary = matchedSkills.length
    ? `${profile.summary} For this application, the strongest verified alignment is in ${matchedSkills
        .slice(0, 4)
        .join(", ")}.`
    : profile.summary;

  async function copyResume() {
    const text = buildPlainText(
      profile,
      jobTitle,
      company,
      matchedSkills,
      orderedSkills,
      orderedExperience,
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="resumeWorkspace">
      <section className="resumeBuilder panel noPrint">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">RESUME MAKER</p>
            <h1>Tailor the resume to the evidence.</h1>
          </div>
          <span className="pill">No invented claims</span>
        </div>

        <div className="resumeFormGrid">
          <label>
            <span>Tracked job</span>
            <select value={selectedJobId} onChange={(event) => chooseJob(event.target.value)}>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.company}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Target role</span>
            <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
          </label>

          <label>
            <span>Company</span>
            <input value={company} onChange={(event) => setCompany(event.target.value)} />
          </label>

          <label className="fullField">
            <span>Job requirements / job ad</span>
            <textarea
              rows={7}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="Paste the important requirements from the job advertisement here."
            />
          </label>
        </div>

        <div className="profileEditor">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">YOUR VERIFIED PROFILE</p>
              <h2>Edit once, reuse for every job</h2>
            </div>
            <button className="secondaryButton" type="button" onClick={saveProfile}>
              {saved ? "Saved ✓" : "Save on this device"}
            </button>
          </div>

          <div className="resumeFormGrid">
            <label>
              <span>Name</span>
              <input
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={profile.location}
                onChange={(event) => setProfile({ ...profile, location: event.target.value })}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                placeholder="Add your email"
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                placeholder="Add your phone"
              />
            </label>
            <label className="fullField">
              <span>Verified skills, separated by commas</span>
              <textarea
                rows={3}
                value={profile.skills.join(", ")}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    skills: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="fullField">
              <span>Base professional summary</span>
              <textarea
                rows={4}
                value={profile.summary}
                onChange={(event) => setProfile({ ...profile, summary: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="builderActions">
          <button
            className="primaryButton"
            type="button"
            onClick={() => setGeneratedRequirements(requirements)}
          >
            Generate tailored resume
          </button>
          <button className="secondaryButton" type="button" onClick={copyResume}>
            {copied ? "Copied ✓" : "Copy resume"}
          </button>
          <button className="secondaryButton" type="button" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>

        <div className="evidenceGrid">
          <div className="evidenceBox">
            <span>Verified matches</span>
            <strong>{matchedSkills.length}</strong>
            <p>{matchedSkills.length ? matchedSkills.join(" · ") : "No direct skill matches detected yet."}</p>
          </div>
          <div className="evidenceBox gapBox">
            <span>Requirements not claimed</span>
            <strong>{gaps.length}</strong>
            <p>
              {gaps.length
                ? gaps.slice(0, 8).join(" · ")
                : "No obvious gaps detected from the structured requirements."}
            </p>
          </div>
        </div>
      </section>

      <article className="resumePaper" id="resume-preview">
        <header className="resumeHeader">
          <h1>{profile.name}</h1>
          <p>{profile.headline}</p>
          <div className="resumeContact">
            {[profile.location, profile.phone, profile.email, ...profile.links]
              .filter(Boolean)
              .map((item) => (
                <span key={item}>{item}</span>
              ))}
          </div>
          {jobTitle && (
            <div className="targetRole">
              Target: {jobTitle}
              {company ? ` · ${company}` : ""}
            </div>
          )}
        </header>

        <section className="resumeSection">
          <h2>Professional Summary</h2>
          <p>{tailoredSummary}</p>
        </section>

        <section className="resumeSection">
          <h2>Core Skills</h2>
          <div className="resumeSkills">
            {orderedSkills.map((skill) => (
              <span className={matchedSkills.includes(skill) ? "prioritySkill" : ""} key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="resumeSection">
          <h2>Experience</h2>
          {orderedExperience.map((item) => (
            <div className="resumeEntry" key={`${item.company}-${item.role}`}>
              <div className="resumeEntryHeader">
                <div>
                  <h3>{item.role}</h3>
                  <p>{item.company} · {item.location}</p>
                </div>
                <span>{item.period}</span>
              </div>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="resumeSection">
          <h2>Education</h2>
          {profile.education.map((item) => (
            <div className="resumeEducation" key={`${item.institution}-${item.qualification}`}>
              <div>
                <strong>{item.qualification}</strong>
                <span>{item.institution}</span>
              </div>
              <span>{item.year}</span>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
