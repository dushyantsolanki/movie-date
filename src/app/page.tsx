"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart, Sparkles, Video, Monitor, Cloud, Film, Users,
  Copy, Check, ArrowRight, ShieldCheck, Lock,
} from "lucide-react";
import { HeartParticles } from "@/components/effects/HeartParticles";
import { cn } from "@/lib/utils";

function generateDateCode() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const affix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOVE-${digits}-${affix}`;
}

const FEATURES = [
  { icon: Video,    title: "HD Video Call",    desc: "Dual cams & mic, romantic filters.",    color: "text-rose-400",    bg: "bg-rose-500/10" },
  { icon: Film,     title: "Synced Cinema",    desc: "Frame-perfect movie synchronisation.",  color: "text-pink-400",    bg: "bg-pink-500/10"  },
  { icon: Monitor,  title: "Screen Share",     desc: "Stream Netflix, YouTube live.",          color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  { icon: Cloud,    title: "Cloudinary Hub",   desc: "Upload or paste any MP4/HLS link.",     color: "text-purple-400",  bg: "bg-purple-500/10" },
];

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = () => setRoomCode(generateDateCode());

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/date/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code) router.push(`/date/${code}`);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <HeartParticles />

      {/* Background glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[60vw] max-h-[600px] w-[60vw] max-w-[600px] rounded-full bg-rose-700/12 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[40vw] max-h-[400px] w-[40vw] max-w-[400px] rounded-full bg-fuchsia-800/8 blur-[100px]" />
      </div>

      {/* ── HEADER ─────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="animate-heartbeat flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 shadow-lg shadow-rose-700/40">
            <Heart className="h-4.5 w-4.5 fill-white text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">LoveTheater</span>
            <span className="font-romantic text-2xl text-rose-400" style={{ fontFamily: "var(--font-romantic)" }}>
              Date
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Private &amp; Encrypted
        </div>
      </header>

      {/* ── HERO ───────────────────────────────── */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-8 text-center sm:px-6 sm:pt-12 lg:pt-16">
        {/* Pill badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-300">
          <Sparkles className="h-3.5 w-3.5 text-pink-400" />
          The perfect virtual movie date experience
        </div>

        {/* Headline */}
        <h1 className="text-glow text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
          Watch Together.{" "}
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
            Feel Together. 💕
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
          Generate a private Date Code, share it with your partner, then enjoy HD video calls,
          synced movies, screen sharing, and romantic chat — all in one beautiful room.
        </p>

        {/* ── ROOM CARD ────────────────────────── */}
        <div className="glass-strong mt-10 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl sm:max-w-md">
          <div className="p-6 sm:p-8">
            {/* CREATE */}
            {!roomCode ? (
              <button
                onClick={handleCreate}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-700/40 transition-all hover:from-rose-500 hover:to-pink-500 hover:shadow-rose-600/60 active:scale-[0.97]"
              >
                <Heart className="h-5 w-5 fill-white" />
                Create Love Room
              </button>
            ) : (
              <div className="animate-slide-up space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Your Date Code
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ready
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5">
                  <span className="font-mono text-lg font-bold tracking-widest text-foreground">
                    {roomCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="ml-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied
                      ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</>
                      : <><Copy className="h-3.5 w-3.5" /> Copy link</>}
                  </button>
                </div>

                <button
                  onClick={() => router.push(`/date/${roomCode}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-3 text-sm font-bold text-white shadow-md shadow-rose-700/30 transition-all hover:from-rose-500 hover:to-pink-500"
                >
                  Enter Room &amp; Invite Partner
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                or join a date
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* JOIN */}
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="LOVE-XXXX-XXXX"
                className="flex-1 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 font-mono text-sm uppercase tracking-widest text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/60 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary/90"
              >
                <Users className="h-4 w-4" />
                Join
              </button>
            </form>
          </div>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-2 border-t border-white/8 bg-black/20 px-4 py-3 text-[11px] text-muted-foreground/70">
            <Lock className="h-3 w-3" />
            Peer-to-peer encrypted · No recording · No data stored
          </div>
        </div>

        {/* ── FEATURES GRID ─────────────────────── */}
        <div className="mt-16 grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass flex flex-col gap-2.5 rounded-2xl p-4 text-left transition-all duration-200 hover:border-rose-500/30 sm:p-5"
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", f.bg)}>
                <f.icon className={cn("h-5 w-5", f.color)} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground/50">
        Crafted with 💕 for magical movie nights — wherever you are.
      </footer>
    </main>
  );
}
