import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Columns3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Layers,
  List,
  Loader2,
  Mail,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';

import {
  deleteApplication,
  downloadResumeVersion,
  exportPdfDirect,
  generateOutreach,
  getAllApplications,
  getAllJobs,
  getAllResumes,
  getApplicationAutopsy,
  getApplicationPack,
  getCandidateProfile,
  getResumeDefenseStressTest,
  updateApplicationDetails,
  updateApplicationStatus,
  verifyGitHubRepo,
} from '../services/api';
import {
  ALLOWED_NEXT_STATUSES,
  APPLICATION_STATUSES,
  generateClientOutreachNote,
  groupApplicationsByStatus,
} from '../app/application-pipeline';
import {
  StudioBadge,
  StudioButton,
  StudioCard,
  StudioMotionDrawer,
} from '../components/studio/StudioPrimitives';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;

// Stage color metadata for Studio Kanban columns
const STAGE_THEMES = {
  Saved: {
    accent: 'slate',
    dotClass: 'bg-slate-400',
    borderGlow: 'hover:border-slate-500/40',
    dropHighlight: 'border-slate-400/60 bg-slate-900/40',
    description: 'Bookmarked for tailored application',
  },
  Preparing: {
    accent: 'amber',
    dotClass: 'bg-amber-400',
    borderGlow: 'hover:border-amber-500/40',
    dropHighlight: 'border-amber-500/60 bg-amber-950/20',
    description: 'Tailoring resume & verifying evidence',
  },
  Applied: {
    accent: 'cyan',
    dotClass: 'bg-cyan-400',
    borderGlow: 'hover:border-cyan-500/40',
    dropHighlight: 'border-cyan-500/60 bg-cyan-950/20',
    description: 'Application submitted & outreach sent',
  },
  Interview: {
    accent: 'purple',
    dotClass: 'bg-purple-400',
    borderGlow: 'hover:border-purple-500/40',
    dropHighlight: 'border-purple-500/60 bg-purple-950/20',
    description: 'Technical screens & loops active',
  },
  Offer: {
    accent: 'emerald',
    dotClass: 'bg-emerald-400',
    borderGlow: 'hover:border-emerald-500/40',
    dropHighlight: 'border-emerald-500/60 bg-emerald-950/20',
    description: 'Written offer under negotiation',
  },
  Rejected: {
    accent: 'rose',
    dotClass: 'bg-rose-400',
    borderGlow: 'hover:border-rose-500/40',
    dropHighlight: 'border-rose-500/60 bg-rose-950/20',
    description: 'Autopsy & 48h recovery eligible',
  },
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'list'
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals & Drawers
  const [packTarget, setPackTarget] = useState(null);
  const [outreachTarget, setOutreachTarget] = useState(null);
  const [stressTestTarget, setStressTestTarget] = useState(null);
  const [autopsyTarget, setAutopsyTarget] = useState(null);

  const shouldReduceMotion = useReducedMotion();

  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  }, []);

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      try {
        const [applicationData, jobData] = await Promise.all([
          getAllApplications(),
          getAllJobs(),
        ]);
        if (!active) return;

        const jobsById = {};
        jobData.forEach((job) => {
          jobsById[job.id] = job;
        });

        setApplications(applicationData);
        setJobs(jobsById);
        setSelectedId(applicationData[0]?.id || null);
      } catch {
        if (active) setError('Applications could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadApplications();
    return () => {
      active = false;
    };
  }, []);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) || applications[0],
    [applications, selectedId],
  );

  const changeApplicationStatus = async (applicationId, status) => {
    setUpdating(true);
    setError('');

    try {
      const updated = await updateApplicationStatus(applicationId, { status });
      setApplications((current) => current.map((app) => (
        app.id === updated.id ? updated : app
      )));
      triggerToast(`Moved application to ${status}`);
    } catch (updateError) {
      setError(updateError.response?.data?.detail || 'The application status could not be updated.');
    } finally {
      setUpdating(false);
    }
  };

  const removeApplication = async (applicationId) => {
    setError('');
    try {
      await deleteApplication(applicationId);
      const remaining = applications.filter((application) => application.id !== applicationId);
      setApplications(remaining);
      setSelectedId(remaining[0]?.id || null);
      setPendingDeleteId(null);
      triggerToast('Application removed from mission deck');
    } catch {
      setError('The application could not be deleted.');
    }
  };

  const saveApplicationPlan = async (details) => {
    if (!selectedApplication) return;
    setUpdating(true);
    setError('');
    try {
      const updated = await updateApplicationDetails(selectedApplication.id, details);
      setApplications((current) => current.map((application) => (
        application.id === updated.id ? updated : application
      )));
      triggerToast('Application action plan updated');
    } catch {
      setError('The next action and notes could not be saved.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadSubmittedResume = async (versionId) => {
    try {
      const blob = await downloadResumeVersion(versionId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'submitted-tailored-resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      triggerToast('Downloading submitted Harvard ATS resume');
    } catch {
      setError('Could not download the submitted resume.');
    }
  };

  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e, status) => {
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    const app = applications.find((a) => a.id === appId);
    if (app && app.status !== targetStatus) {
      changeApplicationStatus(appId, targetStatus);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Initializing Studio Mission Deck &amp; Telemetry...
          </p>
        </div>
      </div>
    );
  }

  const grouped = groupApplicationsByStatus(applications);
  const interviewCount = (grouped.Interview || []).length;
  const offerCount = (grouped.Offer || []).length;
  const activePipelines = applications.length;

  return (
    <div className="space-y-6">
      {/* Studio Mission Deck Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-[#1F2937] pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400">
              Hero 2 &amp; 4 Mission Deck
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-100 sm:text-4xl flex items-center gap-3">
            Applications Studio
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Full-cycle pipeline interrogator with truth-guarded resume defense, pre-mortem gap autopsies, and multi-channel outreach kits.
          </p>
        </div>

        {/* Telemetry pill & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 rounded-2xl bg-[#0F141C] border border-[#1F2937] px-4 py-2 text-xs font-mono">
            <span className="text-slate-400">Pipeline:</span>
            <span className="font-bold text-slate-200">{activePipelines} Total</span>
            <span className="text-slate-600">·</span>
            <span className="font-bold text-purple-400">{interviewCount} Interviewing</span>
            <span className="text-slate-600">·</span>
            <span className="font-bold text-emerald-400">{offerCount} Offers</span>
          </div>

          <div className="inline-flex rounded-xl border border-[#1F2937] bg-[#0F141C] p-1">
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'pipeline' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {viewMode === 'pipeline' && (
                <MotionDiv
                  layoutId="application-view-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40"
                  transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Columns3 className="h-3.5 w-3.5" /> Pipeline Board
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {viewMode === 'list' && (
                <MotionDiv
                  layoutId="application-view-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40"
                  transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <List className="h-3.5 w-3.5" /> Detail View
              </span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto text-xs text-rose-400 hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Board View: Pipeline Kanban or Detail List */}
      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0F141C] px-6 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 text-slate-400">
            <BriefcaseBusiness className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-200">No applications saved to your mission deck yet</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
            Discover roles in the Job Search workspace or add your target tech companies to track technical defense matrices and autopsy recovery.
          </p>
          <div className="mt-6">
            <Link
              to="/search-jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
            >
              Explore Live Tech Jobs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : viewMode === 'pipeline' ? (
        /* Studio Kanban Board */
        <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-start">
          {APPLICATION_STATUSES.map((status) => {
            const columnApps = grouped[status] || [];
            const theme = STAGE_THEMES[status] || STAGE_THEMES.Saved;
            const isTarget = dragOverColumn === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                className={cn(
                  'flex min-w-[260px] flex-col rounded-2xl border transition-all duration-200 p-3 min-h-[560px] backdrop-blur-md',
                  'bg-[#0F141C]/80 border-[#1F2937]',
                  isTarget && cn('ring-2 ring-cyan-500/40', theme.dropHighlight)
                )}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1F2937]/70 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', theme.dotClass)} />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      {status}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-300">
                    {columnApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="mt-3 flex-1 space-y-3">
                  {columnApps.map((app) => {
                    const job = jobs[app.job_id] || {};
                    const allowedNext = ALLOWED_NEXT_STATUSES[app.status] || [];

                    return (
                      <MotionDiv
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        whileHover={
                          shouldReduceMotion
                            ? undefined
                            : { y: -2.5, transition: { type: 'spring', stiffness: 450, damping: 25 } }
                        }
                        className={cn(
                          'group relative rounded-xl border bg-[#171F2C] border-[#283548] p-3.5 shadow-md transition-colors cursor-grab active:cursor-grabbing',
                          'hover:border-cyan-500/50 hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]'
                        )}
                      >
                        {/* Title & Company */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-sm text-slate-100 leading-snug line-clamp-2">
                            {job.title || 'Saved Engineering Role'}
                          </p>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <span>{job.company || 'Company'}</span>
                          {job.location && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-[11px] text-slate-500">{job.location}</span>
                            </>
                          )}
                        </p>

                        {/* Next Action Pill */}
                        {app.next_action && (
                          <div className="mt-2.5 rounded-lg bg-[#0A0E14] p-2 text-[11px] text-slate-300 border border-[#1F2937] leading-relaxed">
                            <span className="font-bold text-cyan-400">Next: </span>
                            {app.next_action}
                          </div>
                        )}

                        {/* Studio Action Toolkit */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[#1F2937]/70">
                          {/* Application Pack */}
                          <button
                            type="button"
                            onClick={() => setPackTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 text-[11px] font-bold text-slate-200 transition cursor-pointer"
                            title="1-Click Complete Application Pack (Cover Letter + Resume + Outreach)"
                          >
                            📦 Pack
                          </button>

                          {/* Recruiter Outreach */}
                          <button
                            type="button"
                            onClick={() => setOutreachTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 text-[11px] font-bold text-cyan-300 transition cursor-pointer"
                            title="Multi-Channel Outreach Kit (<300 LinkedIn, <200 Alumni, Cold Email)"
                          >
                            <Send className="h-3 w-3 text-cyan-400" /> Outreach
                          </button>

                          {/* Resume Defense Interrogator */}
                          <button
                            type="button"
                            onClick={() => setStressTestTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 text-[11px] font-bold text-purple-300 transition cursor-pointer"
                            title="Hero 2: Resume Defense Interrogator with Code Grounding"
                          >
                            <Shield className="h-3 w-3 text-purple-400" /> Defense
                          </button>

                          {/* Autopsy Drawer */}
                          <button
                            type="button"
                            onClick={() => setAutopsyTarget({ job, application: app })}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer border',
                              app.status === 'Rejected'
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                            )}
                            title={
                              app.status === 'Rejected'
                                ? 'Hero 4: Post-Mortem Autopsy & Fatal Blocker Diagnostics'
                                : 'Hero 4: Pre-Mortem Risk Audit before recruiter screening'
                            }
                          >
                            <span>🔬</span>
                            {app.status === 'Rejected' ? 'Autopsy' : 'Pre-Mortem'}
                          </button>

                          {/* Submitted Resume PDF */}
                          {app.resume_version_id && (
                            <button
                              type="button"
                              onClick={() => handleDownloadSubmittedResume(app.resume_version_id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-white/[0.04] px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
                              title="Download submitted Harvard ATS PDF"
                            >
                              <Download className="h-3 w-3 text-slate-400" /> PDF
                            </button>
                          )}
                        </div>

                        {/* Quick Status Advance Arrows */}
                        {allowedNext.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1 pt-2 border-t border-[#1F2937]/50">
                            <span className="text-[10px] font-mono text-slate-500 mr-0.5">Move:</span>
                            {allowedNext.map((nextSt) => (
                              <button
                                key={nextSt}
                                type="button"
                                disabled={updating}
                                onClick={() => changeApplicationStatus(app.id, nextSt)}
                                className="rounded bg-[#0A0E14] border border-[#1F2937] px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition disabled:opacity-50 cursor-pointer"
                              >
                                &rarr; {nextSt}
                              </button>
                            ))}
                          </div>
                        )}
                      </MotionDiv>
                    );
                  })}

                  {/* Empty Stage Placeholder */}
                  {columnApps.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#1F2937] p-5 text-center text-xs text-slate-500">
                      <p className="font-mono">No jobs in {status.toLowerCase()}</p>
                      <p className="mt-1 text-[11px] text-slate-600">{theme.description}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Studio Detail View */
        <div className="grid min-h-[38rem] overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0F141C] lg:grid-cols-[0.72fr_1.28fr]">
          <section className="border-b border-[#1F2937] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#1F2937] px-5 py-4 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-200">
                {applications.length} Saved {applications.length === 1 ? 'Application' : 'Applications'}
              </p>
              <span className="text-xs font-mono text-slate-500">Select to inspect</span>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto max-h-[70vh]">
              {applications.map((application) => {
                const job = jobs[application.job_id] || {};
                const active = selectedApplication?.id === application.id;
                return (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => setSelectedId(application.id)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-all cursor-pointer',
                      active
                        ? 'border-cyan-500/50 bg-[#171F2C] shadow-lg shadow-cyan-500/10'
                        : 'border-transparent bg-transparent hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm text-slate-100">{job.title || 'Saved Role'}</p>
                        <p className="mt-1 text-xs text-slate-400">{job.company || 'Company unavailable'}</p>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                    <p className="mt-2 text-[11px] font-mono text-slate-500">
                      Added {new Date(application.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <ApplicationDetail
            application={selectedApplication}
            job={jobs[selectedApplication?.job_id] || {}}
            updating={updating}
            pendingDelete={pendingDeleteId === selectedApplication?.id}
            onChangeStatus={(st) => changeApplicationStatus(selectedApplication.id, st)}
            onRequestDelete={setPendingDeleteId}
            onDelete={removeApplication}
            onSavePlan={saveApplicationPlan}
            onOpenPack={(job, app) => setPackTarget({ job, application: app })}
            onOpenOutreach={(job, app) => setOutreachTarget({ job, application: app })}
            onOpenStressTest={(job, app) => setStressTestTarget({ job, application: app })}
            onOpenAutopsy={(job, app) => setAutopsyTarget({ job, application: app })}
            onDownloadResume={handleDownloadSubmittedResume}
          />
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <MotionDiv
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#0F141C] px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-xl shadow-emerald-500/10 backdrop-blur-md"
          >
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Hero Modals & Drawers */}
      {packTarget && (
        <ApplicationPackModal
          job={packTarget.job}
          application={packTarget.application}
          onClose={() => setPackTarget(null)}
          onToast={triggerToast}
        />
      )}

      {outreachTarget && (
        <OutreachModal
          job={outreachTarget.job}
          application={outreachTarget.application}
          onClose={() => setOutreachTarget(null)}
          onToast={triggerToast}
        />
      )}

      {stressTestTarget && (
        <StressTestModal
          job={stressTestTarget.job}
          application={stressTestTarget.application}
          onClose={() => setStressTestTarget(null)}
          onToast={triggerToast}
        />
      )}

      {autopsyTarget && (
        <AutopsyDrawer
          job={autopsyTarget.job}
          application={autopsyTarget.application}
          onClose={() => setAutopsyTarget(null)}
          onToast={triggerToast}
        />
      )}
    </div>
  );
};

/* Application Detail Pane for List View */
const ApplicationDetail = ({
  application,
  job,
  updating,
  pendingDelete,
  onChangeStatus,
  onRequestDelete,
  onDelete,
  onSavePlan,
  onOpenPack,
  onOpenOutreach,
  onOpenStressTest,
  onOpenAutopsy,
  onDownloadResume,
}) => {
  if (!application) return null;

  const availableStatuses = ALLOWED_NEXT_STATUSES[application.status] || [];

  return (
    <article className="p-5 sm:p-7 lg:p-9 space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start border-b border-[#1F2937] pb-6">
        <div>
          <StatusBadge status={application.status} />
          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-100">
            {job.title || 'Saved Engineering Position'}
          </h2>
          <p className="mt-1 font-semibold text-slate-400">
            {job.company || 'Company unavailable'}
          </p>
        </div>

        {/* Action Toolkit */}
        <div className="flex flex-wrap items-center gap-2">
          <StudioButton
            variant="primary"
            size="sm"
            onClick={() => onOpenPack(job, application)}
            title="1-Click Complete Application Pack"
          >
            📦 Application Pack
          </StudioButton>

          <StudioButton
            variant="secondary"
            size="sm"
            icon={Send}
            onClick={() => onOpenOutreach(job, application)}
          >
            Outreach
          </StudioButton>

          <StudioButton
            variant="secondary"
            size="sm"
            icon={Shield}
            onClick={() => onOpenStressTest(job, application)}
            title="Stress-Test My Resume against technical interrogation"
          >
            Defense
          </StudioButton>

          <button
            type="button"
            onClick={() => onOpenAutopsy(job, application)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border',
              application.status === 'Rejected'
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            )}
          >
            <span>🔬</span>
            {application.status === 'Rejected' ? 'Post-Mortem Autopsy' : 'Pre-Mortem Audit'}
          </button>

          {application.resume_version_id && (
            <button
              type="button"
              onClick={() => onDownloadResume(application.resume_version_id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" /> Submitted Resume
            </button>
          )}

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition"
            >
              Job URL <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}

          {pendingDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRequestDelete(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-white/[0.06] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDelete(application.id)}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onRequestDelete(application.id)}
              className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
              aria-label="Delete application"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stage Advance Panel */}
      <section className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Advance Application Milestone
        </h3>
        {availableStatuses.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onChangeStatus(status)}
                disabled={updating}
                className="rounded-lg border border-slate-700 bg-[#0F141C] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-50 transition cursor-pointer"
              >
                Move to {status} &rarr;
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">This application is in a terminal milestone.</p>
        )}
      </section>

      {/* Application Plan & Notes */}
      <ApplicationPlan
        key={application.id}
        application={application}
        saving={updating}
        onSave={onSavePlan}
      />

      {/* Timeline */}
      <section className="pt-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Pipeline History Timeline
          </h3>
        </div>
        <div className="mt-4 space-y-4 border-l border-[#1F2937] pl-5">
          {(application.timeline || []).slice().reverse().map((event, index) => (
            <div key={`${event.created_at}-${index}`} className="relative">
              <span className="absolute -left-[1.45rem] top-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
              <p className="text-sm font-bold text-slate-200">{event.status}</p>
              <p className="mt-0.5 text-xs text-slate-400 font-mono">
                Changed by {event.source === 'user' ? 'you' : event.source} · {new Date(event.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};

/* Application Action Plan Form */
const ApplicationPlan = ({ application, saving, onSave }) => {
  const [nextAction, setNextAction] = useState(application.next_action || '');
  const [notes, setNotes] = useState(application.notes || '');
  const [deadline, setDeadline] = useState(toDateInput(application.deadline));
  const [followUp, setFollowUp] = useState(toDateInput(application.follow_up_at));

  const save = () => {
    onSave({
      next_action: nextAction || null,
      notes: notes || null,
      deadline: deadline ? `${deadline}T12:00:00` : null,
      follow_up_at: followUp ? `${followUp}T12:00:00` : null,
    });
  };

  return (
    <section className="border-t border-[#1F2937] pt-7">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
        Execution Plan &amp; Recruiter Notes
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-slate-300">Next Action Item</span>
          <input
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            placeholder="e.g. Verify GitHub repo proof, complete technical take-home, send alumni follow-up..."
            className="h-10 w-full rounded-xl border border-[#1F2937] bg-[#080B0F] px-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-300">Submission / Milestone Deadline</span>
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="h-10 w-full rounded-xl border border-[#1F2937] bg-[#080B0F] px-3 text-xs text-slate-100 focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-300">Outreach Follow-up Target</span>
          <input
            type="date"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
            className="h-10 w-full rounded-xl border border-[#1F2937] bg-[#080B0F] px-3 text-xs text-slate-100 focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-slate-300">Recruiter Context &amp; Interview Questions</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Recruiter name, referral source, interviewer topics, salary range discussions..."
            className="w-full rounded-xl border border-[#1F2937] bg-[#080B0F] p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        {saving ? 'Saving...' : 'Save Milestone Details'}
      </button>
    </section>
  );
};

/* =========================================================================
   HERO 4: APPLICATION AUTOPSY & PRE-MORTEM GAP RECOVERY DRAWER
   ========================================================================= */
const AutopsyDrawer = ({ job, application, onClose, onToast }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autopsy, setAutopsy] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [verifyingRepo, setVerifyingRepo] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [autopsyMode, setAutopsyMode] = useState(
    application.status === 'Rejected' ? 'post_mortem' : 'pre_mortem'
  );
  const [copiedKey, setCopiedKey] = useState(null);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    const fetchAutopsy = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getApplicationAutopsy(application.id);
        if (active) {
          setAutopsy(data);
          if (data.mode) {
            setAutopsyMode(data.mode);
          }
        }
      } catch (err) {
        if (active) setError(err.response?.data?.detail || 'Failed to run application autopsy.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAutopsy();
    return () => {
      active = false;
    };
  }, [application.id]);

  const handleVerifyRepo = async () => {
    if (!repoUrl.trim()) return;
    setVerifyingRepo(true);
    setVerifyError('');
    setVerifyResult(null);

    try {
      const skillToVerify = autopsy?.missing_skill || 'docker';
      const result = await verifyGitHubRepo(repoUrl.trim(), skillToVerify);
      setVerifyResult(result);
      if (result.verified) {
        onToast?.('GitHub repository verified! Evidence cleared.');
      }
    } catch (err) {
      setVerifyError(err.response?.data?.detail || 'GitHub repo inspection failed.');
    } finally {
      setVerifyingRepo(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    onToast?.('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPreMortem = autopsyMode === 'pre_mortem';
  const severity = autopsy?.severity || (isPreMortem ? 'HIGH' : 'CRITICAL');

  return (
    <StudioMotionDrawer
      isOpen={true}
      onClose={onClose}
      side="right"
      size="xl"
      className="bg-[#0F141C] border-l border-[#1F2937]"
    >
      <div className="space-y-6 pb-8">
        {/* Drawer Header with Title & Mode Switcher */}
        <div className="flex flex-col gap-4 border-b border-[#1F2937] pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl text-lg border',
                  isPreMortem
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                )}
              >
                🔬
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-100">
                    {isPreMortem ? 'Pre-Mortem Risk Audit' : 'Application Autopsy & Gap Recovery'}
                  </h2>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold border uppercase tracking-wider',
                      isPreMortem
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    )}
                  >
                    {isPreMortem ? 'Pre-Mortem' : 'Post-Mortem'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {job.title || 'Engineering Role'} · {job.company || 'Company'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Pre-Mortem vs Post-Mortem Toggle with layoutId Pill */}
          <div className="inline-flex self-start items-center gap-1 rounded-xl bg-[#080B0F] border border-[#1F2937] p-1">
            <button
              type="button"
              onClick={() => setAutopsyMode('pre_mortem')}
              className={cn(
                'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors select-none',
                isPreMortem ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {isPreMortem && (
                <MotionDiv
                  layoutId="autopsy-mode-pill"
                  className="absolute inset-0 rounded-lg bg-amber-500/20 border border-amber-500/40 shadow-sm"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 28 }
                  }
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>🔮</span> Pre-Mortem Risk Audit
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAutopsyMode('post_mortem')}
              className={cn(
                'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors select-none',
                !isPreMortem ? 'text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {!isPreMortem && (
                <MotionDiv
                  layoutId="autopsy-mode-pill"
                  className="absolute inset-0 rounded-lg bg-rose-500/20 border border-rose-500/40 shadow-sm"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 28 }
                  }
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>🔬</span> Post-Mortem Autopsy
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[35vh] place-items-center">
            <div className="text-center">
              <Loader2 className={cn('mx-auto h-8 w-8 animate-spin', isPreMortem ? 'text-amber-400' : 'text-rose-400')} />
              <p className="mt-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                {isPreMortem
                  ? 'Executing pre-mortem qualification audit against JD requirements...'
                  : 'Diagnosing root-cause fatal blockers and ATS keyword thresholds...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : autopsy && (
          <div className="space-y-6">
            {/* Fatal Blocker / Disqualifier Banner */}
            <div
              className={cn(
                'rounded-2xl border p-4.5 shadow-md',
                isPreMortem
                  ? 'border-amber-500/40 bg-amber-950/20 shadow-amber-500/5'
                  : 'border-rose-500/40 bg-rose-950/20 shadow-rose-500/5'
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn('flex items-center gap-2', isPreMortem ? 'text-amber-300' : 'text-rose-300')}>
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                    {isPreMortem ? 'Impending Risk Discovered' : 'Fatal Blocker Diagnosed'}
                  </h3>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider border',
                    severity === 'CRITICAL'
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-200'
                      : 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                  )}
                >
                  {severity}
                </span>
              </div>
              <p className={cn('mt-2.5 text-sm font-bold leading-snug', isPreMortem ? 'text-amber-100' : 'text-rose-100')}>
                {autopsy.fatal_blocker}
              </p>
              <p className={cn('mt-1.5 text-xs leading-relaxed', isPreMortem ? 'text-amber-300/80' : 'text-rose-300/80')}>
                {autopsy.why_it_disqualified}
              </p>
            </div>

            {/* 48-Hour Recovery Sprint Card & Growth Bridge Button */}
            <div className="rounded-2xl border border-[#1F2937] bg-[#171F2C] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> 48-Hour Growth Sprint Blueprint
                </span>
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300">
                  ⏱️ {autopsy.recovery_time_hours || 48}h Recovery Cycle
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100">
                  {autopsy.recommended_blueprint?.title || 'Targeted Technical Blueprint'}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  {autopsy.recommended_blueprint?.description ||
                    'Build and push production-ready evidence to permanently clear this gap from ATS and interviewer filters.'}
                </p>
              </div>

              {/* Actionable Fix Steps */}
              <div className="rounded-xl bg-[#0A0E14] border border-[#1F2937] p-3.5 space-y-2">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  3-Step Recovery Sequence:
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {(autopsy.actionable_fix_steps || []).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-mono font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 48-Hour Growth Bridge Button */}
              <div className="pt-2">
                <Link
                  to={autopsy.recommended_blueprint?.growth_url || `/growth?skill=${autopsy.missing_skill || ''}`}
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  Launch 48-Hour Sprint in Growth Studio ➔
                </Link>
              </div>
            </div>

            {/* In-Drawer Live GitHub Repository Verification Console */}
            <div className="rounded-2xl border border-[#1F2937] bg-[#171F2C] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-slate-200" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Live GitHub Evidence Verifier
                  </h4>
                </div>
                {autopsy.missing_skill && (
                  <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase text-cyan-300">
                    Target: {autopsy.missing_skill}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Paste your public GitHub repository URL to execute real AST scanning, commit audit, and synthesize an authenticated STAR resume bullet.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="flex-1 rounded-xl border border-[#1F2937] bg-[#080B0F] px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerifyRepo}
                  disabled={verifyingRepo || !repoUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50 transition cursor-pointer shrink-0"
                >
                  {verifyingRepo ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying AST...
                    </>
                  ) : (
                    <>
                      <Terminal className="h-3.5 w-3.5" /> Verify Repository
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Console Output */}
              <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#05070A] shadow-inner font-mono text-xs">
                {/* Terminal Title Bar */}
                <div className="flex items-center justify-between border-b border-[#1F2937] bg-[#0A0E14] px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      bash — proof-verifier:~/evidence/github
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Live AST Engine</span>
                </div>

                {/* Terminal Content Body */}
                <div className="p-4 space-y-2 text-slate-300 leading-relaxed min-h-[140px]">
                  <div className="text-slate-500">
                    $ git verify-repo --target={autopsy.missing_skill || 'skill'} --url={repoUrl || 'https://github.com/...'}
                  </div>

                  {verifyingRepo && (
                    <div className="space-y-1 text-cyan-300">
                      <p>&gt; [1/4] Connecting to GitHub repository tree...</p>
                      <p>&gt; [2/4] Parsing AST signatures for evidence of '{autopsy.missing_skill || 'skill'}'...</p>
                      <p>&gt; [3/4] Validating commit lineage and test suite harness...</p>
                      <p className="animate-pulse">&gt; [4/4] Evaluating production readiness gates... ▌</p>
                    </div>
                  )}

                  {!verifyingRepo && !verifyResult && !verifyError && (
                    <div className="text-slate-500 italic">
                      # Ready for inspection. Paste public repo and run scan to eliminate gap.
                    </div>
                  )}

                  {verifyError && (
                    <div className="rounded-lg bg-rose-950/30 border border-rose-500/30 p-2.5 text-rose-300">
                      ✖ Error: {verifyError}
                    </div>
                  )}

                  {verifyResult && (
                    <div className="space-y-2.5">
                      <div className={cn(
                        'flex items-center gap-2 font-bold',
                        verifyResult.verified ? 'text-emerald-400' : 'text-rose-400'
                      )}>
                        {verifyResult.verified ? (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            <span>✔ REPO VERIFIED: Authentic {autopsy.missing_skill?.toUpperCase() || 'Skill'} Proof Confirmed!</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-4 w-4" />
                            <span>✖ GATES FAILED: Verification criteria not met.</span>
                          </>
                        )}
                      </div>

                      {verifyResult.reasons && verifyResult.reasons.length > 0 && (
                        <div className="space-y-1 pl-1 text-[11px] text-slate-400">
                          {verifyResult.reasons.map((r, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className={verifyResult.verified ? 'text-emerald-400' : 'text-rose-400'}>
                                {verifyResult.verified ? '[PASS]' : '[FAIL]'}
                              </span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {verifyResult.generated_bullet && (
                        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3" /> STAR Resume Bullet Ready for Insertion:
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(verifyResult.generated_bullet, 'terminal-star')}
                              className="inline-flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
                            >
                              {copiedKey === 'terminal-star' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedKey === 'terminal-star' ? 'Copied' : 'Copy Bullet'}
                            </button>
                          </div>
                          <p className="text-xs text-slate-200 font-sans italic">
                            &ldquo;{verifyResult.generated_bullet}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudioMotionDrawer>
  );
};

/* =========================================================================
   HERO 2: RESUME DEFENSE INTERROGATION MODAL
   ========================================================================= */
const VULNERABILITY_BADGES = {
  'High Risk': {
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    dotClass: 'bg-rose-400 animate-ping',
    baseDot: 'bg-rose-400',
    label: 'High Risk',
  },
  'Medium Risk': {
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    dotClass: 'bg-amber-400 animate-ping',
    baseDot: 'bg-amber-400',
    label: 'Medium Risk',
  },
  'Rock Solid': {
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    dotClass: 'bg-emerald-400 animate-ping',
    baseDot: 'bg-emerald-400',
    label: 'Rock Solid',
  },
};

const StressTestModal = ({ job, application, onClose, onToast }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedCode, setExpandedCode] = useState({});
  const [readinessScores, setReadinessScores] = useState({});

  useEffect(() => {
    let active = true;
    const fetchMatrix = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getResumeDefenseStressTest(application.id);
        if (active) setMatrix(data);
      } catch (err) {
        if (active) setError(err.response?.data?.detail || 'Failed to generate resume defense stress test.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMatrix();
    return () => {
      active = false;
    };
  }, [application.id]);

  const copyText = (text, key, label = 'Copied') => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    onToast?.(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleCode = (index) => {
    setExpandedCode((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const setPracticeScore = (index, score) => {
    setReadinessScores((prev) => {
      const current = prev[index];
      const updated = current === score ? null : score;
      if (updated) {
        const labels = {
          need_practice: 'Flagged for practice drills',
          prepared: 'Marked as prepared',
          ironclad: 'Defense rated ironclad',
        };
        onToast?.(labels[updated] || 'Scored');
      }
      return {
        ...prev,
        [index]: updated,
      };
    });
  };

  const readinessSummary = useMemo(() => {
    const counts = { need_practice: 0, prepared: 0, ironclad: 0 };
    Object.values(readinessScores).forEach((val) => {
      if (counts[val] !== undefined) counts[val] += 1;
    });
    return counts;
  }, [readinessScores]);

  const confidenceScore = matrix?.defense_confidence_score ?? 85;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#0F141C] border border-[#1F2937] p-6 shadow-2xl text-slate-100">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#1F2937] pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-lg">
              🛡️
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-100">Resume Defense Interrogator</h2>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border',
                    confidenceScore >= 80
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  )}
                >
                  {confidenceScore}% Defense Confidence
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {job.title || 'Role'} · {job.company || matrix?.company || 'Target Company'} ·{' '}
                <span className="font-semibold text-purple-300 font-mono">
                  {matrix?.interrogation_level || 'Aggressive Technical Screen'}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-[35vh] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
              <p className="mt-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Stress-testing candidate resume claims against technical hiring bar...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : matrix && (
          <div className="mt-5 space-y-5">
            {/* Telemetry Radar Bar & Practice Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 text-xs text-slate-300">
              <div className="max-w-md">
                <p className="font-bold text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-400" /> Grounded Technical Drill-Down Interrogation
                </p>
                <p className="mt-0.5 text-slate-400 text-[11px] leading-relaxed">
                  Senior engineering interviewers probe every bullet point. Review claim vulnerability ratings, test intents, and self-score your practice readiness.
                </p>
              </div>

              {/* Interactive Practice Radar Score Tally */}
              <div className="flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#0A0E14] px-3 py-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Readiness:
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  😟 {readinessSummary.need_practice}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  😐 {readinessSummary.prepared}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  🛡️ {readinessSummary.ironclad}
                </span>
              </div>
            </div>

            {/* Drill-Down Questions List */}
            <div className="space-y-4">
              {(matrix.drill_down_questions || []).map((item, index) => {
                const rating = item.vulnerability_rating || 'Medium Risk';
                const badge = VULNERABILITY_BADGES[rating] || VULNERABILITY_BADGES['Medium Risk'];
                const isCodeOpen = expandedCode[index];
                const userScore = readinessScores[index];

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4.5 shadow-sm space-y-3.5 transition hover:border-slate-700"
                  >
                    {/* Claim Badge & Vulnerability Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#0A0E14] border border-[#1F2937] px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                          Claim {index + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Technical Screen Probe
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-sm select-none',
                            badge.badgeClass
                          )}
                          title={`Claim Vulnerability Level: ${rating}`}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', badge.dotClass)} />
                            <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', badge.baseDot)} />
                          </span>
                          {rating}
                        </span>
                      </div>
                    </div>

                    {/* Resume Quoted Claim */}
                    <blockquote className="rounded-lg border-l-2 border-purple-400 bg-[#0A0E14] py-2 px-3 text-xs italic text-slate-300">
                      &ldquo;{item.claim}&rdquo;
                    </blockquote>

                    {/* Interviewer Drill-Down Question */}
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                        Interviewer Drill-Down Question
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-100 leading-snug">
                        {item.question}
                      </p>
                    </div>

                    {/* What Interviewer Tests */}
                    <div className="rounded-lg border border-[#1F2937] bg-[#0A0E14] p-3 text-xs text-slate-300">
                      <span className="font-bold text-purple-300 font-mono">Test Intent: </span>
                      {item.what_interviewer_tests}
                    </div>

                    {/* Candidate Defense Blueprint */}
                    <div className="rounded-xl border border-[#1F2937] bg-[#0F141C] p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                          Candidate Architectural Defense Blueprint
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(item.candidate_defense_blueprint, `${index}-blueprint`, 'Defense blueprint copied')}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-white/[0.04] px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
                        >
                          {copiedKey === `${index}-blueprint` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-400" /> Copy Defense
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300 bg-[#0A0E14] p-3 rounded-lg border border-[#1F2937] font-sans">
                        {item.candidate_defense_blueprint}
                      </p>
                    </div>

                    {/* Model Spoken Answer (STAR Technique) */}
                    {item.model_interview_answer && (
                      <div className="rounded-xl border border-sky-500/20 bg-sky-950/15 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                            <span>🎙️</span> Model Spoken Answer (STAR Technique)
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(item.model_interview_answer, `${index}-answer`, 'Spoken answer copied')}
                            className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20 transition cursor-pointer"
                          >
                            {copiedKey === `${index}-answer` ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-sky-400" /> Copy Answer
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200 italic bg-[#0A0E14] p-3 rounded-lg border border-[#1F2937] font-sans">
                          &ldquo;{item.model_interview_answer}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Syntax-Highlighted Code Defense Block */}
                    {item.code_defense_snippet && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleCode(index)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                        >
                          <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{isCodeOpen ? 'Hide Production Code Defense' : '💻 Inspect Production Code Defense'}</span>
                          {isCodeOpen ? (
                            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>

                        {isCodeOpen && (
                          <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#05070A] shadow-md">
                            <div className="flex items-center justify-between border-b border-[#1F2937] bg-[#0A0E14] px-3.5 py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Production Code Defense Blueprint
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText(item.code_defense_snippet, `${index}-code`, 'Code defense snippet copied')}
                                className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#171F2C] px-2.5 py-1 text-[10px] font-mono font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                              >
                                {copiedKey === `${index}-code` ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" /> Copied Code
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-400" /> Copy Code
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
                              <SyntaxHighlightedCode code={item.code_defense_snippet} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Practice Self-Scoring Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1F2937] pt-3">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Practice Self-Scoring:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPracticeScore(index, 'need_practice')}
                          className={cn(
                            'rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border',
                            userScore === 'need_practice'
                              ? 'border-rose-500/50 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/30 shadow-sm'
                              : 'border-slate-700 bg-[#0A0E14] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          )}
                        >
                          [ 😟 Need Practice ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setPracticeScore(index, 'prepared')}
                          className={cn(
                            'rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border',
                            userScore === 'prepared'
                              ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/30 shadow-sm'
                              : 'border-slate-700 bg-[#0A0E14] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          )}
                        >
                          [ 😐 Prepared ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setPracticeScore(index, 'ironclad')}
                          className={cn(
                            'rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border',
                            userScore === 'ironclad'
                              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30 shadow-sm'
                              : 'border-slate-700 bg-[#0A0E14] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          )}
                        >
                          [ 🛡️ Ironclad ]
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Syntax Highlighting for Code Defense Snippets */
const SyntaxHighlightedCode = ({ code = '' }) => {
  const lines = useMemo(() => code.split('\n'), [code]);

  return (
    <div className="table w-full border-collapse">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        const isComment = trimmed.startsWith('#') || trimmed.startsWith('--') || trimmed.startsWith('//');

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

        // Tokenize code lines into keywords, strings, numbers, and identifiers
        const tokenRegex = /(".*?"|'.*?'|\b(?:FROM|WORKDIR|RUN|COPY|USER|EXPOSE|ENTRYPOINT|AS|EXPLAIN|ANALYZE|BUFFERS|TIMING|FORMAT|TEXT|SELECT|JOIN|ON|WHERE|AND|OR|ORDER|BY|DESC|ASC|LIMIT|CREATE|INDEX|CONCURRENTLY|IF|NOT|EXISTS|INCLUDE|def|class|import|from|return|async|await|with|yield|try|except|for|in|if|else|elif|True|False|None|const|let|var|function)\b|\b\d+\b|[^\s"'\w]+|\s+|\w+)/g;
        const tokens = line.match(tokenRegex) || [line];

        return (
          <div key={lineIdx} className="table-row">
            <span className="table-cell select-none pr-4 text-right text-slate-600 font-mono text-xs w-8">
              {lineIdx + 1}
            </span>
            <span className="table-cell font-mono text-xs whitespace-pre">
              {tokens.map((token, tokIdx) => {
                if (/^(".*"|'.*')$/.test(token)) {
                  return <span key={tokIdx} className="text-emerald-400">{token}</span>;
                }
                if (/^\b(?:FROM|WORKDIR|RUN|COPY|USER|EXPOSE|ENTRYPOINT|AS|EXPLAIN|ANALYZE|BUFFERS|TIMING|FORMAT|TEXT|SELECT|JOIN|ON|WHERE|AND|OR|ORDER|BY|DESC|ASC|LIMIT|CREATE|INDEX|CONCURRENTLY|IF|NOT|EXISTS|INCLUDE|def|class|import|from|return|async|await|with|yield|try|except|for|in|if|else|elif|True|False|None|const|let|var|function)\b$/.test(token)) {
                  return <span key={tokIdx} className="text-cyan-400 font-semibold">{token}</span>;
                }
                if (/^\d+$/.test(token)) {
                  return <span key={tokIdx} className="text-amber-400">{token}</span>;
                }
                if (/^[A-Z_][A-Z0-9_]*$/.test(token) && token.length > 2) {
                  return <span key={tokIdx} className="text-purple-300">{token}</span>;
                }
                return <span key={tokIdx} className="text-slate-200">{token}</span>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================
   MULTI-CHANNEL OUTREACH PACK MODAL
   ========================================================================= */
const OutreachModal = ({ job, onClose, onToast }) => {
  const [recruiterName, setRecruiterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState('linkedin');

  const shouldReduceMotion = useReducedMotion();

  const fetchOutreach = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateOutreach({
        job_title: job.title || 'Software Engineer',
        company_name: job.company || 'Company',
        key_skills: job.skills || ['Python', 'FastAPI'],
        recruiter_name: recruiterName.trim() || null,
      });

      // Construct Alumni Casual Note for the 3rd channel if missing
      const candidateName = 'Candidate';
      const topSkill = (job.skills && job.skills[0]) || 'software engineering';
      const alumniNote = `Hi! Saw your work at ${job.company || 'the team'}. Fellow engineer working in ${topSkill} - would love to connect briefly and say hello! Best, ${candidateName}`;

      setPackageData({
        ...data,
        alumni_note: alumniNote,
        alumni_char_count: alumniNote.length,
      });
    } catch {
      // Fallback generator
      const linkedinNote = generateClientOutreachNote({
        jobTitle: job.title,
        company: job.company,
        keySkill: (job.skills && job.skills[0]) || 'software engineering',
        recruiterName,
      });
      const topSkill = (job.skills && job.skills[0]) || 'software engineering';
      const alumniNote = `Hi! Saw your work at ${job.company || 'the team'}. Fellow engineer working in ${topSkill} - would love to connect briefly and say hello! Best, Candidate`;

      setPackageData({
        linkedin_note: linkedinNote,
        linkedin_char_count: linkedinNote.length,
        alumni_note: alumniNote,
        alumni_char_count: alumniNote.length,
        cold_email: {
          subject: `Application: ${job.title || 'Software Engineer'} - Engineering Inquiry`,
          body: `Hi ${recruiterName.trim() || 'Hiring Team'},\n\nI recently applied for the ${job.title || 'Software Engineer'} role at ${job.company || 'Company'}. As an aspiring software engineer with hands-on project experience in ${topSkill}, I would love to learn more about your team's engineering goals.\n\nThank you,\nCandidate`,
        },
        follow_up_note: `Hi ${recruiterName.trim() || 'there'}, following up on my application for ${job.title} at ${job.company}. Excited about the role and would love to connect!`,
      });
    } finally {
      setLoading(false);
    }
  }, [job.company, job.skills, job.title, recruiterName]);

  useEffect(() => {
    fetchOutreach();
  }, [fetchOutreach]);

  const copyToClipboard = (text, key, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    onToast?.(label || 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const linkedinLength = (packageData?.linkedin_note || '').length;
  const alumniLength = (packageData?.alumni_note || '').length;
  const emailFullText = packageData
    ? `Subject: ${packageData.cold_email.subject}\n\n${packageData.cold_email.body}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#0F141C] border border-[#1F2937] p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-lg">
              ✉️
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-100">Multi-Channel Outreach Pack</h2>
              <p className="text-xs text-slate-400 font-medium">
                {job.title} · {job.company}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Recruiter Name Personalization Form */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Recruiter's Name (optional, e.g. Sarah Connor)"
            value={recruiterName}
            onChange={(e) => setRecruiterName(e.target.value)}
            className="flex-1 rounded-xl border border-[#1F2937] bg-[#080B0F] px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={fetchOutreach}
            disabled={loading}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Personalize'}
          </button>
        </div>

        {packageData && (
          <div className="mt-5 space-y-5">
            {/* Studio Tab Switcher with layoutId Indicator */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#080B0F] border border-[#1F2937] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('linkedin')}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                  activeTab === 'linkedin' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {activeTab === 'linkedin' && (
                  <MotionDiv
                    layoutId="outreach-channel-tab"
                    className="absolute inset-0 rounded-lg bg-emerald-500/20 border border-emerald-500/40"
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>💼</span> LinkedIn Note (&lt;300)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alumni')}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                  activeTab === 'alumni' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {activeTab === 'alumni' && (
                  <MotionDiv
                    layoutId="outreach-channel-tab"
                    className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/40"
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Alumni Chat (&lt;200)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cold_email')}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                  activeTab === 'cold_email' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {activeTab === 'cold_email' && (
                  <MotionDiv
                    layoutId="outreach-channel-tab"
                    className="absolute inset-0 rounded-lg bg-cyan-500/20 border border-cyan-500/40"
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Cold Email Pitch
                </span>
              </button>
            </div>

            {/* TAB 1: LinkedIn Note */}
            {activeTab === 'linkedin' && (
              <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    LinkedIn Connection Request
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border',
                        linkedinLength <= 300
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      )}
                    >
                      {linkedinLength} / 300 chars
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {300 - linkedinLength >= 0 ? `${300 - linkedinLength} left` : `${linkedinLength - 300} over limit`}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-200 bg-[#0A0E14] p-3.5 rounded-xl border border-[#1F2937] font-mono">
                  {packageData.linkedin_note}
                </p>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(packageData.linkedin_note, 'linkedin', 'Copied LinkedIn note to clipboard!')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    {copiedKey === 'linkedin' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    {copiedKey === 'linkedin' ? 'Copied to Clipboard' : 'Copy LinkedIn Note'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Alumni Note */}
            {activeTab === 'alumni' && (
              <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Alumni &amp; Peer Warm Opener
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border',
                        alumniLength <= 200
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      )}
                    >
                      {alumniLength} / 200 chars
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {200 - alumniLength >= 0 ? `${200 - alumniLength} left` : `${alumniLength - 200} over limit`}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-200 bg-[#0A0E14] p-3.5 rounded-xl border border-[#1F2937] font-mono">
                  {packageData.alumni_note}
                </p>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(packageData.alumni_note, 'alumni', 'Copied Alumni note to clipboard!')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    {copiedKey === 'alumni' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    {copiedKey === 'alumni' ? 'Copied to Clipboard' : 'Copy Alumni Opener'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Cold Email Pitch */}
            {activeTab === 'cold_email' && (
              <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Cold Email / InMail Pitch
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(emailFullText, 'email_full', 'Copied full email pitch!')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                  >
                    {copiedKey === 'email_full' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === 'email_full' ? 'Copied Full Email' : 'Copy Full Email'}
                  </button>
                </div>

                <div className="rounded-lg bg-[#0A0E14] border border-[#1F2937] p-3 text-xs space-y-1">
                  <p className="text-slate-400 font-mono">
                    <span className="text-slate-500 font-bold uppercase">Subject:</span>{' '}
                    <span className="text-slate-100">{packageData.cold_email.subject}</span>
                  </p>
                </div>

                <pre className="whitespace-pre-wrap rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 font-sans text-xs leading-relaxed text-slate-200">
                  {packageData.cold_email.body}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   APPLICATION PACK MODAL (EXPORTED FOR SearchJobs.jsx)
   ========================================================================= */
export const ApplicationPackModal = ({ job, application, onClose, onToast }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packData, setPackData] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [candidateName, setCandidateName] = useState('Candidate');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [screeningDrawerOpen, setScreeningDrawerOpen] = useState(true);
  const [outreachTab, setOutreachTab] = useState('linkedin');

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    const loadPack = async () => {
      setLoading(true);
      setError('');
      try {
        const [profile, resumes] = await Promise.all([
          getCandidateProfile().catch(() => ({})),
          getAllResumes().catch(() => []),
        ]);

        if (!active) return;

        const targetResumeId = application?.resume_id;
        const matchedResume = targetResumeId
          ? resumes.find((r) => r.id === targetResumeId)
          : resumes[0];
        const effectiveResume = matchedResume?.raw_text || resumes[0]?.raw_text || '';
        const name = (profile?.full_name || '').trim() ||
          (effectiveResume ? effectiveResume.trim().split('\n')[0].replace(/[^a-zA-Z\s.-]/g, '').trim() : '') ||
          'Candidate';

        setResumeText(effectiveResume);
        setCandidateName(name);

        const pack = await getApplicationPack({
          candidate_name: name,
          resume_text: effectiveResume,
          job_title: job?.title || 'Software Engineer',
          company: job?.company || 'Company',
          job_description: job?.description || '',
        });

        if (active) {
          setPackData(pack);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.detail || 'Failed to assemble application pack.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPack();

    return () => {
      active = false;
    };
  }, [job, application?.resume_id]);

  const copyToClipboard = (text, key, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    onToast?.(label || 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const fallbackText = `${candidateName} | Software Engineer\n\nTECHNICAL SKILLS\nPython, FastAPI, React, Docker, PostgreSQL, Redis, TypeScript, AWS, Git\n\nEXPERIENCE\nSoftware Engineer\n- Engineered modular backend services with high test coverage and low latency.\n- Optimized data pipelines and deployed containerized services.`;
      const textToExport = resumeText.trim() ? resumeText : fallbackText;

      const fileBlob = await exportPdfDirect({
        resume_text: textToExport,
        candidate_name: candidateName,
      });

      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'Candidate';
      link.href = url;
      link.download = `${safeName}_Harvard_ATS_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onToast?.('Harvard ATS Resume PDF downloaded');
    } catch {
      setError('Could not download Harvard ATS PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCoverLetter = () => {
    if (!packData?.cover_letter_text) return;
    const blob = new Blob([packData.cover_letter_text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCompany = (job?.company || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${safeCompany}_Tailored_Cover_Letter.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    onToast?.('Tailored Cover Letter saved');
  };

  const linkedinLength = (packData?.outreach_note_300 || '').length;
  const alumniLength = (packData?.alumni_casual_note || '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#0F141C] border border-[#1F2937] p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1F2937] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-lg">
              📦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">1-Click Application Pack</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
                  Ready to Submit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {job?.title || 'Engineering Role'} · {job?.company || 'Target Company'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Generating truth-guarded cover letter, outreach &amp; screening answers...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : packData && (
          <div className="mt-5 space-y-6">
            {/* Top Bar: 1-Click Harvard ATS PDF */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#1F2937] bg-[#171F2C] p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  Harvard ATS-Formatted Resume
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Single-column standard ATS template optimized for screening software.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloadingPdf ? 'Generating PDF...' : 'Download Harvard ATS PDF'}
              </button>
            </div>

            {/* Tailored Cover Letter */}
            <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    Truth-Guarded Tailored Cover Letter
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    3-paragraph letter grounded exclusively in your verified technical skills.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(packData.cover_letter_text, 'cover_letter', 'Copied cover letter')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    {copiedKey === 'cover_letter' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    {copiedKey === 'cover_letter' ? 'Copied Letter' : 'Copy Letter'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCoverLetter}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    Download .txt
                  </button>
                </div>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[#1F2937] bg-[#0A0E14] p-4 font-sans text-xs leading-relaxed text-slate-200">
                {packData.cover_letter_text}
              </pre>
            </div>

            {/* Multi-Channel Outreach Toolkit */}
            <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Send className="h-4 w-4 text-cyan-400" />
                    Multi-Channel Outreach Toolkit
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    High-conversion outreach tailored for each networking and recruiting channel.
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#080B0F] border border-[#1F2937] p-1">
                  <button
                    type="button"
                    onClick={() => setOutreachTab('linkedin')}
                    className={cn(
                      'relative px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                      outreachTab === 'linkedin' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {outreachTab === 'linkedin' && (
                      <MotionDiv
                        layoutId="pack-outreach-tab"
                        className="absolute inset-0 rounded-lg bg-emerald-500/20 border border-emerald-500/40"
                        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>💼</span> LinkedIn (&lt;300)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutreachTab('alumni')}
                    className={cn(
                      'relative px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                      outreachTab === 'alumni' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {outreachTab === 'alumni' && (
                      <MotionDiv
                        layoutId="pack-outreach-tab"
                        className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/40"
                        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>🎓</span> Alumni (&lt;200)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutreachTab('cold_email')}
                    className={cn(
                      'relative px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                      outreachTab === 'cold_email' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {outreachTab === 'cold_email' && (
                      <MotionDiv
                        layoutId="pack-outreach-tab"
                        className="absolute inset-0 rounded-lg bg-cyan-500/20 border border-cyan-500/40"
                        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>✉️</span> Cold Email
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab 1: LinkedIn Note */}
              {outreachTab === 'linkedin' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Standard LinkedIn connection invitation limit
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border',
                          linkedinLength <= 300
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        )}
                      >
                        {linkedinLength} / 300 chars
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(packData.outreach_note_300, 'pack-linkedin', 'Copied LinkedIn note')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                      >
                        {copiedKey === 'pack-linkedin' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                        {copiedKey === 'pack-linkedin' ? 'Copied Note' : 'Copy Note'}
                      </button>
                    </div>
                  </div>
                  <p className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 font-mono text-xs leading-relaxed text-slate-200">
                    {packData.outreach_note_300}
                  </p>
                </div>
              )}

              {/* Tab 2: Alumni Chat */}
              {outreachTab === 'alumni' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Low-friction mutual alumni or peer conversation starter
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border',
                          alumniLength <= 200
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        )}
                      >
                        {alumniLength} / 200 chars
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(packData.alumni_casual_note, 'pack-alumni', 'Copied Alumni note')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                      >
                        {copiedKey === 'pack-alumni' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                        {copiedKey === 'pack-alumni' ? 'Copied Note' : 'Copy Note'}
                      </button>
                    </div>
                  </div>
                  <p className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 font-mono text-xs leading-relaxed text-slate-200">
                    {packData.alumni_casual_note}
                  </p>
                </div>
              )}

              {/* Tab 3: Cold Email Pitch */}
              {outreachTab === 'cold_email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Full pitch with subject line and 2 focused paragraphs
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const full = `Subject: ${packData.cold_email_pitch?.subject || ''}\n\n${packData.cold_email_pitch?.body || ''}`;
                        copyToClipboard(full, 'pack-cold_email_full', 'Copied full email pitch');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                    >
                      {copiedKey === 'pack-cold_email_full' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey === 'pack-cold_email_full' ? 'Copied Full Email' : 'Copy Full Email'}
                    </button>
                  </div>

                  {/* Subject Line */}
                  <div className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3">
                    <p className="text-[11px] font-mono text-slate-400 mb-1">Subject Line:</p>
                    <p className="font-mono text-xs font-semibold text-slate-100">
                      {packData.cold_email_pitch?.subject}
                    </p>
                  </div>

                  {/* Body */}
                  <pre className="whitespace-pre-wrap rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 font-sans text-xs leading-relaxed text-slate-200">
                    {packData.cold_email_pitch?.body}
                  </pre>
                </div>
              )}
            </div>

            {/* Screening Answers Drawer */}
            <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-5 shadow-xs">
              <button
                type="button"
                onClick={() => setScreeningDrawerOpen(!screeningDrawerOpen)}
                className="flex w-full items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">
                      High-Frequency ATS Screening Questions &amp; Answers
                    </h3>
                    <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-300">
                      {packData.screening_answers?.length || 0} Questions
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Grounded answers tailored to your tech stack for 1-click ATS application form pasting.
                  </p>
                </div>
                {screeningDrawerOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {screeningDrawerOpen && (
                <div className="mt-4 space-y-3 pt-3 border-t border-[#1F2937]">
                  {(packData.screening_answers || []).map((item, index) => (
                    <div key={index} className="rounded-xl border border-[#1F2937] bg-[#0A0E14] p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-bold text-slate-200">
                          {item.question}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.answer, `screen-${index}`, 'Copied screening answer')}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-white/[0.04] px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/[0.08] transition shrink-0 cursor-pointer"
                        >
                          {copiedKey === `screen-${index}` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-400" /> Copy Answer
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300 bg-[#0F141C] p-2.5 rounded-lg border border-[#1F2937]">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const StatusBadge = ({ status }) => {
  const theme = STAGE_THEMES[status] || STAGE_THEMES.Saved;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold select-none',
        'bg-white/[0.06] border-white/10 text-slate-200'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', theme.dotClass)} />
      {status || 'Saved'}
    </span>
  );
};

export default Applications;
