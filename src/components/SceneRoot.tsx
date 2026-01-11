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
        energyLevel: 0
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

            // Update Store and Shaders for 2 hands
            for (let i = 0; i < 2; i++) {
                if (i < handsToProcess) {
                    const landmarks = result.landmarks[i];
                    const norm = i === 0 ? normalizer.current : normalizer2.current;
                    const classif = i === 0 ? classifier.current : classifier2.current;

                    const pos = norm.process(landmarks);
                    const gestureResult = classif.process(landmarks);

                    if (i === 0) {
                        inputStateRef.current.handX = pos.x;
                        inputStateRef.current.handY = pos.y;
                        inputStateRef.current.handVx = pos.vx;
                        inputStateRef.current.handVy = pos.vy;
                        inputStateRef.current.isFist = gestureResult.gesture === GestureType.FIST;
                        inputStateRef.current.isMiddle = gestureResult.gesture === GestureType.MIDDLE;
                    } else {
                        inputStateRef.current.hand2X = pos.x;
                        inputStateRef.current.hand2Y = pos.y;
                    }

                    if (gestureResult.changed) {
                        // Color Change: Pointing
                        if (gestureResult.gesture === GestureType.POINTING) {
                            inputStateRef.current.colorPaletteIndex += 1;
                            const idx = inputStateRef.current.colorPaletteIndex % COLOR_NAMES.length;
                            setColor(idx, COLOR_NAMES[idx]);
                            audioRef.current?.playSweep();
                        }

                        // Mode shortcuts
                        if (gestureResult.gesture === GestureType.OPEN) setVisualMode('kinetic');
                        if (gestureResult.gesture === GestureType.OK) setVisualMode('galaxy');
                        if (gestureResult.gesture === GestureType.PEACE) setVisualMode('rain');
                        if (gestureResult.gesture === GestureType.THUMBSUP) setVisualMode('spectrum');

                        if (gestureResult.gesture === GestureType.MIDDLE) triggerMiddleFinger();
                        if (gestureResult.gesture === GestureType.THUMBSUP) triggerThumbsUp();
                    }

                    // Fist charging logic moved to the main loop based on current store state
                    // but we still need to track if it's currently a fist
                    if (i === 0) {
                        inputStateRef.current.isFist = gestureResult.gesture === GestureType.FIST;
                    }


                    updateHand(pos.x, pos.y, true, i);
                    setGesture(gestureResult.gesture as any, gestureResult.confidence, i);
                } else {
                    // Hand not detected
                    updateHand(0.5, 0.5, false, i);
                    setGesture('none', 0, i);
                    if (i === 1) {
                        inputStateRef.current.hand2X = 0.5;
                        inputStateRef.current.hand2Y = 0.5;
                    }
                }
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
