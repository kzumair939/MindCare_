import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { getWsUrl } from "../api/axios";

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
  const [layout, setLayout] = useState("split"); // split | focus-remote | focus-local
  const [hasLeft, setHasLeft] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const localVideoRef  = useRef();
  const remoteVideoRef = useRef();
  const pcRef          = useRef();
  const wsRef          = useRef();
  const streamRef      = useRef();
  const typingTimer    = useRef();
  const timerRef       = useRef();
  const bottomRef      = useRef();

  const isTherapist = user?.role === "ROLE_THERAPIST";

  useEffect(() => {
    api.get(`/session/${id}`).then(r => setSession(r.data)).catch(()=>{});
    api.get(`/session/${id}/messages`).catch(()=>({data:[]})).then(r => setMessages(r.data||[]));
  }, [id]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // WebRTC setup
  useEffect(() => {
    if (hasLeft) return;

    let cancelled = false;
    const iceQueue = [];
    async function setup() {
      let stream = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
          streamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        }
      } catch(err) {
        console.warn("Camera/mic access denied or unavailable, connecting as chat/receive-only:", err);
      }

      try {
        const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
        pcRef.current = pc;
        if (stream) {
          stream.getTracks().forEach(t => pc.addTrack(t, stream));
        }

        pc.ontrack = e => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          setConnected(true);
        };

        const token = localStorage.getItem("mc_token");
        const ws = new WebSocket(getWsUrl(`/ws/session/${id}?token=${token}`));
        wsRef.current = ws;

        ws.onopen = async () => {
          console.log("WebSocket connection open");
        };

        ws.onmessage = async (e) => {
          const data = JSON.parse(e.data);
          if (data.type === "peer-joined") {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
            } catch (err) {
              console.error("Error creating offer:", err);
            }
          } else if (data.type === "offer") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: "answer", sdp: pc.localDescription }));
              while (iceQueue.length > 0) {
                const cand = iceQueue.shift();
                await pc.addIceCandidate(cand).catch(()=>{});
              }
            } catch (err) {
              console.error("Error handling offer:", err);
            }
          } else if (data.type === "answer") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              while (iceQueue.length > 0) {
                const cand = iceQueue.shift();
                await pc.addIceCandidate(cand).catch(()=>{});
              }
            } catch (err) {
              console.error("Error handling answer:", err);
            }
          } else if (data.type === "ice") {
            const candidate = new RTCIceCandidate(data.candidate);
            if (pc.remoteDescription) {
              await pc.addIceCandidate(candidate).catch(()=>{});
            } else {
              iceQueue.push(candidate);
            }
          } else if (data.type === "peer-left") {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setConnected(false);
          } else if (data.type === "chat") {
            setMessages(prev => [...prev, { ...data.message, mine: false }]);
          } else if (data.type === "typing") {
            setTyping(data.isTyping);
          }
        };

        pc.onicecandidate = e => {
          if (e.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type:"ice", candidate: e.candidate }));
          }
        };
      } catch(err) {
        console.error("Failed to setup session signaling connection:", err);
      }
    }
    setup();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      wsRef.current?.close();
    };
  }, [id, hasLeft]);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, typing]);

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
    const content = text.trim(); if (!content) return;
    setText("");
    const msg = { sender: user?.displayName||user?.username||"You", content, ts: new Date().toISOString(), mine:true };
    setMessages(prev => [...prev, msg]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type:"chat", message:msg }));
    }
  }

  function handleChatKey(e) {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  }

  function handleTyping(e) {
    setText(e.target.value);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type:"typing", isTyping:true }));
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(()=>{
        wsRef.current?.send(JSON.stringify({ type:"typing", isTyping:false }));
      }, 1500);
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

  function formatElapsed(s) {
    const m = Math.floor(s/60); const sec = s%60;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }

  function formatTime(ts) {
    return ts ? new Date(ts).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : "";
  }

  if (hasLeft) {
    return (
      <div className="mc-session-ended-screen">
        <div className="mc-session-ended-card">
          <div className="mc-session-ended-icon">
            <i className="bi bi-telephone-x-fill" />
          </div>
          <h2>Call Disconnected</h2>
          <p>You have left the video session call.</p>
          
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

  return (
    <div className="mc-session-page">
      {/* Top bar */}
      <div className="mc-session-topbar">
        <div className="mc-session-topbar-left">
          <i className="bi bi-heart-pulse-fill mc-brand-mark"/>
          <span className="mc-session-room-name">
            {session ? `Session with ${isTherapist ? session.userName : session.therapistName}` : "Connecting…"}
          </span>
        </div>
        <div className="mc-session-topbar-center">
          <div className={`mc-session-status-dot ${connected?"connected":""}`}/>
          <span className="mc-session-timer">{formatElapsed(elapsed)}</span>
          {connected && <span className="mc-session-connected-badge">Connected</span>}
        </div>
        <div className="mc-session-topbar-right">
          <button className="mc-session-layout-btn" onClick={()=>setLayout(l => l==="split"?"focus-remote":"split")} title="Toggle layout">
            <i className={`bi bi-${layout==="split"?"fullscreen":"fullscreen-exit"}`}/>
          </button>
        </div>
      </div>

      <div className="mc-session-body">
        {/* Video area */}
        <div className={`mc-video-area mc-layout-${layout}`}>
          {/* Remote video */}
          <div className="mc-video-tile mc-remote-tile">
            <video ref={remoteVideoRef} autoPlay playsInline className="mc-video-el"/>
            {!connected && (
              <div className="mc-video-waiting">
                <div className="mc-waiting-avatar">
                  <i className="bi bi-person-circle"/>
                </div>
                <div className="mc-waiting-pulse"/>
                <p>Waiting for {isTherapist ? "patient" : "therapist"} to join…</p>
              </div>
            )}
            <div className="mc-video-label mc-remote-label">
              {session ? (isTherapist ? session.userName : session.therapistName) : "Remote"}
            </div>
          </div>

          {/* Local video (PiP) */}
          <div className="mc-video-tile mc-local-tile">
            <video ref={localVideoRef} autoPlay playsInline muted className="mc-video-el"/>
            {!camOn && (
              <div className="mc-cam-off">
                <i className="bi bi-camera-video-off-fill"/>
              </div>
            )}
            <div className="mc-video-label mc-local-label">You</div>
          </div>

          {/* Controls */}
          <div className="mc-video-controls">
            <button className={`mc-ctrl-btn mc-ctrl-media${micOn?"":" off"}`} onClick={toggleMic} title={micOn?"Mute":"Unmute"}>
              <i className={`bi bi-mic${micOn?"":"-mute"}-fill`}/>
              <span>{micOn?"Mute":"Unmute"}</span>
            </button>
            <button className={`mc-ctrl-btn mc-ctrl-media${camOn?"":" off"}`} onClick={toggleCam} title={camOn?"Stop Camera":"Start Camera"}>
              <i className={`bi bi-camera-video${camOn?"":"-off"}-fill`}/>
              <span>{camOn?"Camera":"No Cam"}</span>
            </button>
            <button className="mc-ctrl-btn mc-ctrl-end" onClick={() => setShowConfirmLeave(true)} disabled={ending}>
              {ending ? <span className="spinner-border spinner-border-sm"/> : <i className="bi bi-telephone-x-fill"/>}
              <span>End</span>
            </button>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="mc-session-chat">
          <div className="mc-session-chat-header">
            <i className="bi bi-chat-dots me-2"/>Session Chat
          </div>

          <div className="mc-session-chat-messages">
            {messages.length === 0 && (
              <div className="mc-chat-empty">
                <i className="bi bi-chat-heart"/>
                <p>Chat with your {isTherapist?"patient":"therapist"} here</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mc-session-msg${m.mine?" mine":""}`}>
                {!m.mine && <div className="mc-session-msg-sender">{m.sender||"Therapist"}</div>}
                <div className="mc-session-msg-bubble">{m.content}</div>
                <div className="mc-session-msg-time">{formatTime(m.ts||m.createdAt)}</div>
              </div>
            ))}
            {typing && (
              <div className="mc-typing-indicator">
                <div className="mc-typing-bubble">
                  <span className="mc-typing-dot"/><span className="mc-typing-dot"/><span className="mc-typing-dot"/>
                </div>
                <span className="mc-typing-label">typing…</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="mc-session-chat-input">
            <textarea
              className="mc-chat-textarea"
              placeholder="Send a message…"
              value={text}
              onChange={handleTyping}
              onKeyDown={handleChatKey}
              rows={1}
            />
            <button className="mc-chat-send-btn" onClick={sendChat} disabled={!text.trim()}>
              <i className="bi bi-send-fill"/>
            </button>
          </div>
        </div>
      </div>

      {/* Session info strip */}
      {session && (
        <div className="mc-session-info-strip">
          <span><i className="bi bi-calendar3 me-1"/>{session.sessionDate}</span>
          <span><i className="bi bi-clock me-1"/>{session.sessionTime}</span>
          <span><i className="bi bi-heart-pulse me-1"/>{session.therapyType?.replace(/_/g," ")||"Session"}</span>
          <span className={`mc-status mc-status-${session.status?.toLowerCase()||"confirmed"}`}>{session.status}</span>
        </div>
      )}

      {/* Leave confirmation modal */}
      {showConfirmLeave && (
        <div className="mc-modal-overlay" onClick={() => setShowConfirmLeave(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mc-modal-header">
              <i className="bi bi-telephone-x-fill mc-modal-icon" style={{ color: "#ef4444" }}/>
              <div>
                <h3>Disconnect Call</h3>
                <p>Are you sure you want to end and leave this video call? You can rejoin as long as the session slot is active.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowConfirmLeave(false)}><i className="bi bi-x-lg"/></button>
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
