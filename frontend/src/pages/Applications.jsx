import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Columns3,
  Copy,
  Download,
  List,
  Loader2,
  Send,
  Trash2,
  X,
} from 'lucide-react';

import {
  deleteApplication,
  downloadResumeVersion,
  generateOutreach,
  getAllApplications,
  getAllJobs,
  updateApplicationDetails,
  updateApplicationStatus,
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

  // Outreach modal state
  const [outreachTarget, setOutreachTarget] = useState(null);

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
                            onClick={() => setOutreachTarget({ job, application: app })}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <Send className="h-3 w-3 text-slate-500" /> Outreach
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
            onOpenOutreach={(job, app) => setOutreachTarget({ job, application: app })}
            onDownloadResume={handleDownloadSubmittedResume}
          />
        </div>
      )}

      {outreachTarget && (
        <OutreachModal
          job={outreachTarget.job}
          application={outreachTarget.application}
          onClose={() => setOutreachTarget(null)}
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
  onOpenOutreach,
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
            onClick={() => onOpenOutreach(job, application)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <Send className="h-3.5 w-3.5" /> Recruiter Outreach
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


const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';

const StatusBadge = ({ status }) => (
  <span className="inline-flex rounded-full bg-[#eef0f1] px-2.5 py-1 text-xs font-bold text-[#36454f]">{status || 'Saved'}</span>
);

export default Applications;
