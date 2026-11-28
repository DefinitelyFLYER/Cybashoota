const TRACKS = [
    {
        name: 'Neon Outrun',
        combatStepMs: 113,
        menuStepMs: 134,
        roots: [55.0, 43.65, 73.42, 41.20], // Am - F - Dm - E
        chords: [
            [220.0, 261.63, 329.63, 440.0, 329.63, 261.63],
            [174.61, 220.0, 261.63, 349.23, 261.63, 220.0],
            [146.83, 174.61, 220.0, 293.66, 220.0, 174.61],
            [164.81, 207.65, 246.94, 329.63, 246.94, 207.65]
        ],
        bassPattern: [1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2],
        kicks: [0, 4, 8, 12],
        snares: [4, 12],
        arpEvery: 2,
        arpCutoff: 1600
    },
    {
        name: 'Cyber-Overdrive',
        combatStepMs: 108,
        menuStepMs: 126,
        roots: [41.20, 65.41, 49.00, 61.74], // Em - C - G - B7
        chords: [
            [329.63, 293.66, 246.94, 196.00, 246.94, 293.66],
            [392.00, 329.63, 261.63, 196.00, 261.63, 329.63],
            [392.00, 329.63, 293.66, 246.94, 293.66, 329.63],
            [369.99, 311.13, 246.94, 185.00, 246.94, 311.13]
        ],
        bassPattern: [1, 0, 1, 2, 1, 0, 2, 1, 1, 0, 1, 2, 1, 2, 1, 2],
        kicks: [0, 3, 8, 10],
        snares: [4, 12],
        arpEvery: 2,
        arpCutoff: 1900
    },
    {
        name: 'Chrome Drift',
        combatStepMs: 118,
        menuStepMs: 140,
        roots: [73.42, 58.27, 49.00, 55.00], // Dm - Bb - Gm - A
        chords: [
            [293.66, 349.23, 440.00, 587.33, 440.00, 349.23],
            [233.08, 293.66, 349.23, 466.16, 349.23, 293.66],
            [196.00, 233.08, 293.66, 392.00, 293.66, 233.08],
            [220.00, 277.18, 329.63, 440.00, 329.63, 277.18]
        ],
        bassPattern: [1, 0, 0, 1.5, 1, 0, 2, 0, 1, 0, 1.5, 0, 1, 1.5, 2, 0],
        kicks: [0, 6, 10],
        snares: [4, 12],
        arpEvery: 2,
        arpCutoff: 1400
    },
    {
        name: 'Protocol Zero',
        combatStepMs: 103,
        menuStepMs: 122,
        roots: [65.41, 51.91, 43.65, 49.00], // Cm - Ab - Fm - G
        chords: [
            [261.63, 311.13, 392.00, 523.25, 392.00, 311.13],
            [207.65, 261.63, 311.13, 415.30, 311.13, 261.63],
            [174.61, 207.65, 261.63, 349.23, 261.63, 207.65],
            [196.00, 246.94, 293.66, 392.00, 293.66, 246.94]
        ],
        bassPattern: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1.5, 2],
        kicks: [0, 4, 8, 12],
        snares: [4, 12],
        arpEvery: 1,
        arpCutoff: 2100
    },
    {
        name: 'Midnight Sector',
        combatStepMs: 138,
        menuStepMs: 144,
        roots: [43.65, 69.30, 51.91, 77.78], // Fm - Db - Ab - Eb
        chords: [
            [261.63, 311.13, 349.23, 415.30, 523.25],
            [277.18, 349.23, 415.30, 554.37, 622.25],
            [207.65, 261.63, 311.13, 415.30, 466.16],
            [233.08, 311.13, 392.00, 466.16, 587.33]
        ],
        melodyPattern: [0, -1, 3, -1, 2, -1, -1, 4, -1, 2, -1, 1, 0, -1, -1, -1],
        bassPattern: [1, 0, 0, 1, 0, 0, 1.5, 0, 1, 0, 0, 1, 2, 0, 1.5, 0],
        kicks: [0, 10],
        snares: [6, 12],
        arpEvery: 1,
        arpWave: 'sine',
        arpDuration: 0.24,
        arpCutoff: 1500,
        bassCutoff: 360
    },
    {
        name: 'Rain on Glass',
        combatStepMs: 146,
        menuStepMs: 150,
        roots: [49.00, 77.78, 65.41, 73.42], // Gm - Eb - Cm - D
        chords: [
            [293.66, 349.23, 392.00, 466.16, 587.33],
            [233.08, 311.13, 392.00, 466.16, 523.25],
            [261.63, 311.13, 392.00, 523.25, 587.33],
            [293.66, 369.99, 440.00, 587.33, 659.25]
        ],
        melodyPattern: [4, -1, 3, -1, 2, -1, 1, -1, -1, 2, -1, 1, 0, -1, -1, -1],
        bassPattern: [1, 0, 0, 0, 1.5, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1.5, 0],
        kicks: [0, 8],
        snares: [12],
        arpEvery: 1,
        arpWave: 'triangle',
        arpDuration: 0.28,
        arpCutoff: 1100,
        bassCutoff: 320
    },
    {
        name: 'Ghost Signal',
        combatStepMs: 134,
        menuStepMs: 140,
        roots: [61.74, 49.00, 73.42, 55.00], // Bm - G - D - A
        chords: [
            [246.94, 293.66, 369.99, 440.00, 493.88],
            [246.94, 293.66, 392.00, 440.00, 493.88],
            [293.66, 369.99, 440.00, 523.25, 587.33],
            [220.00, 277.18, 329.63, 415.30, 440.00]
        ],
        melodyPattern: [0, -1, 2, 0, -1, 4, 3, -1, 1, -1, 3, 2, -1, 0, -1, -1],
        bassPattern: [0, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 2, 0],
        kicks: [0, 4, 8, 12],
        snares: [4, 12],
        arpEvery: 1,
        arpWave: 'square',
        arpDuration: 0.11,
        arpCutoff: 850,
        bassCutoff: 380
    },
    {
        name: 'Low Orbit',
        combatStepMs: 152,
        menuStepMs: 154,
        roots: [46.25, 73.42, 55.00, 41.20], // F#m - D - A - E
        chords: [
            [277.18, 329.63, 369.99, 440.00, 554.37],
            [293.66, 369.99, 440.00, 587.33, 659.25],
            [220.00, 277.18, 329.63, 440.00, 554.37],
            [246.94, 329.63, 415.30, 493.88, 659.25]
        ],
        melodyPattern: [0, -1, -1, 2, -1, -1, 3, -1, 4, -1, -1, 3, -1, 1, -1, -1],
        bassPattern: [1, 0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        kicks: [0, 10],
        snares: [6],
        arpEvery: 1,
        arpWave: 'sine',
        arpDuration: 0.36,
        arpCutoff: 1200,
        bassCutoff: 320
    }
];

export default class AudioManager {
    constructor() {
        this.game = null;
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.noiseBuffer = null;
        this.unlocked = false;

        this._lastPlayed = new Map();
        this._stepTimer = 0;
        this._stepIndex = 0;
        this._barIndex = 0;
        this._phraseCount = 0;
        this._trackIndex = Math.floor(Math.random() * TRACKS.length);
        this._lastMusicMode = null;
        this._wasGameOver = false;

        this._boundUnlock = () => this.unlock();
    }

    init(game) {
        this.game = game;
        if (typeof window !== 'undefined') {
            window.addEventListener('pointerdown', this._boundUnlock, { passive: true });
            window.addEventListener('keydown', this._boundUnlock, { passive: true });
        }
    }

    _ensureContext() {
        if (this.ctx) return true;
        if (typeof window === 'undefined') return false;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;

        this.ctx = new AudioCtx();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 18;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;

        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);

        // Reusable short white-noise buffer for percussion/impacts
        const length = Math.floor(this.ctx.sampleRate * 0.25);
        this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this._syncVolumes(false);
        return true;
    }

    unlock() {
        if (!this._ensureContext()) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        this.unlocked = this.ctx.state === 'running';
    }

    _getAudioSettings() {
        const cfg = this.game?.settings?.audio || {};
        return {
            muted: Boolean(cfg.muted),
            master: typeof cfg.masterVolume === 'number' ? cfg.masterVolume : 0.7,
            sfx: typeof cfg.sfxVolume === 'number' ? cfg.sfxVolume : 0.8,
            music: typeof cfg.musicVolume === 'number' ? cfg.musicVolume : 0.45
        };
    }

    _syncVolumes(isDucked = false, isSilentMusic = false) {
        if (!this.ctx || !this.masterGain) return;
        const { muted, master, sfx, music } = this._getAudioSettings();
        const now = this.ctx.currentTime;
        const targetMaster = muted ? 0 : Math.max(0, Math.min(1, master));
        const targetSfx = Math.max(0, Math.min(1, sfx)) * 2.2;
        const duckMult = isSilentMusic ? 0 : (isDucked ? 0.35 : 1.0);
        const targetMusic = Math.max(0, Math.min(1, music)) * duckMult * 0.85;

        this.masterGain.gain.setTargetAtTime(targetMaster, now, 0.03);
        this.sfxGain.gain.setTargetAtTime(targetSfx, now, 0.03);
        this.musicGain.gain.setTargetAtTime(targetMusic, now, 0.06);
    }

    updateAudioState(deltaTime) {
        if (!this.game) return;
        if (this.game.isGameOver && !this._wasGameOver) {
            this._wasGameOver = true;
            this.play('gameOver');
        } else if (!this.game.isGameOver) {
            this._wasGameOver = false;
        }

        if (!this.ctx) return;
        if (this.ctx.state === 'running') this.unlocked = true;
        if (this.ctx.state !== 'running') return;

        const isPlaying = this.game.gameState === 'PLAYING';
        const mode = isPlaying ? 'combat' : 'menu';
        if (this._lastMusicMode !== null && this._lastMusicMode !== mode) {
            if (mode === 'menu') {
                this._trackIndex = this._pickRandomTrack(this._trackIndex);
            }
            this._stepIndex = 0;
            this._barIndex = 0;
            this._phraseCount = 0;
        }
        this._lastMusicMode = mode;

        const upgrades = this.game.getModule('upgrades');
        const isDucked = isPlaying && (this.game.isPaused || this.game.settingsOpen || this.game.augmentsOpen || upgrades?.isSelectionActive);
        const isSilent = this.game.isGameOver;

        this._syncVolumes(isDucked, isSilent);
        if (isSilent || this._getAudioSettings().muted || this._getAudioSettings().music <= 0.01) {
            return;
        }

        const track = TRACKS[this._trackIndex] || TRACKS[0];
        const stepMs = isPlaying ? track.combatStepMs : track.menuStepMs;
        this._stepTimer += Math.min(deltaTime, 100);
        while (this._stepTimer >= stepMs) {
            this._stepTimer -= stepMs;
            this._triggerMusicStep(track, isPlaying);
            this._stepIndex = (this._stepIndex + 1) % 16;
            if (this._stepIndex === 0) {
                this._barIndex = (this._barIndex + 1) % 4;
                if (this._barIndex === 0) {
                    this._phraseCount++;
                    if (isPlaying && this._phraseCount >= 4) {
                        this._phraseCount = 0;
                        this._trackIndex = this._pickRandomTrack(this._trackIndex);
                    }
                }
            }
        }
    }

    getCurrentTrackName() {
        const { muted, master, music } = this._getAudioSettings();
        if (muted || master <= 0.005 || music <= 0.01) {
            return 'MUTED';
        }
        const track = TRACKS[this._trackIndex] || TRACKS[0];
        return track ? track.name : '';
    }

    skipTrack(delta = 1) {
        this._trackIndex = (this._trackIndex + delta + TRACKS.length) % TRACKS.length;
        this._stepIndex = 0;
        this._barIndex = 0;
        this._phraseCount = 0;
        this._stepTimer = 0;
        this.play('uiClick');
        return this.getCurrentTrackName();
    }

    nextTrack() {
        return this.skipTrack(1);
    }

    prevTrack() {
        return this.skipTrack(-1);
    }

    _pickRandomTrack(excludeIndex) {
        if (TRACKS.length <= 1) return 0;
        let next = Math.floor(Math.random() * TRACKS.length);
        if (next === excludeIndex) {
            next = (next + 1 + Math.floor(Math.random() * (TRACKS.length - 1))) % TRACKS.length;
        }
        return next;
    }

    _triggerMusicStep(track, isCombat) {
        if (!this.ctx || !this.musicGain) return;
        const t = this.ctx.currentTime + 0.01;
        const root = track.roots[this._barIndex];
        const chord = track.chords[this._barIndex];
        const step = this._stepIndex;

        if (isCombat) {
            const mult = track.bassPattern[step];
            if (mult > 0) {
                this._playSynthBass(t, root * mult, 0.13, 0.21, track.bassCutoff || 350);
            }
            if (track.kicks.includes(step)) {
                this._playTone(t, 'sine', 110, 34, 0.14, 0.34, this.musicGain);
            }
            if (track.snares.includes(step)) {
                this._playTone(t, 'triangle', 165, 72, 0.08, 0.16, this.musicGain);
                this._playNoise(t, 0.08, 0.055, this.musicGain, 750, 'bandpass');
            }
            if (track.melodyPattern) {
                const noteIdx = track.melodyPattern[step];
                if (noteIdx >= 0 && chord[noteIdx] !== undefined) {
                    this._playDualTone(
                        t,
                        track.arpWave === 'sine' ? 'triangle' : (track.arpWave || 'sawtooth'),
                        chord[noteIdx] * 0.5,
                        track.arpDuration || 0.22,
                        0.04,
                        Math.min(880, track.arpCutoff || 850)
                    );
                }
            } else if (step % track.arpEvery === 0) {
                const idx = Math.floor(step / track.arpEvery) % chord.length;
                const vol = track.arpEvery === 1 ? 0.026 : 0.036;
                this._playDualTone(t, 'sawtooth', chord[idx] * 0.5, track.arpDuration || 0.13, vol, Math.min(920, track.arpCutoff));
            }
            if (step === 0) {
                this._playDualTone(t, 'sawtooth', chord[0] * 0.25, 0.95, 0.045, 500);
                this._playDualTone(t, 'sawtooth', chord[2] * 0.25, 0.95, 0.036, 500);
            }
        } else {
            if (step === 0) {
                this._playDualTone(t, 'sawtooth', chord[0] * 0.25, 1.05, 0.048, 460);
                this._playDualTone(t, 'sawtooth', chord[2] * 0.25, 1.05, 0.038, 460);
            }
            if (step % 2 === 0) {
                const mult = (step % 4 === 2) ? 2 : 1;
                this._playSynthBass(t, root * mult, 0.14, 0.15, track.bassCutoff || 340);
            }
            if (step === 0 || step === 8) {
                this._playTone(t, 'sine', 92, 34, 0.12, 0.2, this.musicGain);
            }
            if (step === 8) {
                this._playNoise(t, 0.09, 0.04, this.musicGain, 750, 'bandpass');
            }
            if (track.melodyPattern) {
                const noteIdx = track.melodyPattern[step];
                if (noteIdx >= 0 && chord[noteIdx] !== undefined) {
                    this._playDualTone(
                        t,
                        track.arpWave === 'sine' ? 'triangle' : (track.arpWave || 'sawtooth'),
                        chord[noteIdx] * 0.5,
                        track.arpDuration || 0.24,
                        0.036,
                        Math.min(820, track.arpCutoff || 800)
                    );
                }
            } else if (step % 2 === 0) {
                const note = chord[(step / 2) % chord.length];
                this._playDualTone(t, 'sawtooth', note * 0.5, 0.16, 0.032, 800);
            }
        }
    }

    _playSynthBass(startTime, freq, duration, volume, cutoff = 350) {
        // Deep sub-sine foundation + wide detuned Reese sawtooth
        this._playTone(startTime, 'sine', freq, freq, duration, volume * 1.15, this.musicGain);
        this._playDualTone(startTime, 'sawtooth', freq, duration, volume * 0.65, cutoff, 12);
    }

    _playDualTone(startTime, type, freq, duration, volume, filterCutoff = 1200, detuneCents = 7) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 2.2;
        filter.frequency.setValueAtTime(filterCutoff, startTime);
        filter.frequency.exponentialRampToValueAtTime(Math.max(180, filterCutoff * 0.45), startTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        [-detuneCents, detuneCents].forEach(detune => {
            const osc = this.ctx.createOscillator();
            osc.type = type;
            osc.frequency.setValueAtTime(Math.max(20, freq), startTime);
            osc.detune.setValueAtTime(detune, startTime);
            osc.connect(filter);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.02);
        });

        filter.connect(gain);
        gain.connect(this.musicGain);
    }

    _canPlay(name, cooldownMs) {
        const now = performance.now();
        const prev = this._lastPlayed.get(name) || 0;
        if (now - prev < cooldownMs) return false;
        this._lastPlayed.set(name, now);
        return true;
    }

    play(name, opts = {}) {
        if (!this._ensureContext() || this.ctx.state !== 'running') return;
        const { muted, master, sfx } = this._getAudioSettings();
        if (muted || master <= 0.005 || sfx <= 0.005) return;

        const t = this.ctx.currentTime;
        const dest = this.sfxGain;

        switch (name) {
            case 'shoot': {
                if (!this._canPlay('shoot', 50)) return;
                if (opts.superShot) {
                    // Heavy railcannon discharge: sub-boom + metallic FM-like sweep + snap
                    this._playTone(t, 'sine', 180, 40, 0.22, 0.26, dest);
                    this._playTone(t, 'sawtooth', 980, 120, 0.18, 0.16, dest, 2200);
                    this._playNoise(t, 0.07, 0.14, dest, 2400, 'bandpass');
                } else {
                    const startPitch = 1050 + Math.random() * 180;
                    // Cyberpunk pulse-rifle: fast high-to-low plasma zap + snappy click + sub-punch
                    this._playTone(t, 'sawtooth', startPitch, 185, 0.055, 0.11, dest, 2100);
                    this._playTone(t, 'sine', 145, 52, 0.05, 0.15, dest);
                    this._playNoise(t, 0.016, 0.09, dest, 3200, 'bandpass');
                }
                break;
            }
            case 'hit': {
                if (!this._canPlay('hit', 40)) return;
                const snapPitch = 440 + Math.random() * 90;
                // Tactile armor-impact: crisp crack + low-end thump + tight crunch transient
                this._playTone(t, 'triangle', snapPitch, 115, 0.045, 0.12, dest, 1400);
                this._playTone(t, 'sine', 135, 46, 0.05, 0.14, dest);
                this._playNoise(t, 0.02, 0.085, dest, 1900, 'bandpass');
                break;
            }
            case 'crit': {
                if (!this._canPlay('crit', 55)) return;
                this._playTone(t, 'sine', 640, 920, 0.075, 0.13, dest);
                this._playNoise(t, 0.025, 0.05, dest, 2400, 'bandpass');
                break;
            }
            case 'kill': {
                if (!this._canPlay('kill', 50)) return;
                this._playTone(t, 'sine', 210, 52, 0.09, 0.16, dest);
                this._playNoise(t, 0.055, 0.08, dest, 1000, 'bandpass');
                break;
            }
            case 'xp': {
                if (!this._canPlay('xp', 65)) return;
                const f = 520 + Math.random() * 140;
                this._playTone(t, 'sine', f, f * 1.18, 0.045, 0.045, dest);
                break;
            }
            case 'levelUp': {
                if (!this._canPlay('levelUp', 200)) return;
                [440, 554.37, 659.25, 880].forEach((freq, i) => {
                    this._playTone(t + i * 0.065, 'triangle', freq, freq, 0.16, 0.11, dest, 1400);
                });
                break;
            }
            case 'playerHit': {
                if (!this._canPlay('playerHit', 150)) return;
                this._playTone(t, 'triangle', 145, 48, 0.16, 0.16, dest, 420);
                this._playNoise(t, 0.09, 0.08, dest, 550, 'lowpass');
                break;
            }
            case 'armorBlock': {
                if (!this._canPlay('armorBlock', 150)) return;
                this._playTone(t, 'sine', 420, 720, 0.1, 0.11, dest);
                break;
            }
            case 'dodge': {
                if (!this._canPlay('dodge', 150)) return;
                this._playTone(t, 'sine', 340, 620, 0.08, 0.08, dest);
                break;
            }
            case 'hack': {
                if (!this._canPlay('hack', 150)) return;
                this._playTone(t, 'triangle', 260, 780, 0.16, 0.14, dest, 1200);
                break;
            }
            case 'overload': {
                if (!this._canPlay('overload', 200)) return;
                // Massive screen-wide discharge: deep sub-drop + electric sweep + crackle
                this._playTone(t, 'sine', 210, 38, 0.36, 0.28, dest);
                this._playTone(t, 'sawtooth', 920, 110, 0.3, 0.18, dest, 1800);
                this._playNoise(t, 0.14, 0.14, dest, 1500, 'bandpass');
                break;
            }
            case 'emp': {
                if (!this._canPlay('emp', 250)) return;
                this._playTone(t, 'triangle', 310, 72, 0.22, 0.13, dest, 700);
                break;
            }
            case 'synergy': {
                if (!this._canPlay('synergy', 300)) return;
                [392, 493.88, 587.33, 783.99].forEach((freq, i) => {
                    this._playTone(t + i * 0.06, 'triangle', freq, freq, 0.2, 0.11, dest, 1500);
                });
                break;
            }
            case 'augmentPickup':
            case 'forgeCraft': {
                if (!this._canPlay(name, 100)) return;
                this._playTone(t, 'sine', 523.25, 783.99, 0.1, 0.1, dest);
                this._playTone(t + 0.06, 'sine', 783.99, 1046.5, 0.12, 0.1, dest);
                break;
            }
            case 'uiClick': {
                if (!this._canPlay('uiClick', 50)) return;
                this._playTone(t, 'sine', 540, 660, 0.035, 0.06, dest);
                break;
            }
            case 'gameOver': {
                if (!this._canPlay('gameOver', 500)) return;
                this._playTone(t, 'triangle', 260, 58, 0.42, 0.15, dest, 600);
                break;
            }
            case 'bossAlert': {
                if (!this._canPlay('bossAlert', 1000)) return;
                [0, 0.22].forEach((offset) => {
                    this._playTone(t + offset, 'sawtooth', 180, 340, 0.16, 0.22, dest, 950);
                    this._playTone(t + offset + 0.08, 'sine', 95, 45, 0.12, 0.22, dest);
                });
                break;
            }
            default:
                break;
        }
    }

    _playTone(startTime, type, freqStart, freqEnd, duration, volume, dest, filterCutoff = null) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(20, freqStart), startTime);
        if (freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration);
        }

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        if (filterCutoff) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterCutoff, startTime);
            osc.connect(filter);
            filter.connect(gain);
        } else {
            osc.connect(gain);
        }

        gain.connect(dest);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    _playNoise(startTime, duration, volume, dest, filterFreq = 2000, filterType = 'highpass') {
        if (!this.noiseBuffer) return;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        src.start(startTime);
        src.stop(startTime + duration + 0.02);
    }
}
