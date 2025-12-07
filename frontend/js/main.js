import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { scene, camera, renderer, createLighting, createEnvironment, createDecisionWalls,createQuestionTable } from './scene.js';

// 1. Loading Ekranını Manuel Olarak Gizle
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) loadingScreen.style.display = 'none';

// 2. Sahne Bileşenlerini Yükle (scene.js fonksiyonları)
createLighting();
createEnvironment();

// Test amaçlı duvarları ekle (Z ekseninde -20 konumuna)
createDecisionWalls(scene, -20);
createQuestionTable(scene, -10, "Bu bir test sorusudur?");


// 3. Geçici Kamera Ayarları (OrbitControls ile gezebilmek için)
camera.position.set(0, 10, 20); // Biraz yukarıdan ve geriden bak
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Yumuşak hareket
controls.dampingFactor = 0.05;

// 4. Basit Render Döngüsü
function animate() {
    requestAnimationFrame(animate);

    // Kontrolleri güncelle
    controls.update();

    // Sahneyi çiz
    renderer.render(scene, camera);
}

// Başlat
animate();