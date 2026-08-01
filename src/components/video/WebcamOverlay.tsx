"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebcamOverlayProps {
  stream: MediaStream | null;
  partnerName: string;
  isSelf?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
}

const FILTERS = [
  { label: "None",    css: "none" },
  { label: "Warm",    css: "sepia(20%) contrast(105%) brightness(110%) hue-rotate(-10deg)" },
  { label: "Vivid",   css: "contrast(115%) saturate(140%)" },
  { label: "Glow",    css: "brightness(110%) saturate(120%) drop-shadow(0 0 10px rgba(244,63,94,0.5))" },
];

export function WebcamOverlay({
  stream,
  partnerName,
  isSelf = false,
  isAudioMuted = false,
  isVideoMuted = false,
  onToggleAudio,
  onToggleVideo,
}: WebcamOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filterIdx, setFilterIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  /**
   * KEY FIX: We keep the <video> element in the DOM at ALL times
   * (just visually hidden), so srcObject is never lost when toggling.
   * The effect must re-run whenever stream OR isVideoMuted changes —
   * because the video element is re-shown after being hidden.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      // Only reassign if it changed — prevents unnecessary restarts
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      // Always try to play (browser may have paused it while hidden)
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream, isVideoMuted]); // <-- isVideoMuted triggers re-attach on show

  // Has a live video feed to display
  const hasVideo = !!stream && !isVideoMuted;

  // Emoji-safe initials
  const safeText = partnerName.replace(/\p{Emoji}/gu, "").trim();
  const initials = safeText
    ? safeText.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : isSelf ? "ME" : "??";

  return (
    <div
      className="participant-tile h-full w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── VIDEO ELEMENT — always in DOM, visibility toggled via CSS ─── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        style={{ filter: FILTERS[filterIdx].css }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          isSelf && "-scale-x-100",
          hasVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* ── AVATAR FALLBACK — shown when video is off ────────────────── */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#18131a] transition-opacity duration-200",
          hasVideo ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-rose-500/20 text-base font-bold text-rose-300">
          {initials}
        </div>
        {!isSelf && (
          <Heart className="h-4 w-4 animate-heartbeat text-rose-500/40" />
        )}
        {isSelf && isVideoMuted && (
          <p className="text-[10px] text-muted-foreground">Camera off</p>
        )}
      </div>

      {/* ── BOTTOM GRADIENT ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/80 to-transparent" />

      {/* ── NAME + MIC STATUS ────────────────────────────────────────── */}
      <div className="absolute bottom-1.5 left-2 z-20 flex items-center gap-1.5">
        <span className="max-w-[90px] truncate rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          {isSelf ? "You" : partnerName.split(" ")[0]}
        </span>
        {isAudioMuted && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600">
            <MicOff className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* ── FILTER PILL (self only, on hover, video visible) ─────────── */}
      {isSelf && hasVideo && hovered && (
        <button
          onClick={() => setFilterIdx((i) => (i + 1) % FILTERS.length)}
          className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm transition-all hover:bg-black/80"
        >
          <Sparkles className="h-3 w-3 text-pink-400" />
          {FILTERS[filterIdx].label}
        </button>
      )}

      {/* ── HOVER MIC + CAMERA CONTROLS (self only) ──────────────────── */}
      {isSelf && hovered && (
        <div className="absolute inset-x-0 bottom-8 z-20 flex items-center justify-center gap-2">
          {/* Mic toggle */}
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? "Unmute mic" : "Mute mic"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110",
              isAudioMuted
                ? "bg-red-600 text-white ring-2 ring-red-400/40"
                : "bg-black/70 text-emerald-400 hover:bg-black/90"
            )}
          >
            {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>

          {/* Camera toggle */}
          <button
            onClick={onToggleVideo}
            title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110",
              isVideoMuted
                ? "bg-red-600 text-white ring-2 ring-red-400/40"
                : "bg-black/70 text-rose-400 hover:bg-black/90"
            )}
          >
            {isVideoMuted ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
