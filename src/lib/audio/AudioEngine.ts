/**
 * META
 * @file: src/lib/audio/AudioEngine.ts
 * @role: service (audio)
 * @does: Manages background music, audio analysis (FFT), and gesture SFX.
 * @depends_on: Web Audio API
 * @used_by: SceneRoot.tsx
 */

export interface AudioAnalysis {
    low: number;   // 0.0 - 1.0
    mid: number;   // 0.0 - 1.0
    high: number;  // 0.0 - 1.0
    overall: number;
}

export class AudioEngine {
    private context: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array<ArrayBuffer> | null = null; // Explicitly use ArrayBuffer to avoid SharedArrayBuffer issues in TS 5+

    private bgMusic: HTMLAudioElement | null = null;
    private explosionSfx: HTMLAudioElement | null = null;
    private sweepSfx: HTMLAudioElement | null = null;

    private initialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // UPDATED: Previous Mixkit links were returning 403 Access Denied.
            // Using reliable CORS-compliant placeholders for now.
            // USER: Better to download these files and put them in /public/audio/

            this.bgMusic = new Audio('https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3');
            this.bgMusic.crossOrigin = 'anonymous'; // Required for Web Audio API Analysis
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.4;

            this.explosionSfx = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
            this.explosionSfx.crossOrigin = 'anonymous';
            this.explosionSfx.volume = 0.8;

            this.sweepSfx = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
            this.sweepSfx.crossOrigin = 'anonymous';
            this.sweepSfx.volume = 0.5;
        }
    }

    async init(): Promise<void> {
        if (this.initialized) return;

        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256;

        const source = this.context.createMediaElementSource(this.bgMusic!);
        source.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        // Cast frequency bin count to fix compatibility between shared and regular ArrayBuffer types in modern browsers.
        // This ensures that the Uint8Array is created with a regular ArrayBuffer, not a SharedArrayBuffer,
        // which can cause issues in some environments or older browser versions.
        this.dataArray = new Uint8Array(Number(this.analyser.frequencyBinCount));

        await this.context.resume();
        this.bgMusic?.play().catch(console.error);
        this.initialized = true;
    }

    getAnalysis(): AudioAnalysis {
        if (!this.analyser || !this.dataArray) {
            return { low: 0, mid: 0, high: 0, overall: 0 };
        }

        // Explicit cast to Uint8Array<ArrayBuffer> to satisfy modern TypeScript's stricter buffer checks.
        this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);

        // Simple range calculation
        let low = 0, mid = 0, high = 0;
        const len = this.dataArray.length;
        const third = Math.floor(len / 3);

        for (let i = 0; i < third; i++) low += this.dataArray[i];
        for (let i = third; i < 2 * third; i++) mid += this.dataArray[i];
        for (let i = 2 * third; i < len; i++) high += this.dataArray[i];

        return {
            low: (low / third) / 255,
            mid: (mid / third) / 255,
            high: (high / third) / 255,
            overall: (low + mid + high) / len / 255
        };
    }

    playExplosion(): void {
        if (!this.explosionSfx) return;
        this.explosionSfx.currentTime = 0;
        this.explosionSfx.play().catch(() => { });
    }

    playSweep(): void {
        if (!this.sweepSfx) return;
        this.sweepSfx.currentTime = 0;
        this.sweepSfx.play().catch(() => { });
    }

    setVolume(v: number): void {
        if (this.bgMusic) this.bgMusic.volume = v;
    }

    stop(): void {
        this.bgMusic?.pause();
        if (this.context) this.context.close();
    }
}
