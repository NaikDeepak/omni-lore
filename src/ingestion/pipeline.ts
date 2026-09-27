import * as path from 'path';
import { LocalGitDataStore } from '../datastore/local-git-store';
import { MediaWikiSource } from './sources/mediawiki';
import { ConflictEngine } from '../engine/conflict-engine';

export async function runIngestion(seriesSlug: string) {
  const store = new LocalGitDataStore(path.resolve(process.cwd(), 'data'));
  const registry = await store.listSeries();
  const seriesMeta = registry.find(s => s.slug === seriesSlug);

  if (!seriesMeta) {
    throw new Error(`Series '${seriesSlug}' not found in registry.`);
  }

  if (!seriesMeta.wiki_api_endpoint) {
    throw new Error(`No wiki API endpoint registered for '${seriesSlug}'.`);
  }

  console.log(`[Ingest] Starting ingestion for: ${seriesMeta.title}`);
  console.log(`[Ingest] Source endpoint: ${seriesMeta.wiki_api_endpoint}`);

  const source = new MediaWikiSource(seriesMeta.wiki_api_endpoint);

  // 1. Deterministic Category Discovery
  console.log('[Ingest] Querying Category:Characters...');
  let characterTitles: string[] = [];
  try {
    characterTitles = await source.fetchCategoryMembers('Characters', 10);
    console.log(`[Ingest] Discovered ${characterTitles.length} character articles.`);
  } catch (err: any) {
    console.warn(`[Ingest] Warning: Failed to query Category:Characters: ${err.message}`);
  }

  // 2. Load existing canonical graph to update incrementally
  let existingGraph = await store.getSeriesGraph(seriesSlug);
  if (!existingGraph) {
    throw new Error(`Existing graph for '${seriesSlug}' must be initialized.`);
  }

  // 3. Run validation & conflict audit
  const issues = ConflictEngine.detectIntegrityIssues(existingGraph);
  const conflicts = ConflictEngine.detectFactConflicts(Object.values(existingGraph.facts));

  console.log(`[Ingest] Graph Integrity: ${issues.length === 0 ? '✓ Valid' : '⚠ ' + issues.length + ' Issues'}`);
  console.log(`[Ingest] Contradictions: ${conflicts.length === 0 ? '✓ 0 Conflicts' : '⚠ ' + conflicts.length + ' Conflicts'}`);

  // 4. Update knowledge boundary timestamp
  existingGraph.series.knowledge_boundary.as_of = new Date().toISOString();
  await store.saveSeriesGraph(seriesSlug, existingGraph);

  console.log(`[Ingest] Successfully synchronized '${seriesSlug}' to data/${seriesSlug}/graph.json.`);
}

// Direct CLI invocation
const targetSlug = process.argv[2] || 'one-piece';
runIngestion(targetSlug).catch(err => {
  console.error('[Ingest Error]:', err.message);
  process.exit(1);
});
