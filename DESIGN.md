# System Design: Visual Lore & Worldbuilding Explorer

> **Temporary Project Codename:** `the-journey-of-unknown`  
> **Status:** Approved Design Specification  
> **Date:** 2026-09-27  

---

## 1. Executive Summary

Existing anime, light novel, and cultivation/xianxia wikis (primarily hosted on Fandom / MediaWiki) suffer from dense text walls, lack of spatial/hierarchical intuition, and constant spoiler risks. 

This project is an **automated, visual-first lore explorer** that transforms raw wiki content into dynamic, interactive experiences:
- ⚡ **Cultivation & Power Ladders:** Visual skill/realm trees showing who sits at each power stage.
- 🕸️ **Character Relationship Webs:** Dynamic force-directed graph of alliances, master-disciple ties, and rivalries.
- 🗺️ **Cosmology & World Maps:** Interactive pan-and-zoom layered planar maps.
- ⏳ **Chronological Timelines:** Arc-by-arc roadmaps with a global **Spoiler Scrubber** slider.

---

## 2. Benchmark Pilot Series

We will validate the pipeline and views against four distinct narrative formats:

| Series | Format / Genre | Key Visual Challenges |
| :--- | :--- | :--- |
| **Coiling Dragon** *(Completed)* | Classic Xianxia / Cultivation | 4 Higher Planes + 7 Divine Planes, Saint $\rightarrow$ God $\rightarrow$ Highgod $\rightarrow$ Sovereign laws. |
| **Solo Leveling** *(Completed)* | LitRPG / Modern Fantasy | Hunter rank ladders (E to S, National), Shadow Army hierarchy, Dungeon gates. |
| **Lord of the Mysteries** *(Ongoing)* | Steampunk / Mystic Cultivation | 22 Beyonder pathways (Seq 9 to 0), Tarot Club secret relationship web, Northern/Southern continents. |
| **One Piece** *(Ongoing)* | Shonen Anime / Epic World | East Blue $\rightarrow$ Grand Line $\rightarrow$ New World sea navigation, pirate crews / Marine factions, Void Century timeline. |

---

## 3. High-Level Architecture

The system uses a **GitOps Jamstack** architecture with an abstract **Repository / DataStore** layer. This delivers zero hosting/database costs initially while guaranteeing smooth migration to a database (PostgreSQL/Supabase) as data scales.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    Daily GitHub Action                      │
 │                                                             │
 │  1. Read series-registry.json                               │
 │  2. Select 1 completed + 1 ongoing series                   │
 │  3. Scrape MediaWiki API (Categories, Infoboxes, Extracts)  │
 │  4. LLM Synthesis (Gemini Flash with Zod/Pydantic schemas) │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │       DataStore Adapter Interface     │
            │  - saveSeries(slug, loreGraph)        │
            │  - getSeries(slug)                    │
            │  - listSeries()                       │
            └───────────────┬───────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    [Phase 1: LocalGitDataStore]    [Future: DatabaseDataStore]
    data/<slug>/                     PostgreSQL / Supabase / R2
      ├── metadata.json              Tables: series, characters,
      ├── realms.json                        realms, events,
      ├── characters.json                    relationships, maps
      ├── relationships.json
      ├── timeline.json
      └── map.json
            │
            ▼
 ┌─────────────────────────────────────────────────────────────┐
 │            Vercel Frontend (Next.js + Tailwind)             │
 │                                                             │
 │  • World Hub: Series landing & metadata                     │
 │  • Global Spoiler Scrubber (Filter by Chapter/Arc)          │
 │  • 4 Interactive Visualizers:                               │
 │    1. Cultivation / Power Ladder (React Flow / Tier Tree)   │
 │    2. Character Relationship Web (Cytoscape / Force Graph)  │
 │    3. Cosmology / World Map (SVG Pan-Zoom / Leaflet)        │
 │    4. Chronology / Arc Timeline (Interactive scrubber)      │
 └─────────────────────────────────────────────────────────────┘
```

---

## 4. Normalized Data Schemas

All entities and relationships include chapter boundaries (`chapter`, `valid_from_chapter`, `valid_to_chapter`) to power the client-side spoiler scrubber.

### 4.1. `series-registry.json`
```json
[
  {
    "slug": "coiling-dragon",
    "title": "Coiling Dragon",
    "type": "cultivation",
    "status": "completed",
    "wiki_api_endpoint": "https://coiling-dragon.fandom.com/api.php",
    "last_synced_at": null,
    "total_chapters": 842
  }
]
```

### 4.2. `realms.json` (Power & Cultivation Stages)
```json
{
  "system_name": "Laws and Sovereign System",
  "tiers": [
    {
      "id": "tier-saint",
      "order": 10,
      "name": "Saint",
      "sub_levels": ["Early", "Middle", "Peak"],
      "description": "Can fly and touch planar laws.",
      "plane_id": "plane-yulan"
    }
  ]
}
```

### 4.3. `characters.json` & `relationships.json`
```json
// characters.json
[
  {
    "id": "linley-baruch",
    "name": "Linley Baruch",
    "aliases": ["Dragonblood Warrior"],
    "avatar_url": "https://...",
    "faction_id": "four-divine-beasts",
    "progression": [
      { "chapter": 1, "realm_id": "tier-mortal", "status": "alive" },
      { "chapter": 115, "realm_id": "tier-saint", "status": "alive" },
      { "chapter": 450, "realm_id": "tier-god", "status": "alive" }
    ]
  }
]

// relationships.json
[
  {
    "id": "rel-doehring-linley",
    "source": "doehring-cowart",
    "target": "linley-baruch",
    "type": "master",
    "label": "Grandpa Doehring in the Ring",
    "valid_from_chapter": 1,
    "valid_to_chapter": 120
  }
]
```

### 4.4. `timeline.json` & `map.json`
- **`timeline.json`:** Lists arcs and key events (breakthroughs, major wars, character deaths, plane ascensions) tagged by chapter.
- **`map.json`:** Lists planes/layers (e.g. *Yulan Continent*, *Infernal Realm*) and locations with territory boundaries and coordinates.

---

## 5. Ingestion Pipeline Specification

1. **Trigger:** Daily cron in GitHub Actions (`schedule: - cron: '0 0 * * *'`).
2. **Selection:** Reads `series-registry.json`, picks 1 completed series + 1 ongoing series.
3. **Scraper:**
   - Targets MediaWiki categories: `Characters`, `Factions`, `Realms`/`Stages`, `Locations`, `Arcs`.
   - Extracts structured infoboxes + clean text extracts.
   - Caches responses in `.cache/` to minimize external requests.
4. **LLM Synthesis (Gemini Flash):**
   - Inputs infoboxes and text summaries.
   - Enforces strict Zod/Pydantic schemas.
   - Outputs normalized JSON files into `data/<series-slug>/`.
5. **Git Commit & Deploy:**
   - Automatically commits changes with `[skip ci]`.
   - Triggers Vercel production rebuild.

---

## 6. Frontend Specification

- **Tech Stack:** Next.js (App Router), Tailwind CSS, Lucide icons.
- **Interactive Libraries:**
  - *Cytoscape.js* / *React Flow* for the relationship graph and realm hierarchy.
  - *@panzoom/panzoom* or *Leaflet* for planar maps.
- **Spoiler Scrubber UI:** Persistent top-bar slider adjusting global `userChapter` state, instantly filtering nodes, edges, and statuses client-side.
