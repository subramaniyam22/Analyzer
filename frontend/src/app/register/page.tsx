"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { UserPlus, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register({ email, full_name: fullName, password });
        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass max-w-md w-full p-8 rounded-3xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
                    <p className="text-muted-foreground">Start your analysis journey</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                required
                                className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="password"
                                required
                                className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pt-4"
                    >
                        <UserPlus size={20} />
                        Create Account
                    </button>
                </form>

                <div className="text-center text-sm text-muted-foreground pt-4">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
