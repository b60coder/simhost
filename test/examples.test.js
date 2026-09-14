import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const id = '123e4567-e89b-12d3-a456-426614174000';
const iccid = '8901000000000000001';
function example(file, args, expected) {
  // Each example runs in a fresh process. Unexpected requests fail before any network use.
  const source = `
    import assert from 'node:assert/strict';
    const expected = ${JSON.stringify(expected)};
    process.argv = ['node', ${JSON.stringify(file)}, ...${JSON.stringify(args)}];
    process.env.SIMHOST_API_TOKEN = 'fake-test-token';
    process.env.SIMHOST_API_BASE_URL = 'https://app.simhost.io/api/';
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      const next = expected[calls++];
      assert.ok(next, 'Unexpected API request');
      assert.equal(url.href, 'https://app.simhost.io/api' + next.path);
      assert.equal(options.method || 'GET', next.method || 'GET');
      assert.equal(options.headers.Authorization, 'Bearer fake-test-token');
      assert.equal(options.redirect, 'error');
      assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, next.body);
      return new Response(JSON.stringify(next.response || {ok:true}), {
        status: next.status || 200, headers: {'Content-Type':'application/json'}
      });
    };
    await import(${JSON.stringify(new URL(`../examples/${file}`, import.meta.url).href)});
    assert.equal(calls, expected.length, 'Missing API request');
  `;
  return spawnSync(process.execPath, ['--input-type=module', '-e', source], { encoding: 'utf8' });
}
function succeeds(result) { assert.equal(result.status, 0, result.stderr); }

test('lists assigned devices and supports live status', () => {
  for (const live of [false, true]) succeeds(example('01-list-devices.js', live ? ['--live'] : [], [
    { path: `/user/api/v1/devices${live ? '/live-status' : ''}`, response: {devices: []} },
  ]));
});
test('sends SMS with the caller-provided stable request ID', () => {
  succeeds(example('02-send-sms.js', [id, '+12025550123', 'Hello', 'stable-id'], [{
    path: `/user/api/v1/devices/${id}/sms/send`, method: 'POST',
    body: {destination: '+12025550123', message: 'Hello', clientRequestId: 'stable-id'},
  }]));
  const result = example('02-send-sms.js', [id, '+12025550123', 'Hello'], []);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing stable request ID/);
});
test('lists profiles for all devices and labels cached inventory', () => {
  const result = example('03-list-esim-profiles.js', ['all'], [
    { path: '/user/api/v1/devices/assigned', response: {devices: [
      {device_uuid: id, euicc_capable: false}, {device_uuid: id, euicc_capable: true},
    ]}},
    { path: `/user/api/v1/devices/${id}/esim`, response: {profiles: {cached: true, profiles: []}, managementAvailable: false}},
  ]);
  succeeds(result);
  assert.match(result.stdout, /Cached inventory/);
  assert.match(result.stdout, /physical SIM/);
});
test('selects the requested eSIM without reporting pending recovery as ready', () => {
  const result = example('04-enable-esim-profile.js', [id, iccid], [{
    path: `/user/api/v1/devices/${id}/esim`, method: 'POST', body: {action:'select', iccid},
    response: {selectedIccid: iccid, network: {ready: false}},
  }]);
  succeeds(result);
  assert.match(result.stdout, /network readiness is not confirmed/);
});
test('creates a draft without starting it', () => {
  succeeds(example('05-create-sms-campaign.js', ['Test', id, 'Hello <first_name>'], [{
    path: '/user/api/v1/sms-campaigns', method: 'POST',
    body: {name: 'Test', status:'draft', deviceUuids:[id], config:{message:'Hello <first_name>'}},
    response: {campaign: {campaignUuid:id}},
  }]));
});
test('starts only the specified campaign', () => {
  succeeds(example('06-start-sms-campaign.js', [id], [{
    path: `/user/api/v1/sms-campaigns/${id}/start`, method:'POST', body:{},
  }]));
});
test('monitor stops on indeterminate outcomes and preserves summary totals', () => {
  const result = example('07-monitor-sms-campaign.js', [id, '12'], [
    {path: `/user/api/v1/sms-campaigns/${id}`, response:{campaign:{status:'running'}}},
    {path: `/user/api/v1/sms-campaigns/${id}/results`, response:{summary:{status:'indeterminate',total:2000,indeterminate:1},results:[]}},
  ]);
  succeeds(result);
  assert.match(result.stdout, /"total": 2000/);
  assert.match(result.stdout, /Monitoring stopped at status=indeterminate/);
});
test('imports personalized recipients and rejects invalid numbers before requesting', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'simhost-test-'));
  const file = join(dir, 'contacts.json');
  try {
    const contactRows = [{phone_number:'+12025550123',first_name:'Sam'}];
    await writeFile(file, JSON.stringify(contactRows));
    succeeds(example('08-add-campaign-contacts.js', [id,file], [{
      path:`/user/api/v1/sms-campaigns/${id}/contacts`,method:'POST',body:{contactRows},
    }]));
    await writeFile(file, JSON.stringify([{phone_number:'invalid'}]));
    const result = example('08-add-campaign-contacts.js',[id,file],[]);
    assert.equal(result.status,1);
    assert.match(result.stderr,/international number/);
  } finally { await rm(dir, {recursive:true,force:true}); }
});
test('API errors are reported once without retrying or exposing the token', () => {
  const result = example('06-start-sms-campaign.js',[id],[{
    path:`/user/api/v1/sms-campaigns/${id}/start`,method:'POST',body:{},status:401,
    response:{error:'Rejected fake-test-token'},
  }]);
  assert.equal(result.status,1);
  assert.match(result.stderr,/HTTP 401/);
  assert.doesNotMatch(result.stderr,/fake-test-token/);
});
