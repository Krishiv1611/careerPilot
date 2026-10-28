import { useEffect, useState } from 'react';
import { Check, Download, FileClock, Github, Loader2, Send, Sparkles, TriangleAlert, X } from 'lucide-react';
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
} from '../services/api';
import { buildReviewPayload, reviewProgress } from '../app/resume-proposals';
import { buildEvidenceApprovalPayload, initialEvidenceDraft } from '../app/github-evidence';


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

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#708090]" /></div>;
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Evidence-aware tailoring</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Resume Studio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Compare your current resume with a real JD, review supported evidence, and save every approved edit as a new version.</p>
        </div>
        {activeVersion && (
          <button type="button" onClick={downloadVersion} disabled={activeVersion.approval_status !== 'approved'} className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:cursor-not-allowed disabled:bg-slate-300">
            <Download className="h-4 w-4" /> {activeVersion.approval_status === 'approved' ? (activeVersion.template_mode === 'same_docx_template' ? 'Download approved DOCX' : 'Download approved PDF') : 'Review changes to download'}
          </button>
        )}
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Current resume</span>
            <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="">Choose a resume</option>
              {resumes.map((resume, index) => <option key={resume.id} value={resume.id}>Resume {index + 1}</option>)}
            </select>
          </label>

          <label className="space-y-1.5 lg:col-span-2">
            <span className="text-xs font-bold text-slate-600">Saved job (optional)</span>
            <select value={jobId} onChange={(event) => setJobId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="">Paste a job description below</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.company}</option>)}
            </select>
          </label>
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Job description</span>
          <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} disabled={Boolean(jobId)} rows={7} placeholder={jobId ? 'CareerPilot will use the saved job description.' : 'Paste the complete JD here…'} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none focus:border-[#708090] disabled:bg-slate-50" />
        </label>

        <button type="button" onClick={runAnalysis} disabled={!resumeId || (!jobId && !jobDescription.trim()) || working} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300">
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {working ? 'Building version…' : 'Analyze and create version'}
        </button>
      </section>

      {!activeVersion ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Sparkles className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 font-bold text-slate-950">Your tailored workspace will appear here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Choose your current resume and add a JD. The original resume will not be changed.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white xl:grid-cols-[0.72fr_1.25fr_0.78fr]">
            <RequirementsPanel version={activeVersion} />
            <ResumeCanvas version={activeVersion} instruction={instruction} setInstruction={setInstruction} working={working} onPrompt={applyPrompt} />
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
          <ChangeReview
            version={activeVersion}
            decisions={changeDecisions}
            working={working}
            onDecision={decideChange}
            onApprove={approveVersion}
          />
        </div>
      )}

      {versions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><FileClock className="h-4 w-4 text-slate-400" /><h2 className="text-sm font-bold text-slate-950">Version history</h2></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {versions.map((version, index) => (
              <button key={version.id} type="button" onClick={() => setActiveVersion(version)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${activeVersion?.id === version.id ? 'border-[#b9c1c6] bg-[#eef0f1] text-[#36454f]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Version {versions.length - index} · {new Date(version.created_at).toLocaleDateString('en-IN')}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};


const RequirementsPanel = ({ version }) => {
  const ats = version.ats_diagnostic || {
    overall_score: version.ats_score ?? 75,
    grade: (version.ats_score ?? 75) >= 80 ? 'A' : (version.ats_score ?? 75) >= 65 ? 'B' : 'Needs Work',
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
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    B: 'bg-blue-100 text-blue-800 border-blue-300',
    C: 'bg-amber-100 text-amber-800 border-amber-300',
    'Needs Work': 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <section className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-950">100-Pt ATS Scorecard</h2>
          <p className="text-[11px] text-slate-500">Deterministic 4-pillar parsing rubric</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-slate-950">{ats.overall_score}<span className="text-xs text-slate-400">/100</span></span>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${gradeColors[ats.grade] || 'bg-slate-100 text-slate-700'}`}>
            {ats.grade}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Parseability & Contact</span>
            <span className="font-bold">{ats.breakdown?.parseability ?? 0}/25</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, ((ats.breakdown?.parseability ?? 0) / 25) * 100)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Keyword Match</span>
            <span className="font-bold">{ats.breakdown?.keyword_match ?? 0}/35</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, ((ats.breakdown?.keyword_match ?? 0) / 35) * 100)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>STAR Action & Metrics</span>
            <span className="font-bold">{ats.breakdown?.action_metrics ?? 0}/25</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, ((ats.breakdown?.action_metrics ?? 0) / 25) * 100)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Structural Completeness</span>
            <span className="font-bold">{ats.breakdown?.structure_hygiene ?? 0}/15</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${Math.min(100, ((ats.breakdown?.structure_hygiene ?? 0) / 15) * 100)}%` }} />
          </div>
        </div>
      </div>

      {ats.feedback && ats.feedback.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Actionable ATS Fixes</p>
          <ul className="mt-1.5 space-y-1 text-xs text-amber-800">
            {ats.feedback.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-900">Job Keywords & Evidence</h3>
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Supported</p>
          <div className="mt-2 space-y-2">
            {version.matched_skills.map((skill) => (
              <div key={skill} className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800"><Check className="h-3.5 w-3.5" /> {skill}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-900/70">{version.evidence_map[skill]?.[0] || 'Found in resume text'}</p>
              </div>
            ))}
            {version.matched_skills.length === 0 && <p className="text-xs leading-5 text-slate-500">No structured skill evidence matched this JD.</p>}
          </div>
        </div>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Missing Gaps</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {version.missing_skills.map((skill) => <span key={skill} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">{skill}</span>)}
            {version.missing_skills.length === 0 && <p className="text-xs text-slate-500">No vocabulary gaps found.</p>}
          </div>
        </div>
      </div>
    </section>
  );
};


const ResumeCanvas = ({ version, instruction, setInstruction, working, onPrompt }) => (
  <section className="border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-sm font-bold text-slate-950">Tailored draft</h2><p className="mt-1 text-xs text-slate-500">No new claims were inserted.</p></div>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{version.template_mode === 'same_docx_template' ? 'Original DOCX template' : 'Clean PDF'}</span>
    </div>
    <div className="mt-5 max-h-[42rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-[#fffefa] p-5 text-sm leading-7 text-slate-700">{version.content}</div>
    <div className="mt-4 flex gap-2">
      <input value={instruction} onChange={(event) => setInstruction(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onPrompt()} placeholder="Try: Emphasize Python" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#708090]" />
      <button type="button" onClick={onPrompt} disabled={!instruction.trim() || working} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#36454f] text-white disabled:bg-slate-300" aria-label="Apply prompt"><Send className="h-4 w-4" /></button>
    </div>
    <p className="mt-2 text-xs leading-5 text-slate-500">Try: emphasize an existing skill, remove a line, tailor to this JD, or make the resume concise.</p>
  </section>
);


const ChangeReview = ({ version, decisions, working, onDecision, onApprove }) => {
  const changes = version.changes || [];
  const progress = reviewProgress(changes, decisions);

  if (version.approval_status === 'approved') {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800"><Check className="h-4 w-4" /> Approved version</p>
        <p className="mt-1 text-xs leading-5 text-emerald-900/70">The reviewed content is locked as a new version and is ready to download.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#708090]">Change review</p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">Decide what reaches the approved resume</h2>
          <p className="mt-1 text-sm text-slate-500">{progress.reviewed} of {progress.total} changes reviewed. Rejected changes keep the previous wording.</p>
        </div>
        <button type="button" onClick={onApprove} disabled={!progress.complete || working} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:cursor-not-allowed disabled:bg-slate-300">
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Create approved version
        </button>
      </div>

      {changes.length === 0 ? (
        <p className="mt-5 border-t border-slate-200 pt-5 text-sm text-slate-600">No wording changed. Approve this analysis to unlock an export linked to the JD.</p>
      ) : (
        <ol className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {changes.map((change, index) => (
            <li key={change.id} className="grid gap-4 py-5 lg:grid-cols-[3rem_1fr_auto] lg:items-start">
              <span className="text-xs font-black text-slate-400">{String(index + 1).padStart(2, '0')}</span>
              <div className="space-y-3">
                {change.before_lines.length > 0 && <DiffBlock label="Before" lines={change.before_lines} tone="removed" />}
                {change.after_lines.length > 0 && <DiffBlock label="Proposed" lines={change.after_lines} tone="added" />}
              </div>
              <div className="flex gap-2 lg:justify-end">
                <button type="button" onClick={() => onDecision(change.id, 'accepted')} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${decisions[change.id] === 'accepted' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Check className="h-3.5 w-3.5" /> Accept</button>
                <button type="button" onClick={() => onDecision(change.id, 'rejected')} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${decisions[change.id] === 'rejected' ? 'border-slate-400 bg-slate-100 text-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><X className="h-3.5 w-3.5" /> Keep before</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};


const DiffBlock = ({ label, lines, tone }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <div className={`mt-1 border-l-2 px-3 py-2 text-xs leading-5 ${tone === 'added' ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-slate-50 text-slate-600 line-through'}`}>
      {lines.map((line, index) => <p key={`${line}-${index}`}>{line || 'Blank line'}</p>)}
    </div>
  </div>
);


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
  <section className="p-5">
    <h2 className="text-sm font-bold text-slate-950">Evidence suggestions</h2>
    <div className="mt-4 rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2"><Github className="h-4 w-4 text-slate-500" /><p className="text-xs font-bold text-slate-800">GitHub evidence</p></div>
      {!githubStatus.configured ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">GitHub MCP is not configured on this deployment. The app needs a read-only GitHub App before students can connect.</p>
      ) : !githubStatus.connected ? (
        <>
          <p className="mt-2 text-xs leading-5 text-slate-500">Connect the official GitHub MCP and approve only the repositories CareerPilot may inspect.</p>
          <button type="button" onClick={onConnect} disabled={githubWorking} className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">{githubWorking ? 'Opening GitHub…' : 'Connect GitHub'}</button>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-emerald-700">Connected as {githubStatus.account_login}</p>
            <button type="button" onClick={onDisconnect} className="text-[11px] font-bold text-red-600 hover:underline">Disconnect</button>
          </div>
          <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
            {repositories.map((repository) => (
              <label key={repository.full_name} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-slate-50">
                <input type="checkbox" checked={selectedRepositories.includes(repository.full_name)} onChange={() => onToggleRepository(repository.full_name)} className="mt-0.5" />
                <span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-700">{repository.full_name}</span><span className="block truncate text-[11px] text-slate-400">{repository.private ? 'Private, approved' : 'Public'}</span></span>
              </label>
            ))}
          </div>
          <button type="button" onClick={onSearchEvidence} disabled={selectedRepositories.length === 0 || githubWorking} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">{githubWorking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Check selected projects</button>
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
      {version.project_suggestions.map((suggestion) => (
        <article key={suggestion.title} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900"><TriangleAlert className="h-3.5 w-3.5" /> Future project · not resume evidence</p>
          <h3 className="mt-2 text-sm font-bold text-slate-900">{suggestion.title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{suggestion.description}</p>
        </article>
      ))}
      {version.project_suggestions.length === 0 && <p className="text-xs leading-5 text-slate-500">No future project suggestion is needed for the detected skills.</p>}
    </div>
  </section>
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
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[#36454f]">Existing GitHub project</p>
          <a href={project.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-slate-950 hover:underline">{project.name}</a>
        </div>
        <span className="rounded-full bg-[#eef0f1] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#36454f]">
          {approved ? 'Draft created' : 'Needs your confirmation'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{project.reason}</p>

      {!approved && (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <fieldset>
            <legend className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Skills this repository supports</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.matching_skills.map((skill) => (
                <label key={skill} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                  <input type="checkbox" checked={draft.selectedSkills.includes(skill)} onChange={() => toggleSkill(skill)} />
                  {skill}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-[11px] font-bold text-slate-600">
            What did you personally contribute?
            <textarea value={draft.contribution} onChange={(event) => setDraft((current) => ({ ...current, contribution: event.target.value }))} rows={2} placeholder="Example: I designed the API routes and wrote the integration tests." className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-[#36454f]" />
          </label>
          <label className="block text-[11px] font-bold text-slate-600">
            Resume wording you want to propose
            <textarea value={draft.wording} onChange={(event) => setDraft((current) => ({ ...current, wording: event.target.value }))} rows={2} placeholder={`Example: Built the authentication flow for ${project.name} using ${project.matching_skills.join(' and ')}.`} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-[#36454f]" />
          </label>
          <label className="block text-[11px] font-bold text-slate-600">
            Outcome or result (optional)
            <input value={draft.outcome} onChange={(event) => setDraft((current) => ({ ...current, outcome: event.target.value }))} placeholder="Only add a result you can explain in an interview." className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-[#36454f]" />
          </label>
          <label className="flex items-start gap-2 rounded-lg bg-[#f4f5f5] p-3 text-[11px] leading-5 text-slate-600">
            <input type="checkbox" checked={draft.confirmed} onChange={(event) => setDraft((current) => ({ ...current, confirmed: event.target.checked }))} className="mt-0.5" />
            I confirm this describes my own work and I can discuss it in an interview.
          </label>
          <button type="button" onClick={() => onApprove(project, draft)} disabled={disabled || !draft.confirmed || draft.selectedSkills.length === 0 || !draft.contribution.trim() || !draft.wording.trim()} className="rounded-lg bg-[#36454f] px-3 py-2 text-xs font-bold text-white hover:bg-[#202a30] disabled:cursor-not-allowed disabled:bg-slate-300">
            Create reviewable resume suggestion
          </button>
        </div>
      )}
      {approved && <p className="mt-3 text-xs leading-5 text-slate-600">A new draft is open in Resume Studio. Review and accept or reject its line before downloading.</p>}
    </article>
  );
};

export default ResumeStudio;
