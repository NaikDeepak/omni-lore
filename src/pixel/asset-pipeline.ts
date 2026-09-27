import * as fs from 'fs/promises';
import * as path from 'path';
import { CanonicalLoreGraph } from '../domain/types';
import { PixelConverter, PixelateOptions } from './pixel-converter';
import { WikiImageFetcher } from './wiki-image-fetcher';

export interface BatchPixelateOptions extends PixelateOptions {
  publicDir?: string;
  updateGraph?: boolean;
}

export interface PixelateEntityReport {
  entityId: string;
  entityName: string;
  entityType: string;
  sourceUrl?: string;
  pixelSvgPath?: string;
  success: boolean;
  error?: string;
}

export class AssetPixelPipeline {
  /**
   * Processes all characters or locations in a series, fetching source wiki images,
   * converting them to crisp pixel art, saving them, and updating the graph.
   */
  public static async processSeriesEntities(
    graph: CanonicalLoreGraph,
    entityTypes: ('character' | 'location')[] = ['character'],
    options: BatchPixelateOptions = {}
  ): Promise<{
    reports: PixelateEntityReport[];
    updatedGraph: CanonicalLoreGraph;
  }> {
    const slug = graph.series.slug;
    const publicBase = options.publicDir ?? path.resolve(process.cwd(), 'public');
    const reports: PixelateEntityReport[] = [];

    const entitiesToProcess = Object.values(graph.entities).filter(e =>
      entityTypes.includes(e.type as any)
    );

    for (const entity of entitiesToProcess) {
      const typePlural = entity.type === 'character' ? 'avatars' : 'locations';
      const outputDir = path.join(publicBase, 'assets', 'pixels', slug, typePlural);
      const outputFile = path.join(outputDir, `${entity.id}.svg`);
      const publicUrl = `/assets/pixels/${slug}/${typePlural}/${entity.id}.svg`;

      try {
        console.log(`[PixelPipeline] Processing ${entity.type} '${entity.name}' (${entity.id})...`);

        // 1. Fetch image from Wikipedia or Fandom
        const imageResult = await WikiImageFetcher.fetchImageForEntity(
          slug,
          entity.name,
          options.resolution ? options.resolution * 8 : 256,
          entity.aliases ?? []
        );

        if (!imageResult) {
          console.warn(`[PixelPipeline] No wiki image found for '${entity.name}'.`);
          reports.push({
            entityId: entity.id,
            entityName: entity.name,
            entityType: entity.type,
            success: false,
            error: 'No image found on Wikipedia or Fandom wiki.',
          });
          continue;
        }

        // 2. Download buffer
        const buffer = await WikiImageFetcher.downloadImageBuffer(imageResult.sourceUrl);

        // 3. Convert to pixel art
        const pixelArt = await PixelConverter.convertBuffer(buffer, {
          resolution: options.resolution ?? 32,
          palette: options.palette ?? (slug.includes('demonic') || slug.includes('coiling') ? 'xianxia' : 'fantasy16'),
          contrast: options.contrast ?? 1.2,
          saturation: options.saturation ?? 1.35,
          dither: options.dither ?? 'none',
          outline: options.outline ?? true,
        });

        // 4. Save SVG file
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputFile, pixelArt.svg, 'utf-8');

        // 5. Update entity in graph
        if (entity.type === 'character') {
          (entity as any).avatar_url = publicUrl;
        } else if (entity.type === 'location') {
          (entity as any).thumbnail_url = publicUrl;
        }

        reports.push({
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.type,
          sourceUrl: imageResult.sourceUrl,
          pixelSvgPath: outputFile,
          success: true,
        });

        console.log(`✓ Generated pixel art for '${entity.name}' -> ${publicUrl}`);
      } catch (err: any) {
        console.error(`[PixelPipeline] Failed for '${entity.name}':`, err.message);
        reports.push({
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.type,
          success: false,
          error: err.message,
        });
      }
    }

    return {
      reports,
      updatedGraph: graph,
    };
  }
}
