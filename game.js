// Bounce Attack - Stickman Edition
// Game Logic and Engine

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

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
let screenShake = 0;
let gameTimer = 99;
let timerInterval = null;

// --- SOUND CONTROL ---
const bgm = document.getElementById('bgm');
const bgmToggle = document.getElementById('bgm-toggle');
let bgmPlaying = false;

if (bgmToggle) {
    bgmToggle.addEventListener('click', () => {
        if (bgmPlaying) {
            bgm.pause();
            bgmToggle.textContent = 'Mute';
        } else {
            bgm.play().catch(e => console.log("Audio play blocked."));
            bgmToggle.textContent = 'Sound On';
        }
        bgmPlaying = !bgmPlaying;
    });
}

function playBgm() {
    if (bgmPlaying && bgm) {
        bgm.play().catch(e => console.log("BGM Play failed:", e));
    }
}

// --- CHARACTER CONFIGURATIONS ---
// 스틱맨 대전에 최적화된 고대비 핫 칼라셋
const CHARACTER_PRESETS = {
    swordsman: {
        name: 'SWORDSMAN',
        icon: 'SW',
        color: '#ff9500', // Bright Orange
        maxHp: 120,
        speed: 6.5 * 1.125,
        jumpForce: 15.5 * 0.975,
        basicDamage: 12,
        specialDamage: 22,
        ultDamage: 45,
        basicCd: 400,
        specialCd: 1200,
        ultCd: 4000
    },
    mage: {
        name: 'MAGE',
        icon: 'MG',
        color: '#ff2d55', // Neon Pink / Red
        maxHp: 90,
        speed: 5.0 * 1.125,
        jumpForce: 15.0 * 0.975,
        basicDamage: 10,
        specialDamage: 26,
        ultDamage: 50,
        basicCd: 500,
        specialCd: 1400,
        ultCd: 4800
    },
    archer: {
        name: 'ARCHER',
        icon: 'AR',
        color: '#4cd964', // Neon Green
        maxHp: 95,
        speed: 6.0 * 1.125,
        jumpForce: 16.0 * 0.975,
        basicDamage: 8,
        specialDamage: 18,
        ultDamage: 40,
        basicCd: 450,
        specialCd: 1200,
        ultCd: 4200
    },
    rogue: {
        name: 'ROGUE',
        icon: 'RG',
        color: '#bf5af2', // Electric Purple
        maxHp: 90,
        speed: 8.0 * 1.125,
        jumpForce: 17.5 * 0.975,
        basicDamage: 11,
        specialDamage: 20,
        ultDamage: 38,
        basicCd: 300,
        specialCd: 1000,
        ultCd: 3500
    },
    lancer: {
        name: 'LANCER',
        icon: 'LC',
        color: '#5ac8fa', // Sky Blue
        maxHp: 110,
        speed: 6.0 * 1.125,
        jumpForce: 15.0 * 0.975,
        basicDamage: 13,
        specialDamage: 22,
        ultDamage: 42,
        basicCd: 500,
        specialCd: 1300,
        ultCd: 4000
    },
    berserker: {
        name: 'BERSERKER',
        icon: 'BS',
        color: '#ff3b30', // Crimson
        maxHp: 140,
        speed: 5.5 * 1.125,
        jumpForce: 14.5 * 0.975,
        basicDamage: 15,
        specialDamage: 28,
        ultDamage: 52,
        basicCd: 650,
        specialCd: 1600,
        ultCd: 4800
    },
    gunner: {
        name: 'GUNNER',
        icon: 'GN',
        color: '#ffcc00', // Yellow
        maxHp: 85,
        speed: 5.5 * 1.125,
        jumpForce: 14.0 * 0.975,
        basicDamage: 7,
        specialDamage: 17,
        ultDamage: 38,
        basicCd: 220,
        specialCd: 1000,
        ultCd: 3800
    },
    ninja: {
        name: 'NINJA',
        icon: 'NJ',
        color: '#00e5ff', // Cyan
        maxHp: 90,
        speed: 7.5 * 1.125,
        jumpForce: 16.5 * 0.975,
        basicDamage: 9,
        specialDamage: 19,
        ultDamage: 38,
        basicCd: 320,
        specialCd: 850,
        ultCd: 3600
    },
    brawler: {
        name: 'BRAWLER',
        icon: 'BR',
        color: '#e040fb', // Hot Pink
        maxHp: 115,
        speed: 6.5 * 1.125,
        jumpForce: 15.0 * 0.975,
        basicDamage: 12,
        specialDamage: 22,
        ultDamage: 42,
        basicCd: 380,
        specialCd: 1100,
        ultCd: 4000
    },
    necromancer: {
        name: 'NECROMANCER',
        icon: 'NC',
        color: '#8e8e93', // Dark Slate
        maxHp: 95,
        speed: 4.8 * 1.125,
        jumpForce: 14.5 * 0.975,
        basicDamage: 9,
        specialDamage: 22,
        ultDamage: 45,
        basicCd: 600,
        specialCd: 1500,
        ultCd: 4800
    },
    paladin: {
        name: 'PALADIN',
        icon: 'PL',
        color: '#0a84ff', // Deep Blue
        maxHp: 150,
        speed: 4.5 * 1.125,
        jumpForce: 14.0 * 0.975,
        basicDamage: 10,
        specialDamage: 18,
        ultDamage: 35,
        basicCd: 550,
        specialCd: 1800,
        ultCd: 4800
    },
    reaper: {
        name: 'REAPER',
        icon: 'RP',
        color: '#34c759', // Lime Green
        maxHp: 105,
        speed: 5.5 * 1.125,
        jumpForce: 15.0 * 0.975,
        basicDamage: 14,
        specialDamage: 25,
        ultDamage: 45,
        basicCd: 550,
        specialCd: 1300,
        ultCd: 4200
    },
    vampire: {
        name: 'VAMPIRE',
        icon: 'VP',
        color: '#ff2d55', // Deep Blood Red
        maxHp: 100,
        speed: 6.0 * 1.125,
        jumpForce: 15.5 * 0.975,
        basicDamage: 10,
        specialDamage: 21,
        ultDamage: 40,
        basicCd: 450,
        specialCd: 1200,
        ultCd: 4000
    },
    alchemist: {
        name: 'ALCHEMIST',
        icon: 'AL',
        color: '#30d158', // Mint
        maxHp: 95,
        speed: 5.0 * 1.125,
        jumpForce: 14.8 * 0.975,
        basicDamage: 8,
        specialDamage: 23,
        ultDamage: 38,
        basicCd: 500,
        specialCd: 1400,
        ultCd: 4200
    }
};

// --- MAP CONFIGURATIONS ---
const MAPS = {
    cyber: {
        background: '#0a0a10',
        gridColor: 'rgba(0, 255, 204, 0.1)',
        platforms: [
            { x: 0, y: 530, w: 1024, h: 46, border: '#00ffcc', fill: '#101420' },
            { x: 150, y: 390, w: 220, h: 18, border: '#ff0055', fill: '#201018' },
            { x: 654, y: 390, w: 220, h: 18, border: '#ff0055', fill: '#201018' },
            { x: 387, y: 260, w: 250, h: 18, border: '#00ffcc', fill: '#101420' }
        ],
        spawnP1: { x: 100, y: 440 },
        spawnP2: { x: 924, y: 440 }
    },
    sky: {
        background: '#08121e',
        gridColor: 'rgba(255, 255, 255, 0.05)',
        platforms: [
            { x: 162, y: 480, w: 700, h: 30, border: '#00e5ff', fill: '#0f2438' },
            { x: 262, y: 340, w: 200, h: 18, border: '#4cd964', fill: '#102e1c' },
            { x: 562, y: 340, w: 200, h: 18, border: '#4cd964', fill: '#102e1c' },
            { x: 412, y: 200, w: 200, h: 18, border: '#ffcc00', fill: '#332a10' }
        ],
        spawnP1: { x: 250, y: 380 },
        spawnP2: { x: 774, y: 380 }
    },
    temple: {
        background: '#0e0e14',
        gridColor: 'rgba(255, 204, 0, 0.08)',
        platforms: [
            { x: 0, y: 530, w: 1024, h: 46, border: '#ffaa00', fill: '#221b10' },
            { x: 80, y: 400, w: 180, h: 22, border: '#007aff', fill: '#0c1a2e' },
            { x: 764, y: 400, w: 180, h: 22, border: '#007aff', fill: '#0c1a2e' },
            { x: 312, y: 280, w: 400, h: 22, border: '#ffffff', fill: '#22222d' }
        ],
        spawnP1: { x: 100, y: 440 },
        spawnP2: { x: 924, y: 440 }
    }
};

// --- PARTICLE & PROJECTILE SYSTEM ---
class Particle {
    constructor(x, y, color, speedScale = 1.0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 3;
        this.speedX = (Math.random() - 0.5) * 12 * speedScale;
        this.speedY = (Math.random() - 0.5) * 12 * speedScale - 2;
        this.gravity = 0.25;
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
    constructor(x, y, dx, dy, color, size, speed, damage, owner, type = 'normal', trackingTarget = null) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.size = size * 1.5;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner; 
        this.type = type; 
        this.target = trackingTarget;
        this.life = 150; 
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
            particles.push(new Particle(this.x, this.y, this.color, 0.3));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
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

// --- PLAYER CLASS (Stickman Graphics Architecture) ---
class Player {
    constructor(id, x, y, charKey) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.charKey = charKey;
        this.config = CHARACTER_PRESETS[charKey];
        
        this.width = 36;
        this.height = 56;
        
        this.hp = this.config.maxHp;
        this.maxHp = this.config.maxHp;
        this.ultGauge = 0;
        
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = id === 1 ? 1 : -1;
        this.doubleJumpUsed = false;
        
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

    update(platforms) {
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
        
        const gravity = 0.676;
        this.vy += gravity;
        this.x += this.vx;
        
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        } else if (this.x + this.width > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.vx = 0;
        }
        
        this.y += this.vy;
        this.isGrounded = false;

        for (let plat of platforms) {
            if (this.x + this.width > plat.x && 
                this.x < plat.x + plat.w) {
                if (this.vy > 0 && 
                    this.y + this.height - this.vy <= plat.y + 10 && 
                    this.y + this.height >= plat.y) {
                    this.y = plat.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.doubleJumpUsed = false;
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
        if (this.isGrounded) {
            this.vy = -this.config.jumpForce;
            this.isGrounded = false;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#ffffff', 8);
        } else if (this.charKey === 'ninja' && !this.doubleJumpUsed) {
            this.vy = -this.config.jumpForce * 0.9;
            this.doubleJumpUsed = true;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#00ffff', 10);
        }
    }

    takeDamage(dmg) {
        if (this.isShielded) {
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#00e5ff', 15);
            return;
        }
        
        if (this.isInvisible) {
            this.isInvisible = false;
        }

        let dmgTaken = Math.round(dmg * (this.charKey === 'berserker' ? 1.25 : 1.0));
        this.hp = Math.max(0, this.hp - dmgTaken);
        
        this.gainUlt(dmgTaken * 0.6);
        screenShake = 12;
        createHitParticles(this.x + this.width/2, this.y + this.height/2, this.config.color, 18);
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
        this.attackTimer = 12;
        
        if (this.charKey === 'swordsman' || this.charKey === 'berserker' || this.charKey === 'brawler') {
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 55,
                y: this.y + 6,
                w: 55,
                h: this.height - 12
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'lancer') {
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 85,
                y: this.y + 18,
                w: 85,
                h: 18
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'mage') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 22, this.facing, 0, '#ff5500', 8, 9, this.config.basicDamage, this.id));
        } else if (this.charKey === 'archer') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 22, this.facing, 0, '#4cd964', 4, 14, this.config.basicDamage, this.id));
        } else if (this.charKey === 'gunner') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#ffcc00', 5, 18, this.config.basicDamage, this.id));
        } else if (this.charKey === 'ninja') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#8e8e93', 6, 12, this.config.basicDamage, this.id));
        } else if (this.charKey === 'necromancer') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#bf5af2', 7, 7, this.config.basicDamage, this.id));
        } else if (this.charKey === 'paladin') {
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 40,
                y: this.y + 4,
                w: 40,
                h: this.height - 8
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'reaper') {
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 65,
                y: this.y,
                w: 65,
                h: this.height
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'vampire') {
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 50,
                y: this.y + 8,
                w: 50,
                h: this.height - 16
            };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) {
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.basicDamage * 0.35));
            }
        } else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, -0.15, '#30d158', 6, 8, this.config.basicDamage, this.id));
        } else if (this.charKey === 'rogue') {
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 45,
                y: this.y + 12,
                w: 45,
                h: this.height - 24
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        }
        
        this.gainUlt(8);
        triggerCooldownUI(this.id, 'basic', cd);
    }

    useSpecialSkill(opponent) {
        const now = Date.now();
        if (now - this.cdSpecialLast < this.config.specialCd) return;
        this.cdSpecialLast = now;

        if (this.charKey === 'swordsman') {
            this.vx = this.facing * 14;
            this.isAttacking = true;
            this.attackTimer = 15;
            this.attackBox = { x: this.x - 15, y: this.y, w: this.width + 30, h: this.height };
            checkMeleeHit(this, opponent, this.config.specialDamage);
        } 
        else if (this.charKey === 'mage') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 130, '#ff9500');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 140) {
                opponent.takeDamage(this.config.specialDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 9;
            }
        } 
        else if (this.charKey === 'archer') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, -0.22, '#4cd964', 4, 11, this.config.specialDamage * 0.5, this.id));
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#4cd964', 4, 11, this.config.specialDamage * 0.5, this.id));
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0.22, '#4cd964', 4, 11, this.config.specialDamage * 0.5, this.id));
        } 
        else if (this.charKey === 'rogue') {
            this.isInvisible = true;
            this.stealthDuration = 150; 
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#af52de', 25);
        } 
        else if (this.charKey === 'lancer') {
            this.vy = -this.config.jumpForce * 1.4;
            this.vx = this.facing * 6;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#5ac8fa', 15);
        } 
        else if (this.charKey === 'berserker') {
            this.berserkMode = true;
            this.berserkDuration = 200;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff3b30', 30);
        } 
        else if (this.charKey === 'gunner') {
            let pX = this.facing === 1 ? this.x + this.width + 10 : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 10, this.facing, -0.25, '#ffcc00', 10, 9, this.config.specialDamage, this.id, 'bomb'));
        } 
        else if (this.charKey === 'ninja') {
            let oldX = this.x;
            this.x = opponent.x - opponent.facing * 60;
            this.facing = opponent.facing;
            createHitParticles(oldX + this.width/2, this.y + this.height/2, '#8e8e93', 15);
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 15);
            opponent.takeDamage(this.config.specialDamage);
        } 
        else if (this.charKey === 'brawler') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 40, y: this.y - 25, w: 50, h: this.height + 25 };
            if (checkMeleeHit(this, opponent, this.config.specialDamage)) {
                opponent.vy = -13;
                opponent.vx = this.facing * 4;
            }
        } 
        else if (this.charKey === 'necromancer') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 10, this.facing, 0, '#bf5af2', 9, 6, this.config.specialDamage, this.id, 'homing', opponent));
        } 
        else if (this.charKey === 'paladin') {
            this.isShielded = true;
            this.shieldDuration = 180;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#0a84ff', 25);
        } 
        else if (this.charKey === 'reaper') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#3a3a4c', 12, 7, this.config.specialDamage, this.id, 'absorb', opponent));
        } 
        else if (this.charKey === 'vampire') {
            this.vx = this.facing * 16;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 20);
            if (Math.abs(this.x - opponent.x) < 95 && Math.abs(this.y - opponent.y) < 60) {
                opponent.takeDamage(this.config.specialDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.specialDamage * 0.55));
            }
        } 
        else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 15;
            projectiles.push(new Projectile(pX, this.y, this.facing, -0.35, '#30d158', 8, 8, this.config.specialDamage, this.id, 'bomb'));
        }

        this.gainUlt(16);
        triggerCooldownUI(this.id, 'special', this.config.specialCd);
    }

    useUltimate(opponent) {
        if (this.ultGauge < 100) return;
        this.ultGauge = 0;
        
        screenShake = 22;

        if (this.charKey === 'swordsman') {
            for(let i=0; i<7; i++) {
                setTimeout(() => {
                    this.x = opponent.x + (Math.random() - 0.5) * 100;
                    this.y = opponent.y - 15;
                    opponent.takeDamage(this.config.ultDamage / 7);
                    createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#ff2d55', 15);
                }, i * 140);
            }
        } 
        else if (this.charKey === 'mage') {
            let pX = opponent.x;
            projectiles.push(new Projectile(pX, 0, 0, 1, '#ff3b30', 32, 7, this.config.ultDamage, this.id, 'bomb'));
        } 
        else if (this.charKey === 'archer') {
            for(let i=0; i<10; i++) {
                setTimeout(() => {
                    let pX = this.facing === 1 ? this.x + this.width : this.x - 15;
                    projectiles.push(new Projectile(pX, this.y + 10 + (Math.random()-0.5)*40, this.facing, (Math.random()-0.5)*0.25, '#4cd964', 4, 18, this.config.ultDamage / 10, this.id));
                }, i * 70);
            }
        } 
        else if (this.charKey === 'rogue') {
            this.vx = this.facing * 28;
            this.y = opponent.y;
            setTimeout(() => {
                let dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
                if (dist < 180) {
                    opponent.takeDamage(this.config.ultDamage);
                    createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#af52de', 35);
                }
            }, 90);
        } 
        else if (this.charKey === 'lancer') {
            this.vy = -20;
            setTimeout(() => {
                this.vy = 24;
                let checkLand = setInterval(() => {
                    if (this.isGrounded || this.y >= 490) {
                        clearInterval(checkLand);
                        createExplosion(this.x + this.width/2, this.y + this.height, 160, '#5ac8fa');
                        let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height) - (opponent.y + opponent.height));
                        if (dist < 180) {
                            opponent.takeDamage(this.config.ultDamage);
                            opponent.vy = -12;
                        }
                    }
                }, 1000/60);
            }, 300);
        } 
        else if (this.charKey === 'berserker') {
            createExplosion(this.x + this.width/2, this.y + this.height, 140, '#ff3b30');
            let dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
            if (dist < 220) {
                opponent.takeDamage(this.config.ultDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 18;
                opponent.vy = -7;
            }
        } 
        else if (this.charKey === 'gunner') {
            let beamX = this.facing === 1 ? this.x + this.width : 0;
            let beamW = this.facing === 1 ? CANVAS_WIDTH - beamX : this.x;
            
            projectiles.push({
                x: beamX + beamW/2,
                y: this.y + 20,
                draw: function(ctx) {
                    ctx.save();
                    ctx.fillStyle = '#ffcc00';
                    ctx.shadowColor = '#ffcc00';
                    ctx.shadowBlur = 30; 
                    ctx.fillRect(this.facing === 1 ? beamX : 0, this.y - 15, beamW, 30);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(this.facing === 1 ? beamX : 0, this.y - 5, beamW, 10);
                    ctx.restore();
                },
                update: function() {},
                life: 25,
                owner: this.id
            });

            if (opponent.y + opponent.height > this.y + 5 && opponent.y < this.y + 35) {
                if ((this.facing === 1 && opponent.x > this.x) || (this.facing === -1 && opponent.x < this.x)) {
                    opponent.takeDamage(this.config.ultDamage);
                    opponent.vx = this.facing * 12;
                }
            }
        } 
        else if (this.charKey === 'ninja') {
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    let rx = Math.random() * CANVAS_WIDTH;
                    let angle = Math.atan2(opponent.y - 50, rx - opponent.x);
                    projectiles.push(new Projectile(rx, 50, -Math.cos(angle), -Math.sin(angle), '#8e8e93', 6, 14, this.config.ultDamage / 15, this.id));
                }, i * 70);
            }
        } 
        else if (this.charKey === 'brawler') {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    this.vx = this.facing * 7;
                    this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 60, y: this.y, w: 60, h: this.height };
                    checkMeleeHit(this, opponent, this.config.ultDamage / 6);
                }, i * 100);
            }
        } 
        else if (this.charKey === 'necromancer') {
            for(let i = 0; i < 4; i++) {
                setTimeout(() => {
                    projectiles.push(new Projectile(this.x + this.width/2, this.y, this.facing, -0.6 + (i*0.4), '#bf5af2', 12, 6, this.config.ultDamage/4, this.id, 'homing', opponent));
                }, i * 160);
            }
        } 
        else if (this.charKey === 'paladin') {
            createExplosion(opponent.x + opponent.width/2, opponent.y + opponent.height/2, 100, '#0a84ff');
            opponent.takeDamage(this.config.ultDamage);
            opponent.vy = 12;
        } 
        else if (this.charKey === 'reaper') {
            let baseDmg = this.config.ultDamage;
            if (opponent.hp / opponent.maxHp < 0.4) {
                baseDmg *= 2.0; 
                createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#ff0055', 40);
            }
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 90, y: this.y - 15, w: 90, h: this.height + 30 };
            checkMeleeHit(this, opponent, baseDmg);
        } 
        else if (this.charKey === 'vampire') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 180, '#ff2d55');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 190) {
                opponent.takeDamage(this.config.ultDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.ultDamage * 0.75));
            }
        } 
        else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 15;
            projectiles.push(new Projectile(pX, this.y + 10, this.facing, -0.18, '#30d158', 18, 7, this.config.ultDamage, this.id, 'bomb'));
        }

        triggerCooldownUI(this.id, 'ult', this.config.ultCd);
    }

    updateUI() {
        const hpPct = Math.max(0, (this.hp / this.maxHp) * 100);
        document.getElementById(`p${this.id}-hp`).style.width = `${hpPct}%`;
        document.getElementById(`p${this.id}-hp-label`).textContent = `${Math.round(hpPct)}%`;
        document.getElementById(`p${this.id}-ult`).style.width = `${this.ultGauge}%`;
    }

    // --- PURE FLAT STICKMAN DRAWING ENGINE ---
    draw(ctx) {
        if (this.isInvisible) {
            ctx.save();
            ctx.globalAlpha = 0.22;
        }

        ctx.save();
        const pX = this.x;
        const pY = this.y;
        const w = this.width;
        const h = this.height;
        const centerX = pX + w / 2;

        const charColor = this.config.color;
        
        ctx.strokeStyle = charColor;
        ctx.fillStyle = charColor;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. 머리 (선명한 커다란 원)
        const headRadius = 14;
        const headY = pY + headRadius + 2;
        ctx.beginPath();
        ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. 몸통 (척추)
        const neckY = headY + headRadius;
        const pelvisY = pY + h - 18;
        ctx.beginPath();
        ctx.moveTo(centerX, neckY);
        ctx.lineTo(centerX, pelvisY);
        ctx.stroke();

        // 3. 다리 (이동/점프 모션)
        let legOffset = Math.sin(Date.now() * 0.018) * (Math.abs(this.vx) > 0.1 ? 12 : 2);
        if (!this.isGrounded) legOffset = 10;

        // 왼다리
        ctx.beginPath();
        ctx.moveTo(centerX, pelvisY);
        ctx.lineTo(centerX - 8 - legOffset * 0.5, pelvisY + 10);
        ctx.lineTo(centerX - 10 - legOffset, pY + h);
        ctx.stroke();

        // 오른다리
        ctx.beginPath();
        ctx.moveTo(centerX, pelvisY);
        ctx.lineTo(centerX + 8 + legOffset * 0.5, pelvisY + 10);
        ctx.lineTo(centerX + 10 + legOffset, pY + h);
        ctx.stroke();

        // 4. 팔 및 무기
        const shoulderY = neckY + 6;
        const handX = centerX + this.facing * 18;
        const handY = shoulderY + (this.isAttacking ? -4 : 8);

        // 뒷팔
        ctx.beginPath();
        ctx.moveTo(centerX, shoulderY);
        ctx.lineTo(centerX - this.facing * 8, shoulderY + 8);
        ctx.lineTo(centerX - this.facing * 14, shoulderY + 16);
        ctx.stroke();

        // 앞팔
        ctx.beginPath();
        ctx.moveTo(centerX, shoulderY);
        ctx.lineTo(centerX + this.facing * 10, shoulderY + (this.isAttacking ? -6 : 4));
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // 5. 대전 스틱맨 특유의 두껍고 명확한 플랫 무기 스타일 (이미지 100% 동일)
        ctx.save();
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 8;

        if (this.charKey === 'swordsman' || this.charKey === 'berserker' || this.charKey === 'reaper' || this.charKey === 'rogue' || this.charKey === 'brawler' || this.charKey === 'vampire') {
            // 이미지 속 선명하고 두꺼운 단색 양손 칼
            ctx.strokeStyle = this.id === 1 ? '#00e5ff' : '#ff9500'; // 고대비 칼라 무기
            if (this.charKey === 'berserker') ctx.strokeStyle = '#ff3b30';
            if (this.charKey === 'reaper') ctx.strokeStyle = '#34c759';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(handX, handY);
            let swordAngle = this.isAttacking ? (this.facing === 1 ? Math.PI/4 : 3*Math.PI/4) : (this.facing === 1 ? -Math.PI/4 : -3*Math.PI/4);
            ctx.lineTo(handX + Math.cos(swordAngle) * 34, handY + Math.sin(swordAngle) * 34);
            ctx.stroke();
        } else if (this.charKey === 'lancer' || this.charKey === 'paladin') {
            ctx.strokeStyle = '#5ac8fa';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(handX - this.facing * 12, handY + 12);
            ctx.lineTo(handX + this.facing * 40, handY - 12);
            ctx.stroke();
        } else if (this.charKey === 'mage' || this.charKey === 'necromancer' || this.charKey === 'alchemist') {
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(handX, handY + 10);
            ctx.lineTo(handX + this.facing * 16, handY - 20);
            ctx.stroke();
            ctx.fillStyle = charColor;
            ctx.beginPath();
            ctx.arc(handX + this.facing * 16, handY - 20, 7, 0, Math.PI*2);
            ctx.fill();
        } else if (this.charKey === 'archer') {
            ctx.strokeStyle = '#4cd964';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(handX + this.facing * 8, handY, 18, -Math.PI/2, Math.PI/2);
            ctx.stroke();
        } else if (this.charKey === 'gunner') {
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(handX, handY - 4, 18 * this.facing, 8);
        } else if (this.charKey === 'ninja') {
            // 머리 띠
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX - this.facing * 10, headY);
            ctx.lineTo(centerX - this.facing * 24, headY + 8);
            ctx.stroke();
        }

        ctx.restore();

        // 6. 특수 오라 효과
        if (this.isShielded) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, headY + 15, 34, 0, Math.PI*2);
            ctx.stroke();
        }

        if (this.isInvisible) {
            ctx.restore();
        }
        ctx.restore();
    }
}

// --- COLLISION RESOLUTION ---
function checkMeleeHit(attacker, defender, damage) {
    if (attacker.attackBox.x < defender.x + defender.width &&
        attacker.attackBox.x + attacker.attackBox.w > defender.x &&
        attacker.attackBox.y < defender.y + defender.height &&
        attacker.attackBox.y + attacker.attackBox.h > defender.y) {
        
        defender.takeDamage(damage);
        defender.vx = attacker.facing * 5.5; 
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
    screenShake = 12;
    createHitParticles(x, y, color, 25);
    particles.push({
        x: x,
        y: y,
        r: 10,
        maxR: radius,
        color: color,
        alpha: 0.7,
        update: function() {
            this.r += 8;
            this.alpha -= 0.035;
        },
        draw: function(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },
        life: 30
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

// --- GAME INITIALIZATION ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let player1 = null;
let player2 = null;
let activeMap = MAPS.cyber;

function initGame() {
    const p1Key = document.querySelector('#p1-char-grid .char-card.active').dataset.char;
    const p2Key = document.querySelector('#p2-char-grid .char-card.active').dataset.char;
    const mapKey = document.querySelector('.map-card.active').dataset.map;
    
    activeMap = MAPS[mapKey];
    
    player1 = new Player(1, activeMap.spawnP1.x, activeMap.spawnP1.y, p1Key);
    player2 = new Player(2, activeMap.spawnP2.x, activeMap.spawnP2.y, p2Key);
    
    projectiles = [];
    particles = [];
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
        winText = "PLAYER 1 WINS!";
    } else if (player2.hp > player1.hp) {
        winText = "PLAYER 2 WINS!";
    } else if (player1.hp === 0 && player2.hp > 0) {
        winText = "PLAYER 2 WINS!";
    } else if (player2.hp === 0 && player1.hp > 0) {
        winText = "PLAYER 1 WINS!";
    }
    
    document.getElementById('winner-text').textContent = winText;
    showScreen('game-over-screen');
}

// Korean IME Key Mapping
const KOREAN_KEYS = {
    'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㅈ': 'w',
    'ㅁ': 'A', 'ㄴ': 'S', 'ㅇ': 'D', 'ㅈ': 'W',
    'ㄷ': 'e', 'ㄱ': 'r', 'ㄹ': 'f',
    'ㄷ': 'E', 'ㄱ': 'R', 'ㄹ': 'F'
};

// Keyboard Listeners
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (KOREAN_KEYS[e.key]) {
        keys[KOREAN_KEYS[e.key]] = true;
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
    if (KOREAN_KEYS[e.key]) {
        keys[KOREAN_KEYS[e.key]] = false;
    }
});

// Process player inputs
function handleInputs() {
    if (!player1 || !player2) return;
    
    // --- PLAYER 1 INPUTS (WASD + E/R/F) ---
    player1.vx = 0;
    if (keys['a'] || keys['A']) {
        player1.vx = -player1.config.speed;
        player1.facing = -1;
    }
    if (keys['d'] || keys['D']) {
        player1.vx = player1.config.speed;
        player1.facing = 1;
    }
    if (keys['w'] || keys['W']) {
        player1.jump();
        keys['w'] = false; 
        keys['W'] = false;
    }
    if (keys['e'] || keys['E']) {
        player1.useBasicAttack(player2);
    }
    if (keys['r'] || keys['R']) {
        player1.useSpecialSkill(player2);
    }
    if (keys['f'] || keys['F']) {
        player1.useUltimate(player2);
    }

    // --- PLAYER 2 INPUTS (Arrows + . / Shift) ---
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
    // Basic Attack: .
    if (keys['.'] || keys['>']) {
        player2.useBasicAttack(player1);
    }
    // Special Skill: /
    if (keys['/'] || keys['?']) {
        player2.useSpecialSkill(player1);
    }
    // Ultimate: Shift
    if (keys['Shift'] || keys['shift']) {
        player2.useUltimate(player1);
    }
}

// --- CANVAS RENDERING ENGINE ---
function gameLoop() {
    if (currentGameState === STATE.PLAYING) {
        handleInputs();
        
        player1.update(activeMap.platforms);
        player2.update(activeMap.platforms);

        if (activeMap === MAPS.sky) {
            if (player1.y > CANVAS_HEIGHT) player1.takeDamage(999);
            if (player2.y > CANVAS_HEIGHT) player2.takeDamage(999);
        }

        // Update Projectiles
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
            let distToTarget = Math.hypot(p.x - (targetPlayer.x + targetPlayer.width/2), p.y - (targetPlayer.y + targetPlayer.height/2));
            
            if (distToTarget < targetPlayer.height/2 + p.size) {
                targetPlayer.takeDamage(p.damage);
                collided = true;
                
                if (p.type === 'bomb') {
                    createExplosion(p.x, p.y, 80, p.color);
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

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let part = particles[i];
            part.update();
            if (part.alpha <= 0) {
                particles.splice(i, 1);
            }
        }

        if (player1.hp <= 0 || player2.hp <= 0) {
            endGame();
        }

        // Clear & Draw
        ctx.save();
        
        if (screenShake > 0) {
            let dx = (Math.random() - 0.5) * screenShake;
            let dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake *= 0.88;
            if (screenShake < 0.5) screenShake = 0;
        }

        // Background
        ctx.fillStyle = activeMap.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Grid effect
        ctx.strokeStyle = activeMap.gridColor;
        ctx.lineWidth = 1;
        for(let i=0; i<CANVAS_WIDTH; i+=40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Platforms
        for (let plat of activeMap.platforms) {
            ctx.save();
            ctx.fillStyle = plat.fill;
            ctx.shadowColor = plat.border;
            ctx.shadowBlur = 15;
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            
            ctx.strokeStyle = plat.border;
            ctx.lineWidth = 3.5;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
            ctx.restore();
        }

        // Render Entities
        player1.draw(ctx);
        player2.draw(ctx);

        for (let p of projectiles) {
            p.draw(ctx);
        }

        for (let part of particles) {
            part.draw(ctx);
        }

        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// --- SCREEN SWITCHER UTILS ---
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
    playBgm();
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

const mapGrid = document.querySelector('.map-grid');
mapGrid.addEventListener('click', e => {
    const card = e.target.closest('.map-card');
    if (!card) return;
    
    mapGrid.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
});
