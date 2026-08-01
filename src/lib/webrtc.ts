"use client";

export interface SyncMessage {
  type:
    | "PLAY"
    | "PAUSE"
    | "SEEK"
    | "LOAD_VIDEO"
    | "CHAT_MESSAGE"
    | "REACTION"
    | "ICEBREAKER_QUESTION"
    | "USER_JOINED"
    | "PARTNER_STATE";
  timestamp?: number;
  videoUrl?: string;
  videoTitle?: string;
  videoType?: "url" | "cloudinary" | "screenshare" | "sample";
  message?: {
    id: string;
    sender: string;
    text: string;
    time: string;
    isSelf?: boolean;
  };
  emoji?: string;
  question?: string;
  senderName?: string;
}

export type WebRTCStateCallback = (event: string, data?: any) => void;

export class DateRoomSession {
  public roomCode: string;
  public isHost: boolean;
  public userName: string;

  private broadcastChannel: BroadcastChannel | null = null;
  private peerInstance: any = null;
  private dataConn: any = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private callbacks: Set<WebRTCStateCallback> = new Set();
  private destroyed = false;

  constructor(roomCode: string, userName: string, isHost: boolean) {
    this.roomCode = roomCode;
    this.userName = userName;
    this.isHost = isHost;

    // BroadcastChannel for same-browser/same-origin tabs (instant, no signaling server)
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel(`lovetheatre-${roomCode}`);
      this.broadcastChannel.onmessage = (e) => {
        if (!this.destroyed) this.notify("SYNC_MESSAGE", e.data);
      };
    }

    // PeerJS for cross-device real-time P2P
    this.initPeer();
  }

  private async initPeer() {
    if (typeof window === "undefined") return;
    try {
      const { Peer } = await import("peerjs");
      if (this.destroyed) return;

      // Two stable peer IDs per room: host and guest
      const myId = this.isHost
        ? `lovetheatre-${this.roomCode}-host`
        : `lovetheatre-${this.roomCode}-guest`;

      const peer = new Peer(myId, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      this.peerInstance = peer;

      peer.on("open", () => {
        if (this.destroyed) return;
        // Try to connect to the other side
        const remoteId = this.isHost
          ? `lovetheatre-${this.roomCode}-guest`
          : `lovetheatre-${this.roomCode}-host`;
        this.connectToPeer(remoteId);
      });

      // Accept incoming connections
      peer.on("connection", (conn: any) => {
        this.setupDataConn(conn);
      });

      peer.on("error", (err: any) => {
        // Peer IDs may already be taken — silently ignore "unavailable-id"
        if (err.type !== "unavailable-id") {
          console.warn("[PeerJS]", err.type, err.message);
        }
      });
    } catch (err) {
      console.warn("[PeerJS] Could not initialize:", err);
    }
  }

  private connectToPeer(remoteId: string) {
    if (!this.peerInstance || this.destroyed) return;
    const conn = this.peerInstance.connect(remoteId, { reliable: true });
    this.setupDataConn(conn);
  }

  private setupDataConn(conn: any) {
    if (this.destroyed) return;
    this.dataConn = conn;

    conn.on("open", () => {
      this.notify("PEER_CONNECTED");
    });

    conn.on("data", (msg: SyncMessage) => {
      if (!this.destroyed) this.notify("SYNC_MESSAGE", msg);
    });

    conn.on("close", () => {
      this.dataConn = null;
      this.notify("PEER_DISCONNECTED");
    });

    conn.on("error", (err: any) => {
      console.warn("[DataConn error]", err);
    });
  }

  public subscribe(cb: WebRTCStateCallback) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  private notify(event: string, data?: any) {
    this.callbacks.forEach((cb) => cb(event, data));
  }

  public async initMedia(
    videoEnabled = true,
    audioEnabled = true
  ): Promise<MediaStream | null> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return null;

    // Always request BOTH tracks — we enable/disable them via track.enabled.
    // If we request video:false we get no video track and can never enable it later.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });

      // Apply initial lobby state immediately
      stream.getVideoTracks().forEach((t) => { t.enabled = videoEnabled; });
      stream.getAudioTracks().forEach((t) => { t.enabled = audioEnabled; });

      this.localStream = stream;
      this.notify("LOCAL_STREAM", stream);
      return stream;
    } catch (videoErr) {
      // Camera may be denied — try audio only as fallback
      console.warn("[Media] Camera unavailable, trying audio-only:", videoErr);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach((t) => { t.enabled = audioEnabled; });
        this.localStream = audioStream;
        this.notify("LOCAL_STREAM", audioStream);
        return audioStream;
      } catch (audioErr) {
        console.warn("[Media] Audio also unavailable:", audioErr);
        this.notify("MEDIA_ERROR", audioErr);
        return null;
      }
    }
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    // If already sharing — stop it
    if (this.screenStream) {
      this.stopScreenShare();
      return null;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      console.warn("Screen sharing not supported");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } } as any,
        audio: true,
      });
      this.screenStream = stream;
      this.notify("SCREEN_STREAM", stream);

      // Auto-stop when user clicks "Stop sharing" in browser chrome
      stream.getVideoTracks()[0].onended = () => this.stopScreenShare();

      // Tell partner
      this.sendSyncMessage({
        type: "LOAD_VIDEO",
        videoType: "screenshare",
        videoTitle: `${this.userName}'s Screen`,
      });

      return stream;
    } catch (err: any) {
      // User cancelled — not a real error
      if (err.name !== "NotAllowedError") console.warn("[ScreenShare]", err);
      return null;
    }
  }

  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
      this.notify("SCREEN_STOPPED");
      // Tell partner screen sharing ended
      this.sendSyncMessage({
        type: "LOAD_VIDEO",
        videoType: "sample",
        videoTitle: "Romantic Movie",
      });
    }
  }

  public sendSyncMessage(msg: SyncMessage) {
    // Via BroadcastChannel (same-origin tabs)
    try {
      this.broadcastChannel?.postMessage(msg);
    } catch {}

    // Via PeerJS data channel (cross-device)
    try {
      if (this.dataConn?.open) {
        this.dataConn.send(msg);
      }
    } catch {}
  }

  public toggleAudio(enabled: boolean) {
    const tracks = this.localStream?.getAudioTracks() ?? [];
    tracks.forEach((t) => { t.enabled = enabled; });
    this.notify("LOCAL_AUDIO_TOGGLED", enabled);
  }

  public toggleVideo(enabled: boolean) {
    const tracks = this.localStream?.getVideoTracks() ?? [];
    tracks.forEach((t) => { t.enabled = enabled; });
    this.notify("LOCAL_VIDEO_TOGGLED", enabled);
  }

  public destroy() {
    this.destroyed = true;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.broadcastChannel?.close();
    this.dataConn?.close();
    this.peerInstance?.destroy();
    this.callbacks.clear();
  }
}
