/**
 * META
 * @file: src/components/SceneRoot.tsx
 * @role: component (orchestrator)
 * @does: Main application logic. Connects Vision (HandTracker), State (Zustand), and Scene (ParticleEngine).
 * @depends_on: ParticleEngine, HandTrackerService, GestureClassifier, HUD
 * @used_by: app/page.tsx
 */
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { ParticleEngine, ParticleSystemState } from '@/lib/scene/ParticleEngine';
import { HandTrackerService } from '@/lib/vision/HandTrackerService';
import { HandStateNormalizer } from '@/lib/vision/HandStateNormalizer';
import { GestureClassifier, GestureType } from '@/lib/vision/GestureClassifier';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { CameraPreviewOverlay } from './CameraPreviewOverlay';
import { IntroOverlay } from './IntroOverlay';
import { HUD } from './HUD';
import { useInputStore, COLOR_NAMES } from '@/state/useInputStore';

export default function SceneRoot() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ParticleEngine | null>(null);
    const trackerRef = useRef<HandTrackerService | null>(null);
    const audioRef = useRef<AudioEngine | null>(null);
    const [hasStarted, setHasStarted] = React.useState(false);

    const inputStateRef = useRef<ParticleSystemState>({
        handX: 0.5,
        handY: 0.5,
        hand2X: 0.5,
        hand2Y: 0.5,
        handVx: 0,
        handVy: 0,
        isFist: false,
        isMiddle: false,
        aspect: 1,
        colorPaletteIndex: 0,
        explosionStrength: 0,
        visualMode: 'kinetic',
        audioIntensity: 0,
        energyLevel: 0,
        isAudioReactive: true
    });

    // We use selectors to only re-render when a specific value changes
    const updateHand = useInputStore((s) => s.updateHand);
    const setGesture = useInputStore((s) => s.setGesture);
    const setFps = useInputStore((s) => s.setFps);
    const setColor = useInputStore((s) => s.setColor);
    const triggerMiddleFinger = useInputStore((s) => s.triggerMiddleFinger);
    const triggerThumbsUp = useInputStore((s) => s.triggerThumbsUp);
    const explosionTrigger = useInputStore((s) => s.explosionTrigger);
    const visualMode = useInputStore((s) => s.visualMode);
    const setVisualMode = useInputStore((s) => s.setVisualMode);

    // Note: We DON'T select 'hand' here because we don't need it to trigger re-renders in SceneRoot.
    // The engine loop reads from inputStateRef.current which we update manually.

    // Initial audio engine setup
    useEffect(() => {
        audioRef.current = new AudioEngine();
        return () => audioRef.current?.stop();
    }, []);

    // Sync visual mode to ref
    useEffect(() => {
        inputStateRef.current.visualMode = visualMode;
    }, [visualMode]);

    const normalizer = useRef(new HandStateNormalizer());
    const normalizer2 = useRef(new HandStateNormalizer());
    const classifier = useRef(new GestureClassifier());
    const classifier2 = useRef(new GestureClassifier());
    const fpsFrames = useRef<number[]>([]);
    const lastExplosion = useRef(0);

    useEffect(() => {
        if (explosionTrigger > lastExplosion.current) {
            lastExplosion.current = explosionTrigger;
            inputStateRef.current.explosionStrength = 1.0;
            audioRef.current?.playExplosion();
        }
    }, [explosionTrigger]);

    const handleVideoReady = useCallback(async (video: HTMLVideoElement) => {
        if (trackerRef.current) return;

        const tracker = new HandTrackerService();
        trackerRef.current = tracker;

        await tracker.start(video, (result) => {
            const handsToProcess = result.landmarks.length;

            // Clear detection for both indices initially
            // Note: MediaPipe might swap hand indices i=0/1 between frames, 
            // so we rely on result.handedness for role consistency.
            let rightHandIdx = -1;
            let leftHandIdx = -1;

            if (handsToProcess > 0) {
                result.handedness.forEach((h, idx) => {
                    if (h[0].categoryName === 'Right') rightHandIdx = idx;
                    if (h[0].categoryName === 'Left') leftHandIdx = idx;
                });
            }

            // Process Right Hand (The Sculptor - Interaction)
            if (rightHandIdx !== -1) {
                const landmarks = result.landmarks[rightHandIdx];
                const pos = normalizer.current.process(landmarks);
                const gestureResult = classifier.current.process(landmarks);

                inputStateRef.current.handX = pos.x;
                inputStateRef.current.handY = pos.y;
                inputStateRef.current.handVx = pos.vx;
                inputStateRef.current.handVy = pos.vy;
                inputStateRef.current.isFist = gestureResult.gesture === GestureType.FIST;

                updateHand(pos.x, pos.y, true, 'Right', 0);
                setGesture(gestureResult.gesture as any, gestureResult.confidence, 0);
            } else {
                updateHand(0.5, 0.5, false, 'Unknown', 0);
                setGesture('none', 0, 0);
                inputStateRef.current.isFist = false;
            }

            // Process Left Hand (The Architect - System)
            if (leftHandIdx !== -1) {
                const landmarks = result.landmarks[leftHandIdx];
                const pos = normalizer2.current.process(landmarks);
                const gestureResult = classifier2.current.process(landmarks);

                inputStateRef.current.hand2X = pos.x;
                inputStateRef.current.hand2Y = pos.y;

                if (gestureResult.changed) {
                    // Left Hand Colors: Pointing
                    if (gestureResult.gesture === GestureType.POINTING) {
                        inputStateRef.current.colorPaletteIndex += 1;
                        const idx = inputStateRef.current.colorPaletteIndex % COLOR_NAMES.length;
                        const name = COLOR_NAMES[idx];
                        setColor(idx, name);
                        useInputStore.getState().setModeMessage(`PALETTE: ${name}`);
                        audioRef.current?.playSweep();
                    }

                    // Left Hand Modes
                    if (gestureResult.gesture === GestureType.OPEN) {
                        setVisualMode('kinetic');
                        useInputStore.getState().setModeMessage('MODE: KINETIC');
                    }
                    if (gestureResult.gesture === GestureType.OK) {
                        useInputStore.getState().toggleAudioReactivity();
                        const isReact = useInputStore.getState().isAudioReactive;
                        useInputStore.getState().setModeMessage(isReact ? 'AUDIO SOURCE: ON' : 'AUDIO SOURCE: OFF');
                    }
                    if (gestureResult.gesture === GestureType.PEACE) {
                        setVisualMode('rain');
                        useInputStore.getState().setModeMessage('MODE: RAIN');
                    }
                    if (gestureResult.gesture === GestureType.THUMBSUP) {
                        setVisualMode('spectrum');
                        useInputStore.getState().setModeMessage('MODE: SPECTRUM');
                    }
                    // Adding Vortex shortcut
                    if (gestureResult.gesture === GestureType.MIDDLE) {
                        setVisualMode('vortex');
                        useInputStore.getState().setModeMessage('MODE: VORTEX');
                    }
                }

                updateHand(pos.x, pos.y, true, 'Left', 1);
                setGesture(gestureResult.gesture as any, gestureResult.confidence, 1);
            } else {
                updateHand(0.5, 0.5, false, 'Unknown', 1);
                setGesture('none', 0, 1);
                inputStateRef.current.hand2X = 0.5;
                inputStateRef.current.hand2Y = 0.5;
            }
        });

        tracker.initialize().catch(console.error);
    }, [updateHand, setGesture, setColor, triggerMiddleFinger, triggerThumbsUp, setVisualMode]);

    const handleStartExperience = async () => {
        if (audioRef.current) {
            await audioRef.current.init();
        }
        setHasStarted(true);
    };

    useEffect(() => {
        if (!canvasRef.current) return;
        // Engine initializes regardless, but maybe we want to pause it? 
        // For now let's let it run idle in background, it looks cool.

        const engine = new ParticleEngine(canvasRef.current);
        engineRef.current = engine;

        const handleResize = () => {
            engine.resize(window.innerWidth, window.innerHeight);
            inputStateRef.current.aspect = window.innerWidth / window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        let animationId: number;
        let lastTime = performance.now();

        const loop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;

            fpsFrames.current.push(time);
            while (fpsFrames.current.length > 0 && fpsFrames.current[0] < time - 1000) {
                fpsFrames.current.shift();
            }
            if (fpsFrames.current.length % 10 === 0) {
                setFps(fpsFrames.current.length);
            }

            // Sync audio analysis to shader
            if (audioRef.current) {
                const analysis = audioRef.current.getAnalysis();
                inputStateRef.current.audioIntensity = analysis.overall;
            }

            inputStateRef.current.isAudioReactive = useInputStore.getState().isAudioReactive;


            if (inputStateRef.current.explosionStrength > 0) {
                inputStateRef.current.explosionStrength -= dt * 1.5;
                if (inputStateRef.current.explosionStrength < 0) {
                    inputStateRef.current.explosionStrength = 0;
                }
            }

            // Energy Logic: Use FIST to charge
            const gesture1 = useInputStore.getState().gesture;
            const gesture2 = useInputStore.getState().gesture2;
            const isCharging = gesture1 === 'fist' || gesture2 === 'fist';

            const prevEnergy = inputStateRef.current.energyLevel;
            if (isCharging) {
                inputStateRef.current.energyLevel = Math.min(1.0, inputStateRef.current.energyLevel + dt * 0.4);
            } else {
                // If we were charging and released -> Trigger Explosion
                if (prevEnergy > 0.3) {
                    inputStateRef.current.explosionStrength = prevEnergy * 1.5;
                    audioRef.current?.playExplosion();
                }
                inputStateRef.current.energyLevel = Math.max(0.0, inputStateRef.current.energyLevel - dt * 2.0);
            }
            useInputStore.getState().setEnergyLevel(inputStateRef.current.energyLevel);

            engine.update(dt, inputStateRef.current);
            animationId = requestAnimationFrame(loop);
        };
        animationId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            engine.dispose();
            trackerRef.current?.stop();
            trackerRef.current = null;
        };
    }, [setFps]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            // @ts-expect-error dvh is valid CSS
            height: '100dvh',
            background: '#050510',
            overflow: 'hidden'
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />

            {!hasStarted && <IntroOverlay onStart={handleStartExperience} />}

            {hasStarted && (
                <>
                    <CameraPreviewOverlay onVideoReady={handleVideoReady} />
                    <HUD />
                </>
            )}
        </div>
    );
}
