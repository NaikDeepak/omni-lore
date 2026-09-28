import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.resolve(process.cwd(), 'public/assets/pixels/one-piece');

// 1. Character Avatars
const avatars: Record<string, string> = {
  'imu.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#09090b"/>
  <!-- Tall shadowy royal crown/veil -->
  <rect x="14" y="1" width="4" height="6" fill="#18181b"/>
  <rect x="13" y="4" width="6" height="5" fill="#18181b"/>
  <rect x="11" y="9" width="10" height="6" fill="#18181b"/>
  <!-- Crown golden spires -->
  <rect x="14" y="0" width="1" height="2" fill="#fbbf24"/>
  <rect x="17" y="0" width="1" height="2" fill="#fbbf24"/>
  <rect x="15" y="2" width="2" height="1" fill="#f59e0b"/>
  <!-- Void Face & Concentric Crimson Red Eyes -->
  <rect x="12" y="11" width="8" height="4" fill="#09090b"/>
  <rect x="13" y="12" width="2" height="2" fill="#dc2626"/>
  <rect x="17" y="12" width="2" height="2" fill="#dc2626"/>
  <rect x="13" y="12" width="1" height="1" fill="#fef08a"/>
  <rect x="17" y="12" width="1" height="1" fill="#fef08a"/>
  <!-- Draped Majestic Void Robes -->
  <rect x="8" y="15" width="16" height="4" fill="#18181b"/>
  <rect x="6" y="19" width="20" height="6" fill="#18181b"/>
  <rect x="4" y="25" width="24" height="7" fill="#0f172a"/>
  <!-- Subtle Crimson/Gold Trim of the Empty Throne -->
  <rect x="15" y="16" width="2" height="12" fill="#7f1d1d"/>
  <rect x="14" y="28" width="4" height="3" fill="#991b1b"/>
</svg>`,

  'gorosei-saturn.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#1e293b"/>
  <!-- White dreadlocks/curly beard & hair -->
  <rect x="9" y="3" width="14" height="6" fill="#f8fafc"/>
  <rect x="7" y="6" width="18" height="10" fill="#f8fafc"/>
  <!-- Face & Forehead Scar -->
  <rect x="11" y="7" width="10" height="7" fill="#fed7aa"/>
  <rect x="12" y="8" width="3" height="1" fill="#b91c1c"/>
  <!-- Eyes & Eyebrows -->
  <rect x="12" y="10" width="2" height="1" fill="#475569"/>
  <rect x="18" y="10" width="2" height="1" fill="#475569"/>
  <rect x="13" y="11" width="1" height="1" fill="#0f172a"/>
  <rect x="18" y="11" width="1" height="1" fill="#0f172a"/>
  <!-- Thick White Beard -->
  <rect x="10" y="13" width="12" height="6" fill="#f8fafc"/>
  <!-- Black Gorosei Elder Suit & Tie -->
  <rect x="8" y="18" width="16" height="14" fill="#0f172a"/>
  <rect x="14" y="18" width="4" height="7" fill="#f8fafc"/>
  <rect x="15" y="20" width="2" height="5" fill="#38bdf8"/>
  <!-- Cane/Crutch -->
  <rect x="23" y="17" width="2" height="15" fill="#78350f"/>
  <!-- Gyuki Horn hint -->
  <rect x="7" y="2" width="3" height="3" fill="#334155"/>
  <rect x="22" y="2" width="3" height="3" fill="#334155"/>
</svg>`,

  'gorosei-warcury.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#1e1b4b"/>
  <!-- Bald head with forehead birthmark -->
  <rect x="11" y="3" width="10" height="9" fill="#ffedd5"/>
  <rect x="14" y="5" width="3" height="2" fill="#b45309"/>
  <!-- Eyes -->
  <rect x="12" y="8" width="2" height="1" fill="#0f172a"/>
  <rect x="18" y="8" width="2" height="1" fill="#0f172a"/>
  <!-- Massive Curved White Boar-like Mustache -->
  <rect x="6" y="11" width="20" height="3" fill="#f8fafc"/>
  <rect x="4" y="9" width="3" height="4" fill="#f8fafc"/>
  <rect x="25" y="9" width="3" height="4" fill="#f8fafc"/>
  <!-- Dark Formal Robes -->
  <rect x="7" y="14" width="18" height="18" fill="#1e293b"/>
  <rect x="13" y="14" width="6" height="18" fill="#334155"/>
  <rect x="15" y="15" width="2" height="8" fill="#f8fafc"/>
  <!-- Fengxi Crimson Aura -->
  <rect x="5" y="2" width="2" height="2" fill="#dc2626" opacity="0.6"/>
  <rect x="25" y="2" width="2" height="2" fill="#dc2626" opacity="0.6"/>
</svg>`,

  'gorosei-nusjuro.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#064e3b"/>
  <!-- Bald head & Round Glasses -->
  <rect x="11" y="4" width="10" height="8" fill="#fed7aa"/>
  <!-- Glasses -->
  <rect x="12" y="7" width="3" height="2" fill="#38bdf8"/>
  <rect x="17" y="7" width="3" height="2" fill="#38bdf8"/>
  <rect x="15" y="7" width="2" height="1" fill="#f8fafc"/>
  <!-- White Monk / Samurai Gi -->
  <rect x="7" y="12" width="18" height="20" fill="#f8fafc"/>
  <rect x="13" y="12" width="6" height="8" fill="#fed7aa"/>
  <!-- Black Obi Belt -->
  <rect x="10" y="20" width="12" height="3" fill="#0f172a"/>
  <!-- Shodai Kitetsu Cursed Katana -->
  <rect x="23" y="8" width="2" height="22" fill="#94a3b8"/>
  <rect x="22" y="16" width="4" height="2" fill="#fbbf24"/>
  <rect x="23" y="18" width="2" height="6" fill="#7f1d1d"/>
  <!-- Frost Glacial Aura -->
  <rect x="24" y="5" width="2" height="2" fill="#67e8f9"/>
</svg>`,

  'gorosei-mars.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#18181b"/>
  <!-- Long flowing pointed white hair & beard -->
  <rect x="11" y="2" width="10" height="6" fill="#f8fafc"/>
  <rect x="9" y="5" width="14" height="18" fill="#f8fafc"/>
  <!-- Face -->
  <rect x="12" y="6" width="8" height="6" fill="#ffedd5"/>
  <rect x="13" y="8" width="2" height="1" fill="#0f172a"/>
  <rect x="17" y="8" width="2" height="1" fill="#0f172a"/>
  <!-- Slender long beard reaching downward -->
  <rect x="13" y="12" width="6" height="14" fill="#f8fafc"/>
  <!-- Dark Suit Sleeves & Torso -->
  <rect x="6" y="16" width="6" height="16" fill="#27272a"/>
  <rect x="20" y="16" width="6" height="16" fill="#27272a"/>
  <!-- Itsumade Avian Plumage Hue -->
  <rect x="4" y="8" width="2" height="6" fill="#ef4444" opacity="0.6"/>
  <rect x="26" y="8" width="2" height="6" fill="#ef4444" opacity="0.6"/>
</svg>`,

  'gorosei-ju-peter.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#3f2c1d"/>
  <!-- Short swept-back Blonde hair -->
  <rect x="10" y="3" width="12" height="5" fill="#facc15"/>
  <rect x="9" y="5" width="14" height="3" fill="#eab308"/>
  <!-- Face & Neck Scar -->
  <rect x="11" y="6" width="10" height="9" fill="#fed7aa"/>
  <rect x="13" y="8" width="2" height="1" fill="#0f172a"/>
  <rect x="17" y="8" width="2" height="1" fill="#0f172a"/>
  <rect x="14" y="12" width="4" height="2" fill="#991b1b"/>
  <!-- Dark Western Suit with Red Tie -->
  <rect x="7" y="15" width="18" height="17" fill="#18181b"/>
  <rect x="13" y="15" width="6" height="7" fill="#f8fafc"/>
  <rect x="15" y="17" width="2" height="6" fill="#dc2626"/>
  <!-- Sandworm Maw Silhouette Base -->
  <rect x="3" y="27" width="6" height="4" fill="#78350f"/>
  <rect x="23" y="27" width="6" height="4" fill="#78350f"/>
</svg>`,

  'garling-figarland.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#3b0764"/>
  <!-- Crescent-Moon Shaped Hair & Pointed Beard -->
  <rect x="6" y="2" width="5" height="12" fill="#e2e8f0"/>
  <rect x="9" y="1" width="14" height="5" fill="#e2e8f0"/>
  <rect x="11" y="5" width="10" height="8" fill="#fed7aa"/>
  <!-- Tinted Sunglasses -->
  <rect x="12" y="7" width="8" height="2" fill="#09090b"/>
  <!-- Pointed Crescent Beard curving left -->
  <rect x="5" y="12" width="8" height="4" fill="#e2e8f0"/>
  <rect x="8" y="14" width="9" height="3" fill="#e2e8f0"/>
  <!-- Regal God's Knights Officer Coat with Gold Epaulets -->
  <rect x="7" y="17" width="18" height="15" fill="#1e1b4b"/>
  <rect x="5" y="17" width="4" height="3" fill="#fbbf24"/>
  <rect x="23" y="17" width="4" height="3" fill="#fbbf24"/>
  <rect x="13" y="17" width="6" height="15" fill="#dc2626"/>
</svg>`,
};

// 2. Faction Emblems
const factions: Record<string, string> = {
  'faction-world-government.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#0f172a"/>
  <!-- World Government Four-Circle Cross -->
  <!-- Cross Bars -->
  <rect x="15" y="4" width="2" height="24" fill="#f8fafc"/>
  <rect x="4" y="15" width="24" height="2" fill="#f8fafc"/>
  <!-- Central Circle (Grand Line) -->
  <rect x="13" y="13" width="6" height="6" fill="#f8fafc"/>
  <rect x="14" y="14" width="4" height="4" fill="#0284c7"/>
  <!-- North Blue Circle -->
  <rect x="13" y="3" width="6" height="5" fill="#f8fafc"/>
  <rect x="14" y="4" width="4" height="3" fill="#0284c7"/>
  <!-- South Blue Circle -->
  <rect x="13" y="24" width="6" height="5" fill="#f8fafc"/>
  <rect x="14" y="25" width="4" height="3" fill="#0284c7"/>
  <!-- West Blue Circle -->
  <rect x="3" y="13" width="5" height="6" fill="#f8fafc"/>
  <rect x="4" y="14" width="3" height="4" fill="#0284c7"/>
  <!-- East Blue Circle -->
  <rect x="24" y="13" width="5" height="6" fill="#f8fafc"/>
  <rect x="25" y="14" width="3" height="4" fill="#0284c7"/>
</svg>`,

  'faction-gods-knights.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#3b0764"/>
  <!-- Crossed Holy Rapiers -->
  <rect x="4" y="4" width="2" height="2" fill="#f8fafc"/>
  <rect x="6" y="6" width="2" height="2" fill="#f8fafc"/>
  <rect x="8" y="8" width="2" height="2" fill="#f8fafc"/>
  <rect x="10" y="10" width="2" height="2" fill="#f8fafc"/>
  <rect x="12" y="12" width="8" height="8" fill="#fbbf24"/>
  <rect x="20" y="20" width="2" height="2" fill="#f8fafc"/>
  <rect x="22" y="22" width="2" height="2" fill="#f8fafc"/>
  <rect x="24" y="24" width="2" height="2" fill="#f8fafc"/>
  <rect x="26" y="26" width="2" height="2" fill="#fbbf24"/>
  <!-- Opposite Diagonal Blade -->
  <rect x="26" y="4" width="2" height="2" fill="#f8fafc"/>
  <rect x="24" y="6" width="2" height="2" fill="#f8fafc"/>
  <rect x="22" y="8" width="2" height="2" fill="#f8fafc"/>
  <rect x="20" y="10" width="2" height="2" fill="#f8fafc"/>
  <rect x="10" y="20" width="2" height="2" fill="#f8fafc"/>
  <rect x="8" y="22" width="2" height="2" fill="#f8fafc"/>
  <rect x="6" y="24" width="2" height="2" fill="#f8fafc"/>
  <rect x="4" y="26" width="2" height="2" fill="#fbbf24"/>
  <!-- Central Celestial Cross/Crown -->
  <rect x="14" y="10" width="4" height="12" fill="#f59e0b"/>
  <rect x="10" y="14" width="12" height="4" fill="#f59e0b"/>
  <rect x="15" y="15" width="2" height="2" fill="#fef08a"/>
</svg>`,

  'faction-baroque-works.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#14532d"/>
  <!-- Golden Hook & BW Initial -->
  <rect x="10" y="6" width="12" height="4" fill="#fbbf24"/>
  <rect x="8" y="10" width="4" height="10" fill="#fbbf24"/>
  <rect x="10" y="18" width="12" height="4" fill="#fbbf24"/>
  <rect x="18" y="12" width="4" height="8" fill="#fbbf24"/>
  <!-- Crocodile Cigar Silhouette -->
  <rect x="7" y="25" width="14" height="3" fill="#78350f"/>
  <rect x="21" y="25" width="2" height="3" fill="#f97316"/>
  <rect x="23" y="24" width="3" height="1" fill="#e2e8f0"/>
</svg>`,

  'faction-impel-down.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#450a0a"/>
  <!-- Iron Prison Bars -->
  <rect x="6" y="4" width="2" height="24" fill="#94a3b8"/>
  <rect x="11" y="4" width="2" height="24" fill="#94a3b8"/>
  <rect x="16" y="4" width="2" height="24" fill="#94a3b8"/>
  <rect x="21" y="4" width="2" height="24" fill="#94a3b8"/>
  <rect x="26" y="4" width="2" height="24" fill="#94a3b8"/>
  <!-- Horizontal Prison Crossbars -->
  <rect x="4" y="8" width="24" height="2" fill="#64748b"/>
  <rect x="4" y="22" width="24" height="2" fill="#64748b"/>
  <!-- Magellan Poison Demon Eye in Center -->
  <rect x="12" y="12" width="8" height="8" fill="#581c87"/>
  <rect x="14" y="14" width="4" height="4" fill="#f43f5e"/>
</svg>`,

  'faction-kozuki-clan.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#7f1d1d"/>
  <!-- Kozuki Crane Crest / Golden Sun -->
  <rect x="13" y="13" width="6" height="6" fill="#fbbf24"/>
  <!-- Crane Wings -->
  <rect x="7" y="10" width="6" height="4" fill="#fbbf24"/>
  <rect x="19" y="10" width="6" height="4" fill="#fbbf24"/>
  <rect x="4" y="8" width="4" height="4" fill="#fbbf24"/>
  <rect x="24" y="8" width="4" height="4" fill="#fbbf24"/>
  <!-- Crane Head & Tail -->
  <rect x="15" y="6" width="2" height="6" fill="#fbbf24"/>
  <rect x="14" y="20" width="4" height="6" fill="#fbbf24"/>
</svg>`,

  'faction-arlong-pirates.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#0e7490"/>
  <!-- Sun Pirates / Arlong Sawshark Jolly Roger in Crimson -->
  <rect x="12" y="8" width="8" height="8" fill="#dc2626"/>
  <rect x="10" y="16" width="12" height="6" fill="#dc2626"/>
  <!-- Sawtooth Snout -->
  <rect x="7" y="11" width="4" height="2" fill="#f8fafc"/>
  <rect x="5" y="13" width="3" height="2" fill="#f8fafc"/>
  <rect x="7" y="15" width="4" height="2" fill="#f8fafc"/>
  <!-- Shark Fin -->
  <rect x="14" y="3" width="4" height="5" fill="#dc2626"/>
</svg>`,

  'faction-egghead-science.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#0f172a"/>
  <!-- Dr. Vegapunk Apple Antenna / Lightbulb -->
  <rect x="11" y="10" width="10" height="12" fill="#f8fafc"/>
  <rect x="13" y="22" width="6" height="4" fill="#94a3b8"/>
  <!-- Green Stem & Apple Slice -->
  <rect x="15" y="4" width="2" height="6" fill="#22c55e"/>
  <rect x="17" y="5" width="4" height="2" fill="#22c55e"/>
  <!-- Atomic Orbit Ring -->
  <rect x="5" y="15" width="22" height="2" fill="#06b6d4"/>
  <rect x="6" y="11" width="2" height="10" fill="#06b6d4"/>
  <rect x="24" y="11" width="2" height="10" fill="#06b6d4"/>
  <!-- Core Glow -->
  <rect x="14" y="13" width="4" height="4" fill="#f97316"/>
</svg>`,

  'faction-black-cat-pirates.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#18181b"/>
  <!-- Cat Skull -->
  <rect x="10" y="10" width="12" height="10" fill="#f8fafc"/>
  <!-- Cat Ears -->
  <rect x="9" y="6" width="4" height="4" fill="#f8fafc"/>
  <rect x="19" y="6" width="4" height="4" fill="#f8fafc"/>
  <!-- Eye sockets & Green Slit Pupils -->
  <rect x="12" y="13" width="2" height="3" fill="#22c55e"/>
  <rect x="18" y="13" width="2" height="3" fill="#22c55e"/>
  <!-- Whiskers & Crossbones -->
  <rect x="5" y="14" width="4" height="1" fill="#f8fafc"/>
  <rect x="23" y="14" width="4" height="1" fill="#f8fafc"/>
</svg>`,

  'faction-krieg-armada.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#422006"/>
  <!-- Golden Armor & Hourglass Emblem -->
  <rect x="8" y="6" width="16" height="4" fill="#fbbf24"/>
  <rect x="11" y="10" width="10" height="4" fill="#fbbf24"/>
  <rect x="13" y="14" width="6" height="4" fill="#f59e0b"/>
  <rect x="11" y="18" width="10" height="4" fill="#fbbf24"/>
  <rect x="8" y="22" width="16" height="4" fill="#fbbf24"/>
  <!-- Purple MH5 Poison Gas Haze -->
  <rect x="3" y="4" width="3" height="3" fill="#a855f7" opacity="0.6"/>
  <rect x="26" y="4" width="3" height="3" fill="#a855f7" opacity="0.6"/>
</svg>`,

  'faction-bonney-pirates.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#831843"/>
  <!-- Hot Pink Jolly Roger with Kiss/Heart & Pizza -->
  <rect x="11" y="8" width="10" height="10" fill="#f43f5e"/>
  <rect x="9" y="6" width="5" height="4" fill="#f43f5e"/>
  <rect x="18" y="6" width="5" height="4" fill="#f43f5e"/>
  <!-- Green Piercing / Lipstick Mark -->
  <rect x="14" y="15" width="4" height="2" fill="#f472b6"/>
  <rect x="12" y="17" width="2" height="2" fill="#22c55e"/>
  <!-- Slice of Golden Pizza -->
  <rect x="22" y="18" width="6" height="6" fill="#fbbf24"/>
  <rect x="23" y="19" width="2" height="2" fill="#dc2626"/>
</svg>`,
};

// 3. Item Thumbnails
const items: Record<string, string> = {
  'item-pluton.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#0f172a"/>
  <!-- Underwater Wano Depths -->
  <rect x="0" y="16" width="32" height="16" fill="#0369a1"/>
  <rect x="0" y="24" width="32" height="8" fill="#1e293b"/>
  <!-- Colossal Battleship Pluton Hull -->
  <rect x="4" y="14" width="24" height="8" fill="#334155"/>
  <rect x="2" y="16" width="28" height="5" fill="#475569"/>
  <!-- Armored Bow & Prow Ram -->
  <rect x="1" y="17" width="4" height="2" fill="#fbbf24"/>
  <!-- Main Turret Cannons -->
  <rect x="8" y="10" width="8" height="4" fill="#1e293b"/>
  <rect x="5" y="11" width="6" height="2" fill="#64748b"/>
  <rect x="18" y="11" width="8" height="3" fill="#1e293b"/>
  <rect x="22" y="10" width="7" height="2" fill="#64748b"/>
  <!-- Ancient Inscriptions / Glowing Gold Trim -->
  <rect x="6" y="19" width="20" height="1" fill="#fbbf24"/>
</svg>`,

  'item-uranus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#020617"/>
  <!-- Cloud Layer -->
  <rect x="0" y="12" width="32" height="4" fill="#334155" opacity="0.8"/>
  <!-- Floating Ancient Sky Fortress / Mother Flame Disc -->
  <rect x="8" y="5" width="16" height="6" fill="#1e293b"/>
  <rect x="10" y="3" width="12" height="3" fill="#f8fafc"/>
  <rect x="12" y="2" width="8" height="2" fill="#38bdf8"/>
  <!-- Mother Flame Core Combustion -->
  <rect x="14" y="7" width="4" height="3" fill="#f97316"/>
  <rect x="15" y="8" width="2" height="2" fill="#fef08a"/>
  <!-- 16 Vertical Beams of Descending Light (Lulusia Obliteration) -->
  <rect x="4" y="16" width="1" height="16" fill="#38bdf8"/>
  <rect x="6" y="16" width="1" height="16" fill="#f8fafc"/>
  <rect x="8" y="16" width="1" height="16" fill="#38bdf8"/>
  <rect x="10" y="16" width="1" height="16" fill="#f8fafc"/>
  <rect x="12" y="16" width="1" height="16" fill="#38bdf8"/>
  <rect x="14" y="16" width="1" height="16" fill="#f8fafc"/>
  <rect x="15" y="16" width="2" height="16" fill="#fef08a"/>
  <rect x="17" y="16" width="1" height="16" fill="#f8fafc"/>
  <rect x="19" y="16" width="1" height="16" fill="#38bdf8"/>
  <rect x="21" y="16" width="1" height="16" fill="#f8fafc"/>
  <rect x="23" y="16" width="1" height="16" fill="#38bdf8"/>
  <rect x="25" y="16" width="1" height="16" fill="#f8fafc"/>
  <rect x="27" y="16" width="1" height="16" fill="#38bdf8"/>
</svg>`,
};

// Write Avatars
for (const [filename, content] of Object.entries(avatars)) {
  const filePath = path.join(baseDir, 'avatars', filename);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  console.log('Created avatar:', filePath);
}

// Write Factions
for (const [filename, content] of Object.entries(factions)) {
  const filePath = path.join(baseDir, 'factions', filename);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  console.log('Created faction emblem:', filePath);
}

// Write Items
for (const [filename, content] of Object.entries(items)) {
  const filePath = path.join(baseDir, 'items', filename);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  console.log('Created item thumbnail:', filePath);
}

console.log('All One Piece pixel assets successfully generated!');
