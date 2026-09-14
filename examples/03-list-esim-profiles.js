// npm run esim:list -- DEVICE_UUID
// Or: npm run esim:list -- all
import { api, arg, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const target = arg(0, 'device UUID or all');
  const devices = target === 'all'
    ? (await api('/user/api/v1/devices/assigned')).devices
    : [{ device_uuid: uuid(target) }];
  if (!Array.isArray(devices)) throw new Error('Expected a devices array.');
  if (!devices.length) console.log('No devices are assigned to this user.');
  // Sequential requests keep the load on physical eUICC readers low.
  for (const device of devices) {
    const id = device.device_uuid || device.deviceUuid;
    if (device.euicc_capable === false) {
      console.log(`${id}: physical SIM; no eSIM profiles.`);
      continue;
    }
    try {
      const result = await api(`/user/api/v1/devices/${uuid(id)}/esim`, { timeoutMs: 180_000 });
      console.log(`Device ${id}`);
      print(result);
      if (result.managementAvailable === false || result.profiles?.cached) {
        console.log('Cached inventory: this is not proof of the profiles currently on the reader.');
      }
    } catch (error) {
      console.error(`${id}: ${error.message}`);
      process.exitCode = 1; // Keep listing the remaining devices, but report partial failure.
    }
  }
});
