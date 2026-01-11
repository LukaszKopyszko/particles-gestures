export enum GestureType {
    NONE = 'none',
    OPEN = 'open',
    FIST = 'fist',
    POINTING = 'pointing',
    PEACE = 'peace',
    MIDDLE = 'middle',
    THUMBSUP = 'thumbsup'
}

export interface GestureResult {
    gesture: GestureType;
    confidence: number;
    changed: boolean;
}

export class GestureClassifier {
    private currentGesture: GestureType = GestureType.NONE;
    private stableFrames = 0;
    private readonly DEBOUNCE = 4;

    process(landmarks: any[]): GestureResult {
        if (!landmarks || landmarks.length < 21) {
            return { gesture: GestureType.NONE, confidence: 0, changed: false };
        }

        const fingerStates = this.getFingerStates(landmarks);
        const thumbState = this.getThumbState(landmarks);

        const { index, middle, ring, pinky } = fingerStates;

        let detected = GestureType.NONE;
        let confidence = 0;

        // Thumbs up: thumb extended upward, all other fingers curled
        if (thumbState.isUp && !index && !middle && !ring && !pinky) {
            detected = GestureType.THUMBSUP;
            confidence = 0.95;
        }
        // Middle finger: ONLY middle extended
        else if (!index && middle && !ring && !pinky) {
            detected = GestureType.MIDDLE;
            confidence = 0.95;
        }
        // Alternative middle finger detection
        else if (middle && !index && !ring &&
            fingerStates.middleScore > fingerStates.indexScore + 0.05 &&
            fingerStates.middleScore > fingerStates.ringScore + 0.05) {
            detected = GestureType.MIDDLE;
            confidence = 0.85;
        }
        // Fist: all fingers curled (thumb can be anywhere)
        else if (!index && !middle && !ring && !pinky && !thumbState.isUp) {
            detected = GestureType.FIST;
            confidence = 0.9;
        }
        // Peace: index + middle extended
        else if (index && middle && !ring && !pinky) {
            detected = GestureType.PEACE;
            confidence = 0.85;
        }
        // Pointing: only index extended
        else if (index && !middle && !ring && !pinky) {
            detected = GestureType.POINTING;
            confidence = 0.85;
        }
        // Open palm: all fingers extended
        else if (index && middle && ring && pinky) {
            detected = GestureType.OPEN;
            confidence = 0.9;
        }
        else {
            detected = GestureType.OPEN;
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

    private getThumbState(landmarks: any[]): { isUp: boolean; isOut: boolean } {
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const thumbMcp = landmarks[2];
        const indexMcp = landmarks[5];

        // Thumb is "up" if tip is above MCP and above wrist
        // And thumb is extended (tip further from palm center than MCP)
        const thumbExtended = Math.sqrt(
            Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2)
        ) > Math.sqrt(
            Math.pow(thumbMcp.x - wrist.x, 2) + Math.pow(thumbMcp.y - wrist.y, 2)
        ) * 1.2;

        // Thumb pointing upward: tip.y < mcp.y significantly
        const isUp = thumbTip.y < thumbMcp.y - 0.05 && thumbExtended;

        // Thumb pointing outward (to the side)
        const isOut = Math.abs(thumbTip.x - indexMcp.x) > 0.1;

        return { isUp, isOut };
    }

    private getFingerStates(landmarks: any[]): {
        index: boolean;
        middle: boolean;
        ring: boolean;
        pinky: boolean;
        indexScore: number;
        middleScore: number;
        ringScore: number;
        pinkyScore: number;
    } {
        const wrist = landmarks[0];
        const middleMcp = landmarks[9];

        const palmSize = Math.sqrt(
            Math.pow(wrist.x - middleMcp.x, 2) +
            Math.pow(wrist.y - middleMcp.y, 2)
        );

        const getExtensionScore = (tipIdx: number, pipIdx: number): number => {
            const tip = landmarks[tipIdx];
            const pip = landmarks[pipIdx];

            const tipToWrist = Math.sqrt(
                Math.pow(tip.x - wrist.x, 2) +
                Math.pow(tip.y - wrist.y, 2)
            );

            const pipToWrist = Math.sqrt(
                Math.pow(pip.x - wrist.x, 2) +
                Math.pow(pip.y - wrist.y, 2)
            );

            return tipToWrist - pipToWrist;
        };

        const threshold = palmSize * 0.08;

        const indexScore = getExtensionScore(8, 6);
        const middleScore = getExtensionScore(12, 10);
        const ringScore = getExtensionScore(16, 14);
        const pinkyScore = getExtensionScore(20, 18);

        return {
            index: indexScore > threshold,
            middle: middleScore > threshold,
            ring: ringScore > threshold,
            pinky: pinkyScore > threshold,
            indexScore,
            middleScore,
            ringScore,
            pinkyScore
        };
    }
}
