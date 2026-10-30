import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Eye,
  Flame,
  Code2,
  AlertTriangle,
  Sparkles,
  Copy,
  CheckCheck,
  Search,
  Github,
  FileText,
  Linkedin,
  Mail,
  GraduationCap,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import {
  StudioCard,
  StudioBadge,
  StudioButton,
} from '../components/studio/StudioPrimitives';

const MotionDiv = motion.div;
const MotionSection = motion.section;

// ============================================================================
// ENGINE 1: 6-SECOND RECRUITER X-RAY & F-PATTERN HEATMAP
// ============================================================================

function XRayEngine({ shouldReduceMotion }) {
  const [remediated, setRemediated] = useState(false);
  const [activeGazePoint, setActiveGazePoint] = useState(null);

  return (
    <div className="space-y-6">
      {/* Controls & Metric Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <StudioBadge variant={remediated ? 'emerald' : 'amber'} size="xs">
              {remediated ? 'High-Density Remediation Active' : 'Unoptimized Fluff State'}
            </StudioBadge>
            <span className="text-xs text-slate-400 font-mono">Cognitive Gaze Telemetry</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Recruiters scan in an F-pattern for 6 seconds. Vague words trigger instant drop-off.
          </p>
        </div>

        <StudioButton
          variant={remediated ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setRemediated((prev) => !prev)}
          icon={Sparkles}
        >
          {remediated ? 'Reset to Raw Resume' : '1-Click Fluff Auto-Remediator'}
        </StudioButton>
      </div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recruiter Dwell</p>
          <p className="mt-1 text-lg font-black font-mono text-white">
            {remediated ? '7.4s' : '2.1s'}
          </p>
          <p className={`text-[10px] font-semibold ${remediated ? 'text-emerald-400' : 'text-rose-400'}`}>
            {remediated ? '+252% retention' : 'Immediate drop-off'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signal-To-Fluff</p>
          <p className="mt-1 text-lg font-black font-mono text-white">
            {remediated ? '96%' : '34%'}
          </p>
          <p className={`text-[10px] font-semibold ${remediated ? 'text-emerald-400' : 'text-amber-400'}`}>
            {remediated ? 'Zero unverified claims' : '3 generic buzzwords'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">F-Pattern Anchors</p>
          <p className="mt-1 text-lg font-black font-mono text-white">
            {remediated ? '3 Anchors' : '0 Anchors'}
          </p>
          <p className={`text-[10px] font-semibold ${remediated ? 'text-emerald-400' : 'text-slate-500'}`}>
            {remediated ? 'Metrics at lead-in' : 'Adjectives at lead-in'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Callback Odds</p>
          <p className="mt-1 text-lg font-black font-mono text-white">
            {remediated ? '4.8x' : '1.0x'}
          </p>
          <p className={`text-[10px] font-semibold ${remediated ? 'text-emerald-400' : 'text-slate-500'}`}>
            {remediated ? 'High hiring intent' : 'Baseline average'}
          </p>
        </div>
      </div>

      {/* Heatmap Simulation View */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080B0F] border border-slate-800/80 relative overflow-hidden">
        {/* Heatmap overlay markers */}
        <div className="flex items-center justify-between mb-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full bg-rose-500 ${!shouldReduceMotion ? 'animate-pulse' : ''}`} /> High Gaze Intensity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Secondary Scan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600" /> Cold / Ignored Zone
            </span>
          </div>
          {activeGazePoint ? (
            <span className="text-[11px] font-mono text-cyan-300 font-semibold">
              Gaze Lock: Bullet {activeGazePoint} (Anchor engaged)
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
              Simulated Gaze: F-Pattern Track
            </span>
          )}
        </div>

        {/* Resume Snippet with Heatmap Highlights */}
        <div className="space-y-4 text-xs font-mono">
          {/* Header Bar: Eye-tracking horizontal top sweep */}
          <div className="p-3 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-transparent relative">
            <div className="flex items-center justify-between text-slate-200 font-sans font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Backend Engineering Lead &amp; Distributed Systems Builder</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                1.4s Dwell (Top Horizontal Sweep)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-sans">
              Python - FastAPI - PostgreSQL - Redis - Docker - Linux Kernel Telemetry
            </p>
          </div>

          {/* Bullet 1: Primary F-Pattern Anchor */}
          <div
            onMouseEnter={() => setActiveGazePoint(1)}
            onMouseLeave={() => setActiveGazePoint(null)}
            className={`p-3.5 rounded-xl border transition-all ${
              remediated
                ? 'border-emerald-500/40 bg-gradient-to-r from-rose-500/20 via-emerald-500/10 to-transparent'
                : 'border-slate-800 bg-[#0B0F15]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${remediated ? 'bg-rose-400' : 'bg-slate-600'}`} />
                <div>
                  {remediated ? (
                    <p className="text-slate-100 font-sans text-xs leading-relaxed">
                      <strong className="text-cyan-300 font-semibold font-mono">Architected PostgreSQL composite indexing</strong>{' '}
                      with <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-300 text-[11px]">EXPLAIN ANALYZE</code> profiling,{' '}
                      slashing p95 query latency by <strong className="text-emerald-400 font-bold">42%</strong> across{' '}
                      <strong className="text-slate-200">1.2M daily transactions</strong>.
                    </p>
                  ) : (
                    <p className="text-slate-400 font-sans text-xs leading-relaxed">
                      <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Helped team</span>{' '}
                      build backend databases and{' '}
                      <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">improved query speeds</span>{' '}
                      to make the web application run faster for users.
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    {remediated ? (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Quantified Result: -42% p95
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          Technical Hook: EXPLAIN ANALYZE
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          Fluff: Vague verb &quot;Helped&quot;
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Zero Architectural Evidence
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0 ${remediated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                {remediated ? '2.8s Gaze Hold' : '0.4s Skip'}
              </span>
            </div>
          </div>

          {/* Bullet 2: Secondary F-Pattern Sweep */}
          <div
            onMouseEnter={() => setActiveGazePoint(2)}
            onMouseLeave={() => setActiveGazePoint(null)}
            className={`p-3.5 rounded-xl border transition-all ${
              remediated
                ? 'border-cyan-500/40 bg-gradient-to-r from-amber-500/20 via-cyan-500/10 to-transparent'
                : 'border-slate-800 bg-[#0B0F15]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${remediated ? 'bg-amber-400' : 'bg-slate-600'}`} />
                <div>
                  {remediated ? (
                    <p className="text-slate-100 font-sans text-xs leading-relaxed">
                      <strong className="text-cyan-300 font-semibold font-mono">Engineered asyncpg connection pool</strong>{' '}
                      capped at 50 connections with strict 5s acquisition timeouts, eliminating pool exhaustion during 5,000 req/s stress testing.
                    </p>
                  ) : (
                    <p className="text-slate-400 font-sans text-xs leading-relaxed">
                      Responsible for managing backend APIs, working with async database connection setups, and fixing server crashes.
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    {remediated ? (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          Pool Bounds: 50 max / 5s timeout
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Stress Tested: 5,000 req/s
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          Fluff: &quot;Responsible for&quot;
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
                          No Metrics
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0 ${remediated ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}>
                {remediated ? '2.1s Gaze Hold' : '0.2s Skip'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENGINE 2: RESUME DEFENSE MATRIX (INTERROGATION & CODE PROOF)
// ============================================================================

function DefenseMatrixEngine() {
  const [selectedTab, setSelectedTab] = useState('sql');
  const [starStep, setStarStep] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header & Interrogation Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <StudioBadge variant="cyan" size="xs">
              Pre-Interview Interrogation
            </StudioBadge>
            <span className="text-xs text-slate-400 font-mono">Proof Score: 98/100</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Interviewers grill every resume bullet. CareerPilot provides verified code snippets and STAR defense answers.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Vulnerability: Minimal (Low Risk)</span>
        </div>
      </div>

      {/* Claim & Senior Interviewer Challenge */}
      <div className="p-4 rounded-xl bg-[#0B0F15] border border-cyan-500/20 relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 grid place-items-center flex-shrink-0 text-cyan-400 font-bold text-xs">
            Q
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Senior Technical Interviewer Interrogation
            </p>
            <p className="text-sm font-semibold text-slate-100">
              &quot;You claim you cut database query latency by 42% with PostgreSQL composite indexes and async pooling. Walk me through the query plan. How did you diagnose buffer cache hits versus disk reads?&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Live Syntax Code Snippet Box */}
      <div className="rounded-xl border border-slate-800 bg-[#06080C] overflow-hidden shadow-2xl">
        {/* Code Tabs Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0B0F15] border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTab('sql')}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                selectedTab === 'sql'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              query_plan.sql (EXPLAIN ANALYZE)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('python')}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                selectedTab === 'python'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              db_pool.py (asyncpg Pool Bounds)
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            Repository Artifact: backend-service/db/
          </span>
        </div>

        {/* Code Body */}
        <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed">
          {selectedTab === 'sql' ? (
            <div className="text-slate-300 space-y-1">
              <p className="text-slate-500">-- Profile query plan execution with buffer cache inspection</p>
              <p>
                <span className="text-purple-400 font-bold">EXPLAIN</span>{' '}
                <span className="text-cyan-400">(ANALYZE, BUFFERS, VERBOSE, COSTS OFF)</span>
              </p>
              <p>
                <span className="text-purple-400 font-bold">SELECT</span> u.id, u.email,{' '}
                <span className="text-yellow-400 font-bold">COUNT</span>(t.id) <span className="text-purple-400">AS</span> tx_count
              </p>
              <p>
                <span className="text-purple-400 font-bold">FROM</span> users u
              </p>
              <p>
                <span className="text-purple-400 font-bold">LEFT JOIN</span> transactions t{' '}
                <span className="text-purple-400 font-bold">ON</span> t.user_id = u.id{' '}
                <span className="text-purple-400 font-bold">AND</span> t.status ={' '}
                <span className="text-emerald-400">&apos;SETTLED&apos;</span>
              </p>
              <p>
                <span className="text-purple-400 font-bold">WHERE</span> u.created_at &gt;={' '}
                <span className="text-yellow-400 font-bold">NOW</span>() -{' '}
                <span className="text-purple-400 font-bold">INTERVAL</span>{' '}
                <span className="text-emerald-400">&apos;30 days&apos;</span>
              </p>
              <p>
                <span className="text-purple-400 font-bold">GROUP BY</span> u.id, u.email;
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-emerald-400">
                <p>-- Actual Execution Output:</p>
                <p>-- Index Scan using idx_users_created_at on users (actual time=0.038..0.714 rows=1,420 loops=1)</p>
                <p>-- Buffers: shared hit=482 read=0 | Planning Time: 0.12 ms | Execution Time: 1.12 ms</p>
              </div>
            </div>
          ) : (
            <div className="text-slate-300 space-y-1">
              <p className="text-slate-500"># asyncpg pooled connection configuration with bounded limits</p>
              <p>
                <span className="text-purple-400 font-bold">import</span> asyncpg
              </p>
              <p className="mt-2">
                <span className="text-purple-400 font-bold">async def</span>{' '}
                <span className="text-yellow-400 font-bold">init_postgres_pool</span>(dsn: str) -&gt; asyncpg.Pool:
              </p>
              <p className="pl-4">
                <span className="text-purple-400 font-bold">return await</span> asyncpg.
                <span className="text-cyan-400 font-bold">create_pool</span>(
              </p>
              <p className="pl-8 text-cyan-200">
                dsn=dsn,
              </p>
              <p className="pl-8 text-cyan-200">
                min_size=<span className="text-amber-400">10</span>,{' '}
                <span className="text-slate-500"># Hot connections ready</span>
              </p>
              <p className="pl-8 text-cyan-200">
                max_size=<span className="text-amber-400">50</span>,{' '}
                <span className="text-slate-500"># Hard cap prevents PG connection exhaustion</span>
              </p>
              <p className="pl-8 text-cyan-200">
                max_queries=<span className="text-amber-400">50000</span>,{' '}
                <span className="text-slate-500"># Recycle to prevent leak</span>
              </p>
              <p className="pl-8 text-cyan-200">
                command_timeout=<span className="text-amber-400">5.0</span>,{' '}
                <span className="text-slate-500"># Fail fast on lock contention</span>
              </p>
              <p className="pl-4">)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Model STAR Defense Answer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Model STAR Response (Interview-Ready)
          </span>
          <div className="flex gap-1">
            {['all', 'situation', 'task', 'action', 'result'].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setStarStep(step)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                  starStep === step
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(starStep === 'all' || starStep === 'situation') && (
            <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
              <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider">Situation</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                During 5,000 req/s load tests, unindexed queries on transactions triggered table-wide sequential scans, exhausting database connection slots and raising p95 latency past 410ms.
              </p>
            </div>
          )}

          {(starStep === 'all' || starStep === 'task') && (
            <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
              <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider">Task</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Profile query execution down to the buffer level, eliminate sequential disk reads, and enforce hard connection pooling limits in FastAPI before the production launch.
              </p>
            </div>
          )}

          {(starStep === 'all' || starStep === 'action') && (
            <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
              <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider">Action</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Ran <code className="text-emerald-300">EXPLAIN (ANALYZE, BUFFERS)</code> to verify memory hits, created composite B-tree index on <code className="text-emerald-300">(user_id, status)</code>, and configured <code className="text-emerald-300">asyncpg</code> pool with 5s timeouts.
              </p>
            </div>
          )}

          {(starStep === 'all' || starStep === 'result') && (
            <div className="p-3 rounded-xl bg-[#0B0F15] border border-slate-800">
              <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider">Result</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Shared buffer hit ratio reached 100% (zero disk reads). Query execution time dropped from 412ms to 1.12ms (-42% end-to-end API p95 latency) with zero connection drops under sustained spike traffic.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENGINE 3: JOB REALITY AUDITOR (0-100 HEALTH METER)
// ============================================================================

function RealityAuditorEngine({ shouldReduceMotion }) {
  const [isGhost, setIsGhost] = useState(false);
  const [isBurnout, setIsBurnout] = useState(false);
  const [isUnrealisticYears, setIsUnrealisticYears] = useState(false);
  const [isDirectProvider, setIsDirectProvider] = useState(true);
  const [hasSalaryBand, setHasSalaryBand] = useState(true);

  // Compute dynamic 0-100 health score
  const healthScore = useMemo(() => {
    let score = 94;
    if (isGhost) score -= 40;
    if (isBurnout) score -= 25;
    if (isUnrealisticYears) score -= 20;
    if (!isDirectProvider) score -= 15;
    if (!hasSalaryBand) score -= 10;
    return Math.max(12, Math.min(98, score));
  }, [isGhost, isBurnout, isUnrealisticYears, isDirectProvider, hasSalaryBand]);

  const scoreMeta = useMemo(() => {
    if (healthScore >= 80) {
      return {
        label: 'Prime Opportunity - Direct & Active',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        responseRate: '28.4%',
        recommendation: 'Recommend applying immediately with tailored project proof.',
      };
    }
    if (healthScore >= 50) {
      return {
        label: 'Moderate Risk - Proceed with Caution',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        responseRate: '9.2%',
        recommendation: 'Investigate team turnover and confirm hiring timeline before tailoring.',
      };
    }
    return {
      label: 'Critical Alert - Probable Ghost Listing',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      responseRate: '1.8%',
      recommendation: 'Do not spend tailoring hours. Listing exhibits stale repost markers.',
    };
  }, [healthScore]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <StudioBadge variant="amber" size="xs">
              Live Role Telemetry
            </StudioBadge>
            <span className="text-xs text-slate-400 font-mono">0-100 Role Health Index</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Over 38% of fresher listings on aggregators are ghost jobs or burnout mills. Toggle flags below to see how CareerPilot protects your time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsGhost(false);
            setIsBurnout(false);
            setIsUnrealisticYears(false);
            setIsDirectProvider(true);
            setHasSalaryBand(true);
          }}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* Main Health Display: 2-Column Gauge + Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
        {/* Left Column: Interactive Toggles */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Interactive Signal Toggles (Click to Test)
          </p>

          {/* Toggle 1: Ghost Job */}
          <div
            onClick={() => setIsGhost((p) => !p)}
            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              isGhost
                ? 'bg-rose-500/15 border-rose-500/40'
                : 'bg-[#0B0F15] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-4 h-4 ${isGhost ? 'text-rose-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Ghost-Job Flag (Reposted &gt;90 days across 4 portals)
                </p>
                <p className="text-[11px] text-slate-400">
                  Zero hiring manager activity recorded in 30 days.
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isGhost ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {isGhost ? '-40 pts' : 'Off'}
            </span>
          </div>

          {/* Toggle 2: Burnout Keywords */}
          <div
            onClick={() => setIsBurnout((p) => !p)}
            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              isBurnout
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-[#0B0F15] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className={`w-4 h-4 ${isBurnout ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Burnout Trap Keywords in Job Description
                </p>
                <p className="text-[11px] text-slate-400">
                  &quot;Fast-paced chaos&quot;, &quot;24/7 weekend triage&quot;, &quot;wear 10 hats&quot;
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isBurnout ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
              {isBurnout ? '-25 pts' : 'Off'}
            </span>
          </div>

          {/* Toggle 3: Unrealistic Fresher YOE */}
          <div
            onClick={() => setIsUnrealisticYears((p) => !p)}
            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              isUnrealisticYears
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-[#0B0F15] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <GraduationCap className={`w-4 h-4 ${isUnrealisticYears ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Gatekeeper Bloat: 4+ yrs for Junior / Fresher
                </p>
                <p className="text-[11px] text-slate-400">
                  Entry-level title demanding senior distributed systems experience.
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isUnrealisticYears ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
              {isUnrealisticYears ? '-20 pts' : 'Off'}
            </span>
          </div>

          {/* Toggle 4: Direct Provider Portal Link */}
          <div
            onClick={() => setIsDirectProvider((p) => !p)}
            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              !isDirectProvider
                ? 'bg-rose-500/15 border-rose-500/40'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-4 h-4 ${isDirectProvider ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Direct Application Link (Not Aggregator Reseller)
                </p>
                <p className="text-[11px] text-slate-400">
                  Candidate applies straight to company ATS without data harvesting middlemen.
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isDirectProvider ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
              {isDirectProvider ? '+15 pts' : '-15 pts'}
            </span>
          </div>
        </div>

        {/* Right Column: Visual Health Meter & Verdict */}
        <div className="p-6 rounded-2xl bg-[#0B0F15] border border-slate-800 flex flex-col items-center text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">
            Audit Health Metric
          </p>

          {/* Circular / Radial Score Display */}
          <div className="my-5 relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="58"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="58"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * healthScore) / 100}
                strokeLinecap="round"
                className={`transition-all ${shouldReduceMotion ? 'duration-0' : 'duration-500'} ${
                  healthScore >= 80
                    ? 'text-emerald-400'
                    : healthScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {healthScore}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className={`w-full p-3 rounded-xl border text-xs font-medium ${scoreMeta.bgColor}`}>
            <p className={`font-bold font-mono ${scoreMeta.color}`}>{scoreMeta.label}</p>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">{scoreMeta.recommendation}</p>
          </div>

          <div className="mt-4 flex items-center justify-between w-full px-2 text-[11px] text-slate-400 font-mono">
            <span>Estimated Callback:</span>
            <span className={`font-bold ${scoreMeta.color}`}>{scoreMeta.responseRate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENGINE 4: MULTI-CHANNEL OUTREACH ENGINE
// ============================================================================

function OutreachEngine({ shouldReduceMotion }) {
  const [channel, setChannel] = useState('linkedin');
  const [copied, setCopied] = useState(false);

  const channelConfigs = {
    linkedin: {
      name: 'LinkedIn Connection Note',
      limit: 300,
      icon: Linkedin,
      note: 'Hard character limit: strictly under 300 characters for connection requests.',
      text: 'Hi Alex, saw Apex is expanding PostgreSQL read clusters. In my asyncpg project, I tuned connection pooling & indexing (EXPLAIN ANALYZE), cutting p95 query latency by 42% across 1.2M daily transactions. Would love to contribute to your backend team. Best, Rohan.',
    },
    alumni: {
      name: 'Alumni Outreach Note',
      limit: 200,
      icon: GraduationCap,
      note: 'Super-concise alumni greeting: strictly under 200 characters for warm introduction.',
      text: 'Hi Priya, fellow alumni here! Built an asyncpg pool project cutting DB latency by 42%. Would love 5 mins for your advice on the Apex backend team. Best, Rohan.',
    },
    email: {
      name: 'Direct Cold Pitch Email',
      limit: 450,
      icon: Mail,
      note: 'High-density cold pitch with direct technical artifact references.',
      text: 'Subject: Backend Candidate - PostgreSQL Indexing & asyncpg Pool Project\n\nHi Alex,\nI saw Apex is scaling backend services. Instead of sending a generic resume, here is verifiable code proof: I architected an asyncpg connection pool project with composite PostgreSQL indexing, reducing p95 latency from 412ms to 1.1ms under 5k req/s (code on GitHub).\n\nWould love 10 minutes to discuss how I can help Apex scale.\nBest regards,\nRohan',
    },
  };

  const currentConfig = channelConfigs[channel];
  const charCount = currentConfig.text.length;
  const isOverLimit = charCount > currentConfig.limit;
  const isNearLimit = charCount >= currentConfig.limit * 0.85;

  const handleCopy = useCallback(() => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentConfig.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentConfig.text]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <StudioBadge variant="emerald" size="xs">
              Sub-300 Char Constraint Engine
            </StudioBadge>
            <span className="text-xs text-slate-400 font-mono">Zero Generic Fluff</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Outreach converts 5x better than cold applications, but character caps are unforgiving.
          </p>
        </div>

        {/* Channel Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B0F15] border border-slate-800">
          {Object.entries(channelConfigs).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = channel === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setChannel(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Box with Character Counter & Pitch */}
      <div className="p-5 rounded-2xl bg-[#080B0F] border border-slate-800 space-y-4">
        {/* Meta Bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <currentConfig.icon className="w-4 h-4 text-cyan-400" />
            {currentConfig.name}
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono">
              <span className={`text-xs font-bold ${
                isOverLimit ? 'text-rose-400' : isNearLimit ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {charCount} / {currentConfig.limit}
              </span>
              <span className="text-[10px] uppercase text-slate-500">chars</span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${shouldReduceMotion ? 'duration-0' : 'duration-300'} ${
              isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(100, (charCount / currentConfig.limit) * 100)}%` }}
          />
        </div>

        {/* Pitch Display Box */}
        <div className="p-4 rounded-xl bg-[#0B0F15] border border-slate-800 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line selection:bg-cyan-500/30">
          {currentConfig.text}
        </div>

        {/* Guardrail Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Strict Zero-Mock: Anchored on code evidence from verified repository. Zero hallucinations.</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZERO-MOCK HERO STUDIO SANDBOX COMPONENT
// ============================================================================

export function LiveHeroStudioSandbox() {
  const [activeEngine, setActiveEngine] = useState('xray');
  const shouldReduceMotion = useReducedMotion();

  const engines = [
    {
      id: 'xray',
      label: '6-Sec X-Ray',
      badge: 'Heatmap',
      icon: Eye,
      description: 'Eye-tracking F-pattern simulation and 1-click fluff stripping.',
    },
    {
      id: 'defense',
      label: 'Defense Matrix',
      badge: 'Code Syntax',
      icon: Shield,
      description: 'Real EXPLAIN ANALYZE SQL query plan & STAR pre-interview defense.',
    },
    {
      id: 'reality',
      label: 'Reality Auditor',
      badge: '0-100 Meter',
      icon: Gauge,
      description: 'Ghost-job detector and telemetry-backed role health scoring.',
    },
    {
      id: 'outreach',
      label: 'Outreach Engine',
      badge: '<300 Chars',
      icon: Mail,
      description: 'Character-budgeted LinkedIn, Alumni, and Cold Email generator.',
    },
  ];

  return (
    <div id="hero-sandbox" className="relative rounded-3xl border border-cyan-500/30 bg-[#0B0F15] p-2 sm:p-4 shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] overflow-hidden">
      {/* Chassis Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-[#0F141C] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 grid place-items-center text-cyan-400 font-black text-xs shadow-sm">
            CP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">Studio Engine Console</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Interactive Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400">Click any engine to test zero-mock intelligence live.</p>
          </div>
        </div>

        {/* Engine Switcher Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full md:w-auto p-1 rounded-xl bg-[#080B0F] border border-slate-800">
          {engines.map((engine) => {
            const Icon = engine.icon;
            const isActive = activeEngine === engine.id;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => setActiveEngine(engine.id)}
                className={`relative px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{engine.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Engine Body */}
      <div className="mt-3 p-4 sm:p-6 rounded-2xl bg-[#0E131A] border border-slate-800/80">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeEngine}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeEngine === 'xray' && <XRayEngine shouldReduceMotion={shouldReduceMotion} />}
            {activeEngine === 'defense' && <DefenseMatrixEngine />}
            {activeEngine === 'reality' && <RealityAuditorEngine shouldReduceMotion={shouldReduceMotion} />}
            {activeEngine === 'outreach' && <OutreachEngine shouldReduceMotion={shouldReduceMotion} />}
          </MotionDiv>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();

  const scrollAnimation = shouldReduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { type: 'spring', stiffness: 350, damping: 28 },
      };

  return (
    <div className="min-h-screen bg-[#080B0F] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <main className="relative z-10">
        {/* ================================================================== */}
        {/* HERO SECTION */}
        {/* ================================================================== */}
        <section className="mx-auto max-w-7xl px-5 pt-12 pb-16 sm:px-8 sm:pt-20 lg:pt-24">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Live Telemetry Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-medium text-cyan-300 shadow-sm shadow-cyan-500/10">
              <span className="relative flex h-2 w-2">
                <span
                  className={
                    shouldReduceMotion
                      ? 'inline-flex h-2 w-2 rounded-full bg-cyan-400'
                      : 'absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping'
                  }
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <span className="font-mono font-bold uppercase tracking-wider">Studio Engine v2.4 Online</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">Student Application OS</span>
            </div>

            {/* Flagship Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[1.04] text-white">
              Stop Applying with Generic Resumes.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                Apply with Provable Code Defense.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-slate-400">
              CareerPilot connects to your GitHub repositories to extract authentic technical milestones, eliminates fluff along recruiter F-pattern heatmaps, and audits job portals for ghost listings.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                Launch Studio Workspace <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#hero-sandbox"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#171F2C] px-6 py-3.5 text-sm font-bold text-slate-200 hover:border-slate-500 hover:bg-[#1F2937] transition-all"
              >
                Test Live Sandbox
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" /> Authentic GitHub Commits
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" /> Zero Unverified Claims
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" /> Direct Provider Opportunities
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" /> No Browser API Keys
              </span>
            </div>
          </div>

          {/* Embedded Hero Sandbox Console */}
          <div className="mt-12 lg:mt-16">
            <LiveHeroStudioSandbox />
          </div>
        </section>

        {/* ================================================================== */}
        {/* FOUR STUDIO PILLARS SECTION */}
        {/* ================================================================== */}
        <MotionSection {...scrollAnimation} className="mx-auto max-w-7xl px-5 py-24 sm:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 font-mono">
              Core Architectural Pillars
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white">
              Built on Evidence, Not Fluff.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              Every feature in CareerPilot is anchored in engineering proof that technical interviewers cannot dismantle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <StudioCard variant="default" glow="cyan" className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 grid place-items-center text-cyan-400">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Proof over Promises
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Real GitHub Verification
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                CareerPilot inspects approved repositories, pull requests, and commit histories to extract authentic technical milestones without fabricating experience.
              </p>
            </StudioCard>

            {/* Pillar 2 */}
            <StudioCard variant="default" glow="emerald" className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 grid place-items-center text-emerald-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Truth over Fluff
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  6-Sec F-Pattern Tracking
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Simulates cognitive recruiter eye gaze. Strips filler adjectives and repositions concrete metrics to capture interview callbacks in under 6 seconds.
              </p>
            </StudioCard>

            {/* Pillar 3 */}
            <StudioCard variant="default" glow="cyan" className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 grid place-items-center text-cyan-400">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Defense over Guesswork
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Live Code &amp; STAR Proof
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Each bullet point is paired with real SQL query plans, async connection code, and STAR talking points to ace senior technical cross-examinations.
              </p>
            </StudioCard>

            {/* Pillar 4 */}
            <StudioCard variant="default" glow="amber" className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 grid place-items-center text-amber-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Reality over Postings
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  0-100 Role Health Radar
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Filters out stale ghost-postings, unreasonable junior requirements, and burnout red flags so you only spend tailoring hours on active opportunities.
              </p>
            </StudioCard>
          </div>
        </MotionSection>

        {/* ================================================================== */}
        {/* WORKFLOW PIPELINE SECTION */}
        {/* ================================================================== */}
        <MotionSection {...scrollAnimation} className="mx-auto max-w-7xl px-5 py-24 sm:px-8 border-t border-slate-800/80">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 font-mono">
              End-To-End System Workflow
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white">
              The Provable Application Lifecycle
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              From finding active fresher roles to defending your code in the final interview round.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-[#0F141C] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>STAGE 01</span>
                <Search className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white">Discover &amp; Audit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aggregates fresh opportunities directly from provider portals, filtering out ghost listings with 0-100 role health scoring.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F141C] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>STAGE 02</span>
                <Github className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Extract Repo Proof</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects to student GitHub repositories to extract real commits, pull requests, and architectural milestones.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F141C] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>STAGE 03</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white">Tailor &amp; Strip Fluff</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restructures resume bullets along the recruiter F-pattern, ensuring metrics hit in the first 2 seconds of scanning.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F141C] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>STAGE 04</span>
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">Defend &amp; Pitch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prepares you with STAR interview defenses and generates sub-300 character outreach notes that link to verifiable code.
              </p>
            </div>
          </div>
        </MotionSection>

        {/* ================================================================== */}
        {/* HIGH-IMPACT STUDIO CTA SECTION */}
        {/* ================================================================== */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="relative rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-[#0F141C] via-[#0B0F15] to-[#080B0F] p-8 sm:p-14 shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)] overflow-hidden">
            {/* Atmospheric Orb */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Start Building With Real Evidence
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Turn your code into an application impossible to dismiss.
              </h2>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Join thousands of engineering students who apply with code-backed proof instead of fluffy keywords. No credit card required.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:brightness-105 active:scale-[0.98] transition-all"
                >
                  Create Studio Workspace <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#171F2C] px-5 py-3.5 text-sm font-bold text-slate-200 hover:border-slate-500 hover:bg-[#1F2937] transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================== */}
      {/* STUDIO FOOTER */}
      {/* ================================================================== */}
      <footer className="border-t border-slate-800/80 bg-[#06080C] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 grid place-items-center text-cyan-400 font-bold text-[11px]">
              CP
            </div>
            <div>
              <p className="font-bold text-slate-300">CareerPilot Studio OS</p>
              <p className="text-[10px] text-slate-500">Zero-Mock Technical Application Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-slate-300 transition-colors">
              Sign up
            </Link>
            <a href="#hero-sandbox" className="hover:text-slate-300 transition-colors">
              Interactive Sandbox
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Studio Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
