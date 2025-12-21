"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    PlusCircle,
    BarChart3,
    Settings,
    HelpCircle,
    Users,
    Shield
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "New Analysis", href: "/projects/new", icon: PlusCircle },
        { name: "All Projects", href: "/projects", icon: BarChart3 },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    if (user?.role === "super_admin" || user?.role === "admin") {
        navItems.splice(3, 0, { name: "User Management", href: "/admin/users", icon: Users });
    }

    return (
        <aside className="w-64 bg-card border-r flex flex-col h-full z-20">
            <div className="p-6 space-y-4">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                    Analyzer
                </h1>

                {user && (
                    <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
                                {user.full_name?.charAt(0) || user.email.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold leading-tight break-all">{user.full_name || "Account"}</div>
                                <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded-md w-fit mt-1">
                                    <Shield size={8} />
                                    {user.role.replace("_", " ")}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-border/50">
                <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary rounded-xl transition-colors w-full group">
                    <HelpCircle className="w-5 h-5 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">Help & Support</span>
                </button>
            </div>
        </aside>
    );
}
