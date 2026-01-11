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
import { CameraPreviewOverlay } from './CameraPreviewOverlay';
import { IntroOverlay } from './IntroOverlay';
import { HUD } from './HUD';
import { useInputStore, COLOR_NAMES } from '@/state/useInputStore';

export default function SceneRoot() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ParticleEngine | null>(null);
    const trackerRef = useRef<HandTrackerService | null>(null);
    const [hasStarted, setHasStarted] = React.useState(false);

    const inputStateRef = useRef<ParticleSystemState>({
        handX: 0.5,
        handY: 0.5,
        handVx: 0,
        handVy: 0,
        isFist: false,
        isMiddle: false,
        aspect: 1,
        colorPaletteIndex: 0,
        explosionStrength: 0
    });

    const updateHand = useInputStore((s) => s.updateHand);
    const setGesture = useInputStore((s) => s.setGesture);
    const setFps = useInputStore((s) => s.setFps);
    const setColor = useInputStore((s) => s.setColor);
    const triggerMiddleFinger = useInputStore((s) => s.triggerMiddleFinger);
    const triggerThumbsUp = useInputStore((s) => s.triggerThumbsUp);
    const explosionTrigger = useInputStore((s) => s.explosionTrigger);

    const normalizer = useRef(new HandStateNormalizer());
    const classifier = useRef(new GestureClassifier());
    const fpsFrames = useRef<number[]>([]);
    const lastExplosion = useRef(0);

    useEffect(() => {
        if (explosionTrigger > lastExplosion.current) {
            lastExplosion.current = explosionTrigger;
            inputStateRef.current.explosionStrength = 1.0;
        }
    }, [explosionTrigger]);

    const handleVideoReady = useCallback(async (video: HTMLVideoElement) => {
        if (trackerRef.current) return;

        const tracker = new HandTrackerService();
        trackerRef.current = tracker;

        await tracker.start(video, (result) => {
            if (!result.landmarks || result.landmarks.length === 0) {
                updateHand(inputStateRef.current.handX, inputStateRef.current.handY, false);
                setGesture('none', 0);
                return;
            }

            const landmarks = result.landmarks[0];
            const pos = normalizer.current.process(landmarks);
            const gestureResult = classifier.current.process(landmarks);

            inputStateRef.current.handX = pos.x;
            inputStateRef.current.handY = pos.y;
            inputStateRef.current.handVx = pos.vx;
            inputStateRef.current.handVy = pos.vy;

            if (gestureResult.changed) {
                if (gestureResult.gesture === GestureType.FIST) {
                    inputStateRef.current.colorPaletteIndex += 1;
                    const idx = inputStateRef.current.colorPaletteIndex % COLOR_NAMES.length;
                    setColor(idx, COLOR_NAMES[idx]);
                }

                if (gestureResult.gesture === GestureType.MIDDLE) {
                    triggerMiddleFinger();
                }

                if (gestureResult.gesture === GestureType.THUMBSUP) {
                    triggerThumbsUp();
                }
            }

            inputStateRef.current.isFist = gestureResult.gesture === GestureType.FIST;
            inputStateRef.current.isMiddle = gestureResult.gesture === GestureType.MIDDLE;

            updateHand(pos.x, pos.y, true);
            setGesture(gestureResult.gesture as any, gestureResult.confidence);
        });

        tracker.initialize().catch(console.error);
    }, [updateHand, setGesture, setColor, triggerMiddleFinger, triggerThumbsUp]);

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

            if (inputStateRef.current.explosionStrength > 0) {
                inputStateRef.current.explosionStrength -= dt * 1.5;
                if (inputStateRef.current.explosionStrength < 0) {
                    inputStateRef.current.explosionStrength = 0;
                }
            }

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

            {!hasStarted && <IntroOverlay onStart={() => setHasStarted(true)} />}

            {hasStarted && (
                <>
                    <CameraPreviewOverlay onVideoReady={handleVideoReady} />
                    <HUD />
                </>
            )}
        </div>
    );
}
