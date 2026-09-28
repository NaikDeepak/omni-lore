import { CanonicalLoreGraph, SeriesMetadata } from '../domain/types.js';
import { WorldMapDefinition } from '../domain/map-types.js';

export interface LoreDataStore {
  /**
   * Retrieves the canonical lore graph for a series.
   */
  getSeriesGraph(slug: string): Promise<CanonicalLoreGraph | null>;

  /**
   * Persists the canonical lore graph for a series.
   */
  saveSeriesGraph(slug: string, graph: CanonicalLoreGraph): Promise<void>;

  /**
   * Lists all registered series metadata.
   */
  listSeries(): Promise<SeriesMetadata[]>;

  /**
   * Updates or registers series metadata.
   */
  saveSeriesRegistry(registry: SeriesMetadata[]): Promise<void>;

  /**
   * Retrieves the map definition for a series if one exists.
   */
  getSeriesMap?(slug: string): Promise<WorldMapDefinition | null>;
}
