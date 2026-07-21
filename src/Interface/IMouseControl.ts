export interface IMouseControl {
    hitTest(x: number, y: number): boolean;

    onDown(x: number, y: number): void;
    onMove(x: number, y: number): void;
    onUp(): void;
}
