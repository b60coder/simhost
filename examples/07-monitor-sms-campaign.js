// npm run campaign:monitor -- CAMPAIGN_UUID [NUMBER_OF_CHECKS]
// Default: one snapshot. With a count > 1, check every 10 seconds. Ctrl+C stops locally.
import { setTimeout as sleep } from 'node:timers/promises';
import { api, arg, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const campaignUuid = uuid(arg(0, 'campaign UUID'));
  const checks = Number(process.argv[3] || 1);
  if (!Number.isInteger(checks) || checks < 1 || checks > 360) throw new Error('NUMBER_OF_CHECKS must be an integer from 1 to 360.');
  for (let i = 0; i < checks; i++) {
    const campaign = await api(`/user/api/v1/sms-campaigns/${campaignUuid}`);
    const results = await api(`/user/api/v1/sms-campaigns/${campaignUuid}/results`);
    console.log(`\nCheck ${i + 1}/${checks} at ${new Date().toISOString()}`);
    print({ campaign: campaign.campaign, summary: results.summary, results: results.results });
    console.log('sent = carrier accepted, not confirmed delivery. indeterminate = outcome needs reconciliation.');
    console.log('Counts are execution progress, not a currency charge or SMS-segment bill. Results may be capped at 1,000 rows.');
    const status = results.summary?.status || campaign.campaign?.status;
    if (['completed', 'cancelled', 'failed', 'indeterminate', 'no_device'].includes(status)) {
      console.log(`Monitoring stopped at status=${status}. Inspect errors/indeterminate results before retrying anything.`);
      break;
    }
    if (i + 1 < checks) await sleep(10_000);
  }
});
