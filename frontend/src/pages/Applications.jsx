import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Columns3,
  Copy,
  Download,
  FileText,
  Github,
  List,
  Loader2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
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


const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'list'
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Outreach and analysis modals
  const [packTarget, setPackTarget] = useState(null);
  const [outreachTarget, setOutreachTarget] = useState(null);
  const [stressTestTarget, setStressTestTarget] = useState(null);
  const [autopsyTarget, setAutopsyTarget] = useState(null);

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
    } catch {
      setError('Could not download the submitted resume.');
    }
  };

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#708090]" /></div>;
  }

  const grouped = groupApplicationsByStatus(applications);

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Your follow-through</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Applications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Track and advance every application through each hiring milestone with zero guesswork.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode('pipeline')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === 'pipeline' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Columns3 className="h-3.5 w-3.5" /> Pipeline Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <List className="h-3.5 w-3.5" /> List View
          </button>
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 font-bold text-slate-950">No applications saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Discover relevant fresher jobs and save them to track your pipeline here.</p>
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-6">
          {APPLICATION_STATUSES.map((status) => {
            const columnApps = grouped[status] || [];
            return (
              <div key={status} className="flex min-w-[240px] flex-col rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{status}</h3>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{columnApps.length}</span>
                </div>
                <div className="mt-3 flex-1 space-y-3">
                  {columnApps.map((app) => {
                    const job = jobs[app.job_id] || {};
                    const allowedNext = ALLOWED_NEXT_STATUSES[app.status] || [];
                    return (
                      <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 leading-snug">{job.title || 'Saved Job'}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 font-medium">{job.company || 'Company'}</p>
                        {job.location && <p className="text-[11px] text-slate-400">{job.location}</p>}

                        {app.next_action && (
                          <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-100">
                            <span className="font-bold text-slate-700">Next: </span>{app.next_action}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setPackTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-900 bg-slate-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
                            title="1-Click Complete Application Pack"
                          >
                            📦 Application Pack
                          </button>

                          <button
                            type="button"
                            onClick={() => setOutreachTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <Send className="h-3 w-3 text-slate-500" /> Outreach
                          </button>

                          <button
                            type="button"
                            onClick={() => setStressTestTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            title="Stress-Test My Resume against technical interrogation"
                          >
                            🛡️ Stress-Test
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutopsyTarget({ job, application: app })}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
                              app.status === 'Rejected'
                                ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                            title={
                              app.status === 'Rejected'
                                ? 'Run application autopsy to diagnose fatal blockers'
                                : 'Run pre-mortem risk audit to detect fatal gaps before rejection'
                            }
                          >
                            {app.status === 'Rejected' ? '🔬 Post-Mortem Autopsy' : '🔬 Pre-Mortem Risk Audit'}
                          </button>

                          {app.resume_version_id && (
                            <button
                              type="button"
                              onClick={() => handleDownloadSubmittedResume(app.resume_version_id)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                              title="Download submitted resume"
                            >
                              <Download className="h-3 w-3 text-slate-500" /> Resume
                            </button>
                          )}
                        </div>

                        {allowedNext.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {allowedNext.map((nextSt) => (
                              <button
                                key={nextSt}
                                type="button"
                                disabled={updating}
                                onClick={() => changeApplicationStatus(app.id, nextSt)}
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              >
                                &rarr; {nextSt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {columnApps.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      No jobs in {status.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-[35rem] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[0.72fr_1.28fr]">
          <section className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-bold text-slate-950">{applications.length} saved {applications.length === 1 ? 'application' : 'applications'}</p>
            </div>
            <div className="p-2">
              {applications.map((application) => {
                const job = jobs[application.job_id] || {};
                const active = selectedApplication?.id === application.id;
                return (
                  <button key={application.id} type="button" onClick={() => setSelectedId(application.id)} className={`w-full rounded-xl border p-4 text-left ${active ? 'border-[#d3d3d3] bg-[#eef0f1]' : 'border-transparent hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{job.title || 'Saved job'}</p>
                        <p className="mt-1 text-sm text-slate-600">{job.company || 'Company unavailable'}</p>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Added {new Date(application.created_at).toLocaleDateString('en-IN')}</p>
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

      {packTarget && (
        <ApplicationPackModal
          job={packTarget.job}
          application={packTarget.application}
          onClose={() => setPackTarget(null)}
        />
      )}

      {outreachTarget && (
        <OutreachModal
          job={outreachTarget.job}
          application={outreachTarget.application}
          onClose={() => setOutreachTarget(null)}
        />
      )}

      {stressTestTarget && (
        <StressTestModal
          job={stressTestTarget.job}
          application={stressTestTarget.application}
          onClose={() => setStressTestTarget(null)}
        />
      )}

      {autopsyTarget && (
        <AutopsyDrawer
          job={autopsyTarget.job}
          application={autopsyTarget.application}
          onClose={() => setAutopsyTarget(null)}
        />
      )}
    </div>
  );
};


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
    <article className="p-5 sm:p-7 lg:p-9">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <StatusBadge status={application.status} />
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">{job.title || 'Saved job'}</h2>
          <p className="mt-1 font-bold text-slate-600">{job.company || 'Company unavailable'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenPack(job, application)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
            title="1-Click Complete Application Pack"
          >
            📦 Application Pack
          </button>

          <button
            type="button"
            onClick={() => onOpenOutreach(job, application)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <Send className="h-3.5 w-3.5" /> Recruiter Outreach
          </button>

          <button
            type="button"
            onClick={() => onOpenStressTest(job, application)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            title="Stress-Test My Resume against technical interrogation"
          >
            🛡️ Stress-Test
          </button>

          <button
            type="button"
            onClick={() => onOpenAutopsy(job, application)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              application.status === 'Rejected'
                ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            title={
              application.status === 'Rejected'
                ? 'Run application autopsy to diagnose fatal blockers'
                : 'Run pre-mortem risk audit to detect fatal gaps before rejection'
            }
          >
            {application.status === 'Rejected' ? '🔬 Post-Mortem Autopsy' : '🔬 Pre-Mortem Risk Audit'}
          </button>

          {application.resume_version_id && (
            <button
              type="button"
              onClick={() => onDownloadResume(application.resume_version_id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" /> Submitted Resume
            </button>
          )}

          {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Job page <ArrowUpRight className="h-3.5 w-3.5" /></a>}
          {pendingDelete ? (
            <>
              <button type="button" onClick={() => onRequestDelete(null)} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={() => onDelete(application.id)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">Delete</button>
            </>
          ) : (
            <button type="button" onClick={() => onRequestDelete(application.id)} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-700" aria-label="Delete application"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-[#fafaf7] p-5">
        <h3 className="text-sm font-bold text-slate-950">Update status</h3>
        {availableStatuses.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <button key={status} type="button" onClick={() => onChangeStatus(status)} disabled={updating} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#b9c1c6] hover:text-[#36454f] disabled:opacity-50">
                Move to {status}
              </button>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-slate-500">This application is in a final stage.</p>}
      </section>

      <ApplicationPlan key={application.id} application={application} saving={updating} onSave={onSavePlan} />

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-950">Timeline</h3>
        </div>
        <div className="mt-4 space-y-4 border-l border-slate-200 pl-5">
          {(application.timeline || []).slice().reverse().map((event, index) => (
            <div key={`${event.created_at}-${index}`} className="relative">
              <span className="absolute -left-[1.43rem] top-1 h-2 w-2 rounded-full bg-[#36454f]" />
              <p className="text-sm font-bold text-slate-800">{event.status}</p>
              <p className="mt-0.5 text-xs text-slate-500">Changed by {event.source === 'user' ? 'you' : event.source} · {new Date(event.created_at).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};


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
    <section className="mt-8 border-t border-slate-200 pt-7">
      <h3 className="text-sm font-bold text-slate-950">Next action and notes</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-bold text-slate-500">Next action</span><input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Tailor resume, complete form, follow up…" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
        <label className="space-y-1.5"><span className="text-xs font-bold text-slate-500">Deadline</span><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
        <label className="space-y-1.5"><span className="text-xs font-bold text-slate-500">Follow-up</span><input type="date" value={followUp} onChange={(event) => setFollowUp(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
        <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-bold text-slate-500">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Recruiter name, form details, questions…" className="w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
      </div>
      <button type="button" onClick={save} disabled={saving} className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">{saving ? 'Saving…' : 'Save details'}</button>
    </section>
  );
};


const OutreachModal = ({ job, onClose }) => {
  const [recruiterName, setRecruiterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchOutreach = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateOutreach({
        job_title: job.title || 'Software Engineer',
        company_name: job.company || 'Company',
        key_skills: job.skills || ['Python', 'FastAPI'],
        recruiter_name: recruiterName.trim() || null,
      });
      setPackageData(data);
    } catch {
      // Fallback to client-side generator if server unavailable
      const linkedinNote = generateClientOutreachNote({
        jobTitle: job.title,
        company: job.company,
        keySkill: (job.skills && job.skills[0]) || 'software engineering',
        recruiterName,
      });
      setPackageData({
        linkedin_note: linkedinNote,
        linkedin_char_count: linkedinNote.length,
        cold_email: {
          subject: `Application: ${job.title} - Candidate Inquiry`,
          body: `Hi ${recruiterName || 'there'},\n\nI recently applied for the ${job.title} role at ${job.company}. As an aspiring software engineer with hands-on project experience, I would love to learn more about the team's engineering goals.\n\nThank you,\nCandidate`,
        },
        follow_up_note: `Hi ${recruiterName || 'there'}, following up on my application for ${job.title} at ${job.company}. Excited about the role and would love to connect!`,
      });
    } finally {
      setLoading(false);
    }
  }, [job.company, job.skills, job.title, recruiterName]);

  useEffect(() => {
    fetchOutreach();
  }, [fetchOutreach]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recruiter Outreach Kit</h2>
            <p className="text-xs text-slate-500">{job.title} at {job.company}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Recruiter's Name (optional, e.g. Sarah)"
            value={recruiterName}
            onChange={(e) => setRecruiterName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={fetchOutreach}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Personalize'}
          </button>
        </div>

        {packageData && (
          <div className="mt-5 space-y-5">
            {/* LinkedIn Note */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">LinkedIn Invite Note</span>
                <span className={`text-[11px] font-bold ${packageData.linkedin_char_count <= 300 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {packageData.linkedin_char_count} / 300 chars
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-800 bg-white p-3 rounded-lg border border-slate-200 font-mono">
                {packageData.linkedin_note}
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(packageData.linkedin_note, 'linkedin')}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {copiedKey === 'linkedin' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                {copiedKey === 'linkedin' ? 'Copied to Clipboard' : 'Copy LinkedIn Note'}
              </button>
            </div>

            {/* Cold Email */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Cold Email / InMail</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">Subject: <span className="text-slate-900 font-mono">{packageData.cold_email.subject}</span></p>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800 bg-white p-3 rounded-lg border border-slate-200 font-sans">
                {packageData.cold_email.body}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard(`Subject: ${packageData.cold_email.subject}\n\n${packageData.cold_email.body}`, 'email')}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {copiedKey === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                {copiedKey === 'email' ? 'Copied to Clipboard' : 'Copy Full Email'}
              </button>
            </div>

            {/* Follow-up Note */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Follow-up Note (3-5 Days Later)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-800 bg-white p-3 rounded-lg border border-slate-200 font-mono">
                {packageData.follow_up_note}
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(packageData.follow_up_note, 'followup')}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {copiedKey === 'followup' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                {copiedKey === 'followup' ? 'Copied to Clipboard' : 'Copy Follow-up'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const VULNERABILITY_BADGES = {
  'High Risk': {
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    dotClass: 'bg-rose-500 animate-pulse',
    label: 'High Risk',
  },
  'Medium Risk': {
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    dotClass: 'bg-amber-500',
    label: 'Medium Risk',
  },
  'Rock Solid': {
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    dotClass: 'bg-emerald-500',
    label: 'Rock Solid',
  },
};

const StressTestModal = ({ job, application, onClose }) => {
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

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleCode = (index) => {
    setExpandedCode((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const setPracticeScore = (index, score) => {
    setReadinessScores((prev) => ({
      ...prev,
      [index]: prev[index] === score ? null : score,
    }));
  };

  const readinessSummary = useMemo(() => {
    const counts = { need_practice: 0, prepared: 0, ironclad: 0 };
    Object.values(readinessScores).forEach((val) => {
      if (counts[val] !== undefined) counts[val] += 1;
    });
    return counts;
  }, [readinessScores]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-lg">
              🛡️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">Resume Defense Stress-Tester</h2>
                {matrix?.defense_confidence_score !== undefined && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    matrix.defense_confidence_score >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {matrix.defense_confidence_score}% Confidence
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {job.title || 'Role'} · {job.company || matrix?.company || 'Target Company'} · <span className="font-semibold text-slate-700">{matrix?.interrogation_level || 'Aggressive Technical Screen'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-[35vh] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-600" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Stress-testing resume claims against technical hiring bar...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : matrix && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
              <div className="max-w-xl">
                <p className="font-semibold text-slate-800">Technical Drill-Down Interrogation</p>
                <p className="mt-0.5 leading-relaxed">
                  Senior engineering interviewers probe every bullet point on your resume. Review these hard drill-down questions, claim vulnerability ratings, and blueprints grounded in production code.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Practice:</span>
                <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  😟 {readinessSummary.need_practice}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  😐 {readinessSummary.prepared}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  🛡️ {readinessSummary.ironclad}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {(matrix.drill_down_questions || []).map((item, index) => {
                const rating = item.vulnerability_rating || 'Medium Risk';
                const badge = VULNERABILITY_BADGES[rating] || VULNERABILITY_BADGES['Medium Risk'];
                const isCodeOpen = expandedCode[index];
                const userScore = readinessScores[index];

                return (
                  <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 uppercase">
                          Claim {index + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Grounded Interrogation
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${badge.badgeClass}`}
                          title={`Claim risk level: ${rating}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                          {rating}
                        </span>
                      </div>
                    </div>

                    <blockquote className="mt-2.5 rounded-lg border-l-2 border-slate-400 bg-slate-50/70 py-1.5 px-3 text-xs italic text-slate-700">
                      &ldquo;{item.claim}&rdquo;
                    </blockquote>

                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Interviewer Drill-Down Question
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950 leading-snug">
                        {item.question}
                      </p>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-100 bg-[#f8fafc] p-2.5 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">What interviewer tests: </span>
                      {item.what_interviewer_tests}
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-slate-600" />
                          Candidate Defense Blueprint
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(item.candidate_defense_blueprint, `${index}-blueprint`)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                          {copiedKey === `${index}-blueprint` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-500" /> Copy Defense
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                        {item.candidate_defense_blueprint}
                      </p>
                    </div>

                    {item.model_interview_answer && (
                      <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>🎙️</span>
                            Model Spoken Answer (STAR Technique)
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(item.model_interview_answer, `${index}-answer`)}
                            className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-white px-2 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-50 transition"
                          >
                            {copiedKey === `${index}-answer` ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-sky-600" /> Copy Answer
                              </>
                            )}
                          </button>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-800 italic bg-white/80 p-2.5 rounded-lg border border-sky-100 font-sans">
                          &ldquo;{item.model_interview_answer}&rdquo;
                        </p>
                      </div>
                    )}

                    {item.code_defense_snippet && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => toggleCode(index)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                        >
                          <Code2 className="h-3.5 w-3.5 text-slate-600" />
                          <span>{isCodeOpen ? 'Hide Code Defense Blueprint' : '💻 View Code Defense Blueprint'}</span>
                          {isCodeOpen ? (
                            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>

                        {isCodeOpen && (
                          <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-md">
                            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3.5 py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <span className="text-[11px] font-mono font-medium text-slate-400">
                                  Production Code Defense Blueprint
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText(item.code_defense_snippet, `${index}-code`)}
                                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
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
                            <pre className="overflow-x-auto p-3.5 text-[11px] leading-relaxed font-mono text-emerald-300 whitespace-pre">
                              <code>{item.code_defense_snippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Practice Readiness:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPracticeScore(index, 'need_practice')}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            userScore === 'need_practice'
                              ? 'border border-rose-300 bg-rose-100 text-rose-800 ring-2 ring-rose-400/30 shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          😟 Need Practice
                        </button>
                        <button
                          type="button"
                          onClick={() => setPracticeScore(index, 'prepared')}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            userScore === 'prepared'
                              ? 'border border-amber-300 bg-amber-100 text-amber-800 ring-2 ring-amber-400/30 shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          😐 Prepared
                        </button>
                        <button
                          type="button"
                          onClick={() => setPracticeScore(index, 'ironclad')}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            userScore === 'ironclad'
                              ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400/30 shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          🛡️ Ironclad
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


const AutopsyDrawer = ({ job, application, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autopsy, setAutopsy] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [verifyingRepo, setVerifyingRepo] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchAutopsy = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getApplicationAutopsy(application.id);
        if (active) setAutopsy(data);
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
    try {
      const skillToVerify = autopsy?.missing_skill || 'docker';
      const result = await verifyGitHubRepo(repoUrl.trim(), skillToVerify);
      setVerifyResult(result);
    } catch (err) {
      setVerifyError(err.response?.data?.detail || 'GitHub repo inspection failed.');
    } finally {
      setVerifyingRepo(false);
    }
  };

  const isPreMortem = autopsy?.mode === 'pre_mortem' || application.status !== 'Rejected';
  const severity = autopsy?.severity || (isPreMortem ? 'HIGH' : 'CRITICAL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${
                isPreMortem ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              🔬
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">
                  {isPreMortem ? 'Pre-Mortem Risk Audit' : 'Application Autopsy & Gap Recovery'}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isPreMortem ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isPreMortem ? 'Pre-Mortem' : 'Post-Mortem'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {job.title || 'Role'} at {job.company || 'Company'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-[35vh] place-items-center">
            <div className="text-center">
              <Loader2 className={`mx-auto h-7 w-7 animate-spin ${isPreMortem ? 'text-amber-600' : 'text-rose-600'}`} />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                {isPreMortem ? 'Auditing application risks and qualification gaps...' : 'Diagnosing rejection cause and fatal blockers...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : autopsy && (
          <div className="mt-5 space-y-5">
            {/* Fatal Disqualifier / Pre-Mortem Risk Banner with Severity Badge */}
            <div
              className={`rounded-xl border p-4 ${
                isPreMortem ? 'border-amber-200 bg-amber-50/70' : 'border-rose-200 bg-rose-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${isPreMortem ? 'text-amber-800' : 'text-rose-800'}`}>
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {isPreMortem ? 'Impending Risk Identified' : 'Fatal Blocker Identified'}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                    severity === 'CRITICAL'
                      ? 'border border-rose-300 bg-rose-200 text-rose-900'
                      : 'border border-amber-300 bg-amber-200 text-amber-900'
                  }`}
                >
                  {severity}
                </span>
              </div>
              <p className={`mt-2 text-sm font-bold ${isPreMortem ? 'text-amber-950' : 'text-rose-950'}`}>
                {autopsy.fatal_blocker}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${isPreMortem ? 'text-amber-800' : 'text-rose-700'}`}>
                {autopsy.why_it_disqualified}
              </p>
            </div>

            {/* 48-Hour Recovery Sprint Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  48-Hour Recovery Sprint
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                  ⏱️ {autopsy.recovery_time_hours || 48}h Recovery Cycle
                </span>
              </div>

              <h4 className="mt-3 text-base font-black text-slate-950">
                {autopsy.recommended_blueprint?.title || 'Targeted Growth Blueprint'}
              </h4>

              <div className="mt-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actionable Fix Steps:
                </p>
                <div className="space-y-1.5 pl-1">
                  {(autopsy.actionable_fix_steps || []).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  to={autopsy.recommended_blueprint?.growth_url || `/growth?skill=${autopsy.missing_skill || ''}`}
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Launch 48-Hour Sprint in Growth Studio ➔
                </Link>
              </div>
            </div>

            {/* In-Drawer GitHub Repo Verifier */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-slate-800" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  In-Drawer GitHub Proof Verifier
                </h4>
                {autopsy.missing_skill && (
                  <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
                    Target: {autopsy.missing_skill}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Verify your public repository proof to clear the {autopsy.missing_skill ? `'${autopsy.missing_skill}'` : 'skill'} gap immediately.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyRepo}
                  disabled={verifyingRepo || !repoUrl.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#36454f] px-4 py-2 text-xs font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300 transition"
                >
                  {verifyingRepo ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Verify GitHub Proof'
                  )}
                </button>
              </div>

              {verifyError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {verifyError}
                </div>
              )}

              {verifyResult && (
                <div
                  className={`rounded-xl border p-3 text-xs ${
                    verifyResult.verified
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-rose-200 bg-rose-50 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {verifyResult.verified ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Authentic Repository Verified!
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 text-rose-600" /> Verification Incomplete
                      </>
                    )}
                  </div>
                  {verifyResult.reasons && verifyResult.reasons.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px]">
                      {verifyResult.reasons.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  )}
                  {verifyResult.generated_bullet && (
                    <div className="mt-2.5 rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-800">
                      <span className="font-bold text-emerald-800">STAR Resume Bullet Ready:</span>{' '}
                      {verifyResult.generated_bullet}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export const ApplicationPackModal = ({ job, application, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packData, setPackData] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [candidateName, setCandidateName] = useState('Candidate');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [screeningDrawerOpen, setScreeningDrawerOpen] = useState(true);

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

  const copyToClipboard = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-lg">
              📦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">1-Click Complete Application Pack</h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Ready to Submit
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {job?.title || 'Role'} · {job?.company || 'Target Company'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-700" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Generating truth-guarded cover letter, outreach &amp; screening answers...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : packData && (
          <div className="mt-5 space-y-6">
            {/* Quick Action Top Bar: 1-Click Harvard ATS PDF */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  Harvard ATS-Formatted Resume
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Single-column standard ATS template optimized for screening software.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
              >
                {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloadingPdf ? 'Generating PDF...' : 'Download Harvard ATS PDF'}
              </button>
            </div>

            {/* Tailored Cover Letter */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-600" />
                    Truth-Guarded Tailored Cover Letter
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    3-paragraph letter grounded exclusively in your verified technical skills.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(packData.cover_letter_text, 'cover_letter')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {copiedKey === 'cover_letter' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    {copiedKey === 'cover_letter' ? 'Copied Letter' : 'Copy Letter'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCoverLetter}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    Download .txt
                  </button>
                </div>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-100 bg-[#f8fafc] p-4 font-sans text-xs leading-relaxed text-slate-800">
                {packData.cover_letter_text}
              </pre>
            </div>

            {/* LinkedIn Connection Note */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send className="h-4 w-4 text-slate-600" />
                    LinkedIn Recruiter Connection Note
                  </h3>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    Strictly &lt; 300 chars
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {packData.character_count || packData.outreach_note_300.length} / 300 chars
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(packData.outreach_note_300, 'linkedin')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {copiedKey === 'linkedin' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    {copiedKey === 'linkedin' ? 'Copied Note' : 'Copy Note'}
                  </button>
                </div>
              </div>
              <p className="mt-4 rounded-xl border border-slate-100 bg-[#f8fafc] p-3.5 font-mono text-xs leading-relaxed text-slate-800">
                {packData.outreach_note_300}
              </p>
            </div>

            {/* Screening Answers Drawer */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <button
                type="button"
                onClick={() => setScreeningDrawerOpen(!screeningDrawerOpen)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      High-Frequency ATS Screening Questions &amp; Answers
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {packData.screening_answers?.length || 0} Questions
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
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
                <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
                  {(packData.screening_answers || []).map((item, index) => (
                    <div key={index} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-bold text-slate-900">
                          {item.question}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.answer, `screen-${index}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
                        >
                          {copiedKey === `screen-${index}` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-500" /> Copy Answer
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
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


const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';

const StatusBadge = ({ status }) => (
  <span className="inline-flex rounded-full bg-[#eef0f1] px-2.5 py-1 text-xs font-bold text-[#36454f]">{status || 'Saved'}</span>
);

export default Applications;
