"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Bell, Shield, Key, Sliders, Save, LogOut } from "lucide-react";
import api from "@/lib/api";

export default function SettingsPage() {
    const { user, loading: authLoading, updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("General");
    const [loading, setLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        notifications_enabled: true,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || "",
                email: user.email || "",
                notifications_enabled: user.notifications_enabled ?? true,
            });
        }
    }, [user]);

    if (authLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUser(formData);
            alert("Settings saved!");
        } catch (err) {
            alert("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { name: "General", icon: Sliders },
        { name: "Account", icon: User },
        { name: "Notifications", icon: Bell },
        { name: "Security", icon: Shield },
        { name: "API Config", icon: Key },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account preferences and application configuration.</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-4 py-2 rounded-xl transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <nav className="space-y-1">
                    {tabs.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${activeTab === item.name
                                ? "bg-secondary text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                }`}
                        >
                            <item.icon size={18} />
                            {item.name}
                        </button>
                    ))}
                </nav>

                <div className="md:col-span-3 space-y-6">
                    {activeTab === "General" && (
                        <section className="glass rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-xl font-bold border-b border-border pb-4">Application Preferences</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <div>
                                        <div className="font-bold">Dark Mode</div>
                                        <div className="text-sm text-muted-foreground">Toggle between light and dark theme.</div>
                                    </div>
                                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === "Account" && (
                        <section className="glass rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-xl font-bold border-b border-border pb-4">Account Details</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">User Role</label>
                                    <div className="bg-secondary/20 border border-border/50 rounded-xl px-4 py-2 text-primary font-bold uppercase tracking-wider text-xs">
                                        {user?.role?.replace("_", " ")}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === "Notifications" && (
                        <section className="glass rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-xl font-bold border-b border-border pb-4">Notification Settings</h2>
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <div className="font-bold">Email Notifications</div>
                                    <div className="text-sm text-muted-foreground">Receive updates about your analysis projects.</div>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, notifications_enabled: !formData.notifications_enabled })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.notifications_enabled ? "bg-primary" : "bg-secondary"}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-background rounded-full transition-all ${formData.notifications_enabled ? "right-1" : "left-1"}`} />
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === "Security" && (
                        <section className="glass rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-xl font-bold border-b border-border pb-4">Security</h2>
                            <button className="text-primary font-bold hover:underline">Change Password</button>
                        </section>
                    )}

                    {activeTab === "API Config" && (
                        <section className="glass rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-xl font-bold border-b border-border pb-4">AI Configuration</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Default LLM Model</label>
                                    <select className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>GPT-4o (Recommended)</option>
                                        <option>GPT-4 Turbo</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? "Saving..." : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
