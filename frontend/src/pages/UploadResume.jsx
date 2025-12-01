import { useState, useEffect } from 'react';
import { uploadResume, getAllResumes, deleteResume } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Trash2, FileText, Upload, Loader2 } from 'lucide-react';

const UploadResume = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [error, setError] = useState(null);

    // Fetch all resumes on mount
    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            const data = await getAllResumes();
            setResumes(data);
        } catch (err) {
            console.error("Failed to fetch resumes", err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        setLoading(true);
        try {
            // Get API key from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            let apiKey = '';
            if (user && user.id) {
                apiKey = localStorage.getItem(`googleApiKey_${user.id}`) || '';
            }

            if (!apiKey) {
                setError("Google API Key is required. Please configure it in the header.");
                setLoading(false);
                return;
            }

            const data = await uploadResume(file, apiKey);
            setResult(data);
            fetchResumes(); // Refresh list
        } catch (err) {
            setError("Failed to upload resume. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resume?")) return;
        try {
            await deleteResume(id);
            fetchResumes();
            if (result && result.id === id) {
                setResult(null); // Clear current view if deleted
            }
        } catch (err) {
            console.error("Failed to delete resume", err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
                <p className="text-muted-foreground">
                    Upload your PDF resume to extract skills and manage your profile.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Upload Section */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload New Resume</CardTitle>
                            <CardDescription>Select a PDF file to upload.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="resume">Resume (PDF)</Label>
                                <Input id="resume" type="file" accept=".pdf" onChange={handleFileChange} />
                            </div>
                            <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                                ) : (
                                    <><Upload className="mr-2 h-4 w-4" /> Upload Resume</>
                                )}
                            </Button>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </CardContent>
                    </Card>

                    {/* Result Section */}
                    {result && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Extraction Result</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-md bg-muted p-4">
                                    <h4 className="mb-2 font-semibold">Extracted Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.extracted_skills?.map((skill, i) => (
                                            <span key={i} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {result.ats_score !== undefined && result.ats_score !== null && (
                                    <div className="rounded-md bg-purple-500/10 p-4 border border-purple-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-purple-300">ATS Score</h4>
                                            <span className="text-2xl font-bold text-purple-400">{result.ats_score}/100</span>
                                        </div>
                                        {result.ats_report && (
                                            <div className="text-sm text-purple-200 whitespace-pre-wrap">
                                                {result.ats_report}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Raw Text</Label>
                                    <Textarea value={result.raw_text} readOnly className="h-40" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* List Section */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Resumes</CardTitle>
                            <CardDescription>Manage your uploaded resumes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {resumes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No resumes found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {resumes.map((resume) => (
                                        <div key={resume.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="rounded-full bg-secondary p-2">
                                                    <FileText className="h-4 w-4 text-secondary-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Resume ID: {resume.id.slice(0, 8)}...</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(resume.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(resume.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UploadResume;
