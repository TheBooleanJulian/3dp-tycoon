// ========================
// GAME DATA
// ========================
const VERSION = '1.7.1';

// PRODUCT_BASES are the 20 "common" items — the plain, baseline version of each category.
// Each one also spawns 4 variant tiers (see PRODUCT_VARIANTS below) so that almost no two
// products in the game are identical: 20 bases × (1 common + 4 variants) = 100 products.
const PRODUCT_BASES = [
  { id:'keychain',        name:'Keychains',           icon:'🔑', color:'#4a9eff', baseValue:2.50,  filament:15,  printTime:8,   unlockCost:0,     desc:'Popular and quick to print' },
  { id:'bottle_opener',   name:'Bottle Opener',       icon:'🍾', color:'#5dade2', baseValue:4.00,  filament:20,  printTime:10,  unlockCost:20,    desc:'Cheap novelty, sells itself' },
  { id:'phone_stand',     name:'Phone Stand',        icon:'📱', color:'#00d4c8', baseValue:9.00,  filament:50,  printTime:28,  unlockCost:50,    desc:'Remote workers love these' },
  { id:'coaster_set',     name:'Coaster Set',        icon:'🥤', color:'#48c9b0', baseValue:12.00, filament:55,  printTime:30,  unlockCost:100,   desc:'Sells well in sets of four' },
  { id:'cable_org',       name:'Cable Organizer',    icon:'🔌', color:'#2dd98a', baseValue:14.00, filament:65,  printTime:38,  unlockCost:150,   desc:'Home office essential' },
  { id:'desk_organizer',  name:'Desk Organizer',     icon:'🗃️', color:'#58d68d', baseValue:18.00, filament:75,  printTime:45,  unlockCost:200,   desc:'Tidy desks, steady margins' },
  { id:'miniature',       name:'Miniature Figure',   icon:'🎲', color:'#a78bfa', baseValue:22.00, filament:80,  printTime:60,  unlockCost:250,   desc:'Tabletop RPG community' },
  { id:'phone_case',      name:'Phone Case',         icon:'📲', color:'#5dade2', baseValue:26.00, filament:90,  printTime:55,  unlockCost:350,   desc:'Custom fit, repeat buyers' },
  { id:'jewelry_box',     name:'Jewelry Box',        icon:'💍', color:'#f7b6d2', baseValue:30.00, filament:150, printTime:90,  unlockCost:500,   desc:'Gift-shop favourite' },
  { id:'planter',         name:'Deco Planter',       icon:'🌱', color:'#27ae60', baseValue:32.00, filament:200, printTime:110, unlockCost:800,   desc:'High demand on the marketplace' },
  { id:'lamp_shade',      name:'Lamp Shade',         icon:'💡', color:'#f4d03f', baseValue:42.00, filament:220, printTime:130, unlockCost:1200,  desc:'Home decor upsell' },
  { id:'cosplay_prop',    name:'Cosplay Prop',       icon:'⚔️', color:'#e74c3c', baseValue:110.0, filament:480, printTime:320, unlockCost:5000,  desc:'Premium custom orders' },
  { id:'drone_frame',     name:'Drone Frame',        icon:'🛸', color:'#7fb3d5', baseValue:130.0, filament:500, printTime:340, unlockCost:7000,  desc:'Hobbyist FPV racing scene' },
  { id:'rc_car_parts',    name:'RC Car Parts',       icon:'🏎️', color:'#ec7063', baseValue:150.0, filament:560, printTime:360, unlockCost:9000,  desc:'Replacement parts, steady orders' },
  { id:'architectural_model', name:'Architectural Model', icon:'🏛️', color:'#aab7b8', baseValue:160.0, filament:520, printTime:300, unlockCost:11000, desc:'Firms pay well for scale models' },
  { id:'industrial',      name:'Industrial Part',    icon:'⚙️', color:'#f39c12', baseValue:175.0, filament:650, printTime:420, unlockCost:15000, desc:'B2B manufacturing contracts' },
  { id:'tooling_jig',     name:'Tooling Jig',        icon:'🧰', color:'#d4ac0d', baseValue:220.0, filament:700, printTime:460, unlockCost:20000, desc:'Factories order these in bulk' },
  { id:'prosthetic_part', name:'Prosthetic Part',    icon:'🦾', color:'#85c1e9', baseValue:260.0, filament:780, printTime:500, unlockCost:28000, desc:'Medical-adjacent, high margin' },
  { id:'automotive_part', name:'Automotive Part',    icon:'🚗', color:'#cb4335', baseValue:320.0, filament:900, printTime:560, unlockCost:40000, desc:'Aftermarket parts contracts' },
  { id:'aerospace_component', name:'Aerospace Component', icon:'🚀', color:'#5d6d7e', baseValue:450.0, filament:1100,printTime:650, unlockCost:60000, desc:'The pinnacle of precision manufacturing' },
];

// Variant tiers applied to every base category. `flatUnlock` guarantees a real unlock gate
// even for the free starter base (0 × unlockMult is still 0), so e.g. "Deluxe Keychains"
// isn't free just because plain Keychains are.
const PRODUCT_VARIANTS = [
  { id:'mini',   name:'Mini',             icon:'🔹', valueMult:0.55, filamentMult:0.5,  timeMult:0.5,  unlockMult:0.5, flatUnlock:0,   desc:'Smaller, faster, and cheaper to unlock.' },
  { id:'glow',   name:'Glow-in-the-Dark', icon:'🌟', valueMult:1.35, filamentMult:1.15, timeMult:1.15, unlockMult:1.4, flatUnlock:150, desc:'Glows after dark — a reliable novelty upsell.' },
  { id:'deluxe', name:'Deluxe',           icon:'✨', valueMult:1.9,  filamentMult:1.6,  timeMult:1.5,  unlockMult:2.0, flatUnlock:400, desc:'Premium finish commands a higher price.' },
  { id:'custom', name:'Custom Engraved',  icon:'💠', valueMult:1.6,  filamentMult:1.1,  timeMult:1.3,  unlockMult:2.5, flatUnlock:600, desc:'Personalised on request — the biggest margins.' },
];

function buildProducts() {
  const products = {};
  for (const base of PRODUCT_BASES) {
    products[base.id] = { ...base, baseId:base.id, variantId:null };
    for (const variant of PRODUCT_VARIANTS) {
      const id = `${base.id}_${variant.id}`;
      products[id] = {
        id,
        name: `${variant.name} ${base.name}`,
        icon: variant.icon,
        color: base.color,
        baseValue: Math.round(base.baseValue * variant.valueMult * 100) / 100,
        filament: Math.round(base.filament * variant.filamentMult),
        printTime: Math.round(base.printTime * variant.timeMult),
        unlockCost: Math.round(base.unlockCost * variant.unlockMult + variant.flatUnlock),
        desc: variant.desc,
        baseId: base.id,
        variantId: variant.id,
      };
    }
  }
  return products;
}

const PRODUCTS = buildProducts();

// costMult: multiplies base filament price/gram · qualityMult: product value multiplier
// failMod: multiplier on base fail rate (<1 = more reliable, >1 = flakier) · matClass: 'filament' or 'resin'
const MATERIALS = {
  pla:          { id:'pla',          name:'PLA',                    icon:'🧵', matClass:'filament', costMult:1.0, qualityMult:1.0,  failMod:1.0,  desc:'Standard, reliable, cheap.' },
  petg:         { id:'petg',         name:'PETG',                   icon:'🧵', matClass:'filament', costMult:1.3, qualityMult:1.08, failMod:0.9,  desc:'Tougher and weather-resistant.' },
  abs:          { id:'abs',          name:'ABS',                    icon:'🧵', matClass:'filament', costMult:1.15,qualityMult:1.03, failMod:1.15, desc:'Heat-resistant but warps more.' },
  tpu:          { id:'tpu',          name:'TPU (Flexible)',         icon:'🧵', matClass:'filament', costMult:1.8, qualityMult:1.12, failMod:1.25, desc:'Flexible, trickier to print.' },
  nylon:        { id:'nylon',        name:'Nylon',                  icon:'🧵', matClass:'filament', costMult:2.2, qualityMult:1.2,  failMod:1.2,  desc:'Strong engineering material, absorbs moisture.' },
  carbon_fiber: { id:'carbon_fiber', name:'Carbon Fiber Composite', icon:'🧵', matClass:'filament', costMult:3.0, qualityMult:1.35, failMod:1.1,  desc:'Premium strength-to-weight composite.' },
  resin_std:    { id:'resin_std',    name:'Standard Resin',         icon:'💧', matClass:'resin',    costMult:2.5, qualityMult:1.15, failMod:1.0,  desc:'Standard resin for detailed prints.' },
  resin_tough:  { id:'resin_tough',  name:'Tough Resin',            icon:'💧', matClass:'resin',    costMult:3.5, qualityMult:1.3,  failMod:0.9,  desc:'Engineering-grade tough resin.' },
};

// Cosmetic choice — bonus is a small fleet-averaged value multiplier, same mechanism as fleet quality
const COLORS = {
  black:  { id:'black',  name:'Black',  icon:'⚫', bonus:1.00 },
  white:  { id:'white',  name:'White',  icon:'⚪', bonus:1.00 },
  brown:  { id:'brown',  name:'Brown',  icon:'🟤', bonus:0.98 },
  red:    { id:'red',    name:'Red',    icon:'🔴', bonus:1.02 },
  orange: { id:'orange', name:'Orange', icon:'🟠', bonus:1.03 },
  yellow: { id:'yellow', name:'Yellow', icon:'🟡', bonus:1.01 },
  green:  { id:'green',  name:'Green',  icon:'🟢', bonus:1.01 },
  blue:   { id:'blue',   name:'Blue',   icon:'🔵', bonus:1.02 },
  purple: { id:'purple', name:'Purple', icon:'🟣', bonus:1.05 },
};

// speed: relative print rate · eff: filament efficiency (>1 = less waste) · quality: product value multiplier
// failMod: multiplier on base fail rate (<1 = more reliable, >1 = flakier) · matClass: which materials it can load
const PRINTER_TYPES = {
  ender3:      { id:'ender3',      name:'Bender 3 Clone',          icon:'🖨️', color:'#6b6880', cost:0,      speed:1.0,  eff:1.0,  quality:1.0,  failMod:1.0,  maxOwn:4, matClass:'filament', desc:'Your trusty starter. Slow but reliable.' },
  budget_resin:{ id:'budget_resin',name:'PrintPal Mini (Resin)',  icon:'🧪', color:'#c39bd3', cost:150,    speed:1.3,  eff:0.7,  quality:0.9,  failMod:1.4,  maxOwn:4, matClass:'resin',    desc:'Cheap resin entry point. Wasteful and finicky.' },
  bambu_a1:    { id:'bambu_a1',    name:'Mambo Lab A1',           icon:'🔥', color:'#ff6b2b', cost:800,    speed:2.5,  eff:1.1,  quality:1.05, failMod:0.9,  maxOwn:6, matClass:'filament', desc:'Fast CoreXY all-rounder. A real game changer.' },
  resin:       { id:'resin',      name:'Proton Mono M5S',        icon:'💎', color:'#a78bfa', cost:2200,   speed:3.5,  eff:0.85, quality:1.15, failMod:1.0,  maxOwn:4, matClass:'resin',    desc:'Ultra-detail resin. +60% miniature value.', bonusProd:'miniature', bonusMult:1.6 },
  bambu_x1c:   { id:'bambu_x1c',  name:'Mambo X1 Carbon',        icon:'⚡', color:'#00d4c8', cost:3500,   speed:5.0,  eff:1.25, quality:1.1,  failMod:0.85, maxOwn:6, matClass:'filament', desc:'Multi-color, blazing fast. Industry standard.' },
  voron:       { id:'voron',      name:'Boron 2.4 350',          icon:'🚀', color:'#e74c3c', cost:9500,   speed:9.0,  eff:1.4,  quality:0.95, failMod:1.3,  maxOwn:4, matClass:'filament', desc:'DIY beast. Extreme speed, but tuning is temperamental.' },
  farm_unit:   { id:'farm_unit',  name:'Gantry X9 Farm Unit',    icon:'📐', color:'#48c9b0', cost:18000,  speed:14.0, eff:1.5,  quality:0.85, failMod:1.1,  maxOwn:6, matClass:'filament', desc:'Built for volume, not finish. Cheaper than Industrial.' },
  industrial:  { id:'industrial', name:'Industrial FDM',         icon:'🏭', color:'#f39c12', cost:55000,  speed:18.0, eff:1.65, quality:1.2,  failMod:0.6,  maxOwn:3, matClass:'filament', desc:'Commercial-grade. Handles bulk orders reliably.' },
  cnc_precision:{ id:'cnc_precision',name:'Helix CNC Precision Mill',icon:'🛠️', color:'#7fb3d5', cost:30000, speed:2.0, eff:1.0, quality:1.5, failMod:0.4, maxOwn:2, matClass:'filament', desc:'Slow subtractive precision. Superb finish quality.' },
  titan_sls:   { id:'titan_sls',  name:'Titan SLS Metal Printer',icon:'🗲', color:'#5d6d7e', cost:120000, speed:4.0,  eff:1.3,  quality:1.8,  failMod:0.3,  maxOwn:2, matClass:'filament', desc:'Best-in-class metal sintering. Slow, pricey, unmatched value.' },
};

const UPGRADES = {
  // Speed
  slicer_v2:      { id:'slicer_v2',      cat:'speed',      name:'Slicer Pro 2.0',      icon:'💻', cost:120,   desc:'Optimised print profiles.', effect:'+20% print speed',      req:[],                fn:s=>{s.speedMult*=1.2} },
  gyroid:         { id:'gyroid',         cat:'speed',      name:'Gyroid Infill',        icon:'🔺', cost:350,   desc:'Stronger, faster infill.',  effect:'+18% speed, −8% filament', req:['slicer_v2'],     fn:s=>{s.speedMult*=1.18; s.filamentMult*=0.92} },
  klipper:        { id:'klipper',        cat:'speed',      name:'OverKlok Firmware',    icon:'⚙️', cost:800,   desc:'Input shaping enabled.',    effect:'+35% print speed',      req:['slicer_v2'],     fn:s=>{s.speedMult*=1.35} },
  pressure_adv:   { id:'pressure_adv',   cat:'speed',      name:'Pressure Advance',     icon:'📐', cost:2500,  desc:'Perfect corner geometry.',  effect:'+25% speed, +12% value', req:['klipper'],       fn:s=>{s.speedMult*=1.25; s.valueMult*=1.12} },
  // Efficiency
  bulk_filament:  { id:'bulk_filament',  cat:'efficiency', name:'Bulk Filament Deal',   icon:'📦', cost:200,   desc:'Wholesale supplier deal.',  effect:'−25% filament cost',    req:[],                fn:s=>{s.filamentPrice*=0.75} },
  pla_plus:       { id:'pla_plus',       cat:'efficiency', name:'Premium PLA+',          icon:'✨', cost:500,   desc:'Higher quality material.',  effect:'+18% product value',    req:['bulk_filament'], fn:s=>{s.valueMult*=1.18} },
  cf_petg:        { id:'cf_petg',        cat:'efficiency', name:'Carbon Fiber PETG',    icon:'🔩', cost:2000,  desc:'Industrial-grade material.',effect:'+45% industrial value', req:['pla_plus'],      fn:s=>{s.industrialBonus*=1.45} },
  filament_dryer: { id:'filament_dryer', cat:'efficiency', name:'Filament Dryer',       icon:'🌡️', cost:180,   desc:'Eliminate moisture issues.', effect:'−60% print failures',  req:[],                fn:s=>{s.failRate*=0.4} },
  // Business
  etsy_store:     { id:'etsy_store',     cat:'business',   name:'CraftBazaar Shop',     icon:'🛍️', cost:75,    desc:'Your online storefront.',   effect:'+12% value, unlock passive online sales', req:[],            fn:s=>{s.valueMult*=1.12; s.unlockedAutoSell=true} },
  social_media:   { id:'social_media',   cat:'business',   name:'Social Media Presence',icon:'📱', cost:750,   desc:'Influencer collabs.',       effect:'+22% all values, unlock expo invites', req:['etsy_store'],    fn:s=>{s.valueMult*=1.22; s.exhibitionsEnabled=true} },
  biz_license:    { id:'biz_license',    cat:'business',   name:'Business License',     icon:'📋', cost:1500,  desc:'Official registered biz.',  effect:'Enable bulk orders',    req:['social_media'],  fn:s=>{s.bulkOrdersEnabled=true} },
  modelling_service: { id:'modelling_service', cat:'business', name:'3D Modelling Service', icon:'🖥️', cost:2200, desc:'Offer custom CAD design alongside printing.', effect:'Enable custom commission requests', req:['social_media'], fn:s=>{s.commissionsEnabled=true} },
  // Room / shelving — a separate early, cheap progression so a cramped bedroom setup can grow to 8 printers
  wall_shelving:  { id:'wall_shelving',  cat:'space',      name:'Wall-Mounted Shelving',icon:'🗄️', cost:250,   desc:'Vertical storage for more printers.', effect:'+2 room capacity', req:[],                 fn:s=>{s.roomCapacityBonus=(s.roomCapacityBonus||0)+2} },
  overhead_rack:  { id:'overhead_rack',  cat:'space',      name:'Overhead Rack System', icon:'🪜', cost:900,   desc:'Ceiling-height racking.',   effect:'+2 room capacity',      req:['wall_shelving'], fn:s=>{s.roomCapacityBonus=(s.roomCapacityBonus||0)+2} },
  mezzanine:      { id:'mezzanine',      cat:'space',      name:'Mezzanine Storage',    icon:'🏗️', cost:3000,  desc:'A whole extra floor level.', effect:'+3 room capacity',     req:['overhead_rack'], fn:s=>{s.roomCapacityBonus=(s.roomCapacityBonus||0)+3} },
  // Quality
  bed_leveling:   { id:'bed_leveling',   cat:'quality',    name:'Auto Bed Leveling',    icon:'📏', cost:150,   desc:'Auto-probe sensor installed.', effect:'Eliminate bed failures',req:[],                fn:s=>{s.failRate*=0.5} },
  enclosure:      { id:'enclosure',      cat:'quality',    name:'Printer Enclosure',    icon:'📦', cost:400,   desc:'Heated enclosure build.',   effect:'+18% quality bonus',    req:[],                fn:s=>{s.valueMult*=1.18} },
  dual_ext:       { id:'dual_ext',       cat:'quality',    name:'Dual Extruder',        icon:'🔧', cost:1200,  desc:'Multi-material printing.',  effect:'+28% decorative items', req:['enclosure'],     fn:s=>{s.decorativeBonus*=1.28} },
  post_proc:      { id:'post_proc',      cat:'quality',    name:'Post-Processing Kit',  icon:'🎨', cost:3000,  desc:'Sanding, priming, paint.',  effect:'Unlocks the Finishing Studio',req:['dual_ext'],     fn:s=>{s.processingUnlocked=true} },
  resin_wash:     { id:'resin_wash',     cat:'quality',    name:'UV Cure Station',      icon:'☀️', cost:5500,  desc:'Professional resin finish.', effect:'+50% resin value',     req:['post_proc'],     fn:s=>{s.resinBonus*=1.5} },
};

const AUTOMATION_ITEMS = {
  auto_print:     { id:'auto_print',     name:'Auto Print Queue',        icon:'🔄', cost:150,   tier:1, desc:'Printers auto-restart when a job completes. Requires filament.' },
  auto_liquidate: { id:'auto_liquidate', name:'Auto-Liquidate Overflow', icon:'🤝', cost:600,   tier:1, desc:'Auto-liquidates a variant once it exceeds 50 units in stock, so the warehouse never overflows. Requires CraftBazaar Shop.', req:'etsy_store' },
  auto_filament:  { id:'auto_filament',  name:'Filament Auto-Resupply',  icon:'📦', cost:400,   tier:1, desc:'Automatically orders 1kg filament (matching colour) when stock drops below threshold.' },
  batch_print:    { id:'batch_print',    name:'Batch Print Manager',     icon:'⚡', cost:3500,  tier:2, desc:'Queue multiple products. Printers cycle through the queue.' },
  price_opt:      { id:'price_opt',      name:'Dynamic Pricing AI',      icon:'📈', cost:6000,  tier:2, desc:'Optimises price timing for +22% revenue on all passive sales & liquidations.' },
  jit_logistics:  { id:'jit_logistics',  name:'JIT Filament Logistics',  icon:'🚚', cost:12000, tier:3, desc:'Bulk delivery system. Filament costs 28% less across the board.' },
  ai_scheduler:   { id:'ai_scheduler',   name:'AI Print Scheduler',      icon:'🤖', cost:25000, tier:3, desc:'Optimal job scheduling across all printers. +18% throughput.' },
};

// More random events — flavour swings that fire periodically alongside bulk orders/exhibitions/commissions.
const RANDOM_EVENTS = [
  { name:'Supplier Bulk Discount', icon:'📦', type:'discount',  mult:0.7, duration:60,  msg:mins=>`📦 Supplier discount! Filament costs -30% for ${mins}m` },
  { name:'Equipment Malfunction',  icon:'⚡', type:'failspike', mult:1.8, duration:45,  msg:mins=>`⚡ Power fluctuation! Print failure rate spikes for ${mins}m` },
  { name:'Local Press Feature',    icon:'📰', type:'followers', amount:[100,400],       msg:g=>`📰 Local news featured your shop! +${g} followers` },
  { name:'Customer Rave Review',   icon:'⭐', type:'demand',    mult:1.6, duration:90,  msg:mins=>`⭐ A rave review is boosting demand ×1.6 for ${mins}m` },
  { name:'Shipping Delay',         icon:'📮', type:'demand',    mult:0.6, duration:60,  msg:mins=>`📮 Shipping delays are slowing sales for ${mins}m` },
];

const PROCESS_STAGES = [
  { id:'sand',   name:'Sanding',   icon:'🧹', time:15 },
  { id:'smooth', name:'Smoothing', icon:'🪄', time:20 },
  { id:'paint',  name:'Painting',  icon:'🖌️', time:25 },
];
const RAW_SELL_MULT = 0.65;

const ROOM_BASE_CAPACITY = 1;

const OFFICE_SPACES = {
  small_office: { id:'small_office', name:'Small Office Unit',    icon:'🏢', furnishing:15000,  rent:0.06, capacity:10, req:'mezzanine',    desc:'A rented office down the street.' },
  warehouse:    { id:'warehouse',     name:'Industrial Warehouse', icon:'🏭', furnishing:80000,  rent:0.28, capacity:30, req:'small_office', desc:'A proper industrial unit with loading docks.' },
  mega_factory: { id:'mega_factory',  name:'Mega Factory Complex', icon:'🏗️', furnishing:400000, rent:1.2,  capacity:100,req:'warehouse',    desc:'A sprawling manufacturing complex.' },
};

const EXHIBITIONS = [
  { name:'Local Maker Faire',      icon:'🎪', costMin:200,   costMax:600,   followerMin:50,   followerMax:200,  boostMult:1.2, boostDuration:180 },
  { name:'Comic Con Artist Alley', icon:'🎭', costMin:800,   costMax:2000,  followerMin:150,  followerMax:500,  boostMult:1.3, boostDuration:240 },
  { name:'Regional Trade Show',    icon:'🏟️', costMin:3000,  costMax:8000,  followerMin:400,  followerMax:1200, boostMult:1.4, boostDuration:300 },
  { name:'International Expo',    icon:'🌐', costMin:10000, costMax:25000, followerMin:1000, followerMax:3000, boostMult:1.6, boostDuration:420 },
];

const STAFF_ROLES = {
  finisher: { id:'finisher', name:'Finishing Technician', icon:'🧑‍🔧', desc:'Feeds raw prints into idle Finishing Studio stations and advances every stage automatically.', wage:0.15, robotCost:4000, robotName:'Finishing Robot Arm', robotIcon:'🦾' },
  marketer: { id:'marketer', name:'Social Media Manager', icon:'📲', desc:'Posts timelapse clips the moment they\'re captured, keeping your follower count climbing on its own.', wage:0.12, robotCost:3000, robotName:'Autoposter Bot', robotIcon:'🤳' },
};

const ACHIEVEMENTS = [
  { id:'first_print',    name:'First Layer',        icon:'🖨️', desc:'Complete your first print',         check:s=>s.totalPrints>=1 },
  { id:'fifty_prints',   name:'Hobbyist',            icon:'🔑', desc:'Complete 50 prints',                check:s=>s.totalPrints>=50 },
  { id:'five_hundred',   name:'Maker Mode',          icon:'🔥', desc:'Complete 500 prints',               check:s=>s.totalPrints>=500 },
  { id:'first_k',        name:'Four Figures',        icon:'💰', desc:'Earn your first $1,000',            check:s=>s.lifetimeEarned>=1000 },
  { id:'ten_k',          name:'Side Hustle',         icon:'📱', desc:'Earn $10,000 lifetime',             check:s=>s.lifetimeEarned>=10000 },
  { id:'hundred_k',      name:'Small Business',      icon:'🏠', desc:'Earn $100,000 lifetime',            check:s=>s.lifetimeEarned>=100000 },
  { id:'million',        name:'Print Millionaire',   icon:'💎', desc:'Earn $1,000,000 lifetime',          check:s=>s.lifetimeEarned>=1000000 },
  { id:'five_printers',  name:'Print Farm Begins',   icon:'🏭', desc:'Own 5 printers simultaneously',    check:s=>s.printers.length>=5 },
  { id:'all_products',   name:'Full Catalogue',      icon:'📦', desc:'Unlock all products',               check:s=>Object.keys(PRODUCTS).every(k=>s.unlockedProducts.includes(k)) },
  { id:'automation_king',name:'Automation King',     icon:'🤖', desc:'Unlock all automation modules',    check:s=>Object.keys(AUTOMATION_ITEMS).every(k=>s.automationOwned[k]) },
  { id:'bulk_accepted',  name:'Big Client',          icon:'📬', desc:'Accept your first bulk order',     check:s=>s.bulkOrdersAccepted>=1 },
  { id:'prestige_1',     name:'Scale Up',            icon:'⬆️', desc:'Complete your first Scale Up',     check:s=>s.prestigeCount>=1 },
  { id:'first_finish',   name:'Finishing Touches',   icon:'🎨', desc:'Fully process your first item',    check:s=>s.totalProcessed>=1 },
  { id:'influencer',     name:'Influencer',          icon:'📲', desc:'Reach 1,000 followers',            check:s=>s.followers>=1000 },
  { id:'went_viral',     name:'Went Viral',          icon:'🔥', desc:'Land a viral timelapse post',      check:s=>s.viralHits>=1 },
  { id:'printer_collector',name:'Machine Shop',      icon:'🧰', desc:'Own one of every printer model',   check:s=>Object.keys(PRINTER_TYPES).every(t=>s.printers.some(p=>p.typeId===t)) },
  { id:'trade_show_regular',name:'Trade Show Regular',icon:'🎪', desc:'Attend 5 exhibitions',             check:s=>s.exhibitionsAttended>=5 },
  { id:'factory_floor',  name:'Factory Floor',       icon:'🏗️', desc:'Lease the Mega Factory Complex',   check:s=>!!s.rentedSpaces.mega_factory },
];

// ========================
// GAME STATE
// ========================
let G = null;
let printerId = 0;
let stationId = 0;

// Filament stock is tracked per material AND per colour — a spool of red PETG is a
// physically different roll from black PETG, so loading "red" on a printer must draw down
// red stock specifically rather than any grams of PETG the shop happens to own.
function freshFilamentStock() {
  const s = {};
  for (const id of Object.keys(MATERIALS)) {
    s[id] = {};
    for (const cid of Object.keys(COLORS)) s[id][cid] = 0;
  }
  return s;
}

function getFilamentGrams(materialId, colorId) {
  return (G.filamentStock[materialId] || {})[colorId] || 0;
}

function getTotalFilament() {
  let total = 0;
  for (const byColor of Object.values(G.filamentStock)) {
    total += Object.values(byColor).reduce((a,b)=>a+b, 0);
  }
  return total;
}

function stackKey(productId, material, color, printerTypeId) {
  return `${productId}__${material}__${color}__${printerTypeId}`;
}

function addToInventory(store, productId, material, color, printerTypeId, qty) {
  const key = stackKey(productId, material, color, printerTypeId);
  if (!store[key]) store[key] = { productId, material, color, printerTypeId, qty: 0 };
  store[key].qty += qty;
}

function defaultState(shopName) {
  const startStock = freshFilamentStock();
  startStock.pla.black = 500;
  return {
    version: VERSION,
    shopName: shopName || 'MY PRINT SHOP',
    money: 50,
    filamentStock: startStock,
    inventory: {},
    rawInventory: {},
    printers: [{ id: ++printerId, typeId:'ender3', progress:0, printing:false, job:'keychain', material:'pla', color:'black', totalPrints:0, active:true }],
    unlockedProducts: ['keychain'],
    filamentColorPick: {}, // last colour picked per material in the Buy Filament UI (cosmetic, not gameplay state)
    upgrades: {},
    automationOwned: {},
    automationActive: {},
    // Workshop space (room capacity + rented offices)
    roomCapacityBonus: 0,
    rentedSpaces: {},
    spaceUnpaid: {},
    // Finishing Studio (post-processing)
    processingUnlocked: false,
    processingStations: [{ id: ++stationId, stage:-1, item:null, progress:0 }],
    totalProcessed: 0,
    // Workforce
    staff: {},        // { finisher: 'worker'|'robot', marketer: 'worker'|'robot' }
    staffUnpaid: {},
    // Marketing
    timelapses: 0,
    totalTimelapses: 0,
    followers: 0,
    viralHits: 0,
    viralBoostUntil: 0,
    viralBoostMult: 1.0,
    marketerTimer: 0,
    // Exhibition events
    exhibitionsEnabled: false,
    exhibitionTimer: 0,
    exhibitionInterval: 150 + Math.random() * 150,
    pendingExhibition: null,
    exhibitionsAttended: 0,
    // Multipliers (recomputed from upgrades)
    speedMult: 1.0,
    filamentMult: 1.0,
    filamentPrice: 0.022,
    valueMult: 1.0,
    failRate: 0.08,
    industrialBonus: 1.0,
    decorativeBonus: 1.0,
    resinBonus: 1.0,
    unlockedAutoSell: false,
    bulkOrdersEnabled: false,
    // Stats
    totalPrints: 0,
    lifetimeEarned: 0,
    totalFilamentUsed: 0,
    totalMassSuccess: 0,
    totalMassFailed: 0,
    playTime: 0,
    startTime: Date.now(),
    // Auto timers
    bulkOrderTimer: 0,
    bulkOrderInterval: 120,
    // Bulk orders
    bulkOrdersAccepted: 0,
    pendingBulkOrder: null,
    // Custom commissions (3D modelling upsell)
    commissionsEnabled: false,
    commissionTimer: 0,
    commissionInterval: 200 + Math.random() * 200,
    pendingCommission: null,
    commissionsCompleted: 0,
    // Random events
    randomEventTimer: 0,
    randomEventInterval: 90 + Math.random() * 150,
    filamentPriceEventMult: 1.0,
    filamentPriceEventUntil: 0,
    failRateEventMult: 1.0,
    failRateEventUntil: 0,
    demandEventMult: 1.0,
    demandEventUntil: 0,
    // Prestige
    prestigeCount: 0,
    prestigeMult: 1.0,
    // Achievements
    achievements: [],
    // Income tracking
    incomeSamples: [],
    lastIncomeCalc: Date.now(),
    incomeRate: 0,
    // Phase
    phase: 'HOBBYIST',
    // Settings
    selectedProduct: 'keychain',
  };
}

function migrateState(state) {
  if (state.roomCapacityBonus === undefined) state.roomCapacityBonus = state.noPrinterLimit ? 92 : 0;
  if (!state.rentedSpaces) state.rentedSpaces = {};
  if (!state.spaceUnpaid) state.spaceUnpaid = {};
  // Safety clamp: never shrink capacity below what an existing fleet already occupies
  // (covers legacy saves from before the room-capacity system, or before this base dropped to 1)
  const neededCap = state.printers.length - ROOM_BASE_CAPACITY;
  if (neededCap > (state.roomCapacityBonus || 0)) state.roomCapacityBonus = neededCap;
  if (!state.rawInventory) state.rawInventory = {};
  if (!state.processingStations) state.processingStations = [{ id: ++stationId, stage:-1, item:null, progress:0 }];
  // Old stations stored a flat `productId` field on the station itself instead of a full item
  // (product+material+colour+printer) — backfill with generic PLA/black/ender3 so busy stations
  // don't lose their in-progress job on load.
  for (const st of state.processingStations) {
    if (st.stage !== -1 && !st.item) {
      st.item = { productId: st.productId || null, material:'pla', color:'black', printerTypeId:'ender3' };
    }
  }
  if (state.processingUnlocked === undefined) state.processingUnlocked = false;
  if (state.totalProcessed === undefined) state.totalProcessed = 0;
  if (!state.staff) state.staff = {};
  if (!state.staffUnpaid) state.staffUnpaid = {};
  if (state.timelapses === undefined) state.timelapses = 0;
  if (state.totalTimelapses === undefined) state.totalTimelapses = 0;
  if (state.followers === undefined) state.followers = 0;
  if (state.viralHits === undefined) state.viralHits = 0;
  if (state.viralBoostUntil === undefined) state.viralBoostUntil = 0;
  if (state.viralBoostMult === undefined) state.viralBoostMult = 1.0;
  if (state.marketerTimer === undefined) state.marketerTimer = 0;
  if (state.exhibitionsEnabled === undefined) state.exhibitionsEnabled = !!(state.upgrades && state.upgrades.social_media);
  if (state.exhibitionTimer === undefined) state.exhibitionTimer = 0;
  if (state.exhibitionInterval === undefined) state.exhibitionInterval = 150 + Math.random() * 150;
  if (state.pendingExhibition === undefined) state.pendingExhibition = null;
  if (state.exhibitionsAttended === undefined) state.exhibitionsAttended = 0;
  // Filament materials — old saves had a single `filament` gram count instead of per-material stock
  if (!state.filamentStock) {
    state.filamentStock = freshFilamentStock();
    state.filamentStock.pla.black = state.filament || 0;
  } else {
    // Each material may still be a flat gram number from before per-colour tracking existed —
    // fold that amount into "black" and backfill every other colour bucket to 0.
    for (const matId of Object.keys(MATERIALS)) {
      const existing = state.filamentStock[matId];
      if (typeof existing === 'number') {
        state.filamentStock[matId] = {};
        for (const cid of Object.keys(COLORS)) state.filamentStock[matId][cid] = 0;
        state.filamentStock[matId].black = existing;
      } else if (!existing) {
        state.filamentStock[matId] = {};
        for (const cid of Object.keys(COLORS)) state.filamentStock[matId][cid] = 0;
      } else {
        for (const cid of Object.keys(COLORS)) if (existing[cid] === undefined) existing[cid] = 0;
      }
    }
  }
  for (const p of state.printers) {
    if (!p.material) {
      const pt = PRINTER_TYPES[p.typeId];
      p.material = Object.values(MATERIALS).find(m => m.matClass === pt?.matClass)?.id || 'pla';
    }
    if (!p.color) p.color = 'black';
  }
  // Inventory/rawInventory used to be a flat productId -> qty map. Fold any leftover flat
  // entries into a generic PLA/black/ender3 stack so old saves don't lose their stock.
  for (const field of ['inventory', 'rawInventory']) {
    if (!state[field]) { state[field] = {}; continue; }
    const migrated = {};
    for (const [k, v] of Object.entries(state[field])) {
      if (typeof v === 'number') {
        if (v > 0) addToInventory(migrated, k, 'pla', 'black', 'ender3', v);
      } else if (v && typeof v === 'object') {
        migrated[k] = v;
      }
    }
    state[field] = migrated;
  }
  if (!state.filamentColorPick) state.filamentColorPick = {};
  if (state.totalMassSuccess === undefined) state.totalMassSuccess = 0;
  if (state.totalMassFailed === undefined) state.totalMassFailed = 0;
  if (state.commissionsEnabled === undefined) state.commissionsEnabled = !!(state.upgrades && state.upgrades.modelling_service);
  if (state.commissionTimer === undefined) state.commissionTimer = 0;
  if (state.commissionInterval === undefined) state.commissionInterval = 200 + Math.random() * 200;
  if (state.pendingCommission === undefined) state.pendingCommission = null;
  if (state.commissionsCompleted === undefined) state.commissionsCompleted = 0;
  if (state.randomEventTimer === undefined) state.randomEventTimer = 0;
  if (state.randomEventInterval === undefined) state.randomEventInterval = 90 + Math.random() * 150;
  if (state.filamentPriceEventMult === undefined) state.filamentPriceEventMult = 1.0;
  if (state.filamentPriceEventUntil === undefined) state.filamentPriceEventUntil = 0;
  if (state.failRateEventMult === undefined) state.failRateEventMult = 1.0;
  if (state.failRateEventUntil === undefined) state.failRateEventUntil = 0;
  if (state.demandEventMult === undefined) state.demandEventMult = 1.0;
  if (state.demandEventUntil === undefined) state.demandEventUntil = 0;
  // auto_sell was replaced by auto_liquidate — carry the purchase across so players don't lose
  // the automation slot they already paid for.
  if (state.automationOwned && state.automationOwned.auto_sell && !state.automationOwned.auto_liquidate) {
    state.automationOwned.auto_liquidate = true;
    state.automationActive.auto_liquidate = state.automationActive.auto_sell !== false;
  }
}

// ========================
// GAME LOOP
// ========================
let lastTick = 0;
let frameHandle;

function startLoop() {
  lastTick = performance.now();
  frameHandle = requestAnimationFrame(loop);
}

function loop(now) {
  const dt = Math.min((now - lastTick) / 1000, 5);
  lastTick = now;
  tick(dt);
  render();
  updateLiveProgress();
  frameHandle = requestAnimationFrame(loop);
}

function tick(dt) {
  if (!G) return;
  G.playTime += dt;

  // Process printers
  for (const p of G.printers) {
    if (!p.active || !p.job) continue;
    if (!p.printing) {
      if (G.automationOwned.auto_print && G.automationActive.auto_print) {
        tryStartPrint(p);
      }
      continue;
    }
    const pType = PRINTER_TYPES[p.typeId];
    const prod = PRODUCTS[p.job];
    if (!prod) continue;
    const speedBonus = G.ai_scheduler_bonus || 1.0;
    const rate = (pType.speed * G.speedMult * speedBonus * 100) / prod.printTime;
    p.progress += rate * dt;
    if (p.progress >= 100) {
      p.progress = 0;
      completePrint(p, p.activeJob || { productId: p.job, material: p.material, color: p.color, printerTypeId: p.typeId, filCost: getFilamentCost(prod, p.typeId) });
      p.activeJob = null;
      p.printing = false;
      if (G.automationOwned.auto_print && G.automationActive.auto_print) {
        tryStartPrint(p);
      }
    }
  }

  // Passive demand-driven sales — customers buy on their own once you have a storefront;
  // auto-liquidate keeps overflow stock from piling up forever.
  tickSales(dt);
  if (G.automationOwned.auto_liquidate && G.automationActive.auto_liquidate) {
    const cap = 50;
    for (const key of Object.keys(G.inventory)) {
      const stack = G.inventory[key];
      if (stack.qty > cap) liquidateStack(key, stack.qty - cap);
    }
  }

  // Auto-filament — resupplies whichever material+colour combos your printers are actually loaded with
  if (G.automationOwned.auto_filament && G.automationActive.auto_filament) {
    const threshold = 600;
    const qty = 1000;
    const inUse = new Set(G.printers.map(p => p.material + '|' + p.color));
    for (const combo of inUse) {
      const [matId, colorId] = combo.split('|');
      if (getFilamentGrams(matId, colorId) < threshold) {
        const cost = qty * getMaterialPrice(matId);
        if (G.money >= cost) {
          G.money -= cost;
          if (!G.filamentStock[matId]) G.filamentStock[matId] = {};
          G.filamentStock[matId][colorId] = (G.filamentStock[matId][colorId] || 0) + qty;
          toast(`📦 Auto-resupply: +${qty}g ${COLORS[colorId]?.name || ''} ${MATERIALS[matId].name}`, 'info');
        }
      }
    }
  }

  // JIT logistics — continuous discount applied via multiplier
  G.ai_scheduler_bonus = (G.automationOwned.ai_scheduler && G.automationActive.ai_scheduler) ? 1.18 : 1.0;

  // Finishing Studio, workforce wages, marketing, rent
  tickProcessing(dt);
  tickStaffWages(dt);
  tickMarketing(dt);
  tickRent(dt);
  tickRandomEvents(dt);

  // Bulk orders
  if (G.bulkOrdersEnabled && !G.pendingBulkOrder && !G.pendingExhibition && !G.pendingCommission) {
    G.bulkOrderTimer += dt;
    if (G.bulkOrderTimer >= G.bulkOrderInterval) {
      G.bulkOrderTimer = 0;
      G.bulkOrderInterval = 90 + Math.random() * 120;
      triggerBulkOrder();
    }
  }

  // Exhibition invitations
  if (G.exhibitionsEnabled && !G.pendingExhibition && !G.pendingBulkOrder && !G.pendingCommission) {
    G.exhibitionTimer += dt;
    if (G.exhibitionTimer >= G.exhibitionInterval) {
      G.exhibitionTimer = 0;
      G.exhibitionInterval = 150 + Math.random() * 150;
      triggerExhibition();
    }
  }

  // Custom commission requests (3D modelling upsell)
  if (G.commissionsEnabled && !G.pendingCommission && !G.pendingBulkOrder && !G.pendingExhibition) {
    G.commissionTimer += dt;
    if (G.commissionTimer >= G.commissionInterval) {
      G.commissionTimer = 0;
      G.commissionInterval = 200 + Math.random() * 200;
      triggerCommission();
    }
  }

  // Income rate (rolling 10s window)
  G.incomeSamples = G.incomeSamples.filter(s => now_t() - s.t < 10000);
  const totalRecent = G.incomeSamples.reduce((a,s) => a+s.v, 0);
  const window = Math.min(10, G.playTime);
  G.incomeRate = window > 0 ? totalRecent / window : 0;

  // Phase update
  updatePhase();

  // Achievement check
  checkAchievements();

  // Auto-save every 60s
  if (Math.floor(G.playTime) % 60 === 0 && Math.floor(G.playTime) > 0) {
    const key = `3dp_autosave_${Math.floor(G.playTime)}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      saveGame(true);
    }
  }
}

function now_t() { return performance.now(); }

function tryStartPrint(printer) {
  const prod = PRODUCTS[printer.job];
  if (!prod) return;
  const filCost = getFilamentCost(prod, printer.typeId);
  if (getFilamentGrams(printer.material, printer.color) >= filCost) {
    G.filamentStock[printer.material][printer.color] -= filCost;
    G.totalFilamentUsed += filCost;
    printer.printing = true;
    printer.progress = 0;
    printer.activeJob = { productId: printer.job, material: printer.material, color: printer.color, printerTypeId: printer.typeId, filCost };
  }
}

function completePrint(printer, job) {
  // Failure check — printer failMod and material failMod both make failures more/less likely
  const pTypeFail = PRINTER_TYPES[job.printerTypeId];
  const matFail = MATERIALS[job.material];
  const failed = Math.random() < G.failRate * (pTypeFail?.failMod || 1) * (matFail?.failMod || 1) * activeMult('failRateEvent');
  if (failed) {
    G.totalMassFailed += job.filCost;
    toast(`⚠️ Print failed on ${pTypeFail.name}!`, 'warning');
    return;
  }
  G.totalMassSuccess += job.filCost;
  addToInventory(G.rawInventory, job.productId, job.material, job.color, job.printerTypeId, 1);
  printer.totalPrints++;
  G.totalPrints++;

  // Timelapse capture — small chance per completed print
  if (Math.random() < 0.15) {
    G.timelapses++;
    G.totalTimelapses++;
  }
}

function manualStartPrint(printerId) {
  const p = G.printers.find(x => x.id === printerId);
  if (!p || p.printing) return;
  const prod = PRODUCTS[p.job];
  if (!prod) return;
  const filCost = getFilamentCost(prod, p.typeId);
  if (getFilamentGrams(p.material, p.color) < filCost) {
    toast(`⚠️ Not enough ${COLORS[p.color]?.name || ''} ${MATERIALS[p.material].name}!`, 'warning'); return;
  }
  G.filamentStock[p.material][p.color] -= filCost;
  G.totalFilamentUsed += filCost;
  p.printing = true;
  p.progress = 0;
  p.activeJob = { productId: p.job, material: p.material, color: p.color, printerTypeId: p.typeId, filCost };
}

function stopPrinter(printerId) {
  const p = G.printers.find(x => x.id === printerId);
  if (p) { p.printing = false; p.progress = 0; }
}

function getFilamentCost(prod, printerTypeId) {
  const eff = printerTypeId ? (PRINTER_TYPES[printerTypeId]?.eff || 1) : 1;
  return (prod.filament * G.filamentMult) / eff;
}

function getMaterialPrice(materialId) {
  const mat = MATERIALS[materialId];
  return G.filamentPrice * (mat?.costMult || 1) * activeMult('filamentPriceEvent');
}

// Value of ONE specific unit — a black PLA keychain off an ender3 and a red silk PETG keychain
// off a Mambo X1 are priced independently rather than being blended into one fleet-wide average,
// so switching material/colour per printer has a real, discrete effect on what that batch sells for.
function getProductValue(productId, printerTypeId, materialId, colorId) {
  const prod = PRODUCTS[productId];
  if (!prod) return 0;
  let v = prod.baseValue * G.valueMult * G.prestigeMult;
  const pType = PRINTER_TYPES[printerTypeId];
  if (pType) v *= pType.quality || 1;
  const mat = MATERIALS[materialId];
  if (mat) v *= mat.qualityMult || 1;
  const col = COLORS[colorId];
  if (col) v *= col.bonus || 1;
  // Printer-specific bonuses
  if (pType && pType.bonusProd === productId) v *= pType.bonusMult;
  // Industrial bonus
  if (productId === 'industrial') v *= G.industrialBonus;
  // Decorative bonus
  if (['planter','cosplay_prop','miniature'].includes(productId)) v *= G.decorativeBonus;
  // Resin bonus
  if (printerTypeId === 'resin') v *= G.resinBonus;
  // Marketing (followers + viral boost)
  v *= getMarketingMult();
  return Math.round(v * 100) / 100;
}

// Reference/catalogue price shown before any unit has actually been printed — uses global
// multipliers only, since there's no specific printer/material/colour combo to price yet.
function getBaseDisplayValue(productId) {
  const prod = PRODUCTS[productId];
  if (!prod) return 0;
  const v = prod.baseValue * G.valueMult * G.prestigeMult * getMarketingMult();
  return Math.round(v * 100) / 100;
}

// Active-event multiplier helper — `field` is the multiplier's base name; expects a matching
// `<field>Mult` and `<field>Until` (playTime-based) pair on G, same pattern as the viral boost.
function activeMult(field) {
  const untilVal = G[field + 'Until'];
  return (untilVal && G.playTime < untilVal) ? (G[field + 'Mult'] ?? 1.0) : 1.0;
}

function getMarketingMult() {
  const followerBonus = 1 + Math.min(G.followers, 20000) * 0.0002; // up to +4x at 20k followers... capped below
  const cappedFollowerBonus = Math.min(followerBonus, 1.5); // cap permanent bonus at +50%
  const viralActive = G.playTime < G.viralBoostUntil;
  return cappedFollowerBonus * (viralActive ? G.viralBoostMult : 1.0);
}

function printerRating(pt) {
  const all = Object.values(PRINTER_TYPES);
  const norm = (v, arr, invert) => {
    const min = Math.min(...arr), max = Math.max(...arr);
    if (max === min) return 3;
    let t = (v - min) / (max - min);
    if (invert) t = 1 - t;
    return Math.max(1, Math.min(5, Math.round(t * 4) + 1));
  };
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  return {
    speed:   stars(norm(pt.speed,   all.map(p=>p.speed),   false)),
    quality: stars(norm(pt.quality, all.map(p=>p.quality), false)),
    cost:    stars(norm(pt.cost,    all.map(p=>p.cost),    true)),
  };
}

function getRawSaleValue(productId, printerTypeId, materialId, colorId) {
  return Math.round(getProductValue(productId, printerTypeId, materialId, colorId) * RAW_SELL_MULT * 100) / 100;
}

// ========================
// SELL — passive, demand/publicity-driven. Nobody walks up and hands you cash for warehouse
// stock on command; customers discover and buy your listings over time based on your
// storefront reach (CraftBazaar Shop) and publicity (followers/viral boosts). The only manual
// cash-out is liquidating to a wholesaler below market rate, for players who need cash NOW.
// ========================
const BASE_SALE_RATE = 0.045; // expected passive sales per second, per unit of stock, at baseline reach
const LIQUIDATE_MULT = 0.55;

function tickSales(dt) {
  if (!G.unlockedAutoSell) return; // requires the CraftBazaar Shop upgrade — no storefront, no customers finding you
  const followerMult = 1 + Math.min(G.followers, 20000) / 4000; // publicity brings in more browsing customers
  const priceOptBonus = (G.automationOwned.price_opt && G.automationActive.price_opt) ? 1.22 : 1.0;
  const rate = BASE_SALE_RATE * followerMult * activeMult('demandEvent');
  for (const key of Object.keys(G.inventory)) {
    const stack = G.inventory[key];
    if (!stack || stack.qty <= 0) continue;
    stack.saleAccum = (stack.saleAccum || 0) + rate * dt;
    let sold = 0;
    while (stack.saleAccum >= 1 && sold < stack.qty) { stack.saleAccum -= 1; sold++; }
    if (sold <= 0) continue;
    stack.qty -= sold;
    const val = getProductValue(stack.productId, stack.printerTypeId, stack.material, stack.color);
    const earned = val * sold * priceOptBonus;
    G.money += earned;
    G.lifetimeEarned += earned;
    G.incomeSamples.push({ t: now_t(), v: earned });
  }
}

// Sell a stack instantly to a wholesaler, below market rate — the manual "I need cash now" option.
function liquidateStack(key, qty, event) {
  const stack = G.inventory[key];
  if (!stack || stack.qty < 1) return;
  const amount = Math.min(qty || 1, stack.qty);
  stack.qty -= amount;
  const val = getProductValue(stack.productId, stack.printerTypeId, stack.material, stack.color);
  const priceOptBonus = (G.automationOwned.price_opt && G.automationActive.price_opt) ? 1.22 : 1.0;
  const earned = val * LIQUIDATE_MULT * priceOptBonus * amount;
  G.money += earned;
  G.lifetimeEarned += earned;
  G.incomeSamples.push({ t: now_t(), v: earned });
  spawnFloat(`+$${fmtNum(earned)}`, event);
  return earned;
}

function getProductStock(productId) {
  let total = 0;
  for (const stack of Object.values(G.inventory)) if (stack.productId === productId) total += stack.qty;
  return total;
}

// Consumes up to `qty` units of a product across whichever material/colour stacks have it —
// used by bulk orders, which just want N units of a product, not a specific variant.
function consumeProductStock(productId, qty) {
  let remaining = qty;
  for (const stack of Object.values(G.inventory)) {
    if (remaining <= 0) break;
    if (stack.productId !== productId || stack.qty <= 0) continue;
    const take = Math.min(stack.qty, remaining);
    stack.qty -= take;
    remaining -= take;
  }
  return qty - remaining;
}

// ========================
// FINISHING STUDIO (post-processing)
// ========================
function sellRaw(key, qty, event) {
  const stack = G.rawInventory[key];
  if (!stack || stack.qty < 1) return;
  const amount = Math.min(qty || 1, stack.qty);
  stack.qty -= amount;
  const earned = getRawSaleValue(stack.productId, stack.printerTypeId, stack.material, stack.color) * amount;
  G.money += earned;
  G.lifetimeEarned += earned;
  G.incomeSamples.push({ t: now_t(), v: earned });
  spawnFloat(`+$${fmtNum(earned)}`, event);
}

function sendToProcessing(key) {
  const stack = G.rawInventory[key];
  if (!stack || stack.qty < 1) return;
  const station = G.processingStations.find(s => s.stage === -1);
  if (!station) { toast('All Finishing Studio stations are busy!', 'warning'); return; }
  stack.qty -= 1;
  station.item = { productId: stack.productId, material: stack.material, color: stack.color, printerTypeId: stack.printerTypeId };
  station.stage = 0;
  station.progress = 0;
}

function buyProcessingStation() {
  const baseCost = 2000;
  const owned = G.processingStations.length;
  const maxStations = 4;
  if (owned >= maxStations) { toast(`Max ${maxStations} Finishing Studio stations!`, 'warning'); return; }
  const cost = baseCost * Math.pow(1.8, owned - 1);
  if (G.money < cost) { toast('Not enough money!', 'error'); return; }
  G.money -= cost;
  G.processingStations.push({ id: ++stationId, stage:-1, item:null, progress:0 });
  toast('🎨 New Finishing Studio station built!', 'success');
}

function tickProcessing(dt) {
  if (!G.processingUnlocked) {
    // Feature not yet researched — raw items pass straight through to sellable inventory.
    for (const stack of Object.values(G.rawInventory)) {
      if (stack.qty > 0) {
        addToInventory(G.inventory, stack.productId, stack.material, stack.color, stack.printerTypeId, stack.qty);
        stack.qty = 0;
      }
    }
    return;
  }
  for (const station of G.processingStations) {
    if (station.stage === -1) continue;
    const stageDef = PROCESS_STAGES[station.stage];
    station.progress += (100 / stageDef.time) * dt * G.speedMult;
    if (station.progress >= 100) {
      station.progress = 0;
      station.stage++;
      if (station.stage >= PROCESS_STAGES.length) {
        addToInventory(G.inventory, station.item.productId, station.item.material, station.item.color, station.item.printerTypeId, 1);
        G.totalProcessed++;
        station.stage = -1;
        station.item = null;
      }
    }
  }
  // Finishing Technician / Finishing Robot Arm — auto-feeds idle stations
  if (G.staff.finisher && !G.staffUnpaid.finisher) {
    for (const station of G.processingStations) {
      if (station.stage !== -1) continue;
      const key = Object.keys(G.rawInventory).find(k => (G.rawInventory[k]?.qty || 0) > 0);
      if (key) sendToProcessing(key);
    }
  }
}

// ========================
// WORKFORCE (workers & robot arms)
// ========================
function hireWorker(roleId) {
  const role = STAFF_ROLES[roleId];
  if (!role || G.staff[roleId]) return;
  G.staff[roleId] = 'worker';
  delete G.staffUnpaid[roleId];
  toast(`🧑‍🔧 ${role.name} hired! Wage: $${role.wage.toFixed(2)}/sec`, 'success');
}

function buyRobot(roleId) {
  const role = STAFF_ROLES[roleId];
  if (!role) return;
  if (G.staff[roleId] === 'robot') return;
  if (G.money < role.robotCost) { toast('Not enough money!', 'error'); return; }
  G.money -= role.robotCost;
  G.staff[roleId] = 'robot';
  delete G.staffUnpaid[roleId];
  toast(`🦾 ${role.robotName} installed! No wages, works forever.`, 'success');
}

function fireWorker(roleId) {
  if (!G.staff[roleId]) return;
  delete G.staff[roleId];
  delete G.staffUnpaid[roleId];
}

function tickStaffWages(dt) {
  for (const [roleId, type] of Object.entries(G.staff)) {
    if (type !== 'worker') continue;
    const role = STAFF_ROLES[roleId];
    const cost = role.wage * dt;
    if (G.money >= cost) {
      G.money -= cost;
      G.staffUnpaid[roleId] = false;
    } else {
      if (!G.staffUnpaid[roleId]) toast(`⚠️ Can't pay ${role.name} — automation paused!`, 'warning');
      G.staffUnpaid[roleId] = true;
    }
  }
}

// ========================
// MARKETING (timelapses & followers)
// ========================
function postTimelapse() {
  if (G.timelapses < 1) { toast('No timelapse clips to post!', 'warning'); return; }
  G.timelapses--;
  const viral = Math.random() < 0.1;
  if (viral) {
    const gained = 200 + Math.floor(Math.random() * 800);
    G.followers += gained;
    G.viralHits++;
    G.viralBoostMult = 1.5;
    G.viralBoostUntil = G.playTime + 300;
    toast(`🔥 Your timelapse went VIRAL! +${gained} followers, +50% value for 5 min!`, 'success');
  } else {
    const gained = 10 + Math.floor(Math.random() * 40);
    G.followers += gained;
    G.viralBoostMult = 1.15;
    G.viralBoostUntil = G.playTime + 60;
    toast(`📲 Timelapse posted! +${gained} followers, +15% value for 1 min.`, 'info');
  }
}

function tickMarketing(dt) {
  if (G.staff.marketer && !G.staffUnpaid.marketer) {
    G.marketerTimer += dt;
    if (G.marketerTimer >= 5 && G.timelapses > 0) {
      G.marketerTimer = 0;
      postTimelapse();
    }
  }
}

// ========================
// BUY PRINTER
// ========================
function getRoomCapacity() {
  let cap = ROOM_BASE_CAPACITY + (G.roomCapacityBonus || 0);
  for (const [id, space] of Object.entries(OFFICE_SPACES)) {
    if (G.rentedSpaces[id] && !G.spaceUnpaid[id]) cap += space.capacity;
  }
  return cap;
}

function buyPrinter(typeId) {
  const pt = PRINTER_TYPES[typeId];
  if (!pt) return;
  const owned = G.printers.filter(p => p.typeId === typeId).length;
  if (owned >= pt.maxOwn) { toast(`Max ${pt.maxOwn} ${pt.name} printers!`, 'warning'); return; }
  const capacity = getRoomCapacity();
  if (G.printers.length >= capacity) { toast(`Workshop is full (${capacity}/${capacity})! Buy shelving or rent office space.`, 'warning'); return; }
  if (G.money < pt.cost) { toast('Not enough money!', 'error'); return; }
  G.money -= pt.cost;
  const defaultJob = G.unlockedProducts[G.unlockedProducts.length - 1] || 'keychain';
  const defaultMaterial = Object.values(MATERIALS).find(m => m.matClass === pt.matClass)?.id || 'pla';
  G.printers.push({ id: ++printerId, typeId, progress:0, printing:false, job:defaultJob, material:defaultMaterial, color:'black', totalPrints:0, active:true });
  toast(`🖨️ ${pt.name} added to your workshop!`, 'success');
}

function setPrinterMaterial(printerId, materialId) {
  const p = G.printers.find(x => x.id === printerId);
  const pt = p && PRINTER_TYPES[p.typeId];
  const mat = MATERIALS[materialId];
  if (!p || !mat || mat.matClass !== pt.matClass) return;
  p.material = materialId;
}

function setPrinterColor(printerId, colorId) {
  const p = G.printers.find(x => x.id === printerId);
  if (p && COLORS[colorId]) p.color = colorId;
}

// ========================
// WORKSHOP SPACE (office/warehouse rental)
// ========================
function rentSpace(id) {
  const space = OFFICE_SPACES[id];
  if (!space || G.rentedSpaces[id]) return;
  if (space.req && !G.upgrades[space.req] && !G.rentedSpaces[space.req]) { toast('Requirements not met!', 'warning'); return; }
  if (G.money < space.furnishing) { toast('Not enough money!', 'error'); return; }
  G.money -= space.furnishing;
  G.rentedSpaces[id] = true;
  delete G.spaceUnpaid[id];
  toast(`🏢 ${space.name} furnished and ready! +${space.capacity} room capacity.`, 'success');
}

function tickRent(dt) {
  for (const [id, space] of Object.entries(OFFICE_SPACES)) {
    if (!G.rentedSpaces[id]) continue;
    const cost = space.rent * dt;
    if (G.money >= cost) {
      G.money -= cost;
      G.spaceUnpaid[id] = false;
    } else {
      if (!G.spaceUnpaid[id]) toast(`⚠️ Rent overdue on ${space.name}! Buying new printers is paused there.`, 'warning');
      G.spaceUnpaid[id] = true;
    }
  }
}

// ========================
// BUY FILAMENT
// ========================
function buyFilament(materialId, colorId, grams) {
  const mat = MATERIALS[materialId];
  const col = COLORS[colorId] || COLORS.black;
  if (!mat) return;
  const jit = (G.automationOwned.jit_logistics && G.automationActive.jit_logistics) ? 0.72 : 1;
  const cost = grams * getMaterialPrice(materialId) * jit;
  if (G.money < cost) { toast('Not enough money!', 'error'); return; }
  G.money -= cost;
  if (!G.filamentStock[materialId]) G.filamentStock[materialId] = {};
  G.filamentStock[materialId][col.id] = (G.filamentStock[materialId][col.id] || 0) + grams;
  toast(`${mat.icon} +${fmtG(grams)} ${col.name} ${mat.name}`, 'info');
}

function openBulkFilament() {
  // Quick buy shortcut — tops up whichever material+colour combo your printers use most
  const counts = {};
  const colorCounts = {};
  for (const p of G.printers) {
    counts[p.material] = (counts[p.material] || 0) + 1;
    colorCounts[p.material] = colorCounts[p.material] || {};
    colorCounts[p.material][p.color] = (colorCounts[p.material][p.color] || 0) + 1;
  }
  const topMaterial = Object.keys(counts).sort((a,b) => counts[b]-counts[a])[0] || 'pla';
  const topColor = (colorCounts[topMaterial] && Object.keys(colorCounts[topMaterial]).sort((a,b) => colorCounts[topMaterial][b]-colorCounts[topMaterial][a])[0]) || 'black';
  buyFilament(topMaterial, topColor, 500);
}

// ========================
// UPGRADES
// ========================
function buyUpgrade(id) {
  const upg = UPGRADES[id];
  if (!upg || G.upgrades[id]) return;
  if (G.money < upg.cost) { toast('Not enough money!', 'error'); return; }
  const unmet = (upg.req || []).filter(r => !G.upgrades[r]);
  if (unmet.length > 0) { toast('Requirements not met!', 'warning'); return; }
  G.money -= upg.cost;
  G.upgrades[id] = true;
  upg.fn(G);
  toast(`🔬 ${upg.name} researched!`, 'success');
}

// ========================
// AUTOMATION
// ========================
function buyAutomation(id) {
  const a = AUTOMATION_ITEMS[id];
  if (!a || G.automationOwned[id]) return;
  if (a.req && !G.upgrades[a.req]) { toast(`Requires ${UPGRADES[a.req]?.name || a.req}!`, 'warning'); return; }
  if (G.money < a.cost) { toast('Not enough money!', 'error'); return; }
  G.money -= a.cost;
  G.automationOwned[id] = true;
  G.automationActive[id] = true;
  toast(`🤖 ${a.name} installed!`, 'success');
}

function toggleAutomation(id) {
  if (!G.automationOwned[id]) return;
  G.automationActive[id] = !G.automationActive[id];
}

// ========================
// PRODUCTS
// ========================
function unlockProduct(id) {
  const prod = PRODUCTS[id];
  if (!prod || G.unlockedProducts.includes(id)) return;
  if (prod.variantId && !G.unlockedProducts.includes(prod.baseId)) {
    toast(`Unlock ${PRODUCTS[prod.baseId].name} first!`, 'warning'); return;
  }
  if (G.money < prod.unlockCost) { toast('Not enough money!', 'error'); return; }
  G.money -= prod.unlockCost;
  G.unlockedProducts.push(id);
  toast(`📦 ${prod.name} unlocked! Check your catalogue.`, 'success');
}

// ========================
// BULK ORDERS
// ========================
function triggerBulkOrder() {
  const prods = G.unlockedProducts;
  const pid = prods[Math.floor(Math.random() * prods.length)];
  const prod = PRODUCTS[pid];
  const qty = 5 + Math.floor(Math.random() * 15);
  const bonus = 1.3 + Math.random() * 0.5;
  const reward = prod.baseValue * qty * bonus * G.valueMult * G.prestigeMult;
  G.pendingBulkOrder = { productId:pid, qty, reward:Math.round(reward*100)/100 };
  document.getElementById('bulk-modal-body').innerHTML = `A customer wants <strong>${qty}x ${prod.icon} ${prod.name}</strong> ASAP!`;
  document.getElementById('bulk-modal-reward').textContent = `$${fmtNum(G.pendingBulkOrder.reward)}`;
  document.getElementById('bulk-modal').classList.add('open');
}

function acceptBulkOrder() {
  if (!G.pendingBulkOrder) return;
  const inv = getProductStock(G.pendingBulkOrder.productId);
  if (inv >= G.pendingBulkOrder.qty) {
    consumeProductStock(G.pendingBulkOrder.productId, G.pendingBulkOrder.qty);
    G.money += G.pendingBulkOrder.reward;
    G.lifetimeEarned += G.pendingBulkOrder.reward;
    G.incomeSamples.push({ t: now_t(), v: G.pendingBulkOrder.reward });
    G.bulkOrdersAccepted++;
    toast(`📬 Bulk order fulfilled! +$${fmtNum(G.pendingBulkOrder.reward)}`, 'success');
  } else {
    toast(`❌ Not enough inventory! Need ${G.pendingBulkOrder.qty} items.`, 'error');
  }
  G.pendingBulkOrder = null;
  document.getElementById('bulk-modal').classList.remove('open');
}

function declineBulkOrder() {
  G.pendingBulkOrder = null;
  document.getElementById('bulk-modal').classList.remove('open');
}

// ========================
// EXHIBITIONS
// ========================
function triggerExhibition() {
  const expo = EXHIBITIONS[Math.floor(Math.random() * EXHIBITIONS.length)];
  const cost = Math.round(expo.costMin + Math.random() * (expo.costMax - expo.costMin));
  const followerGain = Math.round(expo.followerMin + Math.random() * (expo.followerMax - expo.followerMin));
  G.pendingExhibition = { name:expo.name, icon:expo.icon, cost, followerGain, boostMult:expo.boostMult, boostDuration:expo.boostDuration };
  document.getElementById('expo-modal-body').innerHTML = `<strong>${expo.icon} ${expo.name}</strong> has a booth open — attend for <strong>$${fmtNum(cost)}</strong> to reach ~${followerGain} new followers and a ×${expo.boostMult.toFixed(1)} value boost for ${Math.round(expo.boostDuration/60)} min.`;
  document.getElementById('expo-modal-cost').textContent = `$${fmtNum(cost)}`;
  document.getElementById('expo-modal').classList.add('open');
}

function acceptExhibition() {
  if (!G.pendingExhibition) return;
  const expo = G.pendingExhibition;
  if (G.money < expo.cost) { toast('Not enough money to book the booth!', 'error'); return; }
  G.money -= expo.cost;
  G.followers += expo.followerGain;
  G.exhibitionsAttended++;
  if (expo.boostMult > (G.playTime < G.viralBoostUntil ? G.viralBoostMult : 1)) {
    G.viralBoostMult = expo.boostMult;
  }
  G.viralBoostUntil = Math.max(G.viralBoostUntil, G.playTime + expo.boostDuration);
  toast(`🎪 Booth a hit at ${expo.name}! +${expo.followerGain} followers, ×${expo.boostMult.toFixed(1)} value for ${Math.round(expo.boostDuration/60)} min.`, 'success');
  G.pendingExhibition = null;
  document.getElementById('expo-modal').classList.remove('open');
}

function declineExhibition() {
  G.pendingExhibition = null;
  document.getElementById('expo-modal').classList.remove('open');
}

// ========================
// CUSTOM COMMISSIONS (3D modelling upsell)
// ========================
function triggerCommission() {
  const prods = G.unlockedProducts;
  const pid = prods[Math.floor(Math.random() * prods.length)];
  const prod = PRODUCTS[pid];
  const materials = Object.values(MATERIALS);
  const material = materials[Math.floor(Math.random() * materials.length)];
  const colors = Object.values(COLORS);
  const color = colors[Math.floor(Math.random() * colors.length)];
  const basePrice = Math.round(prod.baseValue * (1.5 + Math.random() * 1.5) * G.valueMult * G.prestigeMult * 100) / 100;
  const modelFee = Math.round(prod.baseValue * (2 + Math.random() * 3) * 100) / 100;
  G.pendingCommission = { productId:pid, material:material.id, color:color.id, basePrice, modelFee };
  document.getElementById('commission-modal-body').innerHTML = `A customer wants a custom <strong>${color.icon} ${color.name} ${material.icon} ${material.name} ${prod.icon} ${prod.name}</strong>.<br>Print-only pays <strong>$${fmtNum(basePrice)}</strong> — offer to design it in-house too and upsell your <strong>3D Modelling Service</strong> for an extra <strong>$${fmtNum(modelFee)}</strong>.`;
  document.getElementById('commission-modal-reward').textContent = `$${fmtNum(basePrice)} (+$${fmtNum(modelFee)} w/ modelling)`;
  document.getElementById('commission-modal').classList.add('open');
}

function acceptCommission(withModelling) {
  const c = G.pendingCommission;
  if (!c) return;
  const reward = withModelling ? c.basePrice + c.modelFee : c.basePrice;
  G.money += reward;
  G.lifetimeEarned += reward;
  G.incomeSamples.push({ t: now_t(), v: reward });
  G.commissionsCompleted++;
  toast(`🖥️ Commission fulfilled${withModelling ? ' + 3D modelling upsell' : ''}! +$${fmtNum(reward)}`, 'success');
  G.pendingCommission = null;
  document.getElementById('commission-modal').classList.remove('open');
}

function declineCommission() {
  G.pendingCommission = null;
  document.getElementById('commission-modal').classList.remove('open');
}

// ========================
// RANDOM EVENTS
// ========================
function tickRandomEvents(dt) {
  G.randomEventTimer += dt;
  if (G.randomEventTimer < G.randomEventInterval) return;
  G.randomEventTimer = 0;
  G.randomEventInterval = 90 + Math.random() * 150;
  triggerRandomEvent();
}

function triggerRandomEvent() {
  const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  const mins = ev.duration ? Math.round(ev.duration / 60 * 10) / 10 : 0;
  if (ev.type === 'discount') {
    G.filamentPriceEventMult = ev.mult;
    G.filamentPriceEventUntil = G.playTime + ev.duration;
    toast(ev.msg(mins), 'info');
  } else if (ev.type === 'failspike') {
    G.failRateEventMult = ev.mult;
    G.failRateEventUntil = G.playTime + ev.duration;
    toast(ev.msg(mins), 'warning');
  } else if (ev.type === 'followers') {
    const gained = Math.round(ev.amount[0] + Math.random() * (ev.amount[1] - ev.amount[0]));
    G.followers += gained;
    toast(ev.msg(gained), 'success');
  } else if (ev.type === 'demand') {
    G.demandEventMult = ev.mult;
    G.demandEventUntil = G.playTime + ev.duration;
    toast(ev.msg(mins), ev.mult >= 1 ? 'success' : 'warning');
  }
}

// ========================
// PHASE & PRESTIGE
// ========================
function updatePhase() {
  const e = G.lifetimeEarned;
  let phase = 'HOBBYIST';
  if (e >= 1000) phase = 'MAKER';
  if (e >= 10000) phase = 'BUSINESS';
  if (e >= 100000) phase = 'FARM';
  if (e >= 1000000) phase = 'EMPIRE';
  G.phase = phase;
}

function tryPrestige() {
  const req = 100000 * Math.pow(5, G.prestigeCount);
  if (G.lifetimeEarned < req) { toast(`Need $${fmtNum(req)} lifetime earned to Scale Up!`, 'warning'); return; }
  if (!confirm(`SCALE UP your business?\n\nYou'll restart with:\n• ×${(1.5*(G.prestigeCount+1)).toFixed(1)} permanent earnings multiplier\n• $500 starting cash\n• 800g filament\n\nAll printers, upgrades, and unlocks will reset.`)) return;
  const newMult = 1.0 + 0.5 * (G.prestigeCount + 1);
  const shopName = G.shopName;
  const pCount = G.prestigeCount + 1;
  G = defaultState(shopName);
  G.prestigeMult = newMult;
  G.prestigeCount = pCount;
  G.money = 500;
  G.filamentStock.pla.black = 800;
  toast(`⬆️ Scaled Up! ×${newMult.toFixed(1)} earnings multiplier active!`, 'success');
  saveGame(true);
}

// ========================
// ACHIEVEMENTS
// ========================
function checkAchievements() {
  for (const ach of ACHIEVEMENTS) {
    if (!G.achievements.includes(ach.id) && ach.check(G)) {
      G.achievements.push(ach.id);
      toast(`🏆 Achievement: ${ach.name}!`, 'success');
    }
  }
}

// ========================
// RENDER
// ========================
let activeTab = 'printers';
// Tab panels are fully rebuilt via innerHTML — doing that on every single animation frame
// (60/sec) constantly detaches/recreates interactive elements like the ▶ PRINT button, which
// can silently swallow a real mouse click landing mid-rebuild. Throttling the full structural
// rebuild fixes that; updateLiveProgress() below keeps progress bars animating smoothly at
// full framerate in between rebuilds via direct DOM writes, so throttling doesn't look jerky.
let lastTabRender = 0;
const TAB_RENDER_INTERVAL = 150;

// A rebuild also tears down and recreates every <select>/<input> in the panel, which yanks
// focus away from (and silently closes) any dropdown the player currently has open — it
// looks exactly like the control "deselecting" itself. Pausing rebuilds while a control is
// focused fixes that; the pending rebuild just runs on the next frame after they blur away.
// Only text-like inputs/selects need this — a checkbox has no "open" state to protect, and
// clicking one (e.g. an automation toggle) leaves it focused indefinitely, which would
// otherwise freeze that tab's rendering until the player clicks something else entirely.
function isProtectedControl(node) {
  if (node.tagName === 'SELECT' || node.tagName === 'TEXTAREA') return true;
  if (node.tagName !== 'INPUT') return false;
  return !['checkbox', 'radio', 'button', 'submit'].includes(node.type);
}
let controlFocused = false;
document.addEventListener('focusin', e => { if (isProtectedControl(e.target)) controlFocused = true; });
document.addEventListener('focusout', e => { if (isProtectedControl(e.target)) controlFocused = false; });

function renderActiveTab() {
  if (activeTab === 'printers') renderPrinters();
  else if (activeTab === 'products') renderProducts();
  else if (activeTab === 'upgrades') renderUpgrades();
  else if (activeTab === 'automation') renderAutomation();
  else if (activeTab === 'studio') renderStudio();
  else if (activeTab === 'stats') renderStats();
}

function render() {
  // HUD always updates — cheap textContent writes, no element churn
  renderHUD();
  if (controlFocused) return; // don't rebuild out from under a focused dropdown/input
  const now = now_t();
  if (now - lastTabRender < TAB_RENDER_INTERVAL) return;
  lastTabRender = now;
  renderActiveTab();
}

// Runs every frame regardless of the render throttle, so progress bars animate smoothly
// instead of snapping in steps every time a full rebuild happens. Only ever writes
// style.width/textContent on elements that already exist — never touches structure.
function updateLiveProgress() {
  if (!G) return;
  if (activeTab === 'printers') {
    for (const p of G.printers) {
      if (!p.printing) continue;
      const pct = Math.round(p.progress);
      const fill = document.getElementById('pf-' + p.id);
      const label = document.getElementById('pct-' + p.id);
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = pct + '%';
    }
  } else if (activeTab === 'studio') {
    for (const station of G.processingStations) {
      if (station.stage === -1) continue;
      const pct = Math.round(station.progress);
      const fill = document.getElementById('spf-' + station.id);
      const label = document.getElementById('spct-' + station.id);
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = pct + '%';
    }
  }
}

function renderHUD() {
  el('hud-brand').textContent = G.shopName;
  el('hud-money').textContent = '$' + fmtNum(G.money);
  el('hud-filament').textContent = fmtG(getTotalFilament());
  el('hud-income').textContent = '$' + fmtNum(G.incomeRate) + '/s';
  const totalInv = Object.values(G.inventory).reduce((a,s)=>a+s.qty,0);
  el('hud-inv').textContent = totalInv + ' items';
  el('hud-lifetime').textContent = '$' + fmtNum(G.lifetimeEarned);
  const badge = el('phase-badge');
  badge.textContent = G.phase;
  badge.className = 'phase-badge phase-' + G.phase.toLowerCase();
}

function renderPrinters() {
  // Active printers
  const wrap = el('active-printers-section');
  const capacity = getRoomCapacity();
  let html = '<div class="section-hdr"><h2>YOUR PRINTERS (' + G.printers.length + ' / ' + capacity + ')</h2><div class="hdr-line"></div></div>';

  for (const p of G.printers) {
    const pt = PRINTER_TYPES[p.typeId];
    const prod = PRODUCTS[p.job];
    const isActive = p.printing;
    html += `<div class="printer-card ${isActive ? 'active-print' : ''}">
      <div class="printer-row">
        <div style="font-size:28px">${pt.icon}</div>
        <div class="printer-info">
          <div class="printer-name">${pt.name}</div>
          <div class="printer-id">ID #${p.id} · ${p.totalPrints} prints · ${prod ? prod.icon + prod.name : 'No job'}</div>
        </div>
        <div class="printer-controls">
          <select class="sel" onchange="setPrinterJob(${p.id}, this.value)">
            ${G.unlockedProducts.map(pid => `<option value="${pid}" ${p.job===pid?'selected':''}>${PRODUCTS[pid].icon} ${PRODUCTS[pid].name}</option>`).join('')}
          </select>
          <select class="sel" onchange="setPrinterMaterial(${p.id}, this.value)" title="Material loaded">
            ${Object.values(MATERIALS).filter(m => m.matClass === pt.matClass).map(m => `<option value="${m.id}" ${p.material===m.id?'selected':''}>${m.icon} ${m.name}</option>`).join('')}
          </select>
          <select class="sel" onchange="setPrinterColor(${p.id}, this.value)" title="Colour loaded">
            ${Object.values(COLORS).map(c => `<option value="${c.id}" ${p.color===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
          </select>
          ${!isActive
            ? `<button class="btn btn-primary btn-sm" onclick="manualStartPrint(${p.id})">▶ PRINT</button>`
            : `<button class="btn btn-stop btn-sm" onclick="stopPrinter(${p.id})">■ STOP</button>`}
          <button class="btn btn-ghost btn-sm" onclick="sellPrinter(${p.id})" title="Sell this printer">🗑</button>
        </div>
      </div>`;
    if (isActive && prod) {
      const pct = Math.round(p.progress);
      const pt2 = PRINTER_TYPES[p.typeId];
      const filCost = fmtG(getFilamentCost(prod, p.typeId));
      const matInfo = MATERIALS[p.material];
      html += `<div class="progress-wrap">
        <div class="progress-label">
          <span>Printing ${prod.icon} ${prod.name} · ${filCost} ${matInfo.icon}${matInfo.name} → $${fmtNum(getProductValue(p.job, p.typeId, p.material, p.color))}</span>
          <span id="pct-${p.id}">${pct}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="pf-${p.id}" style="width:${pct}%;background:${pt2.color}"></div>
        </div>
      </div>`;
    }
    html += '</div>';
  }
  morph(wrap, html);

  // Buy printers grid
  const grid = el('buy-printers-grid');
  const roomFull = G.printers.length >= capacity;
  let bhtml = '';
  for (const [tid, pt] of Object.entries(PRINTER_TYPES)) {
    const owned = G.printers.filter(p => p.typeId === tid).length;
    const maxOwn = pt.maxOwn;
    const canAfford = G.money >= pt.cost;
    const atMax = owned >= maxOwn;
    if (atMax) continue;
    const blocked = !canAfford || roomFull;
    bhtml += `<div class="buy-printer-card ${blocked ? 'cannot-afford' : ''}" onclick="${!blocked ? `buyPrinter('${tid}')` : ''}">
      <div class="bpc-header">
        <span style="font-size:24px">${pt.icon}</span>
        <div>
          <div class="bpc-name">${pt.name} <span style="font-size:11px;color:var(--text2)">(${owned}/${maxOwn})</span></div>
          <div class="bpc-cost">${tid === 'ender3' && owned === 0 ? 'FREE' : '$' + fmtNum(pt.cost)}</div>
        </div>
      </div>
      <div class="bpc-desc">${pt.desc}</div>
      <div class="bpc-stats">
        <span class="bpc-stat">Speed: <span>${printerRating(pt).speed}</span></span>
        <span class="bpc-stat">Quality: <span>${printerRating(pt).quality}</span></span>
        <span class="bpc-stat">Cost: <span>${printerRating(pt).cost}</span></span>
      </div>
      <div class="bpc-stats" style="margin-top:4px">
        <span class="bpc-stat">Filament eff: <span>${(pt.eff*100).toFixed(0)}%</span></span>
        <span class="bpc-stat">Fail risk: <span>${(G.failRate*(pt.failMod||1)*100).toFixed(1)}%</span></span>
        ${pt.bonusProd ? `<span class="bpc-stat" style="color:var(--purple)">+${((pt.bonusMult-1)*100).toFixed(0)}% ${PRODUCTS[pt.bonusProd]?.name}</span>` : ''}
      </div>
      ${roomFull ? `<div class="tip" style="color:var(--red);margin-top:6px">Workshop full — free up capacity to buy</div>` : ''}
    </div>`;
  }
  if (!bhtml) bhtml = '<div class="empty-state">🏭 All available printer models maxed out!</div>';
  morph(grid, bhtml);

  // Workshop space section
  const spaceWrap = el('workshop-space-section');
  if (spaceWrap) {
    let shtml = `<div class="section-hdr"><h2>🏠 WORKSHOP SPACE — ${G.printers.length}/${capacity} BAYS USED</h2><div class="hdr-line"></div></div>
    <div class="tip" style="margin-bottom:10px">Your starting room holds just ${ROOM_BASE_CAPACITY} printer. Research shelving upgrades (Business tree) to grow it to 8, then rent office/industrial space once you outgrow the room.</div>
    <div class="grid-3">`;
    for (const [sid, space] of Object.entries(OFFICE_SPACES)) {
      const rented = !!G.rentedSpaces[sid];
      const reqOk = !space.req || G.upgrades[space.req] || G.rentedSpaces[space.req];
      const unpaid = G.spaceUnpaid[sid];
      shtml += `<div class="card ${rented ? 'highlight' : ''}">
        <div class="card-header"><span class="card-icon">${space.icon}</span><div><div class="card-title">${space.name}</div><div class="card-sub">+${space.capacity} capacity · $${space.rent.toFixed(2)}/sec rent</div></div></div>
        <div class="card-body">${space.desc}</div>`;
      if (rented) {
        shtml += `<span style="font-family:var(--font-mono);font-size:11px;color:${unpaid?'var(--red)':'var(--accent2)'}">${unpaid?'⚠️ RENT OVERDUE':'✓ LEASED & PAID UP'}</span>`;
      } else if (reqOk) {
        shtml += `<button class="btn btn-buy btn-sm" onclick="rentSpace('${sid}')" ${G.money<space.furnishing?'disabled':''}>FURNISH & LEASE — $${fmtNum(space.furnishing)}</button>`;
      } else {
        shtml += `<span style="font-size:11px;color:var(--text3)">Requires: ${space.req === 'mezzanine' ? 'Mezzanine Storage upgrade' : OFFICE_SPACES[space.req]?.name}</span>`;
      }
      shtml += `</div>`;
    }
    shtml += `</div>`;
    morph(spaceWrap, shtml);
  }

  // Filament / material section — stock is tracked per colour, so buying picks a colour first
  const filDisplay = el('fil-stock-display');
  filDisplay.textContent = fmtG(getTotalFilament());
  const filBtns = el('fil-buttons');
  const amounts = [100, 500, 2000];
  const jitActive = G.automationOwned.jit_logistics && G.automationActive.jit_logistics;
  morph(filBtns, Object.values(MATERIALS).map(mat => {
    const stockByColor = G.filamentStock[mat.id] || {};
    const totalStock = Object.values(stockByColor).reduce((a,b)=>a+b,0);
    const breakdown = Object.entries(stockByColor).filter(([,g])=>g>0).map(([cid,g])=>`${COLORS[cid]?.icon||''}${fmtG(g)}`).join(' · ');
    const pickedColor = G.filamentColorPick[mat.id] || 'black';
    const buttons = amounts.map(g => {
      const cost = g * getMaterialPrice(mat.id) * (jitActive ? 0.72 : 1);
      const canAfford = G.money >= cost;
      return `<button class="btn btn-buy btn-xs" onclick="buyFilament('${mat.id}', G.filamentColorPick['${mat.id}']||'black', ${g})" ${!canAfford?'disabled':''}>${fmtG(g)} — $${fmtNum(cost)}</button>`;
    }).join('');
    return `<div class="card" style="min-width:240px">
      <div class="card-header"><span class="card-icon">${mat.icon}</span><div><div class="card-title" style="font-size:14px">${mat.name}</div><div class="card-sub">${fmtG(totalStock)} total in stock</div></div></div>
      <div class="card-body" style="margin-bottom:8px">${mat.desc}${jitActive ? ' (−28% JIT)' : ''}</div>
      ${breakdown ? `<div class="tip" style="margin-bottom:6px">${breakdown}</div>` : ''}
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <label style="font-size:11px;color:var(--text2)">Buy colour:</label>
        <select class="sel" onchange="setFilamentColorPick('${mat.id}', this.value)">
          ${Object.values(COLORS).map(c => `<option value="${c.id}" ${pickedColor===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${buttons}</div>
    </div>`;
  }).join(''));
}

function setFilamentColorPick(materialId, colorId) {
  G.filamentColorPick[materialId] = colorId;
}

function setPrinterJob(printerId, productId) {
  const p = G.printers.find(x => x.id === printerId);
  if (p) p.job = productId;
}

function sellPrinter(pid) {
  const idx = G.printers.findIndex(p => p.id === pid);
  if (idx < 0) return;
  if (G.printers.length <= 1) { toast('You need at least one printer!', 'warning'); return; }
  const pt = PRINTER_TYPES[G.printers[idx].typeId];
  const refund = pt.cost * 0.4;
  if (!confirm(`Sell ${pt.name} for $${fmtNum(refund)}?`)) return;
  G.printers.splice(idx, 1);
  G.money += refund;
  toast(`🗑 Sold ${pt.name} for $${fmtNum(refund)}`, 'info');
}

function renderProducts() {
  // Ticker
  const tickerWrap = el('order-ticker-wrap');
  if (G.bulkOrdersEnabled) {
    tickerWrap.innerHTML = `<div class="order-ticker"><div class="ticker-dot"></div>Live market active · Bulk orders enabled · Dynamic pricing ${G.automationOwned.price_opt && G.automationActive.price_opt ? 'ON (+22%)' : 'OFF'}</div>`;
  } else tickerWrap.innerHTML = '';

  // Sell grid — inventory is grouped by product, but each material/colour/printer combo is its
  // own stack with its own price. Customers buy these off automatically over time (based on your
  // storefront + publicity); LIQUIDATE cashes a stack out immediately to a wholesaler at a discount.
  const sellGrid = el('sell-grid');
  const byProduct = {};
  for (const [key, stack] of Object.entries(G.inventory)) {
    if (!stack || stack.qty <= 0) continue;
    (byProduct[stack.productId] = byProduct[stack.productId] || []).push({ key, ...stack });
  }
  let sellHtml = '';
  for (const pid of G.unlockedProducts) {
    const stacks = byProduct[pid];
    if (!stacks || !stacks.length) continue;
    const prod = PRODUCTS[pid];
    const totalQty = stacks.reduce((a,s)=>a+s.qty, 0);
    sellHtml += `<div class="card">
      <div class="card-header">
        <span class="card-icon">${prod.icon}</span>
        <div><div class="card-title">${prod.name}</div><div class="card-sub">${totalQty} in stock across ${stacks.length} variant${stacks.length===1?'':'s'}</div></div>
      </div>
      <div class="stack-list">`;
    for (const s of stacks) {
      const mat = MATERIALS[s.material], col = COLORS[s.color], pt = PRINTER_TYPES[s.printerTypeId];
      const val = getProductValue(pid, s.printerTypeId, s.material, s.color);
      sellHtml += `<div class="stack-row">
        <span class="stack-desc">${mat?.icon||''}${mat?.name||'?'} · ${col?.icon||''}${col?.name||'?'} · ${pt?.name||'?'}</span>
        <span class="stack-qty">${s.qty}× @ $${fmtNum(val)}</span>
        <span class="stack-actions">
          <button class="btn btn-ghost btn-xs" onclick="liquidateStack('${s.key}',1,event)">LIQUIDATE 1</button>
          <button class="btn btn-ghost btn-xs" onclick="liquidateStack('${s.key}',${s.qty},event)">LIQUIDATE ALL</button>
        </span>
      </div>`;
    }
    sellHtml += `</div></div>`;
  }
  if (!sellHtml) sellHtml = `<div class="empty-state">No inventory yet — start printing! Every stack can be LIQUIDATED instantly for ${(LIQUIDATE_MULT*100).toFixed(0)}% value right away — that's your cash flow before you've researched anything. Once you research CraftBazaar Shop (Business tree), customers also start buying stock automatically on their own, based on demand and your publicity.</div>`;
  morph(sellGrid, sellHtml);

  // Product catalogue — grouped by base category (each has 4 variant tiers) so 100
  // products stay readable instead of one flat, overwhelming grid
  const grid = el('product-grid');
  function productCardHtml(pid) {
    const prod = PRODUCTS[pid];
    const unlocked = G.unlockedProducts.includes(pid);
    const val = unlocked ? getBaseDisplayValue(pid) : prod.baseValue;
    const inv = getProductStock(pid);
    const filCost = fmtG(prod.filament * G.filamentMult);
    return `<div class="product-card ${unlocked ? '' : 'locked'}">
      <div class="product-color-bar" style="background:${prod.color}"></div>
      <div class="product-icon">${prod.icon}</div>
      <div class="product-name">${prod.name}</div>
      <div class="product-value">~$${fmtNum(val)}</div>
      <div class="product-stats">
        <div class="product-stat-row">🧵 ${filCost}</div>
        <div class="product-stat-row">⏱ ${fmtTime(prod.printTime)}</div>
      </div>
      <div class="product-desc">${prod.desc}</div>
      <div class="inv-badge">📦 ${inv} in stock</div>
      ${!unlocked ? `<div class="unlock-overlay">
        <span>🔒 LOCKED</span>
        <span class="unlock-cost">$${fmtNum(prod.unlockCost)}</span>
        <button class="btn btn-buy btn-sm" onclick="unlockProduct('${pid}')" ${G.money<prod.unlockCost?'disabled':''}>UNLOCK</button>
      </div>` : ''}
    </div>`;
  }
  let html = '';
  for (const base of PRODUCT_BASES) {
    const baseUnlocked = G.unlockedProducts.includes(base.id);
    html += `<div class="cat-header"><div class="cat-label">${base.icon} ${base.name.toUpperCase()}</div><div class="cat-line"></div></div><div class="grid-3">`;
    html += productCardHtml(base.id);
    if (baseUnlocked) {
      for (const variant of PRODUCT_VARIANTS) html += productCardHtml(`${base.id}_${variant.id}`);
    } else {
      html += `<div class="card" style="display:flex;align-items:center;justify-content:center;text-align:center;color:var(--text3);font-size:12px;padding:20px">🔒 Unlock ${base.name} to reveal ${PRODUCT_VARIANTS.length} variant tiers (Mini, Glow-in-the-Dark, Deluxe, Custom Engraved)</div>`;
    }
    html += `</div>`;
  }
  morph(grid, html);
}

function renderUpgrades() {
  const wrap = el('upgrades-content');
  const cats = { speed:'⚡ PRINT SPEED', efficiency:'📦 EFFICIENCY', space:'🏠 WORKSHOP SPACE', business:'💼 BUSINESS', quality:'✨ QUALITY' };
  let html = '';

  if (G.prestigeCount > 0) {
    html += `<div class="prestige-banner">
      <div class="prestige-info">
        <div class="prestige-title">⬆️ SCALE UP ACTIVE</div>
        <div class="prestige-desc">You've scaled up ${G.prestigeCount}× — permanent earnings multiplier applied to all products.</div>
      </div>
      <div class="prestige-mult">×${G.prestigeMult.toFixed(1)}</div>
    </div>`;
  }

  for (const [catId, catLabel] of Object.entries(cats)) {
    html += `<div class="cat-header"><div class="cat-label">${catLabel}</div><div class="cat-line"></div></div>
    <div class="upgrade-grid">`;
    for (const [uid, upg] of Object.entries(UPGRADES)) {
      if (upg.cat !== catId) continue;
      const bought = !!G.upgrades[uid];
      const reqsMet = (upg.req||[]).every(r => G.upgrades[r]);
      const canAfford = G.money >= upg.cost;
      let cls = 'upgrade-card';
      if (bought) cls += ' bought';
      else if (!reqsMet) cls += ' locked';
      else if (canAfford) cls += ' affordable';
      html += `<div class="${cls}">
        <div class="upg-header">
          <div class="upg-icon">${upg.icon}</div>
          <div>
            <div class="upg-title">${upg.name}</div>
            <div class="upg-sub">${upg.cat}</div>
          </div>
        </div>
        <div class="upg-desc">${upg.desc}</div>
        <div class="upg-effect">${upg.effect}</div>
        <div class="upg-bottom">
          <div class="upg-cost">${bought ? '' : '$' + fmtNum(upg.cost)}</div>
          ${bought
            ? `<span class="bought-tag">✓ RESEARCHED</span>`
            : reqsMet
              ? `<button class="btn btn-primary btn-sm" onclick="buyUpgrade('${uid}')" ${!canAfford?'disabled':''}>RESEARCH</button>`
              : `<span style="font-size:11px;color:var(--text3)">Requires: ${upg.req.map(r=>UPGRADES[r]?.name||r).join(', ')}</span>`}
        </div>
      </div>`;
    }
    html += '</div>';
  }

  // Prestige
  const nextReq = 100000 * Math.pow(5, G.prestigeCount);
  html += `<div class="cat-header"><div class="cat-label">⬆️ SCALE UP (PRESTIGE)</div><div class="cat-line"></div></div>
  <div class="card" style="max-width:500px">
    <div class="card-header"><div class="card-icon">⬆️</div>
      <div><div class="card-title">Scale Up Your Business</div>
      <div class="card-sub">Reset for a permanent earnings multiplier</div></div>
    </div>
    <div class="card-body">Restart from scratch with a ×${(1.5*(G.prestigeCount+1)).toFixed(1)} permanent earnings multiplier. All printers, upgrades and products reset — but you keep your multiplier.</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div><div class="lbl">Lifetime Required</div><div class="val-big" style="color:var(--purple)">$${fmtNum(nextReq)}</div></div>
      <div><div class="lbl">Your Lifetime</div><div class="val-big" style="color:var(--gold)">$${fmtNum(G.lifetimeEarned)}</div></div>
      <button class="btn btn-sm" style="background:rgba(167,139,250,.15);border:1px solid rgba(167,139,250,.3);color:var(--purple)" onclick="tryPrestige()" ${G.lifetimeEarned<nextReq?'disabled':''}>SCALE UP ⬆️</button>
    </div>
  </div>`;

  morph(wrap, html);
}

function renderAutomation() {
  const wrap = el('automation-content');
  const tiers = { 1:'🔧 TIER 1 — BASICS', 2:'⚙️ TIER 2 — ADVANCED', 3:'🤖 TIER 3 — ENTERPRISE' };
  let html = '';
  for (const [tierNum, tierLabel] of Object.entries(tiers)) {
    html += `<div class="cat-header"><div class="cat-label">${tierLabel}</div><div class="cat-line"></div></div><div class="grid-2">`;
    for (const [aid, a] of Object.entries(AUTOMATION_ITEMS)) {
      if (a.tier !== Number(tierNum)) continue;
      const owned = !!G.automationOwned[aid];
      const active = !!G.automationActive[aid];
      const reqOk = !a.req || G.upgrades[a.req];
      html += `<div class="auto-card ${owned && active ? 'active' : ''}">
        <div class="auto-header">
          <div class="auto-icon">${a.icon}</div>
          <div>
            <div class="auto-title">${a.name}</div>
            <div class="auto-tier">Tier ${a.tier}</div>
          </div>
        </div>
        <div class="auto-desc">${a.desc}</div>
        <div class="toggle-row">
          ${owned
            ? `<label class="toggle"><input type="checkbox" ${active?'checked':''} onchange="toggleAutomation('${aid}')"><span class="toggle-slider"></span></label>
               <span style="font-family:var(--font-mono);font-size:11px;color:${active?'var(--accent2)':'var(--text3)'}">
               ${active ? 'RUNNING' : 'PAUSED'}</span>`
            : reqOk
              ? `<button class="btn btn-cyan btn-sm" onclick="buyAutomation('${aid}')" ${G.money<a.cost?'disabled':''}>INSTALL — $${fmtNum(a.cost)}</button>`
              : `<span style="font-size:11px;color:var(--text3)">Requires: ${UPGRADES[a.req]?.name || a.req}</span>`}
        </div>
        ${owned && aid === 'auto_filament' ? `
        <div class="auto-settings">
          <div class="setting-row"><span>Resupply threshold</span><span class="setting-val">600g</span></div>
          <div class="setting-row"><span>Buy amount</span><span class="setting-val">1,000g</span></div>
        </div>` : ''}
        ${owned && aid === 'auto_liquidate' ? `
        <div class="auto-settings">
          <div class="setting-row"><span>Overflow threshold</span><span class="setting-val">50 units/variant</span></div>
          <div class="setting-row"><span>Price opt bonus</span><span class="setting-val">${G.automationOwned.price_opt ? '+22%' : 'none'}</span></div>
        </div>` : ''}
      </div>`;
    }
    html += '</div>';
  }
  morph(wrap, html);
}

function renderStudio() {
  const wrap = el('studio-content');
  let html = '';

  // ---- Finishing Studio ----
  html += `<div class="section-hdr"><h2>🎨 FINISHING STUDIO</h2><div class="hdr-line"></div></div>`;
  if (!G.processingUnlocked) {
    html += `<div class="empty-state">🔒 Research the <strong>Post-Processing Kit</strong> upgrade (Quality tree) to unlock sanding, smoothing & painting stations.<br>Until then, prints go straight to sellable inventory.</div>`;
  } else {
    html += `<div class="tip" style="margin-bottom:10px">Raw prints must be sanded, smoothed & painted before they reach full value. Skip it and sell raw at ${(RAW_SELL_MULT*100).toFixed(0)}% value instead.</div>`;
    html += `<div class="grid-3" style="margin-bottom:16px">`;
    for (const station of G.processingStations) {
      const busy = station.stage !== -1;
      html += `<div class="card ${busy ? 'highlight' : ''}">
        <div class="card-header"><span class="card-icon">🎨</span><div><div class="card-title">Station #${station.id}</div><div class="card-sub">${busy ? PRODUCTS[station.item.productId].name : 'Idle'}</div></div></div>`;
      if (busy) {
        const stageDef = PROCESS_STAGES[station.stage];
        html += `<div class="progress-label"><span>${stageDef.icon} ${stageDef.name}</span><span id="spct-${station.id}">${Math.round(station.progress)}%</span></div>
        <div class="progress-track"><div class="progress-fill" id="spf-${station.id}" style="width:${Math.round(station.progress)}%;background:var(--purple)"></div></div>
        <div class="tip" style="margin-top:8px">Stage ${station.stage+1} / ${PROCESS_STAGES.length}</div>`;
      } else {
        html += `<div class="card-body">Waiting for a raw item to process.</div>`;
      }
      html += `</div>`;
    }
    const stationCost = 2000 * Math.pow(1.8, G.processingStations.length - 1);
    if (G.processingStations.length < 4) {
      html += `<div class="buy-printer-card ${G.money<stationCost?'cannot-afford':''}" onclick="${G.money>=stationCost?'buyProcessingStation()':''}">
        <div class="bpc-header"><span style="font-size:24px">➕</span><div><div class="bpc-name">Build Station</div><div class="bpc-cost">$${fmtNum(stationCost)}</div></div></div>
        <div class="bpc-desc">Add another Finishing Studio station (${G.processingStations.length}/4).</div>
      </div>`;
    }
    html += `</div>`;

    // Raw inventory — each material/colour/printer combo is its own stack
    html += `<div class="cat-header"><div class="cat-label">📦 RAW INVENTORY</div><div class="cat-line"></div></div><div class="grid-3">`;
    let anyRaw = false;
    for (const [key, stack] of Object.entries(G.rawInventory)) {
      if (!stack || stack.qty < 1) continue;
      anyRaw = true;
      const prod = PRODUCTS[stack.productId];
      const mat = MATERIALS[stack.material], col = COLORS[stack.color];
      html += `<div class="card">
        <div class="card-header"><span class="card-icon">${prod.icon}</span><div><div class="card-title">${prod.name}</div><div class="card-sub">${mat?.icon||''}${mat?.name||''} · ${col?.icon||''}${col?.name||''} · ${stack.qty} raw · sell @ $${fmtNum(getRawSaleValue(stack.productId, stack.printerTypeId, stack.material, stack.color))}</div></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-cyan btn-sm" onclick="sendToProcessing('${key}')">🎨 PROCESS</button>
          <button class="btn btn-ghost btn-sm" onclick="sellRaw('${key}',1,event)">SELL RAW</button>
        </div>
      </div>`;
    }
    if (!anyRaw) html += `<div class="empty-state">No raw prints waiting. Go print something!</div>`;
    html += `</div>`;
  }

  // ---- Workforce ----
  html += `<div class="section-gap"></div><div class="section-hdr"><h2>🦾 WORKFORCE</h2><div class="hdr-line"></div></div><div class="grid-2">`;
  for (const [roleId, role] of Object.entries(STAFF_ROLES)) {
    const current = G.staff[roleId];
    const unpaid = G.staffUnpaid[roleId];
    html += `<div class="auto-card ${current ? 'active' : ''}">
      <div class="auto-header"><div class="auto-icon">${current==='robot' ? role.robotIcon : role.icon}</div>
        <div><div class="auto-title">${current==='robot' ? role.robotName : role.name}</div><div class="auto-tier">${roleId === 'finisher' ? 'Finishing Studio' : 'Marketing'}</div></div>
      </div>
      <div class="auto-desc">${role.desc}</div>`;
    if (!current) {
      html += `<div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-cyan btn-sm" onclick="hireWorker('${roleId}')">HIRE — $${role.wage.toFixed(2)}/sec</button>
        <button class="btn btn-buy btn-sm" onclick="buyRobot('${roleId}')" ${G.money<role.robotCost?'disabled':''}>BUY ${role.robotIcon} — $${fmtNum(role.robotCost)}</button>
      </div>`;
    } else if (current === 'worker') {
      html += `<div class="toggle-row">
        <span style="font-family:var(--font-mono);font-size:11px;color:${unpaid?'var(--red)':'var(--accent2)'}">${unpaid?'⚠️ UNPAID — PAUSED':'ON PAYROLL'}</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-buy btn-xs" onclick="buyRobot('${roleId}')" ${G.money<role.robotCost?'disabled':''}>UPGRADE TO ${role.robotIcon}</button>
          <button class="btn btn-stop btn-xs" onclick="fireWorker('${roleId}')">FIRE</button>
        </div>
      </div>`;
    } else {
      html += `<span style="font-family:var(--font-mono);font-size:11px;color:var(--accent2)">✓ AUTOMATED — NO WAGES</span>`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  // ---- Marketing ----
  html += `<div class="section-gap"></div><div class="section-hdr"><h2>📲 MARKETING</h2><div class="hdr-line"></div></div>`;
  const viralActive = G.playTime < G.viralBoostUntil;
  html += `<div class="stats-grid">
    <div class="stat-card"><div class="stat-card-lbl">Followers</div><div class="stat-card-val" style="color:var(--blue)">${G.followers.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Timelapse Clips</div><div class="stat-card-val" style="color:var(--gold)">${G.timelapses}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Follower Value Bonus</div><div class="stat-card-val" style="color:var(--green)">+${((getMarketingMult()/(viralActive?G.viralBoostMult:1)-1)*100).toFixed(0)}%</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Viral Boost</div><div class="stat-card-val" style="color:${viralActive?'var(--accent)':'var(--text3)'}">${viralActive ? '×'+G.viralBoostMult.toFixed(2) : 'inactive'}</div></div>
  </div>
  <div class="card" style="max-width:460px">
    <div class="card-header"><span class="card-icon">🎥</span><div><div class="card-title">Post a Timelapse</div><div class="card-sub">${G.timelapses} clip${G.timelapses===1?'':'s'} ready</div></div></div>
    <div class="card-body">Prints have a chance to capture a timelapse clip. Post it for followers, a temporary value boost, and a shot at going viral.</div>
    <button class="btn btn-primary btn-sm" onclick="postTimelapse()" ${G.timelapses<1?'disabled':''}>📱 POST TIMELAPSE</button>
  </div>`;

  morph(wrap, html);
}

function renderStats() {
  const wrap = el('stats-content');
  const uptime = fmtPlaytime(G.playTime);
  const phase_desc = {
    HOBBYIST:'Learning the ropes. Keep printing!',
    MAKER:'Building momentum. Automate and expand.',
    BUSINESS:'Running a real operation. Scale up!',
    FARM:'Print farm mode. Dominating the market.',
    EMPIRE:'Manufacturing empire. You made it!',
  };
  let html = `<div class="stats-grid">
    <div class="stat-card"><div class="stat-card-lbl">Lifetime Earned</div><div class="stat-card-val" style="color:var(--gold)">$${fmtNum(G.lifetimeEarned)}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Current Balance</div><div class="stat-card-val" style="color:var(--green)">$${fmtNum(G.money)}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Total Prints</div><div class="stat-card-val">${G.totalPrints.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Filament Used</div><div class="stat-card-val" style="color:var(--accent2)">${fmtG(G.totalFilamentUsed)}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Printers Owned</div><div class="stat-card-val">${G.printers.length}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Upgrades Bought</div><div class="stat-card-val">${Object.keys(G.upgrades).length} / ${Object.keys(UPGRADES).length}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Play Time</div><div class="stat-card-val" style="font-size:15px">${uptime}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Scale Ups</div><div class="stat-card-val" style="color:var(--purple)">${G.prestigeCount}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Items Finished</div><div class="stat-card-val" style="color:var(--purple)">${G.totalProcessed.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Followers</div><div class="stat-card-val" style="color:var(--blue)">${G.followers.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Successful Print Mass</div><div class="stat-card-val" style="color:var(--green)">${fmtG(G.totalMassSuccess)}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Failed Print Mass</div><div class="stat-card-val" style="color:var(--red)">${fmtG(G.totalMassFailed)}</div></div>
    <div class="stat-card"><div class="stat-card-lbl">Commissions Fulfilled</div><div class="stat-card-val" style="color:var(--accent2)">${G.commissionsCompleted.toLocaleString()}</div></div>
  </div>
  <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:20px">
    <div style="font-family:var(--font-title);font-size:12px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">BUSINESS PHASE</div>
    <div style="font-size:22px;font-weight:700;color:var(--accent);font-family:var(--font-ui);margin-bottom:4px">${G.phase}</div>
    <div style="font-size:13px;color:var(--text2)">${phase_desc[G.phase] || ''}</div>
    ${G.prestigeMult > 1 ? `<div style="margin-top:8px;font-family:var(--font-mono);font-size:12px;color:var(--purple)">⬆️ Scale Up ×${G.prestigeMult.toFixed(1)} active</div>` : ''}
  </div>
  <div class="section-hdr"><h2>ACHIEVEMENTS (${G.achievements.length} / ${ACHIEVEMENTS.length})</h2><div class="hdr-line"></div></div>
  <div class="achievement-grid">`;
  for (const ach of ACHIEVEMENTS) {
    const done = G.achievements.includes(ach.id);
    html += `<div class="achievement ${done?'unlocked':'locked'}">
      <div class="ach-icon">${ach.icon}</div>
      <div><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div></div>
    </div>`;
  }
  html += '</div>';
  morph(wrap, html);
}

// ========================
// SAVE / LOAD
// ========================
function saveGame(silent) {
  try {
    const data = JSON.stringify(G);
    localStorage.setItem('3dp_tycoon_save', data);
    if (!silent) toast('💾 Game saved!', 'success');
  } catch(e) {
    toast('⚠️ Save failed! ' + e.message, 'error');
  }
}

function loadGame() {
  try {
    const data = localStorage.getItem('3dp_tycoon_save');
    if (!data) return false;
    const saved = JSON.parse(data);
    G = saved;
    migrateState(G);
    G.incomeRate = 0;
    G.incomeSamples = [];
    // Migrate printerId
    printerId = Math.max(...G.printers.map(p=>p.id), 0);
    stationId = Math.max(...G.processingStations.map(s=>s.id), 0);
    return true;
  } catch(e) {
    console.error('Load failed', e);
    return false;
  }
}

function loadGameFromSplash() {
  if (loadGame()) {
    document.getElementById('splash').classList.add('hidden');
    startLoop();
    render();
    toast('📂 Game loaded!', 'success');
  } else {
    toast('No save found!', 'error');
  }
}

function resetConfirm() {
  if (confirm('⚠️ RESET GAME?\n\nThis deletes ALL progress. This cannot be undone.\n\nHold SHIFT and click OK to confirm.')) {
    if (confirm('Are you absolutely sure? All your printers, money, and upgrades will be lost!')) {
      localStorage.removeItem('3dp_tycoon_save');
      location.reload();
    }
  }
}

function exportSave() {
  const data = JSON.stringify(G);
  const b64 = btoa(data);
  const el = document.createElement('textarea');
  el.value = b64;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  toast('📋 Save exported to clipboard (base64)', 'info');
}

function importSave(b64) {
  try {
    const data = JSON.parse(atob(b64));
    G = data;
    migrateState(G);
    G.incomeRate = 0;
    G.incomeSamples = [];
    printerId = Math.max(...G.printers.map(p=>p.id), 0);
    stationId = Math.max(...G.processingStations.map(s=>s.id), 0);
    toast('📂 Save imported!', 'success');
    lastTabRender = 0;
    return true;
  } catch(e) {
    toast('❌ Import failed: ' + e.message, 'error');
    return false;
  }
}

function importSaveFromPrompt() {
  const code = prompt('Paste your save code:');
  if (!code) return;
  if (!importSave(code.trim())) return;
  const splash = document.getElementById('splash');
  const onSplash = splash && !splash.classList.contains('hidden');
  if (onSplash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 700);
    startLoop();
  }
  render();
}

// ========================
// DEBUG CONSOLE
// ========================
const DEBUG_CODES = {
  'FILLAMENT':  ()=>{ Object.keys(MATERIALS).forEach(id=>{ Object.keys(COLORS).forEach(cid=>{ G.filamentStock[id][cid]+=10000; }); }); dbLog('Added 10kg of every material/colour', 'ok') },
  'MONEYBAGS':  ()=>{ G.money += 10000; dbLog('Added $10,000', 'ok') },
  'FATSTACK':   ()=>{ G.money += 1000000; G.lifetimeEarned += 1000000; dbLog('Added $1,000,000', 'ok') },
  'SPEEDRUN':   ()=>{ G.speedMult *= 5; setTimeout(()=>{ G.speedMult /= 5 }, 60000); dbLog('5× speed for 60s!', 'ok') },
  'UNLOCKALL':  ()=>{ G.unlockedProducts = Object.keys(PRODUCTS); dbLog('All products unlocked!', 'ok') },
  'RESEARCHALL':()=>{ Object.entries(UPGRADES).forEach(([id,u])=>{ if(!G.upgrades[id]){ G.upgrades[id]=true; u.fn(G); } }); dbLog('All upgrades applied!', 'ok') },
  'AUTOALL':    ()=>{ Object.keys(AUTOMATION_ITEMS).forEach(id=>{ G.automationOwned[id]=true; G.automationActive[id]=true; }); G.unlockedAutoSell=true; G.bulkOrdersEnabled=true; dbLog('All automation unlocked!', 'ok') },
  'GODMODE':    ()=>{ G.money+=999999; Object.keys(MATERIALS).forEach(id=>{ Object.keys(COLORS).forEach(cid=>{ G.filamentStock[id][cid]+=99999; }); }); G.speedMult*=10; Object.entries(UPGRADES).forEach(([id,u])=>{ if(!G.upgrades[id]){ G.upgrades[id]=true; u.fn(G); } }); G.unlockedProducts=Object.keys(PRODUCTS); Object.keys(AUTOMATION_ITEMS).forEach(id=>{ G.automationOwned[id]=true; G.automationActive[id]=true; }); G.followers+=1000; G.timelapses+=5; dbLog('GOD MODE ENABLED 🔥', 'ok') },
  'PRINTFARM':  ()=>{ ['ender3','bambu_a1','bambu_x1c'].forEach(t=>{ if(G.printers.length<getRoomCapacity()) buyPrinter(t) }); dbLog('Print farm spawned!', 'ok') },
  'PHASE5':     ()=>{ G.lifetimeEarned = 2000000; dbLog('Phase set to EMPIRE', 'ok') },
  'PRESTIGE1':  ()=>{ G.prestigeMult = 1.5; G.prestigeCount = 1; dbLog('Prestige 1 applied', 'ok') },
  'CLEARINV':   ()=>{ G.inventory = {}; dbLog('Inventory cleared', 'ok') },
  'GOVIRAL':    ()=>{ G.timelapses += 5; G.followers += 500; dbLog('Added 5 timelapse clips and 500 followers', 'ok') },
  'EXPAND':     ()=>{ Object.keys(OFFICE_SPACES).forEach(id=>{ G.rentedSpaces[id]=true; }); G.roomCapacityBonus=6; dbLog('All workshop space unlocked!', 'ok') },
  'EXPO':       ()=>{ if(!G.pendingExhibition) triggerExhibition(); dbLog('Exhibition invitation forced', 'ok') },
  'EXPORT':     ()=>{ exportSave(); dbLog('Save code copied to clipboard', 'ok') },
  'IMPORT':     ()=>{ importSaveFromPrompt(); },
  'VERSION':    ()=>dbLog('3DP Tycoon v' + VERSION, 'info'),
  'HELP':       ()=>dbLog('Codes: FILLAMENT MONEYBAGS FATSTACK SPEEDRUN UNLOCKALL RESEARCHALL AUTOALL GODMODE PRINTFARM PHASE5 PRESTIGE1 CLEARINV GOVIRAL EXPAND EXPO EXPORT IMPORT', 'info'),
};

function toggleDebug() {
  const d = document.getElementById('debug');
  d.classList.toggle('open');
  if (d.classList.contains('open')) document.getElementById('debug-input').focus();
}

function execDebug() {
  const input = document.getElementById('debug-input');
  const code = input.value.trim().toUpperCase();
  input.value = '';
  if (!code) return;
  dbLog('> ' + code, 'info');
  if (DEBUG_CODES[code]) {
    DEBUG_CODES[code]();
  } else {
    dbLog('Unknown code. Try HELP', 'err');
  }
}

function dbLog(msg, type) {
  const log = document.getElementById('debug-log');
  const line = document.createElement('div');
  line.className = 'debug-line ' + (type || '');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

// ========================
// UI HELPERS
// ========================
function switchTab(name) {
  activeTab = name;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('tab-' + name);
  const btn = document.getElementById('tab-btn-' + name);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  renderHUD();
  renderActiveTab();
  lastTabRender = now_t();
}

function el(id) { return document.getElementById(id); }

// Patches `container`'s children to match `html` instead of blindly replacing them (like
// innerHTML= does). Unchanged elements stay the exact same DOM node across renders, which is
// what makes it safe to re-render as often as we like: a button mid-click, a <select> with its
// native dropdown open, typed text in an <input> — none of that gets torn down just because a
// render happened to run at that moment, since morph only touches nodes whose attributes/text
// actually differ. Focused form controls additionally skip having their value/children touched
// at all, so an open dropdown or in-progress typing is never disturbed underneath the player.
function morph(container, html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  morphChildren(container, temp);
}

function morphChildren(oldParent, newParent) {
  let oldNode = oldParent.firstChild;
  let newNode = newParent.firstChild;
  while (oldNode && newNode) {
    const oldNext = oldNode.nextSibling;
    const newNext = newNode.nextSibling;
    morphNode(oldParent, oldNode, newNode);
    oldNode = oldNext;
    newNode = newNext;
  }
  while (oldNode) {
    const next = oldNode.nextSibling;
    oldParent.removeChild(oldNode);
    oldNode = next;
  }
  while (newNode) {
    const next = newNode.nextSibling;
    oldParent.appendChild(newNode);
    newNode = next;
  }
}

function morphNode(parent, oldNode, newNode) {
  if (oldNode.nodeType !== newNode.nodeType) { parent.replaceChild(newNode, oldNode); return; }
  if (oldNode.nodeType === 3 || oldNode.nodeType === 8) { // text / comment
    if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
    return;
  }
  if (oldNode.nodeType !== 1) return; // anything else: leave alone
  if (oldNode.tagName !== newNode.tagName) { parent.replaceChild(newNode, oldNode); return; }

  syncAttrs(oldNode, newNode);

  const isFocusedControl = oldNode === document.activeElement && isProtectedControl(oldNode);
  if (isFocusedControl) return; // don't touch value/open-state/children of a control in active use

  if ((oldNode.tagName === 'INPUT' || oldNode.tagName === 'TEXTAREA' || oldNode.tagName === 'SELECT')
      && oldNode.value !== newNode.value) {
    oldNode.value = newNode.value;
  }
  // checkbox/radio "checked" is a live property, not just an attribute — once the browser has
  // mounted the element, toggling the `checked` attribute alone doesn't move the visible switch
  if (oldNode.tagName === 'INPUT' && (oldNode.type === 'checkbox' || oldNode.type === 'radio')
      && oldNode.checked !== newNode.checked) {
    oldNode.checked = newNode.checked;
  }

  morphChildren(oldNode, newNode);
}

function syncAttrs(oldEl, newEl) {
  for (let i = oldEl.attributes.length - 1; i >= 0; i--) {
    const name = oldEl.attributes[i].name;
    if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
  }
  for (const attr of newEl.attributes) {
    if (oldEl.getAttribute(attr.name) !== attr.value) oldEl.setAttribute(attr.name, attr.value);
  }
}

function toast(msg, type, duration) {
  const container = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + (type||'');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toast-out .3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration || 3000);
}

function spawnFloat(text, event) {
  const floats = document.getElementById('floats');
  const el = document.createElement('div');
  el.className = 'float-num';
  const x = event ? (event.clientX || window.innerWidth/2) : window.innerWidth/2;
  const y = event ? (event.clientY || window.innerHeight/2) : window.innerHeight/2;
  el.style.left = (x + Math.random()*40-20) + 'px';
  el.style.top = (y - 10) + 'px';
  el.textContent = text;
  floats.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ========================
// FORMAT HELPERS
// ========================
function fmtNum(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toFixed(2);
}

function fmtG(g) {
  if (g >= 1000) return (g/1000).toFixed(2) + 'kg';
  return Math.round(g) + 'g';
}

function fmtTime(secs) {
  if (secs < 60) return secs + 's';
  return Math.floor(secs/60) + 'm ' + (secs%60) + 's';
}

function fmtPlaytime(s) {
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = Math.floor(s%60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

// ========================
// INIT
// ========================
function startGame() {
  const nameInput = document.getElementById('shop-name-input');
  const shopName = nameInput.value.trim() || 'MY PRINT SHOP';
  G = defaultState(shopName.toUpperCase());
  document.getElementById('splash').classList.add('hidden');
  setTimeout(() => document.getElementById('splash').remove(), 700);
  startLoop();
  toast('🖨️ Welcome to 3DP Tycoon! Start printing to earn money.', 'info', 5000);
  saveGame(true);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === '`') {
    e.preventDefault();
    toggleDebug();
  }
  // Don't intercept when typing in inputs
  if (e.target.tagName === 'INPUT') return;
  if (e.key === '1') switchTab('printers');
  if (e.key === '2') switchTab('products');
  if (e.key === '3') switchTab('upgrades');
  if (e.key === '4') switchTab('automation');
  if (e.key === '5') switchTab('studio');
  if (e.key === '6') switchTab('stats');
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveGame(); }
});

// Auto-save on page hide
document.addEventListener('visibilitychange', () => {
  if (document.hidden && G) saveGame(true);
});

window.addEventListener('beforeunload', () => {
  if (G) saveGame(true);
});

// Check for existing save on load
window.addEventListener('load', () => {
  const hasSave = !!localStorage.getItem('3dp_tycoon_save');
  if (hasSave) {
    const loadBtn = document.querySelector('.splash-load');
    loadBtn.textContent = '📂 Continue Saved Game';
    loadBtn.style.borderColor = 'var(--green)';
    loadBtn.style.color = 'var(--green)';
  }
  runBootLoadingBar();
});

// Cosmetic boot-up loading bar over the hero art — there's nothing to actually load
// (single-file game), so this is pure polish before revealing the start form.
const BOOT_MESSAGES = [
  [0,   'WARMING UP THE EXTRUDER...'],
  [30,  'LOADING FILAMENT SPOOLS...'],
  [60,  'CALIBRATING BED...'],
  [85,  'SLICING MODELS...'],
];
function runBootLoadingBar() {
  const fill = document.getElementById('splash-loading-fill');
  const label = document.getElementById('splash-loading-label');
  const loading = document.getElementById('splash-loading');
  const ready = document.getElementById('splash-ready');
  const duration = 1200;
  const start = performance.now();
  function frame(now) {
    // Clamp to 0 — the timestamp requestAnimationFrame hands the callback can, on the very
    // first frame, be marginally earlier than the performance.now() read that set `start`
    // (a real browser scheduling quirk), producing a negative pct that would otherwise fail
    // to match BOOT_MESSAGES' 0% threshold and crash on `msg[1]` below.
    const pct = Math.max(0, Math.min(100, ((now - start) / duration) * 100));
    fill.style.width = pct + '%';
    const msg = BOOT_MESSAGES.filter(([at]) => pct >= at).pop();
    label.textContent = `${msg[1]} ${Math.floor(pct)}%`;
    if (pct < 100) {
      requestAnimationFrame(frame);
    } else {
      loading.style.display = 'none';
      ready.classList.add('shown');
    }
  }
  requestAnimationFrame(frame);
}
