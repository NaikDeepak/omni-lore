import coilingDragon from '../../data/coiling-dragon/graph.json';
import demonicEmperor from '../../data/demonic-emperor/graph.json';
import lotm from '../../data/lord-of-the-mysteries/graph.json';
import onePiece from '../../data/one-piece/graph.json';
import soloLeveling from '../../data/solo-leveling/graph.json';

export const UNIVERSE_GRAPHS: Record<string, any> = {
  'coiling-dragon': coilingDragon,
  'demonic-emperor': demonicEmperor,
  'lord-of-the-mysteries': lotm,
  'one-piece': onePiece,
  'solo-leveling': soloLeveling
};

export function getUniverseGraph(slug: string): any | null {
  return UNIVERSE_GRAPHS[slug] ?? null;
}
