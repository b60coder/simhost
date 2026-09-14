// npm run campaign:start -- CAMPAIGN_UUID
import { api, arg, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const campaignUuid = uuid(arg(0, 'campaign UUID'));
  // This request starts sending the recipients already added to this campaign.
  print(await api(`/user/api/v1/sms-campaigns/${campaignUuid}/start`, { method: 'POST', body: {} }));
  console.log('Start request accepted. Run campaign:monitor to follow execution.');
});
