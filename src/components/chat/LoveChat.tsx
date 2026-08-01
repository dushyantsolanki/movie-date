"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Heart, HelpCircle, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf?: boolean;
}

interface LoveChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onSendIcebreaker: (question: string) => void;
}

const REACTIONS = [
  { emoji: "💕", label: "Hearts"    },
  { emoji: "😘", label: "Kiss"      },
  { emoji: "🍿", label: "Popcorn"   },
  { emoji: "🥂", label: "Cheers"    },
  { emoji: "🌹", label: "Rose"      },
  { emoji: "✨", label: "Sparkles"  },
];

const ICEBREAKERS = [
  "What was your first impression of me? 💕",
  "If we could teleport anywhere right now, where? ✈️",
  "What song always reminds you of us? 🎵",
  "What is your dream movie date setup? 🍿",
  "Describe our love story in 3 words 🌹",
];

export function LoveChat({ messages, onSendMessage, onSendReaction, onSendIcebreaker }: LoveChatProps) {
  const [text, setText] = useState("");
  const [showIce, setShowIce] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Reaction strip ───────────────────── */}
      <div className="flex shrink-0 items-center justify-around border-b border-white/8 bg-black/20 px-3 py-2">
        {REACTIONS.map((r) => (
          <button
            key={r.emoji}
            onClick={() => onSendReaction(r.emoji)}
            title={r.label}
            className="rounded-lg p-1.5 text-xl leading-none transition-transform hover:scale-125 active:scale-95"
          >
            {r.emoji}
          </button>
        ))}
        <button
          onClick={() => setShowIce(!showIce)}
          title="Icebreakers"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground",
            showIce && "bg-rose-500/20 text-rose-300"
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      {/* ── Icebreaker drawer ────────────────── */}
      {showIce && (
        <div className="animate-slide-up shrink-0 border-b border-white/8 bg-black/30 px-3 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-pink-400" />
            Romantic prompts
          </p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {ICEBREAKERS.map((q, i) => (
              <button
                key={i}
                onClick={() => { onSendIcebreaker(q); setShowIce(false); }}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-xs text-foreground/80 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Heart className="h-10 w-10 animate-heartbeat text-primary/30" />
            <p className="text-sm text-muted-foreground">
              No messages yet. <br />
              Send a reaction or a love note! 💕
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col", msg.isSelf ? "items-end" : "items-start")}>
                <div className="mb-1 flex items-baseline gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">{msg.sender}</span>
                  <span className="text-[10px] text-muted-foreground/40">{msg.time}</span>
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                    msg.isSelf
                      ? "rounded-br-md bg-gradient-to-br from-rose-600 to-pink-600 text-white"
                      : "rounded-bl-md border border-white/10 bg-white/8 text-foreground"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8 bg-black/30 p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a love note…"
            className="flex-1 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-rose-500/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-md shadow-rose-700/30 transition-all hover:scale-105 hover:shadow-rose-600/50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
