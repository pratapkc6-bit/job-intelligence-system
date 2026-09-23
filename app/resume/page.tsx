import Link from "next/link";
import ResumeMaker from "@/components/ResumeMaker";

export const metadata = {
  title: "Resume Maker | Darwin Job Intelligence",
  description: "Build an evidence-based resume tailored to a tracked job or pasted requirements.",
};

export default function ResumePage() {
  return (
    <main className="shell resumeShell">
      <nav className="topNav noPrint">
        <Link href="/">← Dashboard</Link>
        <span>Darwin Job Intelligence</span>
      </nav>
      <ResumeMaker />
    </main>
  );
}
