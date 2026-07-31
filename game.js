// Bounce Attack - Tekken Style Stickman Edition
// Web Audio Synth BGM Engine & Slightly Lowered Ground Platforms (+15px Ceiling Headroom Expansion)

const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 1152;

const STATE = {
    MENU: 'menu',
    CHAR_SELECT: 'char-select',
    MAP_SELECT: 'map-select',
    HOW_TO: 'how-to',
    PLAYING: 'playing',
    PAUSED: 'pause',
    GAME_OVER: 'game-over'
};

let currentGameState = STATE.MENU;
let keys = {};
let particles = [];
let projectiles = [];
let sparks = [];
let comboTexts = [];

let screenShake = 0;
let hitStopTimer = 0;
let gameTimer = 99;
let timerInterval = null;
let selectedMapKey = 'flat';

// --- WEB AUDIO SYNTHESIZER BGM ENGINE ---
let audioCtx = null;
let bgmInterval = null;
let bgmPlaying = false;

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

const BGM_NOTES = [
    130.81, 146.83, 164.81, 196.00, 164.81, 146.83, // C3, D3, E3, G3, E3, D3
    220.00, 196.00, 164.81, 146.83, 130.81, 196.00  // A3, G3, E3, D3, C3, G3
];
let noteIdx = 0;

function playSynthNote(freq, type = 'sawtooth', duration = 0.15, gainVal = 0.08) {
    if (!audioCtx || !bgmPlaying) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {
        console.log("Audio play error:", e);
    }
}

function startBgm() {
    initAudioContext();
    bgmPlaying = true;
    if (bgmInterval) clearInterval(bgmInterval);
    
    noteIdx = 0;
    bgmInterval = setInterval(() => {
        if (currentGameState === STATE.PLAYING && bgmPlaying) {
            let note = BGM_NOTES[noteIdx % BGM_NOTES.length];
            playSynthNote(note, 'sawtooth', 0.18, 0.07);
            playSynthNote(note * 0.5, 'square', 0.22, 0.09);
            
            if (noteIdx % 4 === 0) {
                playSynthNote(440.00, 'triangle', 0.1, 0.04);
            }
            noteIdx++;
        }
    }, 180);
}

function stopBgm() {
    bgmPlaying = false;
    if (bgmInterval) clearInterval(bgmInterval);
}

const bgmToggle = document.getElementById('bgm-toggle');
if (bgmToggle) {
    bgmToggle.addEventListener('click', () => {
        if (bgmPlaying) {
            stopBgm();
            bgmToggle.textContent = 'Mute';
        } else {
            startBgm();
            bgmToggle.textContent = 'Sound On';
        }
    });
}

// --- CHARACTER CONFIGURATIONS ---
const CHARACTER_PRESETS = {
    swordsman: { name: 'SWORDSMAN', icon: 'SW', color: '#ff9500', maxHp: 120, speed: 6.5 * 0.84375, jumpForce: 15.5 * 1.3923, basicDamage: 12, specialDamage: 22, ultDamage: 45, basicCd: 400, specialCd: 1200, ultCd: 4000 },
    mage: { name: 'MAGE', icon: 'MG', color: '#ff2d55', maxHp: 90, speed: 5.0 * 0.84375, jumpForce: 15.0 * 1.3923, basicDamage: 10, specialDamage: 26, ultDamage: 50, basicCd: 500, specialCd: 1400, ultCd: 4800 },
    archer: { name: 'ARCHER', icon: 'AR', color: '#4cd964', maxHp: 95, speed: 6.0 * 0.84375, jumpForce: 16.0 * 1.3923, basicDamage: 8, specialDamage: 18, ultDamage: 40, basicCd: 450, specialCd: 1200, ultCd: 4200 },
    rogue: { name: 'ROGUE', icon: 'RG', color: '#bf5af2', maxHp: 90, speed: 8.0 * 0.84375, jumpForce: 17.5 * 1.3923, basicDamage: 11, specialDamage: 20, ultDamage: 38, basicCd: 300, specialCd: 1000, ultCd: 3500 },
    lancer: { name: 'LANCER', icon: 'LC', color: '#5ac8fa', maxHp: 110, speed: 6.0 * 0.84375, jumpForce: 15.0 * 1.3923, basicDamage: 13, specialDamage: 22, ultDamage: 42, basicCd: 500, specialCd: 1300, ultCd: 4000 },
    berserker: { name: 'BERSERKER', icon: 'BS', color: '#ff3b30', maxHp: 140, speed: 5.5 * 0.84375, jumpForce: 14.5 * 1.3923, basicDamage: 15, specialDamage: 28, ultDamage: 52, basicCd: 650, specialCd: 1600, ultCd: 4800 },
    gunner: { name: 'GUNNER', icon: 'GN', color: '#ffcc00', maxHp: 85, speed: 5.5 * 0.84375, jumpForce: 14.0 * 1.3923, basicDamage: 7, specialDamage: 17, ultDamage: 38, basicCd: 220, specialCd: 1000, ultCd: 3800 },
    ninja: { name: 'NINJA', icon: 'NJ', color: '#00e5ff', maxHp: 90, speed: 7.5 * 0.84375, jumpForce: 16.5 * 1.3923, basicDamage: 9, specialDamage: 19, ultDamage: 38, basicCd: 320, specialCd: 850, ultCd: 3600 },
    brawler: { name: 'BRAWLER', icon: 'BR', color: '#e040fb', maxHp: 115, speed: 6.5 * 0.84375, jumpForce: 15.0 * 1.3923, basicDamage: 12, specialDamage: 22, ultDamage: 42, basicCd: 380, specialCd: 1100, ultCd: 4000 },
    necromancer: { name: 'NECROMANCER', icon: 'NC', color: '#8e8e93', maxHp: 95, speed: 4.8 * 0.84375, jumpForce: 14.5 * 1.3923, basicDamage: 9, specialDamage: 22, ultDamage: 45, basicCd: 600, specialCd: 1500, ultCd: 4800 },
    paladin: { name: 'PALADIN', icon: 'PL', color: '#0a84ff', maxHp: 150, speed: 4.5 * 0.84375, jumpForce: 14.0 * 1.3923, basicDamage: 10, specialDamage: 18, ultDamage: 35, basicCd: 550, specialCd: 1800, ultCd: 4800 },
    reaper: { name: 'REAPER', icon: 'RP', color: '#34c759', maxHp: 105, speed: 5.5 * 0.84375, jumpForce: 15.0 * 1.3923, basicDamage: 14, specialDamage: 25, ultDamage: 45, basicCd: 550, specialCd: 1300, ultCd: 4200 },
    vampire: { name: 'VAMPIRE', icon: 'VP', color: '#ff2d55', maxHp: 100, speed: 6.0 * 0.84375, jumpForce: 15.5 * 1.3923, basicDamage: 10, specialDamage: 21, ultDamage: 40, basicCd: 450, specialCd: 1200, ultCd: 4000 },
    alchemist: { name: 'ALCHEMIST', icon: 'AL', color: '#30d158', maxHp: 95, speed: 5.0 * 0.84375, jumpForce: 14.8 * 1.3923, basicDamage: 8, specialDamage: 23, ultDamage: 38, basicCd: 500, specialCd: 1400, ultCd: 4200 }
};

// --- 2 REFINED MAPS WITH SLIGHTLY EXPANDED CEILING HEADROOM (+15px Ground Lowered) ---
const MAPS = {
    flat: {
        name: 'FLAT ARENA',
        background: '#090d16',
        gridColor: 'rgba(0, 229, 255, 0.12)',
        gravity: 0.676,
        platforms: [
            { x: 0, y: 1105, w: 2048, h: 47, border: '#00e5ff', fill: '#0f172a' }
        ],
        spawnP1: { x: 260, y: 925 },
        spawnP2: { x: 1788, y: 925 }
    },
    classic: {
        name: 'CLASSIC ARENA',
        background: '#0e0b1a',
        gridColor: 'rgba(255, 170, 0, 0.1)',
        gravity: 0.676,
        platforms: [
            { x: 0, y: 1105, w: 2048, h: 47, border: '#ffaa00', fill: '#1b152b' },
            { x: 240, y: 865, w: 480, h: 36, border: '#ff0055', fill: '#250f24' },
            { x: 1328, y: 865, w: 480, h: 36, border: '#ff0055', fill: '#250f24' },
            { x: 744, y: 635, w: 560, h: 36, border: '#00ffcc', fill: '#1b152b' }
        ],
        spawnP1: { x: 260, y: 925 },
        spawnP2: { x: 1788, y: 925 }
    }
};

// --- TEKKEN SPARK IMPACT & COMBO SYSTEM ---
class TekkenSpark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.lines = [];
        for (let i = 0; i < 12; i++) {
            let angle = Math.random() * Math.PI * 2;
            let len = Math.random() * 45 + 15;
            this.lines.push({ angle, len, curLen: 0 });
        }
        this.life = 14;
    }

    update() {
        this.life--;
        for (let l of this.lines) {
            l.curLen += (l.len - l.curLen) * 0.35;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        for (let l of this.lines) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(l.angle) * l.curLen, this.y + Math.sin(l.angle) * l.curLen);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class ComboText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 45;
        this.scale = 1.6;
    }

    update() {
        this.life--;
        this.y -= 1.2;
        this.scale = Math.max(1.0, this.scale - 0.04);
    }

    draw(ctx) {
        ctx.save();
        ctx.font = `900 ${Math.round(36 * this.scale)}px Outfit, sans-serif`;
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, speedScale = 1.0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 16 * speedScale;
        this.speedY = (Math.random() - 0.5) * 16 * speedScale - 3;
        this.gravity = 0.3;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, dx, dy, color, size, speed, damage, owner, skillCategory = 'basic', type = 'normal', trackingTarget = null) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.size = size * 2.2;
        this.speed = speed * 1.3;
        this.damage = damage;
        this.owner = owner; 
        this.skillCategory = skillCategory; // 'basic' or 'special'
        this.type = type; 
        this.target = trackingTarget;
        this.life = 180; 
    }

    update() {
        this.life--;
        if (this.type === 'homing' && this.target) {
            let tx = this.target.x + this.target.width/2;
            let ty = this.target.y + this.target.height/2;
            let angle = Math.atan2(ty - this.y, tx - this.x);
            this.dx = Math.cos(angle);
            this.dy = Math.sin(angle);
        }
        
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;

        if (Math.random() < 0.5) {
            particles.push(new Particle(this.x, this.y, this.color, 0.4));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- PLAYER CLASS ---
class Player {
    constructor(id, x, y, charKey) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.charKey = charKey;
        this.config = CHARACTER_PRESETS[charKey];
        
        this.width = 54;
        this.height = 84;
        
        this.hp = this.config.maxHp;
        this.maxHp = this.config.maxHp;
        this.ultGauge = 0;
        
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.isGrounded = false;
        this.facing = id === 1 ? 1 : -1;
        
        this.jumpsLeft = 2;
        this.comboCount = 0;
        this.comboResetTimer = 0;
        
        this.cdBasicLast = 0;
        this.cdSpecialLast = 0;
        this.cdUltLast = 0;
        
        this.isShielded = false;
        this.shieldDuration = 0;
        this.isInvisible = false;
        this.stealthDuration = 0;
        this.berserkMode = false;
        this.berserkDuration = 0;
        
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackBox = { x: 0, y: 0, w: 0, h: 0 };
    }

    update(platforms, mapConfig) {
        if (this.isShielded) {
            this.shieldDuration--;
            if (this.shieldDuration <= 0) this.isShielded = false;
        }
        if (this.isInvisible) {
            this.stealthDuration--;
            if (this.stealthDuration <= 0) this.isInvisible = false;
        }
        if (this.berserkMode) {
            this.berserkDuration--;
            if (this.berserkDuration <= 0) this.berserkMode = false;
        }
        
        if (this.comboResetTimer > 0) {
            this.comboResetTimer--;
            if (this.comboResetTimer <= 0) this.comboCount = 0;
        }
        
        const currentGravity = mapConfig.gravity || 0.676;
        this.vy += currentGravity;
        this.x += this.vx;
        
        this.angle += this.angularVelocity;
        
        if (this.isGrounded) {
            this.angle *= 0.72;
            this.angularVelocity *= 0.6;
            this.jumpsLeft = 2;
        } else {
            this.angularVelocity *= 0.96;
            if (Math.abs(this.vx) > 0.5) {
                this.angle += this.facing * 0.03;
            }
        }

        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        } else if (this.x + this.width > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.vx = 0;
        }
        
        this.y += this.vy;

        // TOP CEILING CLAMP (SLIGHTLY EXPANDED UPWARD TO -50px)
        if (this.y < -50) {
            this.y = -50;
            this.vy = 0;
        }

        this.isGrounded = false;

        for (let plat of platforms) {
            if (this.x + this.width > plat.x && 
                this.x < plat.x + plat.w) {
                if (this.vy > 0 && 
                    this.y + this.height - this.vy <= plat.y + 14 && 
                    this.y + this.height >= plat.y) {
                    this.y = plat.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.jumpsLeft = 2;
                }
            }
        }
        
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }
        
        this.updateUI();
    }

    jump() {
        if (this.jumpsLeft > 0) {
            if (this.jumpsLeft === 2) {
                this.vy = -this.config.jumpForce;
                this.angularVelocity = this.facing * 0.35;
            } else {
                this.vy = -this.config.jumpForce * 0.95;
                this.angularVelocity = -this.facing * 0.65;
                createHitParticles(this.x + this.width/2, this.y + this.height, '#ffffff', 14);
                comboTexts.push(new ComboText(this.x + this.width/2, this.y - 20, "DOUBLE FLIP!", "#00e5ff"));
            }
            this.jumpsLeft--;
            this.isGrounded = false;
        }
    }

    takeDamage(dmg) {
        if (this.isShielded) {
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#00e5ff', 18);
            return;
        }
        
        if (this.isInvisible) {
            this.isInvisible = false;
        }

        let dmgTaken = Math.round(dmg * (this.charKey === 'berserker' ? 1.25 : 1.0));
        this.hp = Math.max(0, this.hp - dmgTaken);
        
        screenShake = 22;
        hitStopTimer = 3;
        
        sparks.push(new TekkenSpark(this.x + this.width/2, this.y + this.height/2, '#ffcc00'));
        sparks.push(new TekkenSpark(this.x + this.width/2, this.y + this.height/2, '#ff3b30'));

        this.angularVelocity = -this.facing * 0.55;
        this.vx = -this.facing * 7;
        
        createHitParticles(this.x + this.width/2, this.y + this.height/2, this.config.color, 24);
    }

    registerHitOnOpponent(opponent, skillType = 'basic') {
        this.comboCount++;
        this.comboResetTimer = 120;
        
        if (skillType === 'special') {
            this.gainUlt(30);
        } else {
            this.gainUlt(12);
        }
        
        if (this.comboCount >= 2) {
            comboTexts.push(new ComboText(opponent.x + opponent.width/2, opponent.y - 30, `${this.comboCount} HITS!`, this.config.color));
        }
    }

    gainUlt(amount) {
        this.ultGauge = Math.min(100, this.ultGauge + amount);
    }

    useBasicAttack(opponent) {
        const now = Date.now();
        let cd = this.config.basicCd;
        if (this.berserkMode) cd *= 0.5;
        
        if (now - this.cdBasicLast < cd) return;
        this.cdBasicLast = now;
        
        this.isAttacking = true;
        this.attackTimer = 14;
        
        if (this.charKey === 'swordsman' || this.charKey === 'berserker' || this.charKey === 'brawler') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 155, y: this.y - 10, w: 155, h: this.height + 20 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) this.registerHitOnOpponent(opponent, 'basic');
        } else if (this.charKey === 'lancer') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 210, y: this.y + 10, w: 210, h: 48 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) this.registerHitOnOpponent(opponent, 'basic');
        } else if (this.charKey === 'mage') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#ff5500', 10, 11, this.config.basicDamage, this.id, 'basic'));
        } else if (this.charKey === 'archer') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#4cd964', 5, 18, this.config.basicDamage, this.id, 'basic'));
        } else if (this.charKey === 'gunner') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 28, this.facing, 0, '#ffcc00', 6, 22, this.config.basicDamage, this.id, 'basic'));
        } else if (this.charKey === 'ninja') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 28, this.facing, 0, '#8e8e93', 8, 16, this.config.basicDamage, this.id, 'basic'));
        } else if (this.charKey === 'necromancer') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 28, this.facing, 0, '#bf5af2', 9, 9, this.config.basicDamage, this.id, 'basic'));
        } else if (this.charKey === 'paladin') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 140, y: this.y - 10, w: 140, h: this.height + 20 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) this.registerHitOnOpponent(opponent, 'basic');
        } else if (this.charKey === 'reaper') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 180, y: this.y - 15, w: 180, h: this.height + 30 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) this.registerHitOnOpponent(opponent, 'basic');
        } else if (this.charKey === 'vampire') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 150, y: this.y, w: 150, h: this.height + 10 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) {
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.basicDamage * 0.35));
                this.registerHitOnOpponent(opponent, 'basic');
            }
        } else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, -0.15, '#30d158', 8, 11, this.config.basicDamage, this.id, 'basic'));
        } else if (this.charKey === 'rogue') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 135, y: this.y, w: 135, h: this.height + 10 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) this.registerHitOnOpponent(opponent, 'basic');
        }
        
        triggerCooldownUI(this.id, 'basic', cd);
    }

    useSpecialSkill(opponent) {
        const now = Date.now();
        if (now - this.cdSpecialLast < this.config.specialCd) return;
        this.cdSpecialLast = now;

        if (this.charKey === 'swordsman') {
            this.vx = this.facing * 20;
            this.angularVelocity = this.facing * 0.4;
            this.isAttacking = true;
            this.attackTimer = 18;
            this.attackBox = { x: this.x - 45, y: this.y - 15, w: this.width + 90, h: this.height + 30 };
            if (checkMeleeHit(this, opponent, this.config.specialDamage)) this.registerHitOnOpponent(opponent, 'special');
        } 
        else if (this.charKey === 'mage') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 180, '#ff9500');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 200) {
                opponent.takeDamage(this.config.specialDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 14;
                this.registerHitOnOpponent(opponent, 'special');
            }
        } 
        else if (this.charKey === 'archer') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, -0.22, '#4cd964', 5, 14, this.config.specialDamage * 0.5, this.id, 'special'));
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#4cd964', 5, 14, this.config.specialDamage * 0.5, this.id, 'special'));
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0.22, '#4cd964', 5, 14, this.config.specialDamage * 0.5, this.id, 'special'));
        } 
        else if (this.charKey === 'rogue') {
            this.isInvisible = true;
            this.stealthDuration = 180; 
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#af52de', 35);
        } 
        else if (this.charKey === 'lancer') {
            this.vy = -this.config.jumpForce * 1.35;
            this.vx = this.facing * 9;
            this.angularVelocity = this.facing * 0.5;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#5ac8fa', 20);
        } 
        else if (this.charKey === 'berserker') {
            this.berserkMode = true;
            this.berserkDuration = 240;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff3b30', 40);
        } 
        else if (this.charKey === 'gunner') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, -0.25, '#ffcc00', 14, 12, this.config.specialDamage, this.id, 'special', 'bomb'));
        } 
        else if (this.charKey === 'ninja') {
            let oldX = this.x;
            this.x = opponent.x - opponent.facing * 90;
            this.facing = opponent.facing;
            this.angularVelocity = this.facing * 0.6;
            createHitParticles(oldX + this.width/2, this.y + this.height/2, '#8e8e93', 20);
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 20);
            opponent.takeDamage(this.config.specialDamage);
            this.registerHitOnOpponent(opponent, 'special');
        } 
        else if (this.charKey === 'brawler') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 120, y: this.y - 40, w: 140, h: this.height + 40 };
            if (checkMeleeHit(this, opponent, this.config.specialDamage)) {
                opponent.vy = -18;
                opponent.vx = this.facing * 6;
                this.registerHitOnOpponent(opponent, 'special');
            }
        } 
        else if (this.charKey === 'necromancer') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, 0, '#bf5af2', 12, 8, this.config.specialDamage, this.id, 'special', 'homing', opponent));
        } 
        else if (this.charKey === 'paladin') {
            this.isShielded = true;
            this.shieldDuration = 220;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#0a84ff', 30);
        } 
        else if (this.charKey === 'reaper') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#34c759', 16, 9, this.config.specialDamage, this.id, 'special', 'absorb', opponent));
        } 
        else if (this.charKey === 'vampire') {
            this.vx = this.facing * 24;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 30);
            if (Math.abs(this.x - opponent.x) < 180 && Math.abs(this.y - opponent.y) < 110) {
                opponent.takeDamage(this.config.specialDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.specialDamage * 0.55));
                this.registerHitOnOpponent(opponent, 'special');
            }
        } 
        else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y, this.facing, -0.35, '#30d158', 12, 11, this.config.specialDamage, this.id, 'special', 'bomb'));
        }

        triggerCooldownUI(this.id, 'special', this.config.specialCd);
    }

    useUltimate(opponent) {
        if (this.ultGauge < 100) return;
        this.ultGauge = 0;
        
        screenShake = 28;

        if (this.charKey === 'swordsman') {
            for(let i=0; i<7; i++) {
                setTimeout(() => {
                    this.x = opponent.x + (Math.random() - 0.5) * 160;
                    this.y = opponent.y - 20;
                    this.angularVelocity = (Math.random() - 0.5) * 0.8;
                    opponent.takeDamage(this.config.ultDamage / 7);
                    createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#ff2d55', 20);
                }, i * 140);
            }
        } 
        else if (this.charKey === 'mage') {
            let pX = opponent.x;
            projectiles.push(new Projectile(pX, 0, 0, 1, '#ff3b30', 48, 9, this.config.ultDamage, this.id, 'ult', 'bomb'));
        } 
        else if (this.charKey === 'archer') {
            for(let i=0; i<10; i++) {
                setTimeout(() => {
                    let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
                    projectiles.push(new Projectile(pX, this.y + 15 + (Math.random()-0.5)*60, this.facing, (Math.random()-0.5)*0.25, '#4cd964', 6, 24, this.config.ultDamage / 10, this.id, 'ult'));
                }, i * 70);
            }
        } 
        else if (this.charKey === 'rogue') {
            this.vx = this.facing * 38;
            this.y = opponent.y;
            setTimeout(() => {
                let dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
                if (dist < 260) {
                    opponent.takeDamage(this.config.ultDamage);
                    createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#af52de', 45);
                }
            }, 90);
        } 
        else if (this.charKey === 'lancer') {
            this.vy = -28;
            this.angularVelocity = this.facing * 0.6;
            setTimeout(() => {
                this.vy = 34;
                let checkLand = setInterval(() => {
                    if (this.isGrounded || this.y >= 980) {
                        clearInterval(checkLand);
                        createExplosion(this.x + this.width/2, this.y + this.height, 240, '#5ac8fa');
                        let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height) - (opponent.y + opponent.height));
                        if (dist < 260) {
                            opponent.takeDamage(this.config.ultDamage);
                            opponent.vy = -18;
                        }
                    }
                }, 1000/60);
            }, 300);
        } 
        else if (this.charKey === 'berserker') {
            createExplosion(this.x + this.width/2, this.y + this.height, 220, '#ff3b30');
            let dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
            if (dist < 300) {
                opponent.takeDamage(this.config.ultDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 26;
                opponent.vy = -10;
            }
        } 
        else if (this.charKey === 'gunner') {
            let beamX = this.facing === 1 ? this.x + this.width : 0;
            let beamW = this.facing === 1 ? CANVAS_WIDTH - beamX : this.x;
            
            projectiles.push({
                x: beamX + beamW/2,
                y: this.y + 30,
                draw: function(ctx) {
                    ctx.save();
                    ctx.fillStyle = '#ffcc00';
                    ctx.shadowColor = '#ffcc00';
                    ctx.shadowBlur = 40; 
                    ctx.fillRect(this.facing === 1 ? beamX : 0, this.y - 25, beamW, 50);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(this.facing === 1 ? beamX : 0, this.y - 10, beamW, 20);
                    ctx.restore();
                },
                update: function() {},
                life: 30,
                owner: this.id
            });

            if (opponent.y + opponent.height > this.y + 5 && opponent.y < this.y + 55) {
                if ((this.facing === 1 && opponent.x > this.x) || (this.facing === -1 && opponent.x < this.x)) {
                    opponent.takeDamage(this.config.ultDamage);
                    opponent.vx = this.facing * 18;
                }
            }
        } 
        else if (this.charKey === 'ninja') {
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    let rx = Math.random() * CANVAS_WIDTH;
                    let angle = Math.atan2(opponent.y - 80, rx - opponent.x);
                    projectiles.push(new Projectile(rx, 80, -Math.cos(angle), -Math.sin(angle), '#8e8e93', 9, 20, this.config.ultDamage / 15, this.id, 'ult'));
                }, i * 70);
            }
        } 
        else if (this.charKey === 'brawler') {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    this.vx = this.facing * 10;
                    this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 90, y: this.y, w: 90, h: this.height };
                    if (checkMeleeHit(this, opponent, this.config.ultDamage / 6)) {};
                }, i * 100);
            }
        } 
        else if (this.charKey === 'necromancer') {
            for(let i = 0; i < 4; i++) {
                setTimeout(() => {
                    projectiles.push(new Projectile(this.x + this.width/2, this.y, this.facing, -0.6 + (i*0.4), '#bf5af2', 18, 9, this.config.ultDamage/4, this.id, 'ult', 'homing', opponent));
                }, i * 160);
            }
        } 
        else if (this.charKey === 'paladin') {
            createExplosion(opponent.x + opponent.width/2, opponent.y + opponent.height/2, 160, '#0a84ff');
            opponent.takeDamage(this.config.ultDamage);
            opponent.vy = 18;
        } 
        else if (this.charKey === 'reaper') {
            let baseDmg = this.config.ultDamage;
            if (opponent.hp / opponent.maxHp < 0.4) {
                baseDmg *= 2.0; 
                createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#ff0055', 50);
            }
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 130, y: this.y - 20, w: 130, h: this.height + 40 };
            checkMeleeHit(this, opponent, baseDmg);
        } 
        else if (this.charKey === 'vampire') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 260, '#ff2d55');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 280) {
                opponent.takeDamage(this.config.ultDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.ultDamage * 0.75));
            }
        } 
        else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, -0.18, '#30d158', 26, 11, this.config.ultDamage, this.id, 'ult', 'bomb'));
        }

        triggerCooldownUI(this.id, 'ult', this.config.ultCd);
    }

    updateUI() {
        const hpPct = Math.max(0, (this.hp / this.maxHp) * 100);
        document.getElementById(`p${this.id}-hp`).style.width = `${hpPct}%`;
        document.getElementById(`p${this.id}-hp-label`).textContent = `${Math.round(hpPct)}%`;
        document.getElementById(`p${this.id}-ult`).style.width = `${this.ultGauge}%`;
    }

    // --- ACROBATIC RAGDOLL STICKMAN DRAWING ENGINE ---
    draw(ctx) {
        if (this.isInvisible) {
            ctx.save();
            ctx.globalAlpha = 0.22;
        }

        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle);

        const charColor = this.config.color;
        
        ctx.strokeStyle = charColor;
        ctx.fillStyle = charColor;
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const headRadius = 20;
        const headY = -this.height/2 + headRadius + 3;
        const neckY = headY + headRadius;
        const pelvisY = this.height/2 - 26;

        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.facing * 8, headY - 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, neckY);
        ctx.lineTo(0, pelvisY);
        ctx.stroke();

        let legOffset = Math.sin(Date.now() * 0.018) * (Math.abs(this.vx) > 0.1 ? 16 : 3);
        if (!this.isGrounded) legOffset = 14;

        let lKneeX = -12 - legOffset * 0.5;
        let lKneeY = pelvisY + 14;
        let lFootX = -15 - legOffset;
        let lFootY = this.height/2;

        ctx.beginPath();
        ctx.moveTo(0, pelvisY);
        ctx.lineTo(lKneeX, lKneeY);
        ctx.lineTo(lFootX, lFootY);
        ctx.stroke();

        let rKneeX = 12 + legOffset * 0.5;
        let rKneeY = pelvisY + 14;
        let rFootX = 15 + legOffset;
        let rFootY = this.height/2;

        ctx.beginPath();
        ctx.moveTo(0, pelvisY);
        ctx.lineTo(rKneeX, rKneeY);
        ctx.lineTo(rFootX, rFootY);
        ctx.stroke();

        ctx.fillStyle = this.id === 1 ? '#ff0055' : '#007aff';
        ctx.fillRect(lFootX - 10, lFootY - 14, 18, 14);
        ctx.fillRect(rFootX - 8, rFootY - 14, 18, 14);

        const shoulderY = neckY + 8;
        const handX = this.facing * 26;
        const handY = shoulderY + (this.isAttacking ? -6 : 12);

        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(-this.facing * 12, shoulderY + 12);
        ctx.lineTo(-this.facing * 20, shoulderY + 24);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(this.facing * 14, shoulderY + (this.isAttacking ? -9 : 6));
        ctx.lineTo(handX, handY);
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 12;

        if (this.charKey === 'swordsman' || this.charKey === 'berserker' || this.charKey === 'reaper' || this.charKey === 'rogue' || this.charKey === 'brawler' || this.charKey === 'vampire') {
            ctx.strokeStyle = this.id === 1 ? '#00e5ff' : '#ff9500';
            if (this.charKey === 'berserker') ctx.strokeStyle = '#ff3b30';
            if (this.charKey === 'reaper') ctx.strokeStyle = '#34c759';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(handX, handY);
            let swordAngle = this.isAttacking ? (this.facing === 1 ? Math.PI/4 : 3*Math.PI/4) : (this.facing === 1 ? -Math.PI/4 : -3*Math.PI/4);
            ctx.lineTo(handX + Math.cos(swordAngle) * 50, handY + Math.sin(swordAngle) * 50);
            ctx.stroke();
        } else if (this.charKey === 'lancer' || this.charKey === 'paladin') {
            ctx.strokeStyle = '#5ac8fa';
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.moveTo(handX - this.facing * 18, handY + 18);
            ctx.lineTo(handX + this.facing * 58, handY - 18);
            ctx.stroke();
        } else if (this.charKey === 'mage' || this.charKey === 'necromancer' || this.charKey === 'alchemist') {
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(handX, handY + 14);
            ctx.lineTo(handX + this.facing * 24, handY - 28);
            ctx.stroke();
            ctx.fillStyle = charColor;
            ctx.beginPath();
            ctx.arc(handX + this.facing * 24, handY - 28, 10, 0, Math.PI*2);
            ctx.fill();
        } else if (this.charKey === 'archer') {
            ctx.strokeStyle = '#4cd964';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(handX + this.facing * 12, handY, 26, -Math.PI/2, Math.PI/2);
            ctx.stroke();
        } else if (this.charKey === 'gunner') {
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(handX, handY - 6, 26 * this.facing, 12);
        } else if (this.charKey === 'ninja') {
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-this.facing * 14, headY);
            ctx.lineTo(-this.facing * 34, headY + 12);
            ctx.stroke();
        }

        ctx.restore();

        if (this.isShielded) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, headY + 20, 48, 0, Math.PI*2);
            ctx.stroke();
        }

        ctx.restore();

        if (this.isInvisible) {
            ctx.restore();
        }
    }
}

// --- COLLISION RESOLUTION ---
function checkMeleeHit(attacker, defender, damage) {
    if (attacker.attackBox.x < defender.x + defender.width &&
        attacker.attackBox.x + attacker.attackBox.w > defender.x &&
        attacker.attackBox.y < defender.y + defender.height &&
        attacker.attackBox.y + attacker.attackBox.h > defender.y) {
        
        defender.takeDamage(damage);
        return true;
    }
    return false;
}

function createHitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function createExplosion(x, y, radius, color) {
    screenShake = 18;
    createHitParticles(x, y, color, 35);
    particles.push({
        x: x,
        y: y,
        r: 15,
        maxR: radius,
        color: color,
        alpha: 0.7,
        update: function() {
            this.r += 12;
            this.alpha -= 0.035;
        },
        draw: function(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 35;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },
        life: 35
    });
}

function triggerCooldownUI(playerId, skillType, cdMs) {
    const overlay = document.getElementById(`p${playerId}-cd-${skillType}`);
    if (!overlay) return;
    
    overlay.style.height = '100%';
    let start = Date.now();
    let interval = setInterval(() => {
        let elapsed = Date.now() - start;
        let pct = 100 - (elapsed / cdMs) * 100;
        if (pct <= 0) {
            overlay.style.height = '0%';
            clearInterval(interval);
        } else {
            overlay.style.height = `${pct}%`;
        }
    }, 30);
}

// --- GAME INITIALIZATION & MAP SELECTION ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let player1 = null;
let player2 = null;
let activeMap = MAPS.flat;

function initGame() {
    const activeMapCard = document.querySelector('.map-card.active');
    if (activeMapCard) {
        selectedMapKey = activeMapCard.dataset.map;
    }
    
    const p1Key = document.querySelector('#p1-char-grid .char-card.active').dataset.char;
    const p2Key = document.querySelector('#p2-char-grid .char-card.active').dataset.char;
    
    activeMap = MAPS[selectedMapKey] || MAPS.flat;
    
    player1 = new Player(1, activeMap.spawnP1.x, activeMap.spawnP1.y, p1Key);
    player2 = new Player(2, activeMap.spawnP2.x, activeMap.spawnP2.y, p2Key);
    
    projectiles = [];
    particles = [];
    sparks = [];
    comboTexts = [];
    
    gameTimer = 99;
    document.getElementById('timer').textContent = gameTimer;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (currentGameState === STATE.PLAYING) {
            gameTimer--;
            document.getElementById('timer').textContent = gameTimer;
            if (gameTimer <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    currentGameState = STATE.GAME_OVER;
    
    let winText = "TIME UP! DRAW";
    if (player1.hp > player2.hp) {
        winText = "PLAYER 1 WINS! (K.O.)";
    } else if (player2.hp > player1.hp) {
        winText = "PLAYER 2 WINS! (K.O.)";
    } else if (player1.hp === 0 && player2.hp > 0) {
        winText = "PLAYER 2 WINS! (K.O.)";
    } else if (player2.hp === 0 && player1.hp > 0) {
        winText = "PLAYER 1 WINS! (K.O.)";
    }
    
    document.getElementById('winner-text').textContent = winText;
    showScreen('game-over-screen');
}

// Korean IME & Multi-Key Mapping
const KOREAN_KEYS = {
    'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㅈ': 'w',
    'ㅁ': 'A', 'ㄴ': 'S', 'ㅇ': 'D', 'ㅈ': 'W',
    'ㄷ': 'e', 'ㄱ': 'r', 'ㄹ': 'f',
    'ㄷ': 'E', 'ㄱ': 'R', 'ㄹ': 'F',
    'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
    'ㅑ': 'I', 'ㅐ': 'O', 'ㅔ': 'P'
};

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;
    if (e.code) keys[e.code] = true;
    
    if (KOREAN_KEYS[e.key]) {
        keys[KOREAN_KEYS[e.key]] = true;
        keys[KOREAN_KEYS[e.key].toLowerCase()] = true;
    }
    
    if (e.key.toLowerCase() === 'escape') {
        if (currentGameState === STATE.PLAYING) {
            currentGameState = STATE.PAUSED;
            showScreen('pause-screen');
        } else if (currentGameState === STATE.PAUSED) {
            currentGameState = STATE.PLAYING;
            hideAllScreens();
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
    if (e.code) keys[e.code] = false;
    
    if (KOREAN_KEYS[e.key]) {
        keys[KOREAN_KEYS[e.key]] = false;
        keys[KOREAN_KEYS[e.key].toLowerCase()] = false;
    }
});

function handleInputs() {
    if (!player1 || !player2) return;
    
    // --- PLAYER 1 INPUTS (WASD + E/R/F) ---
    player1.vx = 0;
    if (keys['a'] || keys['A'] || keys['KeyA'] || keys['ㅁ']) {
        player1.vx = -player1.config.speed;
        player1.facing = -1;
    }
    if (keys['d'] || keys['D'] || keys['KeyD'] || keys['ㅇ']) {
        player1.vx = player1.config.speed;
        player1.facing = 1;
    }
    if (keys['w'] || keys['W'] || keys['KeyW'] || keys['ㅈ']) {
        player1.jump();
        keys['w'] = false; keys['W'] = false; keys['KeyW'] = false; keys['ㅈ'] = false;
    }
    if (keys['e'] || keys['E'] || keys['KeyE'] || keys['ㄷ']) {
        player1.useBasicAttack(player2);
    }
    if (keys['r'] || keys['R'] || keys['KeyR'] || keys['ㄱ']) {
        player1.useSpecialSkill(player2);
    }
    if (keys['f'] || keys['F'] || keys['KeyF'] || keys['ㄹ']) {
        player1.useUltimate(player2);
    }

    // --- PLAYER 2 INPUTS (Arrows + I/O/P) ---
    player2.vx = 0;
    if (keys['ArrowLeft']) {
        player2.vx = -player2.config.speed;
        player2.facing = -1;
    }
    if (keys['ArrowRight']) {
        player2.vx = player2.config.speed;
        player2.facing = 1;
    }
    if (keys['ArrowUp']) {
        player2.jump();
        keys['ArrowUp'] = false;
    }
    if (keys['i'] || keys['I'] || keys['KeyI'] || keys['ㅑ']) {
        player2.useBasicAttack(player1);
    }
    if (keys['o'] || keys['O'] || keys['KeyO'] || keys['ㅐ']) {
        player2.useSpecialSkill(player1);
    }
    if (keys['p'] || keys['P'] || keys['KeyP'] || keys['ㅔ']) {
        player2.useUltimate(player1);
    }
}

// --- CANVAS RENDERING ENGINE ---
function gameLoop() {
    if (currentGameState === STATE.PLAYING) {
        if (hitStopTimer > 0) {
            hitStopTimer--;
        } else {
            handleInputs();
            player1.update(activeMap.platforms, activeMap);
            player2.update(activeMap.platforms, activeMap);

            for (let i = projectiles.length - 1; i >= 0; i--) {
                let p = projectiles[i];
                p.update();
                
                let collided = false;
                for (let plat of activeMap.platforms) {
                    if (p.x > plat.x && p.x < plat.x + plat.w && p.y > plat.y && p.y < plat.y + plat.h) {
                        collided = true;
                        break;
                    }
                }

                let targetPlayer = p.owner === 1 ? player2 : player1;
                let attackerPlayer = p.owner === 1 ? player1 : player2;
                let distToTarget = Math.hypot(p.x - (targetPlayer.x + targetPlayer.width/2), p.y - (targetPlayer.y + targetPlayer.height/2));
                
                if (distToTarget < targetPlayer.height/2 + p.size) {
                    targetPlayer.takeDamage(p.damage);
                    
                    attackerPlayer.registerHitOnOpponent(targetPlayer, p.skillCategory || 'basic');
                    collided = true;
                    
                    if (p.type === 'bomb') {
                        createExplosion(p.x, p.y, 120, p.color);
                    }
                    
                    if (p.type === 'absorb') {
                        let ownerPlayer = p.owner === 1 ? player1 : player2;
                        ownerPlayer.hp = Math.min(ownerPlayer.maxHp, ownerPlayer.hp + Math.round(p.damage * 0.7));
                    }
                }

                if (collided || p.life <= 0) {
                    projectiles.splice(i, 1);
                }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                let part = particles[i];
                part.update();
                if (part.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            for (let i = sparks.length - 1; i >= 0; i--) {
                let sp = sparks[i];
                sp.update();
                if (sp.life <= 0) sparks.splice(i, 1);
            }

            for (let i = comboTexts.length - 1; i >= 0; i--) {
                let ct = comboTexts[i];
                ct.update();
                if (ct.life <= 0) comboTexts.splice(i, 1);
            }

            if (player1.hp <= 0 || player2.hp <= 0) {
                endGame();
            }
        }

        ctx.save();
        
        if (screenShake > 0) {
            let dx = (Math.random() - 0.5) * screenShake;
            let dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake *= 0.88;
            if (screenShake < 0.5) screenShake = 0;
        }

        ctx.fillStyle = activeMap.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.strokeStyle = activeMap.gridColor;
        ctx.lineWidth = 1.5;
        for(let i=0; i<CANVAS_WIDTH; i+=60) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, CANVAS_HEIGHT);
            ctx.stroke();
        }

        for (let plat of activeMap.platforms) {
            ctx.save();
            ctx.fillStyle = plat.fill;
            ctx.shadowColor = plat.border;
            ctx.shadowBlur = 20;
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            
            ctx.strokeStyle = plat.border;
            ctx.lineWidth = 4.5;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
            ctx.restore();
        }

        player1.draw(ctx);
        player2.draw(ctx);

        for (let p of projectiles) {
            p.draw(ctx);
        }

        for (let part of particles) {
            part.draw(ctx);
        }

        for (let sp of sparks) {
            sp.draw(ctx);
        }

        for (let ct of comboTexts) {
            ct.draw(ctx);
        }

        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// --- SCREEN SWITCHER & MAP SELECTION UTILS ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.remove('active');
    });
}

document.getElementById('start-btn').addEventListener('click', () => {
    showScreen('character-select');
    currentGameState = STATE.CHAR_SELECT;
});

document.getElementById('how-to-btn').addEventListener('click', () => {
    showScreen('how-to-screen');
    currentGameState = STATE.HOW_TO;
});

document.getElementById('close-how-btn').addEventListener('click', () => {
    showScreen('menu-screen');
    currentGameState = STATE.MENU;
});

document.getElementById('confirm-char-btn').addEventListener('click', () => {
    showScreen('map-select');
    currentGameState = STATE.MAP_SELECT;
});

document.getElementById('start-game-btn').addEventListener('click', () => {
    initGame();
    hideAllScreens();
    currentGameState = STATE.PLAYING;
    startBgm();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    initGame();
    hideAllScreens();
    currentGameState = STATE.PLAYING;
});

document.getElementById('resume-btn').addEventListener('click', () => {
    currentGameState = STATE.PLAYING;
    hideAllScreens();
});

document.getElementById('quit-btn').addEventListener('click', () => {
    showScreen('menu-screen');
    currentGameState = STATE.MENU;
});

function setupGridSelect(gridId) {
    const grid = document.getElementById(gridId);
    grid.addEventListener('click', e => {
        const card = e.target.closest('.char-card');
        if (!card) return;
        
        grid.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
}

setupGridSelect('p1-char-grid');
setupGridSelect('p2-char-grid');

// 2 MAP SELECTION EVENT LISTENER (With SELECT button sync)
const mapRowTwo = document.querySelector('.map-horizontal-row-two');
if (mapRowTwo) {
    mapRowTwo.addEventListener('click', e => {
        const card = e.target.closest('.map-card');
        if (!card) return;
        
        mapRowTwo.querySelectorAll('.map-card').forEach(c => {
            c.classList.remove('active');
            const btn = c.querySelector('.select-map-btn');
            if (btn) btn.textContent = 'SELECT';
        });
        
        card.classList.add('active');
        const activeBtn = card.querySelector('.select-map-btn');
        if (activeBtn) activeBtn.textContent = 'SELECTED';
        
        selectedMapKey = card.dataset.map;
    });
}
