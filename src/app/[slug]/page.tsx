import * as path from 'path';
import { notFound } from 'next/navigation';
import { LocalGitDataStore } from '../../datastore/local-git-store';
import { WorldExplorer } from './world-explorer';

export const revalidate = 0;

interface SeriesPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const store = new LocalGitDataStore(path.resolve(process.cwd(), 'data'));
  const graph = await store.getSeriesGraph(slug);

  if (!graph) {
    notFound();
  }

  return <WorldExplorer key={slug} graph={graph} />;
}

