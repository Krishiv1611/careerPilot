import { useEffect, useRef, useState } from 'react';
import { Check, Download, Eye, FileClock, Github, Loader2, Send, Sparkles, TriangleAlert, X } from 'lucide-react';
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
  scoreResumeLive,
  enhanceBullet,
  exportPdfDirect,
  getRecruiterXRay,
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
  const [editorContent, setEditorContent] = useState('');
  const [liveAtsDiagnostic, setLiveAtsDiagnostic] = useState(null);
  const [isScoringLive, setIsScoringLive] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceFeedback, setEnhanceFeedback] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [lensMode, setLensMode] = useState('candidate'); // 'candidate' | 'xray'
  const [xrayData, setXrayData] = useState(null);
  const [isXRayLoading, setIsXRayLoading] = useState(false);

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

  useEffect(() => {
    if (activeVersion?.content) {
      setEditorContent(activeVersion.content);
      if (activeVersion.ats_diagnostic) {
        setLiveAtsDiagnostic(activeVersion.ats_diagnostic);
      }
    }
  }, [activeVersion?.id, activeVersion?.content, activeVersion?.ats_diagnostic]);

  useEffect(() => {
    if (!editorContent || !editorContent.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setIsScoringLive(true);
        setIsXRayLoading(true);
        const effectiveJobDesc = jobId
          ? (jobs.find((job) => job.id === jobId)?.description || jobDescription || activeVersion?.job_description || '')
          : (jobDescription || activeVersion?.job_description || '');

        const [diagnostic, xray] = await Promise.all([
          scoreResumeLive({
            resume_text: editorContent,
            job_description: effectiveJobDesc,
          }),
          getRecruiterXRay({
            resume_text: editorContent,
            job_description: effectiveJobDesc,
          }),
        ]);
        setLiveAtsDiagnostic(diagnostic);
        setXrayData(xray);
      } catch {
        // Keep previous diagnostic on transient error
      } finally {
        setIsScoringLive(false);
        setIsXRayLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editorContent, jobDescription, jobId, jobs, activeVersion?.job_description]);

  useEffect(() => {
    if (lensMode === 'xray' && !xrayData && editorContent && editorContent.trim()) {
      const effectiveJobDesc = jobId
        ? (jobs.find((job) => job.id === jobId)?.description || jobDescription || activeVersion?.job_description || '')
        : (jobDescription || activeVersion?.job_description || '');

      setIsXRayLoading(true);
      getRecruiterXRay({
        resume_text: editorContent,
        job_description: effectiveJobDesc,
      })
        .then((data) => setXrayData(data))
        .catch(() => {})
        .finally(() => setIsXRayLoading(false));
    }
  }, [lensMode, xrayData, editorContent, jobId, jobDescription, jobs, activeVersion?.job_description]);

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
      setEditorContent(version.content);
      if (version.ats_diagnostic) {
        setLiveAtsDiagnostic(version.ats_diagnostic);
      }
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
      setEditorContent(version.content);
      if (version.ats_diagnostic) {
        setLiveAtsDiagnostic(version.ats_diagnostic);
      }
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

  const handleDirectPdfDownload = async () => {
    const textToExport = editorContent || activeVersion?.content || '';
    if (!textToExport.trim()) return;

    setIsDownloadingPdf(true);
    setError('');
    try {
      const firstLine = textToExport.trim().split('\n')[0]?.trim() || 'Candidate';
      const candidateName = firstLine.replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'Candidate';
      const fileBlob = await exportPdfDirect({
        resume_text: textToExport,
        candidate_name: candidateName,
      });
      const url = URL.createObjectURL(fileBlob);
      const link = window.document.createElement('a');
      const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'Candidate';
      link.href = url;
      link.download = `${safeName}_ATS_Resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.response?.data?.detail || 'The Harvard ATS PDF could not be generated.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleEnhanceBullet = async (textarea) => {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editorContent;

    let targetBullet = '';
    let replaceStart = start;
    let replaceEnd = end;

    if (start !== end) {
      targetBullet = text.substring(start, end).trim();
    } else {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', start);
      if (lineEnd === -1) lineEnd = text.length;
      targetBullet = text.substring(lineStart, lineEnd).trim();
      replaceStart = lineStart;
      replaceEnd = lineEnd;
    }

    if (!targetBullet) {
      setEnhanceFeedback('Place cursor on a bullet line or highlight text to enhance.');
      setTimeout(() => setEnhanceFeedback(''), 4000);
      return;
    }

    setIsEnhancing(true);
    setEnhanceFeedback('');
    try {
      const targetRole = jobs.find((job) => job.id === jobId)?.title || '';
      const result = await enhanceBullet({ bullet: targetBullet, target_role: targetRole });
      if (result?.enhanced_bullet) {
        const lineContent = text.substring(replaceStart, replaceEnd);
        const prefixMatch = lineContent.match(/^(\s*[-*•]\s*)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const cleanEnhanced = result.enhanced_bullet.replace(/^[-*•]\s*/, '');
        const replacement = prefix ? `${prefix}${cleanEnhanced}` : result.enhanced_bullet;

        const updated = text.substring(0, replaceStart) + replacement + text.substring(replaceEnd);
        setEditorContent(updated);
        setEnhanceFeedback(`Enhanced with STAR: "${result.action_verb}" action verb applied.`);
        setTimeout(() => setEnhanceFeedback(''), 4000);
      }
    } catch (err) {
      setEnhanceFeedback(err.response?.data?.detail || 'Could not enhance bullet with STAR.');
      setTimeout(() => setEnhanceFeedback(''), 4000);
    } finally {
      setIsEnhancing(false);
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
        <div className="flex flex-wrap items-center gap-2 self-start">
          {editorContent && (
            <button
              type="button"
              onClick={handleDirectPdfDownload}
              disabled={isDownloadingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300"
            >
              {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Harvard ATS PDF
            </button>
          )}
          {activeVersion && (
            <button
              type="button"
              onClick={downloadVersion}
              disabled={activeVersion.approval_status !== 'approved'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Download className="h-4 w-4" />
              {activeVersion.approval_status === 'approved' ? (activeVersion.template_mode === 'same_docx_template' ? 'Download approved DOCX' : 'Download approved PDF') : 'Review changes to download'}
            </button>
          )}
        </div>
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lens Mode:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setLensMode('candidate')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    lensMode === 'candidate'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Candidate Editor
                </button>
                <button
                  type="button"
                  onClick={() => setLensMode('xray')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    lensMode === 'xray'
                      ? 'bg-[#36454f] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔍 Recruiter 6-Sec X-Ray
                </button>
              </div>
            </div>
            {lensMode === 'xray' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
                  ⏱️ 6-Second First Impression Simulation
                </span>
                {xrayData?.screen_probability !== undefined && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    Screen Probability: {xrayData.screen_probability}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                Direct candidate editor with live ATS scorecard and STAR bullet enhancer
              </span>
            )}
          </div>

          <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white xl:grid-cols-[0.72fr_1.25fr_0.78fr]">
            <RequirementsPanel
              version={activeVersion}
              atsDiagnostic={liveAtsDiagnostic}
              isScoringLive={isScoringLive}
              lensMode={lensMode}
              xrayData={xrayData}
            />
            <ResumeCanvas
              version={activeVersion}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              instruction={instruction}
              setInstruction={setInstruction}
              working={working}
              onPrompt={applyPrompt}
              onEnhanceBullet={handleEnhanceBullet}
              isEnhancing={isEnhancing}
              enhanceFeedback={enhanceFeedback}
              onDirectPdfDownload={handleDirectPdfDownload}
              isDownloadingPdf={isDownloadingPdf}
              isScoringLive={isScoringLive}
              lensMode={lensMode}
              setLensMode={setLensMode}
              xrayData={xrayData}
              isXRayLoading={isXRayLoading}
            />
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


const RequirementsPanel = ({ version, atsDiagnostic, isScoringLive, lensMode, xrayData }) => {
  const ats = atsDiagnostic || version?.ats_diagnostic || {
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
      {lensMode === 'xray' && xrayData && (
        <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-900">
              6-Sec Scan Pass Rate
            </span>
            <span className="text-base font-black text-cyan-950">
              {xrayData.screen_probability}%
            </span>
          </div>
          <p className="mt-1 text-xs text-cyan-900 leading-snug">
            {xrayData.screen_probability >= 75
              ? 'High callback likelihood in 6-second glance.'
              : xrayData.screen_probability >= 50
                ? 'Moderate callback probability. Eliminate detected fluff words.'
                : 'Pass risk. Buzzword density or unquantified claims detected.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-950">100-Pt ATS Scorecard</h2>
            {isScoringLive && (
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" title="Live scoring..." />
            )}
          </div>
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
            {(version?.matched_skills || []).map((skill) => (
              <div key={skill} className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800"><Check className="h-3.5 w-3.5" /> {skill}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-900/70">{(version?.evidence_map?.[skill] || [])?.[0] || 'Found in resume text'}</p>
              </div>
            ))}
            {(version?.matched_skills?.length || 0) === 0 && <p className="text-xs leading-5 text-slate-500">No structured skill evidence matched this JD.</p>}
          </div>
        </div>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Missing Gaps</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(version?.missing_skills || []).map((skill) => <span key={skill} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">{skill}</span>)}
            {(version?.missing_skills?.length || 0) === 0 && <p className="text-xs text-slate-500">No vocabulary gaps found.</p>}
          </div>
        </div>
      </div>
    </section>
  );
};


const FLUFF_CATALOG = {
  hardworking: "Replace with evidence of sustained output (e.g. 'Delivered 14 features across 3 sprint cycles')",
  passionate: "Replace with tangible project contributions or open-source commits",
  'self-starter': "Replace with autonomous initiative (e.g. 'Spearheaded migration to Docker')",
  'team player': "Replace with collaboration metrics (e.g. 'Partnered with 4 engineers in agile sprint')",
  'detail-oriented': "Replace with quality metrics (e.g. 'Achieved 98% test coverage with zero regressions')",
  'quick learner': "Replace with rapid execution (e.g. 'Mastered Go in 2 weeks to ship payment gateway')",
  'results-driven': "Replace with specific revenue, latency, or throughput metrics",
  enthusiastic: "Replace with documented domain achievements",
  'go-getter': "Replace with proactive architectural contributions",
};

const renderFluffAnnotatedText = (text, fluffCatalog = FLUFF_CATALOG) => {
  if (!text) return '\u00A0';
  const words = Object.keys(fluffCatalog);
  if (words.length === 0) return text;

  const sorted = [...words].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${sorted.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'gi');

  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const matched = match[0];
    const key = matched.toLowerCase();
    const replacement = fluffCatalog[key] || 'Replace with concrete quantifiable STAR achievement';

    parts.push(
      <span
        key={`fluff-${match.index}`}
        className="group relative inline-block rounded bg-amber-100 px-1 font-semibold text-amber-950 underline decoration-amber-500 decoration-2 underline-offset-2 transition hover:bg-amber-200 cursor-help"
      >
        {matched}
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden w-72 rounded-lg bg-slate-900 p-2.5 text-left text-xs font-normal text-white shadow-2xl group-hover:block z-40">
          <span className="flex items-center gap-1 font-bold text-amber-300">
            ⚠️ Fluff Word Detected: "{matched}"
          </span>
          <span className="mt-1 block text-slate-200 leading-relaxed text-[11px]">{replacement}</span>
        </span>
      </span>
    );
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
};

const parseResumeForHotspots = (content) => {
  const lines = (content || '').split('\n');
  const headerLines = [];
  const skillsLines = [];
  const topBulletLines = [];
  const otherLines = [];

  let inHeader = true;
  let inSkills = false;
  let bulletsFound = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (inHeader && headerLines.length > 0) {
        inHeader = false;
      }
      otherLines.push({ text: rawLine, isBlank: true, index: i });
      continue;
    }

    const isHeading =
      /^(EDUCATION|EXPERIENCE|WORK EXPERIENCE|PROJECTS|TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|SUMMARY|PROFILE)\b/i.test(trimmed) ||
      (trimmed.length <= 32 && /^[A-Z\s/&-]+$/.test(trimmed) && !trimmed.includes('.'));

    if (isHeading) {
      inHeader = false;
      if (/SKILL|COMPETENC|TECHNOLOG|STACK/i.test(trimmed)) {
        inSkills = true;
      } else {
        inSkills = false;
      }
      otherLines.push({ text: rawLine, isHeading: true, index: i });
      continue;
    }

    if (inHeader) {
      if (headerLines.length < 3) {
        headerLines.push({ text: rawLine, index: i });
        continue;
      } else {
        inHeader = false;
      }
    }

    if (inSkills) {
      skillsLines.push({ text: rawLine, index: i });
      continue;
    }

    if (!inSkills && skillsLines.length === 0 && /^technical skills?:/i.test(trimmed)) {
      skillsLines.push({ text: rawLine, index: i });
      continue;
    }

    const isBullet = /^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    if (isBullet && bulletsFound < 2) {
      topBulletLines.push({ text: rawLine, index: i });
      bulletsFound++;
      continue;
    }

    otherLines.push({ text: rawLine, index: i });
  }

  if (headerLines.length === 0 && lines.length > 0) {
    const firstNonEmpty = lines.find((l) => l.trim().length > 0);
    if (firstNonEmpty) {
      headerLines.push({ text: firstNonEmpty, index: 0 });
    }
  }

  if (skillsLines.length === 0) {
    const skillCandidate = lines.find((l) => /python|fastapi|docker|react|sql|aws|postgresql|redis/i.test(l) && !topBulletLines.some((b) => b.text === l));
    if (skillCandidate) {
      skillsLines.push({ text: skillCandidate, index: -1 });
    }
  }

  if (topBulletLines.length === 0) {
    const bulletCandidates = otherLines.filter((l) => !l.isHeading && !l.isBlank && l.text.trim().length > 30);
    if (bulletCandidates.length > 0) {
      topBulletLines.push(bulletCandidates[0]);
      if (bulletCandidates.length > 1) {
        topBulletLines.push(bulletCandidates[1]);
      }
    }
  }

  return {
    headerLines,
    skillsLines,
    topBulletLines,
    otherLines,
  };
};

const ScreenProbabilityDial = ({ score = 65 }) => {
  const radius = 28;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const toneColor =
    score >= 75
      ? 'text-emerald-500'
      : score >= 50
        ? 'text-amber-500'
        : 'text-rose-500';

  const badgeColor =
    score >= 75
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : score >= 50
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-rose-50 text-rose-800 border-rose-200';

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90 transform">
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`${toneColor} transition-all duration-500 ease-out`}
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-black text-slate-950">{score}%</span>
          <span className="text-[8px] font-bold uppercase text-slate-400">Screen</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
            {score >= 75 ? 'Likely Screen' : score >= 50 ? 'Borderline' : 'At Risk'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Predicted 6s recruiter callback rate</p>
      </div>
    </div>
  );
};

const HiringManagerVerdictBanner = ({ xrayData }) => {
  const score = xrayData?.screen_probability ?? 65;
  const verdict = xrayData?.hiring_manager_verdict || 'Scanning resume for 6-second recruiter first impression...';
  const greenFlags = xrayData?.instant_green_flags || [];
  const redFlags = xrayData?.instant_red_flags || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-900 border border-cyan-200">
              👁️ Recruiter 6-Sec X-Ray
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cognitive Scan Verdict
            </span>
          </div>
          <h2 className="mt-1 text-base font-black text-slate-950">Hiring Manager 6-Second Verdict</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 max-w-xl">{verdict}</p>
        </div>
        <ScreenProbabilityDial score={score} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Instant Green Flags (Glance Winners)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">{greenFlags.length} detected</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {greenFlags.map((flag) => (
              <span
                key={flag}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-800 shadow-2xs"
              >
                <Check className="h-3 w-3 text-emerald-600" />
                {flag}
              </span>
            ))}
            {greenFlags.length === 0 && (
              <p className="text-xs text-slate-500">No high-value tech keywords detected in instant glance.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
              Instant Red Flags (6-Sec Disqualifiers)
            </span>
            <span className="text-[11px] font-semibold text-rose-700">{redFlags.length} detected</span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {redFlags.map((flag, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 rounded-md bg-white border border-rose-200 px-2.5 py-1 text-xs text-rose-900 shadow-2xs"
              >
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
            {redFlags.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-800">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                No immediate 6-second disqualifiers detected.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecruiterXRayView = ({
  content,
  xrayData,
  onSwitchToEditor,
}) => {
  const hotspots = parseResumeForHotspots(content);
  const fluffWords = xrayData?.fluff_words_detected || [];
  const fluffCatalog = { ...FLUFF_CATALOG };
  for (const item of fluffWords) {
    if (item.word && item.replacement) {
      fluffCatalog[item.word.toLowerCase()] = item.replacement;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cyan-50/70 border border-cyan-200 px-3.5 py-2.5 text-xs text-cyan-950">
        <span className="font-bold flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-cyan-700" />
          3 Visual Scan Hotspots (Where recruiters look in first 6 seconds):
        </span>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-md bg-white border border-cyan-300 px-2 py-0.5 font-bold text-cyan-800">
            1. Header & Title (Sec 0-1)
          </span>
          <span className="rounded-md bg-white border border-cyan-300 px-2 py-0.5 font-bold text-cyan-800">
            2. Top 2 Bullets (Sec 2-4)
          </span>
          <span className="rounded-md bg-white border border-cyan-300 px-2 py-0.5 font-bold text-cyan-800">
            3. Skills Matrix (Sec 5-6)
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#fffefa] p-4 sm:p-5 font-mono text-xs sm:text-sm leading-6 text-slate-800 space-y-4">
        {/* Hotspot 1: Header */}
        <div className="rounded-xl border-2 border-cyan-400 bg-cyan-50/20 p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.12)] ring-1 ring-cyan-300/40">
          <div className="mb-2 flex items-center justify-between border-b border-cyan-200/60 pb-1.5 font-sans">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-100 border border-cyan-300 px-2 py-0.5 text-[11px] font-black text-cyan-900 uppercase tracking-wider">
              🎯 Hotspot 1: Header & Target Title (Sec 0-1)
            </span>
            <span className="text-[11px] font-semibold text-cyan-700">Role Match Skim</span>
          </div>
          <div className="space-y-1">
            {hotspots.headerLines.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap">
                {renderFluffAnnotatedText(line.text, fluffCatalog)}
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot 3: Technical Skills Matrix */}
        {hotspots.skillsLines.length > 0 && (
          <div className="rounded-xl border-2 border-cyan-400 bg-cyan-50/20 p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.12)] ring-1 ring-cyan-300/40">
            <div className="mb-2 flex items-center justify-between border-b border-cyan-200/60 pb-1.5 font-sans">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-100 border border-cyan-300 px-2 py-0.5 text-[11px] font-black text-cyan-900 uppercase tracking-wider">
                🛠️ Hotspot 3: Technical Skills Matrix (Sec 5-6)
              </span>
              <span className="text-[11px] font-semibold text-cyan-700">Required Stack Verification</span>
            </div>
            <div className="space-y-1">
              {hotspots.skillsLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {renderFluffAnnotatedText(line.text, fluffCatalog)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotspot 2: Top 2 Work/Project Bullets */}
        {hotspots.topBulletLines.length > 0 && (
          <div className="rounded-xl border-2 border-cyan-400 bg-cyan-50/20 p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.12)] ring-1 ring-cyan-300/40">
            <div className="mb-2 flex items-center justify-between border-b border-cyan-200/60 pb-1.5 font-sans">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-100 border border-cyan-300 px-2 py-0.5 text-[11px] font-black text-cyan-900 uppercase tracking-wider">
                ⚡ Hotspot 2: Top 2 Work/Project Bullets (Sec 2-4)
              </span>
              <span className="text-[11px] font-semibold text-cyan-700">Quantified Technical Impact</span>
            </div>
            <div className="space-y-1.5">
              {hotspots.topBulletLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {renderFluffAnnotatedText(line.text, fluffCatalog)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Resume Lines */}
        {hotspots.otherLines.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-2">
              Additional Resume Sections (Secondary Skim)
            </p>
            {hotspots.otherLines.map((line, idx) => (
              <div
                key={idx}
                className={`whitespace-pre-wrap ${line.isHeading ? 'font-sans font-bold text-slate-900 mt-3 pt-1 text-xs uppercase tracking-wider' : ''}`}
              >
                {line.isBlank ? '\u00A0' : renderFluffAnnotatedText(line.text, fluffCatalog)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fluff Words Panel */}
      {fluffWords.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                {fluffWords.length}
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Fluff Words Detected — Actionable STAR Replacements
              </h3>
            </div>
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer"
            >
              Fix in Candidate Editor
            </button>
          </div>
          <div className="mt-3 divide-y divide-amber-200/70">
            {fluffWords.map((item, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline gap-2">
                  <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-bold text-amber-950">
                    "{item.word}"
                  </span>
                  <span className="text-xs text-amber-900/80 italic">in {item.context}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-amber-950">
                  <span className="font-bold text-amber-900">Recommended fix: </span>
                  {item.replacement}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-emerald-600" />
            Zero fluff buzzwords detected. Every word contributes to technical credibility!
          </span>
          <button
            type="button"
            onClick={onSwitchToEditor}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Edit Resume
          </button>
        </div>
      )}
    </div>
  );
};

const ResumeCanvas = ({
  version,
  editorContent,
  setEditorContent,
  instruction,
  setInstruction,
  working,
  onPrompt,
  onEnhanceBullet,
  isEnhancing,
  enhanceFeedback,
  onDirectPdfDownload,
  isDownloadingPdf,
  isScoringLive,
  lensMode,
  setLensMode,
  xrayData,
  isXRayLoading,
}) => {
  const textareaRef = useRef(null);

  const triggerEnhance = () => {
    onEnhanceBullet(textareaRef.current);
  };

  return (
    <section className="border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-950">
              {lensMode === 'xray' ? 'Recruiter 6-Sec X-Ray' : 'Live Resume Editor'}
            </h2>
            {version?.template_mode && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {version.template_mode === 'same_docx_template' ? 'DOCX template' : 'Clean PDF'}
              </span>
            )}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setLensMode('candidate')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
                  lensMode === 'candidate'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                📝 Candidate Editor
              </button>
              <button
                type="button"
                onClick={() => setLensMode('xray')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
                  lensMode === 'xray'
                    ? 'bg-[#36454f] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🔍 Recruiter 6-Sec X-Ray
              </button>
            </div>
            {(isScoringLive || isXRayLoading) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Evaluating…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {lensMode === 'xray' ? 'X-Ray Active' : 'ATS Synced'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {lensMode === 'xray'
              ? 'Simulates first 6 seconds of recruiter gaze: hotspots, instant red/green flags, and fluff detector.'
              : 'Edit directly below. 250ms debounced live ATS evaluation.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lensMode === 'candidate' && (
            <button
              type="button"
              onClick={triggerEnhance}
              disabled={isEnhancing}
              title="Select bullet or place cursor on line to enhance with STAR"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {isEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-600" />}
              Enhance with STAR
            </button>
          )}
          {lensMode === 'xray' && (
            <button
              type="button"
              onClick={() => setLensMode('candidate')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              📝 Candidate Editor
            </button>
          )}
          <button
            type="button"
            onClick={onDirectPdfDownload}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#36454f] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300"
          >
            {isDownloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download Harvard ATS PDF
          </button>
        </div>
      </div>

      {enhanceFeedback && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-900">
          {enhanceFeedback}
        </div>
      )}

      {lensMode === 'xray' ? (
        <div className="mt-4 space-y-5">
          <HiringManagerVerdictBanner xrayData={xrayData} />
          <RecruiterXRayView
            content={editorContent}
            xrayData={xrayData}
            onSwitchToEditor={() => setLensMode('candidate')}
          />
        </div>
      ) : (
        <>
          <div className="mt-3">
            <textarea
              ref={textareaRef}
              value={editorContent}
              onChange={(event) => setEditorContent(event.target.value)}
              rows={22}
              placeholder="Resume text..."
              className="w-full rounded-xl border border-slate-200 bg-[#fffefa] p-4 font-mono text-xs sm:text-sm leading-6 text-slate-800 outline-none transition focus:border-[#36454f] focus:ring-1 focus:ring-[#36454f]"
              spellCheck="false"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onPrompt()}
              placeholder="Try: Emphasize Python"
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#708090]"
            />
            <button
              type="button"
              onClick={onPrompt}
              disabled={!instruction.trim() || working}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#36454f] text-white disabled:bg-slate-300"
              aria-label="Apply prompt"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Highlight or click any bullet line to transform with STAR methodology, or type an AI tailoring prompt above.
          </p>
        </>
      )}
    </section>
  );
};


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
