/**
 * OmniLore Map Engine v2 - Camera Controller
 *
 * Provides pure-math viewport transformation, bounds clamping, coordinate mapping,
 * mouse anchor zooming, and cubic easing flyTo interpolation.
 */

export interface CameraControllerOptions {
  worldWidth: number;
  worldHeight: number;
  viewWidth: number;
  viewHeight: number;
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
  x?: number;
  y?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

interface FlyToAnimation {
  startX: number;
  startY: number;
  startZoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  durationMs: number;
  elapsedMs: number;
}

export class CameraController {
  public worldWidth: number;
  public worldHeight: number;
  public viewWidth: number;
  public viewHeight: number;
  public minZoom: number;
  public maxZoom: number;

  public x: number;
  public y: number;
  public zoom: number;

  private activeFlyTo: FlyToAnimation | null = null;

  constructor(options: CameraControllerOptions) {
    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;
    this.viewWidth = options.viewWidth;
    this.viewHeight = options.viewHeight;
    this.minZoom = options.minZoom ?? 0.25;
    this.maxZoom = options.maxZoom ?? 4.0;
    this.zoom = this.clampZoom(options.zoom ?? 1.0);

    // Initial center defaults to viewport center
    this.x = options.x ?? options.viewWidth / 2;
    this.y = options.y ?? options.viewHeight / 2;
    this.clampPosition();
  }

  public get isAnimating(): boolean {
    return this.activeFlyTo !== null;
  }

  /**
   * Clamp zoom level between minZoom and maxZoom
   */
  public clampZoom(zoom: number): number {
    return Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }

  /**
   * Clamp camera coordinates to world boundaries
   */
  public clampPosition(): void {
    this.x = Math.max(0, Math.min(this.worldWidth, this.x));
    this.y = Math.max(0, Math.min(this.worldHeight, this.y));
  }

  /**
   * Set zoom level directly, with optional anchor screen point
   */
  public setZoom(targetZoom: number, originScreenX?: number, originScreenY?: number): void {
    if (originScreenX !== undefined && originScreenY !== undefined) {
      this.zoomAt(targetZoom, originScreenX, originScreenY);
    } else {
      this.zoom = this.clampZoom(targetZoom);
    }
  }

  /**
   * Zoom towards/away from a specific screen coordinate anchor
   */
  public zoomAt(newZoom: number, screenX: number, screenY: number): void {
    const worldBefore = this.screenToWorld(screenX, screenY);
    this.zoom = this.clampZoom(newZoom);

    // Reposition camera so the world point remains under screen point
    this.x = worldBefore.x - (screenX - this.viewWidth / 2) / this.zoom;
    this.y = worldBefore.y - (screenY - this.viewHeight / 2) / this.zoom;
    this.clampPosition();
  }

  /**
   * Relative zoom multiplier
   */
  public zoomBy(factor: number, screenX?: number, screenY?: number): void {
    const targetZoom = this.zoom * factor;
    if (screenX !== undefined && screenY !== undefined) {
      this.zoomAt(targetZoom, screenX, screenY);
    } else {
      this.setZoom(targetZoom);
    }
  }

  /**
   * Pan camera by delta coordinates in world units
   */
  public pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this.clampPosition();
  }

  /**
   * Pan camera by screen pixels
   */
  public panByScreen(screenDx: number, screenDy: number): void {
    this.pan(-screenDx / this.zoom, -screenDy / this.zoom);
  }

  /**
   * Set camera position directly
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.clampPosition();
  }

  /**
   * Start smooth cinematic flyTo transition to target coordinates and zoom
   */
  public flyTo(
    targetX: number,
    targetY: number,
    targetZoom?: number,
    durationMs: number = 500
  ): void {
    const clampedTargetZoom = this.clampZoom(targetZoom ?? this.zoom);
    const clampedTargetX = Math.max(0, Math.min(this.worldWidth, targetX));
    const clampedTargetY = Math.max(0, Math.min(this.worldHeight, targetY));

    this.activeFlyTo = {
      startX: this.x,
      startY: this.y,
      startZoom: this.zoom,
      targetX: clampedTargetX,
      targetY: clampedTargetY,
      targetZoom: clampedTargetZoom,
      durationMs: Math.max(16, durationMs),
      elapsedMs: 0,
    };
  }

  /**
   * Cancel ongoing camera transition
   */
  public stopAnimation(): void {
    this.activeFlyTo = null;
  }

  /**
   * Progress camera animation by delta milliseconds
   * Returns true if animating or moved, false otherwise
   */
  public tick(deltaMs: number = 16): boolean {
    if (!this.activeFlyTo) {
      return false;
    }

    this.activeFlyTo.elapsedMs += deltaMs;
    const progress = Math.min(1, this.activeFlyTo.elapsedMs / this.activeFlyTo.durationMs);

    // Cubic easeInOut: smooth acceleration and deceleration
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    this.x = this.activeFlyTo.startX + (this.activeFlyTo.targetX - this.activeFlyTo.startX) * ease;
    this.y = this.activeFlyTo.startY + (this.activeFlyTo.targetY - this.activeFlyTo.startY) * ease;
    this.zoom = this.activeFlyTo.startZoom + (this.activeFlyTo.targetZoom - this.activeFlyTo.startZoom) * ease;

    if (progress >= 1) {
      this.x = this.activeFlyTo.targetX;
      this.y = this.activeFlyTo.targetY;
      this.zoom = this.activeFlyTo.targetZoom;
      this.activeFlyTo = null;
    }

    return true;
  }

  /**
   * Convert viewport screen coordinate to world coordinate
   */
  public screenToWorld(screenX: number, screenY: number): Point2D {
    return {
      x: this.x + (screenX - this.viewWidth / 2) / this.zoom,
      y: this.y + (screenY - this.viewHeight / 2) / this.zoom,
    };
  }

  /**
   * Convert world coordinate to viewport screen coordinate
   */
  public worldToScreen(worldX: number, worldY: number): Point2D {
    return {
      x: this.viewWidth / 2 + (worldX - this.x) * this.zoom,
      y: this.viewHeight / 2 + (worldY - this.y) * this.zoom,
    };
  }

  /**
   * Resize viewport dimensions
   */
  public resize(viewWidth: number, viewHeight: number): void {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  /**
   * Reset camera to viewport center and default zoom
   */
  public reset(targetZoom: number = 1.0): void {
    this.stopAnimation();
    this.zoom = this.clampZoom(targetZoom);
    this.x = this.viewWidth / 2;
    this.y = this.viewHeight / 2;
    this.clampPosition();
  }
}
