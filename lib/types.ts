export type MatchBand = "Strong Match" | "Reach" | "Development Target";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  source: string;
  postedDate: string;
  url: string;
  skills: string[];
  matchBand: MatchBand;
};

export type SkillSummary = {
  skill: string;
  count: number;
};
