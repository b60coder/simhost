// npm run sms:send -- DEVICE_UUID "+12025550123" "Hello from Simhost" REQUEST_ID
import { api, arg, phone, print, run, uuid } from '../lib/simhost-client.js';

await run(async () => {
  const deviceUuid = uuid(arg(0, 'device UUID'));
  const destination = phone(arg(1, 'destination phone number'));
  const message = arg(2, 'message text');
  // Keep this ID for this exact SMS. Reuse it if checking/retrying an uncertain request.
  // Use a new ID for a genuinely new message, even if the text is identical.
  const clientRequestId = arg(3, 'stable request ID');
  console.log(`Sending with clientRequestId=${clientRequestId}`);
  const result = await api(`/user/api/v1/devices/${deviceUuid}/sms/send`, {
    method: 'POST', body: { destination, message, clientRequestId }, timeoutMs: 180_000,
  });
  print(result);
  console.log('Inspect the returned status. HTTP success alone does not prove handset delivery.');
});
