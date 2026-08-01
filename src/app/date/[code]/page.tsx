"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart, Mic, MicOff, Video, VideoOff, Copy, Check, PhoneOff,
  Sparkles, Monitor, MonitorOff, ChevronRight, MessageSquare,
  X, Film, Users,
} from "lucide-react";
import { DateRoomSession, SyncMessage } from "@/lib/webrtc";
import { SAMPLE_ROMANTIC_MOVIES } from "@/lib/cloudinary";
import { SyncedPlayer } from "@/components/video/SyncedPlayer";
import { WebcamOverlay } from "@/components/video/WebcamOverlay";
import { CloudinaryModal } from "@/components/upload/CloudinaryModal";
import { LoveChat, ChatMessage } from "@/components/chat/LoveChat";
import { HeartParticles } from "@/components/effects/HeartParticles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type PanelMode = "none" | "chat" | "people";

/* ──────────────────────────────────────────────── */

export default function DateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params?.code as string) ?? "LOVE-DATE";

  /* ── Lobby ─────────────────────────────────── */
  const [inLobby, setInLobby] = useState(true);
  const [userName, setUserName] = useState("Sweetheart 💕");
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);

  /* ── Room ──────────────────────────────────── */
  const sessionRef = useRef<DateRoomSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [partnerStream, setPartnerStream] = useState<MediaStream | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerName, setPartnerName] = useState("Partner 💖");

  /* ── Video ─────────────────────────────────── */
  const [videoUrl, setVideoUrl] = useState(SAMPLE_ROMANTIC_MOVIES[0].videoUrl);
  const [videoTitle, setVideoTitle] = useState(SAMPLE_ROMANTIC_MOVIES[0].title);
  const [videoType, setVideoType] = useState<"url" | "cloudinary" | "screenshare" | "sample">("sample");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [incomingSync, setIncomingSync] = useState<SyncMessage | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  /* ── UI ────────────────────────────────────── */
  const [uploadOpen, setUploadOpen] = useState(false);
  const [panel, setPanel] = useState<PanelMode>("none");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [clock, setClock] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Controls auto-hide ─────────────────────── */
  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  /* ── Clock ─────────────────────────────────── */
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setClock(fmt());
    const id = setInterval(() => setClock(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  /* Lobby video ref — always in DOM, srcObject re-wired when stream or videoOn changes */
  useEffect(() => {
    const el = lobbyVideoRef.current;
    if (!el) return;
    if (lobbyStream && videoOn) {
      if (el.srcObject !== lobbyStream) el.srcObject = lobbyStream;
      el.play().catch(() => {});
    } else {
      // Don't null out srcObject — just disable the track via state
    }
  }, [lobbyStream, videoOn]);

  /* ── Lobby camera ───────────────────────────── */
  useEffect(() => {
    if (!inLobby) return;
    let s: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((stream) => { s = stream; setLobbyStream(stream); })
      .catch(() => {});
    return () => { s?.getTracks().forEach((t) => t.stop()); };
  }, [inLobby]);


  const fmtTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ── Emoji reactions ────────────────────────── */
  const spawnEmoji = useCallback((emoji: string) => {
    const id = Date.now() + Math.random();
    setFloatingEmojis((p) => [...p, { id, emoji, x: 15 + Math.random() * 70 }]);
    setTimeout(() => setFloatingEmojis((p) => p.filter((e) => e.id !== id)), 2500);
  }, []);

  /* ── Handle incoming sync messages ──────────── */
  const handleIncoming = useCallback(
    (msg: SyncMessage, sess?: DateRoomSession) => {
      const s = sess ?? sessionRef.current;
      switch (msg.type) {
        case "USER_JOINED":
          if (msg.senderName && msg.senderName !== userName) {
            setPartnerConnected(true);
            setPartnerName(msg.senderName);
            s?.sendSyncMessage({ type: "PARTNER_STATE", senderName: userName });
          }
          break;
        case "PARTNER_STATE":
          if (msg.senderName && msg.senderName !== userName) {
            setPartnerConnected(true);
            setPartnerName(msg.senderName);
          }
          break;
        case "LOAD_VIDEO":
          if (msg.videoUrl !== undefined) setVideoUrl(msg.videoUrl ?? "");
          if (msg.videoTitle !== undefined) setVideoTitle(msg.videoTitle ?? "");
          if (msg.videoType !== undefined) setVideoType(msg.videoType ?? "sample");
          break;
        case "CHAT_MESSAGE":
          if (msg.message) {
            const chatMsg = { ...msg.message, isSelf: msg.message.sender === userName };
            setMessages((p) => [...p, chatMsg]);
            setPanel((cur) => {
              if (cur !== "chat") setUnreadCount((n) => n + 1);
              return cur;
            });
          }
          break;
        case "REACTION":
          if (msg.emoji) spawnEmoji(msg.emoji);
          break;
        case "ICEBREAKER_QUESTION":
          if (msg.question) {
            setMessages((p) => [
              ...p,
              { id: `${Date.now()}`, sender: "💕 Prompt", text: `"${msg.question}"`, time: fmtTime(), isSelf: false },
            ]);
            setPanel((cur) => {
              if (cur !== "chat") setUnreadCount((n) => n + 1);
              return cur;
            });
          }
          break;
        case "PLAY":
        case "PAUSE":
        case "SEEK":
          setIncomingSync({ ...msg });
          break;
      }
    },
    [userName, spawnEmoji]
  );

  /* ── Join room ──────────────────────────────── */
  const handleJoin = async () => {
    // Stop lobby streams
    lobbyStream?.getTracks().forEach((t) => t.stop());
    setLobbyStream(null);
    setInLobby(false);

    const s = new DateRoomSession(roomCode, userName, true);
    sessionRef.current = s;

    s.subscribe((event, data) => {
      switch (event) {
        case "LOCAL_STREAM":
          setLocalStream(data);
          break;
        case "SCREEN_STREAM":
          setScreenStream(data);
          setIsScreenSharing(true);
          setVideoType("screenshare");
          setVideoTitle(`${userName}'s Screen`);
          break;
        case "SCREEN_STOPPED":
          setScreenStream(null);
          setIsScreenSharing(false);
          setVideoType("sample");
          setVideoUrl(SAMPLE_ROMANTIC_MOVIES[0].videoUrl);
          setVideoTitle(SAMPLE_ROMANTIC_MOVIES[0].title);
          break;
        case "SYNC_MESSAGE":
          handleIncoming(data, s);
          break;
        case "PARTNER_STREAM":
          setPartnerStream(data);
          break;
        case "PARTNER_SCREEN_STREAM":
          setScreenStream(data);
          break;
        case "PEER_CONNECTED":
          // Re-announce ourselves when peer connects
          s.sendSyncMessage({ type: "USER_JOINED", senderName: userName });
          break;
      }
    });

    const stream = await s.initMedia(videoOn, audioOn);
    if (stream) setLocalStream(stream);

    // Announce join via both channels
    s.sendSyncMessage({ type: "USER_JOINED", senderName: userName });
  };

  /* ── Session helpers ───────────────────────── */
  const sendSync = useCallback(
    (msg: SyncMessage) => sessionRef.current?.sendSyncMessage(msg),
    []
  );

  const sendMessage = useCallback(
    (text: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}`,
        sender: userName,
        text,
        time: fmtTime(),
        isSelf: true,
      };
      setMessages((p) => [...p, msg]);
      sendSync({ type: "CHAT_MESSAGE", message: msg });
    },
    [userName, sendSync]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      spawnEmoji(emoji);
      sendSync({ type: "REACTION", emoji });
    },
    [spawnEmoji, sendSync]
  );

  const sendIcebreaker = useCallback(
    (q: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}`,
        sender: `${userName} 💕`,
        text: q,
        time: fmtTime(),
        isSelf: true,
      };
      setMessages((p) => [...p, msg]);
      sendSync({ type: "ICEBREAKER_QUESTION", question: q, senderName: userName });
    },
    [userName, sendSync]
  );

  const selectVideo = useCallback(
    (url: string, title: string, type: "cloudinary" | "url" | "sample") => {
      setVideoUrl(url);
      setVideoTitle(title);
      setVideoType(type);
      sendSync({ type: "LOAD_VIDEO", videoUrl: url, videoTitle: title, videoType: type });
    },
    [sendSync]
  );

  const startOrStopScreenShare = useCallback(async () => {
    await sessionRef.current?.startScreenShare();
  }, []);

  const copyInvite = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }, []);

  const leaveDate = useCallback(() => {
    sessionRef.current?.destroy();
    router.push("/");
  }, [router]);

  /* ── Audio / Video toggles (functional updater = never stale) ─── */
  const toggleAudio = useCallback(() => {
    setAudioOn((prev) => {
      const next = !prev;
      sessionRef.current?.toggleAudio(next);
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoOn((prev) => {
      const next = !prev;
      sessionRef.current?.toggleVideo(next);
      return next;
    });
  }, []);

  const togglePanel = useCallback((p: PanelMode) => {
    setPanel((cur) => {
      const next = cur === p ? "none" : p;
      if (next === "chat") setUnreadCount(0);
      return next;
    });
  }, []);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
    };
  }, []);

  /* ════════════════════════════════════════════
     LOBBY VIEW
  ════════════════════════════════════════════ */
  if (inLobby) {
    return (
      <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background p-4">
        <HeartParticles />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-rose-700/10 blur-[100px]" />
        </div>

        <div className="glass-strong relative z-10 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl sm:max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="animate-heartbeat flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 shadow-lg shadow-rose-700/40">
                <Heart className="h-4 w-4 fill-white text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Date Lobby</p>
                <p className="font-mono text-[11px] text-muted-foreground">{roomCode}</p>
              </div>
            </div>
            <button
              onClick={copyInvite}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Camera preview — always keep <video> in DOM to avoid srcObject loss */}
          <div className="relative mx-4 mt-4 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
            {/* Video element — always mounted, visibility controlled by CSS */}
            <video
              ref={lobbyVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "-scale-x-100 absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
                lobbyStream && videoOn ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Avatar fallback — shown when camera is off or not yet started */}
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#18131a] transition-opacity duration-200",
              lobbyStream && videoOn ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <Avatar className="h-16 w-16 border border-white/15">
                <AvatarFallback className="bg-rose-500/20 text-xl font-bold text-rose-300">
                  {userName.replace(/\p{Emoji}/gu, "").trim().slice(0, 2).toUpperCase() || "💕"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                {videoOn ? "Starting camera…" : "Camera is off"}
              </p>
            </div>

            {/* Bottom controls overlay */}
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => {
                  const next = !audioOn;
                  setAudioOn(next);
                  lobbyStream?.getAudioTracks().forEach((t) => (t.enabled = next));
                }}
                className={cn("meet-btn", !audioOn && "muted")}
                title={audioOn ? "Mute" : "Unmute"}
              >
                {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  const next = !videoOn;
                  setVideoOn(next);
                  lobbyStream?.getVideoTracks().forEach((t) => (t.enabled = next));
                }}
                className={cn("meet-btn", !videoOn && "muted")}
                title={videoOn ? "Turn off camera" : "Turn on camera"}
              >
                {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Name + Join */}
          <div className="space-y-3 p-4">
            <div className="space-y-1">
              <Label htmlFor="lobby-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Date Name
              </Label>
              <Input
                id="lobby-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name…"
                className="border-white/15 bg-black/40 placeholder:text-muted-foreground/40 focus-visible:border-rose-500 focus-visible:ring-rose-500/30"
              />
            </div>
            <button
              onClick={handleJoin}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-700/40 transition-all hover:from-rose-500 hover:to-pink-500 hover:shadow-rose-600/60 active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4" />
              Join Cinema Date
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ════════════════════════════════════════════
     THEATER ROOM  —  Google Meet Style
  ════════════════════════════════════════════ */
  const chatOpen = panel === "chat";
  const peopleOpen = panel === "people";
  const sideOpen = chatOpen || peopleOpen;

  return (
    <main
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#0d0d14]"
      onMouseMove={bumpControls}
      onTouchStart={bumpControls}
    >
      {/* Floating emoji reactions */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <span
            key={item.id}
            style={{ left: `${item.x}%`, bottom: "80px" }}
            className="absolute animate-float-up text-5xl"
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* ── TOP BAR ───────────────────────────── */}
      <div
        className={cn(
          "z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-black/70 px-3 backdrop-blur-md transition-all duration-300 sm:px-4",
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-pink-600">
            <Heart className="h-4 w-4 fill-white text-white" />
          </div>
          <span className="hidden text-sm font-bold text-white sm:block">LoveTheater</span>
          <div className="mx-2 hidden h-4 w-px bg-white/20 sm:block" />
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="font-mono text-xs text-muted-foreground">{roomCode}</span>
            <button
              onClick={copyInvite}
              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Center: time + status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums text-white/60">{clock}</span>
          <div className="h-4 w-px bg-white/15" />
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            partnerConnected ? "bg-emerald-500/15 text-emerald-400" : "bg-white/8 text-white/50"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              partnerConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            )} />
            <span className="hidden sm:inline">
              {partnerConnected ? `${partnerName} connected 💕` : "Waiting for partner…"}
            </span>
            <span className="sm:hidden">
              {partnerConnected ? "Connected" : "Waiting…"}
            </span>
          </div>
        </div>

        {/* Right: leave */}
        <button
          onClick={leaveDate}
          className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-red-500 active:scale-95"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">End Date</span>
        </button>
      </div>

      {/* ── MAIN CONTENT ──────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* CENTER: Video + tiles */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">

          {/* Synced movie player */}
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
            <SyncedPlayer
              videoUrl={videoUrl}
              videoTitle={videoTitle}
              videoType={videoType}
              screenStream={screenStream}
              isLocalShare={isScreenSharing}
              onSendSync={sendSync}
              incomingSync={incomingSync}
              onOpenUploadModal={() => setUploadOpen(true)}
              onStartScreenShare={startOrStopScreenShare}
            />
          </div>

          {/* Participant tiles */}
          <div className="mt-2 flex shrink-0 items-end gap-2.5">
            {/* Self tile */}
            <div className="h-24 w-36 shrink-0 sm:h-28 sm:w-44">
              <WebcamOverlay
                stream={localStream}
                partnerName={userName}
                isSelf
                isAudioMuted={!audioOn}
                isVideoMuted={!videoOn}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
              />
            </div>

            {/* Partner tile */}
            <div className="h-24 w-36 shrink-0 sm:h-28 sm:w-44">
              <WebcamOverlay
                stream={partnerStream}
                partnerName={partnerName}
                isSelf={false}
              />
            </div>

            <div className="flex-1" />
          </div>
        </div>

        {/* SIDE PANEL (desktop) */}
        {sideOpen && (
          <div className="hidden w-[320px] shrink-0 flex-col border-l border-white/8 bg-black/60 backdrop-blur-md lg:flex xl:w-[360px]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="text-sm font-bold text-foreground">
                {chatOpen ? "Love Chat 💕" : "People"}
              </span>
              <button
                onClick={() => setPanel("none")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {chatOpen && (
                <LoveChat
                  messages={messages}
                  onSendMessage={sendMessage}
                  onSendReaction={sendReaction}
                  onSendIcebreaker={sendIcebreaker}
                />
              )}
              {peopleOpen && (
                <PeoplePanel
                  userName={userName}
                  partnerName={partnerName}
                  partnerConnected={partnerConnected}
                  audioOn={audioOn}
                  videoOn={videoOn}
                  copiedLink={copiedLink}
                  onCopyInvite={copyInvite}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROL BAR ──────────────────── */}
      <div
        className={cn(
          "z-30 flex h-20 shrink-0 items-center justify-center border-t border-white/8 bg-black/80 backdrop-blur-xl transition-all duration-300",
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        )}
      >
        {/* Left group: movie & screen (desktop) */}
        <div className="absolute left-3 hidden items-center gap-2 sm:flex sm:left-4">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/20"
          >
            <Film className="h-4 w-4" />
            <span className="hidden lg:inline">Movie Hub</span>
          </button>
          <button
            onClick={startOrStopScreenShare}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
              isScreenSharing
                ? "border-rose-500/60 bg-rose-500/20 text-rose-300"
                : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            )}
          >
            {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span className="hidden lg:inline">
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </span>
          </button>
        </div>

        {/* Center: primary controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mic */}
          <ControlBtn
            onClick={toggleAudio}
            active={!audioOn}
            icon={audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            label={audioOn ? "Mute" : "Unmute"}
            danger={!audioOn}
          />

          {/* Camera */}
          <ControlBtn
            onClick={toggleVideo}
            icon={videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            label={videoOn ? "Stop Video" : "Start Video"}
            danger={!videoOn}
          />

          {/* Screen share (mobile) */}
          <div className="sm:hidden">
            <ControlBtn
              onClick={startOrStopScreenShare}
              icon={isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              label="Screen"
              active={isScreenSharing}
            />
          </div>

          {/* Movie Hub (mobile) */}
          <div className="sm:hidden">
            <ControlBtn
              onClick={() => setUploadOpen(true)}
              icon={<Film className="h-5 w-5" />}
              label="Movies"
            />
          </div>

          {/* Leave — big red */}
          <button
            onClick={leaveDate}
            className="meet-btn danger !h-12 !w-14"
            title="Leave call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>

          {/* People */}
          <ControlBtn
            onClick={() => togglePanel("people")}
            icon={<Users className="h-5 w-5" />}
            label="People"
            active={peopleOpen}
          />

          {/* Chat */}
          <div className="relative">
            <ControlBtn
              onClick={() => togglePanel("chat")}
              icon={<MessageSquare className="h-5 w-5" />}
              label="Chat"
              active={chatOpen}
            />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Right: invite (desktop) */}
        <div className="absolute right-3 hidden sm:right-4 sm:flex">
          <button
            onClick={copyInvite}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Invite
          </button>
        </div>
      </div>

      {/* Mobile chat drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPanel("none")} />
          <div className="animate-slide-right absolute right-0 top-0 flex h-full w-full max-w-xs flex-col border-l border-white/10 bg-[#0d0d14] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="text-sm font-bold text-foreground">Love Chat 💕</span>
              <button onClick={() => setPanel("none")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <LoveChat messages={messages} onSendMessage={sendMessage} onSendReaction={sendReaction} onSendIcebreaker={sendIcebreaker} />
            </div>
          </div>
        </div>
      )}

      {/* Movie picker */}
      <CloudinaryModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSelectVideo={selectVideo}
      />
    </main>
  );
}

/* ── Reusable Control Button ──────────────────── */
function ControlBtn({
  onClick,
  icon,
  label,
  active = false,
  danger = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={onClick}
        className={cn("meet-btn", active && !danger && "active", danger && "muted")}
        title={label}
      >
        {icon}
      </button>
      <span className="hidden text-[9px] text-white/40 sm:block">{label}</span>
    </div>
  );
}

/* ── People Panel ─────────────────────────────── */
function PeoplePanel({
  userName, partnerName, partnerConnected, audioOn, videoOn, copiedLink, onCopyInvite,
}: {
  userName: string;
  partnerName: string;
  partnerConnected: boolean;
  audioOn: boolean;
  videoOn: boolean;
  copiedLink: boolean;
  onCopyInvite: () => void;
}) {
  const selfInitials = userName.replace(/\p{Emoji}/gu, "").trim().slice(0, 2).toUpperCase() || "ME";
  const partnerInitials = partnerConnected
    ? partnerName.replace(/\p{Emoji}/gu, "").trim().slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="overflow-y-auto p-4 space-y-2">
      {/* Self */}
      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/20 text-sm font-bold text-rose-300">
          {selfInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">You (Host)</p>
        </div>
        <div className="flex items-center gap-1">
          {!audioOn && <MicOff className="h-3.5 w-3.5 text-red-400" />}
          {!videoOn && <VideoOff className="h-3.5 w-3.5 text-red-400" />}
        </div>
      </div>

      {/* Partner */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5",
        partnerConnected ? "bg-white/5" : "bg-white/3 opacity-60"
      )}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-bold text-muted-foreground">
          {partnerInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {partnerConnected ? partnerName : "Waiting for partner…"}
          </p>
          <p className="text-xs text-muted-foreground">
            {partnerConnected ? "Connected 💕" : "Not yet joined"}
          </p>
        </div>
        {partnerConnected && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
      </div>

      {/* Invite prompt */}
      {!partnerConnected && (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-center">
          <p className="mb-3 text-xs text-muted-foreground">
            Share this link with your partner to invite them:
          </p>
          <button
            onClick={onCopyInvite}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/20 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-600/30"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedLink ? "Link Copied!" : "Copy Invite Link"}
          </button>
        </div>
      )}
    </div>
  );
}
