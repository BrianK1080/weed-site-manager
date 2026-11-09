// Season and status logic (Project_Instructions.md section 5). Pure functions, no DOM.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Start of the current season for a species: the 1st of season_start_month, on or before `now`.
export function seasonStart(now, startMonth) {
  let y = now.getFullYear();
  if (now.getMonth() + 1 < startMonth) y -= 1;
  return new Date(y, startMonth - 1, 1);
}

// Season label, e.g. "2026-27" when the season crosses a year.
export function seasonLabel(now, startMonth) {
  const s = seasonStart(now, startMonth);
  if (startMonth === 1) return String(s.getFullYear());
  return `${s.getFullYear()}-${String((s.getFullYear() + 1) % 100).padStart(2, '0')}`;
}

export function isTreatingVisit(v) {
  return v.method !== 'inspect' && v.plants_found !== false;
}

// status: 'due' | 'untreated' | 'treated' | 'monitoring'
export function siteStatus(site, species, visits, now = new Date()) {
  const mine = visits.filter(v => v.site_id === site.id).sort((a, b) => b.datetime.localeCompare(a.datetime));
  const last = mine[0] || null;
  const start = species ? seasonStart(now, species.season_start_month) : new Date(now.getFullYear(), 0, 1);
  const treatedVisit = mine.find(v => isTreatingVisit(v) && new Date(v.datetime) >= start) || null;
  const inWindow = species ? species.control_months.includes(now.getMonth() + 1) : false;

  let status;
  if (site.status_override === 'monitoring' || site.status_override === 'eradicated' || (last && last.plants_found === false && site.status_override !== 'active')) {
    status = 'monitoring';
  } else if (treatedVisit) {
    status = 'treated';
  } else if (inWindow) {
    status = 'due';
  } else {
    status = 'untreated';
  }
  return {
    status,
    lastVisit: last,
    treatedVisit,
    percentTreated: treatedVisit && treatedVisit.percent_treated != null ? Number(treatedVisit.percent_treated) : null,
    inWindow,
    nextWindow: species ? nextWindowText(species, now) : '',
  };
}

export function nextWindowText(species, now = new Date()) {
  const m = now.getMonth() + 1;
  if (species.control_months.includes(m)) return 'Control window open now';
  for (let i = 1; i <= 12; i++) {
    const mm = ((m - 1 + i) % 12) + 1;
    if (species.control_months.includes(mm)) return `Next window: ${MONTHS[mm - 1]}`;
  }
  return 'No control months set';
}

export function monthsText(list) {
  if (!list || !list.length) return '-';
  return list.map(m => MONTHS[m - 1]).join(', ');
}

// Distance in metres between [lat, lng] pairs.
export function haversine(a, b) {
  const R = 6371000;
  const toR = d => d * Math.PI / 180;
  const dLat = toR(b[0] - a[0]);
  const dLng = toR(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Representative [lat, lng] for any site geometry (GeoJSON order is [lng, lat]).
export function siteLatLng(site) {
  const g = site.geometry;
  if (!g) return null;
  if (g.type === 'Point') return [g.coordinates[1], g.coordinates[0]];
  const pts = g.type === 'LineString' ? g.coordinates : g.coordinates[0];
  if (g.type === 'LineString') {
    const mid = pts[Math.floor(pts.length / 2)];
    return [mid[1], mid[0]];
  }
  let lat = 0, lng = 0;
  const ring = pts.slice(0, -1).length ? pts.slice(0, -1) : pts;
  for (const p of ring) { lat += p[1]; lng += p[0]; }
  return [lat / ring.length, lng / ring.length];
}

// Nearest-neighbour visiting order from a start point. Returns site ids in order.
export function nearestOrder(sites, start) {
  const left = sites.map(s => ({ id: s.id, ll: siteLatLng(s) })).filter(s => s.ll);
  const out = [];
  let cur = start;
  while (left.length) {
    let bi = 0, bd = Infinity;
    left.forEach((s, i) => { const d = cur ? haversine(cur, s.ll) : i; if (d < bd) { bd = d; bi = i; } });
    const [next] = left.splice(bi, 1);
    out.push(next.id);
    cur = next.ll;
  }
  return out;
}

export function fmtDist(m) {
  if (m == null || isNaN(m)) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// Approximate length (m) of a line or area (m2) of a polygon for display.
export function geometrySize(g) {
  if (!g) return null;
  if (g.type === 'LineString') {
    let d = 0;
    for (let i = 1; i < g.coordinates.length; i++) {
      const a = g.coordinates[i - 1], b = g.coordinates[i];
      d += haversine([a[1], a[0]], [b[1], b[0]]);
    }
    return { value: Math.round(d), unit: 'm' };
  }
  if (g.type === 'Polygon') {
    const ring = g.coordinates[0];
    const lat0 = ring[0][1] * Math.PI / 180;
    const mx = 111320 * Math.cos(lat0), my = 110540;
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = [ring[i][0] * mx, ring[i][1] * my];
      const [x2, y2] = [ring[i + 1][0] * mx, ring[i + 1][1] * my];
      a += x1 * y2 - x2 * y1;
    }
    return { value: Math.round(Math.abs(a / 2)), unit: 'm²' };
  }
  return null;
}
