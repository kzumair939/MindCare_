import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getWsUrl } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===============================
  // Load user on app start (refresh)
  // ===============================
  useEffect(() => {
    const token = localStorage.getItem("mc_token");

    if (token) {
      api.get("/auth/me")
          .then((r) => setUser(r.data))
          .catch(() => {
            localStorage.removeItem("mc_token");
            localStorage.removeItem("mc_user");
            setUser(null);
          })
          .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ===============================
  // LOGIN (username/password)
  // ===============================
  async function login(username, password) {
    const { data } = await api.post("/auth/login", {
      username,
      password,
    });

    localStorage.setItem("mc_token", data.token);

    // always fetch real user from backend
    const userRes = await api.get("/auth/me");
    setUser(userRes.data);

    return data;
  }

  // ===============================
  // REGISTER
  // ===============================
  async function register(username, email, password) {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    return data;
  }

  // ===============================
  // VERIFY OTP
  // ===============================
  async function verifyOtp(email, otp) {
    const { data } = await api.post("/auth/verify-otp", {
      email,
      otp,
    });

    localStorage.setItem("mc_token", data.token);

    const userRes = await api.get("/auth/me");
    setUser(userRes.data);

    return data;
  }

  // ===============================
  // RESEND OTP
  // ===============================
  async function resendOtp(email) {
    const { data } = await api.post("/auth/resend-otp", {
      email,
    });
    return data;
  }

  // ===============================
  // LOGOUT
  // ===============================
  function logout() {
    localStorage.removeItem("mc_token");
    localStorage.removeItem("mc_user");
    setUser(null);
    window.location.href = "/login";
  }

  // ===============================
  // REFRESH USER
  // ===============================
  async function refreshUser() {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  }

  // ===============================
  // OAUTH LOGIN SUPPORT (FIXED)
  // ===============================
  async function loginWithToken(token) {
    localStorage.setItem("mc_token", token);
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
      return r.data;
    } catch (err) {
      localStorage.removeItem("mc_token");
      setUser(null);
      throw err;
    }
  }

  // ===============================
  // Global Notification Web Socket
  // ===============================
  const [unreadGroups, setUnreadGroups] = useState([]);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!user) {
      setUnreadGroups([]);
      setToasts([]);
      return;
    }

    let ws = null;
    let keepAlive = true;

    function connect() {
      if (!keepAlive) return;

      const token = localStorage.getItem("mc_token");
      if (!token) return;

      const wsUrl = getWsUrl(`/ws/notifications?token=${token}`);
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "GROUP_MESSAGE") {
            const { roomId, roomName, senderName, content } = data;
            
            // Check if user is currently inside the chat for this room
            const inChatRoom = window.location.pathname === `/group/${roomId}`;
            
            // 1. If not currently viewing this group's chat room, mark as unread
            if (!inChatRoom) {
              setUnreadGroups(prev => {
                if (prev.includes(roomId)) return prev;
                return [...prev, roomId];
              });
            }

            // 2. Suppress toast notifications if:
            //    - The user is in an active video/call session (url: /session/:id/online)
            //    - The user is already in this specific group room chat
            const inActiveSession = window.location.pathname.startsWith("/session/") && window.location.pathname.endsWith("/online");
            
            if (!inActiveSession && !inChatRoom) {
              const toastId = Date.now() + Math.random().toString(36).substr(2, 9);
              setToasts(prev => [...prev, { id: toastId, roomId, roomName, senderName, content }]);
            }
          }
        } catch (err) {
          console.error("Error parsing global notification:", err);
        }
      };

      ws.onclose = () => {
        if (keepAlive) {
          setTimeout(connect, 5000); // Reconnect in 5s
        }
      };
    }

    connect();

    return () => {
      keepAlive = false;
      if (ws) ws.close();
    };
  }, [user]);

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  // ===============================
  // PROVIDER
  // ===============================
  return (
      <AuthContext.Provider
          value={{
            user,
            setUser,
            loading,
            login,
            register,
            verifyOtp,
            resendOtp,
            logout,
            refreshUser,
            loginWithToken,
            unreadGroups,
            setUnreadGroups,
            toasts,
            removeToast,
          }}
      >
        {children}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="mc-toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    const autoCloseTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [onClose]);

  const handleToastClick = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      navigate(`/group/${toast.roomId}`);
    }, 200);
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    setVisible(false);
    setTimeout(onClose, 400);
  };

  return (
    <div className={`mc-toast ${visible ? "show" : ""}`} onClick={handleToastClick}>
      <div className="mc-toast-header">
        <span className="mc-toast-title">
          <i className="bi bi-people-fill text-primary" style={{ marginRight: 6 }} />
          <span>{toast.roomName}</span>
        </span>
        <button className="mc-toast-close" onClick={handleCloseClick}>
          <i className="bi bi-x-lg" />
        </button>
      </div>
      <div className="mc-toast-body">
        <strong>{toast.senderName}: </strong>
        <span>{toast.content}</span>
      </div>
    </div>
  );
}