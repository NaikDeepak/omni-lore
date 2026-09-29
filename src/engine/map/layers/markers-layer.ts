/**
 * Retained, id-keyed location markers (tileset props or code-drawn icons),
 * numbered journey badges, landmark glyphs and event flags.
 */

import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { MapMode } from '../../../domain/map-types';
import { journeyNumbers } from '../../../projections/journey-numbers';
import { isDiscoveredStatus } from '../../../projections/map-snapshot-diff';
import {
  FogStatus,
  ProjectedLocation,
  ProjectedWorldMapSnapshot,
} from '../../../projections/temporal-map';
import { EVENT_FLAG_OFFSET } from '../input/picking';
import { DANGER_COLORS } from '../scene/pixel-palette';
import { LOCATION_PROP } from '../scene/sprite-catalog';
import { getUniverseLook } from '../scene/universe-look';
import { LayerContext } from './layer-context';

export const PROP_SCALE = 2;
export const ICON_SCALE = 2;
export const CRITICAL_ICON_SCALE = 3;
export const LANDMARK_SCALE = 3;
export const KNOWN_TINT = '#1c2430';

export interface MarkerView {
  root: Container;
  clearing: Graphics;
  ring: Graphics;
  halo: Graphics;
  glow: Sprite;
  icon: Sprite;
  pylon: Sprite | null;
  badge: Container | null;
  status: FogStatus;
  usesProp: boolean;
  critical: boolean;
  baseScale: number;
  hover: number;
  phase: number;
}

const ICON_Y = 2;
const BADGE_Y = 16;

export class MarkersLayer {
  public readonly markers = new Map<string, MarkerView>();
  public readonly landmarks = new Map<string, Sprite>();
  public readonly eventFlags = new Map<string, Graphics>();

  private readonly landmarkLayer = new Container();
  private readonly markerLayer = new Container();
  private readonly flagLayer = new Container();
  private hovered: string | null = null;
  private zoom = 1;
  private time = 0;
  private flagScale = 1;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.landmarkLayer.sortableChildren = true;
    this.markerLayer.sortableChildren = true;
    this.container.addChild(this.landmarkLayer, this.markerLayer, this.flagLayer);
  }

  public get hoveredId(): string | null {
    return this.hovered;
  }

  public sync(snapshot: ProjectedWorldMapSnapshot, animate: boolean): void {
    const fade = animate && !this.ctx.reducedMotion;
    const visible = snapshot.locations.filter((l) => l.fogStatus !== FogStatus.UNKNOWN);
    const keep = new Set(visible.map((l) => l.id));
    const numbers = journeyNumbers(snapshot);

    for (const [id, view] of this.markers) {
      if (keep.has(id)) continue;
      this.ctx.tweens.cancel(`marker:${id}:alpha`);
      this.ctx.tweens.cancel(`marker:${id}:hover`);
      view.root.destroy({ children: true });
      this.markers.delete(id);
      if (this.hovered === id) this.hovered = null;
    }

    for (const loc of visible) {
      let view = this.markers.get(loc.id);
      if (!view) {
        view = this.createMarker(loc);
        this.markers.set(loc.id, view);
        this.markerLayer.addChild(view.root);
        if (fade) {
          const target = view;
          target.root.alpha = 0;
          this.ctx.tweens.to(`marker:${loc.id}:alpha`, {
            from: 0,
            to: 1,
            durationMs: 350,
            onUpdate: (v) => {
              target.root.alpha = v;
            },
          });
        }
      }
      this.updateMarker(view, loc, numbers.get(loc.id) ?? null);
    }

    this.syncLandmarks(snapshot, fade);
    this.syncEventFlags(snapshot);
  }

  public setHovered(id: string | null): void {
    if (id === this.hovered) return;
    const previous = this.hovered;
    this.hovered = id && this.markers.has(id) ? id : null;
    if (previous) this.animateHover(previous, false);
    if (this.hovered) this.animateHover(this.hovered, true);
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
    for (const view of this.markers.values()) view.ring.visible = zoom >= 1;
  }

  public setMode(mode: MapMode): void {
    this.flagScale = mode === 'lore' ? 1.5 : 1;
    for (const flag of this.eventFlags.values()) flag.scale.set(this.flagScale);
  }

  public update(dtMs: number): void {
    if (this.ctx.reducedMotion) return;
    this.time += dtMs;
    for (const view of this.markers.values()) {
      if (view.critical) {
        const bob = Math.round(Math.sin((this.time / 2400 + view.phase) * Math.PI * 2));
        view.icon.y = ICON_Y - bob;
        view.glow.y = view.icon.y;
      }
      if (view.halo.visible) {
        const p = (this.time / 1400 + view.phase) % 1;
        view.halo.scale.set(0.8 + 0.5 * p);
        view.halo.alpha = 1 - p;
      }
    }
  }

  public destroy(): void {
    this.markers.clear();
    this.landmarks.clear();
    this.eventFlags.clear();
    this.container.removeChildren();
    this.landmarkLayer.destroy({ children: true });
    this.markerLayer.destroy({ children: true });
    this.flagLayer.destroy({ children: true });
  }

  private createMarker(loc: ProjectedLocation): MarkerView {
    const theme = this.ctx.theme;
    const look = getUniverseLook(theme.slug);
    const root = new Container();
    root.position.set(loc.x, loc.y);
    root.zIndex = loc.y;

    // Grass clearing under the marker hides baked trees without leaking unrevealed places
    const clearing = new Graphics()
      .ellipse(0, 2, 26, 12)
      .fill({ color: look.grass, alpha: 0.95 })
      .ellipse(0, 3, 20, 8)
      .fill({ color: '#000000', alpha: 0.12 });
    const ring = new Graphics();
    const halo = new Graphics().circle(0, -14, 22).stroke({ color: '#fff4c0', width: 2 });
    halo.visible = false;

    const glow = new Sprite(Texture.EMPTY);
    glow.anchor.set(0.5, 1);
    glow.position.set(0, ICON_Y);
    glow.blendMode = 'add';
    glow.tint = theme.palette.primaryAccent;
    glow.alpha = 0;

    const icon = new Sprite(Texture.EMPTY);
    icon.anchor.set(0.5, 1);
    icon.position.set(0, ICON_Y);

    let pylon: Sprite | null = null;
    if (loc.waypoint) {
      pylon = new Sprite(Texture.EMPTY);
      pylon.anchor.set(0.5, 1);
      pylon.position.set(22, ICON_Y);
      pylon.scale.set(1.5);
    }

    root.addChild(clearing, ring, halo, glow, icon);
    if (pylon) root.addChild(pylon);

    const critical = loc.importance === 'critical';
    return {
      root,
      clearing,
      ring,
      halo,
      glow,
      icon,
      pylon,
      badge: null,
      status: loc.fogStatus,
      usesProp: false,
      critical,
      baseScale: ICON_SCALE,
      hover: 0,
      phase: ((loc.x * 13 + loc.y * 7) % 1000) / 1000,
    };
  }

  private updateMarker(view: MarkerView, loc: ProjectedLocation, stage: number | null): void {
    const known = loc.fogStatus === FogStatus.KNOWN;
    const propName = LOCATION_PROP[loc.type];
    const usesProp = Boolean(propName) && this.ctx.tiles.ready;

    if (usesProp && propName) {
      const texture = this.ctx.tiles.texture(propName);
      view.icon.texture = texture;
      view.glow.texture = texture;
      view.icon.tint = known ? KNOWN_TINT : 0xffffff;
      view.baseScale = PROP_SCALE;
    } else {
      const texture = this.ctx.atlas.location(loc.type, known ? 'silhouette' : 'lit');
      view.icon.texture = texture;
      view.glow.texture = texture;
      view.icon.tint = 0xffffff;
      view.baseScale = view.critical ? CRITICAL_ICON_SCALE : ICON_SCALE;
    }
    view.usesProp = usesProp;
    view.status = loc.fogStatus;
    view.icon.alpha = known ? 0.7 : 1;
    view.halo.visible = loc.fogStatus === FogStatus.CURRENT || Boolean(loc.isCurrentPosition);
    view.root.position.set(loc.x, loc.y);
    view.root.zIndex = loc.y;

    view.ring.clear();
    if (loc.dangerLevel && !known) {
      view.ring.ellipse(0, 3, 24, 10).stroke({ color: DANGER_COLORS[loc.dangerLevel], width: 2, alpha: 0.9 });
    }
    view.ring.visible = this.zoom >= 1;

    if (view.pylon) {
      view.pylon.visible = !known;
      view.pylon.texture = this.ctx.atlas.pylon(isDiscoveredStatus(loc.fogStatus));
    }

    this.syncBadge(view, known ? null : stage);
    this.applyHover(view);
  }

  private syncBadge(view: MarkerView, stage: number | null): void {
    if (stage === null) {
      view.badge?.destroy({ children: true });
      view.badge = null;
      return;
    }
    const label = String(stage);
    const existing = view.badge?.children[1] as Text | undefined;
    if (view.badge && existing?.text === label) return;
    view.badge?.destroy({ children: true });
    const badge = new Container();
    const w = label.length > 1 ? 22 : 16;
    const plate = new Graphics()
      .rect(-w / 2 - 2, -10, w + 4, 20)
      .fill('#46280e')
      .rect(-w / 2, -8, w, 16)
      .fill('#f0c454');
    const text = new Text({
      text: label,
      style: { fontFamily: 'Silkscreen, monospace', fontSize: 28, fill: '#46280e', fontWeight: 'bold' },
    });
    text.anchor.set(0.5);
    text.scale.set(0.5);
    badge.addChild(plate, text);
    badge.position.set(0, BADGE_Y);
    view.root.addChild(badge);
    view.badge = badge;
  }

  private animateHover(id: string, on: boolean): void {
    const view = this.markers.get(id);
    if (!view) return;
    this.ctx.tweens.to(`marker:${id}:hover`, {
      from: view.hover,
      to: on ? 1 : 0,
      durationMs: this.ctx.reducedMotion ? 0 : 120,
      onUpdate: (v) => {
        view.hover = v;
        this.applyHover(view);
      },
    });
  }

  private applyHover(view: MarkerView): void {
    const scale = view.hover >= 1 ? view.baseScale + 1 : view.baseScale + view.hover;
    view.icon.scale.set(scale);
    view.glow.scale.set(scale + 1);
    view.glow.alpha = 0.85 * view.hover;
  }

  private syncLandmarks(snapshot: ProjectedWorldMapSnapshot, fade: boolean): void {
    const keep = new Set(snapshot.landmarkGlyphs.map((g) => g.id));
    for (const [id, sprite] of this.landmarks) {
      if (keep.has(id)) continue;
      this.ctx.tweens.cancel(`landmark:${id}:alpha`);
      sprite.destroy();
      this.landmarks.delete(id);
    }
    for (const glyph of snapshot.landmarkGlyphs) {
      if (this.landmarks.has(glyph.id)) continue;
      const sprite = new Sprite(this.ctx.atlas.landmark(glyph.glyph));
      sprite.anchor.set(0.5, 1);
      sprite.position.set(glyph.x, glyph.y);
      sprite.scale.set(Math.max(1, Math.round(LANDMARK_SCALE * (glyph.scale ?? 1))));
      sprite.zIndex = glyph.y;
      this.landmarks.set(glyph.id, sprite);
      this.landmarkLayer.addChild(sprite);
      if (fade) {
        sprite.alpha = 0;
        this.ctx.tweens.to(`landmark:${glyph.id}:alpha`, {
          from: 0,
          to: 1,
          durationMs: 600,
          onUpdate: (v) => {
            sprite.alpha = v;
          },
        });
      }
    }
  }

  private syncEventFlags(snapshot: ProjectedWorldMapSnapshot): void {
    const locations = new Map(snapshot.locations.map((l) => [l.id, l]));
    const wanted = snapshot.events.filter((ev) => {
      const loc = ev.locationId ? locations.get(ev.locationId) : undefined;
      return Boolean(loc && loc.fogStatus !== FogStatus.UNKNOWN);
    });
    const keep = new Set(wanted.map((ev) => ev.id));
    for (const [id, flag] of this.eventFlags) {
      if (keep.has(id)) continue;
      flag.destroy();
      this.eventFlags.delete(id);
    }
    const color = this.ctx.theme.palette.secondaryAccent ?? '#dc2626';
    for (const ev of wanted) {
      if (this.eventFlags.has(ev.id)) continue;
      const loc = locations.get(ev.locationId!)!;
      const flag = new Graphics();
      flag.rect(-3, -5, 1, 11).fill('#1a1410');
      flag.rect(-2, -5, 6, 5).fill(color);
      flag.rect(-2, -5, 6, 5).stroke({ color: '#1a1410', width: 1 });
      flag.position.set(loc.x + EVENT_FLAG_OFFSET.x, loc.y + EVENT_FLAG_OFFSET.y);
      flag.scale.set(this.flagScale);
      this.eventFlags.set(ev.id, flag);
      this.flagLayer.addChild(flag);
    }
  }
}
