import * as path from 'path';
import { notFound } from 'next/navigation';
import { LocalGitDataStore } from '../../datastore/local-git-store';
import { WorldExplorer } from './world-explorer';

export const revalidate = 0;

interface SeriesPageProps {
  params: {
    slug: string;
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const store = new LocalGitDataStore(path.resolve(process.cwd(), 'data'));
  const graph = await store.getSeriesGraph(params.slug);

  if (!graph) {
    notFound();
  }

  return <WorldExplorer graph={graph} />;
}
