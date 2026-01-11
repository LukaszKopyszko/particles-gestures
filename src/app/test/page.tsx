'use client';

import { useEffect, useRef, useState } from 'react';

export default function CameraTestPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState('Waiting...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            setStatus('Checking for camera API...');

            if (!navigator.mediaDevices) {
                setError('navigator.mediaDevices is undefined. Are you on HTTPS or localhost?');
                return;
            }

            if (!navigator.mediaDevices.getUserMedia) {
                setError('getUserMedia is not supported in this browser.');
                return;
            }

            setStatus('Requesting camera permission...');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStatus('Camera stream acquired!');

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setStatus('Video playing!');
                        videoRef.current?.play();
                    };
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(`Camera Error: ${message}`);
                setStatus('Failed');
            }
        };

        startCamera();
    }, []);

    return (
        <div style={{
            padding: 40,
            fontFamily: 'monospace',
            background: '#111',
            color: '#fff',
            minHeight: '100vh'
        }}>
            <h1>Camera Test Page</h1>
            <p><strong>Status:</strong> {status}</p>
            {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}

            <div style={{ marginTop: 20, border: '2px solid white', width: 640, height: 480 }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>

            <p style={{ marginTop: 20, color: '#888' }}>
                If you see the video feed above, camera is working correctly.<br />
                If you see an error, copy the message and report it.
            </p>
        </div>
    );
}
