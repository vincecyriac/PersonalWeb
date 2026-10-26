import { initScene } from './scene.js';
import { initScrollEffects } from './scroll-effects.js?v=20261026';
import { initOfflineMode } from './offline.js?v=ride-kochi-20261026';
import { createWebsiteGuide, FRIDAY_TOOLS } from './friday-guide.js';

const isEmulator = ['5000', '5005', '8080'].includes(window.location.port);
const IS_LOCAL_STATIC = ['localhost', '127.0.0.1'].includes(window.location.hostname) && !isEmulator;
const BASE_API_URL = IS_LOCAL_STATIC ? 'https://personalweb-2d846.web.app' : '';

document.addEventListener('DOMContentLoaded', () => {
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  initScene(motionQuery);
  initScrollEffects(motionQuery);
  initOfflineMode(motionQuery);
  const now = new Date();
  const anniversaryPassed = now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() >= 10);
  document.getElementById('exp-n').textContent = (now.getFullYear() - 2020 - (anniversaryPassed ? 0 : 1)) + '+';
  document.getElementById('footer-year').textContent = now.getFullYear();

  const mobBtn = document.getElementById('mob-menu-btn');
  const mobNav = document.getElementById('mob-nav');
  function closeMobMenu(restoreFocus = false) {
    mobNav.classList.remove('open');mobNav.inert = true;
    mobBtn.setAttribute('aria-expanded', 'false');mobBtn.setAttribute('aria-label', 'Open menu');
    if (restoreFocus) mobBtn.focus();
  }
  mobBtn.addEventListener('click', () => {
    const open = !mobNav.classList.contains('open');
    mobNav.classList.toggle('open', open);mobNav.inert = !open;
    mobBtn.setAttribute('aria-expanded', String(open));mobBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('#mob-nav a').forEach(link => link.addEventListener('click', () => closeMobMenu()));
  document.addEventListener('keydown', e => {if (e.key === 'Escape' && mobNav.classList.contains('open')) closeMobMenu(true);});
  document.addEventListener('click', e => {if (!mobNav.contains(e.target) && !mobBtn.contains(e.target)) closeMobMenu();});
  matchMedia('(min-width: 801px)').addEventListener('change', e => {if (e.matches) closeMobMenu();});
  const navLinks = document.querySelectorAll('.nav-links a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.hash === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin:'-15% 0px -65% 0px'});
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  const moreButton = document.getElementById('show-more-projects-btn');
  const archive = document.getElementById('more-projects-container');
  moreButton.addEventListener('click', () => {
    archive.hidden = !archive.hidden;
    moreButton.setAttribute('aria-expanded', String(!archive.hidden));
    moreButton.innerHTML = archive.hidden ? 'More from the archive <span>+</span>' : 'Close the archive <span>−</span>';
  });

  // ── Contact Form (EmailJS) ──
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');

  // Hardcoded config from original site
  const EMAILJS_PUBLIC_KEY = '9BCKsdm0TPj6SYs1X';
  const EMAILJS_SERVICE_ID = 'service_7z12yjm';
  const EMAILJS_TEMPLATE_ID = 'template_02uikno';

  if (form) {
    if (window.emailjs) window.emailjs.init(EMAILJS_PUBLIC_KEY);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.emailjs) {
        showStatus(statusEl, 'error', 'The form service is unavailable. Please email vincecyriac.dev@gmail.com.');
        return;
      }

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

      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
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
      this.disposed = false;
    }

    prepareAudio() {
      // Resume inside the button gesture before fetching config or connecting.
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      this.audioContext.resume().catch(() => {});
      this.outAnalyser = this.audioContext.createAnalyser();
      this.outAnalyser.fftSize = 64;
    }

    respondToTools(calls) {
      if (this.disposed || this.ws?.readyState !== WebSocket.OPEN) return;
      const functionResponses = calls.map(call => {
        let output;
        try {
          output = call.name === 'scroll_to_section'
            ? this.callbacks.onNavigate?.(call.args?.section)
            : call.name === 'open_link'
            ? this.callbacks.onOpenLink?.(call.args?.url, call.args?.title)
            : { success: false, error: 'Unknown function' };
        } catch {
          output = { success: false, error: 'Action could not be completed' };
        }
        return { id: call.id, name: call.name, response: { output: output || { success: false, error: 'Session ended' } } };
      });
      this.ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
    }

    async connect(config) {
      this.scheduledTime = 0;
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${config.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange('connected', 'Connecting to FRIDAY...');
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
                    voiceName: config.voiceName || "Aoede"
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: config.systemInstruction }]
            },
            tools: [{ functionDeclarations: FRIDAY_TOOLS }]
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
          if (this.disposed) return;
          const response = JSON.parse(data);

          if (response.setupComplete) {
            console.log("FRIDAY Live: setupComplete acknowledged.");
            if (!await this.startMicrophone() || this.disposed) return;

            if (this.callbacks.onStatusChange) {
              this.callbacks.onStatusChange('connected', 'FRIDAY Initializing...');
            }

            // FRIDAY introduces herself first when the session opens
            const greetingMsg = {
              clientContent: {
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: "Introduce yourself in one or two punchy sentences as FRIDAY, Vince's personal AI assistant, and ask how you can help them."
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

          // Both Live API call formats share the same dispatcher and truthful result.
          if (response.toolCall?.functionCalls) {
            this.respondToTools(response.toolCall.functionCalls);
          }

          if (response.serverContent) {
            const { modelTurn } = response.serverContent;
            if (modelTurn && modelTurn.parts) {
              for (const part of modelTurn.parts) {
                if (part.functionCall) this.respondToTools([part.functionCall]);
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
          console.error("FRIDAY Live parsing error:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.error("FRIDAY Live WS Error:", err);
      };

      this.ws.onclose = (event) => {
        console.warn(`FRIDAY Live closed: code=${event.code}, reason=${event.reason || 'none'}`);
        this.isConnected = false;
        this.stopMicrophone();
        
        let reasonMsg = 'Tap to speak';
        if (event.code === 1008 || event.code === 1003 || event.code === 1007) {
          reasonMsg = `Auth error (${event.code})`;
        }

        if (this.callbacks.onStatusChange) {
          const failed = event.code !== 1000 && event.code !== 1001;
          this.callbacks.onStatusChange(failed ? 'error' : 'idle', failed && reasonMsg === 'Tap to speak' ? 'Connection lost. Tap the orb to retry.' : reasonMsg);
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

        if (this.disposed) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
          return;
        }
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
                  this.callbacks.onStatusChange('listening', 'FRIDAY Listening...');
                }
              }
            } else {
              if (isUserSpeaking) {
                silenceFrames++;
                if (silenceFrames > 6) { // ~600ms pause after speaking
                  isUserSpeaking = false;
                  speechFrames = 0;
                  if (this.callbacks.onStatusChange) {
                    this.callbacks.onStatusChange('thinking', 'FRIDAY Thinking...');
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
          this.callbacks.onStatusChange('listening', 'FRIDAY Listening...');
        }
        return true;
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
            this.callbacks.onStatusChange('listening', 'FRIDAY Listening...');
          }
        }
      };

      if (this.callbacks.onStatusChange) {
        this.callbacks.onStatusChange('speaking', 'FRIDAY Speaking...');
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
      this.disposed = true;
      this.stopMicrophone();
      this.isSpeaking = false;
      this.scheduledTime = 0;
      if (this.audioContext) {
        this.audioContext.close().catch(() => {});
        this.audioContext = null;
      }
      if (this.ws) {
        this.ws.onclose = null;
        this.ws.onmessage = null;
        this.ws.onopen = null;
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

  if (chatFab && chatWidget) {
    let liveClient = null;
    let liveConfig = null;
    let websiteGuide = null;
    const guideLocation = document.getElementById('voice-guide-location');
    const expandVoice = document.getElementById('voice-expand');
    function setGuiding(active) {
      chatWidget.classList.toggle('is-guiding', active);
      if (expandVoice) expandVoice.hidden = !active;
    }
    expandVoice?.addEventListener('click', () => { setGuiding(false); chatClose.focus(); });
    let sessionVersion = 0;
    let connecting = false;
    let voiceOrb = null;
    let voiceOrbLoading = null;
    const audioBins = new Uint8Array(32);
    let streamState = 'idle';

    const orbState = state => ({ connecting: 'thinking', connected: 'listening', error: 'offline' }[state] || state);
    function readAudioLevel() {
      const analyser = streamState === 'speaking' ? liveClient?.outAnalyser : streamState === 'listening' ? liveClient?.analyser : null;
      if (!analyser) return 0;
      analyser.getByteFrequencyData(audioBins);
      return Math.min(1, audioBins.reduce((sum, value) => sum + value, 0) / audioBins.length / 128);
    }
    async function ensureVoiceOrb() {
      if (voiceOrb) { voiceOrb.setActive(true); return; }
      if (voiceOrbLoading || !voiceMicBtn) return;
      voiceOrbLoading = import('./friday-orb.js?v=voice-orb-20261023')
        .then(({ createFridayOrb }) => {
          voiceOrb = createFridayOrb(voiceMicBtn, {
            active: !chatWidget.classList.contains('ai-chat-hidden'),
            getLevel: readAudioLevel,
          });
          voiceOrb.setState(orbState(streamState));
        })
        .catch(() => {
          // The CSS orb remains an accessible, working voice button without WebGL.
          voiceMicBtn.classList.remove('orb-ready');
        })
        .finally(() => { voiceOrbLoading = null; });
      await voiceOrbLoading;
    }

    async function fetchLiveConfig() {
      if (window.LOCAL_CONFIG && window.LOCAL_CONFIG.apiKey) {
        return window.LOCAL_CONFIG;
      }
      if (liveConfig) return liveConfig;

      const endpoints = [
        `${BASE_API_URL}/api/live-config`,
        'https://personalweb-2d846.web.app/api/live-config',
        'https://us-central1-personalweb-2d846.cloudfunctions.net/getLiveConfig'
      ];

      for (const endpoint of endpoints) {
        if (!endpoint) continue;
        try {
          const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            liveConfig = await res.json();
            if (liveConfig && liveConfig.apiKey) {
              return liveConfig;
            }
          }
        } catch (err) {
          // try next endpoint
        }
      }

      console.warn("Live config fetch failed on all endpoints");
      return null;
    }

    const voiceHintBadge = document.querySelector('.voice-hint-badge');
    const voiceLinksContainer = document.getElementById('voice-links-container');

    function navigateToSection(section) {
      const result = websiteGuide.scroll(section);
      if (result.success) setGuiding(true);
      if (result.success && guideLocation) {
        guideLocation.textContent = `Showing / ${result.title}`;
        guideLocation.hidden = false;
      }
      return result;
    }

    function displayVoiceLink(url, title) {
      const destination = websiteGuide.resolveLink(url);
      if (!destination) return { success: false, error: 'Link is not in the website directory' };
      if (destination.section) return navigateToSection(destination.section);
      url = destination.url;
      // Attempt to open link in a new browser tab
      try {
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (win) win.focus();
      } catch (err) {
        console.warn("Direct window.open prevented by popup blocker:", err);
      }

      // Render interactive link button inside the voice panel
      if (voiceLinksContainer) {
        voiceLinksContainer.innerHTML = '';
        const linkEl = document.createElement('a');
        linkEl.href = url;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';
        linkEl.className = 'voice-link-badge';

        let iconClass = 'bi-box-arrow-up-right';
        if (url.includes('calendar.app.google') || url.includes('calendar')) {
          iconClass = 'bi-calendar-event-fill';
        } else if (url.includes('friday.vincecyriac.dev')) {
          iconClass = 'bi-cpu-fill';
        } else if (url.includes('anakulam')) {
          iconClass = 'bi-geo-alt-fill';
        } else if (url.includes('drive.google') || url.includes('resume')) {
          iconClass = 'bi-file-earmark-person-fill';
        } else if (url.includes('linkedin')) {
          iconClass = 'bi-linkedin';
        } else if (url.includes('github')) {
          iconClass = 'bi-github';
        } else if (url.startsWith('mailto:')) {
          iconClass = 'bi-envelope-fill';
        }

        const icon = document.createElement('i');
        icon.className = `bi ${iconClass}`;
        const label = document.createElement('span');
        label.textContent = title || 'Open Link';
        linkEl.append(icon, label);
        voiceLinksContainer.appendChild(linkEl);
      }
      return { success: true, url, linkDisplayed: true, message: 'Opening requested; a clickable link is available if the browser blocks the popup.' };
    }

    function updateVoiceUI(state, title) {
      streamState = state;
      if (voiceStatus && title) voiceStatus.textContent = title;

      const visualState = orbState(state);
      voiceOrb?.setState(visualState);
      if (voiceMicBtn) {
        voiceMicBtn.dataset.state = visualState;
        voiceMicBtn.disabled = state === 'connecting';
        voiceMicBtn.setAttribute('aria-label', state === 'speaking' || state === 'thinking'
          ? 'Interrupt FRIDAY' : state === 'listening' || state === 'connected'
          ? 'End voice conversation' : state === 'error' ? 'Retry voice conversation' : 'Start voice conversation');
      }
      if (voiceHintBadge) {
        voiceHintBadge.textContent = state === 'speaking' || state === 'thinking'
          ? 'Tap the orb to interrupt FRIDAY.' : state === 'listening' || state === 'connected'
          ? 'Speak naturally. Tap the orb to end the conversation.' : state === 'connecting'
          ? 'Getting FRIDAY ready…' : state === 'error'
          ? 'Tap the orb to try again.' : 'Tap the orb to start a voice conversation.';
      }
    }

    async function startLiveSession() {
      if (connecting || (liveClient?.ws && liveClient.ws.readyState < WebSocket.CLOSING)) return;
      connecting = true;
      const version = ++sessionVersion;
      updateVoiceUI('connecting', 'Connecting to FRIDAY…');
      websiteGuide = createWebsiteGuide();
      if (liveClient) liveClient.disconnect();
      liveClient = new GeminiLiveClient({
        onStatusChange: (state, title) => {
          if (version !== sessionVersion) return;
          if (state === 'error') { liveClient?.disconnect(); liveClient = null; }
          updateVoiceUI(state, title);
        },
        onOpenLink: (url, title) => {
          if (version === sessionVersion) return displayVoiceLink(url, title);
        },
        onNavigate: section => {
          if (version === sessionVersion) return navigateToSection(section);
        }
      });

      try {
        liveClient.prepareAudio();
        const config = await fetchLiveConfig();
        if (version !== sessionVersion) return;
        if (!config?.apiKey) throw new Error('Missing voice configuration');
        await liveClient.connect({ ...config, systemInstruction: `${config.systemInstruction || ''}\n${websiteGuide.instruction}` });
        connecting = false;
      } catch (error) {
        if (version !== sessionVersion) return;
        liveClient?.disconnect();
        liveClient = null;
        connecting = false;
        updateVoiceUI('error', 'Could not connect. Tap the orb to try again.');
      }
    }

    function stopLiveSession() {
      sessionVersion++;
      connecting = false;
      if (liveClient) {
        liveClient.disconnect();
        liveClient = null;
      }
      if (voiceLinksContainer) {
        voiceLinksContainer.innerHTML = '';
      }
      if (guideLocation) guideLocation.hidden = true;
      setGuiding(false);
      updateVoiceUI('idle', 'Tap to speak');
    }

    function openVoicePanel() {
      if (!chatWidget.classList.contains('ai-chat-hidden')) return;
      chatWidget.classList.remove('ai-chat-hidden');
      chatWidget.inert = false;
      chatWidget.setAttribute('aria-hidden', 'false');
      chatFab.setAttribute('aria-expanded', 'true');
      chatClose.focus();
      ensureVoiceOrb();
      startLiveSession();
    }
    function closeVoicePanel() {
      voiceOrb?.setActive(false);
      stopLiveSession();
      chatWidget.classList.add('ai-chat-hidden');
      chatWidget.inert = true;
      chatWidget.setAttribute('aria-hidden', 'true');
      chatFab.setAttribute('aria-expanded', 'false');
      chatFab.focus();
    }
    chatFab.setAttribute('aria-controls', 'ai-chat-widget');
    chatFab.setAttribute('aria-expanded', 'false');
    chatFab.addEventListener('click', openVoicePanel);
    chatClose.addEventListener('click', closeVoicePanel);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !chatWidget.classList.contains('ai-chat-hidden')) closeVoicePanel();
    });

    if (voiceMicBtn) {
      voiceMicBtn.addEventListener('click', () => {
        if (liveClient && liveClient.isConnected) {
          // Interrupt when AI is speaking or thinking -> immediately switch to listening
          if (liveClient.isSpeaking || streamState === 'thinking' || streamState === 'speaking') {
            liveClient.clearAudioQueue();
            updateVoiceUI('listening', 'FRIDAY Listening...');
          } else {
            stopLiveSession();
          }
        } else {
          startLiveSession();
        }
      });
    }

    updateVoiceUI('idle', 'Meet your guide to my work.');
  }

});
