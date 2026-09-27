import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PixelConverter, PixelateOptions } from '../../../pixel/pixel-converter';
import { WikiImageFetcher } from '../../../pixel/wiki-image-fetcher';
import { AssetPixelPipeline } from '../../../pixel/asset-pipeline';
import { LocalGitDataStore } from '../../../datastore/local-git-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Single Image URL Conversion
    if (body.url) {
      const buffer = await WikiImageFetcher.downloadImageBuffer(body.url);
      const options: PixelateOptions = {
        resolution: body.resolution ? parseInt(body.resolution, 10) : 32,
        palette: body.palette || 'fantasy16',
        contrast: body.contrast ? parseFloat(body.contrast) : 1.15,
        saturation: body.saturation ? parseFloat(body.saturation) : 1.3,
        dither: body.dither === 'floyd-steinberg' ? 'floyd-steinberg' : 'none',
        outline: body.outline !== false,
      };

      const result = await PixelConverter.convertBuffer(buffer, options);
      return NextResponse.json({ success: true, result });
    }

    // 2. Batch Series Ingestion
    if (body.seriesSlug) {
      const store = new LocalGitDataStore(path.resolve(process.cwd(), 'data'));
      const graph = await store.getSeriesGraph(body.seriesSlug);
      if (!graph) {
        return NextResponse.json({ success: false, error: 'Series not found' }, { status: 404 });
      }

      const entityTypes = body.type === 'location' ? ['location'] : ['character'];
      const { reports, updatedGraph } = await AssetPixelPipeline.processSeriesEntities(
        graph,
        entityTypes as any,
        {
          resolution: body.resolution ? parseInt(body.resolution, 10) : 32,
          palette: body.palette || 'fantasy16',
        }
      );

      await store.saveSeriesGraph(body.seriesSlug, updatedGraph);
      return NextResponse.json({ success: true, reports });
    }

    return NextResponse.json({ success: false, error: 'Provide url or seriesSlug' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pixelsBase = path.resolve(process.cwd(), 'public', 'assets', 'pixels');
    const results: { series: string; type: string; id: string; url: string }[] = [];

    try {
      const seriesDirs = await fs.readdir(pixelsBase);
      for (const s of seriesDirs) {
        const seriesPath = path.join(pixelsBase, s);
        const stat = await fs.stat(seriesPath);
        if (!stat.isDirectory()) continue;

        const subDirs = await fs.readdir(seriesPath);
        for (const sub of subDirs) {
          const subPath = path.join(seriesPath, sub);
          const files = await fs.readdir(subPath);
          for (const f of files) {
            if (f.endsWith('.svg')) {
              results.push({
                series: s,
                type: sub,
                id: f.replace('.svg', ''),
                url: `/assets/pixels/${s}/${sub}/${f}`,
              });
            }
          }
        }
      }
    } catch {
      // directory might not exist yet
    }

    return NextResponse.json({ success: true, assets: results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
