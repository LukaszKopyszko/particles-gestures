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

const RoleTitle = ({ title, side }: { title: string, side: 'left' | 'right' }) => (
    <div style={{
        ...baseStyle,
        color: side === 'left' ? '#60a5fa' : '#f87171',
        marginBottom: 8,
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: 2,
        borderBottom: `1px solid ${side === 'left' ? 'rgba(96,165,250,0.3)' : 'rgba(248,113,113,0.3)'}`,
        paddingBottom: 2
    }}>
        {title}
    </div>
);

const Legend = memo(({ gesture, isDetected, isDetected2 }: { gesture: string, isDetected: boolean, isDetected2: boolean }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 55,
            left: 12,
            zIndex: 50,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
        }}>
            {/* RIGHT HAND - INTERACTION */}
            <div style={{ opacity: isDetected ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                <RoleTitle title="RIGHT: SCULPTOR" side="right" />
                {[
                    { key: 'open', icon: '✋', label: 'Repel Particles' },
                    { key: 'pointing', icon: '☝️', label: 'Attract Particles' },
                    { key: 'fist', icon: '✊', label: 'Charge Blast' },
                ].map((item) => (
                    <div key={item.key} style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                        opacity: gesture === item.key && isDetected ? 1 : 0.6,
                    }}>
                        <span style={{ fontSize: 12 }}>{item.icon}</span>
                        <span style={{ ...baseStyle, color: '#fff', fontSize: 8 }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* LEFT HAND - SYSTEM */}
            <div style={{ opacity: isDetected2 ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                <RoleTitle title="LEFT: ARCHITECT" side="left" />
                {[
                    { key: 'pointing', icon: '☝️', label: 'Cycle Palette' },
                    { key: 'peace', icon: '✌️', label: 'Set: Rain Mode' },
                    { key: 'ok', icon: '👌', label: 'Set: Galaxy Mode' },
                    { key: 'thumbsup', icon: '👍', label: 'Set: Spectrum' },
                    { key: 'open', icon: '✋', label: 'Set: Kinetic' },
                ].map((item) => (
                    <div key={item.key} style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                        opacity: gesture === item.key && isDetected2 ? 1 : 0.6,
                    }}>
                        <span style={{ fontSize: 12 }}>{item.icon}</span>
                        <span style={{ ...baseStyle, color: '#fff', fontSize: 8 }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});
Legend.displayName = 'Legend';

const Stats = memo(({ fps, isDetected, isDetected2, colorName, isAudio }: { fps: number, isDetected: boolean, isDetected2: boolean, colorName: string, isAudio: boolean }) => {
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 3 }}>
                <div style={{ ...baseStyle, color: isDetected ? '#f87171' : 'rgba(255,255,255,0.2)', fontSize: 7 }}>R-HAND {isDetected ? '●' : '○'}</div>
                <div style={{ ...baseStyle, color: isDetected2 ? '#60a5fa' : 'rgba(255,255,255,0.2)', fontSize: 7 }}>L-HAND {isDetected2 ? '●' : '○'}</div>
            </div>
            <div style={{ ...baseStyle, color: isAudio ? '#4ade80' : 'rgba(255,255,255,0.3)', marginTop: 3, fontSize: 7 }}>
                AUDIO SYNC: {isAudio ? 'ACTIVE' : 'OFF'}
            </div>
            <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.4)', marginTop: 3, textTransform: 'uppercase', fontSize: 8 }}>
                {colorName}
            </div>
        </div>
    );
});
Stats.displayName = 'Stats';

export const HUD: React.FC = () => {
    const isDetected = useInputStore((s) => s.hand.isDetected);
    const isDetected2 = useInputStore((s) => s.hand2.isDetected);
    const gesture = useInputStore((s) => s.gesture);
    const fps = useInputStore((s) => s.fps);
    const colorName = useInputStore((s) => s.colorName);
    const energyLevel = useInputStore((s) => s.energyLevel);
    const isAudio = useInputStore((s) => s.isAudioReactive);
    const modeMessage = useInputStore((s) => s.modeChangeMessage);
    const visualMode = useInputStore((s) => s.visualMode);
    const setVisualMode = useInputStore((s) => s.setVisualMode);
    const setModeMessage = useInputStore((s) => s.setModeMessage);

    const [msgVisible, setMsgVisible] = useState(false);

    useEffect(() => {
        if (modeMessage) {
            setMsgVisible(true);
            const timer = setTimeout(() => {
                setMsgVisible(false);
                setModeMessage('');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [modeMessage, setModeMessage]);

    return (
        <>
            {/* Mode Change Message */}
            <div style={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                pointerEvents: 'none',
                opacity: msgVisible ? 1 : 0,
                transition: 'opacity 0.3s ease-out'
            }}>
                <div style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: 10,
                    textShadow: '0 0 20px rgba(255,255,255,0.5)',
                    textAlign: 'center',
                    textTransform: 'uppercase'
                }}>
                    {modeMessage}
                </div>
            </div>

            {/* AETHER LOGO */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50, pointerEvents: 'none' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: 4, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>AETHER</div>
                <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.45)', marginTop: 1, textTransform: 'uppercase', fontSize: 7, letterSpacing: 2 }}>Kinetic Alchemy System</div>
            </div>

            <Legend gesture={gesture} isDetected={isDetected} isDetected2={isDetected2} />
            <Stats fps={fps} isDetected={isDetected} isDetected2={isDetected2} colorName={colorName} isAudio={isAudio} />

            {/* Energy Bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                height: 3,
                background: 'rgba(255,255,255,0.02)',
                zIndex: 100
            }}>
                <div style={{
                    width: `${energyLevel * 100}%`,
                    height: '100%',
                    background: energyLevel > 0.9 ? '#fff' : '#f87171',
                    boxShadow: energyLevel > 0.8 ? '0 0 30px #f87171' : 'none',
                    transition: 'width 0.1s linear'
                }} />
            </div>

            {/* Mode Indicator (Bottom Center) */}
            <div style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8
            }}>
                <div style={{ ...baseStyle, color: 'rgba(255,255,255,0.3)', fontSize: 7, letterSpacing: 3 }}>CURRENT TOPOLOGY</div>
                <div style={{
                    padding: '8px 32px',
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(10px)'
                }}>
                    {visualMode}
                </div>
            </div>
        </>
    );
};
