// Bounce Attack - Premium Edition
// Game Logic and Engine

// --- 1. GAME CONSTANTS & STATE ---
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

// --- 2. SOUND CONTROL ---
const bgm = document.getElementById('bgm');
const bgmToggle = document.getElementById('bgm-toggle');
let bgmPlaying = false;

bgmToggle.addEventListener('click', () => {
    if (bgmPlaying) {
        bgm.pause();
        bgmToggle.textContent = '🔇';
    } else {
        bgm.play().catch(e => console.log("Audio play blocked by browser. Needs user interaction first."));
        bgmToggle.textContent = '🔊';
    }
    bgmPlaying = !bgmPlaying;
});

function playBgm() {
    if (bgmPlaying) {
        bgm.play().catch(e => console.log("BGM Play failed:", e));
    }
}

// --- 3. CHARACTER CONFIGURATIONS ---
// 모든 캐릭터의 이동 속도(speed)와 점프력(jumpForce)은 밸런스 패치에 따라 0.5배 축소 적용됨.
// 기본 속도 기준치: 속도 6 -> 3.0, 점프력 16 -> 8.0, 중력 0.4
const CHARACTER_PRESETS = {
    swordsman: {
        name: 'SWORDSMAN',
        icon: '⚔️',
        color: '#ff3b30',
        maxHp: 120,
        speed: 6.5 * 0.5, // 3.25
        jumpForce: 15.5 * 0.5, // 7.75
        basicDamage: 12,
        specialDamage: 22,
        ultDamage: 40,
        basicCd: 400,
        specialCd: 1200,
        ultCd: 4000
    },
    mage: {
        name: 'MAGE',
        icon: '🔥',
        color: '#ff9500',
        maxHp: 90,
        speed: 5.0 * 0.5, // 2.5
        jumpForce: 15.0 * 0.5, // 7.5
        basicDamage: 10,
        specialDamage: 25,
        ultDamage: 45,
        basicCd: 600,
        specialCd: 1500,
        ultCd: 5000
    },
    archer: {
        name: 'ARCHER',
        icon: '🏹',
        color: '#4cd964',
        maxHp: 95,
        speed: 6.0 * 0.5, // 3.0
        jumpForce: 16.0 * 0.5, // 8.0
        basicDamage: 8,
        specialDamage: 18,
        ultDamage: 38,
        basicCd: 500,
        specialCd: 1300,
        ultCd: 4500
    },
    rogue: {
        name: 'ROGUE',
        icon: '🗡️',
        color: '#5856d6',
        maxHp: 90,
        speed: 8.0 * 0.5, // 4.0
        jumpForce: 17.5 * 0.5, // 8.75
        basicDamage: 11,
        specialDamage: 20,
        ultDamage: 35,
        basicCd: 300,
        specialCd: 1000,
        ultCd: 3500
    },
    lancer: {
        name: 'LANCER',
        icon: '🔱',
        color: '#5ac8fa',
        maxHp: 110,
        speed: 6.0 * 0.5, // 3.0
        jumpForce: 15.0 * 0.5, // 7.5
        basicDamage: 13,
        specialDamage: 21,
        ultDamage: 38,
        basicCd: 500,
        specialCd: 1400,
        ultCd: 4000
    },
    berserker: {
        name: 'BERSERKER',
        icon: '🪓',
        color: '#ff2d55',
        maxHp: 140,
        speed: 5.5 * 0.5, // 2.75
        jumpForce: 14.5 * 0.5, // 7.25
        basicDamage: 15,
        specialDamage: 26,
        ultDamage: 48,
        basicCd: 700,
        specialCd: 1800,
        ultCd: 5000
    },
    gunner: {
        name: 'GUNNER',
        icon: '🔫',
        color: '#ffcc00',
        maxHp: 85,
        speed: 5.5 * 0.5, // 2.75
        jumpForce: 14.0 * 0.5, // 7.0
        basicDamage: 7,
        specialDamage: 16,
        ultDamage: 35,
        basicCd: 250,
        specialCd: 1100,
        ultCd: 4000
    },
    ninja: {
        name: 'NINJA',
        icon: '🥷',
        color: '#8e8e93',
        maxHp: 90,
        speed: 7.5 * 0.5, // 3.75
        jumpForce: 16.5 * 0.5, // 8.25
        basicDamage: 9,
        specialDamage: 18,
        ultDamage: 36,
        basicCd: 350,
        specialCd: 900,
        ultCd: 3800
    },
    brawler: {
        name: 'BRAWLER',
        icon: '🥊',
        color: '#af52de',
        maxHp: 115,
        speed: 6.5 * 0.5, // 3.25
        jumpForce: 15.0 * 0.5, // 7.5
        basicDamage: 12,
        specialDamage: 22,
        ultDamage: 40,
        basicCd: 400,
        specialCd: 1200,
        ultCd: 4200
    },
    necromancer: {
        name: 'NECROMANCER',
        icon: '💀',
        color: '#a800ff',
        maxHp: 95,
        speed: 4.8 * 0.5, // 2.4
        jumpForce: 14.5 * 0.5, // 7.25
        basicDamage: 9,
        specialDamage: 20,
        ultDamage: 40,
        basicCd: 650,
        specialCd: 1600,
        ultCd: 4800
    },
    paladin: {
        name: 'PALADIN',
        icon: '🛡️',
        color: '#007aff',
        maxHp: 150,
        speed: 4.5 * 0.5, // 2.25
        jumpForce: 14.0 * 0.5, // 7.0
        basicDamage: 10,
        specialDamage: 18,
        ultDamage: 32,
        basicCd: 600,
        specialCd: 2000,
        ultCd: 5000
    },
    reaper: {
        name: 'REAPER',
        icon: '🌑',
        color: '#1d1d26',
        maxHp: 105,
        speed: 5.5 * 0.5, // 2.75
        jumpForce: 15.0 * 0.5, // 7.5
        basicDamage: 14,
        specialDamage: 24,
        ultDamage: 42,
        basicCd: 600,
        specialCd: 1400,
        ultCd: 4500
    },
    vampire: {
        name: 'VAMPIRE',
        icon: '🧛',
        color: '#ff2a6d',
        maxHp: 100,
        speed: 6.0 * 0.5, // 3.0
        jumpForce: 15.5 * 0.5, // 7.75
        basicDamage: 10,
        specialDamage: 20,
        ultDamage: 37,
        basicCd: 500,
        specialCd: 1300,
        ultCd: 4300
    },
    alchemist: {
        name: 'ALCHEMIST',
        icon: '🧪',
        color: '#05d9e8',
        maxHp: 95,
        speed: 5.0 * 0.5, // 2.5
        jumpForce: 14.8 * 0.5, // 7.4
        basicDamage: 8,
        specialDamage: 22,
        ultDamage: 36,
        basicCd: 550,
        specialCd: 1500,
        ultCd: 4500
    }
};

// --- 4. MAP CONFIGURATIONS ---
const MAPS = {
    cyber: {
        background: '#040209',
        platforms: [
            { x: 0, y: 530, w: 1024, h: 46 }, // Ground
            { x: 150, y: 400, w: 220, h: 15 },
            { x: 654, y: 400, w: 220, h: 15 },
            { x: 387, y: 280, w: 250, h: 15 }
        ],
        spawnP1: { x: 100, y: 450 },
        spawnP2: { x: 924, y: 450 }
    },
    sky: {
        background: '#0d1b2a',
        platforms: [
            { x: 162, y: 480, w: 700, h: 30 }, // Narrower Ground (Pitfalls on sides)
            { x: 262, y: 350, w: 200, h: 15 },
            { x: 562, y: 350, w: 200, h: 15 },
            { x: 412, y: 220, w: 200, h: 15 }
        ],
        spawnP1: { x: 250, y: 400 },
        spawnP2: { x: 774, y: 400 }
    },
    temple: {
        background: '#1b1b22',
        platforms: [
            { x: 0, y: 530, w: 1024, h: 46 }, // Ground
            { x: 80, y: 410, w: 180, h: 20 },
            { x: 764, y: 410, w: 180, h: 20 },
            { x: 312, y: 300, w: 400, h: 20 }
        ],
        spawnP1: { x: 100, y: 450 },
        spawnP2: { x: 924, y: 450 }
    }
};

// --- 5. PARTICLE SYSTEM & PROJECTILE CLASSES ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8 - 2;
        this.gravity = 0.2;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.015;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
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
        this.size = size;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner; // 1 or 2
        this.type = type; // 'normal', 'homing', 'bomb', 'absorb'
        this.target = trackingTarget;
        this.life = 120; // Max frames
    }

    update() {
        this.life--;
        if (this.type === 'homing' && this.target) {
            let tx = this.target.x;
            let ty = this.target.y - this.target.height/2;
            let angle = Math.atan2(ty - this.y, tx - this.x);
            this.dx = Math.cos(angle);
            this.dy = Math.sin(angle);
        }
        
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- 6. PLAYER CLASS & CORE PHYSICS ENGINE (A) ---
class Player {
    constructor(id, x, y, charKey) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.charKey = charKey;
        this.config = CHARACTER_PRESETS[charKey];
        
        this.width = 36;
        this.height = 54;
        
        // Dynamic stats
        this.hp = this.config.maxHp;
        this.maxHp = this.config.maxHp;
        this.ultGauge = 0;
        
        // Movement physics
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = id === 1 ? 1 : -1; // 1 = right, -1 = left
        this.doubleJumpUsed = false;
        
        // Cooldowns (timestamps)
        this.cdBasicLast = 0;
        this.cdSpecialLast = 0;
        this.cdUltLast = 0;
        
        // State
        this.isShielded = false; // Paladin shield
        this.shieldDuration = 0;
        this.isInvisible = false; // Rogue stealth
        this.stealthDuration = 0;
        this.berserkMode = false; // Berserker fury
        this.berserkDuration = 0;
        
        // Attack Box (melee)
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackBox = { x: 0, y: 0, w: 0, h: 0 };
    }

    update(platforms) {
        const now = Date.now();
        
        // Handle custom states durations
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
        
        // Apply Gravity
        const gravity = 0.35;
        this.vy += gravity;
        
        // Move horizontally
        this.x += this.vx;
        
        // Map wall collision (Horizontal)
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        } else if (this.x + this.width > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.vx = 0;
        }
        
        // Move vertically
        this.y += this.vy;
        this.isGrounded = false;

        // Platform collisions (AABB)
        for (let plat of platforms) {
            if (this.x + this.width > plat.x && 
                this.x < plat.x + plat.w) {
                // Check landing on platform
                if (this.vy > 0 && 
                    this.y + this.height - this.vy <= plat.y + 4 && 
                    this.y + this.height >= plat.y) {
                    this.y = plat.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.doubleJumpUsed = false;
                }
            }
        }
        
        // Melee attack box update
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }
        
        // Update Ult UI bar and HP bar
        this.updateUI();
    }

    jump() {
        if (this.isGrounded) {
            this.vy = -this.config.jumpForce;
            this.isGrounded = false;
        } else if (this.charKey === 'ninja' && !this.doubleJumpUsed) {
            // Ninja double jump feature
            this.vy = -this.config.jumpForce * 0.9;
            this.doubleJumpUsed = true;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#fff', 6);
        }
    }

    takeDamage(dmg) {
        if (this.isShielded) {
            // Paladin shield block
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#00ffff', 12);
            return;
        }
        
        // Rogue stealth ends upon taking damage
        if (this.isInvisible) {
            this.isInvisible = false;
        }
        
        // Berserker passive: lower HP increases damage output
        let multiplier = 1;
        if (this.charKey === 'berserker') {
            multiplier = 1.3; // takes slightly more damage too
        }

        this.hp -= Math.round(dmg * multiplier);
        if (this.hp < 0) this.hp = 0;
        
        // Build Ultimate meter upon taking damage
        this.gainUlt(dmg * 0.5);
        
        // Visual effects
        screenShake = 6;
        createHitParticles(this.x + this.width/2, this.y + this.height/2, this.config.color, 10);
    }

    gainUlt(amount) {
        this.ultGauge = Math.min(100, this.ultGauge + amount);
    }

    useBasicAttack(opponent) {
        const now = Date.now();
        let cd = this.config.basicCd;
        if (this.berserkMode) cd *= 0.5; // Berserk attack rate
        
        if (now - this.cdBasicLast < cd) return;
        this.cdBasicLast = now;
        
        this.isAttacking = true;
        this.attackTimer = 10; // Frames of active hitbox
        
        // Define hitbox based on character class
        if (this.charKey === 'swordsman' || this.charKey === 'berserker' || this.charKey === 'brawler') {
            // standard melee
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 45,
                y: this.y + 10,
                w: 45,
                h: this.height - 20
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'lancer') {
            // long reach melee
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 70,
                y: this.y + 20,
                w: 70,
                h: 15
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'mage') {
            // basic projectile fireball
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#ff5500', 6, 8, this.config.basicDamage, this.id));
        } else if (this.charKey === 'archer') {
            // fast arrow projectile
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 22, this.facing, 0, '#4cd964', 3, 12, this.config.basicDamage, this.id));
        } else if (this.charKey === 'gunner') {
            // bullet
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#ffcc00', 4, 15, this.config.basicDamage, this.id));
        } else if (this.charKey === 'ninja') {
            // shuriken
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#8e8e93', 5, 10, this.config.basicDamage, this.id));
        } else if (this.charKey === 'necromancer') {
            // ghost flame
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#a800ff', 6, 6, this.config.basicDamage, this.id));
        } else if (this.charKey === 'paladin') {
            // small shield bash melee
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 30,
                y: this.y + 5,
                w: 30,
                h: this.height - 10
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'reaper') {
            // scythe sweep melee
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 55,
                y: this.y,
                w: 55,
                h: this.height
            };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'vampire') {
            // melee claw
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 40,
                y: this.y + 10,
                w: 40,
                h: this.height - 20
            };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) {
                // lifesteal
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.basicDamage * 0.3));
            }
        } else if (this.charKey === 'alchemist') {
            // acid toss
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, -0.2, '#05d9e8', 5, 7, this.config.basicDamage, this.id));
        } else if (this.charKey === 'rogue') {
            // quick backstab melee
            this.attackBox = {
                x: this.facing === 1 ? this.x + this.width : this.x - 35,
                y: this.y + 15,
                w: 35,
                h: this.height - 30
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

        // Custom implementations for each Character
        if (this.charKey === 'swordsman') {
            // Dash attack
            this.vx = this.facing * 12;
            this.isAttacking = true;
            this.attackTimer = 15;
            this.attackBox = { x: this.x - 10, y: this.y, w: this.width + 20, h: this.height };
            checkMeleeHit(this, opponent, this.config.specialDamage);
        } 
        else if (this.charKey === 'mage') {
            // Explosive Flame Burst (Area attack around player)
            createExplosion(this.x + this.width/2, this.y + this.height/2, 100, '#ff5500');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 110) {
                opponent.takeDamage(this.config.specialDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 8;
            }
        } 
        else if (this.charKey === 'archer') {
            // Multishot
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, -0.2, '#4cd964', 3, 10, this.config.specialDamage * 0.5, this.id));
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#4cd964', 3, 10, this.config.specialDamage * 0.5, this.id));
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0.2, '#4cd964', 3, 10, this.config.specialDamage * 0.5, this.id));
        } 
        else if (this.charKey === 'rogue') {
            // Stealth mode: Invisible and invincible for 2 seconds
            this.isInvisible = true;
            this.stealthDuration = 120; // 120 frames = 2s
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#5856d6', 15);
        } 
        else if (this.charKey === 'lancer') {
            // Vault jump (high mobility)
            this.vy = -this.config.jumpForce * 1.5;
            this.vx = this.facing * 5;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#5ac8fa', 10);
        } 
        else if (this.charKey === 'berserker') {
            // Outrage: gain double speed and basic attack rate for 3 seconds
            this.berserkMode = true;
            this.berserkDuration = 180;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 20);
        } 
        else if (this.charKey === 'gunner') {
            // Grenade launcher (deals explosive AOE damage)
            let pX = this.facing === 1 ? this.x + this.width + 5 : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 10, this.facing, -0.3, '#ffcc00', 8, 8, this.config.specialDamage, this.id, 'bomb'));
        } 
        else if (this.charKey === 'ninja') {
            // Teleport behind enemy and slash
            let oldX = this.x;
            this.x = opponent.x - opponent.facing * 50;
            this.facing = opponent.facing;
            createHitParticles(oldX + this.width/2, this.y + this.height/2, '#8e8e93', 10);
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff0055', 10);
            opponent.takeDamage(this.config.specialDamage);
        } 
        else if (this.charKey === 'brawler') {
            // Uppercut (Launches enemy)
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 30, y: this.y - 20, w: 40, h: this.height + 20 };
            if (checkMeleeHit(this, opponent, this.config.specialDamage)) {
                opponent.vy = -12;
                opponent.vx = this.facing * 3;
            }
        } 
        else if (this.charKey === 'necromancer') {
            // Summon Homing Ghost Spark
            let pX = this.facing === 1 ? this.x + this.width : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 10, this.facing, 0, '#a800ff', 7, 5, this.config.specialDamage, this.id, 'homing', opponent));
        } 
        else if (this.charKey === 'paladin') {
            // Holy Shield barrier (Absorbs damage for 2.5s)
            this.isShielded = true;
            this.shieldDuration = 150;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#007aff', 15);
        } 
        else if (this.charKey === 'reaper') {
            // Life Drain Ray
            let pX = this.facing === 1 ? this.x + this.width : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, 0, '#1d1d26', 10, 6, this.config.specialDamage, this.id, 'absorb', opponent));
        } 
        else if (this.charKey === 'vampire') {
            // Vampire Bat dash
            this.vx = this.facing * 14;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2a6d', 12);
            if (Math.abs(this.x - opponent.x) < 80 && Math.abs(this.y - opponent.y) < 50) {
                opponent.takeDamage(this.config.specialDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.specialDamage * 0.5)); // Heal 50%
            }
        } 
        else if (this.charKey === 'alchemist') {
            // Toxic Brew (leaves poison pool on floor)
            let pX = this.facing === 1 ? this.x + this.width : this.x - 10;
            projectiles.push(new Projectile(pX, this.y, this.facing, -0.4, '#05d9e8', 6, 7, this.config.specialDamage, this.id, 'poison'));
        }

        this.gainUlt(15);
        triggerCooldownUI(this.id, 'special', this.config.specialCd);
    }

    useUltimate(opponent) {
        if (this.ultGauge < 100) return;
        this.ultGauge = 0;
        
        screenShake = 15;

        // Custom Ultimates
        if (this.charKey === 'swordsman') {
            // Omnislash
            for(let i=0; i<6; i++) {
                setTimeout(() => {
                    this.x = opponent.x + (Math.random() - 0.5) * 80;
                    this.y = opponent.y - 10;
                    opponent.takeDamage(this.config.ultDamage / 6);
                    createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, this.config.color, 12);
                }, i * 150);
            }
        } 
        else if (this.charKey === 'mage') {
            // Apocalypse Meteor
            let pX = opponent.x;
            projectiles.push(new Projectile(pX, 0, 0, 1, '#ff3b30', 25, 6, this.config.ultDamage, this.id, 'bomb'));
        } 
        else if (this.charKey === 'archer') {
            // Arrow Storm (multiple high speed arrows)
            for(let i=0; i<8; i++) {
                setTimeout(() => {
                    let pX = this.facing === 1 ? this.x + this.width : this.x - 10;
                    projectiles.push(new Projectile(pX, this.y + 10 + (Math.random()-0.5)*30, this.facing, (Math.random()-0.5)*0.3, '#4cd964', 3, 16, this.config.ultDamage / 8, this.id));
                }, i * 80);
            }
        } 
        else if (this.charKey === 'rogue') {
            // Execution Shadow Strike (Instant massive dash pierce)
            this.vx = this.facing * 25;
            this.y = opponent.y;
            setTimeout(() => {
                let dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
                if (dist < 150) {
                    opponent.takeDamage(this.config.ultDamage);
                    createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#5856d6', 30);
                }
            }, 100);
        } 
        else if (this.charKey === 'lancer') {
            // Dragon Spike (Jump high and crash down)
            this.vy = -18;
            setTimeout(() => {
                this.vy = 22;
                let checkLand = setInterval(() => {
                    if (this.isGrounded || this.y >= 500) {
                        clearInterval(checkLand);
                        createExplosion(this.x + this.width/2, this.y + this.height, 130, '#5ac8fa');
                        let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height) - (opponent.y + opponent.height));
                        if (dist < 150) {
                            opponent.takeDamage(this.config.ultDamage);
                            opponent.vy = -10;
                        }
                    }
                }, 1000/60);
            }, 350);
        } 
        else if (this.charKey === 'berserker') {
            // Rupture Shockwave
            createExplosion(this.x + this.width/2, this.y + this.height, 120, '#ff2d55');
            let dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
            if (dist < 200) {
                opponent.takeDamage(this.config.ultDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 15;
                opponent.vy = -6;
            }
        } 
        else if (this.charKey === 'gunner') {
            // Full Burst Laser Ray (Continuous direct damage beam)
            let beamX = this.facing === 1 ? this.x + this.width : 0;
            let beamW = this.facing === 1 ? CANVAS_WIDTH - beamX : this.x;
            
            // Draw visual beam
            projectiles.push({
                x: beamX + beamW/2,
                y: this.y + 20,
                draw: function(ctx) {
                    ctx.save();
                    ctx.fillStyle = '#ffcc00';
                    ctx.shadowColor = '#ffcc00';
                    ctx.shadowBlur = 20;
                    ctx.fillRect(this.facing === 1 ? beamX : 0, this.y - 10, beamW, 20);
                    ctx.restore();
                },
                update: function() {},
                life: 20,
                owner: this.id
            });

            // Check hit
            if (opponent.y + opponent.height > this.y + 10 && opponent.y < this.y + 30) {
                if ((this.facing === 1 && opponent.x > this.x) || (this.facing === -1 && opponent.x < this.x)) {
                    opponent.takeDamage(this.config.ultDamage);
                    opponent.vx = this.facing * 10;
                }
            }
        } 
        else if (this.charKey === 'ninja') {
            // Shadow Clone Storm (Spawns 수리검 from all directions)
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    let rx = Math.random() * CANVAS_WIDTH;
                    let angle = Math.atan2(opponent.y - 50, rx - opponent.x);
                    projectiles.push(new Projectile(rx, 50, -Math.cos(angle), -Math.sin(angle), '#8e8e93', 5, 12, this.config.ultDamage / 12, this.id));
                }, i * 80);
            }
        } 
        else if (this.charKey === 'brawler') {
            // Fist Storm Combo
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.vx = this.facing * 6;
                    this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 50, y: this.y, w: 50, h: this.height };
                    checkMeleeHit(this, opponent, this.config.ultDamage / 5);
                }, i * 120);
            }
        } 
        else if (this.charKey === 'necromancer') {
            // Death Summon: Spawns 3 tracking skulls
            for(let i = 0; i < 3; i++) {
                setTimeout(() => {
                    projectiles.push(new Projectile(this.x + this.width/2, this.y, this.facing, -0.5 + (i*0.5), '#a800ff', 10, 5, this.config.ultDamage/3, this.id, 'homing', opponent));
                }, i * 200);
            }
        } 
        else if (this.charKey === 'paladin') {
            // Divine Judgement (Sacred pillar of light)
            createExplosion(opponent.x + opponent.width/2, opponent.y + opponent.height/2, 80, '#007aff');
            opponent.takeDamage(this.config.ultDamage);
            opponent.vy = 10; // Smite down
        } 
        else if (this.charKey === 'reaper') {
            // Grim Reaper scythe sweep (deals massive dmg if opponent under 40% HP)
            let baseDmg = this.config.ultDamage;
            if (opponent.hp / opponent.maxHp < 0.4) {
                baseDmg *= 1.8; // Execution damage bonus!
                createHitParticles(opponent.x + opponent.width/2, opponent.y + opponent.height/2, '#ff0055', 30);
            }
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 80, y: this.y - 10, w: 80, h: this.height + 20 };
            checkMeleeHit(this, opponent, baseDmg);
        } 
        else if (this.charKey === 'vampire') {
            // Blood Thirst Area absorption
            createExplosion(this.x + this.width/2, this.y + this.height/2, 160, '#ff2a6d');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 170) {
                opponent.takeDamage(this.config.ultDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.ultDamage * 0.7)); // huge heal
            }
        } 
        else if (this.charKey === 'alchemist') {
            // Philosopher's Bomb: Large toxic gas cloud
            let pX = this.facing === 1 ? this.x + this.width : this.x - 10;
            projectiles.push(new Projectile(pX, this.y + 10, this.facing, -0.2, '#05d9e8', 15, 6, this.config.ultDamage, this.id, 'bomb'));
        }

        triggerCooldownUI(this.id, 'ult', this.config.ultCd);
    }

    updateUI() {
        const hpPct = Math.max(0, (this.hp / this.maxHp) * 100);
        document.getElementById(`p${this.id}-hp`).style.width = `${hpPct}%`;
        document.getElementById(`p${this.id}-hp-label`).textContent = `${Math.round(hpPct)}%`;
        document.getElementById(`p${this.id}-ult`).style.width = `${this.ultGauge}%`;
    }

    draw(ctx) {
        if (this.isInvisible) {
            ctx.save();
            ctx.globalAlpha = 0.25; // Translucent
        }

        // Draw Player body
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw Eyes/Face to indicate facing direction
        ctx.fillStyle = '#fff';
        let eyeOffset = this.facing === 1 ? 24 : 6;
        ctx.fillRect(this.x + eyeOffset, this.y + 12, 6, 6);
        ctx.fillStyle = '#000';
        let pupOffset = this.facing === 1 ? 26 : 6;
        ctx.fillRect(this.x + pupOffset, this.y + 12, 4, 6);
        
        // Shield aura visual
        if (this.isShielded) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.height/2 + 5, 0, Math.PI*2);
            ctx.stroke();
        }

        // Berserk aura visual
        if (this.berserkMode) {
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.height/2 + 3, 0, Math.PI*2);
            ctx.stroke();
        }

        // Draw Melee Attack Range Box (during attack for debugging/visual effect)
        if (this.isAttacking && (this.charKey === 'swordsman' || this.charKey === 'berserker' || this.charKey === 'brawler' || this.charKey === 'lancer' || this.charKey === 'paladin' || this.charKey === 'reaper' || this.charKey === 'vampire' || this.charKey === 'rogue')) {
            ctx.fillStyle = `rgba(${parseInt(this.config.color.slice(1,3), 16) || 255}, 0, 0, 0.3)`;
            ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.w, this.attackBox.h);
        }

        if (this.isInvisible) {
            ctx.restore();
        }
    }
}

// --- 7. COLLISION & COMBAT RESOLUTIONS ---
function checkMeleeHit(attacker, defender, damage) {
    if (attacker.attackBox.x < defender.x + defender.width &&
        attacker.attackBox.x + attacker.attackBox.w > defender.x &&
        attacker.attackBox.y < defender.y + defender.height &&
        attacker.attackBox.y + attacker.attackBox.h > defender.y) {
        
        defender.takeDamage(damage);
        defender.vx = attacker.facing * 4; // knockback
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
    screenShake = 8;
    createHitParticles(x, y, color, 20);
    // Visual explosion animation
    particles.push({
        x: x,
        y: y,
        r: 10,
        maxR: radius,
        color: color,
        alpha: 0.6,
        update: function() {
            this.r += 6;
            this.alpha -= 0.04;
        },
        draw: function(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },
        life: 25
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

// --- 8. GAME INITIALIZATION & RUNTIME LOOP ---
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

    // Skill Slot icons initialization
    setupSkillIcons(1, player1.config);
    setupSkillIcons(2, player2.config);

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

function setupSkillIcons(pId, config) {
    // Basic icon remains sword or default
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

// Keyboard Listeners (AABB Simultaneous Button Press fix)
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    
    // Pause trigger
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
});

// Process player inputs
function handleInputs() {
    if (!player1 || !player2) return;
    
    // --- PLAYER 1 INPUTS (WASD + E/R/F) ---
    // Horizontal Movement
    player1.vx = 0;
    if (keys['a'] || keys['A']) {
        player1.vx = -player1.config.speed;
        player1.facing = -1;
    }
    if (keys['d'] || keys['D']) {
        player1.vx = player1.config.speed;
        player1.facing = 1;
    }
    // Jump
    if (keys['w'] || keys['W']) {
        player1.jump();
        keys['w'] = false; // Prevent auto repeated jumping
        keys['W'] = false;
    }
    // Attacks
    if (keys['e'] || keys['E']) {
        player1.useBasicAttack(player2);
    }
    if (keys['r'] || keys['R']) {
        player1.useSpecialSkill(player2);
    }
    if (keys['f'] || keys['F']) {
        player1.useUltimate(player2);
    }

    // --- PLAYER 2 INPUTS (Arrows + Enter/P/Shift) ---
    // Horizontal Movement
    player2.vx = 0;
    if (keys['ArrowLeft']) {
        player2.vx = -player2.config.speed;
        player2.facing = -1;
    }
    if (keys['ArrowRight']) {
        player2.vx = player2.config.speed;
        player2.facing = 1;
    }
    // Jump
    if (keys['ArrowUp']) {
        player2.jump();
        keys['ArrowUp'] = false;
    }
    // Attacks
    if (keys['Enter']) {
        player2.useBasicAttack(player1);
    }
    if (keys['p'] || keys['P']) {
        player2.useSpecialSkill(player1);
    }
    if (keys['Shift']) {
        player2.useUltimate(player1);
    }
}

// --- 9. CANVAS RENDERING ENGINE (A & C) ---
function gameLoop() {
    if (currentGameState === STATE.PLAYING) {
        // Handle physical movements and controls
        handleInputs();
        
        // Update Players
        player1.update(activeMap.platforms);
        player2.update(activeMap.platforms);

        // Sky Map boundary check (pitfall hazard)
        if (activeMap === MAPS.sky) {
            if (player1.y > CANVAS_HEIGHT) player1.takeDamage(999);
            if (player2.y > CANVAS_HEIGHT) player2.takeDamage(999);
        }

        // Update Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            p.update();
            
            // Check collision with maps platforms (normal bounds)
            let collided = false;
            for (let plat of activeMap.platforms) {
                if (p.x > plat.x && p.x < plat.x + plat.w && p.y > plat.y && p.y < plat.y + plat.h) {
                    collided = true;
                    break;
                }
            }

            // Check hit with opponents
            let targetPlayer = p.owner === 1 ? player2 : player1;
            let distToTarget = Math.hypot(p.x - (targetPlayer.x + targetPlayer.width/2), p.y - (targetPlayer.y + targetPlayer.height/2));
            
            if (distToTarget < targetPlayer.height/2 + p.size) {
                // Collision Hit
                targetPlayer.takeDamage(p.damage);
                collided = true;
                
                // Exploding type bomb projectile
                if (p.type === 'bomb') {
                    createExplosion(p.x, p.y, 60, p.color);
                }
                
                // Vampire healing projectile
                if (p.type === 'absorb') {
                    let ownerPlayer = p.owner === 1 ? player1 : player2;
                    ownerPlayer.hp = Math.min(ownerPlayer.maxHp, ownerPlayer.hp + Math.round(p.damage * 0.6));
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
            if (part.alpha <= 0 || part.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // Check Health termination conditions
        if (player1.hp <= 0 || player2.hp <= 0) {
            endGame();
        }

        // Clear & Draw everything on Canvas
        ctx.save();
        
        // Handle screen shaking visual effect
        if (screenShake > 0) {
            let dx = (Math.random() - 0.5) * screenShake;
            let dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake *= 0.9;
            if (screenShake < 0.5) screenShake = 0;
        }

        // Background
        ctx.fillStyle = activeMap.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Cyber neon lines grids effect (Design Aesthetics)
        if (activeMap === MAPS.cyber) {
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
            ctx.lineWidth = 1;
            for(let i=0; i<CANVAS_WIDTH; i+=40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, CANVAS_HEIGHT);
                ctx.stroke();
            }
        }

        // Platforms
        for (let plat of activeMap.platforms) {
            ctx.fillStyle = activeMap === MAPS.cyber ? '#0c0b1a' : (activeMap === MAPS.sky ? '#1d3557' : '#3d3a45');
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            
            // Neon neon border line
            ctx.strokeStyle = activeMap === MAPS.cyber ? '#00ffcc' : (activeMap === MAPS.sky ? '#4cd964' : '#ffcc00');
            ctx.lineWidth = 2;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        }

        // Render Entities
        player1.draw(ctx);
        player2.draw(ctx);

        // Render Projectiles
        for (let p of projectiles) {
            p.draw(ctx);
        }

        // Render Particles
        for (let part of particles) {
            part.draw(ctx);
        }

        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

// Start Game Loop immediately
requestAnimationFrame(gameLoop);

// --- 10. SCREEN SWITCHER UTILS ---
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

// UI Select Events Configuration
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

// Setup grid selectors
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

// Map Select Configuration
const mapGrid = document.querySelector('.map-grid');
mapGrid.addEventListener('click', e => {
    const card = e.target.closest('.map-card');
    if (!card) return;
    
    mapGrid.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
});
