"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Tv, Film, Monitor, Upload, SkipBack, SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SyncMessage } from "@/lib/webrtc";
import { cn } from "@/lib/utils";

interface SyncedPlayerProps {
  videoUrl: string;
  videoTitle: string;
  videoType: "url" | "cloudinary" | "screenshare" | "sample";
  screenStream?: MediaStream | null;
  isLocalShare?: boolean;
  onSendSync: (msg: SyncMessage) => void;
  incomingSync: SyncMessage | null;
  onOpenUploadModal: () => void;
  onStartScreenShare: () => void;
}

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

export function SyncedPlayer({
  videoUrl,
  videoTitle,
  videoType,
  screenStream,
  isLocalShare = false,
  onSendSync,
  incomingSync,
  onOpenUploadModal,
  onStartScreenShare,
}: SyncedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [buffering, setBuffering] = useState(false);

  // Bind screen share stream
  useEffect(() => {
    if (videoType === "screenshare" && screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [videoType, screenStream]);

  // Track fullscreen changes
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  // Handle incoming partner sync
  useEffect(() => {
    if (!incomingSync) return;
    const vid = videoRef.current;
    if (!vid || videoType === "screenshare") return;

    if (incomingSync.type === "PLAY") {
      if (incomingSync.timestamp !== undefined && Math.abs(vid.currentTime - incomingSync.timestamp) > 1.5) {
        vid.currentTime = incomingSync.timestamp;
      }
      vid.play().catch(() => {});
      setPlaying(true);
    } else if (incomingSync.type === "PAUSE") {
      if (incomingSync.timestamp !== undefined) vid.currentTime = incomingSync.timestamp;
      vid.pause();
      setPlaying(false);
    } else if (incomingSync.type === "SEEK" && incomingSync.timestamp !== undefined) {
      vid.currentTime = incomingSync.timestamp;
      setCurrent(incomingSync.timestamp);
    }
  }, [incomingSync, videoType]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowOverlay(true);
    hideTimerRef.current = setTimeout(() => setShowOverlay(false), 3000);
  }, []);

  const handleMouseMove = () => scheduleHide();

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid || videoType === "screenshare") return;
    if (playing) {
      vid.pause();
      setPlaying(false);
      onSendSync({ type: "PAUSE", timestamp: vid.currentTime });
    } else {
      vid.play().catch(() => {});
      setPlaying(true);
      onSendSync({ type: "PLAY", timestamp: vid.currentTime });
    }
  };

  const skip = (seconds: number) => {
    const vid = videoRef.current;
    if (!vid || videoType === "screenshare") return;
    const newTime = Math.max(0, Math.min(duration, vid.currentTime + seconds));
    vid.currentTime = newTime;
    setCurrent(newTime);
    onSendSync({ type: "SEEK", timestamp: newTime });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrent(val);
    if (videoRef.current) videoRef.current.currentTime = val;
    onSendSync({ type: "SEEK", timestamp: val });
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (videoRef.current) videoRef.current.volume = val;
    if (screenRef.current) screenRef.current.volume = val;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
    if (screenRef.current) screenRef.current.muted = next;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;
  const volPct = muted ? 0 : volume * 100;

  const TYPE_LABELS: Record<string, string> = {
    sample: "Sample",
    cloudinary: "Cloud",
    url: "Stream",
    screenshare: "Screen Share",
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (playing) setShowOverlay(false); }}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/80 ring-1 ring-white/5"
    >
      {/* ── VIDEO ELEMENT ─────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {videoType === "screenshare" ? (
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted={isLocalShare}
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            onClick={togglePlay}
            onTimeUpdate={() => videoRef.current && setCurrent(videoRef.current.currentTime)}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onPlaying={() => {
              setBuffering(false);
              if (!playing) {
                // Triggered externally (e.g. media keys)
                setPlaying(true);
                onSendSync({ type: "PLAY", timestamp: videoRef.current?.currentTime });
              }
            }}
            onPause={() => {
              if (playing) {
                // Triggered externally (e.g. media keys)
                setPlaying(false);
                onSendSync({ type: "PAUSE", timestamp: videoRef.current?.currentTime });
              } else {
                setPlaying(false);
              }
            }}
            className="h-full w-full cursor-pointer object-contain"
          />
        )}

        {/* Buffering spinner */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-rose-500" />
          </div>
        )}

        {/* Screen share empty state */}
        {videoType === "screenshare" && !screenStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Waiting for screen share…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click <strong className="text-rose-400">Share Screen</strong> in the toolbar below
              </p>
            </div>
          </div>
        )}

        {/* ── TOP INFO BAR ──────────────────── */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 py-3 transition-all duration-300",
            showOverlay ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Film className="h-4 w-4 shrink-0 text-rose-400" />
            <span className="truncate text-sm font-semibold text-white">{videoTitle}</span>
            <Badge className="shrink-0 border-white/20 bg-black/50 text-[10px] text-white/70">
              {TYPE_LABELS[videoType] ?? videoType}
            </Badge>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={onStartScreenShare}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
            >
              <Monitor className="h-3.5 w-3.5" />
              Share Screen
            </button>
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
              Load Movie
            </button>
          </div>
        </div>

        {/* ── CENTER PLAY/PAUSE indicator ─── */}
        {!playing && !buffering && videoType !== "screenshare" && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600/80 shadow-2xl shadow-rose-500/50 backdrop-blur-sm transition-all hover:bg-rose-600 hover:scale-105">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* ── BOTTOM CONTROLS ─────────────────── */}
      <div
        className={cn(
          "flex flex-col gap-2.5 bg-gradient-to-t from-black via-black/95 to-transparent px-4 pb-3 pt-8 transition-all duration-300",
          showOverlay ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {/* Seek bar */}
        {videoType !== "screenshare" && (
          <div className="flex items-center gap-3">
            <span className="w-9 text-right text-[11px] font-mono text-white/60 tabular-nums">
              {formatTime(current)}
            </span>
            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={current}
                onChange={handleSeek}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #f43f5e ${progressPct}%, rgba(255,255,255,0.15) ${progressPct}%)`,
                }}
              />
            </div>
            <span className="w-9 text-[11px] font-mono text-white/60 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left: play controls + volume */}
          <div className="flex items-center gap-2">
            {videoType !== "screenshare" && (
              <>
                <button
                  onClick={() => skip(-10)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  title="Back 10s"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-700/50 transition-all hover:scale-105 hover:shadow-rose-600/60"
                >
                  {playing
                    ? <Pause className="h-4 w-4" />
                    : <Play className="h-4 w-4 ml-0.5" />}
                </button>

                <button
                  onClick={() => skip(10)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  title="Forward 10s"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Volume */}
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {muted || volume === 0
                  ? <VolumeX className="h-4 w-4 text-rose-400" />
                  : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="w-20"
                style={{
                  background: `linear-gradient(to right, #f43f5e ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`,
                }}
              />
            </div>
          </div>

          {/* Right: Fullscreen */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isFullscreen
                ? <Minimize className="h-4 w-4" />
                : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
