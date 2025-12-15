import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { analyzeManualJD } from '../services/api';

const AnalyzeJD = () => {
    const [jdText, setJdText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!jdText.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Using the new endpoint we created
            const response = await analyzeManualJD({
                manual_jd_text: jdText
            });
            setResult(response);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Failed to analyze the job description. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white glow-text">Manual JD Analysis</h1>
                <p className="text-muted-foreground">
                    Paste a job description below to get an instant compatibility check and a tailored resume.
                </p>
            </div>

            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Job Description
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[200px] bg-black/20 border-white/10 focus:border-primary/50 font-mono text-sm"
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || !jdText.trim()}
                            className="bg-primary hover:bg-primary/90 min-w-[150px] shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Analyze & Improve"
                            )}
                        </Button>
                    </div>
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Scores Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Fit Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-primary mb-2">
                                    {result.fit_score?.score || 0}%
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Match Probability
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Missing Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {result.missing_skills && result.missing_skills.length > 0 ? (
                                        result.missing_skills.map((skill, idx) => (
                                            <Badge key={idx} variant="destructive" className="bg-red-900/30 text-red-200 border-red-900/50 hover:bg-red-900/50">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                {skill}
                                            </Badge>
                                        ))
                                    ) : (
                                        <div className="text-green-400 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            No critical skills missing!
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Improved Resume */}
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-400" />
                                Tailored Resume
                            </CardTitle>
                            <CardDescription>
                                Optimized for this specific JD. Content has been rephrased for better ATS scoring.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white/5 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar border border-white/5">
                                {result.improved_resume}
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => navigator.clipboard.writeText(result.improved_resume)}>
                                    Copy to Clipboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Analysis Details */}
                    {result.fit_score?.explanation && (
                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Fit Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {result.fit_score.explanation}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyzeJD;
