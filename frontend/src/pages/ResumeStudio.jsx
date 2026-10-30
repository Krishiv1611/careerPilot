import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Check,
  Download,
  Eye,
  FileClock,
  Github,
  Loader2,
  Send,
  Sparkles,
  TriangleAlert,
  X,
  Code,
  Split,
  FileText,
  Play,
  Pause,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

import {
  analyzeResumeForJob,
  approveGitHubEvidence,
  connectGitHub,
  disconnectGitHub,
  downloadResumeVersion,
  findGitHubEvidence,
  getAllJobs,
  getAllResumes,
  getGitHubRepositories,
  getGitHubStatus,
  getResumeVersions,
  promptResumeVersion,
  reviewResumeVersion,
  scoreResumeLive,
  enhanceBullet,
  exportPdfDirect,
  getRecruiterXRay,
} from '../services/api';
import { buildReviewPayload, reviewProgress } from '../app/resume-proposals';
import { buildEvidenceApprovalPayload, initialEvidenceDraft } from '../app/github-evidence';
import {
  StudioCard,
  StudioBadge,
  StudioButton,
} from '../components/studio/StudioPrimitives';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const FLUFF_CATALOG = {
  hardworking: "Replace with evidence of sustained output (e.g. 'Delivered 14 features across 3 sprint cycles')",
  passionate: "Replace with tangible project contributions or open-source commits",
  'self-starter': "Replace with autonomous initiative (e.g. 'Spearheaded migration to Docker')",
  'team player': "Replace with collaboration metrics (e.g. 'Partnered with 4 engineers in agile sprint')",
  'detail-oriented': "Replace with quality metrics (e.g. 'Achieved 98% test coverage with zero regressions')",
  'quick learner': "Replace with rapid execution (e.g. 'Mastered Go in 2 weeks to ship payment gateway')",
  'results-driven': "Replace with specific revenue, latency, or throughput metrics",
  enthusiastic: "Replace with documented domain achievements",
  'go-getter': "Replace with proactive architectural contributions",
};

const STAR_WORD_REPLACEMENTS = {
  hardworking: 'high-impact',
  passionate: 'project-focused',
  'self-starter': 'autonomous contributor',
  'team player': 'cross-functional collaborator',
  'detail-oriented': 'quality-driven',
  'quick learner': 'rapidly adaptable',
  'results-driven': 'metrics-driven',
  enthusiastic: 'domain-focused',
  'go-getter': 'proactive problem-solver',
};

const autoRemediateFluffText = (text, xrayData) => {
  let updated = text || '';
  const detected = xrayData?.fluff_words_detected || [];

  if (xrayData?.remediated_text_preview && detected.length > 0) {
    return xrayData.remediated_text_preview;
  }

  const catalog = { ...STAR_WORD_REPLACEMENTS };
  for (const item of detected) {
    if (item.word && item.star_alternative) {
      catalog[item.word.toLowerCase()] = item.star_alternative;
    }
  }

  const sortedWords = Object.keys(catalog).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    const rep = catalog[word];
    const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    updated = updated.replace(regex, (match) => {
      if (match === match.toUpperCase()) return rep.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return rep.charAt(0).toUpperCase() + rep.slice(1);
      return rep;
    });
  }
  return updated;
};

const renderFluffAnnotatedText = (text, fluffCatalog = FLUFF_CATALOG) => {
  if (!text) return ' ';
  const words = Object.keys(fluffCatalog);
  if (words.length === 0) return text;

  const sorted = [...words].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${sorted.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'gi');

  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const matched = match[0];
    const key = matched.toLowerCase();
    const replacement = fluffCatalog[key] || 'Replace with concrete quantifiable STAR achievement';
    const starAlt = STAR_WORD_REPLACEMENTS[key] || 'high-impact';

    parts.push(
      <span
        key={`fluff-${match.index}`}
        className="group relative inline-block rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 px-1.5 py-0.5 font-semibold underline decoration-amber-400 decoration-2 underline-offset-2 transition hover:bg-amber-400/30 cursor-help"
      >
        {matched}
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-80 rounded-xl border border-[#283548] bg-[#0F141C] p-3 text-left text-xs font-normal text-slate-200 shadow-2xl group-hover:block z-50">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <TriangleAlert className="h-4 w-4 text-amber-400 shrink-0" />
            Fluff Word Detected: "{matched}"
          </span>
          <span className="mt-1.5 block text-slate-300 leading-relaxed text-xs">{replacement}</span>
          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
            STAR Swap: "{starAlt}"
          </span>
        </span>
      </span>
    );
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
};

const parseResumeForHotspots = (content) => {
  const lines = (content || '').split('\n');
  const headerLines = [];
  const skillsLines = [];
  const topBulletLines = [];
  const otherLines = [];

  let inHeader = true;
  let inSkills = false;
  let bulletsFound = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (inHeader && headerLines.length > 0) {
        inHeader = false;
      }
      otherLines.push({ text: rawLine, isBlank: true, index: i });
      continue;
    }

    const isHeading =
      /^(EDUCATION|EXPERIENCE|WORK EXPERIENCE|PROJECTS|TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|SUMMARY|PROFILE)\b/i.test(trimmed) ||
      (trimmed.length <= 32 && /^[A-Z\s/&-]+$/.test(trimmed) && !trimmed.includes('.'));

    if (isHeading) {
      inHeader = false;
      if (/SKILL|COMPETENC|TECHNOLOG|STACK/i.test(trimmed)) {
        inSkills = true;
      } else {
        inSkills = false;
      }
      otherLines.push({ text: rawLine, isHeading: true, index: i });
      continue;
    }

    if (inHeader) {
      if (headerLines.length < 3) {
        headerLines.push({ text: rawLine, index: i });
        continue;
      } else {
        inHeader = false;
      }
    }

    if (inSkills) {
      skillsLines.push({ text: rawLine, index: i });
      continue;
    }

    if (!inSkills && skillsLines.length === 0 && /^technical skills?:/i.test(trimmed)) {
      skillsLines.push({ text: rawLine, index: i });
      continue;
    }

    const isBullet = /^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    if (isBullet && bulletsFound < 2) {
      topBulletLines.push({ text: rawLine, index: i });
      bulletsFound++;
      continue;
    }

    otherLines.push({ text: rawLine, index: i });
  }

  if (headerLines.length === 0 && lines.length > 0) {
    const firstNonEmpty = lines.find((l) => l.trim().length > 0);
    if (firstNonEmpty) {
      headerLines.push({ text: firstNonEmpty, index: 0 });
    }
  }

  if (skillsLines.length === 0) {
    const skillCandidate = lines.find((l) => /python|fastapi|docker|react|sql|aws|postgresql|redis/i.test(l) && !topBulletLines.some((b) => b.text === l));
    if (skillCandidate) {
      skillsLines.push({ text: skillCandidate, index: -1 });
    }
  }

  if (topBulletLines.length === 0) {
    const bulletCandidates = otherLines.filter((l) => !l.isHeading && !l.isBlank && l.text.trim().length > 30);
    if (bulletCandidates.length > 0) {
      topBulletLines.push(bulletCandidates[0]);
      if (bulletCandidates.length > 1) {
        topBulletLines.push(bulletCandidates[1]);
      }
    }
  }

  return {
    headerLines,
    skillsLines,
    topBulletLines,
    otherLines,
  };
};

const computeDiffLines = (originalText, remediatedText) => {
  const origLines = (originalText || '').split('\n');
  const remLines = (remediatedText || '').split('\n');
  const maxLines = Math.max(origLines.length, remLines.length);
  const diff = [];

  for (let i = 0; i < maxLines; i++) {
    const orig = origLines[i] !== undefined ? origLines[i] : null;
    const rem = remLines[i] !== undefined ? remLines[i] : null;

    if (orig === rem) {
      diff.push({
        lineNumber: i + 1,
        type: 'unchanged',
        text: orig,
      });
    } else {
      if (orig !== null) {
        diff.push({
          lineNumber: i + 1,
          type: 'removed',
          text: orig,
        });
      }
      if (rem !== null) {
        diff.push({
          lineNumber: i + 1,
          type: 'added',
          text: rem,
        });
      }
    }
  }
  return diff;
};

const ScreenProbabilityDial = ({ score = 65 }) => {
  const shouldReduceMotion = useReducedMotion();
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const toneColor =
    score >= 75
      ? 'text-emerald-400'
      : score >= 50
        ? 'text-amber-400'
        : 'text-rose-400';

  const glowShadow =
    score >= 75
      ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      : score >= 50
        ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        : 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]';

  const badgeStyle =
    score >= 75
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      : score >= 50
        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-300 border-rose-500/30';

  return (
    <div className="flex items-center gap-3.5 bg-[#0F141C] border border-[#1F2937] rounded-xl px-4 py-3">
      <div className="relative flex h-18 w-18 shrink-0 items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90 transform">
          <circle
            stroke="#1F2937"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={cn(toneColor, glowShadow, !shouldReduceMotion && 'transition-all duration-700 ease-out')}
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-base font-black text-white">{score}%</span>
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Callback</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={cn('inline-block rounded-md border px-2 py-0.5 text-xs font-bold', badgeStyle)}>
            {score >= 75 ? 'Likely Callback' : score >= 50 ? 'Borderline Screen' : 'Disqualification Risk'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Simulated 6s initial glance pass probability</p>
      </div>
    </div>
  );
};

const HiringManagerVerdictBanner = ({ xrayData }) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedPersona, setSelectedPersona] = useState('screener');
  const score = xrayData?.screen_probability ?? 65;
  const greenFlags = xrayData?.instant_green_flags || [];
  const redFlags = xrayData?.instant_red_flags || [];

  const personas = {
    screener: {
      id: 'screener',
      label: '⏱️ Screener (6s)',
      title: 'Recruiter Screener 6-Second Verdict',
      badge: 'Initial 6s Gatekeeper',
      subtitle: 'Keyword frequency, bullet scan velocity, and ATS parseability',
      verdict:
        xrayData?.reviewer_personas?.screener_verdict ||
        (score >= 75
          ? `PASSED (Instant Callback): Rapid 6-second keyword scan identified ${greenFlags.length} high-priority stack matches. Bullet structure enables clean glance velocity with minimal fluff.`
          : score >= 50
            ? `BORDERLINE (Manual Review Needed): Found ${greenFlags.length} keyword matches, but buzzwords or formatting friction could trigger a quick rejection in high-volume queues.`
            : `DISQUALIFY / PASS OVER: Low instant keyword density (${greenFlags.length} matches) and high buzzword clutter. Fails initial 6-second recruiter ATS glance.`),
    },
    hiring_manager: {
      id: 'hiring_manager',
      label: '💼 Hiring Manager',
      title: 'Hiring Manager 6-Second Verdict',
      badge: 'Team Lead & Role Impact',
      subtitle: 'Role impact, production ownership, and quantifiable outcomes',
      verdict:
        xrayData?.reviewer_personas?.hiring_manager_verdict ||
        xrayData?.hiring_manager_verdict ||
        'Scanning resume for 6-second role impact, production ownership, and team execution signals...',
    },
    tech_lead: {
      id: 'tech_lead',
      label: '💻 Tech Lead',
      title: 'Tech Lead 6-Second Verdict',
      badge: 'Systems Depth & Rigor',
      subtitle: 'Code depth, systems architectural skepticism, and scale metrics',
      verdict:
        xrayData?.reviewer_personas?.tech_lead_verdict ||
        (greenFlags.length >= 2
          ? `STRONG TECHNICAL RIGOR: Quantified engineering claims and production stack depth (${greenFlags.slice(0, 3).join(', ')}). Demonstrates systems thinking beyond classroom exercises.`
          : `INSUFFICIENT DEPTH: Lacks engineering metrics, system scale indicators, or architectural evidence. High skepticism of production readiness.`),
    },
  };

  const personaTabs = [
    personas.screener,
    personas.hiring_manager,
    personas.tech_lead,
  ];

  const activePersona = personas[selectedPersona] || personas.screener;

  return (
    <StudioCard variant="default" className="p-5">
      {/* 3-Reviewer Persona verdict tabs with layoutId="persona-tab-pill" */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-4">
        <div className="flex items-center gap-2">
          <StudioBadge variant="cyan" pulse size="sm">
            Reviewer Persona Lens
          </StudioBadge>
          <span className="text-xs font-semibold text-slate-400">
            Nielsen Norman 6s Decision Deck
          </span>
        </div>

        <div
          role="tablist"
          className="inline-flex items-center gap-1 rounded-2xl bg-[#080B0F] p-1 border border-[#1F2937]"
        >
          {personaTabs.map((tab) => {
            const isActive = selectedPersona === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedPersona(tab.id)}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors outline-none select-none flex items-center gap-2 cursor-pointer',
                  isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {isActive && (
                  <MotionDiv
                    layoutId="persona-tab-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 380, damping: 28 }
                    }
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center border-b border-[#1F2937] pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white">{activePersona.title}</h2>
            <span className="rounded-full bg-[#171F2C] border border-[#283548] px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
              {activePersona.badge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{activePersona.subtitle}</p>
          <div className="mt-3 rounded-xl border border-[#283548] bg-[#0A0E14] p-3.5 text-xs leading-relaxed text-slate-200 font-mono">
            {activePersona.verdict}
          </div>
        </div>
        <ScreenProbabilityDial score={score} />
      </div>

      {/* Two-Column Instant Signals */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Instant Green Flags (Glance Winners)
            </span>
            <span className="text-[11px] font-semibold text-emerald-400/80">{greenFlags.length} detected</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {greenFlags.map((flag) => (
              <span
                key={flag}
                className="inline-flex items-center gap-1 rounded-md bg-[#0F141C] border border-emerald-500/40 px-2 py-1 text-xs font-bold text-emerald-300 shadow-2xs"
              >
                <Check className="h-3 w-3 text-emerald-400" />
                {flag}
              </span>
            ))}
            {greenFlags.length === 0 && (
              <p className="text-xs text-slate-400">No high-value tech keywords detected in instant glance.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.05] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5" /> Instant Red Flags (6-Sec Disqualifiers)
            </span>
            <span className="text-[11px] font-semibold text-rose-400/80">{redFlags.length} detected</span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {redFlags.map((flag, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 rounded-md bg-[#0F141C] border border-rose-500/40 px-2.5 py-1 text-xs text-rose-300 shadow-2xs"
              >
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
            {redFlags.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                No immediate 6-second disqualifiers detected.
              </p>
            )}
          </div>
        </div>
      </div>
    </StudioCard>
  );
};

const RecruiterXRayHeatmap = ({
  content,
  xrayData,
  onAutoRemediate,
  remediatedPulse,
  onOpenDiffPreview,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const [activeZoneFilter, setActiveZoneFilter] = useState('all'); // 'all' | 'header' | 'bullets' | 'skills'

  const hotspots = useMemo(() => parseResumeForHotspots(content), [content]);
  const fluffWords = xrayData?.fluff_words_detected;
  const fluffCatalog = useMemo(() => {
    const cat = { ...FLUFF_CATALOG };
    for (const item of (fluffWords || [])) {
      if (item.word && item.replacement) {
        cat[item.word.toLowerCase()] = item.replacement;
      }
    }
    return cat;
  }, [fluffWords]);

  return (
    <div className="space-y-4">
      {/* Simulation Controls & Legend */}
      <StudioCard variant="default" className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 px-2.5 py-1 text-xs font-black text-slate-950 shadow-sm">
              <Eye className="h-3.5 w-3.5" />
              Nielsen Norman F-Pattern Heatmap
            </span>
            <span className="text-xs text-slate-300 font-medium">
              6-Second Ocular Trajectory Simulation
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHeatmapEnabled((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer select-none',
                heatmapEnabled
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'border-[#283548] bg-[#171F2C] text-slate-400'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', heatmapEnabled ? 'bg-rose-400 animate-pulse' : 'bg-slate-500')} />
              Heatmap: {heatmapEnabled ? 'Active' : 'Off'}
            </button>

            <button
              type="button"
              onClick={() => setIsScanning((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer select-none',
                isScanning
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-[#283548] bg-[#171F2C] text-slate-400'
              )}
            >
              {isScanning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              Scan Beam: {isScanning ? 'Running' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Hotspots Intensity Timeline Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveZoneFilter(activeZoneFilter === 'header' ? 'all' : 'header')}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold transition cursor-pointer',
                activeZoneFilter === 'header'
                  ? 'border-rose-400 bg-rose-500/20 text-rose-300 ring-1 ring-rose-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              )}
            >
              🔴 100% Gaze (Sec 0-1) Header Bar
            </button>
            <button
              type="button"
              onClick={() => setActiveZoneFilter(activeZoneFilter === 'bullets' ? 'all' : 'bullets')}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold transition cursor-pointer',
                activeZoneFilter === 'bullets'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              )}
            >
              🟠 75% Gaze (Sec 2-4) Top 2 Bullets
            </button>
            <button
              type="button"
              onClick={() => setActiveZoneFilter(activeZoneFilter === 'skills' ? 'all' : 'skills')}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold transition cursor-pointer',
                activeZoneFilter === 'skills'
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400'
                  : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
              )}
            >
              🟡 50% Gaze (Sec 5-6) Skills Stem
            </button>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 font-medium text-slate-400">
              🔵 &lt;15% Gaze Cold Drop-off
            </span>
          </div>

          {activeZoneFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveZoneFilter('all')}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </StudioCard>

      {/* Heatmap Inspection Deck with Animated Scan Line */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0A0E14] p-4 sm:p-6 font-mono text-xs sm:text-sm leading-6 text-slate-200 space-y-4">
        {/* Animated Scan Line Sweep */}
        {heatmapEnabled && isScanning && !shouldReduceMotion && (
          <MotionDiv
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.9)] z-30"
            animate={{
              top: ['0%', '98%', '0%'],
            }}
            transition={{
              duration: 6,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        )}

        {/* Hotspot 1: Header (100% Gaze Intensity) */}
        {(activeZoneFilter === 'all' || activeZoneFilter === 'header') && (
          <div
            className={cn(
              'relative rounded-xl border-2 p-4 transition-all duration-300',
              heatmapEnabled
                ? 'border-rose-500/60 border-l-8 border-l-rose-500 bg-gradient-to-r from-red-500/20 via-amber-500/10 to-transparent shadow-[0_0_20px_rgba(244,63,94,0.2)] ring-1 ring-rose-400/30'
                : 'border-slate-800 bg-[#0F141C]'
            )}
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between border-b border-rose-500/30 pb-2 font-sans gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-black text-rose-300 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                  🎯 Hotspot 1: Header & Target Title (Sec 0-1)
                </span>
                {heatmapEnabled && (
                  <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                    F-Top Bar: 100% Heat
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-rose-300">Instant Role Match Skim</span>
            </div>
            <div className="space-y-1">
              {hotspots.headerLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {renderFluffAnnotatedText(line.text, fluffCatalog)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotspot 3: Technical Skills Matrix (50% Gaze Intensity) */}
        {(activeZoneFilter === 'all' || activeZoneFilter === 'skills') && hotspots.skillsLines.length > 0 && (
          <div
            className={cn(
              'relative rounded-xl border-2 p-4 transition-all duration-300',
              heatmapEnabled
                ? 'border-cyan-500/60 border-l-8 border-l-cyan-500 bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/30'
                : 'border-slate-800 bg-[#0F141C]'
            )}
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between border-b border-cyan-500/30 pb-2 font-sans gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs font-black text-cyan-300 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  🛠️ Hotspot 3: Technical Skills Matrix (Sec 5-6)
                </span>
                {heatmapEnabled && (
                  <span className="rounded bg-cyan-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                    F-Scan: 50% Heat
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-cyan-300">Required Stack Verification</span>
            </div>
            <div className="space-y-1">
              {hotspots.skillsLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {renderFluffAnnotatedText(line.text, fluffCatalog)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotspot 2: Top 2 Work/Project Bullets (75% Gaze Intensity) */}
        {(activeZoneFilter === 'all' || activeZoneFilter === 'bullets') && hotspots.topBulletLines.length > 0 && (
          <div
            className={cn(
              'relative rounded-xl border-2 p-4 transition-all duration-300',
              heatmapEnabled
                ? 'border-amber-500/60 border-l-8 border-l-amber-500 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30'
                : 'border-slate-800 bg-[#0F141C]'
            )}
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between border-b border-amber-500/30 pb-2 font-sans gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  ⚡ Hotspot 2: Top 2 Work/Project Bullets (Sec 2-4)
                </span>
                {heatmapEnabled && (
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                    F-Mid Stem: 75% Heat
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-amber-300">Quantified Technical Impact</span>
            </div>
            <div className="space-y-1.5">
              {hotspots.topBulletLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {renderFluffAnnotatedText(line.text, fluffCatalog)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cold Drop-off Zone: Other Resume Sections */}
        {activeZoneFilter === 'all' && hotspots.otherLines.length > 0 && (
          <div className="space-y-1 pt-3 border-t border-[#1F2937]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                Additional Sections (Secondary Skim)
              </p>
              {heatmapEnabled && (
                <span className="rounded bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                  Cold Drop-off Zone (&lt;15% glance time in 6-sec skim)
                </span>
              )}
            </div>
            <div
              className={cn(
                'space-y-1 rounded-xl p-3',
                heatmapEnabled
                  ? 'border border-slate-800/80 bg-[#0B0F17]/70 opacity-75 text-slate-400'
                  : 'bg-[#0F141C] text-slate-300'
              )}
            >
              {hotspots.otherLines.map((line, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'whitespace-pre-wrap',
                    line.isHeading && 'font-sans font-bold text-slate-200 mt-3 pt-1 text-xs uppercase tracking-wider'
                  )}
                >
                  {line.isBlank ? ' ' : renderFluffAnnotatedText(line.text, fluffCatalog)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fluff Words Action Deck */}
      <FluffRemediationDeck
        xrayData={xrayData}
        onAutoRemediate={onAutoRemediate}
        remediatedPulse={remediatedPulse}
        onOpenDiffPreview={onOpenDiffPreview}
      />
    </div>
  );
};

const FluffRemediationDeck = ({
  xrayData,
  onAutoRemediate,
  remediatedPulse,
  onOpenDiffPreview,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const fluffWords = xrayData?.fluff_words_detected || [];

  return (
    <StudioCard variant="default" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-black text-amber-300 border border-amber-500/40">
            {fluffWords.length}
          </span>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
            Fluff Words Detected — Actionable STAR Replacements
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Auto-Remediate Fluff Button with spring physics and glowing emerald feedback */}
          <MotionButton
            type="button"
            onClick={onAutoRemediate}
            disabled={fluffWords.length === 0 && !xrayData?.remediated_text_preview}
            whileHover={!shouldReduceMotion ? { scale: 1.03 } : undefined}
            whileTap={!shouldReduceMotion ? { scale: 0.97 } : undefined}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 transition-all cursor-pointer shadow-lg select-none',
              remediatedPulse
                ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 hover:from-amber-300 hover:to-emerald-400 shadow-emerald-500/25',
              fluffWords.length === 0 && !xrayData?.remediated_text_preview && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            <Sparkles className={cn('h-4 w-4', remediatedPulse ? 'animate-spin' : '')} />
            <span>{remediatedPulse ? 'Remediated! Recalculating ATS Score...' : '⚡ Auto-Remediate Fluff'}</span>
            {fluffWords.length > 0 && !remediatedPulse && (
              <span className="rounded-full bg-slate-950/20 px-2 py-0.5 text-xs font-black text-slate-950">
                {fluffWords.length}
              </span>
            )}
          </MotionButton>

          {onOpenDiffPreview && (
            <button
              type="button"
              onClick={onOpenDiffPreview}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#283548] bg-[#171F2C] hover:bg-[#1F2937] px-3 py-2 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              <Code className="h-3.5 w-3.5 text-cyan-400" />
              Live Diff Preview
            </button>
          )}
        </div>
      </div>

      {fluffWords.length > 0 ? (
        <div className="mt-3 divide-y divide-[#1F2937]">
          {fluffWords.map((item, idx) => {
            const starAlt = item.star_alternative || STAR_WORD_REPLACEMENTS[item.word?.toLowerCase()] || 'high-impact';
            return (
              <div key={idx} className="py-3 first:pt-1 last:pb-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-xs font-bold">
                    "{item.word}"
                  </span>
                  <span className="text-xs text-slate-400 italic">in {item.context}</span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    STAR Swap: &rarr; "{starAlt}"
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 font-medium">
                  <span className="font-bold text-amber-400">Recruiter Rationale: </span>
                  {item.replacement}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3.5 text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-emerald-400" />
            Zero fluff buzzwords detected. Every word conveys technical authority and quantifiable impact!
          </span>
        </div>
      )}
    </StudioCard>
  );
};

const StudioCodeEditor = ({
  value,
  onChange,
  onEnhanceBullet,
  isEnhancing,
  enhanceFeedback,
  onPrompt,
  instruction,
  setInstruction,
  working,
  onAutoRemediate,
  fluffCount,
  remediatedPulse,
  onOpenDiffPreview,
  onDirectPdfDownload,
  isDownloadingPdf,
  isScoringLive,
}) => {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const lines = useMemo(() => (value || '').split('\n'), [value]);
  const lineCount = Math.max(1, lines.length);

  const stats = useMemo(() => {
    const raw = value || '';
    const words = raw.trim().split(/\s+/).filter(Boolean).length;
    const chars = raw.length;
    return { words, chars };
  }, [value]);

  const handleScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const triggerEnhance = () => {
    onEnhanceBullet(textareaRef.current);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[#1F2937] bg-[#080B0F] overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] bg-[#0F141C] px-4 py-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-slate-100">
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            resume.md
          </span>
          <span className="rounded bg-[#171F2C] border border-[#283548] px-2 py-0.5 text-[10px] font-mono text-slate-400">
            {lineCount} lines · {stats.words} words
          </span>
          {isScoringLive ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Scoring...
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">Live ATS Debounced (250ms)</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={triggerEnhance}
            disabled={isEnhancing}
            title="Place cursor on bullet line or select text to enhance with STAR"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition cursor-pointer"
          >
            {isEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            Enhance with STAR
          </button>

          <MotionButton
            type="button"
            onClick={onAutoRemediate}
            disabled={fluffCount === 0}
            whileHover={!shouldReduceMotion ? { scale: 1.02 } : undefined}
            whileTap={!shouldReduceMotion ? { scale: 0.98 } : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition select-none cursor-pointer',
              remediatedPulse
                ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30',
              fluffCount === 0 && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            ⚡ Auto-Remediate Fluff {fluffCount > 0 ? `(${fluffCount})` : ''}
          </MotionButton>

          {onOpenDiffPreview && (
            <button
              type="button"
              onClick={onOpenDiffPreview}
              className="inline-flex items-center gap-1 rounded-lg border border-[#283548] bg-[#171F2C] hover:bg-[#1F2937] px-2 py-1 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              <Code className="h-3.5 w-3.5 text-cyan-400" />
              Diff
            </button>
          )}

          <button
            type="button"
            onClick={onDirectPdfDownload}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-2.5 py-1 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-50"
          >
            {isDownloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            PDF
          </button>
        </div>
      </div>

      {enhanceFeedback && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300">
          {enhanceFeedback}
        </div>
      )}

      {/* Editor Body with Synchronized Line Numbers */}
      <div className="flex flex-1 min-h-[500px] max-h-[680px]">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 select-none overflow-hidden bg-[#0A0E14] py-4 pr-3 text-right font-mono text-xs text-slate-600 border-r border-[#1F2937]"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-6 leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          rows={22}
          placeholder="Paste or edit resume text here..."
          className="flex-1 resize-none bg-[#080B0F] py-4 px-4 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:ring-0"
          spellCheck="false"
        />
      </div>

      {/* Prompt Bar */}
      <div className="border-t border-[#1F2937] bg-[#0F141C] p-3 flex gap-2">
        <input
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onPrompt()}
          placeholder="Try AI Prompt: Emphasize Python microservices or quantify deployment velocity..."
          className="h-9 min-w-0 flex-1 rounded-xl border border-[#283548] bg-[#171F2C] px-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={onPrompt}
          disabled={!instruction.trim() || working}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Apply prompt"
        >
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

const LiveDiffPreviewDeck = ({
  originalText,
  remediatedText,
  onApply,
  onClose,
  fluffCount,
}) => {
  const diffLines = useMemo(
    () => computeDiffLines(originalText, remediatedText),
    [originalText, remediatedText]
  );

  const changesCount = useMemo(() => {
    return diffLines.filter((l) => l.type === 'added' || l.type === 'removed').length;
  }, [diffLines]);

  return (
    <StudioCard variant="default" className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-bold text-emerald-300">
              <Code className="h-3.5 w-3.5" />
              Live Diff Inspection Preview
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {changesCount} diff lines detected
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Compare original draft against STAR-remediated technical wording before applying.
            {fluffCount > 0 && <span className="ml-2 font-bold text-amber-300">({fluffCount} buzzwords addressed)</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md cursor-pointer transition"
          >
            <Check className="h-3.5 w-3.5" />
            Apply All Remediations
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#283548] bg-[#171F2C] hover:bg-[#1F2937] px-3 py-1.5 text-xs font-bold text-slate-300 cursor-pointer"
          >
            Close Diff
          </button>
        </div>
      </div>

      {/* Diff Table with Line Numbers */}
      <div className="overflow-x-auto max-h-[500px] rounded-xl border border-[#1F2937] bg-[#080B0F]">
        <div className="min-w-full divide-y divide-[#1F2937]/50 font-mono text-xs">
          {diffLines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-stretch leading-6',
                line.type === 'added' && 'bg-emerald-950/30 text-emerald-200 border-l-2 border-emerald-400',
                line.type === 'removed' && 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-400 line-through',
                line.type === 'unchanged' && 'text-slate-300 hover:bg-[#0F141C]/60'
              )}
            >
              <div className="w-12 shrink-0 py-1 pr-3 text-right text-slate-600 select-none border-r border-[#1F2937] bg-[#0A0E14]">
                {line.lineNumber}
              </div>
              <div className="w-6 shrink-0 py-1 text-center font-bold select-none text-slate-500">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </div>
              <div className="flex-1 min-w-0 py-1 px-3 whitespace-pre-wrap break-words">
                {line.text || ' '}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudioCard>
  );
};

const RequirementsPanel = ({ version, atsDiagnostic, isScoringLive, xrayData }) => {
  const ats = atsDiagnostic || version?.ats_diagnostic || {
    overall_score: version?.ats_score ?? 75,
    grade: (version?.ats_score ?? 75) >= 80 ? 'A' : (version?.ats_score ?? 75) >= 65 ? 'B' : 'Needs Work',
    breakdown: {
      parseability: 20,
      keyword_match: 25,
      action_metrics: 18,
      structure_hygiene: 12,
    },
    feedback: [],
    strengths: ['Standard ATS structure'],
  };

  const gradeColors = {
    A: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    B: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    C: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'Needs Work': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };

  return (
    <StudioCard variant="default" className="p-5">
      {xrayData && (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.06] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              6-Sec Scan Pass Rate
            </span>
            <span className="text-base font-black text-cyan-300">
              {xrayData.screen_probability}%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-300 leading-snug">
            {xrayData.screen_probability >= 75
              ? 'High callback likelihood in 6-second glance.'
              : xrayData.screen_probability >= 50
                ? 'Moderate callback probability. Eliminate detected fluff words.'
                : 'Pass risk. Buzzword density or unquantified claims detected.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">100-Pt ATS Scorecard</h2>
            {isScoringLive && (
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" title="Live scoring..." />
            )}
          </div>
          <p className="text-[11px] text-slate-400">Deterministic 4-pillar parsing rubric</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-white">
            {ats.overall_score}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </span>
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-bold', gradeColors[ats.grade] || 'bg-slate-800 text-slate-300 border-slate-700')}>
            {ats.grade}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Parseability & Contact</span>
            <span className="font-bold text-emerald-400">{ats.breakdown?.parseability ?? 0}/25</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2937]">
            <div
              className="h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, ((ats.breakdown?.parseability ?? 0) / 25) * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Keyword Match</span>
            <span className="font-bold text-cyan-400">{ats.breakdown?.keyword_match ?? 0}/35</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2937]">
            <div
              className="h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              style={{ width: `${Math.min(100, ((ats.breakdown?.keyword_match ?? 0) / 35) * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>STAR Action & Metrics</span>
            <span className="font-bold text-blue-400">{ats.breakdown?.action_metrics ?? 0}/25</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2937]">
            <div
              className="h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              style={{ width: `${Math.min(100, ((ats.breakdown?.action_metrics ?? 0) / 25) * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Structural Completeness</span>
            <span className="font-bold text-teal-400">{ats.breakdown?.structure_hygiene ?? 0}/15</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[#1F2937]">
            <div
              className="h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
              style={{ width: `${Math.min(100, ((ats.breakdown?.structure_hygiene ?? 0) / 15) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {ats.feedback && ats.feedback.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Actionable ATS Fixes</p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
            {ats.feedback.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-[#1F2937] pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Job Keywords & Evidence</h3>
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Supported Skills</p>
          <div className="mt-2 space-y-2">
            {(version?.matched_skills || []).map((skill) => (
              <div key={skill} className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] p-2.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> {skill}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {(version?.evidence_map?.[skill] || [])?.[0] || 'Found in resume text'}
                </p>
              </div>
            ))}
            {(version?.matched_skills?.length || 0) === 0 && (
              <p className="text-xs text-slate-500">No structured skill evidence matched this JD.</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Missing Gaps</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(version?.missing_skills || []).map((skill) => (
              <span key={skill} className="rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 text-xs font-bold text-amber-300">
                {skill}
              </span>
            ))}
            {(version?.missing_skills?.length || 0) === 0 && (
              <p className="text-xs text-slate-500">No vocabulary gaps found.</p>
            )}
          </div>
        </div>
      </div>
    </StudioCard>
  );
};

const SuggestionsPanel = ({
  version,
  githubStatus,
  repositories,
  selectedRepositories,
  githubProjects,
  githubWorking,
  onConnect,
  onToggleRepository,
  onSearchEvidence,
  onApproveProject,
  onDisconnect,
}) => (
  <StudioCard variant="default" className="p-5">
    <h2 className="text-sm font-bold text-white">Evidence suggestions</h2>
    <div className="mt-4 rounded-xl border border-[#1F2937] bg-[#0A0E14] p-4">
      <div className="flex items-center gap-2">
        <Github className="h-4 w-4 text-slate-400" />
        <p className="text-xs font-bold text-slate-200">GitHub evidence</p>
      </div>

      {!githubStatus.configured ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          GitHub MCP is not configured on this deployment. The app needs a read-only GitHub App before students can connect.
        </p>
      ) : !githubStatus.connected ? (
        <>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Connect the official GitHub MCP and approve only the repositories CareerPilot may inspect.
          </p>
          <button
            type="button"
            onClick={onConnect}
            disabled={githubWorking}
            className="mt-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
          >
            {githubWorking ? 'Opening GitHub...' : 'Connect GitHub'}
          </button>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-emerald-400">Connected as {githubStatus.account_login}</p>
            <button
              type="button"
              onClick={onDisconnect}
              className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
            >
              Disconnect
            </button>
          </div>
          <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
            {repositories.map((repository) => (
              <label
                key={repository.full_name}
                className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-[#171F2C] transition"
              >
                <input
                  type="checkbox"
                  checked={selectedRepositories.includes(repository.full_name)}
                  onChange={() => onToggleRepository(repository.full_name)}
                  className="mt-0.5 accent-cyan-500"
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-200">{repository.full_name}</span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {repository.private ? 'Private, approved' : 'Public'}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={onSearchEvidence}
            disabled={selectedRepositories.length === 0 || githubWorking}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
          >
            {githubWorking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Check selected projects
          </button>
        </>
      )}
    </div>

    {githubProjects.length > 0 && (
      <div className="mt-4 space-y-3">
        {githubProjects.map((project) => (
          <GitHubProjectCard
            key={project.evidence_id || project.url}
            project={project}
            disabled={githubWorking}
            onApprove={onApproveProject}
          />
        ))}
      </div>
    )}

    <div className="mt-4 space-y-3">
      {version?.project_suggestions?.map((suggestion) => (
        <article key={suggestion.title} className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <TriangleAlert className="h-3.5 w-3.5" /> Future project · not resume evidence
          </p>
          <h3 className="mt-2 text-sm font-bold text-white">{suggestion.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{suggestion.description}</p>
        </article>
      ))}
      {(version?.project_suggestions?.length || 0) === 0 && (
        <p className="text-xs leading-relaxed text-slate-500">No future project suggestion is needed for the detected skills.</p>
      )}
    </div>
  </StudioCard>
);

const GitHubProjectCard = ({ project, disabled, onApprove }) => {
  const [draft, setDraft] = useState(() => initialEvidenceDraft(project));
  const approved = project.approval_status === 'approved';

  const toggleSkill = (skill) => {
    setDraft((current) => ({
      ...current,
      selectedSkills: current.selectedSkills.includes(skill)
        ? current.selectedSkills.filter((item) => item !== skill)
        : [...current.selectedSkills, skill],
    }));
  };

  return (
    <article className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-cyan-400">Existing GitHub project</p>
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-sm font-bold text-white hover:underline"
          >
            {project.name}
          </a>
        </div>
        <span className="rounded-full bg-[#171F2C] border border-[#283548] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
          {approved ? 'Draft created' : 'Needs confirmation'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">{project.reason}</p>

      {!approved && (
        <div className="mt-4 space-y-3 border-t border-[#1F2937] pt-4">
          <fieldset>
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Skills this repository supports
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.matching_skills.map((skill) => (
                <label
                  key={skill}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#283548] bg-[#171F2C] px-2.5 py-1 text-[11px] font-bold text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={draft.selectedSkills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    className="accent-cyan-500"
                  />
                  {skill}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-[11px] font-bold text-slate-400">
            What did you personally contribute?
            <textarea
              value={draft.contribution}
              onChange={(event) => setDraft((current) => ({ ...current, contribution: event.target.value }))}
              rows={2}
              placeholder="Example: I designed the API routes and wrote the integration tests."
              className="mt-1.5 w-full rounded-lg border border-[#283548] bg-[#171F2C] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
            />
          </label>

          <label className="block text-[11px] font-bold text-slate-400">
            Resume wording you want to propose
            <textarea
              value={draft.wording}
              onChange={(event) => setDraft((current) => ({ ...current, wording: event.target.value }))}
              rows={2}
              placeholder={`Example: Built the authentication flow for ${project.name} using ${project.matching_skills.join(' and ')}.`}
              className="mt-1.5 w-full rounded-lg border border-[#283548] bg-[#171F2C] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
            />
          </label>

          <label className="block text-[11px] font-bold text-slate-400">
            Outcome or result (optional)
            <input
              value={draft.outcome}
              onChange={(event) => setDraft((current) => ({ ...current, outcome: event.target.value }))}
              placeholder="Only add a result you can explain in an interview."
              className="mt-1.5 w-full rounded-lg border border-[#283548] bg-[#171F2C] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
            />
          </label>

          <label className="flex items-start gap-2 rounded-lg bg-[#171F2C] border border-[#283548] p-3 text-[11px] leading-relaxed text-slate-300">
            <input
              type="checkbox"
              checked={draft.confirmed}
              onChange={(event) => setDraft((current) => ({ ...current, confirmed: event.target.checked }))}
              className="mt-0.5 accent-cyan-500"
            />
            I confirm this describes my own work and I can discuss it in an interview.
          </label>

          <button
            type="button"
            onClick={() => onApprove(project, draft)}
            disabled={disabled || !draft.confirmed || draft.selectedSkills.length === 0 || !draft.contribution.trim() || !draft.wording.trim()}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create reviewable resume suggestion
          </button>
        </div>
      )}

      {approved && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          A new draft is open in Resume Studio. Review and accept or reject its line before downloading.
        </p>
      )}
    </article>
  );
};

const ChangeReview = ({ version, decisions, working, onDecision, onApprove }) => {
  const changes = version.changes || [];
  const progress = reviewProgress(changes, decisions);

  if (version.approval_status === 'approved') {
    return (
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <Check className="h-4 w-4 text-emerald-400" /> Approved version locked
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          The reviewed content is locked as a new verified version and is ready for export.
        </p>
      </section>
    );
  }

  return (
    <StudioCard variant="default" className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Change review</p>
          <h2 className="mt-1 text-lg font-bold text-white">Decide what reaches the approved resume</h2>
          <p className="mt-1 text-xs text-slate-400">
            {progress.reviewed} of {progress.total} changes reviewed. Rejected changes keep the previous wording.
          </p>
        </div>
        <button
          type="button"
          onClick={onApprove}
          disabled={!progress.complete || working}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Create approved version
        </button>
      </div>

      {changes.length === 0 ? (
        <p className="mt-5 border-t border-[#1F2937] pt-5 text-sm text-slate-400">
          No wording changed. Approve this analysis to unlock an export linked to the JD.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-[#1F2937] border-y border-[#1F2937]">
          {changes.map((change, index) => (
            <li key={change.id} className="grid gap-4 py-5 lg:grid-cols-[3rem_1fr_auto] lg:items-start">
              <span className="text-xs font-black text-slate-500">{String(index + 1).padStart(2, '0')}</span>
              <div className="space-y-3">
                {change.before_lines.length > 0 && <DiffBlock label="Before" lines={change.before_lines} tone="removed" />}
                {change.after_lines.length > 0 && <DiffBlock label="Proposed" lines={change.after_lines} tone="added" />}
              </div>
              <div className="flex gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => onDecision(change.id, 'accepted')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition cursor-pointer',
                    decisions[change.id] === 'accepted'
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                      : 'border-[#283548] bg-[#171F2C] text-slate-300 hover:bg-[#1F2937]'
                  )}
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  type="button"
                  onClick={() => onDecision(change.id, 'rejected')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition cursor-pointer',
                    decisions[change.id] === 'rejected'
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                      : 'border-[#283548] bg-[#171F2C] text-slate-300 hover:bg-[#1F2937]'
                  )}
                >
                  <X className="h-3.5 w-3.5" /> Keep before
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </StudioCard>
  );
};

const DiffBlock = ({ label, lines, tone }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <div
      className={cn(
        'mt-1 border-l-2 px-3 py-2 text-xs leading-relaxed font-mono rounded-r-lg',
        tone === 'added'
          ? 'border-emerald-400 bg-emerald-950/30 text-emerald-200'
          : 'border-rose-400 bg-rose-950/30 text-rose-300 line-through'
      )}
    >
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line || 'Blank line'}</p>
      ))}
    </div>
  </div>
);

const ResumeStudio = () => {
  const [searchParams] = useSearchParams();
  const requestedJobId = searchParams.get('job');
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [versions, setVersions] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [activeVersion, setActiveVersion] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [changeDecisions, setChangeDecisions] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [githubStatus, setGithubStatus] = useState({ configured: false, connected: false });
  const [repositories, setRepositories] = useState([]);
  const [selectedRepositories, setSelectedRepositories] = useState([]);
  const [githubProjects, setGithubProjects] = useState([]);
  const [githubWorking, setGithubWorking] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [liveAtsDiagnostic, setLiveAtsDiagnostic] = useState(null);
  const [isScoringLive, setIsScoringLive] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceFeedback, setEnhanceFeedback] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Deck view modes: 'split' | 'candidate' | 'xray' | 'diff'
  const [deckView, setDeckView] = useState('split');
  const [xrayData, setXrayData] = useState(null);
  const [isXRayLoading, setIsXRayLoading] = useState(false);
  const [remediatedPulse, setRemediatedPulse] = useState(false);
  const [remediatedToast, setRemediateToast] = useState('');
  const [originalDraftForDiff, setOriginalDraftForDiff] = useState('');

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    const loadWorkspace = async () => {
      try {
        const [resumeData, jobData, versionData, githubData] = await Promise.all([
          getAllResumes(),
          getAllJobs(),
          getResumeVersions(),
          getGitHubStatus(),
        ]);
        if (!active) return;

        setResumes(resumeData);
        setJobs(jobData);
        setVersions(versionData);
        setResumeId(resumeData[0]?.id || '');
        setActiveVersion(versionData[0] || null);
        if (requestedJobId && jobData.some((job) => job.id === requestedJobId)) {
          setJobId(requestedJobId);
        }
        setGithubStatus(githubData);
        if (githubData.connected) {
          const repositoryData = await getGitHubRepositories();
          if (active) setRepositories(repositoryData);
        }
      } catch {
        if (active) setError('Resume Studio could not load your workspace.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadWorkspace();
    return () => {
      active = false;
    };
  }, [requestedJobId]);

  useEffect(() => {
    const decisions = {};
    for (const change of activeVersion?.changes || []) {
      if (change.status === 'accepted' || change.status === 'rejected') {
        decisions[change.id] = change.status;
      }
    }
    setChangeDecisions(decisions);
  }, [activeVersion?.id, activeVersion?.changes]);

  useEffect(() => {
    if (activeVersion?.content) {
      setEditorContent(activeVersion.content);
      setOriginalDraftForDiff(activeVersion.content);
      if (activeVersion.ats_diagnostic) {
        setLiveAtsDiagnostic(activeVersion.ats_diagnostic);
      }
    }
  }, [activeVersion?.id, activeVersion?.content, activeVersion?.ats_diagnostic]);

  useEffect(() => {
    if (!editorContent || !editorContent.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setIsScoringLive(true);
        setIsXRayLoading(true);
        const effectiveJobDesc = jobId
          ? (jobs.find((job) => job.id === jobId)?.description || jobDescription || activeVersion?.job_description || '')
          : (jobDescription || activeVersion?.job_description || '');

        const [diagnostic, xray] = await Promise.all([
          scoreResumeLive({
            resume_text: editorContent,
            job_description: effectiveJobDesc,
          }),
          getRecruiterXRay({
            resume_text: editorContent,
            job_description: effectiveJobDesc,
          }),
        ]);
        setLiveAtsDiagnostic(diagnostic);
        setXrayData(xray);
      } catch {
        // Keep previous diagnostic on transient error
      } finally {
        setIsScoringLive(false);
        setIsXRayLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editorContent, jobDescription, jobId, jobs, activeVersion?.job_description]);

  const runAnalysis = async () => {
    if (!resumeId || (!jobId && !jobDescription.trim())) return;
    setWorking(true);
    setError('');

    try {
      const version = await analyzeResumeForJob({
        resume_id: resumeId,
        job_id: jobId || null,
        job_description: jobDescription.trim() || null,
      });
      setActiveVersion(version);
      setEditorContent(version.content);
      setOriginalDraftForDiff(version.content);
      if (version.ats_diagnostic) {
        setLiveAtsDiagnostic(version.ats_diagnostic);
      }
      setVersions((current) => [version, ...current]);
    } catch (analysisError) {
      setError(analysisError.response?.data?.detail || 'The resume could not be analyzed.');
    } finally {
      setWorking(false);
    }
  };

  const applyPrompt = async () => {
    if (!activeVersion || !instruction.trim()) return;
    setWorking(true);
    setError('');

    try {
      const version = await promptResumeVersion(activeVersion.id, instruction.trim());
      setActiveVersion(version);
      setEditorContent(version.content);
      if (version.ats_diagnostic) {
        setLiveAtsDiagnostic(version.ats_diagnostic);
      }
      setVersions((current) => [version, ...current]);
      setInstruction('');
    } catch (promptError) {
      setError(promptError.response?.data?.detail || 'That edit could not be applied.');
    } finally {
      setWorking(false);
    }
  };

  const downloadVersion = async () => {
    if (!activeVersion) return;
    setError('');
    try {
      const fileBlob = await downloadResumeVersion(activeVersion.id);
      const url = URL.createObjectURL(fileBlob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = activeVersion.template_mode === 'same_docx_template' ? 'careerpilot-tailored-resume.docx' : 'careerpilot-tailored-resume.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.response?.data?.detail || 'The approved resume could not be downloaded.');
    }
  };

  const handleDirectPdfDownload = async () => {
    const textToExport = editorContent || activeVersion?.content || '';
    if (!textToExport.trim()) return;

    setIsDownloadingPdf(true);
    setError('');
    try {
      const firstLine = textToExport.trim().split('\n')[0]?.trim() || 'Candidate';
      const candidateName = firstLine.replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'Candidate';
      const fileBlob = await exportPdfDirect({
        resume_text: textToExport,
        candidate_name: candidateName,
      });
      const url = URL.createObjectURL(fileBlob);
      const link = window.document.createElement('a');
      const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'Candidate';
      link.href = url;
      link.download = `${safeName}_ATS_Resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.response?.data?.detail || 'The Harvard ATS PDF could not be generated.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleEnhanceBullet = async (textarea) => {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editorContent;

    let targetBullet = '';
    let replaceStart = start;
    let replaceEnd = end;

    if (start !== end) {
      targetBullet = text.substring(start, end).trim();
    } else {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', start);
      if (lineEnd === -1) lineEnd = text.length;
      targetBullet = text.substring(lineStart, lineEnd).trim();
      replaceStart = lineStart;
      replaceEnd = lineEnd;
    }

    if (!targetBullet) {
      setEnhanceFeedback('Place cursor on a bullet line or highlight text to enhance.');
      setTimeout(() => setEnhanceFeedback(''), 4000);
      return;
    }

    setIsEnhancing(true);
    setEnhanceFeedback('');
    try {
      const targetRole = jobs.find((job) => job.id === jobId)?.title || '';
      const result = await enhanceBullet({ bullet: targetBullet, target_role: targetRole });
      if (result?.enhanced_bullet) {
        const lineContent = text.substring(replaceStart, replaceEnd);
        const prefixMatch = lineContent.match(/^(\s*[-*•]\s*)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const cleanEnhanced = result.enhanced_bullet.replace(/^[-*•]\s*/, '');
        const replacement = prefix ? `${prefix}${cleanEnhanced}` : result.enhanced_bullet;

        const updated = text.substring(0, replaceStart) + replacement + text.substring(replaceEnd);
        setEditorContent(updated);
        setEnhanceFeedback(`Enhanced with STAR: "${result.action_verb}" action verb applied.`);
        setTimeout(() => setEnhanceFeedback(''), 4000);
      }
    } catch (err) {
      setEnhanceFeedback(err.response?.data?.detail || 'Could not enhance bullet with STAR.');
      setTimeout(() => setEnhanceFeedback(''), 4000);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAutoRemediateFluff = () => {
    const fluffCount = xrayData?.fluff_words_detected?.length || 0;
    if (!fluffCount && !xrayData?.remediated_text_preview) return;

    setOriginalDraftForDiff(editorContent);
    const newText = autoRemediateFluffText(editorContent, xrayData);
    setEditorContent(newText);
    setRemediatedPulse(true);
    setRemediateToast(
      `⚡ Auto-remediated ${fluffCount || 'detected'} buzzwords with active STAR alternatives! Live score recalculating...`
    );

    setTimeout(() => {
      setRemediatedPulse(false);
    }, 2200);

    setTimeout(() => {
      setRemediateToast('');
    }, 5000);
  };

  const decideChange = (changeId, status) => {
    setChangeDecisions((current) => ({ ...current, [changeId]: status }));
  };

  const approveVersion = async () => {
    if (!activeVersion || activeVersion.approval_status !== 'draft') return;
    const progress = reviewProgress(activeVersion.changes || [], changeDecisions);
    if (!progress.complete) {
      setError('Accept or reject every proposed change before creating the approved version.');
      return;
    }

    setWorking(true);
    setError('');
    try {
      const approvedVersion = await reviewResumeVersion(
        activeVersion.id,
        buildReviewPayload(activeVersion.changes || [], changeDecisions),
      );
      setActiveVersion(approvedVersion);
      setVersions((current) => [approvedVersion, ...current]);
    } catch (reviewError) {
      setError(reviewError.response?.data?.detail || 'The resume review could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  const startGitHubConnection = async () => {
    setGithubWorking(true);
    setError('');
    try {
      const result = await connectGitHub();
      window.location.assign(result.authorization_url);
    } catch (connectionError) {
      setError(connectionError.response?.data?.detail || 'GitHub could not be connected.');
      setGithubWorking(false);
    }
  };

  const toggleRepository = (fullName) => {
    setSelectedRepositories((current) => (
      current.includes(fullName)
        ? current.filter((name) => name !== fullName)
        : [...current, fullName].slice(0, 5)
    ));
  };

  const searchGitHubEvidence = async () => {
    if (!activeVersion || selectedRepositories.length === 0) return;
    setGithubWorking(true);
    setError('');
    try {
      const result = await findGitHubEvidence(activeVersion.id, selectedRepositories);
      setGithubProjects(result.projects);
    } catch (evidenceError) {
      setError(evidenceError.response?.data?.detail || 'GitHub evidence could not be checked.');
    } finally {
      setGithubWorking(false);
    }
  };

  const removeGitHubConnection = async () => {
    setGithubWorking(true);
    try {
      await disconnectGitHub();
      setGithubStatus((current) => ({ ...current, connected: false, account_login: null }));
      setRepositories([]);
      setSelectedRepositories([]);
      setGithubProjects([]);
    } catch {
      setError('GitHub could not be disconnected.');
    } finally {
      setGithubWorking(false);
    }
  };

  const approveProjectEvidence = async (project, draft) => {
    setGithubWorking(true);
    setError('');
    try {
      const result = await approveGitHubEvidence(
        project.evidence_id,
        buildEvidenceApprovalPayload(draft),
      );
      setActiveVersion(result.version);
      setVersions((current) => [result.version, ...current]);
      setGithubProjects((current) => current.map((item) => (
        item.evidence_id === project.evidence_id
          ? { ...item, approval_status: result.approval_status, proposal_version_id: result.version.id }
          : item
      )));
    } catch (approvalError) {
      setError(approvalError.response?.data?.detail || 'The GitHub project could not be added as a resume proposal.');
    } finally {
      setGithubWorking(false);
    }
  };

  const deckViews = [
    { id: 'split', label: '⚡ Split Inspection Deck', icon: Split },
    { id: 'candidate', label: '📝 Candidate Editor', icon: FileText },
    { id: 'xray', label: '🔍 Recruiter 6-Sec X-Ray', icon: Eye },
    { id: 'diff', label: '📊 Live Diff Preview', icon: Code },
  ];

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2">
            <StudioBadge variant="cyan" pulse size="sm">
              Hero 1 Studio
            </StudioBadge>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recruiter 6-Second X-Ray & Live Studio Tailoring
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Resume Studio & X-Ray Deck
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Simulate recruiter eye-tracking gaze trajectories, auto-remediate fluff buzzwords with STAR alternatives, and inspect live ATS rubric diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {editorContent && (
            <StudioButton
              variant="primary"
              size="md"
              onClick={handleDirectPdfDownload}
              disabled={isDownloadingPdf}
              icon={isDownloadingPdf ? null : Download}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Generating PDF...
                </>
              ) : (
                'Download Harvard ATS PDF'
              )}
            </StudioButton>
          )}

          {activeVersion && (
            <StudioButton
              variant="secondary"
              size="md"
              onClick={downloadVersion}
              disabled={activeVersion.approval_status !== 'approved'}
              icon={Download}
            >
              {activeVersion.approval_status === 'approved'
                ? (activeVersion.template_mode === 'same_docx_template' ? 'Download Approved DOCX' : 'Download Approved PDF')
                : 'Review changes to unlock export'}
            </StudioButton>
          )}
        </div>
      </header>

      <AnimatePresence>
        {error && (
          <MotionDiv
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Remediated Toast */}
      <AnimatePresence>
        {remediatedToast && (
          <MotionDiv
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{remediatedToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setRemediateToast('')}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Workspace Selector Card */}
      <StudioCard variant="default" className="p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300">Target resume draft</span>
            <select
              value={resumeId}
              onChange={(event) => setResumeId(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#283548] bg-[#171F2C] px-3 text-xs sm:text-sm text-slate-100 outline-none focus:border-cyan-500"
            >
              <option value="">Choose a resume</option>
              {resumes.map((resume, index) => (
                <option key={resume.id} value={resume.id}>
                  Resume {index + 1}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 lg:col-span-2">
            <span className="text-xs font-bold text-slate-300">Saved job posting (optional)</span>
            <select
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#283548] bg-[#171F2C] px-3 text-xs sm:text-sm text-slate-100 outline-none focus:border-cyan-500"
            >
              <option value="">Paste a job description below</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.company}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-bold text-slate-300">Job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            disabled={Boolean(jobId)}
            rows={5}
            placeholder={jobId ? 'CareerPilot will use the saved job description.' : 'Paste the complete JD here...'}
            className="w-full rounded-xl border border-[#283548] bg-[#171F2C] p-3 text-xs sm:text-sm text-slate-100 outline-none focus:border-cyan-500 disabled:opacity-60"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StudioButton
            variant="primary"
            size="md"
            onClick={runAnalysis}
            disabled={!resumeId || (!jobId && !jobDescription.trim()) || working}
            loading={working}
            icon={Sparkles}
          >
            {working ? 'Analyzing & Building Version...' : 'Analyze & Build Version'}
          </StudioButton>

          {activeVersion && (
            <span className="text-xs text-slate-400">
              Active version: <span className="font-bold text-cyan-300">v{versions.findIndex((v) => v.id === activeVersion.id) >= 0 ? versions.length - versions.findIndex((v) => v.id === activeVersion.id) : 1}</span>
            </span>
          )}
        </div>
      </StudioCard>

      {!activeVersion ? (
        <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0F141C] px-6 py-16 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-slate-600" />
          <h2 className="mt-4 text-base font-bold text-white">Your tailored studio inspection deck will appear here</h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-400">
            Choose your base resume and add a target JD. The original uploaded resume is preserved without modification.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Deck View Mode Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#0F141C] p-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deck View:</span>
              <div
                role="tablist"
                className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-[#080B0F] p-1 border border-[#1F2937]"
              >
                {deckViews.map((view) => {
                  const isActive = deckView === view.id;
                  const Icon = view.icon;
                  return (
                    <button
                      key={view.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setDeckView(view.id)}
                      className={cn(
                        'relative px-3 py-1.5 rounded-lg text-xs font-bold transition outline-none cursor-pointer flex items-center gap-1.5',
                        isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {isActive && (
                        <MotionDiv
                          layoutId="deck-view-pill"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 shadow-xs"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 380, damping: 28 }
                          }
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{view.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isScoringLive || isXRayLoading ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  Analyzing X-Ray...
                </span>
              ) : xrayData?.screen_probability !== undefined ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Callback Chance: {xrayData.screen_probability}%
                </span>
              ) : null}
            </div>
          </div>

          {/* Persona Verdict Banner */}
          <HiringManagerVerdictBanner xrayData={xrayData} />

          {/* Main Inspection Deck (Split vs Single View) */}
          {deckView === 'split' && (
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Left Column: Dark Studio Code/Text Editor with Line Numbers */}
              <div>
                <StudioCodeEditor
                  value={editorContent}
                  onChange={setEditorContent}
                  onEnhanceBullet={handleEnhanceBullet}
                  isEnhancing={isEnhancing}
                  enhanceFeedback={enhanceFeedback}
                  onPrompt={applyPrompt}
                  instruction={instruction}
                  setInstruction={setInstruction}
                  working={working}
                  onAutoRemediate={handleAutoRemediateFluff}
                  fluffCount={xrayData?.fluff_words_detected?.length || 0}
                  remediatedPulse={remediatedPulse}
                  onOpenDiffPreview={() => setDeckView('diff')}
                  onDirectPdfDownload={handleDirectPdfDownload}
                  isDownloadingPdf={isDownloadingPdf}
                  isScoringLive={isScoringLive || isXRayLoading}
                />
              </div>

              {/* Right Column: Recruiter 6-Sec X-Ray Heatmap */}
              <div>
                <RecruiterXRayHeatmap
                  content={editorContent}
                  xrayData={xrayData}
                  onAutoRemediate={handleAutoRemediateFluff}
                  remediatedPulse={remediatedPulse}
                  onOpenDiffPreview={() => setDeckView('diff')}
                />
              </div>
            </div>
          )}

          {deckView === 'candidate' && (
            <StudioCodeEditor
              value={editorContent}
              onChange={setEditorContent}
              onEnhanceBullet={handleEnhanceBullet}
              isEnhancing={isEnhancing}
              enhanceFeedback={enhanceFeedback}
              onPrompt={applyPrompt}
              instruction={instruction}
              setInstruction={setInstruction}
              working={working}
              onAutoRemediate={handleAutoRemediateFluff}
              fluffCount={xrayData?.fluff_words_detected?.length || 0}
              remediatedPulse={remediatedPulse}
              onOpenDiffPreview={() => setDeckView('diff')}
              onDirectPdfDownload={handleDirectPdfDownload}
              isDownloadingPdf={isDownloadingPdf}
              isScoringLive={isScoringLive || isXRayLoading}
            />
          )}

          {deckView === 'xray' && (
            <RecruiterXRayHeatmap
              content={editorContent}
              xrayData={xrayData}
              onAutoRemediate={handleAutoRemediateFluff}
              remediatedPulse={remediatedPulse}
              onOpenDiffPreview={() => setDeckView('diff')}
            />
          )}

          {deckView === 'diff' && (
            <LiveDiffPreviewDeck
              originalText={originalDraftForDiff}
              remediatedText={editorContent}
              onApply={() => {
                setOriginalDraftForDiff(editorContent);
                setDeckView('split');
              }}
              onClose={() => setDeckView('split')}
              fluffCount={xrayData?.fluff_words_detected?.length || 0}
            />
          )}

          {/* Secondary Paneling: ATS Rubric Diagnostic & GitHub Evidence Suggestions */}
          <div className="grid gap-6 xl:grid-cols-2">
            <RequirementsPanel
              version={activeVersion}
              atsDiagnostic={liveAtsDiagnostic}
              isScoringLive={isScoringLive}
              xrayData={xrayData}
            />
            <SuggestionsPanel
              version={activeVersion}
              githubStatus={githubStatus}
              repositories={repositories}
              selectedRepositories={selectedRepositories}
              githubProjects={githubProjects}
              githubWorking={githubWorking}
              onConnect={startGitHubConnection}
              onToggleRepository={toggleRepository}
              onSearchEvidence={searchGitHubEvidence}
              onApproveProject={approveProjectEvidence}
              onDisconnect={removeGitHubConnection}
            />
          </div>

          {/* Change Review Section */}
          <ChangeReview
            version={activeVersion}
            decisions={changeDecisions}
            working={working}
            onDecision={decideChange}
            onApprove={approveVersion}
          />
        </div>
      )}

      {/* Version History Footer */}
      {versions.length > 0 && (
        <StudioCard variant="default" className="p-5">
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Version history</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {versions.map((version, index) => (
              <button
                key={version.id}
                type="button"
                onClick={() => setActiveVersion(version)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-bold transition cursor-pointer',
                  activeVersion?.id === version.id
                    ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                    : 'border-[#283548] bg-[#171F2C] text-slate-300 hover:bg-[#1F2937]'
                )}
              >
                Version {versions.length - index} · {new Date(version.created_at).toLocaleDateString('en-IN')}
              </button>
            ))}
          </div>
        </StudioCard>
      )}
    </div>
  );
};

export default ResumeStudio;
