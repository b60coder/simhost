// npm run esim:enable -- DEVICE_UUID PROFILE_ICCID
import { api, arg, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const deviceUuid = uuid(arg(0, 'device UUID'));
  const iccid = arg(1, 'installed profile ICCID'); // Keep ICCIDs as strings, not numbers.
  if (!/^\d{18,22}$/.test(iccid)) throw new Error('The profile ICCID must contain 18–22 digits.');
  // Select an installed profile; do not disable/delete the old profile first.
  const result = await api(`/user/api/v1/devices/${deviceUuid}/esim`, {
    method: 'POST', body: { action: 'select', iccid }, timeoutMs: 360_000,
  });
  print(result);
  if (result.selectedIccid !== iccid) throw new Error('The response did not confirm the requested ICCID. List profiles before retrying.');
  if (result.network?.ready !== true) {
    console.log('Profile selected; network readiness is not confirmed. Check live device status before sending SMS.');
  }
});
