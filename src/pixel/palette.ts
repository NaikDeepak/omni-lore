export interface RgbColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export function hexToRgb(hex: string): RgbColor {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, hex: `#${sanitized.toLowerCase()}` };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// 1. PICO-8 Retro 16-color Palette
export const PALETTE_PICO8: RgbColor[] = [
  '#000000', '#1d2b53', '#7e2553', '#008751',
  '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
  '#ff004d', '#ffa300', '#ffec27', '#00e436',
  '#29adff', '#83769c', '#ff77a8', '#ffccaa'
].map(hexToRgb);

// 2. Modern Pixel Fantasy 16 (Tuned for dark parchment, brass gold, ethereal magic)
export const PALETTE_FANTASY_16: RgbColor[] = [
  '#0a0f1d', '#1e293b', '#334155', '#64748b',
  '#cbd5e1', '#f8fafc', '#dc2626', '#f97316',
  '#f59e0b', '#fde047', '#10b981', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#fbcfe8'
].map(hexToRgb);

// 3. Xianxia Ink & Jade Palette (Tuned for cultivation, blood demons, daoist scrolls)
export const PALETTE_XIANXIA: RgbColor[] = [
  '#050505', '#1a181b', '#3a343b', '#6d6570',
  '#af9f95', '#ebe4db', '#991b1b', '#b45309',
  '#d97706', '#f59e0b', '#065f46', '#047857',
  '#10b981', '#1e3a8a', '#4338ca', '#6d28d9'
].map(hexToRgb);

// 4. Vibrant Anime 32 (Full gamut for Shonen anime: hair, devil fruits, celestial glows)
export const PALETTE_ANIME_32: RgbColor[] = [
  '#000000', '#18181b', '#27272a', '#52525b', '#a1a1aa', '#f4f4f5', '#ffffff',
  '#991b1b', '#ef4444', '#f87171', '#fca5a5',
  '#ea580c', '#fb923c', '#fdba74',
  '#ca8a04', '#eab308', '#fde047', '#fef08a',
  '#15803d', '#22c55e', '#86efac',
  '#0e7490', '#06b6d4', '#67e8f9',
  '#1d4ed8', '#3b82f6', '#93c5fd',
  '#6b21a8', '#a855f7', '#d8b4fe',
  '#be185d', '#ec4899'
].map(hexToRgb);

// 5. GameBoy 4-shade Green Palette
export const PALETTE_GAMEBOY: RgbColor[] = [
  '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
].map(hexToRgb);

export type PaletteName = 'pico8' | 'fantasy16' | 'xianxia' | 'anime32' | 'gameboy';

export const PALETTES: Record<PaletteName, { name: string; colors: RgbColor[] }> = {
  pico8: { name: 'PICO-8 Classic (16 colors)', colors: PALETTE_PICO8 },
  fantasy16: { name: 'Modern Pixel Fantasy (16 colors)', colors: PALETTE_FANTASY_16 },
  xianxia: { name: 'Xianxia Jade & Ink (16 colors)', colors: PALETTE_XIANXIA },
  anime32: { name: 'Vibrant Anime (32 colors)', colors: PALETTE_ANIME_32 },
  gameboy: { name: 'DMG GameBoy (4 colors)', colors: PALETTE_GAMEBOY },
};
