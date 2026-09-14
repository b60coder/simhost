# Simhost API examples

Learn how to connect JavaScript to the Simhost User API. Start by creating an API token, saving it locally, and making a read-only request to list your assigned devices.

**An API token is a secret credential that lets a script act as your Simhost user.** Your script sends it with each API request. You do not put your Simhost password in the script.

## Start here

1. [Find the API Token page](#1-find-the-api-token-page).
2. [Create and copy your token](#2-create-and-copy-your-token).
3. [Save it in `.env`](#3-save-your-token-in-env).
4. [Run your first JavaScript request](#4-run-your-first-javascript-request).
5. [Use the token directly in an API request](#5-use-the-token-directly-in-an-api-request).
6. [Fix common setup problems](#6-troubleshooting).

You need a Simhost account, access to the [Simhost web app](https://app.simhost.io), and Node.js 22 or later for the JavaScript example. You can check Node.js in a terminal with `node --version`. Get Node.js from the [official download page](https://nodejs.org/en/download) if needed.

The diagrams below are **annotated UI illustrations based on the application source**, not screenshots of a live account. Layout may vary by screen size or deployed version. All token values shown are placeholders.

| Color and label | Meaning |
| --- | --- |
| **Blue · Navigate** | Where to click in the web app |
| **Purple · Enter / Create** | Fields to fill in and the button that creates a token |
| **Amber · Copy once** | Copy the full token before refreshing or leaving |
| **Green · Use** | Save the token locally and send it in an API request |

Each diagram also uses numbered labels, so you can follow the steps without relying on color alone.

## 1. Find the API Token page

![Location guide: open the account menu in the top-right corner, select Settings, then select API Key in the Settings navigation. The destination page is titled API Token.](docs/images/01-find-api-token.svg)

1. Sign in to [app.simhost.io](https://app.simhost.io).
2. Click your **name or initials in the top-right corner** to open the account menu. On a narrow screen, only your initials may be visible.
3. Click **Settings**.
4. In the Settings navigation, click **API Key**.
5. Confirm that the page heading is **API Token**. The menu says **API Key**, but the page says **API Token**; both refer to this feature.

Once signed in, you can also open the [API Token page directly](https://app.simhost.io/api-token).

**Choose the Simhost “API Key” navigation item.** The Settings page also has an OpenAI integration field used for AI-written SMS drafts. That field does not create a Simhost API token.

## 2. Create and copy your token

![Creation guide: fill in Token name and Expires on, click the plus Token button, then copy the newly created token using the copy icon in its row.](docs/images/02-create-api-token.svg)

1. Under **Token name**, enter a descriptive label, such as `My first API example`. This is a label to help you recognize the token later; it is not the token itself.
2. Under **Expires on**, choose a future date. The current UI preselects a date roughly 30 days ahead. After expiration, scripts using this token will need a replacement token.
3. Click the purple **+ Token** button. If it is disabled, check that you entered a name and selected an expiry date.
4. A new row appears in the table. The app displays the message: **“API token created. Copy it now; it is shown only once.”**
5. In that new row, click the **copy icon** under **Action**, beside the trash icon. Copy the **full token**, not its name or identifier.
6. Save the token in your local `.env` file as described below **before** clicking Refresh, reloading the page, or navigating away.

**The full token is shown only immediately after creation.** Later, the API Token column may say `Hidden after creation`. That text is not a credential, and copying it will not work. If you did not save the original token, create a replacement and revoke the unused one.

To revoke a token, find its row, click the **trash icon**, and confirm. Scripts using that token will no longer authenticate. When replacing a token used by an existing integration, update the integration and verify the replacement before revoking the old token.

## 3. Save your token in `.env`

The filename is **`.env`**: a leading dot, followed by `env`. It is not `.evn`, `env`, or `.env.txt`.

![Token flow: paste the full copied token into SIMHOST_API_TOKEN in the local .env file. Node loads that environment variable. JavaScript adds Bearer and sends the Authorization header to the Simhost API.](docs/images/03-token-to-request.svg)

### Download the examples

Clone this repository and open its folder in your terminal:

```sh
git clone https://github.com/b60coder/simhost.git
cd simhost
```

If you already downloaded it, open that folder instead. Alternatively, use GitHub's **Code → Download ZIP**, extract the ZIP, and open the extracted folder in your terminal.

### Create the local settings file

On macOS or Linux:

```sh
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `.env` in your code editor. Replace `PASTE_YOUR_FULL_TOKEN_HERE` with the full token you just copied:

```dotenv
SIMHOST_API_BASE_URL=https://app.simhost.io/api
SIMHOST_API_TOKEN=PASTE_YOUR_FULL_TOKEN_HERE
```

| Setting | What to enter |
| --- | --- |
| `SIMHOST_API_BASE_URL` | Use `https://app.simhost.io/api` for the hosted service. Keep the `/api` suffix and do not append an endpoint here. |
| `SIMHOST_API_TOKEN` | The full copied token only. Do not include `Bearer`, the token label, or the entire `Authorization` header. |

Keep the token on one line. Save the file in the repository root, next to `package.json`:

```text
simhost/
├── .env               ← your local token goes here
├── .env.example       ← placeholders only; safe to share
├── .gitignore         ← excludes .env from Git
├── package.json
├── README.md
├── docs/images/
└── examples/
    ├── 01-list-devices.js
    └── … additional examples below
```

**Keep `.env` private.** This repository's `.gitignore` excludes it. Never paste a real token into GitHub, screenshots, support messages, or browser frontend code. If you accidentally share it, revoke it and create a replacement. You can verify the ignore rule with `git check-ignore .env`; it should print `.env`.

## 4. Run your first JavaScript request

From the repository folder, run:

```sh
npm run devices
```

No `npm install` is needed for this example: it uses Node.js built-in `fetch`. The equivalent command is:

```sh
node --env-file=.env examples/01-list-devices.js
```

The `--env-file=.env` option tells Node.js to load the settings file. Simply creating `.env` does not make Node.js read it automatically.

The script calls:

```http
GET https://app.simhost.io/api/user/api/v1/devices
Authorization: Bearer YOUR_FULL_TOKEN
Accept: application/json
```

This request lists devices assigned to your user. It does not send SMS, switch eSIM profiles, or start campaigns. A successful result prints:

```text
HTTP 200 — authentication succeeded.
```

The JSON response follows that line. Its contents depend on your account. An empty device list can be a valid result when no devices are assigned to you; device assignment and live availability are separate things.

The key lines in [the example](examples/01-list-devices.js) are:

```js
const token = process.env.SIMHOST_API_TOKEN;

// The script adds "Bearer " here. Store only the token itself in .env.
const response = await fetch(
  'https://app.simhost.io/api/user/api/v1/devices',
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  },
);
```

There is exactly one space between `Bearer` and the token. The credential belongs in an HTTP **header**, not in the request body. Use this code in Node.js on your computer or backend; do not embed a private token in a public website.

## 5. Use the token directly in an API request

### In Postman or a similar API client

1. Create a new HTTP request.
2. Set the method to **GET**.
3. Enter `https://app.simhost.io/api/user/api/v1/devices` as the URL.
4. Open the **Authorization** tab and choose **Bearer Token**.
5. Paste the full token into the **Token** field. Paste only the token: the client adds `Bearer` for you.
6. Click **Send** and inspect the status code and JSON response.

If you enter headers manually instead, use a header named `Authorization` with the value `Bearer YOUR_FULL_TOKEN`. Choose either the Bearer Token form or the manual header, so you do not add duplicate authentication headers.

### With cURL on macOS or Linux

If you used the two-line `.env` format above, this command reads it, exports the values for this command group, and makes the same read-only request:

```sh
(
  set -a
  . ./.env
  set +a
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer ${SIMHOST_API_TOKEN}" \
    --header 'Accept: application/json' \
    "${SIMHOST_API_BASE_URL}/user/api/v1/devices"
)
```

Run it from the repository folder. Source only your own trusted `.env` file: shell sourcing interprets its contents as commands. This shell example is for macOS/Linux; use the Node.js command above on Windows.

### Where exactly does the token go?

| Place | Correct value |
| --- | --- |
| `.env` variable `SIMHOST_API_TOKEN` | `YOUR_FULL_TOKEN` |
| Postman **Bearer Token → Token** field | `YOUR_FULL_TOKEN` |
| HTTP **Authorization** header | `Bearer YOUR_FULL_TOKEN` |
| Token name in the Simhost UI | A label such as `My first API example`; never use this label as authentication |

`YOUR_FULL_TOKEN` and `PASTE_YOUR_FULL_TOKEN_HERE` are placeholders. Neither will authenticate.

## 6. Troubleshooting

| What you see | What to check |
| --- | --- |
| `node: command not found` or Node is not recognized | Install Node.js 22 or later, then reopen your terminal. |
| `bad option: --env-file` | Your Node.js version is too old. Check `node --version` and use Node.js 22 or later. |
| `.env` cannot be found | Run from the repository root. Confirm the name is `.env`, not `.evn` or `.env.txt`. |
| `Set SIMHOST_API_TOKEN…` | Replace the placeholder in `.env` with your full token and save the file. |
| HTTP **401** | The token may be missing, incomplete, expired, or revoked. Do not use `Hidden after creation`, a token label, or a token UUID. Create a replacement if needed. |
| HTTP **403** | Check whether your user has access to the requested operation. |
| HTTP **404**, or HTML instead of JSON | Check the URL. For this example, the full URL ends in `/api/user/api/v1/devices`. |
| HTTP **503**, network error, or timeout | Check connectivity and service availability, then retry the read-only device request. |
| Success, but no devices | Authentication worked; check whether devices have been assigned to your user. |
| You changed `.env` but the old token is still used | A previously exported `SIMHOST_API_TOKEN` can override the file. On macOS/Linux run `unset SIMHOST_API_TOKEN`; on PowerShell run `Remove-Item Env:SIMHOST_API_TOKEN -ErrorAction SilentlyContinue`, then rerun. |
| The token disappeared after Refresh | This is expected. Full tokens are available only when created. Use your saved copy or create a replacement. |

When requesting help, share the command, endpoint, status code, and a redacted error message. Remove tokens, phone numbers, and other private account data.

## Run the examples

All eight examples below are included. Run commands from the repository folder after completing the `.env` setup above. Replace uppercase placeholders with your own values. Keep quotes around messages and campaign names. The `--` after an npm script name forwards the remaining arguments to JavaScript.

| Example | Command | What it does |
| --- | --- | --- |
| [01 · List devices](examples/01-list-devices.js) | `npm run devices` | List devices assigned to your user |
| [01 · Check live status](examples/01-list-devices.js) | `npm run devices -- --live` | Request refreshed availability and registration status |
| [02 · Send SMS](examples/02-send-sms.js) | `npm run sms:send -- DEVICE_UUID "+12025550123" "Hello from Simhost" REQUEST_ID` | Send one SMS with a stable request ID |
| [03 · List eSIM profiles](examples/03-list-esim-profiles.js) | `npm run esim:list -- DEVICE_UUID` | Inspect installed profiles on one device |
| [03 · Inspect all devices](examples/03-list-esim-profiles.js) | `npm run esim:list -- all` | Inspect each assigned device sequentially |
| [04 · Enable an eSIM](examples/04-enable-esim-profile.js) | `npm run esim:enable -- DEVICE_UUID PROFILE_ICCID` | Select an installed profile within that device |
| [05 · Create a campaign](examples/05-create-sms-campaign.js) | `npm run campaign:create -- "First campaign" DEVICE_UUID "Hello <first_name>"` | Create a draft without sending |
| [08 · Add recipients](examples/08-add-campaign-contacts.js) | `npm run campaign:contacts -- CAMPAIGN_UUID contacts.json` | Replace and validate the campaign recipient list |
| [06 · Start a campaign](examples/06-start-sms-campaign.js) | `npm run campaign:start -- CAMPAIGN_UUID` | Begin sending to the prepared recipients |
| [07 · Monitor a campaign](examples/07-monitor-sms-campaign.js) | `npm run campaign:monitor -- CAMPAIGN_UUID 12` | Check progress up to 12 times, 10 seconds apart |

### A. Choose a device and send one SMS

1. Run `npm run devices -- --live`.
2. Find your device's `device_uuid` in the response (some responses use `deviceUuid`). Keep it for the commands below. A UUID identifies the **device**, while an ICCID identifies a **SIM profile**; do not substitute one for the other.
3. Inspect `enabled`, `registered`, `live`, `operationalStatus`, and `statusCheckedAt` when returned. An assigned device is not necessarily ready to send. Missing or unavailable live status should not be treated as ready. The API makes the final readiness check at send time.
4. Generate a request ID with this command and save its output:

```sh
node -e "console.log(require('node:crypto').randomUUID())"
```

5. Replace `DEVICE_UUID` and `REQUEST_ID` and use a destination you control or have permission to message:

```sh
npm run sms:send -- DEVICE_UUID "+12025550123" "Hello from Simhost" REQUEST_ID
```

The number above is illustrative. Replace it with the actual destination in international format. This command sends a real SMS and may consume your plan allowance.

The request uses `POST /user/api/v1/devices/{deviceUuid}/sms/send` with:

```json
{
  "destination": "+12025550123",
  "message": "Hello from Simhost",
  "clientRequestId": "YOUR_SAVED_REQUEST_ID"
}
```

**Keep the same request ID for the same SMS if the result is uncertain.** A timeout does not prove that sending failed. Do not generate a new ID and blindly resend. Inspect the status/history first; if replaying the request, keep its device, destination, text, and ID unchanged. A new intentional message needs a new request ID. The examples never automatically retry writes.

### B. List profiles and switch the enabled eSIM

```sh
npm run esim:list -- DEVICE_UUID
npm run esim:list -- all
```

The script calls `GET /user/api/v1/devices/{deviceUuid}/esim`. Inspect `selectedIccid`, `selectionValid`, `managementAvailable`, and the profile list. Depending on the response, that list is in `profiles` or `profiles.profiles`; the script prints the full response to preserve those details. A profile can expose `iccid`, `selected`, `enabled`, and `state`.

If `managementAvailable` is false or `profiles.cached` is true, you are seeing cached information, not a fresh inventory of the card. Resolve the reader/service problem before switching profiles. The `all` command continues past individual device errors and exits with a nonzero status if any request failed. Devices explicitly marked as physical SIMs are skipped.

Copy the **ICCID of an installed alternative profile**, then run:

```sh
npm run esim:enable -- DEVICE_UUID PROFILE_ICCID
```

This uses `POST /user/api/v1/devices/{deviceUuid}/esim` with `{ "action": "select", "iccid": "PROFILE_ICCID" }`. Keep the ICCID as a string so no digits are lost. This is a one-time switch, not a repeating rotation schedule. It does not download or delete a profile.

Switching changes the device's active SIM identity and may interrupt connectivity. Do not disable the current profile first: selecting the alternative is the supported operation. Inspect the returned `selectedIccid` and `network.ready`. If the profile is selected but network readiness is still pending, run `npm run devices -- --live` again before sending SMS. After a timeout, list profiles first to determine whether the switch already happened.

The eSIM routes above were checked against the application backend; they may not yet appear in every deployed API reference. A 404/503 can indicate that this route or the reader service is unavailable on your deployment.

### C. Create, populate, start, and monitor a campaign

The workflow is **05 Create draft → 08 Add contacts → 06 Start → 07 Monitor**. The recipient import is a separate reusable example so you can inspect the accepted recipients before starting.

**Step 1 — Create the draft.** Replace `DEVICE_UUID` with your assigned sending device:

```sh
npm run campaign:create -- "First campaign" DEVICE_UUID "Hello <first_name>, this is a Simhost test."
```

Copy `campaign.campaignUuid` from the result. Every later campaign command uses that value as `CAMPAIGN_UUID`. The request creates a draft with `deviceUuids` and `config.message`; it does not send messages. If creation times out, check the campaign list in the web app before repeating the command, because another request could create a duplicate draft.

**Step 2 — Create `contacts.json`.** Open your editor, create this file in the repository root, and replace the illustrative contact below with a real test recipient:

```json
[
  { "phone_number": "+12025550123", "first_name": "Sam" }
]
```

Add more objects to the array for more recipients. The `first_name` value fills `<first_name>` in the message. Use one test recipient first. `contacts.json` is excluded from Git because it can contain private phone numbers; use the same care if you save contacts under another filename.

**Step 3 — Import the recipients.**

```sh
npm run campaign:contacts -- CAMPAIGN_UUID contacts.json
```

The script sends `{ "contactRows": [...] }` to `POST /user/api/v1/sms-campaigns/{campaignUuid}/contacts`. Inspect `accepted` and the returned contacts after validation and deduplication. This endpoint **replaces** the existing recipients; it does not append. Prepare contacts while the campaign is a draft. This example can also repopulate an existing draft without creating another campaign.

**Step 4 — Review, then start.** Before starting, you can inspect the draft and pending results with:

```sh
npm run campaign:monitor -- CAMPAIGN_UUID
```

When the sending device, message, and recipients are correct:

```sh
npm run campaign:start -- CAMPAIGN_UUID
```

This command triggers real messages. It calls `POST /user/api/v1/sms-campaigns/{campaignUuid}/start`; it is intentionally separate from creating the draft. If the request times out, inspect the campaign status before attempting another start.

**Step 5 — Monitor progress and usage counts.**

```sh
npm run campaign:monitor -- CAMPAIGN_UUID 12
```

Omit `12` for one snapshot. A count of 12 makes up to 12 checks, 10 seconds apart, and stops early for completed, cancelled, failed, indeterminate, or no-device states. Press **Ctrl+C** to stop the monitor; this does **not** pause or cancel the server-side campaign. Use the web app's campaign controls to pause it.

Each check reads both the campaign and `/results` and prints their full responses:

| Field | Meaning |
| --- | --- |
| `campaign.status` / `summary.status` | Current campaign state |
| `summary.total` | Total execution recipients |
| `summary.pending` | Recipients still waiting |
| `summary.sending` | Recipients currently being processed |
| `summary.sent` | Carrier-accepted sends; not proof of delivery to the handset |
| `summary.failed` | Failed recipients; inspect `last_error` before deciding what to do |
| `summary.indeterminate` | Uncertain outcomes requiring reconciliation; do not blindly resend |
| `results` | Recipient details, including `phone_number`, `status`, `attempts`, `device_uuid`, `sent_on`, and `last_error` |

Campaign metadata also exposes counters such as `recipientCount`, `sentCount`, `failedCount`, `acceptedCount`, and `indeterminateCount`. Do not add `sentCount` and `acceptedCount` together as if they were separate recipients. The two requests are sequential snapshots, so counters can change between them while a campaign runs.

**These are execution counts, not billing amounts or SMS-segment usage.** The inspected campaign API does not expose a campaign currency charge. Longer messages can have different segment usage; do not infer a bill from recipient counts. The current results endpoint returns at most 1,000 recipient rows and does not expose pagination here, so use `summary` for whole-campaign totals and treat `results` as potentially incomplete for larger campaigns.

### Validation

Run `npm test` to check the example request paths, payloads, validation, and error handling against mocked responses. Tests use fake credentials and do not send SMS, change eSIMs, or create campaigns. These examples have been checked against the local backend contracts; live execution still depends on your account, assigned devices, and deployed API version.

For endpoint definitions, request fields, and responses, see the [Simhost API reference](https://openapi.simhost.io/).
