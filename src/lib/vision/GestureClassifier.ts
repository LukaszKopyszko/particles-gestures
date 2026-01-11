export enum GestureType {
    NONE = 'none',
    OPEN = 'open',
    FIST = 'fist',
    POINTING = 'pointing',
    PEACE = 'peace',
    MIDDLE = 'middle',
    THUMBSUP = 'thumbsup',
    OK = 'ok'
}

export interface GestureResult {
    gesture: GestureType;
    confidence: number;
    changed: boolean;
}

export class GestureClassifier {
    private currentGesture: GestureType = GestureType.NONE;
    private stableFrames = 0;
    private readonly DEBOUNCE = 3; // Reduced debounce for snappier response

    process(landmarks: any[]): GestureResult {
        if (!landmarks || landmarks.length < 21) {
            return { gesture: GestureType.NONE, confidence: 0, changed: false };
        }

        const m = this.analyzeHand(landmarks);

        let detected = GestureType.NONE;
        let confidence = 0;

        // --- DETECTION LOGIC (Hierarchy matters!) ---

        // 1. OK SIGN (Pinch index + thumb, others open)
        if (m.isPinch && m.middle.isOpen && m.ring.isOpen && m.pinky.isOpen) {
            detected = GestureType.OK;
            confidence = 0.95;
        }
        // 2. MIDDLE FINGER (Middle open, others closed)
        else if (!m.index.isOpen && m.middle.isOpen && !m.ring.isOpen && !m.pinky.isOpen) {
            detected = GestureType.MIDDLE;
            confidence = 0.95;
        }
        // 3. THUMBS UP (Thumb up, others closed - check orientation!)
        else if (m.thumb.isUp && m.thumb.isOpen && !m.index.isOpen && !m.middle.isOpen && !m.ring.isOpen && !m.pinky.isOpen) {
            detected = GestureType.THUMBSUP;
            confidence = 0.9;
        }
        // 4. PEACE (Index + Middle open, others closed)
        else if (m.index.isOpen && m.middle.isOpen && !m.ring.isOpen && !m.pinky.isOpen) {
            detected = GestureType.PEACE;
            confidence = 0.9;
        }
        // 5. POINTING (Index open, others closed)
        else if (m.index.isOpen && !m.middle.isOpen && !m.ring.isOpen && !m.pinky.isOpen) {
            detected = GestureType.POINTING;
            confidence = 0.9;
        }
        // 6. FIST (All fingers closed, no pinch)
        else if (!m.index.isOpen && !m.middle.isOpen && !m.ring.isOpen && !m.pinky.isOpen && !m.thumb.isUp) {
            detected = GestureType.FIST;
            confidence = 0.9;
        }
        // 7. OPEN (Most fingers open)
        else if (m.index.isOpen && m.middle.isOpen && m.ring.isOpen) {
            detected = GestureType.OPEN;
            confidence = 0.8;
        }
        // FALLBACK
        else {
            detected = GestureType.OPEN; // Default state
            confidence = 0.4;
        }

        // Debounce
        let changed = false;
        if (detected !== this.currentGesture) {
            this.stableFrames++;
            if (this.stableFrames >= this.DEBOUNCE) {
                this.currentGesture = detected;
                this.stableFrames = 0;
                changed = true;
            }
        } else {
            this.stableFrames = 0;
        }

        return { gesture: this.currentGesture, confidence, changed };
    }

    // --- GEOMETRIC ANALYSIS ---

    private analyzeHand(lm: any[]) {
        // Helper to calculate Euclidean distance
        const dist = (a: any, b: any) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

        // Key Points
        const wrist = lm[0];
        const thumbTip = lm[4];
        const thumbIp = lm[3];
        const thumbMcp = lm[2];
        const indexTip = lm[8];
        const indexPip = lm[6];
        const indexMcp = lm[5];
        const middleTip = lm[12];
        const middlePip = lm[10];
        const middleMcp = lm[9];
        const ringTip = lm[16];
        const ringPip = lm[14];
        const ringMcp = lm[13];
        const pinkyTip = lm[20];
        const pinkyPip = lm[18];
        const pinkyMcp = lm[17];

        // Palm Scale (distance from wrist to middle finger base)
        const palmScale = dist(wrist, middleMcp);

        // 1. Finger Open/Close check based on Tip-to-Wrist vs MCP-to-Wrist distance
        // This is robust against rotation (unlike Y-checking)
        const isFingerOpen = (tip: any, pip: any, mcp: any) => {
            const tipDist = dist(tip, wrist);
            const pipDist = dist(pip, wrist);
            // Finger is "open" if tip is significantly further from wrist than the PIP joint
            return tipDist > pipDist * 1.1;
        };

        // 2. Thumb Analysis
        // Thumb is "Open" if tip is far from index MCP base
        const thumbOpenDist = dist(thumbTip, indexMcp);
        const isThumbOpen = thumbOpenDist > palmScale * 0.5;

        // Thumb Direction (is it pointing UP relative to hand?)
        // We compare Tip.y vs MCP.y. 
        // Note: screen coords Y increases downwards. So smaller Y = higher.
        const thumbVertical = thumbMcp.y - thumbTip.y;
        const isThumbUp = thumbVertical > palmScale * 0.3; // Significantly above MCP

        // 3. Pinch Detection (Thumb tip close to Index tip)
        const pinchDist = dist(thumbTip, indexTip);
        const isPinch = pinchDist < palmScale * 0.25;

        return {
            thumb: { isOpen: isThumbOpen, isUp: isThumbUp },
            index: { isOpen: isFingerOpen(indexTip, indexPip, indexMcp) },
            middle: { isOpen: isFingerOpen(middleTip, middlePip, middleMcp) },
            ring: { isOpen: isFingerOpen(ringTip, ringPip, ringMcp) },
            pinky: { isOpen: isFingerOpen(pinkyTip, pinkyPip, pinkyMcp) },
            isPinch
        };
    }
}
