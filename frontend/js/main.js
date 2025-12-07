import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { scene, camera, renderer, createLighting, createEnvironment, createDecisionWalls, createQuestionTable ,createCar} from './scene.js';
import { startGame } from './api_client.js'; // API fonksiyonunu import et

// 1. Loading Ekranı Yönetimi
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');

// 2. Temel Sahne Kurulumu
createLighting();
createEnvironment();

// Kamera Başlangıç Pozisyonu
camera.position.set(0, 10, 30);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- DİNAMİK SAHNE OLUŞTURMA ---

const DISTANCE_BETWEEN_QUESTIONS = 50; // Her soru arası mesafe (Z ekseninde)

async function initGameWorld() {
    try {
        if (loadingMessage) loadingMessage.innerText = "Sorular Yükleniyor...";

        await createCar(scene);
        
        // Backend'den soruları çek
        const questions = await startGame(); 

        if (!questions || questions.length === 0) {
            console.error("Soru listesi boş geldi!");
            return;
        }

        console.log(`${questions.length} adet soru sahneye yerleştiriliyor...`);

        // Soruları döngü ile sahneye diz
        questions.forEach((q, index) => {
            // Z pozisyonunu hesapla (Örn: -50, -100, -150...)
            // index + 1 yapıyoruz ki ilk soru 0. noktada değil, biraz ileride olsun.
            const zPosition = -1 * (index + 1) * DISTANCE_BETWEEN_QUESTIONS;

            // 1. Soru Tabelasını Yerleştir
            // q.text -> "Canlı mı?" gibi metni taşır
            createQuestionTable(scene, zPosition+ 20, q.text);

            // 2. Evet/Hayır Duvarlarını Yerleştir
            // Duvarları tabelanın tam altına veya biraz gerisine koyabilirsin.
            // Şimdilik aynı Z hizasına koyuyoruz.
            createDecisionWalls(scene, zPosition);
        });

        // Yükleme bitti, ekranı kapat
        if (loadingScreen) loadingScreen.style.display = 'none';

    } catch (error) {
        console.error("Oyun dünyası oluşturulurken hata:", error);
        if (loadingMessage) loadingMessage.innerText = "Hata Oluştu!";
    }
}

// Oyunu Başlat
initGameWorld();

// --- RENDER DÖNGÜSÜ ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();