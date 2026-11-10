// Weed Site Manager: Stage 1 app.
import { db, uid, requestPersistence } from './db.js';
import { SEED_SPECIES, SEED_VERSION } from './species.js';
import { MONTHS, siteStatus, seasonLabel, monthsText, haversine, siteLatLng, nearestOrder, fmtDist, geometrySize } from './season.js';
import { download, sitesCSV, chemicalRows, CHEM_COLS, toCSV, toGeoJSON, toKML, backupJSON, parseBackup, stamp, localDate, localTime } from './export.js';

/* ---------- basemaps (pluggable: add a provider here) ---------- */
// Keep in step with VERSION in sw.js; shown under More > About so you can tell which version is running.
const APP_VERSION = 12;

const BASEMAPS = {
  map: { label: 'Street', layers: [{ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { maxZoom: 21, maxNativeZoom: 19, attribution: '&copy; OpenStreetMap contributors' } }] },
  sat: { label: 'Satellite', layers: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 21, maxNativeZoom: 18, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' } }] },
  topo: { label: 'Topo', layers: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 21, maxNativeZoom: 18, attribution: 'Map &copy; Esri and contributors' } }] },
  hybrid: { label: 'Sat + labels', layers: [
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 21, maxNativeZoom: 18, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' } },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 21, maxNativeZoom: 18 } },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 21, maxNativeZoom: 18 } },
  ] },
};
const BASEMAP_ORDER = ['sat', 'hybrid', 'map', 'topo'];
// Victorian declared weed categories (Catchment and Land Protection Act 1994). Regional categories depend on the catchment region.
const CALP = { '': 'Not declared', state_prohibited: 'State prohibited', regionally_prohibited: 'Regionally prohibited', regionally_controlled: 'Regionally controlled', restricted: 'Restricted' };
// One-line meanings, from Agriculture Victoria's "Invasive plant classifications" page.
const CALP_MEANING = {
  '': 'Not a declared noxious weed in this region. Control is good practice but not a legal duty.',
  state_prohibited: 'Not in Victoria or present in small numbers that can be eradicated. Agriculture Victoria eradicates it on all land: report it, don\'t treat it yourself.',
  regionally_prohibited: 'Not widespread in this region. Land owners must take all reasonable steps to eradicate it on their land.',
  regionally_controlled: 'Widespread in this region. Land owners must take all reasonable steps to prevent its growth and spread on their land.',
  restricted: 'Trade is banned (plants, seed or contaminated material) because of the risk of spread.',
};
const CALP_INFO_URL = 'https://agriculture.vic.gov.au/biosecurity/weeds/invasive-plant-classifications';
const CALP_LIST_URL = 'https://agriculture.vic.gov.au/biosecurity/protecting-victoria/legislation-policy-and-permits/consolidated-lists-of-declared-noxious-weeds-and-pest-animals';
const AGVIC_REPORT = { email: 'weed.spotters@agriculture.vic.gov.au', phone: '136186', phoneText: '136 186', form: 'https://agriculture.vic.gov.au/biosecurity/weeds/state-prohibited-weeds/state-prohibited-weeds-in-victoria' };
const WEEDSCAN_URL = 'https://weedscan.org.au/';
const BASEMAP_NOTE = { sat: 'Aerial photo', hybrid: 'Aerial photo with road and place names', map: 'Street map (OpenStreetMap): roads, tracks, buildings', topo: 'Topographic map: contours, creeks, tracks' };
const HOME = [-37.585, 145.385]; // Steels Creek, Yarra Valley
const AMBER = '#ffab00';
const GREY = '#9e9e9e';
const COLLAPSE_ZOOM = 15;
// Vicmap Property parcels (open data, CC BY). Approximate: not a survey or legal title boundary.
const PARCELS_WMS = { url: 'https://opendata.maps.vic.gov.au/geoserver/wms', opts: { layers: 'open-data-platform:parcel_view', format: 'image/png', transparent: true, minZoom: 15, maxZoom: 21, attribution: 'Parcels &copy; Vicmap (State of Victoria), CC BY' } };
const PALETTE = ['#ff6d00', '#6a1b9a', '#00897b', '#c0ca33', '#5d4037', '#d81b60', '#3949ab', '#7cb342', '#f4511e', '#00acc1'];

const METHODS = { chip: 'Chip / dig', cut: 'Cut', pull: 'Hand-pull', spot_spray: 'Spot spray', wipe: 'Wipe / paint', inspect: 'Inspect only (no treatment)', other: 'Other' };
const CHEM_METHODS = ['spot_spray', 'wipe', 'other'];
const WIND = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'Calm'];
const TENURE = { private: 'Private property', roadside: 'Public roadside', other: 'Other public land' };
const STATUS_TEXT = { due: 'Due now', untreated: 'Not treated this season', treated: 'Treated this season', monitoring: 'Monitoring' };

/* ---------- state ---------- */
const S = {
  species: {}, sites: [], visits: [], routes: [], boundaries: [], settings: { id: 'settings', operator: '', basemap: 'sat', lastBackup: null },
  hidden: new Set(), locFilter: '', pos: null, follow: false, draw: null, tab: 'map', routeFilter: '', showAllToday: false,
};
let map, baseLayers = [], parcelLayer = null, boundaryLayer, siteLayer, posMarker, accCircle, drawLayer;

const $ = sel => document.querySelector(sel);
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const live = () => S.sites.filter(s => !s.archived && !s.deleted); // archived sites stay out of the map, Today and routes
const spList = () => Object.values(S.species).sort((a, b) => a.common_name.localeCompare(b.common_name));
const statusOf = site => siteStatus(site, S.species[site.species_id], S.visits);
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtDT = iso => iso ? new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
function visitWhen(v) {
  if (v.visit_date === undefined) return fmtDT(v.datetime); // older records
  const parts = [];
  if (v.visit_date) parts.push(`Visited ${fmtDate(v.visit_date + 'T12:00')}${v.visit_time ? ' ' + v.visit_time : ''}`);
  if (v.treated_date && v.treated_date !== v.visit_date) parts.push(`treated ${fmtDate(v.treated_date + 'T12:00')}`);
  return parts.length ? parts.join(' · ') : 'No date recorded';
}
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function toast(msg, ms = 2500) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, ms);
}

/* ---------- data ---------- */
async function load() {
  let species = await db.all('species');
  if (!species.length) { await db.putMany('species', SEED_SPECIES); species = SEED_SPECIES; }
  S.species = Object.fromEntries(species.map(s => [s.id, s]));
  const settings0 = await db.get('meta', 'settings');
  if (!settings0 || (settings0.seedVersion || 1) < SEED_VERSION) {
    // Add newly introduced seed fields to stored weeds, never overwriting the owner's edits.
    const changed = [];
    for (const seed of SEED_SPECIES) {
      const cur = S.species[seed.id];
      if (!cur) continue;
      let added = false;
      for (const k of ['wons', 'calp_status', 'calp_note']) if (cur[k] === undefined && seed[k] !== undefined) { cur[k] = seed[k]; added = true; }
      if (!seed.seed_info) { if (added) changed.push(cur); continue; }
      const si = { ...(cur.seed_info || {}) };
      for (const [k, v] of Object.entries(seed.seed_info)) if (si[k] === undefined) { si[k] = v; added = true; }
      if (added) { cur.seed_info = si; changed.push(cur); }
    }
    if (changed.length) await db.putMany('species', changed);
    await db.put('meta', { ...(settings0 || S.settings), id: 'settings', seedVersion: SEED_VERSION });
  }
  S.sites = await db.all('sites');
  S.visits = await db.all('visits');
  S.routes = (await db.all('routes')).sort((a, b) => a.name.localeCompare(b.name));
  const settings = await db.get('meta', 'settings');
  if (settings) S.settings = { ...S.settings, ...settings };
  S.boundaries = (await db.get('meta', 'boundaries'))?.list || [];
}
const saveSettings = () => db.put('meta', S.settings);

/* ---------- symbols ---------- */
function pointSVG(colour, status) {
  const c = status === 'monitoring' ? GREY : colour;
  let inner;
  if (status === 'treated') inner = `<circle cx="14" cy="14" r="8" fill="rgba(255,255,255,0.35)" stroke="#fff" stroke-width="7"/><circle cx="14" cy="14" r="8" fill="none" stroke="${c}" stroke-width="4"/>`;
  else if (status === 'monitoring') inner = `<circle cx="14" cy="14" r="9" fill="rgba(255,255,255,0.5)" stroke="${c}" stroke-width="3" stroke-dasharray="4 3"/>`;
  else inner = `<circle cx="14" cy="14" r="9" fill="${c}" stroke="#fff" stroke-width="2.5"/>`;
  const ring = status === 'due' ? `<circle class="due-ring" cx="14" cy="14" r="12.5" fill="none" stroke="${AMBER}" stroke-width="3"/>` : '';
  return `<svg width="28" height="28" viewBox="0 0 28 28">${ring}${inner}</svg>`;
}

function pointMarker(latlng, colour, status, label) {
  const icon = L.divIcon({ className: 'wsm-pt', html: pointSVG(colour, status) + (label ? `<span class="pt-label">${h(label)}</span>` : ''), iconSize: [28, 28], iconAnchor: [14, 14] });
  return L.marker(latlng, { icon, keyboard: false });
}

function shapeLayers(site, colour, status, pct) {
  const g = site.geometry;
  const ll = g.type === 'LineString' ? g.coordinates.map(p => [p[1], p[0]]) : g.coordinates[0].map(p => [p[1], p[0]]);
  const out = [];
  if (g.type === 'LineString') {
    if (status === 'monitoring') out.push(L.polyline(ll, { color: GREY, weight: 5, dashArray: '8 6' }));
    else if (status === 'treated') { out.push(L.polyline(ll, { color: colour, weight: 9 })); out.push(L.polyline(ll, { color: '#fff', weight: 3 })); }
    else {
      out.push(L.polyline(ll, { color: status === 'due' ? AMBER : '#fff', weight: status === 'due' ? 12 : 9, className: status === 'due' ? 'due-line' : '' }));
      out.push(L.polyline(ll, { color: colour, weight: 6 }));
    }
  } else {
    if (status === 'monitoring') out.push(L.polygon(ll, { color: GREY, weight: 3, dashArray: '8 6', fillOpacity: 0 }));
    else if (status === 'treated') out.push(L.polygon(ll, { color: colour, weight: 3, fillOpacity: 0 }));
    else {
      if (status === 'due') out.push(L.polygon(ll, { color: AMBER, weight: 7, fill: false, className: 'due-line' }));
      out.push(L.polygon(ll, { color: colour, weight: 3, fillColor: colour, fillOpacity: 0.35 }));
    }
  }
  if (status === 'treated' && pct != null && pct < 100) {
    const c = siteLatLng(site);
    out.push(L.marker(c, { icon: L.divIcon({ className: 'pct-label', html: `${pct}% treated`, iconSize: [90, 18], iconAnchor: [45, 9] }), interactive: false }));
  }
  return out;
}

function renderSites() {
  siteLayer.clearLayers();
  const z = map.getZoom();
  for (const site of live()) {
    if (!site.geometry || S.hidden.has(site.species_id)) continue;
    const sp = S.species[site.species_id];
    const colour = sp ? sp.colour : '#ff0000';
    const st = statusOf(site);
    const layers = (site.geometry.type === 'Point' || z < COLLAPSE_ZOOM)
      ? [pointMarker(siteLatLng(site), colour, st.status, z >= 17 ? site.name : '')]
      : shapeLayers(site, colour, st.status, st.percentTreated);
    if (site.nav_point && z >= COLLAPSE_ZOOM) layers.push(L.marker([site.nav_point.lat, site.nav_point.lng], { icon: L.divIcon({ className: 'nav-pt', html: '⚑', iconSize: [22, 22], iconAnchor: [5, 20] }), title: 'Navigate-to point' }));
    for (const l of layers) {
      l.on('click', e => { if (S.draw) return; L.DomEvent.stopPropagation(e); openSite(site.id); });
      siteLayer.addLayer(l);
    }
  }
  renderLegend();
}

function renderLegend() {
  const b = map.getBounds();
  const present = new Set(live().filter(s => { const ll = siteLatLng(s); return ll && b.contains(ll); }).map(s => s.species_id));
  const items = spList().filter(s => present.has(s.id) || (S.hidden.has(s.id) && live().some(x => x.species_id === s.id)));
  const el = $('#legend');
  if (!items.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="legend-items">${items.map(s => `<div class="legend-row ${S.hidden.has(s.id) ? 'off' : ''}"><button class="legend-item" data-action="legend-open" data-id="${s.id}"><span class="sw" style="background:${s.colour}"></span>${h(s.common_name)}${S.hidden.has(s.id) ? ' <small>(hidden)</small>' : ''}</button><button class="legend-eye" data-action="toggle-species" data-id="${s.id}" title="${S.hidden.has(s.id) ? 'Show' : 'Hide'} on map" aria-label="${S.hidden.has(s.id) ? 'Show' : 'Hide'} ${h(s.common_name)} on map">${S.hidden.has(s.id) ? '○' : '◉'}</button></div>`).join('')}</div>
    <div class="legend-key"><span>${pointSVG('#666', 'untreated')} not treated</span><span>${pointSVG('#666', 'due')} due</span><span>${pointSVG('#666', 'treated')} treated</span><span>${pointSVG('#666', 'monitoring')} monitoring</span></div>`;
}

/* ---------- map ---------- */
function setBasemap(key) {
  baseLayers.forEach(l => map.removeLayer(l));
  baseLayers = BASEMAPS[key].layers.map(d => L.tileLayer(d.url, d.opts).addTo(map));
  baseLayers.forEach(l => l.bringToBack());
  S.settings.basemap = key;
  $('#btn-layers').textContent = BASEMAPS[key].label;
  saveSettings();
}

function initMap() {
  map = L.map('map', { zoomControl: false, attributionControl: true }).setView(HOME, 14);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  map.attributionControl.setPrefix(false); // Leaflet credited under More > About
  setBasemap(BASEMAPS[S.settings.basemap] ? S.settings.basemap : 'sat');
  boundaryLayer = L.layerGroup().addTo(map);
  siteLayer = L.layerGroup().addTo(map);
  const Ctl = L.Control.extend({ options: { position: 'bottomleft' }, onAdd() {
    const b = L.DomUtil.create('button', 'map-btn'); b.id = 'btn-parcels'; b.type = 'button'; b.textContent = 'Boundaries'; b.title = 'Show property boundaries';
    L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, 'click', () => setParcels(!S.settings.parcels)); return b; } });
  new Ctl().addTo(map);
  if (S.settings.parcels) setParcels(true);
  renderBoundaries();
  drawLayer = L.layerGroup().addTo(map);
  map.on('zoomend', renderSites);
  map.on('moveend', renderLegend);
  map.on('click', onMapClick);
  map.on('dragstart', () => { if (S.follow) { S.follow = false; $('#btn-locate').classList.remove('on'); } });
  if (S.sites.length) fitAll();
}

function setParcels(on) {
  S.settings.parcels = on;
  saveSettings();
  if (on && !parcelLayer) parcelLayer = L.tileLayer.wms(PARCELS_WMS.url, PARCELS_WMS.opts);
  if (on) { parcelLayer.addTo(map); if (map.getZoom() < 15) toast('Zoom in closer to see property boundaries.'); }
  else if (parcelLayer) map.removeLayer(parcelLayer);
  const b = document.getElementById('btn-parcels'); if (b) b.classList.toggle('on', on);
}

function renderBoundaries() {
  boundaryLayer.clearLayers();
  for (const bd of S.boundaries) {
    const ll = bd.geometry.coordinates[0].map(p => [p[1], p[0]]);
    L.polygon(ll, { color: '#fff', weight: 2.5, dashArray: '10 6', fill: false, interactive: false }).addTo(boundaryLayer);
    L.polygon(ll, { color: '#000', weight: 1, opacity: 0.5, dashArray: '10 6', fill: false, interactive: false }).addTo(boundaryLayer);
    if (bd.name) L.marker(ll[0], { interactive: false, icon: L.divIcon({ className: 'bd-label', html: h(bd.name), iconSize: [140, 16], iconAnchor: [0, 16] }) }).addTo(boundaryLayer);
  }
}
const saveBoundaries = () => db.put('meta', { id: 'boundaries', list: S.boundaries });

function fitAll() {
  const pts = live().map(siteLatLng).filter(Boolean);
  if (pts.length === 1) map.setView(pts[0], 17);
  else if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 18 });
}

function startLocation() {
  if (!('geolocation' in navigator)) { toast('This device has no GPS access in the browser.'); return; }
  navigator.geolocation.watchPosition(p => {
    S.pos = { ll: [p.coords.latitude, p.coords.longitude], acc: p.coords.accuracy, t: p.timestamp };
    if (!posMarker) {
      accCircle = L.circle(S.pos.ll, { radius: S.pos.acc, color: '#1e88e5', weight: 1, fillColor: '#1e88e5', fillOpacity: 0.12, interactive: false }).addTo(map);
      posMarker = L.circleMarker(S.pos.ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#1e88e5', fillOpacity: 1, interactive: false }).addTo(map);
    } else {
      posMarker.setLatLng(S.pos.ll);
      accCircle.setLatLng(S.pos.ll).setRadius(S.pos.acc);
    }
    $('#gps-acc').textContent = `GPS ±${Math.round(S.pos.acc)} m`;
    $('#gps-acc').hidden = false;
    if (S.follow) map.panTo(S.pos.ll);
    if (S.tab === 'today') renderToday();
  }, err => {
    $('#gps-acc').textContent = err.code === 1 ? 'GPS blocked' : 'No GPS';
    $('#gps-acc').hidden = false;
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
}

/* ---------- drawing ---------- */
function startDraw(type, how) {
  closeSheet();
  showTab('map', false);
  S.draw = { type, pts: [] };
  if (type === 'point' && how === 'gps') {
    if (!S.pos) { toast('Waiting for GPS. Try "tap on map" instead.'); S.draw = null; return; }
    S.draw.pts = [S.pos.ll.slice()];
    return finishDraw();
  }
  updateDrawBar();
}

function updateDrawBar() {
  const d = S.draw;
  const bar = $('#drawbar');
  if (!d) { bar.hidden = true; drawLayer.clearLayers(); return; }
  bar.hidden = false;
  const what = d.navFor ? 'Tap the map where you want directions to take you (e.g. the gate)' : d.boundary ? `Boundary: tap each corner of the property (${d.pts.length} points), then Finish` : d.type === 'point' ? 'Tap the map where the weeds are' : `${d.type === 'line' ? 'Line' : 'Area'}: tap the map to add points anywhere (you don't need to be there), or "Add GPS point" to add where you're standing (${d.pts.length} points)`;
  $('#draw-msg').textContent = what;
  $('#draw-gps').hidden = d.type === 'point';
  $('#draw-undo').hidden = d.type === 'point';
  $('#draw-done').hidden = d.type === 'point';
  drawLayer.clearLayers();
  if (d.pts.length) {
    if (d.type === 'area' && d.pts.length > 2) L.polygon(d.pts, { color: '#fff', weight: 2, dashArray: '6 4', fillOpacity: 0.15 }).addTo(drawLayer);
    else L.polyline(d.pts, { color: '#fff', weight: 3, dashArray: '6 4' }).addTo(drawLayer);
    d.pts.forEach(p => L.circleMarker(p, { radius: 5, color: '#000', weight: 1, fillColor: '#fff', fillOpacity: 1 }).addTo(drawLayer));
  }
}

function onMapClick(e) {
  if (!S.draw) return;
  S.draw.pts.push([e.latlng.lat, e.latlng.lng]);
  if (S.draw.type === 'point') return finishDraw();
  updateDrawBar();
}

async function setNavPoint(id, ll) {
  const site = S.sites.find(s => s.id === id);
  if (ll) site.nav_point = { lat: Number(ll[0].toFixed(7)), lng: Number(ll[1].toFixed(7)) }; else delete site.nav_point;
  await db.put('sites', site);
  renderSites();
  openSite(id);
  toast(ll ? 'Directions will now go to this point' : 'Directions go to the site again');
}

function finishDraw() {
  const d = S.draw;
  const need = d.type === 'point' ? 1 : d.type === 'line' ? 2 : 3;
  if (d.pts.length < need) { toast(`Add at least ${need} points first.`); return; }
  const c = d.pts.map(p => [Number(p[1].toFixed(7)), Number(p[0].toFixed(7))]);
  let geometry;
  if (d.type === 'point') geometry = { type: 'Point', coordinates: c[0] };
  else if (d.type === 'line') geometry = { type: 'LineString', coordinates: c };
  else geometry = { type: 'Polygon', coordinates: [[...c, c[0]]] };
  const pending = S.draw.editId;
  const isBoundary = S.draw.boundary;
  const navFor = S.draw.navFor;
  if (navFor) { S.draw = null; updateDrawBar(); setNavPoint(navFor, d.pts[0]); return; }
  S.draw = null;
  updateDrawBar();
  if (isBoundary) { boundaryForm(geometry); return; }
  if (pending) {
    const site = S.sites.find(s => s.id === pending);
    site.geometry = geometry;
    const sz = geometrySize(geometry);
    if (sz) { site.size_value = sz.value; site.size_unit = sz.unit; }
    db.put('sites', site).then(() => { renderSites(); openSite(site.id); toast('Shape updated'); });
  } else {
    siteForm(null, geometry);
  }
}

function boundaryForm(geometry) {
  openSheet('Name this boundary', `<form id="bd-form"><label>Name <input name="name" placeholder="e.g. Home block, Lot 2" autocomplete="off"></label>
    <p class="muted small">Your own approximate boundary, drawn for reference only.</p>
    <div class="btns"><button class="primary" type="submit">Save boundary</button></div></form>`);
  $('#bd-form').addEventListener('submit', async e => {
    e.preventDefault();
    S.boundaries.push({ id: uid('bd'), name: new FormData(e.target).get('name').trim(), geometry, created_at: new Date().toISOString() });
    await saveBoundaries();
    renderBoundaries();
    toast('Boundary saved');
    renderMore();
  });
}

/* ---------- sheet ---------- */
function openSheet(title, html, cls = '') {
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = html;
  markRequired($('#sheet-body'));
  const sh = $('#sheet');
  sh.className = cls;
  sh.hidden = false;
  document.body.classList.add('sheet-open');
  $('#sheet-body').scrollTop = 0;
}
// Put a red * on every required field's label, plus one "* required" note per form.
function markRequired(root) {
  root.querySelectorAll('form').forEach(form => {
    const req = form.querySelectorAll('[required]');
    req.forEach(el => {
      const label = el.closest('label');
      if (label && !label.querySelector('.req')) {
        const t = [...label.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
        const star = document.createElement('span'); star.className = 'req'; star.textContent = ' *'; star.title = 'Required';
        if (t) t.after(star); else label.prepend(star);
      }
    });
    if (req.length && !form.querySelector('.req-note')) form.insertAdjacentHTML('afterbegin', '<p class="req-note"><span class="req">*</span> required. Everything else is optional.</p>');
  });
}
function hideSheet() { $('#sheet').hidden = true; document.body.classList.remove('sheet-open'); if (S.reloadPending) S.reloadPending(); }
function closeSheet() { hideSheet(); if (S.tab !== 'map') showTab('map', false); }

function showTab(tab, render = true) {
  S.tab = tab;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  if (!render) return;
  if (tab === 'map') hideSheet();
  if (tab === 'today') renderToday();
  if (tab === 'sites') renderSiteList();
  if (tab === 'records') renderRecords();
  if (tab === 'more') renderMore();
}

/* ---------- badges & rows ---------- */
const badge = st => `<span class="badge b-${st}">${STATUS_TEXT[st]}</span>`;
function distTo(site) { const ll = siteLatLng(site); return S.pos && ll ? haversine(S.pos.ll, ll) : null; }

function siteRow(site, extra = '') {
  const sp = S.species[site.species_id] || { colour: '#f00', common_name: '?' };
  const st = statusOf(site);
  const d = distTo(site);
  const last = st.lastVisit ? `Last visit ${fmtDate(st.lastVisit.datetime)}` : 'Never visited';
  return `<div class="row" data-action="open-site" data-id="${site.id}">
    <span class="row-sym">${pointSVG(sp.colour, st.status)}</span>
    <span class="row-main"><b>${h(site.name)}</b><small>${h(sp.common_name)} · ${h(site.location_id || TENURE[site.tenure] || '')}</small><small>${last}${d != null ? ' · ' + fmtDist(d) : ''}</small></span>
    <span class="row-side">${site.deleted ? '<span class="badge b-untreated">Deleted</span>' : site.archived ? '<span class="badge b-monitoring">Archived</span>' : badge(st.status)}${extra}</span></div>`;
}

const routeOptions = (sel, allLabel = 'All sites') => `<option value="">${allLabel}</option>${S.routes.map(r => `<option value="${r.id}" ${sel === r.id ? 'selected' : ''}>${h(r.name)}</option>`).join('')}`;

function sortForRoute(list) {
  if (S.routeFilter) return list.sort((a, b) => (a.route_order ?? 9999) - (b.route_order ?? 9999));
  if (S.pos) return list.sort((a, b) => (distTo(a) ?? 1e12) - (distTo(b) ?? 1e12));
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

function backupNag() {
  if (!S.sites.length) return '';
  const last = S.settings.lastBackup;
  const days = last ? (Date.now() - new Date(last).getTime()) / 864e5 : Infinity;
  if (days < 14) return '';
  return `<div class="note warn">${last ? `Last backup ${fmtDate(last)}.` : 'No backup yet.'} Your data lives only on this device. <button class="link" data-action="backup">Back up now</button></div>`;
}

/* ---------- Today ---------- */
function renderToday() {
  let list = live().filter(s => !S.routeFilter || s.route_id === S.routeFilter);
  const statuses = list.map(statusOf);
  const dueCount = statuses.filter(s => s.status === 'due').length;
  if (!S.showAllToday) list = list.filter(s => statusOf(s).status === 'due');
  sortForRoute(list);
  const html = `${backupNag()}
    <div class="controls"><label>Route <select data-action="route-filter">${routeOptions(S.routeFilter)}</select></label>
    <label class="chk"><input type="checkbox" data-action="today-all" ${S.showAllToday ? 'checked' : ''}> Show sites not due</label></div>
    <p class="muted">${dueCount} site${dueCount === 1 ? '' : 's'} due now${S.routeFilter ? ' on this route, in route order' : S.pos ? ', nearest first' : ''}.</p>
    ${S.routeFilter ? `<div class="btns"><button data-action="suggest-order" ${S.pos ? '' : 'disabled'}>Suggest order from here</button></div>` : ''}
    ${list.length ? list.map(s => siteRow(s)).join('') : `<p class="empty">${live().length ? 'Nothing due. Tick "Show sites not due" to see all.' : 'No sites yet. Tap + on the map to add your first weed site.'}</p>`}`;
  openSheet('Today', html, 'tall');
}

/* ---------- Sites list ---------- */
function renderSiteList(filterText = '') {
  const q = filterText.toLowerCase();
  let all = S.sites.filter(s => !S.routeFilter || s.route_id === S.routeFilter)
    .filter(s => !S.locFilter || s.location_id === S.locFilter)
    .filter(s => !q || (s.location_id || '').toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (S.species[s.species_id]?.common_name || '').toLowerCase().includes(q));
  const archived = all.filter(s => s.archived && !s.deleted).sort((a, b) => a.name.localeCompare(b.name));
  const deleted = all.filter(s => s.deleted).sort((a, b) => (b.deleted_at || '').localeCompare(a.deleted_at || ''));
  let list = all.filter(s => !s.archived && !s.deleted);
  sortForRoute(list);
  const reorder = !!S.routeFilter;
  const html = `<div class="controls"><input type="search" placeholder="Search sites or weeds" value="${h(filterText)}" data-action="site-search">
    <label>Route <select data-action="route-filter-sites">${routeOptions(S.routeFilter)}</select></label>
    <label>Property / ID <select data-action="loc-filter"><option value="">All</option>${[...new Set(S.sites.map(x => x.location_id).filter(Boolean))].sort().map(l => `<option ${S.locFilter === l ? 'selected' : ''}>${h(l)}</option>`).join('')}</select></label></div>
    ${S.locFilter ? `<p class="muted">${list.length} site${list.length === 1 ? '' : 's'} at ${h(S.locFilter)}.</p>` : ''}
    ${reorder ? '<p class="muted">Use the arrows to set the visit order for this route.</p>' : ''}
    ${list.length ? list.map((s, i) => siteRow(s, reorder ? `<span class="arrows"><button data-action="move" data-id="${s.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>▲</button><button data-action="move" data-id="${s.id}" data-dir="1" ${i === list.length - 1 ? 'disabled' : ''}>▼</button></span>` : '')).join('') : '<p class="empty">No sites match.</p>'}
    <div class="btns"><button data-action="add-site">+ Add site</button></div>
    ${archived.length ? `<details class="archived"><summary>Archived (${archived.length})</summary>${archived.map(s => siteRow(s)).join('')}</details>` : ''}
    ${deleted.length ? `<details class="archived"><summary>Deleted (${deleted.length})</summary>${deleted.map(s => siteRow(s)).join('')}</details>` : ''}`;
  openSheet(`Sites (${live().length})`, html, 'tall');
}

async function moveSite(id, dir) {
  const list = sortForRoute(live().filter(s => s.route_id === S.routeFilter));
  list.forEach((s, i) => { s.route_order = i; });
  const i = list.findIndex(s => s.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i].route_order, list[j].route_order] = [list[j].route_order, list[i].route_order];
  await db.putMany('sites', list);
  renderSiteList($('[data-action="site-search"]')?.value || '');
}

async function suggestOrder() {
  const list = live().filter(s => s.route_id === S.routeFilter);
  const order = nearestOrder(list, S.pos ? S.pos.ll : null);
  order.forEach((id, i) => { list.find(s => s.id === id).route_order = i; });
  await db.putMany('sites', list);
  toast('Route ordered nearest-first from your position');
  renderToday();
}

/* ---------- weed info (shared by the site page and the weed page) ---------- */
const APVMA_URL = 'https://portal.apvma.gov.au/pubcris';
const searchWA = q => `https://weeds.org.au/?s=${encodeURIComponent(q)}`;
const searchALA = q => `https://bie.ala.org.au/search?q=${encodeURIComponent(q)}`;
// Links for a weed. Weeds Australia and the Atlas of Living Australia are always offered:
// if none is stored, a search on the weed's name is used.
function weedLinks(sp) {
  const l = sp.links || {};
  const sci = (sp.scientific_name || '').trim(), com = (sp.common_name || '').trim();
  const out = [];
  const wa = l.weeds_australia || (com || sci ? searchWA(com || sci) : '');
  const ala = l.ala || (sci || com ? searchALA(sci || com) : '');
  if (wa) out.push(['Weeds Australia', wa]);
  if (ala) out.push(['Atlas of Living Australia', ala]);
  if (l.agvic) out.push(['Agriculture Victoria', l.agvic]);
  if (l.council) out.push(['More info', l.council]);
  return out;
}
function weedInfoHTML(sp, full = false) {
  const si = sp.seed_info || {};
  const herbs = sp.herbicides || [];
  const links = weedLinks(sp).map(([t, u]) => `<a href="${h(u)}" target="_blank" rel="noopener">${t}</a>`).join(' · ');
  return `
    ${sp.preferred_methods ? `<p><b>Method:</b> ${h(sp.preferred_methods)}</p>` : ''}
    ${sp.cautions ? `<p><b>Caution:</b> ${h(sp.cautions)}</p>` : ''}
    ${herbs.length || full ? `<div class="seedbox"><b>Your herbicides for this weed</b>${herbs.length ? herbs.map(x => `<p>${h(x.product)}${x.active ? ` <span class="muted">(${h(x.active)})</span>` : ''}${x.notes ? ` · ${h(x.notes)}` : ''}${x.label_url ? ` · <a href="${h(x.label_url)}" target="_blank" rel="noopener">label</a>` : ''}</p>`).join('') : '<p class="muted">None added yet. Tap Edit to add the products you use.</p>'}<p class="small muted">Your own list. Always follow the product label. To find products registered for this weed, see the weed's Agriculture Victoria or Weeds Australia page, or search the <a href="${APVMA_URL}" target="_blank" rel="noopener">APVMA register (PubCRIS)</a>.</p></div>` : ''}
    ${si.seed_bank || si.seeds || si.spread || si.seed_set ? `<div class="seedbox"><b>If left to seed</b>
      ${si.seed_set ? `<p><span class="muted">Seed set:</span> ${h(si.seed_set)}${si.seed_set_source ? ` <a class="small" href="${h(si.seed_set_source)}" target="_blank" rel="noopener">source</a>` : ''}</p>` : ''}
      ${si.seeds ? `<p><span class="muted">Seed:</span> ${h(si.seeds)}</p>` : ''}
      ${si.seed_bank ? `<p><span class="muted">Seed bank:</span> ${h(si.seed_bank)}</p>` : ''}
      ${si.spread ? `<p><span class="muted">Spreads by:</span> ${h(si.spread)}</p>` : ''}
      ${si.source ? `<p class="small"><a href="${h(si.source)}" target="_blank" rel="noopener">Source</a></p>` : ''}</div>` : ''}
    ${links ? `<p class="links">${links}</p>` : ''}`;
}
function weedTags(sp) {
  return `${sp.wons ? '<span class="tag wons" title="Weed of National Significance">WoNS</span>' : ''}${sp.calp_status ? `<span class="tag calp${/prohibited/.test(sp.calp_status) ? ' prohib' : ''}" title="Victorian declared weed">${CALP[sp.calp_status]}</span>` : ''}${sp.native ? '<span class="tag">Native</span>' : ''}`;
}

/* ---------- reporting to WeedScan / Agriculture Victoria ---------- */
function reportText(site, sp, ll) {
  const last = S.visits.filter(v => v.site_id === site.id).sort((a, b) => b.datetime.localeCompare(a.datetime))[0];
  const seen = last ? (last.visit_date ? fmtDate(last.visit_date + 'T12:00') : fmtDate(last.datetime)) : fmtDate(new Date().toISOString());
  const shape = { Point: 'point', LineString: 'middle of a line', Polygon: 'centre of an area' }[site.geometry?.type] || '';
  return [
    `Weed: ${sp.common_name || ''}${sp.scientific_name ? ` (${sp.scientific_name})` : ''}`,
    ll ? `Location: ${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}${shape ? ` (${shape})` : ''}` : '',
    ll ? `Map: https://www.google.com/maps?q=${ll[0].toFixed(6)},${ll[1].toFixed(6)}` : '',
    site.size_value != null ? `Size: ${site.size_value} ${site.size_unit}` : '',
    site.density ? `Density: ${site.density} of 5` : '',
    last?.plants_count != null ? `Plants counted: ${last.plants_count}` : '',
    `Date seen: ${seen}`,
    site.location_id ? `Place: ${site.location_id}` : '',
    `Land: ${TENURE[site.tenure] || '-'}`,
  ].filter(Boolean).join('\n');
}
function reportHTML(site, sp, ll) {
  if (!ll) return '';
  const text = reportText(site, sp, ll);
  const prohibited = sp.calp_status === 'state_prohibited';
  const regional = sp.calp_status === 'regionally_prohibited';
  const body = `${text}\n\nReported by:\nName: \nPhone: \n\n(Photos attached)`;
  const mail = `mailto:${AGVIC_REPORT.email}?subject=${encodeURIComponent(`Suspected ${CALP[sp.calp_status] || ''} weed: ${sp.common_name}`)}&body=${encodeURIComponent(body)}`;
  return `<details class="report"><summary><b>Report this weed</b></summary>
    <p class="small muted">These details are copied for you to paste:</p>
    <pre class="report-text">${h(text)}</pre>
    <div class="btns"><button data-action="report-weedscan" data-id="${site.id}">Copy and open WeedScan</button></div>
    <p class="small muted">In WeedScan, add a photo, then paste into the comment. ${site.tenure === 'private' ? 'This is private land: tick "Not for public view" if you don\'t want the location shown publicly.' : ''} WeedScan alerts state and local weed officers who follow that weed.</p>
    ${prohibited ? `<div class="note warn"><b>${CALP[sp.calp_status]} weed:</b> report it to Agriculture Victoria. Don't remove or treat it yourself unless they say so.
      <div class="btns"><a class="button" href="${mail}">Email report</a><a class="button" href="tel:${AGVIC_REPORT.phone}">Call ${AGVIC_REPORT.phoneText}</a><a class="button" href="${AGVIC_REPORT.form}" target="_blank" rel="noopener">Online form</a></div>
      <p class="small">The email opens with these details filled in: add your name, phone and photos.</p></div>` : ''}
    ${regional ? `<div class="note warn"><b>Regionally prohibited:</b> land owners must eradicate it on their land. For a roadside, tell the council. For advice, call Agriculture Victoria on <a href="tel:${AGVIC_REPORT.phone}">${AGVIC_REPORT.phoneText}</a> and ask for your regional contact.</div>` : ''}
  </details>`;
}

/* ---------- Site detail ---------- */
async function openSite(id) {
  const site = S.sites.find(s => s.id === id);
  if (!site) return;
  const sp = S.species[site.species_id] || {};
  const st = statusOf(site);
  const ll = siteLatLng(site);
  const nav = site.nav_point ? [site.nav_point.lat, site.nav_point.lng] : ll;
  const visits = S.visits.filter(v => v.site_id === id).sort((a, b) => b.datetime.localeCompare(a.datetime));
  const route = S.routes.find(r => r.id === site.route_id);
  const html = `
    <div class="site-head"><span class="sw big" style="background:${sp.colour}"></span><div><b>${h(sp.common_name)}</b> ${weedTags(sp)}<br><i class="muted">${h(sp.scientific_name)}</i></div></div>
    <p>${badge(st.status)} <span class="muted">Season ${seasonLabel(new Date(), sp.season_start_month || 1)} · ${h(st.nextWindow)}</span>${st.percentTreated != null && st.percentTreated < 100 ? ` <span class="muted">· ${st.percentTreated}% treated</span>` : ''}</p>
    ${site.deleted ? `<div class="note warn">Deleted ${fmtDate(site.deleted_at)}. Hidden everywhere except Sites > Deleted.<div class="btns"><button data-action="restore-site" data-id="${id}">Restore</button><button class="danger" data-action="purge-site" data-id="${id}">Delete permanently</button></div></div>` : ''}
    ${!site.deleted && site.archived ? `<div class="note warn">Archived ${fmtDate(site.archived_at)}. Hidden from the map, Today and routes. <button class="link" data-action="archive-site" data-id="${id}">Restore</button></div>` : ''}
    ${sp.native ? '<div class="note warn">Indigenous plant: pasture only. Do not treat on roadsides or in bush.</div>' : ''}
    <div class="btns">
      <button class="primary" data-action="log-visit" data-id="${id}">Log visit</button>
      <button data-action="zoom-site" data-id="${id}">Show on map</button>
      ${nav ? `<a class="button" href="https://www.google.com/maps/dir/?api=1&destination=${nav[0]},${nav[1]}" target="_blank" rel="noopener">Directions</a>` : ''}
    </div>
    <dl class="facts">
      <dt>Status</dt><dd>${STATUS_TEXT[st.status]}${site.status_override && site.status_override !== 'active' ? ` (set to ${site.status_override})` : ''}${st.lastVisit ? ` · last visit ${h(visitWhen(st.lastVisit))}` : ''}</dd>
      ${site.location_id ? `<dt>Property / ID</dt><dd>${h(site.location_id)}</dd>` : ''}
      <dt>Land</dt><dd>${h(TENURE[site.tenure] || '-')}${site.land_manager ? ' · ' + h(site.land_manager) : ''}</dd>
      ${site.tenure !== 'private' ? `<dt>Permission</dt><dd>${h(site.permission_ref) || '<span class="warn-text">None recorded</span>'}</dd>` : ''}
      <dt>Shape</dt><dd>${{ Point: 'Point', LineString: 'Line', Polygon: 'Area' }[site.geometry?.type] || '-'}${site.size_value != null ? ` · ${site.size_value} ${h(site.size_unit)}` : ''}</dd>
      <dt>Density</dt><dd>${site.density ? site.density + ' / 5' : '-'}</dd>
      <dt>Priority</dt><dd>${{ 1: 'High', 2: 'Medium', 3: 'Low' }[site.priority] || '-'}</dd>
      <dt>Route</dt><dd>${route ? h(route.name) : '-'}</dd>
      <dt>Control months</dt><dd>${monthsText(sp.control_months)}</dd>
      <dt>Location</dt><dd>${ll ? `${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}` : '-'}</dd>
      <dt>Navigate to</dt><dd>${site.nav_point ? `Your point (${site.nav_point.lat.toFixed(5)}, ${site.nav_point.lng.toFixed(5)})` : site.geometry?.type === 'Point' ? 'The site point' : site.geometry?.type === 'LineString' ? 'Middle of the line' : 'Centre of the area'}
        <br><button class="link" data-action="nav-map" data-id="${id}">Set on map</button> · <button class="link" data-action="nav-gps" data-id="${id}">Use my location</button>${site.nav_point ? ` · <button class="link" data-action="nav-clear" data-id="${id}">Clear</button>` : ''}</dd>
      ${sp.calp_status ? `<dt>Declared (Vic)</dt><dd>${CALP[sp.calp_status]}<br><small class="muted">${CALP_MEANING[sp.calp_status]}</small></dd>` : ''}
      ${site.access_notes ? `<dt>Notes</dt><dd>${h(site.access_notes)}</dd>` : ''}
    </dl>
    ${weedInfoHTML(sp)}
    ${reportHTML(site, sp, ll)}
    <div class="photos" id="site-photos"></div>
    <h3>Visit history (${visits.length})</h3>
    ${visits.length ? visits.map(v => `<div class="visit"><b>${visitWhen(v)}</b> · ${h(METHODS[v.method] || v.method)}${v.plants_found === false ? ' · no plants found' : ''}${v.plants_count != null ? ` · ${v.plants_count} plants` : ''}${v.status_after && v.status_after !== 'active' ? ` · → ${v.status_after === 'monitoring' ? 'Monitoring' : 'Eradicated'}` : ''}${v.percent_treated != null && v.method !== 'inspect' && v.plants_found !== false ? ` · ${v.percent_treated}%` : ''}
      ${v.product_trade_name ? `<br><small>${h(v.product_trade_name)}${v.rate ? ' @ ' + h(v.rate) : ''}${v.wind_speed_kmh ? ` · wind ${h(v.wind_speed_kmh)} km/h ${h(v.wind_direction)}` : ''}</small>` : ''}
      ${v.notes ? `<br><small>${h(v.notes)}</small>` : ''}
      <br><button class="link" data-action="edit-visit" data-id="${v.id}">Edit</button></div>`).join('') : '<p class="muted">No visits yet.</p>'}
    <div class="btns spaced">
      <button data-action="edit-site" data-id="${id}">Edit details</button>
      <button data-action="redraw-site" data-id="${id}">Redraw shape</button>
    </div>`;
  openSheet(site.name, html);
  renderPhotos('#site-photos', site.photos || []);
}

async function renderPhotos(sel, ids) {
  const el = $(sel);
  if (!el || !ids.length) return;
  for (const pid of ids) {
    const p = await db.get('photos', pid);
    if (!p) continue;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(p.blob);
    img.alt = 'Site photo';
    img.addEventListener('click', () => window.open(img.src, '_blank'));
    el.appendChild(img);
  }
}

/* ---------- Site form ---------- */
// Match a typed weed name to the list (common or scientific, any case); otherwise add it as a new weed.
async function resolveSpecies(typed) {
  const name = String(typed || '').trim();
  const lc = name.toLowerCase();
  const hit = Object.values(S.species).find(s => s.common_name.toLowerCase() === lc || (s.scientific_name || '').toLowerCase() === lc);
  if (hit) return hit.id;
  const used = new Set(Object.values(S.species).map(s => s.colour));
  const rec = { id: uid('sp'), common_name: name, scientific_name: '', native: false, colour: PALETTE.find(c => !used.has(c)) || PALETTE[0],
    season_start_month: 1, control_months: [], scouting_months: [], preferred_methods: '', cautions: '', links: {}, seed_info: {}, herbicides: [] };
  await db.put('species', rec);
  S.species[rec.id] = rec;
  toast(`"${name}" added as a new weed. Set its control months in More > Weeds.`, 4500);
  return rec.id;
}
function siteForm(id, geometry) {
  const site = id ? S.sites.find(s => s.id === id) : { geometry, tenure: 'private', density: 3, priority: 2, photos: [] };
  const sz = geometry ? geometrySize(geometry) : null;
  const html = `<form id="site-form">
    <label>Weed <input name="species_name" list="weed-list" required autocomplete="off" placeholder="Start typing, or pick from the list" value="${h(S.species[site.species_id]?.common_name || '')}"></label>
    <datalist id="weed-list">${spList().map(s => `<option value="${h(s.common_name)}">${h(s.scientific_name || '')}</option>`).join('')}</datalist>
    <p class="muted small">A name that isn't on the list is added as a new weed; set its months later in More > Weeds.</p>
    <label>Site name <input name="name" required value="${h(site.name || '')}" placeholder="e.g. Front gate thistles"></label>
    <label>Property address or site ID <input name="location_id" list="loc-list" autocomplete="off" value="${h(site.location_id || '')}" placeholder="e.g. 123 Steels Creek Rd, or RS-01"></label>
    <datalist id="loc-list">${[...new Set(S.sites.map(x => x.location_id).filter(Boolean))].sort().map(l => `<option value="${h(l)}">`).join('')}</datalist>
    <label>Land <select name="tenure">${Object.entries(TENURE).map(([k, v]) => `<option value="${k}" ${site.tenure === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>Land manager <input name="land_manager" value="${h(site.land_manager || '')}" placeholder="Me / Yarra Ranges Council / …"></label>
    <label>Permission reference (public land) <input name="permission_ref" value="${h(site.permission_ref || '')}" placeholder="Council approval no. or date"></label>
    <div class="grid2">
      <label>Density (1–5) <input name="density" type="number" min="1" max="5" value="${h(site.density ?? '')}"></label>
      <label>Priority <select name="priority">${[[1, 'High'], [2, 'Medium'], [3, 'Low']].map(([k, v]) => `<option value="${k}" ${Number(site.priority) === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    <div class="grid2">
      <label>Size <input name="size_value" type="number" min="0" value="${h(site.size_value ?? (sz ? sz.value : ''))}"></label>
      <label>Unit <select name="size_unit">${['plants', 'm', 'm²', 'ha'].map(u => `<option ${(site.size_unit || (sz ? sz.unit : 'plants')) === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
    </div>
    <label>Route <select name="route_id">${routeOptions(site.route_id || '', 'None')}</select></label>
    <label>Access notes <textarea name="access_notes" rows="2">${h(site.access_notes || '')}</textarea></label>
    <label>Management status <select name="status_override"><option value="">Active management</option><option value="monitoring" ${site.status_override === 'monitoring' ? 'selected' : ''}>Monitoring only</option><option value="eradicated" ${site.status_override === 'eradicated' ? 'selected' : ''}>Eradicated (keep watching)</option></select></label>
    <label>Add photo <input type="file" name="photo" accept="image/*" capture="environment"></label>
    <div class="btns"><button class="primary" type="submit">Save site</button><button type="button" data-action="cancel-form" data-id="${id || ''}">Cancel</button></div>
    ${id ? `<div class="btns spaced"><button type="button" data-action="archive-site" data-id="${id}">${site.archived ? 'Restore from archive' : 'Archive this site'}</button><button type="button" class="danger" data-action="delete-site" data-id="${id}">Delete this site</button></div>
    <p class="muted small">Archive keeps the site and its history but hides it from the map, Today and routes. Delete moves it to Sites > Deleted, where you can restore it or delete it permanently.</p>` : ''}
  </form>`;
  openSheet(id ? 'Edit site' : 'New site', html, 'tall');
  $('#site-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const isNew = !id;
    const s = isNew ? { id: uid('site'), created_at: new Date().toISOString(), geometry, photos: [] } : site;
    s.species_id = await resolveSpecies(f.get('species_name'));
    const keepActive = site.status_override === 'active';
    for (const k of ['name', 'location_id', 'tenure', 'land_manager', 'permission_ref', 'size_unit', 'route_id', 'access_notes', 'status_override']) s[k] = (f.get(k) || '').toString().trim() || (k === 'status_override' || k === 'route_id' ? null : '');
    if (!s.status_override && keepActive) s.status_override = 'active';
    for (const k of ['density', 'priority', 'size_value']) s[k] = f.get(k) === '' ? null : Number(f.get(k));
    if (s.route_id && s.route_order == null) s.route_order = S.sites.filter(x => x.route_id === s.route_id).length;
    const file = f.get('photo');
    if (file && file.size) s.photos = [...(s.photos || []), await savePhoto(file)];
    await db.put('sites', s);
    if (isNew) S.sites.push(s);
    renderSites();
    toast(isNew ? 'Site saved' : 'Site updated');
    openSite(s.id);
  });
}

async function savePhoto(file) {
  const blob = await resizeImage(file, 1280, 0.75);
  const p = { id: uid('ph'), blob, created_at: new Date().toISOString() };
  await db.put('photos', p);
  return p.id;
}

function resizeImage(file, max, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => resolve(b || file), 'image/jpeg', quality);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- Visit form ---------- */
function visitForm(siteId, visitId) {
  const site = S.sites.find(s => s.id === siteId);
  const v = visitId ? S.visits.find(x => x.id === visitId) : {
    visit_date: stamp(), visit_time: localTime(new Date().toISOString()), treated_date: '',
    operator: S.settings.operator || '', method: 'chip', plants_found: true, percent_treated: 100,
    situation: site.tenure === 'roadside' ? 'Roadside (non-crop)' : site.tenure === 'other' ? 'Non-crop public land' : 'Pasture / private land',
  };
  const own = S.species[site.species_id]?.herbicides || [];
  const products = [...new Set([...own.map(x => x.product), ...S.visits.map(x => x.product_trade_name)].filter(Boolean))];
  const html = `<form id="visit-form">
    <p class="muted">${h(site.name)} · ${h(S.species[site.species_id]?.common_name || '')}</p>
    <div class="grid3">
      <label>Date visited <input type="date" name="visit_date" value="${h(v.visit_date ?? (v.datetime ? localDate(v.datetime) : ''))}"></label>
      <label>Time <input type="time" name="visit_time" value="${h(v.visit_time ?? (v.datetime ? localTime(v.datetime) : ''))}"></label>
      <label>Date treated <input type="date" name="treated_date" value="${h(v.treated_date || '')}"></label>
    </div>
    <p class="muted small">All optional. If "Date treated" is blank, a treatment counts on the date visited.</p>
    <label>Operator <input name="operator" value="${h(v.operator || '')}"></label>
    <label>Method <select name="method">${Object.entries(METHODS).map(([k, t]) => `<option value="${k}" ${v.method === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <div class="grid2">
      <label class="chk"><input type="checkbox" name="plants_found" ${v.plants_found !== false ? 'checked' : ''}> Plants found</label>
      <label>% of site treated <input type="number" name="percent_treated" min="0" max="100" value="${h(v.percent_treated ?? '')}"></label>
    </div>
    <label>Number of plants found (optional) <input type="number" name="plants_count" min="0" inputmode="numeric" value="${h(v.plants_count ?? '')}"></label>
    <label>Management status after this visit <select name="mgmt_status">${[['active', 'Active management'], ['monitoring', 'Monitoring only'], ['eradicated', 'Eradicated (keep watching)']].map(([k, t]) => `<option value="${k}" ${(site.status_override || 'active') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <fieldset id="chem" ${CHEM_METHODS.includes(v.method) ? '' : 'hidden'}>
      <legend>Chemical use record (Victoria: within 48 hours, keep 2 years)</legend>
      <label>Product trade name <input name="product_trade_name" list="products" value="${h(v.product_trade_name || '')}"><datalist id="products">${products.map(p => `<option value="${h(p)}">`).join('')}</datalist></label>
      <label>Active ingredient(s) <input name="active_ingredient" value="${h(v.active_ingredient || '')}" placeholder="from the label"></label>
      <div class="grid2">
        <label>Rate <input name="rate" value="${h(v.rate || '')}" placeholder="as per label, e.g. 10 g/100 L"></label>
        <label>Volume used <input name="volume_used" value="${h(v.volume_used || '')}" placeholder="e.g. 15 L"></label>
      </div>
      <label>Situation <input name="situation" value="${h(v.situation || '')}"></label>
      <div class="grid3">
        <label>Wind km/h <input name="wind_speed_kmh" type="number" min="0" value="${h(v.wind_speed_kmh ?? '')}"></label>
        <label>Wind from <select name="wind_direction"><option value=""></option>${WIND.map(w => `<option ${v.wind_direction === w ? 'selected' : ''}>${w}</option>`).join('')}</select></label>
        <label>Temp °C <input name="temp_c" type="number" value="${h(v.temp_c ?? '')}"></label>
      </div>
      <p class="muted small">All optional. For a complete Victorian record include product, rate, situation, and wind speed and direction. Follow the product label for rates and restrictions; this app records what you did and is not advice.</p>
    </fieldset>
    <label>Kill % at follow-up check <input name="kill_percent_followup" type="number" min="0" max="100" value="${h(v.kill_percent_followup ?? '')}"></label>
    <label>Notes <textarea name="notes" rows="2">${h(v.notes || '')}</textarea></label>
    <label>Add photo <input type="file" name="photo" accept="image/*" capture="environment"></label>
    <div class="btns"><button class="primary" type="submit">Save visit</button><button type="button" data-action="open-site" data-id="${siteId}">Cancel</button>
    ${visitId ? `<button type="button" class="danger" data-action="delete-visit" data-id="${visitId}">Delete</button>` : ''}</div>
  </form>`;
  openSheet(visitId ? 'Edit visit' : 'Log visit', html, 'tall');
  const form = $('#visit-form');
  form.method.addEventListener('change', () => { $('#chem').hidden = !CHEM_METHODS.includes(form.method.value); });
  form.plants_found.addEventListener('change', () => {
    form.mgmt_status.value = form.plants_found.checked ? (site.status_override === 'monitoring' || site.status_override === 'eradicated' ? site.status_override : 'active') : 'monitoring';
  });
  form.product_trade_name.addEventListener('change', () => {
    const m = own.find(x => x.product === form.product_trade_name.value);
    if (m && m.active && !form.active_ingredient.value) form.active_ingredient.value = m.active;
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(form);
    const method = f.get('method');
    const chem = CHEM_METHODS.includes(method) && method !== 'other' || (method === 'other' && f.get('product_trade_name'));
    const missing = chem ? [['product_trade_name', 'product'], ['rate', 'rate'], ['wind_speed_kmh', 'wind speed'], ['wind_direction', 'wind direction']].filter(([k]) => !String(f.get(k) || '').trim()).map(([, t]) => t) : [];
    const rec = visitId ? v : { id: uid('visit'), site_id: siteId, photos: [], created_at: new Date().toISOString() };
    rec.visit_date = f.get('visit_date') || '';
    rec.visit_time = f.get('visit_time') || '';
    rec.treated_date = f.get('treated_date') || '';
    // Sort/season key: treated date, else visit date, else when the record was made.
    const keyDate = rec.treated_date || rec.visit_date;
    rec.datetime = keyDate ? new Date(`${keyDate}T${rec.visit_time || '12:00'}`).toISOString() : (rec.datetime || rec.created_at || new Date().toISOString());
    rec.operator = (f.get('operator') || '').trim();
    rec.method = method;
    rec.plants_found = f.get('plants_found') === 'on';
    const ms = f.get('mgmt_status') || 'active';
    rec.status_after = ms;
    // 'active' is stored explicitly only when no plants were found, so it overrides the automatic switch to monitoring.
    const newOverride = ms === 'active' ? (rec.plants_found ? null : 'active') : ms;
    if (site.status_override !== newOverride) { site.status_override = newOverride; await db.put('sites', site); }
    for (const k of ['product_trade_name', 'active_ingredient', 'rate', 'volume_used', 'situation', 'wind_direction', 'notes']) rec[k] = CHEM_METHODS.includes(method) || k === 'notes' ? String(f.get(k) || '').trim() : '';
    for (const k of ['percent_treated', 'kill_percent_followup', 'wind_speed_kmh', 'temp_c', 'plants_count']) {
      const val = f.get(k);
      rec[k] = val === '' || val == null || (!CHEM_METHODS.includes(method) && ['wind_speed_kmh', 'temp_c'].includes(k)) ? null : Number(val);
    }
    const file = f.get('photo');
    if (file && file.size) rec.photos = [...(rec.photos || []), await savePhoto(file)];
    await db.put('visits', rec);
    if (!visitId) S.visits.push(rec);
    if (rec.operator && rec.operator !== S.settings.operator) { S.settings.operator = rec.operator; saveSettings(); }
    renderSites();
    toast(missing.length ? `Visit saved. Not filled in for the Victorian chemical record: ${missing.join(', ')}.` : 'Visit saved', missing.length ? 5000 : 2500);
    openSite(siteId);
  });
}

/* ---------- Records ---------- */
function renderRecords(from, to) {
  const d = new Date();
  to = to || stamp();
  if (!from) { const f = new Date(d); f.setFullYear(f.getFullYear() - 2); from = localDate(f.toISOString()); }
  const rows = chemicalRows(dataSnapshot(), from, to);
  const html = `<p class="muted">Victorian law: record agricultural chemical use within 48 hours and keep records for 2 years. Each spray or wipe visit you log appears here.</p>
    <div class="controls"><label>From <input type="date" data-action="rec-from" value="${from}"></label><label>To <input type="date" data-action="rec-to" value="${to}"></label></div>
    <div class="btns"><button data-action="export-chem" ${rows.length ? '' : 'disabled'}>Export CSV</button></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Site</th><th>Product</th><th>Rate</th><th>Wind</th><th>Operator</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${h(r.date)} ${h(r.start_time)}</td><td>${h(r.site_name)}</td><td>${h(r.product_trade_name)}</td><td>${h(r.rate)}</td><td>${h(r.wind_speed_kmh)} ${h(r.wind_direction)}</td><td>${h(r.operator)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="empty">No chemical use recorded in this period.</p>'}`;
  openSheet('Chemical records', html, 'tall');
  S._rec = { from, to };
}

/* ---------- More ---------- */
function renderMore() {
  const html = `${backupNag()}
    <h3>Backup and export</h3>
    <p class="muted">Your sites and visits are stored only in this browser on this device. Back up regularly; restore a backup to move data to another device.</p>
    <div class="btns"><button class="primary" data-action="backup">Back up now</button><label class="button">Restore backup<input type="file" accept=".json,application/json" data-action="restore" hidden></label></div>
    <div class="btns"><button data-action="export-csv">Sites CSV</button><button data-action="export-geojson">GeoJSON</button><button data-action="export-kml">KML (Google Earth)</button></div>
    <h3>Property boundaries</h3>
    <p class="muted small">"Boundaries" on the map shows Victoria's land parcel lines (Vicmap, open data) when zoomed in. They are approximate, not a survey. You can also draw your own.</p>
    ${S.boundaries.map(bd => `<div class="row"><span class="row-main"><b>${h(bd.name || 'Unnamed boundary')}</b><small>${geometrySize(bd.geometry)?.value ? (geometrySize(bd.geometry).value / 10000).toFixed(2) + ' ha approx.' : ''}</small></span><span class="row-side"><button class="link" data-action="zoom-boundary" data-id="${bd.id}">Show</button> <button class="link danger" data-action="delete-boundary" data-id="${bd.id}">Delete</button></span></div>`).join('')}
    <div class="btns"><button data-action="draw-boundary">+ Draw a boundary</button><button data-action="toggle-parcels">${S.settings.parcels ? 'Hide' : 'Show'} Vicmap boundaries</button></div>
    <h3>Routes</h3>
    ${S.routes.map(r => `<div class="row"><span class="row-main"><b>${h(r.name)}</b><small>${S.sites.filter(s => s.route_id === r.id).length} sites</small></span><span class="row-side"><button class="link" data-action="rename-route" data-id="${r.id}">Rename</button> <button class="link danger" data-action="delete-route" data-id="${r.id}">Delete</button></span></div>`).join('') || '<p class="muted">No routes yet, e.g. "Property loop" or "Steels Creek Rd walk".</p>'}
    <form id="route-form" class="inline"><input name="name" placeholder="New route name" required><button type="submit">Add route</button></form>
    <h3>Weeds</h3>
    ${spList().map(s => `<div class="row" data-action="edit-species" data-id="${s.id}"><span class="sw" style="background:${s.colour}"></span><span class="row-main"><b>${h(s.common_name)}</b> ${weedTags(s)}<small>Control: ${monthsText(s.control_months)} · season starts ${MONTHS[s.season_start_month - 1]}</small></span></div>`).join('')}
    <div class="btns"><button class="primary" data-action="weed-library">Add from weed library</button><button data-action="edit-species" data-id="">+ Add weed by hand</button></div>
    <h3>Settings</h3>
    <form id="settings-form" class="inline"><input name="operator" placeholder="Your name (operator)" value="${h(S.settings.operator)}"><button type="submit">Save</button></form>
    <p class="muted small" id="persist-status"></p>
    <h3>About</h3>
    <p class="muted small">Weed Site Manager · version ${APP_VERSION} · proof of concept, Stage 1. Treatment windows are estimates for the Yarra Valley; always follow the product label and current Agriculture Victoria rules. This app is not advice.<br>
    Map data &copy; OpenStreetMap contributors. Imagery &copy; Esri, Maxar, Earthstar Geographics. Property boundaries &copy; State of Victoria (Vicmap), CC BY; approximate only. Map library: Leaflet.<br>
    Install: in your phone browser's menu choose "Add to Home Screen".</p>`;
  openSheet('More', html, 'tall');
  $('#route-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = new FormData(e.target).get('name').trim();
    if (!name) return;
    const r = { id: uid('route'), name };
    await db.put('routes', r);
    S.routes.push(r);
    S.routes.sort((a, b) => a.name.localeCompare(b.name));
    renderMore();
  });
  $('#settings-form').addEventListener('submit', e => {
    e.preventDefault();
    S.settings.operator = new FormData(e.target).get('operator').trim();
    saveSettings();
    toast('Saved');
  });
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = $('#persist-status'); if (el) el.textContent = p ? 'Storage: protected from automatic clearing.' : 'Storage: the browser may clear it under pressure. Back up regularly.'; });
}

const herbRow = x => `<div class="herb-row">
  <input name="h_product" placeholder="Product (trade name)" value="${h(x.product || '')}">
  <input name="h_active" placeholder="Active ingredient" value="${h(x.active || '')}">
  <input name="h_notes" placeholder="Notes (e.g. when you use it)" value="${h(x.notes || '')}">
  <input name="h_label" type="url" placeholder="Label link (optional)" value="${h(x.label_url || '')}">
  <button type="button" class="link danger herb-del">Remove</button></div>`;


/* ---------- weed library (Stage 2): search the Atlas of Living Australia ---------- */
const ALA_SEARCH = 'https://bie-ws.ala.org.au/ws/search.json';
const alaSpeciesURL = guid => `https://bie.ala.org.au/species/${encodeURI(guid)}`; // the Atlas expects the ID as-is (often itself a URL)
const LIB = { results: [], timer: null, seq: 0 };

function weedLibrary() {
  openSheet('Weed library', `
    <p class="small muted">Search the Atlas of Living Australia by common or scientific name. Needs internet.</p>
    <label>Weed name <input id="lib-q" type="search" autocomplete="off" value="${h(LIB.q || '')}" placeholder="e.g. Paterson's curse, Ulex"></label>
    <div id="lib-results"></div>
    <div class="btns"><button data-action="tab" data-tab="more">Back</button></div>`, 'tall');
  const q = $('#lib-q');
  q.addEventListener('input', () => { clearTimeout(LIB.timer); LIB.timer = setTimeout(() => librarySearch(q.value), 450); });
  if (LIB.q) librarySearch(LIB.q); else q.focus();
}

// Native or introduced, if the Atlas says so; otherwise null (unknown).
function alaNative(r) {
  const v = JSON.stringify([r.nativeIntroduced, r.establishmentMeans, r.occurrenceStatus].filter(Boolean)).toLowerCase();
  if (/introduced|naturali[sz]ed|alien/.test(v)) return false;
  if (/native|indigenous|endemic/.test(v)) return true;
  return null;
}

async function librarySearch(text) {
  const term = text.trim();
  LIB.q = term;
  const out = $('#lib-results');
  if (!out) return;
  if (term.length < 3) { out.innerHTML = term ? '<p class="muted small">Type at least 3 letters.</p>' : ''; return; }
  if (!navigator.onLine) { out.innerHTML = '<p class="warn-text">You\'re offline. The weed library needs internet; you can still add a weed by hand.</p>'; return; }
  const seq = ++LIB.seq;
  out.innerHTML = '<p class="muted small">Searching…</p>';
  try {
    const url = `${ALA_SEARCH}?q=${encodeURIComponent(term)}&fq=idxtype:TAXON&pageSize=30`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`The Atlas replied with error ${res.status}`);
    const data = await res.json();
    if (seq !== LIB.seq) return; // a newer search has started
    const rows = (data.searchResults?.results || [])
      .filter(r => r.guid && (r.scientificName || r.name))
      .filter(r => !r.kingdom || /plant/i.test(r.kingdom))
      .filter(r => !r.rank || /species|subspecies|variety|form|genus/i.test(r.rank))
      .filter(r => !r.taxonomicStatus || /accepted/i.test(r.taxonomicStatus));
    LIB.results = rows;
    if (!rows.length) { out.innerHTML = '<p class="muted small">No plants found. Try the scientific name, or add the weed by hand.</p>'; return; }
    const have = new Set(Object.values(S.species).map(x => (x.scientific_name || '').toLowerCase()).filter(Boolean));
    out.innerHTML = rows.map((r, i) => {
      const sci = r.scientificName || r.name;
      const img = r.thumbnailUrl || r.smallImageUrl || '';
      const added = have.has(sci.toLowerCase());
      return `<div class="row lib-row" data-action="lib-pick" data-id="${i}">
        ${img ? `<img class="lib-thumb" src="${h(img)}" alt="" loading="lazy">` : '<span class="lib-thumb none"></span>'}
        <span class="row-main"><b>${h(r.commonNameSingle || r.commonName?.split(',')[0] || sci)}</b>${added ? ' <span class="tag">Already added</span>' : ''}
        <small><i>${h(sci)}</i>${r.family ? ` · ${h(r.family)}` : ''}${r.rank ? ` · ${h(r.rank)}` : ''}</small></span></div>`;
    }).join('') + '<p class="small muted">Results from the Atlas of Living Australia.</p>';
  } catch (err) {
    if (seq !== LIB.seq) return;
    out.innerHTML = `<p class="warn-text">Couldn't reach the Atlas of Living Australia (${h(err.message || 'network error')}). Try again later, or add the weed by hand.</p>`;
  }
}

function libraryPick(i) {
  const r = LIB.results[i];
  if (!r) return;
  const sci = r.scientificName || r.name;
  const common = r.commonNameSingle || r.commonName?.split(',')[0]?.trim() || sci;
  const existing = Object.values(S.species).find(x => (x.scientific_name || '').toLowerCase() === sci.toLowerCase());
  const nat = alaNative(r);
  const used = new Set(Object.values(S.species).map(x => x.colour));
  const colour = PALETTE.find(c => !used.has(c)) || PALETTE[0];
  const img = r.imageUrl || r.largeImageUrl || r.smallImageUrl || r.thumbnailUrl || '';
  openSheet('Add weed', `
    ${img ? `<img class="lib-photo" src="${h(img)}" alt="${h(common)}">` : ''}
    <p><b>${h(common)}</b><br><i>${h(sci)}</i>${r.family ? `<br><small class="muted">Family ${h(r.family)}</small>` : ''}</p>
    ${existing ? `<div class="note warn">You already have this weed as "${h(existing.common_name)}". <button class="link" data-action="edit-species" data-id="${existing.id}">Open it</button></div>` : ''}
    <form id="lib-form">
      <label>Common name <input name="common_name" required value="${h(common)}"></label>
      <label>Colour on the map <input type="color" name="colour" value="${colour}"></label>
      <label class="chk"><input type="checkbox" name="native" ${nat === true ? 'checked' : ''}> Native / indigenous plant</label>
      <p class="small muted">${nat === null ? 'The Atlas didn\'t say whether this plant is native. Check its Atlas page before treating.' : `The Atlas lists it as ${nat ? 'native' : 'introduced'}.`} <a href="${alaSpeciesURL(r.guid)}" target="_blank" rel="noopener">Atlas page</a></p>
      <p class="small muted">After adding, set its season and control months, declared status and WoNS with Edit.</p>
      <div class="btns"><button class="primary" type="submit">Add weed</button><button type="button" data-action="weed-library">Back to results</button></div>
    </form>`, 'tall');
  $('#lib-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const today = localDate(new Date().toISOString());
    const rec = { id: uid('sp'), common_name: f.get('common_name').trim(), scientific_name: sci, native: f.get('native') === 'on',
      colour: f.get('colour'), season_start_month: 1, control_months: [], scouting_months: [], preferred_methods: '', cautions: '',
      links: { weeds_australia: searchWA(common), ala: alaSpeciesURL(r.guid), agvic: '', council: '' },
      seed_info: {}, herbicides: [], wons: false, calp_status: '', calp_note: '',
      family: r.family || '', ala_guid: r.guid, image_url: img,
      source: { name: 'Atlas of Living Australia', added: today, checked: today } };
    await db.put('species', rec);
    S.species[rec.id] = rec;
    toast(`${rec.common_name} added. Now set its months with Edit.`, 4000);
    speciesView(rec.id);
  });
}

function speciesView(id) {
  const sp = S.species[id];
  if (!sp) return speciesForm('');
  const n = live().filter(x => x.species_id === id).length;
  const editBtn = `<button class="primary" data-action="edit-species-form" data-id="${id}">Edit</button>`;
  const html = `
    <div class="btns">${editBtn}<button data-action="tab" data-tab="more">Back</button></div>
    <div class="site-head"><span class="sw big" style="background:${sp.colour}"></span><div><b>${h(sp.common_name)}</b> ${weedTags(sp)}<br><i class="muted">${h(sp.scientific_name || '')}</i>${sp.family ? `<br><small class="muted">Family ${h(sp.family)}</small>` : ''}</div></div>
    ${sp.image_url ? `<img class="lib-photo" src="${h(sp.image_url)}" alt="${h(sp.common_name)}" loading="lazy"><p class="small muted">Photo: Atlas of Living Australia${sp.ala_guid ? ` (<a href="${alaSpeciesURL(sp.ala_guid)}" target="_blank" rel="noopener">credits</a>)` : ''}</p>` : ''}
    ${sp.native ? '<div class="note warn">Indigenous plant: pasture only. Do not treat on roadsides or in bush.</div>' : ''}
    <dl class="facts">
      <dt>Season starts</dt><dd>${MONTHS[(sp.season_start_month || 1) - 1]}</dd>
      <dt>Control months</dt><dd>${monthsText(sp.control_months)}</dd>
      <dt>Scouting months</dt><dd>${monthsText(sp.scouting_months || [])}</dd>
      <dt>WoNS</dt><dd>${sp.wons ? 'Yes, a Weed of National Significance' : 'No'}</dd>
      <dt>Declared (Vic)</dt><dd>${CALP[sp.calp_status || '']}<br><small>${CALP_MEANING[sp.calp_status || '']}</small>${sp.calp_note ? `<br><small class="muted">${h(sp.calp_note)}</small>` : ''}<br><a class="small" href="${CALP_INFO_URL}" target="_blank" rel="noopener">What the categories mean</a> · <a class="small" href="${CALP_LIST_URL}" target="_blank" rel="noopener">Lists by region</a></dd>
      <dt>Your sites</dt><dd>${n}</dd>
      ${sp.source ? `<dt>Source</dt><dd>${h(sp.source.name)}<br><small class="muted">Added ${h(sp.source.added || '')}${sp.source.checked ? ` · last checked ${h(sp.source.checked)}` : ''}</small></dd>` : ''}
    </dl>
    ${weedInfoHTML(sp, true)}
    <div class="btns">${editBtn}<button data-action="tab" data-tab="more">Back</button></div>`;
  openSheet('Weed', html, 'tall');
}

function speciesForm(id) {
  const s = id ? S.species[id] : { colour: '#ff5722', season_start_month: 1, control_months: [], scouting_months: [], links: {} };
  const monthBoxes = (name, sel) => `<div class="months">${MONTHS.map((m, i) => `<label><input type="checkbox" name="${name}" value="${i + 1}" ${sel.includes(i + 1) ? 'checked' : ''}>${m}</label>`).join('')}</div>`;
  const html = `<form id="sp-form">
    ${id ? `<div class="btns"><button class="primary" type="submit">Save</button><button type="button" data-action="edit-species" data-id="${id}">Cancel</button></div>` : ''}
    <label>Common name <input name="common_name" required value="${h(s.common_name || '')}"></label>
    <label>Scientific name <input name="scientific_name" value="${h(s.scientific_name || '')}"></label>
    <div class="grid2"><label>Colour <input type="color" name="colour" value="${h(s.colour)}"></label>
    <label>Season starts <select name="season_start_month">${MONTHS.map((m, i) => `<option value="${i + 1}" ${s.season_start_month === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select></label></div>
    <label class="chk"><input type="checkbox" name="native" ${s.native ? 'checked' : ''}> Native / indigenous plant</label>
    <label class="chk"><input type="checkbox" name="wons" ${s.wons ? 'checked' : ''}> Weed of National Significance (WoNS)</label>
    <label>Declared status (Victoria) <select name="calp_status">${Object.entries(CALP).map(([k, t]) => `<option value="${k}" ${(s.calp_status || '') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <p class="small muted">Categories are set per catchment region (yours: Port Phillip & Westernport). <a href="${CALP_INFO_URL}" target="_blank" rel="noopener">What they mean</a> · <a href="${CALP_LIST_URL}" target="_blank" rel="noopener">Lists by region</a></p>
    <label>Declared status note <input name="calp_note" value="${h(s.calp_note || '')}" placeholder="e.g. region, date checked"></label>
    <p><b>Control months</b></p>${monthBoxes('control_months', s.control_months)}
    <p><b>Scouting months</b></p>${monthBoxes('scouting_months', s.scouting_months || [])}
    <label>Preferred methods <textarea name="preferred_methods" rows="2">${h(s.preferred_methods || '')}</textarea></label>
    <label>Cautions <textarea name="cautions" rows="2">${h(s.cautions || '')}</textarea></label>
    <label>Seed set (when, how long after flowering) <textarea name="seed_set" rows="2">${h(s.seed_info?.seed_set || '')}</textarea></label>
    <label>Seed production <textarea name="seed_seeds" rows="2">${h(s.seed_info?.seeds || '')}</textarea></label>
    <label>Seed bank (how long seed survives in soil) <textarea name="seed_bank" rows="2">${h(s.seed_info?.seed_bank || '')}</textarea></label>
    <label>Spreads by <textarea name="seed_spread" rows="2">${h(s.seed_info?.spread || '')}</textarea></label>
    <label>Seed info source link <input name="seed_source" type="url" value="${h(s.seed_info?.source || '')}"></label>
    <label>Weeds Australia link <input name="link_wa" type="url" value="${h(s.links?.weeds_australia || '')}" placeholder="Blank = search by name"></label>
    <label>Atlas of Living Australia link <input name="link_ala" type="url" value="${h(s.links?.ala || '')}" placeholder="Blank = search by name"></label>
    <label>Agriculture Victoria link <input name="link_agvic" type="url" value="${h(s.links?.agvic || '')}"></label>
    <label>Other info link <input name="link" type="url" value="${h(s.links?.council || '')}"></label>
    <p><b>Your herbicides for this weed</b> <span class="muted small">(your own notes; follow the label)</span></p>
    <div id="herb-rows">${(s.herbicides || []).map(herbRow).join('')}</div>
    <div class="btns"><button type="button" id="herb-add">+ Add herbicide</button></div>
    <div class="btns"><button class="primary" type="submit">Save</button><button type="button" data-action="${id ? 'edit-species' : 'tab'}" data-tab="more" data-id="${id || ''}">Cancel</button>
    ${id && !S.sites.some(x => x.species_id === id) ? `<button type="button" class="danger" data-action="delete-species" data-id="${id}">Delete</button>` : ''}</div>
  </form>`;
  openSheet(id ? 'Edit weed' : 'Add weed', html, 'tall');
  $('#herb-add').addEventListener('click', () => $('#herb-rows').insertAdjacentHTML('beforeend', herbRow({})));
  $('#herb-rows').addEventListener('click', e => { if (e.target.classList.contains('herb-del')) e.target.closest('.herb-row').remove(); });
  $('#sp-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const rec = id ? s : { id: uid('sp'), links: {} };
    rec.common_name = f.get('common_name').trim();
    rec.scientific_name = f.get('scientific_name').trim();
    rec.colour = f.get('colour');
    rec.season_start_month = Number(f.get('season_start_month'));
    rec.native = f.get('native') === 'on';
    rec.wons = f.get('wons') === 'on';
    rec.calp_status = f.get('calp_status');
    rec.calp_note = f.get('calp_note').trim();
    rec.control_months = f.getAll('control_months').map(Number);
    rec.scouting_months = f.getAll('scouting_months').map(Number);
    rec.preferred_methods = f.get('preferred_methods').trim();
    rec.cautions = f.get('cautions').trim();
    rec.links = { ...(rec.links || {}), weeds_australia: f.get('link_wa').trim(), ala: f.get('link_ala').trim(), agvic: f.get('link_agvic').trim(), council: f.get('link').trim() };
    rec.herbicides = [...document.querySelectorAll('#herb-rows .herb-row')].map(r => ({
      product: r.querySelector('[name=h_product]').value.trim(), active: r.querySelector('[name=h_active]').value.trim(),
      notes: r.querySelector('[name=h_notes]').value.trim(), label_url: r.querySelector('[name=h_label]').value.trim(),
    })).filter(x => x.product || x.active);
    rec.seed_info = { ...(rec.seed_info || {}), seed_set: f.get('seed_set').trim(), seeds: f.get('seed_seeds').trim(), seed_bank: f.get('seed_bank').trim(), spread: f.get('seed_spread').trim(), source: f.get('seed_source').trim() };
    await db.put('species', rec);
    S.species[rec.id] = rec;
    renderSites();
    toast('Weed saved');
    speciesView(rec.id);
  });
}

/* ---------- export helpers ---------- */
function dataSnapshot() { return { species: Object.values(S.species), sites: S.sites, visits: S.visits, routes: S.routes }; }

async function doBackup() {
  const photos = await db.all('photos');
  const json = await backupJSON({ ...dataSnapshot(), photos, meta: [S.settings, { id: 'boundaries', list: S.boundaries }] });
  download(`weed-sites-backup-${stamp()}.json`, json, 'application/json');
  S.settings.lastBackup = new Date().toISOString();
  saveSettings();
  toast('Backup saved to your downloads');
}

async function doRestore(file) {
  try {
    const b = await parseBackup(await file.text());
    if (!confirm(`Replace everything on this device with this backup (${b.sites.length} sites, ${b.visits.length} visits)?`)) return;
    for (const st of ['species', 'sites', 'visits', 'routes', 'photos']) { await db.clear(st); if (b[st].length) await db.putMany(st, b[st]); }
    const settings = (b.meta || []).find(m => m.id === 'settings');
    if (settings) await db.put('meta', { ...settings, lastBackup: new Date().toISOString() });
    await db.put('meta', (b.meta || []).find(m => m.id === 'boundaries') || { id: 'boundaries', list: [] });
    await load();
    renderSites();
    renderBoundaries();
    fitAll();
    toast('Backup restored');
    renderMore();
  } catch (err) {
    toast(err.message || 'Could not read that file', 4000);
  }
}

/* ---------- events ---------- */
async function onAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;
  if (['route-filter', 'route-filter-sites', 'loc-filter', 'today-all', 'site-search', 'rec-from', 'rec-to', 'restore'].includes(a) && e.type === 'click') return;
  switch (a) {
    case 'tab': showTab(el.dataset.tab); break;
    case 'toggle-species': {
      const name = S.species[id]?.common_name || 'Weed';
      if (S.hidden.has(id)) { S.hidden.delete(id); toast(`${name} shown`); } else { S.hidden.add(id); toast(`${name} hidden on the map. Tap ○ to show it again.`); }
      renderSites(); break;
    }
    case 'legend-open': {
      const b = map.getBounds();
      const list = live().filter(s => s.species_id === id && (ll => ll && b.contains(ll))(siteLatLng(s)));
      if (list.length === 1) openSite(list[0].id);
      else openSheet(`${S.species[id]?.common_name || 'Weed'} sites on screen`, list.map(s => siteRow(s)).join('') || '<p class="empty">None on screen.</p>');
      break;
    }
    case 'open-site': openSite(id); break;
    case 'report-weedscan': {
      const site = S.sites.find(s => s.id === id); const sp = S.species[site.species_id] || {};
      const text = reportText(site, sp, siteLatLng(site));
      (navigator.clipboard?.writeText(text) || Promise.reject()).then(() => toast('Details copied. Paste them into WeedScan.', 4000), () => toast('Copy the details from the box by hand.', 4000));
      window.open(WEEDSCAN_URL, '_blank', 'noopener');
      break;
    }
    case 'nav-map': startDraw('point', 'tap'); S.draw.navFor = id; zoomTo(S.sites.find(s => s.id === id)); updateDrawBar(); break;
    case 'nav-gps': {
      if (!S.pos) { toast('Waiting for GPS…'); break; }
      await setNavPoint(id, S.pos.ll); break;
    }
    case 'nav-clear': await setNavPoint(id, null); break;
    case 'weed-library': weedLibrary(); break;
    case 'lib-pick': libraryPick(Number(id)); break;
    case 'set-basemap': setBasemap(id); hideSheet(); break;
    case 'zoom-site': { const site = S.sites.find(s => s.id === id); zoomTo(site); hideSheet(); showTab('map', false); break; }
    case 'log-visit': visitForm(id); break;
    case 'edit-visit': visitForm(S.visits.find(v => v.id === id).site_id, id); break;
    case 'delete-visit': {
      if (!confirm('Delete this visit?')) return;
      const v = S.visits.find(x => x.id === id);
      await db.del('visits', id);
      S.visits = S.visits.filter(x => x.id !== id);
      renderSites(); openSite(v.site_id); break;
    }
    case 'edit-site': siteForm(id); break;
    case 'cancel-form': id ? openSite(id) : closeSheet(); break;
    case 'redraw-site': {
      const site = S.sites.find(s => s.id === id);
      const type = { Point: 'point', LineString: 'line', Polygon: 'area' }[site.geometry.type];
      startDraw(type, 'tap'); S.draw.editId = id; zoomTo(site); break;
    }
    case 'delete-site': {
      const site = S.sites.find(s => s.id === id);
      site.deleted = true; site.deleted_at = new Date().toISOString();
      await db.put('sites', site);
      renderSites(); toast('Moved to Sites > Deleted. You can restore it from there.', 4000); renderSiteList(); break;
    }
    case 'restore-site': {
      const site = S.sites.find(s => s.id === id);
      site.deleted = false; site.deleted_at = null;
      await db.put('sites', site);
      renderSites(); toast('Site restored'); openSite(id); break;
    }
    case 'purge-site': {
      if (!confirm('Permanently delete this site, its visits and photos? This cannot be undone.')) return;
      const site = S.sites.find(s => s.id === id);
      for (const v of S.visits.filter(x => x.site_id === id)) { for (const ph of v.photos || []) await db.del('photos', ph); await db.del('visits', v.id); }
      for (const ph of site?.photos || []) await db.del('photos', ph);
      await db.del('sites', id);
      S.visits = S.visits.filter(x => x.site_id !== id);
      S.sites = S.sites.filter(s => s.id !== id);
      renderSites(); toast('Site permanently deleted'); renderSiteList(); break;
    }
    case 'draw-boundary': startDraw('area', 'tap'); S.draw.boundary = true; updateDrawBar(); break;
    case 'toggle-parcels': setParcels(!S.settings.parcels); renderMore(); break;
    case 'zoom-boundary': {
      const bd = S.boundaries.find(x => x.id === id);
      map.fitBounds(bd.geometry.coordinates[0].map(p => [p[1], p[0]]), { padding: [40, 40] }); hideSheet(); showTab('map', false); break;
    }
    case 'delete-boundary': {
      if (!confirm('Delete this boundary?')) return;
      S.boundaries = S.boundaries.filter(x => x.id !== id); await saveBoundaries(); renderBoundaries(); renderMore(); break;
    }
    case 'add-site': addSiteMenu(); break;
    case 'archive-site': {
      const site = S.sites.find(s => s.id === id);
      site.archived = !site.archived;
      site.archived_at = site.archived ? new Date().toISOString() : null;
      await db.put('sites', site);
      renderSites();
      toast(site.archived ? 'Site archived. Find it under Sites > Archived.' : 'Site restored');
      if (site.archived) renderSiteList(); else openSite(id);
      break;
    }
    case 'draw': startDraw(el.dataset.type, el.dataset.how); break;
    case 'suggest-order': suggestOrder(); break;
    case 'move': moveSite(id, Number(el.dataset.dir)); break;
    case 'backup': doBackup(); break;
    case 'export-csv': download(`weed-sites-${stamp()}.csv`, sitesCSV(dataSnapshot()), 'text/csv'); break;
    case 'export-geojson': download(`weed-sites-${stamp()}.geojson`, toGeoJSON(dataSnapshot()), 'application/geo+json'); break;
    case 'export-kml': download(`weed-sites-${stamp()}.kml`, toKML(dataSnapshot()), 'application/vnd.google-earth.kml+xml'); break;
    case 'export-chem': download(`chemical-use-record-${S._rec.from}-to-${S._rec.to}.csv`, toCSV(chemicalRows(dataSnapshot(), S._rec.from, S._rec.to), CHEM_COLS), 'text/csv'); break;
    case 'rename-route': {
      const r = S.routes.find(x => x.id === id);
      const name = prompt('Route name', r.name);
      if (name && name.trim()) { r.name = name.trim(); await db.put('routes', r); renderMore(); }
      break;
    }
    case 'delete-route': {
      if (!confirm('Delete this route? Its sites stay, without a route.')) return;
      for (const s of S.sites.filter(x => x.route_id === id)) { s.route_id = null; s.route_order = null; await db.put('sites', s); }
      await db.del('routes', id);
      S.routes = S.routes.filter(r => r.id !== id);
      if (S.routeFilter === id) S.routeFilter = '';
      renderMore(); break;
    }
    case 'edit-species': id ? speciesView(id) : speciesForm(''); break;
    case 'edit-species-form': speciesForm(id); break;
    case 'delete-species': {
      if (!confirm('Delete this weed from the list?')) return;
      await db.del('species', id); delete S.species[id]; renderMore(); break;
    }
  }
}

function onChange(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'route-filter') { S.routeFilter = el.value; renderToday(); }
  if (a === 'route-filter-sites') { S.routeFilter = el.value; renderSiteList(); }
  if (a === 'loc-filter') { S.locFilter = el.value; renderSiteList(); }
  if (a === 'today-all') { S.showAllToday = el.checked; renderToday(); }
  if (a === 'rec-from' || a === 'rec-to') renderRecords($('[data-action="rec-from"]').value, $('[data-action="rec-to"]').value);
  if (a === 'restore' && el.files[0]) doRestore(el.files[0]);
}

function zoomTo(site) {
  if (!site?.geometry) return;
  if (site.geometry.type === 'Point') map.setView(siteLatLng(site), Math.max(map.getZoom(), 18));
  else {
    const g = site.geometry;
    const pts = (g.type === 'LineString' ? g.coordinates : g.coordinates[0]).map(p => [p[1], p[0]]);
    map.fitBounds(pts, { padding: [60, 60], maxZoom: 19 });
  }
}

function addSiteMenu() {
  openSheet('Add a weed site', `<p class="muted">What shape is the infestation?</p>
    <div class="choice">
      <button data-action="draw" data-type="point" data-how="gps"><b>Point here</b><small>At my GPS position${S.pos ? ` (±${Math.round(S.pos.acc)} m)` : ' (waiting for GPS)'}</small></button>
      <button data-action="draw" data-type="point" data-how="tap"><b>Point on map</b><small>Tap where the weeds are</small></button>
      <button data-action="draw" data-type="line" data-how="tap"><b>Line</b><small>A roadside or track run: tap points or walk it with GPS</small></button>
      <button data-action="draw" data-type="area" data-how="tap"><b>Area</b><small>A patch: tap the corners or walk the edge with GPS</small></button>
    </div>`);
}

function bindUI() {
  document.body.addEventListener('click', onAction);
  document.body.addEventListener('change', onChange);
  document.body.addEventListener('input', e => {
    if (e.target.dataset.action === 'site-search') {
      const v = e.target.value; const pos = e.target.selectionStart;
      renderSiteList(v);
      const inp = $('[data-action="site-search"]'); inp.focus(); inp.setSelectionRange(pos, pos);
    }
  });
  $('#sheet-close').addEventListener('click', closeSheet);
  // iPhone Safari can jump a scrolled panel back to the top when a dropdown is first opened/changed.
  // Remember where the panel was when the dropdown was touched and put it back.
  const body = $('#sheet-body');
  let keep = null;
  const remember = e => { if (e.target.tagName === 'SELECT') keep = body.scrollTop; };
  const restore = e => {
    if (e.target.tagName !== 'SELECT' || keep == null) return;
    const k = keep;
    [0, 50, 200, 500].forEach(t => setTimeout(() => { if (Math.abs(body.scrollTop - k) > 40) body.scrollTop = k; }, t));
  };
  body.addEventListener('touchstart', remember, { passive: true });
  body.addEventListener('mousedown', remember);
  body.addEventListener('focusin', restore);
  body.addEventListener('change', restore);
  $('#btn-add').addEventListener('click', addSiteMenu);
  $('#btn-layers').addEventListener('click', () => {
    openSheet('Map view', BASEMAP_ORDER.map(k => `<div class="row" data-action="set-basemap" data-id="${k}"><span class="row-main"><b>${BASEMAPS[k].label}${S.settings.basemap === k ? ' ✓' : ''}</b><small>${BASEMAP_NOTE[k]}</small></span></div>`).join(''));
  });
  $('#btn-locate').addEventListener('click', () => {
    if (!S.pos) { toast('Waiting for GPS…'); return; }
    S.follow = !S.follow;
    $('#btn-locate').classList.toggle('on', S.follow);
    if (S.follow) map.setView(S.pos.ll, Math.max(map.getZoom(), 17));
  });
  $('#draw-gps').addEventListener('click', () => {
    if (!S.pos) { toast('Waiting for GPS…'); return; }
    S.draw.pts.push(S.pos.ll.slice());
    updateDrawBar();
    toast(`Point added (±${Math.round(S.pos.acc)} m)`, 1200);
  });
  $('#draw-undo').addEventListener('click', () => { S.draw.pts.pop(); updateDrawBar(); });
  $('#draw-done').addEventListener('click', finishDraw);
  $('#draw-cancel').addEventListener('click', () => { const ed = S.draw?.editId || S.draw?.navFor; S.draw = null; updateDrawBar(); if (ed) openSite(ed); });
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
}

/* ---------- start ---------- */
async function start() {
  try {
    await load();
  } catch (err) {
    document.body.insertAdjacentHTML('afterbegin', '<div class="note warn">This browser cannot store data (private browsing?). Open the app in a normal window.</div>');
    console.error(err);
  }
  initMap();
  bindUI();
  renderSites();
  startLocation();
  requestPersistence();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    // When a new version takes over, reload once so it shows straight away.
    // If a form is open, wait until it's closed so nothing typed is lost.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      const go = () => { if (!reloaded) { reloaded = true; location.reload(); } };
      if ($('#sheet').hidden) go();
      else { S.reloadPending = go; toast('App updated. It will refresh when you close this panel.'); }
    });
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  }
  window.WSM = { S, map, db }; // for debugging and tests
}

start();
