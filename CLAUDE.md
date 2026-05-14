# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Static marketing website for Edge Core Advisors (AI workflow consulting) with a live order-extraction demo powered by Claude. No build step — the root directory is served directly by Netlify.

## Local Development

There is no `package.json` or build pipeline. To run locally with the Netlify function working:

```bash
npm install -g netlify-cli
netlify dev
```

`netlify dev` serves the site and emulates the `/.netlify/functions/extract` endpoint. Set `ANTHROPIC_API_KEY` as a local environment variable or in a `.env` file — it is required for the demo to work.

To view the site without the demo function, just open `index.html` directly in a browser.

## Architecture

### Files

| File | Purpose |
|---|---|
| `index.html` | Full marketing site (single-file: all CSS inline in `<style>`, all JS inline in `<script>`) |
| `order-entry-demo.html` | Interactive demo page (same single-file structure) |
| `netlify/functions/extract.js` | Serverless function — proxies order text to Anthropic API, returns structured JSON |
| `netlify.toml` | Deploys root as publish dir; Node 18 |

### Demo Data Flow

1. User pastes order text into `order-entry-demo.html`
2. Browser POSTs `{ text: "..." }` to `/.netlify/functions/extract`
3. `extract.js` calls `claude-haiku-4-5-20251001` with a strict system prompt instructing it to return only a JSON object (no markdown fences)
4. The function returns Claude's raw response body directly — this is already valid JSON
5. The demo frontend calls `response.json()` to parse the structured order object, then renders it

The system prompt in `extract.js` defines the exact JSON schema Claude must return: `customer_name`, `company`, `contact_phone`, `po_number`, `order_date`, `requested_delivery`, `payment_terms`, `ship_to` (object), `line_items` (array), and `flags` (array of blocking issues).

### CSS Design System

Both HTML files use CSS custom properties defined in `:root`. The tokens used across both pages:

```
--ink / --ink-80 / --ink-50 / --ink-20 / --ink-08   (dark neutrals, lightest to darkest)
--white                                                (#fdfcf8 / #fdfcf9)
--green / --green-dark / --green-pale                 (brand accent)
--mono  (IBM Plex Mono)
--cond  (Barlow Condensed — index.html only)
--body  (Barlow — index.html only)
--sans  (IBM Plex Sans — order-entry-demo.html only)
```

`index.html` also uses amber and red tokens in the demo frame static mockup; `order-entry-demo.html` adds `--amber` / `--amber-light` / `--red` / `--red-light` for flag and missing-field states.

### Scroll Animations

`index.html` uses an `IntersectionObserver` to add `.visible` to `.fade-up` elements when they enter the viewport (threshold: 0.12). Elements start at `opacity:0; transform:translateY(24px)`.

## Deployment

Netlify auto-deploys from the `main` branch. The `ANTHROPIC_API_KEY` environment variable must be set in the Netlify dashboard (Site settings → Environment variables) for the extract function to work in production.

## Conventions

- All CSS and JS live inline inside each HTML file — do not introduce external `.css` or `.js` files.
- CSS is minified/compact in `index.html` (single-line rules); `order-entry-demo.html` uses expanded formatting. Match the existing style in whichever file you edit.
- The Netlify function uses plain `fetch` (no SDK) against the Anthropic REST API directly.
- Model in use: `claude-haiku-4-5-20251001` — chosen for speed and cost in the demo context.
