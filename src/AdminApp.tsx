import { useEffect, useMemo, useState } from "react";
import "./index.css";

type Submission = {
  key: string;
  teamLead: string;
  code: string;
  team?: string;
  status: "accepted" | "rejected";
  reason?: "unknown-code" | "name-mismatch" | "team-not-in-group";
  timestamp: string;
};

type Config = {
  groupCodes: Record<string, string>;
  teamRoster: Record<string, string[]>;
};

const REASON_LABELS: Record<string, string> = {
  "unknown-code": "unknown code",
  "name-mismatch": "wrong name for code",
  "team-not-in-group": "team not on that group's roster",
};

const TEAM_NAMES = ["DOLLYTRACK", "CLAPBOARD", "GREENSCREEN", "ACTON", "CUT!"];

const TEAM_COLORS: Record<string, string> = {
  DOLLYTRACK: "#8C1D1D",
  CLAPBOARD: "#365A9C",
  GREENSCREEN: "#446B4A",
  ACTON: "#C59D42",
  "CUT!": "#6B3FA0",
};

// Pull a useful message out of a failed fetch response instead of a blanket
// "could not reach backend" — makes it obvious whether ADMIN_KEY is missing,
// the function isn't deployed, etc.
async function describeFailure(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) return `${data.error} (${res.status})`;
  } catch {
    // body wasn't JSON — fall through
  }
  if (res.status === 404) return "Function not found (404) — check it deployed correctly.";
  if (res.status === 500) return "Server error (500) — check the function's environment variables.";
  return `Request failed (${res.status})`;
}

export default function AdminApp() {
  const [adminKey, setAdminKey] = useState<string>(() => sessionStorage.getItem("toc-admin-key") || "");
  const [inputKey, setInputKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"all" | "accepted" | "rejected">("accepted");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Config editor state (group codes + team roster, backed by Blobs via seed-config)
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [draftCodes, setDraftCodes] = useState<Record<string, string>>({});
  const [draftRoster, setDraftRoster] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configErr, setConfigErr] = useState("");
  const [configMsg, setConfigMsg] = useState("");

  const fetchSubs = async (key: string) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/.netlify/functions/get-submissions", {
        headers: { "x-admin-key": key },
      });
      if (res.status === 401) {
        setAuthed(false);
        sessionStorage.removeItem("toc-admin-key");
        setErr("Invalid admin key.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setErr(await describeFailure(res));
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSubs(data);
      setAuthed(true);
      setAdminKey(key);
      sessionStorage.setItem("toc-admin-key", key);
    } catch {
      setErr("Could not reach the backend. Check your connection or Netlify function deployment.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async (key: string) => {
    setConfigLoading(true);
    setConfigErr("");
    try {
      const res = await fetch("/.netlify/functions/seed-config", {
        headers: { "x-admin-key": key },
      });
      if (!res.ok) {
        setConfigErr(await describeFailure(res));
        return;
      }
      const data: Config = await res.json();
      setConfig(data);
      setDraftCodes({ ...(data.groupCodes || {}) });
      const rosterText: Record<string, string> = {};
      Object.entries(data.teamRoster || {}).forEach(([group, names]) => {
        rosterText[group] = (names || []).join("\n");
      });
      setDraftRoster(rosterText);
    } catch {
      setConfigErr("Could not reach the backend for config.");
    } finally {
      setConfigLoading(false);
    }
  };

  const saveConfig = async () => {
    setConfigLoading(true);
    setConfigErr("");
    setConfigMsg("");
    const teamRoster: Record<string, string[]> = {};
    Object.entries(draftRoster).forEach(([group, text]) => {
      teamRoster[group] = text
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean);
    });
    try {
      const res = await fetch("/.netlify/functions/seed-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ groupCodes: draftCodes, teamRoster }),
      });
      if (!res.ok) {
        setConfigErr(await describeFailure(res));
        return;
      }
      const data: Config = await res.json();
      setConfig(data);
      setConfigMsg("Saved to Blobs.");
      setTimeout(() => setConfigMsg(""), 3000);
    } catch {
      setConfigErr("Could not reach the backend to save.");
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) fetchSubs(adminKey);
  }, []);

  useEffect(() => {
    if (authed && adminKey) fetchConfig(adminKey);
  }, [authed]);

  useEffect(() => {
    if (!authed || !autoRefresh) return;
    const id = setInterval(() => fetchSubs(adminKey), 8000);
    return () => clearInterval(id);
  }, [authed, autoRefresh, adminKey]);

  const filtered = useMemo(() => {
    return subs
      .filter((s) => filter === "all" || s.status === filter)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [subs, filter]);

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TEAM_NAMES.forEach((t) => (counts[t] = 0));
    subs
      .filter((s) => s.status === "accepted" && s.team)
      .forEach((s) => {
        counts[s.team!] = (counts[s.team!] || 0) + 1;
      });
    return counts;
  }, [subs]);

  const groupsToShow = useMemo(() => {
    const fromConfig = config ? Object.keys(config.groupCodes || {}) : [];
    return fromConfig.length ? fromConfig : TEAM_NAMES;
  }, [config]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-inv-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-[#1A140F] border-2 border-inv-border p-8">
          <h1 className="text-inv-offwhite text-2xl font-black tracking-wider mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            TRAIL OF CLUES — ADMIN
          </h1>
          <p className="text-inv-muted text-xs font-mono mb-6">Enter the admin key to view team verification data.</p>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSubs(inputKey)}
            placeholder="ADMIN KEY"
            className="w-full bg-inv-black border border-inv-border text-inv-offwhite font-mono text-sm px-4 py-3 mb-3 outline-none focus:border-inv-yellow"
          />
          {err && <div className="text-inv-red text-xs font-mono mb-3">{err}</div>}
          <button
            onClick={() => fetchSubs(inputKey)}
            disabled={loading || !inputKey}
            className="w-full py-3 bg-inv-red text-inv-offwhite font-bold tracking-widest uppercase text-sm hover:bg-inv-red-bright disabled:opacity-50"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
          <p className="text-inv-muted text-[10px] font-mono mt-4 leading-relaxed">
            This key is set as the <code>ADMIN_KEY</code> environment variable in your Netlify site settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-inv-black text-inv-offwhite p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              TRAIL OF CLUES — VERIFICATION LOG
            </h1>
            <p className="text-inv-muted text-xs font-mono mt-1">GECB Silver Screen — organizer dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-inv-muted text-xs font-mono flex items-center gap-1.5">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-refresh
            </label>
            <button
              onClick={() => setShowConfig((v) => !v)}
              className="px-3 py-2 border border-inv-yellow text-inv-yellow text-xs font-mono uppercase tracking-wider hover:bg-inv-yellow/10"
            >
              {showConfig ? "Hide" : "Manage"} Codes & Teams
            </button>
            <button
              onClick={() => fetchSubs(adminKey)}
              className="px-3 py-2 border border-inv-border text-xs font-mono uppercase tracking-wider hover:border-inv-yellow"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Config editor — reads/writes the group codes + team roster stored in Blobs */}
        {showConfig && (
          <div className="border-2 border-inv-yellow/40 p-4 mb-8 bg-[#1A140F]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-inv-yellow text-sm font-mono uppercase tracking-widest">Group Codes & Team Roster</h2>
              <button
                onClick={() => fetchConfig(adminKey)}
                className="text-inv-muted text-[10px] font-mono uppercase tracking-wider hover:text-inv-yellow"
              >
                {configLoading ? "Loading..." : "Reload from Blobs"}
              </button>
            </div>

            {configErr && <div className="text-inv-red text-xs font-mono mb-3">{configErr}</div>}
            {configMsg && <div className="text-inv-green text-xs font-mono mb-3">{configMsg}</div>}

            {!config && !configErr && (
              <div className="text-inv-muted text-xs font-mono py-4">
                Loading config... If this never loads, the config hasn't been seeded yet — see the README's{" "}
                <code>seed-config</code> instructions.
              </div>
            )}

            {config && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {groupsToShow.map((group) => (
                    <div key={group} className="border border-inv-border p-3">
                      <div
                        className="text-[10px] font-mono uppercase tracking-widest mb-2"
                        style={{ color: TEAM_COLORS[group] || "#D8C9A3" }}
                      >
                        {group}
                      </div>
                      <label className="text-inv-muted text-[9px] font-mono uppercase tracking-wider block mb-1">
                        Group code
                      </label>
                      <input
                        type="text"
                        value={draftCodes[group] ?? ""}
                        onChange={(e) =>
                          setDraftCodes((prev) => ({ ...prev, [group]: e.target.value.toUpperCase() }))
                        }
                        maxLength={5}
                        className="w-full bg-inv-black border border-inv-border text-inv-offwhite font-mono text-sm tracking-[0.3em] uppercase px-2 py-1.5 mb-3 outline-none focus:border-inv-yellow"
                      />
                      <label className="text-inv-muted text-[9px] font-mono uppercase tracking-wider block mb-1">
                        Team names (one per line)
                      </label>
                      <textarea
                        value={draftRoster[group] ?? ""}
                        onChange={(e) => setDraftRoster((prev) => ({ ...prev, [group]: e.target.value }))}
                        rows={5}
                        className="w-full bg-inv-black border border-inv-border text-inv-offwhite font-mono text-xs px-2 py-1.5 outline-none focus:border-inv-yellow resize-y"
                        placeholder={"Team Alpha\nTeam Bravo"}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveConfig}
                  disabled={configLoading}
                  className="px-4 py-2 bg-inv-yellow text-inv-black font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                >
                  {configLoading ? "Saving..." : "Save to Blobs"}
                </button>
                <span className="text-inv-muted text-[10px] font-mono ml-3">
                  Takes effect immediately — no redeploy needed.
                </span>
              </>
            )}
          </div>
        )}

        {/* Team counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {TEAM_NAMES.map((t) => (
            <div key={t} className="border p-3" style={{ borderColor: TEAM_COLORS[t] }}>
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: TEAM_COLORS[t] }}>
                {t}
              </div>
              <div className="text-2xl font-black mt-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {teamCounts[t] ?? 0}
              </div>
              <div className="text-inv-muted text-[9px] font-mono">verified groups</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(["accepted", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border ${
                filter === f ? "border-inv-yellow text-inv-yellow" : "border-inv-border text-inv-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {err && <div className="text-inv-red text-xs font-mono mb-4">{err}</div>}

        {/* Table */}
        <div className="border border-inv-border overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-inv-border text-inv-muted text-[10px] uppercase tracking-wider">
                <th className="text-left px-3 py-2">Team</th>
                <th className="text-left px-3 py-2">Code</th>
                <th className="text-left px-3 py-2">Group</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-inv-muted py-8 text-xs">
                    No entries yet.
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.key} className="border-b border-inv-border/50">
                  <td className="px-3 py-2">{s.teamLead}</td>
                  <td className="px-3 py-2 tracking-widest">{s.code}</td>
                  <td className="px-3 py-2" style={{ color: s.team ? TEAM_COLORS[s.team] : undefined }}>
                    {s.team || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                        s.status === "accepted" ? "border-inv-green text-inv-green" : "border-inv-red text-inv-red"
                      }`}
                    >
                      {s.status}
                    </span>
                    {s.status === "rejected" && s.reason && (
                      <div className="text-[10px] text-inv-muted mt-1 normal-case tracking-normal">
                        {REASON_LABELS[s.reason] || s.reason}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-inv-muted text-xs">{new Date(s.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
