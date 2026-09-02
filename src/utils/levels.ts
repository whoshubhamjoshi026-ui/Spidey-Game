import { LevelConfig, CityTheme, VillainType } from '../types';

export const CHAPTERS = [
  {
    id: 1,
    name: 'Chapter 1: Queens Rooftops & Alleys',
    subtitle: 'Rookie Patrol & Oscorp Recon (Gentle Intro)',
    theme: 'sunset_rooftop' as CityTheme,
    levelsCount: 20,
    bossName: 'Green Goblin (MK-I)',
  },
  {
    id: 2,
    name: 'Chapter 2: Midtown Oscorp Infiltration',
    subtitle: 'Heavy Drones & Rooftop Snipers',
    theme: 'neon_night' as CityTheme,
    levelsCount: 20,
    bossName: 'Rhino Heavy Armor',
  },
  {
    id: 3,
    name: 'Chapter 3: Financial District Doc Ock Siege',
    subtitle: 'Titanium Tentacles & Urban Havoc',
    theme: 'golden_hour' as CityTheme,
    levelsCount: 20,
    bossName: 'Doctor Octopus',
  },
  {
    id: 4,
    name: 'Chapter 4: Times Square Electro Overdrive',
    subtitle: 'High-Voltage Plasma Storms',
    theme: 'thunder_storm' as CityTheme,
    levelsCount: 20,
    bossName: 'Electro Supercharged',
  },
  {
    id: 5,
    name: 'Chapter 5: Symbiote Cataclysm (Venom 2099)',
    subtitle: 'Bio-Hazard Apocalypse & Hive Queen',
    theme: 'crimson_dawn' as CityTheme,
    levelsCount: 20,
    bossName: 'Venom Supreme 2099',
  },
];

// Generate 100+ balanced & handcrafted progressive levels
export function getLevelConfig(levelNumber: number): LevelConfig {
  const clampedLevel = Math.max(1, Math.min(100, levelNumber));
  const chapterIdx = Math.floor((clampedLevel - 1) / 20);
  const chapter = CHAPTERS[Math.min(chapterIdx, CHAPTERS.length - 1)];
  const levelInChapter = ((clampedLevel - 1) % 20) + 1;

  // Dynamic Theme Variation
  let theme: CityTheme = chapter.theme;
  if (clampedLevel === 1 || clampedLevel === 2) {
    theme = 'sunset_rooftop'; // Gentle warm welcome
  } else if (levelInChapter === 19 || levelInChapter === 20) {
    theme = chapterIdx === 4 ? 'crimson_dawn' : 'thunder_storm'; // Climactic boss atmosphere
  } else if (levelInChapter % 5 === 0) {
    theme = 'neon_night';
  } else if (levelInChapter % 3 === 0) {
    theme = 'golden_hour';
  }

  // --- BALANCED PROGRESSION & GENTLE LEVEL 1 CURVE ---
  // Level 1 starts very slow (3.4 km/h) so new players can easily master controls and feel heroic.
  // Scales smoothly up to ~9.5 km/h at Level 100.
  const speed = clampedLevel === 1 ? 3.4 : 3.4 + (clampedLevel - 1) * 0.065;
  
  // Distance to complete level (Level 1 is 220m, giving a fun intro patrol)
  const targetDistance = clampedLevel === 1 ? 220 : 200 + clampedLevel * 32;
  
  // Obstacle spawn interval: tight, active cadence so villains appear consistently in every level!
  // Level 1 spawns every 75m (approx 3 drones), scaling down to ~65m for higher intensity sectors.
  const obstacleSpawnInterval = clampedLevel === 1 ? 75 : Math.max(60, 110 - clampedLevel * 0.6);

  const rewardCoins = 50 + clampedLevel * 10;

  // Villains pool based on progression (Level 1-3 only has gentle single drones/barriers)
  let villains: VillainType[] = ['oscorp_drone'];
  if (clampedLevel >= 3) {
    villains.push('pumpkin_bomb');
  }
  if (clampedLevel >= 8) {
    villains.push('rooftop_barrier');
  }
  if (chapterIdx >= 1) {
    villains.push('rhino');
  }
  if (chapterIdx >= 2) {
    villains.push('doc_ock');
  }
  if (chapterIdx >= 3) {
    villains.push('electro');
  }
  if (chapterIdx >= 4) {
    villains.push('venom');
  }

  // Boss encounters every 5 levels (Level 5 mini-boss, Level 10 lieutenant, Level 20 Grand Boss, etc.)
  let boss: LevelConfig['boss'] = undefined;
  if (clampedLevel % 5 === 0) {
    if (clampedLevel % 20 === 0) {
      // Grand Chapter Boss
      if (chapterIdx === 0) {
        boss = { type: 'green_goblin', name: 'Green Goblin Apex', hp: 260, title: 'Oscorp Glider CEO' };
      } else if (chapterIdx === 1) {
        boss = { type: 'rhino', name: 'Rhino Juggernaut', hp: 420, title: 'Titanium Armor Beast' };
      } else if (chapterIdx === 2) {
        boss = { type: 'doc_ock', name: 'Doctor Octopus', hp: 600, title: 'Master of 4 Tentacles' };
      } else if (chapterIdx === 3) {
        boss = { type: 'electro', name: 'Electro Supercharged', hp: 800, title: 'Pure Plasma Storm' };
      } else {
        boss = { type: 'venom', name: 'Venom Supreme 2099', hp: 1100, title: 'Symbiote Devourer' };
      }
    } else if (clampedLevel % 10 === 0) {
      // Mid-Chapter Lieutenant
      if (chapterIdx <= 1) {
        boss = { type: 'green_goblin', name: 'Hobgoblin Shadow', hp: 190, title: 'Glider Assassin' };
      } else if (chapterIdx === 2) {
        boss = { type: 'rhino', name: 'Reinforced Rhino', hp: 320, title: 'Rampaging Heavy' };
      } else if (chapterIdx === 3) {
        boss = { type: 'electro', name: 'Plasma Drone Matrix', hp: 450, title: 'High Voltage Array' };
      } else {
        boss = { type: 'venom', name: 'Symbiote Berserker', hp: 650, title: 'Apex Hunter' };
      }
    } else {
      // Level 5, 15, 25, etc. Mini-bosses with accessible HP
      boss = {
        type: villains[villains.length - 1] || 'oscorp_drone',
        name: `Sector Sentinel Lv.${clampedLevel}`,
        hp: 120 + clampedLevel * 5,
        title: 'Oscorp Patrol Commander',
      };
    }
  }

  const levelTitles = [
    'Rooftop Training & First Web-Swing',
    'Queens Neighborhood Patrol',
    'Oscorp Recon Scout',
    'Low-Altitude Glide Test',
    'Glider Ambush (Mini-Boss)',
    'Sunset Skyline Sprint',
    'Alleyway Web Slingshot',
    'High Altitude Leap',
    'Oscorp Drone Escort Intercept',
    'Midtown Glider Lieutenant',
    'Midtown Skyline Infiltration',
    'Drone Formation Break',
    'Industrial Rooftop Run',
    'Neon Billboard Gauntlet',
    'Rhino Armor Vanguard',
    'Financial District Perimeter',
    'Steel Beam Navigation',
    'Skyscraper Summit Dash',
    'Oscorp Apex Glider Assault',
    'Grand Chapter Climax Showdown',
  ];

  const title = `Sector ${clampedLevel}: ${levelTitles[(levelInChapter - 1) % levelTitles.length]}`;

  return {
    id: clampedLevel,
    chapter: chapter.id,
    chapterName: chapter.name,
    name: title,
    theme,
    targetDistance,
    speed,
    obstacleSpawnInterval,
    villains,
    boss,
    rewardCoins,
    description: `Deploy to ${title}. Navigate skyscrapers, foil villains, and liberate Sector ${clampedLevel}.`,
  };
}
