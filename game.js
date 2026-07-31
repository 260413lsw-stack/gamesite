// Bounce Attack - Ragdoll Stickman Edition
// Physics & 7 Arena Maps Engine

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
let soccerBalls = [];
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
const CHARACTER_PRESETS = {
    swordsman: { name: 'SWORDSMAN', icon: 'SW', color: '#ff9500', maxHp: 120, speed: 6.5 * 0.84375, jumpForce: 15.5 * 1.2675, basicDamage: 12, specialDamage: 22, ultDamage: 45, basicCd: 400, specialCd: 1200, ultCd: 4000 },
    mage: { name: 'MAGE', icon: 'MG', color: '#ff2d55', maxHp: 90, speed: 5.0 * 0.84375, jumpForce: 15.0 * 1.2675, basicDamage: 10, specialDamage: 26, ultDamage: 50, basicCd: 500, specialCd: 1400, ultCd: 4800 },
    archer: { name: 'ARCHER', icon: 'AR', color: '#4cd964', maxHp: 95, speed: 6.0 * 0.84375, jumpForce: 16.0 * 1.2675, basicDamage: 8, specialDamage: 18, ultDamage: 40, basicCd: 450, specialCd: 1200, ultCd: 4200 },
    rogue: { name: 'ROGUE', icon: 'RG', color: '#bf5af2', maxHp: 90, speed: 8.0 * 0.84375, jumpForce: 17.5 * 1.2675, basicDamage: 11, specialDamage: 20, ultDamage: 38, basicCd: 300, specialCd: 1000, ultCd: 3500 },
    lancer: { name: 'LANCER', icon: 'LC', color: '#5ac8fa', maxHp: 110, speed: 6.0 * 0.84375, jumpForce: 15.0 * 1.2675, basicDamage: 13, specialDamage: 22, ultDamage: 42, basicCd: 500, specialCd: 1300, ultCd: 4000 },
    berserker: { name: 'BERSERKER', icon: 'BS', color: '#ff3b30', maxHp: 140, speed: 5.5 * 0.84375, jumpForce: 14.5 * 1.2675, basicDamage: 15, specialDamage: 28, ultDamage: 52, basicCd: 650, specialCd: 1600, ultCd: 4800 },
    gunner: { name: 'GUNNER', icon: 'GN', color: '#ffcc00', maxHp: 85, speed: 5.5 * 0.84375, jumpForce: 14.0 * 1.2675, basicDamage: 7, specialDamage: 17, ultDamage: 38, basicCd: 220, specialCd: 1000, ultCd: 3800 },
    ninja: { name: 'NINJA', icon: 'NJ', color: '#00e5ff', maxHp: 90, speed: 7.5 * 0.84375, jumpForce: 16.5 * 1.2675, basicDamage: 9, specialDamage: 19, ultDamage: 38, basicCd: 320, specialCd: 850, ultCd: 3600 },
    brawler: { name: 'BRAWLER', icon: 'BR', color: '#e040fb', maxHp: 115, speed: 6.5 * 0.84375, jumpForce: 15.0 * 1.2675, basicDamage: 12, specialDamage: 22, ultDamage: 42, basicCd: 380, specialCd: 1100, ultCd: 4000 },
    necromancer: { name: 'NECROMANCER', icon: 'NC', color: '#8e8e93', maxHp: 95, speed: 4.8 * 0.84375, jumpForce: 14.5 * 1.2675, basicDamage: 9, specialDamage: 22, ultDamage: 45, basicCd: 600, specialCd: 1500, ultCd: 4800 },
    paladin: { name: 'PALADIN', icon: 'PL', color: '#0a84ff', maxHp: 150, speed: 4.5 * 0.84375, jumpForce: 14.0 * 1.2675, basicDamage: 10, specialDamage: 18, ultDamage: 35, basicCd: 550, specialCd: 1800, ultCd: 4800 },
    reaper: { name: 'REAPER', icon: 'RP', color: '#34c759', maxHp: 105, speed: 5.5 * 0.84375, jumpForce: 15.0 * 1.2675, basicDamage: 14, specialDamage: 25, ultDamage: 45, basicCd: 550, specialCd: 1300, ultCd: 4200 },
    vampire: { name: 'VAMPIRE', icon: 'VP', color: '#ff2d55', maxHp: 100, speed: 6.0 * 0.84375, jumpForce: 15.5 * 1.2675, basicDamage: 10, specialDamage: 21, ultDamage: 40, basicCd: 450, specialCd: 1200, ultCd: 4000 },
    alchemist: { name: 'ALCHEMIST', icon: 'AL', color: '#30d158', maxHp: 95, speed: 5.0 * 0.84375, jumpForce: 14.8 * 1.2675, basicDamage: 8, specialDamage: 23, ultDamage: 38, basicCd: 500, specialCd: 1400, ultCd: 4200 }
};

// --- 7 DISTINCT BATTLEFIELD MAPS ---
const MAPS = {
    cyber: {
        name: 'CYBER CITY',
        background: '#0a0a10',
        gridColor: 'rgba(0, 255, 204, 0.1)',
        gravity: 0.676,
        platforms: [
            { x: 0, y: 1060, w: 2048, h: 92, border: '#00ffcc', fill: '#101420' },
            { x: 300, y: 780, w: 440, h: 36, border: '#ff0055', fill: '#201018' },
            { x: 1308, y: 780, w: 440, h: 36, border: '#ff0055', fill: '#201018' },
            { x: 774, y: 520, w: 500, h: 36, border: '#00ffcc', fill: '#101420' }
        ],
        spawnP1: { x: 200, y: 880 },
        spawnP2: { x: 1848, y: 880 }
    },
    sky: {
        name: 'SKY ISLAND',
        background: '#08121e',
        gridColor: 'rgba(255, 255, 255, 0.05)',
        gravity: 0.676,
        platforms: [
            { x: 324, y: 960, w: 1400, h: 60, border: '#00e5ff', fill: '#0f2438' },
            { x: 524, y: 680, w: 400, h: 36, border: '#4cd964', fill: '#102e1c' },
            { x: 1124, y: 680, w: 400, h: 36, border: '#4cd964', fill: '#102e1c' },
            { x: 824, y: 400, w: 400, h: 36, border: '#ffcc00', fill: '#332a10' }
        ],
        spawnP1: { x: 500, y: 760 },
        spawnP2: { x: 1548, y: 760 }
    },
    temple: {
        name: 'ANCIENT TEMPLE',
        background: '#0e0e14',
        gridColor: 'rgba(255, 204, 0, 0.08)',
        gravity: 0.676,
        platforms: [
            { x: 0, y: 1060, w: 2048, h: 92, border: '#ffaa00', fill: '#221b10' },
            { x: 160, y: 800, w: 360, h: 44, border: '#007aff', fill: '#0c1a2e' },
            { x: 1528, y: 800, w: 360, h: 44, border: '#007aff', fill: '#0c1a2e' },
            { x: 624, y: 560, w: 800, h: 44, border: '#ffffff', fill: '#22222d' }
        ],
        spawnP1: { x: 200, y: 880 },
        spawnP2: { x: 1848, y: 880 }
    },
    soccer: {
        name: 'SOCCER STADIUM',
        background: '#092d1c',
        gridColor: 'rgba(0, 230, 118, 0.15)',
        gravity: 0.676,
        platforms: [
            { x: 0, y: 1060, w: 2048, h: 92, border: '#00e676', fill: '#0f4028' },
            { x: 0, y: 650, w: 240, h: 40, border: '#ffffff', fill: '#0f4028' },
            { x: 1808, y: 650, w: 240, h: 40, border: '#ffffff', fill: '#0f4028' },
            { x: 624, y: 480, w: 800, h: 36, border: '#00e676', fill: '#0f4028' }
        ],
        spawnP1: { x: 250, y: 880 },
        spawnP2: { x: 1798, y: 880 }
    },
    volcano: {
        name: 'LAVA VOLCANO',
        background: '#1a0505',
        gridColor: 'rgba(255, 61, 0, 0.12)',
        gravity: 0.676,
        isLavaHazard: true,
        platforms: [
            { x: 0, y: 1080, w: 2048, h: 72, border: '#ff3d00', fill: '#400a00' }, // Lava bottom
            { x: 200, y: 840, w: 450, h: 40, border: '#ff9100', fill: '#260800' },
            { x: 1398, y: 840, w: 450, h: 40, border: '#ff9100', fill: '#260800' },
            { x: 724, y: 600, w: 600, h: 40, border: '#ff3d00', fill: '#260800' }
        ],
        spawnP1: { x: 300, y: 700 },
        spawnP2: { x: 1548, y: 700 }
    },
    space: {
        name: 'DEEP SPACE',
        background: '#040010',
        gridColor: 'rgba(213, 0, 249, 0.12)',
        gravity: 0.38, // Low Gravity Float!
        platforms: [
            { x: 200, y: 980, w: 1648, h: 50, border: '#d500f9', fill: '#14002e' },
            { x: 400, y: 680, w: 350, h: 32, border: '#00e5ff', fill: '#002033' },
            { x: 1298, y: 680, w: 350, h: 32, border: '#00e5ff', fill: '#002033' },
            { x: 774, y: 440, w: 500, h: 32, border: '#d500f9', fill: '#14002e' }
        ],
        spawnP1: { x: 350, y: 840 },
        spawnP2: { x: 1648, y: 840 }
    },
    dojo: {
        name: 'MARTIAL DOJO',
        background: '#140c08',
        gridColor: 'rgba(255, 171, 0, 0.09)',
        gravity: 0.676,
        platforms: [
            { x: 0, y: 1060, w: 2048, h: 92, border: '#ffab00', fill: '#2e190e' },
            { x: 250, y: 760, w: 400, h: 36, border: '#ff6d00', fill: '#2e190e' },
            { x: 1398, y: 760, w: 400, h: 36, border: '#ff6d00', fill: '#2e190e' },
            { x: 774, y: 500, w: 500, h: 36, border: '#ffab00', fill: '#2e190e' }
        ],
        spawnP1: { x: 250, y: 880 },
        spawnP2: { x: 1798, y: 880 }
    }
};

// --- PARTICLE SYSTEM ---
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
    constructor(x, y, dx, dy, color, size, speed, damage, owner, type = 'normal', trackingTarget = null) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.size = size * 2.2;
        this.speed = speed * 1.3;
        this.damage = damage;
        this.owner = owner; 
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

// --- SOCCER BALL BOUNCY ENTITY ---
class SoccerBall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 28;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = -6;
        this.angle = 0;
    }

    update(platforms, p1, p2) {
        this.vy += 0.5;
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.vx * 0.05;

        if (this.x < this.r || this.x > CANVAS_WIDTH - this.r) {
            this.vx *= -0.85;
            this.x = this.x < this.r ? this.r : CANVAS_WIDTH - this.r;
        }

        for (let plat of platforms) {
            if (this.x > plat.x - this.r && this.x < plat.x + plat.w + this.r) {
                if (this.vy > 0 && this.y + this.r >= plat.y && this.y - this.r < plat.y + plat.h) {
                    this.y = plat.y - this.r;
                    this.vy *= -0.8;
                }
            }
        }

        // Check collision with players
        for (let p of [p1, p2]) {
            if (!p) continue;
            let dist = Math.hypot(this.x - (p.x + p.width/2), this.y - (p.y + p.height/2));
            if (dist < this.r + p.width/2) {
                let angle = Math.atan2(this.y - (p.y + p.height/2), this.x - (p.x + p.width/2));
                this.vx = Math.cos(angle) * 14;
                this.vy = Math.sin(angle) * 14;
                createHitParticles(this.x, this.y, '#ffffff', 10);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#111111';
        for(let i=0; i<5; i++) {
            let a = (i * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * (this.r*0.5), Math.sin(a) * (this.r*0.5), 6, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// --- RAGDOLL STICKMAN PLAYER CLASS ---
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
        this.angle = 0; // Acrobatic Ragdoll Body Angle
        this.angularVelocity = 0;
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
        
        const currentGravity = mapConfig.gravity || 0.676;
        this.vy += currentGravity;
        this.x += this.vx;
        
        // Acrobatic Ragdoll Angular Physics
        this.angle += this.angularVelocity;
        
        if (this.isGrounded) {
            this.angle *= 0.72; // Auto upright recovery when on ground
            this.angularVelocity *= 0.6;
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
                    this.doubleJumpUsed = false;
                }
            }
        }

        // Lava Hazard Collision Check
        if (mapConfig.isLavaHazard && this.y >= 1000) {
            this.takeDamage(1.5); // Continuous tick damage
            this.vy = -12; // Lava bounce!
            createHitParticles(this.x + this.width/2, 1060, '#ff3d00', 10);
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
            this.angularVelocity = this.facing * 0.35; // 360 Degree Acrobatic Flip!
            this.isGrounded = false;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#ffffff', 10);
        } else if (this.charKey === 'ninja' && !this.doubleJumpUsed) {
            this.vy = -this.config.jumpForce * 0.9;
            this.angularVelocity = -this.facing * 0.45; // Reverse Flip!
            this.doubleJumpUsed = true;
            createHitParticles(this.x + this.width/2, this.y + this.height, '#00ffff', 12);
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
        
        this.gainUlt(dmgTaken * 0.6);
        screenShake = 16;
        
        // Ragdoll Impact Knockback Rotation
        this.angularVelocity = -this.facing * 0.5;
        this.vx = -this.facing * 6;
        
        createHitParticles(this.x + this.width/2, this.y + this.height/2, this.config.color, 22);
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
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 85, y: this.y + 10, w: 85, h: this.height - 20 };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'lancer') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 130, y: this.y + 25, w: 130, h: 28 };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'mage') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#ff5500', 10, 11, this.config.basicDamage, this.id));
        } else if (this.charKey === 'archer') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#4cd964', 5, 18, this.config.basicDamage, this.id));
        } else if (this.charKey === 'gunner') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 28, this.facing, 0, '#ffcc00', 6, 22, this.config.basicDamage, this.id));
        } else if (this.charKey === 'ninja') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 28, this.facing, 0, '#8e8e93', 8, 16, this.config.basicDamage, this.id));
        } else if (this.charKey === 'necromancer') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 28, this.facing, 0, '#bf5af2', 9, 9, this.config.basicDamage, this.id));
        } else if (this.charKey === 'paladin') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 60, y: this.y + 6, w: 60, h: this.height - 12 };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'reaper') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 100, y: this.y, w: 100, h: this.height };
            checkMeleeHit(this, opponent, this.config.basicDamage);
        } else if (this.charKey === 'vampire') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 75, y: this.y + 12, w: 75, h: this.height - 24 };
            if (checkMeleeHit(this, opponent, this.config.basicDamage)) {
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.basicDamage * 0.35));
            }
        } else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 20, this.facing, -0.15, '#30d158', 8, 11, this.config.basicDamage, this.id));
        } else if (this.charKey === 'rogue') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 65, y: this.y + 18, w: 65, h: this.height - 36 };
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
            this.vx = this.facing * 20;
            this.angularVelocity = this.facing * 0.4;
            this.isAttacking = true;
            this.attackTimer = 18;
            this.attackBox = { x: this.x - 25, y: this.y, w: this.width + 50, h: this.height };
            checkMeleeHit(this, opponent, this.config.specialDamage);
        } 
        else if (this.charKey === 'mage') {
            createExplosion(this.x + this.width/2, this.y + this.height/2, 180, '#ff9500');
            let dist = Math.hypot((this.x + this.width/2) - (opponent.x + opponent.width/2), (this.y + this.height/2) - (opponent.y + opponent.height/2));
            if (dist < 200) {
                opponent.takeDamage(this.config.specialDamage);
                opponent.vx = (opponent.x > this.x ? 1 : -1) * 14;
            }
        } 
        else if (this.charKey === 'archer') {
            let pX = this.facing === 1 ? this.x + this.width + 15 : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, -0.22, '#4cd964', 5, 14, this.config.specialDamage * 0.5, this.id));
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#4cd964', 5, 14, this.config.specialDamage * 0.5, this.id));
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0.22, '#4cd964', 5, 14, this.config.specialDamage * 0.5, this.id));
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
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, -0.25, '#ffcc00', 14, 12, this.config.specialDamage, this.id, 'bomb'));
        } 
        else if (this.charKey === 'ninja') {
            let oldX = this.x;
            this.x = opponent.x - opponent.facing * 90;
            this.facing = opponent.facing;
            this.angularVelocity = this.facing * 0.6;
            createHitParticles(oldX + this.width/2, this.y + this.height/2, '#8e8e93', 20);
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 20);
            opponent.takeDamage(this.config.specialDamage);
        } 
        else if (this.charKey === 'brawler') {
            this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 60, y: this.y - 35, w: 75, h: this.height + 35 };
            if (checkMeleeHit(this, opponent, this.config.specialDamage)) {
                opponent.vy = -18;
                opponent.vx = this.facing * 6;
            }
        } 
        else if (this.charKey === 'necromancer') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, 0, '#bf5af2', 12, 8, this.config.specialDamage, this.id, 'homing', opponent));
        } 
        else if (this.charKey === 'paladin') {
            this.isShielded = true;
            this.shieldDuration = 220;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#0a84ff', 30);
        } 
        else if (this.charKey === 'reaper') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y + 30, this.facing, 0, '#34c759', 16, 9, this.config.specialDamage, this.id, 'absorb', opponent));
        } 
        else if (this.charKey === 'vampire') {
            this.vx = this.facing * 24;
            createHitParticles(this.x + this.width/2, this.y + this.height/2, '#ff2d55', 30);
            if (Math.abs(this.x - opponent.x) < 140 && Math.abs(this.y - opponent.y) < 90) {
                opponent.takeDamage(this.config.specialDamage);
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.config.specialDamage * 0.55));
            }
        } 
        else if (this.charKey === 'alchemist') {
            let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
            projectiles.push(new Projectile(pX, this.y, this.facing, -0.35, '#30d158', 12, 11, this.config.specialDamage, this.id, 'bomb'));
        }

        this.gainUlt(16);
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
            projectiles.push(new Projectile(pX, 0, 0, 1, '#ff3b30', 48, 9, this.config.ultDamage, this.id, 'bomb'));
        } 
        else if (this.charKey === 'archer') {
            for(let i=0; i<10; i++) {
                setTimeout(() => {
                    let pX = this.facing === 1 ? this.x + this.width : this.x - 20;
                    projectiles.push(new Projectile(pX, this.y + 15 + (Math.random()-0.5)*60, this.facing, (Math.random()-0.5)*0.25, '#4cd964', 6, 24, this.config.ultDamage / 10, this.id));
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
                    projectiles.push(new Projectile(rx, 80, -Math.cos(angle), -Math.sin(angle), '#8e8e93', 9, 20, this.config.ultDamage / 15, this.id));
                }, i * 70);
            }
        } 
        else if (this.charKey === 'brawler') {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    this.vx = this.facing * 10;
                    this.attackBox = { x: this.facing === 1 ? this.x + this.width : this.x - 90, y: this.y, w: 90, h: this.height };
                    checkMeleeHit(this, opponent, this.config.ultDamage / 6);
                }, i * 100);
            }
        } 
        else if (this.charKey === 'necromancer') {
            for(let i = 0; i < 4; i++) {
                setTimeout(() => {
                    projectiles.push(new Projectile(this.x + this.width/2, this.y, this.facing, -0.6 + (i*0.4), '#bf5af2', 18, 9, this.config.ultDamage/4, this.id, 'homing', opponent));
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
            projectiles.push(new Projectile(pX, this.y + 15, this.facing, -0.18, '#30d158', 26, 11, this.config.ultDamage, this.id, 'bomb'));
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

        // Apply Ragdoll Body Rotation Transform!
        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle);

        const charColor = this.config.color;
        
        ctx.strokeStyle = charColor;
        ctx.fillStyle = charColor;
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Relative local coordinates
        const headRadius = 20;
        const headY = -this.height/2 + headRadius + 3;
        const neckY = headY + headRadius;
        const pelvisY = this.height/2 - 26;

        // 1. Head (Solid circle + Head accessory/goggles)
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Goggles/Headset Accessory (matching reference image)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.facing * 8, headY - 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Spine Body
        ctx.beginPath();
        ctx.moveTo(0, neckY);
        ctx.lineTo(0, pelvisY);
        ctx.stroke();

        // 3. Legs + Boots (matching reference image shoes!)
        let legOffset = Math.sin(Date.now() * 0.018) * (Math.abs(this.vx) > 0.1 ? 16 : 3);
        if (!this.isGrounded) legOffset = 14;

        // Left Leg
        let lKneeX = -12 - legOffset * 0.5;
        let lKneeY = pelvisY + 14;
        let lFootX = -15 - legOffset;
        let lFootY = this.height/2;

        ctx.beginPath();
        ctx.moveTo(0, pelvisY);
        ctx.lineTo(lKneeX, lKneeY);
        ctx.lineTo(lFootX, lFootY);
        ctx.stroke();

        // Right Leg
        let rKneeX = 12 + legOffset * 0.5;
        let rKneeY = pelvisY + 14;
        let rFootX = 15 + legOffset;
        let rFootY = this.height/2;

        ctx.beginPath();
        ctx.moveTo(0, pelvisY);
        ctx.lineTo(rKneeX, rKneeY);
        ctx.lineTo(rFootX, rFootY);
        ctx.stroke();

        // Chunky Boots (Ref Image Red/Blue Shoes)
        ctx.fillStyle = this.id === 1 ? '#ff0055' : '#007aff';
        ctx.fillRect(lFootX - 10, lFootY - 14, 18, 14);
        ctx.fillRect(rFootX - 8, rFootY - 14, 18, 14);

        // 4. Arms
        const shoulderY = neckY + 8;
        const handX = this.facing * 26;
        const handY = shoulderY + (this.isAttacking ? -6 : 12);

        // Back Arm
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(-this.facing * 12, shoulderY + 12);
        ctx.lineTo(-this.facing * 20, shoulderY + 24);
        ctx.stroke();

        // Front Arm
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(this.facing * 14, shoulderY + (this.isAttacking ? -9 : 6));
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // 5. Weapon
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

        // 6. Shield / Special Effects
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
    soccerBalls = [];

    if (mapKey === 'soccer') {
        soccerBalls.push(new SoccerBall(CANVAS_WIDTH / 2, 400));
    }
    
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
    if (keys['.'] || keys['>']) {
        player2.useBasicAttack(player1);
    }
    if (keys['/'] || keys['?']) {
        player2.useSpecialSkill(player1);
    }
    if (keys['Shift'] || keys['shift']) {
        player2.useUltimate(player1);
    }
}

// --- CANVAS RENDERING ENGINE ---
function gameLoop() {
    if (currentGameState === STATE.PLAYING) {
        handleInputs();
        
        player1.update(activeMap.platforms, activeMap);
        player2.update(activeMap.platforms, activeMap);

        if (activeMap === MAPS.sky) {
            if (player1.y > CANVAS_HEIGHT) player1.takeDamage(999);
            if (player2.y > CANVAS_HEIGHT) player2.takeDamage(999);
        }

        // Update Soccer Balls if Soccer Stadium Map
        for (let ball of soccerBalls) {
            ball.update(activeMap.platforms, player1, player2);
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
        ctx.lineWidth = 1.5;
        for(let i=0; i<CANVAS_WIDTH; i+=60) {
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
            ctx.shadowBlur = 20;
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            
            ctx.strokeStyle = plat.border;
            ctx.lineWidth = 4.5;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
            ctx.restore();
        }

        // Render Soccer Balls
        for (let ball of soccerBalls) {
            ball.draw(ctx);
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
