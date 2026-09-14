// Shared authentication and JSON handling for the small examples.
// No automatic retries: a timed-out write may already have reached the server.
export async function api(path, { method = 'GET', body, timeoutMs = 30_000 } = {}) {
  const token = process.env.SIMHOST_API_TOKEN?.trim();
  const base = process.env.SIMHOST_API_BASE_URL?.trim();
  if (!token || token === 'PASTE_YOUR_FULL_TOKEN_HERE') throw new Error('Set SIMHOST_API_TOKEN in .env.');
  if (/^Bearer\s/i.test(token)) throw new Error('Store only the token in .env, without Bearer.');
  if (!base) throw new Error('Set SIMHOST_API_BASE_URL in .env.');
  if (!path.startsWith('/user/api/v1/')) throw new Error('Expected a Simhost User API path.');
  const url = new URL(`${base.replace(/\/+$/, '')}${path}`);
  if (url.protocol !== 'https:') throw new Error('Use an HTTPS API base URL.');
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'error',
  });
  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json() : null;
  if (!response.ok || data?.ok === false) {
    const detail = String(data?.error || data?.message || 'Check the API response status and your configuration.')
      .replaceAll(token, '[REDACTED]');
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }
  if (data === null) throw new Error('Expected JSON. Check that the base URL includes /api.');
  return data;
}

export function arg(index, name) {
  const value = process.argv[index + 2]?.trim();
  if (!value) throw new Error(`Missing ${name}. See the command for this example in README.md.`);
  return value;
}

export function uuid(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('Replace DEVICE_UUID or CAMPAIGN_UUID with the actual UUID from the API.');
  }
  return value;
}

export function phone(value) {
  if (!/^\+[1-9]\d{9,14}$/.test(value)) throw new Error('Use an international number, e.g. +12025550123 (10–15 digits).');
  return value;
}

export const print = (data) => console.log(JSON.stringify(data, null, 2));

export async function run(main) {
  try { await main(); }
  catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
