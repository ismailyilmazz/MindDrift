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

    sunLight = new THREE.DirectionalLight(0xffffff, 2.0);

    sunLight.position.set(30, 15, 10);
    sunLight.castShadow = true;

    // Shadow Size
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;

    // Shadow Box
    const d = 100;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;

    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.bias = -0.005

    scene.add(sunLight);

    // Towards Car
    sunLight.target.position.set(0, 0, -50);
    scene.add(sunLight.target);
}


let environmentObjects = {
    road: null,
    leftCurb: null,
    rightCurb: null,
    ground: null
};

const ROAD_WIDTH = 23;
const CURB_WIDTH = 16;
const CURB_HEIGHT = 1.2;
const INITIAL_LENGTH = 15000;

export function createEnvironment() {
    // Main Road
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, INITIAL_LENGTH);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x16213e,
        roughness: 0.1,
        metalness: 0.5
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -INITIAL_LENGTH / 2;
    road.receiveShadow = true;
    scene.add(road);
    environmentObjects.road = road;

 
    const offset = (ROAD_WIDTH / 2) + (CURB_WIDTH / 2);

    const curbGeometry = new THREE.BoxGeometry(CURB_WIDTH, CURB_HEIGHT, INITIAL_LENGTH);

    const curbMaterial = new THREE.MeshStandardMaterial({
        color: 0x800020,
        roughness: 0.9,
        metalness: 0.1
    });

    // Left Curb
    const leftCurb = new THREE.Mesh(curbGeometry, curbMaterial);
    leftCurb.position.z = -INITIAL_LENGTH / 2;
    leftCurb.position.x = -offset;
    leftCurb.position.y = CURB_HEIGHT / 2;
    leftCurb.castShadow = false;
    leftCurb.receiveShadow = true;
    scene.add(leftCurb);
    environmentObjects.leftCurb = leftCurb;

    // Right Curb
    const rightCurb = new THREE.Mesh(curbGeometry, curbMaterial);
    rightCurb.position.z = -INITIAL_LENGTH / 2;
    rightCurb.position.x = offset;
    rightCurb.position.y = CURB_HEIGHT / 2;
    rightCurb.castShadow = false;
    rightCurb.receiveShadow = true;
    scene.add(rightCurb);
    environmentObjects.rightCurb = rightCurb;

    // Space Ground
    const groundGeometry = new THREE.PlaneGeometry(10000, INITIAL_LENGTH + 5000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 1,
        metalness: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.position.z = -INITIAL_LENGTH / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    environmentObjects.ground = ground;

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


export function extendEnvironment(newEndZ) {

    const requiredLength = Math.abs(newEndZ) + 1000;

    const offset = (ROAD_WIDTH / 2) + (CURB_WIDTH / 2);

    // Remove old objects
    if (environmentObjects.road) {
        scene.remove(environmentObjects.road);
        environmentObjects.road.geometry.dispose();
    }
    if (environmentObjects.leftCurb) {
        scene.remove(environmentObjects.leftCurb);
        environmentObjects.leftCurb.geometry.dispose();
    }
    if (environmentObjects.rightCurb) {
        scene.remove(environmentObjects.rightCurb);
        environmentObjects.rightCurb.geometry.dispose();
    }
    if (environmentObjects.ground) {
        scene.remove(environmentObjects.ground);
        environmentObjects.ground.geometry.dispose();
    }

    const newRoadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, requiredLength);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x16213e,
        roughness: 0.1,
        metalness: 0.5
    });
    const newRoad = new THREE.Mesh(newRoadGeometry, roadMaterial);
    newRoad.rotation.x = -Math.PI / 2;
    newRoad.position.z = -requiredLength / 2;
    newRoad.receiveShadow = true;
    scene.add(newRoad);
    environmentObjects.road = newRoad;

    const newCurbGeometry = new THREE.BoxGeometry(CURB_WIDTH, CURB_HEIGHT, requiredLength);
    const curbMaterial = new THREE.MeshStandardMaterial({
        color: 0x800020,
        roughness: 0.9,
        metalness: 0.1
    });

    const newLeftCurb = new THREE.Mesh(newCurbGeometry, curbMaterial);
    newLeftCurb.position.z = -requiredLength / 2;
    newLeftCurb.position.x = -offset;
    newLeftCurb.position.y = CURB_HEIGHT / 2;
    newLeftCurb.castShadow = false;
    newLeftCurb.receiveShadow = true;
    scene.add(newLeftCurb);
    environmentObjects.leftCurb = newLeftCurb;

    const newRightCurb = new THREE.Mesh(newCurbGeometry.clone(), curbMaterial);
    newRightCurb.position.z = -requiredLength / 2;
    newRightCurb.position.x = offset;
    newRightCurb.position.y = CURB_HEIGHT / 2;
    newRightCurb.castShadow = false;
    newRightCurb.receiveShadow = true;
    scene.add(newRightCurb);
    environmentObjects.rightCurb = newRightCurb;

    const newGroundGeometry = new THREE.PlaneGeometry(10000, requiredLength + 5000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 1,
        metalness: 0
    });
    const newGround = new THREE.Mesh(newGroundGeometry, groundMaterial);
    newGround.rotation.x = -Math.PI / 2;
    newGround.position.y = -0.5;
    newGround.position.z = -requiredLength / 2;
    newGround.receiveShadow = true;
    scene.add(newGround);
    environmentObjects.ground = newGround;

    console.log(`🛣️ Çevre uzatıldı: ${requiredLength} birim`);
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

    // Canvas Settings
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;

    // Background
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Frame
    context.strokeStyle = "white";
    context.lineWidth = 15;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Text Wrap
    const fontSize = 60;
    const lineHeight = 80;
    const maxWidth = canvas.width - 100; 

    context.font = `Bold ${fontSize}px Arial`;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Parsing Words
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

    // Aligning Text Vertically
    const totalBlockHeight = lines.length * lineHeight;
    let currentY = (canvas.height - totalBlockHeight) / 2 + (lineHeight / 2);

    // Drawing Text
    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], canvas.width / 2, currentY);
        currentY += lineHeight;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const govdeRengi = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5 });
    const onYuzMateryali = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 });

    const materials = [
        govdeRengi,    
        govdeRengi,     
        govdeRengi,     
        govdeRengi,    
        onYuzMateryali, 
        govdeRengi     
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
    return new Promise((resolve) => {
        console.log("🏎️ Araba modeli yükleniyor...");

        const loader = new GLTFLoader();

        loader.load(
            'assets/lowpolycar.glb',
            (gltf) => {
                const carModel = gltf.scene;

                carModel.scale.set(3, 3, 3);

                // Cast ve Receive Shadow
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

            (xhr) => {
                console.log(`Yükleniyor: %${(xhr.loaded / xhr.total * 100).toFixed(0)}`);
            },

            // Red Box for Error State
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

