/**
 * META
 * @file: src/lib/vision/HandTrackerService.ts
 * @role: service
 * @does: Handles camera initialization and MediaPipe HandLandmarker stream processing.
 * @depends_on: @mediapipe/tasks-vision
 * @used_by: SceneRoot.tsx
 */
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export type HandLandmarkerCallback = (result: HandLandmarkerResult) => void;

export class HandTrackerService {
    private handLandmarker: HandLandmarker | null = null;
    private video: HTMLVideoElement | null = null;
    private running = false;
    private lastVideoTime = -1;
    private callback: HandLandmarkerCallback | null = null;
    private animationFrameId: number | null = null;

    constructor() {
        //
    }

    async initialize(): Promise<void> {
        console.log("Initializing HandTrackerService (loading model)...");
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            console.log("HandLandmarker model loaded.");
        } catch (e) {
            console.error("Failed to load MediaPipe model:", e);
        }
    }

    async start(videoElement: HTMLVideoElement, onResults: HandLandmarkerCallback): Promise<void> {
        this.video = videoElement;
        this.callback = onResults;

        // If video already has a stream (from Overlay), reuse it.
        if (this.video.srcObject) {
            console.log("[Service] Using existing video stream from Overlay. ID:", (this.video.srcObject as MediaStream).id);
        } else {
            // Fallback: Request camera if not provided
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("Browser API navigator.mediaDevices.getUserMedia not available.");
                throw new Error("Camera API unavailable");
            }

            try {
                console.log("[Service] Requesting navigator.mediaDevices.getUserMedia (Fallback)...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user"
                    }
                });
                console.log("[Service] Camera Stream acquired (Fallback):", stream.id);
                this.video.srcObject = stream;
            } catch (err) {
                console.error("Error accessing camera inside Service:", err);
                throw err;
            }
        }

        // Ensure playing
        if (this.video.paused) {
            console.log("[Service] Video is paused, attempting play()...");
            await this.video.play().catch(e => console.error("Video play() failed:", e));
        }

        this.running = true;
        console.log("[Service] Starting tracking loop.");
        this.loop();
    }

    stop(): void {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private lastProcessedTime = 0;
    private targetFPS = 25; // 25-30 FPS is plenty for smooth gestures

    private loop = (): void => {
        if (!this.running || !this.video) return;

        const now = performance.now();
        const elapsed = now - this.lastProcessedTime;

        if (this.handLandmarker) {
            // Only process if enough time has passed AND video is ready
            if (elapsed > (1000 / this.targetFPS) &&
                this.video.currentTime !== this.lastVideoTime &&
                this.video.readyState >= 2) {

                this.lastVideoTime = this.video.currentTime;
                this.lastProcessedTime = now;

                try {
                    const results = this.handLandmarker.detectForVideo(this.video, now);
                    if (this.callback) this.callback(results);
                } catch (e) {
                    console.warn("MediaPipe detect error:", e);
                }
            }
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    };
}
