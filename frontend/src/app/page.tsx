"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, BarChart3, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (loading) return;
    api.get("/projects")
      .then(res => setProjects(res.data))
      .catch(err => console.error(err));
  }, [loading]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Market Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, <span className="text-primary font-bold">{user?.full_name || "Innovator"}</span>. Here&apos;s an overview of your analysis projects.</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
        >
          <PlusCircle className="w-5 h-5" />
          New Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl space-y-2">
          <div className="bg-blue-500/20 p-2 rounded-lg w-fit">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
          <p className="text-3xl font-bold">{projects.length}</p>
        </div>
        <div className="glass p-6 rounded-2xl space-y-2">
          <div className="bg-purple-500/20 p-2 rounded-lg w-fit">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Active Scans</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="glass p-6 rounded-2xl space-y-2">
          <div className="bg-green-500/20 p-2 rounded-lg w-fit">
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Avg. Processing Time</p>
          <p className="text-3xl font-bold">0s</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Recent Projects
        </h2>
        <div className="grid gap-4">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="glass p-4 rounded-2xl hover:bg-secondary/50 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-secondary p-3 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.industry} • {project.organizations.length} Organizations</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-20 glass rounded-2xl border-dashed border-2">
              <p className="text-muted-foreground">No projects found. Create your first analysis to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
