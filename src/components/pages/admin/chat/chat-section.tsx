"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Search, Send, MessageSquare, Phone, Video, Info,
  Image, Mic, Smile, ThumbsUp, Pin, Film, ChevronRight,
  X, Paperclip,
} from "lucide-react";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatStatus = "Active" | "Pending" | "Closed";

type Message = {
  id: string;
  sender: "customer" | "admin";
  text: string;
  timestamp: string;
};

type Chat = {
  id: string;
  customerName: string;
  lastMessage: string;
  status: ChatStatus;
  messages: Message[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CHATS: Chat[] = [
  {
    id: "CHAT-1001",
    customerName: "Juan Dela Cruz",
    lastMessage: "Magkano po blackout blinds?",
    status: "Active",
    messages: [
      { id: "m1", sender: "customer", text: "Hello po, may tanong lang ako.", timestamp: "10:01 AM" },
      { id: "m2", sender: "admin", text: "Hi Juan! Kamusta, paano kita matutulungan?", timestamp: "10:02 AM" },
      { id: "m3", sender: "customer", text: "Magkano po blackout blinds?", timestamp: "10:03 AM" },
      { id: "m4", sender: "admin", text: "Ang blackout blinds po namin ay nagsisimula sa ₱850 depende sa sukat ng bintana.", timestamp: "10:04 AM" },
      { id: "m5", sender: "customer", text: "Pwede po bang malaman ang exact na presyo para sa 4ft x 5ft?", timestamp: "10:05 AM" },
    ],
  },
  {
    id: "CHAT-1002",
    customerName: "Maria Santos",
    lastMessage: "Available po ba installation?",
    status: "Pending",
    messages: [
      { id: "m1", sender: "customer", text: "Gud pm po! Available po ba installation sa Marikina?", timestamp: "2:15 PM" },
      { id: "m2", sender: "customer", text: "Available po ba installation?", timestamp: "2:16 PM" },
    ],
  },
  {
    id: "CHAT-1003",
    customerName: "Carlos Reyes",
    lastMessage: "Thank you, okay na po!",
    status: "Closed",
    messages: [
      { id: "m1", sender: "customer", text: "Natanggap na po yung order ko.", timestamp: "9:00 AM" },
      { id: "m2", sender: "admin", text: "Salamat Carlos! Okay ang lahat?", timestamp: "9:05 AM" },
      { id: "m3", sender: "customer", text: "Thank you, okay na po!", timestamp: "9:10 AM" },
    ],
  },
  {
    id: "CHAT-1004",
    customerName: "Ana Villanueva",
    lastMessage: "Gusto ko po ng roller blinds.",
    status: "Active",
    messages: [
      { id: "m1", sender: "customer", text: "Hi po! Gusto ko po ng roller blinds para sa sala.", timestamp: "11:30 AM" },
      { id: "m2", sender: "admin", text: "Magandang pagpipilian! Anong size po ng bintana?", timestamp: "11:31 AM" },
      { id: "m3", sender: "customer", text: "Gusto ko po ng roller blinds.", timestamp: "11:32 AM" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ChatStatus, { badge: string; dot: string; label: string }> = {
  Active:  { dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40", label: "Active" },
  Pending: { dot: "bg-amber-400",   badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",       label: "Pending" },
  Closed:  { dot: "bg-slate-500",   badge: "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/40",       label: "Closed" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarHue(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = "md", online = false }: { name: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const hue = getAvatarHue(name);
  const sizes = { sm: "h-7 w-7 text-[9px]", md: "h-10 w-10 text-xs", lg: "h-11 w-11 text-sm" };
  const dots  = { sm: "h-2 w-2 border",     md: "h-2.5 w-2.5 border-2", lg: "h-3 w-3 border-2" };
  return (
    <div className="relative shrink-0">
      <div
        className={cn("flex items-center justify-center rounded-full font-semibold text-white select-none", sizes[size])}
        style={{ background: `linear-gradient(135deg, hsl(${hue},65%,58%), hsl(${(hue+40)%360},60%,45%))` }}
      >
        {getInitials(name)}
      </div>
      {online && (
        <span className={cn("absolute bottom-0 right-0 rounded-full border-[#0f172a] bg-emerald-400", dots[size])} />
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChatStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg.badge)}>
      {cfg.label}
    </span>
  );
}

// ─── Right Info Panel ─────────────────────────────────────────────────────────

function InfoPanel({ chat, onClose }: { chat: Chat; onClose: () => void }) {
  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col border-l border-white/5 bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Details</p>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Customer info */}
      <div className="flex flex-col items-center gap-2 border-b border-white/5 px-4 py-5">
        <Avatar name={chat.customerName} size="lg" online={chat.status === "Active"} />
        <p className="text-sm font-semibold text-white">{chat.customerName}</p>
        <StatusBadge status={chat.status} />
        <p className="text-xs text-slate-500">{chat.id}</p>
      </div>

      {/* Action shortcuts */}
      <div className="flex flex-col gap-1 border-b border-white/5 px-3 py-3">
        {[
          { icon: Film,   label: "View Media" },
          { icon: Pin,    label: "Pinned Messages" },
          { icon: Search, label: "Search in Chat" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/5"
          >
            <Icon className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="flex-1 text-xs">{label}</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
          </button>
        ))}
      </div>

      {/* Quick replies */}
      <div className="flex flex-col gap-1.5 px-3 py-3">
        <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Quick Replies
        </p>
        {[
          "Salamat po sa inyong mensahe!",
          "Sandali lang po, tatanungin ko.",
          "Pwede po kayong mag-visit.",
        ].map((q) => (
          <div
            key={q}
            className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-400"
          >
            {q}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminChatPage() {
  const [query, setQuery]         = useState("");
  const [selectedId, setSelectedId] = useState<string>(MOCK_CHATS[0].id);
  const [chats, setChats]         = useState<Chat[]>(MOCK_CHATS);
  const [inputText, setInputText] = useState("");
  const [showInfo, setShowInfo]   = useState(false);
  const messagesEndRef            = useRef<HTMLDivElement>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats.filter(
      (c) => !q || c.customerName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }, [query, chats]);

  const selectedChat = chats.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || !selectedId) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = { id: `m-${Date.now()}`, sender: "admin", text, timestamp: now };
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, messages: [...c.messages, newMsg], lastMessage: text } : c
      )
    );
    setInputText("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleLike() {
    if (!selectedId) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = { id: `m-${Date.now()}`, sender: "admin", text: "👍", timestamp: now };
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, messages: [...c.messages, newMsg], lastMessage: "👍" } : c
      )
    );
  }

  const isOnline = (s: ChatStatus) => s === "Active";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0f172a]">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-white/5 px-6 py-4">
        <AdminPageHeader
          title="Chat Management"
          description="Track and manage all customer conversations in one place."
        />
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/5 bg-[#0f172a]">
          <div className="shrink-0 px-4 pb-3 pt-5">
            <h2 className="mb-3 px-1 text-xl font-bold tracking-tight text-blue-200">
              Chats
              <span className="ml-2 text-sm font-normal text-slate-500">({filteredChats.length})</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="h-9 rounded-full border-0 bg-white/5 pl-9 text-sm text-blue-200 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto px-2 pb-3">
            {filteredChats.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-500">No chats found</li>
            )}
            {filteredChats.map((chat) => {
              const active = chat.id === selectedId;
              return (
                <li key={chat.id}>
                  <button
                    onClick={() => { setSelectedId(chat.id); setShowInfo(false); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100",
                      active ? "bg-blue-600/20 ring-1 ring-blue-500/30" : "hover:bg-white/5"
                    )}
                  >
                    <Avatar name={chat.customerName} size="md" online={isOnline(chat.status)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm font-semibold", active ? "text-blue-400" : "text-blue-200")}>
                          {chat.customerName}
                        </p>
                        <StatusBadge status={chat.status} />
                      </div>
                      <p className={cn("mt-0.5 truncate text-xs", active ? "text-blue-400/60" : "text-slate-500")}>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ══ MAIN PANEL ═══════════════════════════════════════════════════ */}
        {selectedChat ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d1526]">

            {/* Chat header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-white/5 bg-[#0f172a] px-5 py-3">
              <Avatar name={selectedChat.customerName} size="md" online={isOnline(selectedChat.status)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-200 leading-tight">{selectedChat.customerName}</p>
                <p className={cn("text-xs font-medium", isOnline(selectedChat.status) ? "text-emerald-400" : "text-slate-500")}>
                  {isOnline(selectedChat.status) ? "Active now" : "Offline"} · {selectedChat.id}
                </p>
              </div>
              {/* Header action buttons */}
              <div className="flex items-center gap-0.5">
                <StatusBadge status={selectedChat.status} />
                {[
                  { Icon: Phone,  tip: "Call" },
                  { Icon: Video,  tip: "Video" },
                  { Icon: Info,   tip: "Info", action: () => setShowInfo((v) => !v) },
                ].map(({ Icon, tip, action }) => (
                  <Button
                    key={tip}
                    variant="ghost"
                    size="icon"
                    onClick={action}
                    title={tip}
                    className={cn(
                      "h-9 w-9 rounded-full text-blue-400 hover:bg-blue-500/10",
                      tip === "Info" && showInfo && "bg-blue-500/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages + info panel row */}
            <div className="flex min-h-0 flex-1 overflow-hidden">

              {/* ── Messages area ─────────────────────────────────────── */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

                {/* Scrollable messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="flex flex-col gap-0.5">
                    {selectedChat.messages.map((msg, idx) => {
                      const msgs     = selectedChat.messages;
                      const isAdmin  = msg.sender === "admin";
                      const prevSame = idx > 0 && msgs[idx - 1].sender === msg.sender;
                      const nextSame = idx < msgs.length - 1 && msgs[idx + 1].sender === msg.sender;
                      const isFirst  = !prevSame;
                      const isLast   = !nextSame;

                      const adminRound = cn(
                        "rounded-2xl",
                        isFirst && !isLast && "rounded-br-md",
                        !isFirst && isLast  && "rounded-tr-md",
                        !isFirst && !isLast && "rounded-r-md"
                      );
                      const customerRound = cn(
                        "rounded-2xl",
                        isFirst && !isLast && "rounded-bl-md",
                        !isFirst && isLast  && "rounded-tl-md",
                        !isFirst && !isLast && "rounded-l-md"
                      );

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex items-end gap-2",
                            isAdmin ? "flex-row-reverse" : "flex-row",
                            isFirst && idx !== 0 && "mt-3"
                          )}
                        >
                          {/* Customer avatar */}
                          {!isAdmin && (
                            <div className="w-7 shrink-0">
                              {isLast && <Avatar name={selectedChat.customerName} size="sm" />}
                            </div>
                          )}

                          <div className={cn("flex flex-col gap-0.5", isAdmin ? "items-end" : "items-start")}>
                            <div
                              className={cn(
                                "max-w-sm px-4 py-2.5 text-sm leading-relaxed lg:max-w-lg",
                                isAdmin
                                  ? cn("bg-blue-600 text-blue-400", adminRound)
                                  : cn("bg-white/10 text-blue-400", customerRound)
                              )}
                            >
                              {msg.text}
                            </div>
                            {isLast && (
                              <p className="px-1 text-[10px] text-slate-500">{msg.timestamp}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* ── Reply box ── BOTTOM of messages ───────────────── */}
                <div className="shrink-0 border-t border-white/5 bg-[#0f172a] px-4 py-3">
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                    {/* Textarea */}
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                      rows={2}
                      className="w-full resize-none bg-transparent text-sm text-blue-200 placeholder:text-slate-500 outline-none"
                    />
                    {/* Toolbar */}
                    <div className="flex items-center gap-1">
                      {/* Left icons */}
                      <div className="flex items-center gap-0.5">
                        {/* Photo attachment */}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          title="Send photo"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-blue-400 transition-colors hover:bg-blue-500/15"
                        >
                          <Image className="h-4 w-4" />
                        </button>
                        {/* Attachment */}
                        <button
                          title="Attach file"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-blue-400 transition-colors hover:bg-blue-500/15"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        {/* Voice */}
                        <button
                          title="Voice message"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-blue-400 transition-colors hover:bg-blue-500/15"
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                        {/* Emoji */}
                        <button
                          title="Emoji"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-blue-400 transition-colors hover:bg-blue-500/15"
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Like button */}
                      <button
                        onClick={handleLike}
                        title="Send like"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-blue-400 transition-colors hover:bg-blue-500/15"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>

                      {/* Send button */}
                      <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                          inputText.trim()
                            ? "bg-blue-600 text-blue-600 hover:bg-blue-500 active:scale-95"
                            : "bg-white/5 text-slate-600 cursor-default"
                        )}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Info panel (toggleable) ────────────────────────── */}
              {showInfo && <InfoPanel chat={selectedChat} onClose={() => setShowInfo(false)} />}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#0d1526] text-slate-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <MessageSquare className="h-7 w-7 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">Your messages</p>
              <p className="mt-1 text-xs">Select a conversation to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}