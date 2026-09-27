import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { AssetPixelPipeline } from '../src/pixel/asset-pipeline';
import { PixelConverter } from '../src/pixel/pixel-converter';
import { WikiImageFetcher } from '../src/pixel/wiki-image-fetcher';
import { PaletteName } from '../src/pixel/palette';

async function main() {
  const args = process.argv.slice(2);
  const dataDir = path.resolve(process.cwd(), 'data');
  const store = new LocalGitDataStore(dataDir);

  // Command-line flag parsing
  const seriesSlug = args.find(a => !a.startsWith('--')) ?? 'one-piece';
  const resolutionArg = args.find(a => a.startsWith('--resolution='))?.split('=')[1] ?? '32';
  const paletteArg = (args.find(a => a.startsWith('--palette='))?.split('=')[1] ?? 'fantasy16') as PaletteName;
  const typeArg = args.find(a => a.startsWith('--type='))?.split('=')[1] ?? 'character';
  const singleUrl = args.find(a => a.startsWith('--url='))?.split('=')[1];
  const outputArg = args.find(a => a.startsWith('--out='))?.split('=')[1];

  const resolution = parseInt(resolutionArg, 10) || 32;

  console.log(`\n==============================================`);
  console.log(`🎮 OMNILORE PIXEL ART CONVERTER ENGINE`);
  console.log(`==============================================`);
  console.log(`Target Series: ${seriesSlug}`);
  console.log(`Resolution:    ${resolution}x${resolution} pixels`);
  console.log(`Palette:       ${paletteArg}`);
  console.log(`Type Filter:   ${typeArg}\n`);

  // Direct single URL conversion mode
  if (singleUrl) {
    console.log(`Converting single image URL: ${singleUrl}`);
    const buffer = await WikiImageFetcher.downloadImageBuffer(singleUrl);
    const result = await PixelConverter.convertBuffer(buffer, {
      resolution,
      palette: paletteArg,
      outline: true,
      saturation: 1.3,
    });

    const targetFile = outputArg ?? path.resolve(process.cwd(), 'public', 'assets', 'pixels', 'custom.svg');
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, result.svg, 'utf-8');
    console.log(`✓ Pixel art saved to: ${targetFile}`);
    console.log(`Colors used (${result.paletteUsed.length}): ${result.paletteUsed.join(', ')}`);
    return;
  }

  // Series batch conversion mode
  const graph = await store.getSeriesGraph(seriesSlug);
  if (!graph) {
    console.error(`❌ Series '${seriesSlug}' not found in ${dataDir}`);
    process.exit(1);
  }

  const typesToProcess: ('character' | 'location')[] =
    typeArg === 'all'
      ? ['character', 'location']
      : typeArg === 'location'
      ? ['location']
      : ['character'];

  const { reports, updatedGraph } = await AssetPixelPipeline.processSeriesEntities(
    graph,
    typesToProcess,
    {
      resolution,
      palette: paletteArg,
      publicDir: path.resolve(process.cwd(), 'public'),
    }
  );

  // Save updated canonical graph with avatar_url and thumbnail_url populated
  await store.saveSeriesGraph(seriesSlug, updatedGraph);

  console.log(`\n==============================================`);
  console.log(`PIXEL CONVERSION REPORT (${seriesSlug}):`);
  console.log(`==============================================`);
  let successCount = 0;
  for (const r of reports) {
    if (r.success) {
      successCount++;
      console.log(`  ✓ [${r.entityType.toUpperCase()}] ${r.entityName.padEnd(25)} -> ${r.pixelSvgPath}`);
    } else {
      console.log(`  ⚠ [${r.entityType.toUpperCase()}] ${r.entityName.padEnd(25)} (Skipped: ${r.error})`);
    }
  }
  console.log(`\n🎉 Processed ${successCount}/${reports.length} entities successfully.`);
}

main().catch(err => {
  console.error('Fatal pixel pipeline error:', err);
  process.exit(1);
});
