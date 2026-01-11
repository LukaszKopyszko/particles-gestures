/**
 * META
 * @file: src/state/useInputStore.ts
 * @role: state-management
 * @does: Manages global application state for hand tracking, gestures, and visual modes using Zustand.
 * @depends_on: zustand
 * @used_by: SceneRoot.tsx, HUD.tsx, ParticleEngine.ts
 */
import { create } from 'zustand';

export type VisualMode = 'kinetic' | 'galaxy' | 'fire' | 'rain' | 'vortex' | 'spectrum';
export type HandType = 'Left' | 'Right' | 'Unknown';

export interface HandData {
    x: number;
    y: number;
    isDetected: boolean;
    handedness: HandType;
}

export type GestureType = 'none' | 'open' | 'fist' | 'pointing' | 'peace' | 'middle' | 'thumbsup' | 'ok';

interface InputState {
    // State
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
    energyLevel: number;
    isAudioReactive: boolean;
    modeChangeMessage: string;

    // Actions
    updateHand: (x: number, y: number, isDetected: boolean, handedness: HandType, handIndex?: number) => void;
    setGesture: (gesture: GestureType, confidence: number, handIndex?: number) => void;
    setFps: (fps: number) => void;
    setColor: (index: number, name: string) => void;
    triggerMiddleFinger: () => void;
    hideMiddleMessage: () => void;
    triggerThumbsUp: () => void;
    hideThumbsUp: () => void;
    setVisualMode: (mode: VisualMode) => void;
    setEnergyLevel: (level: number) => void;
    toggleAudioReactivity: () => void;
    setModeMessage: (msg: string) => void;
}

const COLOR_NAMES = ['Cyan', 'Ember', 'Lime', 'Violet', 'Gold'];

export const useInputStore = create<InputState>((set) => ({
    hand: { x: 0.5, y: 0.5, isDetected: false, handedness: 'Unknown' },
    hand2: { x: 0.5, y: 0.5, isDetected: false, handedness: 'Unknown' },
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
    isAudioReactive: true,
    modeChangeMessage: '',

    updateHand: (x, y, isDetected, handedness, handIndex = 0) => set((state) => ({
        hand: handIndex === 0 ? { x, y, isDetected, handedness } : state.hand,
        hand2: handIndex === 1 ? { x, y, isDetected, handedness } : state.hand2,
    })),
    setGesture: (gesture, confidence, handIndex = 0) => set((state) => ({
        gesture: handIndex === 0 ? gesture : state.gesture,
        gesture2: handIndex === 1 ? gesture : state.gesture2,
        gestureConfidence: handIndex === 0 ? confidence : state.gestureConfidence,
    })),
    setFps: (fps) => set({ fps }),
    setColor: (index, name) => set({ colorIndex: index, colorName: name }),
    triggerMiddleFinger: () => set({ showMiddleMessage: true }),
    hideMiddleMessage: () => set({ showMiddleMessage: false }),
    triggerThumbsUp: () => set({ showThumbsUp: true }),
    hideThumbsUp: () => set({ showThumbsUp: false }),
    setVisualMode: (mode) => set({ visualMode: mode }),
    setEnergyLevel: (level) => set({ energyLevel: level }),
    toggleAudioReactivity: () => set((state) => ({ isAudioReactive: !state.isAudioReactive })),
    setModeMessage: (msg) => set({ modeChangeMessage: msg })
}));

export { COLOR_NAMES };
