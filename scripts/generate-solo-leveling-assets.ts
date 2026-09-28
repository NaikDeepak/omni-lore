import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.resolve(process.cwd(), 'public/assets/pixels/solo-leveling');

// 1. Locations
const locations: Record<string, string> = {
  'loc-dimensional-rift.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#030712"/>
  <!-- Distant Cosmic Stars & Purple Haze -->
  <rect x="3" y="4" width="1" height="1" fill="#c084fc"/>
  <rect x="28" y="6" width="1" height="1" fill="#c084fc"/>
  <rect x="7" y="27" width="1" height="1" fill="#e9d5ff"/>
  <rect x="25" y="25" width="1" height="1" fill="#e9d5ff"/>
  <rect x="15" y="2" width="2" height="2" fill="#581c87" opacity="0.6"/>
  <!-- Colossal Jagged Spatial Rift -->
  <rect x="15" y="2" width="2" height="6" fill="#a855f7"/>
  <rect x="13" y="6" width="6" height="5" fill="#a855f7"/>
  <rect x="10" y="9" width="12" height="6" fill="#c084fc"/>
  <rect x="8" y="13" width="16" height="6" fill="#e9d5ff"/>
  <rect x="11" y="17" width="10" height="7" fill="#a855f7"/>
  <rect x="14" y="22" width="4" height="8" fill="#7e22ce"/>
  <!-- Black Void Core of the Tear -->
  <rect x="13" y="11" width="6" height="8" fill="#020617"/>
  <rect x="14" y="12" width="4" height="6" fill="#3b0764"/>
  <!-- Crimson Dragon Silhouette Emerging from the Abyss -->
  <rect x="15" y="13" width="2" height="1" fill="#dc2626"/>
  <rect x="14" y="14" width="4" height="2" fill="#ef4444"/>
  <rect x="12" y="15" width="2" height="1" fill="#b91c1c"/>
  <rect x="18" y="15" width="2" height="1" fill="#b91c1c"/>
</svg>`,

  'loc-land-of-eternal-rest.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#09090b"/>
  <!-- Eclipsed Black Sun of the Shadow Monarch -->
  <rect x="13" y="3" width="6" height="6" fill="#3b0764"/>
  <rect x="14" y="4" width="4" height="4" fill="#09090b"/>
  <rect x="12" y="5" width="8" height="2" fill="#a855f7" opacity="0.6"/>
  <!-- Boundless Spectral Fog / Ground -->
  <rect x="0" y="18" width="32" height="14" fill="#18181b"/>
  <rect x="0" y="24" width="32" height="8" fill="#0f172a"/>
  <!-- Azure & Purple Mist Ribbons -->
  <rect x="2" y="20" width="28" height="1" fill="#38bdf8" opacity="0.5"/>
  <rect x="5" y="23" width="22" height="1" fill="#818cf8" opacity="0.6"/>
  <rect x="1" y="27" width="30" height="1" fill="#a855f7" opacity="0.4"/>
  <!-- Dormant Shadow Helmets & Battle Standards -->
  <rect x="6" y="15" width="2" height="6" fill="#475569"/>
  <rect x="5" y="15" width="4" height="2" fill="#38bdf8"/>
  <rect x="15" y="13" width="2" height="8" fill="#64748b"/>
  <rect x="14" y="13" width="4" height="2" fill="#a855f7"/>
  <rect x="24" y="16" width="2" height="5" fill="#475569"/>
  <rect x="23" y="16" width="4" height="2" fill="#38bdf8"/>
  <!-- Bellion Grand Throne Silhouette in Background -->
  <rect x="12" y="17" width="8" height="4" fill="#312e81"/>
</svg>`,
};

// 2. Factions
const factions: Record<string, string> = {
  'faction-shadow-army.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#030712"/>
  <!-- Spectral Shadow Flame Aura -->
  <rect x="9" y="4" width="14" height="16" fill="#3b0764"/>
  <rect x="7" y="8" width="18" height="12" fill="#581c87"/>
  <!-- Shadow Crown Spires -->
  <rect x="11" y="2" width="2" height="4" fill="#c084fc"/>
  <rect x="15" y="1" width="2" height="5" fill="#e9d5ff"/>
  <rect x="19" y="2" width="2" height="4" fill="#c084fc"/>
  <!-- Monarch Skull/Visor Mask -->
  <rect x="10" y="8" width="12" height="10" fill="#09090b"/>
  <!-- Piercing Cyan Monarch Eyes -->
  <rect x="11" y="11" width="3" height="2" fill="#38bdf8"/>
  <rect x="18" y="11" width="3" height="2" fill="#38bdf8"/>
  <rect x="12" y="11" width="1" height="1" fill="#f8fafc"/>
  <rect x="19" y="11" width="1" height="1" fill="#f8fafc"/>
  <!-- Glowing Eye Trail Flaring Outward -->
  <rect x="8" y="10" width="3" height="1" fill="#06b6d4" opacity="0.8"/>
  <rect x="21" y="10" width="3" height="1" fill="#06b6d4" opacity="0.8"/>
  <!-- Armored Pauldrons & Shadow Mist Base -->
  <rect x="6" y="20" width="20" height="6" fill="#18181b"/>
  <rect x="4" y="24" width="24" height="8" fill="#0f172a"/>
  <rect x="10" y="24" width="12" height="2" fill="#a855f7"/>
</svg>`,
};

// 3. Items
const items: Record<string, string> = {
  'item-kamish-wrath.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#020617"/>
  <!-- Left Dragon Fang Shortsword -->
  <rect x="8" y="4" width="2" height="4" fill="#ef4444"/>
  <rect x="9" y="8" width="2" height="4" fill="#f97316"/>
  <rect x="10" y="12" width="2" height="4" fill="#facc15"/>
  <rect x="11" y="16" width="3" height="4" fill="#f8fafc"/>
  <!-- Guard & Hilt -->
  <rect x="9" y="20" width="7" height="2" fill="#7f1d1d"/>
  <rect x="12" y="22" width="2" height="5" fill="#18181b"/>
  <rect x="11" y="27" width="4" height="2" fill="#ef4444"/>
  <!-- Right Dragon Fang Shortsword (Crossed) -->
  <rect x="22" y="4" width="2" height="4" fill="#ef4444"/>
  <rect x="21" y="8" width="2" height="4" fill="#f97316"/>
  <rect x="20" y="12" width="2" height="4" fill="#facc15"/>
  <rect x="18" y="16" width="3" height="4" fill="#f8fafc"/>
  <!-- Guard & Hilt -->
  <rect x="16" y="20" width="7" height="2" fill="#7f1d1d"/>
  <rect x="18" y="22" width="2" height="5" fill="#18181b"/>
  <rect x="17" y="27" width="4" height="2" fill="#ef4444"/>
  <!-- Fiery Dragon Breath Particles -->
  <rect x="6" y="2" width="2" height="2" fill="#f97316" opacity="0.8"/>
  <rect x="24" y="2" width="2" height="2" fill="#f97316" opacity="0.8"/>
</svg>`,

  'item-orb-of-avarice.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#0f172a"/>
  <!-- Blazing Concentric Fire Rings -->
  <rect x="8" y="8" width="16" height="16" fill="#7f1d1d"/>
  <rect x="10" y="6" width="12" height="20" fill="#991b1b"/>
  <rect x="6" y="10" width="20" height="12" fill="#991b1b"/>
  <!-- Core Glowing Red Gem Bead -->
  <rect x="11" y="11" width="10" height="10" fill="#dc2626"/>
  <rect x="13" y="9" width="6" height="14" fill="#ef4444"/>
  <rect x="9" y="13" width="14" height="6" fill="#ef4444"/>
  <!-- Intense Molten Center -->
  <rect x="13" y="13" width="6" height="6" fill="#f97316"/>
  <rect x="14" y="14" width="4" height="4" fill="#fef08a"/>
  <!-- Hellfire Flares -->
  <rect x="15" y="2" width="2" height="4" fill="#ef4444"/>
  <rect x="15" y="26" width="2" height="4" fill="#ef4444"/>
  <rect x="2" y="15" width="4" height="2" fill="#ef4444"/>
  <rect x="26" y="15" width="4" height="2" fill="#ef4444"/>
</svg>`,

  'item-demon-king-daggers.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#020617"/>
  <!-- White Lightning Flame Blades -->
  <rect x="14" y="2" width="4" height="14" fill="#f8fafc"/>
  <rect x="13" y="5" width="6" height="9" fill="#e0f2fe"/>
  <!-- Crackling Lightning Arcs -->
  <rect x="10" y="6" width="2" height="2" fill="#38bdf8"/>
  <rect x="12" y="8" width="2" height="2" fill="#67e8f9"/>
  <rect x="18" y="7" width="2" height="2" fill="#67e8f9"/>
  <rect x="20" y="9" width="2" height="2" fill="#38bdf8"/>
  <!-- Guard & Blue Demon Jewel -->
  <rect x="10" y="16" width="12" height="3" fill="#1e293b"/>
  <rect x="14" y="16" width="4" height="3" fill="#0284c7"/>
  <!-- Dagger Hilt & Lightning Pommel -->
  <rect x="15" y="19" width="2" height="8" fill="#0f172a"/>
  <rect x="14" y="27" width="4" height="2" fill="#38bdf8"/>
</svg>`,

  'item-cup-of-reincarnation.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="32" height="32" fill="#0f172a"/>
  <!-- Divine Seraph Halo Rays -->
  <rect x="15" y="1" width="2" height="3" fill="#fef08a"/>
  <rect x="7" y="5" width="2" height="2" fill="#fef08a"/>
  <rect x="23" y="5" width="2" height="2" fill="#fef08a"/>
  <!-- Golden Chalice Rim & Body -->
  <rect x="8" y="7" width="16" height="4" fill="#f59e0b"/>
  <rect x="9" y="11" width="14" height="5" fill="#fbbf24"/>
  <rect x="11" y="16" width="10" height="4" fill="#f59e0b"/>
  <!-- Chalice Interior Stardust / Time Liquid -->
  <rect x="10" y="8" width="12" height="2" fill="#38bdf8"/>
  <rect x="12" y="10" width="8" height="2" fill="#818cf8"/>
  <!-- Slender Chalice Stem & Royal Base -->
  <rect x="14" y="20" width="4" height="6" fill="#d97706"/>
  <rect x="10" y="26" width="12" height="3" fill="#fbbf24"/>
  <rect x="8" y="28" width="16" height="2" fill="#f59e0b"/>
  <!-- Faint Crack of Time Exhaustion -->
  <rect x="15" y="12" width="1" height="4" fill="#450a0a"/>
</svg>`,
};

// Write Locations
for (const [filename, content] of Object.entries(locations)) {
  const filePath = path.join(baseDir, 'locations', filename);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  console.log('Created location SVG:', filePath);
}

// Write Factions
for (const [filename, content] of Object.entries(factions)) {
  const filePath = path.join(baseDir, 'factions', filename);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  console.log('Created faction SVG:', filePath);
}

// Write Items
for (const [filename, content] of Object.entries(items)) {
  const filePath = path.join(baseDir, 'items', filename);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  console.log('Created item SVG:', filePath);
}

console.log('All Solo Leveling pixel assets successfully generated!');
