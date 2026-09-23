export type MatchBand = "Strong Match" | "Reach" | "Development Target";
export type ApplicationStatus = "Not tracked" | "Saved" | "Considering" | "Applied" | "Assessment" | "Interview" | "Offer" | "Rejected" | "Withdrawn";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  category: string;
  seniority: string;
  employmentType: string;
  salary: string | null;
  postedDate: string | null;
  closingDate: string | null;
  source: string;
  sourceUrl: string;
  sourceType: string;
  lastVerified: string;
  summary: string;
  skills: string[];
  desirableSkills: string[];
  requirements: string[];
  matchBand: MatchBand;
};

export type SkillSummary = { skill: string; count: number; };
