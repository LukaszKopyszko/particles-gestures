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
    private readonly DEBOUNCE = 5;

    process(landmarks: any[]): GestureResult {
        if (!landmarks || landmarks.length < 21) {
            return { gesture: GestureType.NONE, confidence: 0, changed: false };
        }

        const fingerStates = this.getFingerStates(landmarks);
        const thumbState = this.getThumbState(landmarks);

        const { index, middle, ring, pinky } = fingerStates;
        const allFingersCurled = !index && !middle && !ring && !pinky;

        let detected = GestureType.NONE;
        let confidence = 0;

        // Thumbs up: thumb clearly extended UPWARD, all fingers curled
        // Must be very clearly UP (strict threshold)
        if (thumbState.isUp && thumbState.isStronglyUp && allFingersCurled) {
            detected = GestureType.THUMBSUP;
            confidence = 0.95;
        }
        // Fist: all fingers curled AND thumb is NOT pointing up
        else if (allFingersCurled && !thumbState.isUp) {
            detected = GestureType.FIST;
            confidence = 0.9;
        }
        // Middle finger: ONLY middle extended
        else if (!index && middle && !ring && !pinky) {
            detected = GestureType.MIDDLE;
            confidence = 0.95;
        }
        // Alternative middle detection
        else if (middle && !index && !ring &&
            fingerStates.middleScore > fingerStates.indexScore + 0.04 &&
            fingerStates.middleScore > fingerStates.ringScore + 0.04) {
            detected = GestureType.MIDDLE;
            confidence = 0.85;
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

    private getThumbState(landmarks: any[]): { isUp: boolean; isStronglyUp: boolean; isOut: boolean } {
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3]; // IP joint
        const thumbMcp = landmarks[2];
        const indexMcp = landmarks[5];

        // Calculate how much higher the thumb tip is compared to the MCP
        const thumbVerticalDiff = thumbMcp.y - thumbTip.y; // Positive = tip above MCP

        // Thumb is extended if tip is far from wrist
        const thumbLength = Math.sqrt(
            Math.pow(thumbTip.x - thumbMcp.x, 2) + Math.pow(thumbTip.y - thumbMcp.y, 2)
        );

        // Palm size for normalization
        const palmSize = Math.sqrt(
            Math.pow(wrist.x - landmarks[9].x, 2) + Math.pow(wrist.y - landmarks[9].y, 2)
        );

        // isUp: thumb tip is clearly above thumb MCP (normalized by palm size)
        const isUp = thumbVerticalDiff > palmSize * 0.15;

        // isStronglyUp: very clearly pointing up (stricter threshold)
        const isStronglyUp = thumbVerticalDiff > palmSize * 0.25;

        // isOut: thumb pointing to the side
        const isOut = Math.abs(thumbTip.x - indexMcp.x) > palmSize * 0.3;

        return { isUp, isStronglyUp, isOut };
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
