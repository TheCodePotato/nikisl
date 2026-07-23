/* ==========================================================================
   DASHA'S SECRET QUEST — INTERACTIVE GAME LOGIC & ENGINE (REFINED)
   Pure JavaScript (ES6+), Web Audio API, Canvas Particles, Hash Routing
   ========================================================================== */

(function () {
    'use strict';

    /* ══════════════════════════════════════════════════════════════════════
       1. CONFIGURATION (EASILY CUSTOMIZABLE)
    ══════════════════════════════════════════════════════════════════════ */
    const CONFIG = {
        HER_NAME: "Даша",
        HER_NICKNAME: "Дашенька",
        MY_NAME: "Никита",

        // Accepted passwords
        PASSWORDS: [
            "даша",
            "дашенька",
            "dasha",
            "dashenka",
            "лалаленд",
            "lalaland"
        ],

        // Telegram Gift
        TELEGRAM_GIFT_URL: "https://t.me/niekit",

        // Wrong password messages
        WRONG_PASSWORD_MESSAGES: [
            "Хмм... кажется, это не то слово 🤍",
            "Почти... но доступ открыт только одной особенной девушке ✨",
            "Не совсем :) Попробуй ещё раз.",
            "Маленькая подсказка... попробуй своё имя 😉"
        ],

        // STEP 2
        MEMORY_QUESTION: {
            title: "Небольшая проверка памяти",

            question: "Почему вообще появился этот маленький квест?",

            options: [
                {
                    text: "Потому что мы так заболтались, что смотреть фильм было уже слишком поздно перед работой Никиты ❤️",
                    correct: true
                },
                {
                    text: "Потому что La La Land исчез из интернета 🎬",
                    correct: false
                },
                {
                    text: "Потому что кто-то украл весь попкорн 🍿",
                    correct: false
                },
                {
                    text: "Потому что это секретная миссия NASA 🚀",
                    correct: false
                }
            ],

            wrongFeedback: "Хах 😄 Почти, но настоящая причина была немного другой."
        },

        // STEP 4
        ENVELOPES: [
            {
                id: 1,
                icon: "🎬",
                title: "Компенсация №1",
                text: "Официально подтверждается: следующий просмотр «La La Land» никуда не исчез. Он просто немного перенёсся."
            },
            {
                id: 2,
                icon: "✨",
                title: "Компенсация №2",
                text: "В качестве извинения был создан этот маленький квест. Потому что обычное «извини» показалось слишком скучным."
            },
            {
                id: 3,
                icon: "🎁",
                title: "Компенсация №3",
                text: "Главная награда успешно разблокирована. Telegram Gift ждёт тебя сразу после завершения миссии."
            }
        ],

        // Certificate
        CERTIFICATE: {
            header: "ОФИЦИАЛЬНЫЙ СЕРТИФИКАТ КОМПЕНСАЦИИ",

            title: "Настоящим подтверждается, что",

            recipient: "Дашенька",

            subtitle:
                "успешно прошла Компенсационную Миссию и официально получает:",

            items: [
                "🎁 Telegram Gift",
                "🎬 Право выбрать следующий фильм для нашего совместного просмотра",
                "😌 Бессрочное право напоминать Никите, что однажды он всё-таки уснул",
                "✨ И маленькое доказательство того, что иногда извинения могут быть чуть интереснее обычного сообщения"
            ],

            footer:
                "Выдано с полной искренностью 🤍",

            signName: "Никита"
        },

        // Final message (typewriter)
        FINAL_MESSAGE: `

Если честно...

Да, мы тогда так и не посмотрели «La La Land».

И знаешь... я совсем об этом не жалею.

Потому что вместо фильма мы просто разговаривали.

И если выбирать между каким-то фильмом и временем, которое я могу провести, общаясь с тобой, то для меня этот выбор очень простой.

Фильм никуда не убежит.

А такие разговоры для меня гораздо ценнее.

Поэтому мне всё равно хотелось выполнить своё обещание по-своему.

Не просто написать «извини», а сделать что-то, что существует только для тебя.

Надеюсь, этот маленький квест смог хотя бы немного поднять тебе настроение и вызвать улыбку.

Ну а «La La Land»...

Он никуда не делся.

Он нас просто ещё немного подождёт. 🤍
`
    };

    /* ══════════════════════════════════════════════════════════════════════
       2. AUDIO ENGINE (WEB AUDIO API SYNTHESIS FOR INTERACTIVE SOUNDS)
    ══════════════════════════════════════════════════════════════════════ */
    class QuestAudioEngine {
        constructor() {
            this.ctx = null;
        }

        initCtx() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playNote(freq, type = 'sine', duration = 0.3, volume = 0.15) {
            this.initCtx();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(volume, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {
                /* fallback silent */
            }
        }

        playTap() {
            this.playNote(440, 'sine', 0.08, 0.08);
        }

        playSuccess() {
            this.initCtx();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
            notes.forEach((freq, idx) => {
                setTimeout(() => this.playNote(freq, 'triangle', 0.4, 0.12), idx * 90);
            });
        }

        playError() {
            this.initCtx();
            this.playNote(180, 'sawtooth', 0.25, 0.1);
        }

        playStamp() {
            this.initCtx();
            this.playNote(110, 'triangle', 0.35, 0.35);
            setTimeout(() => this.playNote(75, 'sine', 0.45, 0.45), 45);
        }

        playSparkle() {
            this.initCtx();
            const freq = 1200 + Math.random() * 800;
            this.playNote(freq, 'sine', 0.15, 0.06);
        }

        playPrinterSound() {
            this.initCtx();
            const feedBeeps = [800, 1200, 950, 1100, 850, 1300];
            feedBeeps.forEach((freq, idx) => {
                setTimeout(() => this.playNote(freq, 'square', 0.04, 0.03), idx * 140);
            });
        }
    }

    const audio = new QuestAudioEngine();

    /* ══════════════════════════════════════════════════════════════════════
       3. BACKGROUND CANVAS PARTICLES & STAR ATTRACTION
    ══════════════════════════════════════════════════════════════════════ */
    class QuestCanvasParticles {
        constructor(canvasEl) {
            this.canvas = canvasEl;
            this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
            this.particles = [];
            this.numParticles = 65;
            this.touchPos = { x: null, y: null, active: false };

            if (this.canvas) {
                this.init();
            }
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => this.resize());

            this.particles = [];
            for (let i = 0; i < this.numParticles; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    radius: Math.random() * 2 + 0.5,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    alpha: Math.random() * 0.7 + 0.3,
                    tone: Math.random()
                });
            }

            window.addEventListener('touchmove', e => {
                if (e.touches.length > 0) {
                    this.touchPos.x = e.touches[0].clientX;
                    this.touchPos.y = e.touches[0].clientY;
                    this.touchPos.active = true;
                }
            }, { passive: true });

            window.addEventListener('touchend', () => { this.touchPos.active = false; });
            window.addEventListener('mousemove', e => {
                this.touchPos.x = e.clientX;
                this.touchPos.y = e.clientY;
            });

            this.render();
        }

        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        render() {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach(p => {
                if (this.touchPos.active && this.touchPos.x !== null) {
                    const dx = this.touchPos.x - p.x;
                    const dy = this.touchPos.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        p.vx += (dx / dist) * 0.05;
                        p.vy += (dy / dist) * 0.05;
                    }
                }

                p.x += p.vx;
                p.y += p.vy;

                p.vx *= 0.98;
                p.vy *= 0.98;

                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                const isRose = p.tone > 0.38;
                const isCocoa = p.tone > 0.18 && p.tone <= 0.38;
                this.ctx.fillStyle = isRose
                    ? `rgba(244, 114, 182, ${p.alpha})`
                    : isCocoa
                        ? `rgba(180, 83, 9, ${p.alpha * 0.82})`
                        : `rgba(255, 247, 251, ${p.alpha * 0.68})`;
                this.ctx.shadowBlur = isRose || isCocoa ? 8 : 2;
                this.ctx.shadowColor = isRose ? '#f472b6' : isCocoa ? '#b45309' : '#fff7fb';
                this.ctx.fill();
            });

            requestAnimationFrame(() => this.render());
        }
    }

    /* ══════════════════════════════════════════════════════════════════════
       4. STATE MANAGEMENT
    ══════════════════════════════════════════════════════════════════════ */
    class QuestState {
        constructor() {
            this.authenticated = false;
            this.stepScanDone = false;
            this.stepQuizDone = false;
            this.stepStarsDone = false;
            this.stepApprovalDone = false;
            this.openedEnvelopes = new Set();
            this.sealTaps = 0;
        }
    }

    const state = new QuestState();

    /* ══════════════════════════════════════════════════════════════════════
       5. MAIN QUEST CONTROLLER
    ══════════════════════════════════════════════════════════════════════ */
    class QuestController {
        constructor() {
            this.container = document.getElementById('dasha-quest-container');
            this.bgCanvas = document.getElementById('q-bg-canvas');
            this.canvasEngine = null;

            this.initElements();
            this.bindEvents();
            this.checkInitialHash();
        }

        initElements() {
            if (!this.container) return;

            this.closeBtn = this.container.querySelector('.q-close-btn');

            // Sections
            this.secLogin = document.getElementById('q-sec-login');
            this.secIntro = document.getElementById('q-sec-intro');
            this.secMemory = document.getElementById('q-sec-memory');
            this.secReflex = document.getElementById('q-sec-reflex');
            this.secApproval = document.getElementById('q-sec-approval');
            this.secCertificate = document.getElementById('q-sec-certificate');

            // Toast
            this.toastEl = document.getElementById('q-toast');

            if (this.bgCanvas) {
                this.canvasEngine = new QuestCanvasParticles(this.bgCanvas);
            }
        }

        bindEvents() {
            window.addEventListener('hashchange', () => this.handleHashChange());

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.closeQuest());
            }

            // Step 0: Login
            const loginBtn = document.getElementById('q-login-btn');
            const passwordInput = document.getElementById('q-password-input');
            if (loginBtn && passwordInput) {
                loginBtn.addEventListener('click', () => this.handleLoginSubmit());
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleLoginSubmit();
                });
            }

            // Step 1: Scanner Continue
            const scanContinueBtn = document.getElementById('q-scan-continue-btn');
            if (scanContinueBtn) {
                scanContinueBtn.addEventListener('click', () => {
                    audio.playTap();
                    window.location.hash = '#memory';
                });
            }

            // Step 2: Quiz Continue
            const quizContinueBtn = document.getElementById('q-quiz-continue-btn');
            if (quizContinueBtn) {
                quizContinueBtn.addEventListener('click', () => {
                    audio.playTap();
                    window.location.hash = '#reflex';
                });
            }

            // Step 3: Star Challenge Continue
            const starContinueBtn = document.getElementById('q-star-continue-btn');
            if (starContinueBtn) {
                starContinueBtn.addEventListener('click', () => {
                    audio.playTap();
                    window.location.hash = '#approval';
                });
            }

            // Step 4: Approval Continue
            const approvalContinueBtn = document.getElementById('q-approval-continue-btn');
            if (approvalContinueBtn) {
                approvalContinueBtn.addEventListener('click', () => {
                    audio.playTap();
                    window.location.hash = '#certificate';
                });
            }

            // Easter Egg: Seal Tap
            const certSeal = document.getElementById('q-cert-seal');
            if (certSeal) {
                certSeal.addEventListener('click', () => this.handleSealTap());
            }

            // Secret Logo Trigger (5 rapid taps)
            let logoTaps = 0;
            let logoTimer = null;
            document.querySelectorAll('.nav-logo').forEach(logo => {
                logo.addEventListener('click', (e) => {
                    logoTaps++;
                    clearTimeout(logoTimer);
                    logoTimer = setTimeout(() => { logoTaps = 0; }, 1500);

                    if (logoTaps >= 5) {
                        e.preventDefault();
                        logoTaps = 0;
                        this.showToast("✨ Секретный вход активирован!");
                        window.location.hash = '#login';
                    }
                });
            });
        }

        checkInitialHash() {
            const validHashes = ['#dasha', '#login', '#intro', '#mission', '#memory', '#reflex', '#approval', '#certificate'];
            if (validHashes.includes(window.location.hash)) {
                this.handleHashChange();
            }
        }

        handleHashChange() {
            const hash = window.location.hash;
            const questHashes = ['#dasha', '#login', '#intro', '#mission', '#memory', '#reflex', '#approval', '#certificate'];

            if (!questHashes.includes(hash)) {
                this.closeQuest();
                return;
            }

            this.openQuest();

            if (!state.authenticated && hash !== '#login' && hash !== '#dasha') {
                window.location.hash = '#login';
                return;
            }

            if (hash === '#dasha') {
                window.location.hash = '#login';
                return;
            }

            switch (hash) {
                case '#login':
                    this.showSection(this.secLogin);
                    break;
                case '#intro':
                case '#mission':
                    this.showSection(this.secIntro);
                    this.startScannerAnimation();
                    break;
                case '#memory':
                    this.showSection(this.secMemory);
                    this.renderQuiz();
                    break;
                case '#reflex':
                    this.showSection(this.secReflex);
                    this.startStarGame();
                    break;
                case '#approval':
                    this.showSection(this.secApproval);
                    this.renderEnvelopes();
                    break;
                case '#certificate':
                    this.showSection(this.secCertificate);
                    this.renderCertificate();
                    break;
            }
        }

        openQuest() {
            if (!this.container) return;
            this.container.classList.add('q-open');
            document.body.style.overflow = 'hidden';
            if (window.Lenis) {
                try { window.lenis?.stop(); } catch (e) { }
            }
        }

        closeQuest() {
            if (!this.container) return;
            this.container.classList.remove('q-open');
            document.body.style.overflow = '';
            if (window.Lenis) {
                try { window.lenis?.start(); } catch (e) { }
            }
        }

        showSection(targetSec) {
            [this.secLogin, this.secIntro, this.secMemory, this.secReflex, this.secApproval, this.secCertificate].forEach(sec => {
                if (sec) sec.classList.remove('q-active');
            });
            if (targetSec) {
                targetSec.classList.add('q-active');
            }
        }

        showToast(msg) {
            if (!this.toastEl) return;
            this.toastEl.textContent = msg;
            this.toastEl.classList.add('q-toast-show');
            setTimeout(() => {
                this.toastEl.classList.remove('q-toast-show');
            }, 3000);
        }

        /* ─── STEP 0: LOGIN ──────────────────────────────────────────────── */
        handleLoginSubmit() {
            const input = document.getElementById('q-password-input');
            const feedback = document.getElementById('q-login-feedback');
            const card = document.getElementById('q-login-card');
            if (!input) return;

            const val = input.value.trim().toLowerCase();
            const isCorrect = CONFIG.PASSWORDS.some(p => p.toLowerCase() === val);

            if (isCorrect) {
                state.authenticated = true;
                audio.playSuccess();
                if (feedback) {
                    feedback.style.color = '#fbcfe8';
                    feedback.textContent = 'Доступ разрешён! Запуск миссии... ✨';
                }
                setTimeout(() => {
                    window.location.hash = '#intro';
                }, 600);
            } else {
                audio.playError();
                if (card) {
                    card.classList.remove('q-shake');
                    void card.offsetWidth;
                    card.classList.add('q-shake');
                }
                if (feedback) {
                    feedback.style.color = '#f472b6';
                    const randomMsg = CONFIG.WRONG_PASSWORD_MESSAGES[
                        Math.floor(Math.random() * CONFIG.WRONG_PASSWORD_MESSAGES.length)
                    ];
                    feedback.textContent = randomMsg;
                }
            }
        }

        /* ─── STEP 1: SCANNER ────────────────────────────────────────────── */
        startScannerAnimation() {
            const barFill = document.getElementById('q-scan-bar-fill');
            const statusText = document.getElementById('q-scan-status-text');
            const continueBtn = document.getElementById('q-scan-continue-btn');

            if (!barFill || state.stepScanDone) {
                if (continueBtn) continueBtn.style.display = 'inline-flex';
                return;
            }

            if (continueBtn) continueBtn.style.display = 'none';

            let pct = 0;
            const logs = [
                "Инициализация биометрии...",
                "Сканирование профиля...",
                "Анализ уровня милоты...",
                "Уровень милоты: 100%",
                "Личность подтверждена: Дашенька 💛"
            ];

            const interval = setInterval(() => {
                pct += Math.floor(Math.random() * 8) + 4;
                if (pct >= 100) pct = 100;
                barFill.style.width = pct + '%';

                const logIdx = Math.min(Math.floor((pct / 100) * logs.length), logs.length - 1);
                if (statusText) statusText.textContent = logs[logIdx];

                if (pct >= 100) {
                    clearInterval(interval);
                    state.stepScanDone = true;
                    audio.playSuccess();
                    if (continueBtn) continueBtn.style.display = 'inline-flex';
                }
            }, 80);
        }

        /* ─── STEP 2: MEMORY QUIZ ────────────────────────────────────────── */
        renderQuiz() {
            const quizContainer = document.getElementById('q-quiz-options-wrap');
            const quizFeedback = document.getElementById('q-quiz-feedback');
            const continueBtn = document.getElementById('q-quiz-continue-btn');

            if (!quizContainer) return;
            quizContainer.innerHTML = '';

            if (continueBtn) continueBtn.style.display = state.stepQuizDone ? 'inline-flex' : 'none';

            CONFIG.MEMORY_QUESTION.options.forEach((opt, idx) => {
                const optEl = document.createElement('div');
                optEl.className = 'q-quiz-opt';
                optEl.innerHTML = `
                    <div class="q-quiz-bullet">${String.fromCharCode(65 + idx)}</div>
                    <div>${opt.text}</div>
                `;

                optEl.addEventListener('click', () => {
                    audio.playTap();
                    if (opt.correct) {
                        optEl.classList.add('q-selected-correct');
                        audio.playSuccess();
                        if (quizFeedback) {
                            quizFeedback.style.color = '#fbcfe8';
                            quizFeedback.textContent = 'Именно так! 😴 Никита — сурок. Зачёт!';
                        }
                        state.stepQuizDone = true;
                        if (continueBtn) continueBtn.style.display = 'inline-flex';
                    } else {
                        optEl.classList.add('q-selected-wrong');
                        audio.playError();
                        optEl.classList.remove('q-shake');
                        void optEl.offsetWidth;
                        optEl.classList.add('q-shake');

                        if (quizFeedback) {
                            quizFeedback.style.color = '#f472b6';
                            quizFeedback.textContent = CONFIG.MEMORY_QUESTION.wrongFeedback;
                        }
                    }
                });

                quizContainer.appendChild(optEl);
            });
        }

        /* ─── STEP 3: STAR CHALLENGE ─────────────────────────────────────── */
        startStarGame() {
            const area = document.getElementById('q-star-game-area');
            const dots = document.querySelectorAll('.q-round-dot');
            const continueBtn = document.getElementById('q-star-continue-btn');
            const hintText = document.getElementById('q-star-hint');

            if (!area) return;

            let currentRound = 0;
            const totalRounds = 3;

            if (state.stepStarsDone) {
                if (continueBtn) continueBtn.style.display = 'inline-flex';
                if (hintText) hintText.textContent = 'Все звёзды пойманы! ✨';
                dots.forEach(d => d.classList.add('q-done'));
                return;
            }

            if (continueBtn) continueBtn.style.display = 'none';

            const spawnStar = () => {
                area.innerHTML = '';
                if (currentRound >= totalRounds) {
                    state.stepStarsDone = true;
                    audio.playSuccess();
                    if (hintText) hintText.textContent = 'Отличная реакция! Все звёзды у тебя ✨';
                    if (continueBtn) continueBtn.style.display = 'inline-flex';
                    return;
                }

                if (hintText) hintText.textContent = `Поймай сияющую звезду (${currentRound + 1}/3)!`;

                const star = document.createElement('div');
                star.className = 'q-star-target';
                star.innerHTML = '⭐';

                const maxX = area.clientWidth - 60;
                const maxY = area.clientHeight - 60;
                const posX = Math.max(30, Math.floor(Math.random() * maxX) + 30);
                const posY = Math.max(30, Math.floor(Math.random() * maxY) + 30);

                star.style.left = posX + 'px';
                star.style.top = posY + 'px';

                star.addEventListener('click', () => {
                    audio.playSparkle();
                    if (navigator.vibrate) {
                        try { navigator.vibrate(40); } catch (e) { }
                    }

                    if (dots[currentRound]) dots[currentRound].classList.add('q-done');
                    currentRound++;
                    spawnStar();
                });

                area.appendChild(star);
            };

            spawnStar();
        }

        /* ─── STEP 4: MANDATORY ENVELOPES & STAMP ───────────────────────── */
        renderEnvelopes() {
            const grid = document.getElementById('q-envelopes-grid');
            const feedback = document.getElementById('q-approval-feedback');
            const continueBtn = document.getElementById('q-approval-continue-btn');
            if (!grid) return;

            grid.innerHTML = '';

            if (state.stepApprovalDone) {
                if (continueBtn) continueBtn.style.display = 'inline-flex';
                if (feedback) feedback.textContent = 'Все условия изучены! Заявка официально утверждена.';
            } else {
                if (continueBtn) continueBtn.style.display = 'none';
            }

            CONFIG.ENVELOPES.forEach((item) => {
                const envEl = document.createElement('div');
                envEl.className = 'q-envelope' + (state.openedEnvelopes.has(item.id) ? ' q-opened' : '');
                envEl.innerHTML = state.openedEnvelopes.has(item.id) ? item.icon : '💌';

                envEl.addEventListener('click', () => {
                    if (state.openedEnvelopes.has(item.id)) {
                        if (feedback) feedback.textContent = `${item.title}: ${item.text}`;
                        return;
                    }

                    state.openedEnvelopes.add(item.id);
                    envEl.classList.add('q-opened');
                    envEl.innerHTML = item.icon;
                    audio.playTap();

                    const count = state.openedEnvelopes.size;
                    const total = CONFIG.ENVELOPES.length;

                    if (feedback) {
                        feedback.textContent = `${item.title}: ${item.text} (Изучено ${count} из ${total})`;
                    }

                    // Check if all envelopes have been read
                    if (count === total && !state.stepApprovalDone) {
                        state.stepApprovalDone = true;
                        audio.playStamp();

                        // Create rubber stamp
                        const stampWrap = document.createElement('div');
                        stampWrap.className = 'q-stamp-container';
                        stampWrap.innerHTML = `<div class="q-stamp q-stamp-animate">ОДОБРЕНО</div>`;
                        this.secApproval.appendChild(stampWrap);

                        setTimeout(() => {
                            audio.playSuccess();
                            if (feedback) {
                                feedback.style.color = '#fbcfe8';
                                feedback.textContent = 'ВСЕ УСЛОВИЯ ИЗУЧЕНЫ! ЗАЯВКА ОДОБРЕНА 🏆';
                            }
                            if (continueBtn) continueBtn.style.display = 'inline-flex';
                        }, 800);
                    }
                });

                grid.appendChild(envEl);
            });
        }

        /* ─── FINAL STEP: PRINTER FEED & CERTIFICATE ────────────────────── */
        renderCertificate() {
            // Play mechanical printer feed sound
            audio.playPrinterSound();

            // Restart printer slide animation on paper
            const paperEl = document.getElementById('q-cert-paper');
            if (paperEl) {
                paperEl.style.animation = 'none';
                void paperEl.offsetWidth;
                paperEl.style.animation = 'qPrinterFeed 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            }

            // Date
            const dateEl = document.getElementById('q-cert-date');
            if (dateEl) {
                const now = new Date();
                const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                dateEl.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} г.`;
            }

            // Telegram Link
            const tgBtn = document.getElementById('q-tg-gift-btn');
            if (tgBtn) {
                tgBtn.href = CONFIG.TELEGRAM_GIFT_URL;
            }

            // Typewriter message
            const twBox = document.getElementById('q-typewriter-box');
            if (twBox && !twBox.getAttribute('data-typed')) {
                twBox.setAttribute('data-typed', 'true');
                twBox.textContent = '';
                let charIdx = 0;
                const fullText = CONFIG.FINAL_MESSAGE;

                const typeInterval = setInterval(() => {
                    twBox.textContent += fullText.charAt(charIdx);
                    charIdx++;
                    if (charIdx >= fullText.length) {
                        clearInterval(typeInterval);
                    }
                }, 35);
            }
        }

        /* ─── EASTER EGGS ────────────────────────────────────────────────── */
        handleSealTap() {
            state.sealTaps++;
            audio.playSparkle();
            if (state.sealTaps === 5) {
                this.showToast("🏆 Достижение разблокировано: Любопытная Дашенька!");
                audio.playSuccess();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new QuestController());
    } else {
        new QuestController();
    }

})();
