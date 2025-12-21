import * as THREE from 'three';
// DÜZELTME: 'getCarMesh' listeden çıkarıldı.
import { scene, camera, renderer, createLighting, createEnvironment, createDecisionWalls, createQuestionTable, createCar } from './scene.js';
import { startGame, formatAnswer, getPrediction } from './api_client.js';
import { CarController } from './car_controls.js';

// --- DEĞİŞKENLER & DURUM YÖNETİMİ ---
const clock = new THREE.Clock(); 
let carController = null;
let gameQuestions = []; 
let activeZones = []; 
let userAnswers = []; 
let isGameOver = false;

// UI Elementleri
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');
const questionTextUI = document.getElementById('question-text');
const progressTextUI = document.getElementById('progress-text');

// --- SAHNE KURULUMU ---
createLighting();
createEnvironment();

// Kamera başlangıç pozisyonu
camera.position.set(0, 10, 20);

// Soru mesafesi
const DISTANCE_BETWEEN_QUESTIONS = 180;

async function initGameWorld() {
    try {
        console.log("🚀 Oyun başlatılıyor...");

        if (loadingMessage) loadingMessage.innerText = "Araba Hazırlanıyor...";

        // 1. Arabayı Yükle
        // createCar fonksiyonu bize arabanın kendisini (mesh) döndürüyor.
        const carMesh = await createCar(scene);
        
        // Controller'a arabayı teslim et
        carController = new CarController(carMesh);
        
        // Arabayı başlangıç noktasına koy (Yolun başında)
        carMesh.position.set(0, 0, 0); 

        // 2. Soruları Çek
        if (loadingMessage) loadingMessage.innerText = "Sorular Yükleniyor...";
        gameQuestions = await startGame();

        // 3. Sahneye Soruları Diz
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

        // 4. Oyunu Başlat
        updateUI(0);
        carController.start();
        console.log("🏁 Oyun Başladı!");

    } catch (error) {
        console.error("Oyun başlatma hatası:", error);
        alert("Hata oluştu: " + error.message);
    } finally {
        // Hata olsa da olmasa da yükleme ekranını kapat
        if (loadingScreen) loadingScreen.style.display = 'none';
    }
}

initGameWorld();

// --- OYUN DÖNGÜSÜ ---

function checkCollisions() {
    if (!carController || isGameOver) return;

    const carPos = carController.getPosition();
    
    for (const zone of activeZones) {
        if (zone.passed) continue;

        // Araba duvara yaklaştı mı?
        if (Math.abs(carPos.z - zone.z) < 2.0) { 
            
            let selectedAnswer = "Kısmen"; 
            
            if (carPos.x > 3) selectedAnswer = "Evet";
            else if (carPos.x < -3) selectedAnswer = "Hayır";

            console.log(`✅ Geçiş: ${zone.questionText} -> ${selectedAnswer}`);
            
            userAnswers.push(formatAnswer(zone.questionText, selectedAnswer));

            // Görsel geri bildirim
            
            zone.passed = true;

            const nextIndex = userAnswers.length;
            if (nextIndex < gameQuestions.length) {
                updateUI(nextIndex);
            } else {
                finishGame();
            }
        }
    }
}

function updateUI(questionIndex) {
    if (questionTextUI && questionIndex < gameQuestions.length) {
        questionTextUI.innerText = gameQuestions[questionIndex].text;
        if(progressTextUI) progressTextUI.innerText = `Soru: ${questionIndex + 1} / ${gameQuestions.length}`;
    } else if (questionTextUI) {
        questionTextUI.innerText = "Tahmin Yapılıyor...";
    }
}

async function finishGame() {
    isGameOver = true;
    carController.stop();
    if(questionTextUI) questionTextUI.innerText = "Zihin Okunuyor...";
    
    const result = await getPrediction(userAnswers);
    if (result && result.url) {
        window.open(result.url, '_blank');
    }
}

function updateCamera() {
    if (carController && !isGameOver) {
        const carPos = carController.getPosition();
        
        const targetPos = new THREE.Vector3(
            carPos.x,
            carPos.y + 10,
            carPos.z + 20
        );
        
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(carPos.x, carPos.y, carPos.z - 50);
    }
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (carController) {
        carController.update(deltaTime);
        checkCollisions();
    }

    updateCamera();
    renderer.render(scene, camera);
}

animate();