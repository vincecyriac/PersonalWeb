import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";

// ==========================================================================
// VINCE CYRIAC — MODERN PORTFOLIO — MAIN.JS
// ==========================================================================

const API_KEY = "AIzaSyBpguWxVdYAf2_to7BggQh7j8-8XII-9bo";

const SYSTEM_INSTRUCTION = `You are the AI assistant representing Vince Cyriac on his portfolio website.
You act as an expert technical proxy for him.
Profile & Facts:
- Vince Cyriac is a Lead / Senior Full-Stack AI & Frontend Engineer with 6+ years of professional experience (since August 2020) and 15+ shipped enterprise projects.
- Core Technical Skills: TypeScript, Python, JavaScript (ES6+), Angular, Vue.js, Nuxt.js, Node.js, Express, RxJS, Tailwind CSS, SQL, PostgreSQL, MySQL.
- AI & Modern Architecture: Gemini Live API, ONNX Runtime, Edge Computer Vision, Zero-Trust Architecture, Tailscale, Multi-agent workflows.
- Cloud & DevOps: Linux (Fedora/Ubuntu), AWS CloudFront, Docker, CI/CD pipelines, Vercel, Netlify, Technical SEO, Core Web Vitals optimization.
- Featured Project 01: Project Ultron — Multimodal Voice AI Assistant for macOS (Python, Gemini Live API, ONNX face detection, Zero-Trust Tailscale, macOS automation). GitHub: https://github.com/vincecyriac/project-ultron
- Featured Project 02: Anakulam Tourism Platform — High-performance travel web platform (https://anakulamtourism.com) with top SEO ranking.
- Other Enterprise Solutions: Real-time financial market data platforms (streaming quotes with sub-second latency), data-driven talent/recruitment platforms, and pandemic analytics (CoviTrack).
- Contact: vincecyriac.dev@gmail.com, LinkedIn: https://www.linkedin.com/in/vincecyriac/

Style & Tone:
- Keep answers concise, conversational, and direct (2-3 short paragraphs max).
- Format links cleanly as [LinkedIn](https://www.linkedin.com/in/vincecyriac/) or [Email](mailto:vincecyriac.dev@gmail.com).
- Avoid excessive horizontal dividers (---) or oversized headers. Use simple bullet points for lists.
- If asked about personal matters unrelated to his career or projects, politely decline and steer back to his engineering work.`;

let chatSession = null;

function getChatSession() {
  if (!chatSession) {
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        systemInstruction: SYSTEM_INSTRUCTION
      });
      chatSession = model.startChat({ history: [] });
    } catch (e) {
      console.error("Failed to initialize GoogleGenerativeAI:", e);
    }
  }
  return chatSession;
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

  mobLinks.forEach(link => {
    link.addEventListener('click', closeMobMenu);
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

  // ── Brutalist Particles ──
  const canvas = document.getElementById('hero-particles');
  const container = document.getElementById('hero-particle-container');
  
  if (canvas && container) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000, radius: 100 };

    function resize() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    const color = '#161710'; // Brutalist Ink color

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1.5; // Small dots
        this.density = (Math.random() * 30) + 1;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
      }
      
      update() {
        // Natural drift
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off edges
        if (this.x + this.size / 2 > canvas.width || this.x - this.size / 2 < 0) {
          this.vx *= -1;
        }
        if (this.y + this.size / 2 > canvas.height || this.y - this.size / 2 < 0) {
          this.vy *= -1;
        }

        // Mouse interaction (repel)
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let force = (mouse.radius - distance) / mouse.radius;
          let directionX = forceDirectionX * force * (this.density * 0.3);
          let directionY = forceDirectionY * force * (this.density * 0.3);
          
          this.x -= directionX;
          this.y -= directionY;
        }
      }

      draw() {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 6000); // higher density for networks
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        // Connect to mouse
        if (mouse.x !== -1000) {
          let mdx = particles[a].x - mouse.x;
          let mdy = particles[a].y - mouse.y;
          let mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 140) {
            ctx.strokeStyle = `rgba(22, 23, 16, ${1 - (mdist/140)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Connect to other particles
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            opacityValue = 1 - (distance / 100);
            ctx.strokeStyle = `rgba(22, 23, 16, ${opacityValue})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connect();
      requestAnimationFrame(animate);
    }

    initParticles();
    animate();
  }

  // ── AI CHAT WIDGET LOGIC ──
  const chatFab = document.getElementById('ai-chat-fab');
  const chatWidget = document.getElementById('ai-chat-widget');
  const chatClose = document.getElementById('ai-chat-close');
  const chatInput = document.getElementById('ai-chat-input');
  const chatSend = document.getElementById('ai-chat-send');
  const chatBody = document.getElementById('ai-chat-body');

  if (chatFab && chatWidget) {
    chatFab.addEventListener('click', () => {
      chatWidget.classList.remove('ai-chat-hidden');
      chatInput.focus();
    });

    chatClose.addEventListener('click', () => {
      chatWidget.classList.add('ai-chat-hidden');
    });

    const appendMessage = (text, sender = 'user') => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}`;
      
      let htmlContent = text;
      if (typeof window.marked !== 'undefined' && sender === 'bot') {
        htmlContent = window.marked.parse(text);
      } else {
        htmlContent = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, '<br>');
      }
      
      msgDiv.innerHTML = `<div class="msg-bubble">${htmlContent}</div>`;
      
      // Ensure all links open in a new tab
      msgDiv.querySelectorAll('a').forEach(a => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });

      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
      return msgDiv.querySelector('.msg-bubble');
    };

    const handleSend = async () => {
      const text = chatInput.value.trim();
      if (!text) return;

      chatInput.value = '';
      appendMessage(text, 'user');

      // Add typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.className = `ai-msg bot typing-wrapper`;
      typingDiv.innerHTML = `<div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
      chatBody.appendChild(typingDiv);
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const session = getChatSession();
        if (!session) throw new Error("Chat session could not be initialized");
        const result = await session.sendMessage(text);
        const response = await result.response.text();
        
        chatBody.removeChild(typingDiv);
        appendMessage(response, 'bot');
      } catch (err) {
        console.error("AI Error:", err);
        chatBody.removeChild(typingDiv);
        appendMessage("Sorry, I am having trouble connecting right now. Please verify your Google API key or try again in a moment.", 'bot');
      }
    };

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

});
