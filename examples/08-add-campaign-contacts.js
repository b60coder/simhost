// npm run campaign:contacts -- CAMPAIGN_UUID contacts.json
// contacts.json: [{ "phone_number": "+12025550123", "first_name": "Sam" }]
import { readFile } from 'node:fs/promises';
import { api, arg, phone, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const campaignUuid = uuid(arg(0, 'campaign UUID'));
  const contactRows = JSON.parse(await readFile(arg(1, 'contacts JSON file'), 'utf8'));
  if (!Array.isArray(contactRows) || !contactRows.length) throw new Error('Contacts file must contain a non-empty JSON array.');
  for (const row of contactRows) {
    if (!row || typeof row !== 'object' || typeof row.phone_number !== 'string') throw new Error('Each contact needs a phone_number string.');
    phone(row.phone_number);
  }
  // The endpoint REPLACES the recipient list. It does not append or start sending.
  print(await api(`/user/api/v1/sms-campaigns/${campaignUuid}/contacts`, {
    method: 'POST', body: { contactRows },
  }));
  console.log('Recipients replaced and validated. Review accepted count before starting the campaign.');
});
