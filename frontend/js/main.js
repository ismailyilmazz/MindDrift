import * as THREE from 'three';
import { initScene, scene, camera, renderer, createBarrier, barriers } from './scene.js';
import { startGame, formatAnswer, getPrediction, continueGame } from './api_client.js';

// ========== OYUN DURUMLARI (STATES) ==========
const STATES = {
    START: 'start',
    LOADING: 'loading',
    PLAYING: 'playing',
    PREDICTING: 'predicting', // AI düşünürken
    MODAL_OPEN: 'modal_open', // Tahmin ekranda iken
    END: 'end'
};

let currentState = STATES.START;

// ========== OYUN DEĞİŞKENLERİ ==========
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let currentPrediction = null;
let currentPredictionHtml = null;
let barrierCollisionActive = false;
let isGameFinishing = false; // Çifte tetiklemeyi önlemek için kilit

// ========== DOM ELEMENTLERİ ==========
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const loadingScreen = document.getElementById('loading-screen');
const questionTextEl = document.getElementById('question-text');
const progressTextEl = document.getElementById('progress-text');
const predictionModal = document.getElementById('prediction-modal');
const predictionIframe = document.getElementById('prediction-iframe');
const predictionTitle = document.getElementById('prediction-title');
const endMessage = document.getElementById('end-message');

// ========== EKRAN YÖNETİMİ ==========
function showScreen(screenName) {
    console.log(`📺 Ekran değişiyor: ${currentState} -> ${screenName}`);
    
    // Tüm ekranları gizle
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // İstenen ekranı aç
    if (screenName === STATES.START) startScreen.classList.add('active');
    else if (screenName === STATES.PLAYING || screenName === STATES.LOADING) gameScreen.classList.add('active');
    else if (screenName === STATES.END) endScreen.classList.add('active');
    
    currentState = screenName;
}

// ========== OYUN BAŞLATMA ==========
window.startGameSession = async function() {
    console.log('🎮 Yeni oyun başlatılıyor...');
    
    currentState = STATES.LOADING;
    showScreen(STATES.LOADING);
    loadingScreen.style.display = 'flex'; // Loading'i göster
    
    // Sahneyi sadece bir kere başlat
    if (!window.sceneInitialized) {
        initScene();
        animate();
        window.sceneInitialized = true;
    }
    
    // Değişkenleri sıfırla
    questions = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    barrierCollisionActive = false;
    isGameFinishing = false;

    // Soruları çek
    questions = await startGame();
    
    if (questions && questions.length > 0) {
        console.log(`✅ ${questions.length} soru yüklendi.`);
        loadingScreen.style.display = 'none'; // Loading'i gizle
        showScreen(STATES.PLAYING);
        spawnNextQuestionSet();
    } else {
        alert('Sorular yüklenemedi! Backend çalışıyor mu?');
        showScreen(STATES.START);
    }
};

// ========== SORU BARİYERLERİNİ OLUŞTUR ==========
function spawnNextQuestionSet() {
    if (currentQuestionIndex >= questions.length) {
        finishGameAndPredict();
        return;
    }

    const q = questions[currentQuestionIndex];
    questionTextEl.innerText = q.text;
    progressTextEl.innerText = `Soru: ${currentQuestionIndex + 1}/${questions.length}`;

    // Eski bariyerleri temizle
    barriers.forEach(b => scene.remove(b));
    barriers.length = 0;

    // Yeni bariyerler (X pozisyonları: Sol, Orta, Sağ)
    createBarrier(-50, "EVET", "YES").position.x = -4;
    createBarrier(-50, "BELKİ", "MAYBE").position.x = 0;
    createBarrier(-50, "HAYIR", "NO").position.x = 4;

    barrierCollisionActive = true;
}

// ========== ÇARPIŞMA MANTIĞI ==========
function handleCollision(barrier) {
    // Eğer oyun oynanmıyorsa veya çarpışma kilitliyse işlem yapma
    if (currentState !== STATES.PLAYING || !barrierCollisionActive) return;

    barrierCollisionActive = false; // Çifte çarpışmayı önle
    console.log(`✓ Seçilen Cevap: ${barrier.userData.type}`);

    // Cevabı kaydet
    const currentQ = questions[currentQuestionIndex];
    const formatted = formatAnswer(currentQ.text, barrier.userData.type);
    userAnswers.push(formatted);

    currentQuestionIndex++;

    // Görsel temizlik
    barriers.forEach(b => scene.remove(b));
    barriers.length = 0;

    // Bir sonraki adıma geç (Gecikmeli)
    setTimeout(() => {
        if (currentQuestionIndex < questions.length) {
            spawnNextQuestionSet();
        } else {
            finishGameAndPredict();
        }
    }, 300);
}

// ========== OYUN BİTİŞ VE TAHMİN ==========
async function finishGameAndPredict() {
    // Eğer zaten tahmin yapılıyorsa tekrar çalıştırma (KORUMA KİLİDİ)
    if (isGameFinishing) return;
    isGameFinishing = true;

    console.log('🛑 Sorular bitti, tahmin moduna geçiliyor...');
    currentState = STATES.PREDICTING;
    questionTextEl.innerText = '🤖 Yapay Zeka Düşünüyor...';
    
    // Sahneyi temizle
    barriers.forEach(b => scene.remove(b));
    barriers.length = 0;

    try {
        const data = await getPrediction(userAnswers);
        
        if (data && data.prediction) {
            console.log(`✅ Tahmin Geldi: ${data.prediction}`);
            currentPrediction = data.prediction;
            currentPredictionHtml = data.html_code;
            
            showPredictionModal(); // Modalı aç
        } else {
            throw new Error("Tahmin verisi boş geldi");
        }
    } catch (error) {
        console.error('❌ Tahmin Hatası:', error);
        alert('Tahmin alınırken hata oluştu.');
        showScreen(STATES.START);
        isGameFinishing = false;
    }
}

// ========== MODAL YÖNETİMİ ==========
function showPredictionModal() {
    currentState = STATES.MODAL_OPEN;
    
    predictionTitle.innerText = `Tahminim: ${currentPrediction}`;
    
    // iframe içeriğini yükle
    if (currentPredictionHtml) {
        const blob = new Blob([currentPredictionHtml], { type: 'text/html' });
        predictionIframe.src = URL.createObjectURL(blob);
    } else {
        predictionIframe.src = '';
    }

    // Modalı görünür yap
    predictionModal.classList.add('show');
}

// Sadece modalı kapat (X butonu)
window.closePredictionOnly = function() {
    predictionModal.classList.remove('show');
    predictionIframe.src = ''; // Kaynak tüketimini durdur
    // Kullanıcı X'e basarsa ne olacağına karar ver (Şimdilik başa dönüyor)
    showScreen(STATES.START);
};

// DOĞRU Butonu
window.confirmCorrect = function() {
    console.log('✅ Kullanıcı: DOĞRU');
    
    // Backend'e başarıyı bildir (Veritabanına kaydeder)
    fetch('http://localhost:8000/confirm-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            answers: userAnswers,
            prediction: currentPrediction,
            html_content: currentPredictionHtml
        })
    }).then(() => {
        console.log('💾 DB Kayıt Başarılı');
        predictionModal.classList.remove('show');
        predictionIframe.src = '';
        
        // İsteğine göre: Doğru bilinirse BAŞA DÖN veya SON EKRANI GÖSTER
        goToEndScreen(); 
    }).catch(err => console.error("Kayıt hatası:", err));
};

// YANLIŞ Butonu (5 Soru Daha)
window.confirmWrong = async function() {
    console.log('❌ Kullanıcı: YANLIŞ');
    
    // Modalı kapat
    predictionModal.classList.remove('show');
    predictionIframe.src = '';
    
    // Kullanıcıya bilgi ver
    questionTextEl.innerText = '🔄 Yeni Sorular Hazırlanıyor...';
    currentState = STATES.PREDICTING; // Kullanıcı hareket edemesin
    
    try {
        const newQuestionsData = await continueGame(userAnswers);
        
        if (newQuestionsData && newQuestionsData.length > 0) {
            console.log(`Checking questions: ${newQuestionsData.length} new questions received.`);
            
            // Yeni soruları listeye ekle
            questions.push(...newQuestionsData);
            
            // Oyunu kaldığı yerden devam ettir
            isGameFinishing = false; // Kilidi aç
            currentState = STATES.PLAYING;
            barrierCollisionActive = false;
            
            spawnNextQuestionSet();
        } else {
            alert('Yeni soru üretilemedi, oyun bitiyor.');
            goToEndScreen();
        }
    } catch (error) {
        console.error('Devam etme hatası:', error);
        goToEndScreen();
    }
};

// ========== OYUN SONU EKRANI ==========
function goToEndScreen() {
    // Canvas'ı gizle (isteğe bağlı, arka planda kalabilir)
    // document.querySelector('canvas').style.display = 'none';
    
    endMessage.innerText = `Oyun Bitti! Toplam ${questions.length} soru soruldu.`;
    showScreen(STATES.END);
}

window.backToStart = function() {
    showScreen(STATES.START);
};

// ========== RENDER LOOP ==========
function animate() {
    requestAnimationFrame(animate);

    // Sadece oyun oynanıyorsa (PLAYING) render hesaplaması yap
    if (currentState !== STATES.PLAYING) {
        renderer.render(scene, camera);
        return;
    }

    // Bariyerleri hareket ettir
    const carPos = { x: 0, y: 0, z: 0 }; // Arabanın (kameranın) sanal pozisyonu

    barriers.forEach((b) => {
        if (!barrierCollisionActive) return;

        b.position.z += 0.5; // Bariyer hızı

        // Çarpışma Bölgesi
        if (b.position.z > -1 && b.position.z < 1) {
            if (Math.abs(b.position.x - carPos.x) < 1.5) {
                handleCollision(b);
            }
        }
    });

    renderer.render(scene, camera);
}