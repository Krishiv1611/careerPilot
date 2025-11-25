import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Briefcase, PlusCircle, BrainCircuit } from 'lucide-react';

const Home = () => {
    return (
        <div className="space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome to CareerPilot. Manage your job search with AI.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upload Resume</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Start Here</div>
                        <p className="text-xs text-muted-foreground">
                            Upload your resume to get started.
                        </p>
                        <Link to="/upload">
                            <Button className="mt-4 w-full" size="sm">Go to Upload</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Search Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Find Jobs</div>
                        <p className="text-xs text-muted-foreground">
                            Search and filter job listings.
                        </p>
                        <Link to="/jobs">
                            <Button className="mt-4 w-full" variant="outline" size="sm">Search Now</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Add Job</CardTitle>
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Post Job</div>
                        <p className="text-xs text-muted-foreground">
                            Add a new job to the database.
                        </p>
                        <Link to="/add-job">
                            <Button className="mt-4 w-full" variant="outline" size="sm">Add Job</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CareerPilot</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AI Analysis</div>
                        <p className="text-xs text-muted-foreground">
                            Run full AI pipeline.
                        </p>
                        <Link to="/careerpilot">
                            <Button className="mt-4 w-full" variant="secondary" size="sm">Run AI</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Home;
