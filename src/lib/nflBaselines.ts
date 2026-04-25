// Representative weekly averages for a startable player/unit at each position.
// Offensive stats: average weekly values per game (2024 NFL season actuals).
// DEF bracket stats: probability of landing in that bracket (each set sums to 1.0).
// DEF counting stats: per-game averages across all 32 teams, 2024 season.

export type PositionBaseline = {
  passYds?: number; passTd?: number; passInt?: number
  rushYds?: number; rushTd?: number
  rec?: number; recYds?: number; recTd?: number
  fgAvg?: number
}

export const BASELINES: Record<string, PositionBaseline> = {
  QB:  { passYds: 275, passTd: 1.8, passInt: 0.8, rushYds: 20,  rushTd: 0.2,  rec: 0,   recYds: 0,  recTd: 0    },
  RB:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 72,  rushTd: 0.55, rec: 3.0, recYds: 28, recTd: 0.15 },
  WR:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 2,   rushTd: 0.02, rec: 5.5, recYds: 62, recTd: 0.45 },
  TE:  { passYds: 0,   passTd: 0,   passInt: 0,   rushYds: 0,   rushTd: 0,    rec: 3.0, recYds: 38, recTd: 0.3  },
  K:   { fgAvg: 8.5 },
}

// Baseline weekly averages for DEF stats, keyed by Sleeper stat name.
// Used in two places:
//   1. scoring.ts — for baseline-only position value calculations
//   2. projections.ts — to fill in stats the Sleeper projection feed omits
//
// Counting stats: per-game averages, 2024 NFL season.
// Bracket stats:  probability weights (each bracket set sums to 1.0).
export const DEF_STAT_BASELINES: Record<string, number> = {
  // Core counting stats (typically present in projections)
  sack:            2.3,
  int:             0.65,
  fum_rec:         0.50,
  ff:              0.80,
  def_td:          0.10,
  safe:            0.025,
  blk_kick:        0.03,
  // Stats frequently absent from Sleeper projections
  st_td:           0.06,
  def_st_td:       0.06,
  fum_rec_td:      0.05,
  qb_hit:          5.5,
  tkl:             48,
  tkl_solo:        30,
  tkl_ast:         18,
  tkl_loss:        4.5,
  def_pass_def:    8.0,
  def_kr_yd:       65,
  fum_ret_yd:      5,
  int_ret_yd:      15,
  blk_kick_ret_yd: 0.5,
  def_3_and_out:   5.5,
  def_4_and_stop:  1.0,
  def_forced_punts: 4.5,
  def_st_ff:       0.30,
  def_st_fum_rec:  0.15,
  def_st_tkl_solo: 5.0,
  pts_allow:       1,     // flat base: 1 occurrence per game played
  // Points-allowed bracket probabilities (sum = 1.0)
  pts_allow_0:     0.040,
  pts_allow_1_6:   0.055,
  pts_allow_7_13:  0.160,
  pts_allow_14_20: 0.235,
  pts_allow_21_27: 0.245,
  pts_allow_28_34: 0.155,
  pts_allow_35p:   0.110,
  // Yards-allowed bracket probabilities (sum = 1.0)
  yds_allow_0_100:   0.002,
  yds_allow_100_199: 0.015,
  yds_allow_200_299: 0.090,
  yds_allow_300_349: 0.160,
  yds_allow_350_399: 0.210,
  yds_allow_400_449: 0.220,
  yds_allow_450_499: 0.160,
  yds_allow_500_549: 0.090,
  yds_allow_550p:    0.053,
}
