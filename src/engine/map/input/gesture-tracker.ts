/**
 * Pure pointer gesture state machine: distinguishes click vs drag (threshold),
 * streams pan deltas, and reports two-finger pinch scale.
 */

export type GestureEvent =
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'pinch'; scale: number; centerX: number; centerY: number }
  | { type: 'click'; x: number; y: number }
  | { type: 'hover'; x: number; y: number };

interface TrackedPointer {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export class GestureTracker {
  private readonly pointers = new Map<number, TrackedPointer>();
  private dragging = false;
  private pinchDistance: number | null = null;

  constructor(private readonly dragThreshold: number = 4) {}

  public get isDragging(): boolean {
    return this.dragging;
  }

  public down(id: number, x: number, y: number): void {
    this.pointers.set(id, { x, y, startX: x, startY: y });
    if (this.pointers.size === 2) {
      this.dragging = true;
      this.pinchDistance = this.currentPinchDistance();
    }
  }

  public move(id: number, x: number, y: number): GestureEvent | null {
    const pointer = this.pointers.get(id);
    if (!pointer) return { type: 'hover', x, y };

    if (this.pointers.size >= 2) {
      pointer.x = x;
      pointer.y = y;
      const distance = this.currentPinchDistance();
      if (this.pinchDistance === null || this.pinchDistance === 0) {
        this.pinchDistance = distance;
        return null;
      }
      const scale = distance / this.pinchDistance;
      this.pinchDistance = distance;
      const [a, b] = Array.from(this.pointers.values());
      return { type: 'pinch', scale, centerX: (a.x + b.x) / 2, centerY: (a.y + b.y) / 2 };
    }

    const dx = x - pointer.x;
    const dy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;

    if (!this.dragging) {
      if (Math.hypot(x - pointer.startX, y - pointer.startY) < this.dragThreshold) return null;
      this.dragging = true;
      return { type: 'pan', dx: x - pointer.startX, dy: y - pointer.startY };
    }
    return { type: 'pan', dx, dy };
  }

  public up(id: number, x: number, y: number): GestureEvent | null {
    const pointer = this.pointers.get(id);
    if (!pointer) return null;
    this.pointers.delete(id);
    const wasDragging = this.dragging;
    if (this.pointers.size < 2) this.pinchDistance = null;
    if (this.pointers.size === 0) this.dragging = false;
    if (!wasDragging && this.pointers.size === 0) return { type: 'click', x, y };
    return null;
  }

  public cancel(): void {
    this.pointers.clear();
    this.dragging = false;
    this.pinchDistance = null;
  }

  private currentPinchDistance(): number {
    const [a, b] = Array.from(this.pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
