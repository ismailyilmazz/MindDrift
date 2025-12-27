import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const scene = new THREE.Scene();

const worldColor = 0x68c6e0;
scene.background = new THREE.Color(worldColor);
scene.fog = new THREE.FogExp2(worldColor, 0.01);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

export const listener = new THREE.AudioListener();
camera.add(listener);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
document.body.appendChild(renderer.domElement);

export let sunLight;

export function createLighting() {
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x101010, 0.8);
    scene.add(hemisphereLight);

    sunLight = new THREE.DirectionalLight(0xffffff, 2.0); // Şiddeti artırdık

    // Konumu: Arabanın (0,0,-40) biraz gerisinde ve yukarısında
    sunLight.position.set(30, 15, 10);
    sunLight.castShadow = true;

    // Gölge kalitesi
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;

    // --- GÖLGE KUTUSU (Bu kutunun dışına gölge düşmez) ---
    const d = 100;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;

    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.bias = -0.005

    scene.add(sunLight);

    // Hedefi arabaya doğru ayarla
    sunLight.target.position.set(0, 0, -50);
    scene.add(sunLight.target);
}

export function createEnvironment() {
    // 1. ANA YOL (Arabanın gittiği şerit - Koyu Lacivert)
    const roadWidth = 23; 
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, 5000); 
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x16213e, 
        roughness: 0.1,   
        metalness: 0.5    
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -2000; 
    road.receiveShadow = true;
    scene.add(road);

    // --- GENİŞLETİLMİŞ VE YÜKSEK KALDIRIMLAR ---
    const curbWidth = 16; 
    const curbHeight = 1.2; // YENİ: Kaldırımın yüksekliği/kalınlığı
    
    // Konum Hesaplaması:
    const offset = (roadWidth / 2) + (curbWidth / 2);

    // YENİ: PlaneGeometry yerine BoxGeometry kullanıyoruz (Genişlik, Yükseklik, Uzunluk)
    const curbGeometry = new THREE.BoxGeometry(curbWidth, curbHeight, 5000);
    
    const curbMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x800020, // Bordo/Kırmızı tonu
        roughness: 0.9, 
        metalness: 0.1
    });

    // SOL KALDIRIM
    const leftCurb = new THREE.Mesh(curbGeometry, curbMaterial);
    leftCurb.position.z = -2000;
    leftCurb.position.x = -offset; 
    // YENİ: Kutunun merkezi ortada olduğu için, yarısı kadar yukarı kaldırıyoruz ki yere bassın
    leftCurb.position.y = curbHeight / 2; 
    leftCurb.castShadow = false;    // YENİ: Yola gölge düşürsün
    leftCurb.receiveShadow = true;
    scene.add(leftCurb);

    // SAĞ KALDIRIM
    const rightCurb = new THREE.Mesh(curbGeometry, curbMaterial);
    // rightCurb.rotation.x iptal edildi
    rightCurb.position.z = -2000;
    rightCurb.position.x = offset; 
    rightCurb.position.y = curbHeight / 2; // YENİ: Yükseklik ayarı
    rightCurb.castShadow = false;     // YENİ: Yola gölge düşürsün
    rightCurb.receiveShadow = true;
    scene.add(rightCurb);
    // ----------------------------------------

    // 2. ZEMİN (En alttaki sonsuz gri alan)
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000); 
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 1,    
        metalness: 0     
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5; 
    ground.receiveShadow = true;
    
    scene.add(ground);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

export function createDecisionWalls(scene, zPosition) {

    function createWallWithText(text, colorHex, x, z, type) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        context.fillStyle = colorHex;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = "white";
        context.lineWidth = 10;
        context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

        context.font = "bold 100px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);

        const geometry = new THREE.BoxGeometry(7.5, 8, 1);


        const material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            roughness: 0.4,
            emissive: new THREE.Color(colorHex),
            emissiveIntensity: 0.4,
            emissiveMap: texture
        });

        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, 4, z);
        wall.castShadow = true;

        wall.userData = { isAnswer: true, type: type, text: text };

        scene.add(wall);
        return wall;
    }

    const yesWall = createWallWithText("EVET", "#008800", 7.5, zPosition, "yes");
    const noWall = createWallWithText("HAYIR", "#880000", -7.5, zPosition, "no");
    const maybeWall = createWallWithText("KISMEN", "#888800", 0, zPosition, "kismen");

    return [yesWall, noWall, maybeWall];
}

export function createQuestionTable(scene, zPosition, questions) {

    const questionTable = new THREE.Group();

    // 1. Canvas Ayarları (BOYUTLARA DOKUNMADIM)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;

    // Arka plan rengi
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Çerçeve (Görsellik için ekledim, boyutları bozmaz)
    context.strokeStyle = "white";
    context.lineWidth = 15;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // --- TEXT WRAP (SATIR KAYDIRMA) MANTIĞI ---
    const fontSize = 60;
    const lineHeight = 80; // Satırlar arası boşluk
    const maxWidth = canvas.width - 100; // Yazı için güvenli alan (sağdan soldan pay)

    context.font = `Bold ${fontSize}px Arial`;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Kelimeleri parçala ve satırları hesapla
    const words = questions.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Bloğu dikey olarak ortala
    const totalBlockHeight = lines.length * lineHeight;
    let currentY = (canvas.height - totalBlockHeight) / 2 + (lineHeight / 2);

    // Satırları tek tek çiz
    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], canvas.width / 2, currentY);
        currentY += lineHeight;
    }
    // -------------------------------------------

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const govdeRengi = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5 });
    const onYuzMateryali = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 });

    const materials = [
        govdeRengi,     // Sağ
        govdeRengi,     // Sol
        govdeRengi,     // Üst
        govdeRengi,     // Alt
        onYuzMateryali, // ÖN (Index 4)
        govdeRengi      // Arka
    ];

    // (GEOMETRİ VE KONUMLARA DOKUNMADIM)
    const tableGeometry = new THREE.BoxGeometry(10, 6, 1);
    const table = new THREE.Mesh(tableGeometry, materials);

    table.position.set(0, 8, 0);

    const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.6 });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);

    column.position.set(0, 3, 0);

    questionTable.add(table);
    questionTable.add(column);

    // (ORİJİNAL KONUM AYARI)
    questionTable.position.set(15, 0, zPosition);

    scene.add(questionTable);
}


export function createCar(scene) {
    return new Promise((resolve) => {
        console.log("🏎️ Araba modeli yükleniyor...");

        const loader = new GLTFLoader();

        loader.load(
            'assets/lowpolycar.glb',
            (gltf) => {
                const carModel = gltf.scene;

                // Model çok büyük veya küçükse burayla oyna
                carModel.scale.set(3, 3, 3);

                // Gölgeleri aç
                carModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(carModel);
                console.log("✨ Gerçek araba başarıyla yüklendi!");
                resolve(carModel);
            },

            // Yükleme sırasında ilerleme (Opsiyonel)
            (xhr) => {
                console.log(`Yükleniyor: %${(xhr.loaded / xhr.total * 100).toFixed(0)}`);
            },

            (error) => {
                console.warn("⚠️ Araba modeli bulunamadı veya yüklenemedi. Kırmızı kutu devreye giriyor.", error);

                const geometry = new THREE.BoxGeometry(4, 2, 6);
                const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const fallbackCar = new THREE.Mesh(geometry, material);

                fallbackCar.position.y = 2;
                fallbackCar.castShadow = true;

                scene.add(fallbackCar);
                resolve(fallbackCar);
            }
        );
    });
}

