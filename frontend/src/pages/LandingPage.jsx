import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Search, BrainCircuit, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />

                <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                        AI-Powered Career Acceleration
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        Navigate Your Career with <br />
                        <span className="text-gradient">Intelligent Precision</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        Unlock your potential with CareerPilot. Analyze your resume, find tailored job matches, and map your path to success using advanced AI agents.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <Link to="/login">
                            <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full glass-button hover:bg-white/5">
                                Log In
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 bg-black/20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold">Everything you need to succeed</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Our comprehensive suite of tools ensures you're always one step ahead in your job search.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<FileText className="h-10 w-10 text-blue-400" />}
                            title="Resume Analysis"
                            description="Get detailed feedback on your resume. Our AI identifies gaps and suggests improvements to beat ATS systems."
                            delay="0.1s"
                        />
                        <FeatureCard
                            icon={<Search className="h-10 w-10 text-purple-400" />}
                            title="Smart Job Search"
                            description="Stop scrolling endlessly. We aggregate jobs from multiple sources and filter them based on your unique profile."
                            delay="0.2s"
                        />
                        <FeatureCard
                            icon={<BrainCircuit className="h-10 w-10 text-pink-400" />}
                            title="Skill Mapping"
                            description="Visualize your career path. Identify missing skills and get a personalized roadmap to bridge the gap."
                            delay="0.3s"
                        />
                    </div>
                </div>
            </section>

            {/* Stats/Social Proof Section (Optional but good for 'lovable') */}
            <section className="py-20 px-6 border-y border-white/5 bg-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <Stat number="98%" label="Match Accuracy" />
                    <Stat number="24/7" label="AI Availability" />
                    <Stat number="500+" label="Skills Tracked" />
                    <Stat number="10k+" label="Jobs Analyzed" />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10 mt-auto bg-black/40">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/favicon.svg" alt="CareerPilot Logo" className="h-8 w-8" />
                        <span className="font-bold text-xl tracking-tight">CareerPilot</span>
                    </div>

                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        © 2025 CareerPilot. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, delay }) => (
    <div className="glass-panel p-8 rounded-2xl hover:scale-[1.02] transition-transform duration-300 animate-slide-up" style={{ animationDelay: delay }}>
        <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-white/10">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
            {description}
        </p>
    </div>
);

const Stat = ({ number, label }) => (
    <div className="space-y-2">
        <div className="text-4xl font-bold text-gradient">{number}</div>
        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
    </div>
);

export default LandingPage;
