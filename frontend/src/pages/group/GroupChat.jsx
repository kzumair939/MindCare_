import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api, { getWsUrl } from "../../api/axios";

export default function GroupChat() {
  const { roomId } = useParams(); // FIXED: was { id }
  const { user, unreadGroups, setUnreadGroups } = useAuth();
  const nav = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState([]);
  const [anon, setAnon] = useState(user?.anonymousMode || false);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(1);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [reportModal, setReportModal] = useState(null); // { msgId, content }
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [invitingId, setInvitingId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const bottomRef = useRef();
  const inputRef = useRef();
  const typingTimer = useRef();
  const wsRef = useRef(null);
  const fileInputRef = useRef(null);

  const isCreator = room?.createdByUsername === user?.username;

  const displayName = anon
    ? "Anonymous"
    : user?.displayName || user?.username || "You";

  // Clear unread room state when viewing
  useEffect(() => {
    if (roomId && setUnreadGroups) {
      setUnreadGroups(prev => prev.filter(id => String(id) !== String(roomId)));
    }
  }, [roomId, setUnreadGroups]);

  // Load room + check membership + load messages + load members
  useEffect(() => {
    if (!roomId) return;
    api.get(`/group/rooms/${roomId}`)
      .then(r => {
        setRoom(r.data);
      })
      .catch(() => {});

    api.get(`/group/rooms/${roomId}/messages`)
      .then(r => {
        setMessages(r.data || []);
        setJoined(true);
      })
      .catch(err => {
        if (err.response?.status === 403) {
          setJoined(false);
        }
      });

    // Always fetch members for mention autocomplete
    api.get(`/group/${roomId}/members`)
      .then(r => setMembers(r.data || []))
      .catch(() => {});
  }, [roomId]);

  // Load members when panel opens
  useEffect(() => {
    if (showMembers && roomId) {
      api.get(`/group/${roomId}/members`).then(r => setMembers(r.data || [])).catch(() => {});
    }
  }, [showMembers, roomId]);

  // WebSocket connection
  useEffect(() => {
    if (!roomId || !joined) return;
    const token = localStorage.getItem("mc_token");
    const ws = new WebSocket(getWsUrl(`/ws/group/${roomId}?token=${token}`));
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "MESSAGE") {
          setMessages(prev => {
            const existingIdx = prev.findIndex(m => m.id === data.payload.id);
            if (existingIdx !== -1) {
              // Message already exists (added via HTTP response) — update mine flag
              // in case the WS broadcast has a different/correct value
              const existing = prev[existingIdx];
              if (existing.mine !== data.payload.mine) {
                const updated = [...prev];
                updated[existingIdx] = { ...existing, mine: data.payload.mine };
                return updated;
              }
              return prev;
            }

            // Replace optimistic message if WS broadcast arrives before HTTP response
            const isMineMsg = data.payload.mine === true || data.payload.senderUsername === user?.username;
            if (isMineMsg) {
              const optIdx = prev.findIndex(m => typeof m.id === "string" && m.id.startsWith("optimistic_"));
              if (optIdx !== -1) {
                const updated = [...prev];
                updated[optIdx] = data.payload;
                return updated;
              }
            }

            return [...prev, data.payload];
          });
        } else if (data.type === "MESSAGE_EDITED") {
          setMessages(prev => prev.map(m => m.id === data.payload.id ? { ...m, ...data.payload } : m));
        } else if (data.type === "MESSAGE_DELETED") {
          setMessages(prev => prev.map(m => m.id === data.payload.id ? { ...m, deleted: true, content: "This message was deleted" } : m));
        } else if (data.type === "TYPING") {
          setTyping(prev => {
            const filtered = prev.filter(u => u !== data.username);
            if (data.isTyping) return [...filtered, data.username];
            return filtered;
          });
        } else if (data.type === "ONLINE_COUNT") {
          setOnline(data.count);
        } else if (data.type === "ROOM_DELETED") {
          alert("This support group has been deleted by the therapist.");
          nav("/group");
        }
      } catch {}
    };
    ws.onerror = () => {};
    return () => ws.close();
  }, [roomId, joined, user, nav]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function sendTyping(isTyping) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "TYPING", username: displayName, isTyping }));
    }
  }

  function handleInput(e) {
    const val = e.target.value;
    setText(val);
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 1500);

    // Mention detection
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/@(\w*)$/);

    if (lastWordMatch) {
      setMentionSearch(lastWordMatch[1]);
      setShowMentionDropdown(true);
      setSelectedMentionIdx(0);
    } else {
      setShowMentionDropdown(false);
    }
  }

  const insertMention = (member) => {
    const val = text;
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const textAfterCursor = val.slice(cursorPos);
    
    const textBeforeMention = textBeforeCursor.replace(/@(\w*)$/, `@${member.username} `);
    setText(textBeforeMention + textAfterCursor);
    setShowMentionDropdown(false);
    
    setTimeout(() => {
      inputRef.current.focus();
      const newCursorPos = textBeforeMention.length;
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  async function submitEdit(messageId) {
    const content = editingText.trim();
    if (!content) return;
    try {
      const { data } = await api.put(`/group/message/${messageId}`, { content });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...data } : m));
      setEditingMsgId(null);
    } catch (err) {
      alert("Failed to save edited message.");
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/group/message/${messageId}`);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true, content: "This message was deleted" } : m));
    } catch (err) {
      alert("Failed to delete message.");
    }
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    sendTyping(false);
    clearTimeout(typingTimer.current);
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      content,
      mine: true,
      anonymous: anon,
      senderName: anon ? "Anonymous" : (user?.displayName || user?.username || "You"),
      sentAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    try {
      const { data } = await api.post(`/group/rooms/${roomId}/messages`, {
        content,
        anonymous: anon,
      });
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) {
          return prev.filter(m => m.id !== optimisticId);
        }
        return prev.map(m => m.id === optimisticId ? { ...data, mine: true } : m);
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    }
    finally { setSending(false); inputRef.current?.focus(); }
  }

  async function handleLeaveRoom() {
    try {
      await api.post(`/group/rooms/${roomId}/leave`);
      setShowLeaveConfirm(false);
      nav("/group");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to leave group.");
    }
  }

  async function handleDeleteRoom() {
    try {
      await api.delete(`/group/rooms/${roomId}`);
      setShowDeleteConfirm(false);
      nav("/group");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete group.");
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("anonymous", anon);
    setSending(true);
    try {
      const { data } = await api.post(`/group/rooms/${roomId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch {
      alert("Failed to upload file. Please try again.");
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function renderMessageContent(content) {
    if (content && content.startsWith("[FILE:") && content.endsWith("]")) {
      const parts = content.slice(6, -1).split(":");
      if (parts.length >= 3) {
        const label = parts[0];
        const url = parts[1];
        const filename = parts.slice(2).join(":");
        if (label === "[IMAGE]") {
          return (
            <div className="mc-chat-media-attachment">
              <img src={url} alt={filename} style={{ maxWidth: "250px", maxHeight: "200px", borderRadius: "12px", marginTop: "6px", display: "block", cursor: "pointer" }} onClick={() => window.open(url, "_blank")} />
            </div>
          );
        } else if (label === "[VOICE]" || label === "[AUDIO]") {
          return (
            <div className="mc-chat-media-attachment" style={{ marginTop: "6px" }}>
              <audio src={url} controls style={{ maxWidth: "100%" }} />
            </div>
          );
        } else if (label === "[VIDEO]") {
          return (
            <div className="mc-chat-media-attachment" style={{ marginTop: "6px" }}>
              <video src={url} controls style={{ maxWidth: "300px", borderRadius: "12px", display: "block" }} />
            </div>
          );
        } else {
          return (
            <div className="mc-chat-file-attachment" style={{ marginTop: "6px" }}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="mc-file-link" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "inherit", textDecoration: "underline", fontWeight: "500" }}>
                <i className="bi bi-file-earmark-arrow-down-fill" style={{ fontSize: "1.2rem" }} />
                <span>{filename}</span>
              </a>
            </div>
          );
        }
      }
    }
    // Highlight mentions
    if (typeof content === "string") {
      const tokens = content.split(/(\s+)/);
      return tokens.map((token, i) => {
        if (token.startsWith("@") && token.length > 1) {
          const username = token.slice(1).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          const exists = members.some(m => m.username.toLowerCase() === username.toLowerCase());
          if (exists) {
            const isMeMentioned = user && username.toLowerCase() === user.username.toLowerCase();
            return (
              <span key={i} className={`mc-mention ${isMeMentioned ? "mc-mention-me" : ""}`}>
                {token}
              </span>
            );
          }
        }
        return token;
      });
    }
    return content;
  }

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(mentionSearch.toLowerCase()) || 
    m.displayName.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  function handleKey(e) {
    if (showMentionDropdown && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIdx(idx => (idx + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIdx(idx => (idx - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[selectedMentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function isMine(m) {
    // Trust server-set mine flag; also fallback to username comparison
    return m.mine === true || m.senderUsername === user?.username;
  }

  function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  async function handleJoin(code) {
    try {
      const { data } = await api.post("/group/join", { code });
      setJoined(true);
      setRoom(r => r || { id: roomId, name: data.name });
      const msgs = await api.get(`/group/rooms/${roomId}/messages`);
      setMessages(msgs.data || []);
    } catch (err) {
      setJoinError(err.response?.data?.error || "Invalid code. Please try again.");
    }
  }

  async function submitReport() {
    if (!reportModal) return;
    try {
      await api.post(`/group/message/${reportModal.msgId}/report`, { reason: reportReason || "Abusive content" });
      setReportSent(true);
      setTimeout(() => { setReportModal(null); setReportSent(false); setReportReason(""); }, 1800);
    } catch {}
  }

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setLoadingPatients(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const { data } = await api.get("/group/therapist/patients");
      setPatients(data || []);
    } catch {
      setInviteError("Failed to load your patients list.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleAddPatient = async (patientId) => {
    setInvitingId(patientId);
    setInviteError("");
    setInviteSuccess("");
    try {
      await api.post(`/group/${roomId}/add-patient`, { patientId });
      setInviteSuccess("Patient successfully added to the room!");
      api.get(`/group/${roomId}/members`).then(r => setMembers(r.data || [])).catch(() => {});
      setTimeout(() => setShowInviteModal(false), 1200);
    } catch (err) {
      setInviteError(err.response?.data?.error || "Failed to add patient.");
    } finally {
      setInvitingId(null);
    }
  };

  // Group messages by date
  const grouped = messages.reduce((acc, m) => {
    const key = formatDate(m.createdAt || m.sentAt || m.timestamp);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const typingOthers = typing.filter(u => u !== displayName);

  // ── Not yet joined — show join UI ──
  if (!joined) {
    return (
      <AppShell hideFooter={true}>
        <div className="mc-chat-join-screen">
          <div className="mc-chat-join-card">
            <div className="mc-chat-join-icon"><i className="bi bi-people-fill"/></div>
            <h3>{room?.name || "Group Room"}</h3>
            <p>You're not a member of this room yet. Enter the join code to participate.</p>
            {joinError && (
              <div className="mc-alert mc-alert-danger mc-alert-animate mb-3">
                <i className="bi bi-exclamation-circle-fill me-2"/>{joinError}
              </div>
            )}
            <div className="mc-input-wrap" style={{ marginBottom: 16 }}>
              <i className="bi bi-key"/>
              <input
                placeholder="Enter join code…"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoin(joinCode)}
              />
            </div>
            <button className="mc-btn-primary" onClick={() => handleJoin(joinCode)} style={{ width: "100%" }}>
              <i className="bi bi-door-open me-2"/>Join Room
            </button>
            <Link to="/group" className="mc-survey-nav-btn" style={{ marginTop: 12, display: "inline-flex" }}>
              <i className="bi bi-arrow-left me-1"/>Back to rooms
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideFooter={true}>
      <div className="mc-chat-layout">
        {/* Chat header */}
        <div className="mc-chat-header">
          <div className="mc-chat-header-left">
            <Link to="/group" className="mc-chat-back"><i className="bi bi-arrow-left"/></Link>
            <div className="mc-chat-room-avatar">
              <i className="bi bi-people-fill"/>
            </div>
            <div className="mc-chat-room-info">
              <h4>{room?.name || "Support Room"}</h4>
              <span className="mc-online-indicator">
                <span className="mc-live-dot"/>
                {online} online
              </span>
            </div>
          </div>
          <div className="mc-chat-header-right" style={{ position: "relative" }}>
            <label className="mc-anon-pill" title="Toggle anonymous mode">
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)}/>
              <i className={`bi bi-${anon ? "incognito" : "person"}`}/>
              <span>{anon ? "Anon" : "Visible"}</span>
            </label>
            <button className={`mc-chat-icon-btn${showMembers ? " active" : ""}`} onClick={() => setShowMembers(s => !s)} title="Members">
              <i className="bi bi-people"/>
            </button>
            <button className={`mc-chat-icon-btn${showMenu ? " active" : ""}`} onClick={() => setShowMenu(s => !s)} title="Options">
              <i className="bi bi-three-dots-vertical"/>
            </button>
            {showMenu && (
              <div className="mc-dropdown-menu" style={{ position: "absolute", right: 0, top: 48, background: "var(--mc-card-bg, #ffffff)", border: "1.5px solid var(--mc-border)", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 100, display: "flex", flexDirection: "column", minWidth: 160, overflow: "hidden" }}>
                <button onClick={() => { setShowMenu(false); setShowLeaveConfirm(true); }} style={{ padding: "12px 16px", border: "none", background: "none", color: "var(--mc-text, #1e293b)", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", width: "100%", transition: "background 0.2s" }} className="mc-dropdown-item">
                  <i className="bi bi-box-arrow-right"/> Leave Group
                </button>
                {isCreator && (
                  <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} style={{ padding: "12px 16px", border: "none", background: "none", color: "#ef4444", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", width: "100%", borderTop: "1.5px solid var(--mc-border)", transition: "background 0.2s" }} className="mc-dropdown-item">
                    <i className="bi bi-trash"/> Delete Group
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mc-chat-body">
          {/* Messages area */}
          <div className="mc-chat-messages">
            {Object.keys(grouped).length === 0 && (
              <div className="mc-chat-empty">
                <i className="bi bi-chat-heart-fill"/>
                <p>No messages yet. Be the first to say something!</p>
              </div>
            )}
            {Object.entries(grouped).map(([date, msgs]) => (
              <React.Fragment key={date}>
                <div className="mc-chat-date-divider"><span>{date}</span></div>
                {msgs.map((m, i) => {
                  const mine = isMine(m);
                  const senderName = m.anonymous ? "Anonymous" : (m.senderName || m.displayName || m.username || "User");
                  const containsMentionMe = typeof m.content === "string" && user &&
                    new RegExp(`@${user.username}\\b`, "i").test(m.content);
                  const isEditing = editingMsgId === m.id;

                  return (
                    <div key={m.id || i} className={`mc-msg-wrap${mine ? " mine" : ""}`}>
                      {!mine && (
                        <div className="mc-msg-avatar">
                          {m.anonymous
                            ? <i className="bi bi-incognito"/>
                            : <i className="bi bi-person-circle"/>}
                        </div>
                      )}
                      <div className="mc-msg-body">
                        {!mine && (
                          <div className="mc-msg-sender-name">
                            {senderName}
                            {m.anonymous && <span className="mc-anon-tag">· anon</span>}
                          </div>
                        )}
                        
                        {m.deleted ? (
                          <div className={`mc-msg-bubble${mine ? " mc-msg-mine" : ""}`} style={{ fontStyle: "italic", opacity: 0.7, background: "rgba(148, 163, 184, 0.05)", border: "1.5px dashed var(--mc-border)" }}>
                            This message was deleted
                          </div>
                        ) : isEditing ? (
                          <div className={`mc-msg-bubble${mine ? " mc-msg-mine" : ""}`}>
                            <div className="mc-msg-edit-container">
                              <textarea
                                className="mc-chat-textarea"
                                value={editingText}
                                onChange={e => setEditingText(e.target.value)}
                                style={{ width: "100%", background: "var(--mc-surface-2)", color: "var(--mc-text)", border: "1.5px solid var(--mc-border)", borderRadius: "8px", padding: "8px" }}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    submitEdit(m.id);
                                  } else if (e.key === "Escape") {
                                    setEditingMsgId(null);
                                  }
                                }}
                              />
                              <div className="mc-msg-edit-actions">
                                <button className="mc-btn-save-edit" onClick={() => submitEdit(m.id)}>Save</button>
                                <button className="mc-btn-cancel-edit" onClick={() => setEditingMsgId(null)}>Cancel</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`mc-msg-bubble${mine ? " mc-msg-mine" : ""}${containsMentionMe ? " mc-mention-highlight" : ""}`}>
                            {renderMessageContent(m.content || m.message)}
                          </div>
                        )}

                        {!m.deleted && !isEditing && (
                          <div className={`mc-msg-time${mine ? " right" : ""}`}>
                            {formatTime(m.createdAt || m.sentAt || m.timestamp)}
                            {m.edited && <span className="mc-msg-time-edited">(edited)</span>}
                            {mine && (
                              <>
                                <button
                                  type="button"
                                  className="mc-edit-msg-btn ms-2"
                                  title="Edit message"
                                  onClick={() => { setEditingMsgId(m.id); setEditingText(m.content || m.message); }}
                                >
                                  <i className="bi bi-pencil" />
                                </button>
                                <button
                                  type="button"
                                  className="mc-delete-msg-btn ms-1"
                                  title="Delete message"
                                  onClick={() => handleDeleteMessage(m.id)}
                                >
                                  <i className="bi bi-trash" />
                                </button>
                                <i className="bi bi-check2 ms-1"/>
                              </>
                            )}
                            {!mine && (
                              <button
                                className="mc-report-btn ms-2"
                                title="Report message"
                                onClick={() => setReportModal({ msgId: m.id, content: m.content || m.message })}
                              >
                                <i className="bi bi-flag"/>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Typing indicator */}
            {typingOthers.length > 0 && (
              <div className="mc-typing-indicator">
                <div className="mc-msg-avatar"><i className="bi bi-person-circle"/></div>
                <div className="mc-typing-bubble">
                  <span className="mc-typing-dot"/>
                  <span className="mc-typing-dot"/>
                  <span className="mc-typing-dot"/>
                </div>
                <span className="mc-typing-label">
                  {typingOthers.length === 1
                    ? `${typingOthers[0]} is typing…`
                    : `${typingOthers.length} people are typing…`}
                </span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Members sidebar */}
          {showMembers && (
            <div className="mc-chat-members-panel">
              <div className="mc-chat-members-header">
                <span>Members ({members.length})</span>
                <button onClick={() => setShowMembers(false)}><i className="bi bi-x-lg"/></button>
              </div>
              {user?.role === "ROLE_THERAPIST" && (
                <div style={{ padding: "12px 14px", borderBottom: "1.5px solid var(--mc-border)" }}>
                  <button className="mc-btn-primary" onClick={openInviteModal} style={{ width: "100%", fontSize: ".8rem", padding: "8px 12px", borderRadius: "8px" }}>
                    <i className="bi bi-person-plus me-1"/>Invite Patient
                  </button>
                </div>
              )}
              <div className="mc-chat-members-list">
                {members.length === 0
                  ? <p className="mc-chat-members-empty">Loading members…</p>
                  : members.map(m => (
                    <div key={m.id} className="mc-chat-member-row">
                      <div className="mc-chat-member-avatar"><i className="bi bi-person-circle"/></div>
                      <span>{m.displayName || m.username}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="mc-chat-input-bar" style={{ position: "relative" }}>
          {showMentionDropdown && filteredMembers.length > 0 && (
            <div className="mc-mention-dropdown">
              {filteredMembers.map((m, idx) => (
                <div
                  key={m.id}
                  className={`mc-mention-dropdown-item ${selectedMentionIdx === idx ? "active" : ""}`}
                  onClick={() => insertMention(m)}
                >
                  <div className="mc-mention-dropdown-avatar">
                    <i className="bi bi-person"/>
                  </div>
                  <div>
                    <strong>{m.displayName || m.username}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--mc-muted)", marginLeft: "6px" }}>@{m.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mc-chat-input-wrap">
            <button className="mc-chat-attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach File/Media" style={{ background: "none", border: "none", color: "var(--mc-muted)", fontSize: "1.3rem", padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <i className="bi bi-paperclip" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
            <textarea
              ref={inputRef}
              className="mc-chat-textarea"
              placeholder={anon ? "Message as Anonymous…" : `Message ${room?.name || "group"}…`}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              className="mc-chat-send-btn"
              onClick={sendMessage}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <span className="spinner-border spinner-border-sm"/>
                : <i className="bi bi-send-fill"/>}
            </button>
          </div>
          <div className="mc-chat-hint">Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="mc-modal-overlay" onClick={() => setReportModal(null)}>
          <div className="mc-modal-box mc-report-modal-box" onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="mc-report-success">
                <i className="bi bi-check-circle-fill"/>
                <h3>Report submitted</h3>
                <p>Our moderation team will review this message.</p>
              </div>
            ) : (
              <>
                <div className="mc-report-modal-header">
                  <i className="bi bi-flag-fill"/>
                  <h3>Report Message</h3>
                </div>
                <div className="mc-report-preview">
                  "{reportModal.content?.slice(0, 120)}{reportModal.content?.length > 120 ? "…" : ""}"
                </div>
                <label className="mc-field">
                  <span>Reason for reporting</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-chat-text"/>
                    <input
                      placeholder="e.g. Abusive language, spam…"
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                    />
                  </div>
                </label>
                <div className="mc-logout-modal-actions mt-3">
                  <button className="mc-btn-cancel-outline" onClick={() => setReportModal(null)}>Cancel</button>
                  <button className="mc-btn-logout-confirm mc-btn-report-submit" onClick={submitReport}>
                    <i className="bi bi-flag me-1"/>Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invite Patient Modal */}
      {showInviteModal && (
        <div className="mc-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="mc-modal-header">
              <i className="bi bi-person-plus-fill mc-modal-icon"/>
              <div>
                <h3>Invite Patient to Group</h3>
                <p>Select a patient you have had sessions with to add them directly to this support group.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowInviteModal(false)}><i className="bi bi-x-lg"/></button>
            </div>

            {inviteError && (
              <div className="mc-alert mc-alert-danger mc-alert-animate">
                <i className="bi bi-exclamation-circle-fill me-2"/>{inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="mc-alert mc-alert-success mc-alert-animate">
                <i className="bi bi-check-circle-fill me-2"/>{inviteSuccess}
              </div>
            )}

            <div className="mc-patient-list" style={{ maxHeight: 300, overflowY: "auto", marginTop: 20 }}>
              {loadingPatients ? (
                <div className="mc-loading" style={{ padding: 20 }}><div className="mc-spinner"/><span>Loading patients…</span></div>
              ) : patients.length === 0 ? (
                <p className="mc-chat-members-empty" style={{ textAlign: "center", padding: 20 }}>No patients found with session history.</p>
              ) : (
                patients.map(p => (
                  <div key={p.id} className="mc-chat-member-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1.5px solid var(--mc-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="mc-chat-member-avatar"><i className="bi bi-person-circle"/></div>
                      <div>
                        <strong>{p.displayName}</strong>
                        <div style={{ fontSize: ".75rem", color: "var(--mc-muted)" }}>@{p.username}</div>
                      </div>
                    </div>
                    <button
                      className="mc-btn-primary"
                      onClick={() => handleAddPatient(p.id)}
                      disabled={invitingId === p.id}
                      style={{ fontSize: ".75rem", padding: "6px 12px", width: "auto" }}
                    >
                      {invitingId === p.id ? <span className="spinner-border spinner-border-sm"/> : "Add User"}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mc-logout-modal-actions mt-3">
              <button className="mc-btn-cancel-outline" onClick={() => setShowInviteModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="mc-modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mc-modal-header">
              <i className="bi bi-box-arrow-right mc-modal-icon" style={{ color: "#f59e0b" }}/>
              <div>
                <h3>Leave Group</h3>
                <p>Are you sure you want to leave this support group? You will need to use the join code to join again.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowLeaveConfirm(false)}><i className="bi bi-x-lg"/></button>
            </div>
            <div className="mc-logout-modal-actions mt-3">
              <button className="mc-btn-cancel-outline" onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
              <button className="mc-btn-logout-confirm" onClick={handleLeaveRoom} style={{ backgroundColor: "#f59e0b", borderColor: "#f59e0b" }}>
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="mc-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mc-modal-header">
              <i className="bi bi-exclamation-triangle-fill mc-modal-icon" style={{ color: "#ef4444" }}/>
              <div>
                <h3>Delete Group</h3>
                <p>Are you sure you want to permanently delete this support group? This action cannot be undone and all messages will be deleted.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowDeleteConfirm(false)}><i className="bi bi-x-lg"/></button>
            </div>
            <div className="mc-logout-modal-actions mt-3">
              <button className="mc-btn-cancel-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="mc-btn-logout-confirm" onClick={handleDeleteRoom} style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}>
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
