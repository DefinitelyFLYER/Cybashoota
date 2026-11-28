import { ENEMY_TYPES, BOSS_MILESTONES } from '../data/EnemyTypes.js';
import { SPAWN_TIMELINE } from '../data/SpawnTimeline.js';
import { UPGRADES } from '../data/UpgradeData.js';
import { DRONE_UPGRADES } from '../data/DroneUpgradeData.js';
import { DRONE_TYPES } from '../data/DroneTypes.js';
import { HACK_DATA } from '../data/HackData.js';
import { AUGMENTS, AUGMENT_SLOTS } from '../data/AugmentData.js';
import { SYNERGIES } from '../data/SynergyData.js';

const SECRET_CODE = 'OVERCLOCK';

export default class DebugManager {
    constructor() {
        this.game = null;
        this.unlocked = false;
        this.panelVisible = false;
        this.activeTab = 'player';
        this.searchQuery = '';
        this.showHitboxes = false;
        this.showTelemetry = true;
        this._panelEl = null;
        this._bodyEl = null;
    }

    init(game) {
        this.game = game;
        if (typeof window !== 'undefined') {
            window.cybaDebug = (code) => this.activate(code);
        }
    }

    activate(code) {
        if (String(code || '').trim().toUpperCase() !== SECRET_CODE) {
            console.warn('[CYBASHOOTA] Invalid debug authorization code.');
            return false;
        }
        if (!this.unlocked) {
            this.unlocked = true;
            const codex = this.game?.getModule('codex');
            if (codex && typeof codex.setDebugStorage === 'function') {
                codex.setDebugStorage(true);
            }
            if (typeof window !== 'undefined') {
                window.debug = this._createConsoleApi();
            }
            this._mountTrainerUi();
            console.log('%c[CYBASHOOTA TRAINER UNLOCKED] Press F9 to toggle panel. window.debug is also active.', 'color:#00ffcc;font-weight:bold;font-size:13px;');
        }
        this.setPanelVisible(true);
        return true;
    }

    togglePanel() {
        if (!this.unlocked) return;
        this.setPanelVisible(!this.panelVisible);
    }

    setPanelVisible(visible) {
        this.panelVisible = Boolean(visible);
        if (this._panelEl) {
            this._panelEl.style.display = this.panelVisible ? 'flex' : 'none';
        }
        if (this.panelVisible) {
            this._renderTabBody();
        }
    }

    _createConsoleApi() {
        return {
            toggle: () => this.togglePanel(),
            god: (v) => this.setGodMode(v),
            heal: () => this.fullHeal(),
            xp: (amt = 100) => this.giveXp(amt),
            level: (lvl) => this.setLevel(lvl),
            timeScale: (s = 1) => this.setTimeScale(s),
            phase: (idx) => this.jumpToPhase(idx),
            spawn: (id, count = 1) => this.spawnEnemy(id, count),
            boss: (id = 'BOSS_WARDEN') => this.spawnEnemy(id, 1),
            killAll: () => this.killAllEnemies(),
            oneHp: () => this.setAllEnemiesOneHp(),
            scrap: (amt = 50) => this.giveScrap(amt),
            setMk3: (type = 'STRIKER') => this.equipFullMk3Set(type),
            synergy: (id) => this.grantSynergy(id),
            hitboxes: (v) => { this.showHitboxes = v ?? !this.showHitboxes; }
        };
    }

    // --- Trainer Actions ---
    setGodMode(enabled) {
        const player = this.game?.getModule('player');
        if (player) player.godMode = enabled !== undefined ? Boolean(enabled) : !player.godMode;
        this._renderTabBody();
    }

    fullHeal() {
        const player = this.game?.getModule('player');
        if (!player) return;
        player.stats.hp = player.stats.maxHp;
    }

    refillArmor() {
        const player = this.game?.getModule('player');
        if (!player) return;
        player.armorCharges = Math.max(player.armorCharges || 0, player.stats.defense || 0);
        player.armorRechargeTimer = 0;
    }

    giveRerolls(amt = 10) {
        const player = this.game?.getModule('player');
        if (player) player.stats.rerolls = (player.stats.rerolls || 0) + amt;
    }

    triggerEmp(ms = 3500) {
        const player = this.game?.getModule('player');
        if (player) player.empDisruptedTimer = Math.max(player.empDisruptedTimer || 0, ms);
        this.game?.getModule('audio')?.play('emp');
    }

    tweakStat(stat, delta) {
        const player = this.game?.getModule('player');
        if (!player) return;
        if (stat in player.multipliers) {
            player.multipliers[stat] = Math.max(0.1, +(player.multipliers[stat] + delta).toFixed(2));
        } else if (stat in player.stats) {
            player.stats[stat] = Math.max(0, +(player.stats[stat] + delta).toFixed(2));
        }
        this._renderTabBody();
    }

    giveXp(amount) {
        const player = this.game?.getModule('player');
        if (player && typeof player.addXp === 'function') {
            player.addXp(amount);
        }
    }

    setLevel(targetLevel) {
        const player = this.game?.getModule('player');
        const lvl = Math.max(1, Math.floor(Number(targetLevel) || 1));
        if (!player) return;
        player.level = lvl;
        player.xp = 0;
        player.xpNextLevel = Math.floor(100 * Math.pow(1.2, lvl - 1));
    }

    setTimeScale(scale) {
        if (this.game) this.game.timeScale = scale;
        this._renderTabBody();
    }

    jumpToPhase(phaseIndex) {
        const phase = SPAWN_TIMELINE[phaseIndex];
        const director = this.game?.getModule('director');
        const enemyMgr = this.game?.getModule('enemies');
        if (!phase || !director) return;

        director.gameTime = phase.start * 1000;
        director.currentPhase = phase;
        director._triggeredBossMilestones.clear();
        BOSS_MILESTONES.forEach((m, idx) => {
            if (phase.start >= m.timeSec) {
                director._triggeredBossMilestones.add(idx);
            }
        });
        if (enemyMgr) {
            enemyMgr.spawnRate = phase.rate;
            enemyMgr.activePhase = phase;
        }
        this._renderTabBody();
    }

    spawnEnemy(typeKey, count = 1) {
        const enemyMgr = this.game?.getModule('enemies');
        if (enemyMgr && typeof enemyMgr.spawnSpecificEnemy === 'function') {
            enemyMgr.spawnSpecificEnemy(typeKey, count);
        }
    }

    toggleFreezeSpawns() {
        const enemyMgr = this.game?.getModule('enemies');
        if (enemyMgr) enemyMgr.freezeSpawns = !enemyMgr.freezeSpawns;
        this._renderTabBody();
    }

    killAllEnemies() {
        const enemyMgr = this.game?.getModule('enemies');
        if (!enemyMgr) return;
        for (const e of enemyMgr.enemies) e.currentHp = 0;
    }

    setAllEnemiesOneHp() {
        const enemyMgr = this.game?.getModule('enemies');
        if (!enemyMgr) return;
        for (const e of enemyMgr.enemies) e.currentHp = 1;
    }

    givePlayerCard(id) {
        const upgMgr = this.game?.getModule('upgrades');
        if (!upgMgr) return;
        upgMgr.applyUpgrade(id);
        this.game?.getModule('synergies')?.evaluateSynergies(true);
    }

    giveDroneCard(id) {
        const upgMgr = this.game?.getModule('upgrades');
        if (!upgMgr) return;
        upgMgr.applyDroneUpgrade(id);
        this.game?.getModule('synergies')?.evaluateSynergies(true);
    }

    addDrone(droneId) {
        const droneMgr = this.game?.getModule('drones');
        const player = this.game?.getModule('player');
        if (!droneMgr || !player) return;
        if (droneMgr.drones.length >= player.stats.maxDrones) {
            player.stats.maxDrones = droneMgr.drones.length + 1;
        }
        droneMgr.spawnDrone(droneId);
        this.game?.getModule('synergies')?.evaluateSynergies(true);
    }

    unlockHack(hackId) {
        const hackMgr = this.game?.getModule('hack');
        const player = this.game?.getModule('player');
        if (!hackMgr || !player) return;
        if (!hackMgr.unlockedHacks.includes(hackId) && hackMgr.unlockedHacks.length >= player.stats.maxHackSlots) {
            player.stats.maxHackSlots = hackMgr.unlockedHacks.length + 1;
        }
        hackMgr.unlockHack(hackId);
        this.game?.getModule('synergies')?.evaluateSynergies(true);
    }

    toggleZeroHackCooldown() {
        const hackMgr = this.game?.getModule('hack');
        if (hackMgr) {
            hackMgr.zeroCooldown = !hackMgr.zeroCooldown;
            if (hackMgr.zeroCooldown) hackMgr.cooldownTimer = 0;
        }
        this._renderTabBody();
    }

    giveScrap(amount = 50) {
        const augMgr = this.game?.getModule('augments');
        if (augMgr) augMgr.scrap += amount;
    }

    spawnForgeHere() {
        const augMgr = this.game?.getModule('augments');
        const player = this.game?.getModule('player');
        if (augMgr && player) augMgr.spawnForgeTerminal(player, 1.1);
    }

    equipFullMk3Set(type) {
        const augMgr = this.game?.getModule('augments');
        if (!augMgr) return;
        for (const slot of AUGMENT_SLOTS) {
            const match = AUGMENTS.find(a => a.type === type && a.slot === slot);
            if (match) {
                augMgr.equipped[slot] = { ...match, tier: 3 };
            }
        }
        if (typeof augMgr._recalculateSetBonuses === 'function') {
            augMgr._recalculateSetBonuses();
        }
        this.game?.getModule('synergies')?.evaluateSynergies(true);
        this._renderTabBody();
    }

    grantSynergy(synergyId) {
        const syn = SYNERGIES.find(s => s.id === synergyId);
        if (!syn) return;
        const augMgr = this.game?.getModule('augments');
        const droneMgr = this.game?.getModule('drones');
        const hackMgr = this.game?.getModule('hack');
        const upgMgr = this.game?.getModule('upgrades');
        const synMgr = this.game?.getModule('synergies');
        if (!synMgr) return;

        // Inspect requirement labels/checks and auto-satisfy missing pieces
        const ctx = synMgr._buildContext();
        for (const req of syn.requirements) {
            if (req.check(ctx)) continue;
            const lbl = req.label.toLowerCase();

            // 4-piece or 2+ augment types
            for (const t of ['STRIKER', 'TITAN', 'GHOST', 'NETRUNNER']) {
                if (lbl.includes(t.toLowerCase())) {
                    if (lbl.includes('4-piece')) {
                        this.equipFullMk3Set(t);
                    } else {
                        const freeSlots = AUGMENT_SLOTS.filter(s => !augMgr.equipped[s] || augMgr.equipped[s].type !== t).slice(0, 2);
                        freeSlots.forEach(slot => {
                            const match = AUGMENTS.find(a => a.type === t && a.slot === slot);
                            if (match) augMgr.equipped[slot] = { ...match, tier: 1 };
                        });
                        augMgr._recalculateSetBonuses?.();
                    }
                }
            }
            // Drones
            for (const d of Object.values(DRONE_TYPES)) {
                if (lbl.includes(d.name.toLowerCase()) || lbl.includes(d.id.toLowerCase())) {
                    this.addDrone(d.id);
                }
            }
            if (lbl.includes('any active drone') && (droneMgr?.drones.length || 0) === 0) {
                this.addDrone('BASIC_SHOOTER');
            }
            if (lbl.includes('3+ active drones')) {
                for (const d of Object.values(DRONE_TYPES)) {
                    if ((droneMgr?.drones.length || 0) >= 3) break;
                    if (!droneMgr.drones.some(x => x.id === d.id)) this.addDrone(d.id);
                }
            }
            // Hacks
            for (const hk of Object.values(HACK_DATA)) {
                if (lbl.includes(hk.name.toLowerCase()) || lbl.includes(hk.id.toLowerCase())) {
                    this.unlockHack(hk.id);
                }
            }
            if (lbl.includes('any unlocked hack') && (hackMgr?.unlockedHacks.length || 0) === 0) {
                this.unlockHack('OVERLOAD');
            }
            // Player Cards & Drone Cards by name match
            for (const u of UPGRADES) {
                if (!u.unlockHackId && lbl.includes(u.name.toLowerCase())) {
                    this.givePlayerCard(u.id);
                    break;
                }
            }
            for (const du of DRONE_UPGRADES) {
                if (lbl.includes(du.name.toLowerCase())) {
                    this.giveDroneCard(du.id);
                    break;
                }
            }
        }
        synMgr.evaluateSynergies(true);
        this._renderTabBody();
    }

    // --- Canvas Overlays ---
    draw(ctx) {
        if (!this.unlocked || !this.game) return;
        const player = this.game.getModule('player');
        if (this.showHitboxes && this.game.gameState === 'PLAYING' && player) {
            this._drawHitboxes(ctx, player);
        }
        if (this.showTelemetry) {
            this._drawTelemetry(ctx);
        }
    }

    _drawHitboxes(ctx, player) {
        const enemyMgr = this.game.getModule('enemies');
        const projMgr = this.game.getModule('projectiles');
        const cx = this.game.center.x;
        const cy = this.game.center.y;

        ctx.save();
        ctx.lineWidth = 1.5;

        // Player hitbox & magnet range
        ctx.strokeStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(cx, cy, player.size * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        const magnetPx = (player.getStat('magnetRange') || 1) * this.game.UNIT_SIZE;
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, magnetPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (enemyMgr?.enemies) {
            for (const e of enemyMgr.enemies) {
                const sx = e.x - player.pos.x + cx;
                const sy = e.y - player.pos.y + cy;
                ctx.strokeStyle = e.isBoss ? '#ffcc00' : '#ff3333';
                ctx.beginPath();
                ctx.arc(sx, sy, e.size * 0.48, 0, Math.PI * 2);
                ctx.stroke();

                if (e.emp) {
                    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
                    ctx.beginPath();
                    ctx.arc(sx, sy, e.emp.radius * (this.game.UNIT_SIZE || 100), 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        if (projMgr?.projectiles) {
            ctx.strokeStyle = '#ffff00';
            for (const p of projMgr.projectiles) {
                const sx = p.x - player.pos.x + cx;
                const sy = p.y - player.pos.y + cy;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * 0.48, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    _drawTelemetry(ctx) {
        const director = this.game.getModule('director');
        const enemies = this.game.getModule('enemies')?.enemies?.length || 0;
        const proj = this.game.getModule('projectiles')?.projectiles?.length || 0;
        const particles = this.game.getModule('particles')?.particles?.length || 0;
        const timeSec = ((director?.gameTime || 0) / 1000).toFixed(1);
        const phase = director?.getPhaseName ? director.getPhaseName() : 'MENU';

        ctx.save();
        ctx.fillStyle = 'rgba(0, 15, 18, 0.75)';
        ctx.fillRect(10, this.game.canvas.height - 34, 620, 24);
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `[DEBUG] t=${timeSec}s (${this.game.timeScale || 1}x) | ${phase} | E:${enemies} P:${proj} FX:${particles} | F9 Trainer`,
            18,
            this.game.canvas.height - 22
        );
        ctx.restore();
    }

    // --- HTML Trainer UI ---
    _mountTrainerUi() {
        if (typeof document === 'undefined' || this._panelEl) return;

        const panel = document.createElement('div');
        panel.id = 'cyba-trainer';
        Object.assign(panel.style, {
            position: 'fixed',
            top: '16px',
            left: '16px',
            width: '360px',
            maxHeight: '82vh',
            background: 'rgba(6, 14, 18, 0.94)',
            border: '2px solid #00ffcc',
            boxShadow: '0 0 20px rgba(0,255,204,0.35)',
            color: '#e0fbfc',
            fontFamily: '"VT323", monospace',
            fontSize: '17px',
            zIndex: '99999',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none'
        });

        // Prevent game canvas from reacting to clicks/keys inside trainer
        ['mousedown', 'mouseup', 'click', 'wheel', 'contextmenu'].forEach(evt => {
            panel.addEventListener(evt, (e) => e.stopPropagation());
        });
        panel.addEventListener('keydown', (e) => {
            if (e.code !== 'F9') e.stopPropagation();
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(0, 255, 204, 0.14)',
            borderBottom: '1px solid #00ffcc',
            cursor: 'move'
        });
        header.innerHTML = `<span style="font-weight:bold;color:#00ffcc;letter-spacing:1px;">CYBASHOOTA TRAINER [F9]</span>`;
        const closeBtn = this._btn('HIDE', () => this.setPanelVisible(false), '#ff5555');
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Simple drag support
        let dragging = false, offX = 0, offY = 0;
        const stopDrag = () => { dragging = false; };
        header.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target === closeBtn) return;
            dragging = true;
            offX = e.clientX - panel.offsetLeft;
            offY = e.clientY - panel.offsetTop;
        });
        panel.addEventListener('mouseup', stopDrag);
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            if ((e.buttons & 1) === 0) {
                dragging = false;
                return;
            }
            panel.style.left = `${Math.max(0, e.clientX - offX)}px`;
            panel.style.top = `${Math.max(0, e.clientY - offY)}px`;
        });
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('blur', stopDrag);

        // Tabs
        const tabBar = document.createElement('div');
        Object.assign(tabBar.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '4px',
            padding: '6px',
            borderBottom: '1px solid #1e4246'
        });
        const tabs = [
            ['player', 'PLAYER'],
            ['time', 'TIME/XP'],
            ['enemies', 'ENEMY'],
            ['build', 'BUILD'],
            ['codex', 'DEV']
        ];
        tabs.forEach(([id, label]) => {
            const b = this._btn(label, () => {
                this.activeTab = id;
                this._renderTabBody();
            });
            b.dataset.tabId = id;
            tabBar.appendChild(b);
        });
        panel.appendChild(tabBar);

        const body = document.createElement('div');
        Object.assign(body.style, {
            padding: '10px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });
        panel.appendChild(body);

        document.body.appendChild(panel);
        this._panelEl = panel;
        this._bodyEl = body;
        this._tabBarEl = tabBar;
        this._renderTabBody();
    }

    _btn(label, onClick, color = '#00ffcc') {
        const b = document.createElement('button');
        b.textContent = label;
        Object.assign(b.style, {
            background: '#0a1c20',
            color,
            border: `1px solid ${color}`,
            padding: '4px 7px',
            fontFamily: 'inherit',
            fontSize: '15px',
            cursor: 'pointer'
        });
        b.addEventListener('click', onClick);
        return b;
    }

    _row(children) {
        const d = document.createElement('div');
        Object.assign(d.style, { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' });
        children.forEach(c => d.appendChild(c));
        return d;
    }

    _section(title) {
        const s = document.createElement('div');
        s.textContent = title;
        Object.assign(s.style, { color: '#ffcc00', fontWeight: 'bold', borderBottom: '1px solid #26484d', marginTop: '4px' });
        return s;
    }

    _renderTabBody() {
        if (!this._bodyEl) return;
        const b = this._bodyEl;
        b.innerHTML = '';

        Array.from(this._tabBarEl.children).forEach(btn => {
            const active = btn.dataset.tabId === this.activeTab;
            btn.style.background = active ? '#00ffcc' : '#0a1c20';
            btn.style.color = active ? '#001518' : '#00ffcc';
        });

        const player = this.game?.getModule('player');
        const enemyMgr = this.game?.getModule('enemies');
        const hackMgr = this.game?.getModule('hack');
        const codex = this.game?.getModule('codex');

        if (this.activeTab === 'player') {
            b.appendChild(this._section('SURVIVABILITY'));
            b.appendChild(this._row([
                this._btn(`GOD MODE: ${player?.godMode ? 'ON' : 'OFF'}`, () => this.setGodMode(), player?.godMode ? '#00ff66' : '#00ffcc'),
                this._btn('FULL HEAL', () => this.fullHeal()),
                this._btn('REFILL ARMOR', () => this.refillArmor()),
                this._btn('+10 REROLLS', () => this.giveRerolls(10)),
                this._btn('SELF EMP (3.5s)', () => this.triggerEmp(3500), '#00e5ff')
            ]));
            b.appendChild(this._section('QUICK STAT TWEAKS'));
            const stats = [
                ['DMG', 'damage', 2],
                ['FIRE RATE', 'fireRate', 0.25],
                ['SPEED', 'moveSpeed', 0.15],
                ['CRIT%', 'critChance', 0.1],
                ['LUCK', 'luck', 0.5],
                ['DRONES', 'maxDrones', 1],
                ['HACKS', 'maxHackSlots', 1]
            ];
            stats.forEach(([label, key, step]) => {
                const val = player ? (key in player.multipliers ? player.multipliers[key] : player.stats[key]) : 0;
                const span = document.createElement('span');
                span.textContent = `${label}: ${Number(val).toFixed(2)}`;
                span.style.minWidth = '130px';
                b.appendChild(this._row([
                    span,
                    this._btn(`-${step}`, () => this.tweakStat(key, -step), '#ff7777'),
                    this._btn(`+${step}`, () => this.tweakStat(key, step), '#00ffcc')
                ]));
            });
        } else if (this.activeTab === 'time') {
            b.appendChild(this._section('XP & LEVEL'));
            const lvlInput = document.createElement('input');
            lvlInput.type = 'number';
            lvlInput.value = player?.level || 1;
            Object.assign(lvlInput.style, { width: '60px', background: '#051012', color: '#fff', border: '1px solid #00ffcc', padding: '3px' });
            b.appendChild(this._row([
                this._btn('+100 XP', () => this.giveXp(100)),
                this._btn('+1000 XP', () => this.giveXp(1000)),
                lvlInput,
                this._btn('SET LVL', () => this.setLevel(lvlInput.value))
            ]));
            b.appendChild(this._section('TIME SCALE'));
            b.appendChild(this._row([0.5, 1, 2, 5].map(s =>
                this._btn(`${s}x`, () => this.setTimeScale(s), this.game?.timeScale === s ? '#ffcc00' : '#00ffcc')
            )));
            b.appendChild(this._section('JUMP TO TIMELINE PHASE'));
            SPAWN_TIMELINE.forEach((p, idx) => {
                b.appendChild(this._btn(`${p.start}s - ${p.name}`, () => this.jumpToPhase(idx)));
            });
        } else if (this.activeTab === 'enemies') {
            b.appendChild(this._section('WAVE & BOARD CONTROL'));
            b.appendChild(this._row([
                this._btn(`FREEZE SPAWNS: ${enemyMgr?.freezeSpawns ? 'ON' : 'OFF'}`, () => this.toggleFreezeSpawns(), enemyMgr?.freezeSpawns ? '#ffcc00' : '#00ffcc'),
                this._btn('ALL 1 HP', () => this.setAllEnemiesOneHp(), '#ffaa00'),
                this._btn('KILL ALL', () => this.killAllEnemies(), '#ff5555')
            ]));
            b.appendChild(this._section('SPAWN BOSSES'));
            b.appendChild(this._row(
                Object.keys(ENEMY_TYPES).filter(k => ENEMY_TYPES[k].isBoss).map(k =>
                    this._btn(ENEMY_TYPES[k].codexName || k, () => this.spawnEnemy(k, 1), '#ffcc00')
                )
            ));
            b.appendChild(this._section('SPAWN ENEMY (1x / 5x)'));
            Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].isBoss).forEach(k => {
                b.appendChild(this._row([
                    this._btn(`+1 ${ENEMY_TYPES[k].codexName || k}`, () => this.spawnEnemy(k, 1)),
                    this._btn(`+5`, () => this.spawnEnemy(k, 5))
                ]));
            });
        } else if (this.activeTab === 'build') {
            b.appendChild(this._section('AUGMENTS & FORGE'));
            b.appendChild(this._row([
                this._btn('+50 SCRAP', () => this.giveScrap(50), '#ff9900'),
                this._btn('SPAWN FORGE HERE', () => this.spawnForgeHere(), '#ff9900')
            ]));
            b.appendChild(this._row(['TITAN', 'STRIKER', 'GHOST', 'NETRUNNER'].map(t =>
                this._btn(`MK.III ${t}`, () => this.equipFullMk3Set(t), '#ffcc00')
            )));

            b.appendChild(this._section('DRONES & HACKS'));
            b.appendChild(this._row([
                this._btn(`ZERO HACK CD: ${hackMgr?.zeroCooldown ? 'ON' : 'OFF'}`, () => this.toggleZeroHackCooldown(), hackMgr?.zeroCooldown ? '#00ff66' : '#bc00ff')
            ]));
            b.appendChild(this._row(Object.values(DRONE_TYPES).map(d =>
                this._btn(`+${d.name}`, () => this.addDrone(d.id), d.color || '#00ffcc')
            )));
            b.appendChild(this._row(Object.values(HACK_DATA).map(h =>
                this._btn(`+${h.name}`, () => this.unlockHack(h.id), '#bc00ff')
            )));

            b.appendChild(this._section('SEARCH CARDS / SYNERGIES'));
            const search = document.createElement('input');
            search.placeholder = 'Filter cards or synergies...';
            search.value = this.searchQuery;
            Object.assign(search.style, { background: '#051012', color: '#fff', border: '1px solid #00ffcc', padding: '5px' });
            const resultsBox = document.createElement('div');
            Object.assign(resultsBox.style, { display: 'flex', flexDirection: 'column', gap: '4px' });

            const renderSearchResults = () => {
                resultsBox.innerHTML = '';
                const q = this.searchQuery.trim().toLowerCase();
                SYNERGIES.filter(s => !q || s.name.toLowerCase().includes(q)).slice(0, 12).forEach(s => {
                    resultsBox.appendChild(this._btn(`[SYN] ${s.name}`, () => this.grantSynergy(s.id), s.color || '#ffcc00'));
                });
                UPGRADES.filter(u => !u.unlockHackId && (!q || u.name.toLowerCase().includes(q))).slice(0, 12).forEach(u => {
                    resultsBox.appendChild(this._btn(`[CARD] ${u.name} (${u.rarity})`, () => this.givePlayerCard(u.id)));
                });
                DRONE_UPGRADES.filter(u => !q || u.name.toLowerCase().includes(q)).slice(0, 10).forEach(u => {
                    resultsBox.appendChild(this._btn(`[DRONE] ${u.name} (${u.rarity})`, () => this.giveDroneCard(u.id), '#ff55ff'));
                });
            };

            search.addEventListener('input', () => {
                this.searchQuery = search.value;
                renderSearchResults();
            });
            b.appendChild(search);
            b.appendChild(resultsBox);
            renderSearchResults();
        } else if (this.activeTab === 'codex') {
            b.appendChild(this._section('VISUAL OVERLAYS'));
            b.appendChild(this._row([
                this._btn(`HITBOXES: ${this.showHitboxes ? 'ON' : 'OFF'}`, () => { this.showHitboxes = !this.showHitboxes; this._renderTabBody(); }),
                this._btn(`TELEMETRY: ${this.showTelemetry ? 'ON' : 'OFF'}`, () => { this.showTelemetry = !this.showTelemetry; this._renderTabBody(); })
            ]));
            b.appendChild(this._section('CODEX TESTING (ISOLATED SAVE)'));
            b.appendChild(this._row([
                this._btn('+50 KILLS ALL ENEMIES', () => codex?.addKillsToAll(50)),
                this._btn('UNLOCK ALL CODEX', () => codex?.unlockAll(), '#ffcc00'),
                this._btn('RESET DEBUG CODEX', () => codex?.resetCodex(), '#ff5555')
            ]));
        }
    }
}
