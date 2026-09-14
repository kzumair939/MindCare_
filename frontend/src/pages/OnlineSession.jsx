import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { getWsUrl } from "../api/axios";
import "../styles/session-call.css";

export default function OnlineSession() {
  const { sessionId: id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);
  const [hasLeft, setHasLeft] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const TOTAL_SESSION_SECONDS = 60 * 60;
  const timerStartKey = `mindcare_session_timer_start_${id}`;
  
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const savedStart = localStorage.getItem(timerStartKey);
    if (savedStart) {
      const passed = Math.floor((Date.now() - parseInt(savedStart, 10)) / 1000);
      return Math.max(0, TOTAL_SESSION_SECONDS - passed);
    }
    return TOTAL_SESSION_SECONDS;
  });

  const [pipPos, setPipPos] = useState({ x: null, y: null });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [activeDrawer, setActiveDrawer] = useState(null);

  const notesStorageKey = `mindcare_notes_${id}_${user?.username || "user"}`;
  const [privateNotes, setPrivateNotes] = useState(() => {
    return localStorage.getItem(notesStorageKey) || "";
  });
  const [notesSaveStatus, setNotesSaveStatus] = useState("Saved");

  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const localPipVideoRef  = useRef(null);
  const remotePipVideoRef = useRef(null);
  const pcRef             = useRef(null);
  const wsRef             = useRef(null);
  const streamRef         = useRef(null);
  const remoteStreamRef   = useRef(null);
  const typingTimer       = useRef(null);
  const bottomRef         = useRef(null);
  const saveTimeoutRef    = useRef(null);

  const isTherapist = user?.role === "ROLE_THERAPIST";

  useEffect(() => {
    api.get(`/session/${id}`).then(r => setSession(r.data)).catch(() => {});
    api.get(`/session/${id}/messages`).catch(() => ({ data: [] })).then(r => setMessages(r.data || []));
  }, [id]);

  useEffect(() => {
    if (!connected) return;

    if (!localStorage.getItem(timerStartKey)) {
      localStorage.setItem(timerStartKey, Date.now().toString());
    }

    const tick = () => {
      const startTs = parseInt(localStorage.getItem(timerStartKey) || Date.now().toString(), 10);
      const passed = Math.floor((Date.now() - startTs) / 1000);
      const left = Math.max(0, TOTAL_SESSION_SECONDS - passed);
      setRemainingSeconds(left);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [connected, id, timerStartKey]);

  function handlePipPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePipPointerMove(e) {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    const maxX = window.innerWidth - 130;
    const maxY = window.innerHeight - 175;
    const clampedX = Math.max(8, Math.min(newX, maxX));
    const clampedY = Math.max(54, Math.min(newY, maxY));

    setPipPos({ x: clampedX, y: clampedY });
  }

  function handlePipPointerUp(e) {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  useEffect(() => {
    if (streamRef.current) {
      if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
      if (localPipVideoRef.current) localPipVideoRef.current.srcObject = streamRef.current;
    }
    if (remoteStreamRef.current) {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
      if (remotePipVideoRef.current) remotePipVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [activeDrawer, connected]);

  function handleNotesChange(e) {
    const val = e.target.value;
    setPrivateNotes(val);
    setNotesSaveStatus("Saving...");
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(notesStorageKey, val);
      setNotesSaveStatus("Saved privately");
    }, 600);
  }

  useEffect(() => {
    if (hasLeft) return;

    let isDisposed = false;
    const iceQueue = [];

    async function initCall() {
      let localStream = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
          streamRef.current = localStream;
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
          if (localPipVideoRef.current) localPipVideoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.warn("Camera/mic access unavailable, continuing in receive-only mode:", err);
      }

      if (isDisposed) return;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      pcRef.current = pc;

      if (localStream) {
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
      } else {
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
      }

      pc.ontrack = (event) => {
        if (event.streams?.[0]) {
          remoteStreamRef.current = event.streams[0];
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          if (remotePipVideoRef.current) remotePipVideoRef.current.srcObject = event.streams[0];
        }
        setConnected(true);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnected(true);
        } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          setConnected(false);
        }
      };

      const token = localStorage.getItem("mc_token");
      const ws = new WebSocket(getWsUrl(`/ws/session/${id}?token=${token}`));
      wsRef.current = ws;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
        }
      };

      async function createOffer() {
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          await pc.setLocalDescription(offer);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
          }
        } catch (e) {
          console.error("Error creating WebRTC offer:", e);
        }
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "peer-ready" }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "peer-joined" || data.type === "peer-ready") {
            await createOffer();
          } else if (data.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "answer", sdp: pc.localDescription }));
            }
            while (iceQueue.length > 0) {
              const cand = iceQueue.shift();
              await pc.addIceCandidate(cand).catch(console.warn);
            }
            setConnected(true);
          } else if (data.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            while (iceQueue.length > 0) {
              const cand = iceQueue.shift();
              await pc.addIceCandidate(cand).catch(console.warn);
            }
            setConnected(true);
          } else if (data.type === "ice") {
            const candidate = new RTCIceCandidate(data.candidate);
            if (pc.remoteDescription?.type) {
              await pc.addIceCandidate(candidate).catch(console.warn);
            } else {
              iceQueue.push(candidate);
            }
          } else if (data.type === "peer-left") {
            remoteStreamRef.current = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            if (remotePipVideoRef.current) remotePipVideoRef.current.srcObject = null;
            setConnected(false);
          } else if (data.type === "chat") {
            setMessages(prev => [...prev, { ...data.message, mine: false }]);
            if (activeDrawer !== "chat") {
              setUnreadCount(c => c + 1);
            }
          } else if (data.type === "typing") {
            setTyping(data.isTyping);
          }
        } catch (err) {
          console.error("Signaling payload error:", err);
        }
      };
    }

    initCall();

    return () => {
      isDisposed = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      wsRef.current?.close();
    };
  }, [id, hasLeft]);

  // Keep chat scrolled to recent messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, activeDrawer]);

  function toggleMic() {
    const enabled = !micOn;
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setMicOn(enabled);
  }

  function toggleCam() {
    const enabled = !camOn;
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setCamOn(enabled);
  }

  async function sendChat(e) {
    e?.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    const msg = {
      sender: user?.displayName || user?.username || "You",
      content,
      ts: new Date().toISOString(),
      mine: true
    };
    setMessages(prev => [...prev, msg]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat", message: msg }));
    }
  }

  function handleChatKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  function handleTyping(e) {
    setText(e.target.value);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", isTyping: true }));
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: "typing", isTyping: false }));
      }, 1500);
    }
  }

  function toggleDrawer(tab) {
    if (activeDrawer === tab) {
      setActiveDrawer(null);
    } else {
      setActiveDrawer(tab);
      if (tab === "chat") setUnreadCount(0);
    }
  }

  function leaveCall() {
    setShowConfirmLeave(false);
    setHasLeft(true);
    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    wsRef.current?.close();
    setConnected(false);
  }

  function formatCountdown(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const sec = totalSecs % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function formatTime(ts) {
    return ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  }

  if (hasLeft) {
    return (
      <div className="mc-session-ended-screen">
        <div className="mc-session-ended-card">
          <div className="mc-session-ended-icon">
            <i className="bi bi-telephone-x-fill" />
          </div>
          <h2>Session Disconnected</h2>
          <p>You have left the live video session.</p>
          
          <div className="mc-session-ended-actions">
            <button className="mc-btn-primary" onClick={() => setHasLeft(false)}>
              <i className="bi bi-arrow-clockwise" /> Rejoin Call
            </button>
            
            {isTherapist ? (
              <button 
                className="mc-btn-confirm" 
                onClick={async () => {
                  setEnding(true);
                  try {
                    await api.put(`/session/${id}/end`);
                    nav(`/therapist/sessions/${id}/report`);
                  } catch {
                    nav("/therapist/sessions");
                  }
                }}
                disabled={ending}
                style={{ background: "var(--mc-primary)", color: "white", border: "none" }}
              >
                {ending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-file-earmark-medical me-1" />}
                Complete & Write Report
              </button>
            ) : (
              <button className="mc-btn-cancel-outline" onClick={() => nav("/my-sessions")}>
                <i className="bi bi-box-arrow-right" /> Back to My Sessions
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const peerDisplayName = session ? (isTherapist ? session.userName : session.therapistName) : (isTherapist ? "Patient" : "Therapist");

  return (
    <div className="mc-session-page">
      <header className="mc-session-topbar">
        <div className="mc-session-topbar-left">
          <i className="bi bi-heart-pulse-fill mc-brand-mark" />
          <div className="mc-session-title-wrap">
            <span className="mc-session-room-name">
              {session ? `Session with ${peerDisplayName}` : "Connecting session…"}
            </span>
            <div className="mc-session-status-sub">
              <span className={`mc-session-status-dot ${connected ? "connected" : ""}`} />
              <span className="mc-session-status-text">
                {connected ? "Live Session" : "Waiting for peer…"}
              </span>
            </div>
          </div>
        </div>

        <div className="mc-session-topbar-center">
          <span className="mc-session-timer">{formatCountdown(remainingSeconds)}</span>
          {connected && (
            <span className="mc-session-connected-badge">
              <i className="bi bi-shield-check" /> Connected
            </span>
          )}
        </div>

        <div className="mc-session-topbar-right">
          <button
            className={`mc-topbar-action-btn ${activeDrawer === "chat" ? "active" : ""}`}
            onClick={() => toggleDrawer("chat")}
            title="Toggle Live Chat"
          >
            <i className="bi bi-chat-dots-fill" />
            <span className="d-none d-sm-inline">Chat</span>
            {unreadCount > 0 && <span className="mc-pill-badge">{unreadCount}</span>}
          </button>

          <button
            className={`mc-topbar-action-btn ${activeDrawer === "notes" ? "active" : ""}`}
            onClick={() => toggleDrawer("notes")}
            title="Toggle Private Notes"
          >
            <i className="bi bi-journal-text" />
            <span className="d-none d-sm-inline">Notes</span>
          </button>
        </div>
      </header>

      <main className={`mc-session-stage ${activeDrawer ? "drawer-open" : ""}`}>
        <div className="mc-remote-video-container">
          <video ref={remoteVideoRef} autoPlay playsInline className="mc-remote-video-el" />

          {!connected && (
            <div className="mc-video-waiting-screen">
              <div className="mc-waiting-avatar-ring">
                <i className="bi bi-person-circle" />
                <div className="mc-waiting-glow-pulse" />
              </div>
              <h3>Waiting for {isTherapist ? "patient" : "therapist"} to connect</h3>
              <p>The live video will appear automatically once both participants are in the room.</p>
            </div>
          )}

          <div className="mc-participant-badge">
            <i className="bi bi-person-fill" />
            <span>{peerDisplayName}</span>
          </div>
        </div>

        <div className={`mc-local-pip-box ${activeDrawer ? "drawer-active" : ""}`}>
          <video ref={localVideoRef} autoPlay playsInline muted className="mc-local-video-el" />
          {!camOn && (
            <div className="mc-local-cam-disabled">
              <i className="bi bi-camera-video-off-fill" />
            </div>
          )}
          <div className="mc-local-pip-tag">
            <span className="mc-live-indicator-dot" />
            <span>You</span>
          </div>
        </div>

        {activeDrawer && (
          <div
            className="mc-call-pip-float-wrapper mc-pip-draggable"
            style={
              pipPos.x !== null && pipPos.y !== null
                ? {
                    left: `${pipPos.x}px`,
                    top: `${pipPos.y}px`,
                    right: "auto",
                    bottom: "auto",
                    touchAction: "none",
                  }
                : { touchAction: "none" }
            }
            onPointerDown={handlePipPointerDown}
            onPointerMove={handlePipPointerMove}
            onPointerUp={handlePipPointerUp}
            onPointerCancel={handlePipPointerUp}
          >
            <video ref={remotePipVideoRef} autoPlay playsInline className="mc-pip-remote-feed" />
            
            {!connected && (
              <div className="mc-pip-waiting-hint">
                <i className="bi bi-person-video" />
                <span>Waiting for {peerDisplayName}...</span>
              </div>
            )}

            <div className="mc-pip-header-tag">
              <i className="bi bi-arrows-move me-1" />
              <span>{peerDisplayName}</span>
            </div>

            <div className="mc-pip-local-inset">
              <video ref={localPipVideoRef} autoPlay playsInline muted />
            </div>
          </div>
        )}

        <aside className={`mc-side-panel-drawer ${activeDrawer ? "expanded" : "collapsed"}`}>
          <div className="mc-drawer-header">
            <div className="mc-drawer-tabs">
              <button
                className={`mc-drawer-tab-btn ${activeDrawer === "chat" ? "active" : ""}`}
                onClick={() => { setActiveDrawer("chat"); setUnreadCount(0); }}
              >
                <i className="bi bi-chat-dots-fill" /> Chat
                {unreadCount > 0 && <span className="mc-pill-badge ms-1">{unreadCount}</span>}
              </button>
              <button
                className={`mc-drawer-tab-btn ${activeDrawer === "notes" ? "active" : ""}`}
                onClick={() => setActiveDrawer("notes")}
              >
                <i className="bi bi-journal-text" /> Private Notes
              </button>
            </div>
            <button
              className="mc-drawer-close-btn"
              onClick={() => setActiveDrawer(null)}
              title="Close Panel and Return to Fullscreen Video"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {activeDrawer === "chat" && (
            <div className="mc-drawer-chat-body">
              <div className="mc-chat-messages-container">
                {messages.length === 0 ? (
                  <div className="mc-chat-empty-state">
                    <i className="bi bi-chat-square-heart-fill" />
                    <p>Encrypted live chat with {peerDisplayName}</p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div key={idx} className={`mc-chat-bubble-wrap ${m.mine ? "mine" : ""}`}>
                      {!m.mine && <div className="mc-chat-sender-name">{m.sender || peerDisplayName}</div>}
                      <div className="mc-chat-bubble">{m.content}</div>
                      <div className="mc-chat-timestamp">{formatTime(m.ts || m.createdAt)}</div>
                    </div>
                  ))
                )}
                {typing && (
                  <div className="mc-typing-indicator-row">
                    <div className="mc-typing-dots">
                      <span className="mc-typing-dot" />
                      <span className="mc-typing-dot" />
                      <span className="mc-typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="mc-drawer-chat-input-bar">
                <textarea
                  className="mc-chat-compose-textarea"
                  placeholder="Type a message..."
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={handleChatKey}
                  rows={1}
                />
                <button
                  className="mc-chat-send-action-btn"
                  onClick={sendChat}
                  disabled={!text.trim()}
                  title="Send message"
                >
                  <i className="bi bi-send-fill" />
                </button>
              </div>
            </div>
          )}

          {activeDrawer === "notes" && (
            <div className="mc-drawer-notes-body">
              <div className="mc-notes-banner">
                <div className="mc-notes-banner-left">
                  <i className="bi bi-shield-lock-fill" />
                  <span>Private Session Notes</span>
                </div>
                <span className="mc-notes-status-saved">{notesSaveStatus}</span>
              </div>
              <textarea
                className="mc-notes-editor-textarea"
                placeholder={isTherapist ? "Write private clinical observations, session goals, or patient notes here..." : "Write your personal thoughts, reflections, or questions for this session..."}
                value={privateNotes}
                onChange={handleNotesChange}
              />
              <div className="mc-notes-footer-hint">
                <i className="bi bi-info-circle me-1" />
                These notes are encrypted & visible only to your account.
              </div>
            </div>
          )}
        </aside>

        <div className="mc-call-controls-dock">
          <button
            className={`mc-dock-btn ${micOn ? "" : "off-state"}`}
            onClick={toggleMic}
            title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            <i className={`bi bi-mic${micOn ? "" : "-mute"}-fill`} />
            <span>{micOn ? "Mute" : "Unmute"}</span>
          </button>

          <button
            className={`mc-dock-btn ${camOn ? "" : "off-state"}`}
            onClick={toggleCam}
            title={camOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            <i className={`bi bi-camera-video${camOn ? "" : "-off"}-fill`} />
            <span>{camOn ? "Camera" : "Cam Off"}</span>
          </button>

          <button
            className={`mc-dock-btn ${activeDrawer === "chat" ? "active-tab" : ""}`}
            onClick={() => toggleDrawer("chat")}
            title="Open Live Chat"
          >
            <i className="bi bi-chat-dots-fill" />
            <span>Chat</span>
            {unreadCount > 0 && <span className="mc-dock-badge">{unreadCount}</span>}
          </button>

          <button
            className={`mc-dock-btn ${activeDrawer === "notes" ? "active-tab" : ""}`}
            onClick={() => toggleDrawer("notes")}
            title="Open Private Notes"
          >
            <i className="bi bi-journal-text" />
            <span>Notes</span>
          </button>

          <button
            className="mc-dock-btn danger-end"
            onClick={() => setShowConfirmLeave(true)}
            disabled={ending}
            title="Disconnect Call"
          >
            {ending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-telephone-x-fill" />}
            <span>End</span>
          </button>
        </div>
      </main>

      {showConfirmLeave && (
        <div className="mc-modal-overlay" onClick={() => setShowConfirmLeave(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mc-modal-header">
              <i className="bi bi-telephone-x-fill mc-modal-icon" style={{ color: "#ef4444" }} />
              <div>
                <h3>Disconnect Call</h3>
                <p>Are you sure you want to end this live session? You can rejoin as long as your session slot is active.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowConfirmLeave(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="mc-logout-modal-actions mt-3">
              <button className="mc-btn-cancel-outline" onClick={() => setShowConfirmLeave(false)}>Cancel</button>
              <button className="mc-btn-logout-confirm" onClick={leaveCall} style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}>
                Leave Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
