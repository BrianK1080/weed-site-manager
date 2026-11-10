# Notes for Claude working in this repo

The full spec, decisions and status live in the claude.ai Project "Weed Management App" (Project_Instructions.md, HANDOVER.md). Read HANDOVER.md first and stay in the current stage.

## Structure

- `index.html`: shell (top bar, map, legend, draw bar, sheet, tabs). No build step.
- `js/app.js`: all UI. Event delegation via `data-action` attributes; sheets rendered as template strings.
- `js/season.js`: pure season/status logic and geometry helpers. Unit-testable in Node.
- `js/species.js`: seed species (only used when the species store is empty).
- `js/weedpack.js`: weed pack (researched months, methods, seed info, cited), built-in WoNS list and Victorian declared table; `fillFromPack()` fills only empty fields. Add new researched weeds here, with sources.
- `js/export.js`: CSV/GeoJSON/KML/backup. Dates in exports use device-local time.
- `js/db.js`: IndexedDB wrapper. Stores: species, sites, visits, routes, photos, meta.
- `sw.js`: offline cache. Bump `VERSION` whenever shell files change (and `APP_VERSION` in app.js to the same number), and add new files to `SHELL`.
- `vendor/leaflet`: Leaflet 1.9.4, vendored for offline use.

## Rules

- User data never goes in the repo. No seed sites, no real coordinates of private sites.
- Never add herbicide rates or label claims to the code.
- Basemaps are config entries in `BASEMAPS` (app.js).
- Make targeted edits; don't regenerate whole files.

## Testing

Serve with `python3 -m http.server` and drive with Playwright (Chrome at /usr/bin/google-chrome), using a mocked geolocation. Map tiles don't load in the sandbox; that's expected.
