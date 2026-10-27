/**
 * NIKITA SLAVYNER — RETRO TERMINAL SNAKE (EASTER EGG)
 * Zero external dependencies. Native Web Audio synth. Touch & keyboard enabled.
 */

(function () {
    'use strict';

    // ─── AUDIO SYNTHESIZER (Web Audio API) ─────────────────────────
    class SnakeAudio {
        constructor() {
            this.ctx = null;
            this.muted = localStorage.getItem('ns_snake_muted') === 'true';
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        toggleMute() {
            this.muted = !this.muted;
            localStorage.setItem('ns_snake_muted', this.muted);
            return this.muted;
        }

        playEat() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        }

        playBonus() {
            if (this.muted || !this.ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C arpeggio
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.04;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            });
        }

        playDie() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        }

        playMove() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.02);
        }
    }

    // ─── SNAKE ENGINE ──────────────────────────────────────────────
    class SnakeGame {
        constructor() {
            this.audio = new SnakeAudio();
            this.container = document.getElementById('snake-arcade-container');
            this.canvas = document.getElementById('snakeCanvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

            // DOM elements
            this.scoreEl = document.getElementById('snakeScore');
            this.bestEl = document.getElementById('snakeBest');
            this.overlayCard = document.getElementById('snakeOverlay');
            this.overlayTag = document.getElementById('snakeOverlayTag');
            this.overlayTitle = document.getElementById('snakeOverlayTitle');
            this.overlayDesc = document.getElementById('snakeOverlayDesc');
            this.overlayBtn = document.getElementById('snakeOverlayBtn');
            this.muteBtn = document.getElementById('snakeMuteBtn');
            this.closeBtn = document.getElementById('snakeCloseBtn');
            this.toastEl = document.getElementById('snakeUnlockToast');

            // Grid configuration
            this.gridSize = 20; // 20x20 cells
            this.cellSize = 20;

            // Game state
            this.snake = [];
            this.dir = { x: 1, y: 0 };
            this.nextDir = { x: 1, y: 0 };
            this.food = { x: 5, y: 5 };
            this.bonus = null; // { x, y, expiresAt }
            this.floatingTexts = []; // { text, x, y, alpha, color }
            this.score = 0;
            this.best = parseInt(localStorage.getItem('ns_snake_highscore') || '0', 10);
            this.state = 'idle'; // 'idle', 'running', 'paused', 'over'
            this.lastTick = 0;
            this.tickRate = 120; // ms per step
            this.foodsEaten = 0;
            this.animationFrame = null;

            this.init();
        }

        init() {
            if (!this.container || !this.canvas) return;

            this.updateBestDisplay();
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // Bind UI events
            if (this.overlayBtn) {
                this.overlayBtn.addEventListener('click', () => {
                    this.audio.init();
                    this.startGame();
                });
            }

            if (this.muteBtn) {
                this.updateMuteIcon();
                this.muteBtn.addEventListener('click', () => {
                    this.audio.init();
                    this.audio.toggleMute();
                    this.updateMuteIcon();
                });
            }

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            // Click outside cabinet to close
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) this.close();
            });

            // Keyboard listeners
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));

            // Touch / Mobile D-Pad
            document.querySelectorAll('.snake-touch-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.audio.init();
                    const d = btn.getAttribute('data-dir');
                    if (d) this.setDirectionByName(d);
                });
            });

            // Touch swipe on canvas
            let touchStartX = 0;
            let touchStartY = 0;
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                }
            }, { passive: true });

            this.canvas.addEventListener('touchend', (e) => {
                if (e.changedTouches.length === 1) {
                    const dx = e.changedTouches[0].clientX - touchStartX;
                    const dy = e.changedTouches[0].clientY - touchStartY;
                    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                        this.audio.init();
                        if (Math.abs(dx) > Math.abs(dy)) {
                            this.setDirectionByName(dx > 0 ? 'right' : 'left');
                        } else {
                            this.setDirectionByName(dy > 0 ? 'down' : 'up');
                        }
                    }
                }
            }, { passive: true });

            // Easter egg triggers setup
            this.initEasterEggTriggers();
        }

        updateMuteIcon() {
            if (!this.muteBtn) return;
            this.muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
            this.muteBtn.title = this.audio.muted ? 'Unmute Sound' : 'Mute Sound';
        }

        updateBestDisplay() {
            if (this.bestEl) this.bestEl.textContent = this.best.toString().padStart(2, '0');
        }

        resizeCanvas() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height) || 400;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.ctx.scale(dpr, dpr);
            this.cellSize = size / this.gridSize;
            this.render();
        }

        open() {
            this.container.classList.add('arcade-open');
            document.body.style.overflow = 'hidden';
            if (window.lenis && typeof window.lenis.stop === 'function') {
                window.lenis.stop();
            }
            this.resizeCanvas();
            this.showOverlay('SYS // READY', 'RETRO CYBERSNAKE', 'Steer with Arrow Keys or WASD. Eat packets, don\'t crash.', 'START ENGINE (SPACE)');
            this.state = 'idle';
        }

        close() {
            this.container.classList.remove('arcade-open');
            document.body.style.overflow = '';
            if (window.lenis && typeof window.lenis.start === 'function') {
                window.lenis.start();
            }
            if (window.location.hash === '#snake' || window.location.hash === '#arcade') {
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
            }
            this.state = 'idle';
            cancelAnimationFrame(this.animationFrame);
        }

        showToast(msg) {
            if (!this.toastEl) return;
            this.toastEl.textContent = msg;
            this.toastEl.classList.add('show');
            setTimeout(() => {
                this.toastEl.classList.remove('show');
            }, 3000);
        }

        initEasterEggTriggers() {
            // Trigger 1: 5 rapid clicks on .nav-logo
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
                        this.showToast('✦ SECRET ARCADE PROTOCOL UNLOCKED ✦');
                        this.open();
                    }
                });
            });

            // Trigger 2: Secret keyword "snake" typed on keyboard
            let typedBuffer = '';
            window.addEventListener('keydown', (e) => {
                if (this.container.classList.contains('arcade-open')) return;
                if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

                typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-5);
                if (typedBuffer === 'snake') {
                    typedBuffer = '';
                    this.showToast('✦ SNAKE PROTOCOL ACTIVATED ✦');
                    this.open();
                }
            });

            // Trigger 3: URL hash #snake or #arcade
            const checkHash = () => {
                if (['#snake', '#arcade', '#game'].includes(window.location.hash)) {
                    this.open();
                }
            };
            window.addEventListener('hashchange', checkHash);
            checkHash();
        }

        // ─── GAMEPLAY CONTROLS ──────────────────────────────────────
        startGame() {
            this.score = 0;
            this.foodsEaten = 0;
            this.tickRate = 120;
            if (this.scoreEl) this.scoreEl.textContent = '00';

            const mid = Math.floor(this.gridSize / 2);
            this.snake = [
                { x: mid, y: mid },
                { x: mid - 1, y: mid },
                { x: mid - 2, y: mid }
            ];
            this.dir = { x: 1, y: 0 };
            this.nextDir = { x: 1, y: 0 };
            this.bonus = null;
            this.floatingTexts = [];
            this.spawnFood();

            this.hideOverlay();
            this.state = 'running';
            this.lastTick = performance.now();
            this.loop(this.lastTick);
        }

        pauseGame() {
            if (this.state === 'running') {
                this.state = 'paused';
                this.showOverlay('SYS // PAUSED', 'PAUSED', 'Take a breath. Press Space to resume.', 'RESUME (SPACE)');
            } else if (this.state === 'paused') {
                this.state = 'running';
                this.hideOverlay();
                this.lastTick = performance.now();
                this.loop(this.lastTick);
            }
        }

        gameOver() {
            this.state = 'over';
            this.audio.playDie();

            let isNewBest = false;
            if (this.score > this.best) {
                this.best = this.score;
                localStorage.setItem('ns_snake_highscore', this.best.toString());
                this.updateBestDisplay();
                isNewBest = true;
            }

            const title = isNewBest ? '★ NEW RECORD!' : 'COLLISION DETECTED';
            const tag = isNewBest ? 'SYSTEM // CHAMPION' : 'SYS // CRITICAL ERROR';
            const desc = isNewBest
                ? `Incredible! New high score: ${this.score} packets collected.`
                : `Final Score: ${this.score} • Best Record: ${this.best}`;

            this.showOverlay(tag, title, desc, 'REBOOT (SPACE)');
        }

        showOverlay(tag, title, desc, btnText) {
            if (this.overlayTag) this.overlayTag.textContent = tag;
            if (this.overlayTitle) this.overlayTitle.textContent = title;
            if (this.overlayDesc) this.overlayDesc.textContent = desc;
            if (this.overlayBtn) this.overlayBtn.textContent = btnText;
            if (this.overlayCard) this.overlayCard.classList.add('show');
        }

        hideOverlay() {
            if (this.overlayCard) this.overlayCard.classList.remove('show');
        }

        setDirectionByName(name) {
            if (this.state !== 'running') {
                if (this.state === 'idle' || this.state === 'over') {
                    this.startGame();
                    return;
                }
            }
            const current = this.dir;
            if (name === 'up' && current.y === 0) this.nextDir = { x: 0, y: -1 };
            if (name === 'down' && current.y === 0) this.nextDir = { x: 0, y: 1 };
            if (name === 'left' && current.x === 0) this.nextDir = { x: -1, y: 0 };
            if (name === 'right' && current.x === 0) this.nextDir = { x: 1, y: 0 };
        }

        handleKeyDown(e) {
            if (!this.container.classList.contains('arcade-open')) return;

            if (e.key === 'Escape') {
                this.close();
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                this.audio.init();
                if (this.state === 'idle' || this.state === 'over') {
                    this.startGame();
                } else {
                    this.pauseGame();
                }
                return;
            }

            if (e.key === 'r' || e.key === 'R') {
                this.audio.init();
                this.startGame();
                return;
            }

            const keyMap = {
                'ArrowUp': 'up', 'KeyW': 'up',
                'ArrowDown': 'down', 'KeyS': 'down',
                'ArrowLeft': 'left', 'KeyA': 'left',
                'ArrowRight': 'right', 'KeyD': 'right'
            };

            if (keyMap[e.code]) {
                e.preventDefault();
                this.audio.init();
                this.setDirectionByName(keyMap[e.code]);
            }
        }

        spawnFood() {
            const occupied = new Set(this.snake.map(p => `${p.x},${p.y}`));
            if (this.bonus) occupied.add(`${this.bonus.x},${this.bonus.y}`);

            const free = [];
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    if (!occupied.has(`${x},${y}`)) free.push({ x, y });
                }
            }
            if (free.length > 0) {
                this.food = free[Math.floor(Math.random() * free.length)];
            }
        }

        spawnBonus() {
            const occupied = new Set(this.snake.map(p => `${p.x},${p.y}`));
            occupied.add(`${this.food.x},${this.food.y}`);

            const free = [];
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    if (!occupied.has(`${x},${y}`)) free.push({ x, y });
                }
            }
            if (free.length > 0) {
                const pos = free[Math.floor(Math.random() * free.length)];
                this.bonus = {
                    x: pos.x,
                    y: pos.y,
                    expiresAt: performance.now() + 6000 // 6 seconds to grab!
                };
            }
        }

        // ─── TICK & RENDER ──────────────────────────────────────────
        loop(timestamp) {
            if (this.state !== 'running') return;

            if (timestamp - this.lastTick >= this.tickRate) {
                this.lastTick = timestamp;
                this.step();
            }

            this.render();
            if (this.state === 'running') {
                this.animationFrame = requestAnimationFrame((t) => this.loop(t));
            }
        }

        step() {
            this.dir = { ...this.nextDir };
            const head = {
                x: this.snake[0].x + this.dir.x,
                y: this.snake[0].y + this.dir.y
            };

            // Wall collision
            if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
                this.gameOver();
                return;
            }

            // Self collision
            for (let i = 0; i < this.snake.length; i++) {
                if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                    this.gameOver();
                    return;
                }
            }

            this.snake.unshift(head);

            // Eat regular food
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                this.foodsEaten++;
                if (this.scoreEl) this.scoreEl.textContent = this.score.toString().padStart(2, '0');
                this.audio.playEat();
                this.floatingTexts.push({
                    text: '+10',
                    x: head.x * this.cellSize + this.cellSize / 2,
                    y: head.y * this.cellSize,
                    alpha: 1.0,
                    color: '#ff4500'
                });

                // Progressive speedup
                if (this.tickRate > 70) {
                    this.tickRate = Math.max(70, 120 - Math.floor(this.score / 30) * 5);
                }

                // Check bonus food chance
                if (this.foodsEaten % 5 === 0 && !this.bonus) {
                    this.spawnBonus();
                }

                this.spawnFood();
            } else if (this.bonus && head.x === this.bonus.x && head.y === this.bonus.y) {
                // Eat bonus food
                this.score += 30;
                if (this.scoreEl) this.scoreEl.textContent = this.score.toString().padStart(2, '0');
                this.audio.playBonus();
                this.floatingTexts.push({
                    text: '+30 CRIT',
                    x: head.x * this.cellSize + this.cellSize / 2,
                    y: head.y * this.cellSize,
                    alpha: 1.0,
                    color: '#ffd700'
                });
                this.bonus = null;
            } else {
                this.snake.pop();
            }

            // Check bonus expiration
            if (this.bonus && performance.now() > this.bonus.expiresAt) {
                this.bonus = null;
            }
        }

        render() {
            if (!this.ctx || !this.canvas) return;

            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            const cell = this.cellSize;

            // Clear canvas
            this.ctx.fillStyle = '#060606';
            this.ctx.fillRect(0, 0, width, height);

            // Subtle grid lines
            this.ctx.strokeStyle = '#121212';
            this.ctx.lineWidth = 1;
            for (let i = 0; i <= this.gridSize; i++) {
                const pos = i * cell;
                this.ctx.beginPath();
                this.ctx.moveTo(pos, 0);
                this.ctx.lineTo(pos, height);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(0, pos);
                this.ctx.lineTo(width, pos);
                this.ctx.stroke();
            }

            // Draw Bonus Food
            if (this.bonus) {
                const timeLeft = Math.max(0, this.bonus.expiresAt - performance.now());
                const pulse = Math.sin(performance.now() * 0.01) * 0.2 + 0.8;
                const bx = this.bonus.x * cell + cell / 2;
                const by = this.bonus.y * cell + cell / 2;

                this.ctx.save();
                this.ctx.shadowColor = '#ffd700';
                this.ctx.shadowBlur = 12 * pulse;
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(bx, by, (cell / 2.5) * pulse, 0, Math.PI * 2);
                this.ctx.fill();

                // Spark star inside
                this.ctx.fillStyle = '#050505';
                this.ctx.font = `bold ${Math.floor(cell * 0.55)}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('★', bx, by);
                this.ctx.restore();
            }

            // Draw Regular Food (Glowing orange orb)
            if (this.food) {
                const fx = this.food.x * cell + cell / 2;
                const fy = this.food.y * cell + cell / 2;
                const pulse = Math.sin(performance.now() * 0.006) * 0.15 + 0.85;

                this.ctx.save();
                this.ctx.shadowColor = '#ff4500';
                this.ctx.shadowBlur = 14 * pulse;
                this.ctx.fillStyle = '#ff4500';
                this.ctx.beginPath();
                this.ctx.arc(fx, fy, (cell / 2.8) * pulse, 0, Math.PI * 2);
                this.ctx.fill();

                // Bright center core
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(fx, fy, (cell / 7), 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            // Draw Snake
            for (let i = this.snake.length - 1; i >= 0; i--) {
                const seg = this.snake[i];
                const x = seg.x * cell;
                const y = seg.y * cell;
                const isHead = (i === 0);

                this.ctx.save();
                if (isHead) {
                    this.ctx.shadowColor = '#ff4500';
                    this.ctx.shadowBlur = 12;
                    this.ctx.fillStyle = '#ff4500';
                    this.roundRect(this.ctx, x + 1, y + 1, cell - 2, cell - 2, 4);
                    this.ctx.fill();

                    // Eyes facing direction
                    this.ctx.fillStyle = '#050505';
                    const eyeSize = Math.max(2, cell * 0.16);
                    let eye1 = { x: x + cell * 0.3, y: y + cell * 0.3 };
                    let eye2 = { x: x + cell * 0.7, y: y + cell * 0.3 };

                    if (this.dir.x === 1) {
                        eye1 = { x: x + cell * 0.7, y: y + cell * 0.3 };
                        eye2 = { x: x + cell * 0.7, y: y + cell * 0.7 };
                    } else if (this.dir.x === -1) {
                        eye1 = { x: x + cell * 0.3, y: y + cell * 0.3 };
                        eye2 = { x: x + cell * 0.3, y: y + cell * 0.7 };
                    } else if (this.dir.y === 1) {
                        eye1 = { x: x + cell * 0.3, y: y + cell * 0.7 };
                        eye2 = { x: x + cell * 0.7, y: y + cell * 0.7 };
                    }

                    this.ctx.beginPath();
                    this.ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
                    this.ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // Body gradient fade
                    const ratio = i / this.snake.length;
                    this.ctx.fillStyle = `rgba(255, ${Math.floor(69 * (1 - ratio * 0.4))}, 0, ${0.9 - ratio * 0.35})`;
                    this.roundRect(this.ctx, x + 2, y + 2, cell - 4, cell - 4, 3);
                    this.ctx.fill();
                }
                this.ctx.restore();
            }

            // Draw floating score pops (+10, +30)
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.y -= 0.6;
                ft.alpha -= 0.02;

                if (ft.alpha <= 0) {
                    this.floatingTexts.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.globalAlpha = ft.alpha;
                this.ctx.fillStyle = ft.color;
                this.ctx.font = 'bold 12px "Syne", monospace, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.restore();
            }
        }

        roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }
    }

    // Auto-mount on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.nsSnake = new SnakeGame(); });
    } else {
        window.nsSnake = new SnakeGame();
    }
})();
