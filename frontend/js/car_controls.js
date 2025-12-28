export class CarController {
    constructor(carMesh) {
        this.carMesh = carMesh;
        
        // Lines: Left(-7.5) | Center(0) | Right(7.5)
        this.lanes = [-7.5, 0, 7.5]; 
        
        // STARTING POSITION: Always start from center
        this.currentLaneIndex = 1; 
        this.targetX = this.lanes[1];

        this.forwardSpeed = 30.0;
        this.laneSwitchSpeed = 10.0; 
        this.isGameRunning = false;

        if (this.carMesh) {
            this.carMesh.position.x = 0;
        }

        window.addEventListener('keydown', (e) => this.handleInput(e));
    }

    // Left-Right Movement Input
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

    // Update Target X based on current lane
    updateTargetLane() {
        this.targetX = this.lanes[this.currentLaneIndex];
    }

    // Update Car Position
    update(deltaTime) {
        if (!this.isGameRunning || !this.carMesh) return;

        // Forward Movement
        this.carMesh.position.z -= this.forwardSpeed * deltaTime;

        // Lateral Movement
        this.carMesh.position.x += (this.targetX - this.carMesh.position.x) * this.laneSwitchSpeed * deltaTime;
        this.carMesh.rotation.z = 0; 
    }

    // Stop the car
    stop() {
        this.isGameRunning = false;
    }

    // Start the car
    start() {
        this.isGameRunning = true;
    }
   
    // Get current position
    getPosition() {
        return this.carMesh.position;
    }
}