'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
    onVideoReady: (video: HTMLVideoElement) => void;
}

export const CameraPreviewOverlay: React.FC<Props> = ({ onVideoReady }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'init' | 'live' | 'error'>('init');

    useEffect(() => {
        let stream: MediaStream | null = null;
        let mounted = true;

        const initCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setStatus('error');
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' }
                });

                if (!mounted || !videoRef.current) return;
                videoRef.current.srcObject = stream;

                await new Promise<void>((resolve) => {
                    if (!videoRef.current) return resolve();
                    videoRef.current.onloadedmetadata = () => resolve();
                });

                if (!mounted || !videoRef.current) return;
                await videoRef.current.play();
                setStatus('live');
                onVideoReady(videoRef.current);
            } catch {
                setStatus('error');
            }
        };

        initCamera();

        return () => {
            mounted = false;
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [onVideoReady]);

    return (
        <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            width: 140,
            height: 105,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 100
        }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    opacity: status === 'live' ? 1 : 0.3
                }}
            />

            {/* Status dot */}
            <div style={{
                position: 'absolute',
                top: 6,
                left: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4
            }}>
                <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: status === 'live' ? '#22c55e' : status === 'error' ? '#ef4444' : '#eab308',
                    boxShadow: status === 'live' ? '0 0 6px #22c55e' : undefined
                }} />
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    {status}
                </span>
            </div>
        </div>
    );
};
