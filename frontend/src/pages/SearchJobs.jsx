import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
import { applyJobState, applySavedJobState } from '../app/job-workspace';


const getSavedJobs = async () => {
  const response = await api.get('/jobs/saved');
  return response.data;
};

const unsaveJob = async (jobId) => {
  const response = await api.post(`/jobs/${jobId}/unsave`);
  return response.data;
};


const SearchJobs = () => {
  const [form, setForm] = useState({ query: '', location: 'India', employment_type: 'full-time' });
  const [searchResults, setSearchResults] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'saved'
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [matchingJobId, setMatchingJobId] = useState(null);
  const [matchesByJob, setMatchesByJob] = useState({});
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
      setSelectedJob(createdJob);
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
    const targetList = tab === 'saved' ? savedJobs : searchResults;
    setSelectedJob(targetList[0] || null);
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
        setSelectedJob(nextSaved[0] || null);
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

      const currentList = activeTab === 'saved' ? nextSaved : nextSearch;
      setSelectedJob(currentList[0] || null);

      setMessage(`${job.title} was removed from this workspace.`);
    } catch (stateError) {
      setMessage(stateError.response?.data?.detail || 'The job workspace could not be updated.');
    } finally {
      setUpdatingJobId(null);
    }
  };

  const displayedJobs = activeTab === 'saved' ? savedJobs : searchResults;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Focused discovery</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Find jobs worth applying to</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search SerpAPI and Tavily together. CareerPilot keeps actual job pages, removes senior roles and duplicate listings, and lets you save target jobs persistently across searches.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPasteModalOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#36454f] px-5 text-sm font-bold text-white shadow-xs hover:bg-[#202a30] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Paste &amp; Analyze Any Job</span>
        </button>
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

      {/* Dedicated Workspace Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('search')}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-sm font-bold transition-colors ${
            activeTab === 'search'
              ? 'border-[#36454f] text-[#36454f]'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Live Search Results</span>
          {searchResults.length > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === 'search' ? 'bg-[#36454f] text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {searchResults.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('saved')}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-sm font-bold transition-colors ${
            activeTab === 'saved'
              ? 'border-[#36454f] text-[#36454f]'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Saved for Later</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            activeTab === 'saved' ? 'bg-[#36454f] text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {savedJobs.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="grid min-h-72 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#708090]" /></div>
      ) : displayedJobs.length === 0 ? (
        activeTab === 'saved' ? (
          <EmptySavedState onBrowse={() => handleTabChange('search')} />
        ) : (
          <EmptySearchState />
        )
      ) : (
        <div className="grid min-h-[35rem] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[0.78fr_1.22fr]">
          <section className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-bold text-slate-950">
                {displayedJobs.length} {activeTab === 'saved' ? 'saved' : 'relevant'} {displayedJobs.length === 1 ? 'role' : 'roles'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === 'saved'
                  ? 'Roles you have bookmarked for later review. Subsequent searches will not clear these.'
                  : 'Select a role to review the source, check requirement match, or save for later.'}
              </p>
            </div>
            <div className="max-h-[42rem] overflow-y-auto p-2">
              {displayedJobs.map((job) => (
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
            onToggleSave={handleToggleSave}
            onDismissJob={handleDismissJob}
            onCheckMatch={checkMatch}
          />
        </div>
      )}

      {/* Universal Paste & Analyze Any Job Modal */}
      {isPasteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paste-job-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPasteModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 id="paste-job-modal-title" className="text-lg font-black text-slate-950">
                  Paste &amp; Analyze Any Job
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Paste any job description to run an instant 100-point ATS match &amp; Job Reality Red Flag Audit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasteJobSubmit} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Role Title</span>
                  <input
                    type="text"
                    value={customJobForm.title}
                    onChange={(e) => setCustomJobForm({ ...customJobForm, title: e.target.value })}
                    placeholder="e.g. Junior Backend Engineer"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Company</span>
                  <input
                    type="text"
                    value={customJobForm.company}
                    onChange={(e) => setCustomJobForm({ ...customJobForm, company: e.target.value })}
                    placeholder="e.g. Acme Health"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Location</span>
                <input
                  type="text"
                  value={customJobForm.location}
                  onChange={(e) => setCustomJobForm({ ...customJobForm, location: e.target.value })}
                  placeholder="e.g. Remote or Bengaluru"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Job Description <span className="text-rose-600">*</span>
                </span>
                <textarea
                  rows={6}
                  required
                  value={customJobForm.description}
                  onChange={(e) => setCustomJobForm({ ...customJobForm, description: e.target.value })}
                  placeholder="Paste raw JD text, requirements, or responsibilities here..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]"
                />
              </label>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customJobForm.description.trim() || isSubmittingCustomJob}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:cursor-not-allowed disabled:bg-slate-300 transition-colors"
                >
                  {isSubmittingCustomJob ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSubmittingCustomJob ? 'Auditing role...' : 'Analyze & Save Job'}
                </button>
              </div>
            </form>
          </div>
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
      <div className="flex items-center gap-1.5 shrink-0">
        {job.user_state === 'saved' && (
          <Bookmark className="h-4 w-4 text-[#36454f] fill-[#36454f]" aria-label="Saved job" />
        )}
        {job.verification_status === 'verified' && (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Verified job page" />
        )}
        {job.job_health?.role_health_score !== undefined && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              job.job_health.health_verdict === 'High Quality'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : job.job_health.health_verdict === 'Proceed with Caution'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={`Role Health: ${job.job_health.role_health_score}/100 (${job.job_health.health_verdict})`}
          >
            {job.job_health.role_health_score} pts
          </span>
        )}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
      <span>{job.location || 'Location not specified'}</span>
      {job.employment_type && <span>{job.employment_type}</span>}
    </div>
  </button>
);


const JobDetails = ({ job, match, saving, updatingState, matching, onSave, onToggleSave, onDismissJob, onCheckMatch }) => {
  if (!job) return <div className="grid place-items-center p-10 text-sm text-slate-500">Choose a job to review it.</div>;

  const isSaved = job.user_state === 'saved';

  return (
    <article className="p-5 sm:p-7 lg:p-9">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${job.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {job.verification_status === 'verified' ? 'Live page verified' : 'Provider job page'}
            </span>
            {isSaved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef0f1] px-2.5 py-1 text-xs font-bold text-[#36454f]">
                <Bookmark className="h-3 w-3 fill-[#36454f]" /> Saved for Later
              </span>
            )}
            {job.source && <span className="text-xs text-slate-500">via {job.source}</span>}
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">{job.title}</h2>
          <p className="mt-1 font-bold text-slate-600">{job.company}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {job.id && (
            <button
              type="button"
              onClick={() => onToggleSave(job)}
              disabled={updatingState}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${
                isSaved
                  ? 'border-[#36454f] bg-[#eef0f1] text-[#36454f] hover:bg-slate-200'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#36454f]' : ''}`} />
              {isSaved ? 'Saved' : 'Save job'}
            </button>
          )}
          {job.id && (
            <button
              type="button"
              onClick={() => onDismissJob(job)}
              disabled={updatingState}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
              aria-label="Dismiss job"
            >
              <X className="h-4 w-4" /> Dismiss
            </button>
          )}
          {job.id && (
            <button
              type="button"
              onClick={() => onSave(job)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save to applications'}
            </button>
          )}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]"
            >
              View original <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location || 'Not specified'}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" /> {job.employment_type || 'Type not specified'}</span>
      </div>

      {job.job_health && <RoleHealthCard health={job.job_health} />}

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


const RoleHealthCard = ({ health }) => {
  if (!health) return null;

  const verdictStyles = {
    'High Quality': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Proceed with Caution': 'bg-amber-50 text-amber-800 border-amber-200',
    'High-Risk Post': 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const ghostRiskStyles = {
    Low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Moderate: 'text-amber-700 bg-amber-50 border-amber-200',
    High: 'text-rose-700 bg-rose-50 border-rose-200',
  };

  const badgeClass = verdictStyles[health.health_verdict] || 'bg-slate-100 text-slate-700 border-slate-200';
  const ghostClass = ghostRiskStyles[health.ghost_job_risk] || 'text-slate-700 bg-slate-50 border-slate-200';

  return (
    <section className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#36454f]" />
            <h3 className="text-sm font-bold text-slate-950">Role Health &amp; Red Flag Auditor</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Automated reality check on tech stack requirements, burnout flags, and ghost job patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black text-slate-950">{health.role_health_score}</span>
              <span className="text-xs font-semibold text-slate-500">/100</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Health Score</span>
          </div>

          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}>
            {health.health_verdict}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Ghost Job Risk:</span>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${ghostClass}`}>
            {health.ghost_job_risk} Risk
          </span>
        </div>

        {health.detected_tech_count !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Detected Tech Tools:</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-700">
              {health.detected_tech_count} tools
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Flagged Cautions ({health.red_flags?.length || 0})</span>
          </div>
          {health.red_flags && health.red_flags.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs text-rose-950">
              {health.red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs italic text-rose-700">No red flags or burnout phrases detected.</p>
          )}
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Healthy Signals ({health.green_flags?.length || 0})</span>
          </div>
          {health.green_flags && health.green_flags.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs text-emerald-950">
              {health.green_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs italic text-emerald-700">Standard benefits and role scoping.</p>
          )}
        </div>
      </div>
    </section>
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


const EmptySearchState = () => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
    <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
    <h2 className="mt-4 font-bold text-slate-950">Search for your first role</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Try a clear role such as “frontend developer”, choose India or a city, and select full-time or internship.</p>
  </div>
);


const EmptySavedState = ({ onBrowse }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
    <Bookmark className="mx-auto h-9 w-9 text-slate-300" />
    <h2 className="mt-4 font-bold text-slate-950">No saved jobs yet</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      When searching for jobs in the Live Search Results tab, click "Save job" on any role to keep it permanently saved in this tab across searches.
    </p>
    <button
      type="button"
      onClick={onBrowse}
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]"
    >
      <Search className="h-4 w-4" /> Browse Live Search Results
    </button>
  </div>
);

export default SearchJobs;
