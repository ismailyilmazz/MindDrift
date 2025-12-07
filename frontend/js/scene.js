import * as THREE from 'three'; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const scene = new THREE.Scene();

const worldColor = 0x68c6e0; 
scene.background = new THREE.Color(worldColor);
scene.fog = new THREE.FogExp2(worldColor, 0.01); 

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

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
    const planeGeometry = new THREE.PlaneGeometry(23, 1400); 
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x16213e, 
        roughness: 0.1,   
        metalness: 0.5    
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const gridHelper = new THREE.GridHelper(400, 100, 0xe94560, 0x0f3460);
    gridHelper.position.y = 0.01; 
    scene.add(gridHelper);

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
    const kismenWall = createWallWithText("KISMEN", "#888800", 0, zPosition, "kismen");

    return [yesWall, noWall,kismenWall];
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

export function createCar(scene) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        
        loader.load(
            './assets/car.glb', 
            (gltf) => {
                const carModel = gltf.scene;

                carModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                carModel.scale.set(5,5, 5); 
                carModel.position.set(+15, 0, -40); 
                
                carModel.rotation.y = Math.PI; 

                scene.add(carModel);
                
                console.log("🏎️ Araba başarıyla yüklendi!");
                resolve(carModel); 
            },
            (xhr) => {
                // Yükleme yüzdesi (Console'da görebilirsin)
                console.log((xhr.loaded / xhr.total * 100) + '% yüklendi');
            },
            (error) => {
                console.error('Araba yüklenirken hata oluştu:', error);
                reject(error);
            }
        );
    });
}

