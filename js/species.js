// Starting species list. Windows are Yarra Valley estimates from the research doc;
// the owner can edit every value in the app (More > Species). Labels override all of this.
// Months are 1-12. season_start_month: "treated this season" counts from the most recent
// occurrence of this month.

const wa = q => `https://weeds.org.au/?s=${encodeURIComponent(q)}`;
const ala = q => `https://bie.ala.org.au/search?q=${encodeURIComponent(q)}`;

export const SEED_SPECIES = [
  {
    id: 'sp_blackberry', common_name: 'Blackberry', scientific_name: 'Rubus fruticosus agg.',
    native: false, colour: '#9c27b0', season_start_month: 11,
    control_months: [12, 1, 2, 3, 4], scouting_months: [11],
    preferred_methods: 'Spot spray while actively growing (flowering to fruiting). Leave treated canes 6 months before removal.',
    cautions: 'Sign sprayed fruiting bushes for pickers and birds.',
    links: { weeds_australia: wa('blackberry'), ala: ala('Rubus fruticosus'), agvic: 'https://agriculture.vic.gov.au/biosecurity/weeds/priority-weeds/blackberry', council: '' },
  },
  {
    id: 'sp_thistle', common_name: 'Spear / Scotch thistle', scientific_name: 'Cirsium vulgare (spear) / Onopordum acanthium (Scotch)',
    native: false, colour: '#ff4fa3', season_start_month: 3,
    control_months: [3, 4, 5, 6, 7, 8, 9], scouting_months: [2, 3],
    preferred_methods: 'Chip below the crown or spot spray at rosette stage, before flowering stems bolt.',
    cautions: 'Most "Scotch thistle" in Victoria is spear thistle. Record which one in site notes.',
    links: { weeds_australia: wa('spear thistle'), ala: ala('Cirsium vulgare'), agvic: '', council: '' },
  },
  {
    id: 'sp_gorse', common_name: 'Gorse', scientific_name: 'Ulex europaeus',
    native: false, colour: '#cddc39', season_start_month: 9,
    control_months: [9, 10, 11, 3, 4, 5], scouting_months: [8, 9],
    preferred_methods: 'Spot spray during active growth in spring and autumn; follow up for years (seed lasts about 25 years).',
    cautions: 'Sources differ on spraying before vs during flowering: follow the product label.',
    links: { weeds_australia: wa('gorse'), ala: ala('Ulex europaeus'), agvic: '', council: '' },
  },
  {
    id: 'sp_sjw', common_name: "St John's wort", scientific_name: 'Hypericum perforatum',
    native: false, colour: '#e53935', season_start_month: 10,
    control_months: [11, 12, 1], scouting_months: [10, 11],
    preferred_methods: 'Spot spray while flowering (easy to see, most sensitive).',
    cautions: 'Two native Hypericum species look similar. Check before treating.',
    links: { weeds_australia: wa("St John's wort"), ala: ala('Hypericum perforatum'), agvic: '', council: 'https://trustfornature.org.au/resources/st-johns-wort/' },
  },
  {
    id: 'sp_watsonia', common_name: 'Bulbil watsonia', scientific_name: 'Watsonia meriana var. bulbillifera',
    native: false, colour: '#00e5ff', season_start_month: 7,
    control_months: [9, 10, 11], scouting_months: [8, 9],
    preferred_methods: 'Wipe or spot spray as the flower spike emerges, before full flowering; or dig corms in winter/spring.',
    cautions: 'Remove bulbil stems before they drop.',
    links: { weeds_australia: wa('bulbil watsonia'), ala: ala('Watsonia meriana'), agvic: '', council: 'https://www.yarraranges.vic.gov.au/Our-services/Trees-and-vegetation/Weeds/Common-weeds-in-Yarra-Ranges/Bulbil-Watsonia' },
  },
  {
    id: 'sp_glandweed', common_name: 'Yellow glandweed', scientific_name: 'Parentucellia viscosa (Bellardia viscosa)',
    native: false, colour: '#8d6e63', season_start_month: 6,
    control_months: [7, 8, 9], scouting_months: [7],
    preferred_methods: 'Hand-pull or spot spray before flowering.',
    cautions: 'Seed sticks to clothing: clean boots between sites.',
    links: { weeds_australia: wa('yellow glandweed'), ala: ala('Bellardia viscosa'), agvic: '', council: '' },
  },
  {
    id: 'sp_flatweed', common_name: "Flatweed (cat's ear)", scientific_name: 'Hypochaeris radicata',
    native: false, colour: '#1e88e5', season_start_month: 3,
    control_months: [3, 4, 5, 9, 10], scouting_months: [3, 9],
    preferred_methods: 'Selective broadleaf spray or spray-graze while actively growing, before flowering; build pasture competition.',
    cautions: 'Mowing does not work: leaves sit below the blade.',
    links: { weeds_australia: wa('flatweed'), ala: ala('Hypochaeris radicata'), agvic: '', council: '' },
  },
  {
    id: 'sp_bidgee', common_name: 'Bidgee-widgee (native)', scientific_name: 'Acaena novae-zelandiae',
    native: true, colour: '#43a047', season_start_month: 9,
    control_months: [10, 11], scouting_months: [10],
    preferred_methods: 'Pasture only: improve competition or spot treat in paddocks before burrs set.',
    cautions: 'INDIGENOUS PLANT. Do not treat on roadsides or in bush.',
    links: { weeds_australia: '', ala: ala('Acaena novae-zelandiae'), agvic: '', council: 'https://www.yarraranges.vic.gov.au/PlantDirectory/Herbs-Groundcovers/Acaena-novae-zelandiae' },
  },
  {
    id: 'sp_nightshade', common_name: 'Blackberry nightshade', scientific_name: 'Solanum nigrum',
    native: false, colour: '#212121', season_start_month: 9,
    control_months: [10, 11, 12, 1, 2, 3], scouting_months: [10],
    preferred_methods: 'Hand-pull before berries form; prevent seed set for several years.',
    cautions: 'Two native species sit in the same Solanum nigrum group. Unripe berries are toxic.',
    links: { weeds_australia: wa('blackberry nightshade'), ala: ala('Solanum nigrum'), agvic: '', council: 'https://www.herbiguide.com.au/Descriptions/hg_Blackberry_Nightshade.htm' },
  },
];
