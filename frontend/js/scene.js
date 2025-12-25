import * as THREE from 'three'; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const scene = new THREE.Scene();

const worldColor = 0x68c6e0; 
scene.background = new THREE.Color(worldColor);
scene.fog = new THREE.FogExp2(worldColor, 0.01); 

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

export function createLighting() {
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x101010, 0.6);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 20, 10);
    directionalLight.castShadow = true;
    
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    
    scene.add(directionalLight);
}

export function createEnvironment() {
    // 1. YOL (Arabanın gittiği şerit - Koyu Lacivert)
    const roadGeometry = new THREE.PlaneGeometry(23, 5000); 
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

    // 2. ZEMİN (Yolun dışındaki alan - GRİ)
    // Çok büyük bir düzlem oluşturuyoruz (10.000 x 10.000 birim)
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000); 
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080, // İSTEDİĞİN GRİ RENK BURADA
        roughness: 1,    // Mat olsun, parlamasın
        metalness: 0     
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5; // Yolun çok az altında dursun (Yol üstte kalsın)
    ground.receiveShadow = true;
    
    scene.add(ground);

    // GridHelper (Kareli Çizgiler) İSTEMİYORDUN, O YÜZDEN SİLDİM.

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

    return [yesWall, noWall,maybeWall];
}

export function createQuestionTable(scene, zPosition, questions) {

    const questionTable = new THREE.Group();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;
    
    context.fillStyle = '#ff0000'; 
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'Bold 60px Arial'; 
    context.fillStyle = 'white';      
    context.textAlign = 'center';    
    context.textBaseline = 'middle';  

    context.fillText(questions, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);

    const govdeRengi = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5 });
    
    const onYuzMateryali = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 });

    const materials = [
        govdeRengi,     // Sağ
        govdeRengi,     // Sol
        govdeRengi,     // Üst
        govdeRengi,     // Alt
        onYuzMateryali, // ÖN (Index 4) -> Texture burada!
        govdeRengi      // Arka (İstersen buraya da onYuzMateryali koyabilirsin)
    ];

    const tableGeometry = new THREE.BoxGeometry(10, 6, 1);
    const table = new THREE.Mesh(tableGeometry, materials);
    
    table.position.set(0, 8, 0); 

    const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.6 });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    
    column.position.set(0, 3, 0); 

    questionTable.add(table);
    questionTable.add(column);

    questionTable.position.set(15, 0, zPosition);
    
    scene.add(questionTable);
}

// scene.js içindeki createCar fonksiyonunu tamamen bununla değiştir:

export function createCar(scene) {
    return new Promise((resolve) => {
        console.log("🏎️ Araba modeli yükleniyor...");
        
        const loader = new GLTFLoader();
        
        // ÖNEMLİ: Dosya yolunun 'assets/car.glb' olduğundan ve
        // assets klasörünün index.html'in yanında olduğundan emin ol.
        loader.load(
            'assets/lowpolycar.glb', 
            (gltf) => {
                const carModel = gltf.scene;
                
                // Model çok büyük veya küçükse burayla oyna
                carModel.scale.set(3, 3, 3); 
                
                // Arabanın arkası kameraya dönük olsun (180 derece)
                //carModel.rotation.y = Math.PI; 
                
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
            
            // HATA OLURSA (Yedek Plan)
            (error) => {
                console.warn("⚠️ Araba modeli bulunamadı veya yüklenemedi. Kırmızı kutu devreye giriyor.", error);
                
                // FALLBACK: Kırmızı Kutu
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

