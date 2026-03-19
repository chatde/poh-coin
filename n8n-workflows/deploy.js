#!/usr/bin/env node
/**
 * POH n8n Workflow Deployer
 * Creates and activates all 5 POH monitoring workflows via n8n REST API.
 *
 * Prerequisites:
 *   1. n8n running on localhost:5678
 *   2. ~/.n8n/.env has N8N_API_KEY, BASESCAN_API_KEY, DISCORD_WEBHOOK_* filled in
 *
 * Usage: node deploy.js [--activate] [--delete-existing]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// --- Config ---
const N8N_URL = 'http://localhost:5678';
const ENV_PATH = path.join(process.env.HOME, '.n8n', '.env');

// Load env
const envContent = fs.readFileSync(ENV_PATH, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
});

const N8N_API_KEY = env.N8N_API_KEY;
const BASESCAN_API_KEY = env.BASESCAN_API_KEY || 'REPLACE_WITH_BASESCAN_API_KEY';
const DISCORD_WEBHOOK_GOVERNANCE = env.DISCORD_WEBHOOK_GOVERNANCE || 'REPLACE_WITH_GOVERNANCE_WEBHOOK_URL';
const DISCORD_WEBHOOK_MINING = env.DISCORD_WEBHOOK_MINING || 'REPLACE_WITH_MINING_WEBHOOK_URL';
const DISCORD_WEBHOOK_JARVIS = env.DISCORD_WEBHOOK_JARVIS || 'REPLACE_WITH_JARVIS_WEBHOOK_URL';

if (!N8N_API_KEY) {
  console.error('ERROR: N8N_API_KEY not found in ~/.n8n/.env');
  process.exit(1);
}

const ACTIVATE = process.argv.includes('--activate');
const DELETE_EXISTING = process.argv.includes('--delete-existing');

// --- Contract addresses ---
const DEPLOYER_WALLET = '0x2d0BbA61E34015F2e511d96A40980e90882ba768';
const LEDGER_WALLET = '0xdB3A72973141BCFCA1A11ABAf7A03E62495FbaD0';
const TOKEN_CONTRACT = '0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07';
const CHARITY_CONTRACT = '0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49';
const GOVERNOR_CONTRACT = '0x7C96Ed675033F15a53557f1d0190e00B19522e6e';

// --- Event topic hashes ---
// ERC20 Transfer(address,address,uint256)
const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
// POHCharity events
const TOPIC_CHARITY_PROPOSAL_CREATED = null; // We'll use full log scanning
const TOPIC_CHARITY_PROPOSAL_EXECUTED = null;
const TOPIC_CHARITY_PROPOSAL_CANCELLED = null;

// --- HTTP helper ---
function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, N8N_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================================
// WORKFLOW 1: Wallet Balance Monitor
// ============================================================
function buildWalletBalanceWorkflow() {
  return {
    name: 'POH: Wallet Balance Monitor',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'hours', hoursInterval: 4 }]
          }
        },
        id: 'w1-trigger',
        name: 'Every 4 Hours',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://mainnet.base.org',
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [DEPLOYER_WALLET, 'latest']
          }),
          options: { timeout: 10000 },
        },
        id: 'w1-deployer-balance',
        name: 'Get Deployer Balance',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [250, -100],
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://mainnet.base.org',
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'eth_getBalance',
            params: [LEDGER_WALLET, 'latest']
          }),
          options: { timeout: 10000 },
        },
        id: 'w1-ledger-balance',
        name: 'Get Ledger Balance',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [250, 100],
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://mainnet.base.org',
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'eth_call',
            params: [{ to: TOKEN_CONTRACT, data: '0x70a08231000000000000000000000000' + DEPLOYER_WALLET.slice(2) }, 'latest']
          }),
          options: { timeout: 10000 },
        },
        id: 'w1-deployer-poh',
        name: 'Get Deployer POH',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [250, -200],
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://mainnet.base.org',
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            jsonrpc: '2.0',
            id: 4,
            method: 'eth_call',
            params: [{ to: TOKEN_CONTRACT, data: '0x70a08231000000000000000000000000' + LEDGER_WALLET.slice(2) }, 'latest']
          }),
          options: { timeout: 10000 },
        },
        id: 'w1-ledger-poh',
        name: 'Get Ledger POH',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [250, 200],
      },
      {
        parameters: {
          jsCode: `
// Merge all balance results
const deployerData = $('Get Deployer Balance').first().json;
const ledgerData = $('Get Ledger Balance').first().json;
const deployerPohData = $('Get Deployer POH').first().json;
const ledgerPohData = $('Get Ledger POH').first().json;

const hexToEth = (hex) => {
  if (!hex || hex === '0x0') return 0;
  return parseInt(hex, 16) / 1e18;
};

const hexToToken = (hex) => {
  if (!hex || hex === '0x' || hex === '0x0') return 0;
  // Use BigInt for large token balances
  try {
    return Number(BigInt(hex)) / 1e18;
  } catch {
    return parseInt(hex, 16) / 1e18;
  }
};

const deployerBalance = hexToEth(deployerData.result);
const ledgerBalance = hexToEth(ledgerData.result);
const deployerPoh = hexToToken(deployerPohData.result);
const ledgerPoh = hexToToken(ledgerPohData.result);

// Static data for change tracking
const staticData = $getWorkflowStaticData('global');
const prevDeployer = staticData.deployerBalance || 0;
const prevLedger = staticData.ledgerBalance || 0;
const prevDeployerPoh = staticData.deployerPoh || 0;
const prevLedgerPoh = staticData.ledgerPoh || 0;

const deployerChanged = Math.abs(deployerBalance - prevDeployer) > 0.0001;
const ledgerChanged = Math.abs(ledgerBalance - prevLedger) > 0.0001;
const deployerPohChanged = Math.abs(deployerPoh - prevDeployerPoh) > 1;
const ledgerPohChanged = Math.abs(ledgerPoh - prevLedgerPoh) > 1;

staticData.deployerBalance = deployerBalance;
staticData.ledgerBalance = ledgerBalance;
staticData.deployerPoh = deployerPoh;
staticData.ledgerPoh = ledgerPoh;
staticData.lastCheck = new Date().toISOString();

const lowGas = deployerBalance < 0.005;
const anyChange = deployerChanged || ledgerChanged || deployerPohChanged || ledgerPohChanged;

return [{
  json: {
    deployerBalance: deployerBalance.toFixed(6),
    ledgerBalance: ledgerBalance.toFixed(6),
    deployerPoh: deployerPoh.toLocaleString('en-US', {maximumFractionDigits: 2}),
    ledgerPoh: ledgerPoh.toLocaleString('en-US', {maximumFractionDigits: 2}),
    prevDeployer: prevDeployer.toFixed(6),
    prevLedger: prevLedger.toFixed(6),
    prevDeployerPoh: prevDeployerPoh.toLocaleString('en-US', {maximumFractionDigits: 2}),
    prevLedgerPoh: prevLedgerPoh.toLocaleString('en-US', {maximumFractionDigits: 2}),
    deployerChanged,
    ledgerChanged,
    deployerPohChanged,
    ledgerPohChanged,
    anyChange,
    lowGas,
    timestamp: new Date().toISOString()
  }
}];
`
        },
        id: 'w1-parse',
        name: 'Parse Balances',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 0],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                id: 'change-check',
                leftValue: '={{ $json.anyChange }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'equals', singleValue: true }
              }
            ],
            combinator: 'or'
          }
        },
        id: 'w1-if',
        name: 'Balance Changed?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [750, 0],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_JARVIS,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "embeds": [{
    "title": "💰 POH Wallet Balance Update",
    "color": {{ $json.lowGas ? 16711680 : 3447003 }},
    "fields": [
      { "name": "Deployer ETH", "value": "{{ $json.deployerBalance }} ETH{{ $json.deployerChanged ? ' (was ' + $json.prevDeployer + ')' : '' }}", "inline": true },
      { "name": "Deployer POH", "value": "{{ $json.deployerPoh }} POH{{ $json.deployerPohChanged ? ' (was ' + $json.prevDeployerPoh + ')' : '' }}", "inline": true },
      { "name": "\\u200b", "value": "\\u200b", "inline": false },
      { "name": "Ledger ETH", "value": "{{ $json.ledgerBalance }} ETH{{ $json.ledgerChanged ? ' (was ' + $json.prevLedger + ')' : '' }}", "inline": true },
      { "name": "Ledger POH", "value": "{{ $json.ledgerPoh }} POH{{ $json.ledgerPohChanged ? ' (was ' + $json.prevLedgerPoh + ')' : '' }}", "inline": true }
    ],
    "footer": { "text": "POH Wallet Monitor" },
    "timestamp": "{{ $json.timestamp }}"
  }]
}`,
          options: { timeout: 10000 },
        },
        id: 'w1-discord',
        name: 'Discord Alert',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1000, -50],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                id: 'low-gas-check',
                leftValue: '={{ $json.lowGas }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'equals', singleValue: true }
              }
            ],
            combinator: 'or'
          }
        },
        id: 'w1-low-gas',
        name: 'Low Gas?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [750, 200],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_JARVIS,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "embeds": [{
    "title": "⚠️ LOW GAS WARNING — POH Deployer",
    "color": 16711680,
    "description": "Deployer wallet has only **{{ $json.deployerBalance }} ETH** remaining.\\nRefill needed for contract interactions.",
    "footer": { "text": "POH Wallet Monitor" },
    "timestamp": "{{ $json.timestamp }}"
  }]
}`,
          options: { timeout: 10000 },
        },
        id: 'w1-low-gas-alert',
        name: 'Low Gas Alert',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1000, 200],
      },
    ],
    connections: {
      'Every 4 Hours': { main: [[{ node: 'Get Deployer Balance', type: 'main', index: 0 }, { node: 'Get Ledger Balance', type: 'main', index: 0 }, { node: 'Get Deployer POH', type: 'main', index: 0 }, { node: 'Get Ledger POH', type: 'main', index: 0 }]] },
      'Get Deployer Balance': { main: [[{ node: 'Parse Balances', type: 'main', index: 0 }]] },
      'Get Ledger Balance': { main: [[{ node: 'Parse Balances', type: 'main', index: 0 }]] },
      'Get Deployer POH': { main: [[{ node: 'Parse Balances', type: 'main', index: 0 }]] },
      'Get Ledger POH': { main: [[{ node: 'Parse Balances', type: 'main', index: 0 }]] },
      'Parse Balances': { main: [[{ node: 'Balance Changed?', type: 'main', index: 0 }, { node: 'Low Gas?', type: 'main', index: 0 }]] },
      'Balance Changed?': { main: [[{ node: 'Discord Alert', type: 'main', index: 0 }], []] },
      'Low Gas?': { main: [[{ node: 'Low Gas Alert', type: 'main', index: 0 }], []] },
    },
    settings: { executionOrder: 'v1' },
  };
}

// ============================================================
// WORKFLOW 2: Charity Treasury Monitor
// ============================================================
function buildCharityMonitorWorkflow() {
  return {
    name: 'POH: Charity Treasury Monitor',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'minutes', minutesInterval: 15 }]
          }
        },
        id: 'w2-trigger',
        name: 'Every 15 Minutes',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          jsCode: `
const staticData = $getWorkflowStaticData('global');
const fromBlock = staticData.lastBlock || 'latest';
// We'll fetch the current block first, then get logs
return [{ json: { fromBlock } }];
`
        },
        id: 'w2-get-block',
        name: 'Get Last Block',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [250, 0],
      },
      {
        parameters: {
          method: 'GET',
          url: `https://api.basescan.org/api?module=logs&action=getLogs&address=${CHARITY_CONTRACT}&fromBlock={{ $json.fromBlock === 'latest' ? 0 : $json.fromBlock }}&toBlock=latest&apikey=${BASESCAN_API_KEY}`,
          options: { timeout: 15000 },
        },
        id: 'w2-get-logs',
        name: 'Get Charity Logs',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [500, 0],
      },
      {
        parameters: {
          jsCode: `
const response = $input.first().json;
const staticData = $getWorkflowStaticData('global');

if (response.status !== '1' || !response.result || !Array.isArray(response.result)) {
  // No new events or error
  return [{ json: { hasEvents: false, events: [] } }];
}

const logs = response.result;
if (logs.length === 0) {
  return [{ json: { hasEvents: false, events: [] } }];
}

// Update last block to highest block + 1
const maxBlock = Math.max(...logs.map(l => parseInt(l.blockNumber, 16)));
staticData.lastBlock = maxBlock + 1;

// Parse known events
// ProposalCreated(uint256 proposalId, address recipient, uint256 amount, string description)
// topic0 for ProposalCreated — compute from ABI
const PROPOSAL_CREATED_SIG = '0x' + logs[0]?.topics?.[0]?.slice(2) || ''; // We'll match by position

const events = logs.map(log => {
  const topic0 = log.topics[0];
  const blockNum = parseInt(log.blockNumber, 16);
  const txHash = log.transactionHash;

  // ProposalCreated has 4 topics: event sig, proposalId (indexed)
  // ProposalExecuted has 2 topics: event sig, proposalId (indexed)
  // ProposalCancelled has 2 topics: event sig, proposalId (indexed)

  let eventType = 'Unknown';
  let proposalId = 'N/A';

  if (log.topics.length >= 2) {
    proposalId = parseInt(log.topics[1], 16).toString();
  }

  // Match by data length heuristic + topic count
  // ProposalCreated has longer data (recipient address + amount + description)
  if (log.data.length > 130) {
    eventType = 'ProposalCreated';
  } else if (log.data === '0x' && log.topics.length === 2) {
    // Could be Executed or Cancelled — we'll label generically
    eventType = 'ProposalStatusChange';
  }

  return {
    eventType,
    proposalId,
    blockNumber: blockNum,
    txHash,
    data: log.data,
  };
});

return [{ json: { hasEvents: true, events, count: events.length } }];
`
        },
        id: 'w2-parse',
        name: 'Parse Charity Events',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [750, 0],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                id: 'has-events',
                leftValue: '={{ $json.hasEvents }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'equals', singleValue: true }
              }
            ],
            combinator: 'or'
          }
        },
        id: 'w2-if',
        name: 'New Events?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [1000, 0],
      },
      {
        parameters: {
          jsCode: `
const data = $input.first().json;
const events = data.events;

const fields = events.slice(0, 5).map((e, i) => ({
  name: \`\${e.eventType} #\${e.proposalId}\`,
  value: \`Block \${e.blockNumber} | [tx](https://basescan.org/tx/\${e.txHash})\`,
  inline: false
}));

const embed = {
  embeds: [{
    title: '🏛️ POH Charity — New Activity',
    color: 15844367,
    description: \`\${data.count} new event(s) detected on the Charity contract.\`,
    fields,
    footer: { text: 'POH Charity Monitor' },
    timestamp: new Date().toISOString()
  }]
};

return [{ json: embed }];
`
        },
        id: 'w2-format',
        name: 'Format Discord Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1250, -50],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_GOVERNANCE,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($json) }}',
          options: { timeout: 10000 },
        },
        id: 'w2-discord',
        name: 'Post to Discord',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1500, -50],
      },
    ],
    connections: {
      'Every 15 Minutes': { main: [[{ node: 'Get Last Block', type: 'main', index: 0 }]] },
      'Get Last Block': { main: [[{ node: 'Get Charity Logs', type: 'main', index: 0 }]] },
      'Get Charity Logs': { main: [[{ node: 'Parse Charity Events', type: 'main', index: 0 }]] },
      'Parse Charity Events': { main: [[{ node: 'New Events?', type: 'main', index: 0 }]] },
      'New Events?': { main: [[{ node: 'Format Discord Message', type: 'main', index: 0 }], []] },
      'Format Discord Message': { main: [[{ node: 'Post to Discord', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };
}

// ============================================================
// WORKFLOW 3: Governance Proposal Monitor
// ============================================================
function buildGovernanceMonitorWorkflow() {
  // Governor events: ProposalCreated, VoteCast, ProposalQueued, ProposalExecuted, ProposalCancelled
  // These are from OpenZeppelin Governor — well-known topic hashes
  const GOV_EVENTS = {
    '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0': 'ProposalCreated',
    '0xb8e138887d0aa13bab447e82de9d5c1777041ecd21ca36ba824ff1e6c07ddda4': 'VoteCast',
    '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892': 'ProposalQueued',
    '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2a0b2e67e07e0c37e1d': 'ProposalExecuted',
    '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c': 'ProposalCancelled',
  };

  return {
    name: 'POH: Governance Proposal Monitor',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'minutes', minutesInterval: 15 }]
          }
        },
        id: 'w3-trigger',
        name: 'Every 15 Minutes',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          jsCode: `
const staticData = $getWorkflowStaticData('global');
const fromBlock = staticData.lastBlock || 0;
return [{ json: { fromBlock } }];
`
        },
        id: 'w3-get-block',
        name: 'Get Last Block',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [250, 0],
      },
      {
        parameters: {
          method: 'GET',
          url: `https://api.basescan.org/api?module=logs&action=getLogs&address=${GOVERNOR_CONTRACT}&fromBlock={{ $json.fromBlock }}&toBlock=latest&apikey=${BASESCAN_API_KEY}`,
          options: { timeout: 15000 },
        },
        id: 'w3-get-logs',
        name: 'Get Governor Logs',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [500, 0],
      },
      {
        parameters: {
          jsCode: `
const response = $input.first().json;
const staticData = $getWorkflowStaticData('global');

const GOV_EVENTS = {
  '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0': 'ProposalCreated',
  '0xb8e138887d0aa13bab447e82de9d5c1777041ecd21ca36ba824ff1e6c07ddda4': 'VoteCast',
  '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892': 'ProposalQueued',
  '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2a0b2e67e07e0c37e1d': 'ProposalExecuted',
  '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c': 'ProposalCancelled',
};

if (response.status !== '1' || !response.result || !Array.isArray(response.result) || response.result.length === 0) {
  return [{ json: { hasEvents: false, events: [] } }];
}

const logs = response.result;
const maxBlock = Math.max(...logs.map(l => parseInt(l.blockNumber, 16)));
staticData.lastBlock = maxBlock + 1;

const events = logs.map(log => {
  const topic0 = log.topics[0];
  const eventType = GOV_EVENTS[topic0] || 'Unknown';
  const blockNum = parseInt(log.blockNumber, 16);
  const txHash = log.transactionHash;

  let details = '';
  if (eventType === 'VoteCast' && log.topics.length >= 2) {
    const voter = '0x' + log.topics[1].slice(26);
    details = \`Voter: \${voter.slice(0, 10)}...\`;
  } else if (eventType === 'ProposalCreated') {
    details = 'New governance proposal submitted';
  } else if (eventType === 'ProposalExecuted') {
    details = 'Proposal has been executed';
  } else if (eventType === 'ProposalQueued') {
    details = 'Proposal queued for execution';
  } else if (eventType === 'ProposalCancelled') {
    details = 'Proposal has been cancelled';
  }

  return { eventType, blockNumber: blockNum, txHash, details };
});

return [{ json: { hasEvents: true, events, count: events.length } }];
`
        },
        id: 'w3-parse',
        name: 'Parse Governor Events',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [750, 0],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                id: 'has-events',
                leftValue: '={{ $json.hasEvents }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'equals', singleValue: true }
              }
            ],
            combinator: 'or'
          }
        },
        id: 'w3-if',
        name: 'New Events?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [1000, 0],
      },
      {
        parameters: {
          jsCode: `
const data = $input.first().json;
const events = data.events;

const colorMap = {
  ProposalCreated: 3066993,    // green
  VoteCast: 3447003,           // blue
  ProposalQueued: 15105570,    // orange
  ProposalExecuted: 10181046,  // purple
  ProposalCancelled: 15158332, // red
  Unknown: 9807270,            // grey
};

const fields = events.slice(0, 10).map(e => ({
  name: e.eventType,
  value: \`\${e.details}\\n[View tx](https://basescan.org/tx/\${e.txHash}) | Block \${e.blockNumber}\`,
  inline: false
}));

const primaryColor = events.length > 0 ? (colorMap[events[0].eventType] || 3447003) : 3447003;

return [{ json: {
  embeds: [{
    title: '⚖️ POH Governance Activity',
    color: primaryColor,
    description: \`\${data.count} new governance event(s) detected.\`,
    fields,
    footer: { text: 'POH Governance Monitor' },
    timestamp: new Date().toISOString()
  }]
}}];
`
        },
        id: 'w3-format',
        name: 'Format Discord Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1250, -50],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_GOVERNANCE,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($json) }}',
          options: { timeout: 10000 },
        },
        id: 'w3-discord',
        name: 'Post to Discord',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1500, -50],
      },
    ],
    connections: {
      'Every 15 Minutes': { main: [[{ node: 'Get Last Block', type: 'main', index: 0 }]] },
      'Get Last Block': { main: [[{ node: 'Get Governor Logs', type: 'main', index: 0 }]] },
      'Get Governor Logs': { main: [[{ node: 'Parse Governor Events', type: 'main', index: 0 }]] },
      'Parse Governor Events': { main: [[{ node: 'New Events?', type: 'main', index: 0 }]] },
      'New Events?': { main: [[{ node: 'Format Discord Message', type: 'main', index: 0 }], []] },
      'Format Discord Message': { main: [[{ node: 'Post to Discord', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };
}

// ============================================================
// WORKFLOW 4: Network Health Dashboard
// ============================================================
function buildNetworkHealthWorkflow() {
  return {
    name: 'POH: Network Health Dashboard',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'hours', hoursInterval: 4 }]
          }
        },
        id: 'w4-trigger',
        name: 'Every 4 Hours',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          method: 'GET',
          url: 'https://projectpoh.com/api/data/stats',
          options: { timeout: 15000 },
        },
        id: 'w4-get-stats',
        name: 'Get Network Stats',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [250, 0],
      },
      {
        parameters: {
          jsCode: `
const stats = $input.first().json;
const staticData = $getWorkflowStaticData('global');

const activeNodes = stats.activeNodes || stats.active_nodes || 0;
const activeValidators = stats.activeValidators || stats.active_validators || 0;
const weeklyPool = stats.weeklyPool || stats.weekly_pool || 0;
const totalNodes = stats.totalNodes || stats.total_nodes || 0;

const prevNodes = staticData.activeNodes || activeNodes;
const prevValidators = staticData.activeValidators || activeValidators;

// Calculate drops
const nodeDrop = prevNodes > 0 ? ((prevNodes - activeNodes) / prevNodes) * 100 : 0;
const validatorDrop = prevValidators > 0 ? ((prevValidators - activeValidators) / prevValidators) * 100 : 0;

const alert = nodeDrop > 20 || validatorDrop > 20;

// Check if it's ~8AM for daily summary
const hour = new Date().getHours();
const isDailySummary = (hour >= 7 && hour <= 9);

staticData.activeNodes = activeNodes;
staticData.activeValidators = activeValidators;
staticData.lastCheck = new Date().toISOString();

return [{ json: {
  activeNodes,
  activeValidators,
  weeklyPool,
  totalNodes,
  prevNodes,
  prevValidators,
  nodeDrop: nodeDrop.toFixed(1),
  validatorDrop: validatorDrop.toFixed(1),
  alert,
  isDailySummary,
  shouldPost: alert || isDailySummary,
  timestamp: new Date().toISOString()
}}];
`
        },
        id: 'w4-analyze',
        name: 'Analyze Stats',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 0],
      },
      {
        parameters: {
          rules: {
            values: [
              {
                conditions: {
                  conditions: [{
                    leftValue: '={{ $json.alert }}',
                    rightValue: true,
                    operator: { type: 'boolean', operation: 'equals' }
                  }],
                  combinator: 'and'
                },
                renameOutput: true,
                outputKey: 'Alert'
              },
              {
                conditions: {
                  conditions: [{
                    leftValue: '={{ $json.isDailySummary }}',
                    rightValue: true,
                    operator: { type: 'boolean', operation: 'equals' }
                  }],
                  combinator: 'and'
                },
                renameOutput: true,
                outputKey: 'Summary'
              }
            ]
          },
          options: { fallbackOutput: 'none' }
        },
        id: 'w4-switch',
        name: 'Alert or Summary?',
        type: 'n8n-nodes-base.switch',
        typeVersion: 3.2,
        position: [750, 0],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_MINING,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "embeds": [{
    "title": "🚨 POH Network Alert — Node Drop Detected",
    "color": 16711680,
    "description": "Significant drop in network health detected!",
    "fields": [
      { "name": "Active Nodes", "value": "{{ $json.activeNodes }} (was {{ $json.prevNodes }}, -{{ $json.nodeDrop }}%)", "inline": true },
      { "name": "Active Validators", "value": "{{ $json.activeValidators }} (was {{ $json.prevValidators }}, -{{ $json.validatorDrop }}%)", "inline": true },
      { "name": "Weekly Pool", "value": "{{ $json.weeklyPool }} POH", "inline": true }
    ],
    "footer": { "text": "POH Network Health" },
    "timestamp": "{{ $json.timestamp }}"
  }]
}`,
          options: { timeout: 10000 },
        },
        id: 'w4-alert',
        name: 'Alert Discord',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1050, -100],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_MINING,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "embeds": [{
    "title": "📊 POH Daily Network Summary",
    "color": 3447003,
    "fields": [
      { "name": "Active Nodes", "value": "{{ $json.activeNodes }}", "inline": true },
      { "name": "Active Validators", "value": "{{ $json.activeValidators }}", "inline": true },
      { "name": "Total Nodes", "value": "{{ $json.totalNodes }}", "inline": true },
      { "name": "Weekly Pool", "value": "{{ $json.weeklyPool }} POH", "inline": true }
    ],
    "footer": { "text": "POH Network Health — Daily Summary" },
    "timestamp": "{{ $json.timestamp }}"
  }]
}`,
          options: { timeout: 10000 },
        },
        id: 'w4-summary',
        name: 'Daily Summary',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1050, 100],
      },
    ],
    connections: {
      'Every 4 Hours': { main: [[{ node: 'Get Network Stats', type: 'main', index: 0 }]] },
      'Get Network Stats': { main: [[{ node: 'Analyze Stats', type: 'main', index: 0 }]] },
      'Analyze Stats': { main: [[{ node: 'Alert or Summary?', type: 'main', index: 0 }]] },
      'Alert or Summary?': { main: [[{ node: 'Alert Discord', type: 'main', index: 0 }], [{ node: 'Daily Summary', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };
}

// ============================================================
// WORKFLOW 5: Token Transfer Watcher (Large Transfers)
// ============================================================
function buildTransferWatcherWorkflow() {
  return {
    name: 'POH: Large Transfer Watcher',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'minutes', minutesInterval: 10 }]
          }
        },
        id: 'w5-trigger',
        name: 'Every 10 Minutes',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          jsCode: `
const staticData = $getWorkflowStaticData('global');
const fromBlock = staticData.lastBlock || 0;
return [{ json: { fromBlock } }];
`
        },
        id: 'w5-get-block',
        name: 'Get Last Block',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [250, 0],
      },
      {
        parameters: {
          method: 'GET',
          url: `https://api.basescan.org/api?module=logs&action=getLogs&address=${TOKEN_CONTRACT}&topic0=${TOPIC_TRANSFER}&fromBlock={{ $json.fromBlock }}&toBlock=latest&apikey=${BASESCAN_API_KEY}`,
          options: { timeout: 15000 },
        },
        id: 'w5-get-logs',
        name: 'Get Transfer Logs',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [500, 0],
      },
      {
        parameters: {
          jsCode: `
const response = $input.first().json;
const staticData = $getWorkflowStaticData('global');

if (response.status !== '1' || !response.result || !Array.isArray(response.result) || response.result.length === 0) {
  return [{ json: { hasLargeTransfers: false, transfers: [] } }];
}

const logs = response.result;
const maxBlock = Math.max(...logs.map(l => parseInt(l.blockNumber, 16)));
staticData.lastBlock = maxBlock + 1;

const THRESHOLD = 10000; // 10,000 POH (18 decimals)
const THRESHOLD_WEI = BigInt(THRESHOLD) * BigInt(10 ** 18);

const largeTransfers = [];
for (const log of logs) {
  // Transfer(address from, address to, uint256 value)
  // topics[1] = from (padded), topics[2] = to (padded), data = value
  if (log.topics.length < 3) continue;

  const from = '0x' + log.topics[1].slice(26);
  const to = '0x' + log.topics[2].slice(26);
  const valueHex = log.data;

  let valueBigInt;
  try {
    valueBigInt = BigInt(valueHex);
  } catch {
    continue;
  }

  if (valueBigInt >= THRESHOLD_WEI) {
    const valueEth = Number(valueBigInt / BigInt(10 ** 14)) / 10000; // 4 decimal places
    largeTransfers.push({
      from: from.slice(0, 8) + '...' + from.slice(-4),
      fromFull: from,
      to: to.slice(0, 8) + '...' + to.slice(-4),
      toFull: to,
      amount: valueEth.toLocaleString(),
      blockNumber: parseInt(log.blockNumber, 16),
      txHash: log.transactionHash,
    });
  }
}

return [{ json: {
  hasLargeTransfers: largeTransfers.length > 0,
  transfers: largeTransfers,
  totalTransfers: logs.length,
  largeCount: largeTransfers.length
}}];
`
        },
        id: 'w5-parse',
        name: 'Filter Large Transfers',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [750, 0],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                id: 'has-large',
                leftValue: '={{ $json.hasLargeTransfers }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'equals', singleValue: true }
              }
            ],
            combinator: 'or'
          }
        },
        id: 'w5-if',
        name: 'Any Large Transfers?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [1000, 0],
      },
      {
        parameters: {
          jsCode: `
const data = $input.first().json;
const transfers = data.transfers;

const fields = transfers.slice(0, 10).map(t => ({
  name: \`\${t.amount} POH\`,
  value: \`From: \${t.from}\\nTo: \${t.to}\\n[View tx](https://basescan.org/tx/\${t.txHash})\`,
  inline: false
}));

return [{ json: {
  embeds: [{
    title: '🐋 POH Large Transfer Detected',
    color: 16776960,
    description: \`\${data.largeCount} transfer(s) over 10,000 POH detected (out of \${data.totalTransfers} total).\`,
    fields,
    footer: { text: 'POH Transfer Watcher' },
    timestamp: new Date().toISOString()
  }]
}}];
`
        },
        id: 'w5-format',
        name: 'Format Discord Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1250, -50],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_GOVERNANCE,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($json) }}',
          options: { timeout: 10000 },
        },
        id: 'w5-discord',
        name: 'Post to Discord',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1500, -50],
      },
    ],
    connections: {
      'Every 10 Minutes': { main: [[{ node: 'Get Last Block', type: 'main', index: 0 }]] },
      'Get Last Block': { main: [[{ node: 'Get Transfer Logs', type: 'main', index: 0 }]] },
      'Get Transfer Logs': { main: [[{ node: 'Filter Large Transfers', type: 'main', index: 0 }]] },
      'Filter Large Transfers': { main: [[{ node: 'Any Large Transfers?', type: 'main', index: 0 }]] },
      'Any Large Transfers?': { main: [[{ node: 'Format Discord Message', type: 'main', index: 0 }], []] },
      'Format Discord Message': { main: [[{ node: 'Post to Discord', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };
}

// ============================================================
// WORKFLOW 6: Ecosystem Service Health Monitor
// ============================================================
function buildServiceHealthWorkflow() {
  return {
    name: 'Ecosystem: Service Health Monitor',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'minutes', minutesInterval: 5 }]
          }
        },
        id: 'w6-trigger',
        name: 'Every 5 Minutes',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          jsCode: `
// Check all ecosystem services via HTTP
const services = [
  { name: 'JARVIS Bot', url: 'http://localhost:3000', method: 'tcp', note: 'Discord bot process' },
  { name: 'Mac API', url: 'http://localhost:8088/', expect: 'any' },
  { name: 'Wattson Mind Bridge', url: 'http://localhost:8081/', expect: 'any' },
  { name: 'Wattson Dashboard', url: 'http://localhost:8082/', expect: 200 },
  { name: 'Dream Artist', url: 'http://localhost:8089/', expect: 200 },
  { name: 'Family Dashboard', url: 'http://localhost:8090/', expect: 200 },
  { name: 'n8n', url: 'http://localhost:5678/healthz', expect: 200 },
  { name: 'OpenClaw Gateway', url: 'http://localhost:18789/', expect: 200 },
  { name: 'Pi Health', url: 'http://192.168.5.50:8085/health', expect: 200, external: true },
  { name: 'Phone Ollama', url: 'http://192.168.5.48:11434/api/tags', expect: 200, external: true },
];

const results = [];
for (const svc of services) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), svc.external ? 8000 : 5000);
    const res = await fetch(svc.url, { signal: controller.signal });
    clearTimeout(timeout);
    const up = svc.expect === 'any' ? (res.status < 500) : (res.status === svc.expect);
    results.push({ name: svc.name, status: res.status, up, url: svc.url });
  } catch (err) {
    results.push({ name: svc.name, status: 0, up: false, url: svc.url, error: err.message?.slice(0, 50) });
  }
}

// Compare with previous state to detect changes
const staticData = $getWorkflowStaticData('global');
const prevState = staticData.serviceState || {};
const changes = [];
const down = [];

for (const r of results) {
  const wasUp = prevState[r.name] !== false; // default to "was up" if no history
  if (!r.up) down.push(r);
  if (r.up && !wasUp) changes.push({ name: r.name, change: 'RECOVERED' });
  if (!r.up && wasUp) changes.push({ name: r.name, change: 'DOWN' });
  prevState[r.name] = r.up;
}

staticData.serviceState = prevState;
staticData.lastCheck = new Date().toISOString();

const upCount = results.filter(r => r.up).length;
const totalCount = results.length;

return [{ json: {
  results,
  changes,
  down,
  upCount,
  totalCount,
  hasChanges: changes.length > 0,
  hasDown: down.length > 0,
  allHealthy: upCount === totalCount,
  timestamp: new Date().toISOString()
}}];
`
        },
        id: 'w6-check',
        name: 'Check All Services',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [250, 0],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                id: 'has-changes',
                leftValue: '={{ $json.hasChanges }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'equals', singleValue: true }
              }
            ],
            combinator: 'or'
          }
        },
        id: 'w6-if',
        name: 'State Changed?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [500, 0],
      },
      {
        parameters: {
          jsCode: `
const data = $input.first().json;
const changes = data.changes;
const results = data.results;

// Build status lines
const statusLines = results.map(r =>
  (r.up ? '\\u2705' : '\\u274c') + ' ' + r.name + (r.error ? ' — ' + r.error : '')
).join('\\n');

// Build change summary
const changeSummary = changes.map(c =>
  (c.change === 'RECOVERED' ? '\\u2705 RECOVERED' : '\\u26a0\\ufe0f DOWN') + ': **' + c.name + '**'
).join('\\n');

const hasNewDown = changes.some(c => c.change === 'DOWN');
const color = hasNewDown ? 16711680 : 3066993; // red if new down, green if recovery

return [{ json: {
  embeds: [{
    title: hasNewDown ? '\\u26a0\\ufe0f Service Alert — Something Went Down' : '\\u2705 Service Recovery',
    color,
    description: changeSummary,
    fields: [
      { name: 'Full Status (' + data.upCount + '/' + data.totalCount + ' up)', value: statusLines, inline: false }
    ],
    footer: { text: 'Ecosystem Health Monitor' },
    timestamp: data.timestamp
  }]
}}];
`
        },
        id: 'w6-format',
        name: 'Format Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [750, -50],
      },
      {
        parameters: {
          method: 'POST',
          url: DISCORD_WEBHOOK_JARVIS,
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Content-Type', value: 'application/json' }]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($json) }}',
          options: { timeout: 10000 },
        },
        id: 'w6-discord',
        name: 'Post to Discord',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1000, -50],
      },
    ],
    connections: {
      'Every 5 Minutes': { main: [[{ node: 'Check All Services', type: 'main', index: 0 }]] },
      'Check All Services': { main: [[{ node: 'State Changed?', type: 'main', index: 0 }]] },
      'State Changed?': { main: [[{ node: 'Format Alert', type: 'main', index: 0 }], []] },
      'Format Alert': { main: [[{ node: 'Post to Discord', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };
}

// ============================================================
// DEPLOYMENT
// ============================================================
async function main() {
  console.log('POH n8n Workflow Deployer');
  console.log('========================\n');

  // Check for placeholder values
  const placeholders = [];
  if (BASESCAN_API_KEY.includes('REPLACE')) placeholders.push('BASESCAN_API_KEY');
  if (DISCORD_WEBHOOK_GOVERNANCE.includes('REPLACE')) placeholders.push('DISCORD_WEBHOOK_GOVERNANCE');
  if (DISCORD_WEBHOOK_MINING.includes('REPLACE')) placeholders.push('DISCORD_WEBHOOK_MINING');
  if (DISCORD_WEBHOOK_JARVIS.includes('REPLACE')) placeholders.push('DISCORD_WEBHOOK_JARVIS');

  if (placeholders.length > 0) {
    console.log('⚠️  WARNING: The following env vars still have placeholder values:');
    placeholders.forEach(p => console.log(`   - ${p}`));
    console.log('   Workflows will be created but won\'t work until these are filled in.\n');
  }

  // Optionally delete existing POH workflows
  if (DELETE_EXISTING) {
    console.log('Deleting existing POH workflows...');
    const listRes = await apiCall('GET', '/api/v1/workflows');
    if (listRes.data?.data) {
      for (const wf of listRes.data.data) {
        if (wf.name.startsWith('POH:') || wf.name.startsWith('Ecosystem:')) {
          await apiCall('DELETE', `/api/v1/workflows/${wf.id}`);
          console.log(`  Deleted: ${wf.name} (id:${wf.id})`);
        }
      }
    }
    console.log('');
  }

  const workflows = [
    { name: 'Wallet Balance Monitor', build: buildWalletBalanceWorkflow },
    { name: 'Charity Treasury Monitor', build: buildCharityMonitorWorkflow },
    { name: 'Governance Proposal Monitor', build: buildGovernanceMonitorWorkflow },
    { name: 'Network Health Dashboard', build: buildNetworkHealthWorkflow },
    { name: 'Large Transfer Watcher', build: buildTransferWatcherWorkflow },
    { name: 'Service Health Monitor', build: buildServiceHealthWorkflow },
  ];

  const created = [];

  for (const wf of workflows) {
    process.stdout.write(`Creating ${wf.name}... `);
    const body = wf.build();
    const res = await apiCall('POST', '/api/v1/workflows', body);

    if (res.status === 200 || res.status === 201) {
      const id = res.data.id;
      console.log(`✓ (id: ${id})`);
      created.push({ id, name: wf.name });
    } else {
      console.log(`✗ (status: ${res.status})`);
      console.log(`  Error: ${JSON.stringify(res.data).slice(0, 200)}`);
    }
  }

  console.log('');

  // Activate if requested
  if (ACTIVATE && created.length > 0) {
    console.log('Activating workflows...');
    for (const wf of created) {
      process.stdout.write(`  Activating ${wf.name}... `);
      const res = await apiCall('POST', `/api/v1/workflows/${wf.id}/activate`);
      if (res.status === 200) {
        console.log('✓');
      } else {
        console.log(`✗ (${res.status}: ${JSON.stringify(res.data).slice(0, 100)})`);
      }
    }
    console.log('');
  }

  console.log('Summary:');
  console.log(`  Created: ${created.length}/5 workflows`);
  console.log(`  Activated: ${ACTIVATE ? 'yes' : 'no (use --activate to auto-activate)'}`);
  if (placeholders.length > 0) {
    console.log(`  ⚠️  Fill in ${placeholders.length} placeholder(s) in ~/.n8n/.env then restart n8n`);
  }
  console.log(`\n  View at: http://localhost:5678\n`);
}

main().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});
