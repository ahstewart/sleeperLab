# Fantasy Rule Sandbox — Project Overview

## What this is

A Sleeper-native web app that lets fantasy football managers load their actual league via the Sleeper API, then experiment with scoring and roster rule changes to preview how positional value shifts before the season. Each manager in the league gets one rule change per season; this tool exists so the group can propose, visualize, and compare changes collaboratively — and avoid inadvertently making the season one-dimensional.

---

## Core problem being solved

When rule changes stack across multiple managers, the cumulative effect on positional value isn't intuitive. A rushing yard buff looks reasonable in isolation, but combined with fewer flex spots and no bench depth it can make RBs the only position that matters. This tool lets the league see that before it happens, using their own real league settings as the baseline.

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast iteration, component model fits the tabbed UI |
| Styling | Tailwind CSS | Utility-first, consistent design tokens |
| Charts | Recharts | React-native, clean bar/radar for positional value |
| Backend | None | Sleeper API is public, CORS-friendly, no auth needed; all logic is client-side |
| State | Zustand | Lightweight global store; league data + sandbox state live here |
| Persistence | localStorage | Saved scenarios survive refresh, no backend needed |
| Hosting | Vercel or Netlify | One-command deploy, shareable URL for the league |

---

## Sleeper API integration

This is the foundation of the app, not an add-on. All real league data comes from Sleeper's public read-only API. No API token required.

### Endpoints used

| Purpose | Endpoint |
|---|---|
| Fetch league settings, scoring, roster positions | `GET /v1/league/<league_id>` |
| Fetch all managers in the league | `GET /v1/league/<league_id>/users` |
| Fetch rosters (links managers to roster slots) | `GET /v1/league/<league_id>/rosters` |
| Fetch current NFL season state | `GET /v1/state/nfl` |

### Key data the app extracts from Sleeper

**From `GET /v1/league/<league_id>`:**

```json
{
  "name": "Sleeperbot Friends League",
  "total_rosters": 12,
  "scoring_settings": {
    "pass_yd": 0.04,
    "pass_td": 4,
    "pass_int": -2,
    "rush_yd": 0.1,
    "rush_td": 6,
    "rec": 1,
    "rec_yd": 0.1,
    "rec_td": 6
  },
  "roster_positions": ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF", "BN", "BN", "BN", "BN", "BN", "BN"]
}
```

The `roster_positions` array is the source of truth for lineup construction. Count occurrences of each position string to derive slot counts. `BN` = bench spot.

**From `GET /v1/league/<league_id>/users`:**

```json
[
  {
    "user_id": "12345678",
    "display_name": "andrew",
    "avatar": "abc123",
    "metadata": { "team_name": "Chaos Theory" },
    "is_owner": true
  }
]
```

**From `GET /v1/league/<league_id>/rosters`:**

```json
[
  {
    "roster_id": 1,
    "owner_id": "12345678"
  }
]
```

Join `users` + `rosters` on `user_id` / `owner_id` to map each roster slot to a display name and avatar.

### Scoring settings field reference

Sleeper's `scoring_settings` object uses snake_case keys. The most common ones:

| Sleeper key | Meaning |
|---|---|
| `pass_yd` | Points per passing yard |
| `pass_td` | Points per passing TD |
| `pass_int` | Points per interception (usually negative) |
| `rush_yd` | Points per rushing yard |
| `rush_td` | Points per rushing TD |
| `rec` | Points per reception (PPR value) |
| `rec_yd` | Points per receiving yard |
| `rec_td` | Points per receiving TD |
| `bonus_rec_te` | TE premium bonus per reception |
| `fum_lost` | Points per fumble lost (usually negative) |
| `sack` | Points per sack (DEF) |
| `int` | Points per INT forced (DEF) |

The full object can have 50+ keys. The app should map the relevant ones to its internal scoring model and surface the rest as read-only metadata.

### Roster position strings

Sleeper uses these strings in the `roster_positions` array:

`QB`, `RB`, `WR`, `TE`, `FLEX`, `SUPER_FLEX`, `REC_FLEX`, `K`, `DEF`, `IDP_FLEX`, `DL`, `LB`, `DB`, `BN`, `IR`

For this app, focus on: `QB`, `RB`, `WR`, `TE`, `FLEX`, `SUPER_FLEX`, `K`, `DEF`, `BN`.

---

## App flow

```
1. Landing page
   └─ User enters Sleeper league ID
   └─ App fetches league + users + rosters in parallel
   └─ Parses and stores as the "baseline" ruleset

2. Sandbox (main app)
   ├─ Scoring rules tab     — sliders pre-populated from league's actual scoring_settings
   ├─ Roster settings tab   — inputs pre-populated from league's actual roster_positions
   ├─ Season impact tab     — live positional value cards, balance meter, scarcity
   └─ Compare scenarios tab — save/compare named rulesets side by side

3. Sharing
   └─ Any saved scenario can be encoded into a URL param and shared with league mates
```

---

## App structure

```
src/
  pages/
    LandingPage.jsx          # League ID entry, fetch, loading state
    SandboxPage.jsx          # Main tabbed sandbox UI

  components/
    LeagueHeader.jsx         # League name, avatar, manager chips
    ScoringPanel.jsx         # Sliders for scoring settings
    RosterPanel.jsx          # Inputs for lineup slot counts
    ImpactPanel.jsx          # Position value cards + balance meter + scarcity
    ComparePanel.jsx         # Saved scenario comparison table
    PositionCard.jsx         # Reusable: pts/wk estimate + bar
    BalanceMeter.jsx         # Diversity score with verdict
    ScarcityRow.jsx          # Per-position demand vs NFL supply
    ManagerList.jsx          # Shows league managers with avatars

  lib/
    sleeperApi.js            # All Sleeper API calls, returns normalized data
    parseLeague.js           # Converts Sleeper API response to internal settings model
    scoring.js               # calcPositionScore(pos, scoringSettings) — pure function
    scarcity.js              # calcScarcity(rosterSettings, leagueSize) — pure function
    diversity.js             # calcDiversityScore(scores) returns 0–1 — pure function
    nflBaselines.js          # Average weekly stat lines per position (static data)
    urlState.js              # Encode/decode scenario to/from URL query param

  store/
    useLeagueStore.js        # Zustand: raw Sleeper data, loading/error state
    useSandboxStore.js       # Zustand: current scoring + roster settings, scenarios

  hooks/
    useLeagueData.js         # Orchestrates fetching, parsing, and storing league data

  App.jsx
  main.jsx
```

---

## Data flow

```
User enters league ID
        |
sleeperApi.js fetches in parallel:
  - /league/<id>           -> league name, scoring_settings, roster_positions
  - /league/<id>/users     -> display names, avatars
  - /league/<id>/rosters   -> roster_id to owner_id mapping
        |
parseLeague.js normalizes:
  - scoring_settings  -> internal ScoringSettings object
  - roster_positions  -> internal RosterSettings object
  - users + rosters   -> Manager[] with name, avatar, roster_id
        |
Zustand stores hydrated
        |
Sandbox panels render, pre-populated with real league values
        |
User adjusts sliders/inputs
        |
scoring.js + diversity.js + scarcity.js recalculate live
        |
ImpactPanel re-renders
```

---

## Internal data models

### ScoringSettings (internal)
```js
{
  passYds: 0.04,
  passTd: 4,
  passInt: -2,
  rushYds: 0.1,
  rushTd: 6,
  recYds: 0.1,
  rec: 1.0,         // PPR
  recTd: 6,
  bonusRecTe: 0,    // TE premium
  fumLost: -2,
}
```

### RosterSettings (internal)
```js
{
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,        // RB/WR/TE flex
  superFlex: 0,   // QB/RB/WR/TE flex
  k: 1,
  dst: 1,
  bench: 6,
  teams: 12,      // from total_rosters
}
```

### Manager
```js
{
  userId: "12345678",
  displayName: "andrew",
  teamName: "Chaos Theory",   // from metadata, falls back to displayName
  avatarUrl: "https://sleepercdn.com/avatars/thumbs/abc123",
  rosterId: 1,
  isCommissioner: true,
}
```

### Scenario (saved sandbox state)
```js
{
  id: "uuid",
  name: "Proposed: double rush yards",
  createdAt: 1720000000000,
  scoring: ScoringSettings,
  roster: RosterSettings,
  positionScores: { QB: 18.4, RB: 24.1, WR: 19.2, TE: 10.3, K: 8.5, DEF: 8.0 },
  diversityScore: 0.72,
}
```

---

## Calculation logic

```js
// src/lib/scoring.js
import { BASELINES } from './nflBaselines.js';

export function calcPositionScore(pos, scoring) {
  const s = BASELINES[pos];
  if (pos === 'K')   return s.fgAvg;
  if (pos === 'DEF') return s.baseAvg;
  return (
    s.passYds * scoring.passYds +
    s.passTd  * scoring.passTd  +
    s.passInt * scoring.passInt +
    s.rushYds * scoring.rushYds +
    s.rushTd  * scoring.rushTd  +
    s.recYds  * scoring.recYds  +
    s.rec     * scoring.rec     +
    s.recTd   * scoring.recTd
  );
}

// src/lib/diversity.js
export function calcDiversityScore(scores) {
  const vals = Object.values(scores).sort((a, b) => b - a);
  const top = vals[0] || 1;
  return vals.slice(0, 4).reduce((sum, v) => sum + v / top, 0) / 4;
}

// src/lib/scarcity.js
const NFL_SUPPLY = { QB: 32, RB: 64, WR: 96, TE: 32, K: 32, DEF: 32 };

export function calcScarcity(roster, teams) {
  const needed = {
    QB:  roster.qb * teams,
    RB:  (roster.rb + (roster.flex + roster.superFlex) * 0.35) * teams,
    WR:  (roster.wr + (roster.flex + roster.superFlex) * 0.45) * teams,
    TE:  (roster.te + roster.flex * 0.2) * teams,
    K:   roster.k * teams,
    DEF: roster.dst * teams,
  };
  return Object.fromEntries(
    Object.entries(needed).map(([pos, n]) => [
      pos,
      { needed: Math.round(n), supply: NFL_SUPPLY[pos], pct: Math.round(n / NFL_SUPPLY[pos] * 100) }
    ])
  );
}
```

---

## NFL baseline stats

These are representative weekly averages for a startable player (not top scorer, not bench depth). Used to estimate positional value under any scoring ruleset. Update once per offseason.

```js
// src/lib/nflBaselines.js
export const BASELINES = {
  QB:  { passYds: 275, passTd: 1.8, passInt: 0.8, rushYds: 20,  rushTd: 0.2,  rec: 0,   recYds: 0,  recTd: 0    },
  RB:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 72,  rushTd: 0.55, rec: 3.0, recYds: 28, recTd: 0.15 },
  WR:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 2,   rushTd: 0.02, rec: 5.5, recYds: 62, recTd: 0.45 },
  TE:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 0,   rushTd: 0,    rec: 3.0, recYds: 38, recTd: 0.3  },
  K:   { fgAvg: 8.5 },
  DEF: { baseAvg: 8.0 },
}
```

---

## parseLeague.js — Sleeper to internal model

This is the most important translation layer. Sleeper's API returns data in its own shape; this module normalizes it.

```js
// src/lib/parseLeague.js

export function parseScoringSettings(sleeperScoring) {
  return {
    passYds:    sleeperScoring.pass_yd      ?? 0.04,
    passTd:     sleeperScoring.pass_td      ?? 4,
    passInt:    sleeperScoring.pass_int     ?? -2,
    rushYds:    sleeperScoring.rush_yd      ?? 0.1,
    rushTd:     sleeperScoring.rush_td      ?? 6,
    recYds:     sleeperScoring.rec_yd       ?? 0.1,
    rec:        sleeperScoring.rec          ?? 0,
    recTd:      sleeperScoring.rec_td       ?? 6,
    bonusRecTe: sleeperScoring.bonus_rec_te ?? 0,
    fumLost:    sleeperScoring.fum_lost     ?? -2,
  };
}

export function parseRosterPositions(positionsArray, totalRosters) {
  const count = (pos) => positionsArray.filter(p => p === pos).length;
  return {
    qb:        count('QB'),
    rb:        count('RB'),
    wr:        count('WR'),
    te:        count('TE'),
    flex:      count('FLEX'),
    superFlex: count('SUPER_FLEX'),
    k:         count('K'),
    dst:       count('DEF'),
    bench:     count('BN'),
    teams:     totalRosters,
  };
}

export function parseManagers(users, rosters) {
  const rosterMap = Object.fromEntries(rosters.map(r => [r.owner_id, r.roster_id]));
  return users.map(u => ({
    userId:         u.user_id,
    displayName:    u.display_name,
    teamName:       u.metadata?.team_name || u.display_name,
    avatarUrl:      u.avatar
                      ? `https://sleepercdn.com/avatars/thumbs/${u.avatar}`
                      : null,
    rosterId:       rosterMap[u.user_id] ?? null,
    isCommissioner: u.is_owner ?? false,
  }));
}
```

---

## sleeperApi.js

```js
// src/lib/sleeperApi.js
const BASE = 'https://api.sleeper.app/v1';

export async function fetchLeague(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}`);
  if (!res.ok) throw new Error(`League not found (${res.status})`);
  return res.json();
}

export async function fetchLeagueUsers(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}/users`);
  if (!res.ok) throw new Error(`Could not fetch users (${res.status})`);
  return res.json();
}

export async function fetchLeagueRosters(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}/rosters`);
  if (!res.ok) throw new Error(`Could not fetch rosters (${res.status})`);
  return res.json();
}

export async function fetchLeagueData(leagueId) {
  const [league, users, rosters] = await Promise.all([
    fetchLeague(leagueId),
    fetchLeagueUsers(leagueId),
    fetchLeagueRosters(leagueId),
  ]);
  return { league, users, rosters };
}
```

---

## URL-based scenario sharing

Encode the entire sandbox state as a base64 query param so league mates can share specific proposed rulesets via link.

```js
// src/lib/urlState.js

export function encodeScenario(scoring, roster, name) {
  const payload = JSON.stringify({ scoring, roster, name });
  return btoa(payload);
}

export function decodeScenario(encoded) {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

// Usage: https://yourapp.com/?scenario=<base64>
// On load, check for ?scenario param and pre-populate sandbox
```

---

## Landing page behavior

1. Text input for league ID with a "Load league" button
2. On submit: show loading state, call `fetchLeagueData(leagueId)` 
3. On success: navigate to sandbox, pre-populate all settings from real league data, show manager list
4. On error: show clear error message ("League not found — double-check your Sleeper league ID")
5. League ID persisted to localStorage so returning users skip this step

**How to find your Sleeper league ID:** It appears in the URL when you open your league in a browser at `sleeper.app/leagues/<league_id>`. The app should include this as helper text on the landing page.

---

## Season impact panel details

The heart of the app. Everything recalculates live as sliders/inputs change.

**Position value cards** — one card per position showing estimated weekly fantasy points based on NFL stat baselines multiplied by current scoring settings. A relative bar shows each position as a percentage of the highest-scoring position.

**Positional balance meter** — 0–100 score based on how evenly spread value is across the top 4 positions:
- 80+: Balanced (green) — multiple positions contribute meaningfully
- 60–79: Moderate (yellow) — some dominance but variety remains
- below 60: One-dimensional (red) — flags the problem your league experienced last season

**Scarcity analysis** — for each position, shows `needed / supply` ratio across the full league. Highlights when a lineup change would require more players than realistically exist at that position.

**"vs. current league" diff** — once real league data is loaded, the impact panel shows a delta (up/down) from the actual current settings, making it easy to see exactly what a proposed change moves.

---

## Compare scenarios panel

- Save any sandbox state as a named scenario (stored in localStorage)
- Each saved scenario shows: name, top position, balance score
- Select two scenarios to render a side-by-side diff table: position vs score A vs score B vs delta
- Intended pre-draft use: each manager saves their proposed change, the group reviews all proposals together, then votes before rules lock in

---

## Build order for Claude Code

Start with the logic, not the UI. The math is pure and fully testable before any components exist.

1. Scaffold Vite + React + Tailwind + Zustand
2. Implement `sleeperApi.js` — fetch and validate the three endpoints
3. Implement `parseLeague.js` — Sleeper response to internal models, with unit tests
4. Implement `scoring.js`, `diversity.js`, `scarcity.js`, `nflBaselines.js` — pure functions, unit tests
5. Build `LandingPage.jsx` — league ID input, fetch, loading/error states
6. Build `LeagueHeader.jsx` + `ManagerList.jsx` — confirm real data is wired correctly
7. Build `ImpactPanel.jsx` — highest-value view; validates all the math visually
8. Build `ScoringPanel.jsx` + `RosterPanel.jsx` — sliders/inputs wired to sandbox store
9. Build `ComparePanel.jsx` + `useScenarios` — save/compare scenarios
10. Implement `urlState.js` + share button
11. Deploy to Vercel

---

## Out of scope

- Authentication or user accounts
- Writing back to Sleeper (the API is read-only)
- Draft assistant or player-level rankings
- Trade analyzer
- Real-time in-season score tracking
- Mobile-native Flutter app (separate project)
