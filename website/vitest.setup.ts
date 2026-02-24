import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CHAIN_ID = '84532';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';
process.env.OAUTH_STATE_SECRET = 'test-oauth-secret';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.STRAVA_CLIENT_ID = 'test-strava-client-id';
process.env.STRAVA_CLIENT_SECRET = 'test-strava-secret';
process.env.FITBIT_CLIENT_ID = 'test-fitbit-client-id';
process.env.FITBIT_CLIENT_SECRET = 'test-fitbit-secret';

// Mock crypto.subtle for Node environment
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  globalThis.crypto = {
    subtle: crypto.webcrypto.subtle,
    getRandomValues: (arr: Uint8Array) => crypto.randomFillSync(arr),
  } as unknown as Crypto;
}
