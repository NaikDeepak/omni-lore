import { describe, it, expect } from 'vitest';
import { paintPlane, SheetImages } from '../src/engine/map/scene/plane-painter';
import { buildPlaneLayout } from '../src/engine/map/scene/plane-layout';
import { getUniverseLook } from '../src/engine/map/scene/universe-look';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

type Call = { name: string; args: unknown[] };

function recordingContext(width: number, height: number) {
  const calls: Call[] = [];
  const target: Record<string, unknown> = {};
  const ctx = new Proxy(target, {
    get(obj, prop: string) {
      if (prop in obj) return obj[prop];
      if (prop === 'getImageData') {
        return (...args: unknown[]) => {
          calls.push({ name: prop, args });
          return { data: new Uint8ClampedArray(width * height * 4), width, height };
        };
      }
      if (prop === 'createPattern') {
        return (...args: unknown[]) => {
          calls.push({ name: prop, args });
          return { pattern: true };
        };
      }
      return (...args: unknown[]) => {
        calls.push({ name: prop, args });
      };
    },
    set(obj, prop: string, value) {
      obj[prop] = value;
      calls.push({ name: `set:${prop}`, args: [value] });
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const fakeCanvas = (w: number, h: number) => {
  const { ctx } = recordingContext(w, h);
  return { width: w, height: h, getContext: () => ctx } as unknown as HTMLCanvasElement;
};

const def: WorldMapDefinition = {
  id: 'paint-map', universeId: 'one-piece', coordinateSystem: 'world', width: 800, height: 600,
  planes: [{ id: 'main', name: 'World', width: 800, height: 600, revealedAtChapter: 0, backdrop: 'sea' }],
  terrain: [
    { id: 'isle', type: 'forest', name: 'Isle', polygon: [[100, 100], [600, 100], [600, 500], [100, 500]] },
    { id: 'peaks', type: 'mountain', name: 'Peaks', polygon: [[400, 150], [550, 150], [550, 450], [400, 450]] },
  ],
  rivers: [{ id: 'r', name: 'R', points: [[120, 300], [390, 320]], width: 16, bridges: [[250, 310]] }],
  regions: [], locations: [], routes: [], territories: [], events: [], characterPaths: [],
};

const fakeImage = {} as CanvasImageSource;
const withSheets: SheetImages = { image: () => fakeImage };
const noSheets: SheetImages = { image: () => null };

describe('paintPlane', () => {
  const layout = buildPlaneLayout(projectTemporalMap(def, 1));
  const look = getUniverseLook('one-piece');

  it('paints backdrop first, draws every stamp, and grades exactly once', () => {
    const { ctx, calls } = recordingContext(layout.width, layout.height);
    paintPlane(ctx, layout, withSheets, look, fakeCanvas, 42);
    const first = calls.find((c) => c.name === 'fillRect')!;
    expect(first.args).toEqual([0, 0, layout.width, layout.height]);
    expect(calls.filter((c) => c.name === 'drawImage').length).toBeGreaterThanOrEqual(layout.stamps.length);
    expect(calls.filter((c) => c.name === 'getImageData')).toHaveLength(1);
    expect(calls.filter((c) => c.name === 'putImageData')).toHaveLength(1);
    const lastGrade = calls.map((c) => c.name).lastIndexOf('putImageData');
    expect(lastGrade).toBe(calls.length - 1);
  });

  it('strokes the coast and the river', () => {
    const { ctx, calls } = recordingContext(layout.width, layout.height);
    paintPlane(ctx, layout, withSheets, look, fakeCanvas, 42);
    const widths = calls.filter((c) => c.name === 'set:lineWidth').map((c) => c.args[0]);
    expect(widths).toContain(28); // shelf
    expect(widths).toContain(layout.rivers[0].width); // river water
  });

  it('paints open water plainly before the coast strokes', () => {
    const seaDef = {
      ...def,
      terrain: [{ id: 'open', type: 'ocean' as const, name: 'Open', polygon: [[650, 50], [790, 50], [790, 590], [650, 590]] as [number, number][] }, ...def.terrain],
    };
    const seaLayout = buildPlaneLayout(projectTemporalMap(seaDef, 1));
    expect(seaLayout.fills[0].kind).toBe('water');
    const { ctx, calls } = recordingContext(seaLayout.width, seaLayout.height);
    paintPlane(ctx, seaLayout, withSheets, look, fakeCanvas, 42);
    const names = calls.map((c) => `${c.name}:${String(c.args[0])}`);
    const lastSeaFill = names.lastIndexOf(`set:fillStyle:${look.sea}`);
    const firstShelf = names.indexOf('set:lineWidth:28');
    expect(lastSeaFill).toBeGreaterThan(0);
    expect(lastSeaFill).toBeLessThan(firstShelf);
  });

  it('still paints terrain when the sheets are not loaded', () => {
    const { ctx, calls } = recordingContext(layout.width, layout.height);
    expect(() => paintPlane(ctx, layout, noSheets, look, fakeCanvas, 42)).not.toThrow();
    expect(calls.filter((c) => c.name === 'drawImage')).toHaveLength(0);
    expect(calls.filter((c) => c.name === 'fill').length).toBeGreaterThan(2);
  });
});
