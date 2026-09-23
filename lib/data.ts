import jobsJson from "@/data/jobs.json";
import type { Job, SkillSummary } from "./types";

export const jobs = jobsJson as Job[];

export function getSkillSummary(): SkillSummary[] {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    for (const skill of job.skills) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
}

export function getMatchCounts() {
  return jobs.reduce(
    (acc, job) => {
      acc[job.matchBand] += 1;
      return acc;
    },
    { "Strong Match": 0, Reach: 0, "Development Target": 0 } as Record<Job["matchBand"], number>,
  );
}
