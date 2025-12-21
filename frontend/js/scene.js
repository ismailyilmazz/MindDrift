import * as THREE from 'three';

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

export const renderer = new THREE.WebGLRenderer();

export let road;
export let barriers = [];

export function initScene ( ){

    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5,10,7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    const roadGeometry = new THREE.PlaneGeometry(20,1000);
    const roadMaterial = new THREE.MeshStandardMaterial({color: 0x333333});
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    camera.position.set(0,5,10);
}

function createTextTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'Bold 40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    return new THREE.CanvasTexture(canvas);
}

export function createBarrier(zPos,text,type){

    let color = (type === 'YES') ? '#2ecc71' : (type === 'NO') ? '#e74c3c' : '#f1c40f';
    const geometry = new THREE.BoxGeometry(4,2,0.5);
    const material = new THREE.MeshStandardMaterial({
        map: createTextTexture(text, color)
    });

    const barrier = new THREE.Mesh(geometry, material);
    barrier.position.set(0,1,zPos);
    barrier.castShadow = true;
    barrier.userData = { type: type, active: true };
    scene.add(barrier);
    barriers.push(barrier);

    return barrier;
}



