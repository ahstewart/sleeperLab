import type { RosterSettings } from './types'

// Returns a 0–1 score based on how evenly spread value is across positions,
// weighted by the number of starting slots each position occupies.
// 1.0 = perfectly balanced across all slot-weighted positions.
// Thresholds: >0.75 = Balanced, 0.60–0.75 = Somewhat balanced, <0.60 = One-dimensional
export function calcDiversityScore(
  scores: Record<string, number>,
  roster?: RosterSettings,
): number {
  // Effective starter slots per position (flex/superFlex distributed evenly among eligible)
  function effectiveSlots(pos: string): number {
    if (!roster) return 1
    const flexShare = roster.flex / 3          // RB/WR/TE each get 1/3 of flex slots
    const sfShare   = roster.superFlex / 4     // QB/RB/WR/TE each get 1/4 of superFlex slots
    switch (pos) {
      case 'QB':  return roster.qb  + sfShare
      case 'RB':  return roster.rb  + flexShare + sfShare
      case 'WR':  return roster.wr  + flexShare + sfShare
      case 'TE':  return roster.te  + flexShare + sfShare
      case 'K':   return roster.k
      case 'DEF': return roster.dst
      default:    return 1
    }
  }

  // Build weighted contributions: score × slots for each position with > 0 slots
  const weighted = Object.entries(scores)
    .map(([pos, score]) => ({ pos, value: score * effectiveSlots(pos) }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)

  if (weighted.length === 0) return 0

  const top = weighted[0].value
  // Average ratio for the top 4 weighted contributions
  return weighted.slice(0, 4).reduce((sum, e) => sum + e.value / top, 0) / 4
}
