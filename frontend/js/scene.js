import * as THREE from 'three'; 

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
document.body.appendChild(renderer.domElement);

export function createLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    
    scene.add(directionalLight);
}

export function createEnvironment() {
    // Zemin
    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 'grey', roughness: 0.8 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const gridHelper = new THREE.GridHelper(200, 50, 0x000000, 0x555555);
    scene.add(gridHelper);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

export function createDecisionWalls(scene, zPosition) {
    
    function createWallWithText(text, color, x, z, type) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; 
        canvas.height = 256;
        
        context.fillStyle = color; 
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 100px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);

        const geometry = new THREE.BoxGeometry(10, 8, 1); 
        const material = new THREE.MeshStandardMaterial({ 
            map: texture, 
            roughness: 0.7 
        });

        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, 4, z); 
        
        wall.userData = { isAnswer: true, type: type, text: text };

        scene.add(wall);
        return wall;
    }

    const yesWall = createWallWithText("EVET", "#00aa00", -8, zPosition, "yes");
    const noWall = createWallWithText("HAYIR", "#aa0000", 8, zPosition, "no");

    return [yesWall, noWall];
}