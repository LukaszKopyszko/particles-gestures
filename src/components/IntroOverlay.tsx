/**
 * META
 * @file: src/components/IntroOverlay.tsx
 * @role: component
 * @does: Displays welcome modal with instructions and requesting camera access.
 * @depends_on: None
 * @used_by: SceneRoot.tsx
 */
'use client';

import React from 'react';

interface Props {
    onStart: () => void;
}

export const IntroOverlay: React.FC<Props> = ({ onStart }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100%',
            zIndex: 2000,
            background: 'rgba(5, 5, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
            color: '#fff'
        }}>
            <div style={{
                maxWidth: 500,
                width: '90%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 40,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: 12,
                    letterSpacing: 4,
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: 16,
                    textTransform: 'uppercase'
                }}>
                    Interactive Demo
                </div>

                <h1 style={{
                    fontSize: 32,
                    fontWeight: 700,
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Aether Kinetic
                </h1>

                <p style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: 32
                }}>
                    Control particles with your hand movements. Allow camera access to begin the experience.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 32,
                    textAlign: 'left'
                }}>
                    {[
                        { icon: '✋', label: 'Move Hand', desc: 'Flow particles' },
                        { icon: '✊', label: 'Close Fist', desc: 'Change colors' },
                        { icon: '👌', label: 'OK Sign', desc: 'Perfect mode' },
                        { icon: '🖕', label: 'Middle', desc: 'Explosion' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: 12,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <span style={{ fontSize: 24 }}>{item.icon}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e7ff' }}>{item.label}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onStart}
                    style={{
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        padding: '16px 32px',
                        fontSize: 14,
                        fontWeight: 700,
                        borderRadius: 100,
                        cursor: 'pointer',
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        transition: 'transform 0.2s',
                        outline: 'none'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Start Experience
                </button>

                <div style={{ marginTop: 16, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                    Works best on desktop with good lighting. <br />
                    Your video is processed locally.
                </div>
            </div>
        </div>
    );
};
