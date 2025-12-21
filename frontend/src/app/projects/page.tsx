"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, ExternalLink, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function AllProjectsPage() {
    const { loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchProjects = async () => {
        if (authLoading) return;
        try {
            const response = await api.get("/projects");
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [authLoading]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.industry?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
                    <p className="text-muted-foreground mt-2">Manage and view all your market analysis reports.</p>
                </div>
                <Link
                    href="/projects/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus size={18} />
                    New Analysis
                </Link>
            </div>

            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-3xl bg-secondary/20 animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="glass rounded-3xl p-6 hover:border-primary/50 transition-all group relative overflow-hidden"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                                        {project.industry || "General"}
                                    </div>
                                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold">{project.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {project.region ? `Region: ${project.region}` : "Detailed market analysis and competitive strategy."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        Completed
                                    </div>
                                </div>
                            </div>

                            <div className="absolute right-4 bottom-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-primary">
                                <ArrowRight size={20} />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 glass rounded-3xl">
                    <p className="text-muted-foreground">No projects found matching your search.</p>
                </div>
            )}
        </div>
    );
}
