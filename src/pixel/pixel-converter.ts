import { createRequire } from 'module';
import { RgbColor, PALETTES, PaletteName, hexToRgb, rgbToHex } from './palette';

export interface PixelateOptions {
  resolution?: number; // 16, 24, 32, 48, 64
  palette?: PaletteName;
  contrast?: number;   // 1.0 = normal, 1.2 = boosted
  saturation?: number; // 1.0 = normal, 1.3 = vibrant
  dither?: 'none' | 'floyd-steinberg';
  outline?: boolean;   // Draw 1px dark silhouette border
  outlineColor?: string; // Default #0a0f1d
}

export interface PixelateResult {
  svg: string;
  svgDataUrl: string;
  matrix: (string | null)[][];
  paletteUsed: string[];
  width: number;
  height: number;
}

function getSharpInstance(): any {
  try {
    const localReq = createRequire(import.meta.url);
    try {
      return localReq('sharp');
    } catch {
      const flagoffReq = createRequire('/Users/deepaknaik/Downloads/world-building/flagoff/package.json');
      return flagoffReq('sharp');
    }
  } catch (err: any) {
    throw new Error(`Sharp library could not be loaded: ${err.message}`);
  }
}

function colorDistance(r1: number, g1: number, b1: number, c2: RgbColor): number {
  const dr = r1 - c2.r;
  const dg = g1 - c2.g;
  const db = b1 - c2.b;
  // Weighted RGB distance for human eye perception
  return 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
}

function findClosestColor(r: number, g: number, b: number, palette: RgbColor[]): RgbColor {
  let closest = palette[0];
  let minDistance = Infinity;

  for (const c of palette) {
    const dist = colorDistance(r, g, b, c);
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }

  return closest;
}

export class PixelConverter {
  /**
   * Converts an image buffer (PNG, JPEG, WebP) into crisp pixel art.
   */
  public static async convertBuffer(
    imageBuffer: Buffer,
    options: PixelateOptions = {}
  ): Promise<PixelateResult> {
    const sharp = getSharpInstance();
    const resolution = options.resolution ?? 32;
    const paletteKey = options.palette ?? 'fantasy16';
    const palette = (PALETTES[paletteKey] ?? PALETTES.fantasy16).colors;
    const contrast = options.contrast ?? 1.15;
    const saturation = options.saturation ?? 1.3;
    const dither = options.dither ?? 'none';
    const outline = options.outline ?? true;
    const outlineColor = options.outlineColor ?? '#060a14';

    // 1. Center crop and downsample to target grid with sharp
    const resized = await sharp(imageBuffer)
      .resize(resolution, resolution, {
        fit: 'cover',
        position: 'center',
      })
      .modulate({
        saturation: saturation,
        brightness: contrast > 1 ? 1.02 : 1.0,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const width = info.width;
    const height = info.height;

    // Working buffer for pixel manipulation & dithering
    // Float values [r, g, b, a]
    const grid: [number, number, number, number][][] = [];
    for (let y = 0; y < height; y++) {
      const row: [number, number, number, number][] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        row.push([data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]);
      }
      grid.push(row);
    }

    // 2. Quantize colors (with optional Floyd-Steinberg dithering)
    const resultMatrix: (string | null)[][] = [];
    const usedColorsSet = new Set<string>();

    for (let y = 0; y < height; y++) {
      const resultRow: (string | null)[] = [];
      for (let x = 0; x < width; x++) {
        const [r, g, b, a] = grid[y][x];

        // Transparent or near-transparent background
        if (a < 60) {
          resultRow.push(null);
          continue;
        }

        const matched = findClosestColor(r, g, b, palette);
        resultRow.push(matched.hex);
        usedColorsSet.add(matched.hex);

        // Floyd-Steinberg error diffusion
        if (dither === 'floyd-steinberg') {
          const errR = r - matched.r;
          const errG = g - matched.g;
          const errB = b - matched.b;

          const distributeError = (nx: number, ny: number, factor: number) => {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              grid[ny][nx][0] += errR * factor;
              grid[ny][nx][1] += errG * factor;
              grid[ny][nx][2] += errB * factor;
            }
          };

          distributeError(x + 1, y, 7 / 16);
          distributeError(x - 1, y + 1, 3 / 16);
          distributeError(x, y + 1, 5 / 16);
          distributeError(x + 1, y + 1, 1 / 16);
        }
      }
      resultMatrix.push(resultRow);
    }

    // 3. Optional 1px Dark Outline around boundary
    if (outline) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (resultMatrix[y][x] === null) {
            // Check if adjacent to a colored pixel
            const hasColoredNeighbor =
              (x > 0 && resultMatrix[y][x - 1] !== null && resultMatrix[y][x - 1] !== outlineColor) ||
              (x < width - 1 && resultMatrix[y][x + 1] !== null && resultMatrix[y][x + 1] !== outlineColor) ||
              (y > 0 && resultMatrix[y - 1][x] !== null && resultMatrix[y - 1][x] !== outlineColor) ||
              (y < height - 1 && resultMatrix[y + 1][x] !== null && resultMatrix[y + 1][x] !== outlineColor);

            if (hasColoredNeighbor) {
              resultMatrix[y][x] = outlineColor;
              usedColorsSet.add(outlineColor);
            }
          }
        }
      }
    }

    // 4. Generate Run-Length Encoded SVG
    const svg = this.generateOptimizedSvg(resultMatrix, width, height);
    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    return {
      svg,
      svgDataUrl,
      matrix: resultMatrix,
      paletteUsed: Array.from(usedColorsSet),
      width,
      height,
    };
  }

  /**
   * Compresses adjacent horizontal pixels of identical color into single <rect> runs.
   * Reduces SVG node count by ~70-85%.
   */
  public static generateOptimizedSvg(
    matrix: (string | null)[][],
    width: number,
    height: number
  ): string {
    let rects = '';

    for (let y = 0; y < height; y++) {
      let runColor: string | null = null;
      let runStart = 0;

      for (let x = 0; x < width; x++) {
        const color = matrix[y][x];

        if (color !== runColor) {
          if (runColor !== null) {
            const span = x - runStart;
            rects += `<rect x="${runStart}" y="${y}" width="${span}" height="1" fill="${runColor}"/>`;
          }
          runColor = color;
          runStart = x;
        }
      }

      // Final run on line
      if (runColor !== null) {
        const span = width - runStart;
        rects += `<rect x="${runStart}" y="${y}" width="${span}" height="1" fill="${runColor}"/>`;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects}</svg>`;
  }
}
