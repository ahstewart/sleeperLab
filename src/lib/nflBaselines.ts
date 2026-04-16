// Representative weekly averages for a startable player (not top scorer, not bench depth).
// Update once per offseason.
export const BASELINES: Record<string, {
  passYds: number; passTd: number; passInt: number
  rushYds: number; rushTd: number
  rec: number; recYds: number; recTd: number
  fgAvg?: number; baseAvg?: number
}> = {
  QB:  { passYds: 275, passTd: 1.8, passInt: 0.8, rushYds: 20,  rushTd: 0.2,  rec: 0,   recYds: 0,  recTd: 0    },
  RB:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 72,  rushTd: 0.55, rec: 3.0, recYds: 28, recTd: 0.15 },
  WR:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 2,   rushTd: 0.02, rec: 5.5, recYds: 62, recTd: 0.45 },
  TE:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 0,   rushTd: 0,    rec: 3.0, recYds: 38, recTd: 0.3  },
  K:   { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 0,   rushTd: 0,    rec: 0,   recYds: 0,  recTd: 0, fgAvg: 8.5   },
  DEF: { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 0,   rushTd: 0,    rec: 0,   recYds: 0,  recTd: 0, baseAvg: 8.0 },
}
