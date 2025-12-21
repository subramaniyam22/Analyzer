"use client";

import { CheckCircle2, Link as LinkIcon, AlertCircle, Wrench, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationsProps {
    data: any[];
}

export function Recommendations({ data }: RecommendationsProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="grid gap-8">
            {data.map((rec, i) => (
                <div key={rec.id || i} className="glass p-8 rounded-3xl border-l-[6px] border-blue-500 shadow-xl space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold">{rec.title}</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <span className={cn(
                                    "px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]",
                                    rec.impact === "High" ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                                )}>
                                    {rec.impact} Impact
                                </span>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{rec.confidence}% Confidence</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-2xl">
                            <CheckCircle2 className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed">{rec.description}</p>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                                Implementation Steps
                            </h4>
                            <ul className="space-y-3">
                                {rec.steps?.map((step: string, j: number) => (
                                    <li key={j} className="flex gap-3 text-sm text-balance">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                                            {j + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-purple-400" />
                                Recommended Tools
                            </h4>
                            <div className="grid gap-3">
                                {rec.tools?.map((tool: any, j: number) => (
                                    <div key={j} className="bg-secondary/50 p-4 rounded-xl border border-border space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm underline underline-offset-4">{tool.name}</span>
                                            {tool.link && (
                                                <a href={tool.link} target="_blank" className="text-muted-foreground hover:text-white transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{tool.how_to}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <LinkIcon className="w-3 h-3" />
                            Citations & Evidence
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {rec.evidence?.map((ev: string, j: number) => (
                                <div key={j} className="bg-white/5 px-4 py-2 rounded-lg text-xs border border-white/10 hover:bg-white/10 transition-colors cursor-help">
                                    {ev}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
