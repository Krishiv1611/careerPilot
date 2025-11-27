import { useState, useEffect } from 'react';
import { getAllResumes, runCareerPilot } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BrainCircuit, Search, Loader2, FileText, CheckCircle, AlertCircle, Briefcase, ExternalLink, Key } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";

const CareerPilot = () => {
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [useSerpApi, setUseSerpApi] = useState(false);
    const [loading, setLoading] = useState(false);

    // API Keys State
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [serpApiKey, setSerpApiKey] = useState('');
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'search' or 'analyze'
    const [pendingJobId, setPendingJobId] = useState(null); // for analyze action

    // Two stages of results:
    // 1. Job Search Results (List of jobs)
    // 2. Analysis Result (Specific job analysis)
    const [jobResults, setJobResults] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'resume', 'cover_letter'

    // Store intermediate resume data to avoid re-processing
    const [resumeData, setResumeData] = useState(null);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const data = await getAllResumes();
                setResumes(data);
                if (data.length > 0) setSelectedResume(data[0].id);
            } catch (err) {
                console.error("Failed to fetch resumes", err);
            }
        };
        fetchResumes();

        // Load API keys from localStorage (scoped to user)
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            const storedGoogleKey = localStorage.getItem(`googleApiKey_${user.id}`);
            const storedSerpKey = localStorage.getItem(`serpApiKey_${user.id}`);
            if (storedGoogleKey) setGoogleApiKey(storedGoogleKey);
            if (storedSerpKey) setSerpApiKey(storedSerpKey);
        }
    }, []);

    const handleKeySubmit = () => {
        if (!googleApiKey) {
            setError("Google API Key is required.");
            return;
        }
        if (useSerpApi && !serpApiKey) {
            setError("SerpAPI Key is required when using SerpAPI search.");
            return;
        }

        // Save to localStorage (scoped to user)
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            localStorage.setItem(`googleApiKey_${user.id}`, googleApiKey);
            if (serpApiKey) {
                localStorage.setItem(`serpApiKey_${user.id}`, serpApiKey);
            } else {
                localStorage.removeItem(`serpApiKey_${user.id}`);
            }
        }

        setShowKeyModal(false);
        setError(null);

        // Resume pending action
        if (pendingAction === 'search') {
            executeSearch();
        } else if (pendingAction === 'analyze' && pendingJobId) {
            executeAnalyzeJob(pendingJobId);
        }
        setPendingAction(null);
        setPendingJobId(null);
    };

    const handleSearch = () => {
        if (!selectedResume) {
            setError("Please select a resume.");
            return;
        }

        // Check if keys are needed
        if (!googleApiKey || (useSerpApi && !serpApiKey)) {
            setPendingAction('search');
            setShowKeyModal(true);
            return;
        }

        executeSearch();
    };

    const executeSearch = async () => {
        setLoading(true);
        setError(null);
        setJobResults([]);
        setAnalysisResult(null);

        try {
            const payload = {
                resume_id: selectedResume,
                search_query: searchQuery,
                use_serpapi: useSerpApi,
                google_api_key: googleApiKey,
                serpapi_api_key: serpApiKey
            };

            // This initial call finds jobs (Auto-Match or Query)
            const data = await runCareerPilot(payload);

            // Save resume data for future calls
            if (data.resume_text) {
                setResumeData({
                    resume_text: data.resume_text,
                    extracted_skills: data.extracted_skills,
                    skill_categories: data.skill_categories
                });
            }

            if (data.recommended_jobs && data.recommended_jobs.length > 0) {
                setJobResults(data.recommended_jobs);
            } else {
                setError("No jobs found. Try a different query or resume.");
            }

            if (data.serpapi_warning) {
                console.warn(data.serpapi_warning);
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeJob = (jobId) => {
        // Check if keys are needed (should be present from search, but good to check)
        if (!googleApiKey) {
            setPendingAction('analyze');
            setPendingJobId(jobId);
            setShowKeyModal(true);
            return;
        }
        executeAnalyzeJob(jobId);
    };

    const executeAnalyzeJob = async (jobId) => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                resume_id: selectedResume,
                job_id: jobId, // Specific job to analyze
                google_api_key: googleApiKey,
                serpapi_api_key: serpApiKey,
                // Pass cached data to skip re-processing
                ...(resumeData || {})
                // We don't need search query here as we have a job_id
            };

            const data = await runCareerPilot(payload);
            setAnalysisResult(data);
            setActiveTab('analysis'); // Reset to main tab

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">CareerPilot AI</h1>
                <p className="text-muted-foreground">
                    Run the full AI pipeline: Search Jobs &rarr; Match Skills &rarr; Tailor Resume.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Configuration Panel */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Setup your analysis parameters.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Resume</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedResume}
                                onChange={(e) => setSelectedResume(e.target.value)}
                            >
                                {resumes.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.id.slice(0, 8)}... ({new Date(r.created_at).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Job Search Query (Optional)</Label>
                            <Input
                                placeholder="Leave empty to Auto-Match based on resume"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                If empty, we'll extract skills from your resume to find matching jobs.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="serpapi"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={useSerpApi}
                                onChange={(e) => setUseSerpApi(e.target.checked)}
                            />
                            <Label htmlFor="serpapi">Use SerpAPI (External Search)</Label>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowKeyModal(true)}
                        >
                            <Key className="mr-2 h-4 w-4" /> Configure API Keys
                        </Button>

                        <Button onClick={handleSearch} disabled={loading} className="w-full">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                            ) : (
                                <><Search className="mr-2 h-4 w-4" /> Find Jobs</>
                            )}
                        </Button>

                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Analysis Result (If available) */}
                    {analysisResult ? (
                        <Card className="border-primary/50">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Analysis Report</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setAnalysisResult(null)}>
                                        Back to Jobs
                                    </Button>
                                </div>
                                <div className="flex space-x-2 mt-4">
                                    <Button
                                        variant={activeTab === 'analysis' ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setActiveTab('analysis')}
                                    >
                                        <BrainCircuit className="mr-2 h-4 w-4" /> Fit Analysis
                                    </Button>
                                    <Button
                                        variant={activeTab === 'resume' ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setActiveTab('resume')}
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> Improved Resume
                                    </Button>
                                    <Button
                                        variant={activeTab === 'cover_letter' ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setActiveTab('cover_letter')}
                                    >
                                        <Briefcase className="mr-2 h-4 w-4" /> Cover Letter
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                {activeTab === 'analysis' && (
                                    <div className="space-y-6 animate-in fade-in-50">
                                        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Overall Fit Score</p>
                                                <p className="text-3xl font-bold text-primary">
                                                    {((analysisResult.overall_fit_score || 0) * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Skill Match</p>
                                                <p className="text-xl font-bold">
                                                    {((analysisResult.skill_match_score || 0) * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-semibold">Fit Explanation</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {analysisResult.fit_explanation || "No explanation available."}
                                            </p>
                                        </div>

                                        {analysisResult.missing_skills?.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="font-semibold text-destructive">Missing Skills</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysisResult.missing_skills.map((skill, i) => (
                                                        <span key={i} className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'resume' && (
                                    <div className="space-y-4 animate-in fade-in-50">
                                        <div className="rounded-md bg-muted p-4 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono text-sm">
                                            {analysisResult.improved_resume || "No improved resume generated."}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'cover_letter' && (
                                    <div className="space-y-4 animate-in fade-in-50">
                                        <div className="rounded-md bg-muted p-4 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono text-sm">
                                            {analysisResult.cover_letter || "No cover letter generated."}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* 2. Job Search Results */
                        jobResults.length > 0 ? (
                            <div className="space-y-8 animate-in fade-in-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Found {jobResults.length} Jobs</h3>
                                </div>

                                {/* Online Jobs Section */}
                                {jobResults.filter(j => j.source === 'Google Jobs').length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-md font-semibold text-primary flex items-center">
                                            <Search className="mr-2 h-4 w-4" /> Online Jobs (Google)
                                        </h4>
                                        <div className="grid gap-4">
                                            {jobResults.filter(j => j.source === 'Google Jobs').map((job) => (
                                                <Card key={job.id} className="hover:bg-muted/50 transition-colors border-l-4 border-l-blue-500">
                                                    <CardContent className="p-4 flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="font-semibold text-lg">{job.title}</h4>
                                                            <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2 max-w-md">
                                                                {job.description}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {job.url && (
                                                                <Button size="sm" variant="outline" onClick={() => window.open(job.url, '_blank')}>
                                                                    Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button size="sm" onClick={() => handleAnalyzeJob(job.id)}>
                                                                Analyze Match
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* DB Jobs Section */}
                                {jobResults.filter(j => j.source !== 'Google Jobs').length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-md font-semibold text-primary flex items-center">
                                            <BrainCircuit className="mr-2 h-4 w-4" /> Internal Database Jobs
                                        </h4>
                                        <div className="grid gap-4">
                                            {jobResults.filter(j => j.source !== 'Google Jobs').map((job) => (
                                                <Card key={job.id} className="hover:bg-muted/50 transition-colors border-l-4 border-l-green-500">
                                                    <CardContent className="p-4 flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="font-semibold text-lg">{job.title}</h4>
                                                            <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2 max-w-md">
                                                                {job.description}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {job.url && (
                                                                <Button size="sm" variant="outline" onClick={() => window.open(job.url, '_blank')}>
                                                                    Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button size="sm" onClick={() => handleAnalyzeJob(job.id)}>
                                                                Analyze Match
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* 3. Empty State */
                            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Ready to Launch</h3>
                                <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                                    Select a resume and click "Find Jobs" to start. We'll find the best matches and let you analyze them one by one.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* API Key Modal */}
            <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Enter API Keys</DialogTitle>
                        <DialogDescription>
                            Your keys are stored securely for your account only.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="google-key" className="text-right">
                                Gemini Key
                            </Label>
                            <Input
                                id="google-key"
                                value={googleApiKey}
                                onChange={(e) => setGoogleApiKey(e.target.value)}
                                className="col-span-3"
                                type="password"
                                placeholder="AIzaSy..."
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serp-key" className="text-right">
                                SerpAPI Key
                            </Label>
                            <Input
                                id="serp-key"
                                value={serpApiKey}
                                onChange={(e) => setSerpApiKey(e.target.value)}
                                className="col-span-3"
                                type="password"
                                placeholder="Optional..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleKeySubmit}>Save & Continue</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CareerPilot;
