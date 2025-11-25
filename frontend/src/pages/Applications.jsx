import { useState, useEffect } from 'react';
import { getAllApplications, deleteApplication, getAllJobs } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Trash2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

const Applications = () => {
    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [appsData, jobsData] = await Promise.all([
                getAllApplications(),
                getAllJobs()
            ]);

            // Create a map of job_id -> job details for easy lookup
            const jobsMap = {};
            jobsData.forEach(job => {
                jobsMap[job.id] = job;
            });

            setApplications(appsData);
            setJobs(jobsMap);
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this application?")) return;
        try {
            await deleteApplication(id);
            fetchData();
        } catch (err) {
            console.error("Failed to delete application", err);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 0.8) return "text-green-500";
        if (score >= 0.6) return "text-blue-500";
        if (score >= 0.4) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Application History</h1>
                <p className="text-muted-foreground">
                    Track your applications and AI fit scores.
                </p>
            </div>

            <div className="grid gap-4">
                {applications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        No applications found. Run CareerPilot analysis to create one.
                    </div>
                ) : (
                    applications.map((app) => {
                        const job = jobs[app.job_id] || { title: 'Unknown Job', company: 'Unknown Company' };
                        const score = app.overall_fit_score || 0;

                        return (
                            <Card key={app.id}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-xl">{job.title}</CardTitle>
                                        <CardDescription className="text-base">{job.company}</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn("text-2xl font-bold", getScoreColor(score))}>
                                            {(score * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Fit Score</div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Skill Match</p>
                                            <p className="text-2xl font-bold">
                                                {((app.skill_match_score || 0) * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Missing Skills</p>
                                            <p className="text-2xl font-bold text-destructive">
                                                {app.missing_skills?.length || 0}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Created</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {app.fit_explanation && (
                                        <div className="mt-4 rounded-md bg-muted p-4 text-sm">
                                            <p className="font-semibold mb-1">AI Analysis:</p>
                                            {app.fit_explanation}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between border-t pt-4">
                                    {job.url && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" /> View Job
                                            </a>
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(app.id)} className="ml-auto text-destructive hover:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Applications;
