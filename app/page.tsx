import { getMatchCounts, getSkillSummary, jobs } from "@/lib/data";

export default function Home() {
  const skills = getSkillSummary();
  const matchCounts = getMatchCounts();
  const topSkillCount = skills[0]?.count ?? 1;

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">DARWIN IT CAREER INTELLIGENCE</p>
          <h1>Stop guessing what to learn next.</h1>
          <p className="heroCopy">
            Track Darwin IT jobs, detect recurring skills, and turn market demand into
            applications, learning priorities, and portfolio projects.
          </p>
        </div>
        <div className="statusCard">
          <span className="statusDot" />
          <div>
            <strong>V1 foundation</strong>
            <p>Sample data · local analysis ready</p>
          </div>
        </div>
      </header>

      <section className="statsGrid" aria-label="Job market summary">
        <article className="statCard">
          <span>Tracked roles</span>
          <strong>{jobs.length}</strong>
          <small>Darwin / NT focus</small>
        </article>
        <article className="statCard">
          <span>Strong matches</span>
          <strong>{matchCounts["Strong Match"]}</strong>
          <small>Ready to investigate</small>
        </article>
        <article className="statCard">
          <span>Reach roles</span>
          <strong>{matchCounts.Reach}</strong>
          <small>Small, learnable gaps</small>
        </article>
        <article className="statCard">
          <span>Skills detected</span>
          <strong>{skills.length}</strong>
          <small>Across current dataset</small>
        </article>
      </section>

      <section className="contentGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">SKILL DEMAND</p>
              <h2>What employers keep asking for</h2>
            </div>
            <span className="pill">Auto-calculated</span>
          </div>
          <div className="skillList">
            {skills.slice(0, 8).map((item) => (
              <div className="skillRow" key={item.skill}>
                <div className="skillLabel">
                  <span>{item.skill}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="barTrack">
                  <div
                    className="barFill"
                    style={{ width: `${Math.max((item.count / topSkillCount) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel decisionPanel">
          <p className="eyebrow">DECISION ENGINE</p>
          <h2>Apply · Learn · Build</h2>
          <p>
            Each role eventually becomes a decision: apply now, close a specific skill gap,
            or build evidence that proves the skill.
          </p>
          <div className="decisionStack">
            <div><span>APPLY</span><strong>{matchCounts["Strong Match"]} role</strong></div>
            <div><span>LEARN</span><strong>Active Directory</strong></div>
            <div><span>BUILD</span><strong>IT support lab</strong></div>
          </div>
        </aside>
      </section>

      <section className="panel jobsPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">ROLE PIPELINE</p>
            <h2>Tracked opportunities</h2>
          </div>
          <p className="muted">Sample records will be replaced with live Darwin jobs.</p>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Company</th>
                <th>Match</th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <small>{job.location}</small>
                  </td>
                  <td>{job.company}</td>
                  <td><span className={`match ${job.matchBand.replaceAll(" ", "-").toLowerCase()}`}>{job.matchBand}</span></td>
                  <td>{job.skills.slice(0, 3).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer>
        Darwin Job Intelligence · V1 · Built to turn job-market evidence into action.
      </footer>
    </main>
  );
}
