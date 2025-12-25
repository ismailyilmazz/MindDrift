// car_controls.js dosyasının tamamını bununla değiştir:

export class CarController {
    constructor(carMesh) {
        this.carMesh = carMesh;
        
        // Şeritler: Sol(-7.5) | Orta(0) | Sağ(7.5)
        this.lanes = [-7.5, 0, 7.5]; 
        
        // BAŞLANGIÇ AYARI: Kesinlikle ortadan (Index 1) başlatıyoruz.
        this.currentLaneIndex = 1; 
        this.targetX = this.lanes[1]; // Hedef 0

        this.forwardSpeed = 50.0; // Hızı biraz artırdım, akıcı olsun
        this.laneSwitchSpeed = 10.0; 
        this.isGameRunning = false;

        // Başlangıçta arabayı hemen orta şeride ışınla ki kayarak gelmesin
        if (this.carMesh) {
            this.carMesh.position.x = 0;
        }

        window.addEventListener('keydown', (e) => this.handleInput(e));
    }

    handleInput(event) {
        if (!this.isGameRunning) return;

        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.currentLaneIndex > 0) {
                    this.currentLaneIndex--;
                    this.updateTargetLane();
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.currentLaneIndex < this.lanes.length - 1) {
                    this.currentLaneIndex++;
                    this.updateTargetLane();
                }
                break;
        }
    }

    updateTargetLane() {
        this.targetX = this.lanes[this.currentLaneIndex];
    }

    update(deltaTime) {
        if (!this.isGameRunning || !this.carMesh) return;

        // 1. İleri Hareket
        this.carMesh.position.z -= this.forwardSpeed * deltaTime;

        // 2. Şerit Değiştirme (Linear Interpolation)
        // Arabanın mevcut X'ini hedefe doğru kaydır
        this.carMesh.position.x += (this.targetX - this.carMesh.position.x) * this.laneSwitchSpeed * deltaTime;

        // --- DÜZELTME: Tilt (Yatma) efektini kapattık ---
        // Araba modeli ters olduğu için bu efekt arabayı toprağa sokuyor olabilir.
        // Şimdilik araba dümdüz kalsın.
        this.carMesh.rotation.z = 0; 
    }

    stop() {
        this.isGameRunning = false;
    }

    start() {
        this.isGameRunning = true;
    }
    
    getPosition() {
        return this.carMesh.position;
    }
}