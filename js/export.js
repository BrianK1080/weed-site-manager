// Export, backup and restore. Field names follow Darwin Core where one exists.
import { siteLatLng, siteStatus } from './season.js';

export function download(filename, text, type = 'text/plain') {
  const blob = text instanceof Blob ? text : new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function csvCell(v) {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows, cols) {
  return [cols.join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n');
}

const pad = n => String(n).padStart(2, '0');
// Local (device time zone) date and time: records must show Victorian time, not UTC.
export const localDate = iso => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const localTime = iso => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const today = () => localDate(new Date().toISOString());

// One row per site, Darwin Core names first.
export function sitesCSV(data) {
  const sp = Object.fromEntries(data.species.map(s => [s.id, s]));
  const rows = data.sites.map(site => {
    const s = sp[site.species_id];
    const ll = siteLatLng(site) || [];
    const st = siteStatus(site, s, data.visits);
    return {
      occurrenceID: site.id,
      scientificName: s ? s.scientific_name : '',
      vernacularName: s ? s.common_name : '',
      decimalLatitude: ll[0] != null ? ll[0].toFixed(6) : '',
      decimalLongitude: ll[1] != null ? ll[1].toFixed(6) : '',
      eventDate: site.created_at ? localDate(site.created_at) : '',
      occurrenceRemarks: site.access_notes || '',
      site_name: site.name,
      geometry_type: site.geometry ? site.geometry.type : '',
      size: site.size_value != null ? `${site.size_value} ${site.size_unit || ''}`.trim() : '',
      density_1to5: site.density,
      tenure: site.tenure,
      land_manager: site.land_manager,
      permission_ref: site.permission_ref,
      priority: site.priority,
      status_this_season: st.status,
      last_visit: st.lastVisit ? localDate(st.lastVisit.datetime) : '',
    };
  });
  return toCSV(rows, Object.keys(rows[0] || { occurrenceID: '' }));
}

// Victorian agricultural chemical use record (one row per chemical visit).
export const CHEM_COLS = ['date', 'start_time', 'operator', 'product_trade_name', 'active_ingredient', 'rate',
  'volume_used', 'situation', 'site_name', 'latitude', 'longitude', 'wind_speed_kmh', 'wind_direction', 'temp_c', 'weed', 'notes'];

export function isChemicalVisit(v) {
  return !!(v.product_trade_name || ['spot_spray', 'wipe'].includes(v.method));
}

export function chemicalRows(data, from, to) {
  const sites = Object.fromEntries(data.sites.map(s => [s.id, s]));
  const sp = Object.fromEntries(data.species.map(s => [s.id, s]));
  return data.visits
    .filter(isChemicalVisit)
    .filter(v => (!from || localDate(v.datetime) >= from) && (!to || localDate(v.datetime) <= to))
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
    .map(v => {
      const site = sites[v.site_id] || {};
      const ll = site.geometry ? siteLatLng(site) : [];
      return {
        date: v.treated_date || v.visit_date || localDate(v.datetime), start_time: v.visit_date !== undefined ? (v.visit_time || '') : localTime(v.datetime), operator: v.operator,
        product_trade_name: v.product_trade_name, active_ingredient: v.active_ingredient, rate: v.rate,
        volume_used: v.volume_used, situation: v.situation, site_name: site.name,
        latitude: ll && ll[0] != null ? ll[0].toFixed(6) : '', longitude: ll && ll[1] != null ? ll[1].toFixed(6) : '',
        wind_speed_kmh: v.wind_speed_kmh, wind_direction: v.wind_direction, temp_c: v.temp_c,
        weed: sp[site.species_id] ? sp[site.species_id].common_name : '', notes: v.notes,
      };
    });
}

export function toGeoJSON(data) {
  const sp = Object.fromEntries(data.species.map(s => [s.id, s]));
  return JSON.stringify({
    type: 'FeatureCollection',
    features: data.sites.filter(s => s.geometry).map(site => {
      const s = sp[site.species_id];
      const st = siteStatus(site, s, data.visits);
      const { geometry, photos, ...props } = site;
      return {
        type: 'Feature', geometry,
        properties: { ...props, scientificName: s && s.scientific_name, vernacularName: s && s.common_name,
          colour: s && s.colour, status_this_season: st.status, last_visit: st.lastVisit ? st.lastVisit.datetime : null },
      };
    }),
  }, null, 2);
}

function esc(s) { return String(s ?? '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])); }

export function toKML(data) {
  const sp = Object.fromEntries(data.species.map(s => [s.id, s]));
  const kmlColour = hex => { const h = (hex || '#ff0000').replace('#', ''); return `ff${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`; };
  const styles = data.species.map(s => `<Style id="${esc(s.id)}"><IconStyle><color>${kmlColour(s.colour)}</color></IconStyle><LineStyle><color>${kmlColour(s.colour)}</color><width>4</width></LineStyle><PolyStyle><color>66${kmlColour(s.colour).slice(2)}</color></PolyStyle></Style>`).join('');
  const coords = c => c.map(p => `${p[0]},${p[1]},0`).join(' ');
  const marks = data.sites.filter(s => s.geometry).map(site => {
    const g = site.geometry;
    let geom = '';
    if (g.type === 'Point') geom = `<Point><coordinates>${g.coordinates[0]},${g.coordinates[1]},0</coordinates></Point>`;
    if (g.type === 'LineString') geom = `<LineString><coordinates>${coords(g.coordinates)}</coordinates></LineString>`;
    if (g.type === 'Polygon') geom = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords(g.coordinates[0])}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    const s = sp[site.species_id];
    return `<Placemark><name>${esc(site.name)}</name><description>${esc(s ? s.common_name : '')} · ${esc(site.tenure)}</description><styleUrl>#${esc(site.species_id)}</styleUrl>${geom}</Placemark>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Weed sites ${today()}</name>${styles}${marks}</Document></kml>`;
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function backupJSON(data) {
  const photos = [];
  for (const p of data.photos) photos.push({ id: p.id, dataURL: await blobToDataURL(p.blob), created_at: p.created_at });
  return JSON.stringify({ app: 'weed-site-manager', version: 1, exported_at: new Date().toISOString(),
    species: data.species, sites: data.sites, visits: data.visits, routes: data.routes, meta: data.meta, photos });
}

export async function parseBackup(text) {
  const b = JSON.parse(text);
  if (b.app !== 'weed-site-manager') throw new Error('This file is not a Weed Site Manager backup.');
  const photos = [];
  for (const p of b.photos || []) {
    const blob = await (await fetch(p.dataURL)).blob();
    photos.push({ id: p.id, blob, created_at: p.created_at });
  }
  return { species: b.species || [], sites: b.sites || [], visits: b.visits || [], routes: b.routes || [], meta: b.meta || [], photos };
}

export const stamp = today;
