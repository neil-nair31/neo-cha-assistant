# Neo IT — slot-in checklist

This assistant ships as a **standalone Node service** + **drop-in widget**. To put it on https://www.neologistics.org/:

## Minimum
1. Host the Node API (same VPS as Django if Node is allowed, or Railway/Render).
2. Secrets: `GEMINI_API_KEY` (recommended), `LEAD_NOTIFY_EMAIL`, SMTP (or Slack).
3. Embed the widget in the Django base template (snippet below).
4. Prefer same-origin proxy: `/api/assistant/*` → Node `:8787`.
5. Confirm privacy policy URL for consent.
6. Schedule daily: `npm run retention -w server`.

## Drop-in embed (copy-paste)

After `npm run build -w widget`, assets live in `widget/dist/` (also served at `http://API:8787/widget/`).

```html
<!-- Neo Assist — paste before </body> -->
<link rel="stylesheet" href="https://YOUR-ASSIST-HOST/widget/neo-assist.css" />
<script
  id="neo-assist-loader"
  src="https://YOUR-ASSIST-HOST/widget/neo-assist.js"
  data-api-base="https://YOUR-ASSIST-HOST"
  defer
></script>
```

If nginx proxies the API under the same domain:

```html
<link rel="stylesheet" href="/widget/neo-assist.css" />
<script
  id="neo-assist-loader"
  src="/widget/neo-assist.js"
  data-api-base=""
  defer
></script>
```

`data-api-base` = API origin only (no `/api/assistant` suffix). Empty string = same origin.

## Do not
- Put Gemini / Anthropic / OpenAI keys in frontend JS
- Embed third-party bots if the requirement is native Neo branding + KB control

## Contacts published in product
- customercare@neologistics.org
- docschennai@neologistics.org
