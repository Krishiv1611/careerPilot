import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Loader2, Trash2 } from 'lucide-react';

import { deleteApplication, getAllApplications, getAllJobs, updateApplicationDetails, updateApplicationStatus } from '../services/api';


const nextStatuses = {
  Saved: ['Preparing', 'Withdrawn'],
  Preparing: ['Saved', 'Applied', 'Withdrawn'],
  Applied: ['Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
  Assessment: ['Interview', 'Offer', 'Rejected', 'Withdrawn'],
  Interview: ['Offer', 'Rejected', 'Withdrawn'],
  Offer: ['Withdrawn'],
  Rejected: [],
  Withdrawn: [],
};


const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

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

  const changeApplicationStatus = async (status) => {
    if (!selectedApplication) return;
    setUpdating(true);
    setError('');

    try {
      const updated = await updateApplicationStatus(selectedApplication.id, { status });
      setApplications((current) => current.map((application) => (
        application.id === updated.id ? updated : application
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

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#708090]" /></div>;
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Your follow-through</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Applications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A job appears here only after you save it. Status changes are yours and every change is recorded.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 font-bold text-slate-950">No applications saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Find a relevant job and choose “Save to applications”. Running an analysis alone will never create an application.</p>
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
            onChangeStatus={changeApplicationStatus}
            onRequestDelete={setPendingDeleteId}
            onDelete={removeApplication}
            onSavePlan={saveApplicationPlan}
          />
        </div>
      )}
    </div>
  );
};


const ApplicationDetail = ({ application, job, updating, pendingDelete, onChangeStatus, onRequestDelete, onDelete, onSavePlan }) => {
  if (!application) return null;

  const availableStatuses = nextStatuses[application.status] || [];

  return (
    <article className="p-5 sm:p-7 lg:p-9">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <StatusBadge status={application.status} />
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">{job.title || 'Saved job'}</h2>
          <p className="mt-1 font-bold text-slate-600">{job.company || 'Company unavailable'}</p>
        </div>
        <div className="flex gap-2">
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


const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';


const StatusBadge = ({ status }) => (
  <span className="inline-flex rounded-full bg-[#eef0f1] px-2.5 py-1 text-xs font-bold text-[#36454f]">{status || 'Saved'}</span>
);

export default Applications;
