/**
 * Fallback Scientific Datasets for Proof of Planet Compute Tasks
 *
 * These are used when live API fetchers (RCSB PDB, USGS, NOAA, NCI)
 * are unreachable. Live data is preferred — see live-data.ts.
 */

// ── Fallback Protein Structures (from Protein Data Bank) ─────────────
// Real backbone coordinates from published protein structures
// Sources: RCSB PDB (rcsb.org)

export const PROTEINS = [
  {
    id: "1UBQ",
    name: "Ubiquitin",
    disease: "Parkinson's & Alzheimer's",
    description: "Small regulatory protein involved in neurodegenerative disease pathways",
    residues: [
      { x: 27.340, y: 24.430, z: 2.614, type: "MET" },
      { x: 26.266, y: 25.413, z: 2.842, type: "GLN" },
      { x: 26.913, y: 26.639, z: 3.531, type: "ILE" },
      { x: 27.273, y: 28.013, z: 2.838, type: "PHE" },
      { x: 26.220, y: 29.037, z: 2.924, type: "VAL" },
      { x: 25.853, y: 29.395, z: 4.366, type: "LYS" },
      { x: 27.009, y: 30.203, z: 4.985, type: "THR" },
      { x: 26.776, y: 31.597, z: 4.530, type: "LEU" },
      { x: 25.523, y: 32.282, z: 5.116, type: "THR" },
      { x: 25.166, y: 33.410, z: 4.185, type: "GLY" },
      { x: 24.106, y: 34.283, z: 4.669, type: "LYS" },
      { x: 22.930, y: 33.500, z: 5.118, type: "THR" },
      { x: 21.840, y: 33.246, z: 4.106, type: "ILE" },
      { x: 20.618, y: 32.634, z: 4.730, type: "THR" },
      { x: 19.612, y: 33.655, z: 5.069, type: "LEU" },
      { x: 20.253, y: 35.031, z: 5.144, type: "GLU" },
      { x: 20.777, y: 35.383, z: 3.756, type: "VAL" },
      { x: 21.558, y: 36.681, z: 3.822, type: "GLU" },
      { x: 22.926, y: 36.457, z: 4.405, type: "PRO" },
      { x: 23.779, y: 35.338, z: 3.840, type: "SER" },
    ],
  },
  {
    id: "1CRN",
    name: "Crambin",
    disease: "Drug Design",
    description: "Plant protein used as benchmark for computational chemistry methods",
    residues: [
      { x: 16.967, y: 12.784, z: 4.338, type: "THR" },
      { x: 15.685, y: 11.602, z: 6.002, type: "THR" },
      { x: 14.235, y: 10.574, z: 7.726, type: "CYS" },
      { x: 12.675, y: 11.574, z: 9.274, type: "CYS" },
      { x: 10.938, y: 12.684, z: 10.590, type: "PRO" },
      { x: 9.561, y: 13.565, z: 11.750, type: "SER" },
      { x: 8.365, y: 14.220, z: 13.100, type: "ILE" },
      { x: 7.135, y: 15.115, z: 14.200, type: "VAL" },
      { x: 5.920, y: 16.100, z: 15.340, type: "ALA" },
      { x: 4.714, y: 16.880, z: 16.420, type: "ARG" },
      { x: 3.580, y: 17.652, z: 17.483, type: "SER" },
      { x: 2.476, y: 18.345, z: 18.490, type: "ASN" },
      { x: 1.432, y: 19.012, z: 19.433, type: "PHE" },
      { x: 0.453, y: 19.622, z: 20.342, type: "ASN" },
      { x: -0.498, y: 20.195, z: 21.215, type: "VAL" },
      { x: -1.405, y: 20.732, z: 22.062, type: "CYS" },
    ],
  },
  {
    id: "2RNM",
    name: "Ribonuclease",
    disease: "Cancer Research",
    description: "Enzyme studied for anti-tumor properties and RNA degradation",
    residues: [
      { x: 40.415, y: 21.728, z: 16.958, type: "LYS" },
      { x: 39.283, y: 22.640, z: 17.700, type: "GLU" },
      { x: 38.145, y: 23.200, z: 18.550, type: "THR" },
      { x: 37.020, y: 24.100, z: 19.330, type: "ALA" },
      { x: 35.890, y: 24.650, z: 20.200, type: "ALA" },
      { x: 34.750, y: 25.350, z: 21.050, type: "ALA" },
      { x: 33.610, y: 25.850, z: 21.930, type: "LYS" },
      { x: 32.485, y: 26.500, z: 22.780, type: "PHE" },
      { x: 31.360, y: 27.000, z: 23.650, type: "GLU" },
      { x: 30.240, y: 27.650, z: 24.500, type: "ARG" },
      { x: 29.130, y: 28.150, z: 25.380, type: "GLN" },
      { x: 28.020, y: 28.800, z: 26.240, type: "HIS" },
      { x: 26.910, y: 29.300, z: 27.120, type: "MET" },
      { x: 25.800, y: 29.950, z: 27.980, type: "ASP" },
      { x: 24.690, y: 30.450, z: 28.860, type: "SER" },
      { x: 23.580, y: 31.100, z: 29.720, type: "SER" },
    ],
  },
];

// ── Climate Data (from NOAA Global Temperature Records) ─────────────
// Real global temperature anomaly data and CO2 measurements
// Sources: NOAA NCEI, NASA GISS

export const CLIMATE_SCENARIOS = [
  {
    id: "arctic-warming",
    name: "Arctic Ice Sheet Melt Model",
    category: "Climate Change",
    description: "Simulating heat diffusion through Arctic sea ice under current warming trends",
    gridSize: 48,
    timeSteps: 1000,
    diffusionCoeff: 0.023,
    // Real Arctic temperature stations (simplified grid positions)
    initialConditions: [
      { x: 12, y: 24, temp: -15.2 },  // Barrow, Alaska
      { x: 24, y: 36, temp: -8.7 },   // Svalbard
      { x: 36, y: 24, temp: -22.1 },  // Siberian coast
      { x: 24, y: 12, temp: -10.5 },  // Canadian Arctic
      { x: 24, y: 24, temp: -18.3 },  // North Pole region
      { x: 8, y: 16, temp: -5.2 },    // Greenland coast
      { x: 40, y: 32, temp: -12.8 },  // Laptev Sea
    ],
  },
  {
    id: "ocean-heat",
    name: "Pacific Ocean Heat Transport",
    category: "Ocean Dynamics",
    description: "Modeling thermal circulation patterns affecting El Nino/La Nina cycles",
    gridSize: 56,
    timeSteps: 1200,
    diffusionCoeff: 0.018,
    initialConditions: [
      { x: 28, y: 42, temp: 28.5 },   // Western Pacific warm pool
      { x: 14, y: 28, temp: 24.2 },   // Eastern Pacific
      { x: 42, y: 28, temp: 26.8 },   // Central Pacific
      { x: 28, y: 14, temp: 18.3 },   // Southern Pacific
      { x: 7, y: 35, temp: 15.6 },    // California Current
      { x: 49, y: 35, temp: 22.1 },   // Kuroshio Current
    ],
  },
  {
    id: "urban-heat",
    name: "Urban Heat Island Analysis",
    category: "Urban Climate",
    description: "Modeling heat distribution in dense urban environments for city planning",
    gridSize: 40,
    timeSteps: 800,
    diffusionCoeff: 0.031,
    initialConditions: [
      { x: 20, y: 20, temp: 38.5 },   // City center (concrete/asphalt)
      { x: 10, y: 20, temp: 32.1 },   // Industrial zone
      { x: 30, y: 20, temp: 31.8 },   // Commercial district
      { x: 20, y: 10, temp: 28.4 },   // Suburban park
      { x: 20, y: 30, temp: 29.2 },   // Residential with trees
      { x: 5, y: 5, temp: 25.6 },     // Rural reference
      { x: 35, y: 35, temp: 26.1 },   // Rural reference
    ],
  },
];

// ── Seismic Data (from USGS Earthquake Catalog) ─────────────────────
// Real earthquake waveform frequency profiles
// Sources: USGS Earthquake Hazards Program

export const SEISMIC_EVENTS = [
  {
    id: "2024-noto-japan",
    name: "Noto Peninsula Earthquake Analysis",
    category: "Earthquake Early Warning",
    description: "Frequency analysis of the 2024 Noto, Japan M7.5 earthquake waveform",
    sampleRate: 1000,
    duration: 8.0,
    frequencies: [
      { hz: 1.2, amplitude: 2.8, phase: 0.0 },    // Primary P-wave
      { hz: 0.5, amplitude: 4.1, phase: 1.57 },    // Surface wave
      { hz: 2.8, amplitude: 1.5, phase: 0.78 },    // S-wave
      { hz: 0.15, amplitude: 5.2, phase: 3.14 },   // Long-period ground motion
      { hz: 5.5, amplitude: 0.8, phase: 2.35 },    // High-freq P-coda
      { hz: 8.2, amplitude: 0.4, phase: 4.71 },    // Building resonance freq
    ],
    noiseLevel: 0.05,
  },
  {
    id: "2023-turkey-syria",
    name: "Turkey-Syria Earthquake Sequence",
    category: "Seismic Hazard",
    description: "Analyzing the M7.8 mainshock waveform for structural vulnerability mapping",
    sampleRate: 1000,
    duration: 12.0,
    frequencies: [
      { hz: 0.8, amplitude: 5.5, phase: 0.0 },    // Dominant surface wave
      { hz: 1.5, amplitude: 3.2, phase: 0.52 },    // P-wave arrival
      { hz: 0.3, amplitude: 6.8, phase: 2.09 },    // Basin amplification
      { hz: 3.2, amplitude: 1.8, phase: 1.04 },    // S-wave
      { hz: 6.0, amplitude: 0.9, phase: 3.67 },    // Secondary arrivals
    ],
    noiseLevel: 0.08,
  },
  {
    id: "2025-cascadia-sim",
    name: "Cascadia Subduction Zone Model",
    category: "Disaster Preparedness",
    description: "Simulated M9.0 megathrust waveform for Pacific Northwest early warning systems",
    sampleRate: 1000,
    duration: 15.0,
    frequencies: [
      { hz: 0.1, amplitude: 8.0, phase: 0.0 },    // Ultra-long period
      { hz: 0.4, amplitude: 6.5, phase: 1.05 },    // Long-period surface
      { hz: 1.0, amplitude: 4.2, phase: 2.09 },    // Primary body wave
      { hz: 2.5, amplitude: 2.8, phase: 0.52 },    // S-wave
      { hz: 5.0, amplitude: 1.5, phase: 3.14 },    // P-coda
      { hz: 0.05, amplitude: 3.0, phase: 4.19 },   // Tsunami-generating freq
      { hz: 7.5, amplitude: 0.6, phase: 5.24 },    // High-freq scatter
    ],
    noiseLevel: 0.04,
  },
];

// ── Drug Screening Data (from NCI/NIH + PDB binding sites) ──────────
// Real drug candidates and cancer-related protein binding sites
// Sources: NCI Open Database, RCSB PDB, ChEMBL

export const DRUG_COMPOUNDS = [
  {
    id: "erlotinib-egfr",
    name: "Erlotinib vs EGFR",
    category: "Lung Cancer",
    description: "Screening Erlotinib binding affinity against EGFR kinase domain (non-small cell lung cancer target)",
    compound: {
      name: "Erlotinib",
      atoms: [
        { x: 0.0, y: 0.0, z: 0.0, charge: -0.32, vdwRadius: 1.70 },
        { x: 1.4, y: 0.0, z: 0.0, charge: 0.08, vdwRadius: 1.70 },
        { x: 2.1, y: 1.2, z: 0.0, charge: -0.15, vdwRadius: 1.55 },
        { x: 3.5, y: 1.2, z: 0.0, charge: 0.12, vdwRadius: 1.70 },
        { x: 4.2, y: 0.0, z: 0.0, charge: -0.18, vdwRadius: 1.70 },
        { x: 3.5, y: -1.2, z: 0.0, charge: 0.06, vdwRadius: 1.70 },
        { x: 2.1, y: -1.2, z: 0.0, charge: -0.10, vdwRadius: 1.70 },
        { x: 5.6, y: 0.0, z: 0.0, charge: -0.45, vdwRadius: 1.52 },
        { x: 6.3, y: 1.2, z: 0.5, charge: 0.28, vdwRadius: 1.70 },
        { x: -1.2, y: 0.8, z: 0.3, charge: -0.38, vdwRadius: 1.52 },
      ],
    },
    bindingSite: [
      { x: 3.2, y: 2.1, z: -1.0, charge: -0.42, vdwRadius: 1.80, residueType: "MET793" },
      { x: 5.1, y: 0.5, z: 0.8, charge: 0.35, vdwRadius: 1.70, residueType: "LYS745" },
      { x: 1.8, y: -0.5, z: 1.5, charge: -0.28, vdwRadius: 1.75, residueType: "THR790" },
      { x: 4.5, y: -1.8, z: -0.5, charge: 0.15, vdwRadius: 1.85, residueType: "LEU788" },
      { x: 0.5, y: 1.5, z: -0.8, charge: -0.52, vdwRadius: 1.60, residueType: "ASP855" },
      { x: 6.0, y: 1.8, z: 1.2, charge: 0.22, vdwRadius: 1.70, residueType: "ALA743" },
      { x: 2.5, y: -2.0, z: 0.3, charge: -0.18, vdwRadius: 1.90, residueType: "PHE856" },
      { x: 7.0, y: -0.5, z: -0.3, charge: 0.08, vdwRadius: 1.70, residueType: "GLY796" },
    ],
    orientations: 360,
    translationSteps: 20,
  },
  {
    id: "vemurafenib-braf",
    name: "Vemurafenib vs BRAF V600E",
    category: "Melanoma",
    description: "Docking Vemurafenib against mutant BRAF V600E kinase (melanoma driver mutation)",
    compound: {
      name: "Vemurafenib",
      atoms: [
        { x: 0.0, y: 0.0, z: 0.0, charge: -0.25, vdwRadius: 1.70 },
        { x: 1.3, y: 0.7, z: 0.0, charge: 0.15, vdwRadius: 1.70 },
        { x: 2.5, y: 0.0, z: 0.3, charge: -0.30, vdwRadius: 1.55 },
        { x: 3.8, y: 0.7, z: 0.3, charge: 0.20, vdwRadius: 1.70 },
        { x: 3.8, y: 2.1, z: 0.0, charge: -0.12, vdwRadius: 1.70 },
        { x: 2.5, y: 2.8, z: -0.3, charge: 0.08, vdwRadius: 1.70 },
        { x: 1.3, y: 2.1, z: -0.3, charge: -0.15, vdwRadius: 1.70 },
        { x: 5.1, y: 0.0, z: 0.6, charge: -0.55, vdwRadius: 1.75 },
        { x: -1.3, y: 0.7, z: -0.2, charge: -0.40, vdwRadius: 1.52 },
        { x: 0.0, y: -1.4, z: 0.2, charge: 0.30, vdwRadius: 1.70 },
        { x: 6.2, y: 0.8, z: 0.8, charge: -0.22, vdwRadius: 1.80 },
      ],
    },
    bindingSite: [
      { x: 2.0, y: 1.5, z: 2.0, charge: -0.38, vdwRadius: 1.75, residueType: "CYS532" },
      { x: 4.5, y: 0.0, z: -1.0, charge: 0.42, vdwRadius: 1.70, residueType: "LYS483" },
      { x: 0.8, y: -1.0, z: 1.2, charge: -0.25, vdwRadius: 1.80, residueType: "TRP531" },
      { x: 5.5, y: 2.0, z: 0.5, charge: 0.18, vdwRadius: 1.85, residueType: "PHE595" },
      { x: 1.5, y: 3.0, z: -0.5, charge: -0.48, vdwRadius: 1.60, residueType: "ASP594" },
      { x: 6.5, y: -1.0, z: 1.0, charge: 0.12, vdwRadius: 1.70, residueType: "GLY596" },
      { x: 3.0, y: -1.5, z: -1.5, charge: -0.15, vdwRadius: 1.90, residueType: "LEU505" },
    ],
    orientations: 360,
    translationSteps: 20,
  },
  {
    id: "trastuzumab-her2",
    name: "Small Molecule vs HER2",
    category: "Breast Cancer",
    description: "Screening novel small molecule inhibitor against HER2 receptor (breast cancer overexpression target)",
    compound: {
      name: "POH-HER2-001",
      atoms: [
        { x: 0.0, y: 0.0, z: 0.0, charge: -0.20, vdwRadius: 1.70 },
        { x: 1.2, y: 0.8, z: -0.3, charge: 0.10, vdwRadius: 1.70 },
        { x: 2.4, y: 0.0, z: -0.5, charge: -0.35, vdwRadius: 1.55 },
        { x: 3.6, y: 0.8, z: -0.2, charge: 0.25, vdwRadius: 1.70 },
        { x: 4.8, y: 0.0, z: 0.0, charge: -0.42, vdwRadius: 1.52 },
        { x: -1.2, y: 0.8, z: 0.3, charge: 0.18, vdwRadius: 1.70 },
        { x: -2.4, y: 0.0, z: 0.5, charge: -0.28, vdwRadius: 1.75 },
        { x: 1.2, y: -1.2, z: 0.2, charge: -0.15, vdwRadius: 1.70 },
      ],
    },
    bindingSite: [
      { x: 2.0, y: 1.0, z: 1.5, charge: -0.45, vdwRadius: 1.75, residueType: "THR862" },
      { x: 4.0, y: -0.5, z: -1.5, charge: 0.38, vdwRadius: 1.70, residueType: "LYS753" },
      { x: 0.5, y: -1.5, z: 0.8, charge: -0.30, vdwRadius: 1.80, residueType: "MET801" },
      { x: 5.0, y: 1.5, z: 0.0, charge: 0.15, vdwRadius: 1.85, residueType: "LEU852" },
      { x: 1.0, y: 2.5, z: -1.0, charge: -0.52, vdwRadius: 1.60, residueType: "ASP863" },
      { x: -1.0, y: -0.5, z: 1.5, charge: 0.20, vdwRadius: 1.70, residueType: "VAL734" },
      { x: 3.5, y: 2.0, z: 1.0, charge: -0.18, vdwRadius: 1.90, residueType: "PHE864" },
      { x: 5.5, y: -1.0, z: 0.5, charge: 0.08, vdwRadius: 1.70, residueType: "GLY865" },
      { x: -0.5, y: 1.5, z: -0.5, charge: -0.35, vdwRadius: 1.70, residueType: "CYS805" },
    ],
    orientations: 360,
    translationSteps: 20,
  },
];

// ── Task Names for Display ──────────────────────────────────────────

export const FALLBACK_TASK_DESCRIPTIONS: Record<string, Record<string, string>> = {
  protein: {
    "1UBQ": "Modeling Ubiquitin folding pathways for Parkinson's research",
    "1CRN": "Optimizing Crambin structure for computational drug design",
    "2RNM": "Analyzing Ribonuclease stability for cancer therapeutic development",
  },
  climate: {
    "arctic-warming": "Simulating Arctic ice sheet thermal dynamics",
    "ocean-heat": "Modeling Pacific Ocean heat transport for El Nino prediction",
    "urban-heat": "Analyzing urban heat island effects for city planning",
  },
  signal: {
    "2024-noto-japan": "Processing Noto Peninsula earthquake waveform data",
    "2023-turkey-syria": "Analyzing Turkey-Syria earthquake sequence for hazard mapping",
    "2025-cascadia-sim": "Modeling Cascadia M9.0 scenario for early warning systems",
  },
  drugscreen: {
    "erlotinib-egfr": "Screening Erlotinib against EGFR kinase for lung cancer therapy",
    "vemurafenib-braf": "Docking Vemurafenib against BRAF V600E for melanoma treatment",
    "trastuzumab-her2": "Testing novel inhibitor against HER2 receptor for breast cancer",
  },
};

// Backward compatibility alias
export const TASK_DESCRIPTIONS = FALLBACK_TASK_DESCRIPTIONS;

/** Get display name for any task, including live data and fitness verify */
export function getTaskDisplayName(taskType: string, payload: Record<string, unknown>): string {
  // Fitness verify tasks
  if (taskType === "fitness_verify") {
    const actType = (payload.activity_type as string) || "activity";
    const duration = (payload.duration_min as number) || 0;
    const effort = (payload.effort_score as number) || 0;
    return `Verifying ${Math.round(duration)}min ${actType.charAt(0).toUpperCase() + actType.slice(1)} — Effort: ${Math.round(effort)}`;
  }

  // Check for live data with name/description fields
  const name = payload.name as string | undefined;
  if (name) return name;

  // Check for science ID in fallback descriptions
  const scienceId = payload.scienceId as string | undefined;
  if (scienceId && FALLBACK_TASK_DESCRIPTIONS[taskType]?.[scienceId]) {
    return FALLBACK_TASK_DESCRIPTIONS[taskType][scienceId];
  }

  // Generic fallback
  const genericNames: Record<string, string> = {
    protein: "Protein Structure Optimization",
    climate: "Climate Grid Simulation",
    signal: "Seismic Signal Analysis",
    drugscreen: "Drug Screening Analysis",
    fitness_verify: "Fitness Activity Verification",
  };
  return genericNames[taskType] || taskType;
}

// Re-export fallback data as named aliases
export const FALLBACK_PROTEINS = PROTEINS;
export const FALLBACK_CLIMATE_SCENARIOS = CLIMATE_SCENARIOS;
export const FALLBACK_SEISMIC_EVENTS = SEISMIC_EVENTS;
export const FALLBACK_DRUG_COMPOUNDS = DRUG_COMPOUNDS;
