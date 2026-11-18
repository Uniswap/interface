import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'

/**
 * One sequence (1, 2, …) over every active position, oldest open first, so each table row's ID is unique
 * and a chart avatar's "#n" badge names the same row. An unparseable openedAt sorts last; positionId breaks
 * ties so the numbers hold across polls.
 */
export function marginPositionDisplayIds(positions: readonly MarginActivePosition[]): Map<string, number> {
  const openedAt = (position: MarginActivePosition): number => Number(position.openedAt) || Number.POSITIVE_INFINITY
  const sorted = [...positions].sort((a, b) => openedAt(a) - openedAt(b) || a.positionId.localeCompare(b.positionId))
  return new Map(sorted.map((position, index) => [position.positionId, index + 1]))
}
