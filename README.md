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

### iPhone
1. Open the link in **Safari itself**, not from inside Outlook or another app's built-in viewer (those can block location). In Outlook's viewer tap ••• > Open in Safari. When asked to use your location, tap **Allow**.
2. **Settings > Privacy & Security > Location Services**: on; **Safari Websites** = **While Using the App**; **Precise Location** on.
3. If "Don't Allow" was tapped earlier: Safari address bar page-settings button (page icon or "aA") > Website Settings > Location > **Allow**. Or Settings > Apps > Safari > Location.
4. Share > **Add to Home Screen**. The icon uses the same Safari permission.

### Android
Open the link in Chrome, allow location when asked, then menu ⋮ > **Add to Home screen** (or Install app). If location is blocked: tap the icon left of the address > Permissions > Location > Allow.

**Check it's working:** the top bar shows "GPS ±5 m" (or similar) and a blue dot marks you; ◎ centres the map on you. "GPS blocked" means the phone refused location; repeat the steps above. After an update, close and reopen the app once.

## Not advice

Treatment windows are Yarra Valley estimates. Always follow the product label and current Agriculture Victoria rules.

## Credits

Map library: [Leaflet](https://leafletjs.com) (BSD-2). Map data &copy; OpenStreetMap contributors. Imagery &copy; Esri, Maxar, Earthstar Geographics.
