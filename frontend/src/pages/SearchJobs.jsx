import { useState, useEffect } from 'react';
import { getAllJobs, deleteJob, runCareerPilot } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Trash2, Search, Briefcase } from 'lucide-react';

const SearchJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const data = await getAllJobs();
            setJobs(data);
        } catch (err) {
            console.error("Failed to fetch jobs", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;
        try {
            await deleteJob(id);
            fetchJobs();
        } catch (err) {
            console.error("Failed to delete job", err);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Search Jobs</h1>
                <p className="text-muted-foreground">
                    Browse available job listings or search for specific roles.
                </p>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or company..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No jobs found.
                    </div>
                ) : (
                    filteredJobs.map((job) => (
                        <Card key={job.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{job.title}</CardTitle>
                                <CardDescription>{job.company}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-sm text-muted-foreground mb-2">
                                    <span className="font-medium text-foreground">Location:</span> {job.location || 'Remote'}
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-3">
                                    {job.description}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={job.url || '#'} target="_blank" rel="noopener noreferrer">
                                        View Details
                                    </a>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default SearchJobs;
