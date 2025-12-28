import * as THREE from 'three';
import { scene, camera, renderer, createLighting, createEnvironment, createDecisionWalls, createQuestionTable, createCar, sunLight, extendEnvironment } from './scene.js';
import { startGame, formatAnswer, getPrediction, continueGame, confirmSuccess } from './api_client.js';
import { CarController } from './car_controls.js';
import { loadSounds, startMusic, playSoundEffect, startThinkingSound, stopThinkingSound } from './audio_manager.js';

// --- GLOBAL HATA YAKALAMA ---
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('❌ GLOBAL HATA:', msg, 'Satır:', lineNo);
    return false;
};

// --- DEĞİŞKENLER & DURUM YÖNETİMİ ---
const clock = new THREE.Clock();
let carController = null;
let gameQuestions = [];
let activeZones = [];
let userAnswers = [];
let isGameOver = false;
let isPredicting = false;
let isGameStarted = false;
let lastPrediction = null;

// Soru mesafesi
const DISTANCE_BETWEEN_QUESTIONS = 180;

// --- UI ELEMENTLERI ---
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');
const questionTextUI = document.getElementById('question-text');
const progressTextUI = document.getElementById('progress-text');
const questionContainer = document.getElementById('question-container');
const controlsHint = document.getElementById('controls-hint');

console.log("📦 main.js yüklendi");
console.log("🔍 Start Screen:", startScreen ? "BULUNDU" : "BULUNAMADI");
console.log("🔍 Start Button:", startBtn ? "BULUNDU" : "BULUNAMADI");

// --- SAHNE KURULUMU ---
createLighting();
createEnvironment();
camera.position.set(0, 10, 20);

// Başlangıçta soru container'ı gizle
if (questionContainer) questionContainer.style.display = 'none';
if (controlsHint) controlsHint.style.display = 'none';

// --- BAŞLAT BUTONU ---
if (startBtn) {
    startBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        console.log("🎮 ========== OYNA BUTONUNA TIKLANDI ==========");

        startMusic();
        if (startScreen) startScreen.style.display = 'none';
        if (loadingScreen) loadingScreen.style.display = 'flex';

        try {
            await initGameWorld();
        } catch (err) {
            console.error("❌ initGameWorld hatası:", err);
            alert("Oyun başlatılamadı: " + err.message);
        }
    });
} else {
    console.error("❌ START BUTTON BULUNAMADI!");
}

// --- OYUN BAŞLATMA ---
async function initGameWorld() {
    console.log("🚀 initGameWorld() başladı");

    loadSounds();

    try {
        if (loadingMessage) loadingMessage.innerText = "Araba Hazırlanıyor...";

        const carMesh = await createCar(scene);
        console.log("🚗 Araba yüklendi");

        carController = new CarController(carMesh);
        carMesh.position.set(0, 0, 0);

        if (loadingMessage) loadingMessage.innerText = "Sorular Yükleniyor...";
        gameQuestions = await startGame();
        console.log("📝 Sorular yüklendi:", gameQuestions.length, "adet");

        if (!gameQuestions || gameQuestions.length === 0) {
            throw new Error("Sorular yüklenemedi!");
        }

        gameQuestions.forEach((q, index) => {
            const zPosition = -150 - (index * DISTANCE_BETWEEN_QUESTIONS);
            createQuestionTable(scene, zPosition + 20, q.text);
            const walls = createDecisionWalls(scene, zPosition);

            activeZones.push({
                z: zPosition,
                questionId: q.id,
                questionText: q.text,
                passed: false,
                walls: walls
            });
        });

        console.log("🧱 Zone'lar oluşturuldu:", activeZones.length, "adet");

        if (questionContainer) questionContainer.style.display = 'block';
        if (controlsHint) controlsHint.style.display = 'block';
        updateUI(0);

        isGameStarted = true;
        isGameOver = false;
        isPredicting = false;
        userAnswers = [];

        carController.start();
        startMusic();
        console.log("🏁 ========== OYUN BAŞLADI ==========");

    } catch (error) {
        console.error("❌ Oyun başlatma hatası:", error);
        alert("Hata oluştu: " + error.message);
    } finally {
        if (loadingScreen) loadingScreen.style.display = 'none';
    }
}
function updateLight() {
    if (carController && sunLight) {
        const carPos = carController.getPosition();

        // Işık arabayı Z ekseninde takip etsin, ama mesafesini korusun
        sunLight.position.z = carPos.z + 50;
        sunLight.target.position.z = carPos.z; // Işığın hedefi de araba olsun
        sunLight.target.updateMatrixWorld();
    }
}

// --- ÇARPIŞMA KONTROLÜ ---
function checkCollisions() {
    if (!carController || isGameOver || isPredicting || !isGameStarted) return;

    const carPos = carController.getPosition();

    for (const zone of activeZones) {
        if (zone.passed) continue;

        if (Math.abs(carPos.z - zone.z) < 2.0) {
            let selectedAnswer = "Kısmen";

            if (carPos.x > 3) selectedAnswer = "Evet";
            else if (carPos.x < -3) selectedAnswer = "Hayır";

            playSoundEffect('answer');

            console.log(`✅ Soru ${userAnswers.length + 1}: ${zone.questionText} -> ${selectedAnswer}`);
            userAnswers.push(formatAnswer(zone.questionText, selectedAnswer));
            zone.passed = true;

            const nextIndex = userAnswers.length;
            console.log(`📊 İlerleme: ${nextIndex}/${gameQuestions.length}`);

            if (nextIndex < gameQuestions.length) {
                updateUI(nextIndex);
            } else {
                console.log("🎯 ========== TÜM SORULAR CEVAPLANDI ==========");
                finishGame();
            }
        }
    }
}

function updateUI(questionIndex) {
    if (questionTextUI && questionIndex < gameQuestions.length) {
        questionTextUI.innerText = gameQuestions[questionIndex].text;
        if (progressTextUI) progressTextUI.innerText = `Soru: ${questionIndex + 1} / ${gameQuestions.length}`;
    }
}

// --- OYUN BİTİŞİ ---
async function finishGame() {
    console.log("🏁 ========== finishGame() ÇAĞRILDI ==========");

    isGameOver = true;
    isPredicting = true;

    if (carController) {
        carController.stop();
    }

    if (questionTextUI) questionTextUI.innerText = "🧠 Zihin Okunuyor...";

    // --- YENİ: Düşünme Sesini Başlat ---
    startThinkingSound();
    // -----------------------------------

    try {
        console.log("🔄 API'ye istek gönderiliyor...");

        // Bu işlem 3-5 saniye sürer, bu arada ses çalacak
        const result = await getPrediction(userAnswers);

        // --- YENİ: Sonuç Geldi, Sesi Durdur ---
        stopThinkingSound();
        // -------------------------------------

        if (result && result.prediction) {
            lastPrediction = {
                prediction: result.prediction,
                url: result.url
            };
            showPredictionResult(result.prediction, result.url);
        } else {
            showGameEndOverlay("Hata: Tahmin alınamadı!");
        }
    } catch (error) {
        console.error("❌ finishGame hatası:", error);

        // Hata olsa bile sesi susturmayı unutma!
        stopThinkingSound();

        showGameEndOverlay("Hata: " + error.message);
    }
}

// --- TAHMİN SONUCU OVERLAY ---
function showPredictionResult(prediction, url) {
    console.log("📺 ========== showPredictionResult BAŞLADI ==========");

    // Önceki overlay'leri temizle
    removeAllOverlays();

    const overlay = document.createElement('div');
    overlay.id = 'prediction-overlay';
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.95) !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99999 !important;
        pointer-events: all !important;
    `;

    overlay.innerHTML = `
        <h1 style="color: #00ffcc; font-size: 42px; margin-bottom: 10px; text-align: center;">🎯 Tahminim:</h1>
        <h2 style="color: white; font-size: 56px; margin-bottom: 40px; text-align: center;">${prediction}</h2>

        <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; padding: 20px;">
            <button id="btn-view-3d" style="
                padding: 18px 35px;
                font-size: 18px;
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                color: white;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-weight: bold;
            ">👁️ 3D Görüntüle</button>

            <button id="btn-correct" style="
                padding: 18px 35px;
                font-size: 18px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-weight: bold;
            ">✅ DOĞRU BİLDİN!</button>

            <button id="btn-wrong" style="
                padding: 18px 35px;
                font-size: 18px;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-weight: bold;
            ">❌ YANLIŞ - 5 Soru Daha</button>
        </div>
    `;

    document.body.appendChild(overlay);
    console.log("✅ Overlay DOM'a eklendi");

    // 3D Görüntüle
    const view3dBtn = document.getElementById('btn-view-3d');
    if (view3dBtn) {
        view3dBtn.onclick = function (e) {
            e.preventDefault();
            console.log("👁️ 3D Görüntüle tıklandı");
            window.open(url, '_blank');
        };
    }

    // Doğru Bildin
    const correctBtn = document.getElementById('btn-correct');
    if (correctBtn) {
        correctBtn.onclick = async function (e) {
            e.preventDefault();
            console.log("✅ DOĞRU BİLDİN tıklandı");
            playSoundEffect('win');
            try {
                const response = await fetch(url);
                const htmlContent = await response.text();
                await confirmSuccess(userAnswers, prediction, htmlContent);
                console.log("💾 Veritabanına kaydedildi");
            } catch (err) {
                console.log("⚠️ HTML alınamadı, basit kayıt");
                await confirmSuccess(userAnswers, prediction, `<html>${prediction}</html>`);
            }

            removeAllOverlays();
            showGameEndOverlay("🎉 Tebrikler! Doğru Tahmin Kaydedildi!");
        };
    }

    // Yanlış - 5 Soru Daha
    const wrongBtn = document.getElementById('btn-wrong');
    if (wrongBtn) {
        wrongBtn.onclick = async function (e) {
            e.preventDefault();
            console.log("❌ YANLIŞ tıklandı, 5 yeni soru isteniyor...");

            removeAllOverlays();
            if (questionTextUI) questionTextUI.innerText = "Yeni Sorular Yükleniyor...";

            try {
                const newQuestions = await continueGame(userAnswers);
                console.log("📝 Yeni sorular:", newQuestions);

                if (newQuestions && newQuestions.length > 0) {
                    addNewQuestions(newQuestions);
                } else {
                    showGameEndOverlay("Yeni sorular alınamadı!");
                }
            } catch (err) {
                console.error("❌ Yeni soru hatası:", err);
                showGameEndOverlay("Hata: " + err.message);
            }
        };
    }

    attachButtonSounds();
    console.log("📺 ========== showPredictionResult TAMAMLANDI ==========");
}

// --- OYUN SONU OVERLAY ---
function showGameEndOverlay(message) {
    console.log("🔚 showGameEndOverlay:", message);

    removeAllOverlays();

    const overlay = document.createElement('div');
    overlay.id = 'game-end-overlay';

    overlay.innerHTML = `
        <h2 style="color: #00ffcc; font-size: 36px; margin-bottom: 30px; text-align: center;">${message}</h2>
        <button id="replay-btn" style="
            padding: 20px 50px;
            font-size: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 15px;
            cursor: pointer;
            font-weight: bold;
        ">🔄 YENİDEN OYNA</button>
    `;

    document.body.appendChild(overlay);

    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
        replayBtn.onclick = function (e) {
            e.preventDefault();
            console.log("🔄 Yeniden oyna tıklandı");
            location.reload();
        };
    }

    attachButtonSounds();
}

// --- OVERLAY TEMİZLEME ---
function removeAllOverlays() {
    const ids = ['prediction-overlay', 'game-end-overlay', 'prediction-btn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
            console.log("🗑️ Kaldırıldı:", id);
        }
    });
}

// --- YENİ SORU EKLEME ---
function addNewQuestions(newQuestions) {
    console.log("🆕 Yeni sorular ekleniyor:", newQuestions.length, "adet");

    const lastZone = activeZones[activeZones.length - 1];
    const startZ = lastZone ? lastZone.z - DISTANCE_BETWEEN_QUESTIONS : -150;

    let furthestZ = startZ;

    newQuestions.forEach((q, index) => {
        gameQuestions.push(q);
        const zPosition = startZ - (index * DISTANCE_BETWEEN_QUESTIONS);
        furthestZ = zPosition; // En uzak Z pozisyonunu takip et

        createQuestionTable(scene, zPosition + 20, q.text);
        const walls = createDecisionWalls(scene, zPosition);

        activeZones.push({
            z: zPosition,
            questionId: q.id,
            questionText: q.text,
            passed: false,
            walls: walls
        });
    });

    // --- YENİ: Çevreyi uzat ---
    extendEnvironment(furthestZ);
    // --------------------------

    // Arabayı yeni soruların önüne konumlandır
    const nextZone = activeZones.find(z => !z.passed);
    if (nextZone && carController) {
        carController.carMesh.position.z = nextZone.z + 100;
    }

    // Oyunu tekrar başlat
    isGameOver = false;
    isPredicting = false;
    if (carController) carController.start();

    updateUI(userAnswers.length);
    console.log("🏁 Oyun devam ediyor!");
}

// --- KAMERA TAKİBİ ---
function updateCamera() {
    if (carController && isGameStarted && !isPredicting) {
        const carPos = carController.getPosition();
        const targetPos = new THREE.Vector3(carPos.x, carPos.y + 10, carPos.z + 20);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(carPos.x, carPos.y, carPos.z - 50);
    }
}

function attachButtonSounds() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(btn => {
        // Eğer daha önce ses eklenmediyse ekle
        if (!btn.dataset.soundAttached) {
            
            btn.addEventListener('click', () => {
                // "Doğru Bildin" butonu (btn-correct) HARİÇ diğerlerinde çal
                // Çünkü onun kendi 'win' sesi zaten var.
                if (btn.id !== 'btn-correct') {
                    playSoundEffect('click');
                }
            });

            btn.dataset.soundAttached = "true"; 
        }
    });
}

// --- ANA DÖNGÜ ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (carController && isGameStarted && !isPredicting) {
        carController.update(deltaTime);
        checkCollisions();
    }

    updateCamera();
    updateLight();
    renderer.render(scene, camera);
}

animate();
attachButtonSounds();
console.log("🎬 Animasyon döngüsü başlatıldı");
