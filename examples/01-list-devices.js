// Run from the repository folder: npm run devices
// This read-only request lists devices assigned to your Simhost user.
const token = process.env.SIMHOST_API_TOKEN?.trim();
const baseUrl = process.env.SIMHOST_API_BASE_URL?.trim();

try {
  if (!token || token === 'PASTE_YOUR_FULL_TOKEN_HERE') {
    throw new Error('Set SIMHOST_API_TOKEN in .env to the full token copied from Simhost.');
  }
  if (/^Bearer\s/i.test(token)) {
    throw new Error('Remove the word Bearer from SIMHOST_API_TOKEN; this script adds it.');
  }
  if (!baseUrl) throw new Error('Set SIMHOST_API_BASE_URL in .env.');
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/user/api/v1/devices`);
  if (url.protocol !== 'https:') throw new Error('Use an HTTPS API base URL.');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  });

  if (!response.ok) {
    const hints = {
      401: 'Check that your token is complete, has not expired, and has not been revoked.',
      403: 'Your user may not have permission for this operation.',
      404: 'Check the API base URL and endpoint path.',
      503: 'The service is temporarily unavailable. Try again later.',
    };
    throw new Error(`HTTP ${response.status}. ${hints[response.status] || 'See the API documentation for this status.'}`);
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Expected JSON. Check that the base URL includes /api.');
  }
  const data = await response.json();
  console.log(`HTTP ${response.status} — authentication succeeded.`);
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error(`Device request failed: ${error.message}`);
  process.exitCode = 1;
}
