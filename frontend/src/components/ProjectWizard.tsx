"use client";

import { useState } from "react";
import { Plus, Trash2, Upload, Send, Building2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Competitor {
    id: string;
    name: string;
    files: File[];
}

export function ProjectWizard() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [industry, setIndustry] = useState("");
    const [baseOrgName, setBaseOrgName] = useState("");
    const [baseFiles, setBaseFiles] = useState<File[]>([]);
    const [competitors, setCompetitors] = useState<Competitor[]>([]);

    const addCompetitor = () => {
        setCompetitors([
            ...competitors,
            { id: Math.random().toString(36).substr(2, 9), name: "", files: [] },
        ]);
    };

    const removeCompetitor = (id: string) => {
        setCompetitors(competitors.filter((c) => c.id !== id));
    };

    const updateCompetitor = (id: string, name: string) => {
        setCompetitors(
            competitors.map((c) => (c.id === id ? { ...c, name } : c))
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isBase: boolean, compId?: string) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        if (isBase) {
            setBaseFiles([...baseFiles, ...newFiles]);
        } else if (compId) {
            setCompetitors(
                competitors.map((c) =>
                    c.id === compId ? { ...c, files: [...c.files, ...newFiles] } : c
                )
            );
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await api.post("/projects", {
                name: projectName,
                industry,
                base_org: { name: baseOrgName, is_base: true },
                competitors: competitors.map((c) => ({ name: c.name, is_base: false })),
            });

            const project = response.data;
            const baseOrg = project.organizations.find((o: any) => o.is_base);
            const compOrgs = project.organizations.filter((o: any) => !o.is_base);

            // Upload base files
            for (const file of baseFiles) {
                const formData = new FormData();
                formData.append("file", file);
                await api.post(`/uploads/${project.id}/${baseOrg.id}`, formData);
            }

            // Upload competitor files
            for (let i = 0; i < competitors.length; i++) {
                const comp = competitors[i];
                const org = compOrgs.find((o: any) => o.name === comp.name);
                if (org) {
                    for (const file of comp.files) {
                        const formData = new FormData();
                        formData.append("file", file);
                        await api.post(`/uploads/${project.id}/${org.id}`, formData);
                    }
                }
            }

            // Start Analysis
            await api.post(`/projects/${project.id}/run-analysis`);

            router.push(`/projects/${project.id}`);
        } catch (error) {
            console.error("Failed to create project:", error);
            alert("Error creating project. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold">Create Analysis Project</h2>
                <p className="text-muted-foreground">Define your organization and set up competitors for deep analysis.</p>
            </div>

            <section className="glass p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5" />
                    <h3 className="font-semibold uppercase tracking-wider text-sm">Basic Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name</label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. Q4 Market Strategy"
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Industry</label>
                        <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g. Fintech"
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </section>

            <section className="glass p-6 rounded-2xl space-y-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Building2 className="w-5 h-5" />
                        <h3 className="font-semibold uppercase tracking-wider text-sm">Base Organization</h3>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Organization Name</label>
                        <input
                            type="text"
                            value={baseOrgName}
                            onChange={(e) => setBaseOrgName(e.target.value)}
                            placeholder="Your company name"
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Documents (PDF, DOCX, XLSX, Images)</label>
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-secondary/50 transition-colors relative cursor-pointer">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleFileChange(e, true)}
                            />
                            <Upload className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click or drag files to upload</p>
                            {baseFiles.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    {baseFiles.map((f, i) => (
                                        <span key={i} className="bg-secondary px-3 py-1 rounded-full text-xs border border-border">
                                            {f.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400">
                        <Target className="w-5 h-5" />
                        <h3 className="font-semibold uppercase tracking-wider text-sm">Competitors</h3>
                    </div>
                </div>

                {/* Batch Upload Area */}
                <div className="border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-2xl p-8 text-center hover:bg-purple-500/10 transition-colors relative cursor-pointer">
                    <input
                        type="file"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                            if (!e.target.files) return;
                            const newComps: Competitor[] = [];
                            Array.from(e.target.files).forEach((file) => {
                                const name = file.name.split('.')[0]; // Use filename as competitor name
                                newComps.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: name,
                                    files: [file]
                                });
                            });
                            setCompetitors(prev => [...prev, ...newComps]);
                        }}
                    />
                    <div className="flex flex-col items-center gap-2 text-purple-300">
                        <Upload className="w-10 h-10 mb-2" />
                        <h4 className="font-bold text-lg">Batch Upload Competitors</h4>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Drag & drop multiple images or docs here.
                            We'll automatically create a competitor for each file using its filename.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Manual Entry</h4>
                    <button
                        onClick={addCompetitor}
                        className="flex items-center gap-2 text-sm bg-secondary hover:bg-muted px-4 py-2 rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Competitor
                    </button>
                </div>

                <div className="grid gap-6">
                    {competitors.map((comp) => (
                        <div key={comp.id} className="glass p-6 rounded-2xl space-y-4 border-l-4 border-purple-500 relative animate-in fade-in slide-in-from-top-4 duration-300">
                            <button
                                onClick={() => removeCompetitor(comp.id)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Competitor Name</label>
                                    <input
                                        type="text"
                                        value={comp.name}
                                        onChange={(e) => updateCompetitor(comp.id, e.target.value)}
                                        placeholder="e.g. Competitor A"
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Upload Documents</label>
                                    <label className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-muted transition-colors">
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {comp.files.length > 0 ? `${comp.files.length} files selected` : "Select files"}
                                        </span>
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e, false, comp.id)}
                                        />
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {comp.files.map((f, i) => (
                                            <span key={i} className="text-[10px] bg-secondary/50 px-2 py-0.5 rounded border border-border">
                                                {f.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {competitors.length === 0 && (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                            No competitors added yet. Use Batch Upload or Add Manually.
                        </div>
                    )}
                </div>
            </section>

            <div className="fixed bottom-8 right-8">
                <button
                    onClick={handleSubmit}
                    disabled={loading || !projectName || !baseOrgName}
                    className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all premium-gradient active:scale-95 disabled:opacity-50 disabled:grayscale",
                        loading && "animate-pulse"
                    )}
                >
                    {loading ? "Processing..." : "Run Deep Analysis"}
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
