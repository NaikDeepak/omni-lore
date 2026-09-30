/**
 * Crisp Silkscreen labels (BitmapText in the browser, Text in tests) with
 * zoom-based level of detail and constant on-screen size.
 */

import { BitmapFont, BitmapText, Container, Text } from 'pixi.js';
import { MapRegion } from '../../../domain/map-types';
import { FogStatus, ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { polygonCentroid, Vec2 } from '../scene/geometry';
import { shade } from '../scene/pixel-palette';
import { LayerContext } from './layer-context';

export type LabelKind = 'region' | 'critical' | 'major' | 'minor';

const THRESHOLDS: Record<Exclude<LabelKind, 'region'>, number> = { critical: 0.9, major: 1.3, minor: 1.8 };
const FADE = 0.12;
const FONT_SIZE = 32;

export const LABEL_SCREEN_SIZE: Record<LabelKind, number> = { region: 18, critical: 11, major: 10, minor: 9 };
export const PIXEL_FONT_NAME = 'OmniPixel';

let fontInstalled = false;

export function installPixelFont(): void {
  if (fontInstalled || typeof document === 'undefined') return;
  BitmapFont.install({
    name: PIXEL_FONT_NAME,
    style: {
      fontFamily: 'Silkscreen, monospace',
      fontSize: FONT_SIZE,
      fill: '#ffffff',
      stroke: { color: '#05060a', width: 4 },
    },
    chars: [['a', 'z'], ['A', 'Z'], ['0', '9'], " .,:;!?'\"-()/&+#"],
    resolution: 1,
  });
  fontInstalled = true;
}

export function uninstallPixelFont(): void {
  if (!fontInstalled || typeof document === 'undefined') return;
  BitmapFont.uninstall(PIXEL_FONT_NAME);
  fontInstalled = false;
}

export function labelAlpha(kind: LabelKind, zoom: number): number {
  if (kind === 'region') {
    if (zoom <= 1.0) return 0.6;
    if (zoom >= 1.4) return 0;
    return (0.6 * (1.4 - zoom)) / 0.4;
  }
  const threshold = THRESHOLDS[kind];
  const start = threshold - FADE;
  if (zoom <= start) return 0;
  if (zoom >= threshold) return 1;
  return (zoom - start) / FADE;
}

interface LabelView {
  node: Text | BitmapText;
  kind: LabelKind;
}

function regionAnchor(region: MapRegion): { x: number; y: number } {
  const coords =
    region.geometry.type === 'Polygon'
      ? (region.geometry.coordinates as number[][][])[0]
      : (region.geometry.coordinates as number[][][][])[0][0];
  return polygonCentroid(coords as unknown as Vec2[]);
}

export class LabelsLayer {
  public readonly labels = new Map<string, LabelView>();
  private zoom = 1;

  constructor(
    private readonly container: Container,
    private readonly ctx: LayerContext,
    private readonly useBitmapFont: boolean
  ) {}

  public sync(snapshot: ProjectedWorldMapSnapshot): void {
    const desired = new Map<string, { text: string; kind: LabelKind; x: number; y: number }>();
    for (const region of snapshot.regions) {
      const p = regionAnchor(region);
      desired.set(`region:${region.id}`, { text: region.name.toUpperCase(), kind: 'region', x: p.x, y: p.y });
    }
    for (const loc of snapshot.locations) {
      if (loc.fogStatus === FogStatus.UNKNOWN || loc.fogStatus === FogStatus.KNOWN) continue;
      desired.set(`loc:${loc.id}`, { text: loc.name, kind: loc.importance, x: loc.x, y: loc.y + 6 });
    }

    for (const [key, view] of this.labels) {
      if (desired.has(key)) continue;
      view.node.destroy();
      this.labels.delete(key);
    }

    for (const [key, want] of desired) {
      let view = this.labels.get(key);
      if (!view || view.kind !== want.kind) {
        view?.node.destroy();
        view = { node: this.createNode(want.text, want.kind), kind: want.kind };
        this.labels.set(key, view);
        this.container.addChild(view.node);
      } else if (view.node.text !== want.text) {
        view.node.text = want.text;
      }
      view.node.position.set(Math.round(want.x), Math.round(want.y));
    }

    this.setZoom(this.zoom);
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
    for (const view of this.labels.values()) {
      const alpha = labelAlpha(view.kind, zoom);
      view.node.alpha = alpha;
      view.node.visible = alpha > 0;
      view.node.scale.set(LABEL_SCREEN_SIZE[view.kind] / FONT_SIZE / zoom);
    }
  }

  public destroy(): void {
    for (const view of this.labels.values()) view.node.destroy();
    this.labels.clear();
    this.container.removeChildren();
  }

  private createNode(text: string, kind: LabelKind): Text | BitmapText {
    const color = this.ctx.theme.palette.textColor ?? '#ffffff';
    const letterSpacing = kind === 'region' ? 6 : 1;
    const tint = kind === 'region' ? shade(color, -0.2) : color;
    const node = this.useBitmapFont
      ? new BitmapText({ text, style: { fontFamily: PIXEL_FONT_NAME, fontSize: FONT_SIZE, letterSpacing } })
      : new Text({ text, style: { fontFamily: 'monospace', fontSize: FONT_SIZE, fill: tint, letterSpacing } });
    if (this.useBitmapFont) node.tint = tint;
    node.anchor.set(0.5, kind === 'region' ? 0.5 : 0);
    return node;
  }
}
