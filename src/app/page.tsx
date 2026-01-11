'use client';

import dynamic from 'next/dynamic';

const SceneRoot = dynamic(() => import('@/components/SceneRoot'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw',
      height: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      Initializing System...
    </div>
  ),
});

export default function Home() {
  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      // @ts-expect-error dvh is valid CSS
      height: '100dvh',
      background: '#000',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <SceneRoot />
    </main>
  );
}
