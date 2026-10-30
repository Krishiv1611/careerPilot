import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gauge,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApplicationPackModal } from './Applications';
import api, {
  addCustomJob,
  analyzeJobMatch,
  createApplication,
  discoverJobs,
  dismissJob,
  getAllJobs,
  getCandidateProfile,
  saveJob,
} from '../services/api';
import { applyJobState, applySavedJobState, filterJobsByHealth } from '../app/job-workspace';
import { StudioButton, StudioCard, StudioMotionDrawer } from '../components/studio/StudioPrimitives';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;

const getSavedJobs = async () => {
  const response = await api.get('/jobs/saved');
  return response.data;
};

const unsaveJob = async (jobId) => {
  const response = await api.post(`/jobs/${jobId}/unsave`);
  return response.data;
};

export const RoleHealthScoreBadge = ({ score = 100, verdict = '', size = 'sm', pulse = true }) => {
  const shouldReduceMotion = useReducedMotion();
  const isHealthy = score >= 70;
  const isModerate = score >= 50 && score < 70;

  const style = isHealthy
    ? {
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        dot: 'bg-emerald-400',
        ping: 'bg-emerald-400',
      }
    : isModerate
    ? {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        dot: 'bg-amber-400',
        ping: 'bg-amber-400',
      }
    : {
        badge: 'bg-rose-500/10 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        dot: 'bg-rose-400',
        ping: 'bg-rose-400',
      };

  const sizeClass =
    size === 'xs'
      ? 'text-[10px] px-2 py-0.5'
      : size === 'lg'
      ? 'text-sm px-3.5 py-1'
      : 'text-xs px-2.5 py-0.5';

  return (
    <motion.span
      initial={shouldReduceMotion ? undefined : { scale: 0.95, opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-bold select-none',
        style.badge,
        sizeClass
      )}
      title={`Role Health: ${score}/100 ${verdict ? `(${verdict})` : ''}`}
    >
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        {pulse && !shouldReduceMotion && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              style.ping
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', style.dot)} />
      </span>
      <span>{score} pts</span>
      {verdict && <span className="opacity-75 font-medium">· {verdict}</span>}
    </motion.span>
  );
};

const CircularHealthGauge = ({ score = 85 }) => {
  const shouldReduceMotion = useReducedMotion();
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const isHealthy = score >= 70;
  const isModerate = score >= 50 && score < 70;

  const color = isHealthy
    ? 'text-emerald-400 stroke-emerald-400'
    : isModerate
    ? 'text-amber-400 stroke-amber-400'
    : 'text-rose-400 stroke-rose-400';

  const glow = isHealthy
    ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]'
    : isModerate
    ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
    : 'drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]';

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="stroke-[#1F2937]"
          strokeWidth="7"
          fill="none"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          className={cn('fill-none stroke-current', color, glow)}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.9, ease: 'easeOut' }
          }
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={cn('text-2xl font-black tracking-tight', color)}>{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
      </div>
    </div>
  );
};

const RoleHealthCard = ({ health }) => {
  if (!health) return null;

  const score = health.role_health_score ?? 100;
  const isHealthy = score >= 70;
  const isModerate = score >= 50 && score < 70;

  const ghostRisk = health.ghost_job_risk || 'Low';
  const isGhostHigh = ghostRisk === 'High';
  const isGhostMod = ghostRisk === 'Moderate';

  const redFlags = health.red_flags || [];
  const greenFlags = health.green_flags || [];

  const techCount = health.detected_tech_count ?? 0;
  const isTechOverload = techCount >= 10 || redFlags.some((f) => /overload|sprawl/i.test(f));
  const burnoutPatterns = /burnout|crunch|weekend|hats|rockstar|ninja|wizard|guru|24\/7|urgent/i;
  const burnoutFlags = redFlags.filter((f) => burnoutPatterns.test(f));
  const boundaryCautions = redFlags.filter((f) => !burnoutPatterns.test(f));

  return (
    <section className="mt-6 rounded-2xl border border-[#283548] bg-[#171F2C] p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-4 border-b border-[#283548] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Role Health &amp; Red Flag Auditor</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Automated reality check on tech stack requirements, burnout flags, and ghost job patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RoleHealthScoreBadge score={score} verdict={health.health_verdict} size="lg" />
        </div>
      </div>

      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_1fr] rounded-xl border border-[#1F2937] bg-[#0F141C] p-4 sm:p-5">
        <CircularHealthGauge score={score} />

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Role Reality Health Meter</span>
            <span
              className={
                isHealthy ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'
              }
            >
              {score} / 100 ({score >= 70 ? 'Healthy Role' : score >= 50 ? 'Caution Advised' : 'High Risk Role'})
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-[#1F2937]">
            <motion.div
              className={cn(
                'h-full rounded-full transition-all',
                isHealthy
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : isModerate
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, Math.min(100, score))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-medium text-slate-400">
            <span>0 (High Risk)</span>
            <span className="text-amber-400">50 (Caution)</span>
            <span className="font-bold text-emerald-400">70+ (Healthy Threshold)</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {isGhostHigh && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div className="text-xs">
            <p className="font-bold text-rose-300">High Ghost Job Risk Detected</p>
            <p className="mt-1 text-rose-200/90 leading-relaxed">
              This posting appears to be from a confidential staffing agency, a placeholder repost, or has a truncated description (&lt;35 words). Confirm the posting on the company direct portal before investing significant effort.
            </p>
          </div>
        </div>
      )}

      {isGhostMod && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="text-xs">
            <p className="font-bold text-amber-300">Moderate Ghost Job / Speculative Pipeline Risk</p>
            <p className="mt-1 text-amber-200/90 leading-relaxed">
              Signals suggest this might be speculative talent pipeline harvesting rather than an active immediate headcount seat.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-[#1F2937] bg-[#0F141C] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs">
            <span className="font-bold text-slate-200">Junior Tech Stack Overload Gauge: </span>
            <span className="font-semibold text-slate-400">
              {techCount} technologies detected
            </span>
          </div>
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-bold',
              isTechOverload
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                : techCount >= 2 && techCount <= 6
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            )}
          >
            {isTechOverload
              ? '⚠ Overload Alert'
              : techCount >= 2 && techCount <= 6
              ? '✓ Realistic Early-Career Scope'
              : 'Standard Scope'}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {isTechOverload
            ? 'Early-career roles requiring 10+ disparate tools frequently conceal unrealistic expectations or multiple roles merged into one.'
            : techCount >= 2 && techCount <= 6
            ? 'Focused requirements (2-6 tools) provide healthy onboarding and focused depth for entry-level talent.'
            : 'Review technology list to ensure alignment with your current stack and growth roadmap.'}
        </p>
      </div>

      {burnoutFlags.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
            <Flame className="h-4 w-4 text-rose-400" />
            <span>Burnout Phrasing &amp; Culture Warnings ({burnoutFlags.length})</span>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs text-rose-200">
            {burnoutFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Role Boundaries &amp; Cautions ({boundaryCautions.length})</span>
          </div>
          {boundaryCautions.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5 text-xs text-rose-200/90">
              {boundaryCautions.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 text-xs italic text-rose-400/80">
              No disguised roles or boundary ambiguities detected.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Workplace Culture Green Flags ({greenFlags.length})</span>
          </div>
          {greenFlags.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-200/90">
              {greenFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 text-xs italic text-emerald-400/80">
              Standard benefits and role scoping.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const MatchSummary = ({ match, jobId }) => (
  <div className="mt-4 border-t border-[#283548] pt-4 text-slate-200">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-2xl font-black text-cyan-400">{Math.round(match.coverage_percent)}%</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Detected requirement coverage
        </p>
      </div>
      <span
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-bold',
          match.eligibility_status === 'eligible'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : match.eligibility_status === 'not_eligible'
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        )}
      >
        {match.eligibility_status.replace('_', ' ')}
      </span>
    </div>
    <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-300">
      {match.eligibility_reasons.map((reason) => (
        <li key={reason} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
          <span>{reason}</span>
        </li>
      ))}
    </ul>
    <div className="mt-3 flex flex-wrap gap-2">
      {match.matched_skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300"
        >
          Evidence: {skill}
        </span>
      ))}
      {match.missing_skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300"
        >
          Gap: {skill}
        </span>
      ))}
    </div>
    <Link
      to={`/profile/tailor?job=${jobId}`}
      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-105 transition"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>Tailor resume for this job</span>
    </Link>
  </div>
);

const EmptySearchState = () => (
  <div className="rounded-2xl border border-dashed border-[#283548] bg-[#0F141C] px-6 py-16 text-center text-slate-100">
    <BriefcaseBusiness className="mx-auto h-10 w-10 text-cyan-400/60" />
    <h2 className="mt-4 text-lg font-bold text-slate-100">Search for your first role</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
      Try a clear role such as &quot;Python backend developer&quot;, choose India or a city, and select full-time or internship.
    </p>
  </div>
);

const EmptySavedState = ({ onBrowse }) => (
  <div className="rounded-2xl border border-dashed border-[#283548] bg-[#0F141C] px-6 py-16 text-center text-slate-100">
    <Bookmark className="mx-auto h-10 w-10 text-cyan-400/60" />
    <h2 className="mt-4 text-lg font-bold text-slate-100">No saved jobs yet</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
      When searching for jobs in the Live Search Results tab, click &quot;Save job&quot; on any role to keep it permanently saved in this tab across searches.
    </p>
    <button
      type="button"
      onClick={onBrowse}
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#171F2C] border border-[#283548] px-4 py-2.5 text-sm font-bold text-slate-200 hover:border-cyan-500/50 hover:text-white transition-colors cursor-pointer"
    >
      <Search className="h-4 w-4 text-cyan-400" /> Browse Live Search Results
    </button>
  </div>
);

const JobCard = ({ job, active, onSelect, onToggleSave, onOpenPack, updatingState }) => {
  const shouldReduceMotion = useReducedMotion();
  const score = job.job_health?.role_health_score ?? 100;
  const isSaved = job.user_state === 'saved';

  const ghostRisk = job.job_health?.ghost_job_risk || 'Low';
  const isGhostHigh = ghostRisk === 'High';
  const isGhostMod = ghostRisk === 'Moderate';

  const redFlags = job.job_health?.red_flags || [];
  const techCount = job.job_health?.detected_tech_count ?? 0;
  const isTechOverload = techCount >= 10 || redFlags.some((f) => /overload|sprawl/i.test(f));
  const burnoutPatterns = /burnout|crunch|weekend|hats|rockstar|ninja|wizard|guru|24\/7|urgent/i;
  const burnoutFlags = redFlags.filter((f) => burnoutPatterns.test(f));

  return (
    <StudioCard
      interactive
      hoverLift={!shouldReduceMotion}
      onClick={onSelect}
      className={cn(
        'p-5 transition-all duration-200',
        active
          ? 'border-cyan-500/60 bg-[#171F2C] shadow-[0_0_20px_-3px_rgba(6,182,212,0.25)]'
          : 'bg-[#0F141C] border border-[#1F2937] hover:border-cyan-500/40'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RoleHealthScoreBadge score={score} verdict={job.job_health?.health_verdict} size="xs" />
            {isSaved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                <Bookmark className="h-3 w-3 fill-cyan-400 text-cyan-400" /> Saved
              </span>
            )}
            {job.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Live Listing
              </span>
            )}
          </div>

          <h3 className="mt-2.5 text-base font-bold text-slate-100 truncate">{job.title}</h3>
          <p className="mt-0.5 text-sm font-medium text-slate-400">{job.company}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleSave(job)}
            disabled={updatingState}
            className={cn(
              'rounded-xl p-2 transition-colors cursor-pointer border',
              isSaved
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                : 'border-[#1F2937] bg-[#171F2C] text-slate-400 hover:text-slate-200 hover:border-slate-600'
            )}
            title={isSaved ? 'Unsave job' : 'Save job'}
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
          >
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-cyan-400 text-cyan-400')} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {isGhostHigh && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
            <AlertTriangle className="h-3 w-3 text-rose-400" /> Ghost Risk: High
          </span>
        )}
        {isGhostMod && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="h-3 w-3 text-amber-400" /> Ghost Risk: Moderate
          </span>
        )}
        {isTechOverload && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
            <AlertTriangle className="h-3 w-3 text-rose-400" /> Tech Overload ({techCount})
          </span>
        )}
        {burnoutFlags.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
            <Flame className="h-3 w-3 text-rose-400" /> Burnout ({burnoutFlags.length})
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 border-t border-[#1F2937]/70 pt-3">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-slate-500" />
          {job.location || 'Location not specified'}
        </span>
        {job.employment_type && (
          <span className="flex items-center gap-1">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-500" />
            {job.employment_type}
          </span>
        )}
      </div>

      <div
        className="mt-4 flex items-center justify-between gap-2 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#171F2C] border border-[#283548] px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:border-cyan-500/50 hover:bg-[#1F2937] transition-colors cursor-pointer"
        >
          <Gauge className="h-3.5 w-3.5 text-cyan-400" />
          <span>Inspect Reality</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenPack(job)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:border-slate-500 transition-colors cursor-pointer"
          title="1-Click Complete Application Pack"
        >
          <span>📦 Pack</span>
        </button>
      </div>
    </StudioCard>
  );
};

const JobInspectorContent = ({
  job,
  match,
  saving,
  updatingState,
  matching,
  onSave,
  onToggleSave,
  onDismissJob,
  onCheckMatch,
  onOpenPack,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  if (!job) return null;

  const isSaved = job.user_state === 'saved';

  return (
    <article className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1 rounded-lg border border-[#283548] bg-[#171F2C] px-2.5 py-1 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex items-center gap-1 rounded-lg border border-[#283548] bg-[#171F2C] px-2.5 py-1 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[#283548] bg-[#171F2C] p-2 text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
          aria-label="Close inspector drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RoleHealthScoreBadge
              score={job.job_health?.role_health_score ?? 100}
              verdict={job.job_health?.health_verdict}
              size="sm"
            />
            {job.verification_status === 'verified' && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                Live Listing Active
              </span>
            )}
            {isSaved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                <Bookmark className="h-3 w-3 fill-cyan-400 text-cyan-400" /> Saved for Later
              </span>
            )}
            {job.source && <span className="text-xs text-slate-400">via {job.source}</span>}
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-100">{job.title}</h2>
          <p className="mt-1 text-base font-semibold text-slate-300">{job.company}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StudioButton
            variant="primary"
            size="sm"
            onClick={() => onOpenPack(job)}
            title="1-Click Complete Application Pack (ATS Resume, Cover Letter, Multi-Channel Outreach Toolkit)"
            aria-label="Open 1-Click Complete Application Pack"
          >
            📦 Application Pack
          </StudioButton>

          {job.id && (
            <button
              type="button"
              onClick={() => onToggleSave(job)}
              disabled={updatingState}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                isSaved
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                  : 'border-[#283548] bg-[#171F2C] text-slate-300 hover:border-slate-600'
              )}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-cyan-400 text-cyan-400')} />
              <span>{isSaved ? 'Saved' : 'Save job'}</span>
            </button>
          )}

          {job.id && (
            <button
              type="button"
              onClick={() => onDismissJob(job)}
              disabled={updatingState}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#283548] bg-[#171F2C] px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors cursor-pointer"
              aria-label="Dismiss job"
            >
              <X className="h-3.5 w-3.5" />
              <span>Dismiss</span>
            </button>
          )}

          {job.id && (
            <button
              type="button"
              onClick={() => onSave(job)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-105 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{saving ? 'Saving…' : 'Save to applications'}</span>
            </button>
          )}

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#283548] bg-[#171F2C] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-white transition-colors"
            >
              <span>View listing</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#283548] bg-[#171F2C] px-3 py-1.5">
          <MapPin className="h-3.5 w-3.5 text-cyan-400" /> {job.location || 'Not specified'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#283548] bg-[#171F2C] px-3 py-1.5">
          <BriefcaseBusiness className="h-3.5 w-3.5 text-emerald-400" /> {job.employment_type || 'Type not specified'}
        </span>
      </div>

      {job.job_health && <RoleHealthCard health={job.job_health} />}

      <div className="rounded-2xl border border-[#283548] bg-[#171F2C] p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100">Job description</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {job.description ||
            'The provider did not return a full description. Review the original listing before applying.'}
        </p>
      </div>

      <div className="rounded-2xl border border-[#283548] bg-[#171F2C] p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-100">Explainable resume match</p>
            <p className="mt-1 text-xs text-slate-400">
              Uses your latest resume and shows the evidence behind the result.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCheckMatch(job)}
            disabled={!job.id || matching}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-105 disabled:opacity-50 cursor-pointer"
          >
            {matching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{matching ? 'Checking…' : 'Check my match'}</span>
          </button>
        </div>
        {match && <MatchSummary match={match} jobId={job.id} />}
      </div>
    </article>
  );
};

const SearchJobs = () => {
  const shouldReduceMotion = useReducedMotion();
  const [form, setForm] = useState({ query: '', location: 'India', employment_type: 'full-time' });
  const [searchResults, setSearchResults] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'saved'
  const [healthFilter, setHealthFilter] = useState('all'); // 'all' | 'healthy' | 'caution'
  const [selectedJob, setSelectedJob] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [matchingJobId, setMatchingJobId] = useState(null);
  const [matchesByJob, setMatchesByJob] = useState({});
  const [packTarget, setPackTarget] = useState(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isSubmittingCustomJob, setIsSubmittingCustomJob] = useState(false);
  const [customJobForm, setCustomJobForm] = useState({
    title: '',
    company: '',
    location: 'Remote',
    description: '',
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isPasteModalOpen) {
        setIsPasteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPasteModalOpen]);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const [feedJobs, persistentSaved, profile] = await Promise.all([
          getAllJobs(),
          getSavedJobs(),
          getCandidateProfile(),
        ]);
        if (!active) return;
        setSearchResults(feedJobs);
        setSavedJobs(persistentSaved);
        setSelectedJob(feedJobs[0] || persistentSaved[0] || null);
        setForm({
          query: profile.target_roles?.[0] || '',
          location: profile.preferred_locations?.[0] || 'India',
          employment_type: profile.employment_types?.[0] || 'full-time',
        });
      } catch {
        if (active) setMessage('Workspace jobs could not be loaded. You can still try a new search.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  const updateForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!form.query.trim()) return;

    setSearching(true);
    setMessage('');
    setWarnings([]);

    try {
      const result = await discoverJobs(form);
      setSearchResults(result.jobs);
      setActiveTab('search');
      const filtered = filterJobsByHealth(result.jobs, healthFilter);
      setSelectedJob(filtered[0] || null);
      setWarnings(result.warnings || []);

      if (result.jobs.length === 0) {
        setMessage('No current fresher job pages matched this search. Try a broader role or location.');
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Job search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handlePasteJobSubmit = async (event) => {
    event.preventDefault();
    const description = customJobForm.description.trim();
    if (!description) return;

    setIsSubmittingCustomJob(true);
    setMessage('');
    try {
      const createdJob = await addCustomJob({
        title: customJobForm.title.trim() || undefined,
        company: customJobForm.company.trim() || undefined,
        location: customJobForm.location.trim() || 'Remote',
        description,
      });

      setSearchResults((prev) => [createdJob, ...prev]);
      setSavedJobs((prev) => applySavedJobState(prev, createdJob));
      setHealthFilter('all');
      setSelectedJob(createdJob);
      setIsInspectorOpen(true);
      setIsPasteModalOpen(false);
      setCustomJobForm({
        title: '',
        company: '',
        location: 'Remote',
        description: '',
      });

      const score = createdJob.job_health?.role_health_score;
      const verdict = createdJob.job_health?.health_verdict;
      if (score !== undefined) {
        setMessage(`Job "${createdJob.title}" analyzed! Role Health Score: ${score}/100 (${verdict || 'Audited'}).`);
      } else {
        setMessage(`Job "${createdJob.title}" added to your workspace.`);
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || error.message || 'Failed to analyze and save job.');
    } finally {
      setIsSubmittingCustomJob(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const targetBase = tab === 'saved' ? savedJobs : searchResults;
    const targetList = filterJobsByHealth(targetBase, healthFilter);
    setSelectedJob(targetList[0] || null);
  };

  const handleHealthFilterChange = (filter) => {
    setHealthFilter(filter);
    const targetBase = activeTab === 'saved' ? savedJobs : searchResults;
    const targetList = filterJobsByHealth(targetBase, filter);
    if (!targetList.some((j) => (j.id || j.url) === (selectedJob?.id || selectedJob?.url))) {
      setSelectedJob(targetList[0] || null);
    }
  };

  const addToApplications = async (job) => {
    setSavingJobId(job.id);
    setMessage('');
    try {
      await createApplication(job.id);
      setMessage(`${job.title} was added to Applications as Saved.`);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'This job could not be added to Applications.');
    } finally {
      setSavingJobId(null);
    }
  };

  const checkMatch = async (job) => {
    setMatchingJobId(job.id);
    setMessage('');
    try {
      const result = await analyzeJobMatch(job.id);
      setMatchesByJob((current) => ({ ...current, [job.id]: result }));
    } catch (matchError) {
      setMessage(matchError.response?.data?.detail || 'This match could not be analyzed.');
    } finally {
      setMatchingJobId(null);
    }
  };

  const handleToggleSave = async (job) => {
    setUpdatingJobId(job.id);
    setMessage('');
    const isSaved = job.user_state === 'saved';

    try {
      const updated = isSaved ? await unsaveJob(job.id) : await saveJob(job.id);

      const nextSearch = applyJobState(searchResults, updated);
      const nextSaved = applySavedJobState(savedJobs, updated);

      setSearchResults(nextSearch);
      setSavedJobs(nextSaved);

      if (activeTab === 'saved' && isSaved) {
        const nextBase = nextSaved;
        const nextFiltered = filterJobsByHealth(nextBase, healthFilter);
        setSelectedJob(nextFiltered[0] || null);
      } else {
        setSelectedJob(updated);
      }

      setMessage(
        isSaved
          ? `${job.title} removed from Saved jobs.`
          : `${job.title} saved for later.`
      );
    } catch (stateError) {
      setMessage(stateError.response?.data?.detail || 'The job state could not be updated.');
    } finally {
      setUpdatingJobId(null);
    }
  };

  const handleDismissJob = async (job) => {
    setUpdatingJobId(job.id);
    setMessage('');
    try {
      const updated = await dismissJob(job.id);

      const nextSearch = applyJobState(searchResults, updated);
      const nextSaved = applySavedJobState(savedJobs, updated);

      setSearchResults(nextSearch);
      setSavedJobs(nextSaved);

      const currentBase = activeTab === 'saved' ? nextSaved : nextSearch;
      const currentList = filterJobsByHealth(currentBase, healthFilter);
      setSelectedJob(currentList[0] || null);

      setMessage(`${job.title} was removed from this workspace.`);
    } catch (stateError) {
      setMessage(stateError.response?.data?.detail || 'The job workspace could not be updated.');
    } finally {
      setUpdatingJobId(null);
    }
  };

  const baseJobs = activeTab === 'saved' ? savedJobs : searchResults;
  const allCount = baseJobs.length;
  const healthyCount = filterJobsByHealth(baseJobs, 'healthy').length;
  const cautionCount = filterJobsByHealth(baseJobs, 'caution').length;
  const displayedJobs = filterJobsByHealth(baseJobs, healthFilter);

  const selectedIndex = displayedJobs.findIndex(
    (j) => (j.id || j.url) === (selectedJob?.id || selectedJob?.url)
  );
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < displayedJobs.length - 1;

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setIsInspectorOpen(true);
  };

  const handlePrev = () => {
    if (hasPrev) setSelectedJob(displayedJobs[selectedIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) setSelectedJob(displayedJobs[selectedIndex + 1]);
  };

  const healthFilterOptions = useMemo(
    () => [
      { id: 'all', label: 'All', count: allCount },
      { id: 'healthy', label: 'Healthy Roles ≥ 70', count: healthyCount, icon: ShieldCheck },
      { id: 'caution', label: 'Cautions Only', count: cautionCount, icon: AlertTriangle },
    ],
    [allCount, healthyCount, cautionCount]
  );

  return (
    <div className="space-y-8 text-slate-100">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              Hero Suite 03 · Reality Auditor
            </span>
          </div>
          <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
            Find jobs worth applying to
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Dual SerpAPI &amp; Tavily discovery with real-time tech stack audits, ghost-job risk detection, and burnout warning radar before you apply.
          </p>
        </div>

        <StudioButton
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsPasteModalOpen(true)}
          className="shrink-0"
        >
          Paste &amp; Analyze Any Job
        </StudioButton>
      </header>

      {/* Dark Studio Search Bar with luminescent query focus */}
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-[#1F2937] bg-[#0F141C] p-4 sm:p-5 shadow-2xl"
      >
        <div className="grid gap-3.5 lg:grid-cols-[1.5fr_0.8fr_0.65fr_auto]">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300">Role or skills</span>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                name="query"
                value={form.query}
                onChange={updateForm}
                placeholder="Python backend developer"
                className="h-11 w-full rounded-xl border border-[#283548] bg-[#171F2C] pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
              />
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300">Location</span>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                name="location"
                value={form.location}
                onChange={updateForm}
                placeholder="Bengaluru or India"
                className="h-11 w-full rounded-xl border border-[#283548] bg-[#171F2C] pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
              />
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300">Type</span>
            <select
              name="employment_type"
              value={form.employment_type}
              onChange={updateForm}
              className="h-11 w-full rounded-xl border border-[#283548] bg-[#171F2C] px-3.5 text-sm text-slate-100 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <option value="full-time" className="bg-[#171F2C] text-slate-100">Full-time</option>
              <option value="internship" className="bg-[#171F2C] text-slate-100">Internship</option>
              <option value="contract" className="bg-[#171F2C] text-slate-100">Contract</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={!form.query.trim() || searching}
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>{searching ? 'Filtering…' : 'Search jobs'}</span>
          </button>
        </div>
      </form>

      {warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
        >
          {warning}
        </div>
      ))}

      {message && (
        <div className="rounded-xl border border-[#283548] bg-[#171F2C] px-4 py-3 text-sm text-slate-300 shadow-md">
          {message}
        </div>
      )}

      {/* Dedicated Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F2937] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('search')}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer',
              activeTab === 'search'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            )}
          >
            <Search className="h-4 w-4" />
            <span>Live Search Results</span>
            {searchResults.length > 0 && (
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-200">
                {searchResults.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('saved')}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer',
              activeTab === 'saved'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            )}
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved for Later</span>
            <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-200">
              {savedJobs.length}
            </span>
          </button>
        </div>

        {/* Animated Health Filter Tabs (layoutId="job-health-filter-pill") */}
        <div
          role="tablist"
          aria-label="Role health filter"
          className="flex items-center gap-1.5 rounded-2xl border border-[#1F2937] bg-[#0F141C] p-1 shadow-inner"
        >
          {healthFilterOptions.map((filter) => {
            const isSelected = healthFilter === filter.id;
            const FilterIcon = filter.icon;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleHealthFilterChange(filter.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 outline-none select-none cursor-pointer',
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {isSelected && (
                  <MotionDiv
                    layoutId="job-health-filter-pill"
                    className={cn(
                      'absolute inset-0 rounded-xl border shadow-sm',
                      filter.id === 'healthy'
                        ? 'bg-emerald-500/20 border-emerald-500/40 shadow-emerald-500/10'
                        : filter.id === 'caution'
                        ? 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/10'
                        : 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/40 shadow-cyan-500/10'
                    )}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 380, damping: 28 }
                    }
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {FilterIcon && <FilterIcon className="h-3.5 w-3.5" />}
                  <span>{filter.label}</span>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.2 text-[10px] font-bold',
                      isSelected ? 'bg-white/15 text-white' : 'bg-[#1F2937] text-slate-400'
                    )}
                  >
                    {filter.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-72 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      ) : baseJobs.length === 0 ? (
        activeTab === 'saved' ? (
          <EmptySavedState onBrowse={() => handleTabChange('search')} />
        ) : (
          <EmptySearchState />
        )
      ) : displayedJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#283548] bg-[#0F141C] p-10 text-center text-sm text-slate-400">
          No roles match the selected filter ({healthFilter === 'healthy' ? 'Healthy Roles ≥ 70' : 'Cautions Only'}).
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedJobs.map((job) => (
            <JobCard
              key={job.id || job.url}
              job={job}
              active={(selectedJob?.id || selectedJob?.url) === (job.id || job.url)}
              onSelect={() => handleSelectJob(job)}
              onToggleSave={handleToggleSave}
              onOpenPack={(j) => setPackTarget(j)}
              updatingState={updatingJobId === job.id}
            />
          ))}
        </div>
      )}

      {/* Slide-out Job Details Inspector Drawer wrapped in AnimatePresence */}
      <StudioMotionDrawer
        isOpen={isInspectorOpen && Boolean(selectedJob)}
        onClose={() => setIsInspectorOpen(false)}
        size="xl"
        className="sm:max-w-2xl lg:max-w-3xl"
        showClose={false}
      >
        {selectedJob && (
          <JobInspectorContent
            job={selectedJob}
            match={matchesByJob[selectedJob.id]}
            saving={savingJobId === selectedJob.id}
            updatingState={updatingJobId === selectedJob.id}
            matching={matchingJobId === selectedJob.id}
            onSave={addToApplications}
            onToggleSave={handleToggleSave}
            onDismissJob={handleDismissJob}
            onCheckMatch={checkMatch}
            onOpenPack={(j) => setPackTarget(j)}
            onClose={() => setIsInspectorOpen(false)}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        )}
      </StudioMotionDrawer>

      {/* Application Pack Modal wrapped in AnimatePresence */}
      <AnimatePresence>
        {packTarget && (
          <MotionDiv
            key="application-pack-modal-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ApplicationPackModal
              job={packTarget}
              onClose={() => setPackTarget(null)}
            />
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Universal Paste & Analyze Any Job Modal wrapped in AnimatePresence */}
      <AnimatePresence>
        {isPasteModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paste-job-modal-title"
          >
            {/* Backdrop */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsPasteModalOpen(false)}
              aria-hidden="true"
            />

            {/* Modal Dialog */}
            <MotionDiv
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }
              }
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }
              }
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-xl rounded-2xl border border-[#283548] bg-[#0F141C] p-6 text-slate-100 shadow-2xl sm:p-7 z-10"
            >
              <div className="flex items-start justify-between border-b border-[#1F2937] pb-4">
                <div>
                  <h2 id="paste-job-modal-title" className="text-lg font-black text-slate-100">
                    Paste &amp; Analyze Any Job
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Paste any job description to run an instant 100-point ATS match &amp; Job Reality Red Flag Audit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePasteJobSubmit} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-300">Role Title</span>
                    <input
                      type="text"
                      value={customJobForm.title}
                      onChange={(e) =>
                        setCustomJobForm({ ...customJobForm, title: e.target.value })
                      }
                      placeholder="e.g. Junior Backend Engineer"
                      className="h-10 w-full rounded-xl border border-[#283548] bg-[#171F2C] px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-300">Company</span>
                    <input
                      type="text"
                      value={customJobForm.company}
                      onChange={(e) =>
                        setCustomJobForm({ ...customJobForm, company: e.target.value })
                      }
                      placeholder="e.g. Acme Health"
                      className="h-10 w-full rounded-xl border border-[#283548] bg-[#171F2C] px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">Location</span>
                  <input
                    type="text"
                    value={customJobForm.location}
                    onChange={(e) =>
                      setCustomJobForm({ ...customJobForm, location: e.target.value })
                    }
                    placeholder="e.g. Remote or Bengaluru"
                    className="h-10 w-full rounded-xl border border-[#283548] bg-[#171F2C] px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">
                    Job Description <span className="text-rose-400">*</span>
                  </span>
                  <textarea
                    rows={6}
                    required
                    value={customJobForm.description}
                    onChange={(e) =>
                      setCustomJobForm({ ...customJobForm, description: e.target.value })
                    }
                    placeholder="Paste raw JD text, requirements, or responsibilities here..."
                    className="w-full rounded-xl border border-[#283548] bg-[#171F2C] p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>

                <div className="flex items-center justify-end gap-3 border-t border-[#1F2937] pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPasteModalOpen(false)}
                    className="rounded-xl border border-[#283548] px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customJobForm.description.trim() || isSubmittingCustomJob}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer"
                  >
                    {isSubmittingCustomJob ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{isSubmittingCustomJob ? 'Auditing role...' : 'Analyze & Save Job'}</span>
                  </button>
                </div>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchJobs;
