/**
 * BOINC API Client
 * Fetches BOINC computing credits for a given CPID (Cross-Project ID)
 * and calculates POH bonus points.
 */

export interface BOINCProject {
  name: string;
  url: string;
  credit: number;
  teamId?: string;
}

export interface BOINCData {
  cpid: string;
  projects: BOINCProject[];
  totalCredit: number;
  lastSynced: Date;
}

// In-memory cache with 24-hour TTL
interface CacheEntry {
  data: BOINCData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Supported BOINC projects
const SUPPORTED_PROJECTS = [
  'Rosetta@home',
  'Einstein@Home',
  'Climateprediction.net',
  'World Community Grid'
];

/**
 * Validates CPID format (32-character hexadecimal string)
 */
export function validateCPID(cpid: string): boolean {
  return /^[a-f0-9]{32}$/i.test(cpid);
}

/**
 * Parses XML response from BOINC aggregator API
 */
function parseBOINCXML(xmlText: string, cpid: string): BOINCData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML response from BOINC API');
  }

  const projects: BOINCProject[] = [];
  let totalCredit = 0;

  // Parse project entries
  const projectNodes = xmlDoc.querySelectorAll('project');

  projectNodes.forEach((projectNode) => {
    const nameNode = projectNode.querySelector('name');
    const urlNode = projectNode.querySelector('url');
    const creditNode = projectNode.querySelector('total_credit, expavg_credit');
    const teamNode = projectNode.querySelector('team_id');

    if (nameNode && urlNode && creditNode) {
      const name = nameNode.textContent?.trim() || '';
      const url = urlNode.textContent?.trim() || '';
      const credit = parseFloat(creditNode.textContent || '0');
      const teamId = teamNode?.textContent?.trim();

      // Only include supported projects
      if (SUPPORTED_PROJECTS.includes(name)) {
        projects.push({ name, url, credit, teamId });
        totalCredit += credit;
      }
    }
  });

  // If no projects found, try alternative XML structure
  if (projects.length === 0) {
    const hostEntries = xmlDoc.querySelectorAll('host');
    hostEntries.forEach((host) => {
      const projectName = host.getAttribute('project_name');
      const projectUrl = host.getAttribute('project_url');
      const creditStr = host.getAttribute('total_credit');

      if (projectName && projectUrl && creditStr) {
        const credit = parseFloat(creditStr);
        if (SUPPORTED_PROJECTS.includes(projectName)) {
          projects.push({
            name: projectName,
            url: projectUrl,
            credit
          });
          totalCredit += credit;
        }
      }
    });
  }

  return {
    cpid,
    projects,
    totalCredit,
    lastSynced: new Date()
  };
}

/**
 * Fetches BOINC data from aggregator APIs with fallback
 */
export async function fetchBOINCData(cpid: string): Promise<BOINCData> {
  // Validate CPID format
  if (!validateCPID(cpid)) {
    throw new Error('Invalid CPID format. Must be 32 hexadecimal characters.');
  }

  // Check cache first
  const cached = cache.get(cpid);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const primaryUrl = `https://boinc.netsoft-online.com/e107_plugins/boinc/get_user.php?cpid=${cpid}`;
  const fallbackUrl = `https://api.free-dc.org/get_user.php?cpid=${cpid}`;

  let boincData: BOINCData | null = null;
  let lastError: Error | null = null;

  // Try primary API
  try {
    const response = await fetch(primaryUrl, {
      headers: { 'User-Agent': 'POH-BOINC-Client/1.0' }
    });

    if (response.ok) {
      const xmlText = await response.text();
      boincData = parseBOINCXML(xmlText, cpid);
    }
  } catch (error) {
    lastError = error instanceof Error ? error : new Error('Primary API failed');
    console.warn('Primary BOINC API failed, trying fallback:', lastError.message);
  }

  // Try fallback API if primary failed
  if (!boincData) {
    try {
      const response = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'POH-BOINC-Client/1.0' }
      });

      if (response.ok) {
        const xmlText = await response.text();
        boincData = parseBOINCXML(xmlText, cpid);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Fallback API failed');
      console.error('Fallback BOINC API failed:', lastError.message);
    }
  }

  // If both APIs failed
  if (!boincData) {
    throw new Error(
      lastError
        ? `Failed to fetch BOINC data: ${lastError.message}`
        : 'CPID not found in BOINC network'
    );
  }

  // Validate we got some data
  if (boincData.projects.length === 0) {
    throw new Error('No supported BOINC projects found for this CPID');
  }

  // Update cache
  cache.set(cpid, {
    data: boincData,
    timestamp: Date.now()
  });

  return boincData;
}

/**
 * Calculates POH bonus points from BOINC credits
 * Formula: 10 POH points per BOINC credit
 */
export function getBOINCPointsBonus(totalCredit: number): number {
  return Math.floor(totalCredit * 10);
}
