// Victorian declared noxious weeds (Catchment and Land Protection Act 1994), all catchment regions.
// Source: "Declared weeds in Australia prohibited to trade" v1.3, August 2023 (Victoria tab),
// supplied by the owner on 10 Nov 2026. In Victoria every declared noxious weed is prohibited from trade,
// so this is the full declared list. Codes per region: S state prohibited, P regionally prohibited,
// C regionally controlled, R restricted, - not given.
export const VIC_DECLARED_SOURCE = 'Declared weeds in Australia prohibited to trade, v1.3 (August 2023), Victoria';
export const VIC_REGIONS = ["Corangamite", "East Gippsland", "Glenelg", "Goulburn", "Mallee", "North Central", "North East", "Port Phillip and Westernport", "West Gippsland", "Wimmera"];
export const MY_REGION = 'Port Phillip and Westernport';
// key: lower-case name -> [scientific name, common name, other names, conditions, region codes]
export const VIC_DECLARED = {
"acacia erioloba": [
"Acacia erioloba",
"Giraffe thorn",
"",
"",
"SSSSSSSSSS"
],
"acacia karroo": [
"Acacia karroo",
"Karoo thorn",
"",
"",
"SSSSSSSSSS"
],
"acacia nilotica subsp. indica": [
"Acacia nilotica subsp. Indica",
"Prickly acacia",
"",
"",
"RRRRRRRRRR"
],
"ailanthus altissima": [
"Ailanthus altissima",
"Tree of heaven",
"",
"",
"RCCCRRCCCR"
],
"alhagi maurorum": [
"Alhagi maurorum",
"Camel thorn",
"",
"",
"SSSSSSSSSS"
],
"allium triquetrum": [
"Allium triquetrum",
"Angled onion",
"",
"",
"RRRRRRRRRR"
],
"allium vineale": [
"Allium vineale",
"Wild garlic",
"",
"",
"RRRPCCCRRC"
],
"alternanthera philoxeroides": [
"Alternanthera philoxeroides",
"Alligator weed",
"",
"",
"SSSSSSSSSS"
],
"alternanthera pungens": [
"Alternanthera pungens",
"Khaki weed",
"",
"",
"RPRCRCPPRC"
],
"ambrosia psilostachya": [
"Ambrosia psilostachya",
"Perennial ragweed",
"",
"",
"SSSSSSSSSS"
],
"amsinckia": [
"Amsinckia",
"Amsinckia",
"",
"All species",
"PCPCRCCCPR"
],
"andropogon gayanus": [
"Andropogon gayanus",
"Gamba grass",
"",
"",
"RRRRRRRRRR"
],
"annona glabra": [
"Annona glabra",
"Pond apple",
"",
"",
"RRRRRRRRRR"
],
"anredera cordifolia": [
"Anredera cordifolia",
"Madeira vine",
"",
"",
"RRRRRRRRRR"
],
"asparagus aethiopicus": [
"Asparagus aethiopicus",
"Ground asparagus",
"",
"",
"RRRRRRRRRR"
],
"asparagus africanus": [
"Asparagus africanus",
"Ornamental asparagus",
"",
"",
"RRRRRRRRRR"
],
"asparagus asparagoides": [
"Asparagus asparagoides",
"Bridal creeper",
"",
"",
"RRRRRRRRRR"
],
"asparagus declinatus": [
"Asparagus declinatus",
"Bridal veil creeper",
"",
"",
"RRRRRRRRRR"
],
"asparagus plumosus": [
"Asparagus plumosus",
"Climbing asparagus",
"",
"",
"RRRRRRRRRR"
],
"asparagus scandens": [
"Asparagus scandens",
"Asparagus fern",
"",
"",
"RRRRRRRRRR"
],
"austrocylindropuntia": [
"Austrocylindropuntia",
"Opuntioid cacti",
"",
"All species",
"RRRRRRRRRR"
],
"calicotome spinosa": [
"Calicotome spinosa",
"Spiny broom",
"",
"",
"CRRRRRPPRC"
],
"cannabis sativa": [
"Cannabis sativa",
"Marijuana",
"",
"",
"SSSSSSSSSS"
],
"carduus nutans": [
"Carduus nutans",
"Nodding thistle",
"",
"",
"SSSSSSSSSS"
],
"carduus pycnocephalus": [
"Carduus pycnocephalus",
"Shore thistle",
"",
"",
"RCRRRRCCCR"
],
"carduus tenuiflorus": [
"Carduus tenuiflorus",
"Slender thistle",
"",
"",
"RCRRRRCCCR"
],
"carthamus lanatus": [
"Carthamus lanatus",
"Saffron thistle",
"",
"",
"RCRCRRCCCC"
],
"cenchrus longispinus": [
"Cenchrus longispinus",
"Spiny burr grass",
"Gentle Annie",
"",
"RRPCCCCPRC"
],
"centaurea calcitrapa": [
"Centaurea calcitrapa",
"Star thistle",
"",
"",
"RCRRRRCPCR"
],
"centaurea nigra": [
"Centaurea nigra",
"Black knapweed",
"",
"",
"SSSSSSSSSS"
],
"centaurea solstitialis": [
"Centaurea solstitialis",
"St Barnaby's thistle",
"",
"",
"PPPCRRCPPC"
],
"cestrum parqui": [
"Cestrum parqui",
"Chilean cestrum",
"",
"",
"RPRCRRCPPC"
],
"chondrilla juncea": [
"Chondrilla juncea",
"Skeleton weed",
"",
"",
"RRCRRRRPRR"
],
"chrysanthemoides monilifera": [
"Chrysanthemoides monilifera",
"Boneseed",
"Bitou bush",
"",
"CPCCCPPCCC"
],
"cirsium arvense": [
"Cirsium arvense",
"Californian thistle",
"Perennial thistle",
"",
"CCCCRPPCCC"
],
"cirsium vulgare": [
"Cirsium vulgare",
"Spear thistle",
"",
"",
"RCRRRRCCCR"
],
"conium maculatum": [
"Conium maculatum",
"Hemlock",
"",
"",
"CRRCRRCCCR"
],
"convolvulus arvensis": [
"Convolvulus arvensis",
"Bindweed",
"",
"",
"RPRRRRCCCC"
],
"crataegus monogyna": [
"Crataegus monogyna",
"Hawthorn",
"",
"",
"RCRCRRCCCC"
],
"cryptostegia grandiflora": [
"Cryptostegia grandiflora",
"Rubber vine",
"",
"",
"RRRRRRRRRR"
],
"cuscuta": [
"Cuscuta",
"Dodder",
"",
"All species",
"RRRCRRCCPP"
],
"cylindropuntia": [
"Cylindropuntia",
"Opuntioid cacti",
"",
"All species",
"RRRRRRRRRR"
],
"cynara cardunculus": [
"Cynara cardunculus",
"Artichoke thistle",
"",
"",
"CRRPCCPCPR"
],
"cytisus scoparius": [
"Cytisus scoparius",
"English broom",
"",
"",
"CPRCRRCCCP"
],
"datura ferox": [
"Datura ferox",
"Thorn apple (long-spine)",
"",
"",
"RRCCRCCCCR"
],
"datura inoxia": [
"Datura inoxia",
"Thorn apple (recurved)",
"",
"",
"RRCCRCCPPR"
],
"datura stramonium": [
"Datura stramonium",
"Thorn apple (common)",
"",
"",
"RRCCRCCCCR"
],
"diplotaxis tenuifolia": [
"Diplotaxis tenuifolia",
"Sand rocket",
"Sand mustard",
"",
"RRCRRRRCRR"
],
"dipsacus fullonum subsp. fullonum": [
"Dipsacus fullonum subsp. Fullonum",
"Wild teasel",
"",
"",
"RRRRRRCCCR"
],
"dittrichia graveolens": [
"Dittrichia graveolens",
"Stinkwort",
"",
"",
"RRRRRRCCRR"
],
"dolichandra unguis-cati": [
"Dolichandra unguis-cati",
"Cat’s claw creeper",
"",
"",
"RRRRRRRRRR"
],
"echium plantagineum": [
"Echium plantagineum",
"Paterson's curse",
"",
"",
"CCCCRCCCCC"
],
"echium vulgare": [
"Echium vulgare",
"Viper's bugloss",
"",
"",
"CCCCRRCCCC"
],
"eichhornia crassipes": [
"Eichhornia crassipes",
"Water hyacinth",
"",
"",
"SSSSSSSSSS"
],
"emex australis": [
"Emex australis",
"Spiny emex",
"",
"",
"RRRCCRCPRP"
],
"equisetum": [
"Equisetum",
"Horsetail",
"",
"All species",
"SSSSSSSSSS"
],
"eragrostis curvula": [
"Eragrostis curvula",
"African love grass",
"",
"",
"CCRCRCCCCR"
],
"fallopia japonica": [
"Fallopia japonica",
"Japanese knotweed",
"",
"",
"SSSSSSSSSS"
],
"fallopia sachalinensis": [
"Fallopia sachalinensis",
"Giant knotweed",
"",
"",
"SSSSSSSSSS"
],
"fallopia x bohemica": [
"Fallopia x bohemica",
"Japanese knotweed hybrid",
"",
"",
"SSSSSSSSSS"
],
"festuca gautieri": [
"Festuca gautieri",
"Bear-skin fescue",
"",
"",
"SSSSSSSSSS"
],
"foeniculum vulgare": [
"Foeniculum vulgare",
"Fennel",
"",
"",
"CRRRRRRRRR"
],
"genista linifolia": [
"Genista linifolia",
"Flax-leaved broom",
"",
"",
"CPRRRRPCCC"
],
"genista monspessulana": [
"Genista monspessulana",
"Cape broom",
"",
"",
"CCRCRRCCCC"
],
"hieracium": [
"Hieracium",
"Hawkweed",
"",
"All species",
"SSSSSSSSSS"
],
"hymenachne amplexicaulis": [
"Hymenachne amplexicaulis",
"Hymenachne",
"Olive hymenachne",
"",
"RRRRRRRRRR"
],
"hypericum androsaemum": [
"Hypericum androsaemum",
"Tutsan",
"",
"",
"RCRCRRCCCR"
],
"hypericum perforatum": [
"Hypericum perforatum",
"St. John's wort",
"",
"",
"CCCCRCCCCC"
],
"hypericum tetrapterum": [
"Hypericum tetrapterum",
"St. Peter's wort",
"",
"",
"RRRRRRCCRR"
],
"hypericum triquetrifolium": [
"Hypericum triquetrifolium",
"Tangled hypericum",
"",
"",
"SSSSSSSSSS"
],
"iva axillaris": [
"Iva axillaris",
"Poverty weed",
"",
"",
"SSSSSSSSSS"
],
"jatropha gossypiifolia": [
"Jatropha gossypiifolia",
"Bellyache bush",
"",
"",
"RRRRRRRRRR"
],
"juncus acutus": [
"Juncus acutus",
"Spiny rush",
"",
"",
"RCCCRCCCCC"
],
"lagarosiphon major": [
"Lagarosiphon major",
"Lagarosiphon",
"",
"",
"SSSSSSSSSS"
],
"lantana camara": [
"Lantana camara",
"Lantana",
"",
"",
"RRRRRRRRRR"
],
"lavandula stoechas": [
"Lavandula stoechas",
"Topped lavender",
"",
"",
"RRRRRRCRRR"
],
"lepidium draba": [
"Lepidium draba",
"Hoary cress",
"",
"",
"CRRCCRPCCR"
],
"leucanthemum vulgare": [
"Leucanthemum vulgare",
"Ox-eye daisy",
"",
"",
"CRRCRRRCCR"
],
"lycium ferocissimum": [
"Lycium ferocissimum",
"African boxthorn",
"",
"",
"CCCCCCCCCC"
],
"malvella leprosa": [
"Malvella leprosa",
"Ivy-leafed sida",
"",
"",
"SSSSSSSSSS"
],
"marrubium vulgare": [
"Marrubium vulgare",
"Horehound",
"",
"",
"CCCCRCCCCC"
],
"melianthus comosus": [
"Melianthus comosus",
"Tufted honeyflower",
"",
"",
"RRRCRRRCCR"
],
"mimosa pigra": [
"Mimosa pigra",
"Mimosa",
"giant sensitive plant",
"",
"RRRRRRRRRR"
],
"moraea flaccida": [
"Moraea flaccida",
"Cape tulip (one-leaf)",
"",
"",
"CCCPPCCCCC"
],
"moraea miniata": [
"Moraea miniata",
"Cape tulip (two-leaf)",
"",
"",
"PPCPPCCCPP"
],
"nassella charruana": [
"Nassella charruana",
"Lobed needle grass",
"",
"",
"SSSSSSSSSS"
],
"nassella neesiana": [
"Nassella neesiana",
"Chilean needle grass",
"",
"",
"RRRRRRRRRR"
],
"nassella tenuissima": [
"Nassella tenuissima",
"Mexican feather grass",
"",
"",
"SSSSSSSSSS"
],
"nassella trichotoma": [
"Nassella trichotoma",
"Serrated tussock",
"",
"",
"CPPPPPPCCP"
],
"onopordum acanthium": [
"Onopordum acanthium",
"Scotch thistle",
"Heraldic thistle",
"",
"CCCCRPCPCR"
],
"onopordum acaulon": [
"Onopordum acaulon",
"Stemless thistle",
"",
"",
"RCRRRRCPRR"
],
"onopordum illyricum": [
"Onopordum illyricum",
"Illyrian thistle",
"",
"",
"RPRPRCPPRR"
],
"opuntia": [
"Opuntia",
"Opuntioid cacti",
"",
"All species except O.aurantiaca, O. monacantha, O. robusta, Opuntia stricta, O. ficus-indica",
"RRRRRRRRRR"
],
"opuntia aurantiaca": [
"Opuntia aurantiaca",
"Tiger pear",
"",
"Regionally restricted",
"CPPCPPPCCP"
],
"opuntia monacantha": [
"Opuntia monacantha",
"Prickly pear (drooping)",
"",
"Regionally restricted",
"RRRRCCCCPC"
],
"opuntia robusta": [
"Opuntia robusta",
"Wheel cactus",
"",
"Regionally restricted",
"RRRRCCCPRC"
],
"opuntia stricta": [
"Opuntia stricta",
"Prickly pear (erect)",
"",
"Regionally restricted",
"RRRRCCCCPC"
],
"orobanche ramosa": [
"Orobanche ramosa",
"Branched broomrape",
"",
"",
"SSSSSSSSSS"
],
"oxalis pes-caprae": [
"Oxalis pes-caprae",
"Soursob",
"",
"",
"RRRRRRRRRR"
],
"parkinsonia aculeata": [
"Parkinsonia aculeata",
"Parkinsonia",
"Jerusalem-thorn",
"",
"RRRRRRRRRR"
],
"parthenium hysterophorus": [
"Parthenium hysterophorus",
"Parthenium weed",
"",
"",
"SSSSSSSSSS"
],
"pennisetum macrourum": [
"Pennisetum macrourum",
"African feather grass",
"",
"",
"PPCPPPPPPP"
],
"physalis hederifolia": [
"Physalis hederifolia",
"Prairie ground cherry",
"",
"",
"CRRCCCCCRP"
],
"picnomon acarna": [
"Picnomon acarna",
"Soldier thistle",
"",
"",
"RRRCRPCPRR"
],
"proboscidea louisianica": [
"Proboscidea louisianica",
"Devil's claw (purple-flower)",
"",
"",
"RRCCRRCPRR"
],
"proboscidea lutea": [
"Proboscidea lutea",
"Devil's claw (yellow-flower)",
"",
"",
"RRCCRRCPRR"
],
"prosopis": [
"Prosopis",
"Mesquite",
"",
"All species",
"SSSSSSSSSS"
],
"reseda luteola": [
"Reseda luteola",
"Wild mignonette",
"",
"",
"RRRRRRRRRR"
],
"rhaponticum repens": [
"Rhaponticum repens",
"Hardheads",
"Russian knapweed",
"",
"PRPCCCPPRC"
],
"rosa rubiginosa": [
"Rosa rubiginosa",
"Sweet briar",
"",
"",
"CCCCRCCCCC"
],
"rubus fruticosus": [
"Rubus fruticosus",
"Blackberry",
"",
"",
"CCCCRCCCCC"
],
"sagittaria": [
"Sagittaria",
"Arrowhead",
"",
"",
"PPPCPCCPPP"
],
"salix": [
"Salix",
"Willow",
"",
"All species except Salix alba, Salix alba x matsudana, Salix babylonica, Salix X calodendron, Salix caprea ‘Pendula’, Salix matsudana ‘Aurea’, Salix matsudana ‘Tortuosa’, Salix myrsinifolia, and Salix X reichardtii.",
"RRRRRRRRRR"
],
"salpichroa origanifolia": [
"Salpichroa origanifolia",
"Pampas lily-of-the-valley",
"",
"",
"RPRRRRCCRR"
],
"salvinia molesta": [
"Salvinia molesta",
"Salvinia",
"",
"",
"SSSSSSSSSS"
],
"scolymus hispanicus": [
"Scolymus hispanicus",
"Golden thistle",
"",
"",
"CRPCRCPCRR"
],
"senecio jacobaea": [
"Senecio jacobaea",
"Ragwort",
"",
"",
"CCCPRRPCCR"
],
"senecio madagascariensis": [
"Senecio madagascariensis",
"Fireweed",
"",
"",
"RRRRRRRRRR"
],
"senecio pterophorus": [
"Senecio pterophorus",
"African daisy",
"",
"",
"PRCPRPPCPP"
],
"silybum marianum": [
"Silybum marianum",
"Variegated thistle",
"",
"",
"RCRCRRCCCR"
],
"solanum elaeagnifolium": [
"Solanum elaeagnifolium",
"Silverleaf nightshade",
"",
"",
"CRPCCCCPRC"
],
"solanum linnaeanum": [
"Solanum linnaeanum",
"Apple of Sodom",
"",
"",
"RCRRRRPCCR"
],
"solanum rostratum": [
"Solanum rostratum",
"Buffalo burr",
"",
"",
"RRRCRRPPRP"
],
"tamarix aphylla": [
"Tamarix aphylla",
"Athel pine",
"tamarisk",
"",
"RRRRRRRRRR"
],
"tribulus terrestris": [
"Tribulus terrestris",
"Caltrop",
"",
"",
"CRCCRCCPPC"
],
"ulex europaeus": [
"Ulex europaeus",
"Gorse",
"Furze",
"",
"CPCCRCCCCC"
],
"verbascum thapsus": [
"Verbascum thapsus",
"Great mullein",
"",
"",
"RCRCRRCRRR"
],
"watsonia meriana": [
"Watsonia meriana",
"Wild watsonia",
"",
"",
"CCRRRRCCCR"
],
"xanthium spinosum": [
"Xanthium spinosum",
"Bathurst burr",
"",
"",
"CCCCRCCCCC"
],
"xanthium strumarium": [
"Xanthium strumarium",
"Noogoora burr",
"Californian burr",
"",
"PRCCCCCCPP"
]
};
