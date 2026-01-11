/**
 * META
 * @file: src/components/HUD.tsx
 * @role: component
 * @does: Displays UI overlay with FPS, gesture feedback, and legend.
 * @depends_on: useInputStore
 * @used_by: SceneRoot.tsx
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useInputStore } from '@/state/useInputStore';

export const HUD: React.FC = () => {
    const hand = useInputStore((s) => s.hand);
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

    const baseStyle: React.CSSProperties = {
        fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
        fontSize: 9,
        letterSpacing: 0.5
    };

    return (
        <>
            {/* FUCK YOU Message */}
            {middleVisible && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        fontSize: 48,
                        fontWeight: 900,
                        color: '#ff3333',
                        textShadow: '0 0 30px #ff0000, 0 0 60px #ff0000',
                        letterSpacing: 8,
                        animation: 'pulse 0.3s ease-in-out infinite'
                    }}>
                        FUCK YOU!
                    </div>
                </div>
            )}

            {/* Thumbs Up Message */}
            {thumbsVisible && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 80, marginBottom: 10 }}>👍</div>
                    <div style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#4ade80',
                        textShadow: '0 0 20px #22c55e',
                        letterSpacing: 4
                    }}>
                        NICE!
                    </div>
                </div>
            )}

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

            {/* Top Left - Title */}
            <div style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 50,
                pointerEvents: 'none'
            }}>
                <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: 3
                }}>
                    AETHER
                </div>
                <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                    Gesture Control
                </div>
            </div>

            {/* Left Side - Legend */}
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
                        gap: 5,
                        marginBottom: 3,
                        opacity: gesture === item.key ? 1 : 0.35,
                        transition: 'opacity 0.2s'
                    }}>
                        <span style={{ fontSize: 11 }}>{item.icon}</span>
                        <span style={{ ...baseStyle, color: 'rgba(255,255,255,0.7)', fontSize: 8 }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Top Right - Stats */}
            <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 50,
                pointerEvents: 'none',
                textAlign: 'right'
            }}>
                <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.35)' }}>
                    <span style={{ color: fps > 50 ? '#4ade80' : fps > 30 ? '#fbbf24' : '#f87171' }}>{fps}</span> FPS
                </div>
                <div style={{
                    ...baseStyle,
                    color: hand.isDetected ? '#4ade80' : '#f87171',
                    marginTop: 3
                }}>
                    {hand.isDetected ? '● TRACKING' : '○ SEARCHING'}
                </div>
                <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>
                    {colorName}
                </div>
            </div>

            {/* Bottom Center - Current Gesture */}
            <div style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                pointerEvents: 'none'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    borderRadius: 16,
                    background: gesture === 'middle'
                        ? 'rgba(255,50,50,0.3)'
                        : gesture === 'thumbsup'
                            ? 'rgba(74,222,128,0.3)'
                            : gesture === 'fist'
                                ? 'rgba(251,146,60,0.2)'
                                : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <span style={{ fontSize: 14 }}>{current.icon}</span>
                    <span style={{ ...baseStyle, color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                        {current.label}
                    </span>
                </div>
            </div>

            {/* Bottom Right - Mode Switcher */}
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
                        onClick={() => setVisualMode(mode)}
                        style={{
                            background: visualMode === mode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
                            color: visualMode === mode ? '#000' : 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: visualMode === mode ? 16 : 8,
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
        </>
    );
};
