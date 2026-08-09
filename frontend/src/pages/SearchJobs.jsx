import { useEffect, useState } from 'react';
import { ArrowUpRight, Bookmark, BriefcaseBusiness, CheckCircle2, Loader2, MapPin, Plus, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { analyzeJobMatch, createApplication, discoverJobs, dismissJob, getAllJobs, getCandidateProfile, saveJob } from '../services/api';
import { applyJobState } from '../app/job-workspace';


const SearchJobs = () => {
  const [form, setForm] = useState({ query: '', location: 'India', employment_type: 'full-time' });
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [matchingJobId, setMatchingJobId] = useState(null);
  const [matchesByJob, setMatchesByJob] = useState({});

  useEffect(() => {
    let active = true;

    const loadSavedJobs = async () => {
      try {
        const [savedJobs, profile] = await Promise.all([getAllJobs(), getCandidateProfile()]);
        if (!active) return;
        setJobs(savedJobs);
        setSelectedJob(savedJobs[0] || null);
        setForm({
          query: profile.target_roles?.[0] || '',
          location: profile.preferred_locations?.[0] || 'India',
          employment_type: profile.employment_types?.[0] || 'full-time',
        });
      } catch {
        if (active) setMessage('Saved jobs could not be loaded. You can still try a new search.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSavedJobs();
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
      setJobs(result.jobs);
      setSelectedJob(result.jobs[0] || null);
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

  const updateWorkspaceState = async (job, state) => {
    setUpdatingJobId(job.id);
    setMessage('');
    try {
      const updated = state === 'saved' ? await saveJob(job.id) : await dismissJob(job.id);
      const nextJobs = applyJobState(jobs, updated);
      setJobs(nextJobs);
      setSelectedJob(state === 'dismissed' ? (nextJobs[0] || null) : updated);
      setMessage(state === 'saved' ? `${job.title} is saved in your job workspace.` : `${job.title} was removed from this workspace.`);
    } catch (stateError) {
      setMessage(stateError.response?.data?.detail || 'The job workspace could not be updated.');
    } finally {
      setUpdatingJobId(null);
    }
  };

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Focused discovery</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Find jobs worth applying to</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Search SerpAPI and Tavily together. CareerPilot keeps actual job pages, removes senior roles and duplicate listings, and shows provider problems honestly.
        </p>
      </header>

      <form onSubmit={handleSearch} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.65fr_auto]">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Role or skills</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                name="query"
                value={form.query}
                onChange={updateForm}
                placeholder="Python backend developer"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
              />
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Location</span>
            <input
              name="location"
              value={form.location}
              onChange={updateForm}
              placeholder="Bengaluru or India"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Type</span>
            <select
              name="employment_type"
              value={form.employment_type}
              onChange={updateForm}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
            >
              <option value="full-time">Full-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={!form.query.trim() || searching}
            className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#36454f] px-5 text-sm font-bold text-white hover:bg-[#202a30] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {searching ? 'Filtering…' : 'Search jobs'}
          </button>
        </div>
      </form>

      {warnings.map((warning) => (
        <div key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{warning}</div>
      ))}
      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</div>}

      {loading ? (
        <div className="grid min-h-72 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#708090]" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid min-h-[35rem] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[0.78fr_1.22fr]">
          <section className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-bold text-slate-950">{jobs.length} relevant {jobs.length === 1 ? 'role' : 'roles'}</p>
              <p className="mt-1 text-xs text-slate-500">Select a role to review the source and details.</p>
            </div>
            <div className="max-h-[42rem] overflow-y-auto p-2">
              {jobs.map((job) => (
                <JobListItem
                  key={job.id || job.url}
                  job={job}
                  active={(selectedJob?.id || selectedJob?.url) === (job.id || job.url)}
                  onSelect={() => setSelectedJob(job)}
                />
              ))}
            </div>
          </section>

          <JobDetails
            job={selectedJob}
            match={matchesByJob[selectedJob?.id]}
            saving={savingJobId === selectedJob?.id}
            updatingState={updatingJobId === selectedJob?.id}
            matching={matchingJobId === selectedJob?.id}
            onSave={addToApplications}
            onSaveJob={(job) => updateWorkspaceState(job, 'saved')}
            onDismissJob={(job) => updateWorkspaceState(job, 'dismissed')}
            onCheckMatch={checkMatch}
          />
        </div>
      )}
    </div>
  );
};


const JobListItem = ({ job, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full rounded-xl border p-4 text-left transition-colors ${active ? 'border-[#d3d3d3] bg-[#eef0f1]' : 'border-transparent hover:bg-slate-50'}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-bold text-slate-950">{job.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{job.company}</p>
      </div>
      {job.verification_status === 'verified' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Verified job page" />}
    </div>
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
      <span>{job.location || 'Location not specified'}</span>
      {job.employment_type && <span>{job.employment_type}</span>}
    </div>
  </button>
);


const JobDetails = ({ job, match, saving, updatingState, matching, onSave, onSaveJob, onDismissJob, onCheckMatch }) => {
  if (!job) return <div className="grid place-items-center p-10 text-sm text-slate-500">Choose a job to review it.</div>;

  return (
    <article className="p-5 sm:p-7 lg:p-9">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${job.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {job.verification_status === 'verified' ? 'Live page verified' : 'Provider job page'}
            </span>
            {job.user_state === 'saved' && <span className="rounded-full bg-[#eef0f1] px-2.5 py-1 text-xs font-bold text-[#36454f]">Saved job</span>}
            {job.source && <span className="text-xs text-slate-500">via {job.source}</span>}
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">{job.title}</h2>
          <p className="mt-1 font-bold text-slate-600">{job.company}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {job.id && (
            <button type="button" onClick={() => onSaveJob(job)} disabled={updatingState || job.user_state === 'saved'} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400">
              <Bookmark className="h-4 w-4" /> {job.user_state === 'saved' ? 'Saved' : 'Save job'}
            </button>
          )}
          {job.id && (
            <button type="button" onClick={() => onDismissJob(job)} disabled={updatingState} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:text-slate-300" aria-label="Dismiss job">
              <X className="h-4 w-4" /> Dismiss
            </button>
          )}
          {job.id && (
            <button type="button" onClick={() => onSave(job)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save to applications'}
            </button>
          )}
          {job.url && (
            <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]">
              View original <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location || 'Not specified'}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" /> {job.employment_type || 'Type not specified'}</span>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <h3 className="text-sm font-bold text-slate-950">Job description</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{job.description || 'The provider did not return a full description. Review the original listing before applying.'}</p>
      </div>

      <div className="mt-8 rounded-xl border border-[#d3d3d3] bg-[#eef0f1] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-[#202a30]">Explainable resume match</p><p className="mt-1 text-xs leading-5 text-[#36454f]">Uses your latest resume and shows the evidence behind the result.</p></div>
          <button type="button" onClick={() => onCheckMatch(job)} disabled={!job.id || matching} className="inline-flex items-center gap-2 rounded-lg bg-[#36454f] px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">{matching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{matching ? 'Checking…' : 'Check my match'}</button>
        </div>
        {match && <MatchSummary match={match} jobId={job.id} />}
      </div>
    </article>
  );
};


const MatchSummary = ({ match, jobId }) => (
  <div className="mt-4 border-t border-[#d3d3d3] pt-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-2xl font-black text-[#202a30]">{Math.round(match.coverage_percent)}%</p><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#36454f]">Detected requirement coverage</p></div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${match.eligibility_status === 'eligible' ? 'bg-emerald-100 text-emerald-800' : match.eligibility_status === 'not_eligible' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{match.eligibility_status.replace('_', ' ')}</span>
    </div>
    <ul className="mt-3 space-y-1 text-xs leading-5 text-[#36454f]">
      {match.eligibility_reasons.map((reason) => <li key={reason}>• {reason}</li>)}
    </ul>
    <div className="mt-3 flex flex-wrap gap-2">
      {match.matched_skills.map((skill) => <span key={skill} className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">Evidence: {skill}</span>)}
      {match.missing_skills.map((skill) => <span key={skill} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-amber-800">Gap: {skill}</span>)}
    </div>
    <Link to={`/profile/tailor?job=${jobId}`} className="mt-4 inline-flex rounded-lg bg-[#36454f] px-3 py-2 text-xs font-bold text-white">Tailor resume for this job</Link>
  </div>
);


const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
    <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
    <h2 className="mt-4 font-bold text-slate-950">Search for your first role</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Try a clear role such as “frontend developer”, choose India or a city, and select full-time or internship.</p>
  </div>
);

export default SearchJobs;
