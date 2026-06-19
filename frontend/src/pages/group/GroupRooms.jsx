import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const ROOM_ICONS = ["chat-heart","people-fill","heart-pulse","shield-heart","stars","sun","cloud","flower1"];
const ROOM_COLORS = ["blue","green","purple","teal","orange","pink","indigo","cyan"];

export default function GroupRooms() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", topic: "", maxMembers: 20 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newRoom, setNewRoom] = useState(null); // holds { id, name, joinCode } after creation
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const isTherapist = user?.role === "ROLE_THERAPIST";

  useEffect(() => {
    api.get("/group/rooms").catch(() => ({ data: [] }))
      .then(r => setRooms(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.topic?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Room name is required."); return; }
    setCreating(true); setCreateError("");
    try {
      const { data } = await api.post("/group/create", {
        name: createForm.name.trim(),
        topic: createForm.topic.trim() || createForm.name.trim(),
        maxMembers: Number(createForm.maxMembers) || 20,
      });
      setNewRoom(data);
      // Refresh rooms list
      const updated = await api.get("/group/rooms").catch(() => ({ data: [] }));
      setRooms(updated.data || []);
      setShowCreate(false);
      setCreateForm({ name: "", topic: "", maxMembers: 20 });
    } catch (err) {
      setCreateError(err.response?.data?.error || "Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinByCode(e) {
    e.preventDefault();
    if (!joinCodeInput.trim()) { setJoinError("Join code is required."); return; }
    setJoining(true); setJoinError("");
    try {
      const { data } = await api.post("/group/join", { code: joinCodeInput.trim() });
      nav(`/group/${data.id}`);
    } catch (err) {
      setJoinError(err.response?.data?.error || "Failed to join room. Please check the code.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-people-fill me-1"/>Community</div>
            <h1>Group <span className="mc-gradient-text">Support Rooms</span></h1>
            <p>Connect with others on similar journeys. All rooms are moderated and safe.</p>
          </div>
          <div className="mc-hero-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="mc-btn-hero-outline" onClick={() => { setJoinError(""); setJoinCodeInput(""); setShowJoinCode(true); }}>
              <i className="bi bi-key me-2"/>Join by Code
            </button>
            {isTherapist && (
              <button className="mc-btn-hero-primary" onClick={() => setShowCreate(true)}>
                <i className="bi bi-plus-circle me-2"/>Create Room
              </button>
            )}
          </div>
        </section>

        {/* New Room Join Code Banner */}
        {newRoom && (
          <div className="mc-new-room-banner mc-scroll-reveal">
            <div className="mc-new-room-banner-inner">
              <i className="bi bi-check-circle-fill"/>
              <div>
                <strong>Room "{newRoom.name}" created!</strong>
                <p>Share this join code with members:</p>
                <div className="mc-join-code-box">{newRoom.joinCode}</div>
              </div>
              <button className="mc-chat-icon-btn" onClick={() => setNewRoom(null)}><i className="bi bi-x-lg"/></button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mc-search-bar mc-scroll-reveal">
          <div className="mc-input-wrap" style={{ maxWidth: 400 }}>
            <i className="bi bi-search"/>
            <input
              placeholder="Search rooms…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="mc-loading"><div className="mc-spinner"/><span>Loading rooms…</span></div>
        ) : filtered.length === 0 ? (
          <div className="mc-empty-page">
            <i className="bi bi-people"/>
            <h3>No rooms found</h3>
            <p>{search ? "Try a different search." : isTherapist ? "Create the first group room!" : "No group rooms available yet."}</p>
          </div>
        ) : (
          <div className="mc-rooms-grid">
            {filtered.map((r, i) => {
              const color = ROOM_COLORS[i % ROOM_COLORS.length];
              const icon  = ROOM_ICONS[i % ROOM_ICONS.length];
              return (
                <div key={r.id} className={`mc-room-card mc-room-${color} mc-scroll-reveal`} style={{ transitionDelay: `${i * 0.06}s` }}>
                  <div className={`mc-room-icon mc-icon-${color}`}>
                    <i className={`bi bi-${icon}`}/>
                  </div>
                  <div className="mc-room-body">
                    <h4>{r.name}</h4>
                    <p>{r.topic || "A safe space for peer support and connection."}</p>
                    <div className="mc-room-meta">
                      {r.memberCount != null && (
                        <span><i className="bi bi-people me-1"/>{r.memberCount} members</span>
                      )}
                      {r.isModerated && (
                        <span className="mc-room-moderated"><i className="bi bi-shield-check me-1"/>Moderated</span>
                      )}
                      {isTherapist && r.joinCode && (
                        <span className="mc-room-code-badge"><i className="bi bi-key me-1"/>Code: {r.joinCode}</span>
                      )}
                    </div>
                  </div>
                  <Link to={`/group/${r.id}`} className="mc-room-join-btn">
                    {r.isMember ? "Enter Room" : "Join Room"} <i className="bi bi-arrow-right ms-1"/>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="mc-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="mc-modal-header">
              <i className="bi bi-people-fill mc-modal-icon"/>
              <div>
                <h3>Create Support Room</h3>
                <p>Set up a new group room for your patients and community.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowCreate(false)}><i className="bi bi-x-lg"/></button>
            </div>

            {createError && (
              <div className="mc-alert mc-alert-danger mc-alert-animate">
                <i className="bi bi-exclamation-circle-fill me-2"/>{createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="mc-form" style={{ marginTop: 20 }}>
              <label className="mc-field">
                <span>Room Name <span className="mc-required">*</span></span>
                <div className="mc-input-wrap">
                  <i className="bi bi-chat-heart"/>
                  <input
                    placeholder="e.g. Anxiety & Stress Support"
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>
              </label>
              <label className="mc-field">
                <span>Topic / Description</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-text-left"/>
                  <input
                    placeholder="e.g. Managing daily anxiety and panic attacks"
                    value={createForm.topic}
                    onChange={e => setCreateForm({ ...createForm, topic: e.target.value })}
                  />
                </div>
              </label>
              <label className="mc-field">
                <span>Max Members</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-people"/>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={createForm.maxMembers}
                    onChange={e => setCreateForm({ ...createForm, maxMembers: e.target.value })}
                  />
                </div>
              </label>
              <div className="mc-form-actions">
                <button type="button" className="mc-btn-cancel-outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="mc-btn-primary" type="submit" disabled={creating} style={{ width: "auto", minWidth: 160 }}>
                  {creating
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Creating…</>
                    : <><i className="bi bi-plus-circle me-2"/>Create Room</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room by Code Modal */}
      {showJoinCode && (
        <div className="mc-modal-overlay" onClick={() => setShowJoinCode(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="mc-modal-header">
              <i className="bi bi-key mc-modal-icon"/>
              <div>
                <h3>Join Support Room</h3>
                <p>Enter a 6-character room code to join the support group.</p>
              </div>
              <button className="mc-modal-close" onClick={() => setShowJoinCode(false)}><i className="bi bi-x-lg"/></button>
            </div>

            {joinError && (
              <div className="mc-alert mc-alert-danger mc-alert-animate">
                <i className="bi bi-exclamation-circle-fill me-2"/>{joinError}
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="mc-form" style={{ marginTop: 20 }}>
              <label className="mc-field">
                <span>Room Join Code</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-key-fill"/>
                  <input
                    placeholder="e.g. AB12CD"
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                    required
                    style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
                  />
                </div>
              </label>
              <div className="mc-form-actions">
                <button type="button" className="mc-btn-cancel-outline" onClick={() => setShowJoinCode(false)}>
                  Cancel
                </button>
                <button className="mc-btn-primary" type="submit" disabled={joining} style={{ width: "auto", minWidth: 140 }}>
                  {joining
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Joining…</>
                    : <><i className="bi bi-door-open me-2"/>Join Room</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
