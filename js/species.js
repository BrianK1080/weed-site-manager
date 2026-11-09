// Starting species list. Windows are Yarra Valley estimates from the research doc;
// the owner can edit every value in the app (More > Species). Labels override all of this.
// Months are 1-12. season_start_month: "treated this season" counts from the most recent
// occurrence of this month.

const wa = q => `https://weeds.org.au/?s=${encodeURIComponent(q)}`;
const ala = q => `https://bie.ala.org.au/search?q=${encodeURIComponent(q)}`;

// Bump when seed data gains new fields; app.js adds missing fields to stored species without overwriting edits.
export const SEED_VERSION = 3;

export const SEED_SPECIES = [
  {
    id: 'sp_blackberry', common_name: 'Blackberry', scientific_name: 'Rubus fruticosus agg.',
    native: false, colour: '#9c27b0', season_start_month: 11,
    control_months: [12, 1, 2, 3, 4], scouting_months: [11],
    preferred_methods: 'Spot spray while actively growing (flowering to fruiting). Leave treated canes 6 months before removal.',
    cautions: 'Sign sprayed fruiting bushes for pickers and birds.',
    seed_info: {"seed_set_source": "https://www.herbiguide.com.au/Descriptions/hg_European_Blackberry_aggregate.htm", "seed_set": "Flowers late spring to summer; berries ripen through summer into autumn. Treat before fruit ripens to stop birds spreading seed.", "seeds": "Up to about 80 seeds per berry; up to 13,000 seeds/m² recorded under infestations.", "seed_bank": "Long-lived: Agriculture Victoria says soil longevity is unknown (about 1% germinates in year 1, 10% within 3 years); a 5-year WA burial trial still had seed germinating after 5 years.", "spread": "Birds, foxes and other animals eat the fruit; water along creeks and drains; cane tips root where they touch the ground; root fragments regrow.", "source": "https://agriculture.vic.gov.au/biosecurity/weeds/priority-weeds/blackberry"},
    links: { weeds_australia: wa('blackberry'), ala: ala('Rubus fruticosus'), agvic: 'https://agriculture.vic.gov.au/biosecurity/weeds/priority-weeds/blackberry', council: '' },
  },
  {
    id: 'sp_thistle', common_name: 'Spear / Scotch thistle', scientific_name: 'Cirsium vulgare (spear) / Onopordum acanthium (Scotch)',
    native: false, colour: '#ff4fa3', season_start_month: 3,
    control_months: [3, 4, 5, 6, 7, 8, 9], scouting_months: [2, 3],
    preferred_methods: 'Chip below the crown or spot spray at rosette stage, before flowering stems bolt.',
    cautions: 'Most "Scotch thistle" in Victoria is spear thistle. Record which one in site notes.',
    seed_info: {"seed_set_source": "https://florabase.dpaw.wa.gov.au/browse/profile/7937", "seed_set": "Flowers Dec–Feb. Seed matures and can blow away within 7–10 days of flowering, and cut flower heads can still ripen seed: act at rosette stage.", "seeds": "About 2,700–19,000 seeds per plant (Victorian field study).", "seed_bank": "Short-lived: most seed germinates or dies within a year; a few seeds can last about 5 years.", "spread": "Wind (most seed lands within a few metres), hay, mud and ants. Spread is by seed only, so stopping flowering stops spread.", "source": "https://caws.org.nz/PPQ1112/PPQ%2011-S2%20pp245-249%20Bruzzese.pdf"},
    links: { weeds_australia: wa('spear thistle'), ala: ala('Cirsium vulgare'), agvic: '', council: '' },
  },
  {
    id: 'sp_gorse', common_name: 'Gorse', scientific_name: 'Ulex europaeus',
    native: false, colour: '#cddc39', season_start_month: 9,
    control_months: [9, 10, 11, 3, 4, 5], scouting_months: [8, 9],
    preferred_methods: 'Spot spray during active growth in spring and autumn; follow up for years (seed lasts about 25 years).',
    cautions: 'Sources differ on spraying before vs during flowering: follow the product label.',
    seed_info: {"seed_set_source": "https://cdn.environment.sa.gov.au/landscape/docs/ep/EPLB-pest-plant-Gorse.pdf", "seed_set": "Flowers twice a year in Victoria (Mar–May and Jul–Oct). Pods turn black when ripe and burst on hot, dry days, mainly late spring to summer.", "seeds": "Seed bank of up to 40,000 seeds/m² under established gorse.", "seed_bank": "Very long-lived: viable in soil for up to about 25 years, with some reports of 30–70 years. Plan follow-up over 5–25 years.", "spread": "Pods eject seed up to 5 m; mud on stock, boots and machinery; water; birds and ants. Fire and soil disturbance trigger mass germination.", "source": "https://cdn.environment.sa.gov.au/landscape/docs/ep/Gorse-factsheet-2022.pdf"},
    links: { weeds_australia: wa('gorse'), ala: ala('Ulex europaeus'), agvic: '', council: '' },
  },
  {
    id: 'sp_sjw', common_name: "St John's wort", scientific_name: 'Hypericum perforatum',
    native: false, colour: '#e53935', season_start_month: 10,
    control_months: [11, 12, 1], scouting_months: [10, 11],
    preferred_methods: 'Spot spray while flowering (easy to see, most sensitive).',
    cautions: 'Two native Hypericum species look similar. Check before treating.',
    seed_info: {"seed_set_source": "https://www.herbiguide.com.au/Descriptions/hg_St_Johns_Wort.htm", "seed_set": "Flowers Nov–Feb; sticky capsules ripen and shed seed from about Jan–Apr. A germination inhibitor delays sprouting 4–6 months.", "seeds": "Up to about 33,000 seeds per plant in a season.", "seed_bank": "Long-lived: most seed germinates in the first few years, but some lasts at least 10 years (some reports 20+).", "spread": "Sticky capsules on wool, fur and clothing; water, soil, hay and machinery; creeping rhizomes (about 300 mm a year).", "source": "https://vro.agriculture.vic.gov.au/dpi/vro/vrosite.nsf/pages/invasive_st_johns_wort"},
    links: { weeds_australia: wa("St John's wort"), ala: ala('Hypericum perforatum'), agvic: '', council: 'https://trustfornature.org.au/resources/st-johns-wort/' },
  },
  {
    id: 'sp_watsonia', common_name: 'Bulbil watsonia', scientific_name: 'Watsonia meriana var. bulbillifera',
    native: false, colour: '#00e5ff', season_start_month: 7,
    control_months: [9, 10, 11], scouting_months: [8, 9],
    preferred_methods: 'Wipe or spot spray as the flower spike emerges, before full flowering; or dig corms in winter/spring.',
    cautions: 'Remove bulbil stems before they drop.',
    seed_info: {"seed_set_source": "https://www.yarraranges.vic.gov.au/Environment/Trees-and-vegetation/Weeds/Common-weeds/Bulbil-Watsonia", "seed_set": "Flowers Oct–Dec; bulbils form on the flower stem straight after flowering (Oct–Dec) and drop soon after. Remove stems before then.", "seeds": "Little or no viable seed in Australia: reproduces from corms, cormels and stem bulbils (10–20 bulbils per stem leaf).", "seed_bank": "Corms and cormels can stay dormant in soil for a considerable time (sources differ on how long); bulbils drop from stems after flowering.", "spread": "Soil and slashing/grading machinery along roadsides, water (cormels float), dumped garden waste.", "source": "https://weeds.org.au/profiles/bulbil-watsonia-bugle/"},
    links: { weeds_australia: wa('bulbil watsonia'), ala: ala('Watsonia meriana'), agvic: '', council: 'https://www.yarraranges.vic.gov.au/Our-services/Trees-and-vegetation/Weeds/Common-weeds-in-Yarra-Ranges/Bulbil-Watsonia' },
  },
  {
    id: 'sp_glandweed', common_name: 'Yellow glandweed', scientific_name: 'Parentucellia viscosa (Bellardia viscosa)',
    native: false, colour: '#8d6e63', season_start_month: 6,
    control_months: [7, 8, 9], scouting_months: [7],
    preferred_methods: 'Hand-pull or spot spray before flowering.',
    cautions: 'Seed sticks to clothing: clean boots between sites.',
    seed_info: {"seed_set_source": "https://www.bushlandperth.org.au/?p=5050", "seed_set": "Annual; flowers in spring and sets seed soon after, from late spring into summer. Pull or spray before flowering.", "seeds": "About 12,000 seeds per average plant (overseas study).", "seed_bank": "Short-lived: under 5 years; the soil seed bank lasts at least one year.", "spread": "Tiny seed carried by wind and on clothing and boots.", "source": "https://dnr.wa.gov/sites/default/files/2025-05/amp_nh_wirs_belvis.pdf"},
    links: { weeds_australia: wa('yellow glandweed'), ala: ala('Bellardia viscosa'), agvic: '', council: '' },
  },
  {
    id: 'sp_flatweed', common_name: "Flatweed (cat's ear)", scientific_name: 'Hypochaeris radicata',
    native: false, colour: '#1e88e5', season_start_month: 3,
    control_months: [3, 4, 5, 9, 10], scouting_months: [3, 9],
    preferred_methods: 'Selective broadleaf spray or spray-graze while actively growing, before flowering; build pasture competition.',
    cautions: 'Mowing does not work: leaves sit below the blade.',
    seed_info: {"seed_set_source": "https://hgic.clemson.edu/weed-of-the-month-common-cats-ear/", "seed_set": "Flowers spring to autumn; each flower turns into a wind-blown seed head (like a dandelion clock) within a few weeks.", "seeds": "About 2,300 seeds per plant on average, up to 6,000.", "seed_bank": "Very short-lived: seed viability is under a year, so no persistent seed bank.", "spread": "Wind-blown seed (often 10 m+, some 100 m), on animals and clothing; plants also form offsets from the crown.", "source": "https://hgic.clemson.edu/weed-of-the-month-common-cats-ear/"},
    links: { weeds_australia: wa('flatweed'), ala: ala('Hypochaeris radicata'), agvic: '', council: '' },
  },
  {
    id: 'sp_bidgee', common_name: 'Bidgee-widgee (native)', scientific_name: 'Acaena novae-zelandiae',
    native: true, colour: '#43a047', season_start_month: 9,
    control_months: [10, 11], scouting_months: [10],
    preferred_methods: 'Pasture only: improve competition or spot treat in paddocks before burrs set.',
    cautions: 'INDIGENOUS PLANT. Do not treat on roadsides or in bush.',
    seed_info: {"seed_set_source": "", "seed_set": "Flowers Oct–Jan; burrs follow over summer.", "seeds": "Burrs, each with seed.", "seed_bank": "Not researched (native plant).", "spread": "Burrs hook onto wool, fur, socks and clothing.", "source": ""},
    links: { weeds_australia: '', ala: ala('Acaena novae-zelandiae'), agvic: '', council: 'https://www.yarraranges.vic.gov.au/PlantDirectory/Herbs-Groundcovers/Acaena-novae-zelandiae' },
  },
  {
    id: 'sp_nightshade', common_name: 'Blackberry nightshade', scientific_name: 'Solanum nigrum',
    native: false, colour: '#212121', season_start_month: 9,
    control_months: [10, 11, 12, 1, 2, 3], scouting_months: [10],
    preferred_methods: 'Hand-pull before berries form; prevent seed set for several years.',
    cautions: 'Two native species sit in the same Solanum nigrum group. Unripe berries are toxic.',
    seed_info: {"seed_set_source": "https://www.horticulture.com.au/globalassets/hort-innovation/resource-assets/vg15070-blackberry-managment-guide.pdf", "seed_set": "Flowers 5–9 weeks after germinating and keeps flowering until it dies; seed is produced soon after. Seed in unripe green berries can already be viable.", "seeds": "Each berry holds about 15–60 seeds.", "seed_bank": "Long-lived: one study found about 90% of seed still viable after 5 years; seed bank lasts 5+ years.", "spread": "Birds eat the berries; soil movement and machinery.", "source": "https://www.une.edu.au/__data/assets/pdf_file/0020/305471/une-weeds-blackberry-nightshade.pdf"},
    links: { weeds_australia: wa('blackberry nightshade'), ala: ala('Solanum nigrum'), agvic: '', council: 'https://www.herbiguide.com.au/Descriptions/hg_Blackberry_Nightshade.htm' },
  },
];
