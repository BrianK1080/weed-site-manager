// Weed pack: researched facts the Atlas of Living Australia doesn't provide (months, methods,
// seed info, declared status). Matched by scientific name. Months are Yarra Valley estimates;
// the owner can edit everything in the app. Never put herbicide rates or label claims here.
import { SEED_SPECIES } from './species.js';
import { VIC_DECLARED, VIC_REGIONS, MY_REGION, VIC_DECLARED_SOURCE } from './declared-vic.js';

export const PACK_CHECKED = '2026-11-10';

// Weeds of National Significance (32 WoNS, 1999 + 2012), as listed by Weeds Australia
// (https://weeds.org.au/lists/established/). Genus entries end with a space.
const WONS = [
  'Lycium ferocissimum', 'Alternanthera philoxeroides', 'Asparagus aethiopicus', 'Asparagus scandens',
  'Asparagus asparagoides', 'Asparagus declinatus', 'Asparagus africanus', 'Asparagus plumosus', 'Asparagus setaceus',
  'Tamarix aphylla', 'Chrysanthemoides monilifera', 'Rubus fruticosus', 'Rubus anglocandicans', 'Cytisus scoparius',
  'Genista linifolia', 'Genista monspessulana', 'Cabomba caroliniana', 'Dolichandra unguis-cati', 'Nassella neesiana',
  'Nassella trichotoma', 'Jatropha gossypifolia', 'Sagittaria platyphylla', 'Senecio madagascariensis', 'Andropogon gayanus',
  'Ulex europaeus', 'Hymenachne amplexicaulis', 'Lantana camara', 'Prosopis ', 'Anredera cordifolia', 'Mimosa pigra',
  'Parkinsonia aculeata', 'Parthenium hysterophorus', 'Annona glabra', 'Vachellia nilotica', 'Acacia nilotica',
  'Austrocylindropuntia ', 'Cylindropuntia ', 'Opuntia ', 'Cryptostegia grandiflora', 'Salvinia molesta',
  'Solanum elaeagnifolium', 'Eichhornia crassipes', 'Pontederia crassipes', 'Salix ',
];
const WONS_EXCEPT = ['Salix babylonica', 'Salix x calodendron', 'Salix ×calodendron', 'Salix x reichardtii', 'Salix ×reichardtii'];
export const WONS_SOURCE = 'https://weeds.org.au/lists/established/';

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
export function isWons(sci) {
  const n = norm(sci);
  if (!n || WONS_EXCEPT.some(x => n.startsWith(norm(x)))) return false;
  return WONS.some(w => w.endsWith(' ') ? n.startsWith(norm(w) + ' ') || n === norm(w) : n === norm(w) || n.startsWith(norm(w) + ' '));
}

// Victorian declared status: full table for all catchment regions (js/declared-vic.js, Aug 2023).
const CODE = { S: 'state_prohibited', P: 'regionally_prohibited', C: 'regionally_controlled', R: 'restricted' };
function vicRow(sci) {
  const n = norm(sci);
  if (!n) return null;
  if (VIC_DECLARED[n]) return VIC_DECLARED[n];
  const parts = n.split(' ');
  const bin = parts.slice(0, 2).join(' ');
  if (VIC_DECLARED[bin]) return VIC_DECLARED[bin];
  if (VIC_DECLARED[parts[0]]) return VIC_DECLARED[parts[0]]; // whole genus declared, e.g. Amsinckia
  return null;
}
// Status in the owner's region, or '' if not declared in Victoria at all.
export function declaredVic(sci) {
  if (!norm(sci)) return null;
  const row = vicRow(sci);
  if (!row) return { status: '', note: `Not on Victoria's declared weeds list (${VIC_DECLARED_SOURCE})` };
  const code = row[4][VIC_REGIONS.indexOf(MY_REGION)];
  const extra = [row[3], row[0] !== sci && norm(row[0]) !== norm(sci) ? `listed as ${row[0]}` : ''].filter(Boolean).join('; ');
  return { status: CODE[code] || '', note: `${MY_REGION} region. ${VIC_DECLARED_SOURCE}${extra ? '. ' + extra : ''}` };
}
// Status in every Victorian region, for the weed page: [{ region, status }] or null.
export function declaredVicRegions(sci) {
  const row = vicRow(sci);
  return row ? VIC_REGIONS.map((r, i) => ({ region: r, status: CODE[row[4][i]] || '', mine: r === MY_REGION })) : null;
}

// Researched profiles. Keys are lower-case binomials.
const PACK = {
  'arctotheca calendula': {
    common_name: 'Capeweed', native: false, season_start_month: 4,
    control_months: [5, 6, 7, 8], scouting_months: [4, 5],
    preferred_methods: 'Hand-pull or chip small rosettes before flowering, cutting the taproot below the crown so it can\'t regrow. Spot spray young rosettes in late autumn to winter; large rosettes are hard to kill. Keep ground covered: it colonises bare, overgrazed or disturbed soil.',
    cautions: 'Resistance to diquat and paraquat (Group 22, formerly L) has been reported in Victoria. Can build up nitrate and poison stock.',
    seed_info: {
      seed_set: 'Germinates after autumn rains, flowers about July to November, sets seed in late spring and dies off as summer starts.',
      seed_set_source: 'https://www.herbiguide.com.au/Descriptions/hg_Capeweed.htm',
      seeds: '',
      seed_bank: 'Most seed germinates at the autumn break, but some populations keep 20% or more dormant for at least 2 years.',
      spread: 'Woolly seed is carried by animals, wind, water and hay. Invades bare and overgrazed ground quickly.',
      source: 'https://www.agric.wa.gov.au/node/159',
    },
    links: { council: 'https://www.awri.com.au/?p=60947' },
  },
};

// The app's own starting weeds are part of the pack too.
for (const sp of SEED_SPECIES) {
  for (const name of String(sp.scientific_name).match(/[A-Z][a-z]+ [a-z-]+/g) || []) {
    const k = norm(name);
    if (PACK[k]) continue;
    const { id, colour, ...rest } = sp;
    PACK[k] = rest;
  }
}

export function packFor(sci) {
  const n = norm(sci);
  if (!n) return null;
  if (PACK[n]) return PACK[n];
  const bin = n.split(' ').slice(0, 2).join(' '); // e.g. "watsonia meriana var. bulbillifera" -> "watsonia meriana"
  return PACK[bin] || null;
}

// Fill empty fields of a weed from the pack and built-in lists. Never overwrites the owner's values.
// Returns { filled: [labels], missing: [labels] }.
const LABELS = { native: 'native status', wons: 'WoNS', calp_status: 'declared status', season_start_month: 'season start',
  control_months: 'control months', scouting_months: 'scouting months', preferred_methods: 'preferred methods', cautions: 'cautions',
  seed_set: 'seed set', seeds: 'seed production', seed_bank: 'seed bank', spread: 'spreads by', seed_source: 'seed info source',
  agvic: 'Agriculture Victoria link', council: 'other info link', herbicides: 'herbicides' };
const empty = v => v == null || v === '' || (Array.isArray(v) && !v.length);

export function fillFromPack(rec, { fresh = false } = {}) {
  const filled = [], missing = [];
  const p = packFor(rec.scientific_name);
  const set = (key, val, label = key) => {
    if (empty(val)) return;
    if (fresh || empty(rec[key])) { rec[key] = val; filled.push(LABELS[label] || label); }
  };
  if (p) {
    if (fresh || rec.native == null) { if (p.native != null) { rec.native = p.native; filled.push(LABELS.native); } }
    if (fresh || !rec.season_start_month || (rec.season_start_month === 1 && empty(rec.control_months))) { if (p.season_start_month) { rec.season_start_month = p.season_start_month; filled.push(LABELS.season_start_month); } }
    set('control_months', p.control_months);
    set('scouting_months', p.scouting_months);
    set('preferred_methods', p.preferred_methods);
    set('cautions', p.cautions);
    rec.seed_info = rec.seed_info || {};
    for (const [k, lbl] of [['seed_set', 'seed_set'], ['seed_set_source', null], ['seeds', 'seeds'], ['seed_bank', 'seed_bank'], ['spread', 'spread'], ['source', 'seed_source']]) {
      const v = p.seed_info?.[k];
      if (!empty(v) && (fresh || empty(rec.seed_info[k]))) { rec.seed_info[k] = v; if (lbl) filled.push(LABELS[lbl]); }
    }
    rec.links = rec.links || {};
    for (const k of ['agvic', 'council']) if (!empty(p.links?.[k]) && empty(rec.links[k])) { rec.links[k] = p.links[k]; filled.push(LABELS[k]); }
    if (!empty(p.herbicides) && empty(rec.herbicides)) { rec.herbicides = p.herbicides; filled.push(LABELS.herbicides); }
  }
  if (rec.wons !== true && isWons(rec.scientific_name)) { rec.wons = true; filled.push(LABELS.wons); }
  else if (rec.wons == null) rec.wons = false;
  const d = declaredVic(rec.scientific_name);
  if (d && (fresh || empty(rec.calp_status))) {
    if (d.status) { rec.calp_status = d.status; filled.push(LABELS.calp_status); } else rec.calp_status = '';
    if (empty(rec.calp_note) || fresh) rec.calp_note = d.note;
  }
  // What's still blank
  if (empty(rec.control_months)) missing.push(LABELS.control_months);
  if (empty(rec.preferred_methods)) missing.push(LABELS.preferred_methods);
  const si = rec.seed_info || {};
  for (const [k, lbl] of [['seed_set', 'seed_set'], ['seeds', 'seeds'], ['seed_bank', 'seed_bank'], ['spread', 'spread']]) if (empty(si[k])) missing.push(LABELS[lbl]);
  if (empty(rec.links?.agvic)) missing.push(LABELS.agvic);
  if (empty(rec.herbicides)) missing.push('herbicides (no registered-product list in the app yet)');
  return { filled: [...new Set(filled)], missing, inPack: !!p, declaredKnown: !!d };
}
