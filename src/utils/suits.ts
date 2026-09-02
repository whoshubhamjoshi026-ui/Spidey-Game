import { Suit } from '../types';

export const SPIDER_SUITS: Suit[] = [
  {
    id: 'classic',
    name: 'Classic Spidey',
    title: 'Neighborhood Hero',
    primaryColor: '#dc2626', // Red
    secondaryColor: '#1d4ed8', // Vibrant Blue
    eyeColor: '#ffffff',
    trailColor: 'rgba(220, 38, 38, 0.45)',
    glowColor: '#ef4444',
    unlocked: true,
    unlockedAtScore: 0,
    description: 'The legendary red and blue suit with web-line detailing and balanced stats.',
    specialAbility: 'Balanced Web Slinging & Steady Double Jump',
    stats: {
      speed: 85,
      jump: 88,
      power: 80,
    }
  },
  {
    id: 'symbiote',
    name: 'Symbiote Alien Suit',
    title: 'Dark Entity',
    primaryColor: '#090d16', // Midnight Black
    secondaryColor: '#1e293b', // Deep Slate
    eyeColor: '#ffffff',
    trailColor: 'rgba(168, 85, 247, 0.55)',
    glowColor: '#a855f7',
    unlocked: false,
    unlockedAtScore: 100,
    description: 'Bonded with the alien symbiote for aggressive air dash momentum and shadowy tendrils.',
    specialAbility: 'Shadow Surge: +20% Web Blast Speed',
    stats: {
      speed: 95,
      jump: 84,
      power: 96,
    }
  },
  {
    id: 'iron_spider',
    name: 'Iron Spider Nano-Tech',
    title: 'Stark Industries Prototype',
    primaryColor: '#b91c1c', // Crimson Metallic
    secondaryColor: '#eab308', // Gold Titanium
    eyeColor: '#38bdf8', // Arc Reactor Blue
    trailColor: 'rgba(234, 179, 8, 0.6)',
    glowColor: '#38bdf8',
    unlocked: false,
    unlockedAtScore: 250,
    description: 'Forged from nanotechnology with glowing arc-reactor mask lenses and golden waldoes.',
    specialAbility: 'Stark Shield: Generates kinetic forcefields',
    stats: {
      speed: 90,
      jump: 92,
      power: 98,
    }
  },
  {
    id: 'miles',
    name: 'Miles Morales (Venom)',
    title: 'Brooklyn Spider',
    primaryColor: '#18181b', // Matte Carbon
    secondaryColor: '#ef4444', // Crimson Graffiti
    eyeColor: '#ffffff',
    trailColor: 'rgba(239, 68, 68, 0.65)',
    glowColor: '#f59e0b',
    unlocked: false,
    unlockedAtScore: 500,
    description: 'Signature Brooklyn hoodie silhouette with electric bio-venom spark strikes.',
    specialAbility: 'Bio-Electric Shockwave on Web Impact',
    stats: {
      speed: 94,
      jump: 96,
      power: 92,
    }
  },
  {
    id: 'spider_punk',
    name: 'Spider-Punk (Hobie)',
    title: 'Anarchy in Queens',
    primaryColor: '#e11d48', // Punk Rose
    secondaryColor: '#0284c7', // Denim Blue
    eyeColor: '#facc15', // Acid Yellow
    trailColor: 'rgba(236, 72, 153, 0.65)',
    glowColor: '#f43f5e',
    unlocked: false,
    unlockedAtScore: 800,
    description: 'Mohawk spikes, studded denim vest, and loud electric-guitar chord sonic explosions.',
    specialAbility: 'Sonic Distortion: Destroy incoming pumpkin bombs',
    stats: {
      speed: 92,
      jump: 95,
      power: 99,
    }
  },
  {
    id: 'future_foundation',
    name: 'Future Foundation',
    title: 'Quantum Web-Weaver',
    primaryColor: '#f8fafc', // Pearlescent White
    secondaryColor: '#020617', // Obsidian Black
    eyeColor: '#0f172a',
    trailColor: 'rgba(248, 250, 252, 0.7)',
    glowColor: '#38bdf8',
    unlocked: false,
    unlockedAtScore: 1200,
    description: 'Unstable molecules suit designed by Reed Richards with zero air friction.',
    specialAbility: 'Quantum Glide: Floats longer during jump',
    stats: {
      speed: 99,
      jump: 98,
      power: 90,
    }
  }
];

