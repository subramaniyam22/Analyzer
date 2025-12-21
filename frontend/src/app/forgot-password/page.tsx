"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [token, setToken] = useState(""); // For demo purposes we show the token

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/forgot-password", { email });
            setSent(true);
            if (res.data.token) setToken(res.data.token);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass max-w-md w-full p-8 rounded-3xl space-y-8">
                <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
                    <p className="text-muted-foreground">We&apos;ll send you a recovery link</p>
                </div>

                {!sent ? (
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

                        <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pt-4"
                        >
                            <KeyRound size={20} />
                            Send Recovery Link
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-green-500/10 text-green-500 p-4 rounded-xl border border-green-500/20">
                            Recovery link sent! Check your inbox.
                        </div>
                        {token && (
                            <div className="bg-secondary/50 p-4 rounded-xl text-left">
                                <p className="text-xs font-bold text-muted-foreground underline mb-2 tracking-widest uppercase">Secret Token (Demo only):</p>
                                <code className="text-sm text-primary break-all">{token}</code>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
