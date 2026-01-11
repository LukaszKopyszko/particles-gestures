/**
 * META
 * @file: src/components/HUD.tsx
 * @role: component
 * @does: Displays UI overlay with FPS, gesture feedback, and legend. Optimized with React.memo.
 * @depends_on: useInputStore
 * @used_by: SceneRoot.tsx
 */
'use client';

import React, { useEffect, useState, memo } from 'react';
import { useInputStore, VisualMode } from '@/state/useInputStore';

// Narrow style for reuse
const baseStyle: React.CSSProperties = {
    fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
    fontSize: 9,
    letterSpacing: 0.5
};

const Legend = memo(({ gesture }: { gesture: string }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 55,
            left: 12,
            zIndex: 50,
            pointerEvents: 'none'
        }}>
            <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', fontSize: 8 }}>
                Gestures
            </div>
            {[
                { key: 'open', icon: '✋', label: 'Flow' },
                { key: 'fist', icon: '✊', label: 'Color' },
                { key: 'pointing', icon: '☝️', label: 'Attract' },
                { key: 'peace', icon: '✌️', label: 'Spread' },
                { key: 'thumbsup', icon: '👍', label: 'Nice!' },
                { key: 'ok', icon: '👌', label: 'Perfect' },
                { key: 'middle', icon: '🖕', label: 'Boom!' },
            ].map((item) => (
                <div key={item.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                    opacity: gesture === item.key ? 1 : 0.45,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: gesture === item.key ? 'translateX(4px)' : 'none',
                    filter: gesture === item.key ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none'
                }}>
                    <span style={{ fontSize: 12 }}>{item.icon}</span>
                    <span style={{
                        ...baseStyle,
                        color: '#ffffff',
                        fontSize: 8,
                        fontWeight: gesture === item.key ? 700 : 400,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}>
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
});
Legend.displayName = 'Legend';

const Stats = memo(({ fps, isDetected, colorName }: { fps: number, isDetected: boolean, colorName: string }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 50,
            pointerEvents: 'none',
            textAlign: 'right'
        }}>
            <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                <span style={{ color: fps > 50 ? '#4ade80' : fps > 30 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>{fps}</span> FPS
            </div>
            <div style={{
                ...baseStyle,
                color: isDetected ? '#4ade80' : '#f87171',
                marginTop: 3,
                textShadow: isDetected ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
                fontWeight: 600
            }}>
                {isDetected ? '● TRACKING' : '○ SEARCHING'}
            </div>
            <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.4)', marginTop: 3, textTransform: 'uppercase', fontSize: 8 }}>
                {colorName}
            </div>
        </div>
    );
});
Stats.displayName = 'Stats';

const ModeSwitcher = memo(({ currentMode, setMode }: { currentMode: VisualMode, setMode: (m: VisualMode) => void }) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            zIndex: 50,
            display: 'flex',
            gap: 8
        }}>
            {(['kinetic', 'galaxy', 'fire', 'rain'] as const).map((mode) => (
                <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    style={{
                        background: currentMode === mode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
                        color: currentMode === mode ? '#000' : 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: currentMode === mode ? 16 : 8,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        transition: 'all 0.2s',
                        outline: 'none',
                        pointerEvents: 'auto'
                    }}
                >
                    {mode}
                </button>
            ))}
        </div>
    );
});
ModeSwitcher.displayName = 'ModeSwitcher';

export const HUD: React.FC = () => {
    // Selectors are optimized to only trigger re-render of HUD when these values change
    const isDetected = useInputStore((s) => s.hand.isDetected);
    const gesture = useInputStore((s) => s.gesture);
    const fps = useInputStore((s) => s.fps);
    const colorName = useInputStore((s) => s.colorName);
    const showMiddleMessage = useInputStore((s) => s.showMiddleMessage);
    const hideMiddleMessage = useInputStore((s) => s.hideMiddleMessage);
    const showThumbsUp = useInputStore((s) => s.showThumbsUp);
    const hideThumbsUp = useInputStore((s) => s.hideThumbsUp);
    const visualMode = useInputStore((s) => s.visualMode);
    const setVisualMode = useInputStore((s) => s.setVisualMode);

    const [middleVisible, setMiddleVisible] = useState(false);
    const [thumbsVisible, setThumbsVisible] = useState(false);

    useEffect(() => {
        if (showMiddleMessage) {
            setMiddleVisible(true);
            const timer = setTimeout(() => {
                setMiddleVisible(false);
                hideMiddleMessage();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [showMiddleMessage, hideMiddleMessage]);

    useEffect(() => {
        if (showThumbsUp) {
            setThumbsVisible(true);
            const timer = setTimeout(() => {
                setThumbsVisible(false);
                hideThumbsUp();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showThumbsUp, hideThumbsUp]);

    const gestureInfo: Record<string, { icon: string; label: string }> = {
        none: { icon: '👋', label: 'Show hand' },
        open: { icon: '✋', label: 'Open Palm' },
        fist: { icon: '✊', label: 'Fist' },
        pointing: { icon: '☝️', label: 'Pointing' },
        peace: { icon: '✌️', label: 'Peace' },
        middle: { icon: '🖕', label: 'Middle' },
        thumbsup: { icon: '👍', label: 'Thumbs Up' },
        ok: { icon: '👌', label: 'Perfect' }
    };

    const current = gestureInfo[gesture] || gestureInfo.none;

    return (
        <>
            {/* Feedback Messages */}
            {middleVisible && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, pointerEvents: 'none' }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#ff3333', textShadow: '0 0 30px #ff0000', letterSpacing: 8, animation: 'pulse 0.3s ease-in-out infinite' }}>FUCK YOU!</div>
                </div>
            )}

            {thumbsVisible && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, pointerEvents: 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: 80, marginBottom: 10 }}>👍</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#4ade80', textShadow: '0 0 20px #22c55e', letterSpacing: 4 }}>NICE!</div>
                </div>
            )}

            <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>

            {/* UI Groups */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50, pointerEvents: 'none' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: 4, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>AETHER</div>
                <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.45)', marginTop: 1, textTransform: 'uppercase', fontSize: 7, letterSpacing: 2 }}>Gesture Kinetic System</div>
            </div>

            <Legend gesture={gesture} />
            <Stats fps={fps} isDetected={isDetected} colorName={colorName} />

            {/* Bottom Center - Current Status */}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 20,
                    background: gesture === 'middle' ? 'rgba(255,50,50,0.4)' : gesture === 'thumbsup' ? 'rgba(74,222,128,0.4)' : 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}>
                    <span style={{ fontSize: 16 }}>{current.icon}</span>
                    <span style={{ ...baseStyle, color: '#ffffff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>{current.label}</span>
                </div>
            </div>

            <ModeSwitcher currentMode={visualMode} setMode={setVisualMode} />
        </>
    );
};
