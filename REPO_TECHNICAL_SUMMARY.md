# Red Bird Halloween Trail — Technical Repository Summary

**Generated:** 2025-10-21

## Purpose
This document is a comprehensive technical summary of the repository located at the workspace root ("Red Bird Trick-or-Treat Trail"). It describes the technology stack, file layout, HTML/CSS/JS behavior, data scheme, important code excerpts, hosting/build notes, and recommended next steps. Use this file as a single-source reference for developers, maintainers, and auditors.

---

## Repository metadata
- Repository name: `red-bird-halloween-trail`
- Owner: `pdarleyjr`
- Branch: `main`
- Project root: contains static site files and a small Node-based image generator script.

## File / Directory overview (top-level)
- `index.html` — Homepage (static HTML)
- `how-it-works.html` — Static informational page
- `interactive-map.html` — Map page with embedded Google My Maps iframe and geolocation/share helpers
- `participating-houses.html` — Page that dynamically loads `data/participants.csv` and renders participating houses
- `download.html` — Download flyer / assets page
- `manifest.json` — Web App Manifest
- `package.json` — minimal package file (contains only `devDependencies: { sharp }`)
- `robots.txt`, `sitemap.xml` — SEO / crawler files
- `styles.css` (root) and `css/styles.css` in `src` — main stylesheet(s)
- `assets/`, `public/assets/`, `new_images/` — image and media assets
- `data/participants.csv` — CSV export with participant submissions
- `src/js/generate-images.mjs` — Node ESM script using `sharp` for generating responsive button images
- `.agents/memory.instruction.md` — local agent memory (created during analysis)
- `IMPLEMENTATION_SUMMARY.md` & `REPO_TECHNICAL_SUMMARY.md` — documentation files

There are two copies of some pages under `src/` and at the repository root. The root pages are the deployed versions; `src/` likely contains sources or templates.

---

## Technology stack
- Static HTML, CSS, and client-side JavaScript — primary runtime is the browser.
- Node.js (development tool) used only for the `sharp`-based image generation script (`src/js/generate-images.mjs`).
  - `package.json` includes `devDependencies` with `sharp` version `^0.34.4`.
- Third-party client libraries used in-browser:
  - PapaParse (`https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js`) for CSV parsing on the client.
  - CountAPI (public REST endpoint) used for a lightweight page view counter.
- No bundler (Webpack/Vite) or build tooling present aside from the Node script.

Hosting: Purpose-built static site suitable for GitHub Pages, Netlify, or any static hosting provider.

---

## HTML pages — structure and behavior

### `index.html` (homepage)
Key features:
- Loads `css/styles.css` and preloads the logo `assets/brand/Red_Bird_Logo.png`.
- Homepage layout: large logo + three call-to-action buttons in a `.btn-grid` (How it works, Interactive map, Download).
- Uses responsive `img` attributes: `srcset`, `sizes`, `loading="lazy"` for button images and `loading="eager"` for critical logo.
- Contains two client-side interactive features:
  1. View counter using CountAPI (with localStorage fallback)
  2. Halloween countdown timer to Oct 31, 2025 18:00 local time

Important code excerpt — view counter (client-side):

fetch('https://api.countapi.xyz/hit/pdarleyjr/red-bird-trail')
  .then(r => r.json())
  .then(data => {
    if (data && data.value != null) { counterEl.textContent = data.value; localStorage.setItem(key, data.value); }
  })
  .catch(() => { /* localStorage fallback */ });

Important code excerpt — countdown timer (client-side):

const targetDate = new Date('2025-10-31T18:00:00');
function updateCountdown() {
  const diff = targetDate - new Date();
  if (diff <= 0) { displayEl.textContent = '🎃 Happy Halloween! 🎃'; return; }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  displayEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

Notes:
- Countdown uses client local time; no timezone normalization is performed.
- View counter calls CountAPI endpoint `pdarleyjr/red-bird-trail` which is public and requires no credentials.


### `participating-houses.html`
Key behavior:
- The page fetches `data/participants.csv` and parses it client-side using PapaParse.
- It finds the theme column dynamically by searching header names for `Trick-or-Treat Name`.
- It filters rows that have a non-empty theme value and renders each as an `.house.card` containing the theme name, address and a short blurb.

Important code excerpt: CSV load + parse + render (client-side):

fetch('data/participants.csv')
  .then(r => { if (!r.ok) throw new Error(...); return r.text(); })
  .then(t => Papa.parse(t, { header: true }))
  .then(parsed => {
    const rows = parsed.data;
    const themeColumnName = Object.keys(rows[0] || {}).find(key => key.includes('Trick-or-Treat Name'));
    const houses = rows.filter(r => r && r[themeColumnName] && r[themeColumnName].trim().length > 0)
      .map(r => ({ name: r[themeColumnName].trim(), address: (r['Address '] || r['Address'] || '').trim() }))
      .sort((a,b) => a.name.localeCompare(b.name));
    // ...insert into DOM
  })

Notes:
- The code is defensive about column names (`'Address '` and `'Address'`) because the CSV exports inconsistent header names.
- PapaParse is loaded from jsDelivr CDN; a network outage would prevent the list from rendering.
- If the CSV contains unexpected headers or empty rows, the page shows a helpful message.


### `interactive-map.html`
Key behavior:
- Embeds a Google My Maps map via an `<iframe>` with the `src` pointing to a specific `mid` parameter (the My Maps map id).
- Adds two self-hosted interactive buttons:
  - "Find My Location" that requests browser geolocation and then opens Google Maps with the user's coordinates (external window).
  - "Share Map" which uses the Web Share API on supported devices or falls back to copying the map URL to the clipboard.

Important code excerpt — `Find My Location` handler:

const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout:10000}));
const { latitude, longitude } = pos.coords;
const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
window.open(url, '_blank', 'noopener');

Important code excerpt — `Share Map` handler:

const mapUrl = 'https://www.google.com/maps/d/u/0/viewer?mid=1ExTFwDBAKnengmkfMcVtjvAvi_MTw3s';
if (navigator.share) { await navigator.share({ title: 'Red Bird Trick-or-Treat Trail Map', url: mapUrl }); }
else { await navigator.clipboard.writeText(mapUrl); alert('Map link copied to clipboard'); }

Notes:
- The embedded Google My Maps is read-only and hosted on Google. The project does not host its own tiles or location data.
- The `Find My Location` feature uses user geolocation but does not store or transmit coordinates to the site backend.

---

## Client-side CSS (styles)
The main stylesheet is `css/styles.css` (and `styles.css` in root referencing the same rules). Key design tokens and patterns:

Design variables (CSS custom properties):
- `--cream: #EFE7D8` (off-white)
- `--tan: #D7C3A3` (light wood)
- `--pumpkin: #D97C1E` (pumpkin orange)
- `--terra: #B65433`
- `--cocoa: #5A4336`
- `--charcoal: #1E1C1A`
- `--bg-grad` radial gradient for background

Layout patterns and classes:
- `.container` — central max-width container, responsive padding, vertical centering on larger viewports
- `.btn-grid` — responsive row/column grid for the homepage CTAs
- `.logo` — responsive logo with drop-shadow
- `.btn img` — rounded, boxed images with `box-shadow` for CTAs
- `.map-wrap` — aspect-ratio container for the embedded map iframe
- `.card` / `.houses-grid` — used for participating houses list layout
- Accessibility helpers: `.skip-link` (offscreen until focus), `.home-fab` (floating home button), `.view-counter`, `.countdown-timer` (fixed UI elements)

Animations and accessibility:
- Simple `rb-fade-in` animation for sequence reveals.
- Focus styles and visible outlines for keyboard users.

---

## Server-side / Development script — `src/js/generate-images.mjs`
This is a Node ESM script that uses `sharp` to generate multiple responsive variants (WebP and PNG) of a set of button images.

Key features:
- Imports `sharp`, `fs`, `path`, and uses `fileURLToPath` for ESM compatibility.
- Defines `sizes = { mobile: 320, tablet: 480, desktop: 640 }` and `buttons = ['HOW_IT_WORKS','INTERACTIVE_MAP','DOWNLOAD']`.
- For each button it checks `public/assets/buttons/${BUTTON}.png`, reads metadata to preserve aspect ratio, and writes `buttonname-<width>.webp` and `buttonname-<width>.png` to the same folder.
- Produces console logs for progress and errors.

Full code is at `src/js/generate-images.mjs` — run it with Node (ESM enabled; Node >= 12 with experimental modules or recommended Node >= 16+). Example invocation:

```powershell
# From project root (Windows / PowerShell)
npm install        # installs sharp into node_modules
node .\src\js\generate-images.mjs
```

Notes about `sharp` on Windows:
- `sharp` includes native binaries; `npm install` will download the precompiled binary or attempt to build locally. Ensure build tools are available if that fails (Windows Build Tools / Visual Studio C++ might be required for compilation from source).
- If `npm install` fails due to `sharp`, try a Node version compatible with the prebuilt sharp (Node 18/20 recommended).

---

## CSV data schema — `data/participants.csv`
The CSV is a Google Forms / spreadsheet export. Header row (observed in file):

"Submission Date","Household Name","Address ","Would you like to give your house a fun “Trick-or-Treat Name” for the map?","Contact Email","Contact Phone Number","Any Extra Notes You’d Like to Share?"

Important details:
- The theme column contains the human-friendly "Trick-or-Treat" names used by the `participating-houses.html` page.
- Column headings are inconsistent (e.g., `Address ` vs `Address`) which is handled in the renderer.
- Rows contain contact emails and phone numbers — treat this data carefully if publishing (privacy considerations).
- Example row (from file):
  - Household Name: `The Astte Family`
  - Address: `6210 sw 38 st Miami, FL 33155`
  - Theme: `The Skeleton Spooktacular`
  - Contact Email: `aimee.astte@gmail.com`

Privacy note: When deploying the CSV publicly, remove or obfuscate personally-identifying contact information where necessary.

---

## PWA / Manifest
`manifest.json` present, minimal configuration:
- `name`, `short_name`, `description`, `start_url: '/'`, `display: 'standalone'`, `background_color` and `theme_color`, and a single icon pointing to `assets/brand/Red_Bird_Logo.png`.

There is no service worker in the repository — offline capabilities are not provided by default. The manifest alone allows a reasonable "add to homescreen" experience but without caching the site will not work offline.

---

## package.json
Current content (minimal):

```json
{
  "devDependencies": {
    "sharp": "^0.34.4"
  }
}
```

Notes:
- No `scripts` are defined. To use the `sharp` script, run `node src/js/generate-images.mjs` manually after `npm install`.
- No other build/test dependencies present.

---

## Security, privacy, and legal
- `data/participants.csv` contains personal contact info. If published, ensure you have consent or consider removing contact columns.
- CountAPI usage is public-facing; it stores a page counter value on a third-party server. No user-identifying data is sent.
- Google My Maps iframe is a third-party service external to this repo; it might collect analytics on viewers.

---

## Accessibility and SEO observations
- Good: `skip-link`, `aria` attributes, `title` and `meta` tags including Open Graph and Twitter Card snippets, manifest and favicon are present.
- Improvements suggested:
  - Add `lang` attribute is present (good) — ensure it matches content; it's currently `en`.
  - Add meaningful `alt` text for decorative images where appropriate (currently present for buttons and logo).
  - Provide an accessible list control for the map's list of houses (e.g., add landmarks and better headings hierarchy for screen readers).
  - Consider adding structured data (JSON-LD) for event info (Halloween Night) to improve search appearance.

---

## Performance observations & suggestions
- The site already uses `loading="lazy"` for many images and preloads crucial logo asset.
- The `sharp` script indicates an intent to generate WebP variants — adopt those WebP files across pages for smaller downloads (some are already present in `public/assets/buttons`).
- Consider adding a simple build step (e.g., `npm run build` script) to generate image variants automatically and to copy `src/` to `public/` prior to deployment.
- Add a compact service worker (Workbox) for caching static assets if offline or very fast repeat visits are desired.

---

## How to run / developer tasks
Quick checks on a Windows developer machine (PowerShell / pwsh):

```powershell
# Verify Node
node --version
# Install dev dependency sharp (required for image generation)
npm install
# Run image generation script (ESM)
node .\src\js\generate-images.mjs
```

Static site deployment: copy root files (and/or `public/`) to a static host (GitHub Pages, Netlify). Example GitHub Pages: push `index.html` and the files to a `gh-pages` branch or use the `main` branch in your repository settings.

---

## Potential follow-ups / improvements (prioritized)
1. Add a `README.md` with developer setup steps and contribution guidelines.
2. Add `scripts` to `package.json` (e.g., `build:images`, `format`, `lint`).
3. Add a small test harness for the CSV parsing logic (e.g., a Node script that reads `data/participants.csv` and validates headers).
4. Add optional service worker for caching and faster repeat loads.
5. Remove or mask contact information in `data/participants.csv` if publishing a public data file without consent.
6. If analytics are desired, add a privacy-respecting provider (Plausible or Matomo) instead of CountAPI if tracking individuals.

---

## Summary & contact
This repository is a lightweight static site for a neighborhood Halloween trail. It prioritizes simplicity and compatibility with static hosting. The only non-browser execution path is a Node-based media pipeline for responsive assets. The code is easy to maintain and extend.

If you want, I can:
- generate a `README.md` with developer instructions,
- add `package.json` scripts to automate image generation and publishing,
- create a small Node test that validates CSV headers and outputs a sanitized `public/data/participants.csv` for publishing.

---

<small>Automated summary produced by an analysis run on 2025-10-21.</small>
