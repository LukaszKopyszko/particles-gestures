import Hammer from 'hammerjs';

export class TouchGestureAdapter {
    private hammer: HammerManager | null = null;
    private element: HTMLElement | null = null;
    private onUpdate: ((x: number, y: number, isFist: boolean) => void) | null = null;

    constructor() { }

    init(element: HTMLElement, onUpdate: (x: number, y: number, isFist: boolean) => void) {
        this.element = element;
        this.onUpdate = onUpdate;
        this.hammer = new Hammer(element);

        this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        this.hammer.get('press').set({ time: 500 });

        // Pan -> Move
        this.hammer.on('panmove', (ev) => {
            const rect = element.getBoundingClientRect();
            const x = (ev.center.x - rect.left) / rect.width;
            const y = (ev.center.y - rect.top) / rect.height;

            // Invert X because camera is mirrored? 
            // Touch usually direct, but our engine expects mirrored logic if we reused it?
            // Actually usually direct. Let's pass direct.
            // Wait, Engine expects 0..1.

            this.onUpdate?.(x, y, false);
        });

        // Press -> Fist
        this.hammer.on('press', () => {
            // Last known pos? Or current.
            // We can trigger fist
            this.onUpdate?.(-1, -1, true); // -1 means preserve position
        });

        this.hammer.on('pressup', () => {
            this.onUpdate?.(-1, -1, false);
        });
    }

    destroy() {
        if (this.hammer) {
            this.hammer.destroy();
            this.hammer = null;
        }
    }
}
