import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Github,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';

import {
  completeGrowthPriority,
  getGrowthPlan,
  getSkillBlueprint,
  verifyGitHubRepo,
} from '../services/api';
import {
  StudioBadge,
  StudioButton,
  StudioCard,
  StudioMotionDrawer,
} from '../components/studio/StudioPrimitives';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;

/* Syntax Highlighting for Blueprint Code Snippets */
const SyntaxHighlightedCode = ({ code = '' }) => {
  const lines = useMemo(() => code.split('\n'), [code]);

  return (
    <div className="table w-full border-collapse">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        const isComment =
          trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('--');

        if (isComment) {
          return (
            <div key={lineIdx} className="table-row">
              <span className="table-cell select-none pr-4 text-right text-slate-600 font-mono text-xs w-8">
                {lineIdx + 1}
              </span>
              <span className="table-cell font-mono text-xs text-slate-500 italic whitespace-pre">
                {line}
              </span>
            </div>
          );
        }

        const tokenRegex =
          /(".*?"|'.*?'|\b(?:FROM|WORKDIR|RUN|COPY|USER|EXPOSE|ENTRYPOINT|CMD|ENV|ARG|AS|SELECT|INSERT|UPDATE|DELETE|JOIN|WHERE|CREATE|INDEX|TABLE|def|class|import|from|return|async|await|with|try|except|for|in|if|else|elif|const|let|var|function|git|docker|npm)\b|\b\d+\b|[^\s"'\w]+|\s+|\w+)/g;
        const tokens = line.match(tokenRegex) || [line];

        return (
          <div key={lineIdx} className="table-row">
            <span className="table-cell select-none pr-4 text-right text-slate-600 font-mono text-xs w-8">
              {lineIdx + 1}
            </span>
            <span className="table-cell font-mono text-xs whitespace-pre">
              {tokens.map((token, tokenIdx) => {
                if (/^["'].*["']$/.test(token)) {
                  return (
                    <span key={tokenIdx} className="text-emerald-400 font-semibold">
                      {token}
                    </span>
                  );
                }
                if (
                  /^(?:FROM|WORKDIR|RUN|COPY|USER|EXPOSE|ENTRYPOINT|CMD|ENV|ARG|AS|SELECT|INSERT|UPDATE|DELETE|JOIN|WHERE|CREATE|INDEX|TABLE|def|class|import|from|return|async|await|with|try|except|for|in|if|else|elif|const|let|var|function|git|docker|npm)$/.test(
                    token
                  )
                ) {
                  return (
                    <span key={tokenIdx} className="text-cyan-300 font-bold">
                      {token}
                    </span>
                  );
                }
                if (/^\d+$/.test(token)) {
                  return (
                    <span key={tokenIdx} className="text-amber-400">
                      {token}
                    </span>
                  );
                }
                if (/^[{}()[\].,;:]+$/.test(token)) {
                  return (
                    <span key={tokenIdx} className="text-slate-400">
                      {token}
                    </span>
                  );
                }
                return (
                  <span key={tokenIdx} className="text-slate-200">
                    {token}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* Blueprint Slide-Over Drawer */
const BlueprintDrawer = ({ skill, isOpen, onClose }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedBullet, setCopiedBullet] = useState(false);

  useEffect(() => {
    if (!skill || !isOpen) return;

    let active = true;
    const fetchBlueprint = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSkillBlueprint(skill);
        if (active) setBlueprint(data);
      } catch {
        if (active) setError(`No curated 48-hour blueprint available for '${skill}' yet.`);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBlueprint();
    return () => {
      active = false;
    };
  }, [skill, isOpen]);

  const copySnippet = () => {
    if (blueprint?.starter_snippet) {
      navigator.clipboard.writeText(blueprint.starter_snippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const copyBullet = () => {
    if (blueprint?.suggested_bullet) {
      navigator.clipboard.writeText(blueprint.suggested_bullet);
      setCopiedBullet(true);
      setTimeout(() => setCopiedBullet(false), 2000);
    }
  };

  return (
    <StudioMotionDrawer
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`48-Hour Sprint Blueprint: ${skill || ''}`}
      description="Executable reference architecture, required file manifest, and quantified STAR bullet."
    >
      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
            <p className="font-mono text-xs text-slate-400">Loading blueprint manifest...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-300">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Curated Blueprint Notice</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-200">{error}</p>
        </div>
      ) : blueprint ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#171F2C] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StudioBadge variant="cyan" size="sm">
                48-Hour Implementation Target
              </StudioBadge>
              <span className="font-mono text-xs text-slate-400">
                {blueprint.required_files?.length || 0} Required Manifest Files
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold text-slate-100">{blueprint.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{blueprint.summary}</p>
          </div>

          {/* Required Repository Files Manifest */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#0F141C] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Required Repository Files Manifest
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              The automated repository inspector verifies these exact files to validate proof of implementation:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {blueprint.required_files.map((file) => (
                <span
                  key={file}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#05070A] px-3 py-1.5 font-mono text-xs text-slate-200 shadow-xs"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{file}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Sequential Implementation Steps */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#0F141C] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Sequential Implementation Roadmap
              </h4>
            </div>
            <ol className="space-y-2.5 pt-1">
              {blueprint.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-[#1F2937]/70 bg-[#171F2C]/50 p-3 text-xs leading-relaxed text-slate-200"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-lg bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Starter Code Snippet with Syntax Highlighting */}
          {blueprint.starter_snippet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  Reference Architecture Starter Snippet
                </span>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Snippet
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Code Box */}
              <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#05070A] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#1F2937] bg-[#0A0E14] px-4 py-2 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-slate-400">starter-template</span>
                  </div>
                  <span className="text-[10px] text-slate-500">UTF-8</span>
                </div>
                <div className="max-h-72 overflow-x-auto p-4">
                  <SyntaxHighlightedCode code={blueprint.starter_snippet} />
                </div>
              </div>
            </div>
          )}

          {/* Quantified STAR Resume Bullet */}
          {blueprint.suggested_bullet && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Quantified STAR Resume Bullet (Pre-Calibrated)
                </span>
                <button
                  type="button"
                  onClick={copyBullet}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
                >
                  {copiedBullet ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-300" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-emerald-400" /> Copy Bullet
                    </>
                  )}
                </button>
              </div>
              <p className="rounded-xl border border-emerald-500/20 bg-[#05070A]/70 p-3 font-mono text-xs leading-relaxed text-emerald-100">
                {blueprint.suggested_bullet}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </StudioMotionDrawer>
  );
};

/* Terminal Simulator for GitHub Repo Verification */
const RepoVerificationTerminal = ({
  priority,
  verifying,
  repoUrl,
  verifyResult,
  onCopyBullet,
  copiedBullet,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#05070A] shadow-xl text-left">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[#1F2937] bg-[#0A0E14] px-3.5 py-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-500/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <span className="ml-1.5 text-slate-400">
            bash &mdash; proof-verifier:~/evidence/{priority.skill.toLowerCase()}
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-bold">git-ast-scan</span>
      </div>

      {/* Terminal Output */}
      <div className="p-3.5 font-mono text-xs space-y-2 leading-relaxed">
        <div className="text-slate-400">
          <span className="text-emerald-400">$</span> git verify-repo --target={repoUrl || 'https://github.com/...'} --skill={priority.skill}
        </div>

        {verifying && (
          <div className="space-y-1.5 pt-1 text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>[1/4] Cloning public repository manifest &amp; directory tree...</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">&gt;</span>
              <span>[2/4] Parsing AST signatures and dependencies...</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">&gt;</span>
              <span>[3/4] Cross-referencing against 48-hour blueprint artifacts...</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">&gt;</span>
              <span>[4/4] Synthesizing truth-guarded STAR bullet metrics...</span>
            </div>
          </div>
        )}

        {verifyResult && !verifying && (
          <div className="space-y-2 pt-1">
            {verifyResult.verified ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>[SUCCESS] Authentic repository verified with high confidence!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>[INCOMPLETE] Repository check flagged missing blueprint artifacts:</span>
              </div>
            )}

            <ul className="space-y-1 pl-4 text-[11px] text-slate-300 list-disc">
              {verifyResult.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {verifyResult.generated_bullet && (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    STAR Resume Bullet Formulated
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopyBullet(verifyResult.generated_bullet, priority.id)}
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
                  >
                    {copiedBullet === priority.id ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-300" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5 text-emerald-400" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-100 font-mono">
                  {verifyResult.generated_bullet}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* Quick Workbench for Skills passed from URL params but not in top 3 priorities */
const QuickSkillWorkbench = ({ skill, onOpenBlueprint }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchQuick = async () => {
      try {
        const data = await getSkillBlueprint(skill);
        if (active) setBlueprint(data);
      } catch {
        // blueprint optional
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchQuick();
    return () => {
      active = false;
    };
  }, [skill]);

  return (
    <StudioCard
      variant="elevated"
      glow="cyan"
      className="p-5 border-cyan-500/40 bg-gradient-to-br from-[#171F2C] to-[#0F141C]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Targeted Sprint Skill
              </span>
              <StudioBadge variant="cyan" size="xs">
                Autopsy Recovery
              </StudioBadge>
            </div>
            <h3 className="text-lg font-bold text-slate-100">{skill}</h3>
          </div>
        </div>

        <StudioButton
          variant="primary"
          size="sm"
          icon={Code2}
          onClick={() => onOpenBlueprint(skill)}
        >
          Open 48h Blueprint Workbench
        </StudioButton>
      </div>

      {blueprint && !loading && (
        <div className="mt-4 pt-3 border-t border-[#1F2937] text-xs text-slate-300">
          <p className="font-semibold text-slate-200">{blueprint.title}</p>
          <p className="mt-1 text-slate-400">{blueprint.summary}</p>
        </div>
      )}
    </StudioCard>
  );
};

/* MAIN GROWTH WORKBENCH COMPONENT */
const Growth = () => {
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState({ priorities: [], evidence_source_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionDrafts, setCompletionDrafts] = useState({});
  const [completingId, setCompletingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [activeBlueprintSkill, setActiveBlueprintSkill] = useState(null);
  const [highlightedSkill, setHighlightedSkill] = useState('');
  const [copiedBulletId, setCopiedBulletId] = useState(null);

  const priorityRefs = useRef({});

  const shouldReduceMotion = useReducedMotion();

  // Handle URL skill query parameter: ?skill=...
  useEffect(() => {
    const skillParam = searchParams.get('skill');
    if (skillParam) {
      setHighlightedSkill(skillParam);
    }
  }, [searchParams]);

  // Load growth plan from API
  useEffect(() => {
    let active = true;

    const loadGrowthPlan = async () => {
      setLoading(true);
      try {
        const data = await getGrowthPlan();
        if (active) setPlan(data);
      } catch {
        if (active) setError('Your evidence-based growth plan could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGrowthPlan();
    return () => {
      active = false;
    };
  }, []);

  // Auto-scroll to matching skill card when priorities are loaded or URL changes
  useEffect(() => {
    if (!highlightedSkill || plan.priorities.length === 0) return;

    const matchingPriority = plan.priorities.find(
      (p) => p.skill.toLowerCase() === highlightedSkill.toLowerCase()
    );

    if (matchingPriority) {
      const targetElement = priorityRefs.current[matchingPriority.id];
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightedSkill, plan.priorities, shouldReduceMotion]);

  const updateCompletionDraft = (priorityId, field, value) => {
    setCompletionDrafts((current) => ({
      ...current,
      [priorityId]: {
        evidenceUrl: '',
        externalConfirmation: false,
        ...current[priorityId],
        [field]: value,
      },
    }));
  };

  const handleVerifyRepo = async (priority) => {
    const draft = completionDrafts[priority.id] || { evidenceUrl: '' };
    const url = draft.evidenceUrl.trim();
    if (!url) {
      setError('Enter a public GitHub repository URL before verifying.');
      return;
    }

    setVerifyingId(priority.id);
    setError('');
    try {
      const result = await verifyGitHubRepo(url, priority.skill);
      setVerificationResults((current) => ({
        ...current,
        [priority.id]: result,
      }));
    } catch (verifyErr) {
      setError(verifyErr.response?.data?.detail || 'GitHub repo inspection failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const finishPriority = async (priority) => {
    const draft = completionDrafts[priority.id] || {
      evidenceUrl: '',
      externalConfirmation: false,
    };
    setCompletingId(priority.id);
    setError('');
    try {
      const completed = await completeGrowthPriority(priority.id, {
        evidence_url: draft.evidenceUrl.trim() || null,
        external_confirmation: draft.externalConfirmation,
      });
      setPlan((current) => ({
        ...current,
        priorities: current.priorities.map((item) =>
          item.id === completed.id ? completed : item
        ),
      }));
    } catch (completionError) {
      setError(completionError.response?.data?.detail || 'This priority could not be completed.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleCopyBullet = (bulletText, id) => {
    navigator.clipboard.writeText(bulletText);
    setCopiedBulletId(id);
    setTimeout(() => setCopiedBulletId(null), 2000);
  };

  // Progress telemetry calculations
  const totalPriorities = plan.priorities.length;
  const completedPriorities = plan.priorities.filter((p) => p.status === 'completed').length;
  const progressPercent = totalPriorities > 0 ? Math.round((completedPriorities / totalPriorities) * 100) : 0;
  const githubVerifiedCount = plan.priorities.filter(
    (p) => p.status === 'completed' && p.completion_source === 'github_verified'
  ).length;

  const isHighlightedSkillInPriorities =
    highlightedSkill &&
    plan.priorities.some((p) => p.skill.toLowerCase() === highlightedSkill.toLowerCase());

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="font-mono text-xs text-slate-400">
            Synthesizing 48-Hour Growth Workbench...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Blueprint Drawer */}
      <BlueprintDrawer
        skill={activeBlueprintSkill}
        isOpen={Boolean(activeBlueprintSkill)}
        onClose={() => setActiveBlueprintSkill(null)}
      />

      {/* Header & Mission Telemetry */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <StudioBadge variant="cyan" size="sm">
                48-Hour Engineering Workbench
              </StudioBadge>
              <span className="font-mono text-xs text-slate-400">
                Evidence-Led Candidate Development
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-100 sm:text-4xl">
              Growth Blueprint Studio
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
              Build unshakeable evidence for recurring requirements from jobs you genuinely
              targeted. Close technical qualifications with executable 48-hour blueprints and
              automated GitHub repo inspection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/profile/tailor">
              <StudioButton variant="secondary" size="sm" icon={Sparkles}>
                Resume Studio
              </StudioButton>
            </Link>
            <Link to="/search-jobs">
              <StudioButton variant="glass" size="sm" icon={ArrowRight}>
                Job Search
              </StudioButton>
            </Link>
          </div>
        </div>

        {/* Studio Telemetry & Verification Progress Meters */}
        {totalPriorities > 0 && (
          <StudioCard
            variant="elevated"
            className="p-5 border-[#1F2937] bg-gradient-to-r from-[#0F141C] via-[#171F2C] to-[#0F141C]"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center">
              {/* Meter 1: Overall Verification Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase tracking-wider">Blueprint Completion</span>
                  <span className="font-bold text-cyan-400">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#05070A] border border-[#1F2937]">
                  <MotionDiv
                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={
                      shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }
                    }
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {completedPriorities} of {totalPriorities} priorities verified
                </p>
              </div>

              {/* Meter 2: GitHub Verified Count */}
              <div className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    GitHub Proof
                  </span>
                  <Github className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <p className="text-lg font-black font-mono text-slate-100">
                  {githubVerifiedCount} <span className="text-xs font-normal text-slate-500">repos</span>
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">AST &amp; commit verified</p>
              </div>

              {/* Meter 3: Sprint Cadence */}
              <div className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Sprint Pace
                  </span>
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-lg font-black font-mono text-slate-100">48-Hour</p>
                <p className="text-[10px] text-amber-400 font-mono">Target pace per skill</p>
              </div>

              {/* Meter 4: Evidence Source Telemetry */}
              <div className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Data Foundation
                  </span>
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <p className="text-lg font-black font-mono text-slate-100">
                  {plan.evidence_source_count}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Saved resume {plan.evidence_source_count === 1 ? 'analysis' : 'analyses'}
                </p>
              </div>
            </div>
          </StudioCard>
        )}
      </header>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto font-mono text-xs text-rose-400 hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Workbench for URL parameter skill when not in top 3 priorities */}
      {highlightedSkill && !isHighlightedSkillInPriorities && (
        <QuickSkillWorkbench
          skill={highlightedSkill}
          onOpenBlueprint={(skill) => setActiveBlueprintSkill(skill)}
        />
      )}

      {/* Main Priorities List */}
      {plan.priorities.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Prioritized Skill Blueprints ({plan.priorities.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Ordered by market occurrence frequency
            </span>
          </div>

          <div className="space-y-5">
            {plan.priorities.map((priority, index) => {
              const verifyResult = verificationResults[priority.id];
              const isVerifying = verifyingId === priority.id;
              const isCompleting = completingId === priority.id;
              const draft = completionDrafts[priority.id] || {
                evidenceUrl: '',
                externalConfirmation: false,
              };
              const isAnchorMatch =
                highlightedSkill &&
                priority.skill.toLowerCase() === highlightedSkill.toLowerCase();

              return (
                <div
                  key={priority.id || priority.skill}
                  id={`skill-${encodeURIComponent(priority.skill.toLowerCase())}`}
                  ref={(el) => {
                    priorityRefs.current[priority.id] = el;
                  }}
                  className={cn(
                    'transition-all duration-300 rounded-2xl',
                    isAnchorMatch && 'ring-2 ring-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
                  )}
                >
                  <StudioCard
                    variant="default"
                    className="p-6 border-[#1F2937] bg-[#0F141C] space-y-6"
                  >
                    {/* Priority Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1F2937] pb-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StudioBadge
                            variant={priority.status === 'completed' ? 'emerald' : 'cyan'}
                            size="xs"
                          >
                            Priority {index + 1}
                          </StudioBadge>
                          <span className="font-mono text-xs text-slate-400">
                            Seen in {priority.job_count} target job {priority.job_count === 1 ? 'gap' : 'gaps'}
                          </span>
                          {isAnchorMatch && (
                            <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                              Focused Anchor
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-slate-100">{priority.skill}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <StudioButton
                          variant="secondary"
                          size="sm"
                          icon={Code2}
                          onClick={() => setActiveBlueprintSkill(priority.skill)}
                        >
                          View 48h Blueprint
                        </StudioButton>
                      </div>
                    </div>

                    {/* Next Action & Completion Rule */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 space-y-1.5">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                          Prescribed Next Action
                        </p>
                        <p className="text-xs leading-relaxed text-slate-200">
                          {priority.next_action}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 space-y-1.5">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Verification Standard
                        </p>
                        <p className="text-xs leading-relaxed text-slate-300">
                          {priority.completion_rule}
                        </p>
                      </div>
                    </div>

                    {/* Verification Deck: Completed vs Actionable Form */}
                    {priority.status === 'completed' ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Completed with{' '}
                            {priority.completion_source === 'github_verified'
                              ? 'Verified GitHub Repository'
                              : priority.completion_source === 'evidence_link'
                              ? 'Linked Production Evidence'
                              : 'Candidate External Confirmation'}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                            Verified Candidate Evidence
                          </span>
                        </div>

                        {priority.evidence_url && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs font-mono text-slate-400">Proof Link:</span>
                            <a
                              href={priority.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-mono text-cyan-300 hover:text-cyan-200 hover:underline truncate"
                            >
                              <span>{priority.evidence_url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Active Evidence Submission & Inspection Deck */
                      <div className="space-y-4 rounded-xl border border-[#1F2937] bg-[#171F2C]/60 p-4.5">
                        <div className="space-y-2">
                          <label
                            htmlFor={`repo-url-${priority.id}`}
                            className="block text-xs font-mono font-bold text-slate-300"
                          >
                            GitHub Repository Evidence URL
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <input
                                id={`repo-url-${priority.id}`}
                                type="url"
                                value={draft.evidenceUrl}
                                onChange={(e) =>
                                  updateCompletionDraft(priority.id, 'evidenceUrl', e.target.value)
                                }
                                placeholder="https://github.com/username/project-repo"
                                className="w-full rounded-xl border border-[#1F2937] bg-[#05070A] px-3.5 py-2.5 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                              />
                            </div>
                            <StudioButton
                              variant="secondary"
                              size="sm"
                              icon={Github}
                              loading={isVerifying}
                              disabled={isVerifying}
                              onClick={() => handleVerifyRepo(priority)}
                              className="shrink-0"
                            >
                              Inspect Repo
                            </StudioButton>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Our AST engine inspects repository file structure, commits, and implementation evidence without inventing claims.
                          </p>
                        </div>

                        {/* Animated GitHub Repo Inspector Console */}
                        {(isVerifying || verifyResult) && (
                          <RepoVerificationTerminal
                            priority={priority}
                            verifying={isVerifying}
                            repoUrl={draft.evidenceUrl}
                            verifyResult={verifyResult}
                            onCopyBullet={handleCopyBullet}
                            copiedBullet={copiedBulletId}
                          />
                        )}

                        {/* External Confirmation Checkbox */}
                        <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={draft.externalConfirmation}
                            onChange={(e) =>
                              updateCompletionDraft(
                                priority.id,
                                'externalConfirmation',
                                e.target.checked
                              )
                            }
                            className="mt-0.5 rounded border-[#1F2937] bg-[#05070A] text-cyan-500 focus:ring-cyan-500/40"
                          />
                          <span className="leading-snug">
                            I completed this architecture outside CareerPilot and am prepared to defend the technical implementation during an engineering loop.
                          </span>
                        </label>

                        {/* Mark Complete Action Button */}
                        <div className="flex justify-end pt-1">
                          <StudioButton
                            variant="primary"
                            size="sm"
                            loading={isCompleting}
                            disabled={isCompleting || (!draft.evidenceUrl.trim() && !draft.externalConfirmation)}
                            onClick={() => finishPriority(priority)}
                            icon={Check}
                          >
                            Mark Complete with Evidence
                          </StudioButton>
                        </div>
                      </div>
                    )}
                  </StudioCard>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <StudioCard
          variant="default"
          className="p-12 text-center border-dashed border-[#1F2937] bg-[#0F141C] space-y-4"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <BookOpenCheck className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-100">
              Your Growth Workbench Needs Job Evidence
            </h3>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-400">
              Analyze job descriptions with Resume Studio or discover opportunities in Job Search.
              Recurring skill gaps from targeted positions will automatically generate actionable 48-hour blueprints here.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link to="/profile/tailor">
              <StudioButton variant="primary" size="md" icon={Sparkles}>
                Open Resume Studio
              </StudioButton>
            </Link>
            <Link to="/search-jobs">
              <StudioButton variant="secondary" size="md" icon={ArrowRight}>
                Explore Live Tech Roles
              </StudioButton>
            </Link>
          </div>
        </StudioCard>
      )}
    </div>
  );
};

export default Growth;
