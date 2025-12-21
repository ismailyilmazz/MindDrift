import * as THREE from 'three';
import { initScene, scene, camera, renderer, createBarrier, barriers } from './scene.js';
import { startGame, formatAnswer, getPrediction, continueGame } from './api_client.js';

let questions = [];
let currentQuestionIndex = 0;
let gameActive = false;
let userAnswers = []; 
let currentPrediction = null;
let currentPredictionHtml = null;
let barrierCollisionActive = false;

const questionTextEl = document.getElementById('question-text');
const progressTextEl = document.getElementById('progress-text');
const predictionModal = document.getElementById('prediction-modal');
const gameOverModal = document.getElementById('game-over-modal');
const predictionIframe = document.getElementById('prediction-iframe');
const predictionTitle = document.getElementById('prediction-title');

console.log('✅ DOM Elementleri:', {
    questionTextEl: !!questionTextEl,
    progressTextEl: !!progressTextEl,
    predictionModal: !!predictionModal,
    gameOverModal: !!gameOverModal
});

// === GLOBAL FONKSİYONLAR (HTML'den çağrılabilir) ===

window.closeModalOnly = function() {
    predictionModal.classList.remove('show');
    predictionIframe.src = '';
}

window.confirmCorrect = function() {
    console.log("✅ Kullanıcı 'Doğru' dedi!");
    
    // Backend'e kaydet (veritabanına)
    fetch('http://localhost:8000/confirm-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            answers: userAnswers,
            prediction: currentPrediction,
            html_content: currentPredictionHtml
        })
    }).then(() => {
        console.log("💾 Veritabanına kaydedildi!");
        window.closeModalOnly();
        showGameOverModal();
    });
}

window.confirmWrong = function() {
    console.log("❌ Kullanıcı 'Yanlış' dedi!");
    window.closeModalOnly();
    continuGameWith5Questions();
}

window.restartGame = function() {
    console.log("🔄 Oyun yeniden başladı!");
    location.reload();
}

// === OYUN KONTROL FONKSİYONLARI ===

function showPredictionModal(prediction, htmlContent) {
    console.log(`🎯 Modal açılıyor: ${prediction}, HTML uzunluğu: ${htmlContent ? htmlContent.length : 0}`);
    
    currentPrediction = prediction;
    currentPredictionHtml = htmlContent;
    predictionTitle.innerText = `Tahmin: ${prediction}`;
    
    // iframe'e HTML content yazıyoruz
    if (htmlContent && htmlContent.length > 0) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        predictionIframe.src = url;
        console.log(`✅ iframe src ayarlandı`);
    } else {
        console.error('❌ HTML content boş!');
        predictionIframe.innerHTML = '<h1>HTML İçeriği Boş</h1>';
    }
    
    predictionModal.classList.add('show');
    console.log(`✅ Modal gösterildi, class: ${predictionModal.className}`);
}

function showGameOverModal() {
    const message = document.getElementById('game-over-message');
    message.innerText = `Tebrikler! ${userAnswers.length} soru ile tahmin ettik!`;
    gameOverModal.classList.add('show');
}

async function continuGameWith5Questions() {
    console.log("🔄 5 Yeni soru getiriliyor...");
    const newQuestions = await continueGame(userAnswers);
    
    if (newQuestions && newQuestions.length > 0) {
        questions.push(...newQuestions);
        gameActive = true;
        barrierCollisionActive = false;
        spawnNextQuestionSet();
    } else {
        alert('Yeni sorular alınamadı!');
    }
}

async function initGame() {
    initScene();
    
    questions = await startGame();
    if(questions.length > 0) {
        console.log("Sorular yüklendi, oyun başlıyor.");

        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'none'; 
        
        gameActive = true;
        barrierCollisionActive = false;
        spawnNextQuestionSet(); 
        animate();
    }
}

function spawnNextQuestionSet() {
    if (currentQuestionIndex >= questions.length) {
        finishGame();
        return;
    }

    const q = questions[currentQuestionIndex];
    questionTextEl.innerText = q.text; 
    progressTextEl.innerText = `Soru: ${currentQuestionIndex + 1}/${questions.length}`;

    // Eski barrierleri sil
    barriers.forEach(b => scene.remove(b));
    barriers.length = 0;

    // Yeni barrierler oluştur
    const bYes = createBarrier(-50, "EVET", "YES"); 
    bYes.position.x = -4; 

    const bMaybe = createBarrier(-50, "BELKİ", "MAYBE");
    bMaybe.position.x = 0;

    const bNo = createBarrier(-50, "HAYIR", "NO");
    bNo.position.x = 4;
    
    barrierCollisionActive = true;
}

function finishGame() {
    console.log("🎮 Oyun bitti, tahmin yapılıyor...", { userAnswers });
    
    // Oyunu TAMAMEN DURDUR
    gameActive = false;
    barrierCollisionActive = false;
    
    // Tüm barrier'leri hemen sil
    barriers.forEach(b => {
        scene.remove(b);
    });
    barriers.length = 0;
    
    questionTextEl.innerText = "Tahmin Yapılıyor...";
    
    getPrediction(userAnswers).then(data => {
        console.log("📡 Backend response:", data);
        
        if(data && data.prediction && data.html_code) {
            console.log(`✅ Tahmin alındı: ${data.prediction}, HTML: ${data.html_code ? 'Var' : 'Yok'}`);
            showPredictionModal(data.prediction, data.html_code);
        } else {
            console.error('❌ Response hatalı:', data);
            alert('Tahmin yapılamadı. Lütfen API key kontrol edin.');
            // Oyunu yeniden başlatma - sadece uyarı
        }
    }).catch(error => {
        console.error("❌ Tahmin hatası:", error);
        alert('Tahmin yapılırken bir hata oluştu.');
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Oyun durmuşsa barrierleri hareket ettirme
    if (!gameActive) {
        renderer.render(scene, camera);
        return;
    }
    
    if (!barrierCollisionActive) {
        renderer.render(scene, camera);
        return;
    }

    const carPos = { x: 0, y: 0, z: 0 }; 

    barriers.forEach((b) => {
        if (!b.userData.active) return;
        
        b.position.z += 0.5; // Hız

        if (b.position.z > -1 && b.position.z < 1) {
            if (Math.abs(b.position.x - carPos.x) < 1.5) {
                handleCollision(b);
            }
        }
    });

    renderer.render(scene, camera);
}

function handleCollision(barrier) {
    if (!barrierCollisionActive) return;
    
    barrierCollisionActive = false; // Çoklu çarpışmaları engelle
    
    console.log(`✓ Cevap Seçildi: ${barrier.userData.type}`);
    
    const currentQ = questions[currentQuestionIndex];
    const formatted = formatAnswer(currentQ.text, barrier.userData.type);
    userAnswers.push(formatted);
    console.log(`📝 Cevap ${userAnswers.length}/${questions.length}: ${formatted}`);

    currentQuestionIndex++;
    
    // Eski barrierleri HEMEN sil
    barriers.forEach(b => scene.remove(b));
    barriers.length = 0; 
    
    // Biraz gecikmeyle sonraki soruyu göster
    setTimeout(() => {
        if (gameActive && currentQuestionIndex < questions.length) {
            spawnNextQuestionSet();
        } else if (currentQuestionIndex >= questions.length) {
            finishGame();
        }
    }, 300);
}
}

initGame();