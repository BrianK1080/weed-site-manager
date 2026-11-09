# Weed Site Manager

A phone and PC app for finding, treating and tracking weed sites season after season, on private land and public roadsides. Proof of concept, Stage 1. Built for a landholder at Steels Creek (Yarra Valley, Victoria).

**Open the app:** https://briank1080.github.io/weed-site-manager/ (once GitHub Pages is switched on)

## What it does

- Map with satellite, satellite + labels, and street views, plus your live GPS position
- Weed sites as points, roadside lines or patch areas, drawn by tapping or by walking with GPS
- Colour per weed; solid = not treated this season, hollow = treated, amber ring = due now, grey dashed = monitoring
- Seasons follow each weed's own season start month, so windows that cross New Year work
- Today list: what's due, nearest first or in route order; "Suggest order from here"
- Visit log with photos; spray and wipe visits capture Victoria's chemical-use record fields
- Records tab: chemical use record by date range, exported as CSV
- Export sites as CSV (Darwin Core names), GeoJSON or KML; full backup and restore
- Works offline once opened; recently viewed map areas stay available

## Your data

Sites, visits and photos are stored only in the browser on the device you use. Nothing is uploaded to GitHub or anywhere else. Use **More > Back up now** regularly, and restore that file to move data to another device.

## Install on your phone

Open the link in Safari (iPhone) or Chrome (Android), then Share or menu > **Add to Home Screen**.

## Not advice

Treatment windows are Yarra Valley estimates. Always follow the product label and current Agriculture Victoria rules.

## Credits

Map library: [Leaflet](https://leafletjs.com) (BSD-2). Map data &copy; OpenStreetMap contributors. Imagery &copy; Esri, Maxar, Earthstar Geographics.
