"use client";

import { cn } from "@/lib/utils";

interface ComparisonProps {
    data: any[];
}

export function ComparisonTable({ data }: ComparisonProps) {
    if (!data || data.length === 0) return null;

    const competitors = Object.keys(data[0]).filter(k => k !== "feature" && k !== "base");

    return (
        <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left border-collapse">
                <thead className="bg-secondary/50">
                    <tr>
                        <th className="p-4 font-bold border-b border-border">Feature</th>
                        <th className="p-4 font-bold border-b border-border text-blue-400">Base Org</th>
                        {competitors.map(comp => (
                            <th key={comp} className="p-4 font-bold border-b border-border text-purple-400">
                                {comp}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-4 font-medium">{row.feature}</td>
                            <td className="p-4 text-sm text-muted-foreground">{row.base}</td>
                            {competitors.map(comp => (
                                <td key={comp} className="p-4 text-sm text-muted-foreground">
                                    {row[comp]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
