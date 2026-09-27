import * as fs from 'fs/promises';
import * as path from 'path';
import { CanonicalLoreGraph, SeriesMetadata } from '../domain/types.js';
import { LoreDataStore } from './interface.js';

export class LocalGitDataStore implements LoreDataStore {
  private baseDir: string;

  constructor(baseDir: string = path.resolve(process.cwd(), 'data')) {
    this.baseDir = baseDir;
  }

  private getRegistryPath(): string {
    return path.join(this.baseDir, 'series-registry.json');
  }

  private getSeriesDir(slug: string): string {
    return path.join(this.baseDir, slug);
  }

  private getGraphPath(slug: string): string {
    return path.join(this.getSeriesDir(slug), 'graph.json');
  }

  public async getSeriesGraph(slug: string): Promise<CanonicalLoreGraph | null> {
    try {
      const filePath = this.getGraphPath(slug);
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw) as CanonicalLoreGraph;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  public async saveSeriesGraph(slug: string, graph: CanonicalLoreGraph): Promise<void> {
    const seriesDir = this.getSeriesDir(slug);
    await fs.mkdir(seriesDir, { recursive: true });
    const filePath = this.getGraphPath(slug);
    await fs.writeFile(filePath, JSON.stringify(graph, null, 2), 'utf-8');
  }

  public async listSeries(): Promise<SeriesMetadata[]> {
    try {
      const raw = await fs.readFile(this.getRegistryPath(), 'utf-8');
      return JSON.parse(raw) as SeriesMetadata[];
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  public async saveSeriesRegistry(registry: SeriesMetadata[]): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.getRegistryPath(), JSON.stringify(registry, null, 2), 'utf-8');
  }
}
