"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { LogIn, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass max-w-md w-full p-8 rounded-3xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to Analyzer</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-medium text-muted-foreground">Password</label>
                            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                        </div>
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
                        <LogIn size={20} />
                        Sign In
                    </button>
                </form>

                <div className="text-center text-sm text-muted-foreground pt-4">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-primary font-bold hover:underline">Create Account</Link>
                </div>
            </div>
        </div>
    );
}
