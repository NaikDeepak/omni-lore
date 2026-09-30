/**
 * Per-universe look for the level-select atlas: a color grade applied to
 * the baked plane plus water, sand, grass and fog colors. Same tiles,
 * different mood per universe.
 */

import { hexToRgb } from './pixel-palette';

export interface UniverseLook {
  tint: string;
  amount: number;
  saturation: number;
  sea: string;
  seaDeep: string;
  shelf: string;
  shallows: string;
  sand: string;
  foam: string;
  grass: string;
  fogColor: string;
  fogOpacity: number;
}

const BASE = {
  sea: '#2076aa',
  seaDeep: '#1a6296',
  shelf: '#46aac8',
  shallows: '#68c4d6',
  sand: '#ecd696',
  foam: '#eefaff',
  grass: '#6a9c3c',
  fogColor: '#e6ecf2',
  fogOpacity: 0.62,
};

export const DEFAULT_LOOK: UniverseLook = { ...BASE, tint: '#ffffff', amount: 0, saturation: 1 };

export const UNIVERSE_LOOKS: Record<string, UniverseLook> = {
  'reverend-insanity': { ...BASE, tint: '#14966e', amount: 0.12, saturation: 0.9, fogColor: '#dfeee6' },
  'lord-of-the-mysteries': { ...BASE, tint: '#503282', amount: 0.22, saturation: 0.6, fogColor: '#cfc8dc' },
  'coiling-dragon': { ...BASE, tint: '#f0a030', amount: 0.08, saturation: 1.05, fogColor: '#f2eadb' },
  'demonic-emperor': { ...BASE, tint: '#8a1830', amount: 0.16, saturation: 0.75, fogColor: '#d8c8cc' },
  'one-piece': { ...BASE, tint: '#1080d0', amount: 0.05, saturation: 1.1, fogColor: '#e8f2fa' },
  'solo-leveling': { ...BASE, tint: '#102850', amount: 0.25, saturation: 0.7, fogColor: '#b8c4d8', fogOpacity: 0.7 },
};

export function getUniverseLook(slug: string): UniverseLook {
  return UNIVERSE_LOOKS[slug] ?? DEFAULT_LOOK;
}

/** In-place grade: saturation around luma, then mix toward the tint. Alpha untouched. */
export function gradePixels(
  data: Uint8ClampedArray,
  look: Pick<UniverseLook, 'tint' | 'amount' | 'saturation'>
): void {
  const { r: tr, g: tg, b: tb } = hexToRgb(look.tint);
  const { amount, saturation } = look;
  if (amount === 0 && saturation === 1) return;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const sr = luma + (r - luma) * saturation;
    const sg = luma + (g - luma) * saturation;
    const sb = luma + (b - luma) * saturation;
    data[i] = sr + (tr - sr) * amount;
    data[i + 1] = sg + (tg - sg) * amount;
    data[i + 2] = sb + (tb - sb) * amount;
  }
}
