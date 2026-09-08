import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ════════════════════════════════════════════════════════

type AppPhase =
  | "boot-terminal"
  | "boot-scanner"
  | "boot-document"
  | "boot-reveal"
  | "register"
  | "exit";

const TEAM_INFO: Record<string, { label: string; color: string }> = {
  DOLLYTRACK: { label: "Dollytrack", color: "#8C1D1D" },
  CLAPBOARD: { label: "Clapboard", color: "#365A9C" },
  GREENSCREEN: { label: "Greenscreen", color: "#446B4A" },
  ACTON: { label: "Acton", color: "#C59D42" },
  "CUT!": { label: "Cut!", color: "#6B3FA0" },
};

const EVENT_NAME = "TRAIL OF CLUES";
const CLUB_NAME = "GECB Silver Screen — Film & Drama Club";
const CO_ORGANIZER = "Mathrukam GECB";
const ORGANIZERS = "GECB Silver Screen × Mathrukam GECB";

// ════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ════════════════════════════════════════════════════════

function FilmGrain() {
  return <div className="film-grain pointer-events-none" />;
}

function DustParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-white/20"
          style={{
            left: `${(i * 17 + 7) % 100}%`,
            bottom: "-4px",
            animation: `float-dust ${9 + (i * 3) % 11}s ${(i * 1.3) % 8}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PushPin({ color = "#8C1D1D", size = 14 }: { color?: string; size?: number }) {
  return (
    <div className="absolute" style={{ top: -size / 2 - 2, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
      <div
        className="rounded-full border-2 border-white/30"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </div>
  );
}

function ConfidentialStamp({
  className = "",
  color = "#8C1D1D",
  text = "CONFIDENTIAL",
  anim = "stamp-anim",
}: {
  className?: string;
  color?: string;
  text?: string;
  anim?: string;
}) {
  return (
    <div
      className={`inline-block border-4 px-3 py-1 ${anim} ${className}`}
      style={{ borderColor: color, fontFamily: "'Oswald', sans-serif" }}
    >
      <span className="text-xs font-black tracking-[0.35em] uppercase" style={{ color }}>
        {text}
      </span>
    </div>
  );
}

function GecbLogo({ size = 44, ring = true }: { size?: number; ring?: boolean }) {
  return (
    <img
      src="/gecb-logo.png"
      alt="GECB Silver Screen — Film and Drama Club"
      width={size}
      height={size}
      className={ring ? "rounded-full border border-inv-border" : ""}
      style={{ objectFit: "cover", flexShrink: 0 }}
    />
  );
}

function MathrukamLogo({ size = 44, ring = true }: { size?: number; ring?: boolean }) {
  return (
    <img
      src="/mathrukam-gecb-logo.png"
      alt="Mathrukam GECB"
      width={size}
      height={size}
      className={ring ? "rounded-full border border-inv-border" : ""}
      style={{ objectFit: "cover", flexShrink: 0, background: "#fff" }}
    />
  );
}

// Co-organizer lockup: both club logos with a small "×" between them.
// Used anywhere the event's organizers are credited.
function OrganizersLockup({ size = 32, ring = true }: { size?: number; ring?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <GecbLogo size={size} ring={ring} />
      <span className="text-inv-muted text-xs font-mono">×</span>
      <MathrukamLogo size={size} ring={ring} />
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PHASE 1: TERMINAL BOOT
// ════════════════════════════════════════════════════════

const BOOT_LINES = [
  { text: "Initializing...", delay: 0 },
  { text: "GECB SILVER SCREEN × MATHRUKAM GECB NETWORK v4.7", delay: 700 },
  { text: "Connecting to Film & Drama Club servers...", delay: 1500 },
  { text: "Loading event archives...", delay: 2500 },
  { text: "Decrypting mission briefing...", delay: 3500 },
  { text: "Verifying team clearance protocol...", delay: 4400 },
  { text: "Loading participant registry...", delay: 5200 },
  { text: "Restoring TRAIL OF CLUES files...", delay: 6000 },
  { text: "Accessing event terminal...", delay: 7000 },
  { text: "ACCESS GRANTED", delay: 8200, highlight: true },
];

function TerminalBoot({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
          if (line.highlight) {
            setTimeout(() => setGlitch(true), 300);
            setTimeout(() => setGlitch(false), 600);
          }
        }, line.delay)
      );
    });

    timers.push(setTimeout(onComplete, 9500));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center scanlines crt-flicker" style={{ zIndex: 100 }}>
      <div
        className="w-full max-w-2xl px-8 py-12 font-mono"
        style={{ filter: glitch ? "hue-rotate(30deg) saturate(2)" : "none", transition: "filter 0.1s" }}
      >
        <div className="mb-6 border-b border-green-900/50 pb-4 flex items-center gap-3">
          <OrganizersLockup size={28} />
          <div className="text-green-600/70 text-xs tracking-widest">
            ■ SECURE TERMINAL — SILVER SCREEN × MATHRUKAM GECB — RESTRICTED ACCESS
          </div>
        </div>

        <div className="space-y-1.5">
          {BOOT_LINES.map((line, i) =>
            visibleLines.includes(i) ? (
              <div
                key={i}
                className={`text-sm flex items-start gap-3 ${line.highlight ? "text-green-300 font-bold text-base" : "text-green-500/80"}`}
              >
                <span className="text-green-700 mt-0.5 flex-shrink-0">{">"}</span>
                <span>{line.text}</span>
                {i === visibleLines[visibleLines.length - 1] && !line.highlight && (
                  <span className="cursor-blink text-green-400">█</span>
                )}
              </div>
            ) : null
          )}
        </div>

        {visibleLines.length > 3 && (
          <div className="mt-8">
            <div className="h-px bg-green-900/40 overflow-hidden">
              <div
                className="h-full bg-green-500/60"
                style={{
                  width: `${Math.min(100, (visibleLines.length / BOOT_LINES.length) * 100)}%`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div className="text-green-700 text-[10px] mt-1 tracking-widest">
              LOADING: {Math.min(100, Math.round((visibleLines.length / BOOT_LINES.length) * 100))}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PHASE 2: SECURITY SCANNER
// ════════════════════════════════════════════════════════

function SecurityScanner({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const phases = ["TEAM VERIFICATION", "CODE AUTHENTICATION PREP", "CLEARANCE CHECK", "ACCESS GRANTED"];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 1.4;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
        }
        return Math.min(100, next);
      });
    }, 50);

    const phaseTimers = [500, 1800, 3200, 4500].map((delay, i) => setTimeout(() => setPhase(i), delay));

    return () => {
      clearInterval(interval);
      phaseTimers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const r = 70;
  const circ = 2 * Math.PI * r;

  return (
    <div className="fixed inset-0 bg-inv-black flex flex-col items-center justify-center scanlines" style={{ zIndex: 100 }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        {[200, 300, 400].map((s) => (
          <div key={s} className="absolute rounded-full border border-green-500" style={{ width: s, height: s }} />
        ))}
        <div className="absolute w-1 h-64 bg-green-500 radar-spin origin-bottom" style={{ transformOrigin: "50% 100%" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(140,29,29,0.2)" strokeWidth="3" />
            <circle
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke="#8C1D1D"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ - (circ * progress) / 100}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <GecbLogo size={44} />
            <div className="text-inv-red font-mono text-lg font-bold mt-1">{Math.round(progress)}%</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-inv-offwhite text-xs font-mono tracking-[0.3em] uppercase mb-2 h-4">{phases[phase]}</div>
          <div className="text-3xl font-black tracking-[0.2em] text-inv-offwhite" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {EVENT_NAME}
          </div>
        </div>

        <div className="flex gap-4">
          {["🎬", "🎭", "🎞", "🔐"].map((icon, i) => (
            <div key={i} className="text-2xl opacity-40" style={{ opacity: progress > i * 25 ? 0.9 : 0.2, transition: "opacity 0.5s" }}>
              {icon}
            </div>
          ))}
        </div>

        <div className="w-72 h-1 bg-inv-border rounded-full overflow-hidden">
          <div className="h-full bg-inv-red rounded-full" style={{ width: `${progress}%`, transition: "width 0.1s linear" }} />
        </div>
        <div className="text-inv-muted text-[10px] font-mono tracking-widest">SECURITY CLEARANCE VERIFICATION IN PROGRESS</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PHASE 3: CONFIDENTIAL DOCUMENT
// ════════════════════════════════════════════════════════

function ConfidentialDocument({ onComplete }: { onComplete: () => void }) {
  const [stamped, setStamped] = useState(false);
  const [folding, setFolding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStamped(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleContinue = () => {
    setFolding(true);
    setTimeout(onComplete, 700);
  };

  return (
    <div className="fixed inset-0 bg-inv-brown flex items-center justify-center p-6" style={{ zIndex: 100 }}>
      <div className={`paper max-w-lg w-full p-8 relative shadow-2xl ${folding ? "fold-away" : "fade-up"}`} style={{ border: "1px solid #B8A878" }}>
        <div className="text-center border-b-2 border-[#2A1F14]/30 pb-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <OrganizersLockup size={32} />
          </div>
          <div className="text-[10px] font-mono text-[#6B5C40] tracking-[0.4em] uppercase mb-2">GECB SILVER SCREEN — FILM &amp; DRAMA CLUB</div>
          <div className="text-[9px] font-mono text-[#6B5C40] tracking-[0.3em] uppercase mb-2">in association with MATHRUKAM GECB</div>
          <div className="text-[10px] font-mono text-[#6B5C40] tracking-[0.4em]">NOTICE OF RESTRICTED ACCESS</div>
        </div>

        {stamped && (
          <div className="absolute -top-4 -right-4">
            <ConfidentialStamp color="#8C1D1D" />
          </div>
        )}

        <div className="space-y-4 font-mono text-[#2A1F14] text-sm leading-relaxed">
          <p className="font-bold text-base" style={{ fontFamily: "'Oswald', sans-serif" }}>
            NOTICE TO ALL TEAMS:
          </p>
          <p>Unauthorized access to this event portal is strictly prohibited.</p>
          <p>
            This portal is used to verify teams for <strong>TRAIL OF CLUES</strong>. Every team lead has been issued a confidential 5-character access
            code.
          </p>
          <p>
            Only <strong>assigned team leads</strong> with a verified access code may proceed beyond this point.
          </p>
          <p className="text-[#6B5C40] text-xs">
            By proceeding, you acknowledge that all verification attempts within this portal are logged for the Silver Screen × Mathrukam GECB organizing committee.
          </p>
        </div>

        <div className="my-6 border-t border-[#2A1F14]/20" />

        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-[#6B5C40] text-[9px] font-mono uppercase tracking-wider">Organizing Committee</div>
            <div className="text-[#2A1F14] text-lg mt-1" style={{ fontFamily: "'Caveat', cursive" }}>
              GECB Silver Screen × Mathrukam GECB
            </div>
            <div className="h-px w-32 bg-[#2A1F14]/30 mt-1" />
          </div>
          <div className="text-right">
            <div className="text-[#6B5C40] text-[9px] font-mono uppercase tracking-wider">Event Reference</div>
            <div className="text-[#2A1F14] font-mono font-bold text-sm mt-1">TOC-2026</div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-4 bg-[#2A1F14] text-[#E8DFC9] font-bold tracking-[0.3em] uppercase hover:bg-[#3A2F24] transition-colors"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}
        >
          CONTINUE — I UNDERSTAND
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PHASE 4: REVEAL
// ════════════════════════════════════════════════════════

function EventReveal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2200),
      setTimeout(() => setStep(4), 3200),
      setTimeout(onComplete, 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center cork" style={{ zIndex: 100 }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 400px 300px at 30% 50%, rgba(255,220,120,0.08) 0%, transparent 70%)",
          animation: "string-sway 3s ease-in-out infinite",
        }}
      />

      <div className="relative w-full max-w-4xl h-96 mx-auto">
        {step >= 1 && (
          <div className="absolute left-8 top-8 fade-up">
            <div className="paper p-4 w-36 rotate-[-5deg] shadow-xl relative">
              <PushPin color="#8C1D1D" />
              <div className="text-[8px] font-mono text-[#6B5C40] mb-2">TICKET STUB</div>
              <div className="w-full h-20 bg-[#D4C9A8] flex items-center justify-center text-3xl">🎟</div>
              <div className="text-[7px] font-mono text-[#6B5C40] mt-1">ADMIT ONE — SCREEN 1</div>
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="absolute left-1/3 top-4 fade-up">
            <div className="paper p-4 w-48 rotate-[2deg] shadow-xl relative">
              <PushPin color="#365A9C" size={12} />
              <div className="text-[8px] font-mono text-[#6B5C40] mb-2">CAMPUS MAP — ANNOTATED</div>
              <div className="w-full h-28 bg-[#D4C9A8] relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 120 80">
                  <rect x="10" y="10" width="30" height="20" fill="none" stroke="#2A1F14" strokeWidth="1" />
                  <rect x="55" y="5" width="25" height="30" fill="none" stroke="#2A1F14" strokeWidth="1" />
                  <rect x="10" y="50" width="40" height="20" fill="none" stroke="#2A1F14" strokeWidth="1" />
                  <rect x="70" y="45" width="35" height="25" fill="none" stroke="#2A1F14" strokeWidth="1" />
                  <line x1="40" y1="20" x2="55" y2="20" stroke="#2A1F14" strokeWidth="1" />
                  <circle cx="25" cy="20" r="3" fill="#8C1D1D" opacity="0.8" />
                  <circle cx="67" cy="20" r="3" fill="#8C1D1D" opacity="0.8" />
                  <line x1="25" y1="20" x2="67" y2="20" stroke="#8C1D1D" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
              </div>
              <div className="text-[8px] mt-1" style={{ fontFamily: "'Caveat', cursive", color: "#8C1D1D" }}>
                Portico marks the starting point
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="absolute right-8 top-12 fade-up">
            <div className="paper p-4 w-40 rotate-[4deg] shadow-xl relative">
              <PushPin color="#446B4A" size={12} />
              <ConfidentialStamp color="#8C1D1D" className="scale-75 origin-top-left mb-2" />
              <div className="text-[8px] font-mono text-[#2A1F14] leading-4 mt-2">
                CLASSIFIED
                <br />
                TEAM BRIEFING
                <br />
                REF: TOC-2026
                <br />
                CODE ACCESS ONLY
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none string-sway opacity-70">
            <line x1="20%" y1="25%" x2="45%" y2="30%" stroke="#8C1D1D" strokeWidth="1.5" />
            <line x1="45%" y1="30%" x2="78%" y2="28%" stroke="#8C1D1D" strokeWidth="1.5" />
          </svg>
        )}

        {step >= 4 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center fade-up">
            <div className="flex items-center gap-3">
              <GecbLogo size={72} ring={false} />
              <span className="text-inv-muted text-xl font-mono">×</span>
              <MathrukamLogo size={72} ring={false} />
            </div>
            <div
              className="text-inv-offwhite text-[clamp(2.6rem,9vw,6.5rem)] font-black tracking-[0.1em] text-center leading-none drop-shadow-2xl mt-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif", textShadow: "0 0 60px rgba(140,29,29,0.5)" }}
            >
              {EVENT_NAME}
            </div>
            <div className="text-inv-yellow text-base sm:text-xl tracking-[0.25em] uppercase mt-3 text-center px-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
              {ORGANIZERS} presents
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// REGISTRATION / CODE VERIFICATION
// ════════════════════════════════════════════════════════

type VerifyState = "idle" | "checking" | "rejected" | "confirmed";

function RegisterScreen({ onConfirmed }: { onConfirmed: (team: string, teamLead: string) => void }) {
  const [teamLead, setTeamLead] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [error, setError] = useState("");
  const [team, setTeam] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const canSubmit = teamLead.trim().length > 0 && code.trim().length === 5 && state !== "checking" && state !== "confirmed";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setState("checking");
    setError("");

    try {
      const res = await fetch("/.netlify/functions/submit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamLead: teamLead.trim(), code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok && data.accepted) {
        setTeam(data.team);
        setState("confirmed");
        setTimeout(() => onConfirmed(data.team, teamLead.trim()), 2600);
      } else {
        setState("rejected");
        setShake(true);
        setTimeout(() => setShake(false), 450);
        setTimeout(() => setState("idle"), 2200);
      }
    } catch {
      setState("rejected");
      setError("CONNECTION ERROR — TRY AGAIN");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setTimeout(() => setState("idle"), 2400);
    }
  };

  return (
    <div className={`fixed inset-0 bg-inv-brown flex items-center justify-center p-6 ${shake ? "shake-anim" : ""}`} style={{ zIndex: 100 }}>
      <DustParticles />

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(197,157,66,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-md w-full">
        <div className="relative">
          <div className="h-8 w-64 bg-inv-brown ml-6 rounded-t-sm border-t border-l border-r border-inv-border flex items-center px-3 gap-2">
            <GecbLogo size={16} />
            <span className="text-inv-muted text-[9px] font-mono">×</span>
            <MathrukamLogo size={16} />
            <span className="text-inv-muted text-[9px] font-mono tracking-wider uppercase">TRAIL OF CLUES — TOC-2026</span>
          </div>

          <div className="relative bg-[#1A140F] border-2 border-inv-border p-8 overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div className="absolute top-4 right-6 w-4 h-12 border-2 border-inv-muted/30 rounded-b-full" />

            <div className="text-center mb-8">
              <div className="flex justify-center mb-3">
                <OrganizersLockup size={48} />
              </div>
              <div className="text-inv-muted text-[9px] font-mono tracking-[0.3em] uppercase mb-1">RESTRICTED ACCESS PORTAL</div>
              <div className="text-inv-muted text-[8px] font-mono tracking-[0.2em] uppercase mb-3">Silver Screen × Mathrukam GECB</div>
              <h1 className="text-inv-offwhite text-3xl sm:text-4xl font-black tracking-[0.12em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                TEAM VERIFICATION
              </h1>
              <div className="mt-3 text-inv-muted text-xs font-mono leading-relaxed max-w-xs mx-auto">
                Every team has been assigned to a group with a confidential 5-character access code. Enter your team's name and your group's code to verify.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-inv-yellow text-[9px] font-mono tracking-[0.3em] uppercase block mb-2">Team Lead Name</label>
                <input
                  type="text"
                  value={teamLead}
                  onChange={(e) => setTeamLead(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="TEAM LEAD NAME..."
                  disabled={state === "checking" || state === "confirmed"}
                  className="w-full bg-inv-black border border-inv-border text-inv-offwhite font-mono text-base px-4 py-3 tracking-wide outline-none focus:border-inv-yellow transition-colors placeholder:text-inv-border placeholder:text-sm disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-inv-yellow text-[9px] font-mono tracking-[0.3em] uppercase block mb-2">5-Character Group Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="XXXXX"
                  disabled={state === "checking" || state === "confirmed"}
                  className="w-full bg-inv-black border border-inv-border text-inv-offwhite font-mono text-lg px-4 py-3 tracking-[0.4em] uppercase outline-none focus:border-inv-yellow transition-colors placeholder:text-inv-border placeholder:text-sm placeholder:tracking-normal disabled:opacity-50"
                />
              </div>

              {state === "rejected" && (
                <div className="text-inv-red text-[10px] font-mono tracking-wider border border-inv-red/30 px-3 py-2 bg-inv-red/5">
                  ⚠ {error || "CODE REJECTED — CLEARANCE DENIED"}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-4 bg-inv-red text-inv-offwhite font-black tracking-[0.3em] uppercase hover:bg-inv-red-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}
              >
                {state === "checking" ? "VERIFYING..." : "VERIFY CODE"}
              </button>
            </div>

            {state === "rejected" && (
              <div className="absolute inset-0 bg-inv-black/70 flex items-center justify-center">
                <ConfidentialStamp color="#8C1D1D" text="CODE REJECTED" anim="stamp-reject-anim" className="text-lg px-5 py-2 border-4" />
              </div>
            )}

            {state === "confirmed" && (
              <div className="absolute inset-0 bg-inv-black/75 flex flex-col items-center justify-center gap-3">
                <ConfidentialStamp color="#446B4A" text="CONFIRMED" className="text-2xl px-6 py-3 border-4" />
                {team && TEAM_INFO[team] && (
                  <div
                    className="fade-up text-center px-4 py-1 border font-mono text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: TEAM_INFO[team].color, color: TEAM_INFO[team].color, animationDelay: "0.3s" }}
                  >
                    Assigned Team: {TEAM_INFO[team].label}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// EXIT SCREEN — RETURN TO PORTICO
// ════════════════════════════════════════════════════════

function ExitScreen({ team, teamLead }: { team: string; teamLead: string }) {
  const info = TEAM_INFO[team];

  return (
    <div className="fixed inset-0 bg-inv-black flex flex-col items-center justify-center overflow-hidden" style={{ zIndex: 100 }}>
      <div className="absolute inset-0 slow-zoom" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(140,29,29,0.18) 0%, transparent 70%)" }} />
      <DustParticles />

      <div className="relative z-10 flex flex-col items-center text-center px-6 fade-up">
        <div className="flex items-center gap-2">
          <GecbLogo size={64} ring={false} />
          <span className="text-inv-muted text-lg font-mono">×</span>
          <MathrukamLogo size={64} ring={false} />
        </div>

        <div className="mt-6 text-inv-muted text-[10px] font-mono tracking-[0.4em] uppercase">
          Verified — {teamLead}
          {info && (
            <span className="ml-2" style={{ color: info.color }}>
              · Team {info.label}
            </span>
          )}
        </div>

        <div
          className="mt-4 text-inv-offwhite text-[clamp(2rem,8vw,5rem)] font-black tracking-[0.08em] leading-tight"
          style={{ fontFamily: "'Bebas Neue', sans-serif", textShadow: "0 0 60px rgba(140,29,29,0.5)" }}
        >
          IMMEDIATE RETURN
          <br />
          TO PORTICO
        </div>

        <div className="mt-6 text-inv-yellow text-sm sm:text-base tracking-[0.2em] uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Your clearance is confirmed. Proceed to the portico now.
        </div>

        <div className="mt-10 flex items-center gap-3 text-inv-red text-3xl">
          <span className="walk-pulse">➜</span>
          <span className="walk-pulse" style={{ animationDelay: "0.2s" }}>➜</span>
          <span className="walk-pulse" style={{ animationDelay: "0.4s" }}>➜</span>
        </div>

        <div className="mt-10 text-inv-muted text-[9px] font-mono tracking-widest">{ORGANIZERS}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("boot-terminal");
  const [team, setTeam] = useState<string>("");
  const [teamLead, setTeamLead] = useState<string>("");

  const advance = useCallback((next: AppPhase) => setPhase(next), []);

  return (
    <div className="min-h-screen bg-inv-black">
      <FilmGrain />
      <DustParticles />

      {phase === "boot-terminal" && <TerminalBoot onComplete={() => advance("boot-scanner")} />}
      {phase === "boot-scanner" && <SecurityScanner onComplete={() => advance("boot-document")} />}
      {phase === "boot-document" && <ConfidentialDocument onComplete={() => advance("boot-reveal")} />}
      {phase === "boot-reveal" && <EventReveal onComplete={() => advance("register")} />}
      {phase === "register" && (
        <RegisterScreen
          onConfirmed={(t, lead) => {
            setTeam(t);
            setTeamLead(lead);
            advance("exit");
          }}
        />
      )}
      {phase === "exit" && <ExitScreen team={team} teamLead={teamLead} />}
    </div>
  );
}
