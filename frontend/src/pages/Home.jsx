import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Briefcase, PlusCircle, BrainCircuit, ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col space-y-2 mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
                <p className="text-muted-foreground text-lg">
                    Welcome back. Manage your career journey with AI precision.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                    title="Upload Resume"
                    icon={FileText}
                    description="Upload your resume to get started with AI analysis."
                    action="Upload"
                    link="/upload"
                    delay="0.1s"
                    color="text-blue-400"
                />
                <DashboardCard
                    title="Search Jobs"
                    icon={Briefcase}
                    description="Find the perfect job matches tailored to your skills."
                    action="Search"
                    link="/jobs"
                    delay="0.2s"
                    color="text-purple-400"
                />
                <DashboardCard
                    title="Add Job"
                    icon={PlusCircle}
                    description="Manually track a job application you've found."
                    action="Add Job"
                    link="/add-job"
                    delay="0.3s"
                    color="text-pink-400"
                />
                <DashboardCard
                    title="AI Analysis"
                    icon={BrainCircuit}
                    description="Run the full career pilot analysis pipeline."
                    action="Run AI"
                    link="/careerpilot"
                    delay="0.4s"
                    color="text-emerald-400"
                    variant="default"
                />
            </div>

            {/* Quick Stats or Recent Activity could go here */}
            <div className="mt-12 grid gap-6 md:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <span>Resume Uploaded</span>
                            </div>
                            <span className="text-muted-foreground">2h ago</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <Briefcase className="h-4 w-4" />
                                </div>
                                <span>Applied to Senior Dev</span>
                            </div>
                            <span className="text-muted-foreground">1d ago</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-primary/20 to-purple-900/20 border-primary/20">
                    <h3 className="text-xl font-bold mb-2">Pro Tip</h3>
                    <p className="text-muted-foreground mb-4">
                        Your resume score has improved by 15% since last week. Keep optimizing your keywords!
                    </p>
                    <Button variant="outline" className="w-full glass-button">View Insights</Button>
                </Card>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, icon: Icon, description, action, link, delay, color, variant = "outline" }) => (
    <Card className="group hover:scale-[1.02] transition-all duration-300 animate-slide-up" style={{ animationDelay: delay }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                {description}
            </p>
            <Link to={link}>
                <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors" variant={variant} size="sm">
                    {action} <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </Link>
        </CardContent>
    </Card>
);

export default Home;
