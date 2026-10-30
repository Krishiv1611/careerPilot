import { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  FileCheck2,
  FileUser,
  FileText,
  ListChecks,
  Loader2,
  RefreshCw,
  Sprout,
  Eye,
  Shield,
  Gauge,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import { getToday } from '../services/api';
import { StudioCard, StudioBadge } from '../components/studio/StudioPrimitives';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;
const MotionSection = motion.section;

const actionIcons = {
  add_resume: FileUser,
  find_jobs: BriefcaseBusiness,
  review_job: BriefcaseBusiness,
  resume_review: FileCheck2,
  follow_up_due: ListChecks,
  deadline_due: ListChecks,
  application_action: ListChecks,
  growth_review: Sprout,
};

const actionUrgencyStyles = {
  high: {
    badge: 'amber',
    label: 'Critical Timeline',
  },
  normal: {
    badge: 'cyan',
    label: 'Recommended Move',
  },
};

const heroTools = [
  {
    id: 'reality-auditor',
    eyebrow: 'Hero Suite 03',
    title: 'Reality Auditor',
    badge: '0-100 Health',
    badgeVariant: 'cyan',
    accent: 'cyan',
    icon: Gauge,
    description: 'Ghost-job detector and telemetry-backed role health scoring before you apply.',
    path: '/jobs',
    action: 'Audit Job Reality',
    cardGlow: 'cyan',
    iconBorder: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    glowHover: 'hover:border-cyan-500/50 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]',
  },
  {
    id: 'recruiter-xray',
    eyebrow: 'Hero Suite 01',
    title: 'Recruiter X-Ray',
    badge: '6-Sec Heatmap',
    badgeVariant: 'emerald',
    accent: 'emerald',
    icon: Eye,
    description: 'Eye-tracking F-pattern simulation and instant fluff stripping for maximum interview conversion.',
    path: '/profile/tailor',
    action: 'Launch 6-Sec X-Ray',
    cardGlow: 'emerald',
    iconBorder: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    glowHover: 'hover:border-emerald-500/50 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]',
  },
  {
    id: 'defense-matrix',
    eyebrow: 'Hero Suite 02',
    title: 'Defense Matrix',
    badge: 'SQL & STAR Plan',
    badgeVariant: 'neutral',
    accent: 'purple',
    icon: Shield,
    description: 'Real EXPLAIN ANALYZE SQL query plans and STAR technical stress-testing on verified claims.',
    path: '/applications',
    action: 'Run Defense Matrix',
    cardGlow: null,
    iconBorder: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    glowHover: 'hover:border-purple-500/50 hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.25)]',
  },
  {
    id: 'autopsy-drawer',
    eyebrow: 'Hero Suite 04',
    title: 'Autopsy Drawer',
    badge: 'Root-Cause Matrix',
    badgeVariant: 'amber',
    accent: 'amber',
    icon: Activity,
    description: 'Diagnostic post-mortems on rejections with counterfactual career pivots and skill fix plans.',
    path: '/applications',
    action: 'Inspect Autopsies',
    cardGlow: 'amber',
    iconBorder: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    glowHover: 'hover:border-amber-500/50 hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]',
  },
];

const Home = () => {
  const { user } = useAuth();
  const [today, setToday] = useState({
    action: null,
    counts: { resumes: 0, jobs: 0, applications: 0, resume_drafts: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const shouldReduceMotion = useReducedMotion();

  const handleRefresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const loadToday = async () => {
      if (reloadKey > 0) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setWarning('');

      try {
        const result = await getToday();
        if (active) setToday(result);
      } catch {
        if (active) setWarning('Your next action could not be loaded. Try refreshing the workspace.');
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadToday();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center" role="status" aria-label="Loading workspace telemetry">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400/20 animate-ping" />
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
          <p className="font-mono text-xs text-slate-400 tracking-wider">SYNCING STUDIO TELEMETRY...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const nextAction = today.action;
  const NextIcon = actionIcons[nextAction?.kind] || ListChecks;
  const urgencyConfig = actionUrgencyStyles[nextAction?.urgency] || actionUrgencyStyles.normal;

  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            staggerChildren: 0.06,
            delayChildren: 0.03,
          },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 350, damping: 25 },
    },
  };

  return (
    <MotionDiv
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Studio Telemetry Bar & Header */}
      <MotionSection variants={itemVariants} className="space-y-4">
        {/* Telemetry Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#0F141C] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75',
                    !shouldReduceMotion && 'animate-ping'
                  )}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              COMMAND TELEMETRY ACTIVE
            </span>
            <span className="hidden text-slate-700 sm:inline">•</span>
            <span className="font-mono text-xs text-slate-400">{todayLabel}</span>
            <span className="hidden text-slate-700 md:inline">•</span>
            <span className="hidden font-mono text-xs text-slate-500 md:inline">STUDIO ENGINE SYNCED</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#171F2C] px-3.5 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:border-slate-600 hover:bg-[#1F2937] hover:text-white cursor-pointer select-none"
            aria-label="Refresh workspace"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Greeting Banner */}
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Mission Control
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {firstName ? `${firstName}, here's your next move.` : "Here's your next move."}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            A focused workspace for evidence, relevant jobs, and application follow-through.
          </p>
        </div>
      </MotionSection>

      {/* Warning State */}
      {warning && (
        <MotionDiv
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <span className="flex-1 font-medium">{warning}</span>
        </MotionDiv>
      )}

      {/* Live Workspace Metric Cards */}
      <MotionSection
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Workspace totals"
      >
        <Metric
          label="Resumes"
          value={today.counts.resumes}
          helper={`${today.counts.resume_drafts} waiting drafts`}
          icon={FileText}
          accent="cyan"
          to="/profile"
          status={today.counts.resume_drafts > 0 ? 'Drafts Pending' : 'Synchronized'}
        />
        <Metric
          label="Jobs available"
          value={today.counts.jobs}
          helper="Your workspace only"
          icon={BriefcaseBusiness}
          accent="emerald"
          to="/jobs"
          status="Active Feed"
        />
        <Metric
          label="Applications"
          value={today.counts.applications}
          helper="Explicit records"
          icon={ListChecks}
          accent="purple"
          to="/applications"
          status="In Pipeline"
        />
      </MotionSection>

      {/* Elevated Next-Move Mission Console Card */}
      <MotionSection variants={itemVariants}>
        {nextAction ? (
          <section
            className="relative overflow-hidden rounded-3xl border border-[#283548] bg-[#0F141C] shadow-2xl transition-all duration-300 hover:border-slate-700"
            aria-label="Active Mission"
          >
            {/* Glowing Accent Border Line */}
            <div className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="grid lg:grid-cols-[1.3fr_0.7fr]">
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StudioBadge
                      variant={urgencyConfig.badge}
                      pulse={nextAction.urgency === 'high'}
                      size="sm"
                    >
                      {urgencyConfig.label}
                    </StudioBadge>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {nextAction.eyebrow}
                    </span>
                  </div>

                  <h2 className="mt-4 max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                    {nextAction.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    {nextAction.description}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to={nextAction.path}
                    className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-150 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-cyan-500/25 active:scale-[0.98]"
                  >
                    <span>{nextAction.action}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="font-mono text-xs text-slate-500">
                    Route: <span className="text-slate-400">{nextAction.path}</span>
                  </span>
                </div>
              </div>

              <div className="grid min-h-[220px] place-items-center border-t border-[#1F2937] bg-[#0A0E14]/80 p-8 lg:border-l lg:border-t-0">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative grid h-28 w-28 place-items-center rounded-3xl border border-cyan-500/30 bg-[#0F141C] shadow-[0_0_35px_-5px_rgba(6,182,212,0.25)] transition-transform duration-300 hover:scale-105">
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-transparent" />
                    <NextIcon className="h-12 w-12 text-cyan-400" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                      Engine Action: <span className="text-cyan-300">{nextAction.kind.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-xs text-slate-500">Telemetry Linked</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0F141C] p-8 text-center">
            <p className="text-sm text-slate-400">Refresh to load your evidence-based next action.</p>
          </section>
        )}
      </MotionSection>

      {/* Studio Hero Suite: 4 Quick-Launch Tools */}
      <MotionSection variants={itemVariants} className="space-y-4" aria-label="Hero studio engines">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Studio Hero Suite
              </p>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Specialized Intelligence Engines
            </h2>
          </div>
          <p className="text-xs text-slate-400">Direct sandbox access to all 4 intelligence modules</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <StudioCard
                key={tool.id}
                className={cn(
                  'group flex flex-col justify-between p-5 border-[#1F2937] bg-[#0F141C] transition-all duration-200',
                  tool.glowHover
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={cn('grid h-10 w-10 place-items-center rounded-xl border', tool.iconBorder)}>
                      <ToolIcon className="h-5 w-5" />
                    </div>
                    {tool.accent === 'purple' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-300 select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        {tool.badge}
                      </span>
                    ) : (
                      <StudioBadge variant={tool.badgeVariant} size="xs" pulse={false}>
                        {tool.badge}
                      </StudioBadge>
                    )}
                  </div>

                  <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {tool.eyebrow}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-white transition-colors group-hover:text-slate-100">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#1F2937]/80 pt-4">
                  <Link
                    to={tool.path}
                    className="inline-flex w-full items-center justify-between text-xs font-semibold text-slate-300 transition-colors group-hover:text-white"
                  >
                    <span>{tool.action}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                </div>
              </StudioCard>
            );
          })}
        </div>
      </MotionSection>

      {/* Studio Operating Principles */}
      <MotionSection
        variants={itemVariants}
        className="grid gap-4 lg:grid-cols-2"
        aria-label="Studio Operating Principles"
      >
        <StudioCard className="border-[#1F2937] bg-[#0F141C] p-6">
          <div className="flex items-center justify-between">
            <StudioBadge variant="emerald" size="xs">
              Trust Protocol
            </StudioBadge>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">Analysis is not an application</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            CareerPilot creates an application only after you confirm it. Generated suggestions remain drafts until you approve them.
          </p>
        </StudioCard>

        <StudioCard className="border-[#1F2937] bg-[#0F141C] p-6">
          <div className="flex items-center justify-between">
            <StudioBadge variant="cyan" size="xs">
              Evidence Protocol
            </StudioBadge>
            <Shield className="h-4 w-4 text-cyan-400" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">No invented resume claims</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Future resume changes will point back to your resume, GitHub, or an answer you personally confirmed.
          </p>
        </StudioCard>
      </MotionSection>
    </MotionDiv>
  );
};

const Metric = ({ label, value, helper, icon: Icon, accent = 'cyan', to = '#', status = '' }) => {
  const accentBorderStyles = {
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]',
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]',
    purple: 'hover:border-purple-500/40 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]',
  };

  const iconStyles = {
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
  };

  return (
    <StudioCard
      className={cn(
        'group border-[#1F2937] bg-[#0F141C] p-5 transition-all duration-200',
        accentBorderStyles[accent]
      )}
    >
      <Link to={to} className="block">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            {label}
          </p>
          {Icon && (
            <div className={cn('grid h-8 w-8 place-items-center rounded-lg border', iconStyles[accent])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-2">
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
          {status && (
            <span className="font-mono text-[10px] text-slate-400">
              {status}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[#1F2937]/60 pt-2">
          <p className="text-xs text-slate-400">{helper}</p>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-slate-300" />
        </div>
      </Link>
    </StudioCard>
  );
};

export default Home;
