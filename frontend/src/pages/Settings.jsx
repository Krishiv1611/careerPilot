import { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  Github,
  Linkedin,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../context/auth-context';
import {
  fetchGitHubProfile,
  fetchLeetCodeProfile,
  importLinkedInProfile,
} from '../services/api';


const Settings = () => {
  const { user, logout } = useAuth();

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

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Connectors & Account</p>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950">Platform Connectors</h1>
        <p className="text-sm text-slate-600">Connect your technical profiles to automatically generate verified ATS resume evidence without inventing claims.</p>
      </header>

      {/* LeetCode Connector */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 border border-amber-200">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">LeetCode Public Connector</h2>
            <p className="text-xs text-slate-500">Query your algorithmic problem solving stats directly from LeetCode public GraphQL.</p>
          </div>
        </div>

        <form onSubmit={handleFetchLeetCode} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="LeetCode username (e.g. neetcode)"
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={leetcodeLoading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {leetcodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Stats'}
          </button>
        </form>

        {leetcodeError && <p className="mt-2 text-xs text-red-600">{leetcodeError}</p>}

        {leetcodeData && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Solved</span>
                <p className="mt-1 text-lg font-black text-slate-900">{leetcodeData.total_solved}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Easy</span>
                <p className="mt-1 text-lg font-black text-slate-900">{leetcodeData.easy_solved}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-amber-600 uppercase">Medium</span>
                <p className="mt-1 text-lg font-black text-slate-900">{leetcodeData.medium_solved}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-red-600 uppercase">Hard</span>
                <p className="mt-1 text-lg font-black text-slate-900">{leetcodeData.hard_solved}</p>
              </div>
            </div>

            {leetcodeData.bullet_point && (
              <div className="mt-3 rounded-lg bg-white p-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Verified Resume Bullet:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(leetcodeData.bullet_point, 'leetcode-bullet')}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    {copiedKey === 'leetcode-bullet' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === 'leetcode-bullet' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-800 font-mono">{leetcodeData.bullet_point}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* GitHub Connector */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-900 border border-slate-200">
            <Github className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">GitHub Public Repository Hub</h2>
            <p className="text-xs text-slate-500">Aggregate public repositories, star counts, and top languages for candidate evidence.</p>
          </div>
        </div>

        <form onSubmit={handleFetchGitHub} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="GitHub handle (e.g. torvalds)"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={githubLoading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {githubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync Repos'}
          </button>
        </form>

        {githubError && <p className="mt-2 text-xs text-red-600">{githubError}</p>}

        {githubData && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Public Repos</span>
                <p className="mt-1 text-lg font-black text-slate-900">{githubData.public_repos}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-amber-500 uppercase">Total Stars</span>
                <p className="mt-1 text-lg font-black text-slate-900">{githubData.total_stars}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Top Languages</span>
                <p className="mt-1 text-sm font-bold text-slate-800 truncate">{githubData.top_languages.join(', ') || 'N/A'}</p>
              </div>
            </div>

            {githubData.bullet_point && (
              <div className="mt-3 rounded-lg bg-white p-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Verified Project Bullet:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(githubData.bullet_point, 'github-bullet')}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    {copiedKey === 'github-bullet' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === 'github-bullet' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-800 font-mono">{githubData.bullet_point}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* LinkedIn Profile Import */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 border border-blue-200">
            <Linkedin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">LinkedIn Profile Text Import</h2>
            <p className="text-xs text-slate-500">Paste text from your exported LinkedIn profile to extract headline, education, and skills.</p>
          </div>
        </div>

        <form onSubmit={handleImportLinkedIn} className="mt-4 space-y-3">
          <textarea
            rows={3}
            placeholder="Paste text from LinkedIn profile or 'Save to PDF' export..."
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono focus:border-slate-900 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={linkedinLoading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {linkedinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Extract LinkedIn Profile'}
          </button>
        </form>

        {linkedinError && <p className="mt-2 text-xs text-red-600">{linkedinError}</p>}

        {linkedinData && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            {linkedinData.name && <p className="text-xs"><strong className="text-slate-700">Name:</strong> {linkedinData.name}</p>}
            {linkedinData.headline && <p className="text-xs"><strong className="text-slate-700">Headline:</strong> {linkedinData.headline}</p>}
            {linkedinData.education && <p className="text-xs"><strong className="text-slate-700">Education:</strong> {linkedinData.education}</p>}
            {linkedinData.skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-700">Extracted Skills ({linkedinData.skills.length}):</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {linkedinData.skills.map((s) => (
                    <span key={s} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Account Info */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-950">Account Details</h2>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Name</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.full_name || 'Student'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Email</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <h2 className="font-bold text-slate-950">Provider credentials are server managed</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">CareerPilot manages API keys securely on the server. No client-side key pasting required.</p>
          </div>
        </div>
      </section>

      <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
};

export default Settings;
