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
export type VisualMode = 'kinetic' | 'galaxy' | 'fire' | 'rain' | 'vortex' | 'spectrum';

interface InputState {
    hand: HandData;
    hand2: HandData;
    gesture: GestureType;
    gesture2: GestureType;
    gestureConfidence: number;
    visualMode: VisualMode;
    fps: number;
    colorIndex: number;
    colorName: string;
    showMiddleMessage: boolean;
    showThumbsUp: boolean;
    explosionTrigger: number;
    energyLevel: number; // 0.0 - 1.0 for "charging" effect

    updateHand: (x: number, y: number, isDetected: boolean, handIndex?: number) => void;
    setGesture: (gesture: GestureType, confidence: number, handIndex?: number) => void;
    setFps: (fps: number) => void;
    setColor: (index: number, name: string) => void;
    triggerMiddleFinger: () => void;
    hideMiddleMessage: () => void;
    triggerThumbsUp: () => void;
    hideThumbsUp: () => void;
    setVisualMode: (mode: VisualMode) => void;
    setEnergyLevel: (level: number) => void;
}

const COLOR_NAMES = ['Cyan', 'Ember', 'Lime', 'Violet', 'Gold'];

export const useInputStore = create<InputState>((set) => ({
    hand: { x: 0.5, y: 0.5, isDetected: false },
    hand2: { x: 0.5, y: 0.5, isDetected: false },
    gesture: 'none',
    gesture2: 'none',
    gestureConfidence: 0,
    visualMode: 'kinetic',
    fps: 0,
    colorIndex: 0,
    colorName: COLOR_NAMES[0],
    showMiddleMessage: false,
    showThumbsUp: false,
    explosionTrigger: 0,
    energyLevel: 0,

    updateHand: (x, y, isDetected, handIndex = 0) => set((state) => ({
        hand: handIndex === 0 ? { x, y, isDetected } : state.hand,
        hand2: handIndex === 1 ? { x, y, isDetected } : state.hand2,
    })),
    setGesture: (gesture, confidence, handIndex = 0) => set((state) => ({
        gesture: handIndex === 0 ? gesture : state.gesture,
        gesture2: handIndex === 1 ? gesture : state.gesture2,
        gestureConfidence: handIndex === 0 ? confidence : state.gestureConfidence,
    })),
    setFps: (fps) => set({ fps }),
    setColor: (index, name) => set({ colorIndex: index, colorName: name }),

    triggerMiddleFinger: () => set((state) => ({
        showMiddleMessage: true,
        explosionTrigger: state.explosionTrigger + 1
    })),
    hideMiddleMessage: () => set({ showMiddleMessage: false }),

    triggerThumbsUp: () => set({ showThumbsUp: true }),
    hideThumbsUp: () => set({ showThumbsUp: false }),

    setVisualMode: (mode) => set({ visualMode: mode }),
    setEnergyLevel: (level) => set({ energyLevel: level })
}));

export { COLOR_NAMES };
