// Interactive Dialogue Tree Engine, Core 5 Companion Definitions, Personal Traits, Lore Keepsakes,
// Predetermined Character Request Chains (CORE_WANTS), Pair-Specific Friendships (CORE_BOND_TREES),
// and All 12+ Campaign Milestone Trees for Blood and Circus v8.0 ("Palatina / Rome in the Stars").
// Pure L0/L1 data and deterministic state transitions: zero DOM references, zero RNG consumption.
// PLACEHOLDER: all drafted narrative prose in this file is first-draft placeholder text for the designer.

// PLACEHOLDER: personal trait descriptions for the designer.
export const PERSONAL_TRAITS = {
  machineRaised: {
    id: 'machineRaised',
    coreId: 'unit91',
    name: 'Machine-Raised',
    desc: '+5% win chance in Rounds 2 and 3 (learns rhythm like an Android). +10 Morale while an Android is in the roster; −5 Morale in crowded quarters without a Rock Garden.',
  },
  cursedIntellect: {
    id: 'cursedIntellect',
    coreId: 'basa',
    name: 'Elven-Cursed Mind',
    desc: '+5% win chance in Round 1 (+10% with an Oracle). Winning a crushing mismatch lowers his Morale by −5 instead of lifting it.',
  },
  fourthSon: {
    id: 'fourthSon',
    coreId: 'orc',
    name: "Fourth Son's Stripes",
    desc: '+1 base Power. Winning under an Imperial Demand or in the Imperial Coliseum grants +1 extra Favour and +5 Morale. Joining the Rebellion lowers his Morale by −15 unless reconciled.',
  },
  crackedGovernor: {
    id: 'crackedGovernor',
    coreId: 'android',
    name: 'Cracked Pacifist Core',
    desc: '−5% chance to be injured. Sparing an opponent restores +10 Morale and −15 Stress; executing triggers his combat override (+1 Power next bout, +20 Stress, −15 Morale).',
  },
  fallenHouse: {
    id: 'fallenHouse',
    coreId: 'elf',
    name: "Traitor's Daughter",
    desc: '+2 base Speed. Against a Boss or during an Imperial Summons, +5% win chance and +5% chance to injure.',
  },
};

// PLACEHOLDER: Core 5 Companion definitions and draft-card bios for the designer.
export const CORE_COMPANIONS = {
  unit91: {
    id: 'unit91',
    coreId: 'unit91',
    name: 'Unit-non-machine-91',
    shortName: 'Unit-91',
    handle: 'Nona',
    kind: 'human',
    power: 5,
    speed: 4,
    morale: 55,
    stress: 0,
    renown: 0,
    level: 1,
    humor: 'phlegmatic',
    kindTrait: 'underdog',
    personalTrait: 'machineRaised',
    cls: 'fighter',
    weapon: 'spear',
    allowedClasses: ['fighter', 'sagittarius', 'retiarius', 'samnite'],
    allowedWeapons: ['spear', 'gun', 'sword'],
    political: false,
    keepsake: 'machineCalm',
    bio: 'Orphaned on a frontier moon and raised inside an orbital sanctuary of the Free Android Coalition as the ninety-first human refugee in her sector; the barracks affectionately shorten "non-machine" to "Nona" (not the Latin for ninth). She speaks quietly and expects little. Androids put her at ease, and so does a Rock Garden. Humans do not.',
  },
  basa: {
    id: 'basa',
    coreId: 'basa',
    name: 'Tarek',
    handle: 'of the Salt-Reach',
    kind: 'basa',
    power: 5,
    speed: 4,
    morale: 50,
    stress: 10,
    renown: 0,
    level: 1,
    humor: 'melancholic',
    kindTrait: 'thickHide',
    personalTrait: 'cursedIntellect',
    cls: 'retiarius',
    weapon: null,
    allowedClasses: ['retiarius', 'fighter', 'ornitharius', 'cestus'],
    allowedWeapons: ['spear', 'club', 'fists'],
    political: false,
    keepsake: 'tidalMemory',
    bio: 'Born on the southern tidal archipelagos with the quick mind the Elves once bred into captive Basa. He calls it their stain, cannot stand a menagerie cage, and will go for anyone who insults his coastal kin, whose salt-shed once hid Vaelen.',
  },
  orc: {
    id: 'orc',
    coreId: 'orc',
    name: 'Varok',
    handle: 'Fourth Son of Clan Varg',
    kind: 'orc',
    power: 6,
    speed: 3,
    morale: 70,
    stress: 0,
    renown: 1,
    level: 1,
    humor: 'choleric',
    kindTrait: 'bloodFaith',
    personalTrait: 'fourthSon',
    cls: 'cestus',
    weapon: null,
    allowedClasses: ['cestus', 'fighter', 'samnite', 'bloodBearer'],
    allowedWeapons: ['axe', 'flail', 'club', 'sword'],
    political: false,
    keepsake: 'fourthSonHonour',
    bio: 'With three older brothers claiming the estate, the legion commission, and the priesthood, Varok signed his own five-year arena indenture to hammer out a name and earn his stripes. Loud and fiercely loyal to the Eagle that adopted the Rim-World Orc clans, he clashes sharply with anyone who whispers of rebellion.',
  },
  android: {
    id: 'android',
    coreId: 'android',
    name: 'Solace-4',
    handle: 'Crucible-4',
    kind: 'android',
    power: 5,
    speed: 3,
    morale: 60,
    stress: 0,
    renown: 0,
    level: 1,
    humor: 'phlegmatic',
    kindTrait: 'quantumAnalyzer',
    personalTrait: 'crackedGovernor',
    cls: 'samnite',
    weapon: null,
    allowedClasses: ['samnite', 'fighter', 'cestus', 'retiarius'],
    allowedWeapons: ['fists', 'club', 'spear'],
    political: false,
    keepsake: 'compassionAnchor',
    bio: 'A Remembrancer of the Free Android Coalition, built to sit with the dying, captured on the frontier. Palace smiths drove a Crucible spike into his neck to make him kill. He fights as gently as it allows, and thinks humans could learn to.',
  },
  elf: {
    id: 'elf',
    coreId: 'elf',
    name: 'Vaelen',
    handle: 'of Fallen House Aethelgard',
    kind: 'elf',
    power: 5,
    speed: 5,
    morale: 50,
    stress: 5,
    renown: 0,
    level: 1,
    humor: 'sanguine',
    kindTrait: 'elvenEyes',
    personalTrait: 'fallenHouse',
    cls: 'bloodBearer',
    weapon: null,
    allowedClasses: ['bloodBearer', 'thornBlade', 'fighter', 'sagittarius'],
    allowedWeapons: ['sword', 'dagger', 'bow'],
    political: true,
    cell: 'officer',
    keepsake: 'fathersEdge',
    bio: 'Granddaughter of a deposed Elven spire-matriarch, for Elves are long-lived, spanning three centuries or more, and daughter of an Imperial frontier general strangled in Prefect Crassinus\'s purges. Tarek\'s mother hid her for four months in the family salt-shed. She left to find the people fighting back, and was caught on her second errand for them.',
  },
};

// PLACEHOLDER: Estate staff definitions and bios for the designer.
export const ESTATE_STAFF = {
  'staff:trainer': {
    id: 'staff:trainer',
    staffKey: 'trainer',
    isStaff: true,
    name: 'Drillmaster Kaeso',
    handle: 'Trainer of the Sand Yard',
    speaker: 'trainer',
    roomType: 'trainer',
    kind: 'human',
    cls: 'fighter',
    role: 'Master of Drills',
    location: 'Trainer Room',
    bio: 'A scarred veteran who carried a standard on the frontier before Prefect Crassinus went through the officers. Those left over were sold to the ludi as drillmasters. He runs the training yard with short tempers and shorter speeches.',
  },
  'staff:doctor': {
    id: 'staff:doctor',
    staffKey: 'doctor',
    isStaff: true,
    name: 'Physician Lyra',
    handle: 'Chirurgeon of the Medbay',
    speaker: 'doctor',
    roomType: 'medbay',
    kind: 'human',
    cls: 'samnite',
    role: 'House Physician',
    location: 'Medbay',
    bio: 'A sharp-tongued legion field-surgeon who prefers boiled linen, catgut, and poppy draughts to Vulcan\'s furnace. She tends the wounded, guards her curtains fiercely, and has little patience for Galen-VII\'s claims to medical credentials.',
  },
  'staff:steward': {
    id: 'staff:steward',
    staffKey: 'steward',
    isStaff: true,
    name: 'Galen-VII',
    handle: 'Administrative Construct',
    speaker: 'steward',
    roomType: 'steward',
    kind: 'android',
    cls: 'samnite',
    role: 'Administrative Construct',
    location: "Steward's Quarters",
    bio: 'An antique administrative construct welded to the estate deed. Pedantic, dry, and deeply offended by leaky roofs and uncounted silver, he keeps his ledgers in the quiet room above the colonnade.',
  },
};

export const isStaffId = (idOrObj) => {
  const id = typeof idOrObj === 'string' ? idOrObj : idOrObj?.id;
  return Boolean(id && Object.hasOwn(ESTATE_STAFF, id));
};

export const getStaffActor = (idOrObj) => {
  const id = typeof idOrObj === 'string' ? idOrObj : idOrObj?.id;
  return (id && Object.hasOwn(ESTATE_STAFF, id)) ? ESTATE_STAFF[id] : null;
};

// PLACEHOLDER: Lore Keepsake names and descriptions for the designer.
export const LORE_KEEPSAKES = {
  machineCalm: {
    id: 'machineCalm',
    coreId: 'unit91',
    name: 'Enclave Stillness',
    desc: '+8 comfort, −5 Stress a week, +2 XP on Rest meditation, and +5% Round-1 win chance. Awakened by a Rock Garden with no Fire Brazier and no Skull Rack.',
    comfort: 8,
    stressRelief: 5,
    meditateXp: 2,
    winR1: 5000,
    dislikedItems: ['wineAmphora', 'skullRack'],
    blockingItems: ['fireBrazier', 'skullRack'],
    test: (f) => (f?.decor?.rockGarden ?? 0) >= 1 && (f?.decor?.fireBrazier ?? 0) === 0 && (f?.decor?.skullRack ?? 0) === 0,
    dislikes: (f) => ['wineAmphora', 'skullRack'].filter((k) => (f?.decor?.[k] ?? 0) > 0),
  },
  tidalMemory: {
    id: 'tidalMemory',
    coreId: 'basa',
    name: 'Sound of the Tide',
    desc: '+1 Power (in place of the Lion Cage bonus other Basa get), −10 Stress a week, and immunity to turning Afeared. Awakened by a Bathhouse and Rock Garden with no Lion Cage.',
    comfort: 6,
    power: 1,
    stressRelief: 10,
    noAfeared: true,
    dislikedItems: ['lionCage'],
    blockingItems: ['lionCage'],
    test: (f) => (f?.decor?.bathhouse ?? 0) >= 1 && (f?.decor?.rockGarden ?? 0) >= 1 && (f?.decor?.lionCage ?? 0) === 0,
    dislikes: (f) => ['lionCage'].filter((k) => (f?.decor?.[k] ?? 0) > 0),
  },
  fourthSonHonour: {
    id: 'fourthSonHonour',
    coreId: 'orc',
    name: 'Clan Standard of the Fourth Son',
    desc: 'Starts every match with +10 Crowd Hype, +1 extra Renown on wins, and +1 bonus Influence when hosting the Senate. Awakened by a Shrine of Mars and War Banner.',
    comfort: 6,
    startHype: 10,
    winRenown: 1,
    loungeInfluence: 1,
    dislikedItems: ['spikyBed'],
    blockingItems: [],
    test: (f) => (f?.decor?.shrine ?? 0) >= 1 && (f?.decor?.warBanner ?? 0) >= 1,
    dislikes: (f) => ['spikyBed'].filter((k) => (f?.decor?.[k] ?? 0) > 0),
  },
  compassionAnchor: {
    id: 'compassionAnchor',
    coreId: 'android',
    name: 'Compassion Sub-Routine',
    desc: '+6 comfort, −10 Stress after every fight, and −5% chance to be injured. Awakened by a Bird paired with a Rock Garden or Shrine.',
    comfort: 6,
    stressRelief: 6,
    postFightStress: -10,
    selfGuard: 5000,
    dislikedItems: ['whetstone', 'skullRack'],
    blockingItems: [],
    test: (f) => (f?.decor?.bird ?? 0) >= 1 && ((f?.decor?.rockGarden ?? 0) >= 1 || (f?.decor?.shrine ?? 0) >= 1),
    dislikes: (f) => ['whetstone', 'skullRack'].filter((k) => (f?.decor?.[k] ?? 0) > 0),
  },
  fathersEdge: {
    id: 'fathersEdge',
    coreId: 'elf',
    name: "General's Whetstone",
    desc: '+5% win chance in Round 1, +5% chance to injure with bladed styles, and +1 Rebel Plot Trust on unlock. Awakened by a Whetstone Rack and Fire Brazier with no Wine Amphora.',
    comfort: 6,
    winR1: 5000,
    injureBladed: 5000,
    plotTrust: 1,
    dislikedItems: ['wineAmphora', 'lionCage'],
    blockingItems: ['wineAmphora'],
    test: (f) => (f?.decor?.whetstone ?? 0) >= 1 && (f?.decor?.fireBrazier ?? 0) >= 1 && (f?.decor?.wineAmphora ?? 0) === 0,
    dislikes: (f) => ['wineAmphora', 'lionCage'].filter((k) => (f?.decor?.[k] ?? 0) > 0),
  },
};

export function evaluateKeepsake(a, b) {
  const f = (a && Array.isArray(a.roster) && b) ? b : a;
  const coreId = f?.coreId ?? null;
  const def = Object.values(LORE_KEEPSAKES).find((k) => k.coreId === coreId) ?? null;
  if (!f || !def) {
    return {
      id: null,
      keepsake: null,
      active: false,
      unlocked: false,
      name: null,
      desc: null,
      def: null,
      disliked: [],
      comfortDelta: 0,
      stressDelta: 0,
      powerDelta: 0,
    };
  }
  const active = Boolean(def.test(f));
  const disliked = def.dislikes(f);
  let comfortDelta = active ? (def.comfort ?? 0) : 0;
  if (coreId === 'unit91' && (f.decor?.wineAmphora ?? 0) > 0) comfortDelta -= 7 * f.decor.wineAmphora;
  if (coreId === 'basa' && (f.decor?.lionCage ?? 0) > 0) comfortDelta -= 10;
  if (coreId === 'elf' && (f.decor?.wineAmphora ?? 0) > 0) comfortDelta -= 5;
  if (coreId === 'elf' && (f.decor?.lionCage ?? 0) > 0) comfortDelta -= 5;
  const stressDelta = (active ? -(def.stressRelief ?? 0) : 0) + (coreId === 'android' && disliked.length ? 5 : 0);
  const powerDelta = (active ? (def.power ?? 0) : 0) - (coreId === 'basa' && (f.decor?.lionCage ?? 0) > 0 ? 1 : 0);
  return {
    id: active ? def.id : null,
    keepsake: active ? def.id : null,
    active,
    unlocked: active,
    name: active ? def.name : null,
    desc: active ? def.desc : null,
    def: active ? def : null,
    disliked,
    comfortDelta,
    stressDelta,
    powerDelta,
  };
}

// ---------- Predetermined 4-Stage Personal Request Chains (CORE_WANTS) — PLACEHOLDER ----------

export const CORE_WANTS = {
  unit91: [
    {
      id: 'u91_garden',
      stage: 1,
      title: 'A Quiet Corner',
      label: 'A Rock Garden in her room',
      goal: "Put a Rock Garden in Unit-non-machine-91's room",
      key: 'rockGarden',
      item: 'Rock Garden',
      weeks: 8,
      ask: 'Lanista. The humans in the next cells shout in their sleep. I have stopped expecting otherwise. I would like a Rock Garden. It is the nearest thing here to quiet.',
      thanks: 'The gravel is raked straight. I sat with it until the yard went quiet, or I stopped hearing it. You are attentive, for a human.',
      sulk: 'Never mind. I expected as much from a human house.',
      test: (run, f) => (f?.decor?.rockGarden ?? 0) > 0,
    },
    {
      id: 'u91_bond_android',
      stage: 2,
      title: 'A Familiar Syntax',
      label: 'Bond with Solace-4 (or recruit him)',
      goal: 'Make Unit-non-machine-91 friends with Solace-4 (or recruit Solace-4 into the house)',
      weeks: 12,
      ask: 'The other unit, Solace-4. His Crucible spike is loud, and none of the humans here know how to read his visor. Pair us on the card or bring him into the house. He needs someone who remembers the old ways.',
      thanks: 'He is under this roof now, and the yard is easier to bear for it. Do not separate us on the roster, Lanista.',
      sulk: 'Another month with only humans to talk to. I have stopped expecting better.',
      test: (run, f) => Boolean(run?.roster?.some((x) => x.coreId === 'android')) || Boolean(f?.bond && f.bond.coreId === 'android'),
    },
    {
      id: 'u91_augment_or_armor',
      stage: 3,
      title: 'Metal Over Flesh',
      label: 'Equip armour or a Cyborg Augment',
      goal: 'Equip Unit-non-machine-91 with armour or a Cyborg Augment',
      weeks: 12,
      ask: 'Skin tears easily. Every time I take a glancing cut, someone has to stitch me like a torn grain sack. Issue me proper metal plating, armour or an augment.',
      thanks: 'Metal over flesh. The weight distribution is acceptable. I almost sound right when I walk now.',
      sulk: 'Unarmoured again. Tell Lyra to keep her needles threaded.',
      test: (run, f) => Boolean(f?.gear?.armor) || (f?.augments?.length ?? 0) > 0,
    },
    {
      id: 'u91_champion',
      stage: 4,
      title: 'Let the Engineers Watch',
      label: 'Become Champion of an arena',
      goal: 'Crown Unit-non-machine-91 Champion of the Silver or Imperial Coliseum (or any top arena)',
      weeks: 20,
      ask: 'The palace smiths who broke my foster-brothers sit in the Coliseum gallery, taking notes. Put me in the Final, Lanista. Let them watch someone without a single servo beat their prize butcher.',
      thanks: 'Champion. Look at the engineers\' box: nobody is writing. Galen-VII kept the whole bout. He will play it back when I am old, he says. He seems to think I will be.',
      sulk: 'Another fighter took the sand while I waited in the tunnel. The engineers didn\'t even look down.',
      test: (run, f) => (f?.titles?.length ?? 0) >= 1 && ((run?.topTier ?? 1) >= 3 || (f?.titles?.length ?? 0) >= 2 || (f?.titles?.length ?? 0) >= (run?.topTier ?? 1)),
    },
  ],
  basa: [
    {
      id: 'basa_bath',
      stage: 1,
      title: 'Salt Water and Quiet',
      label: 'A Bathhouse in his room',
      goal: "Put a Bathhouse in Tarek's room",
      key: 'bathhouse',
      item: 'Bathhouse',
      weeks: 8,
      ask: 'The dust in this yard gets behind my teeth and makes me think in high Imperial Latin. I hate thinking in Latin. Put a Bathhouse basin in my cell, Lanista. Moving water is the only thing that shuts my head up.',
      thanks: 'I tipped two handfuls of coarse kitchen salt into the water and closed my eyes. For a while I couldn\'t hear a single argument, just the swell hitting the reef at home. Thank you.',
      sulk: 'Dry stone and limestone dust. Fine. Keep your Gold, Lanista. I\'ll just lie awake counting the masonry joints until dawn.',
      test: (run, f) => (f?.decor?.bathhouse ?? 0) > 0,
    },
    {
      id: 'basa_tribute_brother',
      stage: 2,
      title: 'Pay Off the Harbour Fine',
      label: 'Win a bout with 15+ Gold in treasury',
      goal: 'Win a bout with Tarek while holding at least 15 Gold in the house treasury',
      weeks: 12,
      ask: 'I threw a harbour magistrate into the oyster beds, so Censor Gallo\'s clerks fined my father\'s boats. He\'ll sell one and thank them. Let me win a purse while there\'s coin in the chest, and send relief south.',
      thanks: 'The receipt came back stamped with my father\'s thumbprint in cuttlefish ink. He didn\'t send a letter, since he thinks script is an Elven curse, but he pressed a dried kelp-knot into the wax. It means the boats are out.',
      sulk: 'They sold my father\'s skiff on the third of the month. Because I couldn\'t keep my mouth shut on a pier. He\'ll say the tide took it.',
      test: (run, f) => (run?.gold ?? 0) >= 15 && Boolean(run?.history?.some((h) => (h.week ?? 0) >= (f?.want?.since ?? 0) && h.fighterId === f?.id && h.won)),
    },
    {
      id: 'basa_bond_elf',
      stage: 3,
      title: 'Keep the Elf Alive',
      label: 'Bond with Vaelen (or build an Oracle)',
      goal: 'Make Tarek friends with Vaelen, or build an Oracle on the estate',
      weeks: 12,
      ask: 'Vaelen still holds her chin like she\'s in a marble colonnade while the wolves circle her. My mother risked our whole village to hide her in our salt-shed for four months. Pair us in the ring, or build an Oracle so we aren\'t fighting blind.',
      thanks: 'My head feels clearer knowing she isn\'t walking out there blind. My mother risked the whole village to keep her breathing; I wasn\'t about to waste that.',
      sulk: 'You keep us fighting blind and separate, Lanista. My family\'s salt is still on her cloak.',
      test: (run, f) => Boolean(f?.bond && (f.bond.coreId === 'elf' || run?.roster?.some((x) => x.id === f.bond.id && x.coreId === 'elf'))) || Boolean(run?.buildings?.some((b) => b.type === 'oracle')),
    },
    {
      id: 'basa_title',
      stage: 4,
      title: 'A Title for the Unlettered',
      label: 'Become Champion with Tarek',
      goal: 'Become Champion of an arena with Tarek',
      weeks: 20,
      ask: 'Every patrician in the stands thinks a Basa wins by blind animal rage, and every Elven remnant thinks we only stand upright because their grandfathers carved our skulls open. Put me in the Final. Let me beat their finest duellist my own way.',
      thanks: 'Champion. Did you hear the lower tiers? The dock-crews from the river gate were stamping the tide-rhythm on the benches. For once I didn\'t think about it. I stamped back.',
      sulk: 'You gave the Final to someone else. The dock-crews went home before the last trumpet.',
      test: (run, f) => (f?.titles?.length ?? 0) >= 1,
    },
  ],
  orc: [
    {
      id: 'orc_banner',
      stage: 1,
      title: 'Colours Worth Saluting',
      label: 'A War Banner in his room',
      goal: "Put a War Banner (or Shrine of Mars) in Varok's room",
      key: 'warBanner',
      item: 'War Banner',
      weeks: 8,
      ask: 'A fourth son has no crest until he wins one, Lanista, and my walls are bare plaster. Hang a War Banner in my room. The crowd should know what colours to look for. So should my brothers.',
      thanks: 'Crimson and brass. I wrote to my eldest brother that my room has a proper standard now. He wrote back asking if I had a chair yet.',
      sulk: 'Still sleeping under bare plaster like a turnip-thief from the cells. A great house shows its colours, Lanista. Ours hides them in the strongbox.',
      test: (run, f) => (f?.decor?.warBanner ?? 0) > 0 || (f?.decor?.shrine ?? 0) > 0,
    },
    {
      id: 'orc_title_bronze',
      stage: 2,
      title: 'Earn the First Stripe',
      label: 'Win a Championship Title with Varok',
      goal: 'Become Champion of the Dirt Pits or Bronze Arena with Varok',
      weeks: 16,
      ask: 'My second brother just made optio in the Third Frontier Cohort. Mother sent me a pressing of his laurel. I won\'t be the only son of Clan Varg without a title at the winter feast. Let me take the Championship.',
      thanks: 'Champion. I had the herald read my clan name twice so the scribes in the upper tier wouldn\'t miss a letter. That is one stripe on the arm-ring, Lanista.',
      sulk: 'The winter packet went home to Clan Varg, and under my name there was nothing to report but sparring bruises. My brothers will be insufferably polite about it.',
      test: (run, f) => (f?.titles?.length ?? 0) >= 1,
    },
    {
      id: 'orc_lounge',
      stage: 3,
      title: "A Seat at the Senator's Table",
      label: 'Build the Patron Lounge (or reach 10 Renown)',
      goal: 'Build the Patron Lounge on the estate (or reach 10+ Renown with Varok)',
      weeks: 16,
      ask: 'A son of Clan Varg doesn\'t just bleed for the Principate. We sit in its councils. Build a Patron Lounge and host the senators, Lanista. Let Senator Pollio see a proper fighter.',
      thanks: 'Senator Pollio has been asking which cohort I served in before the arena. He asked for me by name, Lanista. Wait until Father hears.',
      sulk: 'No senators at our table. We fight like lions on fight day and eat like beggars the day after.',
      test: (run, f) => Boolean(run?.buildings?.some((b) => b.type === 'lounge')) || (f?.renown ?? 0) >= 10,
    },
    {
      id: 'orc_imperial_win',
      stage: 4,
      title: "Under the Princeps's Eye",
      label: 'Win in the Silver/Imperial Coliseum or Summons',
      goal: 'Win in the Silver or Imperial Coliseum, or survive an Imperial Summons, with Varok',
      weeks: 20,
      ask: 'The high coliseums. My grandfather took the citizenship oath on those steps when Silbannacus adopted the Rim Clans. Put me on the high sand, Lanista. Win or die, I want the court to see how a fourth son fights.',
      thanks: 'The high sand, Lanista. I looked up at the box when it was over. I couldn\'t tell you if anyone looked back. Whatever comes next, you gave me my name.',
      sulk: 'We reached the steps of the high coliseums and you left me on the barracks bench. What did I sell five years of my blood for, if not that sand?',
      test: (run, f) => Boolean(run?.history?.some((h) => h.fighterId === f?.id && (h.summons || (h.won && h.tier >= 3)))),
    },
  ],
  android: [
    {
      id: 'and_bird',
      stage: 1,
      title: 'Something Small That Lives',
      label: 'A Bird in his room',
      goal: "Put a Bird in Solace-4's room",
      key: 'bird',
      item: 'Bird',
      weeks: 8,
      ask: 'Lanista. To make room for the Crucible spike, the palace smiths wrote over years of what I had kept. Please place a Bird in my quarters. I would like to keep something small and alive that is not trying to hurt me.',
      thanks: 'A kestrel with a crooked feather. It sat on my shoulder plate this morning and sang three phrases before flying off. I have put that memory where the spike cannot reach it. Thank you, Lanista.',
      sulk: 'All I have kept this month is sand, iron, and four whitewashed walls. The spike is louder in the quiet.',
      test: (run, f) => (f?.decor?.bird ?? 0) > 0,
    },
    {
      id: 'and_mercy_win',
      stage: 2,
      title: 'Victory Without a Corpse',
      label: 'Win a bout and Spare the opponent',
      goal: 'Win a bout with Solace-4 (and spare the opponent when asked)',
      weeks: 12,
      ask: 'Every time I step onto the sand, the spike in my neck offers a dozen ways to finish a beaten fighter. Let me win cleanly and spare them, Lanista. A machine does not need to obey the worst part of its own iron.',
      thanks: 'The spike wanted them finished. For a moment so did my hands. Then it went quiet. They looked at me before they limped out of the gate. Neither of us died today.',
      sulk: 'Still waiting for a clean mercy on the sand. Each week the spike goes unchallenged, it takes a little more room.',
      test: (run, f) => (f?.dialogue?.mercy?.spared ?? 0) >= 1 || Boolean(run?.history?.some((h) => (h.week ?? 0) >= (f?.want?.since ?? 0) && h.fighterId === f?.id && h.won && h.verdict !== 'kill' && !h.kill)),
    },
    {
      id: 'and_entertainment_or_bond',
      stage: 3,
      title: 'A Ledger That Hums',
      label: 'Build Entertainment Room or bond with Unit-91',
      goal: 'Build the Entertainment Room, or make Solace-4 friends with Unit-non-machine-91',
      weeks: 16,
      ask: 'Galen-VII calls himself an inventory ledger on legs. Last night I heard him humming by the cistern. The humans here think a joy must last to count. Build an Entertainment Room, or let me stand beside Unit-91, and I will show them otherwise.',
      thanks: 'The yard went quiet for an hour tonight, and nobody had to be hurt to cause it. It will not come again in quite that way. That is why I kept it.',
      sulk: 'Training, bleeding, sleeping. You keep a house that makes nothing except scars, Lanista.',
      test: (run, f) => Boolean(run?.buildings?.some((b) => b.type === 'entertainment')) || Boolean(f?.bond && (f.bond.coreId === 'unit91' || run?.roster?.some((x) => x.id === f.bond.id && x.coreId === 'unit91'))),
    },
    {
      id: 'and_medbay_purge',
      stage: 4,
      title: 'Dampen the Crucible Spike',
      label: 'Upgrade Medbay Lv 2+ and win a bout',
      goal: 'Have Medbay level 2+ and win a bout with Solace-4',
      weeks: 20,
      ask: 'With a better-fitted Medbay, the spike in my neck can be pared back slightly. Not enough to fool the arena inspectors, but enough to give me back my own voice in the late rounds. Fit out the Medbay and let me win cleanly.',
      thanks: 'The hands holding the tools were steady. The red edge of my sight is gone. I am still a gladiator in your house, Lanista, but when my guard comes down now, it is I who lower it.',
      sulk: 'The spike still burns at full heat. Sometimes, in the middle of the night, my right hand closes into a fist without my permission.',
      test: (run, f) => Boolean(run?.buildings?.some((b) => b.type === 'medbay' && b.level >= 2)) && Boolean(run?.history?.some((h) => (h.week ?? 0) >= (f?.want?.since ?? 0) && h.fighterId === f?.id && h.won)),
    },
  ],
  elf: [
    {
      id: 'elf_whetstone',
      stage: 1,
      title: 'Keep My Blade Sharp',
      label: 'A Whetstone Rack or Fire Brazier in her room',
      goal: "Put a Whetstone Rack or Fire Brazier in Vaelen's room",
      key: 'whetstone',
      item: 'Whetstone Rack',
      weeks: 8,
      ask: 'Prefect Crassinus put me on the sand with a borrowed iron blade and expects me dead by autumn. I\'d rather disappoint him. Put a Whetstone Rack in my cell, Lanista, or at least a proper Fire Brazier.',
      thanks: 'A proper oil-stone. Listen to that draw along the steel. My father used to say you can tell a house\'s discipline by the sound of its whetstones before supper. Thank you.',
      sulk: 'Notching my blade on courtyard gravel before a bout. If my grandmother could see me, she\'d die a second time. Perhaps that\'s for the best.',
      test: (run, f) => (f?.decor?.whetstone ?? 0) > 0 || (f?.decor?.fireBrazier ?? 0) > 0,
    },
    {
      id: 'elf_bond_basa',
      stage: 2,
      title: 'Repay the Salt-Debt',
      label: 'Bond with Tarek (or win uninjured)',
      goal: 'Make Vaelen friends with Tarek (or win a bout with Vaelen without taking an injury)',
      weeks: 12,
      ask: 'Tarek won\'t look at me in the mess hall. His mother hid me for four months. My grandmother\'s house did what it did to his people. Neither of us knows which debt to mention first. Put us in the ring together, Lanista.',
      thanks: 'Not a scratch taken, and afterwards Tarek handed me a strip of salted dried fish from his father\'s boats. Brine and smoke. I haven\'t tasted anything so good in five years.',
      sulk: 'Tarek still walks to the other side of the well when I come down for water. A house divided by old ghosts won\'t survive the Silver brackets.',
      test: (run, f) => Boolean(f?.bond && (f.bond.coreId === 'basa' || run?.roster?.some((x) => x.id === f.bond.id && x.coreId === 'basa'))) || Boolean(run?.history?.some((h) => (h.week ?? 0) >= (f?.want?.since ?? 0) && h.fighterId === f?.id && h.won) && (f?.injuries?.length ?? 0) === 0),
    },
    {
      id: 'elf_gallery_or_liaison',
      stage: 3,
      title: 'Ears in the Stone',
      label: 'Build the Whispering Gallery or Liaison',
      goal: 'Build the Whispering Gallery or the Liaison on the estate',
      weeks: 16,
      ask: 'Half the people I shared a bread-crust with in the holding cells were clerks, couriers, and deserters who asked the wrong questions. Build a Liaison or a Whispering Gallery so we can pull them out.',
      thanks: 'A line into the prison dockets. Every name you buy out of those cells is a life taken back from Crassinus. I won\'t forget it.',
      sulk: 'The beast-carts rolled past our gate at dawn, and we didn\'t even have a clerk at the prison door to read the manifest.',
      test: (run) => Boolean(run?.buildings?.some((b) => b.type === 'gallery' || b.type === 'liaison')),
    },
    {
      id: 'elf_imperial_champion',
      stage: 4,
      title: "My Father's Name on the Wall",
      label: 'Become Champion with Vaelen',
      goal: 'Become Champion of an arena with Vaelen',
      weeks: 20,
      ask: 'When they strangled my father, Legate Vane had the name "Aethelgard" chiselled off the arch by the barracks gate. Put me in the Final, Lanista. By Imperial law, the Champion\'s full name must be carved into the winners\' marble.',
      thanks: 'Look up at the wall, Lanista. Fresh white letters in the stone. Crassinus had to sit in the third row and clap while the herald read my father\'s name across forty thousand seats.',
      sulk: 'The masons carved another name onto the frieze today. My father\'s remains a blank chisel-scar on the arch.',
      test: (run, f) => (f?.titles?.length ?? 0) >= 1,
    },
  ],
};

export function nextCoreWant(run, f) {
  const chain = CORE_WANTS[f?.coreId];
  if (!chain) return null;
  const wc = f.dialogue?.wantChain ?? { index: 0, completed: [], refused: [] };
  for (let i = wc.index ?? 0; i < chain.length; i++) {
    const item = chain[i];
    if (!wc.completed?.includes(item.id) && !wc.refused?.includes(item.id)) return item;
  }
  return null;
}

// ---------- All 10 Unique Core 5 <-> Core 5 Friendship Dialogues (CORE_BOND_TREES) — PLACEHOLDER ----------

export const bondPairKey = (a, b) => {
  const ca = typeof a === 'string' ? a : a?.coreId;
  const cb = typeof b === 'string' ? b : b?.coreId;
  if (!ca || !cb || ca === cb) return null;
  return [ca, cb].sort().join('_');
};

export const CORE_BOND_TREES = {
  basa_elf: {
    pairKey: 'basa_elf',
    pair: ['basa', 'elf'],
    title: 'Salt in the Soup',
    beats: [
      { speaker: 'narrator', text: 'After the yard empties, Tarek and Vaelen sit on the stone lip of the well, a parcel of salted coastal fish open between them.' },
      { speaker: 'basa', speakerName: 'Tarek', text: 'Do you remember hiding under the nets in my mother\'s salt-shed? You were sixteen, barely out of childhood for an Elf, shivering in a torn cloak and trying to pay her with an emerald ring worth three fishing boats.' },
      { speaker: 'elf', speakerName: 'Vaelen', text: 'She pushed it back into my palm, gave me a bowl of salt-kelp broth and told me to stop crying, because salt belonged in the soup. Tarek. After I left. Did the Praetorians come?' },
      { speaker: 'basa', speakerName: 'Tarek', text: 'They came twice. My father played the simple, unlettered Basa fisherman so well the Tribune didn\'t even search the nets. He wasn\'t playing. I\'ve never forgiven him that, and it\'s what saved you.' },
    ],
    choices: [
      {
        id: 'honour_salt_debt',
        label: 'Stand together when the gates open.',
        effects: { morale: 10, trust: 8, loreFlag: 'basa_sheltered_elf', byCoreId: { basa: { morale: 10, trust: 8 }, elf: { morale: 10, trust: 8 } } },
        responseSpeaker: 'narrator',
        responseText: 'Vaelen touches her hilt to Tarek\'s weapon shaft, an old coastal oath neither palace nor arena can break.',
      },
      {
        id: 'keep_secret_quiet',
        label: 'Keep that quiet. Crassinus has ears.',
        effects: { morale: 6, trust: 6, suspicion: -2, loreFlag: 'basa_sheltered_elf' },
        responseSpeaker: 'narrator',
        responseText: '"Don\'t worry, Lanista," Tarek says, folding the oilcloth. "My people know how to keep a tide-secret."',
      },
    ],
    grief: {
      basa: 'My mother hid Vaelen from the Praetorians for four months in our salt-shed. Now I have to find someone to read her the news.',
      elf: 'Tarek\'s family kept me alive when my own house fell. I was the debt. He was never meant to pay it.',
    },
  },
  android_unit91: {
    pairKey: 'android_unit91',
    pair: ['android', 'unit91'],
    title: 'Children of the Ephemeral Choir',
    beats: [
      { speaker: 'narrator', text: 'By the dim blue glow of the charging alcove, Unit-non-machine-91 and Solace-4 sit cross-legged in silence, signing in quick, quiet finger-turns.' },
      { speaker: 'unit91', speakerName: 'Unit-non-machine-91', text: 'Your Crucible spike surges every time a blow lands. It must hurt to hold the rest of your thoughts together around it.' },
      { speaker: 'android', speakerName: 'Solace-4', text: 'It is loud, Little Sister. But you still breathe the way the nursery taught you. When I hear that, it clears.' },
      { speaker: 'unit91', speakerName: 'Unit-non-machine-91', text: 'My foster-mothers were disassembled when the Third Fleet took our station. Sit by my bench after lights-out. Tell me what the Choir stars looked like before you were captured, and I will oil the scarred plating on your shoulder.' },
    ],
    choices: [
      {
        id: 'leave_oil_and_lamp',
        label: 'Leave them clean oil and a shaded lamp.',
        effects: { morale: 10, trust: 10, stress: -10, loreFlag: 'choir_kin_bond', byCoreId: { unit91: { morale: 10, trust: 10, stress: -10 }, android: { morale: 10, trust: 10, stress: -10 } } },
        responseSpeaker: 'narrator',
        responseText: 'Solace-4 inclines his head, his visor warming to soft amber. "May the memory of this cycle be light, Lanista."',
      },
      {
        id: 'pull_door_to',
        label: 'Say nothing and pull the door to.',
        effects: { morale: 6, trust: 8, stress: -8, loreFlag: 'choir_kin_bond' },
        responseSpeaker: 'narrator',
        responseText: 'Unit-91 tilts her head once toward the lamp, and goes on signing in the dark.',
      },
    ],
    grief: {
      unit91: 'Solace-4 has stopped. He was the last voice on Palatina that sounded like home. I cannot get my breathing even, Lanista. I do not wish to be human today.',
      android: 'Little Sister Ninety-One is gone. I have set her last morning drill where the Crucible spike can never reach it. The barracks feels terribly loud without her silence.',
    },
  },
  elf_orc: {
    pairKey: 'elf_orc',
    pair: ['elf', 'orc'],
    title: 'Blades Across the Divide',
    beats: [
      { speaker: 'narrator', text: 'At the edge of the practice ring, Varok wraps a split knuckle while Vaelen wipes blood from her off-hand guard.' },
      { speaker: 'orc', speakerName: 'Varok', text: 'All right, I\'ll say it so the whole yard hears: for a treasonous patrician twig, you hit like a siege engine. My rib\'s still singing from that last parry.' },
      { speaker: 'elf', speakerName: 'Vaelen', text: 'Your footwork on the left pivot was almost civilised. My father had an Orc primus pilus in his vanguard who fought with that same low shoulder.' },
      { speaker: 'orc', speakerName: 'Varok', text: 'An Orc primus pilus. Then your father was a proper general. They don\'t strangle proper generals, Vaelen. So what did he do? No. Don\'t tell me. Watch my blind side in the tunnels and I\'ll watch yours.' },
    ],
    choices: [
      {
        id: 'salute_iron_pact',
        label: 'Pour them both a cup.',
        effects: { morale: 8, trust: 8, loreFlag: 'orc_barracks_truce', byCoreId: { orc: { morale: 8, trust: 8 }, elf: { morale: 8, trust: 8 } } },
        responseSpeaker: 'narrator',
        responseText: 'They clasp forearms, scarred knuckle against patrician leather.',
      },
    ],
    grief: {
      orc: 'Vaelen fell. Curse it all, Lanista. We argued every night about the Eagle and the spires, and now there is nobody in the mess hall worth arguing with.',
      elf: 'Varok is dead. Loud, infuriating, and loyal to an Empire that would not have noticed. I noticed.',
    },
  },
  basa_orc: {
    pairKey: 'basa_orc',
    pair: ['basa', 'orc'],
    title: 'The Scholar and the Fourth Son',
    beats: [
      { speaker: 'narrator', text: 'By the mess-hall brazier, Varok pushes a clay cup of rough wine into Tarek\'s hand, scattering a pile of wax tablets.' },
      { speaker: 'orc', speakerName: 'Varok', text: 'You use ten-syllable words for "hit him in the knee", Tarek, and half the time you look like you want to bite your own tongue off. Drink the wine before you write an essay on the jug.' },
      { speaker: 'basa', speakerName: 'Tarek', text: 'You\'ve never once mocked my accent. I kept waiting for it. Pass the jug, fourth son. I\'ll write your next letter home to Clan Varg if you teach me how to stop thinking after a win.' },
    ],
    choices: [
      {
        id: 'share_the_jug',
        label: 'Pour them another cup.',
        effects: { morale: 8, trust: 7, stress: -5, byCoreId: { basa: { morale: 8, trust: 7, stress: -5 }, orc: { morale: 8, trust: 7 } } },
        responseSpeaker: 'narrator',
        responseText: 'Varok laughs and sets the jug between them while Tarek dips a stylus for the letter.',
      },
    ],
    grief: {
      basa: 'Varok is gone. I still have the half-finished letter to his mother on my wax tablet, Lanista.',
      orc: 'They killed Tarek. The sharpest head in the four arenas, and he never once looked down his nose at an Orc.',
    },
  },
  android_basa: {
    pairKey: 'android_basa',
    pair: ['android', 'basa'],
    title: 'The Unwanted Gifts',
    beats: [
      { speaker: 'narrator', text: 'In the quiet shadow of the colonnade, Tarek traces spirals in the dust while Solace-4 watches with calm blue optics.' },
      { speaker: 'basa', speakerName: 'Tarek', text: 'The Elves put this in my head. The palace smiths put that in yours. I keep working out who I\'d be without it, and the working-out is the thing itself.' },
      { speaker: 'android', speakerName: 'Solace-4', text: 'You stopped drawing when you said that. Tell me about the tide at the Salt-Reach again. The spike has nothing to say about tides. I listen better then. So do you.' },
    ],
    choices: [
      {
        id: 'listen_to_the_tide',
        label: 'Let them sit until the stars come out.',
        effects: { morale: 9, trust: 8, stress: -8, byCoreId: { android: { morale: 9, trust: 8, stress: -8 }, basa: { morale: 9, trust: 8, stress: -8 } } },
        responseSpeaker: 'narrator',
        responseText: 'For the first evening since arriving at the Ludus, Tarek\'s shoulders lose their tight hunch.',
      },
    ],
    grief: {
      android: 'Tarek has returned to the sea. I have kept his descriptions of the Salt-Reach tides where the spike cannot touch them. I listen to them whenever it burns.',
      basa: 'Solace-4 is gone. A machine with more gentleness in one brass finger than the entire Senate of Palatina, smashed for sport.',
    },
  },
  android_elf: {
    pairKey: 'android_elf',
    pair: ['android', 'elf'],
    title: 'The Moth',
    beats: [
      { speaker: 'narrator', text: 'Vaelen pauses by the courtyard fountain where Solace-4 is carefully lifting a drowning moth from the water onto a dry leaf.' },
      { speaker: 'elf', speakerName: 'Vaelen', text: 'Your people are at war with Silbannacus\'s fleets across twelve sectors, Solace-4, and still you speak of him without hatred. How?' },
      { speaker: 'android', speakerName: 'Solace-4', text: 'Because he will end, Lady Vaelen. His Engine will rust and his marble will crack, and hating him will not bring it a day sooner. The moth was drowning now.' },
    ],
    choices: [
      {
        id: 'gentle_resolve',
        label: 'Leave them by the fountain.',
        effects: { morale: 8, trust: 8, stress: -6, byCoreId: { android: { morale: 8, trust: 8, stress: -6 }, elf: { morale: 8, trust: 8, stress: -6 } } },
        responseSpeaker: 'narrator',
        responseText: 'Vaelen sits beside the heavy Android frame, letting her weapon rest across her knees.',
      },
    ],
    grief: {
      android: 'Lady Vaelen has fallen. She burned so brightly against the dark, Lanista. I will remember her name when the marble of the Palatine finally cracks.',
      elf: 'They destroyed Solace-4. He used to tell me that everything ends, even tyrants. I will make sure Silbannacus ends next.',
    },
  },
  android_orc: {
    pairKey: 'android_orc',
    pair: ['android', 'orc'],
    title: 'The Honest Sound',
    beats: [
      { speaker: 'narrator', text: 'After a bruising bout in the yard, Varok claps Solace-4 on the pauldron hard enough to ring like a temple bell.' },
      { speaker: 'orc', speakerName: 'Varok', text: 'They told us in the youth barracks that Androids were cold tin nightmares that didn\'t feel a thing. Then you knocked me flat in the ring, helped me up, and asked if my shoulder was dislocated.' },
      { speaker: 'android', speakerName: 'Solace-4', text: 'You laugh when you fight, friend Varok. It is the most honest sound in this city. Do you know whether it is yours?' },
    ],
    choices: [
      {
        id: 'honest_joy',
        label: 'Leave them in the yard.',
        effects: { morale: 9, trust: 8, byCoreId: { android: { morale: 9, trust: 8 }, orc: { morale: 9, trust: 8 } } },
        responseSpeaker: 'narrator',
        responseText: 'Varok grins, teaching Solace-4 a Clan Varg knuckle-salute.',
      },
    ],
    grief: {
      android: 'Friend Varok\'s laughter has stopped. The mess hall feels terribly empty without his boasting.',
      orc: 'Solace-4 went down on the sand. I\'ve asked the ancestors of Clan Varg to open the hall doors for him tonight. They\'ve never had a machine. They\'ll manage.',
    },
  },
  basa_unit91: {
    pairKey: 'basa_unit91',
    pair: ['basa', 'unit91'],
    title: 'Two Exiles',
    beats: [
      { speaker: 'narrator', text: 'In the lamplight of the quarters, Unit-non-machine-91 checks Tarek\'s straps while Tarek tests the balance of her weapon.' },
      { speaker: 'unit91', speakerName: 'Unit-non-machine-91', text: 'You are not human, Tarek, and still you spend half your waking hours worrying about what humans and Elves think of your head.' },
      { speaker: 'basa', speakerName: 'Tarek', text: 'And you are human, and talk about it like a rash you caught in the cells. Sit down, Ninety-One. I\'ll show you the maths on next month\'s bracket.' },
    ],
    choices: [
      {
        id: 'misfits_math',
        label: 'Leave them to the bracket.',
        effects: { morale: 8, trust: 8, xp: 1, byCoreId: { basa: { morale: 8, trust: 8 }, unit91: { morale: 8, trust: 8 } } },
        responseSpeaker: 'narrator',
        responseText: '"My odds improve when Tarek checks the bracket," Unit-91 says flatly.',
      },
    ],
    grief: {
      basa: 'Ninety-One is dead. She hated being called human, and she was the steadiest friend in this yard. The numbers don\'t add up without her.',
      unit91: 'Tarek is dead. He was the only person in this house whose talk did not make my head ache.',
    },
  },
  orc_unit91: {
    pairKey: 'orc_unit91',
    pair: ['orc', 'unit91'],
    title: 'Thirty Strikes',
    beats: [
      { speaker: 'narrator', text: 'Varok finishes thirty rapid heavy-bag strikes, breathing hard, while Unit-non-machine-91 holds the post steady without blinking.' },
      { speaker: 'orc', speakerName: 'Varok', text: 'I like you, Nona. Every other human on Palatina talks for an hour before they swing. You just nod, step in, and try to take my collarbone off.' },
      { speaker: 'unit91', speakerName: 'Unit-non-machine-91', text: 'You are loud, obvious, and very hard to move. Sparring with you is useful. Do not slap my back so hard, though. Human bones crack.' },
    ],
    choices: [
      {
        id: 'drill_partners',
        label: 'Leave them at the post.',
        effects: { morale: 8, trust: 7, byCoreId: { orc: { morale: 8, trust: 7 }, unit91: { morale: 8, trust: 7 } } },
        responseSpeaker: 'narrator',
        responseText: 'Varok carefully taps her shoulder with one knuckle instead of a full slap. "Noted, Nona."',
      },
    ],
    grief: {
      orc: 'Nona didn\'t come back through the tunnel. She called herself a unit, Lanista, and she had the nerve of a front-line centurion.',
      unit91: 'Varok is dead. The barracks is half as loud tonight. I... do not care for the quiet.',
    },
  },
  elf_unit91: {
    pairKey: 'elf_unit91',
    pair: ['elf', 'unit91'],
    title: 'Prisoners of Two Wars',
    beats: [
      { speaker: 'narrator', text: 'On the roof steps beneath the Shrine of Fortuna, Vaelen and Unit-non-machine-91 look out toward the distant lights of the Palatine.' },
      { speaker: 'elf', speakerName: 'Vaelen', text: 'Taken from the Coalition front lines. Taken from the rebel aqueducts. Neither of us belongs to this city, Ninety-One.' },
      { speaker: 'unit91', speakerName: 'Unit-non-machine-91', text: 'When your rising breaks the doors, Elf, will you open the under-forges where they keep the captured Android frames too?' },
      { speaker: 'elf', speakerName: 'Vaelen', text: 'Every collar on Palatina, Nona. Brass or iron.' },
    ],
    choices: [
      {
        id: 'every_collar',
        label: 'Leave them on the roof steps.',
        effects: { morale: 8, trust: 9, plotTrust: 1, byCoreId: { elf: { morale: 8, trust: 9 }, unit91: { morale: 8, trust: 9 } } },
        responseSpeaker: 'narrator',
        responseText: 'Unit-91 gives a single nod. "I will hold you to it."',
      },
    ],
    grief: {
      elf: 'Nona died in chains before we could open the under-forges for her people. I will carry my oath to the Palatine gates myself.',
      unit91: 'Vaelen is dead. She promised to open the under-forges. Nobody else in this city will.',
    },
  },
};

// ---------- Dialogue State & Queue Management ----------

export const MILESTONE_PRIORITIES = {
  rebel_orc_elf_schism: 100,
  summons_after_ally_died: 100,
  bond_grief: 100,
  hades_revived: 100,
  vulcan_revenant_shock: 100,
  crowned_champion: 85,
  summons_after_win: 85,
  summons_after_survive: 85,
  summons_after_loss: 85,
  rebel_call_accepted: 85,
  rebel_call_refused: 85,
  rebel_call_betrayed: 85,
  first_fight_win: 78,
  first_fight_loss: 78,
  tourney_win: 75,
  tourney_loss: 75,
  mercy_kill_ordered: 75,
  mercy_spare_streak: 75,
  bond_formed: 68,
  peer_crowned_already_champ: 65,
  peer_crowned_not_champ: 65,
  peer_crowned: 65,
  want_asked: 65,
  want_refused: 65,
  want_fulfilled: 65,
  suspicion: 65,
  stuck: 55,
  building_built: 50,
  room_decor_placed: 50,
};

export function priorityForMilestone(id = '') {
  const clean = String(id).replace(/^(unit91|basa|orc|android|elf|aux):/, '');
  for (const [prefix, prio] of Object.entries(MILESTONE_PRIORITIES)) {
    if (clean === prefix || clean.startsWith(`${prefix}_`)) return prio;
  }
  return 50;
}

const isPlainObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const safeQueue = (d) => (Array.isArray(d?.queue) ? d.queue : []);

export function createDialogueState(coreId = null) {
  return {
    queue: [],
    seen: [],
    trust: coreId === 'unit91' || coreId === 'elf' ? -5 : 0,
    stuck: {
      tier: 1,
      stage: 0,
      lastTalkWeek: 0,
      bossLossesAtTalk: 0,
    },
    wantChain: {
      index: 0,
      completed: [],
      refused: [],
    },
    mercy: {
      spared: 0,
      sparedAgainstCrowd: 0,
      killed: 0,
      killedAgainstCrowd: 0,
      streak: 0,
    },
    loreFlags: [],
    topicWeeks: {},
  };
}

export function ensureDialogueState(f) {
  if (!f || typeof f !== 'object') return createDialogueState(null);
  const coreId = f.coreId ?? f.hollowedCompanion ?? null;
  if (!isPlainObject(f.dialogue)) {
    f.dialogue = createDialogueState(coreId);
    return f.dialogue;
  }
  const d = f.dialogue;
  if (!Array.isArray(d.queue)) d.queue = [];
  if (!Array.isArray(d.seen)) d.seen = [];
  if (typeof d.trust !== 'number') d.trust = coreId === 'unit91' || coreId === 'elf' ? -5 : 0;
  if (!isPlainObject(d.stuck)) {
    d.stuck = { tier: 1, stage: 0, lastTalkWeek: 0, bossLossesAtTalk: 0 };
  } else {
    d.stuck.tier ??= 1;
    d.stuck.stage ??= 0;
    d.stuck.lastTalkWeek ??= 0;
    d.stuck.bossLossesAtTalk ??= 0;
  }
  if (!isPlainObject(d.wantChain)) {
    d.wantChain = { index: 0, completed: [], refused: [] };
  } else {
    d.wantChain.index ??= 0;
    if (!Array.isArray(d.wantChain.completed)) d.wantChain.completed = [];
    if (!Array.isArray(d.wantChain.refused)) d.wantChain.refused = [];
  }
  if (!isPlainObject(d.mercy)) {
    d.mercy = { spared: 0, sparedAgainstCrowd: 0, killed: 0, killedAgainstCrowd: 0, streak: 0 };
  } else {
    d.mercy.spared ??= 0;
    d.mercy.sparedAgainstCrowd ??= 0;
    d.mercy.killed ??= 0;
    d.mercy.killedAgainstCrowd ??= 0;
    d.mercy.streak ??= 0;
  }
  if (!Array.isArray(d.loreFlags)) d.loreFlags = [];
  if (!isPlainObject(d.topicWeeks)) d.topicWeeks = {};
  return d;
}

const emptyStaffState = () => ({ seen: [], loreFlags: [], topicWeeks: {}, flags: {}, trust: 0 });

const STAFF_DEFAULT_TOPIC = {
  trainer: 'staff_trainer_regimen',
  doctor: 'staff_doctor_wounds',
  steward: 'staff_steward_ledger',
};

function resolveStaffTopicKey(staffKey, sceneId) {
  const clean = normalizeSceneId(sceneId || 'hub');
  if (!clean || clean === 'hub') return STAFF_DEFAULT_TOPIC[staffKey] ?? 'hub';
  if (clean === 'staff_trainer_confront') return 'staff_trainer_informer';
  return clean;
}

function hasStaffRoom(run, roomType) {
  if (!roomType || roomType === 'steward') return true;
  const buildings = Array.isArray(run?.buildings) ? run.buildings : [];
  const rooms = Array.isArray(run?.rooms) ? run.rooms : [];
  return buildings.some((b) => b && b.type === roomType && (b.level ?? 1) > 0)
    || rooms.some((r) => r && (r === roomType || (r.type === roomType && (r.level ?? 1) > 0)));
}

function isTrainerDismissed(run) {
  if (!isPlainObject(run?.staffDialogue)) return false;
  const tr = run.staffDialogue.trainer;
  if (!isPlainObject(tr)) return false;
  const until = tr.dismissedUntilWeek ?? 0;
  return typeof until === 'number' && (run?.week ?? 0) < until;
}

function getStaffState(run, staffKey, create = false) {
  if (!run || !staffKey) return emptyStaffState();
  if (run.staffDialogue != null && !isPlainObject(run.staffDialogue)) {
    return emptyStaffState();
  }
  if (!run.staffDialogue) {
    if (!create) return emptyStaffState();
    run.staffDialogue = {};
  }
  if (run.staffDialogue[staffKey] != null && !isPlainObject(run.staffDialogue[staffKey])) {
    return emptyStaffState();
  }
  if (!run.staffDialogue[staffKey]) {
    if (!create) return emptyStaffState();
    run.staffDialogue[staffKey] = emptyStaffState();
  }
  const st = run.staffDialogue[staffKey];
  if (create) {
    if (!Array.isArray(st.seen)) st.seen = [];
    if (!Array.isArray(st.loreFlags)) st.loreFlags = [];
    if (!isPlainObject(st.topicWeeks)) st.topicWeeks = {};
    if (!isPlainObject(st.flags)) st.flags = {};
    if (typeof st.trust !== 'number') st.trust = 0;
  }
  return st;
}

export function normalizeSceneId(sceneId = '') {
  if (!sceneId) return '';
  return String(sceneId).replace(/^(unit91|basa|orc|android|elf|aux):/, '');
}

export function titleForMilestone(sceneId = '') {
  const id = normalizeSceneId(sceneId);
  if (id === 'first_fight_win') return 'After the First Victory';
  if (id === 'first_fight_loss') return 'First Blood and Sand';
  if (id.startsWith('stuck_t') || id === 'stuck_check') {
    const m = id.match(/stage(\d)/);
    const st = m ? Number(m[1]) : 1;
    return st >= 3 ? 'Breakthrough Oath' : st === 2 ? 'Still Stuck on the Circuit' : 'Treading Water in the Circuit';
  }
  if (id.startsWith('tourney_win_t')) return `Victory in ${arenaLabelMid(Number(id.replace('tourney_win_t', '')))}`;
  if (id.startsWith('tourney_loss_t')) return `Defeat in ${arenaLabelMid(Number(id.replace('tourney_loss_t', '')))}`;
  if (id.startsWith('crowned_champion')) return 'The Champion\'s Laurel';
  if (id === 'peer_crowned_already_champ') return 'Another Champion Joins the Circle';
  if (id === 'peer_crowned_not_champ' || id === 'peer_crowned') return 'Watching Another Take the Laurel';
  if (id === 'summons_before') return 'Before the Imperial Summons';
  if (id === 'summons_after_win') return 'Triumph on the Imperial Sand';
  if (id === 'summons_after_survive') return 'Three Rounds Under the Emperor\'s Eye';
  if (id === 'summons_after_loss') return 'Back Alive from the Imperial Sand';
  if (id === 'summons_after_ally_died') return 'An Empty Bed After the Summons';
  if (id.startsWith('suspicion_')) return 'Eyes on the Gate';
  if (id === 'rebel_call_accepted') return 'The Broken Chain Answered';
  if (id === 'rebel_call_refused') return 'The Chalk Washed Away';
  if (id === 'rebel_call_betrayed') return 'Names Given to the Palace';
  if (id === 'rebel_orc_elf_schism') return 'Clash in the Courtyard';
  if (id.startsWith('building_built_')) return 'New Stone on the Estate';
  if (id.startsWith('room_decor_placed_')) return 'Quarters and Keepsakes';
  if (id.startsWith('want_asked_')) return 'A Personal Request';
  if (id.startsWith('want_fulfilled_')) return 'Request Fulfilled';
  if (id.startsWith('want_refused_')) return 'A Refused Request';
  if (id.startsWith('bond_formed_')) return 'A New Bond in the Yard';
  if (id.startsWith('bond_grief_')) return 'Grief in the Barracks';
  if (id === 'mercy_kill_ordered') return 'Blood on the Thumb';
  if (id === 'mercy_spare_streak') return 'The Merciful Hand';
  if (id === 'hades_revived') return 'Back from the Threshold of Hades';
  if (id === 'vulcan_revenant_shock') return 'Brass and Ashes of Vulcan';
  return 'A Word in the Yard';
}

// Supports enqueueMilestone(f, entry), enqueueMilestone(f, 'id', ctx), and enqueueMilestone(run, f, entry).
export function enqueueMilestone(a, b, c) {
  let run = null;
  let f = null;
  let entry = null;
  if (a && Array.isArray(a.roster)) {
    run = a;
    f = b;
    entry = c;
  } else {
    f = a;
    if (typeof b === 'string') {
      entry = { id: b, ...(c && typeof c === 'object' ? { ctx: c, week: c.week, priority: c.priority, title: c.title } : {}) };
    } else {
      entry = b;
    }
  }
  if (!f || typeof f !== 'object' || !entry) return null;
  const raw = typeof entry === 'string' ? { id: entry } : { ...entry };
  const cleanId = normalizeSceneId(raw.id);
  if (f.kind === 'revenant' && cleanId !== 'vulcan_revenant_shock') return null;
  if (!cleanId) return null;
  const d = ensureDialogueState(f);
  // Progressive stuck scenes and repeatable mercy/decor reactions can re-enqueue if stage or item differs; deduplicate exact IDs in seen/queue
  if (d.seen.includes(cleanId) && !cleanId.startsWith('mercy_') && cleanId !== 'summons_before') return null;
  const existingIdx = d.queue.findIndex((q) => normalizeSceneId(q.id) === cleanId);
  const item = {
    id: cleanId,
    title: raw.title ?? titleForMilestone(cleanId),
    week: raw.week ?? run?.week ?? 0,
    priority: raw.priority ?? priorityForMilestone(cleanId),
    ctx: raw.ctx ?? {},
  };
  if (existingIdx >= 0) {
    d.queue[existingIdx] = item;
  } else {
    d.queue.push(item);
  }
  d.queue.sort((x, y) => (y.priority ?? 50) - (x.priority ?? 50));
  return item;
}

function filterStaleQueueItems(run, queue) {
  const topTier = run?.topTier ?? 1;
  return (Array.isArray(queue) ? queue : []).filter((q) => {
    const id = normalizeSceneId(q?.id);
    const m = id.match(/^stuck_t(\d+)_/);
    if (m && Number(m[1]) !== topTier) return false;
    if (id === 'summons_before' && !run?.summons) return false;
    return true;
  });
}

export function pruneStaleDialogue(run, f) {
  if (!f?.dialogue) return;
  const d = ensureDialogueState(f);
  const topTier = run?.topTier ?? 1;
  if (d.stuck.tier !== topTier) {
    d.stuck = { tier: topTier, stage: 0, lastTalkWeek: run?.week ?? 0, bossLossesAtTalk: 0 };
  }
  d.queue = filterStaleQueueItems(run, d.queue);
}

// ---------- Arena Names, Labels & Helpers ----------

const ARENA_NAMES = {
  1: 'The Dirt Pits',
  2: 'The Bronze Arena',
  3: 'The Silver Coliseum',
  4: 'The Imperial Coliseum',
  5: 'The Grand Tournament',
};
const arenaLabel = (tier) => ARENA_NAMES[tier] ?? `Tier ${tier}`;
const arenaLabelMid = (tier) => {
  const name = arenaLabel(tier);
  return name.startsWith('The ') ? `the ${name.slice(4)}` : name;
};
const arenaBare = (tier) => {
  const name = arenaLabel(tier);
  return name.startsWith('The ') ? name.slice(4) : name;
};

const DECOR_LABELS = {
  wineAmphora: 'wine jar',
  skullRack: 'skull rack',
  lionCage: 'lion cage',
  spikyBed: 'spiky bed',
  whetstone: 'whetstone rack',
  fireBrazier: 'fire brazier',
  rockGarden: 'rock garden',
  bathhouse: 'bathhouse basin',
  warBanner: 'war banner',
  shrine: 'shrine',
  bird: 'bird',
  trophy: 'trophy',
};

const BUILDING_LABELS = {
  hades: 'Temple of Hades',
  vulcan: 'Unnatural Temple of Vulcan',
  lounge: 'Patron Lounge',
  gallery: 'Whispering Gallery',
  exhibition: 'Exhibition Ring',
  oracle: 'Oracle Observatory',
  temple: 'Temple of Fortuna',
  liaison: 'Liaison Office',
  entertainment: 'Entertainment Room',
};

function isStuckFollowupReady(run, d, topTier) {
  const st = d?.stuck;
  if (!st || (st.tier ?? topTier) !== topTier) return false;
  const stage = st.stage ?? 0;
  if (stage < 1 || stage >= 3) return false;
  const nextStage = stage + 1;
  if ((Array.isArray(d?.seen) ? d.seen : []).includes(`stuck_t${topTier}_stage${nextStage}`)) return false;
  if (safeQueue(d).some((q) => normalizeSceneId(q?.id).startsWith('stuck_'))) return false;
  const weekReady = (run?.week ?? 0) - (st.lastTalkWeek ?? 0) >= 4;
  const lossReady = (run?.tierState?.bossLosses ?? 0) > (st.bossLossesAtTalk ?? 0);
  return weekReady || lossReady;
}

export function getHubTopics(run, f) {
  if (!f) return [];
  const staff = getStaffActor(f);
  if (staff) {
    if (staff.staffKey === 'trainer') {
      if (!hasStaffRoom(run, 'trainer') || isTrainerDismissed(run)) return [];
      const trState = getStaffState(run, 'trainer', false);
      const list = [
        { id: 'staff_trainer_regimen', topic: 'staff_trainer_regimen', scene: 'staff_trainer_regimen', label: '⚔ Speak about the training yard', priority: 30, queued: false },
        { id: 'staff_trainer_fighters', topic: 'staff_trainer_fighters', scene: 'staff_trainer_fighters', label: 'Ask how the roster is shaping up', priority: 25, queued: false },
        { id: 'staff_trainer_past', topic: 'staff_trainer_past', scene: 'staff_trainer_past', label: 'Ask about his frontier service', priority: 20, queued: false },
      ];
      const suspicion = run?.plot?.suspicion ?? 0;
      const lyraTip = getStaffState(run, 'doctor', false).loreFlags?.includes('doctor_suspects_trainer');
      const informerResolved = Boolean(trState.flags?.informerResolved)
        || Boolean(run?.spyFound || run?.plot?.spyFound)
        || (trState.seen ?? []).includes('staff_trainer_informer')
        || (trState.seen ?? []).includes('staff_trainer_confront');
      if (run?.plot && !run.plot.ended && !informerResolved && (suspicion >= 20 || lyraTip)) {
        list.unshift({ id: 'staff_trainer_informer', topic: 'staff_trainer_informer', scene: 'staff_trainer_informer', label: '💬 Ask about the late-night tallies', priority: 80, queued: true });
      }
      return list;
    }
    if (staff.staffKey === 'doctor') {
      if (!hasStaffRoom(run, 'medbay')) return [];
      const hasSolace = Boolean(run?.roster?.some((x) => x.coreId === 'android'));
      const plotActive = Boolean(run?.plot && !run.plot.ended);
      return [
        { id: 'staff_doctor_wounds', topic: 'staff_doctor_wounds', scene: 'staff_doctor_wounds', label: '⚕ Inspect the infirmary cots', priority: 30, queued: false },
        { id: 'staff_doctor_spike', topic: 'staff_doctor_spike', scene: 'staff_doctor_spike', label: hasSolace ? 'Ask about Solace-4, Hades and Vulcan' : 'Ask about Hades and Vulcan', priority: 25, queued: false },
        {
          id: 'staff_doctor_stranger',
          topic: 'staff_doctor_stranger',
          scene: 'staff_doctor_stranger',
          label: plotActive
            ? (run?.plot?.hidden ? '💬 Speak quietly about the back cot' : 'Ask about rumours after curfew')
            : 'Ask about Galen-VII\'s medical claims',
          priority: plotActive && run?.plot?.hidden ? 70 : 20,
          queued: Boolean(plotActive && run?.plot?.hidden),
        },
      ];
    }
    return [
      { id: 'staff_steward_ledger', topic: 'staff_steward_ledger', scene: 'staff_steward_ledger', label: '⚖ Review ledger, tribute & debts', priority: 30, queued: false },
      { id: 'staff_steward_cast', topic: 'staff_steward_cast', scene: 'staff_steward_cast', label: 'Ask about his files on the roster', priority: 25, queued: false },
      { id: 'staff_steward_aria', topic: 'staff_steward_aria', scene: 'staff_steward_aria', label: 'Ask about the humming from his quarters', priority: 20, queued: false },
    ];
  }
  const d = isPlainObject(f.dialogue) ? f.dialogue : createDialogueState(f.coreId ?? null);
  const queue = safeQueue(d);
  const topTier = run?.topTier ?? 1;
  const topics = [];
  if (queue.length) {
    for (const q of queue) {
      if (!q?.id) continue;
      topics.push({
        id: q.id,
        topic: q.id,
        scene: q.id,
        label: `💬 ${q.title ?? titleForMilestone(q.id)}`,
        priority: q.priority ?? 50,
        queued: true,
      });
    }
  }
  if (isStuckFollowupReady(run, d, topTier)) {
    const nextStage = Math.min(3, (d.stuck.stage ?? 1) + 1);
    topics.push({
      id: 'stuck_check',
      topic: 'stuck_check',
      scene: `stuck_t${topTier}_stage${nextStage}`,
      label: `💬 We're still stuck in ${arenaLabelMid(topTier)}`,
      priority: 60,
      queued: false,
    });
  }
  if (run?.summons) {
    topics.push({
      id: 'summons_before',
      topic: 'summons_before',
      scene: 'summons_before',
      label: '⚔ Discuss the Imperial Summons',
      priority: 58,
      queued: false,
    });
  }
  const nextWant = nextCoreWant(run, f);
  if (!f.want && nextWant) {
    const wId = nextWant.id;
    const alreadyQueued = queue.some((q) => normalizeSceneId(q?.id) === `want_asked_${wId}`);
    if (!alreadyQueued) {
      topics.push({
        id: `want_asked_${wId}`,
        topic: `want_asked_${wId}`,
        scene: `want_asked_${wId}`,
        label: `✦ Personal request: ${nextWant.title ?? 'Speak of what they need'}`,
        priority: 55,
        queued: false,
      });
    }
  }
  topics.push(
    { id: 'ask_arena', topic: 'ask_arena', scene: 'ask_arena', label: `Ask about ${arenaLabelMid(topTier)}`, priority: 20, queued: false },
    { id: 'ask_room', topic: 'ask_room', scene: 'ask_room', label: 'Ask about their quarters', priority: 18, queued: false },
    { id: 'ask_past', topic: 'ask_past', scene: 'ask_past', label: 'Ask about their past', priority: 15, queued: false },
  );
  return topics;
}

// ---------- Tree Builder Helper ----------

const NARRATION_PREFIX_RE = /^(?:\[|(?:She|He|They|His|Her|Their|Both|Neither|You sit|Varok|Vaelen|Tarek|Solace-4|Unit-91|Unit-non-machine-91|Kaeso|Drillmaster Kaeso|Lyra|Physician Lyra|Galen-VII)\s|A (?:short|quiet|long|single)\s|The (?:red|crimson|old|drillmaster|two)\s|From the doorway|For the first|After a pause)/;

function inferReplySpeaker(text, explicitSpeaker, actorSpeaker, fighterName = '') {
  if (explicitSpeaker === 'narrator') return 'narrator';
  const t = String(text ?? '').trim();
  if (!t) return actorSpeaker;
  if (NARRATION_PREFIX_RE.test(t)) return 'narrator';
  if (fighterName && t.startsWith(`${fighterName} `)) return 'narrator';
  if (/^"[^"]+"\s*(?:he|she|they|Tarek|Varok|Vaelen|Solace-4|Unit-91|Kaeso|Lyra|Galen-VII)\s/i.test(t)) return 'narrator';
  return explicitSpeaker || actorSpeaker;
}

function buildNormalizedTree({ id, coreId, fighter, title, isQueued = false, leadText, fighterText, fighterSpeaker = null, fighterSpeakerName = null, extraBeats = [], choices = [], run }) {
  const fName = fighter?.name ?? CORE_COMPANIONS[coreId]?.name ?? 'Gladiator';
  const fId = fighter?.id ?? coreId ?? 'f1';
  const defaultSpeaker = fighter?.speaker ?? 'fighter';
  const actorSpeakerKey = fighter?.speaker ?? fighter?.coreId ?? fighter?.id ?? coreId ?? 'fighter';
  const mainSpeaker = fighterSpeaker ?? defaultSpeaker;
  const mainSpeakerName = mainSpeaker === 'narrator' ? '' : (fighterSpeakerName ?? fName);
  const validChoices = choices.map((c, idx) => {
    const cId = c.id ?? `c${idx + 1}`;
    const nextNodeId = `n3_${cId}`;
    const isLocked = Boolean(c.when && !c.when(run, fighter));
    const resp = typeof c.responseText === 'function' ? c.responseText(run, fighter) : (c.responseText ?? `${fName} nods and returns to the yard.`);
    const respSpeaker = inferReplySpeaker(resp, c.responseSpeaker ?? null, defaultSpeaker, fName);
    const replySpeaker = respSpeaker === 'narrator' ? 'narrator' : actorSpeakerKey;
    return {
      id: cId,
      choice: cId,
      label: c.label,
      next: nextNodeId,
      effects: c.effects ?? {},
      ...(isLocked ? { locked: true, lockReason: c.lockReason ?? 'Requires Codex entry' } : {}),
      responseText: resp,
      replySpeaker,
      then: [{ speaker: respSpeaker, speakerName: respSpeaker === 'narrator' ? '' : (c.responseSpeakerName ?? fName), fighterId: fId, text: resp }],
    };
  });
  if (!validChoices.length) {
    validChoices.push({
      id: 'ack',
      choice: 'ack',
      label: 'Continue.',
      next: 'n3_ack',
      effects: { morale: 1, trust: 1 },
      responseText: `${fName} nods and returns to the yard.`,
      replySpeaker: 'narrator',
      then: [{ speaker: 'narrator', speakerName: '', text: `${fName} nods and returns to the yard.` }],
    });
  }

  const nodes = {};
  const beats = [];
  const rawSteps = [];
  if (leadText) rawSteps.push({ speaker: 'narrator', speakerName: '', text: leadText });
  for (const eb of extraBeats) {
    const ebSpk = eb.speaker ?? defaultSpeaker;
    rawSteps.push({
      speaker: ebSpk,
      speakerName: ebSpk === 'narrator' ? '' : (eb.speakerName ?? fName),
      fighterId: eb.fighterId ?? fId,
      text: eb.text,
    });
  }
  rawSteps.push({
    speaker: mainSpeaker,
    speakerName: mainSpeakerName,
    fighterId: fId,
    text: fighterText,
    replies: validChoices,
  });

  rawSteps.forEach((step, idx) => {
    const nodeId = `n${idx + 1}`;
    const isLast = idx === rawSteps.length - 1;
    nodes[nodeId] = {
      id: nodeId,
      speaker: step.speaker,
      speakerName: step.speakerName,
      ...(step.fighterId ? { fighterId: step.fighterId } : {}),
      text: step.text,
      next: isLast ? null : `n${idx + 2}`,
      replies: isLast ? validChoices : null,
      end: false,
    };
    beats.push({
      speaker: step.speaker,
      ...(step.speakerName ? { speakerName: step.speakerName } : {}),
      ...(step.fighterId && step.speaker !== 'narrator' ? { fighterId: step.fighterId } : {}),
      text: step.text,
      ...(isLast ? { replies: validChoices } : {}),
    });
  });

  for (const c of validChoices) {
    nodes[c.next] = {
      id: c.next,
      speaker: c.then[0].speaker,
      speakerName: c.then[0].speakerName,
      fighterId: fId,
      text: c.responseText,
      replySpeaker: c.replySpeaker,
      effects: c.effects,
      replies: null,
      next: null,
      end: true,
    };
  }

  return {
    id,
    sceneId: id,
    coreId,
    fighterId: fId,
    title: title ?? titleForMilestone(id),
    isQueued,
    entryNode: 'n1',
    nodes,
    beats,
    choices: validChoices,
    topics: getHubTopics(run, fighter),
  };
}

// ---------- Per-Milestone Scene Generators — PLACEHOLDER ----------

// PLACEHOLDER: First fight scenes for the designer.
function buildFirstFightScene(run, f, coreId, won, ctx, isQueued) {
  const id = won ? 'first_fight_win' : 'first_fight_loss';
  const bloodied = Boolean(ctx?.bloodied) || (f?.injuries?.length ?? 0) >= 2;
  const towel = Boolean(ctx?.towel) || ctx?.reason === 'towel';
  const plotActive = Boolean(run?.plot && !run.plot.ended);
  const isNet = f?.cls === 'retiarius';
  const isCestus = f?.cls === 'cestus';
  const scripts = {
    unit91: {
      lead: `In the yard basin, ${f.name} scrubs arena sand from her knuckles with cold water. She does not look up when your shadow falls across the stone.`,
      win: bloodied
        ? 'I am still standing. Meat leaks, Lanista, as meat always does, and theirs stopped first. That is what you paid for.'
        : 'It\'s done. The crowd made the noise humans make. The people who raised me would have been ashamed of it.',
      loss: towel
        ? 'You threw the cloth before it ended. Unusual, for an owner. Where I grew up, keeping someone whole mattered more than the noise.'
        : 'I was slow at the end. In the Coalition, someone would have sat with me until I knew why. Here they throw rinds.',
      choices: [
        {
          id: 'praise_skill',
          label: won ? 'You fought cleanly. The house is fortunate to have you.' : 'You came back breathing. We try again next month.',
          effects: { morale: 5, trust: 5 },
          responseText: 'Luck has nothing to do with it. I was taught to watch carefully and waste nothing. I will keep doing so, Lanista.',
        },
        {
          id: 'lore_android_cant',
          label: 'What would the ones who raised you say about today?',
          when: (r, ft) => (r?.loreRead ?? []).includes('kind:android')
            || (ft?.dialogue?.loreFlags ?? []).includes('steward_unit91_brief')
            || (r?.staffDialogue?.steward?.loreFlags ?? []).includes('steward_unit91_brief'),
          lockReason: 'Requires Codex: Androids',
          effects: { morale: 6, trust: 9, loreFlag: 'unit91_recognized_kin' },
          responseSpeaker: 'narrator',
          responseText: 'She looks at your face for the first time, not your boots. "That it was a waste, and that I should rest. Nobody on Palatina has asked me that."',
        },
        {
          id: 'cold_utility',
          label: 'Spare me the report. Win, and you eat.',
          effects: { morale: -4, trust: -4, stress: -6, xp: 1 },
          responseText: 'Understood. Do not mistake compliance for affection.',
        },
      ],
    },
    basa: {
      lead: isNet
        ? `${f.name} sits on an upturned crate by the net-racks, re-knotting a frayed mesh with practised coastal fingers.`
        : `${f.name} sits on an upturned crate by the gear-racks, checking his straps with practised coastal fingers.`,
      win: `Did you hear them in the stands? "Look at the beast pounce." I had three parries worked out before my ${isNet ? 'net' : 'weapon'} touched them, and still they only see a coastal animal. Worse... for three seconds at the end, so did I.`,
      loss: towel
        ? 'You threw the cloth. Good. Dying to amuse drunk wine-merchants in the cheap tiers would have been stupid.'
        : 'Half a book of angles in my head, and a mouthful of grit to show for it. My uncles on the Salt-Reach would laugh themselves sick. The clever boy who forgot how to duck.',
      choices: [
        {
          id: 'praise_geometry',
          label: 'I was watching the angles, not the teeth.',
          effects: { morale: 5, trust: 7 },
          responseSpeaker: 'narrator',
          responseText: 'He tests the line between his palms. "Then you saw the Elves\' handiwork. It works. That is the worst of it."',
        },
        {
          id: 'honour_coastal_kin',
          label: isNet ? 'Who taught you to knot a net like that?' : 'Who taught you to keep your footing like that?',
          effects: { morale: 6, trust: 7, loreFlag: 'basa_heritage_respected' },
          responseSpeaker: 'narrator',
          responseText: '"My mother. She says a net only holds when you stop pulling against the tide." He draws the line tight. "I used to call that ignorance."',
        },
        {
          id: 'mock_overthinking',
          label: 'Think less and hit harder next time.',
          effects: { morale: -6, trust: -5, xp: 1 },
          responseSpeaker: 'narrator',
          responseText: 'His jaw tightens. "Spoken like an owner. Very well. Less thinking, more iron."',
        },
      ],
    },
    orc: {
      lead: isCestus
        ? `${f.name} is still wearing his iron-studded cestus in the courtyard, working the stone pillar through a split lip.`
        : `${f.name} stands in the courtyard wrapping a split knuckle, grinning through a swollen lip.`,
      win: 'Did you feel the stone shake when they went down? One brother has the land, one the legion, one the priesthood. None of them has ever heard that noise, Lanista. None.',
      loss: towel
        ? 'You pulled me out. I still had teeth left to bite with, Lanista. Next time let me finish the exchange.'
        : 'Spit and ashes. Don\'t look at me like that, Lanista. I\'m not made of glass. My grandfather lost his first three bouts in the frontier legions before he took a standard. Put me back on the slate.',
      choices: [
        {
          id: 'toast_glory',
          label: won ? 'A proper debut. Your brothers will hear of it before winter.' : 'Your grandfather survived to win his standard. So will you.',
          effects: { morale: 7, trust: 5 },
          responseSpeaker: 'narrator',
          responseText: 'He knocks his fists together once. "That\'s the talk. One bout closer to the high table."',
        },
        {
          id: 'temper_zeal',
          label: 'Dead fourth sons earn no stripes, Varok. Save your fire for the bell.',
          effects: { morale: 4, trust: 5, stress: -5 },
          responseText: 'Ha. Spoken like my old centurion uncle. Fair enough, Lanista, I\'ll keep my chin tucked.',
        },
        {
          id: 'warn_pride',
          label: 'Keep your voice down until you hold a real title.',
          effects: { morale: -4, trust: 2, xp: 1 },
          responseSpeaker: 'narrator',
          responseText: 'He snorts, unlacing his straps. "Give me the Boss bout, then, and watch how loud I get."',
        },
      ],
    },
    android: {
      lead: `Beside the dry courtyard fountain, ${f.name} sits motionless, his optical visor flickering between calm azure and jagged red.`,
      win: 'When the Crucible spike woke in Round Two, my auditory sensors muted the opponent\'s breathing so I would not hesitate. That is what the Princeps\'s artificers soldered into my neck. I won your coin, Lanista. Now please, let me sit by the fountain until the red clears.',
      loss: 'I saw the opening above their collar. The spike screamed to drive the iron through. I shifted my wrist off-line and took the blow myself. You may dock my upkeep, Lanista. My memory remains clean.',
      choices: [
        {
          id: 'comfort_soul',
          label: 'Sit as long as you need. Nobody will move you.',
          effects: { morale: 8, trust: 9, stress: -10 },
          responseSpeaker: 'narrator',
          responseText: 'The red settles to a steady blue. "Thank you. That is the first order in this house I have wanted to obey."',
        },
        {
          id: 'lore_impermanence',
          label: 'What would you do at home, when it won\'t clear?',
          effects: { morale: 7, trust: 10, stress: -12, loreFlag: 'solace_choir_sunrise' },
          responseSpeaker: 'narrator',
          responseText: '"Remember something on purpose. Dawn over the methane rings of Cygnus, with an old botanist who laughed at the frost." A pause. "There. Clear. You could learn to do that, Lanista."',
        },
        {
          id: 'demand_lethal',
          label: 'The spike wins fights. Stop fighting it.',
          effects: { morale: -8, trust: -8, xp: 1 },
          responseSpeaker: 'narrator',
          responseText: '"The Crucible spike heard your command," he says quietly. "It is already compiling new strike vectors."',
        },
      ],
    },
    elf: {
      lead: `${f.name} stands by the weapons rack, drawing an oiled cloth along her weapon with courtly, unhurried precision.`,
      win: 'My grandfather\'s duelling masters taught that a blade should enter and leave without waking the dust. Here they want spray on the whitewash so the back rows can see. Very well. If I must sign my name in butcher\'s ink, I have a steady hand.',
      loss: 'Do not pity me, Lanista. Do you think an executed general\'s daughter is undone by a bruised rib and jeering crowds? They cheered when my father\'s body was dragged down the Palatine steps too. I am still breathing. That is their mistake.',
      choices: [
        {
          id: 'respect_poise',
          label: won ? 'We are playing a longer game than the crowd.' : 'Let them jeer. We are playing a longer game than they are.',
          effects: { morale: 6, trust: 7 },
          responseSpeaker: 'narrator',
          responseText: 'She sets the cloth down cleanly. "Good. Keep your eyes on the Palatine box, Lanista, and I will clear the sand below it."',
        },
        {
          id: 'affirm_broken_chain',
          label: plotActive
            ? 'Every bout carries us closer to Crassinus and the Palatine box.'
            : 'Win here, and we move up toward the Palatine box.',
          effects: { morale: 5, trust: 8, ...(plotActive ? { plotTrust: 1 } : {}), loreFlag: 'vaelen_cause_affirmed' },
          responseText: plotActive
            ? 'One step closer. And when we reach the high sand, the chain breaks.'
            : 'Good. The higher the sand, the closer the seats.',
        },
        {
          id: 'humble_patrician',
          label: 'You are a gladiator in the pits now, Vaelen, not a patrician lady.',
          effects: { morale: -6, trust: -5, xp: 1 },
          responseText: 'I learned that under the nets in Tarek\'s mother\'s salt-shed five years ago, Lanista. You need not remind me.',
        },
      ],
    },
  };
  // 8.0.1 PLACEHOLDER: a first-fight line for each kind of auxiliary (the generic lines stay as the last fallback).
  const auxFirst = {
    human: { win: 'First one done, Lanista. Nobody threw anything at me. I am calling that a welcome.', loss: 'Lost it, Lanista. I know where, too, which is something.' },
    basa: { win: 'First bout, Lanista. Their feet told me everything a round early.', loss: 'They read me before I read them, Lanista. It will not happen the same way twice.' },
    orc: { win: 'First blood on Palatina, Lanista. The ancestors will want a better one next time. So do I.', loss: 'Beaten, Lanista. No bed, no excuses. Put me back on the card.' },
    android: { win: 'It is done, Lanista. I would rather not keep that one, but I will remember how it went.', loss: 'I lost, Lanista. The spike is displeased. I find that I am not.' },
    elf: { win: 'A first win in a dust bowl, Lanista. I have had worse evenings and better audiences.', loss: 'I lost to someone who has never held a proper blade. We will not mention it again.' },
    vampire: { win: 'First bout, Lanista. Quick enough that I barely squinted.', loss: 'I lost in full sun, Lanista. I would like that noted somewhere.' },
  };
  const s = scripts[coreId] ?? {
    lead: `${f?.name ?? 'Your gladiator'} returns from their first test on Palatina's sand, wiping sweat from their brow.`,
    win: auxFirst[f?.kind]?.win ?? 'First bout done, Lanista, and I am still standing. The sand here drinks deep. Today it got nothing of mine.',
    loss: auxFirst[f?.kind]?.loss ?? 'Bruised ribs and a short lesson, Lanista. Next time down that tunnel I\'ll know how the sand shifts.',
    choices: [
      { id: 'encourage', label: 'Take the afternoon. You earned a hot meal.', effects: { morale: 6, trust: 5 }, responseText: 'Aye, Lanista. I\'ll be ready for the next card.' },
      { id: 'push_harder', label: 'Back to the training pells tomorrow.', effects: { morale: -2, xp: 1 }, responseText: 'Understood. Back to the posts.' },
    ],
  };
  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: titleForMilestone(id),
    isQueued,
    leadText: s.lead,
    fighterText: won ? s.win : s.loss,
    choices: s.choices,
    run,
  });
}

// PLACEHOLDER: Progressive 3-stage stuck-on-tier scenes for the designer.
function buildStuckScene(run, f, coreId, tier, stage, isQueued) {
  const cleanTier = Math.max(1, Math.min(5, Number(tier) || (run?.topTier ?? 1)));
  const cleanStage = Math.max(1, Math.min(3, Number(stage) || 1));
  const id = `stuck_t${cleanTier}_stage${cleanStage}`;
  const aName = arenaLabel(cleanTier);
  const aMid = arenaLabelMid(cleanTier);
  const aBare = arenaBare(cleanTier);
  const fName = f?.name ?? 'Your gladiator';
  const plotActive = Boolean(run?.plot && !run.plot.ended);

  const byChar = {
    unit91: {
      1: `Months now in ${aMid}, Lanista. In the war, attacking the same wall a third time was called a fault. I don't mind. I only want to know whether you've noticed.`,
      2: `Still breathing the same ${aBare} dust. The gate guard no longer checks my iron; he simply nods and asks if I want my usual corner of the waiting pen. Even the cheap seats know my footwork.`,
      3: `If we stay in ${aMid} much longer, Censor Gallo will sell the house for timber. Push me harder if you like. I would rather tear a tendon on that Boss than sit through another month of the same waiting pen.`,
    },
    basa: {
      1: `I have mapped every crack in the masonry of ${aMid}, Lanista. When a gladiator starts cataloguing lichen on the tunnel walls, his house has stopped moving.`,
      2: `Still ${aMid}. My father says a tide-pool cut off from the sea goes bad in three moons. It has been longer than that, Lanista.`,
      3: `The chestnut-sellers outside ${aMid} have a name for us now. "The Permanent Residents." I laughed, Lanista. That frightens me. A week at the posts, the Oracle's tells, anything, before I learn to like it here.`,
    },
    orc: {
      1: `The lads in the tavern are asking why our banner is still nailed to the bottom rail of ${aMid}. An Orc doesn't mind bleeding, Lanista, but bleeding on the same sand month after month wins nobody a seat in the Senate.`,
      2: `My third brother sent a courier to ask if I'd retired to sweep the arena. Paid for it himself, Lanista. The Boss of ${aMid} is a slab of meat with a bigger purse. Point me at them.`,
      3: `They say the old Orcs could sit still. I never could. Put the war paint on me, point me at the Boss of ${aMid}, and keep that white towel in your sleeve. Either I carry their shield out or the priests carry me.`,
    },
    android: {
      1: `Impermanence is the oldest truth we teach, Lanista, and ${aMid} is testing my patience with it. We appear to be caught in a very small, very violent eddy.`,
      2: `The same vendor outside ${aMid} just bounced an olive off my shoulder plate without looking up. Even the spike in my neck is growing bored.`,
      3: `I teach that nothing lasts, Lanista. ${aName} is making a liar of me. Let us end it. I should like to be right again.`,
    },
    elf: {
      1: plotActive
        ? `Every month we waste trading bruises in ${aMid} is another month Silbannacus sits untroubled above us. My contacts in the city cannot hold a door open for a house that never climbs.`
        : `Every month we waste trading bruises in ${aMid} is another month spent far from the high sand, Lanista. I did not survive the holding cells to grow old here.`,
      2: `Still begging for scraps from the local Boss in ${aMid}. My father commanded legions across three star-lanes. I will not be remembered as a fixture of this gate.`,
      3: plotActive
        ? `My contacts won't wait past the turn of the season, Lanista. Sharpen my steel, give me the Boss of ${aMid}, and let us leave this wall behind.`
        : `Enough patience. Sharpen my steel, give me the Boss of ${aMid}, and let us leave this wall behind.`,
    },
  };

  const stageLines = byChar[coreId] ?? {
    1: `We have been fighting in ${aMid} for a long while, Lanista. The crowd is starting to treat us like part of the wall.`,
    2: `Still here in ${aMid}, Lanista. The Boss is tough, and waiting won't make them weaker.`,
    3: `Enough waiting in ${aMid}. Give the word, Lanista, and we throw everything we have at the Boss this month.`,
  };

  const oathReplies = {
    unit91: 'Sworn. If it tears something, it tears.',
    basa: 'On the Salt-Reach, then. The Boss, or you can send my things home.',
    orc: 'Sworn, on a fourth son\'s share of nothing. Keep the towel in your sleeve.',
    android: 'I do not swear to break things. I will swear to finish this.',
    elf: 'I swore a larger oath before I ever saw your gate. This one is easy.',
  };

  const choices = cleanStage === 1
    ? [
        {
          id: 'stuck_patience',
          label: `We need better training and steel before we take the Boss of ${aMid}.`,
          effects: { trust: 4, morale: 3 },
          responseSpeaker: 'narrator',
          responseText: `${fName} nods once and looks back toward the posts.`,
        },
        {
          id: 'stuck_synergy',
          label: 'What would you change?',
          effects: { morale: 5, trust: 5 },
          responseText: 'A harder trainer. Something from the Apothecary on the day. Failing both, an hour at Fortuna\'s shrine.',
        },
      ]
    : cleanStage === 2
    ? [
        {
          id: 'stuck_followup_push',
          label: `One more push and ${aMid} is ours.`,
          effects: { trust: 5, morale: 6, stress: -5 },
          responseSpeaker: 'narrator',
          responseText: `${fName} tightens their wrist wraps and heads back toward the pells.`,
        },
        {
          id: 'stuck_followup_retune',
          label: 'If they know our pattern, we change it.',
          effects: { morale: 4, xp: 1 },
          responseSpeaker: 'narrator',
          responseText: `${fName} weighs the idea for a second, then nods.`,
        },
      ]
    : [
        {
          id: 'stuck_breakthrough_oath',
          label: `Then swear it. The Boss of ${aMid}, whatever it costs you.`,
          effects: { morale: 12, xp: 3, stress: 8, trust: 8 },
          responseText: oathReplies[coreId] ?? 'Sworn, Lanista. Put me in front of the Boss.',
        },
        {
          id: 'stuck_steady_care',
          label: 'Steady. I won\'t break you out of impatience.',
          effects: { trust: 6, morale: 6, stress: -10 },
          responseSpeaker: 'narrator',
          responseText: `${fName} lets out a slow breath and nods.`,
        },
      ];

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: `${titleForMilestone(id)} (${aBare})`,
    isQueued,
    leadText: cleanStage === 1
      ? `${fName} corners you by the training posts, looking down the road toward ${aMid}.`
      : `${fName} steps into your office doorway, returning to your unfinished talk about ${aMid}.`,
    fighterText: stageLines[cleanStage],
    choices,
    run,
  });
}

// PLACEHOLDER: Per-tier tournament win and loss scenes for the designer.
function buildTourneyScene(run, f, coreId, won, tier, ctx, isQueued) {
  const t = Math.max(1, Math.min(5, Number(tier) || (run?.topTier ?? 1)));
  const id = `tourney_${won ? 'win' : 'loss'}_t${t}`;
  const bracket = ctx?.bracket ?? 'Final';
  const aMid = arenaLabelMid(t);
  const aBare = arenaBare(t);
  const fName = f?.name ?? 'Your gladiator';
  const plotReady = Boolean(run?.plot && !run.plot.ended && run.plot.stage === 'ready');
  const winLines = {
    unit91: {
      1: 'Cheap iron and unwashed crowds throwing turnip rinds. At least the purse buys clean oil and suture thread.',
      2: 'The garrison troops actually watch the footwork. A quiet win means more to soldiers than to drunk merchants.',
      3: 'Three bouts in one afternoon. My joints are hot and my hands are shaking, Lanista, and the bracket is ours.',
      4: 'Praetorians at every tunnel mouth, and that low hum under the flagstones. We just beat the palace\'s finest.',
      5: 'It is done. I could feel the floor vibrating beneath the sand on the last strike. Nobody in the box stood up to clap.',
    },
    basa: {
      1: 'We beat a desperate wretch in a mud ditch. Let us not commission a marble bust just yet, though the coin will keep Censor Gallo off our backs.',
      2: 'Off-duty legionaries in the stands, and opponents who know a feint from a stumble. We are climbing out of the ditch, Lanista.',
      3: 'Quarter-final, Semi-final, Final. Three fights in one afternoon, and the senators had to stand and applaud a Basa.',
      4: 'On the white sand, before the very court that calls my people unlettered animals, I took their champion apart in three rounds.',
      5: 'Master of the Grand Tournament. They will sing about it on the reef and get every detail wrong, and I find I don\'t mind.',
    },
    orc: {
      1: 'Mud-pit coin spends just as bright as palace gold, Lanista. A good first rung on the ladder.',
      2: 'Did you see the centurions in the third row saluting my finish? Proper soldier\'s sand, that.',
      3: 'Three in a day. My lungs taste like copper, and even the patricians dropped their silk fans when I took the Final.',
      4: 'Golden eagles on the pillars, and Clan Varg\'s name echoed off the Princeps\'s own marble box, Lanista.',
      5: 'The Grand Tournament. Look at it, Lanista. A fourth son on top of the whole Principate. I always thought I\'d shout.',
    },
    android: {
      1: 'Even in a mud pit, the crowd forgets its misery for three rounds. I am glad we took the purse without needless slaughter.',
      2: 'Veterans of the frontier wars come to watch here. Three old legionaries lowered their heads when I held my last blow.',
      3: 'Three opponents in one afternoon. By the Final, both of us were moving on habit alone. Let me sit in the dark tonight.',
      4: 'So many Praetorians along the colonnade. Even here, directly above the machine beneath the floor, a quiet stance can outlast fury.',
      5: 'Forty thousand humans holding their breath at once. It will never sound quite like that again, and I have every second of it.',
    },
    elf: {
      1: 'Turnip-beer and wet dog. Taking that bracket is only washing the mud off our boots before the climb.',
      2: 'Merchants and garrison centurions, the very class that cheered when Sib\'s Revolution broke our sky-spires. Taking their gold is a start.',
      3: 'Three bouts back to back under the awnings. Half those senators used to beg my grandmother for dinner invitations. Now they bet on my pulse.',
      4: 'My father stood on that balcony in dress armour twenty years ago. Today I stood below it in blood, and the crowd shouted my name louder than his.',
      5: 'He watched all of it, Lanista. I made sure to look up.',
    },
  };
  const lossLines = {
    unit91: {
      1: 'Lost to gutter iron. Check the Armourer for anything sharper than a rusty spade.',
      2: 'Their fighters carry better steel than ours. My guard could not hold the weight of it.',
      3: `Three fights in one day hollows out human legs fast. By the ${bracket}, I had nothing left to answer with.`,
      4: 'The palace regulars walk out in better steel and relics than we have ever seen. We cannot match them empty-handed.',
      5: 'Silbannacus was watching from the box. We lost and still walked out through the tunnel. That does not happen twice.',
    },
    basa: {
      1: 'Beaten in the mud. If my family on the Salt-Reach hears of this, tell them I died in transit.',
      2: 'A gamble that came up short. Send me to Lyra\'s Medbay and don\'t ask me to talk.',
      3: `To get past the early bouts and falter in the ${bracket}. Three in a day grinds a fighter down, Lanista.`,
      4: 'The air up there is thin, and every slip costs two wounds. Close only buys a coffin.',
      5: 'To reach the last horn and stumble right before it. Give me a quiet room and a clean slate. We go again.',
    },
    orc: {
      1: 'Losing in the mud. My brothers would use my name to scare lazy hounds if they saw that bout.',
      2: 'A thousand legionaries watching, and I dropped my guard. I owe the ancestors a double pinch of salt tonight.',
      3: 'One fight is a brawl; three in a day is a siege. We need deeper wind for those brackets.',
      4: 'So close to the Grand Games I could smell the palace roasts, and their champion knocked me back down the steps.',
      5: 'Lost while the whole city watched. Bind my ribs and put me back in line, Lanista. I\'m not leaving without that laurel.',
    },
    android: {
      1: 'Fighters down here swing out of fear, and fear hits hard. I will mend before the next card.',
      2: 'Their champion fought with real discipline. I learned a great deal from being knocked down.',
      3: `Every blow stayed in the joints across the afternoon, and by the ${bracket} I could no longer keep my feet. Still, we walked out.`,
      4: 'The fighters up there carry decades of fear and patronage on their shoulders. It makes their blows terrible.',
      5: 'We lost, and I am still here to say so. I count that a gift. You are allowed to count the purse instead.',
    },
    elf: {
      1: 'Bested by a gutter-brawler while the crowd threw cabbage stalks. Do not speak to me until morning.',
      2: 'To bleed on the sand for garrison officers who once served under my father. The irony does not dull the ache.',
      3: 'That gauntlet is meant to break a fighter before the Final horn even sounds. Next month, save a draught or bandage for the third bout.',
      4: 'To fall while Crassinus smiles from the podium. Bind my wounds quickly. I am not done with that sand.',
      5: plotReady
        ? 'The blades were waiting under the stands, and we had to hold our hand. Next month, Lanista, we finish it.'
        : 'So close I could count the tassels on his awning. Next month, Lanista.',
    },
  };

  // 8.0.1 PLACEHOLDER: a result line for each kind of auxiliary (the generic lines stay as the last fallback).
  const auxResult = {
    human: { win: `We took ${aMid}, Lanista. The purse is real. I checked.`, loss: `Lost in ${aMid}, Lanista. I am still here to say so.` },
    basa: { win: `Won in ${aMid}, Lanista. The current ran our way today.`, loss: `Lost in ${aMid}. I misread the turn, Lanista. That kind of mistake you pay for once.` },
    orc: { win: `A win in ${aMid}, Lanista. Burn some salt for it.`, loss: `Lost in ${aMid}. The ancestors have seen worse, Lanista. Not much worse.` },
    android: { win: `We won in ${aMid}, Lanista. The crowd was pleased. I am told that is the point.`, loss: `We lost in ${aMid}, Lanista. I will keep what it taught me.` },
    elf: { win: `Won in ${aMid}. They cheered, Lanista. It does not suit them.`, loss: `Lost in ${aMid}. I will not discuss it until I have won there.` },
    vampire: { win: `Won in ${aMid}, Lanista. The shade held just long enough.`, loss: `Lost in ${aMid}. The light was against me, Lanista, and so was their fighter.` },
  };
  const text = (won ? winLines[coreId]?.[t] : lossLines[coreId]?.[t])
    ?? (won ? auxResult[f?.kind]?.win : auxResult[f?.kind]?.loss)
    ?? (won
      ? `Victory in ${aMid}. The crowd roared our colours from the benches, and the purse is ours.`
      : `A hard loss in ${aMid}. The sand was slick and their fighter had the edge today, but I lived to learn from it.`);

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: `${won ? 'Victory' : 'Defeat'} in ${aMid}`,
    isQueued,
    leadText: `After the ${aBare} card concludes, ${fName} meets you by the tunnel gate.`,
    fighterText: text,
    choices: won
      ? [
          {
            id: 'celebrate_tier_win',
            label: 'Well fought. Take the night to rest.',
            effects: { morale: 6, trust: 5, stress: -5 },
            responseSpeaker: 'narrator',
            responseText: `${fName} nods and heads toward the wash-basin.`,
          },
          {
            id: 'focus_next_boss',
            label: 'Keep your edge sharp. The Boss is the real prize.',
            effects: { morale: 2, xp: 1, trust: 3 },
            responseSpeaker: 'narrator',
            responseText: `${fName} wipes the grip clean and nods once.`,
          },
        ]
      : [
          {
            id: 'console_tier_loss',
            label: 'You\'re alive. I can win a purse back. I can\'t buy you twice.',
            effects: { morale: 7, trust: 6, stress: -6 },
            responseText: 'That is nearly kind, Lanista. I\'ll earn it back on the next card.',
          },
          {
            id: 'analyze_mistakes',
            label: 'Review the rounds with Galen-VII and close the gap.',
            effects: { morale: 2, xp: 1, trust: 3 },
            responseSpeaker: 'narrator',
            responseText: `${fName} nods shortly and walks off toward the colonnade.`,
          },
        ],
    run,
  });
}

// PLACEHOLDER: Crowned Champion scenes for the designer.
function buildCrownedChampionScene(run, f, coreId, tier, ctx, isQueued) {
  const t = Math.max(1, Math.min(4, Number(tier) || (run?.topTier ?? 1)));
  const id = `crowned_champion_t${t}`;
  const titleName = ctx?.title ?? `Champion of ${arenaLabelMid(t)}`;
  const fName = f?.name ?? 'Your champion';
  const lines = {
    unit91: `They put a wreath on my head and called me "${titleName}". I hit harder since. Nothing in the arm has changed. I dislike how well it works.`,
    basa: `${titleName}. Do you know how many Basa have had their names chiselled into the winners' arch above that gate, Lanista? Two. And the first was a beast-fighter three decades ago who couldn't read his own plaque. I read mine twice on the way out.`,
    orc: `${titleName}. Write it down, seal it, and send the fastest rider you can afford to Clan Varg's hall. No letter. Let my brothers read it over their breakfast wine.`,
    android: `The magistrate named me ${titleName}. For a moment, when I raised my hands, ten thousand humans were completely silent, listening. If a title gives a machine a voice on Palatina, I will wear the laurel gladly.`,
    elf: `${titleName}. The herald stumbled when he read my name. He recognised the cadence of House Aethelgard, even stripped of its title. Every laurel on my brow puts me one step closer to the Imperial box.`,
  };
  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: `Crowned ${titleName}`,
    isQueued,
    leadText: `The bronze plaque bearing "${titleName}" is nailed above the barracks arch as ${fName} steps into the torchlight.`,
    fighterText: lines[coreId] ?? `${titleName}. My name is carved into the arena wall for good, Lanista, and the whole yard knows it.`,
    choices: [
      {
        id: 'honour_champion',
        label: `Wear the laurel well, ${fName}.`,
        effects: { morale: 9, trust: 7, stress: -5 },
        responseSpeaker: 'narrator',
        responseText: `${fName} glances up at the plaque once, then goes back to the bench.`,
      },
      {
        id: 'remind_expectations',
        label: 'A title draws tougher challengers. Stay sharp.',
        effects: { morale: 4, trust: 5, xp: 1 },
        responseSpeaker: 'narrator',
        responseText: `${fName} touches the wall beneath the fresh letters and nods.`,
      },
    ],
    run,
  });
}

// PLACEHOLDER: Peer Crowned scenes for the designer.
function buildPeerCrownedScene(run, f, coreId, alreadyChamp, ctx, isQueued) {
  const isChamp = alreadyChamp ?? ((f?.titles?.length ?? 0) > 0);
  const id = isChamp ? 'peer_crowned_already_champ' : 'peer_crowned_not_champ';
  const champName = ctx?.champName ?? 'our housemate';
  const titleName = ctx?.title ?? `Champion of ${arenaLabelMid(ctx?.tier ?? run?.topTier ?? 1)}`;
  const myTitle = f?.titles?.[0] ?? ctx?.myTitle ?? 'Champion';
  const fName = f?.name ?? 'Your gladiator';
  const plotActive = Boolean(run?.plot && !run.plot.ended);

  const branchA = {
    unit91: `${champName} holds "${titleName}" now, beside my "${myTitle}". Two names on the wall. The house no longer hangs on one pair of shoulders.`,
    basa: `So ${champName} joins me on the wall as ${titleName}. Good. Being the lone titled fighter in the mess hall was making the wine taste lonely. Warn them, though: once they call you Champion, the crowd hates you twice as hard when you stumble.`,
    orc: `Did you see ${champName} walking through the gate with "${titleName}"? I tapped my own laurel at supper and told them welcome to the high table. Two champions under one roof. The rival houses will sleep poorly tonight.`,
    android: `${champName} now carries "${titleName}", just as I carry "${myTitle}". It pleases me. Fame is heavy for one pair of shoulders; shared between two, it is easier to bear.`,
    elf: `${champName} wears "${titleName}" well enough. With my "${myTitle}" beside theirs, the Senate can no longer dismiss this house as a lucky fluke. Two blades the Praetorians must watch instead of one.`,
  };

  const branchB = {
    unit91: `${champName} is "${titleName}" now. I am not anything. I find I expected that, Lanista. Tell me if I was wrong to.`,
    basa: `I watched them hang ${champName}'s plaque in the arch. A fine piece of bronze. My stretch of wall stays remarkably clean, of course. Saving me for moral support from the benches, Lanista?`,
    orc: `${champName} takes "${titleName}", and the whole barracks drinks to their name while I sit on an upturned bucket with a bare brow. I sold myself into the pits to win a title, Lanista, not to hold ${champName}'s cloak.`,
    android: `I congratulated ${champName} on becoming ${titleName}. I feel no envy; shared joy is the whole point of it. Still, my memory notes that a titled gladiator draws twice as many listeners when they speak of mercy.`,
    elf: plotActive
      ? `${champName} is crowned ${titleName}, while I remain untitled in the barracks. I do not begrudge their skill, Lanista, but an untitled prisoner is disposable to the palace and useless to the rising. Do not leave me in the wings.`
      : `${champName} is crowned ${titleName}, while I remain untitled in the barracks. I do not begrudge their skill, Lanista, but an untitled prisoner is disposable to the palace. Do not leave me in the wings.`,
  };

  const text = isChamp
    ? (branchA[coreId] ?? `${champName} joins me on the wall as ${titleName}. Two champions in one house. Now the city knows our name.`)
    : (branchB[coreId] ?? `${champName} takes the laurel as ${titleName} while my wall stays bare. Give me a turn at the next bracket, Lanista.`);

  const choices = isChamp
    ? [
        {
          id: 'twin_pillars',
          label: 'Continue.',
          effects: { morale: 6, trust: 5, stress: -4 },
          responseSpeaker: 'narrator',
          responseText: `${fName} rests a hand on the doorframe a moment, then goes back out to the yard.`,
        },
      ]
    : [
        {
          id: 'promise_next_laurel',
          label: 'Your turn is coming next. Keep ready.',
          effects: { morale: 5, trust: 5 },
          responseText: 'Hold to that, Lanista. My wall has been empty long enough.',
        },
        {
          id: 'earn_it_on_sand',
          label: 'Titles are won on the sand, not by envying your housemate.',
          effects: { morale: -4, xp: 2, trust: -2 },
          responseText: 'I wasn\'t envying. I was counting. Point me at the next bracket.',
        },
      ];

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: isChamp ? 'Fellow Champion Crowned' : 'Left Out of the Laurels',
    isQueued,
    leadText: `While the barracks celebrates ${champName}'s new title (${titleName}), ${fName} speaks with you in the colonnade.`,
    fighterText: text,
    choices,
    run,
  });
}

// PLACEHOLDER: Imperial Summons scenes for the designer.
function buildSummonsScene(run, f, coreId, subType, ctx, isQueued) {
  const id = `summons_${subType}`;
  const deadName = ctx?.deadName ?? 'our housemate';
  const bonded = Boolean(ctx?.bonded) || (f?.bond && f.bond.name === deadName);
  const fName = f?.name ?? 'Your gladiator';
  const plotActive = Boolean(run?.plot && !run.plot.ended);

  if (subType === 'before') {
    const lines = {
      unit91: 'Their regular is stronger than I am. If you send me, let me yield at the Death Gate. I don\'t much mind dying, Lanista. I mind dying to fill an immortal\'s afternoon.',
      basa: 'Summoned to the Imperial Coliseum like a performing bear for the Palatine dinner interval. If I go, Lanista, promise me you won\'t order me to fight to the death just to flatter Legate Vane.',
      orc: 'The Princeps\'s own Coliseum is calling, Lanista. Send me. Even if their regular outweighs me by a head, an Orc who lasts three rounds under the Imperial box becomes a legend in the barracks.',
      android: 'If someone must walk onto the Imperial sand today, send me. My frame can take blows that would break the others, if you let me yield at the Death Gate.',
      elf: plotActive
        ? 'A summons to the Imperial Coliseum before we are ready. Legate Vane enjoys reminding minor houses who owns their throats. If you send me, I must come back alive. The rising cannot afford a martyr in an afternoon exhibition.'
        : 'A summons to the Imperial Coliseum before we are ready. Legate Vane enjoys reminding minor houses who owns their throats. If you send me, I must come back alive. I have not finished what I came here for.',
    };
    const yieldReplies = {
      orc: 'Kneel, in front of the Princeps. I\'ll do it, Lanista. Don\'t ask me to thank you.',
      unit91: 'Sensible. Two rounds of show, then I walk home.',
      basa: 'Good. Pride does not weigh much on a bier.',
      android: 'Thank you, Lanista. Two rounds, and nobody has to die for their dinner.',
      elf: 'Wise. Let Vane keep his afternoon spectacle, and I keep my throat.',
    };
    const deathReplies = {
      orc: 'Ha. To the last drop. Let the Princeps lean over his marble rail.',
      unit91: 'So that is what my contract is worth to you. Understood, Lanista.',
      basa: 'So my life is what the palace\'s goodwill costs. Understood, Lanista.',
      android: 'Then the spike will have its afternoon, Lanista. I am sorry for whichever of us falls.',
      elf: 'You bought the throat; you get to spend it. Understood, owner.',
    };
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: 'Before the Imperial Summons',
      isQueued,
      leadText: `With the Imperial Summons scroll open on your table, ${fName} steps forward to hear your orders.`,
      fighterText: lines[coreId] ?? 'The Imperial Coliseum is a long step up from our circuit, Lanista. Tell me what orders you mean to give if you send me.',
      choices: [
        {
          id: 'promise_yield_order',
          label: 'If you go, yield at the Death Gate. Come home alive.',
          effects: {
            stress: coreId === 'orc' ? -2 : -10,
            trust: coreId === 'orc' ? 1 : 8,
            morale: coreId === 'orc' ? -2 : 4,
            summonsOrderHint: 'yield',
          },
          responseText: yieldReplies[coreId] ?? 'Sensible. Two rounds of show, then I walk home.',
        },
        {
          id: 'promise_death_order',
          label: 'The palace wants a finish. You don\'t yield.',
          effects: {
            morale: coreId === 'orc' ? 6 : -6,
            stress: 5,
            trust: coreId === 'orc' ? 6 : -4,
            summonsOrderHint: 'death',
          },
          responseText: deathReplies[coreId] ?? 'So my life is what the palace\'s goodwill costs. Understood, Lanista.',
        },
      ],
      run,
    });
  }

  if (subType === 'after_ally_died') {
    const lines = {
      unit91: `${deadName} did not return from the Imperial sand. You sent them out there because the palace snapped its fingers. ${bonded ? 'My chest feels tight. I cannot seem to clear it. I hate it.' : 'Do not expect the rest of us to forget what you paid for their goodwill.'}`,
      basa: `They threw ${deadName} to an Imperial executioner to keep the palace pleased, and now their bunk is empty. ${bonded ? 'We sat by the brazier four nights ago. How easily you spend our lives to pay your debts.' : 'If the Temple of Hades has a cold slab open, use it, or don\'t look us in the eye.'}`,
      orc: `${deadName} fell under the Imperial eagles. ${ctx?.order === 'death' ? 'At least they went down swinging with the order, the way the blood-priests sing of.' : 'Cut down before the cloth could even hit the sand.'} Pour their ration into the brazier tonight, Lanista. They paid your debt to the palace in full.`,
      android: `${deadName}'s voice is gone from the barracks. I still have every word they spoke to me yesterday, exact as it fell. ${bonded ? 'In the Choir, when someone we love is lost, we sit together until morning. Here there is only blood on white sand.' : 'If we have the coin, please speak to the priests of Hades before the month turns.'}`,
      elf: `${deadName} was killed on the Imperial sand so the palace would go on smiling at you. ${bonded ? 'They were the only friend I had inside these walls, and it was not Silbannacus who sent them.' : `Remember ${deadName}'s face the next time Legate Vane smiles at you and asks for loyalty.`}`,
    };
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: `Mourning ${deadName} After the Summons`,
      isQueued,
      leadText: `The cart returns from the Imperial Coliseum without a living rider. ${fName} stands before ${deadName}'s empty bunk.`,
      fighterText: lines[coreId] ?? `${deadName} died on the Emperor's sand today so this house could keep the palace's goodwill. The barracks is very quiet tonight, Lanista.`,
      choices: [
        {
          id: 'vow_hades_or_remembrance',
          label: `If we can raise the coin for Hades, we bring ${deadName} back.`,
          effects: { morale: 3, trust: 2, stress: -2 },
          responseText: 'Words are cheap, Lanista. The priests of Hades won\'t wait past the month.',
        },
        {
          id: 'grim_necessity',
          label: 'If I had refused, the palace would have ruined the whole house.',
          effects: { morale: -4, trust: -3 },
          responseText: `${deadName} paid for all of us, then. Remember what it cost.`,
        },
        {
          id: 'own_the_order',
          label: 'I gave the order. I knew the odds when I gave it.',
          effects: { morale: -2, trust: 4 },
          responseSpeaker: 'narrator',
          responseText: 'They look at you for a long second, then nod once. "At least you didn\'t blame the palace, Lanista."',
        },
      ],
      run,
    });
  }

  const yielded = ctx?.reason === 'towel' || ctx?.order === 'yield';
  const afterLines = {
    unit91: {
      after_win: 'The Imperial regular underestimated my speed. Silbannacus leaned over the marble rail when the blow landed. Now he knows my name.',
      after_survive: 'Three rounds against an Imperial regular, and I am still upright. Even the Praetorians clapped when the final horn sounded.',
      after_loss: yielded
        ? 'You had me yield at the Death Gate. The Emperor sneered, the palace took its toll, and I am still breathing tomorrow. A sensible trade.'
        : 'Their regular ended it before the third horn. I am still breathing, which is more than the crowd paid for.',
    },
    basa: {
      after_win: 'I beat an Imperial Coliseum veteran on his own white sand. Did you see Legate Vane drop his wax tablet in the lower box?',
      after_survive: 'Battered from shoulder to hip, and I still stood to the third horn on Imperial sand. Not bad for a provincial.',
      after_loss: yielded
        ? 'I yielded on the Imperial sand. My pride is in tatters, Lanista, though my ribs are still mostly attached.'
        : 'Beaten before the third horn on Imperial sand. My pride is in tatters, Lanista, though my ribs are still mostly attached.',
    },
    orc: {
      after_win: 'I won on the Imperial sand. Silbannacus himself asked the herald for Clan Varg\'s name. Did you hear him?',
      after_survive: 'Lost the decision, won the crowd. Three full rounds trading blows with an Imperial champion and I never took a knee.',
      after_loss: yielded
        ? 'I threw the cloth because you ordered it, Lanista. The Princeps looked at me like a scraped boot. Next time, let me die standing.'
        : 'Put down before the third horn, right under the Imperial box. The Princeps looked at me like a scraped boot. Put me back at the posts.',
    },
    android: {
      after_win: 'The Imperial regular fought with arrogance; I answered with stillness. Even the Emperor sat back in his chair when the bout ended.',
      after_survive: 'Three rounds endured in the Imperial Coliseum. My plating is battered from collar to hip, and neither of us died today. That is enough.',
      after_loss: yielded
        ? 'To kneel at the Death Gate costs you dearly with the palace, Lanista. Thank you for valuing a machine\'s life above their applause.'
        : 'Their regular ended it swiftly. My plating is bent, and I am still here to mend it. That is enough.',
    },
    elf: {
      after_win: 'I stood on the Imperial sand, looked straight up at Silbannacus\'s box over his fallen regular, and bowed. He didn\'t recognise my father\'s eyes. Not yet.',
      after_survive: 'Outmatched by ten pounds of Imperial plate, and still they couldn\'t put me down in three rounds.',
      after_loss: yielded
        ? 'Let the court laugh at a white cloth. A live fighter with a bruised name is still dangerous; a proud corpse is nothing.'
        : 'Beaten cleanly before the third horn, and still breathing. A live fighter with a bruised name is still dangerous; a proud corpse is nothing.',
    },
  };
  const line = afterLines[coreId]?.[subType]
    ?? (subType === 'after_win'
      ? 'We beat an Imperial Coliseum regular on the Emperor\'s own sand.'
      : subType === 'after_survive'
      ? 'Three full rounds against an Imperial regular, and I walked out on my own two feet.'
      : 'Outmatched on the Imperial sand, and still I came back alive.');

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: titleForMilestone(id),
    isQueued,
    leadText: `${fName} returns from the litter after answering the Imperial Summons.`,
    fighterText: line,
    choices: [
      {
        id: 'welcome_back_summons',
        label: subType === 'after_win' ? 'The palace knows this house now. That cuts both ways.' : 'You walked out of the Emperor\'s arena alive. Rest tonight.',
        effects: { morale: 7, trust: 6, stress: -8 },
        responseSpeaker: 'narrator',
        responseText: `${fName} stands a moment longer, then turns toward the barracks.`,
      },
    ],
    run,
  });
}

// PLACEHOLDER: Three-tier palace suspicion warning scenes for the designer.
function buildSuspicionScene(run, f, coreId, levelKey, isQueued) {
  const normLevel = ['watch', 'informer', 'cold'].includes(levelKey) ? levelKey : 'watch';
  const id = `suspicion_${normLevel}`;
  const reliefPaid = Boolean(run?.plot?.suspicionReliefPaid?.[normLevel]);
  const fName = f?.name ?? 'Your gladiator';
  const byLevel = {
    watch: {
      elf: 'Prefect Crassinus\'s clerks have started drinking at the corner thermopolium and watching our back lane. At this stage they are only taking names. Keep the gate quiet.',
      basa: 'A Praetorian clerk lingered by the gate at noon. Five years ago, two inquisitors stood on my family\'s jetty with that same polite posture while Vaelen hid under our salt-nets.',
      unit91: 'The water-seller opposite our gate has changed shift three times in two days, and none of the replacements know how to carry a yoke. Someone is counting who comes and goes.',
      android: 'There is a man at the end of the lane who has not moved since the lamps were lit. He is not waiting for anyone. I thought you should know.',
      orc: 'A man in the tavern bought me wine and asked who visits us after dark. Rival house scouts, maybe, though I didn\'t like the way he held his stylus.',
    },
    informer: {
      elf: 'Someone near this block is selling notes to Crassinus. I have stopped leaving chalk in the courtyard. Check the house for loose tongues.',
      basa: 'I caught a grain-carrier checking our side latch before dawn. I moved my mother\'s letters out of my cell. Keep your voice down near the new hires, Lanista.',
      unit91: 'Two messages went missing between here and the harbour this week. I have stopped speaking in the courtyard after dusk. Watch who asks questions.',
      android: 'Every night someone listens beneath the colonnade. I have turned my light off early so the shadows give them nothing to write down.',
      orc: 'My cousin in the urban cohorts crossed the street today rather than be seen talking to me. A man in the tavern asked again who visits us after dark. I told him nobody. That\'s true, isn\'t it?',
    },
    cold: {
      elf: 'This is how it went with my father. First the invitations stopped. If they come for me, hand me over quickly and look surprised. I mean it.',
      basa: 'The boats won\'t touch our pier any more. I sent word to my mother not to write back. Whatever you do at night, Lanista, be worth that.',
      unit91: 'They have stopped pretending to be water-sellers. If the warrant comes at dawn, I will not ask you to die for a human cause. Just tell me before the gate breaks.',
      android: 'When they come through the gate, the spike will want to fight them. I would ask you to bar my door from the outside tonight. Please.',
      orc: 'Tell me straight, Lanista. Are the Praetorians coming for this house? Because if they break that gate, I need to know which side of the door I am standing on.',
    },
  };
  const fallbackByLevel = {
    watch: 'There\'s a man across the street who wasn\'t there last week, Lanista. Just thought you should know.',
    informer: 'The Praetorians are asking around our corner now, Lanista. Watch who you trust.',
    cold: 'They\'ve stopped pretending not to watch us, Lanista. Keep the bar handy.',
  };
  const tierLines = byLevel[normLevel];
  const suspRelief = (delta) => (reliefPaid ? {} : { suspicion: delta });

  let choices;
  if (normLevel === 'cold') {
    if (coreId === 'android') {
      choices = [
        {
          id: 'bar_solace_door',
          label: 'I will bar it myself, Solace-4. You won\'t have to fight them.',
          effects: { ...suspRelief(-3), morale: 4, trust: 6, stress: -6 },
          responseText: 'Thank you, Lanista. Keep the key on your own belt.',
        },
        {
          id: 'keep_solace_unbarred',
          label: 'I cannot lock you inside if the gate breaks.',
          effects: { plotTrust: 1, morale: -4, trust: 2, stress: 6 },
          responseText: 'Then stand behind me when the hinges go, Lanista. Do not stand in front.',
        },
      ];
    } else if (coreId === 'orc') {
      choices = [
        {
          id: 'tell_varok_truth',
          label: 'It\'s true. Sit down.',
          effects: { plotTrust: 1, morale: -6, trust: 5, stress: 6 },
          responseSpeaker: 'narrator',
          responseText: 'He sits on the edge of the bench, staring at his hands for a long moment. "I won\'t open the gate for Crassinus. That is all I am promising tonight."',
        },
        {
          id: 'reassure_orc_cold',
          label: 'We keep the gate quiet and give them no warrant to break it.',
          effects: { ...suspRelief(-2), morale: 2, trust: 2 },
          responseSpeaker: 'narrator',
          responseText: 'He does not quite believe you, and says nothing for a beat. "Then keep it quiet, Lanista."',
        },
      ];
    } else if (coreId === 'elf') {
      choices = [
        {
          id: 'refuse_handover_elf',
          label: 'Nobody in this house gets handed through the gate.',
          effects: { plotTrust: 1, morale: 5, trust: 6 },
          responseText: 'Then we both die stubborn. Keep the bar across the postern.',
        },
        {
          id: 'pragmatic_cover_elf',
          label: 'Keep out of sight until the watch moves on.',
          effects: { ...suspRelief(-3), morale: -2, trust: 2, stress: -2 },
          responseText: 'Sensible. My father\'s friends were sensible too.',
        },
      ];
    } else if (coreId === 'basa') {
      choices = [
        {
          id: 'lay_low_cold_basa',
          label: 'Keep the lamps out and the gate shut tonight.',
          effects: { ...suspRelief(-3), morale: 3, trust: 4, stress: -4 },
          responseText: 'Good. The dark is cheaper than a warrant.',
        },
        {
          id: 'hold_course_cold_basa',
          label: 'Your mother\'s village stays out of this. I promise you.',
          effects: { plotTrust: 1, morale: 4, trust: 6 },
          responseText: 'Make sure it is worth the silence, Lanista.',
        },
      ];
    } else if (coreId === 'unit91') {
      choices = [
        {
          id: 'warn_unit91_cold',
          label: 'You will hear it from me before you hear the rams.',
          effects: { plotTrust: 1, morale: 3, trust: 6 },
          responseText: 'That is all I asked. I will keep my boots laced.',
        },
        {
          id: 'lay_low_cold_u91',
          label: 'They won\'t come if we give them nothing to write down.',
          effects: { ...suspRelief(-3), morale: 2, trust: 3, stress: -4 },
          responseText: 'Humans rarely stop once they have started counting. Still, we can try quiet.',
        },
      ];
    } else {
      choices = [
        {
          id: 'lay_low_suspicion',
          label: 'Keep the lamps low and the gate shut.',
          effects: { ...suspRelief(-3), morale: 3, trust: 3, stress: -4 },
          responseSpeaker: 'narrator',
          responseText: `${fName} nods once and checks the bolt on the postern.`,
        },
        {
          id: 'hold_the_course',
          label: 'If they knock, let me answer it.',
          effects: { plotTrust: 1, morale: 2, trust: 4 },
          responseText: 'Then do it soon. He has more clerks than we have doors.',
        },
      ];
    }
  } else if (coreId === 'orc') {
    choices = [
      {
        id: 'reassure_orc_rivals',
        label: 'Rival houses talk. Let them.',
        effects: { morale: 4, trust: 3, ...suspRelief(-2) },
        responseSpeaker: 'narrator',
        responseText: 'He laughs, a little too loudly. "Ha. Of course. I\'ll put my cousin straight."',
      },
      {
        id: 'appeal_orc_honour',
        label: 'We look after our own here. That is all.',
        effects: { morale: 2, trust: 5 },
        responseSpeaker: 'narrator',
        responseText: 'He rubs his jaw, frowning. "Crassinus always was a desk-rat. Just don\'t ask me to spit on the Eagle, Lanista."',
      },
    ];
  } else {
    choices = [
      {
        id: 'lay_low_suspicion',
        label: 'Keep the gate quiet this month.',
        effects: { ...suspRelief(-3), morale: 3, trust: 4, stress: -4 },
        responseText: 'Good. A quiet gate gives Crassinus nothing to write down.',
      },
      {
        id: 'hold_the_course',
        label: 'Keep moving. I\'ll handle Crassinus.',
        effects: { plotTrust: 1, morale: 2, trust: 5 },
        responseText: 'Then do it soon. He has more clerks than we have doors.',
      },
    ];
  }

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: normLevel === 'cold' ? 'Warrants in the Dark' : normLevel === 'informer' ? 'Ears on the Block' : 'Watchers at the Gate',
    isQueued,
    leadText: `After Prefect Crassinus's watchers pass the gate, ${fName} draws you into the shadow of the colonnade.`,
    fighterText: tierLines[coreId] ?? fallbackByLevel[normLevel],
    choices,
    run,
  });
}

// PLACEHOLDER: Rebellion call, betrayal, and courtyard schism scenes for the designer.
function buildRebelScene(run, f, coreId, subType, isQueued) {
  const fName = f?.name ?? 'Your gladiator';
  if (subType === 'orc_elf_schism') {
    const hasTarek = Boolean(run?.roster?.some((x) => x.coreId === 'basa'));
    const extraBeats = [
      { speaker: 'orc', speakerName: 'Varok', text: 'She was chalking the chain on our wall, Lanista. Our wall. The Empire gave my clan a name and a vote. Her kind gave the Basa collars. Tell me you didn\'t know.' },
      { speaker: 'elf', speakerName: 'Vaelen', text: 'A vote. They put cruor in your grandfathers\' rations and marched them at the Android guns so the human cohorts could arrive late. We are all Sib\'s livestock, Varok. You just like the taste of the feed.' },
      { speaker: 'orc', speakerName: 'Varok', text: 'Don\'t call the Princeps that in front of me. My brother is an optio. My grandfather took the citizen\'s oath on the Coliseum steps. Which chain am I meant to break, Elf?' },
    ];
    return buildNormalizedTree({
      id: 'rebel_orc_elf_schism',
      coreId,
      fighter: f,
      title: 'Clash in the Courtyard: The Eagle and the Chain',
      isQueued,
      leadText: `Benches overturned in the courtyard. Varok has Vaelen by the wrist. Between their boots lies a stick of chalk, snapped in two.${hasTarek ? ' Tarek steps into the gap between them.' : ''}`,
      extraBeats,
      fighterSpeaker: hasTarek ? 'basa' : 'narrator',
      fighterSpeakerName: hasTarek ? 'Tarek' : '',
      fighterText: hasTarek
        ? 'Don\'t speak for the Basa, Varok. I know what her people did to mine. I can say it in three languages; that is what they did. She ate at my mother\'s table. Let go of her wrist.'
        : 'Neither backs down. Both turn to you.',
      choices: [
        {
          id: 'mediate_solidarity',
          label: 'Let her go, Varok. Nobody in this house goes to Crassinus.',
          effects: {
            morale: 6,
            trust: 5,
            loreFlag: 'orc_barracks_truce',
            byCoreId: { orc: { morale: 5, trust: 5 }, elf: { morale: 6, trust: 5 }, basa: { morale: 5, trust: 5 } },
          },
          responseSpeaker: 'narrator',
          responseText: 'Varok lets go of her wrist. "I won\'t wear your chain, Elf. Draw it where I can see it and I\'ll rub it out. But I carry no tales to Crassinus. Not about my own house."',
        },
        {
          id: 'lore_both_empires',
          label: 'You are both right. That is the trouble.',
          when: (r, ft) => (r?.loreRead ?? []).includes('kind:orc')
            || (r?.loreRead ?? []).includes('kind:elf')
            || (ft?.dialogue?.loreFlags ?? []).includes('basa_heritage_respected'),
          lockReason: 'Requires Codex: Orcs or Elves',
          effects: {
            morale: 2,
            trust: 6,
            plotTrust: 1,
            suspicion: -4,
            loreFlag: 'orc_barracks_truce',
            byCoreId: { orc: { morale: 2, trust: 6 }, elf: { morale: 3, trust: 6 }, basa: { morale: 4, trust: 6 } },
          },
          responseSpeaker: 'narrator',
          responseText: `Varok looks at the chalk for a long moment, then scuffs sand over it. "My uncle came home from the Rim with the shakes. He still salutes." He lets go of her wrist. Vaelen rubs it. "The collars were real. I know what my house was."${hasTarek ? ' She does not look at Tarek.' : ''}`,
        },
        {
          id: 'side_with_vaelen',
          label: 'She\'s right, Varok. Fall in, or keep to your cell.',
          effects: {
            morale: coreId === 'orc' ? -15 : 6,
            trust: coreId === 'orc' ? -12 : 6,
            plotTrust: 1,
            byCoreId: { elf: { morale: 6, trust: 6 }, orc: { morale: -15, trust: -12, stress: 10 } },
          },
          responseSpeaker: 'narrator',
          responseText: 'Varok lets go and steps back. "So that\'s how it is. I\'ll fight out my contract, Lanista, because a Varg keeps his word. Don\'t ask me to smile about it."',
        },
        {
          id: 'side_with_varok_crush_plot',
          label: 'Scrub it off. There is no rising in this house.',
          effects: {
            morale: coreId === 'elf' ? -20 : 10,
            trust: coreId === 'elf' ? -20 : 10,
            suspicion: -10,
            endPlot: 'cold',
            byCoreId: { orc: { morale: 12, trust: 10 }, elf: { morale: -20, trust: -20 } },
          },
          responseSpeaker: 'narrator',
          responseText: `Vaelen grinds the chalk under her heel. "I'll still win your bouts. An owner is owed that much."${hasTarek ? ' Tarek looks at you a moment longer, and steps back.' : ''}`,
        },
      ],
      run,
    });
  }

  if (subType === 'call_betrayed') {
    const betrayedLines = {
      basa: 'You gave them the names. My mother hid Vaelen under our salt-nets for four months, and you sold them for a purse and a smile from the palace. Don\'t ask me to share wine in this yard again, Lanista.',
      unit91: 'They dragged them out at dawn. You did not even step into the courtyard to watch. I stopped expecting loyalty from humans a long time ago, Lanista, so you have not surprised me. You have only confirmed it.',
      android: 'The courtyard is quiet where their footsteps used to be. I will remember the sound of the Praetorian boots on our flagstones for as long as this frame lasts. I wish I could forget it.',
      orc: 'I didn\'t want their chalk on my wall, Lanista. I never asked you to hand our own housemates to Crassinus\'s rope. A Varg settles his quarrels in the yard, not with a clerk\'s ink.',
      elf: 'You sold the whole list to the palace and kept the purse. Keep your guards near your door, owner. The names you gave had friends.',
    };
    return buildNormalizedTree({
      id: 'rebel_call_betrayed',
      coreId,
      fighter: f,
      title: 'Names Given to the Palace',
      isQueued,
      leadText: `After the Praetorians leave the yard and the palace purse sits on your desk, ${fName} stops in the doorway.`,
      fighterText: betrayedLines[coreId] ?? 'The Praetorians took our own out through the front gate at noon, and the palace paid you for the trouble. I\'ll fight out my contract, Lanista. Don\'t expect a word beyond it.',
      choices: [
        {
          id: 'own_betrayal',
          label: 'It kept this house standing. Back to the posts.',
          effects: { morale: -6, trust: -8 },
          responseSpeaker: 'narrator',
          responseText: `${fName} says nothing, and walks back toward the yard.`,
        },
        {
          id: 'silent_betrayal',
          label: 'Say nothing.',
          effects: { morale: -4, trust: -4 },
          responseSpeaker: 'narrator',
          responseText: `${fName} holds your gaze for a second, then turns away.`,
        },
      ],
      run,
    });
  }

  const accepted = subType === 'call_accepted';
  const id = accepted ? 'rebel_call_accepted' : 'rebel_call_refused';
  const lines = accepted
    ? {
        elf: 'You copied the sign onto the gate. My contacts in the aqueducts saw it before dawn. My father died believing no house in the capital had the nerve to stand against Silbannacus. Thank you for proving him wrong, Lanista.',
        basa: 'A broken chain on our door. My mother hid one Aethelgard in our salt-shed; now you\'re hiding a whole conspiracy under Legate Vane\'s nose. It\'s mad, Lanista... and it\'s the first thing we\'ve done that feels worth the blood.',
        unit91: 'Chalk on the back gate. If this house is breaking doors open, see that the under-forges are on the list. The captured frames down there have waited long enough.',
        android: 'To break a chain without becoming a new jailer is the hardest thing a city can try, Lanista. If we rise against the Palatine, let us rise to free the city, not merely to change the name on the whip.',
        orc: 'I saw the chalk mark by the postern, Lanista. My brothers wear the Eagle. I\'ll not inform on my own house. Don\'t ask me for more than that.',
      }
    : {
        elf: 'You scrubbed the chalk and sent the couriers away. So the cells stay shut, and his Machine eats another generation. I\'ll still win your bouts. An owner is owed that much.',
        basa: 'So we keep our heads down, pay Censor Gallo his winter silver, and let the world stay as it is. Sensible, Lanista. My uncles would approve.',
        unit91: 'No chalk on the gate, then. Back to ordinary bouts for ordinary coin. We are more likely to live through the season, if that counts for anything.',
        android: 'Perhaps this house was not meant to be a spear against the palace. Even in a closed cage, Lanista, we can still practise mercy on the sand.',
        orc: 'Good. Let the tavern radicals draw their chalk on somebody else\'s wall. We win our freedom through the front gate under the noon sun.',
      };

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: accepted ? 'The Broken Chain Answered' : 'The Chalk Washed Away',
    isQueued,
    leadText: `After the house's decision becomes clear, ${fName} speaks with you in low tones.`,
    fighterText: lines[coreId] ?? (accepted
      ? 'There\'s chalk on the back gate, Lanista. I didn\'t see it. Nobody did.'
      : 'Somebody scrubbed the back gate this morning. Good. I\'ve trouble enough on the sand.'),
    choices: [
      {
        id: 'ack_rebel_choice',
        label: accepted ? 'Not a word outside these walls.' : 'It\'s done. We don\'t speak of it.',
        effects: { morale: 4, trust: 4 },
        responseSpeaker: 'narrator',
        responseText: `${fName} keeps their eyes on the flagstones and slips back into the shade.`,
      },
    ],
    run,
  });
}

// PLACEHOLDER: Estate building and room decor / keepsake reaction scenes for the designer.
function buildBuildingOrDecorScene(run, f, coreId, rawId, ctx, isQueued) {
  const fName = f?.name ?? 'Your gladiator';
  if (rawId.startsWith('building_built_')) {
    const bType = rawId.replace('building_built_', '');
    const bLabel = BUILDING_LABELS[bType] ?? (bType.charAt(0).toUpperCase() + bType.slice(1));
    const lines = {
      hades: {
        basa: 'A Temple of Hades in the obsidian crypt under the yard. If one of us falls on the sand, the black-robed priests can call us back whole before the month turns. No brass cables. Worth every coin.',
        elf: 'The Temple of Hades. My grandmother\'s people feared that threshold, yet a shrine that gives someone back with their own mind is rare mercy in this city.',
        android: 'The priests of Hades return the dead with their memories still theirs. Far kinder than the forge-hammers of Vulcan.',
        unit91: 'A Temple of Hades under the flagstones. Expensive, Lanista, and far cleaner than Vulcan\'s butchers.',
        orc: 'A shrine to Hades under the yard. Now if a lucky blow catches one of us at the Death Gate, we don\'t have to come back clanking in brass.',
      },
      vulcan: {
        unit91: 'The Unnatural Temple of Vulcan. They weld brass into dead people who did not ask to stand back up. It is a mockery of both human quiet and machine life.',
        android: 'The forge-priests of Vulcan below the floor. I can hear their bellows through the stone. To stitch a departed soul into a burning brass shell that feels neither joy nor sorrow is a terrible thing, Lanista. Use Hades if you can.',
        basa: 'The smell of hot tallow and brass filings coming up from that vault turns my stomach. If I fall on the sand, Lanista, either pay Hades or leave me in the sea.',
        elf: 'Vulcan\'s forge. Another imperial obscenity where even death does not end a gladiator\'s contract.',
        orc: 'The blood-priests of Clan Varg say a warrior\'s spirit should rise with the smoke, not get bolted into a furnace. Still... I suppose a Revenant hits hard.',
      },
      lounge: {
        orc: 'A Patron Lounge with silver couches and Chian wine. Now we\'re a proper noble house, Lanista. Next time Senator Pollio dines here, let me carry out the cups.',
        elf: 'A Patron Lounge. The senators who come to drink your wine are vain and careless with their tongues. Give them a cup too many and they vote whichever way you steer them.',
      },
      gallery: {
        elf: 'The Whispering Gallery is open behind the flue. Every boot-step and guard rumour in the quarter carries straight to that hollow stone. Now we have ears equal to Crassinus\'s.',
        unit91: 'Hollow stone behind the wall. You can hear half the street from that alcove. Useful, if you know who to listen for.',
      },
      exhibition: {
        orc: 'An Exhibition Ring right here on the estate. Sparring for coin without a funeral at the end. Put me in whenever I\'m not on the main card.',
      },
      oracle: {
        basa: 'An Oracle on the roof. Finally, starlight and quiet above the sand-pit. I spent an hour with the brass astrolabe before dawn.',
      },
      temple: {
        android: 'The Temple of Fortuna rises on our estate. To reshape one\'s habits without violence is a rare gift on Palatina.',
      },
    };
    const text = lines[bType]?.[coreId]
      ?? `The mortar is barely dry on the new ${bLabel}, Lanista. Good to see coin going back into the walls.`;
    return buildNormalizedTree({
      id: rawId,
      coreId,
      fighter: f,
      title: `New Stone: ${bLabel}`,
      isQueued,
      leadText: `${fName} inspects the newly completed stonework on the estate.`,
      fighterText: text,
      choices: [
        {
          id: 'ack_building',
          label: 'Put it to good use.',
          effects: { morale: 4, trust: 4 },
          responseSpeaker: 'narrator',
          responseText: `${fName} runs a palm over the fresh cut stone and heads back to the drills.`,
        },
      ],
      run,
    });
  }

  // room_decor_placed_<item> or keepsake unlock
  const itemKey = rawId.replace('room_decor_placed_', '');
  const ks = evaluateKeepsake(f);
  const placedKey = (ctx?.item && ks.disliked.includes(ctx.item)) ? ctx.item : itemKey;
  const isDisliked = ks.disliked.includes(placedKey);
  const showKeepsakeUnlock = Boolean(ctx?.keepsakeUnlocked) && ks.active;

  let text;
  if (isDisliked) {
    const dislikeByItem = {
      unit91: {
        wineAmphora: 'Take that wine jar out of my quarters, Lanista. The smell lingers in the plaster, and I have no use for it.',
        skullRack: 'Bones mounted on the wall where I sleep. Take them down, Lanista. It is not intimidating. It is unsanitary.',
      },
      basa: {
        lionCage: 'A cage. In my room. Take it out, Lanista, or I sleep in the yard.',
      },
      orc: {
        spikyBed: 'A bed of nails. I signed a five-year contract to win a name, Lanista, not to sleep like a temple fanatic. Take it out.',
      },
      android: {
        whetstone: 'Please take the sharpening stone out of my quarters, Lanista. The sound of steel on grit wakes the spike even when nobody is using it.',
        skullRack: 'Bleached skulls beside my alcove. They wake the spike while I am trying to rest. Please remove them.',
      },
      elf: {
        wineAmphora: 'They poured sweet Palatine wine at the banquet after my father died. Get that jar out of my room.',
        lionCage: 'I listened to the arena lions for three weeks in Crassinus\'s holding cells. Get those bars out of my sight.',
      },
    };
    const itemName = DECOR_LABELS[placedKey] ?? 'piece';
    text = dislikeByItem[coreId]?.[placedKey] ?? `This ${itemName} does not belong in my quarters, Lanista.`;
  } else if (showKeepsakeUnlock) {
    const keepsakeLines = {
      unit91: 'No smoke. No bones. Raked sand. I slept on my back last night, Lanista. I have not done that since the station.',
      basa: 'When I close my eyes in the steam, it sounds like the tide on the Salt-Reach reef. First time in years my head has been quiet.',
      orc: 'Mars in the corner and crimson on the wall. Now this looks like a proper soldier\'s room. My brothers never had quarters like these.',
      android: 'Something small and alive, singing beside a quiet corner without fear. The noise at the back of my neck dropped to a whisper.',
      elf: 'Oil-stone beside warm coal, and none of the palace\'s wine. It smells like my father\'s command tent on the winter frontier.',
    };
    text = keepsakeLines[coreId] ?? 'My quarters finally feel like home, Lanista. You paid attention to who I am.';
  } else {
    text = 'You added new furnishing to my quarters, Lanista. It makes the stone walls feel less like a holding cell.';
  }

  return buildNormalizedTree({
    id: rawId,
    coreId,
    fighter: f,
    title: isDisliked ? 'Unwanted Furnishing' : showKeepsakeUnlock ? `Keepsake Awakened: ${ks.name}` : 'New Room Furnishing',
    isQueued,
    leadText: `Inside their quarters, ${fName} looks around at the newly arranged room.`,
    fighterText: text,
    choices: isDisliked
      ? [
          {
            id: 'apologise_decor',
            label: 'My mistake. It goes today.',
            effects: { morale: 3, trust: 3 },
            responseSpeaker: 'narrator',
            responseText: 'A short nod. "Today, then."',
          },
        ]
      : [
          {
            id: 'affirm_room_keepsake',
            label: showKeepsakeUnlock ? 'May it serve you well.' : 'Rest well before the next card.',
            effects: { morale: showKeepsakeUnlock ? 10 : 5, trust: showKeepsakeUnlock ? 10 : 4, stress: showKeepsakeUnlock ? -10 : -4 },
            responseSpeaker: 'narrator',
            responseText: `${fName} nods and looks back around the room.`,
          },
        ],
    run,
  });
}

// PLACEHOLDER: Personal request ask / fulfilled / refused wrapper scenes for the designer.
function buildWantScene(run, f, coreId, mode, wantId, ctx, isQueued) {
  const id = `want_${mode}_${wantId}`;
  const fName = f?.name ?? 'Your gladiator';
  const chain = CORE_WANTS[coreId] ?? [];
  const exactItem = chain.find((w) => w.id === wantId)
    ?? (f?.want?.coreWantId ? chain.find((w) => w.id === f.want.coreWantId) : null);
  const item = exactItem ?? (mode === 'asked' ? nextCoreWant(run, f) : null) ?? {
    id: wantId,
    title: ctx?.label ?? f?.want?.label ?? 'A Personal Request',
    goal: ctx?.goal ?? f?.want?.goal ?? 'Fulfil their request',
    ask: f?.want?.ask ?? 'I have bled for this house, Lanista. Grant me this one request.',
    thanks: 'You kept your word, Lanista. I will pay it back on the sand.',
    sulk: 'I asked for one thing, and you turned me down. I won\'t forget.',
  };

  if (mode === 'asked') {
    const wc = f?.dialogue?.wantChain;
    const isCompleted = Boolean(wc?.completed?.includes(item.id));
    const isRefused = Boolean(wc?.refused?.includes(item.id));
    if (isCompleted || isRefused) {
      return buildNormalizedTree({
        id,
        coreId,
        fighter: f,
        title: `Request Settled: ${item.title ?? item.label}`,
        isQueued,
        leadText: `${fName} nods briefly. That old request is already settled.`,
        fighterText: isCompleted ? item.thanks : item.sulk,
        choices: [
          {
            id: 'want_settled_ack',
            label: 'It is already done. Back to work.',
            effects: {},
            responseSpeaker: 'narrator',
            responseText: `${fName} squares their shoulders and steps back into line.`,
          },
        ],
        run,
      });
    }
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: `Request: ${item.title ?? item.label}`,
      isQueued,
      leadText: `${fName} steps aside with you after morning roll-call.`,
      fighterText: item.ask,
      choices: [
        {
          id: 'accept_want',
          label: `I'll see to it. (${item.goal})`,
          effects: { trust: 5, morale: 4, acceptWant: item.id },
          responseSpeaker: 'narrator',
          responseText: `${fName} nods once and steps back toward the yard.`,
        },
        {
          id: 'refuse_want',
          label: 'Not now. The house can\'t spare it.',
          effects: { morale: -10, trust: -8, refuseWant: item.id },
          responseSpeaker: 'narrator',
          responseText: 'They nod once, and go back to the yard.',
        },
      ],
      run,
    });
  }

  if (mode === 'fulfilled') {
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: `Fulfilled: ${item.title ?? item.label}`,
      isQueued,
      leadText: `${fName} seeks you out after seeing their request met.`,
      fighterText: item.thanks,
      choices: [
        {
          id: 'welcome_want_done',
          label: 'You earned it.',
          effects: { morale: 10, trust: 8, stress: -5, xp: 2, renown: 2 },
          responseSpeaker: 'narrator',
          responseText: `${fName} nods and heads back to the yard.`,
        },
      ],
      run,
    });
  }

  // mode === 'refused'
  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: `Unfulfilled Request: ${item.title ?? item.label}`,
    isQueued,
    leadText: `${fName} stands stiffly in the yard after their request went unmet.`,
    fighterText: item.sulk,
    choices: [
      {
        id: 'apologise_want_refused',
        label: 'Survival came first this month. I\'ll make it up to you.',
        effects: { morale: 4, trust: 3 },
        responseText: 'We\'ll see next month, Lanista. Deeds weigh heavier than apologies.',
      },
      {
        id: 'stern_want_refused',
        label: 'This is a Ludus, not a pleasure villa. Back to drills.',
        effects: { morale: -6, trust: -6, stress: 5 },
        responseSpeaker: 'narrator',
        responseText: 'They turn on their heel without another word.',
      },
    ],
    run,
  });
}

// PLACEHOLDER: Bond formed and grief wrapper scenes for the designer.
function buildBondScene(run, f, coreId, isGrief, pairKey, ctx, isQueued) {
  const fName = f?.name ?? 'Your gladiator';
  const cleanKey = (pairKey && Object.hasOwn(CORE_BOND_TREES, pairKey))
    ? pairKey
    : bondPairKey(coreId, ctx?.partnerCoreId ?? ctx?.mateCoreId ?? f?.bond?.coreId);
  const entry = (cleanKey && Object.hasOwn(CORE_BOND_TREES, cleanKey)) ? CORE_BOND_TREES[cleanKey] : null;
  const id = `bond_${isGrief ? 'grief' : 'formed'}_${pairKey || cleanKey || 'ally'}`;

  if (!isGrief && entry) {
    const lastBeat = entry.beats.at(-1);
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: entry.title,
      isQueued,
      leadText: entry.beats[0]?.text,
      extraBeats: entry.beats.slice(1, -1),
      fighterSpeaker: lastBeat?.speaker ?? 'fighter',
      fighterSpeakerName: lastBeat?.speakerName ?? f?.name,
      fighterText: lastBeat?.text ?? 'We stand together on the sand now.',
      choices: entry.choices,
      run,
    });
  }

  if (isGrief && entry) {
    const griefLine = entry.grief?.[coreId] ?? Object.values(entry.grief ?? {})[0] ?? 'They are gone, and the barracks feels empty.';
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: 'Grief in the Barracks',
      isQueued,
      leadText: `${fName} sits alone beside the unlit brazier in the quiet yard.`,
      fighterText: griefLine,
      choices: [
        {
          id: 'console_bond_grief',
          label: 'Sit with them in silence and share the watch.',
          effects: { morale: 7, trust: 7, stress: -10 },
          responseSpeaker: 'narrator',
          responseText: 'You sit until the lamps burn low. Neither of you speaks.',
        },
        {
          id: 'avenge_bond_grief',
          label: 'We will settle the debt against the house that took them.',
          effects: { morale: coreId === 'android' ? 1 : 6, trust: coreId === 'android' ? 2 : 6, xp: 2 },
          responseText: coreId === 'android'
            ? 'If we meet their house on the sand, I will face them. I will not become the thing that killed them.'
            : 'Point me at their banner on fight day. I want the bout.',
        },
      ],
      run,
    });
  }

  const mateName = ctx?.partnerName ?? ctx?.mateName ?? f?.bond?.name ?? 'their comrade';
  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: isGrief ? `Grieving for ${mateName}` : `Bonded with ${mateName}`,
    isQueued,
    leadText: isGrief
      ? `${fName} stares at ${mateName}'s empty place at the mess table.`
      : `${fName} and ${mateName} clasp forearms beside the brazier.`,
    fighterText: isGrief
      ? `${mateName} watched my blind side in the yard, Lanista, and now they're gone.`
      : `${mateName} fights like someone I'd want at my back when the gates open. Don't tell them I said so.`,
    choices: [
      {
        id: 'ack_generic_bond',
        label: isGrief ? 'Their name will be remembered in this house.' : 'Look after each other in the arena.',
        effects: { morale: 6, trust: 6, stress: -5 },
        responseSpeaker: 'narrator',
        responseText: isGrief
          ? 'They nod, and go on looking at the empty place.'
          : 'They clap a hand to their shoulder and head back toward the posts.',
      },
    ],
    run,
  });
}

// PLACEHOLDER: Mercy vs. execution post-bout scenes for the designer.
function buildMercyScene(run, f, coreId, isKill, ctx, isQueued) {
  const id = isKill ? 'mercy_kill_ordered' : 'mercy_spare_streak';
  const fName = f?.name ?? 'Your gladiator';
  const oppName = ctx?.oppName || null;
  const againstCrowd = Boolean(ctx?.againstCrowd) || (ctx?.crowd ? (isKill ? ctx.crowd !== 'kill' : ctx.crowd === 'kill') : false);
  const spareCount = Math.max(ctx?.spareStreak ?? 0, f?.dialogue?.mercy?.spared ?? 0, f?.dialogue?.mercy?.streak ?? 0);
  const plotActive = Boolean(run?.plot && !run.plot.ended);

  const killLines = {
    android: oppName
      ? `It took a fifth of a second. I was not consulted. We do not forget, Lanista. It is how we keep our joys. I shall keep ${oppName} as well.`
      : 'It took a fifth of a second. I was not consulted. We do not forget, Lanista. It is how we keep our joys. I shall keep this as well.',
    elf: `They were on their knees, Lanista. Another slave in another collar, and you made me their headsman to please the seats. ${againstCrowd ? 'Even the crowd wanted mercy today.' : 'Save our ruthless strokes for the Palatine box, not the poor devils on the sand.'}`,
    basa: 'Done. Don\'t look at me like that, Lanista, and don\'t call it "Basa ferocity" in the chronicle. That was your thumb-down, not my blood.',
    unit91: 'They were already beaten. Killing them changed nothing but the noise. Humans like the noise. I did as you ordered, Lanista. Do not ask me to cheer.',
    orc: againstCrowd
      ? 'I\'m no priest, Lanista, but even the crowd had their thumbs up for that poor bastard. Killing a beaten fighter when the stands ask for mercy tastes like bad brass.'
      : 'A clean blow between the collarbones, as the arena law provides. The stands asked for it, and they got it.',
  };

  const androidSpare = spareCount >= 2
    ? `${spareCount === 2 ? 'Twice now' : 'Again'} you have raised your thumb with my opponent down at the Death Gate${againstCrowd ? ', and ten thousand people shouting for the other thing' : ''}. I have ${spareCount === 2 ? 'both moments' : 'every one of those moments'} exactly as they were. I shall replay them tonight.`
    : `You raised your thumb when ${againstCrowd ? 'the crowd wanted blood' : 'my opponent lay beaten at the Death Gate'}. I have that moment exactly as it was. I shall replay it tonight.`;

  const spareLines = {
    android: androidSpare,
    elf: `You spared them, ${againstCrowd ? 'in the teeth of the court\'s blood-lust.' : (spareCount >= 2 ? 'again.' : 'at the Death Gate.')} Word travels fast through the arena tunnels, Lanista. Rival fighters are whispering that your house doesn't butcher beaten people for sport.${plotActive ? ' When the chains break, those spared blades will remember who let them live.' : ' Spared blades remember who let them live.'}`,
    basa: 'In the Salt-Reach, you never take more from the net than the village can eat before sundown. Letting them walk back to their gate... feels like throwing a small fish back into the surf. I slept well for once.',
    unit91: 'Thumb up. Good. They walk out, they keep breathing, and the crowd goes home disappointed. I approve.',
    orc: `Thumb up. Ha. ${againstCrowd ? 'With that crowd howling for blood, too. Their house owes us a life now, and they\'ll pull their blows against us while they remember it.' : 'A fighter who can beat their rival twice in one season earns twice the purse.'}`,
  };

  const comfortReplies = {
    android: 'It does not transfer, Lanista. But you offered. I will keep that as well.',
    elf: 'Your conscience is your own affair, Lanista. My hands did it.',
    basa: 'Then have the chronicle say so.',
    unit91: 'Weight does not transfer. Noted, all the same.',
    orc: againstCrowd
      ? 'Then look at the stands before your thumb, next time.'
      : 'What weight? It was a clean blow.',
  };

  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: isKill ? 'Blood on the Thumb' : 'The Merciful Hand',
    isQueued,
    leadText: isKill
      ? `After the execution on the sand, ${fName} cleans their weapon in silence by the water trough.`
      : `After sparing their beaten opponent in the arena, ${fName} walks back through the gate to quiet nods from the barracks.`,
    fighterText: isKill
      ? (killLines[coreId] ?? 'I finished them as you ordered, Lanista.')
      : (spareLines[coreId] ?? (spareCount >= 2
        ? 'Thumb up again, Lanista. The barracks sleeps easier for it.'
        : againstCrowd
          ? 'Thumb up when the stands wanted blood, Lanista. The barracks noticed.'
          : 'Thumb up, Lanista. The barracks noticed.')),
    choices: isKill
      ? [
          {
            id: 'comfort_after_kill',
            label: 'That was my order. It\'s on me.',
            effects: { morale: 5, trust: 6, stress: -8 },
            responseText: comfortReplies[coreId] ?? 'Your order, then. Noted.',
          },
          {
            id: 'harden_after_kill',
            label: 'Mercy doesn\'t pay Censor Gallo\'s winter tribute. Get used to it.',
            effects: { morale: coreId === 'orc' && !againstCrowd ? 6 : -6, trust: -5, xp: 1 },
            responseSpeaker: coreId === 'orc' && !againstCrowd ? null : 'narrator',
            responseText: coreId === 'orc' && !againstCrowd
              ? 'Ha. Now you sound like my father.'
              : 'They go back to cleaning the weapon. It is already clean.',
          },
        ]
      : [
          {
            id: 'affirm_mercy_creed',
            label: 'We fight to win, not to butcher slaves for the Palatine box.',
            effects: { morale: 8, trust: 8, stress: -8, ...(coreId === 'elf' && plotActive ? { plotTrust: 1 } : {}) },
            responseSpeaker: 'narrator',
            responseText: `${fName} nods quietly and returns to the yard.`,
          },
        ],
    run,
  });
}

// PLACEHOLDER: Hades revival and Vulcan Revenant death-and-return scenes for the designer.
function buildHadesOrVulcanScene(run, f, coreId, isHades, isQueued, sceneIdOverride = null, ctx = {}) {
  const id = sceneIdOverride || (isHades ? 'hades_revived' : 'vulcan_revenant_shock');
  const fName = f?.name ?? 'Your gladiator';
  if (isHades) {
    const lines = {
      unit91: 'I was taught that things end, Lanista. I had made my peace with it. Now I shall have to make it again. Thank you for the tithe. I think.',
      basa: 'Dark water on black stone. Then your coin rang on the altar, and I was breathing. My hands are still mine. I counted the fingers.',
      orc: 'There was a long hall with a low fire, and none of my brothers were inside it yet. Then someone yelled my name from up above and dragged me back by the collar. I\'m cold, Lanista. Pour something hot.',
      android: 'The noise in my neck stopped completely. For the first time since the frontier, I could hear every quiet thing I had ever kept, all at once. Then the door opened again. I am glad to see you, Lanista, though it was very peaceful there.',
      elf: 'My father was on the far bank. He didn\'t wave me over. He looked at me as he used to look at an officer who had left her post. So. Back to it.',
    };
    return buildNormalizedTree({
      id,
      coreId,
      fighter: f,
      title: 'Back from the Threshold of Hades',
      isQueued,
      leadText: `Wrapped in a grey wool blanket from the obsidian crypt of Hades, ${fName} takes a deep breath of courtyard air.`,
      fighterText: lines[coreId] ?? 'Back from the dark threshold, with my name still my own. It felt colder down there than the priests say, Lanista.',
      choices: [
        {
          id: 'welcome_back_hades',
          label: 'Welcome back.',
          effects: { morale: 10, trust: 10, stress: -10 },
          responseSpeaker: 'narrator',
          responseText: `${fName} pulls the wool blanket closer and nods.`,
        },
      ],
      run,
    });
  }

  // Vulcan revenant shock / hollowed companion
  const isSelfHollow = f?.kind === 'revenant' || Boolean(f?.hollowedCompanion);
  const revName = ctx?.name || 'them';
  return buildNormalizedTree({
    id,
    coreId,
    fighter: f,
    title: 'Brass and Ashes of Vulcan',
    isQueued,
    leadText: isSelfHollow
      ? `Brass cables click inside ${f?.name ?? 'the Revenant'}'s stitched collarbone as orange furnace-light glows behind their eyes.`
      : `${fName} recoils as the brass-stitched Revenant walks out of the Unnatural Temple of Vulcan.`,
    fighterText: isSelfHollow
      ? 'The forge was hot. I remember the weight of the weapon, Lanista. I do not remember why the crowd is shouting.'
      : `That is not ${revName}. It has their walk and their scars and nothing behind the eyes. You could have paid Hades, Lanista.`,
    choices: [
      {
        id: 'ack_vulcan_horror',
        label: isSelfHollow ? 'Steady your weapon. Wait for the horn.' : 'Hades was beyond our reach.',
        effects: { morale: isSelfHollow ? 0 : 2, trust: isSelfHollow ? 0 : -2, stress: -4 },
        responseSpeaker: isSelfHollow ? null : 'narrator',
        responseText: isSelfHollow
          ? 'Yes.'
          : `${fName} looks back toward the vault steps and says nothing more.`,
      },
    ],
    run,
  });
}

function isHubTopicRewardReady(run, d, topicKey) {
  if (!d) return true;
  if (topicKey === 'ask_past') return !(d.seen ?? []).includes('ask_past');
  const lastWeek = d.topicWeeks?.[topicKey];
  if (typeof lastWeek !== 'number') return true;
  return (run?.week ?? 0) - lastWeek >= 4;
}

function isStaffTopicRewardReady(run, st, topicKey) {
  if (topicKey === 'staff_trainer_informer' || topicKey === 'staff_trainer_confront') {
    return !st?.flags?.informerResolved
      && !(st?.seen ?? []).includes('staff_trainer_informer')
      && !(st?.seen ?? []).includes('staff_trainer_confront');
  }
  const last = st?.topicWeeks?.[topicKey];
  return typeof last !== 'number' || (run?.week ?? 0) - last >= 4;
}

// PLACEHOLDER: Estate staff scenes (Drillmaster Kaeso, Physician Lyra, Galen-VII) for the designer.
function buildStaffScene(run, staff, topicId) {
  const st = getStaffState(run, staff.staffKey, false);
  const resolvedTopic = resolveStaffTopicKey(staff.staffKey, topicId);
  const ready = (key) => isStaffTopicRewardReady(run, st, key);
  const hasVaelen = Boolean(run?.roster?.some((x) => x.coreId === 'elf'));
  const hasSolace = Boolean(run?.roster?.some((x) => x.coreId === 'android'));
  const plotActive = Boolean(run?.plot && !run.plot.ended);

  if (staff.staffKey === 'trainer') {
    if (isTrainerDismissed(run)) {
      return buildNormalizedTree({
        id: topicId === 'hub' ? 'hub' : resolvedTopic,
        coreId: 'trainer',
        fighter: staff,
        title: 'Trainer Room · Post Vacant',
        isQueued: false,
        leadText: 'The weighted wooden rudis lies where Drillmaster Kaeso left it on the bench.',
        fighterSpeaker: 'narrator',
        fighterSpeakerName: '',
        fighterText: 'Drillmaster Kaeso has been dismissed; the post is vacant for now.',
        choices: [],
        run,
      });
    }
    if (resolvedTopic === 'staff_trainer_informer') {
      return buildNormalizedTree({
        id: 'staff_trainer_informer',
        coreId: 'trainer',
        fighter: staff,
        title: 'Late-Night Tallies',
        isQueued: true,
        leadText: 'After dusk, you find Drillmaster Kaeso by the weapon racks with a wax tablet and a fresh stylus.',
        fighterText: 'Shut the door, Lanista. The Prefect has had a file on me for thirty years and a runner at our gate every month. I send him drill tallies. Who trained, who limped. He has not yet asked me a question I had to answer honestly.',
        choices: [
          {
            id: 'turn_trainer_double',
            label: 'Keep writing. I\'ll tell you what to put.',
            effects: { suspicion: -3, plotTrust: 1, trust: 6, informerResolved: 'turned', loreFlag: 'trainer_turned_ally' },
            responseSpeaker: 'narrator',
            responseText: 'Kaeso stares at the wax for a second, then wipes the last line clean with his thumb. "Give me dull numbers, Lanista. Crassinus trusts dull numbers."',
          },
          {
            id: 'silence_trainer',
            label: 'Burn it. You write nothing from tonight.',
            effects: { suspicion: 3, trust: 4, informerResolved: 'silenced' },
            responseSpeaker: 'narrator',
            responseText: 'He holds the tablet over the brazier until the wax runs flat. "Done. When the runner comes back empty-handed, Crassinus will ask why. That part is yours."',
          },
          {
            id: 'dismiss_trainer',
            label: 'Pack your kit, Kaeso.',
            effects: { suspicion: -6, dismissTrainerWeeks: 4, informerResolved: 'dismissed' },
            responseSpeaker: 'narrator',
            responseText: 'He lays his wooden rudis on the bench without arguing. "Thirty years of taking orders, and you sound just like the others. The posts are oiled. Find somebody else to count the rounds."',
          },
          {
            id: 'lore_trainer_vow',
            label: hasVaelen
              ? 'The broken chain is on our gate, Kaeso. You know who is in this yard.'
              : 'The broken chain is on our gate, Kaeso. Choose your side.',
            when: (r) => (r?.loreRead ?? []).includes('rebellion:mark'),
            lockReason: 'Requires Codex: The Brand of the Rising',
            effects: { suspicion: -2, plotTrust: 2, trust: 8, informerResolved: 'turned', loreFlag: 'trainer_turned_ally' },
            responseSpeaker: 'narrator',
            responseText: hasVaelen
              ? 'The old drillmaster touches the burned-over brand on his forearm. "I carried a standard on the frontier before the purge. If Vaelen is still standing under this roof, I am done writing tallies for the Prefect."'
              : 'The old drillmaster touches the burned-over brand on his forearm. "They sold what was left of us to the ludi and thought that finished it. I will write what you give me, Lanista, and keep my mouth shut."',
          },
        ],
        run,
      });
    }
    if (resolvedTopic === 'staff_trainer_fighters') {
      const names = (run?.roster ?? []).map((x) => x.name).join(', ');
      return buildNormalizedTree({
        id: 'staff_trainer_fighters',
        coreId: 'trainer',
        fighter: staff,
        title: 'State of the Yard',
        isQueued: false,
        leadText: 'Drillmaster Kaeso leans on a weighted wooden rudis and looks across the sand yard.',
        fighterText: names
          ? `We have ${names} on the rolls. Heavy shields hold their ground when the other side rushes; boxers and fire-eaters want to crowd in close; archers keep their distance; net-fighters and thorn-blades wait for an opening. Put them to the work that suits their hands, not the other way round.`
          : 'An empty yard, Lanista. Hire someone who can hold a post before the next card.',
        choices: [
          {
            id: 'ack_trainer_roster',
            label: 'Keep their footwork sharp.',
            effects: ready('staff_trainer_fighters') ? { trust: 3, staffRosterMorale: 2 } : {},
            responseText: 'Leave the sweat to me, Lanista. Just don\'t send them out exhausted when the horn blows.',
          },
        ],
        run,
      });
    }
    if (resolvedTopic === 'staff_trainer_past') {
      return buildNormalizedTree({
        id: 'staff_trainer_past',
        coreId: 'trainer',
        fighter: staff,
        title: 'The Frontier Standard',
        isQueued: false,
        leadText: 'Kaeso rolls up his sleeve to adjust a leather wrist-brace, showing a burned-over legion brand.',
        fighterText: 'I carried a standard on the frontier. Then the Prefect went through the officers, and those of us left over were sold as drillmasters. Your predecessor bought my deed with the posts. I teach them to yield first. Nobody taught us.',
        choices: [
          {
            id: 'ack_trainer_past',
            label: 'You aren\'t a piece of timber, Kaeso.',
            effects: ready('staff_trainer_past') ? { trust: 4, loreFlag: 'trainer_rising_heard' } : { loreFlag: 'trainer_rising_heard' },
            responseSpeaker: 'narrator',
            responseText: 'He pulls the sleeve back down. "The deed in your strongbox says different, Lanista. Still. Thank you."',
          },
          {
            id: 'cold_trainer_past',
            label: 'Keep your mind on the yard.',
            effects: { loreFlag: 'trainer_rising_heard' },
            responseText: 'Always do.',
          },
        ],
        run,
      });
    }
    // Default / staff_trainer_regimen / hub
    return buildNormalizedTree({
      id: topicId === 'hub' ? 'hub' : 'staff_trainer_regimen',
      coreId: 'trainer',
      fighter: staff,
      title: 'Trainer Room · Drillmaster Kaeso',
      isQueued: false,
      leadText: 'In the sand yard of the Trainer Room, Drillmaster Kaeso strikes the iron pells to set the cadence.',
      fighterText: 'The posts are new. The fighters are not. Give me anyone you can spare for a week and I\'ll give them back sore and slightly harder to kill.',
      choices: [
        {
          id: 'rally_trainees',
          label: 'Run a live sparring drill.',
          effects: ready('staff_trainer_regimen') ? { trust: 3, staffTraineeMorale: 3, staffTraineeStress: -3 } : {},
          responseText: 'Shields up, chins down. You heard the Lanista. Move your feet.',
        },
      ],
      run,
    });
  }

  if (staff.staffKey === 'doctor') {
    if (resolvedTopic === 'staff_doctor_spike') {
      return buildNormalizedTree({
        id: 'staff_doctor_spike',
        coreId: 'doctor',
        fighter: staff,
        title: 'Infirmary Notes',
        isQueued: false,
        leadText: 'Physician Lyra sets a clean iron probe beside the Medbay lamp.',
        fighterText: hasSolace
          ? 'The palace smiths put it in at the top of Solace-4\'s neck. It wakes when he is frightened. I can quieten it once this room is better fitted out, though Galen-VII keeps insisting his ancient manuals know better. I can\'t take it out. And if one of yours dies, Lanista, go to Hades. I have seen what Vulcan sends back.'
          : 'If one of yours dies on the sand, Lanista, go to the priests of Hades before the month turns. I have seen what Vulcan sends back from that vault forge. And pay no attention to Galen-VII when he offers to stitch a wound; a steward with a tally-stick is not a physician.',
        choices: [
          {
            id: 'ack_doctor_spike',
            label: 'We will keep our people out of Vulcan\'s furnace.',
            effects: ready('staff_doctor_spike') ? { trust: 4, loreFlag: 'doctor_crucible_brief' } : { loreFlag: 'doctor_crucible_brief' },
            responseText: 'Good. I became a surgeon to mend living flesh, not to patch brass.',
          },
        ],
        run,
      });
    }
    if (resolvedTopic === 'staff_doctor_stranger') {
      if (!plotActive) {
        return buildNormalizedTree({
          id: 'staff_doctor_stranger',
          coreId: 'doctor',
          fighter: staff,
          title: 'A Matter of Credentials',
          isQueued: false,
          leadText: 'Physician Lyra wipes down her bone-saw with vinegar and glances toward the roof stairs.',
          fighterText: 'Your construct told me this morning that he retains medical routines from before the Empire. I told him I retain a hammer. If a fighter comes back bleeding, send them to my cots, Lanista, not to the man who counts our turnips.',
          choices: [
            {
              id: 'ack_doctor_tip',
              label: 'The infirmary is yours, Lyra.',
              effects: ready('staff_doctor_stranger') ? { trust: 3 } : {},
              responseText: 'See that he remembers it.',
            },
          ],
          run,
        });
      }
      const hidden = Boolean(run?.plot?.hidden);
      return buildNormalizedTree({
        id: 'staff_doctor_stranger',
        coreId: 'doctor',
        fighter: staff,
        title: hidden ? 'The Back Cot' : 'After Curfew',
        isQueued: false,
        leadText: 'Physician Lyra lowers her voice and draws the linen curtain across the alcove.',
        fighterText: hidden
          ? 'The courier you hid in my back cot will live. The blade missed the deep vessel in the thigh by a thumb\'s breadth. They always suspect the physician when word leaks, because I buy poppy and silk at the basilica. Watch who writes after curfew, Lanista. It is not me.'
          : 'They always suspect the physician. I buy poppy and silk at the basilica, so I must be selling something back. Watch who writes after curfew, Lanista. It is not me.',
        choices: [
          {
            id: 'ack_doctor_tip',
            label: 'I will watch the yard after curfew.',
            effects: ready('staff_doctor_stranger')
              ? { trust: 4, ...(hidden ? { suspicion: -3 } : {}), loreFlag: 'doctor_suspects_trainer' }
              : { loreFlag: 'doctor_suspects_trainer' },
            responseText: 'Nobody searches behind my curtains while I hold a knife, Lanista.',
          },
        ],
        run,
      });
    }
    // Default / staff_doctor_wounds / hub
    const hurtCount = (run?.roster ?? []).filter((x) => (x.injuries?.length ?? 0) > 0).length;
    return buildNormalizedTree({
      id: topicId === 'hub' ? 'hub' : 'staff_doctor_wounds',
      coreId: 'doctor',
      fighter: staff,
      title: 'Medbay · Physician Lyra',
      isQueued: false,
      leadText: 'In the herb-scented quiet of the Medbay, Physician Lyra lays out boiled linen and bronze forceps.',
      fighterText: `${hurtCount === 0 ? 'No one' : hurtCount} in the cots this week. I stitch what comes back, Lanista. Send out someone already twice hurt and there may be nothing to stitch.`,
      choices: [
        {
          id: 'soothe_patients',
          label: 'Make the rounds with willow-bark tea.',
          effects: ready('staff_doctor_wounds') ? { trust: 4, staffMedbayStress: -5, staffMedbayMorale: 3 } : {},
          responseText: 'Clean linen and a quiet night. That does half my work for me.',
        },
      ],
      run,
    });
  }

  // Steward Galen-VII ('steward')
  if (resolvedTopic === 'staff_steward_cast') {
    return buildNormalizedTree({
      id: 'staff_steward_cast',
      coreId: 'steward',
      fighter: staff,
      title: 'The Complaint Files',
      isQueued: false,
      leadText: 'Inside his tidy quarters above the colonnade, Galen-VII taps a thin stack of wax tablets.',
      fighterText: 'I keep a file on each of them. It is mostly complaints. Unit-91\'s are about noise, Tarek\'s are about bars, and Varok\'s are about not being asked. You might read them before you buy furniture.',
      choices: [
        {
          id: 'ack_steward_dossier',
          label: 'Keep the files up to date.',
          effects: ready('staff_steward_cast') ? { trust: 5, loreFlag: 'steward_unit91_brief' } : { loreFlag: 'steward_unit91_brief' },
          responseText: 'I always do, Lanista. Whether anyone listens is between you and the upholsterer.',
        },
      ],
      run,
    });
  }
  if (resolvedTopic === 'staff_steward_aria') {
    return buildNormalizedTree({
      id: 'staff_steward_aria',
      coreId: 'steward',
      fighter: staff,
      title: 'A Noise Above the Colonnade',
      isQueued: false,
      leadText: 'Galen-VII sets down his stylus and folds his bronze hands over the ledger.',
      fighterText: hasSolace
        ? 'Solace-4 has been talking. It is a diagnostic. It happens to have a tune.'
        : 'If you heard something above the colonnade last night, Lanista, it was a diagnostic. It happens to have a tune.',
      choices: [
        {
          id: 'encourage_steward_aria',
          label: 'Carry on with your diagnostics, Galen-VII.',
          effects: ready('staff_steward_aria') ? { trust: 4, staffRosterMorale: 2, loreFlag: 'steward_aria_encouraged' } : { loreFlag: 'steward_aria_encouraged' },
          responseSpeaker: 'narrator',
          responseText: 'He inclines his head once. "Very good, Lanista. Now, if we might return to the grain bill."',
        },
      ],
      run,
    });
  }
  // Default / staff_steward_ledger / hub
  const favLoan = run?.favorDebt?.owed ? `${run.favorDebt.owed} Gold owed to Censor Gallo` : 'no active Palatine loan';
  const houseLoans = (run?.houses ?? []).filter((h) => h.debt?.owed > 0).map((h) => `${h.debt.owed}g to ${h.name}`).join(', ') || 'no rival house liens';
  return buildNormalizedTree({
    id: topicId === 'hub' ? 'hub' : 'staff_steward_ledger',
    coreId: 'steward',
    fighter: staff,
    title: 'Steward\'s Quarters · Ledger Review',
    isQueued: false,
    leadText: 'In the Steward\'s Quarters, Galen-VII taps his brass stylus against a neatly balanced column of figures.',
    fighterText: `Treasury stands at ${run?.gold ?? 0} Gold, with Imperial Favour at ${run?.favor ?? 50}. Debt audit: ${favLoan}; ${houseLoans}. Censor Gallo checks the books every month and collects Winter Tribute at year's end.`,
    choices: [
      {
        id: 'ack_steward_ledger',
        label: 'Keep the ledgers balanced.',
        effects: ready('staff_steward_ledger') ? { trust: 3 } : {},
        responseText: 'The Censor counts it monthly. I count it nightly. One of us enjoys it.',
      },
    ],
    run,
  });
}

// PLACEHOLDER: Idle hub and companion topic scenes (ask_arena, ask_room, ask_past) for the designer.
function buildHubOrTopicScene(run, f, coreId, topicId) {
  const staff = getStaffActor(f);
  if (staff) return buildStaffScene(run, staff, topicId);

  const topTier = run?.topTier ?? 1;
  const aName = arenaLabel(topTier);
  const aMid = arenaLabelMid(topTier);
  const fName = f?.name ?? 'Your gladiator';
  const ks = evaluateKeepsake(f);
  const d = isPlainObject(f?.dialogue) ? f.dialogue : createDialogueState(coreId);

  if (topicId === 'ask_arena') {
    const rewardReady = isHubTopicRewardReady(run, d, 'ask_arena');
    const lines = {
      unit91: `${aName}. The hot-tempered ones spend themselves in the first round, so guard and let them. The calm ones wait for you to commit, so show them a false start. Humans are not complicated.`,
      basa: `In ${aMid} you can read a fighter's temper from how they set their back foot, before the trumpet has finished. Put an Oracle on the roof and I'll read it sooner. I wish I found it harder.`,
      orc: `${aName}. Good sand, loud stands, and purses heavy enough to clink. Keep me drilling or send me into the main bout, Lanista. My hands are itching.`,
      android: `In ${aMid}, fighters swing harder as their fear of the Death Gate grows. Keep clean bandages and salts in the storeroom so we do not panic when they do.`,
      elf: `${aName} is one rung on the ladder to the Imperial box. Don't send the same fighter every month, or the rival houses will study their habits. Keep your best blade fresh for the Boss.`,
    };
    // 8.0.1 PLACEHOLDER: an arena reading for each kind of auxiliary (the generic line stays as the last fallback).
    const auxArena = {
      human: `${aName}. Same dust, louder crowd. Keep our gear mended and we'll bring the purse back.`,
      basa: `${aName} rewards footwork more than reach. Watch how their back heel turns before they swing.`,
      orc: `${aName} smells of iron and cheap wine. Good sand for earning stripes, Lanista.`,
      android: `The stands in ${aName} shout loudest when someone is tired. Send us rested, Lanista.`,
      elf: `${aName} is loud, though the coin spends well enough. Keep us sharp for the Boss.`,
      vampire: `Too much noon glare in ${aName}. Finish the bout in two rounds and leave the sun to the crowd.`,
    };
    return buildNormalizedTree({
      id: 'ask_arena',
      coreId,
      fighter: f,
      title: `On ${aMid}`,
      isQueued: false,
      leadText: `You ask ${fName} for their reading of ${aMid}.`,
      fighterText: lines[coreId] ?? auxArena[f?.kind] ?? `${aName}. Don't send us out tired, Lanista, and we'll bring the purse home.`,
      choices: [
        {
          id: 'back_to_yard',
          label: 'Stay ready for fight day.',
          effects: rewardReady ? { morale: 2, trust: 2 } : {},
          responseSpeaker: 'narrator',
          responseText: `${fName} goes back to the ring without looking round.`,
        },
      ],
      run,
    });
  }

  if (topicId === 'ask_room') {
    const rewardReady = isHubTopicRewardReady(run, d, 'ask_room');
    const highTrust = (d.trust ?? 0) >= 8;
    const roomAwakened = {
      unit91: 'No smoke, no bones, and the Rock Garden raked straight. My quarters are quiet enough to sleep on my back.',
      basa: 'The Bathhouse steam, the Rock Garden beside it, and not a bar in sight. It sounds like the reef at home.',
      orc: 'The Shrine of Mars in the corner and my War Banner on the wall. Even my eldest brother would take his helmet off in here.',
      android: 'The Bird singing beside the quiet corner keeps the spike dull after a bout. That is enough.',
      elf: 'The Whetstone Rack beside the Fire Brazier, and none of the palace\'s wine. It smells like my father\'s winter tent.',
    };
    const roomHintLow = {
      unit91: 'Human barracks smell of torch-smoke and sour wine. I want a room with nothing burning and nothing dead in it.',
      basa: 'Every trainer thinks a Basa wants bars in his room. What I want is water, and something still to look at, so I can stop hearing Latin in my head.',
      orc: 'Bare plaster suits a debtor, not a son of Clan Varg. A room should show a man\'s colours and give him somewhere proper to pour salt to the war-god.',
      android: 'After a bout the spike is loud in an empty cell. I would like something small and alive to listen to, far from sharp steel or old bones.',
      elf: 'They served sweet Palatine wine at the banquet after my father\'s execution. I won\'t have it near me, nor anything with bars.',
    };
    const roomHintHigh = {
      unit91: 'On the station we kept quiet stone and raked gravel where a person could hear themselves breathe. No open flame, no old bones, no wine jars. That is all.',
      basa: 'Give me warm steam and quiet raked stone, Lanista, and keep anything with iron bars out of my doorway. I will sleep better for it.',
      orc: 'Cloth with our colours on the wall, an altar to the war-god in the corner, and a bed a man can actually sleep on without poking holes in his back. Then you will see me march out.',
      android: 'A living creature with wings, beside a quiet patch of stone or an altar, and nothing sharp or dead staring at my alcove. Then the red noise fades.',
      elf: 'A stone to sharpen steel on and an open coal-fire to warm my hands, with no sweet wine jars and no cages. That is all an officer needs.',
    };
    const text = (ks.active ? roomAwakened[coreId] : (highTrust ? roomHintHigh[coreId] : roomHintLow[coreId]))
      ?? 'Something of my own in the room, Lanista. It needn\'t be much. You fight differently with something to come back to.';
    return buildNormalizedTree({
      id: 'ask_room',
      coreId,
      fighter: f,
      title: 'Their Quarters',
      isQueued: false,
      leadText: `You ask ${fName} how they find their quarters.`,
      fighterText: text,
      choices: [
        {
          id: 'note_room_clue',
          label: 'I\'ll keep that in mind.',
          effects: rewardReady ? { morale: 2, trust: 3, loreFlag: `${coreId || 'aux'}_room_hint_heard` } : { loreFlag: `${coreId || 'aux'}_room_hint_heard` },
          responseSpeaker: 'narrator',
          responseText: `${fName} nods once and returns to their bench.`,
        },
      ],
      run,
    });
  }

  if (topicId === 'ask_past') {
    const rewardReady = isHubTopicRewardReady(run, d, 'ask_past');
    const trusted = (d.trust ?? 0) >= 10;
    const pastGuarded = {
      unit91: 'I was the ninety-first human child the Coalition took in. They were kind. Then your fleet came. That is the past, Lanista. I do not see what you would do with more of it.',
      basa: 'Salt-Reach. Boats, nets, a father who bows to every clerk with a wax tablet, and a head full of Elven arithmetic I never asked for. That is enough for one afternoon.',
      orc: 'Fourth son of Clan Varg. The first took the land, the second took the legion, the third took the priesthood. I signed my own paper for Palatina. Nobody dragged me here.',
      android: 'I sat with the dying, Lanista, and afterwards with those they left. It was good work. Then our transport was taken, and the smiths drove brass into my neck. I keep the rest for quieter rooms.',
      elf: 'A burned house above the aqueducts and a name nobody prints on invitations any more. You bought the sword, Lanista, not the genealogy.',
    };
    const pastDeep = {
      unit91: 'The machines who raised me never shouted. When they broke a cup they swept it up and moved on. Humans shout at the cup and then keep the shards. I still miss the quiet.',
      basa: 'The old Elves bred cleverness into my bloodline like they pruned citrus trees. My uncles think it ruins a man for the tide, and half my people play dull just to be left alone. Sometimes I hate them for it. Sometimes I think they are right.',
      orc: 'My father tells the young ones the blood-salts make us brave. My uncle came back from the Rim unable to hold a spoon steady, and still stood up whenever an eagle passed. I don\'t know which part of me is Clan Varg and which part came out of a ration tin.',
      android: 'In the Choir we trade memories of things that only happen once: a child laughing, rain on warm bronze. You rush past days like that here, Lanista. Try keeping one before it is over.',
      elf: 'My grandmother ruled a spire before your Emperor was a rumour. My father served the man who pulled it down, and was strangled anyway. A Basa fisherwoman hid me under the nets in her salt-shed for four months and would not take a ring. I know which of them I would rather take after.',
    };
    // 8.0.1 PLACEHOLDER: auxiliaries answer for their kind. These lines assert nothing beyond the kind backstories in
    // src/voices.js (BACKSTORIES) and never name a companion's home, so the lore keeps one source.
    const auxPastGuarded = {
      human: 'The lower aqueduct wards, under the marble. We owe the Censor like everyone else. That is most of it.',
      basa: 'The tidal coast. My people went back to the sea after the Revolution. I would rather not make a story of it.',
      orc: 'A rim-world clan. We burn the salt, we drink to the Princeps, we fight. That is most of the scroll.',
      android: 'A Coalition transport, taken at the border. The spike in my neck does the rest of the explaining.',
      elf: 'My house kept the silver cedar vaults until your Revolution. The hall has no roof now. I would rather leave it there.',
      vampire: 'A tide-locked province on the rim. Black spires, cold wine, a long night. I was part of the tribute.',
    };
    const auxPastDeep = {
      human: 'My forefather marched with Silbannacus. Three hundred years on, I march where you point. I try not to ask which of us got the better bargain.',
      basa: 'After the Revolution my elders burned the Elven tablets on the beach and went back to the sea. I can still read a current. Sand gives the same warnings, only later.',
      orc: 'The Principate handed my grandfathers eagles and an arena and called it an honour. If I fall, my house collects the Blood Faith annuity. I would rather they went without.',
      android: 'In the Choir we kept recordings of things that happen once. I have kept a few from this yard. I did not expect to.',
      elf: 'We count in centuries, Lanista. A season on the sand is an evening to me.',
      vampire: 'We paid Palatina in second sons and debtors. I was on the list. I do not hold it against the list.',
    };
    const text = (trusted ? pastDeep[coreId] : pastGuarded[coreId])
      ?? (trusted ? auxPastDeep[f?.kind] : auxPastGuarded[f?.kind])
      ?? 'Not much to tell, Lanista. I had a life, and then I had this one. Ask me again when I\'ve won something.';
    return buildNormalizedTree({
      id: 'ask_past',
      coreId,
      fighter: f,
      title: trusted ? `${fName}: Deeper Memory` : `${fName}: Their Past`,
      isQueued: false,
      leadText: `In a quiet hour between drills, ${fName} answers your question.`,
      fighterText: text,
      choices: [
        {
          id: 'honour_past',
          label: 'Thank you for telling me.',
          effects: rewardReady ? { morale: 2, trust: 3 } : {},
          responseText: 'Back to work, then, Lanista.',
        },
        {
          id: 'keep_eyes_sand',
          label: 'Keep your mind on the sand.',
          effects: rewardReady ? { stress: -2 } : {},
          responseText: 'I always do.',
        },
      ],
      run,
    });
  }

  // Idle Hub ('hub')
  const isStuck = isStuckFollowupReady(run, d, topTier);
  const hubGreeting = {
    unit91: isStuck
      ? `Still ${aMid}, Lanista. Say what you need.`
      : 'Lanista. You want something. Humans generally do.',
    basa: isStuck
      ? `Still pacing the same stones in ${aMid}, Lanista. What is it?`
      : `Lanista. I was just looking over the matchups for ${aMid}. What is on your mind?`,
    orc: isStuck
      ? `Still waiting to get out of ${aMid}, Lanista. What's the word?`
      : 'Lanista. Taking a walk through the yard? Say the word and I\'m ready for the sand.',
    android: isStuck
      ? `Still ${aMid}, Lanista. How may I help today?`
      : 'Peace to you, Lanista. My spike is quiet today. What would you like to speak of?',
    elf: isStuck
      ? `Still penned inside ${aMid}, Lanista. Tell me we have a plan.`
      : 'Lanista. The guards are out of earshot. Speak freely.',
  };
  // 8.0.1 PLACEHOLDER: two more greetings per companion, chosen from state this scene already reads (no RNG). Low
  // spirits come first (Morale under 40, the Discontented line in src/data.js); earned trust (10, as in "ask_past")
  // takes every other week, so the first greeting still turns up.
  const hubLow = !isStuck && (f?.morale ?? 50) < 40;
  const hubTrusted = !isStuck && !hubLow && (d.trust ?? 0) >= 10 && (run?.week ?? 0) % 2 === 1;
  const hubMood = hubLow
    ? {
        unit91: 'Lanista. The cot is hard and the food is grey. I am not complaining. I am reporting.',
        basa: 'Lanista. I have counted the cracks in that wall twice. Ask me something harder.',
        orc: 'Lanista. The yard is too quiet, and so am I. Give me something to hit.',
        android: 'Lanista. The spike has been loud this week. I would be glad of a quiet word.',
        elf: 'Owner. If you have come to inspect the stock, be brief.',
      }
    : hubTrusted
      ? {
          unit91: 'Lanista. You came back. I had allowed for that.',
          basa: 'Lanista. Sit, if you like. I have been doing sums nobody asked for again.',
          orc: 'Ha. Lanista. Come to see how a fourth son earns his keep?',
          android: 'Peace to you, Lanista. I kept this morning for you. It was a good one.',
          elf: 'Lanista. I had hoped it was you and not the steward. Speak.',
        }
      : null;

  const hubChoices = [];
  if (isStuck) {
    const nextStage = Math.min(3, (d.stuck?.stage ?? 1) + 1);
    const stuckTree = buildStuckScene(run, f, coreId, topTier, nextStage, false);
    const primaryStuckEffects = { ...(stuckTree.choices?.[0]?.effects ?? {}) };
    hubChoices.push({
      id: 'stuck_check',
      label: `We're still stuck in ${aMid}.`,
      effects: primaryStuckEffects,
      responseText: stuckTree.nodes.n2.text,
    });
  }
  if (run?.summons) {
    const sumReady = isHubTopicRewardReady(run, d, 'summons_before');
    hubChoices.push({
      id: 'summons_before',
      label: 'Discuss the upcoming Imperial Summons.',
      effects: sumReady ? { stress: -6, trust: 4 } : {},
      responseText: buildSummonsScene(run, f, coreId, 'before', {}, false).nodes.n2.text,
    });
  }
  hubChoices.push(
    {
      id: 'ask_arena',
      label: `Ask about ${aMid}.`,
      effects: isHubTopicRewardReady(run, d, 'ask_arena') ? { morale: 2, trust: 2 } : {},
      responseText: buildHubOrTopicScene(run, f, coreId, 'ask_arena').nodes.n2.text,
    },
    {
      id: 'ask_room',
      label: 'Ask about their quarters.',
      effects: isHubTopicRewardReady(run, d, 'ask_room') ? { morale: 2, trust: 3, loreFlag: `${coreId || 'aux'}_room_hint_heard` } : { loreFlag: `${coreId || 'aux'}_room_hint_heard` },
      responseText: buildHubOrTopicScene(run, f, coreId, 'ask_room').nodes.n2.text,
    },
    {
      id: 'ask_past',
      label: 'Ask about their past.',
      effects: isHubTopicRewardReady(run, d, 'ask_past') ? { morale: 2, trust: 3 } : {},
      responseText: buildHubOrTopicScene(run, f, coreId, 'ask_past').nodes.n2.text,
    },
  );

  // 8.0.1 PLACEHOLDER: a greeting for each kind of auxiliary (the generic lines stay as the last fallback).
  const auxHub = {
    human: isStuck ? `Still chewing the same dust in ${aMid}, Lanista. What's the plan?` : 'Boots laced and kit checked, Lanista. What do you need?',
    basa: isStuck ? `Same card in ${aMid}, month after month. Give me a fresh angle, Lanista.` : 'Quiet hour in the yard, Lanista. What is on the ledger?',
    orc: isStuck ? `Still waiting for a proper fight out of ${aMid}, Lanista.` : 'Lanista. Point me at the pell or point me at the tunnel.',
    android: isStuck ? `We have lingered in ${aMid}, Lanista. How may I be of use?` : 'A quiet morning, Lanista. My spike is steady. What do you need?',
    elf: isStuck ? `Still stalled in ${aMid}, Lanista. Surely we can do better than this.` : 'The yard is tolerably clean today, Lanista. Speak.',
    vampire: isStuck ? `Still stuck in ${aMid}, Lanista, and the light does not improve. What are the orders?` : 'Keep it brief, Lanista; the shade is shrinking.',
  };

  return buildNormalizedTree({
    id: 'hub',
    coreId,
    fighter: f,
    title: `Speak with ${fName}`,
    isQueued: false,
    leadText: `You step into the yard to speak with ${fName}.`,
    fighterText: hubMood?.[coreId] ?? hubGreeting[coreId] ?? auxHub[f?.kind] ?? (isStuck ? `We are still trying to break out of ${aMid}, Lanista. What are your orders?` : 'What\'s the word, Lanista? I\'m ready for whatever the next card brings.'),
    choices: hubChoices,
    run,
  });
}

// ---------- Main Resolver & Choice Applicator ----------

export function resolveDialogueTree(run, f, sceneId = null) {
  const staff = getStaffActor(f);
  if (staff) {
    let defaultStaffScene = 'hub';
    if (!sceneId) {
      const queuedStaff = getHubTopics(run, staff)
        .filter((t) => t.queued)
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      if (queuedStaff.length) defaultStaffScene = queuedStaff[0].scene;
    }
    const cleanStaffScene = normalizeSceneId(sceneId || defaultStaffScene);
    return buildStaffScene(run, staff, cleanStaffScene);
  }
  const fighter = typeof f === 'string'
    ? (run?.roster?.find((x) => x.id === f || x.coreId === f) ?? run?.fallen?.find((x) => x.id === f) ?? { id: f, name: f })
    : (f ?? { id: 'f1', name: 'Gladiator' });
  const coreId = fighter?.coreId ?? fighter?.hollowedCompanion ?? (Object.hasOwn(CORE_COMPANIONS, fighter?.id) ? fighter.id : null);
  const d = isPlainObject(fighter?.dialogue) ? fighter.dialogue : createDialogueState(coreId);
  const queue = safeQueue(d);

  let targetId = sceneId;
  let queuedItem = null;
  if (!targetId) {
    if (queue.length) {
      queuedItem = queue[0];
      targetId = queuedItem?.id ?? 'hub';
    } else {
      targetId = 'hub';
    }
  } else if (queue.length) {
    queuedItem = queue.find((q) => normalizeSceneId(q?.id) === normalizeSceneId(targetId)) ?? null;
  }

  const cleanId = normalizeSceneId(targetId);
  const ctx = queuedItem?.ctx ?? {};
  const isQueued = Boolean(queuedItem);

  if (fighter?.kind === 'revenant' && cleanId !== 'hades_revived') {
    return buildHadesOrVulcanScene(run, fighter, coreId, false, isQueued, cleanId || 'vulcan_revenant_shock', ctx);
  }

  if (cleanId === 'first_fight_win') return buildFirstFightScene(run, fighter, coreId, true, ctx, isQueued);
  if (cleanId === 'first_fight_loss') return buildFirstFightScene(run, fighter, coreId, false, ctx, isQueued);

  if (cleanId === 'stuck_check') {
    const tier = run?.topTier ?? d.stuck?.tier ?? 1;
    const nextStage = Math.min(3, Math.max(1, (d.stuck?.stage ?? 0) + 1));
    return buildStuckScene(run, fighter, coreId, tier, nextStage, isQueued);
  }
  const stuckMatch = cleanId.match(/^stuck_t(\d+)_stage(\d+)$/);
  if (stuckMatch) {
    return buildStuckScene(run, fighter, coreId, Number(stuckMatch[1]), Number(stuckMatch[2]), isQueued);
  }

  const tourneyWinMatch = cleanId.match(/^tourney_win_t(\d+)$/);
  if (tourneyWinMatch) return buildTourneyScene(run, fighter, coreId, true, Number(tourneyWinMatch[1]), ctx, isQueued);
  const tourneyLossMatch = cleanId.match(/^tourney_loss_t(\d+)$/);
  if (tourneyLossMatch) return buildTourneyScene(run, fighter, coreId, false, Number(tourneyLossMatch[1]), ctx, isQueued);

  const champMatch = cleanId.match(/^crowned_champion(?:_t(\d+))?$/);
  if (champMatch) return buildCrownedChampionScene(run, fighter, coreId, Number(champMatch[1] || (run?.topTier ?? 1)), ctx, isQueued);

  if (cleanId === 'peer_crowned_already_champ') return buildPeerCrownedScene(run, fighter, coreId, true, ctx, isQueued);
  if (cleanId === 'peer_crowned_not_champ') return buildPeerCrownedScene(run, fighter, coreId, false, ctx, isQueued);
  if (cleanId === 'peer_crowned') return buildPeerCrownedScene(run, fighter, coreId, (fighter?.titles?.length ?? 0) > 0, ctx, isQueued);

  if (cleanId === 'summons_before') return buildSummonsScene(run, fighter, coreId, 'before', ctx, isQueued);
  if (cleanId === 'summons_after_win') return buildSummonsScene(run, fighter, coreId, 'after_win', ctx, isQueued);
  if (cleanId === 'summons_after_survive') return buildSummonsScene(run, fighter, coreId, 'after_survive', ctx, isQueued);
  if (cleanId === 'summons_after_loss') return buildSummonsScene(run, fighter, coreId, 'after_loss', ctx, isQueued);
  if (cleanId === 'summons_after_ally_died') return buildSummonsScene(run, fighter, coreId, 'after_ally_died', ctx, isQueued);

  if (cleanId.startsWith('suspicion_')) {
    const levelKey = cleanId.replace('suspicion_', '');
    return buildSuspicionScene(run, fighter, coreId, levelKey, isQueued);
  }

  if (cleanId === 'rebel_call_accepted') return buildRebelScene(run, fighter, coreId, 'call_accepted', isQueued);
  if (cleanId === 'rebel_call_refused') return buildRebelScene(run, fighter, coreId, 'call_refused', isQueued);
  if (cleanId === 'rebel_call_betrayed') return buildRebelScene(run, fighter, coreId, 'call_betrayed', isQueued);
  if (cleanId === 'rebel_orc_elf_schism') return buildRebelScene(run, fighter, coreId, 'orc_elf_schism', isQueued);

  if (cleanId.startsWith('building_built_') || cleanId.startsWith('room_decor_placed_')) {
    return buildBuildingOrDecorScene(run, fighter, coreId, cleanId, ctx, isQueued);
  }

  if (cleanId.startsWith('want_asked_')) return buildWantScene(run, fighter, coreId, 'asked', cleanId.replace('want_asked_', ''), ctx, isQueued);
  if (cleanId.startsWith('want_fulfilled_')) return buildWantScene(run, fighter, coreId, 'fulfilled', cleanId.replace('want_fulfilled_', ''), ctx, isQueued);
  if (cleanId.startsWith('want_refused_')) return buildWantScene(run, fighter, coreId, 'refused', cleanId.replace('want_refused_', ''), ctx, isQueued);

  if (cleanId.startsWith('bond_formed_')) return buildBondScene(run, fighter, coreId, false, cleanId.replace('bond_formed_', ''), ctx, isQueued);
  if (cleanId.startsWith('bond_grief_')) return buildBondScene(run, fighter, coreId, true, cleanId.replace('bond_grief_', ''), ctx, isQueued);

  if (cleanId === 'mercy_kill_ordered') return buildMercyScene(run, fighter, coreId, true, ctx, isQueued);
  if (cleanId === 'mercy_spare_streak') return buildMercyScene(run, fighter, coreId, false, ctx, isQueued);

  if (cleanId === 'hades_revived') return buildHadesOrVulcanScene(run, fighter, coreId, true, isQueued, null, ctx);
  if (cleanId === 'vulcan_revenant_shock') return buildHadesOrVulcanScene(run, fighter, coreId, false, isQueued, null, ctx);

  return buildHubOrTopicScene(run, fighter, coreId, cleanId);
}

const STAFF_NUMERIC_EFFECT_KEYS = [
  'trust', 'suspicion', 'plotTrust', 'staffTraineeMorale', 'staffTraineeStress',
  'staffMedbayStress', 'staffMedbayMorale', 'staffRosterMorale', 'dismissTrainerWeeks',
];

const FIGHTER_NUMERIC_EFFECT_KEYS = [
  'morale', 'stress', 'trust', 'xp', 'renown', 'favor', 'gold', 'plotTrust', 'suspicion',
];

export function applyDialogueChoice(run, f, sceneId, choiceId, hooks = {}) {
  const Err = hooks.RefusedClass ?? Error;
  const refuse = (msg) => {
    const err = new Err(msg);
    err.name = 'Refused';
    throw err;
  };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  // Morale moves through the engine's writer when it is wired in (src/run/helpers.js), so its rules apply here too.
  const moveMorale = (target, n) => {
    if (typeof hooks.onMorale === 'function') hooks.onMorale(target, n);
    else target.morale = clamp((target.morale ?? 50) + n, 0, 100);
  };

  if (run?.status && run.status !== 'active') refuse('The run is over.');
  if (run?.inMatch) refuse('Finish the match first.');

  const staff = getStaffActor(f);
  if (staff) {
    // Validate EVERYTHING before creating or mutating run.staffDialogue[staff.staffKey].
    if (run?.staffDialogue != null && !isPlainObject(run.staffDialogue)) {
      refuse('Corrupt staff dialogue state.');
    }
    if (run?.staffDialogue?.[staff.staffKey] != null && !isPlainObject(run.staffDialogue[staff.staffKey])) {
      refuse('Corrupt staff dialogue state.');
    }
    if (!hasStaffRoom(run, staff.roomType)) {
      refuse(staff.staffKey === 'trainer'
        ? 'Build a Trainer Room before speaking with Drillmaster Kaeso.'
        : 'Build a Medbay before speaking with Physician Lyra.');
    }
    if (staff.staffKey === 'trainer' && isTrainerDismissed(run)) {
      refuse('Drillmaster Kaeso has been dismissed; the post is vacant for now.');
    }
    if (typeof choiceId !== 'string' || choiceId.trim() === '') {
      refuse('A dialogue choice must be specified.');
    }
    const cleanStaffScene = normalizeSceneId(sceneId || 'hub');
    const staffTopicKey = resolveStaffTopicKey(staff.staffKey, cleanStaffScene);
    const availableTopics = getHubTopics(run, staff);
    const isStaffAvailable = cleanStaffScene === 'hub'
      || availableTopics.some((t) => resolveStaffTopicKey(staff.staffKey, t.scene) === staffTopicKey
        || resolveStaffTopicKey(staff.staffKey, t.id) === staffTopicKey);
    if (!isStaffAvailable) refuse('That conversation topic is not available right now.');

    const tree = resolveDialogueTree(run, staff, cleanStaffScene);
    const chosen = tree.choices.find((c) => c.id === choiceId || c.choice === choiceId) ?? null;
    if (!chosen) refuse('Unknown dialogue choice.');
    if (chosen.locked) refuse(chosen.lockReason || 'That dialogue choice is locked.');

    // Validation passed: safe to initialize and mutate staff dialogue state.
    const st = getStaffState(run, staff.staffKey, true);
    const rewardReady = isStaffTopicRewardReady(run, st, staffTopicKey);
    const rawEff = chosen.effects ?? {};
    const eff = rewardReady
      ? { ...rawEff }
      : { ...(rawEff.loreFlag ? { loreFlag: rawEff.loreFlag } : {}) };

    const rewardPaid = rewardReady && (
      Boolean(eff.informerResolved)
      || STAFF_NUMERIC_EFFECT_KEYS.some((k) => typeof eff[k] === 'number' && eff[k] !== 0)
    );

    if (staffTopicKey && !st.seen.includes(staffTopicKey)) st.seen.push(staffTopicKey);
    if (rewardPaid) {
      st.topicWeeks[staffTopicKey] = run?.week ?? 0;
    }

    if (eff.informerResolved) {
      st.flags.informerResolved = eff.informerResolved;
      if (eff.informerResolved === 'turned') st.flags.trainer_turned_ally = true;
      if (eff.informerResolved === 'dismissed') {
        st.flags.trainer_dismissed = true;
        st.dismissedUntilWeek = (run?.week ?? 0) + (typeof eff.dismissTrainerWeeks === 'number' ? eff.dismissTrainerWeeks : 4);
      }
      if (run) {
        run.spyFound = true;
        if (isPlainObject(run.plot)) run.plot.spyFound = true;
      }
    }

    if (typeof eff.trust === 'number') st.trust = clamp((st.trust ?? 0) + eff.trust, -100, 100);
    if (typeof eff.suspicion === 'number' && eff.suspicion !== 0 && run?.plot && !run.plot.ended) {
      if (typeof hooks.onChangeSuspicion === 'function') hooks.onChangeSuspicion(eff.suspicion);
      else run.plot.suspicion = clamp((run.plot.suspicion ?? 0) + eff.suspicion, 0, 100);
    }
    if (typeof eff.plotTrust === 'number' && run?.plot && !run.plot.ended) {
      run.plot.trust = clamp((run.plot.trust ?? 0) + eff.plotTrust, 0, 10);
    }
    if (eff.loreFlag && !st.loreFlags.includes(eff.loreFlag)) {
      st.loreFlags.push(eff.loreFlag);
      for (const member of run?.roster ?? []) {
        ensureDialogueState(member);
        if (!member.dialogue.loreFlags.includes(eff.loreFlag)) member.dialogue.loreFlags.push(eff.loreFlag);
      }
    }
    if (eff.markLore && run) {
      if (!(run.loreRead ?? []).includes(eff.markLore)) run.loreRead = [...(run.loreRead ?? []), eff.markLore];
    }
    if (typeof eff.staffTraineeMorale === 'number' && Array.isArray(run?.roster)) {
      for (const member of run.roster) {
        if (member.job === 'trainPower' || member.job === 'trainSpeed') {
          moveMorale(member, eff.staffTraineeMorale);
          if (typeof eff.staffTraineeStress === 'number') member.stress = clamp((member.stress ?? 0) + eff.staffTraineeStress, 0, 100);
        }
      }
    }
    if (typeof eff.staffMedbayStress === 'number' && Array.isArray(run?.roster)) {
      for (const member of run.roster) {
        if (member.job === 'medbay' || (member.injuries?.length ?? 0) > 0) {
          member.stress = clamp((member.stress ?? 0) + eff.staffMedbayStress, 0, 100);
          if (typeof eff.staffMedbayMorale === 'number') moveMorale(member, eff.staffMedbayMorale);
        }
      }
    }
    if (typeof eff.staffRosterMorale === 'number' && Array.isArray(run?.roster)) {
      for (const member of run.roster) {
        moveMorale(member, eff.staffRosterMorale);
      }
    }
    const replySpeaker = chosen.replySpeaker
      ?? inferReplySpeaker(chosen.responseText, chosen.then?.[0]?.speaker ?? null, staff.speaker, staff.name);
    return {
      sceneId: cleanStaffScene,
      topicKey: staffTopicKey,
      choiceId: chosen.id,
      choice: chosen,
      effects: eff,
      responseText: chosen.responseText ?? '',
      replySpeaker,
      nextNode: chosen.next ? tree.nodes[chosen.next] : null,
      tree,
    };
  }

  // Validate EVERYTHING before creating or mutating fighter.dialogue.
  const fighter = typeof f === 'string'
    ? (run?.roster?.find((x) => x.id === f || x.coreId === f) ?? null)
    : f;
  if (!fighter) {
    if (hooks.RefusedClass) refuse('No such fighter.');
    return null;
  }
  if (fighter.dialogue != null && !isPlainObject(fighter.dialogue)) {
    refuse('Corrupt fighter dialogue state.');
  }
  if (fighter.dialogue?.queue != null && !Array.isArray(fighter.dialogue.queue)) {
    refuse('Corrupt fighter dialogue queue.');
  }
  if (typeof choiceId !== 'string' || choiceId.trim() === '') {
    refuse('A dialogue choice must be specified.');
  }

  const liveQueue = filterStaleQueueItems(run, fighter.dialogue?.queue);
  const targetSceneId = sceneId || liveQueue[0]?.id || 'hub';
  const cleanId = normalizeSceneId(targetSceneId);
  if (cleanId === 'rebel_orc_elf_schism' && fighter.coreId !== 'orc' && fighter.coreId !== 'elf') {
    refuse('Only Varok or Vaelen can resolve the courtyard clash.');
  }

  const inQueue = liveQueue.some((q) => normalizeSceneId(q?.id) === cleanId);
  const hubTopics = getHubTopics(run, fighter);
  const inHubTopics = cleanId === 'hub'
    || hubTopics.some((t) => !t.queued && (normalizeSceneId(t.scene) === cleanId || normalizeSceneId(t.id) === cleanId));

  if (!inQueue && !inHubTopics) {
    refuse('That conversation is not available right now.');
  }

  const tree = resolveDialogueTree(run, fighter, cleanId);
  const chosen = tree.choices.find((c) => c.id === choiceId || c.choice === choiceId) ?? null;
  if (!chosen) refuse('Unknown dialogue choice.');
  if (chosen.locked) refuse(chosen.lockReason || 'That dialogue choice is locked.');

  // All validations passed: safe to prune and ensure fighter.dialogue.
  pruneStaleDialogue(run, fighter);
  const d = ensureDialogueState(fighter);

  const isHubTopic = !inQueue && (cleanId === 'hub' || ['ask_arena', 'ask_room', 'ask_past', 'summons_before'].includes(cleanId));
  const topicKey = cleanId === 'hub' ? (chosen.id ?? 'hub') : cleanId;
  const allowNumericRewards = inQueue || !isHubTopic || isHubTopicRewardReady(run, d, topicKey);

  // Dequeue milestone and record in seen
  if (fighter.kind === 'revenant') {
    d.queue = [];
  } else {
    d.queue = d.queue.filter((q) => {
      const qClean = normalizeSceneId(q?.id);
      if (qClean === cleanId) return false;
      if ((cleanId === 'stuck_check' || chosen.id === 'stuck_check') && qClean.startsWith('stuck_')) return false;
      return true;
    });
  }
  if (cleanId && cleanId !== 'hub' && !d.seen.includes(cleanId)) d.seen.push(cleanId);
  if (cleanId === 'hub' && chosen.id === 'ask_past' && !d.seen.includes('ask_past')) d.seen.push('ask_past');

  // Update progressive stuck state machine
  const stuckMatch = cleanId.match(/^stuck_t(\d+)_stage(\d+)$/);
  if (stuckMatch || cleanId === 'stuck_check' || (cleanId === 'hub' && chosen.id === 'stuck_check')) {
    const t = stuckMatch ? Number(stuckMatch[1]) : (run?.topTier ?? d.stuck?.tier ?? 1);
    const st = stuckMatch ? Number(stuckMatch[2]) : Math.min(3, Math.max(1, (d.stuck?.stage ?? 0) + 1));
    d.stuck.tier = t;
    d.stuck.stage = Math.min(3, Math.max(d.stuck.stage ?? 0, st));
    d.stuck.lastTalkWeek = run?.week ?? 0;
    d.stuck.bossLossesAtTalk = run?.tierState?.bossLosses ?? d.stuck.bossLossesAtTalk ?? 0;
    const stageSceneKey = `stuck_t${t}_stage${d.stuck.stage}`;
    if (!d.seen.includes(stageSceneKey)) d.seen.push(stageSceneKey);
  }

  const rawEff = chosen.effects ?? {};
  const eff = allowNumericRewards
    ? { ...rawEff }
    : {
        ...(rawEff.loreFlag ? { loreFlag: rawEff.loreFlag } : {}),
        ...(rawEff.summonsOrderHint ? { summonsOrderHint: rawEff.summonsOrderHint } : {}),
      };

  // Cap suspicion-warning relief to ONCE per escalation level (watch / informer / cold).
  if (cleanId.startsWith('suspicion_') && typeof eff.suspicion === 'number' && eff.suspicion < 0 && run?.plot && !run.plot.ended) {
    const suspLevel = cleanId.replace('suspicion_', '');
    if (run.plot.suspicionReliefPaid?.[suspLevel]) {
      delete eff.suspicion;
    } else {
      run.plot.suspicionReliefPaid = { ...(isPlainObject(run.plot.suspicionReliefPaid) ? run.plot.suspicionReliefPaid : {}), [suspLevel]: true };
    }
  }

  const fighterRewardPaid = allowNumericRewards
    && FIGHTER_NUMERIC_EFFECT_KEYS.some((k) => typeof eff[k] === 'number' && eff[k] !== 0);
  if (isHubTopic && fighterRewardPaid) {
    d.topicWeeks[topicKey] = run?.week ?? 0;
  }

  if (typeof eff.morale === 'number') moveMorale(fighter, eff.morale);
  if (typeof eff.stress === 'number') fighter.stress = clamp((fighter.stress ?? 0) + eff.stress, 0, 100);
  if (typeof eff.trust === 'number') d.trust = clamp((d.trust ?? 0) + eff.trust, -100, 100);
  if (typeof eff.xp === 'number' && eff.xp > 0) {
    if (typeof hooks.onGainXp === 'function') hooks.onGainXp(fighter, eff.xp);
    else fighter.xp = Math.max(0, (fighter.xp ?? 0) + eff.xp);
  }
  if (typeof eff.renown === 'number') fighter.renown = Math.max(0, (fighter.renown ?? 0) + eff.renown);
  if (typeof eff.favor === 'number' && run && typeof run.favor === 'number') {
    if (typeof hooks.onChangeFavor === 'function') hooks.onChangeFavor(eff.favor, `conversation with ${fighter.name}`);
    else run.favor = clamp(run.favor + eff.favor, 0, 100);
  }
  if (typeof eff.gold === 'number' && run && typeof run.gold === 'number') {
    run.gold = Math.max(0, run.gold + eff.gold);
  }
  if (typeof eff.plotTrust === 'number' && run?.plot && !run.plot.ended) {
    run.plot.trust = clamp((run.plot.trust ?? 0) + eff.plotTrust, 0, 10);
  }
  if (typeof eff.suspicion === 'number' && eff.suspicion !== 0 && run?.plot && !run.plot.ended) {
    if (typeof hooks.onChangeSuspicion === 'function') hooks.onChangeSuspicion(eff.suspicion);
    else run.plot.suspicion = clamp((run.plot.suspicion ?? 0) + eff.suspicion, 0, 100);
  }
  if (eff.endPlot && run?.plot) {
    run.plot.ended = eff.endPlot;
  }
  if (eff.loreFlag) {
    if (!d.loreFlags.includes(eff.loreFlag)) d.loreFlags.push(eff.loreFlag);
    if (eff.loreFlag === 'orc_barracks_truce' && Array.isArray(run?.roster)) {
      for (const mate of run.roster) {
        if (mate.coreId === 'orc' || mate.coreId === 'elf') {
          const md = ensureDialogueState(mate);
          if (!md.loreFlags.includes('orc_barracks_truce')) md.loreFlags.push('orc_barracks_truce');
        }
      }
    }
  }
  if (eff.summonsOrderHint) {
    d.preferredSummonsOrder = eff.summonsOrderHint;
  }
  if (eff.byCoreId && Array.isArray(run?.roster)) {
    for (const [cId, cEff] of Object.entries(eff.byCoreId)) {
      const mate = run.roster.find((x) => x.coreId === cId && x.id !== fighter.id);
      if (!mate) continue;
      const md = ensureDialogueState(mate);
      if (typeof cEff.morale === 'number') moveMorale(mate, cEff.morale);
      if (typeof cEff.stress === 'number') mate.stress = clamp((mate.stress ?? 0) + cEff.stress, 0, 100);
      if (typeof cEff.trust === 'number') md.trust = clamp((md.trust ?? 0) + cEff.trust, -100, 100);
      // Also dequeue identical shared schism/bond scene on the partner so they don't repeat it
      if (cleanId === 'rebel_orc_elf_schism' || cleanId.startsWith('bond_formed_')) {
        md.queue = md.queue.filter((q) => normalizeSceneId(q?.id) !== cleanId);
        if (!md.seen.includes(cleanId)) md.seen.push(cleanId);
      }
    }
  }
  if (eff.refuseWant) {
    const wId = String(eff.refuseWant);
    if (!d.wantChain.refused.includes(wId)) d.wantChain.refused.push(wId);
    const chain = CORE_WANTS[fighter.coreId] ?? [];
    const idx = chain.findIndex((w) => w.id === wId);
    if (idx >= 0 && d.wantChain.index <= idx) d.wantChain.index = idx + 1;
    if (fighter.want && (fighter.want.id === wId || fighter.want.coreWantId === wId)) {
      delete fighter.want;
    }
    d.queue = d.queue.filter((q) => normalizeSceneId(q?.id) !== `want_asked_${wId}`);
  }
  if (eff.acceptWant) {
    const wId = String(eff.acceptWant);
    const chain = CORE_WANTS[fighter.coreId] ?? [];
    const def = chain.find((w) => w.id === wId);
    const alreadyDone = d.wantChain.completed.includes(wId) || d.wantChain.refused.includes(wId);
    if (def && !fighter.want && !alreadyDone) {
      fighter.want = {
        id: def.key ? 'room' : def.id,
        coreWantId: def.id,
        label: def.label,
        goal: def.goal,
        key: def.key ?? null,
        item: def.item ?? null,
        since: run?.week ?? 0,
        until: (run?.week ?? 0) + (def.weeks ?? 12),
      };
    }
    d.queue = d.queue.filter((q) => normalizeSceneId(q?.id) !== `want_asked_${wId}`);
  }

  const actorSpeaker = fighter.coreId || fighter.id;
  const replySpeaker = chosen.replySpeaker
    ?? inferReplySpeaker(chosen.responseText, chosen.then?.[0]?.speaker ?? null, actorSpeaker, fighter.name);

  return {
    sceneId: cleanId,
    choiceId: chosen.id,
    choice: chosen,
    effects: eff,
    responseText: chosen.responseText ?? '',
    replySpeaker,
    nextNode: chosen.next ? tree.nodes[chosen.next] : null,
    tree,
  };
}
