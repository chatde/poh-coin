// ── Golden Record Achievements ───────────────────────────────────────
// Named after contents of the Voyager Golden Record.
// Each grants +5 reputation bonus.

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "golden_record" | "distance_milestone" | "mission_date" | "streak" | "general";
  condition: string; // Human-readable unlock condition
  reputationBonus: number;
}

// ── Golden Record Achievements (named after Golden Record contents) ───
export const GOLDEN_RECORD_ACHIEVEMENTS: Achievement[] = [
  {
    id: "golden_record_bach",
    name: "Brandenburg Concerto",
    description: "Bach's Brandenburg Concerto No. 2 was on the Golden Record.",
    category: "golden_record",
    condition: "Complete your first compute task",
    reputationBonus: 5,
  },
  {
    id: "golden_record_beethoven",
    name: "Fifth Symphony",
    description: "Beethoven's Symphony No. 5 travels the cosmos on Voyager.",
    category: "golden_record",
    condition: "Complete 100 compute tasks",
    reputationBonus: 5,
  },
  {
    id: "golden_record_chuck_berry",
    name: "Johnny B. Goode",
    description: "Chuck Berry's rock 'n' roll greeting to the universe.",
    category: "golden_record",
    condition: "Maintain a 7-day mining streak",
    reputationBonus: 5,
  },
  {
    id: "golden_record_stravinsky",
    name: "Rite of Spring",
    description: "Stravinsky's revolutionary work, now in interstellar space.",
    category: "golden_record",
    condition: "Complete 1,000 compute tasks",
    reputationBonus: 5,
  },
  {
    id: "golden_record_mozart",
    name: "Magic Flute",
    description: "Mozart's Queen of the Night aria rides with Voyager.",
    category: "golden_record",
    condition: "Maintain a 30-day mining streak",
    reputationBonus: 5,
  },
  {
    id: "golden_record_blind_willie",
    name: "Dark Was the Night",
    description: "Blind Willie Johnson's slide guitar, chosen by Carl Sagan.",
    category: "golden_record",
    condition: "Mine during night hours (10pm-6am) for 7 consecutive days",
    reputationBonus: 5,
  },
  {
    id: "golden_record_navajo",
    name: "Night Chant",
    description: "Navajo Night Chant, representing Indigenous voices to the stars.",
    category: "golden_record",
    condition: "Reach reputation score of 50",
    reputationBonus: 5,
  },
  {
    id: "golden_record_louis_armstrong",
    name: "Melancholy Blues",
    description: "Louis Armstrong's jazz greeting to extraterrestrial life.",
    category: "golden_record",
    condition: "Complete 10,000 compute tasks",
    reputationBonus: 5,
  },
  {
    id: "golden_record_earth_sounds",
    name: "Sounds of Earth",
    description: "The Golden Record carries the sounds of wind, rain, and surf.",
    category: "golden_record",
    condition: "Mine from 5 different H3 regions",
    reputationBonus: 5,
  },
  {
    id: "golden_record_greetings",
    name: "Hello in 55 Languages",
    description: "Greetings in 55 languages ride aboard Voyager.",
    category: "golden_record",
    condition: "Refer 5 new miners",
    reputationBonus: 5,
  },
];

// ── Distance Milestones ──────────────────────────────────────────────
// Network compute milestones mapped to space distances
export const DISTANCE_MILESTONES: Achievement[] = [
  {
    id: "milestone_moon",
    name: "Lunar Orbit",
    description: "The network has reached the Moon! (384,400 km equivalent compute)",
    category: "distance_milestone",
    condition: "Network completes 1,000 verified tasks",
    reputationBonus: 5,
  },
  {
    id: "milestone_mars",
    name: "Mars Transfer",
    description: "The network reaches Mars! (225 million km equivalent)",
    category: "distance_milestone",
    condition: "Network completes 10,000 verified tasks",
    reputationBonus: 5,
  },
  {
    id: "milestone_jupiter",
    name: "Jupiter Flyby",
    description: "Like Voyager 1, the network passes Jupiter.",
    category: "distance_milestone",
    condition: "Network completes 100,000 verified tasks",
    reputationBonus: 5,
  },
  {
    id: "milestone_saturn",
    name: "Saturn Encounter",
    description: "Voyager 1's last planetary visit before heading to the stars.",
    category: "distance_milestone",
    condition: "Network completes 500,000 verified tasks",
    reputationBonus: 5,
  },
  {
    id: "milestone_heliosphere",
    name: "Heliosphere Boundary",
    description: "The network reaches where the solar wind meets interstellar space.",
    category: "distance_milestone",
    condition: "Network completes 1,000,000 verified tasks",
    reputationBonus: 5,
  },
  {
    id: "milestone_interstellar",
    name: "Interstellar Space",
    description: "Like Voyager 1 in 2012, the network enters interstellar space.",
    category: "distance_milestone",
    condition: "Network completes 10,000,000 verified tasks",
    reputationBonus: 5,
  },
];

// ── Mission Date Bonuses ─────────────────────────────────────────────
// Special bonus events on Voyager anniversary dates
export const MISSION_DATES = [
  {
    month: 9,
    day: 5,
    name: "Voyager 1 Launch Day",
    description: "September 5, 1977 — Voyager 1 launched from Cape Canaveral.",
    bonusMultiplier: 2.0, // Double points
  },
  {
    month: 8,
    day: 20,
    name: "Voyager 2 Launch Day",
    description: "August 20, 1977 — Voyager 2 launched 16 days before its twin.",
    bonusMultiplier: 2.0,
  },
  {
    month: 8,
    day: 25,
    name: "Interstellar Crossing",
    description: "August 25, 2012 — Voyager 1 crossed into interstellar space.",
    bonusMultiplier: 1.5,
  },
  {
    month: 2,
    day: 14,
    name: "Pale Blue Dot Day",
    description: "February 14, 1990 — Voyager 1 took the Pale Blue Dot photo.",
    bonusMultiplier: 1.5,
  },
];

// ── Streak Achievements ──────────────────────────────────────────────
export const STREAK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "streak_7",
    name: "First Week",
    description: "Your first week of continuous mining.",
    category: "streak",
    condition: "7-day mining streak",
    reputationBonus: 5,
  },
  {
    id: "streak_30",
    name: "Mission Month",
    description: "A full month of dedicated compute.",
    category: "streak",
    condition: "30-day mining streak",
    reputationBonus: 5,
  },
  {
    id: "streak_100",
    name: "Century Run",
    description: "100 consecutive days. Voyager would be proud.",
    category: "streak",
    condition: "100-day mining streak",
    reputationBonus: 5,
  },
  {
    id: "streak_365",
    name: "Full Orbit",
    description: "One complete orbit around the Sun while mining.",
    category: "streak",
    condition: "365-day mining streak",
    reputationBonus: 5,
  },
];

// Combined list for lookups
export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...GOLDEN_RECORD_ACHIEVEMENTS,
  ...DISTANCE_MILESTONES,
  ...STREAK_ACHIEVEMENTS,
];

/**
 * Check if today is a Voyager mission bonus date.
 * Returns the bonus multiplier (1.0 = normal, 2.0 = double, etc.)
 */
export function getMissionDateBonus(date: Date = new Date()): {
  active: boolean;
  multiplier: number;
  name: string;
  description: string;
} {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const md of MISSION_DATES) {
    if (md.month === month && md.day === day) {
      return {
        active: true,
        multiplier: md.bonusMultiplier,
        name: md.name,
        description: md.description,
      };
    }
  }

  return { active: false, multiplier: 1.0, name: "", description: "" };
}
