'use client';

import React, {
    useEffect,
    useRef,
    useState,
    FormEvent,
    KeyboardEvent,
} from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
    id: number;
    from: "bot" | "user";
    text: string;
};

const BOT_SCRIPT = [
    "Hello! Welcome to MJ Decor 888.",
    "How can we help you today?",
    "If you need assistance with blinds or curtains, our staff can help you.",
];

const ChatSection = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [botStep, setBotStep] = useState(0);
    const [isConnectedToStaff, setIsConnectedToStaff] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [hasShownConnectPrompt, setHasShownConnectPrompt] = useState(false);
    const [dismissedPrompt, setDismissedPrompt] = useState(false);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    // Auto-scroll to newest message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages.length, open]);

    // Clear timeouts on unmount / close
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach((t) => clearTimeout(t));
        };
    }, []);

    // Start bot script when chat opens (fresh)
    useEffect(() => {
        if (!open) return;

        // Reset state when just opened and no messages yet
        if (messages.length === 0 && botStep === 0 && !isConnectedToStaff) {
            BOT_SCRIPT.forEach((line, index) => {
                const timeout = setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: prev.length + 1,
                            from: "bot",
                            text: line,
                        },
                    ]);
                    setBotStep((prevStep) => Math.min(prevStep + 1, BOT_SCRIPT.length));
                }, 800 * (index + 1));
                timeoutsRef.current.push(timeout);
            });
        }
    }, [open, messages.length, botStep, isConnectedToStaff]);

    const handleToggleOpen = () => {
        setOpen((prev) => !prev);
    };

    const handleSend = (e: FormEvent | KeyboardEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const text = userInput.trim();
        setMessages((prev) => {
            const next: ChatMessage[] = [
                ...prev,
                {
                    id: prev.length + 1,
                    from: "user",
                    text,
                },
            ];
            return next;
        });

        // After the first user message, show the connect prompt
        if (!hasShownConnectPrompt) {
            setHasShownConnectPrompt(true);
            setDismissedPrompt(false);
        }

        setUserInput("");
    };

    const showConnectPrompt =
        hasShownConnectPrompt && !isConnectedToStaff && !dismissedPrompt;

    return (
        <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-none">
            {/* Chat panel */}
            {open && (
                <div className="w-[320px] sm:w-[360px] border border-border/70 bg-card text-card-foreground shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                                    {isConnectedToStaff ? "Connected to staff" : "Virtual assistant"}
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
                    <div
                        ref={scrollRef}
                        className="px-4 py-4 space-y-3 max-h-64 overflow-y-auto bg-background"
                    >
                        {messages.map((msg) => {
                            const isUser = msg.from === "user";
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-sm px-3 py-2 text-sm leading-relaxed ${
                                            isUser
                                                ? "bg-foreground text-background"
                                                : "bg-muted text-foreground"
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}

                        {showConnectPrompt && (
                            <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] rounded-sm px-3 py-2 text-sm leading-relaxed bg-muted text-foreground">
                                        Would you like to connect to a staff member?
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsConnectedToStaff(true);
                                            setDismissedPrompt(true);
                                        }}
                                        className="flex-1 rounded-none border border-foreground bg-foreground px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-background hover:bg-foreground/90 transition-colors"
                                    >
                                        Yes, Connect to Staff
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMessages((prev) => [
                                                ...prev,
                                                {
                                                    id: prev.length + 1,
                                                    from: "bot",
                                                    text: "No problem! Feel free to browse our products.",
                                                },
                                            ]);
                                            setDismissedPrompt(true);
                                        }}
                                        className="flex-1 rounded-none border border-border bg-background px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                                    >
                                        No, Continue Browsing
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input row */}
                    <form
                        className="flex items-center gap-3 px-4 py-3 border-t border-border/70 bg-muted/40"
                        onSubmit={handleSend}
                    >
                        <input
                            type="text"
                            placeholder="Type your message…"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSend(e);
                                }
                            }}
                            className="w-full bg-background text-foreground text-sm px-3 py-2 border border-border/70 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!userInput.trim()}
                            className="inline-flex items-center justify-center w-9 h-9 border border-border/70 text-muted-foreground bg-background hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating chat button */}
            <button
                type="button"
                onClick={handleToggleOpen}
                className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 bg-foreground text-background text-[11px] font-bold tracking-[0.22em] uppercase shadow-lg hover:bg-foreground/90 transition-all"
            >
                <MessageCircle className="w-4 h-4" />
                Chat
            </button>
        </div>
    );
};

export default ChatSection;