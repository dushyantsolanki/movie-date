"use client";

import React, { useState } from "react";
import { X, Cloud, Link2, Film, Check, Sparkles, UploadCloud, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SAMPLE_ROMANTIC_MOVIES, MovieItem } from "@/lib/cloudinary";

interface CloudinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (url: string, title: string, type: "cloudinary" | "url" | "sample") => void;
}

type TabId = "samples" | "cloudinary" | "url";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "samples", label: "Romantic Collection", icon: Film },
  { id: "cloudinary", label: "Cloudinary", icon: Cloud },
  { id: "url", label: "Direct URL", icon: Link2 },
];

export function CloudinaryModal({ isOpen, onClose, onSelectVideo }: CloudinaryModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("samples");
  const [inputUrl, setInputUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectSample = (movie: MovieItem) => {
    setSelectedId(movie.id);
    onSelectVideo(movie.videoUrl, movie.title, "sample");
    onClose();
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const title = customTitle.trim() || (activeTab === "cloudinary" ? "Cloudinary Video 💕" : "Custom Stream 🎬");
    onSelectVideo(inputUrl.trim(), title, activeTab === "cloudinary" ? "cloudinary" : "url");
    setInputUrl("");
    setCustomTitle("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl border-0 bg-transparent p-0 shadow-none sm:max-w-2xl"
      >
        {/* Custom panel — we bypass the default popup styles */}
        <div className="glass-strong flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-rose-500/30 shadow-2xl shadow-black/60">

          {/* ── Header ───────────────────────────── */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 shadow-lg shadow-rose-700/40">
                <Film className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  Movie Hub
                  <Sparkles className="h-4 w-4 text-pink-400" />
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pick a romantic film, paste a Cloudinary URL, or stream any MP4
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Custom Tab Bar ───────────────────── */}
          <div className="flex gap-1 border-b border-white/10 bg-black/20 px-4 pt-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 pb-2.5 pt-2 text-xs font-semibold transition-all",
                  activeTab === tab.id
                    ? "border-rose-500 text-rose-300"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content ──────────────────────────── */}
          <div className="flex-1 overflow-hidden p-5">

            {/* SAMPLES */}
            {activeTab === "samples" && (
              <div className="h-[380px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  {SAMPLE_ROMANTIC_MOVIES.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleSelectSample(movie)}
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                        selectedId === movie.id
                          ? "border-rose-500 shadow-lg shadow-rose-500/20"
                          : "border-white/10 hover:border-rose-500/50 hover:shadow-md hover:shadow-rose-500/10"
                      )}
                    >
                      {/* Poster image */}
                      <div className="relative h-32 overflow-hidden bg-black">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        {/* Play overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600/90 shadow-lg">
                            <Play className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="absolute bottom-2 right-2 border-0 bg-black/70 font-mono text-[10px] text-white/80"
                        >
                          {movie.duration}
                        </Badge>
                      </div>
                      {/* Info */}
                      <div className="flex flex-col gap-1 bg-card/80 p-3">
                        <span className="line-clamp-1 text-sm font-semibold text-foreground">
                          {movie.title}
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {movie.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CLOUDINARY */}
            {activeTab === "cloudinary" && (
              <form onSubmit={handleSubmitUrl} className="flex h-[380px] flex-col justify-center space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-muted-foreground">
                  💡 Upload your video to{" "}
                  <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-rose-400 underline hover:text-rose-300">
                    cloudinary.com
                  </a>{" "}
                  and paste the URL below. Supports MP4, HLS (.m3u8), and DASH.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cld-url" className="text-sm font-semibold text-foreground">
                    Cloudinary Video URL
                  </Label>
                  <Input
                    id="cld-url"
                    type="url"
                    required
                    placeholder="https://res.cloudinary.com/demo/video/upload/v1/movie.mp4"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="border-white/20 bg-black/40 placeholder:text-muted-foreground/40 focus-visible:border-rose-500 focus-visible:ring-rose-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cld-title" className="text-sm font-semibold text-foreground">
                    Movie Title <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="cld-title"
                    placeholder="Our Special Movie 💕"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="border-white/20 bg-black/40 placeholder:text-muted-foreground/40 focus-visible:border-rose-500 focus-visible:ring-rose-500/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Cancel
                  </button>
                  <Button type="submit" className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-700/30 hover:from-rose-500 hover:to-pink-500">
                    <UploadCloud className="h-4 w-4" />
                    Load &amp; Sync
                  </Button>
                </div>
              </form>
            )}

            {/* DIRECT URL */}
            {activeTab === "url" && (
              <form onSubmit={handleSubmitUrl} className="flex h-[380px] flex-col justify-center space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-muted-foreground">
                  🎬 Paste any publicly accessible video URL (.mp4, .webm). Both partners will stream from the same source.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direct-url" className="text-sm font-semibold text-foreground">
                    Video URL
                  </Label>
                  <Input
                    id="direct-url"
                    type="url"
                    required
                    placeholder="https://example.com/romantic-movie.mp4"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="border-white/20 bg-black/40 placeholder:text-muted-foreground/40 focus-visible:border-rose-500 focus-visible:ring-rose-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direct-title" className="text-sm font-semibold text-foreground">
                    Stream Title <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="direct-title"
                    placeholder="Date Night Stream 🍿"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="border-white/20 bg-black/40 placeholder:text-muted-foreground/40 focus-visible:border-rose-500 focus-visible:ring-rose-500/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Cancel
                  </button>
                  <Button type="submit" className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-700/30 hover:from-rose-500 hover:to-pink-500">
                    <Check className="h-4 w-4" />
                    Load &amp; Sync
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
