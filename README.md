# 🖨️ 3DP Tycoon

**Build your 3D printing empire from a single bedroom printer.**

An idle incremental business simulator where you grow a home-based 3D printing operation into a full manufacturing empire.

---

## 🎮 How to Play

1. **Start printing** — Select a product and hit ▶ PRINT on your Bender 3
2. **Sell products** — Go to the Products tab to sell your inventory for cash
3. **Buy filament** — Keep your stock up or automation will idle your printers
4. **Upgrade** — Research speed, efficiency, quality, and business upgrades
5. **Automate** — Unlock auto-print, auto-sell, and filament resupply
6. **Expand** — Buy printers with different speed/quality/cost tradeoffs and unlock premium products
7. **Make room** — You start with space for 1 printer; research cheap shelving upgrades to grow to 8, then rent office/industrial space beyond that
8. **Finish** — Research the Post-Processing Kit to sand, smooth & paint prints for full value in the Studio tab
9. **Market** — Post timelapse clips or attend exhibitions for followers, value boosts, and a shot at going viral
10. **Staff up** — Hire workers (wages) or buy robot arms (one-time cost) to automate finishing and marketing
11. **Scale Up** — Prestige for a permanent earnings multiplier

---

## 🖨️ Printers

Every printer trades off **speed**, **quality** (product value multiplier) and **cost** differently — there's no single best machine. Quality is judged as your fleet average, so a mix of machines shapes your overall sale prices; each printer also has its own filament efficiency and fail-rate modifier.

| Printer | Cost | Speed | Quality | Notes |
|---|---|---|---|---|
| Bender 3 Clone | Free | 1× | Baseline | Reliable starter |
| PrintPal Mini (Resin) | $150 | 1.3× | Low | Cheap but wasteful & finicky |
| Mambo Lab A1 | $800 | 2.5× | Above baseline | Solid all-rounder |
| Proton Mono M5S (Resin) | $2,200 | 3.5× | High | +60% miniature value |
| Mambo X1 Carbon | $3,500 | 5× | High | Fast, reliable, industry standard |
| Boron 2.4 350 | $9,500 | 9× | Below baseline | Extreme speed, DIY reliability issues |
| Gantry X9 Farm Unit | $18,000 | 14× | Below baseline | Built for volume, not finish |
| Helix CNC Precision Mill | $30,000 | 2× | Very high | Slow subtractive precision |
| Industrial FDM | $55,000 | 18× | High | Commercial-grade bulk production |
| Titan SLS Metal Printer | $120,000 | 4× | Highest | Best-in-class, slow & pricey |

## 📦 Products

20 product tiers from cheap novelties to aerospace-grade components — keychains, bottle openers, phone stands, coasters, cable organizers, desk organizers, miniatures, phone cases, jewelry boxes, planters, lamp shades, cosplay props, drone frames, RC car parts, architectural models, industrial parts, tooling jigs, prosthetic parts, automotive parts, and aerospace components.

---

## 🏠 Workshop Space

You start in a cramped bedroom with room for just **1 printer**. A cheap, early Workshop Space upgrade line (its own tree in Upgrades) grows that:

| Upgrade | Cost | Capacity after |
|---|---|---|
| *(starting room)* | — | 1 |
| Wall-Mounted Shelving | $250 | 3 |
| Overhead Rack System | $900 | 5 |
| Mezzanine Storage | $3,000 | 8 |

Once you've maxed out the room at 8, rent external space to keep growing:

| Space | Furnishing (one-time) | Rent | Capacity |
|---|---|---|---|
| Small Office Unit | $15,000 | $0.06/sec | +10 |
| Industrial Warehouse | $80,000 | $0.28/sec | +30 |
| Mega Factory Complex | $400,000 | $1.20/sec | +100 |

Rent is deducted automatically like staff wages — fall behind and the space's capacity bonus pauses (existing printers keep working) until you catch up.

## 🎪 Exhibitions

Once you've researched Social Media Presence, random exhibition invitations pop up — Local Maker Faire, Comic Con Artist Alley, Regional Trade Show, or International Expo. Pay the booth cost to gain followers and a temporary value boost, or skip it for free.

---

## 🎨 Finishing Studio (Post-Processing)

Unlocked by the **Post-Processing Kit** upgrade. Raw prints sit in a Raw Inventory until they're run through a station:

| Stage | Icon |
|---|---|
| Sanding | 🧹 |
| Smoothing | 🪄 |
| Painting | 🖌️ |

- Fully finished items sell for full value; skipping the studio and selling raw pays only 65%.
- Build up to 4 stations (cost scales per station).
- Automate the whole pipeline by hiring a **Finishing Technician** or buying a **Finishing Robot Arm**.

## 🦾 Workforce (Workers & Robot Arms)

Automate the Studio and Marketing tabs without touching upgrades:

| Role | Worker (wage/sec) | Robot Arm (one-time) |
|---|---|---|
| Finishing Technician / Finishing Robot Arm | $0.15/sec | $4,000 |
| Social Media Manager / Autoposter Bot | $0.12/sec | $3,000 |

Workers get paid automatically from your balance each tick — if you run out of cash they pause until you can afford it. Robot arms cost more upfront but never need paying.

## 📲 Marketing (Timelapses & Followers)

Completed prints have a chance to capture a timelapse clip. Post clips from the Studio tab to gain followers and a temporary sell-value boost — with a chance to go viral for a much bigger payout. Followers also grant a small permanent value bonus (capped at +50%).

---

## 🔑 Keyboard Shortcuts

| Key | Action |
|---|---|
| `` ` `` | Open debug console |
| `1–6` | Switch tabs (Printers, Products, Upgrades, Automation, Studio, Stats) |
| `Ctrl+S` | Save game |

## 🐛 Debug Codes

Open the debug console with `` ` `` and enter:

| Code | Effect |
|---|---|
| `HELP` | List all codes |
| `FILLAMENT` | +10kg filament |
| `MONEYBAGS` | +$10,000 |
| `FATSTACK` | +$1,000,000 |
| `SPEEDRUN` | 5× speed for 60s |
| `UNLOCKALL` | Unlock all products |
| `RESEARCHALL` | Apply all upgrades |
| `AUTOALL` | Install all automation |
| `GODMODE` | Everything |
| `PRINTFARM` | Spawn printer farm |
| `PHASE5` | Jump to Empire phase |
| `PRESTIGE1` | Apply first prestige |
| `GOVIRAL` | +5 timelapse clips, +500 followers |
| `EXPAND` | Unlock all workshop space & rentals |
| `EXPO` | Force an exhibition invitation |

---

## 🚀 Deployment

### GitHub Pages
Push to GitHub and enable Pages for the `main` branch.

### Zeabur
1. Push to GitHub
2. Connect repo to Zeabur
3. Select **Node.js** runtime — it auto-detects `server.js`
4. Deploy!

---

## 💾 Save System

- **Auto-saves** every 60 seconds
- **Auto-saves** on tab close / page hide
- Manual save with `Ctrl+S` or the 💾 button
- Save data stored in `localStorage`

---

## 📋 Changelog

Versioning follows `MAJOR.MINOR.PATCH`: **major** bumps for breaking/structural changes (save format, core loop rework), **minor** bumps for new features (printers, products, systems), **patch** bumps for balance tweaks and bug fixes.

### v1.3.0
- Expanded to 20 products (from 7) spanning novelties to aerospace components
- 4 new printers with real speed/quality/cost tradeoffs (PrintPal Mini, Gantry X9 Farm Unit, Helix CNC Precision Mill, Titan SLS Metal Printer); printer buy cards show star ratings, fail risk & filament efficiency
- Fleet quality system: your printer roster's average quality now affects sale prices
- Workshop Space: start with a 1-printer room, grow it to 8 via 3 cheap shelving upgrades, then rent 3 tiers of office/industrial space with one-time furnishing + ongoing rent for further capacity
- Exhibition random events: attend a booth (Maker Faire → International Expo) for followers + a temporary value boost, or skip for free
- 3 new achievements (Machine Shop, Trade Show Regular, Factory Floor) and `EXPAND`/`EXPO` debug codes

### v1.2.0
- Finishing Studio: post-print sanding/smoothing/painting pipeline with sellable raw-vs-processed pricing
- Workforce system: hire wage-earning workers or buy one-time robot arms to automate finishing & marketing
- Marketing system: timelapse capture, follower count, viral posts, and temporary/permanent value bonuses
- 3 new achievements (Finishing Touches, Influencer, Went Viral) and `GOVIRAL` debug code

### v1.1.0
- Achievements system with unlock tracking
- Save export/import via clipboard (base64)

### v1.0.0 — Initial Release
- Core idle loop: print, sell, buy filament, research, automate, expand, prestige
- 6 printers (Bender 3 Clone → Industrial FDM), 7 product tiers
- Debug console with cheat codes
- Auto-save (interval + on tab close) and manual save

---

## 🗺️ Future Roadmap

- **Sound & music** — printer hum, sale chimes, ambient workshop track with a mute toggle
- **Mobile-friendly layout** — touch-sized controls and a responsive layout for phones/tablets
- **Cloud save sync** — optional account-based save backup so progress isn't tied to one browser
- **Leaderboards** — compare prestige count / net worth with other players (needs a backend)
- **More prestige layers** — a second "meta" prestige beyond `PRESTIGE1` for long-term progression
- **More random events** — printer jams, filament price swings, and other variance beyond bulk orders & exhibitions
- **Statistics dashboard** — lifetime totals, per-product profit graphs, printtime breakdown
- **Themes/skins** — alternate UI palettes or a light mode
- **Mod/community recipes** — JSON-defined custom products or printers for self-hosters

---

Made with ❤️ and molten filament.
