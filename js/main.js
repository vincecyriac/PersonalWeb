// ==========================================================================
// VINCE CYRIAC — MODERN PORTFOLIO — MAIN.JS
// ==========================================================================

const isEmulator = ['5000', '5005', '8080'].includes(window.location.port);
const IS_LOCAL_STATIC = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !isEmulator;
const BASE_API_URL = IS_LOCAL_STATIC ? 'https://personalweb-2d846.web.app' : '';

const conversationHistory = [];

async function callVinceAIApi(message) {
  const response = await fetch(`${BASE_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: conversationHistory })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  // Update memory
  conversationHistory.push(
    { role: 'user', text: message },
    { role: 'model', text: data.text }
  );

  return data.text;
}

document.addEventListener('DOMContentLoaded', () => {  // ── Dynamic Dates ──
  const CAREER_START = new Date(2020, 7, 10); // August 10, 2020
  const CURRENT_YEAR = new Date().getFullYear();

  function getExperienceYears() {
    const now = new Date();
    let years = now.getFullYear() - CAREER_START.getFullYear();
    const monthDiff = now.getMonth() - CAREER_START.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < CAREER_START.getDate())) {
      years--;
    }
    return years;
  }

  const expYears = getExperienceYears();
  
  // Update texts
  const heroExpEl = document.getElementById('hero-exp');
  if (heroExpEl) heroExpEl.textContent = expYears + '+ YRS';
  
  const footerYearEl = document.getElementById('footer-year');
  if (footerYearEl) footerYearEl.textContent = CURRENT_YEAR;

  // ── Stats Counter Animation ──
  function countUp(el, to, ms, suffix = '+') {
    let i = 0;
    // ensure at least 10ms step
    let step = ms / to;
    if (step < 10) step = 10;
    // calculate increment
    let inc = to / (ms / step);
    let current = 0;
    
    const iv = setInterval(() => {
      current += inc;
      if (current >= to) {
        current = to;
        clearInterval(iv);
      }
      el.textContent = Math.floor(current) + suffix;
    }, step);
  }

  // Trigger stats on scroll
  const expEl = document.getElementById('exp-n');
  const projEl = document.getElementById('proj-n');
  const codeEl = document.getElementById('code-n');

  if (expEl) {
    const aboutObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          countUp(expEl, 6, 800, '+');
          if (projEl) countUp(projEl, 15, 800, '+');
          if (codeEl) countUp(codeEl, 100, 1000, '%');
          aboutObserver.disconnect();
        }
      });
    }, { threshold: 0.5 });
    
    aboutObserver.observe(expEl.closest('.stats-grid') || expEl);
  }

  // ── Scroll Reveal ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('vis');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.rv-fade').forEach((el) => revealObserver.observe(el));

  // Trigger hero manually on load
  setTimeout(() => {
    document.querySelectorAll('#hero.rv-fade, #weekend-content .hero-section.rv-fade').forEach(el => el.classList.add('vis'));
  }, 100);

  // ── Skill Bars ──
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const fills = e.target.querySelectorAll('.skill-fill');
        fills.forEach((fill, i) => {
          setTimeout(() => {
            fill.style.width = fill.getAttribute('data-w') + '%';
          }, i * 50);
        });
        skillObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  const skillGrid = document.getElementById('skgrid');
  if (skillGrid) skillObserver.observe(skillGrid);

  // ── Navbar Scroll state ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      document.body.classList.add('nav-scrolled');
    } else {
      document.body.classList.remove('nav-scrolled');
    }
  }, { passive: true });

  // ── Mobile Menu ──
  const mobBtn = document.getElementById('mob-menu-btn');
  const mobNav = document.getElementById('mob-nav');
  const mobLinks = document.querySelectorAll('#mob-nav a');

  function toggleMobMenu() {
    if (mobNav) mobNav.classList.toggle('open');
  }

  function closeMobMenu() {
    if (mobNav) mobNav.classList.remove('open');
  }

  if (mobBtn) {
    mobBtn.addEventListener('click', toggleMobMenu);
  }

  // ── Precise Anchor Scrolling with Navbar Offset ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        closeMobMenu();
        
        const navH = navbar ? navbar.offsetHeight : 72;
        
        // Find inner content container or tag to align right below the navbar
        const contentHeader = targetEl.querySelector('.tag, .split-left, .hero-text, .container') || targetEl;
        const targetPos = contentHeader.getBoundingClientRect().top + window.pageYOffset;
        const offset = targetPos - navH - 24;
        
        window.scrollTo({
          top: Math.max(0, offset),
          behavior: 'smooth'
        });
      }
    });
  });

  // ── Theme Toggle ──
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // We default body to 'theme-light' in HTML, but we will change it if user prefers dark
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
      document.body.classList.remove('theme-light');
      themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
      document.body.classList.add('theme-light');
      themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
    }

    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('theme-light');
      const isLight = document.body.classList.contains('theme-light');
      themeToggle.innerHTML = isLight ? '<i class="bi bi-moon"></i>' : '<i class="bi bi-sun"></i>';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }


  // ── Projects Show More Toggle ──
  const showMoreBtn = document.getElementById('show-more-projects-btn');
  const moreProjectsContainer = document.getElementById('more-projects-container');
  
  if (showMoreBtn && moreProjectsContainer) {
    let isExpanded = false;
    showMoreBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      if (isExpanded) {
        moreProjectsContainer.style.display = 'flex'; // `.projects-grid` is a flex column
        showMoreBtn.innerHTML = 'Show Less Projects <i class="bi bi-chevron-up" style="transition: transform 0.3s;" id="more-projects-icon"></i>';
        
        // Trigger reveal fade for new items
        setTimeout(() => {
          moreProjectsContainer.querySelectorAll('.rv-fade').forEach(el => el.classList.add('vis'));
        }, 50);
      } else {
        moreProjectsContainer.style.display = 'none';
        showMoreBtn.innerHTML = 'Show More Projects <i class="bi bi-chevron-down" style="transition: transform 0.3s;" id="more-projects-icon"></i>';
      }
    });
  }

  // ── Project Ultron Modal ──
  const openUltronBtn = document.getElementById('open-ultron-modal');
  const ultronModal = document.getElementById('ultron-modal');
  const closeUltronBtn = document.getElementById('close-ultron-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openModal() {
    if (ultronModal) {
      ultronModal.classList.add('open');
      ultronModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (ultronModal) {
      ultronModal.classList.remove('open');
      ultronModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (openUltronBtn) openUltronBtn.addEventListener('click', openModal);
  if (closeUltronBtn) closeUltronBtn.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  if (ultronModal) {
    ultronModal.addEventListener('click', (e) => {
      if (e.target === ultronModal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ultronModal && ultronModal.classList.contains('open')) {
      closeModal();
    }
  });

  // ── Contact Form (EmailJS) ──
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');

  // Hardcoded config from original site
  const EMAILJS_PUBLIC_KEY = '9BCKsdm0TPj6SYs1X';
  const EMAILJS_SERVICE_ID = 'service_7z12yjm';
  const EMAILJS_TEMPLATE_ID = 'template_02uikno';

  if (form && typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nameInput = document.getElementById('cf-name');
      const emailInput = document.getElementById('cf-email');
      const messageInput = document.getElementById('cf-message');
      const submitBtn = form.querySelector('button[type="submit"]');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || !email || !message) {
        showStatus(statusEl, 'error', 'Error: All fields required');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      showStatus(statusEl, '', 'Sending message...');

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          from_name: name,
          from_email: email,
          message: message,
          to_name: 'Vince Cyriac'
        })
        .then(function () {
          showStatus(statusEl, 'success', 'Message delivered successfully.');
          form.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        })
        .catch(function () {
          showStatus(statusEl, 'error', 'Failed to send. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        });
    });
  }

  function showStatus(el, type, msg) {
    if (!el) return;
    el.className = 'form-status ' + type;
    el.textContent = msg;
  }

  // ── 3D SPATIAL HUD & ORBITAL TELEMETRY CANVAS ──
  const hudCanvas = document.getElementById('hero-hud-canvas');
  const hudContainer = document.getElementById('hero-hud-container');
  const telemetryCoords = document.getElementById('telemetry-coords');

  if (hudCanvas && hudContainer) {
    const ctx = hudCanvas.getContext('2d');
    let width, height, centerX, centerY;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0, hover: false };
    let angleX = 0, angleY = 0, rotAngle = 0;
    
    // Cyber lattice nodes
    const nodes = [];
    const NUM_NODES = 24;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = hudContainer.clientWidth + 40;
      height = hudContainer.clientHeight + 40;
      hudCanvas.width = width * dpr;
      hudCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      centerX = width / 2;
      centerY = height / 2;
    }

    window.addEventListener('resize', resize);
    resize();

    // Initialize spatial nodes
    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * width * 0.9,
        y: (Math.random() - 0.5) * height * 0.9,
        z: Math.random() * 200 - 100,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 1.5,
        alpha: Math.random() * 0.6 + 0.3
      });
    }

    hudContainer.addEventListener('mousemove', (e) => {
      const rect = hudContainer.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left) - (width / 2);
      mouse.targetY = (e.clientY - rect.top) - (height / 2);
      mouse.hover = true;
      
      if (telemetryCoords) {
        const normX = Math.round(e.clientX - rect.left);
        const normY = Math.round(e.clientY - rect.top);
        telemetryCoords.textContent = `X: ${String(normX).padStart(3, '0')} Y: ${String(normY).padStart(3, '0')}`;
      }
    });

    hudContainer.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
      mouse.hover = false;
    });

    function drawHUD() {
      ctx.clearRect(0, 0, width, height);

      // Smooth camera tilt
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      rotAngle += 0.008;

      angleX = (mouse.y / height) * 0.4;
      angleY = (mouse.x / width) * 0.4;

      ctx.save();
      ctx.translate(centerX, centerY);

      // ── Outer Rotating Gyroscope Ring ──
      ctx.save();
      ctx.rotate(rotAngle * 0.5 + angleY);
      ctx.scale(1, 0.4 + Math.abs(angleX * 0.5));
      ctx.strokeStyle = 'rgba(22, 23, 16, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── Middle Glowing Orbital Ring ──
      ctx.save();
      ctx.rotate(-rotAngle * 0.8 + angleY * 1.2);
      ctx.scale(1, 0.5 + Math.abs(angleY * 0.4));
      ctx.strokeStyle = 'rgba(204, 255, 0, 0.85)'; // Neon lime
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 8, 4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.36, 0, Math.PI * 2);
      ctx.stroke();

      // Target blips on ring
      for (let b = 0; b < 3; b++) {
        const bAngle = (b * Math.PI * 2 / 3) + rotAngle;
        const bx = Math.cos(bAngle) * (Math.min(width, height) * 0.36);
        const by = Math.sin(bAngle) * (Math.min(width, height) * 0.36);
        ctx.fillStyle = '#161710';
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ccff00';
        ctx.stroke();
      }
      ctx.restore();

      // ── 3D Floating Lattice Nodes & Vectors ──
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        if (Math.abs(n.x) > width * 0.48) n.vx *= -1;
        if (Math.abs(n.y) > height * 0.48) n.vy *= -1;
        if (Math.abs(n.z) > 120) n.vz *= -1;

        // 3D perspective projection
        const fov = 300;
        const scale = fov / (fov + n.z + 100);
        const projX = (n.x + mouse.x * 0.15) * scale;
        const projY = (n.y + mouse.y * 0.15) * scale;

        // Draw node
        ctx.fillStyle = `rgba(22, 23, 16, ${n.alpha * scale})`;
        ctx.beginPath();
        ctx.arc(projX, projY, n.size * scale, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const scale2 = fov / (fov + n2.z + 100);
          const p2X = (n2.x + mouse.x * 0.15) * scale2;
          const p2Y = (n2.y + mouse.y * 0.15) * scale2;
          const dist = Math.hypot(projX - p2X, projY - p2Y);

          if (dist < 75) {
            ctx.strokeStyle = `rgba(22, 23, 16, ${(1 - dist / 75) * 0.25})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(p2X, p2Y);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
      requestAnimationFrame(drawHUD);
    }

    drawHUD();
  }


  // ── GEMINI MULTIMODAL LIVE REAL-TIME WEBSOCKET AUDIO STREAMING ENGINE ──
  function downsampleTo16k(buffer, inputSampleRate) {
    if (inputSampleRate === 16000) return buffer;
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  class GeminiLiveClient {
    constructor(callbacks) {
      this.ws = null;
      this.audioContext = null;
      this.inputAudioContext = null;
      this.mediaStream = null;
      this.scriptProcessor = null;
      this.analyser = null;
      this.outAnalyser = null;
      this.scheduledTime = 0;
      this.isConnected = false;
      this.isSpeaking = false;
      this.isInitialGreeting = true;
      this.callbacks = callbacks || {};
    }

    async connect(config) {
      this.scheduledTime = 0;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      this.outAnalyser = this.audioContext.createAnalyser();
      this.outAnalyser.fftSize = 64;

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${config.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange('connected', 'Connecting to Ultron...');
        }

        // Send Setup Payload to Gemini Live
        const setupMsg = {
          setup: {
            model: config.model || "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: config.voiceName || "Puck"
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: config.systemInstruction }]
            }
          }
        };
        this.ws.send(JSON.stringify(setupMsg));
      };

      this.ws.onmessage = async (event) => {
        let data = event.data;
        if (data instanceof Blob) {
          data = await data.text();
        }
        try {
          const response = JSON.parse(data);

          if (response.setupComplete) {
            console.log("Ultron Live: setupComplete acknowledged.");
            this.startMicrophone();

            if (this.callbacks.onStatusChange) {
              this.callbacks.onStatusChange('connected', 'Ultron Initializing...');
            }

            // Ultron introduces himself first when the session opens
            const greetingMsg = {
              clientContent: {
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: "Introduce yourself in one or two punchy sentences as Ultron, Vince's personal AI assistant, and ask how you can help them."
                      }
                    ]
                  }
                ],
                turnComplete: true
              }
            };
            this.ws.send(JSON.stringify(greetingMsg));
            return;
          }

          if (response.serverContent) {
            const { modelTurn } = response.serverContent;
            if (modelTurn && modelTurn.parts) {
              for (const part of modelTurn.parts) {
                if (part.text && this.callbacks.onTextChunk) {
                  this.callbacks.onTextChunk(part.text);
                }
                if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('audio/pcm')) {
                  this.playAudioChunk(part.inlineData.data);
                }
              }
            }
          }
        } catch (err) {
          console.error("Ultron Live parsing error:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.error("Ultron Live WS Error:", err);
      };

      this.ws.onclose = (event) => {
        console.warn(`Ultron Live closed: code=${event.code}, reason=${event.reason || 'none'}`);
        this.isConnected = false;
        this.stopMicrophone();
        
        let reasonMsg = 'Tap to speak';
        if (event.code === 1008 || event.code === 1003 || event.code === 1007) {
          reasonMsg = `Auth error (${event.code})`;
        }

        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange('idle', reasonMsg);
        }
      };
    }

    async startMicrophone() {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        this.inputAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const nativeSampleRate = this.inputAudioContext.sampleRate;
        const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);

        this.analyser = this.inputAudioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        // Silent sink to ensure audio processing runs without echoing to speakers
        const silentSink = this.inputAudioContext.createGain();
        silentSink.gain.value = 0;

        this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
        this.analyser.connect(this.scriptProcessor);
        this.scriptProcessor.connect(silentSink);
        silentSink.connect(this.inputAudioContext.destination);

        let speechFrames = 0;
        let silenceFrames = 0;
        let isUserSpeaking = false;

        this.scriptProcessor.onaudioprocess = (e) => {
          if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
          if (this.isInitialGreeting && this.isSpeaking) return;

          const rawInput = e.inputBuffer.getChannelData(0);

          // Energy check for instant UI response state
          let sum = 0;
          for (let i = 0; i < rawInput.length; i++) sum += rawInput[i] * rawInput[i];
          const rms = Math.sqrt(sum / rawInput.length);

          if (!this.isSpeaking && !this.isInitialGreeting) {
            if (rms > 0.025) {
              speechFrames++;
              silenceFrames = 0;
              if (speechFrames > 2 && !isUserSpeaking) {
                isUserSpeaking = true;
                if (this.callbacks.onStatusChange) {
                  this.callbacks.onStatusChange('listening', 'Ultron Listening...');
                }
              }
            } else {
              if (isUserSpeaking) {
                silenceFrames++;
                if (silenceFrames > 6) { // ~600ms pause after speaking
                  isUserSpeaking = false;
                  speechFrames = 0;
                  if (this.callbacks.onStatusChange) {
                    this.callbacks.onStatusChange('thinking', 'Ultron Thinking...');
                  }
                }
              }
            }
          }

          // Downsample to 16kHz
          const resampled = downsampleTo16k(rawInput, nativeSampleRate);

          // Convert Float32 to 16-bit PCM
          const pcm16 = new Int16Array(resampled.length);
          for (let i = 0; i < resampled.length; i++) {
            const s = Math.max(-1, Math.min(1, resampled[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Base64 encode
          let binary = '';
          const bytes = new Uint8Array(pcm16.buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = btoa(binary);

          const realTimeMsg = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Audio
                }
              ]
            }
          };
          this.ws.send(JSON.stringify(realTimeMsg));
        };

        if (this.callbacks.onStatusChange && !this.isInitialGreeting) {
          this.callbacks.onStatusChange('listening', 'Ultron Listening...');
        }
      } catch (err) {
        console.error("Microphone access error:", err);
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange('error', 'Microphone Denied');
        }
      }
    }

    playAudioChunk(base64Data) {
      this.isSpeaking = true;
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      if (!this.audioContext) return;
      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outAnalyser);
      this.outAnalyser.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.scheduledTime < currentTime) {
        this.scheduledTime = currentTime;
      }
      source.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;

      source.onended = () => {
        if (this.audioContext && this.scheduledTime <= this.audioContext.currentTime + 0.1) {
          this.isSpeaking = false;
          this.isInitialGreeting = false; // Initial greeting finished
          if (this.callbacks.onStatusChange && this.isConnected) {
            this.callbacks.onStatusChange('listening', 'Ultron Listening...');
          }
        }
      };

      if (this.callbacks.onStatusChange) {
        this.callbacks.onStatusChange('speaking', 'Ultron Speaking...');
      }
    }

    clearAudioQueue() {
      this.isSpeaking = false;
      this.isInitialGreeting = false;
      this.scheduledTime = 0;
      if (this.audioContext) {
        try {
          this.audioContext.close();
        } catch (e) {}
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        this.outAnalyser = this.audioContext.createAnalyser();
        this.outAnalyser.fftSize = 64;
      }
    }

    stopMicrophone() {
      if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
      }
      if (this.inputAudioContext) {
        try {
          this.inputAudioContext.close();
        } catch (e) {}
        this.inputAudioContext = null;
      }
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
      }
    }

    disconnect() {
      this.stopMicrophone();
      this.clearAudioQueue();
      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {}
        this.ws = null;
      }
      this.isConnected = false;
      this.isSpeaking = false;
    }
  }


  // ── VOICE-ONLY CONTROLLER ──
  const chatFab = document.getElementById('ai-chat-fab');
  const chatWidget = document.getElementById('ai-chat-widget');
  const chatClose = document.getElementById('ai-chat-close');
  const voiceMicBtn = document.getElementById('voice-mic-trigger');
  const voiceStatus = document.getElementById('voice-status');
  const waveCanvas = document.getElementById('voice-waveform-canvas');

  if (chatFab && chatWidget) {
    let liveClient = null;
    let liveConfig = null;
    let waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
    let wavePhase = 0;
    let streamState = 'idle';

    async function fetchLiveConfig() {
      if (window.LOCAL_CONFIG && window.LOCAL_CONFIG.apiKey) {
        return window.LOCAL_CONFIG;
      }
      if (liveConfig) return liveConfig;
      try {
        const res = await fetch(`${BASE_API_URL}/api/live-config`);
        if (!res.ok) throw new Error("Could not fetch live config from server");
        liveConfig = await res.json();
        return liveConfig;
      } catch (err) {
        console.warn("Live config fetch error:", err);
        return null;
      }
    }

    const voiceHintBadge = document.querySelector('.voice-hint-badge');

    function updateVoiceUI(state, title) {
      streamState = state;
      if (voiceStatus && title) voiceStatus.textContent = title;

      if (voiceMicBtn) {
        voiceMicBtn.className = 'voice-mic-button';
        if (state === 'listening' || state === 'connected') voiceMicBtn.classList.add('listening');
        if (state === 'speaking') voiceMicBtn.classList.add('speaking');
        if (state === 'thinking') voiceMicBtn.classList.add('thinking');
      }

      if (voiceHintBadge) {
        if (state === 'speaking' || state === 'thinking') {
          voiceHintBadge.innerHTML = '<i class="bi bi-hand-index-thumb-fill"></i> Tap mic to interrupt Ultron';
        } else if (state === 'listening') {
          voiceHintBadge.innerHTML = '<i class="bi bi-mic-fill"></i> Ultron is listening to you...';
        } else {
          voiceHintBadge.innerHTML = '<i class="bi bi-chat-quote"></i> Speak naturally • Tap mic to interrupt';
        }
      }
    }

    async function startLiveSession() {
      const config = await fetchLiveConfig();
      if (!config || !config.apiKey) {
        updateVoiceUI('error', 'API Config Missing');
        return;
      }

      if (liveClient) {
        liveClient.disconnect();
      }

      liveClient = new GeminiLiveClient({
        onStatusChange: (state, title) => {
          updateVoiceUI(state, title);
        }
      });

      liveClient.connect(config);
    }

    function stopLiveSession() {
      if (liveClient) {
        liveClient.disconnect();
        liveClient = null;
      }
      updateVoiceUI('idle', 'Tap to speak');
    }

    chatFab.addEventListener('click', () => {
      chatWidget.classList.remove('ai-chat-hidden');
      if (!liveClient || !liveClient.isConnected) {
        startLiveSession();
      }
    });

    chatClose.addEventListener('click', () => {
      stopLiveSession();
      chatWidget.classList.add('ai-chat-hidden');
    });

    if (voiceMicBtn) {
      voiceMicBtn.addEventListener('click', () => {
        if (liveClient && liveClient.isConnected) {
          // Interrupt when AI is speaking or thinking -> immediately switch to listening
          if (liveClient.isSpeaking || streamState === 'thinking' || streamState === 'speaking') {
            liveClient.clearAudioQueue();
            updateVoiceUI('listening', 'Ultron Listening...');
          } else {
            // Already listening: continue active listening
            updateVoiceUI('listening', 'Ultron Listening...');
          }
        } else {
          startLiveSession();
        }
      });
    }

    // ── Real-Time FFT Waveform Visualizer ──
    if (waveCanvas && waveCtx) {
      function drawWaveform() {
        const w = waveCanvas.width = 120;
        const h = waveCanvas.height = 120;
        waveCtx.clearRect(0, 0, w, h);

        const cy = h / 2;
        wavePhase += 0.05;

        let amp = 8;
        if (streamState === 'thinking') {
          wavePhase += 0.12;
          amp = 18 + Math.sin(wavePhase * 2) * 6;
        } else if (liveClient) {
          if (streamState === 'speaking' && liveClient.outAnalyser) {
            const dataArray = new Uint8Array(32);
            liveClient.outAnalyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            amp = Math.max(12, (sum / dataArray.length) * 0.45);
          } else if (streamState === 'listening' && liveClient.analyser) {
            const dataArray = new Uint8Array(32);
            liveClient.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            amp = Math.max(10, (sum / dataArray.length) * 0.5);
          }
        }

        // Wave Layer 1 (Lime Neon)
        waveCtx.strokeStyle = 'rgba(204, 255, 0, 0.9)';
        waveCtx.lineWidth = 2.5;
        waveCtx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = cy + Math.sin(x * 0.08 + wavePhase) * (amp * Math.sin(x / w * Math.PI));
          if (x === 0) waveCtx.moveTo(x, y);
          else waveCtx.lineTo(x, y);
        }
        waveCtx.stroke();

        // Wave Layer 2 (Cyan/Ink)
        waveCtx.strokeStyle = (streamState === 'speaking' || streamState === 'thinking') ? 'rgba(0, 229, 255, 0.9)' : 'rgba(22, 23, 16, 0.35)';
        waveCtx.lineWidth = 2;
        waveCtx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = cy + Math.cos(x * 0.09 - wavePhase * 1.3) * ((amp * 0.8) * Math.sin(x / w * Math.PI));
          if (x === 0) waveCtx.moveTo(x, y);
          else waveCtx.lineTo(x, y);
        }
        waveCtx.stroke();

        requestAnimationFrame(drawWaveform);
      }
      drawWaveform();
    }
  }

});
