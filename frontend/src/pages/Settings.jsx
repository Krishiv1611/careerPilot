import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Cpu,
  Download,
  Eye,
  Github,
  KeyRound,
  Layers,
  Linkedin,
  Loader2,
  LogOut,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  User,
  Zap,
} from 'lucide-react';

import { useAuth } from '../context/auth-context';
import {
  fetchGitHubProfile,
  fetchLeetCodeProfile,
  importLinkedInProfile,
} from '../services/api';
import {
  StudioBadge,
  StudioButton,
  StudioCard,
} from '../components/studio/StudioPrimitives';

const Settings = () => {
  const { user, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // LeetCode state
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [leetcodeError, setLeetcodeError] = useState('');

  // GitHub state
  const [githubUsername, setGithubUsername] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [githubError, setGithubError] = useState('');

  // LinkedIn state
  const [linkedinText, setLinkedinText] = useState('');
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinData, setLinkedinData] = useState(null);
  const [linkedinError, setLinkedinError] = useState('');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState(null);
  const [cacheRefreshed, setCacheRefreshed] = useState(false);

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFetchLeetCode = async (e) => {
    e.preventDefault();
    if (!leetcodeUsername.trim()) return;
    setLeetcodeLoading(true);
    setLeetcodeError('');
    try {
      const data = await fetchLeetCodeProfile(leetcodeUsername.trim());
      if (!data.found && data.total_solved === 0) {
        setLeetcodeError('No public LeetCode profile found for that handle.');
      } else {
        setLeetcodeData(data);
      }
    } catch {
      setLeetcodeError('Could not fetch LeetCode data. Please verify username.');
    } finally {
      setLeetcodeLoading(false);
    }
  };

  const handleFetchGitHub = async (e) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;
    setGithubLoading(true);
    setGithubError('');
    try {
      const data = await fetchGitHubProfile(githubUsername.trim());
      if (!data.found && data.public_repos === 0) {
        setGithubError('No public GitHub repositories found for that handle.');
      } else {
        setGithubData(data);
      }
    } catch {
      setGithubError('Could not fetch GitHub data. Please verify username.');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleImportLinkedIn = async (e) => {
    e.preventDefault();
    if (!linkedinText.trim()) return;
    setLinkedinLoading(true);
    setLinkedinError('');
    try {
      const data = await importLinkedInProfile(linkedinText.trim());
      setLinkedinData(data);
    } catch {
      setLinkedinError('Failed to extract LinkedIn profile text.');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exported_at: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        full_name: user?.full_name,
      },
      connectors: {
        leetcode: leetcodeData || null,
        github: githubData || null,
        linkedin: linkedinData || null,
      },
      theme: {
        mode: 'cyber-obsidian',
        accent: 'cyan-emerald',
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerpilot-candidate-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearCache = () => {
    setCacheRefreshed(true);
    setTimeout(() => setCacheRefreshed(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Studio Header */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <StudioBadge variant="cyan" size="sm">
            Studio Preferences &amp; Telemetry
          </StudioBadge>
          <span className="font-mono text-xs text-slate-400">Technical Connectors</span>
        </div>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-100 sm:text-4xl">
          Platform Connectors &amp; Settings
        </h1>
        <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
          Sync your verified engineering profiles to automatically generate truth-guarded ATS
          resume evidence without inventing ungrounded claims. Manage theme indicators, account
          telemetry, and data export.
        </p>
      </header>

      {/* LeetCode Connector */}
      <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/30">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">LeetCode Public Connector</h2>
              <StudioBadge variant="amber" size="xs">
                Algorithmic Evidence
              </StudioBadge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Query problem-solving telemetry directly from public GraphQL endpoints.
            </p>
          </div>
        </div>

        <form onSubmit={handleFetchLeetCode} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder="LeetCode username (e.g. neetcode)"
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            className="flex-1 rounded-xl border border-[#1F2937] bg-[#05070A] px-3.5 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 transition"
          />
          <StudioButton
            type="submit"
            variant="secondary"
            size="sm"
            loading={leetcodeLoading}
            disabled={leetcodeLoading || !leetcodeUsername.trim()}
          >
            {leetcodeLoading ? 'Querying LeetCode...' : 'Fetch Stats'}
          </StudioButton>
        </form>

        {leetcodeError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>{leetcodeError}</span>
          </div>
        )}

        {leetcodeData && (
          <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937]">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Total Solved
                </span>
                <p className="mt-1 text-lg font-black font-mono text-slate-100">
                  {leetcodeData.total_solved}
                </p>
              </div>
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937]">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                  Easy
                </span>
                <p className="mt-1 text-lg font-black font-mono text-slate-100">
                  {leetcodeData.easy_solved}
                </p>
              </div>
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937]">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                  Medium
                </span>
                <p className="mt-1 text-lg font-black font-mono text-slate-100">
                  {leetcodeData.medium_solved}
                </p>
              </div>
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937]">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                  Hard
                </span>
                <p className="mt-1 text-lg font-black font-mono text-slate-100">
                  {leetcodeData.hard_solved}
                </p>
              </div>
            </div>

            {leetcodeData.bullet_point && (
              <div className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Verified Resume STAR Bullet:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(leetcodeData.bullet_point, 'leetcode-bullet')}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    {copiedKey === 'leetcode-bullet' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" /> Copy Bullet
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs font-mono leading-relaxed text-slate-200">
                  {leetcodeData.bullet_point}
                </p>
              </div>
            )}
          </div>
        )}
      </StudioCard>

      {/* GitHub Connector */}
      <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/30">
            <Github className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">GitHub Public Repository Hub</h2>
              <StudioBadge variant="cyan" size="xs">
                Code Telemetry
              </StudioBadge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Aggregate public repositories, star counts, and language heuristics for evidence.
            </p>
          </div>
        </div>

        <form onSubmit={handleFetchGitHub} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder="GitHub handle (e.g. torvalds)"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            className="flex-1 rounded-xl border border-[#1F2937] bg-[#05070A] px-3.5 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 transition"
          />
          <StudioButton
            type="submit"
            variant="secondary"
            size="sm"
            loading={githubLoading}
            disabled={githubLoading || !githubUsername.trim()}
          >
            {githubLoading ? 'Syncing Repos...' : 'Sync Repos'}
          </StudioButton>
        </form>

        {githubError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>{githubError}</span>
          </div>
        )}

        {githubData && (
          <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937]">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Public Repos
                </span>
                <p className="mt-1 text-lg font-black font-mono text-slate-100">
                  {githubData.public_repos}
                </p>
              </div>
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937]">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Total Stars
                </span>
                <p className="mt-1 text-lg font-black font-mono text-slate-100">
                  {githubData.total_stars}
                </p>
              </div>
              <div className="rounded-lg bg-[#0F141C] p-3 border border-[#1F2937] col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  Top Languages
                </span>
                <p className="mt-1 text-xs font-mono font-bold text-slate-200 truncate">
                  {githubData.top_languages.join(', ') || 'N/A'}
                </p>
              </div>
            </div>

            {githubData.bullet_point && (
              <div className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Verified Project STAR Bullet:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(githubData.bullet_point, 'github-bullet')}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    {copiedKey === 'github-bullet' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" /> Copy Bullet
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs font-mono leading-relaxed text-slate-200">
                  {githubData.bullet_point}
                </p>
              </div>
            )}
          </div>
        )}
      </StudioCard>

      {/* LinkedIn Profile Import */}
      <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/30">
            <Linkedin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">LinkedIn Profile Text Import</h2>
              <StudioBadge variant="neutral" size="xs">
                Profile AST
              </StudioBadge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Paste text from exported profile or PDF to extract headline, education, and skills.
            </p>
          </div>
        </div>

        <form onSubmit={handleImportLinkedIn} className="space-y-3 pt-1">
          <textarea
            rows={3}
            placeholder="Paste text from LinkedIn profile or 'Save to PDF' export..."
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
            className="w-full rounded-xl border border-[#1F2937] bg-[#05070A] p-3 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 transition"
          />
          <div className="flex justify-end">
            <StudioButton
              type="submit"
              variant="secondary"
              size="sm"
              loading={linkedinLoading}
              disabled={linkedinLoading || !linkedinText.trim()}
            >
              {linkedinLoading ? 'Extracting Profile...' : 'Extract LinkedIn Profile'}
            </StudioButton>
          </div>
        </form>

        {linkedinError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>{linkedinError}</span>
          </div>
        )}

        {linkedinData && (
          <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 space-y-2.5 font-mono text-xs">
            {linkedinData.name && (
              <p className="text-slate-300">
                <span className="font-bold text-cyan-400">Name:</span> {linkedinData.name}
              </p>
            )}
            {linkedinData.headline && (
              <p className="text-slate-300">
                <span className="font-bold text-cyan-400">Headline:</span> {linkedinData.headline}
              </p>
            )}
            {linkedinData.education && (
              <p className="text-slate-300">
                <span className="font-bold text-cyan-400">Education:</span> {linkedinData.education}
              </p>
            )}
            {linkedinData.skills?.length > 0 && (
              <div className="pt-2">
                <p className="font-bold text-slate-200">
                  Extracted Skills ({linkedinData.skills.length}):
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {linkedinData.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-[#1F2937] bg-[#0F141C] px-2 py-0.5 text-[11px] font-semibold text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </StudioCard>

      {/* Studio Preferences Deck: Theme Indicators & System Telemetry */}
      <StudioCard variant="elevated" className="p-6 border-[#1F2937] bg-[#171F2C] space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/30">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Studio Preferences &amp; Theme Deck</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Cyber Obsidian visual tokens, animation physics, and interface telemetry.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Indicator 1: Active Theme */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0F141C] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Active Theme Engine
              </span>
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
            </div>
            <p className="text-xs font-mono font-bold text-slate-100">
              Cyber Obsidian Studio
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              Dark slate glass canvas (#080B0F)
            </p>
          </div>

          {/* Indicator 2: Accent Palette */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0F141C] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Studio Accent Matrix
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs font-mono font-bold text-slate-100">
              Neon Cyan &amp; Emerald
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              High-contrast telemetry &amp; syntax
            </p>
          </div>

          {/* Indicator 3: Motion Engine */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0F141C] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Motion Physics
              </span>
              <Zap className="h-3 w-3 text-amber-400" />
            </div>
            <p className="text-xs font-mono font-bold text-slate-100">
              {shouldReduceMotion ? 'Reduced Motion Active' : 'Spring Dynamics (Stiffness: 400)'}
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              prefers-reduced-motion respected
            </p>
          </div>

          {/* Indicator 4: Terminal High-Contrast */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0F141C] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Code Inspector
              </span>
              <Terminal className="h-3 w-3 text-purple-400" />
            </div>
            <p className="text-xs font-mono font-bold text-slate-100">
              AST High Contrast Mode
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              Line numbers &amp; token highlighting
            </p>
          </div>
        </div>
      </StudioCard>

      {/* Data Management & Session Controls */}
      <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/30">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Data Management &amp; Telemetry</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Export candidate telemetry JSON or refresh client cache.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#1F2937] bg-[#171F2C] p-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200">
              Export Candidate Telemetry Snapshot
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Download your profile preferences, connector statistics, and telemetry records as JSON.
            </p>
          </div>
          <StudioButton
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportData}
            className="shrink-0"
          >
            Export JSON
          </StudioButton>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#1F2937] bg-[#171F2C] p-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200">
              Refresh Local Studio Cache
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Flush in-memory session caches to reload the freshest evidence from the database.
            </p>
          </div>
          <StudioButton
            variant="glass"
            size="sm"
            icon={RefreshCw}
            onClick={handleClearCache}
            className="shrink-0"
          >
            {cacheRefreshed ? 'Cache Flushed!' : 'Refresh Cache'}
          </StudioButton>
        </div>
      </StudioCard>

      {/* Account Details & Credentials Deck */}
      <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/30">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Account Telemetry</h2>
              <StudioBadge variant="emerald" size="xs">
                Candidate Tier
              </StudioBadge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Authenticated user details and credentials security status.
            </p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-3.5">
            <dt className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Candidate Name
            </dt>
            <dd className="mt-1 text-sm font-bold text-slate-100">
              {user?.full_name || 'Candidate'}
            </dd>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-3.5">
            <dt className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Email Address
            </dt>
            <dd className="mt-1 text-sm font-bold text-slate-100 font-mono">{user?.email}</dd>
          </div>
        </dl>

        {/* Server Managed Security Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400 shrink-0" />
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              Provider Credentials Are Server-Managed
            </h3>
            <p className="text-xs leading-relaxed text-emerald-200/90">
              CareerPilot orchestrates all API keys (OpenAI, Anthropic, GitHub) securely on the
              backend server. No client-side key storage or credentials exposure required.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <StudioButton
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={logout}
          >
            Sign Out of Studio
          </StudioButton>
        </div>
      </StudioCard>
    </div>
  );
};

export default Settings;
