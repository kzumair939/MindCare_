(function () {
  const cfg = window.__ONLINE_SESSION__ || {};
  const sessionId = cfg.sessionId;
  const me = cfg.displayName || "user";
  const role = (cfg.role || 'USER').toUpperCase();
  let remainingSeconds = Number(cfg.remainingSeconds || 0);

  const socket = new SockJS('/ws');
  const stomp = Stomp.over(socket);
  stomp.debug = null;

  const chatBox = document.getElementById('chatBox');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const typingIndicator = document.getElementById('typingIndicator');
  const typingLabel = document.getElementById('typingLabel');
  const statusMirror = document.getElementById('statusMirror');
  const roleText = document.getElementById('roleText');

  function appendChatLine(text, isMe, author) {
    const div = document.createElement('div');
    div.className = 'chat-message' + (isMe ? ' me' : '');
    div.innerHTML = `<div class="chat-meta">${author || (isMe ? 'You' : 'Participant')}</div><div>${text}</div>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  const btnStart = document.getElementById('btnStart');
  const btnHangup = document.getElementById('btnHangup');
  const statusEl = document.getElementById('callStatus');
  const statusPill = document.getElementById('callStatusPill');
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const timeLeftEl = document.getElementById('timeLeft');

  let pc = null;
  let localStream = null;
  let isMakingOffer = false;
  let typingTimer = null;

  if (roleText) roleText.textContent = role === 'THERAPIST' ? 'Therapist' : 'User';

  // Expanded STUN servers and Metered TURN servers for strict firewalls
  const rtcConfig = {
    iceServers: [
      // 1. Free STUN servers (Try direct connection first)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },

      // 2. Premium TURN servers (Relay fallback if direct connection fails)
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "bc1447b12368d10f79581f43",
        credential: "x/IVYHMRZj5XWDtX"
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "bc1447b12368d10f79581f43",
        credential: "x/IVYHMRZj5XWDtX"
      },
      {
        urls: "turn:global.relay.metered.ca:443?transport=tcp",
        username: "bc1447b12368d10f79581f43",
        credential: "x/IVYHMRZj5XWDtX"
      }
    ]
  };

  function setStatus(t) {
    statusEl.textContent = t;
    if (statusMirror) statusMirror.textContent = t;
    if (statusPill) {
      const connected = /connected|ready/i.test(t);
      statusPill.classList.toggle('connected', connected);
    }
  }

  function fmtTime(secs) {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function tickCountdown() {
    if (timeLeftEl) timeLeftEl.textContent = fmtTime(remainingSeconds);
    if (remainingSeconds <= 0) {
      try { hangup(); } catch (_) {}
      if (role === 'USER') {
        alert('Session time is completed. Please share quick feedback (optional).');
        window.location.href = `/feedback/${sessionId}`;
      } else {
        alert('Session time is completed. You will be redirected to your sessions.');
        window.location.href = '/therapist/sessions?sessionEnded';
      }
      return;
    }
    remainingSeconds -= 1;
    window.setTimeout(tickCountdown, 1000);
  }

  async function ensurePeerConnection() {
    if (pc) return;
    pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal('ice', JSON.stringify(e.candidate));
    };

    pc.ontrack = (e) => {
      remoteVideo.srcObject = e.streams[0];
      setStatus('Connected');
    };

    pc.onconnectionstatechange = () => {
      setStatus(pc.connectionState ? `Connection: ${pc.connectionState}` : 'Connecting');
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE State:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        setStatus('Connection: failed (Strict Firewall)');
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        isMakingOffer = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal('offer', JSON.stringify(pc.localDescription));
      } finally {
        isMakingOffer = false;
      }
    };
  }

  async function startCall() {
    btnStart.disabled = true;
    btnHangup.disabled = false;
    setStatus('Starting...');
    await ensurePeerConnection();
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }
    sendSignal('join', JSON.stringify({ user: me }));
    setStatus('Ready');
  }

  async function hangup() {
    btnStart.disabled = false;
    btnHangup.disabled = true;
    setStatus('Not connected');
    if (pc) {
      pc.getSenders().forEach(s => { try { pc.removeTrack(s); } catch (_) {} });
      pc.close();
      pc = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
      localVideo.srcObject = null;
    }
    remoteVideo.srcObject = null;
  }

  function sendChat(content) {
    stomp.send(`/app/session/${sessionId}/chat`, {}, JSON.stringify({ from: me, content: content, timestamp: null }));
  }
  function sendSignal(type, data) {
    stomp.send(`/app/session/${sessionId}/signal`, {}, JSON.stringify({ from: me, type: type, data: data }));
  }

  async function handleSignal(msg) {
    if (msg.from === me) return;
    await ensurePeerConnection();

    if (msg.type === 'join') {
      setStatus('Participant joined');
      return;
    }
    if (msg.type === 'typing') {
      if (typingIndicator && typingLabel) {
        typingLabel.textContent = `${msg.from} is typing...`;
        typingIndicator.classList.add('show');
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => typingIndicator.classList.remove('show'), 1200);
      }
      return;
    }
    if (msg.type === 'offer') {
      const offer = JSON.parse(msg.data);

      // FIX: Only one side should be polite to avoid race conditions.
      // User is polite, Therapist is impolite.
      const polite = (role === 'USER');
      const offerCollision = isMakingOffer || pc.signalingState !== 'stable';

      if (offerCollision && !polite) {
          console.log("Ignoring colliding offer because I am impolite");
          return;
      }

      await pc.setRemoteDescription(offer);
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal('answer', JSON.stringify(pc.localDescription));
      setStatus('Answer sent');
    }
    if (msg.type === 'answer') {
      const answer = JSON.parse(msg.data);
      await pc.setRemoteDescription(answer);
      setStatus('Connected');
    }
    if (msg.type === 'ice') {
      const cand = JSON.parse(msg.data);
      try { await pc.addIceCandidate(cand); } catch (_) {}
    }
  }

  btnStart.addEventListener('click', (e) => {
    e.preventDefault();
    startCall().catch(err => {
      console.error(err);
      setStatus('Call error');
      btnStart.disabled = false;
      btnHangup.disabled = true;
      alert('Could not start call. Check camera and mic permissions.');
    });
  });

  btnHangup.addEventListener('click', (e) => { e.preventDefault(); hangup(); });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = (chatInput.value || '').trim();
    if (!text) return;
    sendChat(text);
    appendChatLine(text, true, me);
    chatInput.value = '';
    if (typingIndicator) typingIndicator.classList.remove('show');
  });

  chatInput.addEventListener('input', () => {
    const val = (chatInput.value || '').trim();
    if (val) sendSignal('typing', JSON.stringify({ user: me }));
    if (typingIndicator) {
      typingLabel.textContent = 'You are typing...';
      typingIndicator.classList.toggle('show', !!val);
    }
  });

  stomp.connect({}, function () {
    stomp.subscribe(`/topic/session.${sessionId}.chat`, function (frame) {
      const msg = JSON.parse(frame.body);
      if (msg.from === me) return;
      appendChatLine(msg.content, false, msg.from);
      if (typingIndicator) typingIndicator.classList.remove('show');
    });

    stomp.subscribe(`/topic/session.${sessionId}.signal`, function (frame) {
      const msg = JSON.parse(frame.body);
      handleSignal(msg).catch(console.error);
    });

    setStatus('Connected to session');
  });

  tickCountdown();
})();