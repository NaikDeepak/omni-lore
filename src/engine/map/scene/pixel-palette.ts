/**
 * Color math plus palettes for the code-drawn pixel sprites
 * (fallback icons, landmark glyphs, waypoint pylon). Pure.
 */

import { MapTheme } from '../../../domain/map-themes';
import { DangerLevel } from '../../../domain/map-types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(color: string): Rgb {
  const value = color.trim().toLowerCase();
  const rgbMatch = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  let hex = value.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex.slice(0, 6), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
}

export function shade(color: string, amount: number): string {
  if (amount === 0) {
    const c = hexToRgb(color);
    return rgbToHex(c.r, c.g, c.b);
  }
  return amount < 0 ? mix(color, '#000000', -amount) : mix(color, '#ffffff', amount);
}

export function luminance(color: string): number {
  const { r, g, b } = hexToRgb(color);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function hexToRgb01(color: string): [number, number, number] {
  const { r, g, b } = hexToRgb(color);
  return [r / 255, g / 255, b / 255];
}

export const DANGER_COLORS: Record<DangerLevel, string> = {
  EX: '#dc2626',
  S: '#f97316',
  A: '#f59e0b',
  B: '#64748b',
  Safe: '#10b981',
};

export type PixelChar = 'o' | 'd' | 'b' | 'l' | 'h' | 's' | 'a' | 'w';
export type PixelSpritePalette = Record<PixelChar, string>;

const OUTLINE = '#1a1410';
const BONE = '#e8dcc0';

export function spritePalette(theme: MapTheme, tint?: string): PixelSpritePalette {
  const base = shade(tint ?? mix(theme.palette.primaryAccent, BONE, 0.35), 0);
  return {
    o: OUTLINE,
    d: shade(base, -0.45),
    b: base,
    l: shade(base, 0.3),
    h: shade(base, 0.6),
    s: shade(BONE, -0.1),
    a: shade(theme.palette.secondaryAccent ?? '#dc2626', 0),
    w: '#ffffff',
  };
}

export function silhouettePalette(color: string): PixelSpritePalette {
  const c = shade(color, 0);
  return { o: c, d: c, b: c, l: c, h: c, s: c, a: c, w: c };
}
