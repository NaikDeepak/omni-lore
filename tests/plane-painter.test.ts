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

/** True if `seq` appears as a contiguous run inside `arr`, in order. */
function hasContiguousSubsequence<T>(arr: T[], seq: T[]): boolean {
  for (let i = 0; i + seq.length <= arr.length; i++) {
    if (seq.every((v, j) => arr[i + j] === v)) return true;
  }
  return false;
}

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
    // River strokes 3 concentric widths back-to-back, in order: bank, water, shallow highlight.
    // Asserting the contiguous triplet (rather than `toContain(river.width)`) matters here: this
    // fixture's river pixel width (8) equals the coast's foam stroke width (8), so a bare
    // `toContain` would pass even if the river-stroke code were deleted entirely.
    const riverWidth = layout.rivers[0].width;
    const riverStrokeWidths = [riverWidth + 4, riverWidth, Math.max(1, riverWidth / 3)];
    expect(hasContiguousSubsequence(widths, riverStrokeWidths)).toBe(true);
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
    // `set:fillStyle:sea` is assigned unconditionally before the open-water loop runs, so its mere
    // presence doesn't prove the water ring was actually filled. Instead, locate the `moveTo` that
    // traces this specific water ring's first point, then require an actual `fill` call after it
    // (not just the fillStyle assignment) before the coast strokes begin.
    const waterRing = seaLayout.fills[0].ring;
    const moveToIdx = calls.findIndex(
      (c) => c.name === 'moveTo' && c.args[0] === waterRing[0][0] && c.args[1] === waterRing[0][1]
    );
    expect(moveToIdx).toBeGreaterThanOrEqual(0);
    const fillIdx = calls.findIndex((c, i) => i > moveToIdx && c.name === 'fill');
    const firstShelf = calls.findIndex((c) => c.name === 'set:lineWidth' && c.args[0] === 28);
    expect(fillIdx).toBeGreaterThan(moveToIdx);
    expect(fillIdx).toBeLessThan(firstShelf);
  });

  it('still paints terrain when the sheets are not loaded', () => {
    const { ctx, calls } = recordingContext(layout.width, layout.height);
    expect(() => paintPlane(ctx, layout, noSheets, look, fakeCanvas, 42)).not.toThrow();
    expect(calls.filter((c) => c.name === 'drawImage')).toHaveLength(0);
    // A generic "more than 2 fills" count is satisfied by the sea backdrop's noise ellipses alone
    // and doesn't prove the grass-tile fallback ran. Require the '#6a9c3c' flat-color fallback
    // (used when `sheets.image('puny')` returns null) to actually be set and then filled.
    const fallbackIdx = calls.findIndex((c) => c.name === 'set:fillStyle' && c.args[0] === '#6a9c3c');
    expect(fallbackIdx).toBeGreaterThanOrEqual(0);
    const fillAfter = calls.findIndex((c, i) => i > fallbackIdx && c.name === 'fill');
    expect(fillAfter).toBeGreaterThan(fallbackIdx);
  });
});
