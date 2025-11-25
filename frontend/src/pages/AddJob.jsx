import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addJob } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const AddJob = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        employment_type: 'Full-time',
        experience_level: 'Entry-level',
        skills: '',
        description: '',
        salary_range: '',
        url: '',
        posted_date: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert skills string to list if needed, but backend takes string in some models or list in others.
            // Looking at backend schemas, JobCreateModel takes skills as List[str].
            // But wait, the previous frontend code sent a comma separated string.
            // Let's check backend/routers/job_router.py again.
            // It uses JobCreateModel.
            // Let's check backend/models/schemas.py.
            // JobCreateModel: skills: Optional[List[str]] = None

            // So we should split the string.
            const payload = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
            };

            await addJob(payload);
            navigate('/jobs');
        } catch (err) {
            console.error("Failed to add job", err);
            alert("Failed to add job. Please check inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Post a Job</h1>
                <p className="text-muted-foreground">
                    Create a new job listing for candidates to find.
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                        <CardDescription>Fill in the information below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input id="title" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Backend Engineer" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company *</Label>
                                <Input id="company" name="company" required value={formData.company} onChange={handleChange} placeholder="e.g. Acme Inc" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Remote / NY" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salary_range">Salary Range</Label>
                                <Input id="salary_range" name="salary_range" value={formData.salary_range} onChange={handleChange} placeholder="e.g. $100k - $120k" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Required Skills (comma separated)</Label>
                            <Input id="skills" name="skills" value={formData.skills} onChange={handleChange} placeholder="Python, React, SQL..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">Job URL</Label>
                            <Input id="url" name="url" value={formData.url} onChange={handleChange} placeholder="https://..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" name="description" required value={formData.description} onChange={handleChange} className="h-32" placeholder="Job responsibilities and requirements..." />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create Job Listing"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AddJob;
