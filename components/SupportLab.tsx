"use client";

import { useEffect, useMemo, useState } from "react";

type NavKey = "dashboard" | "tickets" | "lab" | "skills" | "evidence";
type Difficulty = "Foundation" | "Intermediate" | "Advanced";

type Action = {
  id: string;
  label: string;
  result: string;
  points: number;
  kind: "check" | "fix" | "risk";
};

type Scenario = {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  priority: "P1" | "P2" | "P3" | "P4";
  user: string;
  environment: string;
  symptom: string;
  sla: string;
  skills: string[];
  tools: string[];
  actions: Action[];
  terminal: Record<string, string>;
  rootCause: string;
  resolution: string;
  explanation: string;
  interview: string;
};

type ProgressRecord = {
  attempts: number;
  bestScore: number;
  completed: boolean;
  lastCompleted?: string;
  evidence?: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "NET-101",
    title: "Windows laptop has no internet",
    category: "Networking",
    difficulty: "Foundation",
    priority: "P2",
    user: "Finance Officer",
    environment: "Windows 11 • Office Wi-Fi • DHCP",
    symptom: "The user can connect to Wi-Fi but cannot open websites. Other staff are online.",
    sla: "30 min response",
    skills: ["TCP/IP", "DHCP", "Windows", "Troubleshooting"],
    tools: ["ipconfig", "ping", "Network Adapter"],
    actions: [
      { id: "a1", label: "Check IP configuration", result: "IPv4 is 169.254.44.18. No default gateway is present.", points: 25, kind: "check" },
      { id: "a2", label: "Ping 8.8.8.8 immediately", result: "Destination host unreachable. Useful symptom, but IP configuration should be checked first.", points: 10, kind: "check" },
      { id: "a3", label: "Release and renew DHCP lease", result: "Renew succeeds. New address: 10.20.14.77, gateway: 10.20.14.1.", points: 30, kind: "fix" },
      { id: "a4", label: "Restart the entire office router", result: "That would disrupt everyone while the issue affects one device.", points: -20, kind: "risk" },
      { id: "a5", label: "Test gateway and DNS", result: "Gateway replies. DNS resolution now works.", points: 25, kind: "check" },
    ],
    terminal: {
      "ipconfig": "IPv4 Address . . . . . : 169.254.44.18\nSubnet Mask  . . . . . : 255.255.0.0\nDefault Gateway . . . :",
      "ipconfig /renew": "DHCP lease renewed. IPv4 Address: 10.20.14.77\nDefault Gateway: 10.20.14.1",
      "ping 10.20.14.1": "Reply from 10.20.14.1: bytes=32 time=2ms TTL=64",
      "nslookup microsoft.com": "Server: dns.corp.local\nAddress: 10.20.10.10\nName: microsoft.com",
    },
    rootCause: "The laptop failed to obtain a DHCP lease and self-assigned an APIPA address.",
    resolution: "Renewed the DHCP lease, verified the gateway, then confirmed DNS resolution and internet access.",
    explanation: "A 169.254.x.x address is a strong clue that DHCP did not provide a usable address. Troubleshooting should move from local configuration outward.",
    interview: "I confirmed the scope, checked IP configuration, identified an APIPA address, renewed DHCP, then validated gateway and DNS before closing the ticket.",
  },
  {
    id: "WIN-102",
    title: "PC is extremely slow after login",
    category: "Windows",
    difficulty: "Foundation",
    priority: "P3",
    user: "Operations Coordinator",
    environment: "Windows 11 • 8 GB RAM • Managed endpoint",
    symptom: "The desktop takes several minutes to become usable each morning.",
    sla: "4 hour resolution",
    skills: ["Windows", "Performance", "Task Manager", "Startup"],
    tools: ["Task Manager", "Startup Apps", "Event Viewer"],
    actions: [
      { id: "a1", label: "Check Task Manager performance", result: "Disk usage is pinned near 100%. Memory is 72%.", points: 25, kind: "check" },
      { id: "a2", label: "Review startup applications", result: "Three non-essential sync/updater tools launch at sign-in.", points: 25, kind: "check" },
      { id: "a3", label: "Disable non-essential startup apps", result: "Boot responsiveness improves noticeably after sign-out/sign-in.", points: 30, kind: "fix" },
      { id: "a4", label: "Delete random Windows services", result: "Unsafe and unsupported. This can damage the workstation.", points: -25, kind: "risk" },
      { id: "a5", label: "Check free disk space", result: "System drive has 58 GB free. Capacity is not the immediate cause.", points: 15, kind: "check" },
    ],
    terminal: {
      "tasklist": "OneDrive.exe\nTeams.exe\nVendorUpdater.exe\nChrome.exe\nMsMpEng.exe",
      "wmic logicaldisk get size,freespace,caption": "C:  FreeSpace=62277025792  Size=255041392640",
    },
    rootCause: "Excessive startup activity was saturating disk I/O during sign-in.",
    resolution: "Validated resource pressure, removed unnecessary startup items, retested sign-in performance and documented the change.",
    explanation: "Slow PCs should be measured before changes are made. CPU, memory, disk and startup impact give you evidence instead of guesses.",
    interview: "I used Task Manager to identify disk saturation, reviewed startup impact, made a low-risk change, then retested the user experience.",
  },
  {
    id: "M365-103",
    title: "Outlook stopped syncing after password reset",
    category: "Microsoft 365",
    difficulty: "Intermediate",
    priority: "P2",
    user: "Project Manager",
    environment: "Microsoft 365 • Outlook desktop • Entra ID",
    symptom: "Webmail works, but Outlook desktop repeatedly prompts for credentials.",
    sla: "1 hour response",
    skills: ["Microsoft 365", "Outlook", "Identity", "Credential Manager"],
    tools: ["Outlook", "Credential Manager", "Webmail"],
    actions: [
      { id: "a1", label: "Confirm web sign-in works", result: "The user signs into Outlook on the web successfully.", points: 20, kind: "check" },
      { id: "a2", label: "Check Outlook connection state", result: "Outlook shows Disconnected and repeatedly requests the old credential.", points: 20, kind: "check" },
      { id: "a3", label: "Clear stale Office credentials", result: "Cached Microsoft Office credentials are removed safely.", points: 30, kind: "fix" },
      { id: "a4", label: "Recreate the mailbox account immediately", result: "Possible later step, but unnecessarily disruptive before clearing cached credentials.", points: 5, kind: "check" },
      { id: "a5", label: "Restart Outlook and authenticate", result: "Modern authentication completes and mail synchronises.", points: 25, kind: "fix" },
    ],
    terminal: {
      "whoami": "CORP\\pmiller",
      "dsregcmd /status": "AzureAdJoined : YES\nAzureAdPrt : YES",
    },
    rootCause: "Outlook retained stale cached credentials after the user's password changed.",
    resolution: "Confirmed cloud access, removed stale Office credentials, restarted Outlook and verified synchronisation.",
    explanation: "Separating cloud-account health from desktop-client state prevents unnecessary mailbox/profile recreation.",
    interview: "Because webmail worked, I knew the account and service were healthy. I isolated the issue to the local Outlook authentication cache.",
  },
  {
    id: "AD-104",
    title: "User account is locked",
    category: "Active Directory",
    difficulty: "Foundation",
    priority: "P2",
    user: "Warehouse Supervisor",
    environment: "Windows domain • Active Directory • Hybrid identity",
    symptom: "The user cannot sign in after several failed password attempts.",
    sla: "30 min response",
    skills: ["Active Directory", "Identity", "Security", "Communication"],
    tools: ["AD Users and Computers", "Event Viewer"],
    actions: [
      { id: "a1", label: "Verify the user's identity", result: "Identity verified using the approved service-desk process.", points: 30, kind: "check" },
      { id: "a2", label: "Check account lockout status", result: "Account is locked. Password is not expired.", points: 20, kind: "check" },
      { id: "a3", label: "Unlock the account", result: "Account unlocked successfully.", points: 25, kind: "fix" },
      { id: "a4", label: "Tell the user their password", result: "Support staff should never reveal or know a user's password.", points: -30, kind: "risk" },
      { id: "a5", label: "Ask user to sign in and monitor", result: "User signs in successfully. No immediate relock occurs.", points: 25, kind: "check" },
    ],
    terminal: {
      "whoami": "support\\pkc",
      "net user jsmith /domain": "Account active: Yes\nAccount locked out: Yes\nPassword expires: 14/10/2026",
    },
    rootCause: "The account reached the domain lockout threshold after repeated failed attempts.",
    resolution: "Verified identity, confirmed the lockout, unlocked the account and validated successful sign-in.",
    explanation: "Identity verification is part of the technical fix. An unlock without verification creates a security problem instead of solving one.",
    interview: "I followed identity verification first, checked the directory state, unlocked only what was necessary and confirmed the account stayed healthy.",
  },
  {
    id: "PRN-105",
    title: "Network printer shows offline",
    category: "Hardware",
    difficulty: "Foundation",
    priority: "P3",
    user: "Reception",
    environment: "Windows 11 • Shared TCP/IP printer",
    symptom: "One PC cannot print to the reception printer. Other users can print.",
    sla: "4 hour resolution",
    skills: ["Printers", "Windows", "Networking", "Scope isolation"],
    tools: ["Print Queue", "Services", "ping"],
    actions: [
      { id: "a1", label: "Confirm other users can print", result: "Two nearby users can print. The printer itself is online.", points: 25, kind: "check" },
      { id: "a2", label: "Check local print queue", result: "A failed document is blocking the user's queue.", points: 25, kind: "check" },
      { id: "a3", label: "Clear the failed job", result: "The stuck job is removed.", points: 25, kind: "fix" },
      { id: "a4", label: "Restart Print Spooler", result: "Spooler restarts normally and the printer returns to Ready.", points: 20, kind: "fix" },
      { id: "a5", label: "Factory reset the printer", result: "Disruptive and unnecessary because the device works for other users.", points: -25, kind: "risk" },
    ],
    terminal: {
      "ping 10.20.30.45": "Reply from 10.20.30.45: bytes=32 time=1ms TTL=64",
      "sc query spooler": "STATE : 4 RUNNING",
    },
    rootCause: "A stuck local print job left the workstation queue in an offline state.",
    resolution: "Isolated the issue to one workstation, cleared the failed queue item, restarted the spooler and printed a test page.",
    explanation: "Scope matters. If everyone else can print, replacing or resetting the shared printer is poor troubleshooting.",
    interview: "I first proved the printer was healthy for other users, then fixed the client-side queue instead of disrupting the whole office.",
  },
  {
    id: "SEC-106",
    title: "User reports unexpected MFA prompts",
    category: "Security",
    difficulty: "Intermediate",
    priority: "P1",
    user: "Payroll Officer",
    environment: "Microsoft 365 • MFA • Corporate laptop",
    symptom: "The user received repeated MFA approval prompts they did not initiate.",
    sla: "Immediate security triage",
    skills: ["Security", "MFA", "Identity", "Incident response"],
    tools: ["Entra sign-in logs", "Security procedure"],
    actions: [
      { id: "a1", label: "Tell the user to deny the prompt", result: "The user denies the unsolicited MFA request.", points: 25, kind: "fix" },
      { id: "a2", label: "Verify recent sign-in activity", result: "Sign-in logs show an unfamiliar location and repeated failed attempts.", points: 25, kind: "check" },
      { id: "a3", label: "Escalate as a security incident", result: "Security team is notified with timestamps and sign-in evidence.", points: 30, kind: "fix" },
      { id: "a4", label: "Approve one prompt to make it stop", result: "Never approve an MFA request the user did not initiate.", points: -40, kind: "risk" },
      { id: "a5", label: "Revoke sessions / secure account", result: "Existing sessions are revoked through the approved incident process.", points: 20, kind: "fix" },
    ],
    terminal: {
      "whoami": "CORP\\payroll01",
    },
    rootCause: "The pattern is consistent with an attempted account compromise or MFA fatigue attack.",
    resolution: "User denied prompts, suspicious sign-ins were verified, the incident was escalated, sessions were revoked and the account was secured.",
    explanation: "Unexpected MFA prompts are a security signal, not an annoyance to dismiss. Speed and correct escalation matter.",
    interview: "I treated unsolicited MFA prompts as potential compromise, preserved evidence, followed the incident path and avoided risky troubleshooting shortcuts.",
  },
  {
    id: "NET-107",
    title: "Internet works by IP but not by website name",
    category: "Networking",
    difficulty: "Intermediate",
    priority: "P2",
    user: "Sales Consultant",
    environment: "Windows 11 • Ethernet • Corporate DNS",
    symptom: "The user can ping 8.8.8.8 but browser sites fail with name resolution errors.",
    sla: "1 hour response",
    skills: ["DNS", "TCP/IP", "Windows", "Troubleshooting"],
    tools: ["nslookup", "ipconfig", "ping"],
    actions: [
      { id: "a1", label: "Test a public IP", result: "8.8.8.8 replies successfully.", points: 20, kind: "check" },
      { id: "a2", label: "Run nslookup", result: "DNS query times out against 10.20.10.10.", points: 25, kind: "check" },
      { id: "a3", label: "Check configured DNS servers", result: "Primary DNS is an old decommissioned server.", points: 25, kind: "check" },
      { id: "a4", label: "Correct DNS settings and flush cache", result: "Name resolution succeeds after policy refresh and cache flush.", points: 30, kind: "fix" },
      { id: "a5", label: "Replace the network cable", result: "Connectivity to public IPs already proves the link is working.", points: -10, kind: "risk" },
    ],
    terminal: {
      "ping 8.8.8.8": "Reply from 8.8.8.8: bytes=32 time=23ms TTL=117",
      "nslookup microsoft.com": "DNS request timed out. Server: 10.20.10.10",
      "ipconfig /all": "DNS Servers . . . . . . : 10.20.10.10\nDHCP Enabled . . . . . : Yes",
      "ipconfig /flushdns": "Successfully flushed the DNS Resolver Cache.",
    },
    rootCause: "The workstation was using a decommissioned DNS server.",
    resolution: "Confirmed raw IP connectivity, isolated DNS failure, corrected DNS configuration and flushed the resolver cache.",
    explanation: "Testing IP connectivity separately from name resolution quickly distinguishes DNS problems from general network outages.",
    interview: "Because IP connectivity worked, I focused on DNS, found an obsolete resolver address and validated the repair with nslookup.",
  },
  {
    id: "WIN-108",
    title: "Mapped drive says access denied",
    category: "Windows",
    difficulty: "Intermediate",
    priority: "P2",
    user: "Accounts Assistant",
    environment: "Windows 11 • SMB file server • AD groups",
    symptom: "The Finance drive appears, but the user receives Access Denied when opening it.",
    sla: "2 hour response",
    skills: ["Windows", "Permissions", "SMB", "Active Directory"],
    tools: ["whoami", "net use", "AD groups"],
    actions: [
      { id: "a1", label: "Confirm the exact path and error", result: "\\files01\\finance is reachable but access is denied.", points: 20, kind: "check" },
      { id: "a2", label: "Check user group membership", result: "User is not a member of Finance-Share-RW.", points: 30, kind: "check" },
      { id: "a3", label: "Confirm approved access request", result: "Manager-approved request exists in the ticket.", points: 20, kind: "check" },
      { id: "a4", label: "Add approved group membership", result: "User is added to Finance-Share-RW under change procedure.", points: 30, kind: "fix" },
      { id: "a5", label: "Grant Everyone full control", result: "This violates least privilege and bypasses the access model.", points: -40, kind: "risk" },
    ],
    terminal: {
      "whoami /groups": "Domain Users\nAll-Staff\nAccounts-Team",
      "net use": "F: \\files01\\finance Microsoft Windows Network",
    },
    rootCause: "The user lacked the AD security group that grants access to the Finance share.",
    resolution: "Verified approval, updated the correct security group and confirmed access after token refresh.",
    explanation: "Permissions should be fixed through the established group model, not by weakening ACLs.",
    interview: "I verified the request and existing group model, changed the minimum permission required and then tested access.",
  },
  {
    id: "M365-109",
    title: "Teams microphone is not detected",
    category: "Microsoft 365",
    difficulty: "Foundation",
    priority: "P3",
    user: "HR Advisor",
    environment: "Windows 11 • Microsoft Teams • USB headset",
    symptom: "The headset plays audio, but Teams cannot use its microphone.",
    sla: "Before 10:00 meeting",
    skills: ["Teams", "Windows", "Audio", "User support"],
    tools: ["Teams settings", "Windows Privacy", "Sound settings"],
    actions: [
      { id: "a1", label: "Check Teams device selection", result: "Teams is set to the laptop microphone, not the USB headset.", points: 25, kind: "check" },
      { id: "a2", label: "Check Windows microphone permission", result: "Microphone access for desktop apps is enabled.", points: 20, kind: "check" },
      { id: "a3", label: "Select USB headset microphone", result: "Teams test call now detects clear audio.", points: 35, kind: "fix" },
      { id: "a4", label: "Reinstall Windows", result: "Slightly excessive for a wrong audio-device selection.", points: -35, kind: "risk" },
      { id: "a5", label: "Run a Teams test call", result: "Test call records and plays back the user's voice.", points: 20, kind: "check" },
    ],
    terminal: {
      "whoami": "CORP\\hadvisor",
    },
    rootCause: "Teams was configured to use the wrong microphone input device.",
    resolution: "Verified permissions, selected the USB headset microphone and completed a successful Teams test call.",
    explanation: "Application-level device selection is a common cause when playback works but microphone input does not.",
    interview: "I checked the simplest application and OS settings first, corrected the input device and validated the fix with a test call.",
  },
  {
    id: "AD-110",
    title: "New starter needs department folder access",
    category: "Active Directory",
    difficulty: "Intermediate",
    priority: "P3",
    user: "New Employee",
    environment: "Active Directory • File server • RBAC",
    symptom: "A new starter can sign in but cannot access the Operations shared folder.",
    sla: "Same business day",
    skills: ["Active Directory", "RBAC", "Onboarding", "Least privilege"],
    tools: ["Service request", "AD groups", "File share"],
    actions: [
      { id: "a1", label: "Review onboarding request", result: "Approved role: Operations Officer. Manager approval is present.", points: 25, kind: "check" },
      { id: "a2", label: "Compare a peer's group membership", result: "Operations staff receive access through OPS-Share-RW.", points: 20, kind: "check" },
      { id: "a3", label: "Add role-based security group", result: "OPS-Share-RW is assigned to the new starter.", points: 30, kind: "fix" },
      { id: "a4", label: "Copy every group from another employee", result: "That can grant unrelated or privileged access.", points: -30, kind: "risk" },
      { id: "a5", label: "Validate access with user", result: "User can open the Operations folder and create an approved test file.", points: 25, kind: "check" },
    ],
    terminal: {
      "net user newstarter /domain": "Account active: Yes\nGlobal Group memberships: *Domain Users",
    },
    rootCause: "The onboarding account was created without the role-based file-share security group.",
    resolution: "Verified approved role, assigned the least-privilege group and tested access with the user.",
    explanation: "Role-based access avoids permission drift and is safer than cloning another user's complete access profile.",
    interview: "I used the onboarding approval and RBAC model, not guesswork, to provide only the access required for the role.",
  },
  {
    id: "NET-111",
    title: "VPN connects but internal apps fail",
    category: "Networking",
    difficulty: "Advanced",
    priority: "P2",
    user: "Remote Engineer",
    environment: "Windows 11 • SSL VPN • Split tunnel",
    symptom: "VPN status is Connected, but intranet and file shares are unreachable.",
    sla: "1 hour response",
    skills: ["VPN", "Routing", "DNS", "Remote support"],
    tools: ["route print", "ipconfig", "nslookup"],
    actions: [
      { id: "a1", label: "Confirm VPN-assigned address", result: "VPN adapter has 172.22.8.41 and is connected.", points: 20, kind: "check" },
      { id: "a2", label: "Check route table", result: "The expected 10.40.0.0/16 corporate route is missing.", points: 30, kind: "check" },
      { id: "a3", label: "Reconnect after policy refresh", result: "VPN downloads updated split-tunnel routes.", points: 25, kind: "fix" },
      { id: "a4", label: "Disable all endpoint security", result: "Unsafe and unrelated without evidence.", points: -35, kind: "risk" },
      { id: "a5", label: "Test intranet and file share", result: "Intranet and SMB access succeed over the refreshed route.", points: 25, kind: "check" },
    ],
    terminal: {
      "ipconfig": "PPP adapter Corporate VPN:\nIPv4 Address: 172.22.8.41",
      "route print": "Active Routes:\n0.0.0.0/0 -> Wi-Fi gateway\n10.20.0.0/16 -> 172.22.8.1\n[10.40.0.0/16 route missing]",
      "nslookup intranet.corp.local": "Name: intranet.corp.local\nAddress: 10.40.12.20",
    },
    rootCause: "The VPN client connected but did not receive the route required for the internal application network.",
    resolution: "Confirmed tunnel state, identified the missing split-tunnel route, refreshed VPN policy and retested internal resources.",
    explanation: "Connected VPN status does not prove that required routes, DNS or application paths are actually available.",
    interview: "I treated tunnel state and application reachability as separate layers, found the missing corporate route and verified end-to-end access.",
  },
  {
    id: "WIN-112",
    title: "Laptop requests BitLocker recovery key",
    category: "Windows",
    difficulty: "Advanced",
    priority: "P1",
    user: "Executive Assistant",
    environment: "Windows 11 • BitLocker • Managed device",
    symptom: "After a firmware update, the laptop boots to the BitLocker recovery screen.",
    sla: "Urgent business impact",
    skills: ["BitLocker", "Windows", "Security", "Device management"],
    tools: ["Device record", "Recovery key escrow", "Change history"],
    actions: [
      { id: "a1", label: "Verify user and device identity", result: "User and asset tag are verified against the managed device record.", points: 25, kind: "check" },
      { id: "a2", label: "Retrieve escrowed recovery key", result: "Approved device-management portal returns the matching recovery key ID.", points: 30, kind: "fix" },
      { id: "a3", label: "Enter recovery key securely", result: "Device boots successfully into Windows.", points: 20, kind: "fix" },
      { id: "a4", label: "Post the key in team chat", result: "Recovery keys are sensitive secrets and must not be shared casually.", points: -40, kind: "risk" },
      { id: "a5", label: "Check BitLocker protection state", result: "Protection is active and key escrow remains healthy.", points: 25, kind: "check" },
    ],
    terminal: {
      "manage-bde -status": "Conversion Status: Fully Encrypted\nProtection Status: Protection On\nLock Status: Unlocked",
    },
    rootCause: "The firmware change triggered BitLocker's recovery protection mechanism.",
    resolution: "Verified identity and device, retrieved the escrowed key securely, restored boot and confirmed BitLocker protection remained enabled.",
    explanation: "Recovery is a security workflow. The key should be handled through approved identity, asset and escrow controls.",
    interview: "I restored access without weakening encryption, verified the device and user, used the managed recovery process and checked protection afterward.",
  },
];

const NAV_ITEMS: { key: NavKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Command Center", icon: "◫" },
  { key: "tickets", label: "Ticket Queue", icon: "◎" },
  { key: "lab", label: "Live Lab", icon: "⌘" },
  { key: "skills", label: "Skill Matrix", icon: "◇" },
  { key: "evidence", label: "Portfolio Evidence", icon: "▣" },
];

const STORAGE_KEY = "pratap-support-lab-progress-v1";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function categoryIcon(category: string) {
  const map: Record<string, string> = {
    Networking: "NET",
    Windows: "WIN",
    "Microsoft 365": "365",
    "Active Directory": "AD",
    Hardware: "HW",
    Security: "SEC",
  };
  return map[category] || "IT";
}

export default function SupportLab() {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({});
  const [performed, setPerformed] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Pratap IT Support Lab terminal",
    "Type a simulated command such as ipconfig, ping, nslookup, whoami or route print.",
  ]);
  const [notes, setNotes] = useState("");
  const [challengeMode, setChallengeMode] = useState(false);
  const [filter, setFilter] = useState("All");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch {
      // Browser storage is optional. The lab still works without it.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage failures.
    }
  }, [progress, hydrated]);

  const selected = useMemo(
    () => SCENARIOS.find((scenario) => scenario.id === selectedId) || SCENARIOS[0],
    [selectedId]
  );

  const completedCount = Object.values(progress).filter((item) => item.completed).length;
  const averageScore = completedCount
    ? Math.round(
        Object.values(progress)
          .filter((item) => item.completed)
          .reduce((sum, item) => sum + item.bestScore, 0) / completedCount
      )
    : 0;

  const skillStats = useMemo(() => {
    const stats: Record<string, { attempts: number; completed: number; totalScore: number }> = {};
    SCENARIOS.forEach((scenario) => {
      scenario.skills.forEach((skill) => {
        if (!stats[skill]) stats[skill] = { attempts: 0, completed: 0, totalScore: 0 };
        const record = progress[scenario.id];
        if (record) {
          stats[skill].attempts += record.attempts;
          if (record.completed) {
            stats[skill].completed += 1;
            stats[skill].totalScore += record.bestScore;
          }
        }
      });
    });
    return Object.entries(stats)
      .map(([skill, value]) => ({
        skill,
        completed: value.completed,
        attempts: value.attempts,
        score: value.completed ? Math.round(value.totalScore / value.completed) : 0,
      }))
      .sort((a, b) => b.score - a.score || b.completed - a.completed);
  }, [progress]);

  function openLab(id: string) {
    setSelectedId(id);
    setPerformed([]);
    setTerminalInput("");
    setTerminalLines([
      "New lab session loaded.",
      "Use the investigation actions and simulated terminal to build evidence before resolving.",
    ]);
    setNotes("");
    setActiveNav("lab");
  }

  function runAction(action: Action) {
    if (performed.includes(action.id)) return;
    setPerformed((current) => [...current, action.id]);
  }

  function currentScore() {
    const points = selected.actions
      .filter((action) => performed.includes(action.id))
      .reduce((sum, action) => sum + action.points, 0);
    return clampScore(points);
  }

  function resolveTicket() {
    const score = currentScore();
    const evidence =
      selected.id +
      " • " +
      selected.title +
      " • Score " +
      score +
      "% • " +
      selected.resolution;
    setProgress((current) => {
      const previous = current[selected.id] || { attempts: 0, bestScore: 0, completed: false };
      return {
        ...current,
        [selected.id]: {
          attempts: previous.attempts + 1,
          bestScore: Math.max(previous.bestScore, score),
          completed: true,
          lastCompleted: new Date().toISOString(),
          evidence,
        },
      };
    });
    setTerminalLines((current) => [
      ...current,
      "",
      "TICKET RESOLVED",
      "Root cause: " + selected.rootCause,
      "Resolution: " + selected.resolution,
      "Session score: " + score + "%",
    ]);
  }

  function runCommand() {
    const command = terminalInput.trim().toLowerCase();
    if (!command) return;
    const exact = selected.terminal[command];
    const fallback =
      "Command not simulated for this ticket. Try: " +
      Object.keys(selected.terminal).join(", ");
    setTerminalLines((current) => [...current, "> " + terminalInput.trim(), exact || fallback]);
    setTerminalInput("");
  }

  function exportEvidence() {
    const completed = SCENARIOS.filter((scenario) => progress[scenario.id]?.completed);
    const body = [
      "# Pratap K C - IT Support Lab Evidence",
      "",
      "Completed labs: " + completed.length + "/" + SCENARIOS.length,
      "Average best score: " + averageScore + "%",
      "",
      ...completed.flatMap((scenario) => {
        const record = progress[scenario.id];
        return [
          "## " + scenario.id + " - " + scenario.title,
          "- Category: " + scenario.category,
          "- Best score: " + record.bestScore + "%",
          "- Root cause: " + scenario.rootCause,
          "- Resolution: " + scenario.resolution,
          "- Interview explanation: " + scenario.interview,
          "",
        ];
      }),
    ].join("\n");

    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pratap-it-support-lab-evidence.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetProgress() {
    if (!window.confirm("Reset all saved lab progress on this browser?")) return;
    setProgress({});
    setPerformed([]);
    setTerminalLines(["Progress reset. Start a ticket when ready."]);
  }

  const queue = filter === "All" ? SCENARIOS : SCENARIOS.filter((item) => item.category === filter);
  const categories = ["All", ...Array.from(new Set(SCENARIOS.map((item) => item.category)))];
  const scoreNow = currentScore();
  const completedSelected = progress[selected.id]?.completed;

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">P</div>
          <div>
            <strong>Pratap IT Lab</strong>
            <span>Support Engineer Simulator</span>
          </div>
        </div>

        <nav className="navList" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={activeNav === item.key ? "navItem active" : "navItem"}
              onClick={() => setActiveNav(item.key)}
            >
              <span className="navIcon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebarCard">
          <span className="eyebrow">CAREER MODE</span>
          <strong>Darwin-ready support skills</strong>
          <p>Practise diagnosis, communication, evidence and safe resolution.</p>
        </div>

        <div className="sidebarFooter">
          <span className="statusDot" />
          <span>Local progress enabled</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">PERSONAL TECHNICAL PORTFOLIO</span>
            <h1>
              {activeNav === "dashboard" && "IT Support Command Center"}
              {activeNav === "tickets" && "Ticket Queue"}
              {activeNav === "lab" && "Live Troubleshooting Lab"}
              {activeNav === "skills" && "Skill Matrix"}
              {activeNav === "evidence" && "Portfolio Evidence"}
            </h1>
          </div>
          <div className="topActions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={challengeMode}
                onChange={(event) => setChallengeMode(event.target.checked)}
              />
              <span />
              Challenge mode
            </label>
            <button className="ghostButton" onClick={exportEvidence}>
              Export evidence
            </button>
          </div>
        </header>

        {activeNav === "dashboard" && (
          <section className="pageGrid">
            <div className="heroCard">
              <div>
                <span className="livePill">● TRAINING ENVIRONMENT ONLINE</span>
                <h2>Build proof that you can troubleshoot real IT problems.</h2>
                <p>
                  Work support tickets, run simulated commands, make safe decisions and turn each
                  resolution into interview-ready evidence.
                </p>
                <div className="heroActions">
                  <button className="primaryButton" onClick={() => openLab(SCENARIOS[0].id)}>
                    Start next lab
                  </button>
                  <button className="secondaryButton" onClick={() => setActiveNav("tickets")}>
                    Browse ticket queue
                  </button>
                </div>
              </div>
              <div className="heroMetric">
                <span>READINESS</span>
                <strong>{averageScore || 0}%</strong>
                <small>{completedCount} of {SCENARIOS.length} labs completed</small>
              </div>
            </div>

            <div className="statGrid">
              <article className="statCard">
                <span>Completed labs</span>
                <strong>{completedCount}</strong>
                <small>Target: {SCENARIOS.length}</small>
              </article>
              <article className="statCard">
                <span>Average best score</span>
                <strong>{averageScore}%</strong>
                <small>Goal: 85%+</small>
              </article>
              <article className="statCard">
                <span>Core domains</span>
                <strong>6</strong>
                <small>Windows • Network • 365 • AD • Security • Hardware</small>
              </article>
              <article className="statCard">
                <span>Evidence items</span>
                <strong>{completedCount}</strong>
                <small>Exportable for interview preparation</small>
              </article>
            </div>

            <div className="dashboardSplit">
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="eyebrow">RECOMMENDED NEXT</span>
                    <h3>Priority ticket queue</h3>
                  </div>
                  <button className="textButton" onClick={() => setActiveNav("tickets")}>
                    View all
                  </button>
                </div>
                <div className="compactTickets">
                  {SCENARIOS.slice(0, 5).map((scenario) => {
                    const record = progress[scenario.id];
                    return (
                      <button key={scenario.id} onClick={() => openLab(scenario.id)} className="compactTicket">
                        <div className={"ticketIcon category-" + scenario.category.replaceAll(" ", "").toLowerCase()}>
                          {categoryIcon(scenario.category)}
                        </div>
                        <div className="ticketCopy">
                          <strong>{scenario.title}</strong>
                          <span>{scenario.id} • {scenario.category} • {scenario.difficulty}</span>
                        </div>
                        <span className={record?.completed ? "miniStatus done" : "miniStatus"}>
                          {record?.completed ? record.bestScore + "%" : "Open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="eyebrow">SKILL SIGNAL</span>
                    <h3>Current strongest areas</h3>
                  </div>
                </div>
                <div className="skillBars">
                  {(skillStats.length ? skillStats.slice(0, 6) : [
                    { skill: "Troubleshooting", score: 0, completed: 0, attempts: 0 },
                    { skill: "Windows", score: 0, completed: 0, attempts: 0 },
                    { skill: "Networking", score: 0, completed: 0, attempts: 0 },
                    { skill: "Microsoft 365", score: 0, completed: 0, attempts: 0 },
                  ]).map((item) => (
                    <div className="skillBarRow" key={item.skill}>
                      <div><span>{item.skill}</span><strong>{item.score}%</strong></div>
                      <div className="bar"><span style={{ width: item.score + "%" }} /></div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {activeNav === "tickets" && (
          <section>
            <div className="filterRow">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={filter === category ? "filterChip active" : "filterChip"}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="ticketTable">
              <div className="ticketTableHead">
                <span>Ticket</span>
                <span>Category</span>
                <span>Priority</span>
                <span>Difficulty</span>
                <span>Progress</span>
                <span />
              </div>
              {queue.map((scenario) => {
                const record = progress[scenario.id];
                return (
                  <div className="ticketRow" key={scenario.id}>
                    <div className="ticketName">
                      <div className={"ticketIcon category-" + scenario.category.replaceAll(" ", "").toLowerCase()}>
                        {categoryIcon(scenario.category)}
                      </div>
                      <div>
                        <strong>{scenario.title}</strong>
                        <span>{scenario.id} • {scenario.user}</span>
                      </div>
                    </div>
                    <span>{scenario.category}</span>
                    <span className={"priority " + scenario.priority.toLowerCase()}>{scenario.priority}</span>
                    <span>{scenario.difficulty}</span>
                    <span className={record?.completed ? "progressBadge done" : "progressBadge"}>
                      {record?.completed ? "Completed • " + record.bestScore + "%" : "Not attempted"}
                    </span>
                    <button className="rowButton" onClick={() => openLab(scenario.id)}>Open lab</button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeNav === "lab" && (
          <section className="labLayout">
            <div className="labMain">
              <article className="ticketHero panel">
                <div className="ticketHeroTop">
                  <div>
                    <div className="ticketMeta">
                      <span className={"priority " + selected.priority.toLowerCase()}>{selected.priority}</span>
                      <span>{selected.id}</span>
                      <span>{selected.category}</span>
                      <span>{selected.difficulty}</span>
                    </div>
                    <h2>{selected.title}</h2>
                    <p>{selected.symptom}</p>
                  </div>
                  <div className="slaBox"><span>SLA</span><strong>{selected.sla}</strong></div>
                </div>
                <div className="contextGrid">
                  <div><span>User</span><strong>{selected.user}</strong></div>
                  <div><span>Environment</span><strong>{selected.environment}</strong></div>
                  <div><span>Tools</span><strong>{selected.tools.join(" • ")}</strong></div>
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="eyebrow">INVESTIGATION WORKBENCH</span>
                    <h3>Choose your next action</h3>
                  </div>
                  <div className="scoreDial">
                    <span>Live score</span>
                    <strong>{scoreNow}%</strong>
                  </div>
                </div>

                <div className="actionList">
                  {selected.actions.map((action, index) => {
                    const done = performed.includes(action.id);
                    return (
                      <div className={done ? "actionCard completed" : "actionCard"} key={action.id}>
                        <button onClick={() => runAction(action)} disabled={done}>
                          <span className="actionIndex">{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <strong>{action.label}</strong>
                            {!challengeMode && !done && (
                              <span className={"actionKind " + action.kind}>
                                {action.kind === "check" ? "Diagnostic" : action.kind === "fix" ? "Resolution" : "High risk"}
                              </span>
                            )}
                          </div>
                          <span className="actionRun">{done ? "Done" : "Run"}</span>
                        </button>
                        {done && (
                          <div className="actionResult">
                            <span className={action.points < 0 ? "resultDot bad" : "resultDot"} />
                            <p>{action.result}</p>
                            {!challengeMode && (
                              <strong className={action.points < 0 ? "negative" : "positive"}>
                                {action.points > 0 ? "+" : ""}{action.points}
                              </strong>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="terminal panel">
                <div className="terminalHeader">
                  <div><span className="terminalDot red" /><span className="terminalDot amber" /><span className="terminalDot green" /></div>
                  <strong>Support Console • {selected.id}</strong>
                  <span>SIMULATED</span>
                </div>
                <div className="terminalBody" aria-live="polite">
                  {terminalLines.map((line, index) => <pre key={index}>{line}</pre>)}
                </div>
                <form
                  className="terminalInput"
                  onSubmit={(event) => {
                    event.preventDefault();
                    runCommand();
                  }}
                >
                  <span>&gt;</span>
                  <input
                    value={terminalInput}
                    onChange={(event) => setTerminalInput(event.target.value)}
                    placeholder="Type a command..."
                    aria-label="Simulated terminal command"
                  />
                  <button type="submit">Run</button>
                </form>
              </article>

              <article className="panel notesPanel">
                <div className="panelHeader">
                  <div><span className="eyebrow">TICKET NOTES</span><h3>Document what you found</h3></div>
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Example: User affected only. APIPA address found. Renewed DHCP lease and verified DNS..."
                />
              </article>
            </div>

            <aside className="labSidebar">
              <article className="panel stickyPanel">
                <span className="eyebrow">SESSION CONTROL</span>
                <div className="sessionScore">
                  <strong>{scoreNow}%</strong>
                  <span>Current diagnostic score</span>
                </div>
                <div className="miniChecklist">
                  <div><span className={performed.length >= 1 ? "check yes" : "check"}>✓</span> Gather evidence</div>
                  <div><span className={performed.filter((id) => selected.actions.find((a) => a.id === id)?.kind === "check").length >= 2 ? "check yes" : "check"}>✓</span> Run diagnostics</div>
                  <div><span className={performed.some((id) => selected.actions.find((a) => a.id === id)?.kind === "fix") ? "check yes" : "check"}>✓</span> Apply a fix</div>
                  <div><span className={notes.trim().length > 10 ? "check yes" : "check"}>✓</span> Document notes</div>
                </div>
                <button className="primaryButton full" onClick={resolveTicket} disabled={performed.length < 2}>
                  Resolve ticket
                </button>
                <small className="helperText">Resolve after gathering enough evidence. You can retry any lab to improve your score.</small>
              </article>

              <article className="panel">
                <span className="eyebrow">SKILLS IN THIS LAB</span>
                <div className="tagCloud">
                  {selected.skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </article>

              {completedSelected && (
                <article className="panel completionCard">
                  <span className="completeIcon">✓</span>
                  <strong>Lab completed</strong>
                  <p>Best score: {progress[selected.id].bestScore}%</p>
                  <button className="textButton" onClick={() => setActiveNav("evidence")}>View evidence</button>
                </article>
              )}
            </aside>
          </section>
        )}

        {activeNav === "skills" && (
          <section className="skillsPage">
            <div className="sectionIntro">
              <div>
                <span className="eyebrow">MEASURED FROM LAB RESULTS</span>
                <h2>Your practical skill matrix</h2>
                <p>Scores are derived from completed scenarios on this browser, not from self-rating.</p>
              </div>
            </div>
            <div className="skillCardGrid">
              {skillStats.map((item) => (
                <article className="skillCard" key={item.skill}>
                  <div className="skillCardTop">
                    <strong>{item.skill}</strong>
                    <span>{item.score}%</span>
                  </div>
                  <div className="ring" style={{ "--score": item.score + "%" } as React.CSSProperties}>
                    <div>{item.score}</div>
                  </div>
                  <p>{item.completed} completed scenario{item.completed === 1 ? "" : "s"} • {item.attempts} attempt{item.attempts === 1 ? "" : "s"}</p>
                  <span className={item.score >= 85 ? "level jobReady" : item.score >= 65 ? "level practising" : "level learning"}>
                    {item.score >= 85 ? "JOB-READY SIGNAL" : item.score >= 65 ? "PRACTISING" : "LEARNING"}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeNav === "evidence" && (
          <section>
            <div className="evidenceHero panel">
              <div>
                <span className="eyebrow">PORTFOLIO MODE</span>
                <h2>Turn solved tickets into credible interview evidence.</h2>
                <p>Each completed lab creates a concise troubleshooting story you can revise before interviews.</p>
              </div>
              <div className="evidenceActions">
                <button className="primaryButton" onClick={exportEvidence}>Download evidence file</button>
                <button className="secondaryButton" onClick={resetProgress}>Reset local progress</button>
              </div>
            </div>

            <div className="evidenceList">
              {SCENARIOS.filter((scenario) => progress[scenario.id]?.completed).length === 0 && (
                <div className="emptyState panel">
                  <strong>No completed evidence yet.</strong>
                  <p>Complete a lab first. Miraculously, the portfolio refuses to invent experience for us.</p>
                  <button className="primaryButton" onClick={() => openLab(SCENARIOS[0].id)}>Start first lab</button>
                </div>
              )}
              {SCENARIOS.filter((scenario) => progress[scenario.id]?.completed).map((scenario) => {
                const record = progress[scenario.id];
                return (
                  <article className="evidenceCard panel" key={scenario.id}>
                    <div className="evidenceTop">
                      <div>
                        <span className="eyebrow">{scenario.id} • {scenario.category}</span>
                        <h3>{scenario.title}</h3>
                      </div>
                      <span className="evidenceScore">{record.bestScore}%</span>
                    </div>
                    <div className="evidenceGrid">
                      <div><span>Root cause</span><p>{scenario.rootCause}</p></div>
                      <div><span>Resolution</span><p>{scenario.resolution}</p></div>
                    </div>
                    <div className="interviewBlock">
                      <span>INTERVIEW VERSION</span>
                      <p>{scenario.interview}</p>
                    </div>
                    <div className="tagCloud">
                      {scenario.skills.map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
