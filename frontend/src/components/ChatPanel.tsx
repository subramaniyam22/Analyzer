"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export function ChatPanel({ projectId }: { projectId: string }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSend = async () => {
        if (!input || loading) return;
        const userMsg = { role: "user", content: input };
        setMessages([...messages, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await api.post(`/projects/${projectId}/chat?message=${encodeURIComponent(input)}`);
            setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] glass rounded-3xl overflow-hidden border-border">
            <div className="p-4 border-b bg-secondary/50 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Project Assistant</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={cn(
                        "flex gap-3 max-w-[85%]",
                        m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                            m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}>
                            {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed",
                            m.role === "user" ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary/50 border border-border"
                        )}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 items-center text-muted-foreground animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Thinking...</span>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t bg-secondary/30">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSend()}
                        placeholder="Ask a follow-up question..."
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                        onClick={onSend}
                        disabled={loading}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
