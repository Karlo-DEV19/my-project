'use client';

import React, { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

const sampleMessages = [
    { id: 1, from: "mj", text: "Hi! This is MJ Decor888 👋" },
    {
        id: 2,
        from: "mj",
        text: "Tell us about your window and well suggest blinds.",
    },
    {
        id: 3,
        from: "user",
        text: "I need something for my living room with soft light.",
    },
];

const ChatSection = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-none">
            {/* Chat panel */}
            {open && (
                <div className="w-[320px] sm:w-[360px] border border-border/70 bg-card text-card-foreground shadow-2xl pointer-events-auto">
                    {/* Top bar */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70 bg-muted/40">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-foreground text-background">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-semibold tracking-[0.18em] uppercase">
                                    MJ Decor888 Support
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    Chat coming soon
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="px-4 py-4 space-y-3 max-h-64 overflow-y-auto bg-background">
                        {sampleMessages.map((msg) => {
                            const isUser = msg.from === "user";
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${isUser
                                                ? "bg-foreground text-background"
                                                : "bg-muted text-foreground"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input row (non-functional for now) */}
                    <form
                        className="flex items-center gap-3 px-4 py-3 border-t border-border/70 bg-muted/40"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <input
                            type="text"
                            placeholder="Type your message… (demo only)"
                            className="w-full bg-background text-foreground text-sm px-3 py-2 border border-border/70 outline-none"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center w-9 h-9 border border-border/70 text-muted-foreground bg-background hover:text-foreground"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating chat button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 bg-foreground text-background text-[11px] font-bold tracking-[0.22em] uppercase shadow-lg hover:bg-foreground/90 transition-all"
            >
                <MessageCircle className="w-4 h-4" />
                Chat
            </button>
        </div>
    );
};

export default ChatSection;