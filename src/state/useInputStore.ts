/**
 * META
 * @file: src/state/useInputStore.ts
 * @role: store (zustand)
 * @does: Manages global reactive state (hand position, gesture type, fps, colors).
 * @depends_on: zustand
 * @used_by: HUD.tsx, SceneRoot.tsx
 */
import { create } from 'zustand';

export interface HandData {
    x: number;
    y: number;
    isDetected: boolean;
}

export type GestureType = 'none' | 'open' | 'fist' | 'pointing' | 'peace' | 'middle' | 'thumbsup' | 'ok';

interface InputState {
    hand: HandData;
    gesture: GestureType;
    gestureConfidence: number;
    fps: number;
    colorIndex: number;
    colorName: string;
    showMiddleMessage: boolean;
    showThumbsUp: boolean;
    explosionTrigger: number;

    updateHand: (x: number, y: number, isDetected: boolean) => void;
    setGesture: (gesture: GestureType, confidence: number) => void;
    setFps: (fps: number) => void;
    setColor: (index: number, name: string) => void;
    triggerMiddleFinger: () => void;
    hideMiddleMessage: () => void;
    triggerThumbsUp: () => void;
    hideThumbsUp: () => void;
}

const COLOR_NAMES = ['Cyan', 'Ember', 'Lime', 'Violet', 'Gold'];

export const useInputStore = create<InputState>((set) => ({
    hand: { x: 0.5, y: 0.5, isDetected: false },
    gesture: 'none',
    gestureConfidence: 0,
    fps: 0,
    colorIndex: 0,
    colorName: COLOR_NAMES[0],
    showMiddleMessage: false,
    showThumbsUp: false,
    explosionTrigger: 0,

    updateHand: (x, y, isDetected) => set({ hand: { x, y, isDetected } }),
    setGesture: (gesture, confidence) => set({ gesture, gestureConfidence: confidence }),
    setFps: (fps) => set({ fps }),
    setColor: (index, name) => set({ colorIndex: index, colorName: name }),

    triggerMiddleFinger: () => set((state) => ({
        showMiddleMessage: true,
        explosionTrigger: state.explosionTrigger + 1
    })),
    hideMiddleMessage: () => set({ showMiddleMessage: false }),

    triggerThumbsUp: () => set({ showThumbsUp: true }),
    hideThumbsUp: () => set({ showThumbsUp: false })
}));

export { COLOR_NAMES };
