"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    notifications_enabled: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateUser: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
            if (!["/login", "/register", "/forgot-password"].includes(pathname)) {
                router.push("/login");
            }
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { access_token } = res.data;
        localStorage.setItem("token", access_token);
        await fetchUser();
        router.push("/");
    };

    const register = async (data: any) => {
        await api.post("/auth/register", data);
        await login(data.email, data.password);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
    };

    const updateUser = async (data: any) => {
        if (!user) return;
        const res = await api.patch(`/users/${user.id}`, data);
        setUser(res.data);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
