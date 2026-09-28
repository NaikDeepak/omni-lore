import { CanonicalLoreGraph, EventEntity, CharacterEntity, LocationEntity, PlaneEntity, PowerStageEntity, FactionEntity } from '../domain/types';
import { TemporalEngine } from '../engine/temporal-engine';

export interface JourneyMilestone {
  chapter: number;
  type: 'power_breakthrough' | 'event' | 'relationship_formed' | 'relationship_ended' | 'faction_change';
  title: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface PowerStageProgressNode {
  id: string;
  name: string;
  order: number;
  achievedAt?: number;
  isAchieved: boolean;
  isCurrent: boolean;
}

export interface CharacterRelationshipItem {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatarUrl?: string;
  predicate: string;
  label: string;
  validFrom: number;
  validTo: number | null;
  category: 'master' | 'disciple' | 'ally' | 'rival' | 'enemy' | 'family' | 'faction' | 'other';
  isActive: boolean;
}

export interface CharacterLocationVisit {
  locationId: string;
  locationName: string;
  planeName?: string;
  chapter: number;
  eventTitle?: string;
}

export interface CharacterJourneyProjection {
  characterId: string;
  displayName: string;
  seriesSlug: string;
  userChapter: number;
  isMasked: boolean;
  character: CharacterEntity;
  currentStage?: {
    id: string;
    name: string;
    order: number;
    achievedAt?: number;
  };
  currentFaction?: {
    id: string;
    name: string;
    emblemUrl?: string;
  };
  currentLocation?: {
    id: string;
    name: string;
    planeName?: string;
  };
  status: 'Alive' | 'Deceased' | 'Active';
  powerJourney: PowerStageProgressNode[];
  relationships: CharacterRelationshipItem[];
  locationsVisited: CharacterLocationVisit[];
  milestones: JourneyMilestone[];
}

export function projectCharacterJourney(
  characterId: string,
  graph: CanonicalLoreGraph,
  userChapter: number
): CharacterJourneyProjection | null {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);
  const character = graph.entities[characterId] as CharacterEntity | undefined;

  if (!character || character.type !== 'character') {
    return null;
  }

  const displayName = filtered.displayNameMap[characterId] ?? character.name;
  const isMasked = displayName !== character.name;

  // 1. Resolve Current Power Stage & Power Journey Track
  const activeStageFact = TemporalEngine.getActiveFact<string>(
    characterId,
    'power_stage',
    Object.values(graph.facts),
    userChapter
  );

  let currentStage: CharacterJourneyProjection['currentStage'];
  if (activeStageFact) {
    const stageEntity = graph.entities[activeStageFact.value] as PowerStageEntity | undefined;
    currentStage = {
      id: activeStageFact.value,
      name: stageEntity?.name ?? activeStageFact.value,
      order: stageEntity?.order ?? 1,
      achievedAt: activeStageFact.temporal.valid_from,
    };
  }

  // Get all power stages in universe
  const allStages = Object.values(graph.entities)
    .filter((e): e is PowerStageEntity => e.type === 'power_stage')
    .sort((a, b) => a.order - b.order);

  // Map of all stages this character has achieved
  const charStageFacts = Object.values(graph.facts).filter(
    f => f.entity_id === characterId && f.predicate === 'power_stage'
  );

  const stageAchievedMap = new Map<string, number>();
  for (const f of charStageFacts) {
    stageAchievedMap.set(f.value as string, f.temporal.valid_from);
  }

  const powerJourney: PowerStageProgressNode[] = allStages.map(stage => {
    const achievedAt = stageAchievedMap.get(stage.id);
    const isAchieved = achievedAt !== undefined && achievedAt <= userChapter;
    const isCurrent = currentStage?.id === stage.id;
    return {
      id: stage.id,
      name: stage.name,
      order: stage.order,
      achievedAt,
      isAchieved,
      isCurrent,
    };
  });

  // 2. Resolve Current Faction
  const activeFactionFact = TemporalEngine.getActiveFact<string>(
    characterId,
    'faction',
    Object.values(graph.facts),
    userChapter
  );

  let currentFaction: CharacterJourneyProjection['currentFaction'];
  if (activeFactionFact) {
    const factionEntity = graph.entities[activeFactionFact.value] as FactionEntity | undefined;
    if (factionEntity) {
      currentFaction = {
        id: factionEntity.id,
        name: factionEntity.name,
        emblemUrl: (factionEntity as any).emblem_url,
      };
    }
  }

  // 3. Resolve Milestones & Location Visits
  const milestones: JourneyMilestone[] = [];
  const locationVisitsMap = new Map<string, CharacterLocationVisit>();

  const visibleStageFacts = charStageFacts.filter(f =>
    TemporalEngine.isVisibleAt(f.temporal, userChapter)
  );

  for (const fact of visibleStageFacts) {
    const stageEntity = graph.entities[fact.value as string];
    milestones.push({
      chapter: fact.temporal.valid_from,
      type: 'power_breakthrough',
      title: `Achieved ${stageEntity?.name ?? fact.value}`,
      description: `Broke through to ${stageEntity?.name ?? fact.value} stage.`,
      details: { stageId: fact.value },
    });
  }

  const events = Object.values(filtered.entities)
    .filter((e): e is EventEntity =>
      e.type === 'event' &&
      e.chapter <= userChapter &&
      e.involved_character_ids.includes(characterId)
    )
    .sort((a, b) => a.chapter - b.chapter);

  let currentLocation: CharacterJourneyProjection['currentLocation'];

  for (const ev of events) {
    milestones.push({
      chapter: ev.chapter,
      type: 'event',
      title: ev.name,
      description: ev.description,
      details: { eventType: ev.event_type, locationId: ev.location_id },
    });

    if (ev.location_id && graph.entities[ev.location_id]) {
      const loc = graph.entities[ev.location_id] as LocationEntity;
      const plane = loc.plane_id ? (graph.entities[loc.plane_id] as PlaneEntity | undefined) : undefined;

      const visit: CharacterLocationVisit = {
        locationId: loc.id,
        locationName: loc.name,
        planeName: plane?.name,
        chapter: ev.chapter,
        eventTitle: ev.name,
      };

      locationVisitsMap.set(loc.id, visit);
      currentLocation = {
        id: loc.id,
        name: loc.name,
        planeName: plane?.name,
      };
    }
  }

  const locationsVisited = Array.from(locationVisitsMap.values()).sort(
    (a, b) => a.chapter - b.chapter
  );

  // 4. Resolve Relationships
  const relationships: CharacterRelationshipItem[] = [];

  const rawRelationships = Object.values(graph.relationships).filter(
    r =>
      (r.source_id === characterId || r.target_id === characterId) &&
      TemporalEngine.isRevealedAt(r.temporal, userChapter) &&
      r.temporal.valid_from <= userChapter
  );

  for (const rel of rawRelationships) {
    const isSource = rel.source_id === characterId;
    const otherId = isSource ? rel.target_id : rel.source_id;
    const otherEntity = graph.entities[otherId];
    const otherName = filtered.displayNameMap[otherId] ?? otherEntity?.name ?? otherId;
    const otherAvatarUrl = otherEntity && 'avatar_url' in otherEntity ? (otherEntity as any).avatar_url : undefined;
    const isActive = rel.temporal.valid_to === null || rel.temporal.valid_to >= userChapter;

    let category: CharacterRelationshipItem['category'] = 'other';
    const pred = rel.predicate;
    const lbl = (rel.label ?? '').toLowerCase();

    if (pred === 'MASTER_OF') {
      category = isSource ? 'master' : 'disciple';
    } else if (pred === 'DISCIPLE_OF') {
      category = isSource ? 'disciple' : 'master';
    } else if (pred === 'ALLY_OF' || lbl.includes('ally') || lbl.includes('crew') || lbl.includes('partner') || lbl.includes('sworn')) {
      category = 'ally';
    } else if (pred === 'RIVAL_OF' || lbl.includes('rival')) {
      category = 'rival';
    } else if (pred === 'ENEMY_OF' || lbl.includes('enemy') || lbl.includes('nemesis')) {
      category = 'enemy';
    } else if (pred === 'RELATED_TO' || lbl.includes('father') || lbl.includes('brother') || lbl.includes('son') || lbl.includes('family')) {
      category = 'family';
    } else if (pred === 'MEMBER_OF' || pred === 'LEADER_OF') {
      category = 'faction';
    }

    relationships.push({
      id: rel.id,
      otherId,
      otherName,
      otherAvatarUrl,
      predicate: rel.predicate,
      label: rel.label ?? rel.predicate,
      validFrom: rel.temporal.valid_from,
      validTo: rel.temporal.valid_to,
      category,
      isActive,
    });

    milestones.push({
      chapter: rel.temporal.valid_from,
      type: 'relationship_formed',
      title: `${rel.label ?? rel.predicate} with ${otherName}`,
      description: `Established ${rel.predicate} relationship with ${otherName}.`,
      details: { relationshipId: rel.id, predicate: rel.predicate, targetId: otherId },
    });

    if (rel.temporal.valid_to !== null && rel.temporal.valid_to <= userChapter) {
      milestones.push({
        chapter: rel.temporal.valid_to,
        type: 'relationship_ended',
        title: `Ended ${rel.label ?? rel.predicate} with ${otherName}`,
        description: `Concluded ${rel.predicate} relationship with ${otherName}.`,
        details: { relationshipId: rel.id },
      });
    }
  }

  milestones.sort((a, b) => a.chapter - b.chapter);

  return {
    characterId,
    displayName,
    seriesSlug: graph.series.slug,
    userChapter,
    isMasked,
    character,
    currentStage,
    currentFaction,
    currentLocation,
    status: 'Alive',
    powerJourney,
    relationships,
    locationsVisited,
    milestones,
  };
}
