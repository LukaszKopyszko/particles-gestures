export interface NormalizedHandState {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

export class HandStateNormalizer {
    // Heavier smoothing for less jitter
    private smoothingFactor = 0.25;
    private velocitySmoothing = 0.15;

    private prevX = 0.5;
    private prevY = 0.5;
    private prevVx = 0;
    private prevVy = 0;

    process(landmarks: any[]): NormalizedHandState {
        if (!landmarks || landmarks.length < 21) {
            return { x: this.prevX, y: this.prevY, vx: 0, vy: 0 };
        }

        // Use palm center (average of wrist + middle finger MCP) for stability
        const wrist = landmarks[0];
        const middleMcp = landmarks[9];

        const rawX = 1 - (wrist.x + middleMcp.x) / 2; // Mirror
        const rawY = (wrist.y + middleMcp.y) / 2;

        // Smooth position
        const smoothX = this.prevX + (rawX - this.prevX) * this.smoothingFactor;
        const smoothY = this.prevY + (rawY - this.prevY) * this.smoothingFactor;

        // Calculate and smooth velocity
        const rawVx = (smoothX - this.prevX) * 60; // Scale for visual impact
        const rawVy = (smoothY - this.prevY) * 60;

        const vx = this.prevVx + (rawVx - this.prevVx) * this.velocitySmoothing;
        const vy = this.prevVy + (rawVy - this.prevVy) * this.velocitySmoothing;

        this.prevX = smoothX;
        this.prevY = smoothY;
        this.prevVx = vx;
        this.prevVy = vy;

        return { x: smoothX, y: smoothY, vx, vy };
    }

    reset() {
        this.prevX = 0.5;
        this.prevY = 0.5;
        this.prevVx = 0;
        this.prevVy = 0;
    }
}
