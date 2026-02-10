// ==================== OYUN KONFİGÜRASYONU ====================
const CONFIG = {
    // Oyun Ayarları
    TOTAL_ROUNDS: 10,
    QUESTION_TIME: 10, // saniye

    // Puan Değerleri
    POINTS: {
        chicken: 1,  // Tavuk
        rabbit: 3,   // Tavşan
        cat: 5       // Kedi
    },

    // Fizik Ayarları
    PLUNGER_SPEED: 8,      // Vantuz fırlatma hızı (12 -> 8 Yavaşlatıldı)
    PLUNGER_RETURN_SPEED: 5, // Vantuz geri dönüş hızı (8 -> 5 Yavaşlatıldı)

    // Görsel Ayarları
    GUN_ROTATION_RANGE: 25, // Tabanca rotasyon açısı (derece) - her iki gap'e ulaşabilecek
    GUN_ROTATION_SPEED: 0.005, // Rotasyon hızı (Daha da yavaşlatıldı - Sakin mod)
    BLINK_INTERVAL: 2000,   // Göz kırpma aralığı (ms)
    BLINK_DURATION: 200     // Göz kırpma süresi (ms)
};

// ==================== ASSET YÖNETİMİ ====================
/*
    ASSET DOSYA YAPISI:

    /background.png         - Arka plan görseli
    /cloud.png              - Bulut görseli
    /sun.png                - Güneş görseli
    /chart.png              - Puan tablosu
    /question_count.png     - Soru sayacı ikonu
    /score_count.png        - Skor ikonu
    /timer.png              - Zamanlayıcı ikonu (kapsül şeklinde)

    /catcher/
        catcher.png         - Ana yakalayıcı gövdesi
        catcher_leg.png     - Yakalayıcı ayağı (yerde sabit)
        pump.png            - Pompa kısmı (ileri-geri hareket)

    /animals/
        /blink/             - Göz kırpma hali
            Asset 98.png    - Tavuk (blink)
            Asset 99.png    - Tavşan (blink)
            Asset 100.png   - Kedi (blink)
        /confused/          - Şaşkın hali (vurulduğunda)
            Asset 95.png    - Tavuk (confused)
            Asset 97.png    - Tavşan (confused)
            Asset 96.png    - Kedi (confused)
        /static/            - Normal hali
            Asset 102.png   - Tavuk (static)
            Asset 101.png   - Tavşan (static)
            Asset 103.png   - Kedi (static)

    /pipe/
        long_upper_pipe_front.png  - Üst boru ön
        long_upper_pipe_back.png   - Üst boru arka
        mid_pipe.png               - Orta yüzük (ince kapsül)
        mid_upper_front.png        - Orta üst ön
        mid_upper_back.png         - Orta üst arka
        mid_lower_front.png        - Orta alt ön
        mid_lower_back.png         - Orta alt arka
        lower_front.png            - Alt boru ön
        lower_back.png             - Alt boru arka
*/

const ASSETS = {
    images: {},
    loaded: false,

    // Yüklenecek tüm görseller
    manifest: {
        // Arka Plan
        background: 'game/background.png',
        cloud: 'game/cloud.png',
        sun: 'game/sun.png',

        // Catcher (Tabanca)
        catcher: 'catcher/catcher.png',
        catcherLeg: 'catcher/catcher_leg.png',
        pump: 'catcher/pump.png',

        // Hayvanlar - Static
        chickenStatic: 'animals/static/Asset 102.png',
        rabbitStatic: 'animals/static/Asset 101.png',
        catStatic: 'animals/static/Asset 103.png',

        // Hayvanlar - Blink
        chickenBlink: 'animals/blink/Asset 98.png',
        rabbitBlink: 'animals/blink/Asset 99.png',
        catBlink: 'animals/blink/Asset 100.png',

        // Hayvanlar - Confused
        chickenConfused: 'animals/confused/Asset 95.png',
        rabbitConfused: 'animals/confused/Asset 97.png',
        catConfused: 'animals/confused/Asset 96.png',

        // Pipe (Tüp) - Tüm parçalar
        pipeUpper: 'pipe/long_upper_pipe.png',
        pipeUpperFront: 'pipe/long_upper_pipe_front.png',
        pipeUpperBack: 'pipe/long_upper_pipe_back.png',
        pipeMidRing: 'pipe/mid_pipe.png',
        pipeMidUpperFront: 'pipe/mid_upper_front.png',
        pipeMidUpperBack: 'pipe/mid_upper_back.png',
        pipeMidLowerFront: 'pipe/mid_lower_front.png',
        pipeMidLowerBack: 'pipe/mid_lower_back.png',
        pipeLower: 'pipe/lower_pipe.png',
        pipeLowerFront: 'pipe/lower_front.png',
        pipeLowerBack: 'pipe/lower_back.png'
    },

    load() {
        return new Promise((resolve) => {
            const keys = Object.keys(this.manifest);
            let loadedCount = 0;

            keys.forEach(key => {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === keys.length) {
                        this.loaded = true;
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.warn(`Asset yüklenemedi: ${this.manifest[key]}`);
                    loadedCount++;
                    if (loadedCount === keys.length) {
                        this.loaded = true;
                        resolve();
                    }
                };
                img.src = this.manifest[key];
                this.images[key] = img;
            });
        });
    }
};

// ==================== SES YÖNETİMİ ====================
const AUDIO_MANAGER = {
    sounds: {},
    manifest: {
        shoot: 'sounds/shoot.mp3',
        glassHit: 'sounds/glass_hit.mp3',
        catch: 'sounds/catch.mp3',
        correct: 'sounds/correct.mp3',
        wrong: 'sounds/wrong.mp3',
        celebration: 'sounds/celebration.mp3'
    },

    init() {
        for (const [key, path] of Object.entries(this.manifest)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds[key] = audio;
        }
    },

    play(key) {
        const sound = this.sounds[key];
        if (sound) {
            sound.currentTime = 0; // Baştan çal
            sound.play().catch(e => console.warn(`Ses çalınamadı (${key}):`, e.message));
        }
    }
};

// ==================== OYUN DURUMU ====================
const GameState = {
    // Ekranlar
    currentScreen: 'intro', // 'intro', 'game', 'question', 'shooting'

    // Oyun İstatistikleri
    score: 0,
    currentRound: 1,
    correctAnswers: 0,
    successfulCatches: 0,

    // Soru Sistemi
    questions: [],
    currentQuestion: null,
    questionTimer: null,
    timeRemaining: CONFIG.QUESTION_TIME,

    // Atış Durumu
    canShoot: false,
    isShooting: false,

    reset() {
        this.score = 0;
        this.currentRound = 1;
        this.correctAnswers = 0;
        this.successfulCatches = 0;
        this.canShoot = false;
        this.isShooting = false;
        this.timeRemaining = CONFIG.QUESTION_TIME;
    }
};

// ==================== CANVAS VE RENDER ====================
let canvas, ctx;
let introCanvas, introCtx;
let canvasWidth, canvasHeight;
let gameScale = 1; // Global ölçek faktörü

function getScale() {
    // Mobil veya küçük ekranlarda öğelerin çok küçülmemesi için 
    const isPortrait = window.innerHeight > window.innerWidth;
    const baseScale = window.innerWidth / 1920;
    const heightScale = window.innerHeight / 1080;

    if (isPortrait) {
        // Portre modunda dikey boşluğu doldurmak için daha agresif ölçek
        return Math.max(baseScale * 1.9, 0.7);
    }

    // Yatayda ve akıllı tahtalarda her iki boyutu da baz al
    const finalScale = Math.min(baseScale, heightScale);
    return Math.max(finalScale, 0.6);
}

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Intro canvas (responsive yapıldı)
    introCanvas = document.getElementById('introCanvas');
    if (introCanvas) {
        introCtx = introCanvas.getContext('2d');
        // CSS genişliği %100 ama internal resolution sabit tutulup draw'da scale edilecek
        introCanvas.width = 800;
        introCanvas.height = 600;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Global ölçeği güncelle
    gameScale = getScale();

    // Oyun nesnelerini yeniden konumlandır
    if (gun) gun.updatePosition();
    if (pipe) pipe.updatePosition();
}

// ==================== GİRİŞ ANİMASYONU ====================
class IntroAnimation {
    constructor() {
        this.catcherX = 120;
        this.catcherY = 320;
        this.rotation = 0;
        this.rotationTime = 0;

        // Toplar - Zemin üzerinde sıra halinde
        this.balls = [
            { type: 'chicken', x: 300, y: 380, originalY: 380, jumpY: 0, jumpVelY: 0, jumpTimer: Math.random() * 2000, swayPhase: Math.random() * Math.PI, state: 'static' },
            { type: 'rabbit', x: 380, y: 380, originalY: 380, jumpY: 0, jumpVelY: 0, jumpTimer: Math.random() * 2000, swayPhase: Math.random() * Math.PI, state: 'static' },
            { type: 'cat', x: 460, y: 380, originalY: 380, jumpY: 0, jumpVelY: 0, jumpTimer: Math.random() * 2000, swayPhase: Math.random() * Math.PI, state: 'static' }
        ];

        // Göz kırpma
        this.blinkTimers = this.balls.map(() => Math.random() * 2000);
    }

    update(deltaTime) {
        // Tabanca (Catcher) sallanması - Sadece yukarı/aşağı
        this.rotationTime += 0.02;
        this.rotation = Math.sin(this.rotationTime) * 0.15;

        // Hayvanların hareketi (Sallanma ve Zıplama)
        this.balls.forEach((ball, i) => {
            // Göz kırpma logic
            this.blinkTimers[i] -= deltaTime;
            if (this.blinkTimers[i] <= 0) {
                ball.state = ball.state === 'static' ? 'blink' : 'static';
                this.blinkTimers[i] = ball.state === 'blink' ? 200 : 2000 + Math.random() * 1000;
            }

            // Sallanma (Sway)
            ball.swayPhase += 0.03;

            // Zıplama (Jump)
            ball.jumpTimer -= deltaTime;
            if (ball.jumpTimer <= 0 && ball.jumpY === 0) {
                ball.jumpVelY = -4; // Zıplama gücü
                ball.jumpTimer = 3000 + Math.random() * 3000; // Sonraki zıplama zamanı
            }

            // Fizik: Yerçekimi
            if (ball.jumpY < 0 || ball.jumpVelY !== 0) {
                ball.jumpVelY += 0.2; // Gravity
                ball.jumpY += ball.jumpVelY;

                if (ball.jumpY > 0) {
                    ball.jumpY = 0;
                    ball.jumpVelY = 0;
                }
            }
        });
    }

    // startAiming kaldırıldı, artık atış yok

    draw() {
        if (!introCtx) return;

        const ctx = introCtx;
        ctx.clearRect(0, 0, 800, 600); // initCanvas'taki yeni boyutlara göre

        ctx.save();
        // 550x450 orijinal çizimi 800x600'e sığdırmak için ölçeklendir
        const iScale = 800 / 550;
        ctx.scale(iScale, iScale);

        // Topları çiz (Sallanan ve Zıplayan)
        this.balls.forEach(ball => {
            this.drawBall(ctx, ball);
        });

        // Catcher çiz (Sadece gövde, atış yok)
        this.drawCatcher(ctx);
        ctx.restore();
    }

    drawBall(ctx, ball) {
        let img;
        switch (ball.type) {
            case 'chicken':
                img = ball.state === 'blink' ? ASSETS.images.chickenBlink : ASSETS.images.chickenStatic;
                break;
            case 'rabbit':
                img = ball.state === 'blink' ? ASSETS.images.rabbitBlink : ASSETS.images.rabbitStatic;
                break;
            case 'cat':
                img = ball.state === 'blink' ? ASSETS.images.catBlink : ASSETS.images.catStatic;
                break;
        }

        if (img) {
            ctx.save();
            const swayRotation = Math.sin(ball.swayPhase) * 0.12;
            ctx.translate(ball.x, ball.y + ball.jumpY);
            ctx.rotate(swayRotation);

            const size = 65;
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }
    }

    drawPipeBack(ctx) {
        const pipeX = 420;
        const pipeWidth = 70;
        const pipeTop = 130;
        const pipeBottom = 420;
        const h = pipeBottom - pipeTop;

        // Arka tüp gövdesi - Derinlik veren degrade
        const grad = ctx.createLinearGradient(pipeX - pipeWidth / 2, 0, pipeX + pipeWidth / 2, 0);
        grad.addColorStop(0, '#1B5E20');
        grad.addColorStop(0.5, '#2E7D32');
        grad.addColorStop(1, '#1B5E20');

        ctx.fillStyle = grad;
        ctx.fillRect(pipeX - pipeWidth / 2, pipeTop, pipeWidth, h);
    }

    drawPipeFront(ctx) {
        const pipeX = 420;
        const pipeWidth = 70;
        const pipeTop = 130;
        const pipeBottom = 420;
        const h = pipeBottom - pipeTop;
        const ringWidth = pipeWidth * 1.3;

        // Ön tüp parçası (Cam efekti - Asset kullanımı)
        if (ASSETS.images.pipeUpperFront) {
            ctx.drawImage(ASSETS.images.pipeUpperFront, pipeX - pipeWidth / 2, pipeTop, pipeWidth, h);
        }

        // Üst ve alt halkalar (Ağızlıklar)
        if (ASSETS.images.pipeMidRing) {
            // Üst halka
            ctx.drawImage(ASSETS.images.pipeMidRing, pipeX - ringWidth / 2, pipeTop - 10, ringWidth, 35);
            // Alt halka
            ctx.drawImage(ASSETS.images.pipeMidRing, pipeX - ringWidth / 2, pipeBottom - 10, ringWidth, 35);
        }

        // Ön halka parçaları (pipeMidUpperFront kullanılabilir ama bu ölçekte ring yeterli)
        if (ASSETS.images.pipeMidUpperFront) {
            ctx.drawImage(ASSETS.images.pipeMidUpperFront, pipeX - ringWidth / 2, pipeTop - 10, ringWidth, 35);
            ctx.drawImage(ASSETS.images.pipeMidUpperFront, pipeX - ringWidth / 2, pipeBottom - 10, ringWidth, 35);
        }
    }

    drawCatcher(ctx) {
        const catcherWidth = 180;
        const catcherHeight = 125;
        const legWidth = 70;
        const legHeight = 50;
        const pumpWidth = 80;
        const pumpHeight = 55;

        ctx.save();
        ctx.translate(this.catcherX, this.catcherY);

        // 1. Bacak
        if (ASSETS.images.catcherLeg) {
            ctx.drawImage(ASSETS.images.catcherLeg, -legWidth / 2 + 23, -10, legWidth, legHeight + 60);
        }

        // 2. Dönen kısım
        ctx.save();
        ctx.rotate(this.rotation);

        // Gövde
        if (ASSETS.images.catcher) {
            ctx.drawImage(ASSETS.images.catcher, -70, -catcherHeight / 2 - 8, catcherWidth, catcherHeight);
        }

        // Korunan İp - gövdenin içinden pompaya düz çizgi
        const ropeStartX = 78;
        const ropeY = -12;
        const pumpX = 78 + 50;

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ropeStartX, ropeY);
        ctx.lineTo(pumpX, ropeY);
        ctx.stroke();

        // Pompa (sabit pozisyonda hafif hareketli olabilir ama tutorial için basit tutuyoruz)
        const pumpY = -pumpHeight / 2 - 12;
        if (ASSETS.images.pump) {
            ctx.drawImage(ASSETS.images.pump, pumpX - 10, pumpY, pumpWidth, pumpHeight);
        }

        ctx.restore();
        ctx.restore();
    }
}

let introAnim;

function initIntroAnimation() {
    introAnim = new IntroAnimation();
}

function introAnimLoop(currentTime) {
    if (GameState.currentScreen !== 'intro') return;

    const deltaTime = currentTime - (introAnimLoop.lastTime || currentTime);
    introAnimLoop.lastTime = currentTime;

    if (introAnim) {
        introAnim.update(deltaTime);
        introAnim.draw();
    }

    requestAnimationFrame(introAnimLoop);
}

// ==================== BULUT SİSTEMİ ====================
class Cloud {
    constructor(y, speed, scale) {
        this.x = Math.random() * canvasWidth;
        this.y = y;
        this.speed = speed;
        this.scale = scale;
        this.width = 150 * scale * gameScale;
        this.height = 80 * scale * gameScale;
    }

    update() {
        this.x += this.speed;
        if (this.x > canvasWidth + this.width) {
            this.x = -this.width;
        }
    }

    draw() {
        if (ASSETS.images.cloud) {
            ctx.globalAlpha = 0.8;
            ctx.drawImage(ASSETS.images.cloud, this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        }
    }
}

const clouds = [];
function initClouds() {
    clouds.length = 0;
    clouds.push(new Cloud(canvasHeight * 0.08, 0.3, 1.2));
    clouds.push(new Cloud(canvasHeight * 0.15, 0.5, 0.9));
    clouds.push(new Cloud(canvasHeight * 0.05, 0.2, 1.0));
    clouds.push(new Cloud(canvasHeight * 0.20, 0.4, 0.7));
}

// ==================== ZEMİN HAYVANLARI (PERSPEKTİFLİ) ====================
const groundAnimals = [];

function initGroundAnimals() {
    groundAnimals.length = 0;
    const isMob = isMobileView();

    // 3 hayvan: önden arkaya doğru küçülen (perspektif)
    // En arkadaki (en küçük)
    groundAnimals.push({
        type: 'rabbit',
        x: isMob ? 0.03 : 0.05, // Mobilde biraz daha sola (0.05 -> 0.03)
        y: 0.65, // Görece yukarıda (arka)
        size: (isMob ? 45 : 70) * gameScale, // PC'de daha büyük (45 -> 70)
        state: 'static',
        blinkTimer: Math.random() * 2000,
        isBlinking: false,
        // Animasyon özellikleri
        jumpY: 0,
        jumpVelY: 0,
        jumpTimer: Math.random() * 5000 + 2000,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.002 + Math.random() * 0.001
    });

    // Ortadaki
    groundAnimals.push({
        type: 'cat',
        x: isMob ? 0.07 : 0.12, // Mobilde biraz daha sola (0.12 -> 0.07)
        y: 0.66, // Kullanıcı isteğiyle 0.66'ya çekildi
        size: (isMob ? 65 : 95) * gameScale, // PC'de daha büyük (65 -> 95)
        state: 'static',
        blinkTimer: Math.random() * 2000 + 500,
        isBlinking: false,
        // Animasyon özellikleri
        jumpY: 0,
        jumpVelY: 0,
        jumpTimer: Math.random() * 5000 + 3000,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.002 + Math.random() * 0.001
    });

    // En öndeki (en büyük) - Tavuk
    groundAnimals.push({
        type: 'chicken',
        x: isMob ? 0.08 : 0.15, // Mobilde sola kaydırıldı (0.15 -> 0.08)
        y: isMob ? 0.69 : 0.75, // PC'de daha da aşağıda (0.72 -> 0.75)
        size: (isMob ? 90 : 140) * gameScale, // PC'de daha büyük (90 -> 140)
        state: 'static',
        blinkTimer: Math.random() * 2000 + 1000,
        isBlinking: false,
        // Animasyon özellikleri
        jumpY: 0,
        jumpVelY: 0,
        jumpTimer: Math.random() * 5000 + 4000,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.002 + Math.random() * 0.001
    });
}

function updateGroundAnimals(deltaTime) {
    groundAnimals.forEach(animal => {
        // 1. Göz kırpma
        animal.blinkTimer -= deltaTime;
        if (animal.blinkTimer <= 0) {
            if (!animal.isBlinking) {
                animal.isBlinking = true;
                animal.state = 'blink';
                animal.blinkTimer = 200;
            } else {
                animal.isBlinking = false;
                animal.state = 'static';
                animal.blinkTimer = 2000 + Math.random() * 1500;
            }
        }

        // 2. Sallanma (Sinüzoidal)
        animal.swayPhase += animal.swaySpeed * deltaTime;

        // 3. Zıplama Mantığı
        animal.jumpTimer -= deltaTime;
        if (animal.jumpTimer <= 0 && animal.jumpY === 0) {
            animal.jumpVelY = -5; // Zıplama gücü
            animal.jumpTimer = 3000 + Math.random() * 4000; // Sonraki zıplama zamanı
        }

        // Fizik Güncelleme (Zıplama için)
        if (animal.jumpY < 0 || animal.jumpVelY !== 0) {
            animal.jumpY += animal.jumpVelY;
            animal.jumpVelY += 0.2; // Yerçekimi

            if (animal.jumpY >= 0) {
                animal.jumpY = 0;
                animal.jumpVelY = 0;
            }
        }
    });
}

function drawGroundAnimals() {
    // Arkadan öne doğru çiz (painter's algorithm)
    groundAnimals.forEach(animal => {
        const x = canvasWidth * animal.x;
        const y = canvasHeight * animal.y + animal.jumpY; // Zıplama ofseti

        let img;
        switch (animal.type) {
            case 'chicken':
                img = animal.state === 'blink' ? ASSETS.images.chickenBlink : ASSETS.images.chickenStatic;
                break;
            case 'rabbit':
                img = animal.state === 'blink' ? ASSETS.images.rabbitBlink : ASSETS.images.rabbitStatic;
                break;
            case 'cat':
                img = animal.state === 'blink' ? ASSETS.images.catBlink : ASSETS.images.catStatic;
                break;
        }

        if (img) {
            ctx.save();
            ctx.translate(x, y);
            // Hafif sallanma rotasyonu
            const rotation = Math.sin(animal.swayPhase) * 0.05;
            ctx.rotate(rotation);

            ctx.drawImage(img, -animal.size / 2, -animal.size / 2, animal.size, animal.size);
            ctx.restore();
        }
    });
}


// ==================== VANTUZ (PLUNGER) SİSTEMİ ====================
class Plunger {
    constructor() {
        this.reset();
        this.width = 40 * gameScale;
        this.height = 30 * gameScale;
        this.caughtBall = null;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.returning = false;
        this.stuckOnPipe = false;  // Tüpe yapışık mı?
        this.stuckTimer = 0;       // Yapışık kalma süresi
        this.caughtBall = null;
        this.targetX = 0;
        this.fireAngle = 0; // Ateşleme açısı
    }

    fire(startX, startY) {
        console.log('Plunger ateşleniyor:', startX, startY);
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.active = true;
        this.returning = false;
        this.stuckOnPipe = false;
        this.stuckTimer = 0;

        // Ateşleme açısını kaydet (tabanca açısı)
        this.fireAngle = gun.rotation;

        // Hedefleri belirle (Vantuz ucu = this.x + 70*pS)
        // Kullanıcı isteği: Tüpe tam sınırında/yakın dursun (+15 birim ileri)
        this.targetGlassX = pipe.x - pipe.pipeWidth / 2 + (15 * gameScale);

        // Kullanıcı isteği: Hayvanda ise biraz daha geride dursun (-8 birim geri)
        this.targetAnimalX = pipe.x - (pipe.animalSize / 2) - (8 * gameScale);

        // Mevcut hedef varsayılan olarak hayvandır
        this.targetX = this.targetAnimalX;

        console.log('Ateş!', 'Cisim-Hedef:', this.targetX, 'Cam-Hedef:', this.targetGlassX);
    }

    update() {
        if (!this.active) return;

        // 1. Stuck State (Yapışık durumu) - EN ÖNCELİKLİ
        if (this.stuckOnPipe && !this.returning) {
            if (this.vibrationTimer > 0) this.vibrationTimer -= 16;
            this.stuckTimer -= 16;

            if (this.stuckTimer <= 0) {
                this.returning = true;
                this.isVibrating = false;
                // BURADA HAYVANI BIRAKMA! (Taşıması için tutmaya devam et)
            }
            return;
        }

        // 2. Forward Movement (İleri gidiş)
        if (!this.returning) {
            this.x += Math.cos(this.fireAngle) * CONFIG.PLUNGER_SPEED;
            this.y += Math.sin(this.fireAngle) * CONFIG.PLUNGER_SPEED;

            // Ekran sınırları kontrolü
            if (this.y < -100 || this.y > canvasHeight + 100 || this.x > canvasWidth + 100) {
                this.startReturn();
                return;
            }

            const pS = gun.pumpS || gameScale;
            const tipX = this.x + (70 * pS);

            // Çarpışma Kontrolü
            const inGap1 = this.y > pipe.gap1Start && this.y < pipe.gap1End;
            const inGap2 = this.y > pipe.gap2Start && this.y < pipe.gap2End;

            if (!inGap1 && !inGap2) {
                // Boru gövdesi veya halkalar (Dinamik Hedef)
                // getHitX artık offset'i kendi içinde hesaplıyor (Halka: +35, Gövde: +55)
                const hitX = pipe.getHitX(this.y);
                if (tipX >= hitX) {
                    this.x = hitX - (70 * pS);
                    this.stickToPipe('pipe');
                }
            } else {
                // Hayvanlar bölgesi
                if (tipX >= this.targetAnimalX) {
                    // Hayvanı ıskaladıysa duvara çarpıp dönsün (ya da boşluğa)
                    // Ama burada sadece 'hizaya gelince dur' mantığı var
                    this.x = this.targetAnimalX - (70 * pS);
                    this.stickToPipe('miss'); // Boşa atış gibi davran
                }
            }
        }
        // 3. Return Movement (Geri dönüş)
        else {
            const gunPos = gun.getPlungerStartPos();
            const dx = gunPos.x - this.x;
            const dy = gunPos.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.PLUNGER_RETURN_SPEED) {
                this.onReturnComplete();
            } else {
                // Hayvan taşıyorsa YAVAŞ, boşsa HIZLI dön
                let speed = CONFIG.PLUNGER_RETURN_SPEED;

                if (this.caughtBall) {
                    speed = CONFIG.PLUNGER_RETURN_SPEED * 0.3; // %30 hızda ağır ağır gel (Sürükleme hissi)

                    // ORTA SAHADA BIRAKMA MANTIĞI
                    // Ekranın tam ortasına (canvasWidth / 2) gelince bırak
                    const releaseX = canvasWidth / 2;

                    if (this.x < releaseX) {
                        this.flyAwayAnimal(this.caughtBall);
                        pipe.replaceBall(this.caughtBall);
                        this.caughtBall = null; // Hayvanı bıraktı, artık boş dönebilir
                    }
                }

                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;

                // Yakalanan topu da taşı (Eğer hala tutuyorsa)
                if (this.caughtBall) {
                    this.caughtBall.drawX = this.x + (20 * gameScale);
                    this.caughtBall.drawY = this.y;
                }
            }
        }
    }

    // Tüpe yapış ve bekle
    // type: 'pipe' | 'animal' | 'miss'
    stickToPipe(type = 'pipe') {
        if (this.stuckOnPipe || this.returning) return;

        this.stuckOnPipe = true;

        if (type === 'pipe') {
            // TÜIP: Uzun bekleme ve titreşim
            this.stuckTimer = 2500; // 2.5 saniye
            this.vibrationTimer = 500;
            this.isVibrating = true;
            AUDIO_MANAGER.play('glassHit');
            console.log('Tüpe yapıştı (Uzun & Titreşim)');
        } else {
            // HAYVAN: Hızlı dönüş (Titreşim yok, bekleme SIFIR)
            this.stuckTimer = 0; // Hiç bekleme, direkt dön
            this.vibrationTimer = 0; // Titreşim yok
            this.isVibrating = false;
        }
    }

    startReturn() {
        this.returning = true;
    }

    onReturnComplete() {
        if (this.caughtBall) {
            // Başarılı yakalama
            const points = CONFIG.POINTS[this.caughtBall.type];
            GameState.score += points;
            GameState.successfulCatches++;
            updateUI();

            // Puan popup'ı göster (Global fonksiyon kullanılıyor)
            showPointsPopup(points, this.x, this.y);

            // Hayvanı uçur (yukarı kaybolacak)
            this.flyAwayAnimal(this.caughtBall);

            // Tüpteki hayvanı yenisiyle değiştir (akıcı aşağı akış için)
            pipe.replaceBall(this.caughtBall);

            // Yeni tura geç
            setTimeout(() => {
                nextRound();
            }, 800);
        } else {
            // Iskalama - Yeni tura geç (Kullanıcı isteği: Farklı soru sorsun)
            setTimeout(() => {
                nextRound();
            }, 300);
        }

        this.reset();
        GameState.isShooting = false;
    }

    // Hayvanı yukarı uçur (canvas tabanlı)
    flyAwayAnimal(ball) {
        const pS = gun.pumpS || gameScale;
        // Uçan hayvan listesine ekle - Pompanın tam ucundan başlat ama huninin içine göm
        // 10*pS kadar içeri kaydırdık (sıkı yapışma görüntüsü için)
        flyingAnimals.push({
            type: ball.type,
            x: this.x + (70 * pS) - (10 * pS),
            y: this.y,
            startY: this.y,
            opacity: 1,
            scale: 1,
            vx: (Math.random() - 0.5) * 2,
            vy: -6, // Yavaş uçuş (-10 -> -6)
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.2,
            time: 0
        });
    }

    catchBall(ball) {
        this.caughtBall = ball;
        ball.state = 'confused';
        ball.caught = true;
        AUDIO_MANAGER.play('catch');
        this.stickToPipe('animal');  // Hayvan modunda yapış
    }

    draw() {
        if (!this.active) return;

        // İp çizimi (Catcher gövdesinin önünden Plunger'a)
        const ropeStart = gun.getRopeStartPos();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 6 * gameScale; // Kalın ip
        ctx.beginPath();
        ctx.moveTo(ropeStart.x, ropeStart.y);

        // SARKMA EFEKTİ (Quadratic Curve)
        const midX = (ropeStart.x + this.x) / 2;
        const midY = (ropeStart.y + this.y) / 2;
        const dist = Math.hypot(this.x - ropeStart.x, this.y - ropeStart.y);

        // Mesafe arttıkça sarkma artar (0.15 katsayısı yerçekimi hissi verir)
        const sag = dist * 0.15;

        ctx.quadraticCurveTo(midX, midY + sag, this.x, this.y);
        ctx.stroke();

        // ADIM 1: Pompa (pump.png) - Altta kalsın diye önce çiziyoruz
        if (ASSETS.images.pump) {
            // Kullanıcı isteği: Pompa küçülmesin, tabancadaki ölçeği (gun.pumpS) korusun
            const pS = gun.pumpS || gameScale;
            const pWidth = 80 * pS;
            const pHeight = 55 * pS;

            // Titreşim ofseti
            let offX = 0;
            let offY = 0;
            if (this.isVibrating && this.vibrationTimer > 0) {
                offX = (Math.random() - 0.5) * 4 * gameScale;
                offY = (Math.random() - 0.5) * 4 * gameScale;
            }

            ctx.drawImage(
                ASSETS.images.pump,
                this.x - (10 * pS) + offX,
                this.y - pHeight / 2 + offY,
                pWidth,
                pHeight
            );
        }

        // ADIM 2: Yakalanan hayvanı çiz (Pompanın/Huninin üstünde görünsün diye sonra çiziyoruz)
        if (this.caughtBall && (this.stuckOnPipe || this.returning)) {
            this.drawCaughtAnimal();
        }
    }

    // Yakalanan hayvanı çiz
    drawCaughtAnimal() {
        if (!this.caughtBall) return;

        let img;
        switch (this.caughtBall.type) {
            case 'chicken':
                img = ASSETS.images.chickenConfused;
                break;
            case 'rabbit':
                img = ASSETS.images.rabbitConfused;
                break;
            case 'cat':
                img = ASSETS.images.catConfused;
                break;
        }

        if (img) {
            // Kullanıcı isteği: Boyut küçülmesin, borudaki boyutunu (pipe.animalSize) korusun
            const size = pipe.animalSize;
            const pS = gun.pumpS || gameScale;
            // Pompanın tam ucundan 10 birim (pS ölçekli) içeri çiziyoruz
            // Böylece huni ağzı hayvanı hafifçe kavramış görünüyor (sıkı yapışma)
            ctx.drawImage(img, this.x + (70 * pS) - (10 * pS), this.y - size / 2, size, size);
        }
    }

    checkCollision(balls) {
        // Yapışık, dönüyor veya aktif değilse kontrol etme
        if (this.stuckOnPipe || this.returning || !this.active) return;

        // Canvas tabanlı collision - ucu (tip) esas al
        const pS = gun.pumpS || gameScale;
        for (let ball of balls) {
            if (ball.caught) continue;

            // Mesafe hesapla (Vantuzun ucu)
            const dx = (this.x + (70 * pS)) - ball.drawX;
            const dy = this.y - ball.drawY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Çarpışma kontrolü (pS ölçekli huniye göre mesafe)
            if (dist < (60 * pS)) {
                // Sadece yakalanabilir (gap bölgesindeki) hayvanlar yakalanır
                if (ball.catchable) {
                    this.catchBall(ball);
                    return;
                }
                // Tüp gövdesine çarptı - yakalayamadı, yapış ve geri dön
                console.log('Tüp gövdesine çarptı - hayvan yakalanamadı');
                this.stickToPipe();
                return;
            }
        }
    }
}

// ==================== TOP (BALL/ANIMAL) SİSTEMİ - DOM TABANLI ====================
class Ball {
    constructor(type, index) {
        this.type = type; // 'chicken', 'rabbit', 'cat'
        this.index = index; // Tüp içindeki sıra
        this.state = 'static'; // 'static', 'blink', 'confused'
        this.element = null;
        this.isInGap = true; // Hayvanlar artık her zaman açık bölgede (segmentler arasında)

        // Göz kırpma animasyonu
        this.blinkTimer = Math.random() * CONFIG.BLINK_INTERVAL;
        this.isBlinking = false;

        this.createElement();
    }

    getImageSrc() {
        switch (this.type) {
            case 'chicken':
                return this.state === 'confused' ? 'animals/confused/Asset 95.png' :
                    this.state === 'blink' ? 'animals/blink/Asset 98.png' :
                        'animals/static/Asset 102.png';
            case 'rabbit':
                return this.state === 'confused' ? 'animals/confused/Asset 97.png' :
                    this.state === 'blink' ? 'animals/blink/Asset 99.png' :
                        'animals/static/Asset 101.png';
            case 'cat':
                return this.state === 'confused' ? 'animals/confused/Asset 96.png' :
                    this.state === 'blink' ? 'animals/blink/Asset 100.png' :
                        'animals/static/Asset 103.png';
        }
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'animal';
        this.element.dataset.type = this.type;

        const img = document.createElement('img');
        img.src = this.getImageSrc();
        img.alt = this.type;
        this.element.appendChild(img);
    }

    updateImage() {
        if (this.element) {
            const img = this.element.querySelector('img');
            if (img) {
                img.src = this.getImageSrc();
            }
        }
    }

    update(deltaTime) {
        if (this.state === 'confused') return;

        // Göz kırpma kontrolü
        this.blinkTimer -= deltaTime;

        if (this.blinkTimer <= 0) {
            if (!this.isBlinking) {
                this.isBlinking = true;
                this.state = 'blink';
                this.blinkTimer = CONFIG.BLINK_DURATION;
            } else {
                this.isBlinking = false;
                this.state = 'static';
                this.blinkTimer = CONFIG.BLINK_INTERVAL + Math.random() * 1000;
            }
            this.updateImage();
        }
    }

    setConfused() {
        this.state = 'confused';
        this.updateImage();
        this.element.classList.add('confused');
    }

    getRect() {
        if (this.element) {
            return this.element.getBoundingClientRect();
        }
        return null;
    }

    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Mobil görünüm tespiti (Dikey mod veya tablet genişliği)
function isMobileView() {
    return window.innerWidth < 1024 || window.innerHeight > window.innerWidth;
}

// ==================== TABANCA (GUN) SİSTEMİ ====================
// Gövde + Pompa (kırmızı huni) SAĞDA + Bacak vidada
class Gun {
    constructor() {
        // Görsel boyutları (temel değerler ölçekle çarpılacak)
        this.baseCatcherWidth = 180;
        this.baseCatcherHeight = 125;
        this.baseLegWidth = 70;
        this.baseLegHeight = 50;

        this.updatePosition();
        this.rotation = 0;
        this.rotationTime = 0;
        this.pumpOffset = 0;
        this.pumpDirection = 1;
    }

    updatePosition() {
        // Pivot noktası
        const isMob = isMobileView();
        // Catcher Ölçeği (PC: 1.5x, Mob: 1x)
        this.cScale = isMob ? gameScale : (gameScale * 1.5);
        const cS = this.cScale;

        // Ölçeklendirilmiş boyutlar
        this.catcherWidth = this.baseCatcherWidth * cS;
        this.catcherHeight = this.baseCatcherHeight * cS;

        // Bacak parçası PC'de biraz daha büyük olsun (Ekstra 1.3x)
        const legS = isMob ? cS : (cS * 1.3);
        this.legWidth = this.baseLegWidth * legS;
        this.legHeight = this.baseLegHeight * legS;
        this.legS = legS; // Çizimde kullanmak için

        // Pompa (pump.png) parçası PC'de biraz daha büyük olsun (Ekstra 1.4x)
        const pumpS = isMob ? cS : (cS * 1.4);
        this.pumpS = pumpS;

        // Pivot noktası
        // (isMob yukarıda tanımlandı)
        const xOffset = isMob ? 0.18 : 0.28;
        this.pivotX = canvasWidth * xOffset;

        // Dikey modda veya dar ekranda uçurum kenarı hizası (%38 alttan -> 0.62 üstten)
        const pivotPct = isMob ? 0.62 : 0.68;
        this.pivotY = canvasHeight * pivotPct;

        // Debug bilgisi
        const debugLabel = document.getElementById('debug-pivot');
        if (debugLabel) {
            debugLabel.textContent = `Y: ${Math.round(pivotPct * 100)}% | Mob: ${isMob}`;
        }
    }

    update() {
        // Yukarı-aşağı salınım (yukarı doğru offset'li)
        this.rotationTime += CONFIG.GUN_ROTATION_SPEED;
        const baseAngle = -20 * Math.PI / 180;  // Temel açı: her iki boşluğa da ulaşabilecek
        this.rotation = baseAngle + Math.sin(this.rotationTime) * (CONFIG.GUN_ROTATION_RANGE * Math.PI / 180);

        // Pompa ileri-geri
        this.pumpOffset += 0.5 * this.pumpDirection;
        if (this.pumpOffset > 15 || this.pumpOffset < 0) {
            this.pumpDirection *= -1;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.pivotX, this.pivotY);

        const cS = this.cScale || gameScale;
        const legS = this.legS || cS;

        // 1. Bacak (çimene sabit, DÖNMEZ - Tam pivotun altına ortalandı)
        if (ASSETS.images.catcherLeg) {
            ctx.drawImage(
                ASSETS.images.catcherLeg,
                -this.legWidth / 2,
                -15 * legS, // Kendi ölçeğiyle orantılı kaydırma
                this.legWidth,
                this.legHeight + (60 * legS)
            );
        }

        // 2. Dönen kısım (gövde + pompa)
        ctx.save();
        ctx.rotate(this.rotation);

        // 3. Gövde (catcher.png) 
        // Vidanın yerini tam tutturmak için gövdeyi orantılı kaydırdık
        if (ASSETS.images.catcher) {
            ctx.drawImage(
                ASSETS.images.catcher,
                -95 * cS,
                -92 * cS,
                this.catcherWidth,
                this.catcherHeight
            );
        }

        // 4. Pompa ve İp hizalaması
        const pumpS = this.pumpS || cS;
        const pWidth = 80 * pumpS;
        const pHeight = 55 * pumpS;

        // İp başlangıç noktası
        const rStartX = 70 * cS;
        const rY = -40 * cS;

        const pX = rStartX + (50 * cS);
        const pY = rY - (pHeight / 2);

        // Plunger aktif değilse pompa yerinde
        if (typeof plunger === 'undefined' || !plunger.active) {
            // Hafif sarkık ip çiz (Idle durumu) -> KULLANICI İSTEĞİ: DÜMDÜZ olsun
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 6 * cS;
            ctx.beginPath();
            // İp başlangıcını hafif aşağı al (Sapın tam arkasına denk gelmesi için)
            const alignY = rY + (2 * cS);
            ctx.moveTo(rStartX, alignY);
            ctx.lineTo(pX, alignY);
            ctx.stroke();

            // Pompa (pump.png)
            if (ASSETS.images.pump) {
                ctx.drawImage(
                    ASSETS.images.pump,
                    pX - (10 * cS),
                    pY + (2 * cS), // Pompayı hafif yukarı al (+2) - İnce ayar
                    pWidth,
                    pHeight
                );
            }
        }
        ctx.restore();
        ctx.restore();
    }

    // Pompanın uç noktası (ateşleme başlangıcı)
    getPlungerStartPos() {
        const cS = this.cScale || gameScale;
        // İp çıkış noktası: Tam sapın arkası
        const pEndX = (70 * cS); // İpin çıktığı yer
        const pEndY = -40 * cS + (2 * cS); // Y ekseninde az aşağı kaydır (+2) - İp sabit
        const cosR = Math.cos(this.rotation);
        const sinR = Math.sin(this.rotation);
        return {
            x: this.pivotX + pEndX * cosR - pEndY * sinR,
            y: this.pivotY + pEndX * sinR + pEndY * cosR
        };
    }

    // İpin başlangıç noktası (catcher gövdesinin önü)
    getRopeStartPos() {
        const cS = this.cScale || gameScale;
        const ropeStartX = 70 * cS;
        const ropeStartY = -40 * cS;
        const cosR = Math.cos(this.rotation);
        const sinR = Math.sin(this.rotation);
        return {
            x: this.pivotX + ropeStartX * cosR - ropeStartY * sinR,
            y: this.pivotY + ropeStartX * sinR + ropeStartY * cosR
        };
    }
}

// ==================== TÜP (PIPE) SİSTEMİ - GÖRSEL TABANLI ====================
// Tarife göre: Üst bölüm (2 hayvan) + Orta bölüm (2 hayvan) + Alt bölüm (2 hayvan)
class Pipe {
    constructor() {
        this.balls = [];
        // Mobilde daha fazla hayvan
        this.animalCount = isMobileView() ? 22 : 14;

        this.x = 0;
        this.pipeWidth = 0;
        this.capWidth = 0;
        this.ovalRingWidth = 0;
        this.animalSize = 0;
        this.animalSpacing = 0;
        this.upperHeight = 0;
        this.midHeight = 0;
        this.lowerHeight = 0;

        this.gap1Start = 0;
        this.gap1End = 0;
        this.gap2Start = 0;
        this.gap2End = 0;

        this.updatePosition();
    }

    updatePosition() {
        const isMob = isMobileView();
        // PC ekranı için daha da büyütüldü (1.5 -> 1.8 kat)
        // Mobilde de artık daha büyük (gameScale -> gameScale * 1.3)
        const pScale = isMob ? (gameScale * 1.3) : (gameScale * 1.8);
        this.pScale = pScale; // Diğer çizimlerde kullanmak için kaydet
        const xOffset = isMob ? 0.83 : 0.81; // Boru kalınlaştığı için mobil ofseti hafif artırıldı
        this.x = canvasWidth * xOffset;
        this.canvasWidth = canvasWidth;

        // Boyutları güncelle (pScale bazlı)
        this.pipeWidth = 95 * pScale;
        this.capWidth = 115 * pScale;
        this.ovalRingWidth = 125 * pScale;
        this.animalSize = 75 * pScale;
        this.animalSpacing = 70 * pScale;

        // Yükseklik limitleri ve dinamik hesaplama (Mobilde 2'şer hayvanlık boşluk bırakmak için)
        if (isMob) {
            const baseTotalHeight = canvasHeight / gameScale;
            const yOffsetBase = -150;
            const targetGapBase = 140;
            const midRingBase = 100;

            const totalRequiredGap = (targetGapBase * 2) + midRingBase;
            const remainingForPipes = baseTotalHeight - yOffsetBase - totalRequiredGap;

            this.upperHeight = (remainingForPipes * 0.45) * gameScale;
            this.lowerHeight = (remainingForPipes * 0.55) * gameScale;
            this.midHeight = midRingBase * gameScale;
        } else {
            // PC için Dinamik Yükseklik (Ekrana sığması için hesaplamalı)
            const baseTotalHeight = canvasHeight / pScale;
            const yOffsetBase = -50; // PC'de üst boşluk daha az
            const targetGapBase = 140;
            const midRingBase = 80; // Kullanıcı isteği: Boyu kısaltıldı (100 -> 80)

            const totalRequiredGap = (targetGapBase * 2) + midRingBase;
            const remainingForPipes = Math.max(200, baseTotalHeight - yOffsetBase - totalRequiredGap);

            this.upperHeight = (remainingForPipes * 0.40) * pScale;
            this.lowerHeight = (remainingForPipes * 0.50) * pScale; // Kullanıcı isteği: Boyu kısaltıldı (0.60 -> 0.50)
            this.midHeight = midRingBase * pScale;
        }
    }

    // Tüpü çiz - Tarife göre katman katman
    draw(ctx) {
        const x = this.x;
        const w = this.pipeWidth;
        const capW = this.capWidth;
        const ovalW = this.ovalRingWidth;

        const isMob = isMobileView();
        const yOffset = isMob ? -150 : -80;
        const upperY = yOffset * gameScale;

        // Alt tüp sayfanın EN ALTINA yapışık
        const lowerY = canvasHeight - this.lowerHeight;

        // Orta yüzük - iki tüpün TAM ORTASINDA
        // Orta yüzük - PC'de biraz daha aşağı kaydırıldı (Denge için)
        const upperEnd = upperY + this.upperHeight;
        const gapSize = lowerY - upperEnd;
        const pS = this.pScale || gameScale;
        const midShift = isMob ? 0 : (25 * pS); // PC'de aşağı taşıma miktarı
        const midY = upperEnd + (gapSize - this.midHeight) / 2 + midShift;

        this.gap1Start = upperEnd;
        this.gap1End = midY;
        this.gap2Start = midY + this.midHeight;
        this.gap2End = lowerY;

        // ========================================
        // ADIM 1: TÜM ARKA PARÇALARI ÇİZ
        // ========================================

        if (ASSETS.images.pipeMidUpperBack) {
            ctx.drawImage(ASSETS.images.pipeMidUpperBack, x - ovalW / 2, upperY + this.upperHeight - (5 * gameScale), ovalW, 50 * gameScale);
            ctx.drawImage(ASSETS.images.pipeMidUpperBack, x - ovalW / 2, midY - 15, ovalW, 40);
        }

        if (ASSETS.images.pipeLowerBack) {
            ctx.drawImage(ASSETS.images.pipeLowerBack, x - ovalW / 2, midY + this.midHeight - 25, ovalW, 50);
            ctx.drawImage(ASSETS.images.pipeLowerBack, x - ovalW / 2, lowerY - 20, ovalW, 50);
        }

        // ========================================
        // ADIM 2: HAYVANLARI ÇİZ
        // ========================================
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - w / 2, 0, w, canvasHeight);
        ctx.clip();

        const startY = -this.animalSize / 2;
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            if (ball.caught) continue;

            const targetY = startY + (i * this.animalSpacing) + this.animalSpacing / 2;
            if (ball.currentY === undefined) ball.currentY = targetY;

            ball.drawX = this.x;
            ball.drawY = ball.currentY;

            const inGap1 = ball.drawY > this.gap1Start && ball.drawY < this.gap1End;
            const inGap2 = ball.drawY > this.gap2Start && ball.drawY < this.gap2End;
            ball.catchable = inGap1 || inGap2;

            this.drawAnimal(ctx, ball, this.x, ball.drawY);
        }
        ctx.restore();

        // ========================================
        // ADIM 3: ANA TÜP GÖVDELERİ
        // ========================================

        if (ASSETS.images.pipeUpper) {
            // Mobilde boruyu aşağı uzat (Joint halkasının altına kadar)
            const extraReach = isMob ? 25 * gameScale : 35 * gameScale;
            ctx.drawImage(ASSETS.images.pipeUpper, x - w / 2, upperY, w, this.upperHeight + extraReach);
        }

        if (ASSETS.images.pipeMidRing) {
            ctx.drawImage(ASSETS.images.pipeMidRing, x - w / 2, midY, w, this.midHeight + (15 * gameScale));
        }

        if (ASSETS.images.pipeLower) {
            // Mobilde boruyu yukarı uzat (Eklem halkasını geçmeyecek şekilde daha da kısalttık: 25 -> 10)
            const extraReach = isMob ? 10 * gameScale : 0;
            ctx.drawImage(ASSETS.images.pipeLower, x - w / 2, lowerY - extraReach, w, this.lowerHeight + extraReach + 50);
        }

        // ========================================
        // ADIM 4: TÜM ÖN PARÇALARI ÇİZ (EN ÜSTTE - HER ŞEYİN ÜSTÜNDE)

        // 1. Üst tüpün ALT kısmı eklemi
        if (ASSETS.images.pipeMidUpperFront) {
            // Kullanıcı isteği: Kenarlardan biraz daraltıldı (152 -> 142)
            ctx.drawImage(ASSETS.images.pipeMidUpperFront, x - (142 * pS) / 2, upperY + this.upperHeight + (5 * pS), 142 * pS, 50 * pS);
        }

        // 2. Orta yüzük ÜST eklemi
        if (ASSETS.images.pipeMidUpperFront) {
            // Kullanıcı isteği: Minicik daha daraltıldı (148 -> 142)
            ctx.drawImage(ASSETS.images.pipeMidUpperFront, x - (142 * pS) / 2, midY - (5 * pS), 142 * pS, 52 * pS);
        }

        // 3. Orta yüzük ALT eklemi
        if (ASSETS.images.pipeMidUpperFront) {
            // Kullanıcı isteği: Aşağı doğru eni (yüksekliği) daraltıldı (64 -> 56)
            // Konum minicik yukarı kaydırıldı (-5 -> -8)
            ctx.drawImage(ASSETS.images.pipeMidUpperFront, x - (142 * pS) / 2, midY + this.midHeight - (8 * pS), 142 * pS, 56 * pS);
        }

        // 4. Alt tüp üst eklemi
        if (ASSETS.images.pipeMidUpperFront) {
            // Kullanıcı isteği: Aşağı doğru eni (yüksekliği) daraltıldı (72 -> 62)
            ctx.drawImage(ASSETS.images.pipeMidUpperFront, x - (144 * pS) / 2, lowerY - (8 * pS), 144 * pS, 62 * pS);
        }
    }

    // Pozisyona göre vuruş yapılacak X koordinatını dön (Halka mı, gövde mi?)
    getHitX(y) {
        const pS = this.pScale || gameScale;
        const w = this.pipeWidth;
        const x = this.x;

        const isMob = isMobileView();
        const yOffset = isMob ? -150 : -80;
        const upperY = yOffset * gameScale;
        const lowerY = canvasHeight - this.lowerHeight;
        const upperEnd = upperY + this.upperHeight;
        const gapSize = lowerY - upperEnd;
        const midShift = isMob ? 0 : (25 * pS);
        const midY = upperEnd + (gapSize - this.midHeight) / 2 + midShift;

        // Halkaların Y aralıklarını kontrol et
        const rings = [
            { y: upperY + this.upperHeight + (5 * pS), h: 50 * pS, w: 142 * pS },
            { y: midY - (5 * pS), h: 52 * pS, w: 142 * pS },
            { y: midY + this.midHeight - (8 * pS), h: 56 * pS, w: 142 * pS },
            { y: lowerY - (8 * pS), h: 62 * pS, w: 144 * pS }
        ];

        for (let ring of rings) {
            // Halka algılamasını daralt (Sadece tam ortasına gelirse halka saysın)
            // Kenarlarına gelirse "Gövde" saysın ki içeri daha çok gömülsün
            const safeZone = ring.h * 0.2;
            if (y >= ring.y + safeZone && y <= ring.y + ring.h - safeZone) {
                // Halka kenarı - HALKA OFFSET (+35)
                return (x - ring.w / 2) + (35 * gameScale);
            }
        }

        // Normal gövde kenarı - MERKEZE KİLİTLEME (BOŞLUKSUZ)
        // Kenar falan hesaplama, direkt borunun tam ortasına (bu.x) yapıştır.
        // Böylece pompa borunun içine kadar girer ve arada boşluk kalma ihtimali SIFIR olur.
        return this.x;
    }

    // Belirli bölümdeki hayvanları çiz
    drawAnimalsInSection(ctx, startIndex, endIndex, sectionY, sectionHeight, catchable = false) {
        const animalsInSection = Math.min(endIndex, this.balls.length) - startIndex;
        if (animalsInSection <= 0) {
            return;
        }

        const spacing = sectionHeight / (animalsInSection + 1);

        for (let i = startIndex; i < Math.min(endIndex, this.balls.length); i++) {
            const ball = this.balls[i];
            if (ball.caught) continue;

            const localIndex = i - startIndex;
            const ballY = sectionY + spacing * (localIndex + 1);

            ball.drawX = this.x;
            ball.drawY = ballY;
            ball.catchable = catchable;  // Bu hayvan yakalanabilir mi?

            this.drawAnimal(ctx, ball, this.x, ballY);
        }
    }

    // Hayvan çiz
    drawAnimal(ctx, ball, x, y) {
        if (!this.debugDraw) {
            console.log('drawAnimal çağrıldı:', ball.type, 'x:', x, 'y:', y);
            this.debugDraw = true;
        }

        let img;
        switch (ball.type) {
            case 'chicken':
                img = ball.state === 'confused' ? ASSETS.images.chickenConfused :
                    ball.state === 'blink' ? ASSETS.images.chickenBlink :
                        ASSETS.images.chickenStatic;
                break;
            case 'rabbit':
                img = ball.state === 'confused' ? ASSETS.images.rabbitConfused :
                    ball.state === 'blink' ? ASSETS.images.rabbitBlink :
                        ASSETS.images.rabbitStatic;
                break;
            case 'cat':
                img = ball.state === 'confused' ? ASSETS.images.catConfused :
                    ball.state === 'blink' ? ASSETS.images.catBlink :
                        ASSETS.images.catStatic;
                break;
        }

        if (img) {
            const size = this.animalSize;
            ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        } else {
            // Görsel yoksa kırmızı daire çiz (debug)
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Tüpü hayvanlarla doldur
    buildPipe(animalTypes) {
        this.balls = [];
        animalTypes.forEach((type, index) => {
            const ball = {
                type: type,
                index: index,
                state: 'static',
                caught: false,
                catchable: false,
                drawX: 0,
                drawY: 0,
                currentY: -200 - (index * 100), // Başlangıçta ekranın çok yukarısında, sıralı
                blinkTimer: Math.random() * 2000,
                isBlinking: false
            };
            this.balls.push(ball);
        });
    }

    generateBalls() {
        // Dinamik hayvan sayısı: Ekran boyuna göre kaç tane sığarsa (biraz da ekstra)
        const requiredHeight = canvasHeight / gameScale;
        this.animalCount = Math.ceil(requiredHeight / (this.animalSpacing / gameScale)) + 10;

        console.log('generateBalls - Dinamik hayvan sayısı:', this.animalCount);

        // Tüpü hayvanlarla doldur
        const allTypes = ['chicken', 'rabbit', 'cat'];
        const animalList = [];

        // Tüpü doldur
        for (let i = 0; i < this.animalCount; i++) {
            animalList.push(allTypes[i % allTypes.length]);
        }

        // Karıştır
        this.shuffleArray(animalList);

        // Tüpü oluştur
        this.buildPipe(animalList);
    }

    // Yeni hayvan ekle (üstten)
    addNewAnimal() {
        const allTypes = ['chicken', 'rabbit', 'cat'];
        const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
        const newBall = {
            type: randomType,
            index: 0,
            state: 'static',
            caught: false,
            catchable: false,
            drawX: 0,
            drawY: 0,
            currentY: -150, // Ekranın üstünden inmesi için (biraz yukardan)
            blinkTimer: Math.random() * 2000,
            isBlinking: false
        };
        this.balls.unshift(newBall);
        // İndeksleri güncelle
        this.balls.forEach((b, i) => b.index = i);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    removeBall(ball) {
        const index = this.balls.indexOf(ball);
        if (index > -1) {
            this.balls.splice(index, 1);
        }
    }

    // Yakalanan hayvanı yenisiyle değiştir (sadece aşağı akış animasyonu için)
    replaceBall(ball) {
        const index = this.balls.indexOf(ball);
        if (index > -1) {
            // 1. Önce en üste yeni hayvan ekle (her şey 1 index aşağı kayar)
            this.addNewAnimal();
            // 2. Yakalanan hayvanın yeni index'i (index + 1) olur, onu kaldır
            // Bu sayede yakalanan yerin altındaki hayvanların index'i değişmez (önce +1 sonra -1)
            // Sadece üsttekiler (+1) aşağı kaymış olur.
            this.balls.splice(index + 1, 1);

            // İndeksleri güncelle
            this.balls.forEach((b, i) => b.index = i);
        }
    }

    update(deltaTime) {
        // Pozisyon güncelleme (Sliding animation)
        const startY = -this.animalSize / 2;
        const animationSpeed = 0.08; // Akıcılık hızı

        this.balls.forEach((ball, i) => {
            const targetY = startY + (i * this.animalSpacing) + this.animalSpacing / 2;

            if (ball.currentY === undefined) ball.currentY = targetY;

            // Lerp ile yumuşak geçiş
            const diff = targetY - ball.currentY;
            if (Math.abs(diff) > 0.1) {
                ball.currentY += diff * animationSpeed;
            } else {
                ball.currentY = targetY;
            }

            // Göz kırpma animasyonu
            if (ball.state === 'confused' || ball.caught) return;
            // ... (rest of the logic remains same but I will replace the whole block)
            ball.blinkTimer -= deltaTime;
            if (ball.blinkTimer <= 0) {
                if (!ball.isBlinking) {
                    ball.isBlinking = true;
                    ball.state = 'blink';
                    ball.blinkTimer = 200;
                } else {
                    ball.isBlinking = false;
                    ball.state = 'static';
                    ball.blinkTimer = 2000 + Math.random() * 1000;
                }
            }
        });
    }

    // Tüm toplar açık bölgede
    getBallsInGaps() {
        return this.balls.filter(b => !b.caught);
    }

    // Belirli pozisyondaki topu bul
    getBallAtPosition(x, y) {
        for (let ball of this.balls) {
            if (ball.caught) continue;
            const dx = x - ball.drawX;
            const dy = y - ball.drawY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.animalSize / 2 + 20) {
                return ball;
            }
        }
        return null;
    }
}

// ==================== SORU SİSTEMİ ====================
// Sorular doğrudan JavaScript'e gömüldü (CORS sorunu için)
const QUESTIONS_DATA = [
    {
        id: 1, text: "Hangi hayvan 'miyav' diye ses çıkarır?", answers: [
            { text: "Kedi", correct: true }, { text: "Köpek", correct: false },
            { text: "Kuş", correct: false }, { text: "Tavşan", correct: false }
        ]
    },
    {
        id: 2, text: "Gökkuşağında kaç renk vardır?", answers: [
            { text: "5", correct: false }, { text: "7", correct: true },
            { text: "9", correct: false }, { text: "3", correct: false }
        ]
    },
    {
        id: 3, text: "Hangi meyve sarı renklidir?", answers: [
            { text: "Elma", correct: false }, { text: "Muz", correct: true },
            { text: "Üzüm", correct: false }, { text: "Kiraz", correct: false }
        ]
    },
    {
        id: 4, text: "Bir yılda kaç ay vardır?", answers: [
            { text: "10", correct: false }, { text: "11", correct: false },
            { text: "12", correct: true }, { text: "13", correct: false }
        ]
    },
    {
        id: 5, text: "Güneş hangi yönden doğar?", answers: [
            { text: "Batı", correct: false }, { text: "Kuzey", correct: false },
            { text: "Güney", correct: false }, { text: "Doğu", correct: true }
        ]
    },
    {
        id: 6, text: "Hangi hayvan yumurtadan çıkar?", answers: [
            { text: "Köpek", correct: false }, { text: "Kedi", correct: false },
            { text: "Civciv", correct: true }, { text: "Tavşan", correct: false }
        ]
    },
    {
        id: 7, text: "2 + 3 kaç eder?", answers: [
            { text: "4", correct: false }, { text: "5", correct: true },
            { text: "6", correct: false }, { text: "7", correct: false }
        ]
    },
    {
        id: 8, text: "Hangi mevsimde kar yağar?", answers: [
            { text: "Yaz", correct: false }, { text: "İlkbahar", correct: false },
            { text: "Sonbahar", correct: false }, { text: "Kış", correct: true }
        ]
    },
    {
        id: 9, text: "Arılar ne üretir?", answers: [
            { text: "Süt", correct: false }, { text: "Bal", correct: true },
            { text: "Yumurta", correct: false }, { text: "Peynir", correct: false }
        ]
    },
    {
        id: 10, text: "Bir haftada kaç gün vardır?", answers: [
            { text: "5", correct: false }, { text: "6", correct: false },
            { text: "7", correct: true }, { text: "8", correct: false }
        ]
    },
    {
        id: 11, text: "Hangi hayvan 'hav hav' diye havlar?", answers: [
            { text: "Kedi", correct: false }, { text: "Kuş", correct: false },
            { text: "Köpek", correct: true }, { text: "Balık", correct: false }
        ]
    },
    {
        id: 12, text: "4 x 2 kaç eder?", answers: [
            { text: "6", correct: false }, { text: "7", correct: false },
            { text: "8", correct: true }, { text: "9", correct: false }
        ]
    },
    {
        id: 13, text: "Hangi hayvan suda yaşar?", answers: [
            { text: "Kedi", correct: false }, { text: "Balık", correct: true },
            { text: "Kuş", correct: false }, { text: "Tavşan", correct: false }
        ]
    },
    {
        id: 14, text: "Türkiye'nin başkenti neresidir?", answers: [
            { text: "İstanbul", correct: false }, { text: "Ankara", correct: true },
            { text: "İzmir", correct: false }, { text: "Bursa", correct: false }
        ]
    },
    {
        id: 15, text: "Bir üçgenin kaç köşesi vardır?", answers: [
            { text: "2", correct: false }, { text: "3", correct: true },
            { text: "4", correct: false }, { text: "5", correct: false }
        ]
    }
];

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        GameState.questions = shuffleArray([...data.questions]);
        console.log('Sorular JSON dosyasından yüklendi:', GameState.questions.length);
    } catch (error) {
        console.warn('questions.json yüklenemedi, yerel veriler kullanılıyor:', error.message);
        // Soruları doğrudan kullan (CORS veya dosya hatası durumunda)
        GameState.questions = shuffleArray([...QUESTIONS_DATA]);
        console.log('Yerel sorular yüklendi:', GameState.questions.length);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion() {
    console.log('showQuestion çağrıldı', GameState.questions.length, 'soru var');
    GameState.currentScreen = 'question';

    // Rastgele soru seç
    if (GameState.questions.length === 0) {
        console.log('Sorular yükleniyor...');
        loadQuestions().then(() => showQuestion());
        return;
    }

    const questionIndex = (GameState.currentRound - 1) % GameState.questions.length;
    GameState.currentQuestion = GameState.questions[questionIndex];
    console.log('Seçilen soru:', GameState.currentQuestion);

    const modal = document.getElementById('question-modal');
    const questionText = document.getElementById('question-text');
    const questionImageContainer = document.getElementById('question-image-container');
    const answersContainer = document.getElementById('answers-container');
    const feedbackContainer = document.getElementById('feedback-container');

    // Soruyu göster
    questionText.textContent = GameState.currentQuestion.text;

    // Soru görseli varsa göster
    questionImageContainer.innerHTML = '';
    if (GameState.currentQuestion.image) {
        const img = document.createElement('img');
        img.src = GameState.currentQuestion.image;
        questionImageContainer.appendChild(img);
    }

    // Cevapları oluştur
    answersContainer.innerHTML = '';
    const shuffledAnswers = shuffleArray([...GameState.currentQuestion.answers]);

    shuffledAnswers.forEach((answer) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';

        if (answer.image) {
            const img = document.createElement('img');
            img.src = answer.image;
            btn.appendChild(img);
        }

        const text = document.createElement('span');
        text.textContent = answer.text;
        btn.appendChild(text);

        btn.addEventListener('click', () => handleAnswer(answer, btn));
        answersContainer.appendChild(btn);
    });

    // Feedback'i gizle
    feedbackContainer.classList.add('hidden');
    feedbackContainer.classList.remove('correct', 'wrong');

    // Modalı göster
    modal.classList.add('active');

    // Zamanlayıcıyı başlat
    startQuestionTimer();
}

function startQuestionTimer() {
    GameState.timeRemaining = CONFIG.QUESTION_TIME;
    updateTimerDisplay();

    if (GameState.questionTimer) {
        clearInterval(GameState.questionTimer);
    }

    GameState.questionTimer = setInterval(() => {
        GameState.timeRemaining -= 0.1;
        updateTimerDisplay();

        if (GameState.timeRemaining <= 0) {
            clearInterval(GameState.questionTimer);
            handleTimeout();
        }
    }, 100);
}

function updateTimerDisplay() {
    const timerBar = document.getElementById('timer-bar');
    const timerText = document.getElementById('timer-text');

    const percentage = (GameState.timeRemaining / CONFIG.QUESTION_TIME) * 100;
    timerBar.style.width = percentage + '%';
    timerText.textContent = Math.ceil(GameState.timeRemaining);

    // Renk değişimi
    timerBar.classList.remove('warning', 'danger');
    if (percentage <= 30) {
        timerBar.classList.add('danger');
    } else if (percentage <= 50) {
        timerBar.classList.add('warning');
    }
}

function handleAnswer(answer, btn) {
    clearInterval(GameState.questionTimer);

    // Tüm butonları devre dışı bırak
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');

    if (answer.correct) {
        // Doğru cevap
        AUDIO_MANAGER.play('correct');
        btn.classList.add('correct');
        feedbackContainer.classList.remove('hidden', 'wrong');
        feedbackContainer.classList.add('correct');

        // Puanları hesapla
        const isLate = GameState.timeRemaining <= 0;
        const basePoints = 10; // Süre bitse de doğru cevap için 10 puan verir
        const timeBonus = isLate ? 0 : Math.floor(GameState.timeRemaining);

        // Feedback metnini kaldır (Kullanıcı isteği: Yazı yazmasın)
        feedbackText.textContent = "";

        // Puanları ekle
        GameState.score += (basePoints + timeBonus);
        GameState.correctAnswers++;
        GameState.canShoot = true;

        // Ekranda her iki puanı da ayrı ayrı göster
        // Ekranda her iki puanı da ayrı ayrı göster (Dikey sırada: Üstte Kupa, Altta Saat)
        showPointsPopup(basePoints, canvasWidth / 2, canvasHeight / 2 - 50, 'trophy');
        // Saat figürünü kupa figürünün alt satırına getiriyoruz (y ofsetini artırdık)
        showPointsPopup(timeBonus, canvasWidth / 2, canvasHeight / 2 + 80, 'clock');

        updateUI();

        // Atış moduna geç
        setTimeout(() => {
            hideQuestionModal();
            startShootingPhase();
        }, 1500);

    } else {
        // Yanlış cevap
        AUDIO_MANAGER.play('wrong');
        btn.classList.add('wrong');
        feedbackContainer.classList.remove('hidden', 'correct');
        feedbackContainer.classList.add('wrong');
        feedbackText.textContent = "";

        // Doğru cevabı göster
        document.querySelectorAll('.answer-btn').forEach(b => {
            const text = b.querySelector('span').textContent;
            const correctAnswer = GameState.currentQuestion.answers.find(a => a.correct);
            if (text === correctAnswer.text) {
                b.classList.add('correct');
            }
        });

        // Tur ilerler (yanlış cevap = o tur kaybedildi)
        setTimeout(() => {
            hideQuestionModal();
            nextRound();
        }, 2000);
    }
}

function handleTimeout() {
    // Kullanıcı isteği: Süre bitince soru değişmesin, sadece puan sıfır olsun.
    // Bu yüzden süre bittiğinde hiçbir şeyi kilitlemiyor veya kapatmıyoruz.
    // handleAnswer içindeki 'isLate' kontrolü puanlamayı halledecek.
    console.log('Süre doldu, cevap bekleniyor (Puan: 0)');
}

function hideQuestionModal() {
    document.getElementById('question-modal').classList.remove('active');
}

// ==================== ATIŞ AŞAMASI ====================
function startShootingPhase() {
    console.log('Atış fazı başladı - tıklayarak ateş edebilirsiniz');
    GameState.currentScreen = 'shooting';
    GameState.canShoot = true;
    GameState.isShooting = false;
}

function handleShoot() {
    console.log('Tıklama algılandı:', {
        canShoot: GameState.canShoot,
        isShooting: GameState.isShooting,
        currentScreen: GameState.currentScreen
    });

    if (!GameState.canShoot || GameState.isShooting) {
        console.log('Atış engellendi - canShoot:', GameState.canShoot, 'isShooting:', GameState.isShooting);
        return;
    }
    if (GameState.currentScreen !== 'shooting') {
        console.log('Atış engellendi - currentScreen:', GameState.currentScreen);
        return;
    }

    console.log('ATEŞ!');
    GameState.canShoot = false;
    GameState.isShooting = true;
    AUDIO_MANAGER.play('shoot');

    const startPos = gun.getPlungerStartPos();
    console.log('Plunger başlangıç pozisyonu:', startPos);
    plunger.fire(startPos.x, startPos.y);
}

function nextRound() {
    GameState.currentRound++;

    if (GameState.currentRound > CONFIG.TOTAL_ROUNDS) {
        endGame();
        return;
    }

    updateUI();
    showQuestion();
}

// ==================== UI GÜNCELLEME ====================
function updateUI() {
    document.getElementById('level-text').textContent = `${GameState.currentRound}/${CONFIG.TOTAL_ROUNDS}`;
    document.getElementById('score-text').textContent = GameState.score;
}

// ==================== OYUN SONU ====================
function endGame() {
    GameState.currentScreen = 'end';

    // 1. ÖZET EKRANI (ADIM 1) - Sessiz ve butonsuz
    document.getElementById('summary-score-value').textContent = GameState.score;
    document.getElementById('summary-correct-answers').textContent = GameState.correctAnswers;
    document.getElementById('summary-successful-catches').textContent = GameState.successfulCatches;

    document.getElementById('summary-modal').classList.add('active');

    // 3 Saniye sonra kutlamaya geç
    setTimeout(() => {
        // Özet modalını kapat
        document.getElementById('summary-modal').classList.remove('active');

        // 2. KUTLAMA EKRANI (ADIM 2) - Müzikli ve Konfetili
        showCelebrationScreen();
    }, 3000);
}

function showCelebrationScreen() {
    GameState.currentScreen = 'celebration';

    // Puanı ayarla
    document.getElementById('final-score-value').textContent = GameState.score;

    // Ekranı göster
    document.getElementById('celebration-screen').classList.add('active');

    // Müzik ve konfeti başlat
    AUDIO_MANAGER.play('celebration');
    startConfetti();
}

let confettiInterval;
function startConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    confettiInterval = setInterval(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 8 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.animationDuration = Math.random() * 2 + 3 + 's';

        container.appendChild(confetti);

        // Animasyon bitince temizle
        setTimeout(() => confetti.remove(), 5000);
    }, 100);
}

function stopConfetti() {
    if (confettiInterval) {
        clearInterval(confettiInterval);
        document.getElementById('confetti-container').innerHTML = '';
    }
}

// ==================== ANA OYUN DÖNGÜSÜ ====================
let lastTime = 0;
let gun, plunger, pipe;
let flyingAnimals = []; // Uçan hayvanlar listesi

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Temizle
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Arka plan çiz
    drawBackground();

    // Bulutları güncelle ve çiz
    clouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
    });

    // Oyun ekranındaysa
    if (GameState.currentScreen === 'game' ||
        GameState.currentScreen === 'shooting' ||
        GameState.currentScreen === 'question') {

        // Zemin hayvanları (catcher'ın arkasında)
        updateGroundAnimals(deltaTime);
        drawGroundAnimals();

        // Tüp güncelle ve çiz (canvas tabanlı)
        pipe.update(deltaTime);
        pipe.draw(ctx);

        // Tabanca güncelle ve çiz
        gun.update();
        gun.draw();

        // Vantuz güncelle ve çiz
        plunger.update();
        plunger.checkCollision(pipe.balls);
        plunger.draw();

        // Uçan hayvanları güncelle ve çiz
        updateAndDrawFlyingAnimals(deltaTime);
    }

    requestAnimationFrame(gameLoop);
}

// Uçan hayvanları güncelle ve çiz
function updateAndDrawFlyingAnimals(deltaTime) {
    for (let i = flyingAnimals.length - 1; i >= 0; i--) {
        const animal = flyingAnimals[i];

        // Animasyon güncelle (yavaşlatıldı)
        animal.time += deltaTime;
        animal.y = animal.startY - (animal.time * 0.15); // Yukarı uç (yavaş)

        // Kullanıcı isteği: Boyut sabit kalsın, büyüme/küçülme olmasın
        animal.scale = 1;
        animal.opacity = 1 - (animal.time / 2500); // Soluklaş (yavaş)

        // Animasyon bittiyse kaldır
        if (animal.opacity <= 0) {
            flyingAnimals.splice(i, 1);
            continue;
        }

        // Çiz
        let img;
        switch (animal.type) {
            case 'chicken': img = ASSETS.images.chickenConfused; break;
            case 'rabbit': img = ASSETS.images.rabbitConfused; break;
            case 'cat': img = ASSETS.images.catConfused; break;
        }

        if (img) {
            ctx.save();
            ctx.globalAlpha = animal.opacity;
            ctx.translate(animal.x, animal.y);
            ctx.scale(animal.scale, animal.scale);
            // Boyut borudaki orijinal boyut olsun
            const size = pipe.animalSize;
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }
    }
}

function drawBackground() {
    // Gradient gökyüzü (arka plan görseli yoksa görünür)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#98D8C8');
    gradient.addColorStop(1, '#7CB342');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Arka plan görseli - "Cover" mantığıyla sığdır (yakınlaştır)
    if (ASSETS.images.background) {
        const img = ASSETS.images.background;
        const imgRatio = img.width / img.height || 16 / 9;
        const canvasRatio = (canvasWidth / canvasHeight) || 1;

        let drawW = canvasWidth, drawH = canvasHeight, drawX = 0, drawY = 0;

        if (canvasRatio > imgRatio) {
            drawW = canvasWidth;
            drawH = canvasWidth / imgRatio;
            drawX = 0;
            drawY = (canvasHeight - drawH) / 2;
        } else {
            drawH = canvasHeight;
            drawW = canvasHeight * imgRatio;
            drawY = 0;
            drawX = (canvasWidth - drawW) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // Güneş
    if (ASSETS.images.sun) {
        const sunSize = 100 * gameScale;
        ctx.drawImage(ASSETS.images.sun, canvasWidth - sunSize - (50 * gameScale), 30 * gameScale, sunSize, sunSize);
    }
}

// ==================== OYUN BAŞLATMA ====================
async function initGame() {
    console.log('initGame başladı');
    initCanvas();
    console.log('Canvas boyutları:', canvasWidth, canvasHeight);

    // Assetleri yükle
    await ASSETS.load();
    console.log('Assetler yüklendi');

    // Soruları yükle
    await loadQuestions();
    console.log('Sorular yüklendi:', GameState.questions.length);

    // Oyun nesnelerini oluştur
    gun = new Gun();
    plunger = new Plunger();
    pipe = new Pipe();
    console.log('Oyun nesneleri oluşturuldu');

    // Bulutları oluştur
    initClouds();
    // Zemin hayvanlarını
    initGroundAnimals();
    AUDIO_MANAGER.init();

    // Intro animasyonu başlat
    initIntroAnimation();
    requestAnimationFrame(introAnimLoop);

    // Event listener'ları ekle
    setupEventListeners();

    // Oyun döngüsünü başlat
    requestAnimationFrame(gameLoop);
}

function setupEventListeners() {
    // Play butonu
    document.getElementById('play-button').addEventListener('click', startGame);

    // Restart butonu
    document.getElementById('restart-button').addEventListener('click', restartGame);

    // Atış için tıklama - DOCUMENT seviyesinde
    document.addEventListener('click', (e) => {
        // Modal açıksa veya intro ekranındaysa atış yapma
        if (GameState.currentScreen === 'shooting') {
            // Sadece butonlara tıklanmadıysa
            if (!e.target.closest('button') && !e.target.closest('.answer-btn')) {
                handleShoot();
            }
        }
    });

    document.addEventListener('touchstart', (e) => {
        if (GameState.currentScreen === 'shooting') {
            if (!e.target.closest('button') && !e.target.closest('.answer-btn')) {
                e.preventDefault();
                handleShoot();
            }
        }
    });
}

function startGame() {
    console.log('startGame çağrıldı');

    // Giriş ekranını gizle
    document.getElementById('intro-screen').classList.remove('active');

    // Oyun ekranını göster
    document.getElementById('game-screen').classList.add('active');

    // Oyun durumunu sıfırla
    GameState.reset();
    GameState.currentScreen = 'game';

    // Tüp pozisyonunu ayarla ve topları oluştur
    pipe.updatePosition();
    pipe.generateBalls();
    console.log('Toplar oluşturuldu:', pipe.balls.length, pipe.balls);

    // Gun pozisyonunu güncelle
    gun.updatePosition();

    // UI'ı güncelle
    updateUI();

    // İlk soruyu göster
    console.log('Soru gösterilecek...');
    setTimeout(() => {
        console.log('showQuestion çağrılıyor');
        showQuestion();
    }, 1000);
}

function restartGame() {
    // Tüm olası bitiş ekranlarını kapat
    document.getElementById('summary-modal').classList.remove('active');
    document.getElementById('celebration-screen').classList.remove('active');
    stopConfetti();

    // Oyun durumunu sıfırla
    GameState.reset();
    GameState.currentScreen = 'game';

    // Topları yeniden oluştur
    pipe.generateBalls();

    // UI'ı güncelle
    updateUI();

    // İlk soruyu göster
    setTimeout(() => {
        showQuestion();
    }, 500);
}

// ==================== BAŞLAT ====================
document.addEventListener('DOMContentLoaded', initGame);

// ==================== GLOBAL UTILITIES ====================

// Puan popup'ı göster
function showPointsPopup(points, x, y, iconType) {
    const popup = document.createElement('div');
    popup.className = 'points-popup';

    // İkon ekleme
    if (iconType === 'trophy') {
        popup.innerHTML = `<img src="game/score_count.png" class="point-icon"> +${points}`;
    } else if (iconType === 'clock') {
        popup.classList.add('bonus');
        // Kodla oluşturulan saat figürü (clock-icon-custom)
        popup.innerHTML = `<div class="clock-icon-custom"></div> +${points}`;
    } else {
        popup.textContent = `+${points}`;
    }

    // Belirtilen koordinatlarda göster (yoksa ekran ortası)
    const posX = x !== undefined ? x : (canvasWidth / 2);
    const posY = y !== undefined ? y : (canvasHeight / 3);

    popup.style.left = posX + 'px';
    popup.style.top = posY + 'px';

    document.body.appendChild(popup);

    // Animasyon bitince kaldır (CSS'de 3.5s yapıldı)
    setTimeout(() => {
        popup.remove();
    }, 3500);
}
