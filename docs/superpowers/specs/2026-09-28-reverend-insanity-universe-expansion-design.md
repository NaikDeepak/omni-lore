# Design Specification: Reverend Insanity Universe Expansion

- **Series Slug:** `reverend-insanity`
- **Universe Title:** Reverend Insanity (蛊真人)
- **Author:** Gu Zhen Ren
- **Status:** Approved Architectural Spec
- **Date:** 2026-09-28
- **Scope:** Full Canonical Series Index (Chapters 1 – 2,334 across all 6 Books)

---

## 1. Executive Summary

This specification defines the ingestion and integration of **Reverend Insanity** (`reverend-insanity`) as the 6th canonical universe in OmniLore. It provides complete zero-spoiler temporal modeling for 2,334 chapters, including:
- A normalized temporal knowledge graph (`data/reverend-insanity/graph.json`)
- A 9-tier Gu cultivation Power Ladder and Realm Codex
- Multi-alias temporal identity masking for Fang Yuan across his mortal, zombie, sovereign body, and venerable states
- Procedural pixel SVG Fog-of-War cartography spanning the Five Regions, Two Heavens, and the River of Time
- Six canonical RPG Duel Simulator presets
- Retro pixel avatars, faction crests, and landmark icons

---

## 2. Canonical Knowledge Graph Ontology (`data/reverend-insanity/graph.json`)

### 2.1 Series Metadata
```json
{
  "slug": "reverend-insanity",
  "title": "Reverend Insanity",
  "type": "cultivation",
  "status": "completed",
  "wiki_api_endpoint": "https://reverend-insanity.fandom.com/api.php",
  "total_chapters": 2334,
  "knowledge_boundary": {
    "latest_processed_chapter": 2334,
    "as_of": "2026-09-28T00:00:00Z"
  }
}
```

### 2.2 Power Ladder & Realm Codex (9 Canonical Tiers)
1. **`stage-ri-rank-1` (Rank 1 Gu Master):** Initial, Middle, Upper, Peak. Green Copper Primeval Essence. Mortal starting tier. Aperture wall of green light.
2. **`stage-ri-rank-2` (Rank 2 Gu Master):** Initial, Middle, Upper, Peak. Red Iron Primeval Essence.
3. **`stage-ri-rank-3` (Rank 3 Gu Master):** Initial, Middle, Upper, Peak. White Silver Primeval Essence. Light barrier aperture wall.
4. **`stage-ri-rank-4` (Rank 4 Gu Master):** Initial, Middle, Upper, Peak. Yellow Gold Primeval Essence. Crystal aperture wall.
5. **`stage-ri-rank-5` (Rank 5 Gu Master):** Mortal Apex. Purple Crystal Primeval Essence. Mortal aperture boundary.
6. **`stage-ri-rank-6` (Rank 6 Gu Immortal):** Immortal Ascension. Green Grape Immortal Essence. Earthly Calamities every 10 years. Small blessed land.
7. **`stage-ri-rank-7` (Rank 7 Gu Immortal):** Red Date Immortal Essence. Heavenly Tribulations every 50 years. Medium blessed land.
8. **`stage-ri-rank-8` (Rank 8 Gu Immortal):** White Lichee Immortal Essence. Grand Tribulations every 100 years. Large blessed land / grotto-heaven.
9. **`stage-ri-rank-9` (Rank 9 Venerable):** Yellow Apricot Immortal Essence. Myriad Tribulations, Chaos Tribulation. Supreme Grandmaster attainment in core path.

### 2.3 Character Roster & Temporal Identities
* **Fang Yuan (`char-fang-yuan`):** Protagonist.
  * Temporal Reveals / Aliases:
    * Ch. 1–200: Known as `Gu Yue Fang Yuan`.
    * Ch. 201–405: Alias `Gu Yue Yi Shan` (Caravan & Shang Clan City).
    * Ch. 406–640: Masked as `Wolf King Chang Shan Yin` (`[UNKNOWN ENIGMA]` until Ch. 640 unmasking).
    * Ch. 641–1024: Alias `Immortal Zombie Zhi Zhi` / `Starry Sky Master`.
    * Ch. 1025–1284: Alias `Chu Ying`.
    * Ch. 1285–1968: Alias `Liu Guan Yi` (Reverse Flow River Lord).
    * Ch. 1969–2334: `Great Love Immortal Venerable` / `Heaven Refining Demon Venerable`.
* **Gu Yue Fang Zheng (`char-fang-zheng`):** A-grade twin brother, Blood Path immortal disciple.
* **Bai Ning Bing (`char-bai-ning-bing`):** Northern Dark Ice Soul Physique, gender transformation, eternal ice master.
* **Tie Ruo Nan (`char-tie-ruo-nan`):** Tie Clan righteous investigator, iron mask.
* **Tie Xue Leng (`char-tie-xue-leng`):** Renowned Southern Border divine detective, father of Tie Ruo Nan.
* **Shang Xin Ci (`char-shang-xin-ci`):** Shang Clan leader, compassionate mortal benefactor.
* **Feng Jiu Ge (`char-feng-jiu-ge`):** Sound Path peerless master, "To be uninhibited in the world...".
* **Feng Jin Huang (`char-feng-jin-huang`):** Spirit Affinity House fairy, Great Dream Immortal Venerable seed.
* **Hei Lou Lan (`char-hei-lou-lan`):** Great Strength True Martial Physique, Black Tyrant.
* **Tai Bai Yun Sheng (`char-tai-bai-yun-sheng`):** Time Path elder (Man as Before, Landscape as Before).
* **Duke Long (`char-duke-long`):** Heavenly Court Dragonman Ancestor, Red Lotus's master, Heavenly Dragon Last Stand.
* **Star Constellation Immortal Venerable (`char-star-constellation`):** 2nd Heavenly Court Venerable, Wisdom Path creator.
* **Giant Sun Immortal Venerable (`char-giant-sun`):** Longevity Heaven progenitor, Luck Path creator.
* **Spectral Soul Demon Venerable (`char-spectral-soul`):** Shadow Sect master, Soul Path creator, Sovereign Fetus Gu creator.
* **Red Lotus Demon Venerable (`char-red-lotus`):** Time Path rebel, Spring Autumn Cicada creator.
* **Paradise Earth Immortal Venerable (`char-paradise-earth`):** Earth Path benevolent master.
* **Wu Yong (`char-wu-yong`):** Southern Border Wu Clan hegemon, Wind Path master.
* **Fairy Zi Wei (`char-fairy-zi-wei`):** Heavenly Court Wisdom Path strategist.
* **Bo Qing (`char-bo-qing`):** Pseudo-Venerable Sword Immortal.
* **Lang Ya Land Spirit (`char-lang-ya-spirit`):** Long Hair Ancestor obsession, refinement obsession.

### 2.4 Factions & Organizations
* `faction-gu-yue`: Gu Yue Clan (Qing Mao Mountain)
* `faction-bai`: Bai Clan (Qing Mao Mountain)
* `faction-tie`: Tie Clan (Southern Border Iron Pagoda)
* `faction-shang`: Shang Clan (Southern Border Shang Clan City)
* `faction-wu`: Wu Clan (Southern Border hegemonic clan)
* `faction-heavenly-court`: Heavenly Court (Central Continent apex righteous holy land)
* `faction-shadow-sect`: Shadow Sect (Spectral Soul secret remnant organization)
* `faction-longevity-heaven`: Longevity Heaven (Northern Plains Huang Jin bloodline holy land)
* `faction-spirit-affinity`: Spirit Affinity House (Central Continent 10 Great Ancient Sects)
* `faction-lang-ya`: Lang Ya Sect (Northern Plains refining sanctuary)

### 2.5 Cosmological Planes & Geographic Landmarks
* **Plane 1: The Five Regions (`plane-five-regions`):**
  * `loc-qing-mao-mountain` (X: 180, Y: 720) — Southern Border
  * `loc-shang-clan-city` (X: 280, Y: 760) — Southern Border
  * `loc-san-cha-mountain` (X: 230, Y: 840) — Southern Border
  * `loc-yi-tian-mountain` (X: 350, Y: 880) — Southern Border
  * `loc-wu-clan-headquarters` (X: 150, Y: 820) — Southern Border
  * `loc-spirit-affinity-house` (X: 430, Y: 560) — Central Continent
  * `loc-heavenly-court-portal` (X: 520, Y: 460) — Central Continent
  * `loc-refinement-convention` (X: 580, Y: 530) — Central Continent
  * `loc-crescent-lake` (X: 480, Y: 220) — Northern Plains
  * `loc-yu-tian` (X: 400, Y: 270) — Northern Plains
  * `loc-imperial-court-portal` (X: 540, Y: 180) — Northern Plains
  * `loc-ghost-cry-sea` (X: 130, Y: 470) — Western Desert
  * `loc-fang-clan-oasis` (X: 220, Y: 420) — Western Desert
  * `loc-bubble-sea` (X: 780, Y: 460) — Eastern Sea
  * `loc-qi-sea` (X: 860, Y: 550) — Eastern Sea
  * `loc-song-clan-isles` (X: 820, Y: 640) — Eastern Sea
* **Plane 2: Immemorial Heavens & Blessed Lands (`plane-immortal-blessed-lands`):**
  * `loc-white-heaven` (X: 500, Y: 100)
  * `loc-black-heaven` (X: 500, Y: 200)
  * `loc-lang-ya-blessed-land` (X: 450, Y: 320)
  * `loc-hu-immortal-blessed-land` (X: 300, Y: 480)
  * `loc-imperial-court-blessed-land` (X: 600, Y: 260)
  * `loc-heavenly-court-grotto` (X: 500, Y: 620)
* **Plane 3: Cosmic River of Time (`plane-river-of-time`):**
  * `loc-stone-lotus-islands` (X: 500, Y: 500)
  * `loc-present-pavilion` (X: 300, Y: 400)
  * `loc-year-tributary` (X: 700, Y: 600)

### 2.6 Timeline Arcs (Books 1–6)
* `arc-ri-book-1`: "A Demon's Rebirth" (Ch. 1–200)
* `arc-ri-book-2`: "Demonic Departure" (Ch. 201–405)
* `arc-ri-book-3`: "Demon King Rampages" (Ch. 406–649)
* `arc-ri-book-4`: "Demon Overturns the Heavens" (Ch. 650–1025)
* `arc-ri-book-5`: "Demon Venerable Reign" (Ch. 1026–1968)
* `arc-ri-book-6`: "Gu Dao Zhen Ren" (Ch. 1969–2334)

---

## 3. UI Theme & Pixel Art System

### 3.1 Universe Theme (`src/domain/themes.ts`)
* **ID:** `reverend-insanity`
* **Name:** `Reverend Insanity`
* **Tagline:** *Gu worm cultivation, ruthless perseverance, and the struggle against Fate*
* **Accent Color:** `#10b981` (Emerald Jade)
* **Accent Border:** `border-emerald-500/60`
* **Badge Background:** `bg-emerald-500/20`
* **Badge Text:** `text-emerald-300`
* **Panel Background:** `bg-[#06140e]`
* **CRT Tint:** `rgba(16, 185, 129, 0.035)`
* **Rune Symbol:** `🦗`
* **Primary Stat:** `⚔ Gu Rank & Essence`
* **Secondary Stat:** `✦ Dao Marks & Calamity`
* **Terrain Colors:** Sea `#04100c`, Land `#0b251b`, Mountain `#154231`, Fog `#020705`, Grid `rgba(16, 185, 129, 0.12)`.

### 3.2 Pixel Art Vector Assets
* Characters: `public/assets/pixels/reverend-insanity/avatars/`
* Factions: `public/assets/pixels/reverend-insanity/factions/`
* Locations: `public/assets/pixels/reverend-insanity/locations/`

---

## 4. RPG Duel Simulator Canon Presets (`src/engine/duel-simulator.ts`)

1. `ri-fangyuan-guyue-elders` (Ch. 195): Fang Yuan vs. Gu Yue Bo & Elders
2. `ri-fangyuan-tieruonan` (Ch. 390): Fang Yuan vs. Tie Ruo Nan
3. `ri-fangyuan-bainingbing` (Ch. 405): Fang Yuan vs. Bai Ning Bing
4. `ri-fangyuan-giantsun-will` (Ch. 640): Fang Yuan vs. Giant Sun's Will
5. `ri-fangyuan-dukelong` (Ch. 1750): Fang Yuan vs. Duke Long
6. `ri-three-venerables-chaos` (Ch. 2210): Fang Yuan vs. Star Constellation Immortal Venerable

---

## 5. Procedural Map Cartography (`PixelMapCanvas.tsx`)

Render dedicated vector SVG terrain for `seriesSlug === 'reverend-insanity'`:
- Karst peaks of Southern Border with emerald river tributaries
- Civilized sect grids and imperial pathways of Central Continent
- Rolling windswept plains of Northern Plains
- Dunes and oasis fissures of Western Desert
- Deep ocean waves and island chains of Eastern Sea
- Dynamic fog of war dissolving around discovered landmarks

---

## 6. Verification & Automated Testing Plan

1. **Datastore Suite (`tests/datastore.test.ts`):** Verify `reverend-insanity` loads cleanly, has valid metadata, and entities adhere to schema invariants.
2. **Projections Suite (`tests/projections.test.ts`):** Verify power ladder, relationship web, world map, and timeline projections work accurately with zero spoilers at chapters 50, 300, 600, 1000, 1800, and 2334.
3. **Duel Simulator Suite (`tests/duel-simulator.test.ts`):** Verify all 6 canon presets resolve with damage formulas and combat commentary.
4. **Build Suite:** Run `npm test && npm run build` to verify 100% test pass rate and compile without TypeScript or routing errors.
