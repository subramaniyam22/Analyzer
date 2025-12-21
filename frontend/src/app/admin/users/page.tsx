"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Search, Shield, Mail, Trash2, Edit3, UserCheck, UserMinus, Plus } from "lucide-react";
import api from "@/lib/api";

export default function UserManagementPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: "",
        full_name: "",
        password: "",
        role: "user"
    });

    const fetchUsers = async () => {
        if (authLoading) return;
        try {
            const res = await api.get("/users");
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [authLoading]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post("/users", newUser);
            if (res.data.error) {
                alert(res.data.error);
                return;
            }
            setIsModalOpen(false);
            fetchUsers();
            setNewUser({ email: "", full_name: "", password: "", role: "user" });
        } catch (err: any) {
            console.error("User creation failed", err);
            alert("Failed to create user");
        }
    };

    const toggleStatus = async (user: any) => {
        try {
            await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
            fetchUsers();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (authLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    if (currentUser?.role === "user") return <div>Unauthorized</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-2">Manage team members and access controls.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-secondary/30">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-secondary/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {u.full_name?.charAt(0) || u.email.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold">{u.full_name || "N/A"}</div>
                                            <div className="text-sm text-muted-foreground">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === "super_admin" ? "bg-purple-500/10 text-purple-500" :
                                        u.role === "admin" ? "bg-blue-500/10 text-blue-500" : "bg-zinc-500/10 text-zinc-500"
                                        }`}>
                                        {u.role === "super_admin" && <Shield size={12} />}
                                        {u.role.replace("_", " ")}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-neutral-500"}`} />
                                        <span className="text-sm font-medium">{u.is_active ? "Active" : "Inactive"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => toggleStatus(u)}
                                            className={`p-2 rounded-lg transition-colors ${u.is_active ? "text-muted-foreground hover:bg-neutral-500/10" : "text-green-500 hover:bg-green-500/10"}`}
                                            title={u.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {u.is_active ? <UserMinus size={18} /> : <UserCheck size={18} />}
                                        </button>
                                        {(currentUser?.role === "super_admin" || (currentUser?.role === "admin" && u.role === "user")) && (
                                            <button className="p-2 text-muted-foreground hover:bg-secondary/80 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass max-w-md w-full p-8 rounded-3xl space-y-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold">Add New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                <input
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Role</label>
                                <select
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    {currentUser?.role === "super_admin" && <option value="admin">Admin</option>}
                                    {currentUser?.role === "super_admin" && <option value="super_admin">Super Admin</option>}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-secondary text-foreground py-2 rounded-xl font-bold hover:bg-secondary/80"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
