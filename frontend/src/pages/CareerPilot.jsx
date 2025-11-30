import { useState, useEffect } from 'react';
import { getAllResumes, runCareerPilot, createRoadmap, getRoadmap, downloadResumePDF } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BrainCircuit, Search, Loader2, FileText, CheckCircle, AlertCircle, Briefcase, ExternalLink, Map, Download } from 'lucide-react';


const CareerPilot = () => {
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [useSerpApi, setUseSerpApi] = useState(false);
    const [useTavily, setUseTavily] = useState(false);
    const [loading, setLoading] = useState(false);


    const [pendingAction, setPendingAction] = useState(null); // 'search' or 'analyze'
    const [pendingJobId, setPendingJobId] = useState(null); // for analyze action
    const [roadmapLoading, setRoadmapLoading] = useState(null); // jobId being processed

    // Two stages of results:
    // 1. Job Search Results (List of jobs)
    // 2. Analysis Result (Specific job analysis)
    const [jobResults, setJobResults] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'resume', 'cover_letter', 'roadmap'
    const [roadmapData, setRoadmapData] = useState(null);

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
    }, []);



    const handleSearch = () => {
        if (!selectedResume) {
            setError("Please select a resume.");
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
            // Get keys from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            const googleApiKey = user ? localStorage.getItem(`googleApiKey_${user.id}`) : '';
            const serpApiKey = user ? localStorage.getItem(`serpApiKey_${user.id}`) : '';
            const tavilyApiKey = user ? localStorage.getItem(`tavilyApiKey_${user.id}`) : '';

            if (!googleApiKey) {
                setError("Google API Key is missing. Please configure it in the header settings.");
                return;
            }

            const payload = {
                resume_id: selectedResume,
                search_query: searchQuery,
                use_serpapi: useSerpApi,
                use_tavily: useTavily,
                google_api_key: googleApiKey,
                serpapi_api_key: serpApiKey,
                tavily_api_key: tavilyApiKey
            };

            // This initial call finds jobs (Auto-Match or Query)
            const data = await runCareerPilot(payload);

            // Save resume data for future calls
            if (data.resume_text) {
                setResumeData({
                    resume_text: data.resume_text,
                    extracted_skills: data.extracted_skills,
                    skill_categories: data.skill_categories,
                    ats_score: data.ats_score,
                    ats_report: data.ats_report
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
            if (data.tavily_warning) {
                console.warn(data.tavily_warning);
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeJob = (jobId) => {
        executeAnalyzeJob(jobId);
    };

    const executeAnalyzeJob = async (jobId) => {
        setLoading(true);
        setPendingJobId(jobId);
        setError(null);

        try {
            // Get keys from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            const googleApiKey = user ? localStorage.getItem(`googleApiKey_${user.id}`) : '';
            const serpApiKey = user ? localStorage.getItem(`serpApiKey_${user.id}`) : '';
            const tavilyApiKey = user ? localStorage.getItem(`tavilyApiKey_${user.id}`) : '';

            if (!googleApiKey) {
                setError("Google API Key is missing. Please configure it in the header settings.");
                return;
            }

            const payload = {
                resume_id: selectedResume,
                job_id: jobId, // Specific job to analyze
                google_api_key: googleApiKey,
                serpapi_api_key: serpApiKey,
                tavily_api_key: tavilyApiKey,
                // Pass cached data to skip re-processing
                ...(resumeData || {})
                // We don't need search query here as we have a job_id
            };

            const data = await runCareerPilot(payload);
            setAnalysisResult(data);
            setActiveTab('analysis'); // Reset to main tab

            // Check if roadmap exists
            const existingRoadmap = await getRoadmap(jobId);
            if (existingRoadmap) {
                setRoadmapData(existingRoadmap.content);
            } else {
                setRoadmapData(null);
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Analysis failed. Please try again.");
        } finally {
            setLoading(false);
            setPendingJobId(null);
        }
    };

    const handleCreateRoadmap = async (jobId) => {
        setRoadmapLoading(jobId);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const googleApiKey = user ? localStorage.getItem(`googleApiKey_${user.id}`) : '';

            if (!googleApiKey) {
                alert("Google API Key is missing.");
                return;
            }

            const data = await createRoadmap(jobId, selectedResume, googleApiKey);
            setRoadmapData(data.content);

            // If we are in analysis view, switch to roadmap tab
            if (analysisResult && analysisResult.job_id === jobId) {
                setActiveTab('roadmap');
            } else {
                alert("Roadmap created! Click 'Analyze Match' to view it.");
            }

        } catch (err) {
            console.error(err);
            alert("Failed to create roadmap.");
        } finally {
            setRoadmapLoading(null);
        }
    };

    const handleDownloadPDF = async () => {
        if (!analysisResult?.improved_resume) return;
        try {
            const blob = await downloadResumePDF(analysisResult.improved_resume);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "improved_resume.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Failed to download PDF");
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

                        <div className="space-y-2">
                            <Label>Search Options</Label>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="serpapi"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={useSerpApi}
                                        onChange={(e) => setUseSerpApi(e.target.checked)}
                                    />
                                    <Label htmlFor="serpapi">Use SerpAPI (Google Jobs)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="tavily"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={useTavily}
                                        onChange={(e) => setUseTavily(e.target.checked)}
                                    />
                                    <Label htmlFor="tavily">Use Tavily (Web Search)</Label>
                                </div>
                            </div>
                        </div>

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
                                <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
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
                                    <Button
                                        variant={activeTab === 'roadmap' ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setActiveTab('roadmap')}
                                    >
                                        <Map className="mr-2 h-4 w-4" /> Roadmap
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
                                        <div className="flex justify-end">
                                            <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
                                                <Download className="mr-2 h-4 w-4" /> Download PDF
                                            </Button>
                                        </div>
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

                                {activeTab === 'roadmap' && (
                                    <div className="space-y-4 animate-in fade-in-50">
                                        {roadmapData ? (
                                            <div className="space-y-6">
                                                {roadmapData.map((step, index) => (
                                                    <div key={index} className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                                                {step.step_number}
                                                            </div>
                                                            {index < roadmapData.length - 1 && (
                                                                <div className="w-0.5 flex-1 bg-border my-2"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-6">
                                                            <h4 className="font-semibold text-lg">{step.title}</h4>
                                                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                <span className="text-xs font-medium bg-secondary px-2 py-1 rounded">
                                                                    ⏱️ {step.estimated_time}
                                                                </span>
                                                            </div>
                                                            {step.resources && step.resources.length > 0 && (
                                                                <div className="mt-3">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Resources:</p>
                                                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                                        {step.resources.map((res, i) => (
                                                                            <li key={i}>{res}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-muted-foreground mb-4">No roadmap generated yet.</p>
                                                <Button onClick={() => handleCreateRoadmap(analysisResult.job_id)} disabled={roadmapLoading === analysisResult.job_id}>
                                                    {roadmapLoading === analysisResult.job_id ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Plan...</>
                                                    ) : (
                                                        "Generate Career Roadmap"
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* 2. Job Search Results */
                        <div className="space-y-8 animate-in fade-in-50">
                            {/* Resume ATS Score Section */}


                            {jobResults.length > 0 ? (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Found {jobResults.length} Jobs</h3>
                                    </div>

                                    {/* Job Cards Helper */}
                                    {['Google Jobs', 'Tavily', 'Internal'].map(source => {
                                        const jobs = jobResults.filter(j =>
                                            source === 'Internal'
                                                ? (j.source !== 'Google Jobs' && j.source !== 'Tavily')
                                                : j.source === source
                                        );

                                        if (jobs.length === 0) return null;

                                        return (
                                            <div key={source} className="space-y-4">
                                                <h4 className="text-md font-semibold text-primary flex items-center">
                                                    {source === 'Google Jobs' && <Search className="mr-2 h-4 w-4" />}
                                                    {source === 'Tavily' && <Search className="mr-2 h-4 w-4" />}
                                                    {source === 'Internal' && <BrainCircuit className="mr-2 h-4 w-4" />}
                                                    {source === 'Google Jobs' ? 'Online Jobs (Google)' : source === 'Tavily' ? 'Web Search Results (Tavily)' : 'Internal Database Jobs'}
                                                </h4>
                                                <div className="grid gap-4">
                                                    {jobs.map((job) => (
                                                        <Card key={job.id} className={`hover:bg-muted/50 transition-colors border-l-4 ${source === 'Google Jobs' ? 'border-l-blue-500' : source === 'Tavily' ? 'border-l-purple-500' : 'border-l-green-500'}`}>
                                                            <CardContent className="p-4 flex items-start justify-between">
                                                                <div className="space-y-1">
                                                                    <h4 className="font-semibold text-lg">{job.title}</h4>
                                                                    <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 max-w-md">
                                                                        {job.description}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-2 flex-col sm:flex-row">
                                                                    {job.url && (
                                                                        <Button size="sm" variant="outline" onClick={() => window.open(job.url, '_blank')}>
                                                                            Apply <ExternalLink className="ml-2 h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                    <Button size="sm" onClick={() => handleAnalyzeJob(job.id)} disabled={loading}>
                                                                        {loading && pendingJobId === job.id ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            "Analyze"
                                                                        )}
                                                                    </Button>
                                                                    <Button size="sm" variant="secondary" onClick={() => handleCreateRoadmap(job.id)} disabled={roadmapLoading === job.id}>
                                                                        {roadmapLoading === job.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Map className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Empty State (but with ATS score if available) */
                                resumeData?.ats_score ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center">
                                        <p className="text-muted-foreground">No jobs found matching your criteria, but your resume has been analyzed above.</p>
                                    </div>
                                ) : (
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
                    )}
                </div>
            </div>


        </div>
    );
};

export default CareerPilot;
