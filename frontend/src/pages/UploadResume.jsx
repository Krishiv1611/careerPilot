import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  FileCheck2,
  FileCode,
  FileText,
  Filter,
  Layers,
  Loader2,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import { mergeTargetRole } from '../app/career-track-suggestions';
import {
  deleteResume,
  getAllResumes,
  getCandidateProfile,
  updateCandidateProfile,
  uploadResume,
} from '../services/api';
import {
  StudioBadge,
  StudioButton,
  StudioCard,
} from '../components/studio/StudioPrimitives';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;

/* Format file size helper */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* Parsing Telemetry Radar Component */
const ParsingTelemetryRadar = ({ fileName }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#05070A] p-6 shadow-2xl shadow-cyan-500/10 text-left">
      <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Radar className="h-4 w-4 animate-spin" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              AST Parsing Telemetry Radar
            </h4>
            <p className="text-[11px] text-cyan-400 font-mono">
              Extracting candidate evidence from {fileName || 'document'}...
            </p>
          </div>
        </div>
        <StudioBadge variant="cyan" size="xs">
          Scanning
        </StudioBadge>
      </div>

      <div className="mt-5 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>[1/4] Reading binary stream &amp; normalizing document layout...</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-cyan-500">&gt;</span>
          <span>[2/4] Parsing AST AST syntax trees &amp; experience timelines...</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-cyan-500">&gt;</span>
          <span>[3/4] Vectorizing technical ontology &amp; candidate skill clusters...</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-cyan-500">&gt;</span>
          <span>[4/4] Projecting career track alignment signals &amp; model confidence...</span>
        </div>
      </div>

      {/* Radar Pulse Line */}
      <div className="mt-5 relative h-1.5 w-full overflow-hidden rounded-full bg-[#0F141C] border border-[#1F2937]">
        <MotionDiv
          className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500"
          animate={shouldReduceMotion ? { opacity: [0.6, 1, 0.6] } : { x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          style={{ width: '40%' }}
        />
      </div>
    </div>
  );
};

/* MAIN UPLOAD RESUME & PROFILE COMPONENT */
const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [profile, setProfile] = useState({
    target_roles: [],
    preferred_locations: [],
    employment_types: [],
    skills: [],
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTrack, setSavingTrack] = useState('');
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  const refreshResumes = async () => {
    const data = await getAllResumes();
    setResumes(data);
    return data;
  };

  const refreshProfile = async () => {
    const data = await getCandidateProfile();
    setProfile(data);
    return data;
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const [resumeData, profileData] = await Promise.all([
          getAllResumes(),
          getCandidateProfile(),
        ]);
        if (active) {
          setResumes(resumeData);
          setProfile(profileData);
          if (resumeData.length > 0) {
            setSelectedResume(resumeData[0]);
          }
        }
      } catch {
        if (active) setError('Your candidate profile could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadResume(file);
      setSelectedResume(uploaded);
      setFile(null);
      await Promise.all([refreshResumes(), refreshProfile()]);
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.detail ||
          'The resume could not be uploaded. Please verify the file format and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    setError('');
    try {
      await deleteResume(resumeId);
      const [remaining] = await Promise.all([refreshResumes(), refreshProfile()]);
      if (selectedResume?.id === resumeId) {
        setSelectedResume(remaining[0] || null);
      }
      setPendingDeleteId(null);
    } catch {
      setError('The resume could not be deleted.');
    }
  };

  const saveProfile = async (preferences) => {
    setSavingProfile(true);
    setError('');
    try {
      const updated = await updateCandidateProfile(preferences);
      setProfile(updated);
      return updated;
    } catch {
      setError('Your job preferences could not be saved.');
      return null;
    } finally {
      setSavingProfile(false);
    }
  };

  const useCareerTrack = async (category) => {
    setSavingTrack(category);
    await saveProfile(mergeTargetRole(profile, category));
    setSavingTrack('');
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.toLowerCase();
      if (ext.endsWith('.pdf') || ext.endsWith('.docx')) {
        setFile(droppedFile);
      } else {
        setError('Please drop a valid PDF or DOCX resume file.');
      }
    }
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Studio Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <StudioBadge variant="cyan" size="sm">
              Evidence Source of Truth
            </StudioBadge>
            <span className="font-mono text-xs text-slate-400">
              AST Parsing &amp; Candidate Taxonomy
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-100 sm:text-4xl">
            Candidate Evidence Profile
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
            Keep job preferences cleanly decoupled from factual evidence. CareerPilot treats only
            parsed resume AST and student-confirmed GitHub repositories as verified candidate proof.
          </p>
        </div>
        <Link to="/profile/tailor">
          <StudioButton variant="primary" size="md" icon={Sparkles}>
            Open Resume Studio
          </StudioButton>
        </Link>
      </header>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto font-mono text-xs text-rose-400 hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Preferences Deck */}
      <ProfilePreferences
        key={`${profile.id || 'new'}:${(profile.target_roles || []).join('|')}`}
        profile={profile}
        saving={savingProfile}
        onSave={saveProfile}
      />

      {/* Main Grid: Upload Dropzone & Evidence Viewer */}
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Left Column: Dropzone & Truth Guarantee */}
        <section className="space-y-5">
          {/* File Dropzone Card */}
          <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-100">Upload Resume Source</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  PDF or DOCX (max 10 MB). DOCX preserves high-fidelity layout.
                </p>
              </div>
            </div>

            {/* Interactive Drag & Drop Box with Animated Dashed Border Glow */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200',
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.3)] ring-2 ring-cyan-500/50'
                  : file
                  ? 'border-emerald-500/60 bg-emerald-950/15 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'border-[#1F2937] bg-[#05070A] hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
              )}
            >
              <input
                id="resume-file-input"
                type="file"
                accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                className="sr-only"
                onChange={handleFileInputChange}
              />
              <label htmlFor="resume-file-input" className="block cursor-pointer">
                {file ? (
                  <div className="space-y-2">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <FileCheck2 className="h-6 w-6" />
                    </span>
                    <span className="block text-xs font-mono font-bold text-slate-100 truncate max-w-full px-2">
                      {file.name}
                    </span>
                    <span className="block text-[11px] font-mono text-emerald-400">
                      {formatFileSize(file.size)} &bull; Ready for extraction
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-slate-400 border border-white/10">
                      <FileText className="h-6 w-6" />
                    </span>
                    <span className="block text-xs font-bold text-slate-200">
                      Drag &amp; drop resume file here
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      or click to browse local files
                    </span>
                  </div>
                )}
              </label>

              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-2 text-[11px] font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Clear file
                </button>
              )}
            </div>

            {/* Upload Button */}
            <StudioButton
              variant="primary"
              size="md"
              icon={Upload}
              disabled={!file || uploading}
              loading={uploading}
              onClick={handleUpload}
              className="w-full"
            >
              {uploading ? 'Extracting Evidence AST...' : 'Add Resume & Parse Evidence'}
            </StudioButton>
          </StudioCard>

          {/* Parsing Telemetry Radar when uploading */}
          {uploading && <ParsingTelemetryRadar fileName={file?.name} />}

          {/* Truth Guarantee Card */}
          <StudioCard variant="elevated" className="p-5 border-[#1F2937] bg-[#171F2C]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Original Stays Unchanged
                </h4>
                <p className="text-xs leading-relaxed text-slate-400">
                  Targeted studio versions are created separately and require your explicit review
                  decision before download or job application.
                </p>
              </div>
            </div>
          </StudioCard>
        </section>

        {/* Right Column: Saved Evidence Sources & Skills Cloud */}
        <section className="space-y-5">
          <StudioCard variant="default" className="border-[#1F2937] bg-[#0F141C] overflow-hidden">
            {/* Header with Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] px-6 py-4 bg-[#171F2C]/50">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                    Saved Evidence Sources
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select a document to inspect AST skills cloud and career tracks.
                  </p>
                </div>
              </div>

              {resumes.length > 0 && (
                <StudioBadge variant="cyan" size="sm">
                  {resumes.length} {resumes.length === 1 ? 'Source' : 'Sources'} Active
                </StudioBadge>
              )}
            </div>

            {loading ? (
              <div className="grid min-h-[300px] place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  <p className="font-mono text-xs text-slate-400">Loading extracted evidence...</p>
                </div>
              </div>
            ) : resumes.length === 0 ? (
              <div className="px-6 py-16 text-center space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-slate-500 border border-white/10">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-slate-200">No Resume Added Yet</h4>
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-400">
                  Upload a PDF or DOCX file to extract candidate evidence, career tracks, and
                  technical skills.
                </p>
              </div>
            ) : (
              <div className="grid min-h-[450px] md:grid-cols-[14rem_1fr]">
                {/* Resumes Navigation Rail */}
                <div className="border-b border-[#1F2937] p-3 md:border-b-0 md:border-r bg-[#0A0E14]/70">
                  <div className="space-y-1.5">
                    {resumes.map((resume, index) => {
                      const active =
                        (selectedResume?.id || resumes[0]?.id) === resume.id;
                      return (
                        <button
                          key={resume.id}
                          type="button"
                          onClick={() => setSelectedResume(resume)}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer',
                            active
                              ? 'border-cyan-500/50 bg-cyan-950/20 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                              : 'border-transparent text-slate-400 hover:bg-[#171F2C] hover:text-slate-200'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold">
                              Resume {index + 1}
                            </span>
                            {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                          </div>
                          <span className="mt-1 block text-[10px] font-mono text-slate-500">
                            {new Date(resume.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resume Evidence Detail Deck */}
                <ResumeEvidence
                  resume={selectedResume || resumes[0]}
                  profile={profile}
                  savingTrack={savingTrack}
                  onUseTrack={useCareerTrack}
                  pendingDeleteId={pendingDeleteId}
                  onRequestDelete={setPendingDeleteId}
                  onDelete={handleDelete}
                  skillSearchQuery={skillSearchQuery}
                  onSkillSearchChange={setSkillSearchQuery}
                />
              </div>
            )}
          </StudioCard>
        </section>
      </div>
    </div>
  );
};

/* Profile Preferences Deck Component */
const ProfilePreferences = ({ profile, saving, onSave }) => {
  const [roles, setRoles] = useState((profile.target_roles || []).join(', '));
  const [locations, setLocations] = useState((profile.preferred_locations || []).join(', '));
  const [employmentTypes, setEmploymentTypes] = useState(profile.employment_types || []);

  const toggleType = (type) =>
    setEmploymentTypes((current) =>
      current.includes(type) ? current.filter((value) => value !== type) : [...current, type]
    );

  const save = () =>
    onSave({
      target_roles: splitValues(roles),
      preferred_locations: splitValues(locations),
      employment_types: employmentTypes,
    });

  return (
    <StudioCard variant="default" className="p-6 border-[#1F2937] bg-[#0F141C] space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            Search Discovery Preferences
          </p>
          <h2 className="text-lg font-bold text-slate-100">
            Define Target Roles &amp; Relevant Opportunities
          </h2>
          <p className="text-xs text-slate-400">
            Target preferences steer automated job search and matching. They are kept distinct from
            factual candidate evidence.
          </p>
        </div>

        <StudioBadge variant="neutral" size="sm">
          {profile.skills?.length || 0} Detected Skills in Cloud
        </StudioBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 block">
          <span className="text-xs font-mono font-bold text-slate-300">
            Target Roles (comma-separated)
          </span>
          <input
            value={roles}
            onChange={(event) => setRoles(event.target.value)}
            placeholder="Backend Engineer, Full-Stack Developer, DevOps"
            className="h-10 w-full rounded-xl border border-[#1F2937] bg-[#05070A] px-3.5 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-mono font-bold text-slate-300">
            Preferred Locations (comma-separated)
          </span>
          <input
            value={locations}
            onChange={(event) => setLocations(event.target.value)}
            placeholder="San Francisco, New York, Remote"
            className="h-10 w-full rounded-xl border border-[#1F2937] bg-[#05070A] px-3.5 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </label>
      </div>

      {/* Employment Type Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-mono text-slate-400 mr-2">Work Structure:</span>
        {['full-time', 'internship', 'contract'].map((type) => {
          const isSelected = employmentTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition-all duration-150 cursor-pointer capitalize flex items-center gap-1.5',
                isSelected
                  ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'border-[#1F2937] bg-[#05070A] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-cyan-400" />}
              {type}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <StudioButton
          variant="primary"
          size="sm"
          loading={saving}
          disabled={saving}
          onClick={save}
          icon={Check}
        >
          {saving ? 'Saving Preferences...' : 'Save Preferences'}
        </StudioButton>
      </div>
    </StudioCard>
  );
};

/* Resume Evidence Detail Deck Component */
const ResumeEvidence = ({
  resume,
  profile,
  savingTrack,
  onUseTrack,
  pendingDeleteId,
  onRequestDelete,
  onDelete,
  skillSearchQuery,
  onSkillSearchChange,
}) => {
  const [copiedRawText, setCopiedRawText] = useState(false);

  const copyRaw = () => {
    if (resume?.raw_text) {
      navigator.clipboard.writeText(resume.raw_text);
      setCopiedRawText(true);
      setTimeout(() => setCopiedRawText(false), 2000);
    }
  };

  return (
    <div className="p-5 sm:p-6 space-y-6">
      {/* Evidence Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#1F2937] pb-4">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            Current AST Extraction
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-100">Candidate Evidence Artifact</h3>
        </div>

        {pendingDeleteId === resume.id ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-right space-y-2">
            <p className="text-[11px] leading-relaxed text-rose-300">
              Permanently remove this resume and its tailored versions?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onRequestDelete(null)}
                className="rounded-lg border border-slate-700 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-white/[0.08] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDelete(resume.id)}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                Delete Resume
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onRequestDelete(resume.id)}
            className="self-end rounded-xl border border-slate-800 p-2 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer"
            aria-label="Delete resume"
            title="Delete resume source"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Career Track Rail */}
      <CareerTrackRail
        resume={resume}
        profile={profile}
        savingTrack={savingTrack}
        onUseTrack={onUseTrack}
      />

      {/* Skills Cloud */}
      <SkillGroups
        resume={resume}
        searchQuery={skillSearchQuery}
        onSearchChange={onSkillSearchChange}
      />

      {/* Raw Text Inspector Accordion */}
      <details className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#05070A] group">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-mono font-bold text-slate-300 hover:bg-[#0A0E14] select-none">
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            Inspect Raw Document Text
          </span>
          <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="border-t border-[#1F2937] p-4 bg-[#0A0E14] space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyRaw}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
            >
              {copiedRawText ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Text
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Raw Text
                </>
              )}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300 bg-[#05070A] p-3 rounded-lg border border-[#1F2937]">
            {resume.raw_text}
          </pre>
        </div>
      </details>
    </div>
  );
};

/* Career Track Rail Component */
const CareerTrackRail = ({ resume, profile, savingTrack, onUseTrack }) => {
  const suggestions = resume.career_track_suggestions || [];
  const targetRoles = (profile.target_roles || []).map((role) => role.toLowerCase());

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Predicted Career Track Signals
          </h4>
          <p className="mt-0.5 text-xs text-slate-400">
            Model inferences from your parsed accomplishments. Select roles to focus discovery.
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 text-xs text-slate-400">
          No distinct track inference available. You can add custom target roles in the search
          preferences above.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => {
            const alreadyTargeted = targetRoles.includes(suggestion.category.toLowerCase());
            const isSaving = savingTrack === suggestion.category;
            const signalPercent = Math.round(suggestion.confidence * 100);

            return (
              <div
                key={`${suggestion.category}-${suggestion.rank}`}
                className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-3.5 space-y-2.5 transition hover:border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/20 font-mono text-xs font-black text-cyan-300 border border-cyan-500/40">
                      #{suggestion.rank}
                    </span>
                    <span className="text-xs font-bold text-slate-100">
                      {suggestion.category}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-cyan-400">
                    {signalPercent}% Signal
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#05070A] border border-[#1F2937]">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                    style={{ width: `${signalPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {alreadyTargeted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> In Target Roles
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUseTrack(suggestion.category)}
                      disabled={Boolean(savingTrack)}
                      className="rounded-lg border border-[#1F2937] bg-[#05070A] px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Adding...' : 'Use as Target Role'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

/* Skills Cloud Component */
const SkillGroups = ({ resume, searchQuery, onSearchChange }) => {
  const groups = Object.entries(resume.skill_categories || {}).filter(
    ([, skills]) => skills.length > 0
  );

  const flatSkills = resume.extracted_skills || [];

  const filterMatches = (skill) => {
    if (!searchQuery.trim()) return true;
    return skill.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Candidate Evidence Skills Cloud
          </h4>
          <p className="mt-0.5 text-xs text-slate-400">
            Extracted AST skills verified from uploaded document text.
          </p>
        </div>

        {/* Live Filter Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter skills..."
            className="h-8 w-44 rounded-lg border border-[#1F2937] bg-[#05070A] pl-8 pr-2 text-xs font-mono text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-200"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map(([category, skills]) => {
            const matchedSkills = skills.filter(filterMatches);
            if (matchedSkills.length === 0) return null;

            return (
              <div
                key={category}
                className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    {humanizeCategory(category)}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-white/10">
                    {matchedSkills.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill) => (
                    <SkillTag key={skill} skill={skill} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : flatSkills.length > 0 ? (
        <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-4">
          <div className="flex flex-wrap gap-2">
            {flatSkills.filter(filterMatches).map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1F2937] bg-[#171F2C] p-5 text-center text-xs text-slate-400">
          No structured technical skills were extracted. Raw source text is available below.
        </div>
      )}
    </div>
  );
};

/* Individual Skill Tag Component */
const SkillTag = ({ skill }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-medium text-emerald-200 shadow-xs hover:border-emerald-500/50 hover:bg-emerald-500/20 transition select-none">
    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
    <span>{skill}</span>
  </span>
);

const splitValues = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const humanizeCategory = (value) =>
  value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default UploadResume;
