"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Recommendations } from "@/components/Recommendations";
import { ChatPanel } from "@/components/ChatPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs";
import {
    History,
    RotateCcw,
    Settings2,
    Download,
    CheckCircle2,
    Clock,
    ShieldAlert,
    BarChart3,
    Lightbulb,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectPage() {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refining, setRefining] = useState(false);

    const fetchAll = async () => {
        try {
            const resResults = await api.get(`/projects/${id}/results`);
            setResults(resResults.data);
        } catch (err: any) {
            // Check for 404 (Not Found) to handle empty state gracefully
            const status = err.response?.status;
            if (status === 404) {
                setResults(null);
            } else {
                console.error("Fetch Error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [id]);

    const handleRefine = async () => {
        setRefining(true);
        try {
            await api.post(`/projects/${id}/run-analysis`, {
                budget: "Low",
                compliance: "GDPR"
            });
            fetchAll();
        } catch (err) {
            alert("Refinement failed");
        } finally {
            setRefining(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Running deep analysis...</p>
        </div>
    );

    if (!results) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
            <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-bold">Analysis Data Missing</h3>
                <p className="text-muted-foreground">
                    It seems the analysis for this project hasn't been generated or was interrupted.
                    You can try running it again.
                </p>
            </div>
            <button
                onClick={handleRefine}
                disabled={refining}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl"
            >
                <Settings2 className="w-5 h-5" />
                {refining ? "Generatng Analysis..." : "Run Analysis Now"}
            </button>
        </div>
    );

    const data = results.results_json;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end border-b border-border pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <span>Projects</span>
                        <span>/</span>
                        <span className="text-foreground">Analysis #{id}</span>
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight">Strategy Report</h1>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Processing Complete
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 text-muted-foreground px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                            <Clock className="w-3 h-3" />
                            Version {results.version}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={fetchAll}
                        className="p-3 bg-secondary hover:bg-muted border border-border rounded-xl transition-all"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRefine}
                        disabled={refining}
                        className="flex items-center gap-2 bg-secondary hover:bg-muted border border-border px-5 py-3 rounded-xl font-bold transition-all"
                    >
                        <Settings2 className="w-5 h-5" />
                        {refining ? "Refining..." : "Refine Analysis"}
                    </button>
                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl">
                        <Download className="w-5 h-5" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass p-8 rounded-3xl space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                Overall Confidence
                            </h3>
                            <div className="flex items-end gap-3">
                                <span className="text-6xl font-black text-primary">{data.overall_confidence}%</span>
                                <p className="text-sm text-muted-foreground mb-2">High Reliability</p>
                            </div>
                            <p className="text-sm text-balance text-muted-foreground leading-relaxed">
                                {data.confidence_explanation}
                            </p>
                        </div>

                        <div className="glass p-8 rounded-3xl flex flex-col justify-center space-y-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={cn("h-2 flex-1 rounded-full", i <= 4 ? "bg-primary" : "bg-secondary")} />
                                ))}
                            </div>
                            <p className="text-sm font-bold mt-2">Intelligence Coverage: 85%</p>
                            <p className="text-xs text-muted-foreground">Based on 12 extracted evidence snippets across 4 documents.</p>
                        </div>
                    </div>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold">Competitive Comparison</h2>
                        </div>
                        <ComparisonTable data={data.comparison} />
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Lightbulb className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold">Actionable Recommendations</h2>
                        </div>
                        <Recommendations data={data.recommendations} />
                    </section>
                </div>

                <aside className="lg:col-span-1 space-y-6">
                    <div className="sticky top-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold">Deep Chat</h2>
                        </div>
                        <ChatPanel projectId={id as string} />

                        <div className="glass p-6 rounded-3xl space-y-4">
                            <h4 className="font-bold flex items-center gap-2">
                                <History className="w-4 h-4 text-muted-foreground" />
                                Refinement History
                            </h4>
                            <div className="space-y-3">
                                {[1].map(v => (
                                    <div key={v} className="flex justify-between items-center text-sm p-3 rounded-xl bg-secondary/50 border border-border">
                                        <span className="font-medium text-muted-foreground">Version {v}</span>
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">Current</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
