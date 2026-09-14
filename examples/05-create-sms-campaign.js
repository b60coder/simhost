// npm run campaign:create -- "My first campaign" DEVICE_UUID "Hello <first_name>"
import { api, arg, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const name = arg(0, 'campaign name');
  const deviceUuids = [uuid(arg(1, 'assigned device UUID'))];
  const message = arg(2, 'message template');
  const result = await api('/user/api/v1/sms-campaigns', {
    method: 'POST', body: { name, status: 'draft', deviceUuids, config: { message } },
  });
  print(result);
  if (!result.campaign?.campaignUuid) throw new Error('Missing campaign UUID. Check your campaign list before creating another.');
  console.log(`Save campaign UUID: ${result.campaign.campaignUuid}`);
  console.log('Draft created. Next: campaign:contacts, then campaign:start. No messages have been triggered by this script.');
});
